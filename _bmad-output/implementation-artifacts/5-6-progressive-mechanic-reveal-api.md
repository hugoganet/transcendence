# Story 5.6: Progressive Mechanic Reveal API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want gamification mechanics to appear only when I've learned about them in the curriculum,
So that the platform teaches me through its own interface.

## Acceptance Criteria

1. **Given** an authenticated user,
   **When** they call `GET /api/v1/users/me/reveals`,
   **Then** the response includes: `tokensRevealed`, `walletRevealed`, `gasRevealed`, `dashboardRevealed` (all booleans),
   **And** the response follows `{ data: T }` format.

2. **Given** a user completing reveal trigger mission `2.2.4` ("yourKnowledgeTokens"),
   **When** the mission completion is processed,
   **Then** `tokensRevealed` is set to `true` on the user record,
   **And** the mission completion response includes the triggered reveal in `progressiveReveal` field,
   **And** the response signals the frontend to trigger a MechanicReveal moment.

3. **Given** a user completing reveal trigger mission `3.1.4` ("setUpYourFirstWallet"),
   **When** the mission completion is processed,
   **Then** `walletRevealed` is set to `true` on the user record.

4. **Given** a user completing reveal trigger mission `3.3.3` ("gasInAction"),
   **When** the mission completion is processed,
   **Then** `gasRevealed` is set to `true` on the user record.

5. **Given** a user completing reveal trigger mission `6.3.4` ("graduation"),
   **When** the mission completion is processed,
   **Then** `dashboardRevealed` is set to `true` on the user record.

6. **Given** a user who already has a reveal flag set to `true`,
   **When** the same trigger mission is completed again (idempotent),
   **Then** no error occurs and the flag remains `true`.

7. **Given** a new user with no completed reveal missions,
   **When** they call `GET /api/v1/users/me/reveals`,
   **Then** all four flags are `false`.

8. **Given** the reveal system,
   **When** DB fields are needed,
   **Then** the User table is extended with four boolean reveal flag columns (all default `false`).

9. **Given** the reveals endpoint,
   **When** called without authentication,
   **Then** a 401 error is returned with code `UNAUTHORIZED`.

## Tasks / Subtasks

- [x] Task 1: Add reveal flag columns to User model via Prisma migration (AC: #7, #8)
  - [x] 1.1 Add to `apps/api/prisma/schema.prisma` User model:
    - `revealTokens Boolean @default(false)`
    - `revealWallet Boolean @default(false)`
    - `revealGas Boolean @default(false)`
    - `revealDashboard Boolean @default(false)`
  - [x] 1.2 Run `npx prisma migrate dev --name add-reveal-flags` to generate and apply migration
  - [x] 1.3 Verify Prisma Client types are regenerated with new fields
  - [x] 1.4 Verify existing tests still pass after migration (`pnpm test` from repo root)

- [x] Task 2: Create reveal Zod schemas and types in packages/shared (AC: #1)
  - [x] 2.1 Add to `packages/shared/src/schemas/gamification.ts`:
    - `revealStatusSchema`: `z.object({ tokensRevealed: z.boolean(), walletRevealed: z.boolean(), gasRevealed: z.boolean(), dashboardRevealed: z.boolean() })`
  - [x] 2.2 Add to `packages/shared/src/types/gamification.ts`:
    - `RevealStatus` type inferred from `revealStatusSchema`
  - [x] 2.3 Export new schema and type from `packages/shared/src/index.ts`
  - [x] 2.4 Add tests for `revealStatusSchema` in `packages/shared/src/schemas/gamification.test.ts`

- [x] Task 3: Create revealService.ts with business logic (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 3.1 Create `apps/api/src/services/revealService.ts`
  - [x] 3.2 Implement mapping constant `MECHANIC_TO_FIELD`:
    ```typescript
    const MECHANIC_TO_FIELD: Record<string, keyof Pick<User, "revealTokens" | "revealWallet" | "revealGas" | "revealDashboard">> = {
      tokensRevealed: "revealTokens",
      walletRevealed: "revealWallet",
      gasRevealed: "revealGas",
      dashboardRevealed: "revealDashboard",
    };
    ```
  - [x] 3.3 Implement `triggerRevealWithClient(client: DbClient, userId: string, mechanic: string): Promise<boolean>`:
    - Map mechanic string to User field using `MECHANIC_TO_FIELD`
    - Set the corresponding boolean to `true` via `client.user.update()`
    - Return `true` if the flag was newly set (was `false` before), `false` if already `true`
    - If mechanic string is not recognized, log a warning and return `false` (defensive)
  - [x] 3.4 Implement standalone `triggerReveal(userId: string, mechanic: string): Promise<boolean>` wrapper
  - [x] 3.5 Implement `getReveals(userId: string): Promise<RevealStatus>`:
    - Query User for the 4 boolean fields
    - Map DB field names to API field names (`revealTokens` → `tokensRevealed`, etc.)
    - Return typed `RevealStatus` object
  - [x] 3.6 Add unit tests: `apps/api/src/services/revealService.test.ts`:
    - `getReveals` returns all false for new user
    - `getReveals` returns correct flags for user with some reveals
    - `triggerRevealWithClient` sets flag to true and returns true (newly set)
    - `triggerRevealWithClient` is idempotent — returns false if already set
    - `triggerRevealWithClient` with unknown mechanic returns false (no error)
    - `getReveals` maps DB fields to API fields correctly

- [x] Task 4: Hook reveal trigger into mission completion (AC: #2, #3, #4, #5, #6)
  - [x] 4.1 In `apps/api/src/services/curriculumService.ts` `completeMission()`:
    - After the `checkAndAwardAchievementsWithClient()` call (step h)
    - Add step i: if `mission.progressiveReveal !== null`, call `triggerRevealWithClient(tx, userId, mission.progressiveReveal.mechanic)`
    - Store the result (whether newly triggered) for inclusion in response
  - [x] 4.2 Update the `completeMission` return type to include `revealTriggered: boolean` (whether a NEW reveal was triggered in this completion)
  - [x] 4.3 The existing `progressiveReveal` field in the response already passes through the static content data — keep this as-is for the mechanic description
  - [x] 4.4 Add/update unit tests in `apps/api/src/services/curriculumService.test.ts`:
    - Mission with `progressiveReveal` triggers `triggerRevealWithClient`
    - Mission without `progressiveReveal` does NOT call reveal service
    - `revealTriggered` is `true` when a new reveal is set
    - `revealTriggered` is `false` for missions without reveal triggers

- [x] Task 5: Add reveals endpoint to users routes (AC: #1, #7, #9)
  - [x] 5.1 In `apps/api/src/routes/users.ts`, add `GET /me/reveals`:
    - Auth middleware: `requireAuth`
    - No validation needed (no body/params/query)
    - Call `getReveals(req.user!.id)`
    - Return `{ data: revealStatus }`
  - [x] 5.2 Import `getReveals` from `../services/revealService.js`
  - [x] 5.3 Add route tests in `apps/api/src/routes/users.test.ts`:
    - GET /me/reveals without auth → 401
    - GET /me/reveals with auth → returns all four boolean flags in `{ data }` format

- [x] Task 6: Add integration tests (AC: #1, #2, #6, #7, #9)
  - [x] 6.1 Create `apps/api/src/__tests__/integration/reveals.test.ts`:
    - GET /users/me/reveals without auth → 401
    - New user has all reveals false
    - After completing a non-reveal mission → reveals unchanged
    - After completing mission 2.2.4 → `tokensRevealed` becomes true, others remain false
    - Completing the same reveal trigger mission again → no error, flag stays true
    - Multiple reveal triggers accumulate correctly (complete 2.2.4 then 3.1.4 → both true)
  - [x] 6.2 Verify all existing tests still pass (`pnpm test` + `pnpm test:integration`)

## Dev Notes

### Critical Architecture Patterns

- **Thin route handler:** The reveals route handler calls `getReveals()` and returns the response. No business logic in the route. [Source: architecture.md § Implementation Patterns — thin routes]

- **WithClient transaction pattern:** The reveal trigger MUST use the `WithClient` pattern established in Stories 5.3 and 5.4. The `triggerRevealWithClient()` function accepts a Prisma transaction client (`Pick<typeof prisma, "user">`) so it can be called inside `completeMission()`'s existing `prisma.$transaction()` block. This ensures the reveal flag is set atomically with the mission completion. [Source: apps/api/src/services/streakService.ts, apps/api/src/services/achievementService.ts]

- **Standard response format:** Success: `{ data: RevealStatus }`. No pagination needed. [Source: architecture.md § Format Patterns]

- **DB field naming vs API field naming:** The Prisma schema uses `revealTokens`, `revealWallet`, `revealGas`, `revealDashboard` (camelCase, verb-first, consistent with Prisma column conventions). The API response uses `tokensRevealed`, `walletRevealed`, `gasRevealed`, `dashboardRevealed` (matching the `progressiveRevealMechanicSchema` values from `packages/shared`). The service maps between these. [Source: packages/shared/src/schemas/curriculum.ts — progressiveRevealMechanicSchema]

### Reveal Trigger Missions (from content/structure.json)

| Mission ID | Content Key | Mechanic | Description |
|-----------|-------------|----------|-------------|
| `2.2.4` | `yourKnowledgeTokens` | `tokensRevealed` | Knowledge Tokens become visible in the UI |
| `3.1.4` | `setUpYourFirstWallet` | `walletRevealed` | Profile transforms into wallet interface |
| `3.3.3` | `gasInAction` | `gasRevealed` | Platform gas costs begin |
| `6.3.4` | `graduation` | `dashboardRevealed` | Complete stats and certificate unlocked |

All other 65 missions have `progressiveReveal: null`.

### Integration with completeMission() Flow

The `completeMission()` function in `curriculumService.ts` runs inside a single `prisma.$transaction()`. The current flow:

```
a. Upsert UserProgress (mark mission COMPLETED)
b. Check chapter completion → upsert ChapterProgress
c. If confidenceRating + self-assessment mission → upsert SelfAssessment
d. Count total completed missions
e. Check category completion
f. creditMissionTokensWithClient(tx, userId, ...)     ← Story 5.1
g. updateStreakWithClient(tx, userId)                  ← Story 5.3
h. checkAndAwardAchievementsWithClient(tx, userId, ...) ← Story 5.4
```

**Add step i:** `triggerRevealWithClient(tx, userId, mission.progressiveReveal.mechanic)` — only when `mission.progressiveReveal !== null`.

The `completeMission` return value already includes `progressiveReveal` (the static content data with `mechanic` and `description`). Add `revealTriggered: boolean` to indicate whether a NEW flag was set (for frontend MechanicReveal animation logic — only show the takeover if the flag was newly set, not on repeat completions).

### Route Placement Decision

The epics specify `GET /api/v1/users/me/reveals`. Place it in `apps/api/src/routes/users.ts` alongside the existing `GET /me` and `PATCH /me` routes. This follows the pattern of user-scoped data living under `/users/me/*`.

### Idempotency

The `triggerRevealWithClient` function MUST be idempotent:
- If `revealTokens` is already `true` and mission 2.2.4 is completed again, the function should:
  - Still call `client.user.update()` (setting `true` to `true` is a no-op for Prisma)
  - Return `false` to indicate no new reveal occurred
  - NOT throw an error

To determine if the flag was newly set:
1. Read current value with `client.user.findUniqueOrThrow({ where: { id: userId }, select: { [field]: true } })`
2. If already `true`, return `false`
3. If `false`, update to `true` and return `true`

### DbClient Type

Follow the exact pattern from `streakService.ts`:

```typescript
type DbClient = Pick<typeof prisma, "user">;
```

The reveal service only needs `user` operations — no other Prisma models.

### API Endpoint Design

```
GET /api/v1/users/me/reveals
  Auth: Required (session cookie)

  200 Response:
  {
    "data": {
      "tokensRevealed": false,
      "walletRevealed": false,
      "gasRevealed": false,
      "dashboardRevealed": false
    }
  }

  401: { error: { code: "UNAUTHORIZED", message } }
```

### Project Structure Notes

**New files:**
```
apps/api/src/services/revealService.ts            # Business logic
apps/api/src/services/revealService.test.ts       # Unit tests (co-located)
apps/api/src/__tests__/integration/reveals.test.ts # Integration tests
```

**Modified files:**
```
apps/api/prisma/schema.prisma                      # Add 4 boolean reveal columns to User
packages/shared/src/schemas/gamification.ts        # Add revealStatusSchema
packages/shared/src/schemas/gamification.test.ts   # Add reveal schema tests
packages/shared/src/types/gamification.ts          # Add RevealStatus type
packages/shared/src/index.ts                       # Export new schema/type
apps/api/src/routes/users.ts                       # Add GET /me/reveals endpoint
apps/api/src/routes/users.test.ts                  # Add reveals route tests
apps/api/src/services/curriculumService.ts         # Hook triggerRevealWithClient into completeMission
apps/api/src/services/curriculumService.test.ts    # Add reveal trigger tests
```

**No changes needed:**
```
apps/api/src/app.ts                                # Users router already mounted
apps/api/src/routes/gamification.ts                # Reveals go under /users, not /gamification
content/structure.json                             # Reveal triggers already defined
packages/shared/src/schemas/curriculum.ts          # progressiveRevealMechanicSchema already exists
```

### Previous Story Intelligence

From Story 5.5 (Leaderboard API):
- All 277 shared + 405 API unit + 69+ integration tests passing — baseline to maintain
- Gamification routes at `/api/v1/gamification` with `requireAuth` middleware
- Integration test helpers: `createAndLoginUser()`, `resetDatabase()`, `testPrisma` from `apps/api/src/__tests__/integration/helpers/`
- Commit pattern: `feat(gamification): description (Story 5.6)`

From Story 5.4 (Achievements API):
- `checkAndAwardAchievementsWithClient(tx, userId, context)` — the exact `WithClient` pattern to replicate
- `AchievementContext` pattern for passing context into transactional service functions

From Story 5.3 (Streak Tracking API):
- `updateStreakWithClient(tx, userId)` — simplest `WithClient` example
- `DbClient = Pick<typeof prisma, "user">` — exact type to reuse for reveal service

From Story 5.1 (Token Ledger):
- `creditMissionTokensWithClient()` — another `WithClient` example within `completeMission`

### Existing Code to Reuse

1. **`requireAuth` middleware** — Session authentication. [Source: apps/api/src/middleware/auth.ts]
2. **`progressiveRevealMechanicSchema`** — The 4 mechanic string values already defined. [Source: packages/shared/src/schemas/curriculum.ts]
3. **`WithClient` transaction pattern** — Established in streakService, achievementService. [Source: apps/api/src/services/streakService.ts]
4. **`completeMission()` transaction block** — Where the hook goes. [Source: apps/api/src/services/curriculumService.ts]
5. **`AppError`** — For typed errors. [Source: apps/api/src/utils/AppError.ts]
6. **Integration test helpers** — `createAndLoginUser()`, `resetDatabase()`, `testPrisma`. [Source: apps/api/src/__tests__/integration/helpers/]

### Edge Cases to Handle

1. **Unknown mechanic string:** If `content/structure.json` is modified and contains a mechanic value not in `MECHANIC_TO_FIELD`, log a warning and return `false`. Do NOT throw — this prevents a content change from crashing the app.

2. **User not found in triggerRevealWithClient:** Use `findUniqueOrThrow` — if the user doesn't exist, the Prisma error propagates. This should never happen since the user is already authenticated and exists in the transaction.

3. **Concurrent mission completions:** The reveal trigger runs inside `completeMission`'s `$transaction`, so concurrent requests on the same reveal mission are safe — Prisma transactions handle isolation.

4. **All reveals already set:** `getReveals` returns all `true`. No special handling needed.

5. **Migration on existing users:** The migration adds 4 boolean columns with `@default(false)`. All existing users get `false` for all flags. No data migration needed.

### Performance Budget

Target: <200ms end-to-end.

| Operation | Estimated Time |
|-----------|---------------|
| Auth middleware | ~1ms |
| `getReveals`: User.findUniqueOrThrow (4 booleans) | ~1-2ms |
| Field mapping | ~0.01ms |
| **Total GET /me/reveals** | **~3-5ms** |

| Operation (inside completeMission transaction) | Estimated Time |
|-----------------------------------------------|---------------|
| `triggerRevealWithClient`: read current flag | ~1ms (already in transaction) |
| `triggerRevealWithClient`: update if needed | ~1ms |
| **Total trigger overhead** | **~2ms** |

Well within performance budget.

### References

- [Source: _bmad-output/planning-artifacts/epics.md § Epic 5 Story 5.6 — Progressive Mechanic Reveal API]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns — thin routes, service layer, co-located tests, WithClient pattern]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns — API response format]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md § Progressive Mechanic Reveal — MechanicReveal full-screen takeover]
- [Source: content/structure.json § progressiveReveal fields on missions 2.2.4, 3.1.4, 3.3.3, 6.3.4]
- [Source: packages/shared/src/schemas/curriculum.ts § progressiveRevealMechanicSchema]
- [Source: apps/api/src/services/curriculumService.ts § completeMission() — transaction block where reveal hook goes]
- [Source: apps/api/src/services/streakService.ts § WithClient pattern]
- [Source: apps/api/src/services/achievementService.ts § WithClient pattern]
- [Source: apps/api/src/routes/users.ts § existing GET /me, PATCH /me routes]
- [Source: apps/api/prisma/schema.prisma § User model]
- [Source: _bmad-output/implementation-artifacts/5-5-leaderboard-api.md — previous story dev notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Integration test initially failed due to incorrect mission IDs (used 1.1.4, 1.3.4 which don't exist). Fixed by checking actual content/structure.json: Cat 1 has 1.1.1-1.1.3, 1.2.1-1.2.5, 1.3.1-1.3.3.
- curriculum.test.ts route test failed until revealService mock was added (completeMission now imports revealService).

### Completion Notes List

- Task 1: Added 4 boolean reveal columns to User model via Prisma migration `20260310160918_add_reveal_flags`. All default false.
- Task 2: Added `revealStatusSchema` and `RevealStatus` type to shared package with 6 tests.
- Task 3: Created `revealService.ts` with `triggerRevealWithClient`, `triggerReveal`, and `getReveals`. 10 unit tests cover all mechanics, idempotency, and unknown mechanic handling.
- Task 4: Hooked `triggerRevealWithClient` as step i in `completeMission()` transaction. Added `revealTriggered` boolean to `CompleteMissionResponse`. 3 new tests in curriculumService.test.ts.
- Task 5: Added `GET /me/reveals` endpoint in users.ts with `requireAuth`. 2 route tests (auth + happy path).
- Task 6: Created 6 integration tests covering auth, new user defaults, non-reveal mission, reveal trigger at 2.2.4, idempotent re-completion (409), and multi-reveal accumulation (2.2.4 + 3.1.4).
- Final test counts: 302 shared + 419 API unit + 28 web = 749 unit tests. 76 integration tests. All passing.

### Implementation Plan

Followed WithClient transaction pattern from streakService/achievementService. Reveal trigger runs atomically inside completeMission's existing $transaction. Service maps between DB field names (revealTokens) and API field names (tokensRevealed). Idempotent: returns false if already set, no error on unknown mechanic.

### File List

**New files:**
- apps/api/prisma/migrations/20260310160918_add_reveal_flags/migration.sql
- apps/api/src/services/revealService.ts
- apps/api/src/services/revealService.test.ts
- apps/api/src/__tests__/integration/reveals.test.ts

**Modified files:**
- apps/api/prisma/schema.prisma
- packages/shared/src/schemas/gamification.ts
- packages/shared/src/schemas/gamification.test.ts
- packages/shared/src/types/gamification.ts
- packages/shared/src/types/progress.ts
- packages/shared/src/index.ts
- apps/api/src/services/curriculumService.ts
- apps/api/src/services/curriculumService.test.ts
- apps/api/src/routes/users.ts
- apps/api/src/routes/users.test.ts
- apps/api/src/routes/curriculum.test.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml

## Change Log

- 2026-03-10: Implemented Progressive Mechanic Reveal API (Story 5.6) — added 4 boolean reveal flags to User model, created revealService with WithClient pattern, hooked into completeMission transaction, added GET /me/reveals endpoint, added revealTriggered to CompleteMissionResponse
- 2026-03-10: Code review — removed unused triggerReveal() standalone function (dead code), added transaction safety comment to triggerRevealWithClient, fixed misleading integration test description for idempotent re-completion, added sprint-status.yaml to File List
