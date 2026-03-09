# Story 3.3: Mission Completion & Progress Tracking

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to mark missions as complete and have my progress saved,
So that I can advance through the curriculum and resume where I left off.

## Acceptance Criteria

1. **Given** an authenticated user who has completed all exercises in a mission,
   **When** `POST /api/v1/curriculum/missions/:missionId/complete` is called,
   **Then** the mission is marked as completed in the database,
   **And** the next mission in sequence is unlocked,
   **And** if all missions in a chapter are complete, the chapter is marked complete,
   **And** if all chapters in a category are complete, the category is marked complete,
   **And** the updated progress is returned in the response.

2. **Given** a user resuming after absence (FR12),
   **When** they call `GET /api/v1/curriculum/resume`,
   **Then** the response returns their last incomplete mission ID and chapter context,
   **And** progress data persists across sessions and server restarts (NFR14).

3. **Given** a user completing a category,
   **When** the category contains a post-module self-assessment (FR48),
   **Then** the self-assessment mission is presented as the final mission of the category,
   **And** the user's confidence rating is recorded.

4. **Given** a user attempting to complete a mission they haven't unlocked,
   **When** `POST /api/v1/curriculum/missions/:missionId/complete` is called,
   **Then** a 403 error is returned with code `MISSION_LOCKED`.

5. **Given** a user attempting to complete a mission that is already completed,
   **When** `POST /api/v1/curriculum/missions/:missionId/complete` is called,
   **Then** a 409 error is returned with code `MISSION_ALREADY_COMPLETED`.

6. **Given** a user attempting to complete a non-existent mission,
   **When** `POST /api/v1/curriculum/missions/:missionId/complete` is called with an invalid ID,
   **Then** a 404 error is returned with code `MISSION_NOT_FOUND` (or 400 for invalid format).

7. **Given** all mission completion and resume endpoints,
   **When** input is submitted,
   **Then** Zod validates request params and body,
   **And** invalid input returns 400 with field-level error details.

8. **Given** the mission completion endpoint,
   **When** called without authentication,
   **Then** a 401 error is returned.

## Tasks / Subtasks

- [x] Task 1: Add shared Zod schemas and types for mission completion (AC: #3, #7)
  - [x] 1.1 Add to `packages/shared/src/schemas/progress.ts`:
    - `completeMissionBodySchema`: `z.object({ confidenceRating: z.number().int().min(1).max(5).optional() })` — optional self-assessment rating (only used for final mission of each category)
    - `resumeResponseSchema`: response shape for resume endpoint
  - [x] 1.2 Add to `packages/shared/src/types/progress.ts`:
    - `CompleteMissionBody`: inferred from `completeMissionBodySchema`
    - `CompleteMissionResponse`: `{ missionId: string, status: "completed", chapterCompleted: boolean, categoryCompleted: boolean, nextMissionId: string | null, completionPercentage: number, progressiveReveal: { mechanic: string, description: string } | null }`
    - `ResumeResponse`: `{ missionId: string, missionTitle: string, chapterId: string, chapterTitle: string, categoryId: string, completionPercentage: number }`
  - [x] 1.3 Export new schemas and types from `packages/shared/src/index.ts`

- [x] Task 2: Add `completeMission` method to `curriculumService.ts` (AC: #1, #4, #5, #6)
  - [x] 2.1 Implement `completeMission(userId: string, missionId: string, confidenceRating?: number): Promise<CompleteMissionResponse>`:
    - Validate missionId exists in curriculum structure → 404 `MISSION_NOT_FOUND` if not
    - Check access via `getMissionAccessStatus(userId, missionId)`:
      - If `"locked"` → throw 403 `MISSION_LOCKED`
      - If `"completed"` → throw 409 `MISSION_ALREADY_COMPLETED`
      - If `"available"` or `"inProgress"` → proceed
    - Use **Prisma `$transaction`** to atomically:
      1. Upsert `UserProgress` for this mission with `status: COMPLETED`, `completedAt: now()`
      2. Check if all missions in the chapter are now completed → if yes, upsert `ChapterProgress` with `status: COMPLETED`, `completedAt: now()`
      3. If `confidenceRating` is provided AND this is a self-assessment mission → store the rating (see Task 3)
    - After transaction, compute:
      - `chapterCompleted`: boolean — was the chapter just completed?
      - `categoryCompleted`: boolean — are all chapters in the category now completed?
      - `nextMissionId`: the next sequential mission (or null if curriculum complete)
      - `completionPercentage`: updated total (completedMissions / 69 * 100, rounded to 1 decimal)
      - `progressiveReveal`: if this mission has a reveal trigger in `structure.json`, return the reveal object
    - Return `CompleteMissionResponse`
  - [x] 2.2 Helper: `getNextMissionId(currentMissionId: string): string | null`
    - Walk the curriculum structure to find the next mission in sequence
    - Within a chapter: next mission by order
    - End of chapter: first mission of next chapter in same category
    - End of category: first mission of next category
    - End of curriculum (mission 6.3.4): return null
  - [x] 2.3 Helper: `isChapterComplete(userId: string, chapterId: string, tx: PrismaTransaction): Promise<boolean>`
    - Count completed missions in the chapter from UserProgress (within the transaction context)
    - Compare against total missions in the chapter from curriculum structure
  - [x] 2.4 Helper: `isCategoryComplete(userId: string, categoryId: string): Promise<boolean>`
    - Check if all chapters in the category have ChapterProgress status = COMPLETED

- [x] Task 3: Add Prisma schema for self-assessment ratings (AC: #3)
  - [x] 3.1 Add `SelfAssessment` model to `prisma/schema.prisma`:
    - `id` (String, UUID, @id)
    - `userId` (String, FK → User)
    - `categoryId` (String) — the category this self-assessment belongs to
    - `confidenceRating` (Int) — 1-5 scale
    - `createdAt` (DateTime, @default(now()))
    - Unique constraint: `@@unique([userId, categoryId])`
    - Index on `userId`
  - [x] 3.2 Add relation: `User` has many `SelfAssessment` (cascade delete)
  - [x] 3.3 Run `npx prisma migrate dev --name add-self-assessment` to create migration

- [x] Task 4: Add `getResumePoint` method to `curriculumService.ts` (AC: #2)
  - [x] 4.1 Implement `getResumePoint(userId: string, locale: string): Promise<ResumeResponse | null>`:
    - Query `UserProgress` for the user's last completed mission (order by `completedAt DESC`, limit 1)
    - Compute the next mission after the last completed one using `getNextMissionId()`
    - If no completed missions → return first mission (1.1.1)
    - If all missions completed → return null (curriculum complete)
    - Look up mission title and chapter/category titles from content cache (using locale)
    - Compute current `completionPercentage`
    - Return `ResumeResponse`

- [x] Task 5: Add routes for mission completion and resume (AC: #1, #2, #4, #5, #6, #7, #8)
  - [x] 5.1 Add to `apps/api/src/routes/curriculum.ts`:
    - `POST /api/v1/curriculum/missions/:missionId/complete` — authenticated, validates missionId param + optional body with confidenceRating, calls `completeMission()`
    - `GET /api/v1/curriculum/resume` — authenticated, calls `getResumePoint()`
  - [x] 5.2 Both routes require `requireAuth` middleware
  - [x] 5.3 POST route validates `:missionId` with `missionIdParamSchema` and body with `completeMissionBodySchema`
  - [x] 5.4 Response format: `{ data: CompleteMissionResponse }` or `{ data: ResumeResponse }`

- [x] Task 6: Write tests (AC: #1–#8)
  - [x] 6.1 Unit tests for `curriculumService.ts` — `completeMission`:
    - Complete first mission (1.1.1): creates UserProgress + returns next mission (1.1.2)
    - Complete last mission in chapter: marks chapter completed in ChapterProgress
    - Complete last mission in category: `categoryCompleted: true`
    - Complete mission with progressive reveal trigger (2.2.4): returns reveal object
    - Attempt to complete locked mission: throws 403 MISSION_LOCKED
    - Attempt to complete already completed mission: throws 409 MISSION_ALREADY_COMPLETED
    - Attempt to complete non-existent mission: throws 404 MISSION_NOT_FOUND
    - Complete with confidenceRating: creates SelfAssessment record
    - Complete final curriculum mission (6.3.4): nextMissionId = null
  - [x] 6.2 Unit tests for `curriculumService.ts` — `getResumePoint`:
    - New user (no progress): returns mission 1.1.1
    - User with some progress: returns next mission after last completed
    - User who completed everything: returns null
    - Locale-aware: returns titles in requested locale
  - [x] 6.3 Integration tests for routes:
    - `POST /api/v1/curriculum/missions/1.1.1/complete` (authenticated) → 200 with CompleteMissionResponse
    - `POST /api/v1/curriculum/missions/1.1.1/complete` (unauthenticated) → 401
    - `POST /api/v1/curriculum/missions/2.1.1/complete` (authenticated, locked) → 403 MISSION_LOCKED
    - `POST /api/v1/curriculum/missions/1.1.1/complete` (authenticated, already done) → 409 MISSION_ALREADY_COMPLETED
    - `POST /api/v1/curriculum/missions/99.99.99/complete` (authenticated) → 404 MISSION_NOT_FOUND
    - `POST /api/v1/curriculum/missions/invalid/complete` (authenticated) → 400 INVALID_INPUT
    - `POST /api/v1/curriculum/missions/1.1.1/complete` with `{ confidenceRating: 4 }` → 200
    - `GET /api/v1/curriculum/resume` (authenticated, no progress) → 200 with mission 1.1.1
    - `GET /api/v1/curriculum/resume` (authenticated, some progress) → 200 with next mission
    - `GET /api/v1/curriculum/resume` (unauthenticated) → 401
  - [x] 6.4 Schema validation tests (`packages/shared/`):
    - `completeMissionBodySchema` validates `{ confidenceRating: 4 }`, rejects `{ confidenceRating: 6 }`, accepts empty `{}`
  - [x] 6.5 Regression: all existing 294 API + shared tests still pass (6 pre-existing web/dist failures unrelated to this story)

## Dev Notes

### Critical Architecture Patterns

- **Route handlers are thin**: validate → service → respond. All business logic lives in `curriculumService.ts`. Routes do NOT use try/catch — Express 5 auto-catches async rejections and forwards to the global `errorHandler` middleware. [Source: architecture.md § Implementation Patterns]
- **Error handling**: Services throw `AppError` instances with `new AppError(statusCode, code, message)`. AppError class is at `apps/api/src/utils/AppError.ts`. [Source: Story 2.7 Dev Notes]
- **Response format**: Success = `{ data: T }`, Error = `{ error: { code, message, details? } }`. [Source: architecture.md § Format Patterns]
- **Prisma as data access**: Services import the Prisma client from `config/database.ts` (`import { prisma } from '../config/database.js'`). Never access Prisma directly from routes.
- **Prisma transactions**: Use `prisma.$transaction(async (tx) => { ... })` for multi-table writes. Pass `tx` to helper methods that need to run within the transaction context.

### Content Loader — How to Access Curriculum Data

Story 3.1 created `contentLoader.ts` which loads all curriculum JSON at server startup. Access cached content via:

```typescript
import { getContent } from '../utils/contentLoader.js';

const content = getContent();
const curriculum = content.curriculum;                    // CurriculumStructure (Category[])
const missions = content.missions.get(locale);           // MissionContentCollection (Record<string, MissionContent>)
const tooltips = content.tooltips.get(locale);           // TooltipCollection (Record<string, Tooltip>)
const uiStrings = content.uiStrings.get(locale);         // UIStrings
```

### Curriculum Structure — Key Data Points

- **69 missions** total across 6 categories, 18 chapters
- **Mission IDs**: `"{categoryNum}.{chapterNum}.{missionNum}"` (e.g., "1.1.1", "2.2.4", "6.3.4")
- **Chapter IDs**: `"{categoryNum}.{chapterNum}"` (e.g., "1.1", "2.3", "6.3")
- **Category IDs**: `"{categoryNum}"` (e.g., "1", "2", "6")
- **Exercise types**: `"SI"` | `"CM"` | `"IP"` | `"ST"` — stored in `structure.json` per mission
- **Sequential unlock**: Chapter N requires all missions of Chapter N-1 completed. Within a chapter, Mission M requires Mission M-1 completed.
- **Progressive reveal triggers**: Missions 2.2.4 (tokensRevealed), 3.1.4 (walletRevealed), 3.3.3 (gasRevealed), 6.3.4 (dashboardRevealed)

### Mission Completion — Detailed Algorithm

```
completeMission(userId, missionId, confidenceRating?):
  1. Find mission in curriculum structure → 404 if not found
  2. Check access status via getMissionAccessStatus() → 403 if locked, 409 if completed
  3. Transaction:
     a. Upsert UserProgress: status=COMPLETED, completedAt=now()
     b. Find chapter this mission belongs to
     c. Count completed missions in chapter vs total missions in chapter
     d. If all missions done → upsert ChapterProgress: status=COMPLETED, completedAt=now()
     e. If confidenceRating provided → upsert SelfAssessment record
  4. Post-transaction computations:
     a. chapterCompleted = was chapter just completed?
     b. categoryCompleted = all chapters in category now completed?
     c. nextMissionId = getNextMissionId(missionId)
     d. completionPercentage = (total completed missions / 69) * 100
     e. progressiveReveal = mission's progressiveReveal from structure.json
  5. Return CompleteMissionResponse
```

### Resume Point — Algorithm

```
getResumePoint(userId, locale):
  1. Query last completed mission by completedAt DESC
  2. If none → return mission 1.1.1 (first mission)
  3. If last completed is 6.3.4 → return null (curriculum complete)
  4. Compute next mission via getNextMissionId(lastCompletedMissionId)
  5. Look up titles from content cache (locale-aware)
  6. Return ResumeResponse
```

### Existing curriculumService Methods (DO NOT MODIFY)

The following methods from Story 3.2 are already implemented and tested. **Do NOT modify them** — extend the service by ADDING new methods:

- `getCurriculumWithProgress(userId: string)` — returns full curriculum overlay
- `getMissionAccessStatus(userId: string, missionId: string)` — checks if a mission is locked/available/completed
- `getMissionDetail(userId: string, missionId: string, locale: string)` — returns mission content

### Prisma Transaction Pattern

```typescript
import { prisma } from '../config/database.js';

const result = await prisma.$transaction(async (tx) => {
  // Use tx instead of prisma for all queries within the transaction
  await tx.userProgress.upsert({
    where: { userId_missionId: { userId, missionId } },
    update: { status: 'COMPLETED', completedAt: new Date() },
    create: { userId, missionId, status: 'COMPLETED', completedAt: new Date() },
  });

  // Check chapter completion within same transaction
  const completedCount = await tx.userProgress.count({
    where: { userId, missionId: { in: chapterMissionIds }, status: 'COMPLETED' },
  });

  if (completedCount === totalMissionsInChapter) {
    await tx.chapterProgress.upsert({ ... });
  }

  return { ... };
});
```

### Self-Assessment Design Decisions

- **Confidence rating is 1-5 integer** — simple Likert scale (1=not confident, 5=very confident)
- **Stored in separate `SelfAssessment` table** — not in UserProgress, because self-assessments are per-category (one per category), not per-mission
- **Optional field in completion body** — only sent by frontend when completing a self-assessment mission (the last mission of each category)
- **Upsert pattern** — if user somehow completes the same category twice, the rating is updated, not duplicated
- **No impact on progression** — the rating is informational only, it doesn't affect unlocking

### Existing Database Schema — Current State

```prisma
// Existing models (DO NOT MODIFY structure, only ADD new models):
enum AuthProvider { LOCAL, GOOGLE, FACEBOOK }
enum MissionStatus { AVAILABLE, IN_PROGRESS, COMPLETED }
enum ChapterStatus { LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED }

model User { ... }              // id, email, passwordHash, displayName, bio, avatarUrl, locale, etc.
model OAuthAccount { ... }      // OAuth provider links
model PasswordResetToken { ... }
model UserProgress { ... }      // userId + missionId + status + completedAt
model ChapterProgress { ... }   // userId + chapterId + status + completedAt

// NEW model to add:
model SelfAssessment { ... }    // userId + categoryId + confidenceRating
```

### Testing Patterns from Story 3.2

- **400 tests** currently pass across API (254) + shared (118) + web (28)
- Mock Prisma: `vi.hoisted(() => ({ ... }))` + `vi.mock('../config/database.js', ...)`
- Mock content: `vi.hoisted(() => ({ getContent: vi.fn() }))` + `vi.mock('../utils/contentLoader.js', ...)`
- Shared test fixtures in `apps/api/src/__fixtures__/curriculum.ts`
- Route integration tests: `supertest.agent(app)` with session cookies
- Prisma transaction mock: mock `prisma.$transaction` to call the callback with the mock prisma object

### Mock Pattern for Prisma Transaction

```typescript
const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
    return callback(mockPrisma); // Pass mockPrisma as the transaction client
  }),
  userProgress: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
    count: vi.fn(),
  },
  chapterProgress: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  selfAssessment: {
    upsert: vi.fn(),
  },
}));
```

### Route Registration — Where to Add

Endpoints are added to the existing `apps/api/src/routes/curriculum.ts` file. The router is already registered in `app.ts` under `/api/v1/curriculum`. **Do NOT create a new router** — extend the existing one.

### Edge Cases to Handle

1. **Concurrent completion**: Two requests to complete the same mission simultaneously — Prisma upsert handles this (last write wins, both succeed, no duplicate)
2. **Out-of-order completion**: User somehow completes mission 1.1.2 before 1.1.1 — `getMissionAccessStatus` will reject with 403 MISSION_LOCKED
3. **Category boundary**: Completing the last mission of category 1 should make category 2's first chapter + first mission available. The unlock logic in `getCurriculumWithProgress` already handles this — just ensure ChapterProgress is correctly set.
4. **Final mission (6.3.4)**: `nextMissionId` should be `null`, `progressiveReveal` should include `dashboardRevealed`

### Project Structure Notes

Files this story creates or modifies:
```
apps/api/prisma/
  schema.prisma                    # MODIFIED — add SelfAssessment model + User relation
  migrations/XXXX_add_self_assessment/  # NEW — auto-generated migration

apps/api/src/
  services/
    curriculumService.ts           # MODIFIED — add completeMission(), getResumePoint(), helpers
    curriculumService.test.ts      # MODIFIED — add ~13 new unit tests
  routes/
    curriculum.ts                  # MODIFIED — add POST complete + GET resume routes
    curriculum.test.ts             # MODIFIED — add ~10 new integration tests

packages/shared/src/
  schemas/
    progress.ts                    # MODIFIED — add completeMissionBodySchema
    progress.test.ts               # MODIFIED — add schema validation tests
  types/
    progress.ts                    # MODIFIED — add CompleteMissionResponse, ResumeResponse types
  index.ts                         # MODIFIED — export new schemas + types
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.3]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns: thin routes, service layer, Prisma transactions]
- [Source: _bmad-output/planning-artifacts/architecture.md § Data Architecture: Prisma schema as single source of truth]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns: response format, error codes]
- [Source: _bmad-output/planning-artifacts/prd.md — FR10: sequential unlock, FR12: resume, FR14: progress %, FR48: self-assessment]
- [Source: _bmad-output/planning-artifacts/curriculum-roadmap.md — progressive reveal triggers: 2.2.4, 3.1.4, 3.3.3, 6.3.4]
- [Source: _bmad-output/implementation-artifacts/3-1-curriculum-content-json-structure-and-loader.md — contentLoader API, curriculum structure]
- [Source: _bmad-output/implementation-artifacts/3-2-curriculum-progress-api.md — curriculumService methods, unlock logic, Prisma models, test patterns, fixtures]
- [Source: apps/api/src/services/curriculumService.ts — existing methods to extend]
- [Source: apps/api/src/routes/curriculum.ts — existing router to extend]
- [Source: apps/api/prisma/schema.prisma — current schema with UserProgress, ChapterProgress]
- [Source: packages/shared/src/schemas/progress.ts — existing progress schemas]
- [Source: packages/shared/src/types/progress.ts — existing progress types]
- [Source: apps/api/src/__fixtures__/curriculum.ts — test fixtures for curriculum]

## Change Log

- 2026-03-09: Implemented mission completion API, resume point API, self-assessment model, and comprehensive test suite (Story 3.3)
- 2026-03-09: **Code Review Fixes** — (1) Added self-assessment mission validation: confidenceRating only stored for last mission of category, not any mission. (2) Moved completionPercentage/categoryCompleted computation inside Prisma transaction for data consistency. (3) Inlined isChapterComplete/isCategoryComplete helpers into transaction, removing unsafe type casts. (4) Added integration test for resume endpoint when curriculum is complete. (5) Added unit test verifying confidenceRating is ignored for non-self-assessment missions. Total: 2 HIGH + 4 MEDIUM issues fixed, 2 new tests added (30 total new tests).

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No blocking issues encountered during implementation.

### Completion Notes List

- Task 1: Added `completeMissionBodySchema` and `resumeResponseSchema` to shared schemas; added `CompleteMissionBody`, `CompleteMissionResponse`, and `ResumeResponse` types; exported all from index.ts. 5 new schema validation tests added.
- Task 2: Implemented `completeMission()` with Prisma `$transaction` for atomic progress updates, chapter completion detection, category completion detection, and self-assessment recording (only for self-assessment missions). Helpers: `findMissionInCurriculum()`, `getNextMissionId()`. All DB computations (chapter/category completion, total count) run inside the transaction. 11 unit tests.
- Task 3: Added `SelfAssessment` model to Prisma schema with `@@unique([userId, categoryId])` constraint and User relation with cascade delete. Migration `20260309165529_add_self_assessment` applied.
- Task 4: Implemented `getResumePoint()` — finds last completed mission, computes next mission via `getNextMissionId()`, returns locale-aware titles and completion percentage. 4 unit tests.
- Task 5: Added `POST /api/v1/curriculum/missions/:missionId/complete` and `GET /api/v1/curriculum/resume` routes with `requireAuth` middleware and Zod validation. 10 integration tests.
- Task 6: All tests written as part of red-green-refactor cycle. Total: 15 new unit tests + 11 new integration tests + 5 new schema tests = 31 new tests (including 2 from code review). All API + shared tests pass.
- Updated test fixture (`curriculum.ts`) to include a progressive reveal on mission 1.1.2 for testing progressive reveal functionality.

### File List

- `packages/shared/src/schemas/progress.ts` — MODIFIED (added completeMissionBodySchema, resumeResponseSchema)
- `packages/shared/src/schemas/progress.test.ts` — MODIFIED (added 5 completeMissionBodySchema tests)
- `packages/shared/src/types/progress.ts` — MODIFIED (added CompleteMissionBody, CompleteMissionResponse, ResumeResponse)
- `packages/shared/src/index.ts` — MODIFIED (exported new schemas and types)
- `apps/api/src/services/curriculumService.ts` — MODIFIED (added completeMission, getResumePoint, helpers)
- `apps/api/src/services/curriculumService.test.ts` — MODIFIED (added 13 new unit tests for completeMission + getResumePoint)
- `apps/api/src/routes/curriculum.ts` — MODIFIED (added POST complete + GET resume routes)
- `apps/api/src/routes/curriculum.test.ts` — MODIFIED (added 10 new integration tests)
- `apps/api/src/__fixtures__/curriculum.ts` — MODIFIED (added progressive reveal to mission 1.1.2)
- `apps/api/prisma/schema.prisma` — MODIFIED (added SelfAssessment model + User relation)
- `apps/api/prisma/migrations/20260309165529_add_self_assessment/migration.sql` — NEW (auto-generated)
