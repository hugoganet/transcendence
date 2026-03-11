# Story 6.3: Public Profiles API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to view other users' public profiles,
So that I can see their progress and achievements.

## Acceptance Criteria

1. **Given** an authenticated user,
   **When** they call `GET /api/v1/users/:userId/profile`,
   **Then** the public profile is returned with: `displayName`, `avatarUrl`, `xp` (total missions completed), `currentStreak`, `achievements` (earned only), and `completionPercentage`.

2. **Given** private data,
   **When** a public profile is requested,
   **Then** `email`, `tokenBalance`, `twoFactorEnabled`, `twoFactorSecret`, `passwordHash`, `locale`, `ageConfirmed`, `disclaimerAcceptedAt`, reveal flags, and detailed transaction history are **NOT** included.

3. **Given** the `:userId` param is not a valid UUID,
   **When** the endpoint is called,
   **Then** a 400 is returned with code `INVALID_INPUT` (Zod param validation).

3b. **Given** the `:userId` is a valid UUID but the user does not exist,
   **When** the endpoint is called,
   **Then** a 404 is returned with code `USER_NOT_FOUND`.

4. **Given** an unauthenticated request,
   **When** the endpoint is called,
   **Then** a 401 is returned (requireAuth middleware).

5. **Given** a user with zero progress,
   **When** their public profile is requested,
   **Then** `xp` is `0`, `currentStreak` is `0`, `achievements` is `[]`, `completionPercentage` is `0`.

## Tasks / Subtasks

- [x] Task 1: Add shared types and Zod schema for public profile (AC: #1, #2)
  - [x] 1.1 Create `packages/shared/src/schemas/publicProfile.ts`:
    - Define `publicProfileSchema` with: `id` (string), `displayName` (string | null), `avatarUrl` (string | null), `xp` (number, min 0), `currentStreak` (number, min 0), `achievements` (array of earned achievement objects), `completionPercentage` (number, 0-100)
    - Define `earnedAchievementSchema` with: `id`, `code`, `title`, `description`, `iconUrl`, `earnedAt` (ISO string)
  - [x] 1.2 Create `packages/shared/src/types/publicProfile.ts`:
    - Export `PublicProfile` and `EarnedAchievement` types inferred from schemas
  - [x] 1.3 Add `userIdParamSchema` to `packages/shared/src/schemas/publicProfile.ts`:
    - `z.object({ userId: z.string().uuid() })`
  - [x] 1.4 Export all new schemas and types from `packages/shared/src/index.ts`

- [x] Task 2: Create `getPublicProfile` service function (AC: #1, #2, #3, #5)
  - [x] 2.1 Create `apps/api/src/services/publicProfileService.ts`:
    - Import `prisma` from `../config/database.js`
    - Import `getContent` from `../utils/contentLoader.js`
    - Import `PublicProfile` type from `@transcendence/shared`
  - [x] 2.2 Implement `getPublicProfile(userId: string): Promise<PublicProfile>`:
    - Query user with `prisma.user.findUnique` selecting ONLY public fields: `id`, `displayName`, `avatarUrl`, `currentStreak`
    - If user not found, throw `AppError.notFound("User not found")` (code: `USER_NOT_FOUND`)
    - Count completed missions: `prisma.userProgress.count({ where: { userId, status: "COMPLETED" } })` → this is `xp`
    - Get earned achievements: `prisma.userAchievement.findMany({ where: { userId }, include: { achievement: true } })` → map to `EarnedAchievement[]`
    - Calculate `completionPercentage`: count completed missions / total missions from `getContent().curriculum` (same pattern as `curriculumService.ts:151-153`)
    - Use `prisma.$transaction([...])` batch for snapshot consistency (same pattern as `streakService.getStreak`)
    - Return assembled `PublicProfile` object

- [x] Task 3: Add route handler `GET /api/v1/users/:userId/profile` (AC: #1, #3, #4)
  - [x] 3.1 In `apps/api/src/routes/users.ts`:
    - Import `getPublicProfile` from `../services/publicProfileService.js`
    - Import `userIdParamSchema` from `@transcendence/shared`
    - Add route: `usersRouter.get("/:userId/profile", requireAuth, validate({ params: userIdParamSchema }), async handler)`
    - Handler: call `getPublicProfile(req.params.userId)`, return `res.json({ data: profile })`
  - [x] 3.2 **Placement**: Add the new route AFTER the `/me/*` routes to avoid Express matching `:userId` before `me`

- [x] Task 4: Add unit tests for publicProfileService (AC: #1, #2, #3, #5)
  - [x] 4.1 Create `apps/api/src/services/publicProfileService.test.ts`:
    - Mock `prisma` (user.findUnique, userProgress.count, userAchievement.findMany, $transaction)
    - Mock `getContent` to return curriculum structure
    - Test: returns correct public profile with all fields
    - Test: xp equals count of COMPLETED missions
    - Test: achievements include only earned ones with correct shape
    - Test: completionPercentage is `Math.round((completed / totalMissions) * 100)`
    - Test: throws `USER_NOT_FOUND` for non-existent user
    - Test: does NOT include email, tokenBalance, passwordHash, twoFactorSecret, reveal flags, or any private field
    - Test: user with zero progress returns xp=0, currentStreak=0, achievements=[], completionPercentage=0

- [x] Task 5: Add integration tests (AC: #1-#5)
  - [x] 5.1 Create `apps/api/src/__tests__/integration/publicProfile.test.ts`:
    - Use existing helpers: `setupApp`, `teardownApp`, `resetDatabase`, `createAndLoginUser`
    - Test: authenticated user can view another user's public profile
    - Test: profile returns displayName, avatarUrl, xp, currentStreak, achievements, completionPercentage
    - Test: profile does NOT contain email, tokenBalance, or private fields
    - Test: returns 404 for non-existent userId
    - Test: returns 400 for invalid UUID format (Zod validation)
    - Test: returns 401 for unauthenticated request
    - Test: user with no progress returns all zeros/empty
    - Test: user can view their own public profile (no self-exclusion)
  - [x] 5.2 Integration test setup:
    - Create 2 test users (viewer + target)
    - Optionally seed target with some completed missions and achievements for richer assertions

- [x] Task 6: Verify and cleanup (AC: all)
  - [x] 6.1 Run `pnpm test` in apps/api — all 464 unit tests pass
  - [x] 6.2 Run `pnpm test:integration` in apps/api — all 8 new integration tests pass (pre-existing failures in other test files are unrelated)
  - [x] 6.3 Verify no regressions in existing user/friend/gamification tests

## Dev Notes

### Critical Architecture Patterns

- **Thin route handler pattern:** Route validates input (Zod), calls service, returns `res.json({ data: result })`. NO business logic in routes.
- **API response format:** `{ data: T }` for success, `{ error: { code, message, details? } }` for errors. Error codes are UPPER_SNAKE_CASE.
- **Service layer owns all DB access:** Routes never import `prisma` directly.
- **Batch transactions for read consistency:** Use `prisma.$transaction([query1, query2, ...])` when multiple reads must be snapshot-consistent. See `streakService.getStreak()` for the pattern.

### Data Aggregation Strategy

The public profile aggregates data from multiple tables. Here's where each field comes from:

| Field | Source | Query |
|-------|--------|-------|
| `id` | `User` table | `user.id` |
| `displayName` | `User` table | `user.displayName` |
| `avatarUrl` | `User` table | `user.avatarUrl` |
| `xp` | `UserProgress` table | `count({ where: { userId, status: "COMPLETED" } })` |
| `currentStreak` | `User` table | `user.currentStreak` |
| `achievements` | `UserAchievement` + `Achievement` tables | `findMany({ where: { userId }, include: { achievement: true } })` |
| `completionPercentage` | `UserProgress` count + curriculum JSON | `Math.round((completedCount / totalMissions) * 100)` |

### Completion Percentage Calculation

Reuse the same pattern from `curriculumService.ts:151-153`:

```typescript
const content = getContent();
const totalMissions = content.curriculum.reduce(
  (sum, cat) => sum + cat.chapters.reduce(
    (s, ch) => s + ch.missions.length, 0
  ), 0
);
const completionPercentage = totalMissions > 0
  ? Math.round((completedCount / totalMissions) * 100)
  : 0;
```

**Do NOT hardcode 69 missions** — always compute from `getContent()` so it stays in sync with curriculum changes.

### Private Field Exclusion

The `sanitizeUser()` function in `authService.ts` returns too much data for a public profile (includes `email`, `locale`, `ageConfirmed`, `twoFactorEnabled`, `disclaimerAcceptedAt`). **Do NOT reuse `sanitizeUser()`** — instead, select only public fields in the Prisma query:

```typescript
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    displayName: true,
    avatarUrl: true,
    currentStreak: true,
    // NO email, NO passwordHash, NO tokenBalance, NO reveal flags, etc.
  },
});
```

### Route Ordering in users.ts

Express matches routes top-to-bottom. The existing routes use `/me`, `/me/reveals`, `/me/avatar`. The new `/:userId/profile` route MUST be placed AFTER all `/me/*` routes. Otherwise, Express could match `me` as a `:userId` parameter.

Current route order in `users.ts`:
1. `GET /me` (line 44)
2. `PATCH /me` (line 54)
3. `GET /me/reveals` (line 68)
4. `POST /me/avatar` (line 78)
5. **NEW: `GET /:userId/profile`** — add here, at the end

### Existing Code Inventory

| File | Relevance |
|------|-----------|
| `apps/api/src/routes/users.ts` | Modify: add `GET /:userId/profile` route |
| `apps/api/src/services/userService.ts` | Reference only: `getProfile()` pattern (but do NOT reuse — it returns private data) |
| `apps/api/src/services/authService.ts:335-358` | Reference only: `sanitizeUser()` — DO NOT USE for public profile |
| `apps/api/src/services/streakService.ts:90-127` | Pattern: `prisma.$transaction([...])` batch read for consistency |
| `apps/api/src/services/curriculumService.ts:44-153` | Pattern: completion percentage calculation from content + userProgress |
| `apps/api/src/services/achievementService.ts:94-115` | Pattern: `getAchievements()` query with `include: { userAchievements }` |
| `apps/api/src/services/leaderboardService.ts:50-72` | Pattern: `_count` for missions, `select` for minimal user fields |
| `apps/api/src/services/friendService.ts` | Pattern: `AppError` usage, query patterns |
| `apps/api/src/middleware/validate.ts` | Use: `validate({ params: schema })` for `:userId` param validation |
| `apps/api/src/utils/contentLoader.ts` | Use: `getContent()` for total mission count |
| `apps/api/prisma/schema.prisma` | Reference: User model, UserProgress, UserAchievement, Achievement |
| `packages/shared/src/schemas/gamification.ts` | Pattern: schema definition style (achievementStatusSchema) |
| `packages/shared/src/types/gamification.ts` | Pattern: type inference from schemas |

### Previous Story Intelligence

From Story 6.2 (Online Presence via Socket.IO):
- Socket.IO session auth reads `session.passport.user` (not `session.userId`) — already fixed
- Redis SET `online-users` is populated for presence — not needed for public profiles
- Test counts at end of 6.2: 456 unit + 99 integration tests passing
- Test helpers: `createAndLoginUser()`, `resetDatabase()`, `setupApp()`, `teardownApp()` in `apps/api/src/__tests__/integration/helpers/`
- `supertest.agent(app)` for session cookie persistence in integration tests

From Story 6.1 (Friends System API):
- `Friendship` table with bidirectional relations — not directly needed for public profiles
- `friendService.getFriends()` reads Redis `online-users` SET — presence is separate from profile data
- Route pattern: `friendsRouter.get("/", requireAuth, handler)` — simple auth + handler

### Edge Cases

1. **User views their own profile:** Should work — no self-exclusion. The endpoint returns the same public data for self and others.
2. **Deleted user ID:** `findUnique` returns `null` → throw 404 `USER_NOT_FOUND`.
3. **User with no display name:** `displayName` is `null` — the schema and response allow this.
4. **User with 69/69 missions:** `completionPercentage` should be `100`, not `101` due to rounding. `Math.round` handles this correctly.

### Testing Strategy

- **Unit tests (publicProfileService.test.ts):** Mock Prisma + contentLoader. Test data assembly logic, private field exclusion, edge cases (no progress, user not found).
- **Integration tests (publicProfile.test.ts):** Real DB + real API. Verify full request/response cycle, auth enforcement, Zod validation of params, response shape.

### Project Structure Notes

**New files:**
```
packages/shared/src/schemas/publicProfile.ts    # Zod schemas
packages/shared/src/types/publicProfile.ts      # TypeScript types
apps/api/src/services/publicProfileService.ts   # Service function
apps/api/src/services/publicProfileService.test.ts  # Unit tests
apps/api/src/__tests__/integration/publicProfile.test.ts  # Integration tests
```

**Modified files:**
```
packages/shared/src/index.ts                     # Export new schemas/types
apps/api/src/routes/users.ts                     # Add GET /:userId/profile route
```

**No changes needed:**
```
apps/api/prisma/schema.prisma                    # No new tables or columns
apps/api/src/app.ts                              # No new routers (reuses usersRouter)
apps/api/src/services/userService.ts             # Not modified (private profile is separate)
apps/api/src/services/authService.ts             # Not modified
```

### References

- [Source: apps/api/src/routes/users.ts — Existing user routes, route ordering]
- [Source: apps/api/src/services/userService.ts — getProfile() pattern (private, not reusable)]
- [Source: apps/api/src/services/authService.ts:335-358 — sanitizeUser() (private, DO NOT USE)]
- [Source: apps/api/src/services/streakService.ts:90-127 — $transaction batch read pattern]
- [Source: apps/api/src/services/curriculumService.ts:44-153 — completionPercentage calculation]
- [Source: apps/api/src/services/achievementService.ts:94-115 — getAchievements() query pattern]
- [Source: apps/api/src/services/leaderboardService.ts:50-72 — Minimal user select + _count pattern]
- [Source: apps/api/prisma/schema.prisma — User, UserProgress, UserAchievement, Achievement models]
- [Source: packages/shared/src/schemas/gamification.ts — Schema definition patterns]
- [Source: _bmad-output/planning-artifacts/epics.md — Epic 6 Story 6.3 requirements]
- [Source: _bmad-output/planning-artifacts/architecture.md — API patterns, response format, naming]
- [Source: docs/project-context.md — WithClient pattern, API response format, test organization]
- [Source: _bmad-output/implementation-artifacts/6-2-online-presence-via-socket-io.md — Previous story context]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Implemented `GET /api/v1/users/:userId/profile` endpoint for public profile retrieval
- Used `prisma.$transaction()` batch read pattern for snapshot consistency across User, UserProgress, and UserAchievement tables
- Completion percentage calculated dynamically from `getContent().curriculum` (not hardcoded)
- Private fields excluded at query level via Prisma `select` — no sanitization function needed
- Route placed after all `/me/*` routes to prevent Express param matching conflicts
- Used `AppError(404, "USER_NOT_FOUND", ...)` directly instead of `AppError.notFound()` to match the specific error code required by AC #3
- 8 unit tests covering: correct profile assembly, XP count, achievements shape, completion percentage, user not found, private field exclusion, zero progress, transaction usage
- 8 integration tests covering: auth enforcement, profile retrieval, field presence, private field exclusion, 404 for missing user, 400 for invalid UUID, zero progress, self-profile view

### File List

New files:
- `packages/shared/src/schemas/publicProfile.ts`
- `packages/shared/src/types/publicProfile.ts`
- `apps/api/src/services/publicProfileService.ts`
- `apps/api/src/services/publicProfileService.test.ts`
- `apps/api/src/__tests__/integration/publicProfile.test.ts`

Modified files:
- `packages/shared/src/index.ts`
- `apps/api/src/routes/users.ts`
- `_bmad-output/implementation-artifacts/sprint-status.yaml`

### Change Log

- 2026-03-11: Implemented Story 6.3 — Public Profiles API. Added `GET /api/v1/users/:userId/profile` endpoint with shared Zod schemas, service function, route handler, 8 unit tests, and 8 integration tests.
- 2026-03-11: **Code Review** — 7 issues fixed (1 HIGH, 4 MEDIUM, 2 LOW). AC #3 split to distinguish 400 (invalid UUID) from 404 (user not found). Added `.int()` to `completionPercentage` schema. Added `Math.min(..., 100)` clamp to service. Added `afterAll(teardownApp)` to integration test. Documented sprint-status.yaml in File List. Added error body assertions for 400 test. Added `.min(1)` to `iconUrl` schema to reject empty strings.
