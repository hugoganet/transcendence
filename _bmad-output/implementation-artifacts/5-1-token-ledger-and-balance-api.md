# Story 5.1: Token Ledger & Balance API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to earn Knowledge Tokens from completing missions and see my balance,
So that I experience the platform's currency system that mirrors real crypto tokens.

## Acceptance Criteria

1. **Given** an authenticated user completing a mission,
   **When** the mission completion endpoint (`POST /api/v1/curriculum/missions/:missionId/complete`) is called,
   **Then** Knowledge Tokens are credited to the user's balance,
   **And** a `TokenTransaction` record is created with: userId, amount, type `EARN`, missionId, description, createdAt,
   **And** the updated `tokenBalance` on the User model reflects the increment,
   **And** duplicate token earning is prevented (completing the same mission twice does NOT double-credit).

2. **Given** an authenticated user,
   **When** they call `GET /api/v1/tokens/balance`,
   **Then** the response includes: tokenBalance (net), totalEarned (sum of EARN), totalSpent (sum of GAS_SPEND), lastEarned (ISO timestamp or null),
   **And** the response is returned within <200ms (NFR1).

3. **Given** an authenticated user,
   **When** they call `GET /api/v1/tokens/history?page=1&pageSize=20`,
   **Then** a paginated list of token transactions is returned ordered by createdAt DESC,
   **And** each entry includes: id, amount, type, missionId, exerciseId, description, createdAt,
   **And** a `meta` object includes: page, pageSize, total.

4. **Given** the token system database requirements,
   **When** the Prisma migration runs,
   **Then** a `TokenTransaction` table is created with: id (cuid), userId, amount (Int), type (String), missionId (String?), exerciseId (String?), description (String), createdAt,
   **And** the `User` model gains a `tokenBalance` field (Int, default 0),
   **And** indexes exist on `(userId, type)` and `(userId, createdAt)`,
   **And** no data corruption occurs under concurrent transactions (use Prisma atomic `increment`).

## Tasks / Subtasks

- [x] Task 1: Add TokenTransaction model + User.tokenBalance to Prisma schema (AC: #4)
  - [x] 1.1 Add `tokenBalance Int @default(0)` to User model in `apps/api/prisma/schema.prisma`
  - [x] 1.2 Add `tokenTransactions TokenTransaction[]` relation to User model
  - [x] 1.3 Add `TokenTransaction` model: id (cuid), userId, amount (Int), type (String), missionId (String?), exerciseId (String?), description (String), createdAt
  - [x] 1.4 Add `@@index([userId, type])` and `@@index([userId, createdAt])` to TokenTransaction
  - [x] 1.5 Run `npx prisma migrate dev --name add-token-transaction` to generate and apply migration
  - [x] 1.6 Update `resetDatabase()` in `apps/api/src/__tests__/integration/helpers/db.ts` to truncate `TokenTransaction` table

- [x] Task 2: Create token Zod schemas in packages/shared (AC: #2, #3)
  - [x] 2.1 Create `packages/shared/src/schemas/token.ts` with:
    - `tokenBalanceSchema`: `{ tokenBalance: number, totalEarned: number, totalSpent: number, lastEarned: string|null }`
    - `tokenTransactionSchema`: `{ id, amount, type: enum("EARN","GAS_SPEND"), missionId, exerciseId, description, createdAt }`
    - `tokenHistoryQuerySchema`: `{ page: coerce.number.default(1), pageSize: coerce.number.default(20).max(100) }`
    - `paginationMetaSchema`: `{ page, pageSize, total }`
  - [x] 2.2 Create `packages/shared/src/types/token.ts` with inferred types
  - [x] 2.3 Export new schemas and types from `packages/shared/src/index.ts`
  - [x] 2.4 Add token constants to `packages/shared/src/constants/tokens.ts`: `MISSION_COMPLETION_TOKEN_REWARD = 10`, `DEFAULT_PAGE_SIZE = 20`, `MAX_PAGE_SIZE = 100`
  - [x] 2.5 Add tests for all new schemas in `packages/shared/src/schemas/token.test.ts`

- [x] Task 3: Create tokenService.ts with business logic (AC: #1, #2, #3)
  - [x] 3.1 Create `apps/api/src/services/tokenService.ts`
  - [x] 3.2 Implement `creditMissionTokens(userId, missionId, missionTitle)`:
    - Check if tokens were already credited for this mission (query TokenTransaction for EARN + missionId)
    - If already credited, return without action (idempotent)
    - Use Prisma transaction: create TokenTransaction + atomically increment User.tokenBalance
    - Amount: `MISSION_COMPLETION_TOKEN_REWARD` constant
    - Description: `"Completed mission: ${missionTitle}"`
  - [x] 3.3 Implement `getTokenBalance(userId)`:
    - Query User.tokenBalance for net balance
    - Aggregate TokenTransaction by type for totalEarned / totalSpent
    - Get most recent EARN transaction's createdAt for lastEarned
    - Return combined result
  - [x] 3.4 Implement `getTokenHistory(userId, page, pageSize)`:
    - Query TokenTransaction where userId, ordered by createdAt DESC
    - Use Prisma `skip` + `take` for pagination
    - Count total for meta
    - Return transactions + total
  - [x] 3.5 Add comprehensive unit tests: `apps/api/src/services/tokenService.test.ts`

- [x] Task 4: Create tokens route with balance and history endpoints (AC: #2, #3)
  - [x] 4.1 Create `apps/api/src/routes/tokens.ts`
  - [x] 4.2 Implement `GET /api/v1/tokens/balance`:
    - Auth middleware required
    - Call tokenService.getTokenBalance()
    - Return in standard `{ data: T }` format
  - [x] 4.3 Implement `GET /api/v1/tokens/history`:
    - Auth middleware required
    - Validate query params with Zod (tokenHistoryQuerySchema)
    - Call tokenService.getTokenHistory()
    - Return in `{ data: T[], meta: {...} }` format
  - [x] 4.4 Register routes in `apps/api/src/app.ts`: `app.use("/api/v1/tokens", tokensRouter)`
  - [x] 4.5 Add route tests: `apps/api/src/routes/tokens.test.ts`

- [x] Task 5: Integrate token earning into mission completion (AC: #1)
  - [x] 5.1 In `apps/api/src/services/curriculumService.ts` → `completeMission()`:
    - After marking mission COMPLETED, call `creditMissionTokens(userId, missionId, missionTitle)`
    - Get mission title from content loader: `getContent().missions.get("en")?.[missionId]?.title`
    - Import from tokenService
  - [x] 5.2 Update existing curriculumService unit tests to mock tokenService
  - [x] 5.3 Verify existing curriculum integration tests still pass (token earning is a side-effect)

- [x] Task 6: Add integration tests for token system (AC: #1, #2, #3, #4)
  - [x] 6.1 Create `apps/api/src/__tests__/integration/token-system.test.ts`:
    - Complete mission → token balance increases by MISSION_COMPLETION_TOKEN_REWARD
    - Complete mission → TokenTransaction EARN record in real DB
    - Complete same mission twice → only 1 token credit (409 from completeMission prevents duplicate)
    - GET /tokens/balance → correct totals (earned, spent=0, net)
    - GET /tokens/history → paginated list with correct entries
    - GET /tokens/history?page=2 → second page of results
    - GET /tokens/balance without auth → 401
    - GET /tokens/history without auth → 401
    - GET /tokens/history?pageSize=200 → 400 INVALID_INPUT (exceeds max)
  - [x] 6.2 Verify all existing tests still pass (`pnpm test` + `pnpm test:integration`)

## Dev Notes

### Critical Architecture Patterns

- **Atomic balance updates:** NEVER read-modify-write `tokenBalance` manually. Always use Prisma's `prisma.user.update({ data: { tokenBalance: { increment: amount } } })` wrapped in a `prisma.$transaction()` alongside the TokenTransaction creation. This prevents race conditions under concurrent requests. [Source: architecture.md § Data Architecture — NFR15 concurrent safety]

- **Thin route handlers:** Route validates input (Zod), calls service, returns response. ALL business logic lives in `tokenService.ts`. Route handlers NEVER access Prisma directly. [Source: architecture.md § Implementation Patterns]

- **Standard response format:** Success: `{ data: T }` or `{ data: T[], meta: { page, pageSize, total } }`. Error: `{ error: { code: UPPER_SNAKE_CASE, message: string, details?: object } }`. [Source: architecture.md § Format Patterns]

- **Idempotent token earning:** `creditMissionTokens()` checks for existing EARN transaction before crediting. This is a safety net — `completeMission()` already rejects duplicate completions with 409, but the token service should also be safe to call twice. [Source: PRD § Token Economy — no double-crediting]

- **Co-located tests:** Unit tests next to source files. Integration tests in `src/__tests__/integration/`. [Source: architecture.md § Structure Patterns]

- **Extract patterns at 2nd occurrence:** If pagination logic is duplicated from another service, extract it into a shared helper. [Source: epic-3-retro — team agreement]

### Token Economy Design

```
Token Type: Knowledge Tokens
Earning: +MISSION_COMPLETION_TOKEN_REWARD (10) per completed mission
Spending: -GAS_FEE_PER_SUBMISSION per exercise submission (Story 5.2, NOT this story)
Balance: Can go negative mid-mission (Story 5.2), but cannot start new mission while in debt
Progressive reveal: Tokens become visible at mission 2.2.4 (tokensRevealed)
                    BUT tokens are earned from mission 1.1.1 onward (silently accumulated)
```

### Progressive Reveal Context

Token earning starts immediately (mission 1.1.1) but is NOT shown to users until mission 2.2.4 (`progressiveReveal.mechanic === "tokensRevealed"`). This story implements the backend earning + tracking. The frontend reveal is handled by Story 5.6 (Progressive Mechanic Reveal API) and Story 5.7 (Frontend).

Progressive reveal moments in `content/structure.json`:
- `2.2.4` — `tokensRevealed`: Knowledge Tokens become visible
- `3.1.4` — `walletRevealed`: Profile transforms into wallet interface
- `3.3.3` — `gasRevealed`: Platform gas costs begin (Story 5.2 activates here)
- `6.3.4` — `dashboardRevealed`: Complete stats unlocked

### Prisma Schema Addition

```prisma
model TokenTransaction {
  id          String   @id @default(cuid())
  userId      String
  amount      Int      // Positive for EARN, negative for GAS_SPEND
  type        String   // "EARN" or "GAS_SPEND"
  missionId   String?  // Set for EARN transactions
  exerciseId  String?  // Set for GAS_SPEND transactions (Story 5.2)
  description String   // Human-readable, e.g. "Completed mission: Who Do You Trust?"
  createdAt   DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, type])
  @@index([userId, createdAt])
}
```

Add to User model:
```prisma
tokenBalance       Int                @default(0)
tokenTransactions  TokenTransaction[]
```

### API Endpoint Design

```
GET /api/v1/tokens/balance
  Auth: Required (session cookie)

  200 Response:
  {
    "data": {
      "tokenBalance": 150,
      "totalEarned": 200,
      "totalSpent": 50,
      "lastEarned": "2026-03-10T14:30:00.000Z"  // null if no earnings
    }
  }

  401: { error: { code: "UNAUTHORIZED", message } }


GET /api/v1/tokens/history?page=1&pageSize=20
  Auth: Required (session cookie)
  Query: page (int, default 1, min 1), pageSize (int, default 20, min 1, max 100)

  200 Response:
  {
    "data": [
      {
        "id": "cuid",
        "amount": 10,
        "type": "EARN",
        "missionId": "1.1.1",
        "exerciseId": null,
        "description": "Completed mission: Who Do You Trust?",
        "createdAt": "2026-03-10T14:30:00.000Z"
      }
    ],
    "meta": {
      "page": 1,
      "pageSize": 20,
      "total": 47
    }
  }

  401: { error: { code: "UNAUTHORIZED", message } }
  400: { error: { code: "INVALID_INPUT", message, details } }
```

### Existing Code to Reuse

1. **`completeMission()` in `curriculumService.ts`** — Integration point. After marking mission COMPLETED (line ~400), call `creditMissionTokens()`. The function already has `missionId` and access to content for the title. [Source: apps/api/src/services/curriculumService.ts]

2. **`getContent()` — Content loader singleton.** Access mission title via `getContent().missions.get("en")?.[missionId]?.title`. [Source: apps/api/src/utils/contentLoader.ts]

3. **`AppError` class** — For typed errors with HTTP status codes. [Source: apps/api/src/utils/AppError.ts]

4. **`requireAuth` middleware** — Session authentication. [Source: apps/api/src/middleware/auth.ts]

5. **`validate` middleware** — Zod request body/params/query validation. For query params, use `validate({ query: tokenHistoryQuerySchema })`. The middleware puts parsed query in `res.locals.query`. [Source: apps/api/src/middleware/validate.ts]

6. **Integration test helpers** — `createAndLoginUser()`, `resetDatabase()`, `testPrisma` from `apps/api/src/__tests__/integration/helpers/`. [Source: Story 4.0]

7. **Pagination pattern** — No existing pagination endpoint yet in this project. This is the FIRST paginated endpoint. Establish the pattern here for reuse in Stories 5.4 (achievements), 5.5 (leaderboard), etc.

### Edge Cases to Handle

1. **Concurrent mission completions:** Two simultaneous complete requests for different missions should both credit tokens correctly. Prisma `$transaction` with atomic `increment` prevents race conditions.

2. **Idempotent earning:** `creditMissionTokens()` must be safe to call multiple times. Query for existing EARN transaction with matching userId + missionId before inserting. Note: `completeMission()` already returns 409 for duplicates, so this is a safety net.

3. **Zero balance on new user:** `tokenBalance` defaults to 0. `getTokenBalance()` should handle users with no transactions (totalEarned=0, totalSpent=0, lastEarned=null).

4. **Pagination edge cases:** page beyond total results → return empty array with correct total. pageSize=0 → invalid (min 1). pageSize=101 → invalid (max 100).

5. **Transaction type validation:** `type` is stored as String, not enum, for future extensibility (Story 5.2 adds GAS_SPEND). Validate at the service/route level, not the schema level.

6. **Description encoding:** Description is plain text, no HTML/markdown. Max length not enforced at DB level but kept short in practice (~100 chars).

### Performance Budget

Target: <200ms end-to-end (NFR1).

| Operation | Estimated Time |
|-----------|---------------|
| Auth middleware | ~1ms |
| Query User.tokenBalance | ~2ms |
| Aggregate EARN/GAS_SPEND sums | ~5-10ms |
| Paginate history (20 rows) | ~5-10ms |
| Prisma $transaction (insert + update) | ~10-15ms |
| **Total server time** | **~20-30ms** |

Well within the 200ms budget.

### Project Structure Notes

**New files:**
```
packages/shared/src/schemas/token.ts               # Zod schemas
packages/shared/src/schemas/token.test.ts           # Schema tests
packages/shared/src/types/token.ts                  # TypeScript types
packages/shared/src/constants/tokens.ts             # Token constants
apps/api/src/services/tokenService.ts               # Business logic
apps/api/src/services/tokenService.test.ts          # Unit tests (co-located)
apps/api/src/routes/tokens.ts                       # Route handlers
apps/api/src/routes/tokens.test.ts                  # Route tests (co-located)
apps/api/src/__tests__/integration/token-system.test.ts  # Integration tests
```

**Modified files:**
```
apps/api/prisma/schema.prisma                       # Add TokenTransaction + User.tokenBalance
apps/api/src/app.ts                                 # Register tokens routes
apps/api/src/services/curriculumService.ts           # Add token earning to completeMission()
apps/api/src/services/curriculumService.test.ts      # Mock tokenService in existing tests
apps/api/src/__tests__/integration/helpers/db.ts     # Add TokenTransaction to truncation
packages/shared/src/index.ts                        # Export new schemas/types/constants
```

### Previous Story Intelligence

From Story 4.1 (Exercise Submission API):
- 20 unit tests + 11 route tests + 13 integration tests
- Integration tests use real DB + Redis, sequential file execution (`fileParallelism: false`)
- `resetDatabase()` truncates tables AND flushes Redis sessions
- Zod discriminated unions work well for type-specific validation
- Service functions are pure business logic, routes are thin wrappers
- `validate({ query: schema })` stores parsed result in `res.locals.query`

From Story 3.3 (Mission Completion):
- `completeMission()` is the injection point for token earning
- Function already validates mission exists, checks access status, prevents duplicate completion
- Uses `prisma.userProgress.upsert()` for atomic state transitions
- Returns `CompleteMissionResponse` with status, nextMissionId, etc.

### Git Intelligence

Recent commits follow `feat(domain):` convention:
- `feat(exercises): add exercise submission API and feedback engine (Story 4.1)`
- `test(api): add integration testing infrastructure with real DB and Redis (Story 4.0)`
- `feat(curriculum): add learning chain visualization API (Story 3.5)`

This story's commit should follow: `feat(tokens): add token ledger and balance API (Story 5.1)`

### References

- [Source: _bmad-output/planning-artifacts/epics.md § Epic 5 Story 5.1 — Token Ledger & Balance API]
- [Source: _bmad-output/planning-artifacts/prd.md § FR24 — Earn Knowledge Tokens, FR30 — View balance/history]
- [Source: _bmad-output/planning-artifacts/architecture.md § Data Architecture — NFR15 concurrent safety]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns — thin routes, service layer]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns — API response format, pagination]
- [Source: _bmad-output/planning-artifacts/curriculum-roadmap.md § Progressive Reveal — tokens at 2.2.4]
- [Source: content/structure.json § progressiveReveal flags — tokensRevealed at 2.2.4, gasRevealed at 3.3.3]
- [Source: apps/api/src/services/curriculumService.ts § completeMission() — integration point for token earning]
- [Source: apps/api/src/services/exerciseService.ts § submitExercise() — latest service layer pattern]
- [Source: apps/api/src/middleware/validate.ts § validate({ query }) — query param validation pattern]
- [Source: _bmad-output/implementation-artifacts/4-1-exercise-submission-api-and-feedback-engine.md — previous story dev notes]
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-03-09.md — extract at 2nd occurrence, mandatory reviews]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prisma client needed regeneration after migration for integration tests to recognize `tokenTransaction` model
- curriculum.test.ts route tests required `tokenService` mock after `completeMission()` integration
- tokenService unit test needed fix: `expect.anything()` does not match `undefined` for batch transaction args

### Completion Notes List

- Task 1: Added `TokenTransaction` model and `tokenBalance` field to Prisma schema with indexes, migration applied successfully
- Task 2: Created Zod schemas (`tokenBalanceSchema`, `tokenTransactionSchema`, `tokenHistoryQuerySchema`, `paginationMetaSchema`), types, and constants in packages/shared with 18 schema tests
- Task 3: Implemented `creditMissionTokens()` (idempotent, atomic), `getTokenBalance()`, `getTokenHistory()` in tokenService with 9 unit tests
- Task 4: Created `/api/v1/tokens/balance` and `/api/v1/tokens/history` endpoints with thin route handlers, 7 route tests
- Task 5: Integrated `creditMissionTokens()` into `completeMission()` in curriculumService, updated all dependent test mocks
- Task 6: Created 12 integration tests covering full token earning flow, balance/history APIs, auth guards, and pagination validation
- All 353 unit tests + 206 shared tests + 37 integration tests pass with 0 regressions

### Change Log

- 2026-03-10: Implemented Token Ledger & Balance API (Story 5.1) — TokenTransaction model, token earning on mission completion, balance and history endpoints with pagination
- 2026-03-10: [Code Review] Fixed 2 HIGH + 3 MEDIUM issues:
  - H1: Moved creditMissionTokens inside completeMission's interactive transaction (prevents silent token loss)
  - H2: Refactored creditMissionTokens to use interactive transaction (atomic check-then-write)
  - M1: Fixed misleading unit test to actually verify token amount and description
  - M2: Added @@unique([userId, missionId, type]) constraint on TokenTransaction (defense-in-depth)
  - M3: Added sprint-status.yaml to File List

### File List

**New files:**
- packages/shared/src/schemas/token.ts
- packages/shared/src/schemas/token.test.ts
- packages/shared/src/types/token.ts
- packages/shared/src/constants/tokens.ts
- apps/api/src/services/tokenService.ts
- apps/api/src/services/tokenService.test.ts
- apps/api/src/routes/tokens.ts
- apps/api/src/routes/tokens.test.ts
- apps/api/src/__tests__/integration/token-system.test.ts
- apps/api/prisma/migrations/20260310072340_add_token_transaction/migration.sql
- apps/api/prisma/migrations/20260310083000_add_token_unique_constraint/migration.sql

**Modified files:**
- apps/api/prisma/schema.prisma
- apps/api/src/app.ts
- apps/api/src/services/curriculumService.ts
- apps/api/src/services/curriculumService.test.ts
- apps/api/src/routes/curriculum.test.ts
- apps/api/src/__tests__/integration/helpers/db.ts
- packages/shared/src/index.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
