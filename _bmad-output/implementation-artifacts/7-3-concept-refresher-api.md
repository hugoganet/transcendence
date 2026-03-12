# Story 7.3: Concept Refresher API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want a concept refresher when returning after 7+ days,
so that I can ease back into learning without feeling lost.

## Acceptance Criteria

1. **AC #1 — Refresher included in resume response after 7+ days inactivity:**
   Given a user returning after 7+ days of inactivity (FR13),
   When they call `GET /api/v1/curriculum/resume`,
   Then the response includes a `refresher` field containing a brief review exercise covering key concepts from the last completed chapter,
   And the refresher exercise is drawn from a previously completed mission in the user's last completed chapter.

2. **AC #2 — No refresher when user is recently active:**
   Given a user who was active within the last 7 days,
   When they call `GET /api/v1/curriculum/resume`,
   Then the `refresher` field is `null`.

3. **AC #3 — No refresher for brand-new users:**
   Given a user who has never completed any mission,
   When they call `GET /api/v1/curriculum/resume`,
   Then the `refresher` field is `null` (no concepts to refresh).

4. **AC #4 — Refresher is optional (skippable):**
   Given a user who receives a refresher,
   When they proceed without completing the refresher exercise,
   Then they can still access their next mission without any blocking,
   And no `POST` endpoint is required for refresher completion (frontend handles skip logic).

5. **AC #5 — Refresher content is locale-aware:**
   Given a user with locale set to `fr`,
   When they call `GET /api/v1/curriculum/resume` and qualify for a refresher,
   Then the refresher exercise content is served in French (falling back to English if unavailable).

## Tasks / Subtasks

- [x] Task 1: Add shared types for refresher (AC: #1, #5)
  - [x] 1.1 Add `RefresherExercise` interface in `packages/shared/src/types/progress.ts` with fields: `missionId`, `missionTitle`, `chapterTitle`, `exerciseType`, `exerciseContent` (reuses existing exercise content types)
  - [x] 1.2 Extend `ResumeResponse` interface to add `refresher: RefresherExercise | null`
  - [x] 1.3 Export `RefresherExercise` from `packages/shared/src/index.ts`

- [x] Task 2: Implement refresher logic in curriculumService (AC: #1, #2, #3, #5)
  - [x] 2.1 Add `REFRESHER_THRESHOLD_DAYS = 7` constant in `apps/api/src/services/curriculumService.ts`
  - [x] 2.2 Create helper function `buildRefresher(userId: string, locale: string): Promise<RefresherExercise | null>`
  - [x] 2.3 In `buildRefresher`: query `User.lastMissionCompletedAt`, compute days since last mission, return `null` if < 7 days or no missions completed
  - [x] 2.4 In `buildRefresher`: find last completed chapter by querying `UserProgress` for the most recently completed mission, then identify its chapter
  - [x] 2.5 In `buildRefresher`: select a random completed mission from that chapter, load its exercise content from `ContentCache`, construct and return `RefresherExercise`
  - [x] 2.6 Update `getResumePoint()` to call `buildRefresher()` and include result in the returned `ResumeResponse`
  - [x] 2.7 Write unit tests in `apps/api/src/services/curriculumService.test.ts`

- [x] Task 3: Update route tests (AC: #1, #2, #3)
  - [x] 3.1 Update existing resume route tests in `apps/api/src/routes/curriculum.test.ts` to expect `refresher: null` in current test cases
  - [x] 3.2 Add new route test: resume returns refresher when user inactive 7+ days
  - [x] 3.3 Add new route test: resume returns `refresher: null` when user active within 7 days

- [x] Task 4: Integration tests (AC: #1, #2, #3, #5)
  - [x] 4.1 Add integration test in `apps/api/src/__tests__/integration/curriculum-progress.test.ts`
  - [x] 4.2 Test: user with `lastMissionCompletedAt` 10 days ago gets a refresher exercise
  - [x] 4.3 Test: user with `lastMissionCompletedAt` 3 days ago gets `refresher: null`
  - [x] 4.4 Test: new user with no completed missions gets `refresher: null`
  - [x] 4.5 Test: refresher content matches a mission from the last completed chapter

## Dev Notes

### Architecture Overview

This story extends the existing `GET /api/v1/curriculum/resume` endpoint. **No new routes are needed.** The endpoint already returns `ResumeResponse` — we add an optional `refresher` field to it.

The refresher reuses existing exercise content from the curriculum JSON files. No new content creation is needed.

### Key Design Decisions

1. **Refresher is passive, not tracked.** There is no `POST` endpoint for refresher completion. The frontend renders it and the user can skip it. This keeps the backend simple and aligns with the AC ("optional — the user can skip it").

2. **Random mission from last completed chapter.** The refresher picks a random completed mission from the user's last completed chapter. This provides variety on repeated returns while ensuring relevance (same topic area the user was learning).

3. **Reuse engagement threshold constant.** The 7-day threshold matches `REENGAGEMENT_THRESHOLD_DAYS` in `engagementService.ts`. Use a local constant in `curriculumService.ts` rather than importing to avoid coupling.

4. **No new DB tables/columns.** All needed data already exists: `User.lastMissionCompletedAt` (from Story 5.3), `UserProgress` (from Story 3.2), and exercise content in JSON files.

### Shared Type Changes

Add to `packages/shared/src/types/progress.ts`:

```typescript
import type { ExerciseType } from "./curriculum.js";

export interface RefresherExercise {
  missionId: string;
  missionTitle: string;
  chapterTitle: string;
  exerciseType: ExerciseType;
  exerciseContent: Record<string, unknown>; // Reuses existing exercise content shape (SI/CM/IP/ST)
}

// Update existing ResumeResponse:
export interface ResumeResponse {
  missionId: string;
  missionTitle: string;
  chapterId: string;
  chapterTitle: string;
  categoryId: string;
  completionPercentage: number;
  refresher: RefresherExercise | null; // NEW FIELD
}
```

**Why `Record<string, unknown>` for `exerciseContent`?** The exercise content types (SI, CM, IP, ST) are already defined in `packages/shared/src/types/curriculum.ts` as separate interfaces. The frontend already knows how to render each type based on `exerciseType`. Using a union type here would create a tight coupling that's unnecessary — the frontend already handles type discrimination. Alternatively, you could use the union `SIExerciseContent | CMExerciseContent | IPExerciseContent | STExerciseContent` from the shared types if you prefer stronger typing.

### Service Implementation

```typescript
// In apps/api/src/services/curriculumService.ts

const REFRESHER_THRESHOLD_DAYS = 7;

/**
 * Build a concept refresher exercise for users returning after 7+ days.
 * Returns null if user was recently active or has no completed missions.
 */
async function buildRefresher(
  userId: string,
  locale: string,
): Promise<RefresherExercise | null> {
  // 1. Check inactivity threshold
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { lastMissionCompletedAt: true },
  });

  if (!user.lastMissionCompletedAt) return null; // Never completed a mission

  const daysSinceLastMission = Math.floor(
    (Date.now() - user.lastMissionCompletedAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceLastMission < REFRESHER_THRESHOLD_DAYS) return null;

  // 2. Find the last completed mission
  const lastCompleted = await prisma.userProgress.findFirst({
    where: { userId, status: "COMPLETED" },
    orderBy: { completedAt: "desc" },
  });

  if (!lastCompleted) return null;

  // 3. Identify the chapter of the last completed mission
  const content = getContent();
  const curriculum = content.curriculum;
  const found = findMissionInCurriculum(curriculum, lastCompleted.missionId);
  if (!found) return null;

  const { catIdx, chapIdx } = found;
  const chapter = curriculum[catIdx].chapters[chapIdx];

  // 4. Get all completed missions in that chapter
  const chapterMissionIds = chapter.missions.map((m) => m.id);
  const completedInChapter = await prisma.userProgress.findMany({
    where: {
      userId,
      missionId: { in: chapterMissionIds },
      status: "COMPLETED",
    },
    select: { missionId: true },
  });

  if (completedInChapter.length === 0) return null;

  // 5. Pick a random completed mission from the chapter
  const randomIndex = Math.floor(Math.random() * completedInChapter.length);
  const refresherMissionId = completedInChapter[randomIndex].missionId;

  // 6. Load the mission content
  let missionsContent = content.missions.get(locale);
  if (!missionsContent) {
    missionsContent = content.missions.get("en");
  }

  const missionContent = missionsContent?.[refresherMissionId];
  if (!missionContent) return null;

  // 7. Find the exercise type from structure
  const refresherMission = chapter.missions.find((m) => m.id === refresherMissionId);
  if (!refresherMission) return null;

  return {
    missionId: refresherMissionId,
    missionTitle: missionContent.title,
    chapterTitle: chapter.name,
    exerciseType: refresherMission.exerciseType as ExerciseType,
    exerciseContent: missionContent.exerciseContent,
  };
}
```

Then update `getResumePoint()`:

```typescript
export async function getResumePoint(
  userId: string,
  locale: string,
): Promise<ResumeResponse | null> {
  // ... existing logic unchanged ...

  // Before returning, build refresher
  const refresher = await buildRefresher(userId, locale);

  return {
    missionId: resumeMissionId,
    missionTitle,
    chapterId: chapter.id,
    chapterTitle,
    categoryId: category.id,
    completionPercentage,
    refresher, // NEW FIELD
  };
}
```

**Note:** `getResumePoint()` already queries `lastCompleted` from `userProgress`. The `buildRefresher()` function makes an additional query for `User.lastMissionCompletedAt`. This is acceptable because:
- `lastMissionCompletedAt` is on the `User` model (different from `UserProgress`)
- Combining them would require restructuring `getResumePoint()` significantly
- The extra query is inexpensive (single primary key lookup)

### Route Changes

**None required.** The route already delegates to `getResumePoint()` and returns `{ data }`. The new `refresher` field will automatically appear in the response.

### Files to Create

None — this story only modifies existing files.

### Files to Modify

| File | Change |
|------|--------|
| `packages/shared/src/types/progress.ts` | Add `RefresherExercise` interface, add `refresher` field to `ResumeResponse` |
| `packages/shared/src/index.ts` | Export `RefresherExercise` type |
| `apps/api/src/services/curriculumService.ts` | Add `buildRefresher()` function, update `getResumePoint()` to include refresher |
| `apps/api/src/services/curriculumService.test.ts` | Add tests for refresher logic |
| `apps/api/src/routes/curriculum.test.ts` | Update existing resume tests to expect `refresher: null`, add new refresher tests |
| `apps/api/src/__tests__/integration/curriculum-progress.test.ts` | Add integration tests for refresher |

### Testing Patterns

**Service unit tests** — follow existing `getResumePoint` test patterns in `curriculumService.test.ts`:

```typescript
// Mock user with lastMissionCompletedAt 10 days ago
mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
  lastMissionCompletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
});

// Mock completed missions in the chapter
mockPrisma.userProgress.findMany.mockResolvedValue([
  { missionId: "1.1.1" },
  { missionId: "1.1.2" },
]);

// Call getResumePoint
const result = await getResumePoint("user-1", "en");
expect(result?.refresher).not.toBeNull();
expect(result?.refresher?.exerciseContent).toBeDefined();
```

**Handle randomness in tests:**
- Mock `Math.random` to control which mission is selected: `vi.spyOn(Math, "random").mockReturnValue(0)`
- Or assert that the returned `missionId` is one of the completed missions in the chapter

**Route tests** — follow existing pattern with `supertest`:

```typescript
// Update existing tests to check refresher: null
const res = await request(app).get("/api/v1/curriculum/resume");
expect(res.body.data.refresher).toBeNull();
```

**Integration tests** — follow existing `curriculum.test.ts` pattern:

```typescript
// Create user, complete missions, set lastMissionCompletedAt to 10 days ago
// Call GET /api/v1/curriculum/resume
// Assert refresher field contains valid exercise content
```

### Key Constraints

1. **Do NOT create any new routes.** The refresher is returned as part of the existing `GET /api/v1/curriculum/resume` endpoint response. No `POST` endpoint for refresher submission.
2. **Do NOT modify the database schema.** All needed data already exists (`User.lastMissionCompletedAt`, `UserProgress`, content JSON).
3. **Refresher is best-effort.** If the content loader can't find the mission content (unlikely but possible), return `refresher: null` — never throw.
4. **`exerciseType` must match the exercise content shape.** The frontend will use `exerciseType` to determine which exercise component to render (SI, CM, IP, or ST).
5. **Follow existing `getResumePoint()` locale fallback pattern** — try user's locale first, fall back to "en".
6. **The `buildRefresher()` function should be a private function** (not exported). It's only called by `getResumePoint()`.
7. **Mock `Math.random` in tests** to make refresher mission selection deterministic.
8. **Existing resume tests will break** until updated to include `refresher: null` in expected responses — fix them in Task 3.

### Previous Story Intelligence (7.2)

**Key learnings from Story 7.2:**
- 7-day inactivity check pattern: query `User.lastMissionCompletedAt`, compute `daysSinceLastMission`, compare to threshold
- `io` parameter passing pattern for Socket.IO services (not relevant here — this is a REST endpoint)
- Engagement service is separate from curriculum service — keep them decoupled
- `vi.hoisted()` + `vi.mock()` pattern for Prisma mocking
- Integration tests: `createAndLoginUser()` → cookie → supertest agent

**From Story 7.1:**
- `createAndPushNotification` is best-effort — same philosophy for refresher (never block resume)
- Notification types already include `REENGAGEMENT` — the refresher is the curriculum-side complement

### Git Intelligence

Recent commits follow `feat(domain): description (Story X.Y)` convention. Last 5 commits:
- `feat(notifications): add re-engagement and streak reminder logic (Story 7.2)`
- `feat(notifications): add notification system API and Socket.IO push (Story 7.1)`
- `feat(social): add certificate generation and sharing API (Story 6.4)`
- `feat(social): add public profiles API (Story 6.3)`
- `feat(social): add online presence via Socket.IO (Story 6.2)`

Expected commit: `feat(curriculum): add concept refresher to resume endpoint (Story 7.3)`

### Project Structure Notes

- No new files created — all changes in existing files
- `buildRefresher()` lives in `curriculumService.ts` alongside `getResumePoint()` (same concern)
- Shared type changes in `packages/shared/src/types/progress.ts` where `ResumeResponse` already lives
- No new npm dependencies required

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7 — Story 7.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — REST API patterns, content architecture]
- [Source: _bmad-output/planning-artifacts/prd.md — FR13: concept refresher after 7+ days]
- [Source: apps/api/src/services/curriculumService.ts — getResumePoint(), findMissionInCurriculum(), getContent()]
- [Source: apps/api/src/services/engagementService.ts — REENGAGEMENT_THRESHOLD_DAYS, 7-day check pattern]
- [Source: apps/api/src/routes/curriculum.ts — resume route handler]
- [Source: packages/shared/src/types/progress.ts — ResumeResponse interface]
- [Source: content/structure.json — curriculum structure with exercise types]
- [Source: content/en/missions.json — exercise content format per mission]
- [Source: docs/project-context.md — API response format, test organization]
- [Source: _bmad-output/implementation-artifacts/7-2-re-engagement-and-streak-reminder-logic.md — previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

None — clean implementation with no debugging issues.

### Completion Notes List

- Added `RefresherExercise` interface and extended `ResumeResponse` with `refresher: RefresherExercise | null` in shared types
- Implemented `buildRefresher()` private function in `curriculumService.ts`: queries `User.lastMissionCompletedAt`, checks 7-day threshold, finds last completed chapter, picks random completed mission, loads locale-aware content
- Updated `getResumePoint()` to call `buildRefresher()` and include result in response
- No new routes, no DB schema changes, no new dependencies — all as specified
- Added 3 new unit tests for refresher logic (inactive 7+ days, active within 7 days, new user)
- Updated 4 existing resume route tests to assert `refresher: null`
- Added 2 new route tests for refresher (7+ days inactive, within 7 days active)
- Added 4 integration tests using real DB: new user, active 3 days, inactive 10 days, chapter match
- All 532 unit tests pass, all 8 integration tests pass, zero regressions

### Change Log

- 2026-03-12: Implemented concept refresher API (Story 7.3) — all 4 tasks completed
- 2026-03-12: Code review fixes — H1: findUniqueOrThrow→findUnique (best-effort safety), H2: added locale-aware refresher test, M1: fixed Math.random spy cleanup, M2: eliminated redundant DB query, M3: made chapterTitle locale-aware via uiStrings, M4: updated File List

### File List

- `packages/shared/src/types/progress.ts` — Added `RefresherExercise` interface, added `refresher` field to `ResumeResponse`
- `packages/shared/src/index.ts` — Exported `RefresherExercise` type
- `apps/api/src/services/curriculumService.ts` — Added `REFRESHER_THRESHOLD_DAYS`, `buildRefresher()`, updated `getResumePoint()`
- `apps/api/src/services/curriculumService.test.ts` — Added refresher unit tests, updated existing resume tests
- `apps/api/src/routes/curriculum.test.ts` — Updated existing resume route tests, added refresher route tests
- `apps/api/src/__tests__/integration/curriculum-progress.test.ts` — Added 4 refresher integration tests
- `apps/api/src/__fixtures__/curriculum.ts` — Added French content fixture and chapter uiStrings translations
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — Updated 7-3 story status
