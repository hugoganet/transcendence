# Story 5.4: Achievements API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to earn achievements for reaching milestones (module completion, token threshold, streak target),
So that I feel recognized for my progress.

## Acceptance Criteria

1. **Given** defined achievement criteria (module completion, token threshold, streak target),
   **When** a user meets a criterion during mission completion,
   **Then** the achievement is awarded and recorded with `id`, `title`, `description`, `iconUrl`, `earnedAt`,
   **And** duplicate awards are prevented (idempotent — earning same achievement twice is a no-op).

2. **Given** an authenticated user,
   **When** they call `GET /api/v1/gamification/achievements`,
   **Then** all achievements are returned with earned/unearned status,
   **And** earned achievements include the `earnedAt` timestamp,
   **And** unearned achievements have `earnedAt: null`,
   **And** the response is returned in `{ data: T[] }` format.

3. **Given** the achievement system database requirements,
   **When** the Prisma migration runs,
   **Then** the `Achievement` table is created (id, code, title, description, iconUrl, type, threshold, createdAt),
   **And** the `UserAchievement` table is created (id, userId, achievementId, earnedAt),
   **And** `UserAchievement` has a composite unique constraint on `[userId, achievementId]`,
   **And** a seed script populates the `Achievement` table with all predefined achievements.

4. **Given** a user completing a mission that causes a category to be completed,
   **When** the achievement check runs inside the `completeMission` transaction,
   **Then** the corresponding `MODULE_COMPLETION` achievement is awarded (e.g., completing all of Category 1 earns "Blockchain Beginner").

5. **Given** a user whose `tokenBalance` crosses a threshold after mission token crediting,
   **When** the achievement check runs inside the `completeMission` transaction,
   **Then** the corresponding `TOKEN_THRESHOLD` achievement is awarded (e.g., reaching 50 tokens earns "Token Collector").

6. **Given** a user whose `currentStreak` reaches a streak milestone after streak update,
   **When** the achievement check runs inside the `completeMission` transaction,
   **Then** the corresponding `STREAK_TARGET` achievement is awarded (e.g., reaching a 7-day streak earns "Week Warrior").

7. **Given** a new user with no achievements,
   **When** they call `GET /api/v1/gamification/achievements`,
   **Then** all achievements are returned with `earnedAt: null` for each.

## Tasks / Subtasks

- [x] Task 1: Add Achievement and UserAchievement models to Prisma schema (AC: #3)
  - [x] 1.1 Add `Achievement` model to `apps/api/prisma/schema.prisma`:
    - `id String @id @default(cuid())`
    - `code String @unique` (e.g., "BLOCKCHAIN_BEGINNER", "TOKEN_COLLECTOR_50")
    - `title String`
    - `description String`
    - `iconUrl String @default("")`
    - `type String` ("MODULE_COMPLETION", "TOKEN_THRESHOLD", "STREAK_TARGET")
    - `threshold Int` (category index for modules, token count for thresholds, day count for streaks)
    - `createdAt DateTime @default(now())`
    - Add `userAchievements UserAchievement[]` relation
  - [x] 1.2 Add `UserAchievement` model:
    - `id String @id @default(cuid())`
    - `userId String`
    - `achievementId String`
    - `earnedAt DateTime @default(now())`
    - `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`
    - `achievement Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)`
    - `@@unique([userId, achievementId])`
    - `@@index([userId])`
  - [x] 1.3 Add `userAchievements UserAchievement[]` relation to `User` model
  - [x] 1.4 Run `npx prisma migrate dev --name add-achievement-tables` to generate and apply migration
  - [x] 1.5 Add seed data to `apps/api/prisma/seed.ts`: upsert all predefined achievements (use `code` as unique key for idempotent seeding)
  - [x] 1.6 Run seed and verify achievements are in the database

- [x] Task 2: Define achievement constants and seed data (AC: #4, #5, #6)
  - [x] 2.1 Create `packages/shared/src/constants/achievements.ts` with:
    - `AchievementType` enum: `MODULE_COMPLETION`, `TOKEN_THRESHOLD`, `STREAK_TARGET`
    - `ACHIEVEMENT_DEFINITIONS` array defining all achievements with `code`, `title`, `description`, `type`, `threshold`:
      - **MODULE_COMPLETION** (threshold = category index 1-6):
        - `BLOCKCHAIN_BEGINNER` — Complete Category 1 (Blockchain Foundations), threshold: 1
        - `CRYPTO_CURIOUS` — Complete Category 2 (Crypto & Tokens), threshold: 2
        - `WALLET_WIZARD` — Complete Category 3 (Wallets & Gas), threshold: 3
        - `SMART_COOKIE` — Complete Category 4 (Smart Contracts), threshold: 4
        - `NFT_NATIVE` — Complete Category 5 (NFTs & Digital Ownership), threshold: 5
        - `DEFI_EXPLORER` — Complete Category 6 (DeFi & Beyond), threshold: 6
      - **TOKEN_THRESHOLD** (threshold = minimum tokenBalance):
        - `FIRST_TOKENS` — Earn 10 Knowledge Tokens, threshold: 10
        - `TOKEN_COLLECTOR` — Earn 50 Knowledge Tokens, threshold: 50
        - `TOKEN_RICH` — Earn 100 Knowledge Tokens, threshold: 100
      - **STREAK_TARGET** (threshold = minimum currentStreak):
        - `GETTING_STARTED` — Achieve a 3-day streak, threshold: 3
        - `WEEK_WARRIOR` — Achieve a 7-day streak, threshold: 7
        - `DEDICATED_LEARNER` — Achieve a 14-day streak, threshold: 14
        - `MONTHLY_MASTER` — Achieve a 30-day streak, threshold: 30
  - [x] 2.2 Export from `packages/shared/src/index.ts`

- [x] Task 3: Create achievement Zod schemas and types in packages/shared (AC: #2, #7)
  - [x] 3.1 Add to `packages/shared/src/schemas/gamification.ts`:
    - `achievementStatusSchema`: `{ id, code, title, description, iconUrl, type, threshold, earnedAt: string|null }`
    - `achievementsResponseSchema`: `z.array(achievementStatusSchema)`
  - [x] 3.2 Add to `packages/shared/src/types/gamification.ts`:
    - `AchievementStatus` type inferred from schema
  - [x] 3.3 Export new schemas and types from `packages/shared/src/index.ts`
  - [x] 3.4 Add tests for achievement schemas in `packages/shared/src/schemas/gamification.test.ts`

- [x] Task 4: Create achievementService.ts with business logic (AC: #1, #4, #5, #6, #7)
  - [x] 4.1 Create `apps/api/src/services/achievementService.ts`
  - [x] 4.2 Define `DbClient` type: `Pick<typeof prisma, "achievement" | "userAchievement">`
  - [x] 4.3 Implement `checkAndAwardAchievementsWithClient(client: DbClient, userId: string, context: AchievementContext): Promise<AwardedAchievement[]>`
    - `AchievementContext` type: `{ categoryCompleted?: number; tokenBalance: number; currentStreak: number; }`
    - Load all achievements from DB (single query, can cache in production)
    - Load user's already-earned achievement IDs (single query)
    - Check each unearned achievement against context:
      - `MODULE_COMPLETION`: `context.categoryCompleted === achievement.threshold`
      - `TOKEN_THRESHOLD`: `context.tokenBalance >= achievement.threshold`
      - `STREAK_TARGET`: `context.currentStreak >= achievement.threshold`
    - For each newly earned: `createMany` UserAchievement records (batch insert)
    - Return list of newly awarded achievements (for potential notification use)
    - **Idempotent:** `@@unique([userId, achievementId])` prevents duplicates; use `skipDuplicates: true` on createMany
  - [x] 4.4 Implement standalone `checkAndAwardAchievements(userId: string, context: AchievementContext)` wrapper with its own `prisma.$transaction`
  - [x] 4.5 Implement `getAchievements(userId: string): Promise<AchievementStatus[]>`
    - Query all achievements with LEFT JOIN on UserAchievement for the user
    - Return full list with `earnedAt` (null if not earned)
    - Use Prisma `include` with `where` on userAchievements relation
  - [x] 4.6 Add unit tests: `apps/api/src/services/achievementService.test.ts`:
    - checkAndAward with MODULE_COMPLETION context → awards matching achievement
    - checkAndAward with TOKEN_THRESHOLD context → awards all qualifying threshold achievements
    - checkAndAward with STREAK_TARGET context → awards matching streak achievement
    - checkAndAward with no qualifying criteria → awards nothing
    - checkAndAward with already-earned achievement → no duplicate (idempotent)
    - checkAndAward with multiple criteria met at once → awards all qualifying
    - getAchievements for user with no achievements → all earnedAt null
    - getAchievements for user with some achievements → mix of earned and unearned

- [x] Task 5: Add achievements endpoint to gamification routes (AC: #2, #7)
  - [x] 5.1 In `apps/api/src/routes/gamification.ts`, add `GET /achievements`:
    - Auth middleware: `requireAuth`
    - Call `achievementService.getAchievements(userId)`
    - Return in `{ data: AchievementStatus[] }` format
  - [x] 5.2 Add route tests: `apps/api/src/routes/gamification.test.ts`
    - GET /achievements without auth → 401
    - GET /achievements with auth → returns achievement list
    - GET /achievements returns correct structure per achievementStatusSchema

- [x] Task 6: Integrate achievement checking into completeMission transaction (AC: #1, #4, #5, #6)
  - [x] 6.1 In `apps/api/src/services/curriculumService.ts` → `completeMission()`:
    - After `updateStreakWithClient(tx, userId)`, inside the existing `$transaction`:
    - Build `AchievementContext` from transaction-local data:
      - `categoryCompleted`: the category index if a category was just completed (from existing logic), or `undefined`
      - `tokenBalance`: query `tx.user.findUniqueOrThrow({ where: { id: userId }, select: { tokenBalance: true, currentStreak: true } })`
      - `currentStreak`: from same query above
    - Call `checkAndAwardAchievementsWithClient(tx, userId, context)`
    - Add newly awarded achievements to the transaction return value
  - [x] 6.2 Update `completeMission` return type to include `newAchievements?: AwardedAchievement[]`
  - [x] 6.3 Update existing curriculumService unit tests to mock achievementService
  - [x] 6.4 Verify existing curriculum route tests still pass with achievementService mocked

- [x] Task 7: Add integration tests for achievement system (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 7.1 Create `apps/api/src/__tests__/integration/achievements.test.ts`:
    - New user GET achievements → all achievements returned with earnedAt: null
    - Complete enough missions to complete a category → MODULE_COMPLETION achievement earned
    - Complete missions to accumulate tokens past threshold → TOKEN_THRESHOLD achievement earned
    - Complete missions on consecutive days to build streak → STREAK_TARGET achievement earned (simulate via DB update of lastMissionCompletedAt)
    - Complete same category again (idempotent) → no duplicate achievement
    - GET achievements after earning some → mix of earned and unearned
    - GET achievements without auth → 401
  - [x] 7.2 Add achievements to `resetDatabase()` in helpers/db.ts: truncate `UserAchievement` table (do NOT truncate `Achievement` — seeded data)
  - [x] 7.3 Verify all existing tests still pass (`pnpm test` + `pnpm test:integration`)

## Dev Notes

### Critical Architecture Patterns

- **Achievement checking inside completeMission transaction:** The achievement check MUST be inside the same `prisma.$transaction` as mission completion, token crediting, and streak update. This ensures all state (category completion, token balance, streak) is consistent when checking achievement criteria. Use `checkAndAwardAchievementsWithClient(tx, userId, context)` following the established `WithClient` pattern. [Source: architecture.md § Data Architecture — NFR15 concurrent safety]

- **Idempotent achievement awarding:** The `@@unique([userId, achievementId])` constraint on `UserAchievement` prevents duplicate awards at the DB level. Use `createMany` with `skipDuplicates: true` for batch insert safety. This means the service can check all achievements every time without worrying about re-awarding. [Source: tokenService.ts creditMissionTokensWithClient — idempotency pattern]

- **Achievement definitions as seeded DB data + shared constants:** Achievement definitions live in TWO places:
  1. `packages/shared/src/constants/achievements.ts` — TypeScript source of truth for codes, types, thresholds (used by seed script and potentially frontend)
  2. `Achievement` DB table — seeded from the constants, queried at runtime
  This dual approach lets the seed script be the authoritative populator while keeping definitions type-safe and importable. [Source: epics.md § Story 5.4 — "Achievement and UserAchievement tables are created"]

- **Context-based achievement checking:** Instead of querying the DB for current state inside the achievement checker, pass an `AchievementContext` object containing the values computed inside the transaction. This avoids redundant queries and ensures the checker sees the exact state from this transaction. [Source: curriculumService.ts completeMission — transaction returns computed data]

- **Thin route handlers:** The gamification route handler should be thin — validate, call service, respond. All achievement logic lives in `achievementService.ts`. [Source: architecture.md § Implementation Patterns]

- **Standard response format:** Success: `{ data: T[] }`. No pagination needed for achievements (finite set). [Source: architecture.md § Format Patterns]

### Achievement Checking Algorithm

```
checkAndAwardAchievementsWithClient(tx, userId, context):
  1. Query ALL achievements from Achievement table
  2. Query user's existing UserAchievement records (earned achievement IDs)
  3. Build Set of already-earned achievement IDs for O(1) lookup

  4. For each achievement NOT already earned:
     a. CASE type === "MODULE_COMPLETION":
        → Award if context.categoryCompleted === achievement.threshold
     b. CASE type === "TOKEN_THRESHOLD":
        → Award if context.tokenBalance >= achievement.threshold
     c. CASE type === "STREAK_TARGET":
        → Award if context.currentStreak >= achievement.threshold

  5. Batch insert all newly earned achievements:
     → tx.userAchievement.createMany({ data: newAwards, skipDuplicates: true })

  6. Return list of newly awarded achievements (for response/notification)
```

### AchievementContext — What to Pass

```typescript
interface AchievementContext {
  categoryCompleted?: number;  // Category index (1-6) if a category was just completed, undefined otherwise
  tokenBalance: number;        // User's token balance AFTER crediting
  currentStreak: number;       // User's streak AFTER updating
}
```

**Building the context inside completeMission:**

```typescript
// Inside prisma.$transaction(async (tx) => { ... }):

// After creditMissionTokensWithClient and updateStreakWithClient:
const updatedUser = await tx.user.findUniqueOrThrow({
  where: { id: userId },
  select: { tokenBalance: true, currentStreak: true },
});

const achievementContext: AchievementContext = {
  categoryCompleted: categoryCompleted ? categoryIndex : undefined,
  tokenBalance: updatedUser.tokenBalance,
  currentStreak: updatedUser.currentStreak,
};

const newAchievements = await checkAndAwardAchievementsWithClient(tx, userId, achievementContext);
```

### Predefined Achievement Definitions

| Code | Title | Type | Threshold | Description |
|------|-------|------|-----------|-------------|
| `BLOCKCHAIN_BEGINNER` | Blockchain Beginner | MODULE_COMPLETION | 1 | Complete Category 1: Blockchain Foundations |
| `CRYPTO_CURIOUS` | Crypto Curious | MODULE_COMPLETION | 2 | Complete Category 2: Crypto & Tokens |
| `WALLET_WIZARD` | Wallet Wizard | MODULE_COMPLETION | 3 | Complete Category 3: Wallets & Gas |
| `SMART_COOKIE` | Smart Cookie | MODULE_COMPLETION | 4 | Complete Category 4: Smart Contracts |
| `NFT_NATIVE` | NFT Native | MODULE_COMPLETION | 5 | Complete Category 5: NFTs & Digital Ownership |
| `DEFI_EXPLORER` | DeFi Explorer | MODULE_COMPLETION | 6 | Complete Category 6: DeFi & Beyond |
| `FIRST_TOKENS` | First Tokens | TOKEN_THRESHOLD | 10 | Earn 10 Knowledge Tokens |
| `TOKEN_COLLECTOR` | Token Collector | TOKEN_THRESHOLD | 50 | Earn 50 Knowledge Tokens |
| `TOKEN_RICH` | Token Rich | TOKEN_THRESHOLD | 100 | Earn 100 Knowledge Tokens |
| `GETTING_STARTED` | Getting Started | STREAK_TARGET | 3 | Achieve a 3-day learning streak |
| `WEEK_WARRIOR` | Week Warrior | STREAK_TARGET | 7 | Achieve a 7-day learning streak |
| `DEDICATED_LEARNER` | Dedicated Learner | STREAK_TARGET | 14 | Achieve a 14-day learning streak |
| `MONTHLY_MASTER` | Monthly Master | STREAK_TARGET | 30 | Achieve a 30-day learning streak |

### Category Index Mapping

The `threshold` for MODULE_COMPLETION achievements maps to category indices in the curriculum:
- Category 1: Blockchain Foundations (chapters 1.1, 1.2, 1.3)
- Category 2: Crypto & Tokens (chapters 2.1, 2.2, 2.3)
- Category 3: Wallets & Gas (chapters 3.1, 3.2, 3.3)
- Category 4: Smart Contracts (chapters 4.1, 4.2, 4.3)
- Category 5: NFTs & Digital Ownership (chapters 5.1, 5.2, 5.3)
- Category 6: DeFi & Beyond (chapters 6.1, 6.2, 6.3)

The existing `completeMission()` already computes `categoryCompleted` (boolean indicating if all chapters in a category are now done). The category index can be extracted from the mission ID prefix (e.g., mission "3.2.1" → category 3).

### Prisma Schema Additions

```prisma
model Achievement {
  id          String   @id @default(cuid())
  code        String   @unique
  title       String
  description String
  iconUrl     String   @default("")
  type        String   // "MODULE_COMPLETION", "TOKEN_THRESHOLD", "STREAK_TARGET"
  threshold   Int
  createdAt   DateTime @default(now())

  userAchievements UserAchievement[]
}

model UserAchievement {
  id            String   @id @default(cuid())
  userId        String
  achievementId String
  earnedAt      DateTime @default(now())

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  achievement Achievement @relation(fields: [achievementId], references: [id], onDelete: Cascade)

  @@unique([userId, achievementId])
  @@index([userId])
}
```

### API Endpoint Design

```
GET /api/v1/gamification/achievements
  Auth: Required (session cookie)

  200 Response:
  {
    "data": [
      {
        "id": "clxyz...",
        "code": "BLOCKCHAIN_BEGINNER",
        "title": "Blockchain Beginner",
        "description": "Complete Category 1: Blockchain Foundations",
        "iconUrl": "",
        "type": "MODULE_COMPLETION",
        "threshold": 1,
        "earnedAt": "2026-03-10T14:30:00.000Z"
      },
      {
        "id": "clxyz...",
        "code": "CRYPTO_CURIOUS",
        "title": "Crypto Curious",
        "description": "Complete Category 2: Crypto & Tokens",
        "iconUrl": "",
        "type": "MODULE_COMPLETION",
        "threshold": 2,
        "earnedAt": null
      }
    ]
  }

  401: { error: { code: "UNAUTHORIZED", message } }
```

### completeMission Return Type Update

The `completeMission` return already includes various fields. Add `newAchievements` to signal the frontend:

```typescript
interface CompleteMissionResult {
  missionId: string;
  status: "completed";
  chapterCompleted: boolean;
  categoryCompleted: boolean;
  tokensEarned: number;
  newBalance: number;
  nextMissionId: string | null;
  completionPercentage: number;
  newAchievements: Array<{ code: string; title: string; description: string; }>;  // NEW
}
```

This lets the frontend trigger achievement celebration UI without a separate API call.

### Existing Code to Modify

1. **`apps/api/prisma/schema.prisma`** — Add `Achievement` and `UserAchievement` models, add `userAchievements` relation to `User` model.

2. **`apps/api/prisma/seed.ts`** — Add achievement seeding using `ACHIEVEMENT_DEFINITIONS` from shared constants.

3. **`apps/api/src/services/curriculumService.ts` → `completeMission()`** — Add `checkAndAwardAchievementsWithClient(tx, userId, context)` call inside the existing `$transaction`, after `updateStreakWithClient`. Build context from transaction-local data. [Source: apps/api/src/services/curriculumService.ts — inside tx block]

4. **`apps/api/src/routes/gamification.ts`** — Add `GET /achievements` endpoint.

5. **`packages/shared/src/schemas/gamification.ts`** — Add `achievementStatusSchema`.

6. **`packages/shared/src/types/gamification.ts`** — Add `AchievementStatus` type.

7. **`packages/shared/src/index.ts`** — Export new schemas, types, and constants.

8. **`apps/api/src/__tests__/integration/helpers/db.ts`** — Add `UserAchievement` to `resetDatabase()` truncation (NOT `Achievement` — seeded data).

### Existing Code to Reuse

1. **`creditMissionTokensWithClient(client, ...)` / `updateStreakWithClient(client, ...)` pattern** — Same `WithClient` + standalone wrapper pattern for transaction embedding. [Source: tokenService.ts, streakService.ts]

2. **`DbClient` type alias** — Reuse the pattern, adapted for achievement service needs: `Pick<typeof prisma, "achievement" | "userAchievement" | "user" | "chapterProgress">`.

3. **`AppError` class** — For typed errors if needed. [Source: apps/api/src/utils/AppError.ts]

4. **`requireAuth` middleware** — Session authentication for the gamification route. [Source: apps/api/src/middleware/auth.ts]

5. **Integration test helpers** — `createAndLoginUser()`, `resetDatabase()`, `testPrisma` from `apps/api/src/__tests__/integration/helpers/`. [Source: Story 4.0]

6. **`getContent()` content loader** — For determining category structure (needed for MODULE_COMPLETION validation). [Source: apps/api/src/utils/contentLoader.ts]

7. **`completeMission()` transaction pattern** — The existing transaction in curriculumService that already wraps token crediting and streak update. Add achievement check in the same transaction. [Source: curriculumService.ts]

8. **Gamification route file** — Already exists with streak endpoint; add achievements endpoint to same router. [Source: apps/api/src/routes/gamification.ts]

### Edge Cases to Handle

1. **Multiple achievements earned simultaneously:** A single mission completion could trigger a MODULE_COMPLETION + TOKEN_THRESHOLD + STREAK_TARGET all at once. The batch insert via `createMany` handles this efficiently.

2. **Achievement definitions not yet seeded:** If the `Achievement` table is empty (e.g., migration ran but seed didn't), `getAchievements` returns an empty array and `checkAndAward` awards nothing. This is safe — no crash.

3. **Concurrent mission completions:** Two rapid completions for the same user. The `@@unique([userId, achievementId])` constraint + `skipDuplicates: true` prevents double-awarding. Both transactions can safely check and award independently.

4. **Token threshold edge case:** User has 45 tokens, earns 10 from mission completion → balance is 55. Should earn both "First Tokens" (10) and "Token Collector" (50) if not already earned. The `>=` comparison handles this correctly — all qualifying thresholds are checked.

5. **Streak achievement after gap:** User had a 10-day streak, missed a day, now back to 1-day streak. Previous GETTING_STARTED (3-day) achievement is retained. No un-awarding. Achievements are permanent.

6. **Category completion detection:** The existing `completeMission()` already computes whether a category was just completed. Extract the category index from the mission ID (first digit of "X.Y.Z" format). Pass as `context.categoryCompleted`.

7. **resetDatabase in integration tests:** Must truncate `UserAchievement` but NOT `Achievement` (seeded reference data). If achievements are missing, seed must run before integration tests. Add seed execution to test setup if not already present.

8. **Seed idempotency:** Use `upsert` with `code` as unique identifier so the seed can run multiple times without duplicating achievements. This follows the pattern of safe re-runnable seeds.

### Performance Budget

Target: <200ms end-to-end.

| Operation | Estimated Time |
|-----------|---------------|
| Auth middleware | ~1ms |
| Query all achievements (~13 rows) | ~2ms |
| Query user's earned achievements | ~2ms |
| Build response | ~0.1ms |
| **Total server time (GET achievements)** | **~5ms** |

For achievement CHECK (inside completeMission transaction):

| Operation | Estimated Time |
|-----------|---------------|
| Query all achievements (~13 rows) | ~2ms |
| Query user's earned achievements | ~2ms |
| Criteria comparison (in-memory) | ~0.1ms |
| createMany new awards (0-3 typically) | ~3-5ms |
| **Total added to completeMission** | **~7-10ms** |

Well within the 200ms budget. Total completeMission overhead is now ~5ms (tokens) + ~5ms (streak) + ~10ms (achievements) = ~20ms added.

### Project Structure Notes

**New files:**
```
packages/shared/src/constants/achievements.ts          # Achievement definitions + types
apps/api/src/services/achievementService.ts            # Business logic
apps/api/src/services/achievementService.test.ts       # Unit tests (co-located)
apps/api/src/__tests__/integration/achievements.test.ts # Integration tests
apps/api/prisma/migrations/XXXXXX_add_achievement_tables/ # Prisma migration
```

**Modified files:**
```
apps/api/prisma/schema.prisma                           # Add Achievement + UserAchievement models + User relation
apps/api/prisma/seed.ts                                 # Add achievement seeding
apps/api/src/routes/gamification.ts                     # Add GET /achievements endpoint
apps/api/src/routes/gamification.test.ts                # Add achievement route tests
apps/api/src/services/curriculumService.ts              # Add checkAndAwardAchievementsWithClient to completeMission()
apps/api/src/services/curriculumService.test.ts         # Add achievementService mock
apps/api/src/routes/curriculum.test.ts                  # Verify no regression with achievementService mock
packages/shared/src/schemas/gamification.ts             # Add achievementStatusSchema
packages/shared/src/schemas/gamification.test.ts        # Add achievement schema tests
packages/shared/src/types/gamification.ts               # Add AchievementStatus type
packages/shared/src/index.ts                            # Export new schemas/types/constants
apps/api/src/__tests__/integration/helpers/db.ts        # Add UserAchievement to resetDatabase()
```

### Previous Story Intelligence

From Story 5.3 (Streak Tracking API):
- `updateStreakWithClient(tx, ...)` pattern inside `completeMission`'s transaction — reuse same approach for `checkAndAwardAchievementsWithClient`
- `DbClient` type needs only the Prisma models accessed — for achievements: `achievement`, `userAchievement`, `user`, `chapterProgress`
- All 647 tests passing at Story 5.3 completion (216 shared + 377 API unit + 54 integration) — baseline to maintain
- `curriculumService.test.ts` and `curriculum.test.ts` already mock both `tokenService` and `streakService` — will also need achievementService mock
- Gamification routes already registered in `app.ts` at `/api/v1/gamification` — just add the new endpoint to the existing router

From Story 5.2 (Gas-Fee Mechanic API):
- `deductGasFeeWithClient(tx, ...)` pattern works well — same WithClient dual-function approach
- `createMany` with `skipDuplicates: true` is preferred for batch inserts — Prisma supports this natively

From Story 5.1 (Token Ledger & Balance API):
- Interactive transaction pattern (`prisma.$transaction(async (tx) => { ... })`) is the established approach
- Integration tests directly query DB via `prisma.user.findFirst()` and relation queries for verification

### Git Intelligence

Recent commit pattern: `feat(domain): description (Story X.Y)`

This story's commit should follow: `feat(gamification): add achievements API (Story 5.4)`

Recent commits show:
- `0aa1e9b feat(gamification): add streak tracking API (Story 5.3)`
- `842da50 feat(tokens): add gas-fee mechanic to exercise submissions (Story 5.2)`
- `6e73b3f feat(tokens): add token ledger and balance API (Story 5.1)`

The gamification domain was established in Story 5.3 — this story continues it.

### References

- [Source: _bmad-output/planning-artifacts/epics.md § Epic 5 Story 5.4 — Achievements API]
- [Source: _bmad-output/planning-artifacts/prd.md § FR28 — Achievements for modules, token thresholds, streak targets]
- [Source: _bmad-output/planning-artifacts/architecture.md § Data Architecture — NFR15 concurrent safety]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns — thin routes, service layer, co-located tests]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns — API response format]
- [Source: _bmad-output/planning-artifacts/curriculum-roadmap.md § 6 categories structure]
- [Source: apps/api/src/services/tokenService.ts § creditMissionTokensWithClient — WithClient pattern to follow]
- [Source: apps/api/src/services/streakService.ts § updateStreakWithClient — WithClient pattern to follow]
- [Source: apps/api/src/services/curriculumService.ts § completeMission() — transaction integration point]
- [Source: apps/api/src/routes/gamification.ts § existing gamification routes]
- [Source: apps/api/prisma/schema.prisma § User model — relation to add]
- [Source: _bmad-output/implementation-artifacts/5-3-streak-tracking-api.md — previous story dev notes]
- [Source: _bmad-output/implementation-artifacts/5-2-gas-fee-mechanic-api.md — WithClient pattern reference]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Integration tests initially failed because Achievement seed data was not populated in the test database. Fixed by adding `seedAchievements()` to `setup-integration.ts` global setup using raw SQL INSERT with ON CONFLICT for idempotency.
- `DbClient` type simplified to `Pick<typeof prisma, "achievement" | "userAchievement">` (no need for `user` or `chapterProgress` since achievement checking only accesses achievement-related tables).
- Existing `curriculumService.test.ts` and `curriculum.test.ts` needed `user.findUniqueOrThrow` mock added and `achievementService` mock because `completeMission` now queries user state and calls achievement checking inside the transaction.

### Completion Notes List

- All 7 tasks completed with 13 achievement definitions (6 MODULE_COMPLETION + 3 TOKEN_THRESHOLD + 4 STREAK_TARGET)
- Achievement checking runs inside completeMission transaction (atomic with tokens, streak, progress)
- Idempotent awarding via @@unique constraint + skipDuplicates
- `newAchievements` field added to CompleteMissionResponse for frontend celebration UI
- All acceptance criteria verified through integration tests
- 258 shared tests passing, 389 API unit tests passing, 63 integration tests passing (8 new)

### Change Log

- 2026-03-10: Implemented achievements API — Prisma schema, seed, shared constants/schemas/types, achievementService, GET /achievements endpoint, completeMission integration, unit + integration tests
- 2026-03-10: Code review fixes — strengthened achievementStatusSchema type field to z.enum, added achievement context verification + newAchievements assertions to curriculumService.test.ts, replaced raw SQL seeding in setup-integration.ts with Prisma seed script reuse

### File List

**New files:**
- packages/shared/src/constants/achievements.ts
- apps/api/src/services/achievementService.ts
- apps/api/src/services/achievementService.test.ts
- apps/api/src/__tests__/integration/achievements.test.ts
- apps/api/prisma/migrations/20260310100647_add_achievement_tables/migration.sql

**Modified files:**
- apps/api/prisma/schema.prisma
- apps/api/prisma/seed.ts
- apps/api/src/routes/gamification.ts
- apps/api/src/routes/gamification.test.ts
- apps/api/src/services/curriculumService.ts
- apps/api/src/services/curriculumService.test.ts
- apps/api/src/routes/curriculum.test.ts
- apps/api/src/__tests__/integration/helpers/db.ts
- apps/api/src/__tests__/setup-integration.ts
- packages/shared/src/schemas/gamification.ts
- packages/shared/src/schemas/gamification.test.ts
- packages/shared/src/types/gamification.ts
- packages/shared/src/types/progress.ts
- packages/shared/src/index.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/5-4-achievements-api.md
