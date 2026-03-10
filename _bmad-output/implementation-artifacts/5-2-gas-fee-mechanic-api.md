# Story 5.2: Gas-Fee Mechanic API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want every exercise submission to cost Knowledge Tokens as gas,
So that I experience how real blockchain gas fees work through daily use.

## Acceptance Criteria

1. **Given** an authenticated user submitting an exercise answer,
   **When** the submission is processed via `POST /api/v1/exercises/:exerciseId/submit`,
   **Then** a flat gas cost in Knowledge Tokens is deducted from the user's balance,
   **And** a `TokenTransaction` record is created with: userId, amount (negative), type `GAS_SPEND`, exerciseId, description,
   **And** the gas cost is the same regardless of whether the answer is correct or incorrect,
   **And** the deduction is atomic (Prisma transaction) with the exercise attempt recording.

2. **Given** a user whose token balance goes negative mid-mission,
   **When** they continue submitting exercises within the same mission,
   **Then** submissions are still accepted (mission is never interrupted),
   **And** the user's `tokenBalance` reflects the negative value (debt).

3. **Given** a user with negative token balance (debt),
   **When** they attempt to start a new mission via `POST /api/v1/curriculum/missions/:missionId/complete` or begin exercising a new mission,
   **Then** a 403 error is returned with code `INSUFFICIENT_TOKENS`,
   **And** the response includes a message explaining they must earn more tokens to pay off debt.

4. **Given** the gas-fee system,
   **When** gas costs are configured,
   **Then** the flat gas cost per submission is defined as a constant `GAS_FEE_PER_SUBMISSION` in `packages/shared/src/constants/tokens.ts`,
   **And** the constant is exported and importable from `@transcendence/shared`.

5. **Given** the exercise submission response,
   **When** gas is deducted,
   **Then** the response includes a `gasFee` field showing the amount deducted,
   **And** the response includes a `tokenBalance` field showing the updated balance after deduction.

## Tasks / Subtasks

- [x] Task 1: Add gas fee constant to packages/shared (AC: #4)
  - [x] 1.1 Add `GAS_FEE_PER_SUBMISSION = 2` to `packages/shared/src/constants/tokens.ts`
  - [x] 1.2 Export from `packages/shared/src/index.ts` (already re-exports tokens constants)
  - [x] 1.3 Update `ExerciseResult` type in `packages/shared/src/types/exercise.ts` to include optional `gasFee?: number` and `tokenBalance?: number` fields
  - [x] 1.4 Add schema test for the new constant in `packages/shared/src/schemas/token.test.ts`

- [x] Task 2: Add `deductGasFee` function to tokenService (AC: #1, #2)
  - [x] 2.1 Create `deductGasFeeWithClient(client, userId, exerciseId, missionId)` in `apps/api/src/services/tokenService.ts`:
    - Accept a Prisma `DbClient` (transaction client) as first parameter (same pattern as `creditMissionTokensWithClient`)
    - Create a `TokenTransaction` with: amount = -GAS_FEE_PER_SUBMISSION, type = "GAS_SPEND", exerciseId, missionId (for context), description = "Gas fee: exercise submission"
    - Atomically decrement `User.tokenBalance` by `GAS_FEE_PER_SUBMISSION` using `{ decrement: GAS_FEE_PER_SUBMISSION }`
    - Do NOT check for negative balance — allow debt mid-mission (AC #2)
  - [x] 2.2 Create standalone `deductGasFee(userId, exerciseId, missionId)` wrapper that creates its own `prisma.$transaction`
  - [x] 2.3 Add unit tests in `apps/api/src/services/tokenService.test.ts`:
    - Gas fee deducted correctly (transaction created, balance decremented)
    - Balance can go negative (no rejection)
    - Correct amount, type, exerciseId, description
    - Multiple submissions create multiple GAS_SPEND records

- [x] Task 3: Add token debt check to prevent starting new missions (AC: #3)
  - [x] 3.1 Create `checkTokenDebt(userId)` function in `apps/api/src/services/tokenService.ts`:
    - Query `User.tokenBalance`
    - If balance < 0, throw `AppError(403, "INSUFFICIENT_TOKENS", "You must earn more tokens to start a new mission")`
    - If balance >= 0, return (no-op)
  - [x] 3.2 Integrate into `submitExercise()` in `apps/api/src/services/exerciseService.ts`:
    - At the start of the function, before processing the submission, check if the user has a new mission access:
    - Actually, the debt check should be in `exerciseService.submitExercise()` only when the user is submitting to a mission they haven't submitted to before (first attempt for a mission)
    - **Better approach:** Add debt check to the mission exercise flow at the point where the user starts interacting with a NEW mission — integrate into the access check in exerciseService
    - Check: if user has no prior `ExerciseAttempt` for this `exerciseId` AND `tokenBalance < 0`, throw INSUFFICIENT_TOKENS
    - If user already has attempts for this mission (mid-mission), allow submission regardless of balance
  - [x] 3.3 Add unit tests for `checkTokenDebt()`:
    - Balance >= 0 → no error
    - Balance < 0 → throws INSUFFICIENT_TOKENS (403)
  - [x] 3.4 Add unit tests for debt check integration in exerciseService:
    - First attempt on new mission with negative balance → 403
    - Continued attempt on existing mission with negative balance → allowed
    - First attempt on new mission with positive balance → allowed

- [x] Task 4: Integrate gas fee deduction into exercise submission flow (AC: #1, #5)
  - [x] 4.1 Modify `submitExercise()` in `apps/api/src/services/exerciseService.ts`:
    - After recording the exercise attempt, call `deductGasFee(userId, exerciseId, exerciseId)` (exerciseId is the missionId in this codebase)
    - **Important:** Wrap the exercise attempt creation + gas fee deduction in a single `prisma.$transaction` for atomicity
    - Refactor the function to use `prisma.$transaction(async (tx) => { ... })` wrapping both the `exerciseAttempt.create` and `deductGasFeeWithClient(tx, ...)`
  - [x] 4.2 Update the return type of `submitExercise()` to include `gasFee` and `tokenBalance`:
    - After the transaction, query the updated `User.tokenBalance`
    - Return `{ ...result, gasFee: GAS_FEE_PER_SUBMISSION, tokenBalance: updatedBalance }`
  - [x] 4.3 Update `ExerciseResult` Zod schema in shared package if it validates responses
  - [x] 4.4 Update existing exerciseService unit tests to account for gas fee deduction
  - [x] 4.5 Update existing exercise route tests to verify `gasFee` and `tokenBalance` in response

- [x] Task 5: Update the unique constraint on TokenTransaction (AC: #1)
  - [x] 5.1 The existing `@@unique([userId, missionId, type])` constraint was added for EARN transactions defense-in-depth
  - [x] 5.2 For GAS_SPEND transactions: `missionId` will be null (only `exerciseId` is set), and PostgreSQL treats NULLs as distinct in unique constraints, so multiple GAS_SPEND records with null missionId are allowed
  - [x] 5.3 **Verify** this behavior with an integration test: create two GAS_SPEND transactions for same user with null missionId → should succeed
  - [x] 5.4 If GAS_SPEND sets missionId (for context tracking), the unique constraint would prevent multiple submissions for the same mission — in that case, either:
    - a) Remove the unique constraint and keep the defense-in-depth logic in code only (EARN idempotency check in `creditMissionTokensWithClient`), OR
    - b) Keep missionId null for GAS_SPEND and only use exerciseId
    - **Decision: Use option (b)** — keep missionId null for GAS_SPEND, use only exerciseId field

- [x] Task 6: Add integration tests for gas fee system (AC: #1, #2, #3, #4, #5)
  - [x] 6.1 Create `apps/api/src/__tests__/integration/gas-fee.test.ts`:
    - Submit exercise → gas fee deducted from balance
    - Submit exercise → GAS_SPEND TokenTransaction created with correct amount, type, exerciseId
    - Submit exercise → response includes `gasFee` and `tokenBalance`
    - Submit exercise correctly → same gas fee as incorrect submission
    - Complete mission → earn tokens, then submit exercises → balance changes correctly (earn 10 - 2 per submission)
    - Balance goes negative mid-mission → submissions still accepted
    - Balance negative → attempt to start new mission exercise → 403 INSUFFICIENT_TOKENS
    - Balance negative → continue existing mission exercise → accepted
    - Balance returns to positive after earning tokens → new mission exercise allowed
    - Multiple submissions → multiple GAS_SPEND records created
    - Submit exercise without auth → 401 (existing test, verify not regressed)
  - [x] 6.2 Verify all existing tests still pass (`pnpm test` + `pnpm test:integration`)

## Dev Notes

### Critical Architecture Patterns

- **Atomic gas deduction:** The gas fee deduction MUST be in the same `prisma.$transaction` as the exercise attempt creation. This prevents scenarios where an attempt is recorded but gas is not charged (or vice versa). Use `deductGasFeeWithClient(tx, ...)` inside the transaction. [Source: architecture.md § Data Architecture — NFR15 concurrent safety]

- **Negative balance allowed mid-mission:** The gas fee mechanic explicitly allows negative balances. NEVER reject a submission because of insufficient tokens. The only gate is preventing NEW mission starts when in debt. [Source: epics.md § Story 5.2 — "mission is never interrupted"]

- **GAS_SPEND amount is negative:** Store `amount = -GAS_FEE_PER_SUBMISSION` in the `TokenTransaction` record. The `tokenBalance` on User is decremented. This convention matches Story 5.1's design where `totalSpent = Math.abs(GAS_SPEND amounts)`. [Source: tokenService.ts:82-83 — GAS_SPEND amounts stored as negative]

- **Thin route handlers:** The exercise route handler should NOT change. Gas fee logic belongs in `exerciseService.submitExercise()`, not in the route. The route only validates and responds. [Source: architecture.md § Implementation Patterns]

- **Standard response format:** Success: `{ data: T }`. The exercise result response just gets two new fields (`gasFee`, `tokenBalance`). No structural change to the response wrapper. [Source: architecture.md § Format Patterns]

### Token Economy Design (Updated with Gas)

```
Token Type: Knowledge Tokens
Earning: +MISSION_COMPLETION_TOKEN_REWARD (10) per completed mission
Spending: -GAS_FEE_PER_SUBMISSION (2) per exercise submission (this story)
Balance: Can go negative mid-mission, but cannot start new mission while in debt
Net per mission: +10 earned - (N * 2) gas fees, where N = number of submissions
  - Perfect run (1 correct submission): +10 - 2 = +8 net
  - Typical (2-3 attempts): +10 - 4/6 = +6/+4 net
  - Struggling (5+ attempts): +10 - 10+ = 0 or negative (still allowed mid-mission)
Progressive reveal: Gas costs revealed at mission 3.3.3 (gasRevealed)
  BUT gas fees are charged from mission 1.1.1 onward (silently deducted)
```

### Debt Check Logic — Where to Enforce

The debt check must be enforced at the START of a new mission's exercises, not on every submission:

```
submitExercise(userId, exerciseId):
  1. [EXISTING] Validate exercise exists, check access status
  2. [NEW] Check if this is user's FIRST attempt for this exerciseId:
     - Query ExerciseAttempt where userId + exerciseId
     - If NO prior attempts AND User.tokenBalance < 0 → throw INSUFFICIENT_TOKENS
     - If HAS prior attempts → skip check (mid-mission, allow negative balance)
  3. [EXISTING] Load content, validate submission type
  4. [EXISTING] Dispatch to type-specific validator
  5. [MODIFIED] Record attempt + deduct gas IN SAME transaction:
     prisma.$transaction(async (tx) => {
       tx.exerciseAttempt.create(...)
       deductGasFeeWithClient(tx, userId, exerciseId, null)
     })
  6. [NEW] Query updated User.tokenBalance
  7. [MODIFIED] Return { ...result, gasFee: GAS_FEE_PER_SUBMISSION, tokenBalance }
```

### Unique Constraint Analysis

The `@@unique([userId, missionId, type])` on `TokenTransaction`:
- **EARN transactions:** `missionId` is set → unique constraint prevents duplicate earnings per mission (defense-in-depth) ✓
- **GAS_SPEND transactions:** `missionId` = null, `exerciseId` = set → PostgreSQL treats each NULL as distinct in unique constraints, so multiple GAS_SPEND rows with null missionId are allowed ✓
- **No schema change needed** as long as GAS_SPEND leaves missionId null

### Existing Code to Modify

1. **`exerciseService.ts` → `submitExercise()`** — Main integration point. Wrap exercise attempt + gas fee in a transaction. Add debt check for first attempts on new missions. Extend return value with gasFee and tokenBalance. [Source: apps/api/src/services/exerciseService.ts:220-293]

2. **`tokenService.ts`** — Add `deductGasFeeWithClient()` and `deductGasFee()` functions following the existing `creditMissionTokensWithClient()` pattern. Add `checkTokenDebt()` function. [Source: apps/api/src/services/tokenService.ts]

3. **`packages/shared/src/constants/tokens.ts`** — Add `GAS_FEE_PER_SUBMISSION` constant. [Source: packages/shared/src/constants/tokens.ts]

4. **`packages/shared/src/types/exercise.ts`** — Extend `ExerciseResult` type with optional `gasFee` and `tokenBalance` fields.

### Existing Code to Reuse

1. **`creditMissionTokensWithClient(client, ...)` pattern** — Same DbClient abstraction for transaction compatibility. Reuse the `DbClient` type alias. [Source: tokenService.ts:6]

2. **`AppError` class** — For INSUFFICIENT_TOKENS (403) error. [Source: apps/api/src/utils/AppError.ts]

3. **`requireAuth` middleware** — Already on all exercise routes. [Source: apps/api/src/middleware/auth.ts]

4. **Integration test helpers** — `createAndLoginUser()`, `resetDatabase()`, `testPrisma` from `apps/api/src/__tests__/integration/helpers/`. [Source: Story 4.0]

5. **`getTokenBalance()` in tokenService** — Already handles GAS_SPEND aggregation (totalSpent uses `Math.abs(GAS_SPEND amounts)`). No changes needed. [Source: tokenService.ts:60-91]

### Edge Cases to Handle

1. **Concurrent submissions:** Two simultaneous exercise submissions for the same user. Each must independently charge gas. Since `deductGasFeeWithClient` uses atomic `decrement`, concurrent submissions are safe. No read-modify-write race condition.

2. **First attempt debt check timing:** The debt check queries `ExerciseAttempt` count for the mission. If two requests race for the "first" attempt, both might see 0 attempts and both pass the debt check. This is acceptable — at worst, a user in debt submits one extra time before being blocked.

3. **Gas fee + exercise attempt atomicity:** If the gas fee fails (unlikely, but possible if Prisma errors), the exercise attempt should also roll back. Use a single `prisma.$transaction` wrapping both operations.

4. **Token history correctness:** After this story, `GET /api/v1/tokens/history` will show both EARN and GAS_SPEND transactions. No changes needed to the history endpoint — it already returns all transaction types.

5. **Balance endpoint correctness:** `getTokenBalance()` already computes `totalSpent` from GAS_SPEND amounts (`Math.abs(totalSpentRaw)`). No changes needed.

6. **Debt recovery:** After earning tokens from mission completion (Story 5.1), the balance may go from negative to positive. The debt check in exerciseService automatically allows new missions once balance >= 0. No special "recovery" logic needed.

### Performance Budget

Target: <200ms end-to-end (NFR1).

| Operation | Estimated Time |
|-----------|---------------|
| Auth middleware | ~1ms |
| Debt check (query ExerciseAttempt count + User.tokenBalance) | ~5ms |
| Exercise validation | ~2-5ms |
| Prisma $transaction (create ExerciseAttempt + create TokenTransaction + decrement balance) | ~15-20ms |
| Query updated tokenBalance | ~2ms |
| **Total server time** | **~25-35ms** |

Well within the 200ms budget.

### Project Structure Notes

**New files:**
```
apps/api/src/__tests__/integration/gas-fee.test.ts  # Integration tests
```

**Modified files:**
```
packages/shared/src/constants/tokens.ts              # Add GAS_FEE_PER_SUBMISSION
packages/shared/src/types/exercise.ts                # Add gasFee, tokenBalance to ExerciseResult
packages/shared/src/index.ts                         # Export new constant (if not already re-exported)
apps/api/src/services/tokenService.ts                # Add deductGasFeeWithClient, deductGasFee, checkTokenDebt
apps/api/src/services/tokenService.test.ts           # Add gas fee unit tests
apps/api/src/services/exerciseService.ts             # Integrate gas fee + debt check into submitExercise
apps/api/src/services/exerciseService.test.ts        # Update tests for gas fee integration
apps/api/src/routes/exercises.test.ts                # Verify gasFee/tokenBalance in response (if exists)
apps/api/src/__tests__/integration/helpers/db.ts     # Verify TokenTransaction truncation (already done in 5.1)
```

### Previous Story Intelligence

From Story 5.1 (Token Ledger & Balance API):
- `creditMissionTokensWithClient(client, ...)` pattern works well — reuse for `deductGasFeeWithClient`
- `DbClient` type alias: `Pick<typeof prisma, "tokenTransaction" | "user">` — reuse directly
- GAS_SPEND amounts stored as negative integers (tokenService.ts:82-83 confirms this expectation)
- `@@unique([userId, missionId, type])` was added as defense-in-depth for EARN — must keep missionId null for GAS_SPEND
- All 353 unit tests + 206 shared tests + 37 integration tests passing at Story 5.1 completion — baseline to maintain

From Story 4.1 (Exercise Submission API):
- `submitExercise()` currently creates `ExerciseAttempt` directly via `prisma.exerciseAttempt.create()` — needs to be wrapped in a transaction
- `ExerciseResult` type returned by submitExercise — needs extension with gasFee/tokenBalance
- Integration tests use real DB + Redis, sequential execution (`fileParallelism: false`)

### Git Intelligence

Recent commit pattern: `feat(domain): description (Story X.Y)`

This story's commit should follow: `feat(tokens): add gas-fee mechanic to exercise submissions (Story 5.2)`

### References

- [Source: _bmad-output/planning-artifacts/epics.md § Epic 5 Story 5.2 — Gas-Fee Mechanic API]
- [Source: _bmad-output/planning-artifacts/prd.md § FR26 — Gas-fee mechanic (flat cost per submission)]
- [Source: _bmad-output/planning-artifacts/architecture.md § Data Architecture — NFR15 concurrent safety]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns — thin routes, service layer]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns — API response format]
- [Source: _bmad-output/planning-artifacts/curriculum-roadmap.md § Progressive Reveal — gas at 3.3.3]
- [Source: content/structure.json § progressiveReveal flags — gasRevealed at 3.3.3]
- [Source: apps/api/src/services/tokenService.ts § creditMissionTokensWithClient — pattern to follow]
- [Source: apps/api/src/services/tokenService.ts:82-83 — GAS_SPEND amounts are negative]
- [Source: apps/api/src/services/exerciseService.ts § submitExercise() — integration point]
- [Source: apps/api/prisma/schema.prisma § TokenTransaction @@unique — constraint analysis]
- [Source: _bmad-output/implementation-artifacts/5-1-token-ledger-and-balance-api.md — previous story dev notes]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- exerciseService route tests needed $transaction, exerciseAttempt.count, user.findUniqueOrThrow, and tokenService mocks added
- exerciseService unit tests needed tokenService mock and gas fee response field assertions
- Integration tests: mission 1.1.2 is SI type (not CM as assumed in story spec), fixed test fixtures accordingly
- checkTokenDebt test: AppError throws with message, not code — test matched on message text

### Completion Notes List

- Task 1: Added `GAS_FEE_PER_SUBMISSION = 2` constant, extended `exerciseResultSchema` with optional `gasFee` and `tokenBalance` fields, added 5 new shared tests
- Task 2: Added `deductGasFeeWithClient()` and `deductGasFee()` to tokenService following the `creditMissionTokensWithClient` pattern, 3 unit tests
- Task 3: Added `checkTokenDebt()` function, integrated debt check into `submitExercise()` for first attempts only, 4 unit tests
- Task 4: Wrapped exercise attempt + gas deduction in `prisma.$transaction`, added `gasFee` and `tokenBalance` to response, updated all 3 test files
- Task 5: Verified unique constraint compatibility — GAS_SPEND uses null missionId, PostgreSQL allows multiple NULLs in unique constraints. No schema change needed.
- Task 6: Created 8 integration tests covering gas deduction, GAS_SPEND records, balance interactions, debt blocking, debt recovery, and auth guards
- All 363 unit tests + 211 shared tests + 46 integration tests pass with 0 regressions

### Change Log

- 2026-03-10: Implemented Gas-Fee Mechanic API (Story 5.2) — gas fee deduction on exercise submissions, debt check for new missions, atomic transactions
- 2026-03-10: Code review (AI) — Fixed 3 MEDIUM issues: replaced inline debt check with checkTokenDebt() call, added TOCTOU documentation comment, added JSDoc to standalone deductGasFee(), updated test mocks accordingly. All 363 unit tests pass.

### File List

**New files:**
- apps/api/src/__tests__/integration/gas-fee.test.ts

**Modified files:**
- packages/shared/src/constants/tokens.ts
- packages/shared/src/schemas/exercise.ts
- packages/shared/src/schemas/token.test.ts
- packages/shared/src/index.ts
- apps/api/src/services/tokenService.ts
- apps/api/src/services/tokenService.test.ts
- apps/api/src/services/exerciseService.ts
- apps/api/src/services/exerciseService.test.ts
- apps/api/src/routes/exercises.test.ts
- _bmad-output/implementation-artifacts/sprint-status.yaml
- _bmad-output/implementation-artifacts/5-2-gas-fee-mechanic-api.md
