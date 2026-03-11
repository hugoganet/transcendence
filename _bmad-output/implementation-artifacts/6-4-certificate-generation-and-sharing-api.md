# Story 6.4: Certificate Generation & Sharing API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to receive a shareable certificate upon completing the full curriculum,
So that I can prove my blockchain knowledge to others.

## Acceptance Criteria

1. **Given** a user who has completed all 69 missions (mission 6.3.4 "Graduation"),
   **When** the graduation mission is completed,
   **Then** a certificate is automatically generated with: user `displayName`, completion date, curriculum title ("Blockchain Fundamentals"),
   **And** the certificate is stored in the database,
   **And** the `completeMission` response includes `certificateGenerated: true`.

2. **Given** a user with a certificate,
   **When** they call `GET /api/v1/users/me/certificate`,
   **Then** the certificate data is returned: `id`, `displayName`, `completionDate`, `curriculumTitle`, `shareToken`, `totalMissions`, `totalCategories`.

3. **Given** a user with a certificate,
   **When** they call `GET /api/v1/users/me/certificate/share`,
   **Then** a shareable URL is returned containing a unique share token,
   **And** the URL is suitable for LinkedIn/Twitter sharing (e.g., `{BASE_URL}/certificates/{shareToken}`).

4. **Given** a valid share token,
   **When** anyone (authenticated or not) calls `GET /api/v1/certificates/:shareToken`,
   **Then** the certificate data is returned publicly: `displayName`, `completionDate`, `curriculumTitle`, `totalMissions`, `totalCategories`,
   **And** private data (email, tokens, userId) is NOT included.

5. **Given** a user without curriculum completion,
   **When** they call `GET /api/v1/users/me/certificate`,
   **Then** a 404 is returned with code `CERTIFICATE_NOT_AVAILABLE`.

6. **Given** an invalid or non-existent share token,
   **When** `GET /api/v1/certificates/:shareToken` is called,
   **Then** a 404 is returned with code `CERTIFICATE_NOT_FOUND`.

7. **Given** a user who already has a certificate,
   **When** the certificate generation is triggered again (idempotent),
   **Then** the existing certificate is returned (no duplicate created).

8. **Given** an unauthenticated request,
   **When** `GET /api/v1/users/me/certificate` or `GET /api/v1/users/me/certificate/share` is called,
   **Then** a 401 is returned (requireAuth middleware).

## Tasks / Subtasks

- [x] Task 1: Add `Certificate` model to Prisma schema (AC: #1, #7)
  - [x]1.1 Add `Certificate` model to `apps/api/prisma/schema.prisma`:
    - Fields: `id` (UUID, default auto), `userId` (String, unique — one cert per user), `displayName` (String?), `completionDate` (DateTime), `curriculumTitle` (String, default "Blockchain Fundamentals"), `shareToken` (String, unique), `totalMissions` (Int), `totalCategories` (Int), `createdAt` (DateTime, default now)
    - Relation: `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
    - Add `certificate Certificate?` relation field to `User` model
  - [x]1.2 Run `npx prisma migrate dev --name add-certificate-model`
  - [x]1.3 Verify generated Prisma Client types include Certificate

- [x] Task 2: Add shared types and Zod schemas for certificate (AC: #2, #3, #4)
  - [x]2.1 Create `packages/shared/src/schemas/certificate.ts`:
    - `certificateSchema`: id (string), displayName (string | null), completionDate (string datetime), curriculumTitle (string), shareToken (string), totalMissions (number int), totalCategories (number int)
    - `publicCertificateSchema`: same fields minus `id` (for public share view — no internal IDs exposed)
    - `shareTokenParamSchema`: `z.object({ shareToken: z.string().min(1) })`
    - `certificateShareResponseSchema`: `z.object({ shareUrl: z.string().url() })`
  - [x]2.2 Create `packages/shared/src/types/certificate.ts`:
    - Export `Certificate`, `PublicCertificate`, `CertificateShareResponse` types inferred from schemas
  - [x]2.3 Export all new schemas and types from `packages/shared/src/index.ts`

- [x] Task 3: Create certificate service (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x]3.1 Create `apps/api/src/services/certificateService.ts`:
    - Import `prisma` from `../config/database.js`
    - Import `getContent` from `../utils/contentLoader.js`
    - Import `AppError` from `../utils/AppError.js`
    - Import types from `@transcendence/shared`
    - Define `type DbClient = Pick<typeof prisma, "certificate" | "userProgress">`
  - [x]3.2 Implement `generateCertificateWithClient(client: DbClient, userId: string, displayName: string | null): Promise<Certificate>`:
    - Check if certificate already exists for user (idempotent — return existing if found)
    - Count completed missions via `client.userProgress.count({ where: { userId, status: "COMPLETED" } })`
    - Get total missions from `getContent().curriculum`
    - If completed !== total → throw `AppError(500, "CERTIFICATE_GENERATION_FAILED", ...)`
    - Generate a cryptographically secure share token: `crypto.randomUUID()` (short enough, unique via DB constraint)
    - Count total categories from `getContent().curriculum.length`
    - Create certificate record: `client.certificate.create({ data: { userId, displayName, completionDate: new Date(), curriculumTitle: "Blockchain Fundamentals", shareToken, totalMissions: completed, totalCategories } })`
    - Return the created certificate
  - [x]3.3 Implement `getCertificate(userId: string): Promise<Certificate>`:
    - Query `prisma.certificate.findUnique({ where: { userId } })`
    - If not found → throw `AppError(404, "CERTIFICATE_NOT_AVAILABLE", "Complete all missions to earn your certificate")`
    - Return certificate
  - [x]3.4 Implement `getCertificateByShareToken(shareToken: string): Promise<PublicCertificate>`:
    - Query `prisma.certificate.findUnique({ where: { shareToken } })`
    - If not found → throw `AppError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found")`
    - Return public certificate data (exclude `id`)
  - [x]3.5 Implement `getShareableUrl(userId: string): Promise<{ shareUrl: string }>`:
    - Call `getCertificate(userId)` to get the certificate (throws 404 if none)
    - Construct URL: `${process.env.BASE_URL || "https://localhost"}/certificates/${certificate.shareToken}`
    - Return `{ shareUrl }`

- [x] Task 4: Hook certificate generation into `completeMission()` (AC: #1)
  - [x]4.1 In `apps/api/src/services/curriculumService.ts`:
    - Import `generateCertificateWithClient` from `./certificateService.js`
    - After the existing WithClient calls in the transaction (after revealService), add:
      ```typescript
      // Certificate generation — triggered when graduation mission (6.3.4) is completed
      let certificateGenerated = false;
      if (missionId === "6.3.4") {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { displayName: true } });
        await generateCertificateWithClient(tx, userId, user?.displayName ?? null);
        certificateGenerated = true;
      }
      ```
    - Add `certificateGenerated` to the return value of `completeMission()`
  - [x]4.2 Update `CompleteMissionResponse` type in `packages/shared/src/types/curriculum.ts`:
    - Add `certificateGenerated?: boolean` field
  - [x]4.3 Update `completeMissionResponseSchema` in `packages/shared/src/schemas/curriculum.ts`:
    - Add `certificateGenerated: z.boolean().optional()`

- [x] Task 5: Add route handlers (AC: #2, #3, #4, #5, #6, #8)
  - [x]5.1 In `apps/api/src/routes/users.ts`:
    - Import `getCertificate`, `getShareableUrl` from `../services/certificateService.js`
    - Add route: `usersRouter.get("/me/certificate", requireAuth, async handler)` → calls `getCertificate(userId)`, returns `{ data: certificate }`
    - Add route: `usersRouter.get("/me/certificate/share", requireAuth, async handler)` → calls `getShareableUrl(userId)`, returns `{ data: { shareUrl } }`
    - **Placement:** Add AFTER `POST /me/avatar` and BEFORE `GET /:userId/profile` to avoid Express param conflicts
  - [x]5.2 Create `apps/api/src/routes/certificates.ts`:
    - Import `getCertificateByShareToken` from `../services/certificateService.js`
    - Import `validate` from `../middleware/validate.js`
    - Import `shareTokenParamSchema` from `@transcendence/shared`
    - Route: `certificatesRouter.get("/:shareToken", validate({ params: shareTokenParamSchema }), async handler)` → calls `getCertificateByShareToken(shareToken)`, returns `{ data: publicCertificate }`
    - **No auth required** — this is a public endpoint for shared certificates
  - [x]5.3 In `apps/api/src/app.ts`:
    - Import and mount the new certificates router: `app.use("/api/v1/certificates", certificatesRouter)`

- [x] Task 6: Add `BASE_URL` to environment configuration (AC: #3)
  - [x]6.1 `BASE_URL` accessed via `process.env.BASE_URL` with `"https://localhost"` fallback in `certificateService.ts` (no `env.ts` file exists in this project — env vars are used directly with defaults)
  - [x]6.2 Add `BASE_URL=https://localhost` to `.env.example` with comment

- [x] Task 7: Add unit tests for certificateService (AC: #1-#8)
  - [x]7.1 Create `apps/api/src/services/certificateService.test.ts`:
    - Mock `prisma` (certificate.findUnique, certificate.create, userProgress.count)
    - Mock `getContent` to return curriculum structure
    - Test: `generateCertificateWithClient` creates certificate with correct fields
    - Test: `generateCertificateWithClient` is idempotent (returns existing cert if already exists)
    - Test: `generateCertificateWithClient` throws if user hasn't completed all missions
    - Test: `generateCertificateWithClient` includes correct displayName, totalMissions, totalCategories
    - Test: `getCertificate` returns certificate for valid user
    - Test: `getCertificate` throws `CERTIFICATE_NOT_AVAILABLE` for user without cert
    - Test: `getCertificateByShareToken` returns public cert (no internal `id`)
    - Test: `getCertificateByShareToken` throws `CERTIFICATE_NOT_FOUND` for invalid token
    - Test: `getShareableUrl` returns correct URL format with shareToken
    - Test: `getShareableUrl` throws `CERTIFICATE_NOT_AVAILABLE` if no cert exists
    - Test: shareToken is a valid UUID format

- [x] Task 8: Add integration tests (AC: #1-#8)
  - [x]8.1 Create `apps/api/src/__tests__/integration/certificate.test.ts`:
    - Use existing helpers: `setupApp`, `teardownApp`, `resetDatabase`, `createAndLoginUser`
    - Test: `GET /api/v1/users/me/certificate` returns 404 `CERTIFICATE_NOT_AVAILABLE` when no missions completed
    - Test: `GET /api/v1/users/me/certificate` returns 401 for unauthenticated request
    - Test: After completing all 69 missions, `GET /api/v1/users/me/certificate` returns certificate with correct shape
    - Test: `GET /api/v1/users/me/certificate/share` returns shareable URL with share token
    - Test: `GET /api/v1/certificates/:shareToken` returns public certificate without internal IDs
    - Test: `GET /api/v1/certificates/:shareToken` returns 404 for invalid token
    - Test: Certificate generation is idempotent (complete mission 6.3.4 triggers once, subsequent GETs return same cert)
    - Test: Public certificate endpoint does NOT require auth
    - Test: `completeMission` response includes `certificateGenerated: true` for mission 6.3.4
  - [x]8.2 **Performance consideration:** Completing all 69 missions in integration test is expensive. Use a targeted approach:
    - Seed user progress directly in DB for 68 missions as COMPLETED
    - Only call `POST /api/v1/curriculum/missions/6.3.4/complete` via API to trigger certificate generation
    - This tests the hook + service without running 69 HTTP requests

- [x] Task 9: Update mocks and test fixtures (AC: #1)
  - [x]9.1 Update `apps/api/src/__fixtures__/completeMissionMocks.ts`:
    - Add mock for `certificateService.js` → `generateCertificateWithClient: vi.fn().mockResolvedValue({ id: "mock-cert-id", ... })`
    - Update the copy-paste block documentation with the new mock
  - [x]9.2 Add `vi.mock("../services/certificateService.js")` to `curriculumService.test.ts`
  - [x]9.3 Add `vi.mock("../../services/certificateService.js")` to `apps/api/src/__tests__/integration/curriculum.test.ts` (if it tests completeMission)

- [x] Task 10: Verify and cleanup (AC: all)
  - [x]10.1 Run `pnpm test` in apps/api — all existing + new unit tests pass
  - [x]10.2 Run `pnpm test:integration` in apps/api — all existing + new integration tests pass
  - [x]10.3 Verify no regressions in curriculum, user, or gamification tests
  - [x]10.4 Run `pnpm build` in packages/shared — verify no TypeScript errors from new exports
  - [x]10.5 Verify Prisma migration applies cleanly

## Dev Notes

### Critical Architecture Patterns

- **Thin route handler pattern:** Route validates input (Zod), calls service, returns `res.json({ data: result })`. NO business logic in routes.
- **API response format:** `{ data: T }` for success, `{ error: { code, message, details? } }` for errors. Error codes are UPPER_SNAKE_CASE.
- **Service layer owns all DB access:** Routes never import `prisma` directly.
- **WithClient pattern:** Certificate generation must use `WithClient` suffix when called inside `completeMission()`'s transaction, receiving the transaction client for atomicity.
- **Batch transactions for read consistency:** Use `prisma.$transaction([query1, query2, ...])` when multiple reads must be snapshot-consistent. See `streakService.getStreak()` for the pattern.

### Certificate Design Decisions

**Why JSON data + public URL (not image generation):**
- No heavy dependencies (no Puppeteer, Canvas, Sharp) — keeps Docker images lean
- The certificate data is returned as JSON; the frontend (Story 6.5) will render it as a styled component
- The share URL points to a public-accessible page that the frontend renders
- LinkedIn/Twitter share cards work via OpenGraph meta tags on the public certificate page (frontend concern in Story 6.5)
- If image generation is needed later, it can be added without changing the API contract

**Share token approach:**
- `crypto.randomUUID()` generates a unique, unguessable token
- Token stored in `Certificate.shareToken` with unique DB constraint
- Public endpoint `GET /api/v1/certificates/:shareToken` serves the certificate — no auth required
- No expiration for share tokens (certificates are permanent achievements)

**Idempotency:**
- The `Certificate` model has a `userId` unique constraint — only one certificate per user
- `generateCertificateWithClient` checks for existing cert first and returns it if found
- This prevents duplicates if `completeMission` is called multiple times for mission 6.3.4

### Hook into completeMission() Transaction

The `completeMission()` function in `curriculumService.ts` (lines 372-514) runs a `prisma.$transaction()` with multiple WithClient service calls. Certificate generation should be added as the **last** step in the transaction, after reveal checks:

```typescript
// Existing steps inside transaction:
// 1. Mark mission complete
// 2. Chapter/category completion
// 3. Self-assessment (if applicable)
// 4. Credit tokens
// 5. Update streak
// 6. Check achievements
// 7. Trigger reveals
// 8. NEW: Generate certificate (if mission 6.3.4)
```

**Graduation mission detection:** Check `missionId === "6.3.4"` — this is the last mission of the last category (Category 6, Chapter 3, Mission 4). Do NOT hardcode the total mission count check inside the transaction; the fact that mission 6.3.4 can only be completed when all prior missions are done (sequential unlock) is sufficient.

### Prisma Schema Addition

```prisma
model Certificate {
  id              String   @id @default(uuid())
  userId          String   @unique
  displayName     String?
  completionDate  DateTime
  curriculumTitle String   @default("Blockchain Fundamentals")
  shareToken      String   @unique
  totalMissions   Int
  totalCategories Int
  createdAt       DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

### Route Ordering in users.ts

Current route order in `users.ts`:
1. `GET /me` (line ~44)
2. `PATCH /me` (line ~54)
3. `GET /me/reveals` (line ~68)
4. `POST /me/avatar` (line ~78)
5. **NEW: `GET /me/certificate`** — add here
6. **NEW: `GET /me/certificate/share`** — add here
7. `GET /:userId/profile` (line ~88) — MUST stay last

The new certificate routes use `/me/certificate` prefix, so they must go BEFORE `/:userId/profile` to prevent Express matching `me` as a `:userId` parameter.

### Separate Router for Public Certificates

Create `apps/api/src/routes/certificates.ts` for the public share endpoint:
- `GET /api/v1/certificates/:shareToken` — **no auth required**
- Mount in `app.ts` alongside other routers
- This endpoint returns public-safe certificate data only (no internal IDs or user details beyond displayName)

### Integration Test Strategy — Efficient Completion Seeding

Completing all 69 missions via HTTP requests in an integration test is slow and fragile. Instead:

```typescript
// Seed 68 missions as completed directly in DB
const allMissions = getAllMissionIds(); // from content structure
const firstN = allMissions.slice(0, -1); // all except 6.3.4

for (const missionId of firstN) {
  await prisma.userProgress.create({
    data: { userId, missionId, status: "COMPLETED", completedAt: new Date() },
  });
}

// Also seed chapter/category progress as needed
// Then call the API for the final mission to trigger certificate
const res = await agent
  .post("/api/v1/curriculum/missions/6.3.4/complete")
  .send({})
  .expect(200);

expect(res.body.data.certificateGenerated).toBe(true);
```

**Important:** The `completeMission` handler checks that the mission is accessible (not locked). You may need to seed `ChapterProgress` entries too, or seed a simpler subset. Alternatively, mock at the service level and test certificate generation separately.

### Existing Code Inventory

| File | Relevance |
|------|-----------|
| `apps/api/src/services/curriculumService.ts:372-514` | Modify: add certificate generation hook in completeMission transaction |
| `apps/api/src/routes/users.ts` | Modify: add GET /me/certificate and GET /me/certificate/share routes |
| `apps/api/src/app.ts` | Modify: mount new certificates router |
| `apps/api/prisma/schema.prisma` | Modify: add Certificate model, add relation to User |
| `packages/shared/src/index.ts` | Modify: export new certificate schemas and types |
| `packages/shared/src/types/curriculum.ts` | Modify: add certificateGenerated to CompleteMissionResponse |
| `packages/shared/src/schemas/curriculum.ts` | Modify: add certificateGenerated to completeMissionResponseSchema |
| `apps/api/src/__fixtures__/completeMissionMocks.ts` | Modify: add certificateService mock |
| `apps/api/src/services/curriculumService.test.ts` | Modify: add vi.mock for certificateService |
| `apps/api/src/config/env.ts` | Modify: add BASE_URL env var |
| `.env.example` | Modify: add BASE_URL |
| `apps/api/src/services/tokenService.ts` | Reference: WithClient pattern example |
| `apps/api/src/services/streakService.ts:90-127` | Reference: $transaction batch read pattern |
| `apps/api/src/services/achievementService.ts:94-115` | Reference: WithClient pattern + achievement query |
| `apps/api/src/services/revealService.ts` | Reference: WithClient pattern (last current hook in completeMission) |
| `apps/api/src/services/publicProfileService.ts` | Reference: Prisma select for public data (exclude private) |
| `apps/api/src/utils/AppError.ts` | Use: error throwing pattern |
| `apps/api/src/utils/contentLoader.ts` | Use: getContent() for mission/category counts |
| `apps/api/src/middleware/validate.ts` | Use: validate({ params: schema }) |
| `apps/api/src/middleware/auth.ts` | Use: requireAuth middleware |
| `docs/project-context.md` | Reference: WithClient pattern documentation, test organization |

### Previous Story Intelligence

From Story 6.3 (Public Profiles API):
- Added `GET /api/v1/users/:userId/profile` as last route in users.ts — new cert routes go BEFORE it
- Used `prisma.$transaction([...])` for snapshot consistency
- Completion percentage calculated from `getContent().curriculum` — reuse same pattern for totalMissions
- Test counts at end of 6.3: 464+ unit tests, 8+ integration tests for this story
- Private field exclusion done at Prisma `select` level — apply same to public cert endpoint

From Story 6.2 (Online Presence via Socket.IO):
- Socket.IO session auth reads `session.passport.user` — not relevant for certificate
- Test helpers: `createAndLoginUser()`, `resetDatabase()`, `setupApp()`, `teardownApp()`

From Story 5.6 (Progressive Mechanic Reveal API):
- `triggerRevealWithClient(tx, userId, mechanic)` — most recent WithClient hook in completeMission
- Certificate generation goes AFTER this in the transaction sequence

### Edge Cases

1. **User completes 6.3.4 but curriculum has been modified (e.g., 70 missions now):** The certificate should capture the state at generation time — store `totalMissions` and `totalCategories` in the certificate record.
2. **User deletes account:** Certificate is cascade-deleted (Prisma `onDelete: Cascade`).
3. **displayName is null:** Certificate stores `null` — the frontend (Story 6.5) handles fallback display.
4. **Race condition — two concurrent completeMission calls for 6.3.4:** The unique constraint on `Certificate.userId` prevents duplicates; `generateCertificateWithClient` checks for existing cert first.
5. **Share token collision:** Extremely unlikely with UUID v4, but the unique constraint on `shareToken` ensures DB integrity.

### Testing Strategy

- **Unit tests (certificateService.test.ts):** Mock Prisma + contentLoader. Test certificate generation, retrieval, share URL generation, idempotency, error cases.
- **Integration tests (certificate.test.ts):** Real DB + real API. Verify full request/response cycle, auth enforcement, public share endpoint, and the completeMission → certificate generation hook.

### Project Structure Notes

**New files:**
```
packages/shared/src/schemas/certificate.ts     # Zod schemas
packages/shared/src/types/certificate.ts       # TypeScript types
apps/api/src/services/certificateService.ts    # Service functions
apps/api/src/services/certificateService.test.ts  # Unit tests
apps/api/src/routes/certificates.ts            # Public share route
apps/api/src/__tests__/integration/certificate.test.ts  # Integration tests
apps/api/prisma/migrations/XXXX_add_certificate_model/  # Auto-generated
```

**Modified files:**
```
apps/api/prisma/schema.prisma                  # Add Certificate model + User relation
packages/shared/src/index.ts                   # Export new schemas/types
packages/shared/src/types/curriculum.ts        # Add certificateGenerated to response type
packages/shared/src/schemas/curriculum.ts      # Add certificateGenerated to response schema
apps/api/src/services/curriculumService.ts     # Hook generateCertificateWithClient into completeMission
apps/api/src/routes/users.ts                   # Add /me/certificate and /me/certificate/share routes
apps/api/src/app.ts                            # Mount certificates router
apps/api/src/config/env.ts                     # Add BASE_URL
.env.example                                   # Add BASE_URL
apps/api/src/__fixtures__/completeMissionMocks.ts  # Add certificateService mock
apps/api/src/services/curriculumService.test.ts    # Add vi.mock for certificateService
```

### References

- [Source: apps/api/src/services/curriculumService.ts:372-514 — completeMission() transaction hook point]
- [Source: apps/api/src/services/tokenService.ts — WithClient pattern example]
- [Source: apps/api/src/services/revealService.ts — Last WithClient hook in completeMission]
- [Source: apps/api/src/routes/users.ts — Route ordering, /me/* routes before /:userId]
- [Source: apps/api/src/services/publicProfileService.ts — Public data select pattern]
- [Source: apps/api/src/utils/AppError.ts — Error codes: CERTIFICATE_NOT_AVAILABLE, CERTIFICATE_NOT_FOUND]
- [Source: apps/api/src/utils/contentLoader.ts — getContent() for curriculum structure]
- [Source: apps/api/prisma/schema.prisma — User model, unique constraints, cascade delete]
- [Source: docs/project-context.md — WithClient pattern, completeMission mock fixtures, test organization]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6 Story 6.4 requirements (FR15, FR34)]
- [Source: _bmad-output/planning-artifacts/architecture.md — API patterns, response format, naming conventions]
- [Source: _bmad-output/implementation-artifacts/6-3-public-profiles-api.md — Previous story context, route ordering]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Unit test `getShareableUrl` initially failed because `process.env.BASE_URL` was set to empty string in test env, making the `||` fallback not trigger. Fixed by deleting the env var in the test before asserting.

### Completion Notes List

- Task 1: Added `Certificate` model to Prisma schema with all specified fields, unique constraints on `userId` and `shareToken`, cascade delete relation to `User`. Migration `20260311144907_add_certificate_model` applied successfully.
- Task 2: Created Zod schemas (`certificateSchema`, `publicCertificateSchema`, `shareTokenParamSchema`, `certificateShareResponseSchema`) and TypeScript types (`Certificate`, `PublicCertificate`, `CertificateShareResponse`). All exported from `packages/shared/src/index.ts`.
- Task 3: Created `certificateService.ts` with 4 functions: `generateCertificateWithClient` (idempotent, WithClient pattern), `getCertificate`, `getCertificateByShareToken` (public, no `id` field), `getShareableUrl`. Uses `crypto.randomUUID()` for share tokens.
- Task 4: Hooked `generateCertificateWithClient` into `completeMission()` transaction as step j (after reveals). Added `certificateGenerated?: boolean` to `CompleteMissionResponse` interface. Only triggers for mission `6.3.4`.
- Task 5: Added `GET /me/certificate` and `GET /me/certificate/share` routes to `users.ts` (before `/:userId/profile`). Created `certificates.ts` router with public `GET /:shareToken` endpoint (no auth). Mounted at `/api/v1/certificates` in `app.ts`.
- Task 6: Added `BASE_URL` to `.env.example`. No `env.ts` file exists in this project — env vars are accessed via `process.env` directly with defaults in service code.
- Task 7: Created 11 unit tests covering all service functions: generation, idempotency, error cases, public cert exclusion, share URL format, UUID validation.
- Task 8: Created 9 integration tests with efficient DB seeding (68 missions + chapter progress seeded directly, only final mission via API). Tests cover certificate generation hook, auth enforcement, public endpoint, idempotency.
- Task 9: Updated `completeMissionMocks.ts` with certificateService mock documentation and defaults. Added `vi.mock` for certificateService in `curriculumService.test.ts`, `curriculum.test.ts`, and `users.test.ts`. Added `user.findUnique` to mockPrisma objects. Updated `resetDatabase` to truncate `Certificate` table.
- Task 10: All 475 unit tests pass, all 117 integration tests pass, `packages/shared` builds with no TS errors, Prisma migration applied cleanly, no regressions.

### Change Log

- 2026-03-11: Implemented Certificate Generation & Sharing API (Story 6.4) — all 10 tasks complete, 20 new tests (11 unit + 9 integration)
- 2026-03-11: Code review — fixed 5 issues (1 HIGH, 4 MEDIUM): corrected Task 6.1 description, added 7 unit tests (4 for certificate routes in users.test.ts, 3 for certificates.test.ts), fixed env var cleanup leak in certificateService.test.ts, added sprint-status.yaml to File List. Status → done.

### File List

**New files:**
- `packages/shared/src/schemas/certificate.ts`
- `packages/shared/src/types/certificate.ts`
- `apps/api/src/services/certificateService.ts`
- `apps/api/src/services/certificateService.test.ts`
- `apps/api/src/routes/certificates.ts`
- `apps/api/src/__tests__/integration/certificate.test.ts`
- `apps/api/src/routes/certificates.test.ts`
- `apps/api/prisma/migrations/20260311144907_add_certificate_model/migration.sql`

**Modified files:**
- `apps/api/prisma/schema.prisma` — Added Certificate model + User relation
- `packages/shared/src/index.ts` — Export certificate schemas and types
- `packages/shared/src/types/progress.ts` — Added `certificateGenerated?: boolean` to CompleteMissionResponse
- `apps/api/src/services/curriculumService.ts` — Hooked generateCertificateWithClient into completeMission transaction
- `apps/api/src/routes/users.ts` — Added GET /me/certificate and GET /me/certificate/share routes
- `apps/api/src/app.ts` — Mounted certificates router
- `.env.example` — Added BASE_URL
- `apps/api/src/__fixtures__/completeMissionMocks.ts` — Added certificateService mock documentation and defaults
- `apps/api/src/services/curriculumService.test.ts` — Added vi.mock for certificateService, user.findUnique to mockPrisma
- `apps/api/src/routes/curriculum.test.ts` — Added vi.mock for certificateService, user.findUnique to mockPrisma
- `apps/api/src/routes/users.test.ts` — Added vi.mock for certificateService + unit tests for /me/certificate and /me/certificate/share
- `apps/api/src/__tests__/integration/helpers/db.ts` — Added Certificate to TRUNCATE in resetDatabase
- `apps/api/src/services/certificateService.test.ts` — Fixed env var cleanup leak in getShareableUrl test
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Sprint status synced
