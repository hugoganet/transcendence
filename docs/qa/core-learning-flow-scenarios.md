# QA Scenarios — Core Learning Flow

> Scope: registration through curriculum completion (excluding progressive reveals, covered in `progressive-reveal-scenarios.md`)
> Format: Given/When/Then
> Environment: test database with seeded curriculum, fresh user state per scenario
> API base: `POST /api/v1/curriculum/missions/:missionId/complete`, `GET /api/v1/curriculum/`
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

## S01 — New User Registration and First Mission Access `[API]`

**Given** no user exists with email `alice@test.com`

**When** `POST /api/v1/auth/register` is called with `{ email: "alice@test.com", password: "ValidPass1!", ageConfirmed: true }`

**Then**
- Response status is `201`
- Response body contains `{ data: { user: { email: "alice@test.com" } } }`
- A session cookie is set

**And when** `GET /api/v1/curriculum/` is called with the authenticated session

**Then**
- Response status is `200`
- Category 1 has status `available`
- Chapter 1.1 has status `available`
- Mission `1.1.1` has status `available`
- All other missions have status `locked`
- All other chapters have status `locked`
- Categories 2–6 have status `locked`

---

## S02 — First Mission Access Returns Content `[API]`

**Given** a newly registered authenticated user

**When** `GET /api/v1/curriculum/missions/1.1.1` is called

**Then**
- Response status is `200`
- Response contains the mission's exercise data (type, content, options)
- Mission status in response is `available`

---

## S03 — Accessing a Locked Mission is Forbidden `[API]`

**Given** a newly registered authenticated user (only mission `1.1.1` is available)

**When** `GET /api/v1/curriculum/missions/1.2.1` is called

**Then**
- Response status is `403`
- Response body is `{ error: { code: "FORBIDDEN", message: "Mission is locked" } }`

---

## S04 — Correct Exercise Submission Marks Mission In-Progress `[API]` `[DB]`

**Given** an authenticated user with mission `1.1.1` in `available` state

**When** `POST /api/v1/exercises/{exerciseId}/submit` is called with the correct answer for mission `1.1.1`'s exercise

**Then**
- Response status is `200`
- Response contains `{ data: { correct: true, ... } }`
- A `UserProgress` record exists for `(userId, "1.1.1")` with status `IN_PROGRESS` or transitions are tracked via `ExerciseAttempt`

**Note:** Mission completion is triggered by `POST /curriculum/missions/:missionId/complete`, not by exercise submission alone. Exercise submission only records the attempt and grades it.

---

## S05 — Mission Completion Transitions Status to Completed `[API]` `[DB]`

**Given** an authenticated user who has answered the exercise for mission `1.1.1` correctly

**When** `POST /api/v1/curriculum/missions/1.1.1/complete` is called

**Then**
- Response status is `200`
- Response body contains `{ data: { missionId: "1.1.1", status: "completed", tokensEarned: 10, ... } }`
- `UserProgress` record for `(userId, "1.1.1")` has status `COMPLETED` in the database
- User's `tokenBalance` increased by 10

---

## S06 — Completing Mission N Unlocks Mission N+1 `[API]`

**Given** an authenticated user who has completed mission `1.1.1`

**When** `GET /api/v1/curriculum/` is called

**Then**
- Mission `1.1.1` has status `completed`
- Mission `1.1.2` has status `available`
- Mission `1.1.3` has status `locked`
- Mission `1.2.1` has status `locked`

---

## S07 — Sequential Unlock Within a Chapter `[API]`

**Given** an authenticated user

**When** missions `1.1.1` and `1.1.2` are completed in order

**Then**
- After completing `1.1.1`: `1.1.2` is `available`, `1.1.3` is `locked`
- After completing `1.1.2`: `1.1.3` is `available`
- At no point are two unlocked missions available simultaneously beyond the current one

---

## S08 — Chapter Completion Unlocks Next Chapter `[API]` `[DB]`

**Given** an authenticated user who has completed missions `1.1.1`, `1.1.2`, and `1.1.3`

**When** `POST /api/v1/curriculum/missions/1.1.3/complete` is called (completing the final mission of chapter 1.1)

**Then**
- Response contains chapter completion indicator: `{ data: { chapterCompleted: true, nextChapterId: "1.2", ... } }`
- `ChapterProgress` for chapter `1.1` has status `COMPLETED` in the database
- `GET /api/v1/curriculum/` shows chapter `1.2` as `available`
- Mission `1.2.1` has status `available`
- Chapter `1.3` remains `locked`

---

## S09 — Category Completion Unlocks Next Category `[API]` `[DB]`

**Given** an authenticated user who has completed all 11 missions in Category 1 (chapters 1.1, 1.2, 1.3)

**When** `POST /api/v1/curriculum/missions/1.3.3/complete` is called (final mission of Category 1)

**Then**
- Response contains category completion indicator
- `GET /api/v1/curriculum/` shows Category 2 as `available`
- Chapter `2.1` has status `available`
- Mission `2.1.1` has status `available`
- Category 3 remains `locked`

---

## S10 — Cannot Complete an Already Completed Mission `[API]`

**Given** an authenticated user who has already completed mission `1.1.1`

**When** `POST /api/v1/curriculum/missions/1.1.1/complete` is called a second time

**Then**
- Response status is `400` or `409`
- Response body contains `{ error: { code: "ALREADY_COMPLETED" } }` or equivalent
- Token balance is NOT incremented a second time (idempotency guaranteed by unique constraint on `TokenTransaction`)

---

## S11 — Cannot Complete a Locked Mission `[API]`

**Given** a newly registered authenticated user

**When** `POST /api/v1/curriculum/missions/1.2.1/complete` is called (mission is locked)

**Then**
- Response status is `403`
- Response body contains `{ error: { code: "FORBIDDEN" } }`
- No `UserProgress` record is created

---

## S12 — Incorrect Exercise Submission Does Not Complete Mission `[API]` `[DB]`

**Given** an authenticated user with mission `1.1.1` available

**When** `POST /api/v1/exercises/{exerciseId}/submit` is called with an incorrect answer

**Then**
- Response status is `200`
- Response contains `{ data: { correct: false, feedback: "..." } }`
- No `UserProgress` record with status `COMPLETED` exists for `(userId, "1.1.1")`
- Mission `1.1.2` remains `locked`
- An `ExerciseAttempt` record is created with `correct: false`

---

## S13 — Incorrect Answer Followed by Correct Answer Completes Mission `[API]`

**Given** an authenticated user with mission `1.1.1` available who submitted one incorrect answer

**When** `POST /api/v1/exercises/{exerciseId}/submit` is called with the correct answer, then `POST /api/v1/curriculum/missions/1.1.1/complete` is called

**Then**
- Exercise submission response has `{ data: { correct: true } }`
- Mission completion response has `{ data: { status: "completed" } }`
- Mission `1.1.2` becomes `available`

---

## S14 — Resume Endpoint Returns Correct Next Mission `[API]`

**Given** an authenticated user who has completed missions `1.1.1` and `1.1.2` but not `1.1.3`

**When** `GET /api/v1/curriculum/resume` is called

**Then**
- Response status is `200`
- Response contains `{ data: { missionId: "1.1.3", ... } }`
- The returned mission is the next uncompleted available mission in sequence

---

## S15 — Resume at Start of New Chapter `[API]`

**Given** an authenticated user who has completed all of chapter 1.1 but not started chapter 1.2

**When** `GET /api/v1/curriculum/resume` is called

**Then**
- Response contains `{ data: { missionId: "1.2.1", ... } }`

---

## S16 — Progress Persists After Session End and Re-login `[API]`

**Given** an authenticated user who has completed missions `1.1.1`, `1.1.2`, `1.1.3` (all of chapter 1.1), then logs out

**When** the user logs back in and calls `GET /api/v1/curriculum/`

**Then**
- Chapter `1.1` still shows as `completed`
- Chapter `1.2` still shows as `available`
- Mission `1.2.1` still shows as `available`
- No progress is reset by the logout/login cycle

---

## S17 — Progress Persists After Page Reload (Session Cookie) `[API]`

**Given** an authenticated user with partial progress (some missions completed) and a valid session cookie

**When** `GET /api/v1/curriculum/` is called again (simulating page reload)

**Then**
- All previously completed missions show status `completed`
- All previously unlocked missions remain `available`
- Response is identical to the pre-reload state

---

## S18 — Attempting to Skip a Mission Is Not Possible `[API]`

**Given** an authenticated user who has completed only mission `1.1.1`

**When** `POST /api/v1/curriculum/missions/1.1.3/complete` is called (mission `1.1.2` not yet completed)

**Then**
- Response status is `403`
- Mission `1.1.3` cannot be completed out of sequence
- Mission `1.1.2` remains `available`, `1.1.3` remains `locked`

---

## S19 — All Missions in a Chapter Must Be Completed for Chapter Completion `[DB]`

**Given** an authenticated user who has completed 4 of 5 missions in chapter 1.2 (missions `1.2.1`–`1.2.4` completed, `1.2.5` not yet done)

**When** `GET /api/v1/curriculum/` is called

**Then**
- Chapter `1.2` has status `inProgress` (not `completed`)
- Chapter `1.3` is still `locked`
- Mission `1.2.5` is `available`

---

## S20 — Unauthenticated Requests to Curriculum Are Rejected `[API]`

**Given** no valid session cookie is present

**When** any of the following endpoints are called: `GET /api/v1/curriculum/`, `GET /api/v1/curriculum/missions/1.1.1`, `POST /api/v1/curriculum/missions/1.1.1/complete`

**Then**
- All return response status `401`
- All return `{ error: { code: "UNAUTHORIZED" } }`

---

## S21 — Completing Final Mission of Curriculum Triggers Certificate `[API]` `[DB]`

**Given** an authenticated user who has completed all 68 preceding missions (all categories 1–6 except mission `6.3.4`)

**When** `POST /api/v1/curriculum/missions/6.3.4/complete` is called

**Then**
- Response status is `200`
- Response includes `{ data: { certificate: { shareToken: "...", ... } } }`
- A `Certificate` record exists in the database for this user
- `GET /api/v1/users/me/certificate` returns the certificate
- `GET /api/v1/certificates/:shareToken` returns the public certificate (no auth required)

---

## S22 — Category Completion Achievement Is Awarded `[API]`

**Given** an authenticated user who has completed all 11 missions in Category 1

**When** `POST /api/v1/curriculum/missions/1.3.3/complete` is called

**Then**
- Response includes an `achievementsAwarded` array containing the Category 1 completion achievement
- `GET /api/v1/gamification/achievements` shows this achievement as earned with a timestamp

---

## S23 — Token Balance Accumulates Correctly Across Multiple Completions `[API]`

**Given** an authenticated user who completes missions `1.1.1`, `1.1.2`, and `1.1.3` in sequence

**When** `GET /api/v1/tokens/balance` is called after all three completions

**Then**
- `tokenBalance` is `30` (3 missions × 10 tokens each)
- `totalEarned` is `30`
- `GET /api/v1/tokens/history` returns 3 `EARN` transactions, one per mission

---

## S24 — Curriculum Chain Returns Completed Missions in Order `[API]`

**Given** an authenticated user who has completed missions `1.1.1`, `1.1.2`, `1.1.3`, `1.2.1` in order

**When** `GET /api/v1/curriculum/chain` is called

**Then**
- Response contains an ordered array of completed mission IDs: `["1.1.1", "1.1.2", "1.1.3", "1.2.1"]`
- Order reflects completion sequence, not curriculum order (though they are the same under sequential unlock)

---

## S25 — Disclaimer Gate Prevents Chapter Entry Without Acceptance `[API]`

**Given** an authenticated user who has unlocked chapter 2.3 (completed all of chapter 2.2) but has not accepted the financial disclaimer

**When** `GET /api/v1/curriculum/missions/2.3.1` is called

**Then**
- Response status is `403`
- Response contains `{ error: { code: "DISCLAIMER_REQUIRED", moduleId: "2.3" } }` or equivalent

**And when** `POST /api/v1/disclaimers/accept` is called with the appropriate module ID

**Then**
- `GET /api/v1/curriculum/missions/2.3.1` returns `200` with mission content
