# Story 4.1: Exercise Submission API & Feedback Engine

Status: ready-for-dev

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to submit exercise answers and receive immediate validation,
So that I know whether my answer was correct and can learn from mistakes.

## Acceptance Criteria

1. **Given** an authenticated user in an active mission,
   **When** they call `POST /api/v1/exercises/:exerciseId/submit` with their answer,
   **Then** the answer is validated against the correct answer defined in the content JSON,
   **And** the response includes: correct/incorrect status, correct answer (if wrong), explanation text,
   **And** the response is returned within <200ms (NFR1),
   **And** the exercise attempt is recorded in the database (ExerciseAttempt table: userId, exerciseId, missionId, answer, correct, createdAt).

2. **Given** a mission with its exercise,
   **When** the user has submitted a correct answer for the exercise,
   **Then** `GET /api/v1/missions/:missionId/status` returns the mission as completable,
   **And** the user can trigger mission completion via Story 3.3's `POST /api/v1/curriculum/missions/:missionId/complete` endpoint.

3. **Given** any exercise submission,
   **When** Zod validates the request body,
   **Then** the submission format matches the exercise type (placement order, matched pairs, step selections, or selected option).

## Tasks / Subtasks

- [ ] Task 1: Add ExerciseAttempt model to Prisma schema (AC: #1)
  - [ ] 1.1 Add `ExerciseAttempt` model to `apps/api/prisma/schema.prisma`: id (cuid), userId, exerciseId (= missionId string), answer (Json), correct (Boolean), createdAt
  - [ ] 1.2 Add relation to User model (`exerciseAttempts ExerciseAttempt[]`)
  - [ ] 1.3 Add index on `(userId, exerciseId)` for fast lookups
  - [ ] 1.4 Run `npx prisma migrate dev --name add-exercise-attempt` to generate and apply migration
  - [ ] 1.5 Update `resetDatabase()` in `apps/api/src/__tests__/setup-integration.ts` to truncate `ExerciseAttempt` table

- [ ] Task 2: Create exercise submission Zod schemas in packages/shared (AC: #3)
  - [ ] 2.1 Add submission request schemas to `packages/shared/src/schemas/exercise.ts`:
    - `siSubmissionSchema`: `{ type: "SI", submission: { selectedOptionId: string } }`
    - `cmSubmissionSchema`: `{ type: "CM", submission: { matches: [{ termId, definitionId }] } }`
    - `ipSubmissionSchema`: `{ type: "IP", submission: { positions: [{ itemId, position }] } }`
    - `stSubmissionSchema`: `{ type: "ST", submission: { stepAnswers: [{ stepId, selectedOptionId }] } }`
    - `exerciseSubmissionSchema`: discriminated union on `type` field
  - [ ] 2.2 Add submission response schema `exerciseResultSchema`:
    - `{ correct: boolean, score: number, totalPoints: number, feedback: [{ itemId, correct, explanation, correctAnswer? }] }`
  - [ ] 2.3 Export new types from `packages/shared/src/types/curriculum.ts` (ExerciseSubmission, ExerciseResult, etc.)
  - [ ] 2.4 Add missionStatusSchema for GET /missions/:missionId/status response
  - [ ] 2.5 Add tests for all new schemas in `packages/shared/src/schemas/exercise.test.ts`

- [ ] Task 3: Create exerciseService.ts with answer validation logic (AC: #1)
  - [ ] 3.1 Create `apps/api/src/services/exerciseService.ts`
  - [ ] 3.2 Implement `submitExercise(userId, exerciseId, submission, locale)`:
    - Load exercise content from `getContent().missions.get(locale)` (fall back to "en")
    - Get exercise type from `getContent().curriculum` structure.json mission metadata
    - Dispatch to type-specific validator
    - Record attempt in ExerciseAttempt table via Prisma
    - Return result with per-item feedback
  - [ ] 3.3 Implement type-specific validators:
    - `validateSI(submission, content)`: check selectedOptionId against options[].isCorrect
    - `validateCM(submission, content)`: check each match (termId === definitionId means correct pair)
    - `validateIP(submission, content)`: check each item's position against items[].correctPosition
    - `validateST(submission, content)`: check each step's selectedOptionId against steps[].options[].isCorrect
  - [ ] 3.4 Implement `getMissionExerciseStatus(userId, missionId)`:
    - Query ExerciseAttempt for any correct attempt for this user + mission
    - Return `{ missionId, completable, attempts, lastAttemptCorrect }`
  - [ ] 3.5 Add comprehensive unit tests: `apps/api/src/services/exerciseService.test.ts`

- [ ] Task 4: Create exercises route with submission and status endpoints (AC: #1, #2)
  - [ ] 4.1 Create `apps/api/src/routes/exercises.ts`
  - [ ] 4.2 Implement `POST /api/v1/exercises/:exerciseId/submit`:
    - Auth middleware required
    - Validate request body with Zod (exerciseSubmissionSchema)
    - Check mission access status via curriculumService.getMissionAccessStatus() — must NOT be "locked"
    - Call exerciseService.submitExercise()
    - Return result in standard `{ data: T }` format
  - [ ] 4.3 Implement `GET /api/v1/missions/:missionId/status`:
    - Auth middleware required
    - Call exerciseService.getMissionExerciseStatus()
    - Return status in standard `{ data: T }` format
  - [ ] 4.4 Register routes in `apps/api/src/app.ts`
  - [ ] 4.5 Add route tests: `apps/api/src/routes/exercises.test.ts` (mocked Prisma, matching existing route test patterns)

- [ ] Task 5: Add integration tests for exercise submission (AC: #1, #2, #3)
  - [ ] 5.1 Create `apps/api/src/__tests__/integration/exercise-submission.test.ts`:
    - Submit correct SI answer → 200, correct: true, ExerciseAttempt in real DB
    - Submit incorrect SI answer → 200, correct: false, feedback with correct answer
    - Submit CM answer with all correct matches → correct: true
    - Submit CM answer with mixed results → per-match feedback
    - Submit IP answer → validate positions
    - Submit ST answer → validate each step with microExplanations
    - Check mission status after correct submission → completable: true
    - Check mission status with no attempts → completable: false
    - Complete mission after correct exercise → progress updated (chain with 3.3)
    - Submit to locked mission → 403 MISSION_LOCKED
    - Submit invalid body → 400 INVALID_INPUT
    - Submit without auth → 401 UNAUTHORIZED
  - [ ] 5.2 Verify all existing tests still pass (`pnpm test` + `pnpm test:integration`)

## Dev Notes

### Critical Architecture Patterns

- **Exercise = Mission (1:1 mapping):** Each mission has exactly ONE exercise. The `exerciseContent` field in `missions.json` is a single object, not an array. Therefore **`exerciseId` = `missionId`** (e.g., "1.1.1"). The API uses `/exercises/` as the REST resource for clarity, but the ID is the mission ID. [Source: content/en/missions.json — each mission has one exerciseContent]

- **Content is read-only and cached:** Exercise content (correct answers, explanations) lives in static JSON files loaded at startup via `contentLoader.ts`. The `getContent()` singleton returns the in-memory cache — zero file I/O at runtime. Never modify content files from the API. [Source: apps/api/src/utils/contentLoader.ts]

- **Thin route handlers:** Route validates input (Zod), calls service, returns response. ALL business logic lives in `exerciseService.ts`. Route handlers NEVER access Prisma directly. [Source: architecture.md § Implementation Patterns]

- **Standard response format:** Success: `{ data: T }`. Error: `{ error: { code: string, message: string, details?: Record<string, string> } }`. Error codes: UPPER_SNAKE_CASE. [Source: architecture.md § Format Patterns]

- **Co-located tests:** Unit tests next to source files (`exerciseService.test.ts` alongside `exerciseService.ts`). Integration tests in `src/__tests__/integration/`. [Source: architecture.md § Structure Patterns]

- **Extract patterns at 2nd occurrence:** If any utility pattern (e.g., locale fallback) is duplicated from curriculumService, extract it into a shared helper immediately. [Source: epic-3-retro — team agreement]

### Exercise Type Validation Logic

**SI (Scenario Interpretation — 43% of missions):**
```
User submits: { type: "SI", submission: { selectedOptionId: "b" } }
Validate: Find option in content.options[] where id === selectedOptionId
Result: option.isCorrect → true/false
Feedback: option.explanation (always provided)
If wrong: include the correct option's id + text
```

**CM (Concept Matching — 25% of missions):**
```
Content structure: pairs[] = [{ id: "1", term: "...", definition: "..." }, ...]
User submits: { type: "CM", submission: { matches: [{ termId: "1", definitionId: "1" }, ...] } }
Validate: A match is correct when termId === definitionId (same pair)
  - The pair.id identifies both the term AND its correct definition
  - Frontend shuffles definitions; user reconnects them
  - Require matches for ALL pairs; missing = incorrect
Feedback: per-match correct/incorrect + correct pairing
```

**IP (Interactive Placement — 17% of missions):**
```
Content structure: items[] = [{ id: "1", label: "...", correctPosition: 0 }, ...]
User submits: { type: "IP", submission: { positions: [{ itemId: "1", position: 0 }, ...] } }
Validate: Compare each position to items[].correctPosition
  - Reject duplicate positions (400 INVALID_INPUT)
  - Require positions for ALL items; missing = incorrect
Feedback: per-item correct/incorrect + correct position
```

**ST (Step-by-Step — 15% of missions):**
```
Content structure: steps[] = [{ id: "1", prompt: "...", options: [...], microExplanation: "..." }, ...]
User submits: { type: "ST", submission: { stepAnswers: [{ stepId: "1", selectedOptionId: "a" }, ...] } }
Validate: For each step, find selected option in step.options[], check isCorrect
  - Require answers for ALL steps in one submission
  - Partial submissions rejected (400)
Feedback: per-step correct/incorrect + step.microExplanation + correct option if wrong
```

### Prisma Schema Addition

```prisma
model ExerciseAttempt {
  id         String   @id @default(cuid())
  userId     String
  exerciseId String   // Same as missionId (e.g., "1.1.1")
  answer     Json     // The raw submission payload (type-specific)
  correct    Boolean  // Overall result: true if ALL items correct
  createdAt  DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, exerciseId])
}
```

Add to User model: `exerciseAttempts ExerciseAttempt[]`

### API Endpoint Design

```
POST /api/v1/exercises/:exerciseId/submit
  Auth: Required (session cookie)
  Params: exerciseId = missionId (e.g., "1.1.1")
  Body: {
    type: "SI" | "CM" | "IP" | "ST",
    submission: { ... }  // Type-specific payload (see schemas above)
  }

  200 Response (success — both correct and incorrect answers):
  {
    "data": {
      "correct": boolean,
      "score": number,        // Number of correct items
      "totalPoints": number,  // Total items validated
      "feedback": [
        {
          "itemId": string,         // Option/pair/item/step ID
          "correct": boolean,
          "explanation": string,
          "correctAnswer": string | null  // Only if incorrect
        }
      ]
    }
  }

  400: { error: { code: "INVALID_INPUT", message, details } }
  401: { error: { code: "UNAUTHORIZED", message } }
  403: { error: { code: "MISSION_LOCKED", message } }
  404: { error: { code: "EXERCISE_NOT_FOUND", message } }
  501: { error: { code: "EXERCISE_CONTENT_UNAVAILABLE", message } }  // placeholder content


GET /api/v1/missions/:missionId/status
  Auth: Required (session cookie)

  200 Response:
  {
    "data": {
      "missionId": string,
      "completable": boolean,     // true if any correct attempt exists
      "attempts": number,         // Total attempts for this exercise
      "lastAttemptCorrect": boolean | null  // null if no attempts
    }
  }

  401: { error: { code: "UNAUTHORIZED", message } }
  404: { error: { code: "MISSION_NOT_FOUND", message } }
```

### Existing Code to Reuse

1. **`curriculumService.getMissionAccessStatus(userId, missionId)`** — Already implements mission access checking (locked/available/inProgress/completed). Reuse this to gate exercise submissions. Located at `apps/api/src/services/curriculumService.ts`.

2. **`getContent()`** — Content loader singleton. Access exercise content via `getContent().missions.get(locale)?.['1.1.1'].exerciseContent`. Located at `apps/api/src/utils/contentLoader.ts`.

3. **`getContent().curriculum`** — Structure metadata. Get exercise type via iterating categories > chapters > missions to find the mission by ID. Consider extracting a `getMissionMetadata(missionId)` helper if this lookup is needed in multiple places.

4. **Existing Zod schemas** — `siExerciseContentSchema`, `cmExerciseContentSchema`, `ipExerciseContentSchema`, `stExerciseContentSchema` in `packages/shared/src/schemas/exercise.ts` define the CONTENT shape. The new submission schemas define the USER INPUT shape — these are different.

5. **Integration test helpers** — `createAndLoginUser()`, `resetDatabase()`, `testPrisma` from `apps/api/src/__tests__/integration/helpers/`. [Source: 4-0-e2e-testing-infrastructure.md]

6. **Validate middleware** — `validate(schema)` middleware in `apps/api/src/middleware/validate.ts` for Zod request body validation.

7. **Auth middleware** — `requireAuth` in `apps/api/src/middleware/auth.ts` for session authentication.

8. **AppError class** — `apps/api/src/utils/AppError.ts` for typed errors with HTTP status codes.

### Edge Cases to Handle

1. **Resubmission allowed:** Users can submit the same exercise multiple times. Each attempt is recorded. The mission becomes completable after ANY correct attempt. Already-completed missions also accept submissions (practice mode).

2. **Locked mission guard:** If the exercise's mission is locked (per curriculumService.getMissionAccessStatus), return 403 `MISSION_LOCKED`. Do NOT reveal exercise content or validate answers for locked missions.

3. **Placeholder content:** If exercise content has `placeholder: true` (French translations), return 501 `EXERCISE_CONTENT_UNAVAILABLE`. Check for this before attempting validation.

4. **CM incomplete matches:** Require matches for ALL pairs defined in content. If user submits fewer matches than pairs, missing pairs count as incorrect (not a 400 error — just scored as wrong).

5. **IP duplicate positions:** If two items have the same position value, return 400 `INVALID_INPUT` with details explaining the duplicate.

6. **ST partial submission:** Require answers for ALL steps. If user submits fewer step answers than steps in content, return 400 `INVALID_INPUT`.

7. **Invalid option/item/step IDs:** If user references an ID not present in content, return 400 `INVALID_INPUT` with details.

8. **Concurrent submissions:** Two simultaneous submissions for the same exercise should both succeed (no unique constraint on userId + exerciseId — multiple attempts allowed).

### Performance Budget

Target: <200ms end-to-end (NFR1).

| Operation | Estimated Time |
|-----------|---------------|
| Zod validation | ~1ms |
| Content lookup (in-memory) | ~0.1ms |
| Mission access check (1-2 DB queries) | ~5-10ms |
| Answer comparison (pure computation) | ~0.1ms |
| Prisma INSERT (ExerciseAttempt) | ~5-15ms |
| **Total server time** | **~15-30ms** |

Well within the 200ms budget. Network latency is the main variable.

### Rate Limiting Consideration

Exercise submissions should use the existing rate limiter. The default rate limit should be sufficient (no brute-force concern since answers are educational, not secrets). If needed later, a per-exercise rate limit can be added.

### Locale Handling

1. Get user's locale from `req.user.locale` (stored in User table, default "en")
2. Load exercise content from `getContent().missions.get(locale)`
3. If locale not found OR exercise has `placeholder: true`, fall back to "en"
4. Return feedback text in the resolved locale
5. Consider extracting locale fallback into a shared utility if curriculumService already has this pattern (team agreement: extract at 2nd occurrence)

### Project Structure Notes

**New files:**
```
apps/api/src/services/exerciseService.ts          # Business logic
apps/api/src/services/exerciseService.test.ts      # Unit tests (co-located)
apps/api/src/routes/exercises.ts                   # Route handlers
apps/api/src/routes/exercises.test.ts              # Route tests (co-located)
apps/api/src/__tests__/integration/exercise-submission.test.ts  # Integration tests
```

**Modified files:**
```
apps/api/prisma/schema.prisma                      # Add ExerciseAttempt model
apps/api/src/app.ts                                # Register exercise routes
apps/api/src/__tests__/setup-integration.ts        # Add ExerciseAttempt to truncation
packages/shared/src/schemas/exercise.ts            # Add submission schemas
packages/shared/src/schemas/exercise.test.ts       # Add submission schema tests
packages/shared/src/types/curriculum.ts            # Add submission/result types
packages/shared/src/index.ts                       # Export new schemas/types
```

### Previous Story Intelligence

From Story 4.0 (Integration Testing Infrastructure):
- 12 integration tests across 3 files, all using real DB + Redis
- Test DB: `transcendence_test` on Supabase local PostgreSQL (port 54322)
- Redis: standalone Docker container on port 6379, DB index 1 for tests
- `resetDatabase()` truncates: `SelfAssessment`, `ChapterProgress`, `UserProgress`, `User` — **must add `ExerciseAttempt`**
- `createAndLoginUser(agent)` helper: registers + logs in, returns agent with session cookie
- Rate limiter set to 10000 max in test config
- `vitest.integration.config.ts` runs tests sequentially (no concurrency)
- Pattern: import real app → create agent → make requests → assert DB state

### Git Intelligence

Recent commits follow `feat(domain):` convention:
- `test(api): add integration testing infrastructure...` (Story 4.0)
- `feat(curriculum): add learning chain visualization API` (Story 3.5)
- `feat(curriculum): add jargon tooltips API...` (Story 3.4)

This story's commit should follow: `feat(exercises): add exercise submission API and feedback engine (Story 4.1)`

### References

- [Source: _bmad-output/planning-artifacts/epics.md § Story 4.1 — Exercise Submission API & Feedback Engine]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns — thin routes, service layer, co-located tests]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns — API response format, error codes]
- [Source: _bmad-output/planning-artifacts/architecture.md § Authentication & Security — session-based auth, HTTP-only cookies]
- [Source: _bmad-output/planning-artifacts/architecture.md § Project Structure — exercises.ts route, exerciseService.ts planned]
- [Source: packages/shared/src/schemas/exercise.ts — existing Zod schemas for 4 exercise content types]
- [Source: packages/shared/src/types/curriculum.ts — ExerciseContent, MissionContent types]
- [Source: content/en/missions.json — exercise content format with real data for all 69 missions]
- [Source: content/structure.json — mission metadata, exerciseType field, progressive reveal flags]
- [Source: apps/api/src/services/curriculumService.ts — getMissionAccessStatus(), completeMission(), getMissionDetail()]
- [Source: apps/api/src/utils/contentLoader.ts — getContent() singleton, in-memory caching pattern]
- [Source: apps/api/src/middleware/validate.ts — Zod validation middleware]
- [Source: apps/api/src/middleware/auth.ts — requireAuth middleware]
- [Source: apps/api/src/utils/AppError.ts — typed error class with HTTP status codes]
- [Source: _bmad-output/implementation-artifacts/4-0-e2e-testing-infrastructure.md — integration test infrastructure, helpers, resetDatabase()]
- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-03-09.md — extract patterns at 2nd occurrence, mandatory code reviews]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### Change Log

### File List
