# Story 5.3: Streak Tracking API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to maintain a daily learning streak and see my cumulative progress,
So that I'm motivated to return daily without feeling punished for breaks.

## Acceptance Criteria

1. **Given** an authenticated user completing at least one mission in a day,
   **When** the mission completion is recorded via `POST /api/v1/curriculum/missions/:missionId/complete`,
   **Then** the user's streak is incremented if this is their first mission completion today,
   **And** the streak is maintained (not re-incremented) if they already completed a mission today,
   **And** `lastMissionCompletedAt` is updated to the current timestamp.

2. **Given** a user who misses one or more calendar days,
   **When** they complete a mission the next time they play,
   **Then** the current streak resets to 1,
   **And** `longestStreak` is preserved (updated only if `currentStreak` was higher before reset),
   **And** cumulative progress (`totalMissionsCompleted`, `totalModulesMastered`) remains unchanged (FR29).

3. **Given** an authenticated user,
   **When** they call `GET /api/v1/gamification/streak`,
   **Then** the response includes: `currentStreak`, `longestStreak`, `lastMissionCompletedAt`, `totalMissionsCompleted`, `totalModulesMastered`,
   **And** the response is returned in `{ data: T }` format.

4. **Given** the streak system database requirements,
   **When** the Prisma migration runs,
   **Then** the `User` model gains: `currentStreak` (Int, default 0), `longestStreak` (Int, default 0), `lastMissionCompletedAt` (DateTime?),
   **And** no additional table is needed (streak data lives on the User model for simplicity).

5. **Given** a new user with no mission completions,
   **When** they call `GET /api/v1/gamification/streak`,
   **Then** the response includes: `currentStreak: 0`, `longestStreak: 0`, `lastMissionCompletedAt: null`, `totalMissionsCompleted: 0`, `totalModulesMastered: 0`.

## Tasks / Subtasks

- [x] Task 1: Add streak fields to User model in Prisma schema (AC: #4)
  - [x] 1.1 Add `currentStreak Int @default(0)` to User model in `apps/api/prisma/schema.prisma`
  - [x] 1.2 Add `longestStreak Int @default(0)` to User model
  - [x] 1.3 Add `lastMissionCompletedAt DateTime?` to User model
  - [x] 1.4 Run `npx prisma migrate dev --name add-streak-fields` to generate and apply migration
  - [x] 1.5 Verify `resetDatabase()` in integration test helpers still works (no new table to truncate, fields reset when user is deleted)

- [x] Task 2: Create streak Zod schemas and types in packages/shared (AC: #3, #5)
  - [x] 2.1 Create `packages/shared/src/schemas/gamification.ts` with:
    - `streakSchema`: `{ currentStreak: number, longestStreak: number, lastMissionCompletedAt: string|null, totalMissionsCompleted: number, totalModulesMastered: number }`
  - [x] 2.2 Create `packages/shared/src/types/gamification.ts` with inferred types: `StreakStatus`
  - [x] 2.3 Export new schemas and types from `packages/shared/src/index.ts`
  - [x] 2.4 Add tests for streak schema in `packages/shared/src/schemas/gamification.test.ts`

- [x] Task 3: Create streakService.ts with business logic (AC: #1, #2, #3, #5)
  - [x] 3.1 Create `apps/api/src/services/streakService.ts`
  - [x] 3.2 Implement `updateStreakWithClient(client, userId)`:
    - Accept a Prisma `DbClient` as first parameter (same pattern as `creditMissionTokensWithClient`)
    - Query user's `lastMissionCompletedAt` and `currentStreak`
    - Use calendar-day comparison (UTC): if `lastMissionCompletedAt` is today → no-op (streak already counted)
    - If `lastMissionCompletedAt` is yesterday → increment `currentStreak` by 1
    - If `lastMissionCompletedAt` is older than yesterday OR null → reset `currentStreak` to 1
    - Update `longestStreak` if `currentStreak > longestStreak`
    - Update `lastMissionCompletedAt` to `new Date()`
    - Use atomic Prisma update
  - [x] 3.3 Implement standalone `updateStreak(userId)` wrapper with its own `prisma.$transaction`
  - [x] 3.4 Implement `getStreak(userId)`:
    - Query user's `currentStreak`, `longestStreak`, `lastMissionCompletedAt`
    - Count `UserProgress` records with `status: COMPLETED` for `totalMissionsCompleted`
    - Count completed chapters from `ChapterProgress` where all missions in a category are complete (use existing category completion logic) for `totalModulesMastered`
    - Return `StreakStatus` object
  - [x] 3.5 Add unit tests: `apps/api/src/services/streakService.test.ts`:
    - First mission ever → currentStreak=1, longestStreak=1
    - Second mission same day → currentStreak unchanged
    - Mission on consecutive day → currentStreak incremented
    - Mission after gap → currentStreak reset to 1, longestStreak preserved
    - longestStreak updated when currentStreak exceeds it
    - getStreak for new user → all zeros/null
    - getStreak returns correct totalMissionsCompleted and totalModulesMastered

- [x] Task 4: Create gamification route with streak endpoint (AC: #3, #5)
  - [x] 4.1 Create `apps/api/src/routes/gamification.ts`
  - [x] 4.2 Implement `GET /api/v1/gamification/streak`:
    - Auth middleware required (`requireAuth`)
    - Call `streakService.getStreak(userId)`
    - Return in standard `{ data: T }` format
  - [x] 4.3 Register routes in `apps/api/src/app.ts`: `app.use("/api/v1/gamification", gamificationRouter)`
  - [x] 4.4 Add route tests: `apps/api/src/routes/gamification.test.ts`

- [x] Task 5: Integrate streak update into mission completion (AC: #1, #2)
  - [x] 5.1 In `apps/api/src/services/curriculumService.ts` → `completeMission()`:
    - Inside the existing `prisma.$transaction(async (tx) => { ... })`, after `creditMissionTokensWithClient(tx, ...)`, call `updateStreakWithClient(tx, userId)`
    - Import from streakService
  - [x] 5.2 Update existing curriculumService unit tests to mock streakService
  - [x] 5.3 Verify existing curriculum route tests still pass with streakService mocked

- [x] Task 6: Add integration tests for streak system (AC: #1, #2, #3, #4, #5)
  - [x] 6.1 Create `apps/api/src/__tests__/integration/streak.test.ts`:
    - New user GET streak → all zeros/null
    - Complete first mission → currentStreak=1, longestStreak=1
    - Complete second mission same day → currentStreak=1 (no change)
    - Complete mission on next day → currentStreak=2 (simulate by updating lastMissionCompletedAt in DB)
    - Complete mission after gap → currentStreak=1, longestStreak preserved
    - GET streak → correct totalMissionsCompleted count
    - GET streak → correct totalModulesMastered count (partial category = 0)
    - GET streak without auth → 401
  - [x] 6.2 Verify all existing tests still pass (`pnpm test` + `pnpm test:integration`)

## Dev Notes

### Critical Architecture Patterns

- **Atomic streak update inside completeMission transaction:** The streak update MUST be inside the same `prisma.$transaction` as mission completion and token crediting. This ensures if any part fails, all state rolls back together. Use `updateStreakWithClient(tx, userId)` following the established `WithClient` pattern from tokenService. [Source: architecture.md § Data Architecture — NFR15 concurrent safety]

- **Calendar-day comparison, not 24-hour window:** A "day" is defined by UTC calendar date, not a rolling 24-hour window. This means a user who completes a mission at 11:50 PM UTC and another at 12:10 AM UTC the next day gets credit for both days. Use `toISOString().slice(0, 10)` or `toDateString()` for UTC date comparison. This is simpler and aligns with how Duolingo/Headspace handle streaks.

- **No streak shame (FR29):** When the streak resets, cumulative progress (`totalMissionsCompleted`, `totalModulesMastered`) is highlighted, NOT the zero streak. The API returns BOTH streak data AND cumulative data so the frontend can frame the reset positively. [Source: epics.md § Story 5.3 — "without feeling punished for breaks"]

- **Thin route handlers:** The gamification route handler should be thin — validate, call service, respond. All streak logic lives in `streakService.ts`. [Source: architecture.md § Implementation Patterns]

- **Standard response format:** Success: `{ data: T }`. No pagination needed for this endpoint. [Source: architecture.md § Format Patterns]

### Streak Logic — Detailed Algorithm

```
updateStreakWithClient(tx, userId):
  1. Query user: currentStreak, longestStreak, lastMissionCompletedAt
  2. Get today's UTC date string: new Date().toISOString().slice(0, 10)
  3. Get last activity UTC date string (if lastMissionCompletedAt exists)

  4. CASE: lastMissionCompletedAt is null (first ever mission)
     → Set currentStreak = 1, longestStreak = 1, lastMissionCompletedAt = now()

  5. CASE: lastActivityDate === today
     → No streak change (already counted today)
     → Still update lastMissionCompletedAt to now() (for accurate timestamp)

  6. CASE: lastActivityDate === yesterday (today minus 1 day)
     → Increment currentStreak by 1
     → Update longestStreak = max(longestStreak, currentStreak)
     → Update lastMissionCompletedAt = now()

  7. CASE: lastActivityDate < yesterday (gap of 2+ days)
     → Update longestStreak = max(longestStreak, currentStreak)  // Save old streak if it was a record
     → Reset currentStreak = 1
     → Update lastMissionCompletedAt = now()
```

### Date Helper — "isYesterday" Logic

```typescript
function getUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10); // "2026-03-10"
}

function isConsecutiveDay(lastDate: Date, currentDate: Date): boolean {
  const lastUtc = getUtcDateString(lastDate);
  const currentUtc = getUtcDateString(currentDate);
  // Calculate the expected "yesterday" from currentDate
  const yesterday = new Date(currentDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return getUtcDateString(yesterday) === lastUtc;
}

function isSameDay(lastDate: Date, currentDate: Date): boolean {
  return getUtcDateString(lastDate) === getUtcDateString(currentDate);
}
```

### `totalModulesMastered` — Counting Completed Categories

The epics spec says "modules mastered" which maps to categories completed. Use the existing `ChapterProgress` model:
- A category is "mastered" when ALL chapters in that category have status COMPLETED
- Count by grouping chapter IDs by their category prefix (e.g., chapters "1.1", "1.2", "1.3" belong to category 1)
- Use content structure to determine how many chapters per category exist
- Compare with `ChapterProgress` records where `status === COMPLETED`

Alternatively, simpler approach: count distinct completed categories from `UserProgress` where ALL missions in a category are completed. Since we already track `categoryCompleted` in `completeMission()`, consider adding a `categoriesCompleted` counter to User (but this adds schema complexity for one read endpoint).

**Recommended approach:** Query `ChapterProgress` with status COMPLETED, group by category prefix, compare against total chapters per category from content structure. This requires no schema change and uses existing data.

### DbClient Type for Streak Service

```typescript
type DbClient = Pick<typeof prisma, "user">;
```

The streak service only needs to read/update the `User` model (streak fields live there). No need for additional model access.

### API Endpoint Design

```
GET /api/v1/gamification/streak
  Auth: Required (session cookie)

  200 Response:
  {
    "data": {
      "currentStreak": 5,
      "longestStreak": 12,
      "lastMissionCompletedAt": "2026-03-10T14:30:00.000Z",
      "totalMissionsCompleted": 23,
      "totalModulesMastered": 2
    }
  }

  200 Response (new user):
  {
    "data": {
      "currentStreak": 0,
      "longestStreak": 0,
      "lastMissionCompletedAt": null,
      "totalMissionsCompleted": 0,
      "totalModulesMastered": 0
    }
  }

  401: { error: { code: "UNAUTHORIZED", message } }
```

### Existing Code to Modify

1. **`apps/api/prisma/schema.prisma`** — Add 3 fields to User model: `currentStreak`, `longestStreak`, `lastMissionCompletedAt`.

2. **`apps/api/src/services/curriculumService.ts` → `completeMission()`** — Add `updateStreakWithClient(tx, userId)` call inside the existing `$transaction`, after `creditMissionTokensWithClient`. [Source: apps/api/src/services/curriculumService.ts — line ~465 in tx block]

3. **`apps/api/src/app.ts`** — Register gamification routes: `app.use("/api/v1/gamification", gamificationRouter)`.

### Existing Code to Reuse

1. **`creditMissionTokensWithClient(client, ...)` pattern** — Same `WithClient` + standalone wrapper pattern for transaction embedding. [Source: tokenService.ts]

2. **`DbClient` type alias** — Reuse the pattern, adapted for streak service needs: `Pick<typeof prisma, "user">`.

3. **`AppError` class** — For typed errors. [Source: apps/api/src/utils/AppError.ts]

4. **`requireAuth` middleware** — Session authentication for the gamification route. [Source: apps/api/src/middleware/auth.ts]

5. **Integration test helpers** — `createAndLoginUser()`, `resetDatabase()`, `testPrisma` from `apps/api/src/__tests__/integration/helpers/`. [Source: Story 4.0]

6. **`getContent()` content loader** — For determining total chapters per category (needed for `totalModulesMastered` calculation). [Source: apps/api/src/utils/contentLoader.ts]

7. **`completeMission()` transaction pattern** — The existing transaction in curriculumService that already wraps token crediting. Add streak update in the same transaction. [Source: curriculumService.ts]

### Edge Cases to Handle

1. **Concurrent mission completions same day:** Two rapid completions within seconds. The first sets `currentStreak = 1`, the second should see it's the same day and skip. Since both are inside `$transaction`, Prisma serializes writes. Safe.

2. **Timezone handling:** Use UTC for all date comparisons. Users in different timezones will have their "day" defined by UTC. This is a simplification — a future story could add per-user timezone preference.

3. **Streak across midnight UTC:** A user completes a mission at 23:59 UTC and another at 00:01 UTC. These are consecutive days → streak increments. This is correct behavior.

4. **First mission ever:** `lastMissionCompletedAt` is null. Treat as a "gap > 1 day" case → set streak to 1, longest to 1.

5. **Same-day multiple missions:** Only the first mission of the day affects streak. Subsequent missions update `lastMissionCompletedAt` timestamp but don't change `currentStreak`.

6. **Integration test date simulation:** To test consecutive-day logic without waiting 24 hours, directly update `lastMissionCompletedAt` in the DB via `prisma.user.update()` before triggering the next mission completion. This is the standard pattern for time-dependent integration tests.

7. **`totalModulesMastered` accuracy:** This is a derived count from existing data (ChapterProgress + content structure). It doesn't need a denormalized counter on the User model — compute it on read in `getStreak()`. If performance becomes an issue with many users, add a counter later.

### Performance Budget

Target: <200ms end-to-end.

| Operation | Estimated Time |
|-----------|---------------|
| Auth middleware | ~1ms |
| Query User streak fields | ~2ms |
| Count UserProgress (COMPLETED) | ~3-5ms |
| Count ChapterProgress + content structure comparison | ~5-10ms |
| **Total server time (GET streak)** | **~15-20ms** |

For streak UPDATE (inside completeMission transaction):

| Operation | Estimated Time |
|-----------|---------------|
| Query User streak fields | ~2ms |
| Date comparison logic | ~0.1ms |
| Atomic User update | ~3-5ms |
| **Total added to completeMission** | **~5-8ms** |

Well within the 200ms budget.

### Project Structure Notes

**New files:**
```
packages/shared/src/schemas/gamification.ts          # Zod schemas
packages/shared/src/schemas/gamification.test.ts     # Schema tests
packages/shared/src/types/gamification.ts            # TypeScript types
apps/api/src/services/streakService.ts               # Business logic
apps/api/src/services/streakService.test.ts          # Unit tests (co-located)
apps/api/src/routes/gamification.ts                  # Route handlers
apps/api/src/routes/gamification.test.ts             # Route tests (co-located)
apps/api/src/__tests__/integration/streak.test.ts    # Integration tests
apps/api/prisma/migrations/XXXXXX_add_streak_fields/ # Prisma migration
```

**Modified files:**
```
apps/api/prisma/schema.prisma                        # Add streak fields to User
apps/api/src/app.ts                                  # Register gamification routes
apps/api/src/services/curriculumService.ts           # Add streak update to completeMission()
apps/api/src/services/curriculumService.test.ts      # Mock streakService in existing tests
apps/api/src/routes/curriculum.test.ts               # Verify no regression with streakService mock
packages/shared/src/index.ts                         # Export new schemas/types
```

### Previous Story Intelligence

From Story 5.2 (Gas-Fee Mechanic API):
- `deductGasFeeWithClient(tx, ...)` pattern works well inside `completeMission`'s transaction — reuse same approach for `updateStreakWithClient`
- The `DbClient` type needs only the Prisma models accessed: `Pick<typeof prisma, "user">` for streak
- All 363 unit + 211 shared + 46 integration tests passing at Story 5.2 completion — baseline to maintain
- `exerciseService.test.ts` already mocks `tokenService` — will also need to verify streak service mock doesn't break existing tests

From Story 5.1 (Token Ledger & Balance API):
- Interactive transaction pattern (`prisma.$transaction(async (tx) => { ... })`) is the established approach
- Route registration pattern: import router, add `app.use("/api/v1/path", router)`
- Integration tests directly query DB via `prisma.user.findFirst()` for verification

From Story 3.3 (Mission Completion):
- `completeMission()` is the central injection point — already has token crediting, now add streak update
- The transaction block returns structured data — streak update is a side-effect (fire and don't return)

### Git Intelligence

Recent commit pattern: `feat(domain): description (Story X.Y)`

This story's commit should follow: `feat(gamification): add streak tracking API (Story 5.3)`

Recent commits show:
- `842da50 feat(tokens): add gas-fee mechanic to exercise submissions (Story 5.2)`
- `6e73b3f feat(tokens): add token ledger and balance API (Story 5.1)`

The gamification domain is new — this is the first commit under `feat(gamification):`.

### References

- [Source: _bmad-output/planning-artifacts/epics.md § Epic 5 Story 5.3 — Streak Tracking API]
- [Source: _bmad-output/planning-artifacts/prd.md § FR25 — Daily learning streaks, FR29 — Cumulative progress after streak reset]
- [Source: _bmad-output/planning-artifacts/architecture.md § Data Architecture — NFR15 concurrent safety]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns — thin routes, service layer, co-located tests]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns — API response format]
- [Source: apps/api/src/services/tokenService.ts § creditMissionTokensWithClient — WithClient pattern to follow]
- [Source: apps/api/src/services/curriculumService.ts § completeMission() — transaction integration point]
- [Source: apps/api/prisma/schema.prisma § User model — fields to extend]
- [Source: _bmad-output/implementation-artifacts/5-2-gas-fee-mechanic-api.md — previous story dev notes]
- [Source: _bmad-output/implementation-artifacts/5-1-token-ledger-and-balance-api.md — service pattern reference]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- curriculum.test.ts and curriculumService.test.ts needed streakService mock added after integrating streak into completeMission transaction
- Integration test for totalModulesMastered adjusted: real curriculum has 3 chapters in category 1 (not just 1 as in unit test fixtures), so completing 2 missions doesn't complete any module

### Completion Notes List

- Implemented streak tracking with UTC calendar-day comparison following the WithClient transaction pattern
- Streak update is atomic inside completeMission's $transaction alongside progress and token operations
- getStreak computes totalModulesMastered dynamically from ChapterProgress + content structure (no denormalized counter)
- All 647 tests pass: 216 shared + 377 API unit + 54 integration (0 regressions)

### File List

**New files:**
- `packages/shared/src/schemas/gamification.ts` — Zod schema for StreakStatus
- `packages/shared/src/schemas/gamification.test.ts` — 5 schema validation tests
- `packages/shared/src/types/gamification.ts` — StreakStatus type
- `apps/api/src/services/streakService.ts` — Business logic (updateStreakWithClient, updateStreak, getStreak)
- `apps/api/src/services/streakService.test.ts` — 10 unit tests for streak logic
- `apps/api/src/routes/gamification.ts` — GET /api/v1/gamification/streak endpoint
- `apps/api/src/routes/gamification.test.ts` — 3 route-level tests
- `apps/api/src/__tests__/integration/streak.test.ts` — 9 integration tests
- `apps/api/prisma/migrations/20260310092127_add_streak_fields/migration.sql` — Prisma migration

**Modified files:**
- `apps/api/prisma/schema.prisma` — Added currentStreak, longestStreak, lastMissionCompletedAt to User model
- `apps/api/src/app.ts` — Registered gamificationRouter
- `apps/api/src/services/curriculumService.ts` — Added updateStreakWithClient call in completeMission transaction
- `apps/api/src/services/curriculumService.test.ts` — Added streakService mock
- `apps/api/src/routes/curriculum.test.ts` — Added streakService mock
- `packages/shared/src/index.ts` — Exported streakSchema and StreakStatus

## Change Log

- 2026-03-10: Implemented streak tracking API (Story 5.3) — added streak fields to User model, streak service with UTC calendar-day logic, GET /api/v1/gamification/streak endpoint, integrated streak updates into completeMission transaction
- 2026-03-10: Code review fixes — (M1) added integration test for totalModulesMastered > 0 with full category completion, (M2) wrapped getStreak's 3 DB queries in batch $transaction for read consistency, (L1) tightened streakSchema to use z.string().datetime().nullable()
