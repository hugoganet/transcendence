# Gamification QA Scenarios

> Scope: token economy, streaks, achievements, leaderboard, and social/friends features
> Format: Given/When/Then
> Environment: test database with seeded curriculum, fresh user state per scenario
> Constants: `MISSION_COMPLETION_TOKEN_REWARD = 10`, `GAS_FEE_PER_SUBMISSION = 2`
> API base: `/api/v1`
> Last updated: 2026-03-16

---

## How to Read These Scenarios

- **Given** — preconditions (system state and user state before the action)
- **When** — the action taken (API call or user action)
- **Then** — expected outcome (response body, database state, or UI state)
- Scenarios marked `[API]` are verifiable via HTTP responses alone
- Scenarios marked `[DB]` require database inspection to verify
- Scenarios marked `[UI]` apply to the frontend and describe observable state

---

## Token Economy

### T-01: Tokens earned on first-try correct answer `[API]` `[DB]`

**Feature:** Token rewards
**Given** a user with 0 tokens

**When** `POST /api/v1/curriculum/missions/1.1.1/complete` is called

**Then**
- Response status is `200`
- Response body contains `{ data: { tokensEarned: 10 } }`
- `GET /api/v1/tokens/balance` returns `{ tokenBalance: 10, totalEarned: 10, totalSpent: 0 }`
- A `TokenTransaction` record exists in the database with `{ type: "EARN", amount: 10, missionId: "1.1.1" }`

---

### T-02: Tokens earned after retry — same reward as first try `[API]` `[DB]`

**Feature:** Token rewards are not penalised by prior incorrect submissions

**Given** a user who submitted an incorrect answer to mission `1.1.1`'s exercise (one `GAS_SPEND` transaction recorded), then submitted the correct answer

**When** `POST /api/v1/curriculum/missions/1.1.1/complete` is called

**Then**
- Response status is `200`
- `tokensEarned` in response is `10` (same reward regardless of attempt count)
- `GET /api/v1/tokens/balance` returns a `totalEarned` of `10`
- The `EARN` transaction amount is `10`

**Note:** Token balance may be less than 10 due to gas fees, but `totalEarned` must still equal 10.

---

### T-03: Gas fee deducted on each exercise submission `[API]` `[DB]`

**Feature:** Gas fee mechanic

**Given** a user with a token balance of `10` (completed mission 1.1.1)

**When** `POST /api/v1/exercises/{exerciseId}/submit` is called (exercise for mission 1.1.2)

**Then**
- User's `tokenBalance` decreases by `2` (GAS_FEE_PER_SUBMISSION)
- A `TokenTransaction` record exists with `{ type: "GAS_SPEND", amount: -2, exerciseId: "{exerciseId}" }`
- `GET /api/v1/tokens/balance` returns `{ tokenBalance: 8, totalEarned: 10, totalSpent: 2 }`

---

### T-04: Gas fee deducted even when answer is incorrect `[API]` `[DB]`

**Feature:** Gas fee applies to all submissions, correct or not

**Given** a user with a token balance of `10`

**When** `POST /api/v1/exercises/{exerciseId}/submit` is called with an incorrect answer

**Then**
- Response contains `{ data: { correct: false } }`
- `tokenBalance` has decreased by `2`
- A `GAS_SPEND` transaction is recorded for this exercise
- The mission is NOT completed (no `EARN` transaction added)

---

### T-05: Token balance can go negative mid-mission (debt allowed) `[API]` `[DB]`

**Feature:** Gas debt model — debt is allowed during a mission but blocks new mission starts

**Given** a user with a token balance of `2`

**When** `POST /api/v1/exercises/{exerciseId}/submit` is called (incorrect answer, costs 2 gas), then called again (second incorrect, costs 2 more gas)

**Then**
- After the first submission: `tokenBalance` is `0`
- After the second submission: `tokenBalance` is `-2` (negative, debt allowed mid-mission)
- Both `GAS_SPEND` transactions are created in the database

**And when** the user attempts to start a NEW mission via `GET /api/v1/curriculum/missions/1.1.2` while in debt

**Then**
- Response status is `403` with code `INSUFFICIENT_TOKENS`

---

### T-06: Token ledger records all transactions in order `[API]`

**Feature:** Token transaction history

**Given** a user who completed missions `1.1.1` and `1.1.2` in sequence

**When** `GET /api/v1/tokens/history` is called

**Then**
- Response status is `200`
- `data` array contains 2 entries
- Entries are ordered by `createdAt` descending (most recent first)
- `data[0]` has `{ type: "EARN", missionId: "1.1.2", amount: 10 }`
- `data[1]` has `{ type: "EARN", missionId: "1.1.1", amount: 10 }`
- `meta` contains `{ page: 1, pageSize: 20, total: 2 }`

---

### T-07: Completing the same mission twice does not double-reward tokens `[API]` `[DB]`

**Feature:** Idempotent token crediting

**Given** a user who has already completed mission `1.1.1` (10 tokens credited)

**When** `POST /api/v1/curriculum/missions/1.1.1/complete` is called a second time

**Then**
- Response status is `409`
- `tokenBalance` remains `10` — no second `EARN` transaction created
- Only one `TokenTransaction` record with `missionId: "1.1.1"` and `type: "EARN"` exists in the database

---

### T-08: Completing final mission of a chapter does not award extra chapter bonus `[API]` `[DB]`

**Feature:** Token rewards are per-mission only (no additional chapter completion bonus)

**Given** a user who has completed missions `1.1.1` and `1.1.2`

**When** `POST /api/v1/curriculum/missions/1.1.3/complete` is called (completing chapter 1.1)

**Then**
- Response status is `200`
- `tokensEarned` in response is `10` (mission reward only, not chapter bonus)
- `GET /api/v1/tokens/balance` returns `totalEarned: 30` (3 missions × 10)
- No `EARN` transaction exists with `missionId: null` or a chapter-level source

---

### T-09: Balance summary correctly separates earned and spent `[API]`

**Feature:** Token balance breakdown

**Given** a user who completed mission `1.1.1` (earned 10), then submitted one incorrect answer to the next exercise (gas fee -2)

**When** `GET /api/v1/tokens/balance` is called

**Then**
- `tokenBalance` is `8`
- `totalEarned` is `10`
- `totalSpent` is `2`
- `lastEarned` is a non-null ISO timestamp

---

### T-10: Unauthenticated requests to token endpoints are rejected `[API]`

**Feature:** Token endpoint authentication

**Given** no valid session cookie is present

**When** `GET /api/v1/tokens/balance` or `GET /api/v1/tokens/history` is called

**Then**
- Response status is `401`
- Response body contains `{ error: { code: "UNAUTHORIZED" } }`

---

## Streaks

### S-01: First mission completion starts streak at 1 `[API]` `[DB]`

**Feature:** Streak initialisation

**Given** a new user with `currentStreak: 0`, `longestStreak: 0`, `lastMissionCompletedAt: null`

**When** `POST /api/v1/curriculum/missions/1.1.1/complete` is called

**Then**
- `GET /api/v1/gamification/streak` returns `{ currentStreak: 1, longestStreak: 1 }`
- `lastMissionCompletedAt` is a non-null ISO timestamp
- `totalMissionsCompleted` is `1`

---

### S-02: Streak increments on consecutive UTC days `[API]` `[DB]`

**Feature:** Consecutive day streak increment

**Given** a user with `currentStreak: 1`, `lastMissionCompletedAt` set to yesterday (UTC)

**When** `POST /api/v1/curriculum/missions/1.1.2/complete` is called today

**Then**
- `GET /api/v1/gamification/streak` returns `{ currentStreak: 2, longestStreak: 2 }`
- `lastMissionCompletedAt` has been updated to today's UTC date

---

### S-03: Completing multiple missions on the same UTC day counts as 1 streak day `[API]`

**Feature:** One day = one streak increment regardless of mission count

**Given** a user with `currentStreak: 1` who already completed a mission today

**When** `POST /api/v1/curriculum/missions/1.1.2/complete` is called on the same UTC calendar day

**Then**
- `GET /api/v1/gamification/streak` returns `{ currentStreak: 1 }` (unchanged)
- `longestStreak` is still `1`
- `totalMissionsCompleted` is `2` (both missions counted in totals)

---

### S-04: Streak resets to 1 after missing a day `[API]` `[DB]`

**Feature:** Streak break and reset

**Given** a user with `currentStreak: 3`, `longestStreak: 3`, `lastMissionCompletedAt` set to 3 days ago (UTC)

**When** `POST /api/v1/curriculum/missions/1.1.2/complete` is called today (gap of 2+ days)

**Then**
- `GET /api/v1/gamification/streak` returns `{ currentStreak: 1 }`
- `longestStreak` is still `3` (not overwritten by the reset)

---

### S-05: Longest streak record is preserved after a break `[DB]`

**Feature:** `longestStreak` never decreases

**Given** a user whose `longestStreak` was `7` (from a prior streak), then missed multiple days, and `currentStreak` has been reset to `1`

**When** the user completes one more mission (streak increments to 2)

**Then**
- `longestStreak` remains `7`
- `currentStreak` is `2`
- The `longestStreak` column in the database is `7`

---

### S-06: `longestStreak` updates when current streak exceeds prior record `[DB]`

**Feature:** Record update when current streak surpasses best

**Given** a user with `longestStreak: 3` and `currentStreak: 3` who completes a mission on the next consecutive day

**When** `POST /api/v1/curriculum/missions/{missionId}/complete` is called

**Then**
- `currentStreak` is `4`
- `longestStreak` is `4` (updated to match new personal best)

---

### S-07: Streak milestone achievement — GETTING_STARTED unlocks at 3-day streak `[API]`

**Feature:** Streak achievement at threshold 3

**Given** a user with `currentStreak: 2`, `lastMissionCompletedAt` set to yesterday (UTC)

**When** `POST /api/v1/curriculum/missions/{missionId}/complete` is called (streak becomes 3)

**Then**
- Response contains `newAchievements` array including `{ code: "GETTING_STARTED" }`
- `GET /api/v1/gamification/achievements` shows `GETTING_STARTED` with a non-null `earnedAt`

---

### S-08: Streak milestone achievement — WEEK_WARRIOR unlocks at 7-day streak `[API]`

**Feature:** Streak achievement at threshold 7

**Given** a user with `currentStreak: 6`, `lastMissionCompletedAt` set to yesterday (UTC), and `GETTING_STARTED` already earned

**When** `POST /api/v1/curriculum/missions/{missionId}/complete` is called (streak becomes 7)

**Then**
- Response contains `newAchievements` array including `{ code: "WEEK_WARRIOR" }`
- `GETTING_STARTED` is NOT re-awarded in this response
- `GET /api/v1/gamification/achievements` shows both `GETTING_STARTED` and `WEEK_WARRIOR` with non-null `earnedAt`

---

### S-09: Streak achievement not re-awarded if already earned `[API]`

**Feature:** Idempotency of streak achievements

**Given** a user with `currentStreak: 4` who already earned `GETTING_STARTED` (unlocked at 3)

**When** `POST /api/v1/curriculum/missions/{missionId}/complete` is called (streak becomes 5)

**Then**
- Response `newAchievements` does NOT contain `{ code: "GETTING_STARTED" }`
- `GET /api/v1/gamification/achievements` shows `GETTING_STARTED` with the same original `earnedAt` timestamp

---

### S-10: Streak day boundary is UTC midnight, not local timezone `[DB]`

**Feature:** UTC-based day boundary (server-side streak logic)

**Given** a user in UTC+9 (Japan) who completes a mission at 23:00 local time (14:00 UTC on day N), then completes another mission at 00:30 local time (15:30 UTC on day N — same UTC day)

**When** `updateStreak` runs for the second completion

**Then**
- `currentStreak` remains `1` (both completions fall on the same UTC calendar day `YYYY-MM-DD`)
- `lastMissionCompletedAt` is updated to the second completion timestamp

**Note:** The streak boundary is computed with `date.toISOString().slice(0, 10)` — UTC date string. User's local timezone has no effect.

---

## Achievements

### A-01: Category completion achievement — BLOCKCHAIN_BEGINNER `[API]` `[DB]`

**Feature:** MODULE_COMPLETION achievement at category 1

**Given** a user who has completed 10 of 11 missions in Category 1 (all except the final mission `1.3.3`)

**When** `POST /api/v1/curriculum/missions/1.3.3/complete` is called

**Then**
- Response contains `newAchievements` array including `{ code: "BLOCKCHAIN_BEGINNER", title: "Blockchain Beginner" }`
- `GET /api/v1/gamification/achievements` shows `BLOCKCHAIN_BEGINNER` with a non-null `earnedAt`
- A `UserAchievement` record exists in the database for this user and the `BLOCKCHAIN_BEGINNER` achievement

---

### A-02: Category completion achievement does not fire before final mission `[API]`

**Feature:** MODULE_COMPLETION only triggers on last mission

**Given** a user who has completed 9 of 11 missions in Category 1

**When** `POST /api/v1/curriculum/missions/1.3.2/complete` is called (10th mission, not the last)

**Then**
- Response `newAchievements` does NOT contain `{ code: "BLOCKCHAIN_BEGINNER" }`
- `GET /api/v1/gamification/achievements` shows `BLOCKCHAIN_BEGINNER` with `earnedAt: null`

---

### A-03: Token threshold achievement — FIRST_TOKENS unlocks immediately when threshold crossed `[API]`

**Feature:** TOKEN_THRESHOLD achievement at 10 tokens

**Given** a user with `tokenBalance: 0`

**When** `POST /api/v1/curriculum/missions/1.1.1/complete` is called (earns 10 tokens)

**Then**
- Response contains `newAchievements` array including `{ code: "FIRST_TOKENS" }`
- `GET /api/v1/gamification/achievements` shows `FIRST_TOKENS` with a non-null `earnedAt`

---

### A-04: Token threshold achievement — TOKEN_COLLECTOR unlocks at 50 tokens `[API]`

**Feature:** TOKEN_THRESHOLD achievement at 50 tokens

**Given** a user who has completed 4 missions (40 tokens) and `TOKEN_COLLECTOR` is not yet earned

**When** `POST /api/v1/curriculum/missions/{mission5}/complete` is called (balance reaches 50)

**Then**
- Response contains `newAchievements` array including `{ code: "TOKEN_COLLECTOR" }`
- `FIRST_TOKENS` is NOT re-awarded in this response

---

### A-05: Achievement persists even if token balance drops below threshold after earning `[API]` `[DB]`

**Feature:** TOKEN_THRESHOLD achievements are permanent once earned

**Given** a user who earned `TOKEN_COLLECTOR` (balance crossed 50), then spent gas fees reducing balance to 44

**When** `GET /api/v1/gamification/achievements` is called

**Then**
- `TOKEN_COLLECTOR` still has a non-null `earnedAt`
- The achievement is NOT revoked by a subsequent balance decrease

---

### A-06: Achievement is idempotent — cannot be unlocked twice `[API]` `[DB]`

**Feature:** Achievement deduplication

**Given** a user who earned `FIRST_TOKENS` after completing mission `1.1.1`

**When** `POST /api/v1/curriculum/missions/1.1.2/complete` is called (balance is now 20, still above the 10-token threshold)

**Then**
- Response `newAchievements` does NOT contain `{ code: "FIRST_TOKENS" }`
- Only one `UserAchievement` record exists for this user and `FIRST_TOKENS` in the database
- `earnedAt` is unchanged from the original grant

---

### A-07: Multiple achievements can unlock in the same mission completion `[API]`

**Feature:** Batch achievement unlock in a single response

**Given** a user with `currentStreak: 2` (set to yesterday UTC), `tokenBalance: 40`, and no `GETTING_STARTED` or `TOKEN_COLLECTOR` yet earned

**When** `POST /api/v1/curriculum/missions/{mission5}/complete` is called (streak becomes 3, balance becomes 50)

**Then**
- Response `newAchievements` contains both `{ code: "GETTING_STARTED" }` AND `{ code: "TOKEN_COLLECTOR" }`
- `GET /api/v1/gamification/achievements` shows both with non-null `earnedAt`

---

### A-08: All 13 achievements are returned for a new user with none earned `[API]`

**Feature:** Achievement listing

**Given** a newly registered user with no completions

**When** `GET /api/v1/gamification/achievements` is called

**Then**
- Response status is `200`
- `data` array length is `>= 13`
- Every entry has `earnedAt: null`
- Each entry contains `{ id, code, title, description, iconUrl, type, threshold, earnedAt }`

---

### A-09: Achievements endpoint returns mix of earned and unearned after partial progress `[API]`

**Feature:** Mixed earned/unearned state in achievement list

**Given** a user who has earned `FIRST_TOKENS` (10 tokens) but not `TOKEN_COLLECTOR` (50 tokens)

**When** `GET /api/v1/gamification/achievements` is called

**Then**
- `FIRST_TOKENS` entry has non-null `earnedAt`
- `TOKEN_COLLECTOR` entry has `earnedAt: null`
- The list contains both earned and unearned entries simultaneously

---

### A-10: Unauthenticated requests to achievements endpoint are rejected `[API]`

**Feature:** Achievement endpoint authentication

**Given** no valid session cookie is present

**When** `GET /api/v1/gamification/achievements` is called

**Then**
- Response status is `401`
- Response body contains `{ error: { code: "UNAUTHORIZED" } }`

---

## Leaderboard

### L-01: User appears on leaderboard after first mission completed this week `[API]`

**Feature:** Weekly leaderboard entry creation

**Given** a user who has not completed any missions this week

**When** `POST /api/v1/curriculum/missions/1.1.1/complete` is called, then `GET /api/v1/gamification/leaderboard` is called

**Then**
- The user appears in `data` with `{ rank: 1, missionsCompleted: 1 }`
- `currentUser.rank` is `1`
- `meta.total` is `1`

---

### L-02: User inactive this week has null rank in currentUser block `[API]`

**Feature:** Inactive user handling in leaderboard

**Given** user A who has not completed any mission this week, and user B who has completed 1 mission this week

**When** user A calls `GET /api/v1/gamification/leaderboard`

**Then**
- `data` contains only user B (1 entry)
- `currentUser.rank` is `null` for user A
- `currentUser.missionsCompleted` reflects user A's all-time count (0 if never completed)
- User A does NOT appear in the `data` ranked list

---

### L-03: Weekly leaderboard is scoped to the current week (Monday 00:00 UTC reset) `[API]` `[DB]`

**Feature:** Weekly reset boundary

**Given** user A who completed 5 missions last week (before Monday 00:00 UTC) and 0 missions this week

**When** `GET /api/v1/gamification/leaderboard` is called in the current week

**Then**
- User A does NOT appear in the ranked `data` list
- `currentUser.rank` is `null`
- `currentUser.missionsCompleted` reflects their all-time total, not 0

---

### L-04: Ties broken by earliest last completion timestamp `[API]`

**Feature:** Tiebreak ordering by first-to-reach

**Given** user A and user B both complete exactly 1 mission this week, with user A completing first (earlier timestamp)

**When** `GET /api/v1/gamification/leaderboard` is called

**Then**
- Both users share `rank: 1` (dense ranking — same score = same rank)
- User A appears at position `data[0]` (earlier timestamp = listed first within the tied group)
- User B appears at position `data[1]`

---

### L-05: Leaderboard pagination returns correct slices with accurate meta `[API]`

**Feature:** Paginated leaderboard results

**Given** 3 users each with different mission counts this week (user A: 3, user B: 2, user C: 1)

**When** `GET /api/v1/gamification/leaderboard?page=1&pageSize=2` is called by user A

**Then**
- `data` contains 2 entries (user A rank 1, user B rank 2)
- `meta.total` is `3`
- `meta.page` is `1`
- `meta.pageSize` is `2`

**And when** `GET /api/v1/gamification/leaderboard?page=2&pageSize=2` is called

**Then**
- `data` contains 1 entry (user C rank 3)
- `meta.total` is still `3`

---

### L-06: Unauthenticated request to leaderboard is rejected `[API]`

**Feature:** Leaderboard authentication

**Given** no valid session cookie is present

**When** `GET /api/v1/gamification/leaderboard` is called

**Then**
- Response status is `401`
- Response body contains `{ error: { code: "UNAUTHORIZED" } }`

---

## Social / Friends

### F-01: Friend request sent creates a PENDING friendship `[API]` `[DB]`

**Feature:** Friend request creation

**Given** user A and user B are both registered with no existing friendship

**When** user A calls `POST /api/v1/friends/{userBId}`

**Then**
- Response status is `201`
- Response body contains `{ data: { status: "PENDING", requesterId: "{userAId}", addresseeId: "{userBId}" } }`
- A `Friendship` record exists in the database with `status: "PENDING"`

---

### F-02: Accepted friend request appears in both users' friend lists `[API]`

**Feature:** Friend request acceptance and bidirectional visibility

**Given** user A sent a friend request to user B (status: PENDING)

**When** user B calls `POST /api/v1/friends/{userAId}/accept`

**Then**
- Response status is `200`
- Response body contains `{ data: { status: "ACCEPTED" } }`
- `GET /api/v1/friends` by user A returns 1 entry with `id: {userBId}`
- `GET /api/v1/friends` by user B returns 1 entry with `id: {userAId}`
- Each friend entry includes `{ displayName, avatarUrl, online }` fields

---

### F-03: Pending friend request does not appear in friends list `[API]`

**Feature:** Friends list only shows accepted friendships

**Given** user A sent a friend request to user B (status: PENDING, not yet accepted)

**When** user A calls `GET /api/v1/friends`

**Then**
- Response `data` array is empty (length 0)
- The pending request is NOT counted as a friend

---

### F-04: Rejecting/declining a friend request removes it `[API]` `[DB]`

**Feature:** Friend request rejection via DELETE

**Given** user A sent a friend request to user B (status: PENDING)

**When** user B calls `DELETE /api/v1/friends/{userAId}` (decline by deletion)

**Then**
- Response status is `204`
- `GET /api/v1/friends/requests` by user B returns an empty array
- No `Friendship` record exists between user A and user B in the database

---

### F-05: Duplicate friend request returns 409 `[API]`

**Feature:** Duplicate request prevention (both directions)

**Given** user A has already sent a friend request to user B (status: PENDING)

**When** user A calls `POST /api/v1/friends/{userBId}` again

**Then**
- Response status is `409`
- Response body contains `{ error: { code: "FRIENDSHIP_ALREADY_EXISTS" } }`

**And when** user B also tries to send a friend request to user A (reverse direction)

**Then**
- Response status is `409`
- Response body contains `{ error: { code: "FRIENDSHIP_ALREADY_EXISTS" } }`

---

### F-06: Removing an accepted friend removes the friendship for both users `[API]`

**Feature:** Friend removal bidirectionality

**Given** user A and user B are accepted friends

**When** user A calls `DELETE /api/v1/friends/{userBId}`

**Then**
- Response status is `204`
- `GET /api/v1/friends` by user A returns empty array
- `GET /api/v1/friends` by user B returns empty array
- No `Friendship` record exists between them in the database

---

### F-07: Pending requests endpoint shows incoming requests only `[API]`

**Feature:** Pending requests inbox (incoming only)

**Given** user A sent a request to user B (PENDING)

**When** user B calls `GET /api/v1/friends/requests`

**Then**
- Response `data` has 1 entry with `{ id: "{userAId}", displayName, avatarUrl, createdAt }`

**And when** user A calls `GET /api/v1/friends/requests`

**Then**
- Response `data` is empty (sent requests do not appear in the requester's inbox)

---

### F-08: Cannot send friend request to yourself `[API]`

**Feature:** Self-request guard

**Given** user A is authenticated

**When** user A calls `POST /api/v1/friends/{userAId}` (own ID)

**Then**
- Response status is `400`
- Response body contains `{ error: { code: "CANNOT_FRIEND_SELF" } }`

---

### F-09: Friend request to non-existent user returns 404 `[API]`

**Feature:** Target user existence check

**Given** user A is authenticated

**When** user A calls `POST /api/v1/friends/00000000-0000-0000-0000-000000000000` (non-existent UUID)

**Then**
- Response status is `404`
- Response body contains `{ error: { code: "USER_NOT_FOUND" } }`

---

### F-10: Unauthenticated requests to friends endpoints are rejected `[API]`

**Feature:** Friends endpoint authentication

**Given** no valid session cookie is present

**When** any of the following are called: `GET /api/v1/friends`, `GET /api/v1/friends/requests`, `POST /api/v1/friends/{userId}`, `DELETE /api/v1/friends/{userId}`

**Then**
- All return response status `401`
- All return `{ error: { code: "UNAUTHORIZED" } }`
