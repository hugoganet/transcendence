# Story 3.5: Learning Chain Visualization API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see my learning progress visualized as a blockchain-style chain,
So that I have a motivating visual metaphor of my journey.

## Acceptance Criteria

1. **Given** an authenticated user,
   **When** they call `GET /api/v1/curriculum/chain`,
   **Then** the response returns a structured representation of their learning chain: completed missions as "blocks" with timestamps, linked sequentially,
   **And** each block includes: mission ID, title, completion date, category,
   **And** the chain grows as the user completes more missions.

2. **Given** a new user with no completed missions,
   **When** they call `GET /api/v1/curriculum/chain`,
   **Then** the response returns an empty chain (`blocks: []`, `totalBlocks: 0`).

3. **Given** an authenticated user with completed missions,
   **When** they call `GET /api/v1/curriculum/chain`,
   **Then** blocks are returned in chronological order of completion (oldest first — building the chain forward),
   **And** each block references the previous block's mission ID (linked-list style, mimicking blockchain's `previousHash`).

4. **Given** the chain endpoint,
   **When** called without authentication,
   **Then** a 401 error is returned.

5. **Given** an authenticated user,
   **When** they call `GET /api/v1/curriculum/chain`,
   **Then** the response includes summary metadata: total blocks, total categories touched, latest block timestamp.

## Tasks / Subtasks

- [x] Task 1: Add shared types for the learning chain API (AC: #1, #3, #5)
  - [x] 1.1 Add to `packages/shared/src/types/progress.ts`:
    - `ChainBlock`: `{ index: number, missionId: string, missionTitle: string, categoryId: string, categoryName: string, completedAt: string, previousMissionId: string | null }` — single block in the chain
    - `LearningChainResponse`: `{ blocks: ChainBlock[], totalBlocks: number, categoriesReached: number, latestBlockAt: string | null }` — full chain response
  - [x] 1.2 Export new types from `packages/shared/src/index.ts`

- [x] Task 2: Create chain service method in `curriculumService.ts` (AC: #1, #2, #3, #5)
  - [x] 2.1 Add `getLearningChain(userId: string, locale: string): LearningChainResponse` to `apps/api/src/services/curriculumService.ts`:
    - Query `UserProgress` for all missions with status `COMPLETED`, ordered by `completedAt ASC`
    - For each completed mission, build a `ChainBlock`:
      - `index`: sequential 0-based index
      - `missionId`: from UserProgress record
      - `missionTitle`: from content loader (locale-specific, fallback to "en")
      - `categoryId`: derived from missionId format (e.g., "1.2.3" → category "1")
      - `categoryName`: from content structure + locale content
      - `completedAt`: ISO 8601 string from UserProgress
      - `previousMissionId`: the missionId of the previous block (null for first block)
    - Compute summary: `totalBlocks`, `categoriesReached` (distinct category count), `latestBlockAt`
  - [x] 2.2 If no completed missions, return `{ blocks: [], totalBlocks: 0, categoriesReached: 0, latestBlockAt: null }`
  - [x] 2.3 Use locale fallback pattern: requested locale → "en" → throw 500 `CONTENT_UNAVAILABLE`

- [x] Task 3: Add chain route to curriculum router (AC: #1, #4)
  - [x] 3.1 Add `GET /chain` route to `apps/api/src/routes/curriculum.ts`:
    - Requires `requireAuth` middleware
    - Calls `getLearningChain(req.user.id, req.user.locale ?? "en")`
    - Returns `{ data: LearningChainResponse }`
  - [x] 3.2 Route ordering: add `GET /chain` BEFORE `GET /missions/:missionId` to avoid Express interpreting "chain" as a missionId param

- [x] Task 4: Write tests (AC: #1-#5)
  - [x] 4.1 Unit tests for `getLearningChain` in `apps/api/src/services/curriculumService.test.ts`:
    - User with 3 completed missions → returns 3 blocks in chronological order
    - Blocks are linked: block[1].previousMissionId === block[0].missionId
    - First block has previousMissionId === null
    - New user (no completions) → empty chain response
    - Locale fallback: non-existent locale → English content used
    - Summary: categoriesReached counts distinct categories
    - Summary: latestBlockAt matches last block's completedAt
  - [x] 4.2 Integration tests for route in `apps/api/src/routes/curriculum.test.ts`:
    - `GET /api/v1/curriculum/chain` (authenticated, with completions) → 200 with blocks
    - `GET /api/v1/curriculum/chain` (authenticated, no completions) → 200 with empty chain
    - `GET /api/v1/curriculum/chain` (unauthenticated) → 401
  - [x] 4.3 Regression: all existing tests still pass (306 API tests + 137 shared tests)

## Dev Notes

### Critical Architecture Patterns

- **Route handlers are thin**: validate → service → respond. All business logic lives in `curriculumService.ts`. Routes do NOT use try/catch — Express 5 auto-catches async rejections and forwards to the global `errorHandler` middleware. [Source: architecture.md § Implementation Patterns]
- **Error handling**: Services throw `AppError` instances with `new AppError(statusCode, code, message)`. AppError class is at `apps/api/src/utils/AppError.ts`. [Source: architecture.md § Format Patterns]
- **Response format**: Success = `{ data: T }`, Error = `{ error: { code, message, details? } }`. [Source: architecture.md § Format Patterns]
- **Dates**: ISO 8601 strings in API responses. Never timestamps, never locale-formatted strings. [Source: architecture.md § Format Patterns]

### Content Loader — How to Access Mission Data

Story 3.1 created `contentLoader.ts` which loads all content JSON at server startup. Access cached content via:

```typescript
import { getContent } from '../utils/contentLoader.js';

const content = getContent();
// Curriculum structure (language-independent):
const structure = content.curriculum; // Category[] array with chapters and missions
// Locale-specific mission content:
const missions = content.missions.get(locale); // MissionContentCollection (Record<missionId, MissionContent>)
// Fallback:
const fallbackMissions = content.missions.get("en");
```

### Database Query — UserProgress for Completed Missions

```typescript
import { prisma } from '../prisma/client.js';

const completedMissions = await prisma.userProgress.findMany({
  where: {
    userId,
    status: 'COMPLETED',
  },
  orderBy: {
    completedAt: 'asc',
  },
  select: {
    missionId: true,
    completedAt: true,
  },
});
```

The `UserProgress` model has a composite unique index on `[userId, missionId]` and an index on `userId`. This query is efficient for the expected data volume (max 69 missions per user).

### Deriving Category Info from Mission ID

Mission IDs follow the format `X.Y.Z` (category.chapter.mission). Extract category:

```typescript
const categoryId = missionId.split('.')[0]; // "1.2.3" → "1"
```

To get category name, find the category in the curriculum structure:

```typescript
const structure = getContent().curriculum;
const category = structure.find(c => c.id === categoryId);
// Then get locale-specific name from ui.json or use structure name
```

### Locale Fallback Pattern (Established in Story 3.2)

```typescript
let missions = content.missions.get(locale);
if (!missions) {
  missions = content.missions.get("en");
}
if (!missions) {
  throw new AppError(500, "CONTENT_UNAVAILABLE", "Mission content not available");
}
```

This same pattern is used in `curriculumService.ts` for mission detail and in `tooltipService.ts` for tooltips. Follow it exactly.

### Route Ordering — Critical

The curriculum router already has these routes:
```
GET /                           → getCurriculumWithProgress
GET /resume                     → getResumePoint
GET /missions/:missionId        → getMissionDetail
POST /missions/:missionId/complete → completeMission
```

The new `GET /chain` route MUST be defined BEFORE `GET /missions/:missionId` to prevent Express from interpreting "chain" as a `:missionId` param. Place it alongside `/resume`:

```typescript
curriculumRouter.get("/chain", requireAuth, async (req, res) => { ... });
// Must come before:
curriculumRouter.get("/missions/:missionId", ...);
```

### Testing Patterns from Story 3.3/3.4

- **Mock Prisma**: `vi.hoisted(() => ({ userProgress: { findMany: vi.fn() } }))` + `vi.mock('@prisma/client', ...)`
- **Mock content**: `vi.hoisted(() => ({ getContent: vi.fn() }))` + `vi.mock('../utils/contentLoader.js', ...)`
- **Route integration tests**: `supertest.agent(app)` with session cookies
- **Test fixtures**: Create small fixtures (3-5 completed missions) covering multiple categories
- **Current test count**: 294+ API tests + 134+ shared tests. Ensure zero regressions.

### Chain Block Construction — Pseudocode

```typescript
function getLearningChain(userId: string, locale: string): LearningChainResponse {
  // 1. Query completed missions ordered by completedAt ASC
  const completedMissions = await prisma.userProgress.findMany({
    where: { userId, status: 'COMPLETED' },
    orderBy: { completedAt: 'asc' },
    select: { missionId: true, completedAt: true },
  });

  if (completedMissions.length === 0) {
    return { blocks: [], totalBlocks: 0, categoriesReached: 0, latestBlockAt: null };
  }

  // 2. Load content for titles
  const content = getContent();
  let missions = content.missions.get(locale) ?? content.missions.get("en");
  if (!missions) throw new AppError(500, "CONTENT_UNAVAILABLE", "...");

  const structure = content.curriculum;

  // 3. Build blocks
  const categorySet = new Set<string>();
  const blocks: ChainBlock[] = completedMissions.map((progress, index) => {
    const categoryId = progress.missionId.split('.')[0];
    categorySet.add(categoryId);
    const category = structure.find(c => c.id === categoryId);
    const missionContent = missions[progress.missionId];

    return {
      index,
      missionId: progress.missionId,
      missionTitle: missionContent?.title ?? `Mission ${progress.missionId}`,
      categoryId,
      categoryName: category?.name ?? `Category ${categoryId}`,
      completedAt: progress.completedAt!.toISOString(),
      previousMissionId: index > 0 ? completedMissions[index - 1].missionId : null,
    };
  });

  return {
    blocks,
    totalBlocks: blocks.length,
    categoriesReached: categorySet.size,
    latestBlockAt: blocks[blocks.length - 1].completedAt,
  };
}
```

### Edge Cases to Handle

1. **Null completedAt**: UserProgress records with status COMPLETED should always have completedAt set (enforced by Story 3.3's completeMission logic). Defensively handle null by using current timestamp or filtering out records.
2. **Missing content**: If a completed mission's content doesn't exist in the locale JSON (shouldn't happen but defensive), use a fallback title like `"Mission {id}"`.
3. **Category name resolution**: Category names come from `structure.json` (language-independent `name` field which is an i18n key). For the API response, use the content loader's UI strings or the structure's name field. Check how `getCurriculumWithProgress` resolves category names and follow the same pattern.

### Project Structure Notes

Files this story creates or modifies:
```
packages/shared/src/
  types/
    progress.ts                  # MODIFIED — add ChainBlock, LearningChainResponse types
  index.ts                       # MODIFIED — export ChainBlock, LearningChainResponse

apps/api/src/
  services/
    curriculumService.ts         # MODIFIED — add getLearningChain() method
    curriculumService.test.ts    # MODIFIED — add ~7 unit tests for getLearningChain
  routes/
    curriculum.ts                # MODIFIED — add GET /chain route
    curriculum.test.ts           # MODIFIED — add ~3 integration tests for GET /chain
```

**No new files created.** This story extends existing files only.
**No new DB tables.** Uses existing `UserProgress` table.
**No new Prisma migrations.** No schema changes needed.

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.5]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns: thin routes, service layer]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns: response format, error codes, ISO 8601 dates]
- [Source: _bmad-output/planning-artifacts/prd.md — FR17: learning chain visualization (blockchain metaphor)]
- [Source: _bmad-output/implementation-artifacts/3-1-curriculum-content-json-structure-and-loader.md — contentLoader API]
- [Source: _bmad-output/implementation-artifacts/3-3-mission-completion-and-progress-tracking.md — completeMission logic, UserProgress table, locale fallback pattern]
- [Source: _bmad-output/implementation-artifacts/3-4-jargon-tooltips-api.md — testing patterns, route ordering]
- [Source: apps/api/src/services/curriculumService.ts — existing service methods, query patterns]
- [Source: apps/api/src/routes/curriculum.ts — existing route structure, middleware usage]
- [Source: apps/api/prisma/schema.prisma — UserProgress model, MissionStatus enum]
- [Source: packages/shared/src/types/progress.ts — existing progress types]
- [Source: content/structure.json — curriculum structure, category/chapter/mission IDs]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Added `ChainBlock` and `LearningChainResponse` types to shared package
- Implemented `getLearningChain()` service method following established patterns (locale fallback, content loader, Prisma queries)
- Added `GET /chain` route before `/missions/:missionId` to avoid Express param collision
- Wrote 7 unit tests covering: chronological ordering, linked-list previousMissionId, empty chain, locale fallback, categoriesReached distinct count, latestBlockAt
- Wrote 3 integration tests covering: authenticated with completions (200), authenticated empty (200), unauthenticated (401)
- All 306 API tests + 146 shared tests pass with zero regressions

### Change Log

- 2026-03-09: Implemented Story 3.5 — Learning Chain Visualization API (GET /api/v1/curriculum/chain)
- 2026-03-09: Code review fixes — defensive completedAt handling, localized categoryName via UI strings, added block field assertions to tests

### File List

- `packages/shared/src/types/progress.ts` — MODIFIED: added ChainBlock, LearningChainResponse interfaces
- `packages/shared/src/index.ts` — MODIFIED: exported ChainBlock, LearningChainResponse
- `apps/api/src/services/curriculumService.ts` — MODIFIED: added getLearningChain() method; review fix: defensive completedAt, localized categoryName
- `apps/api/src/routes/curriculum.ts` — MODIFIED: added GET /chain route with requireAuth
- `apps/api/src/services/curriculumService.test.ts` — MODIFIED: added 7 unit tests for getLearningChain; review fix: added index/categoryId/categoryName assertions
- `apps/api/src/routes/curriculum.test.ts` — MODIFIED: added 3 integration tests for GET /chain
- `apps/api/src/__fixtures__/curriculum.ts` — MODIFIED: added category name mappings to UI strings fixture
