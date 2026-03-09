# Story 3.2: Curriculum Progress API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to track my progress through the curriculum,
So that I can see what I've completed and what's next.

## Acceptance Criteria

1. **Given** an authenticated user,
   **When** they call `GET /api/v1/curriculum`,
   **Then** the full curriculum structure is returned with the user's progress overlay (locked/available/in-progress/completed per chapter and mission),
   **And** the response includes overall completion percentage (FR14),
   **And** sequential unlock rules are enforced: chapter N requires chapter N-1 completion (FR10).

2. **Given** an authenticated user,
   **When** they call `GET /api/v1/curriculum/missions/:missionId`,
   **Then** the mission content is returned (title, description, learning objective, exercises, tooltips),
   **And** the response includes the mission's exercise type and content in the user's locale.

3. **Given** a new user with no progress,
   **When** they request the curriculum,
   **Then** only Category 1, Chapter 1.1, Mission 1.1.1 is available (all else locked).

4. **Given** the curriculum API,
   **When** any endpoint is called,
   **Then** DB tables exist: `UserProgress` (userId, missionId, status, completedAt), `ChapterProgress` (userId, chapterId, status),
   **And** Prisma schema is updated with these tables.

5. **Given** a mission that the user has not yet unlocked,
   **When** they call `GET /api/v1/curriculum/missions/:missionId`,
   **Then** a 403 error is returned with code `MISSION_LOCKED`.

6. **Given** an authenticated user,
   **When** they call `GET /api/v1/curriculum/missions/:missionId` with an invalid or non-existent mission ID,
   **Then** a 400 or 404 error is returned with appropriate code.

7. **Given** all curriculum endpoints,
   **When** input is submitted,
   **Then** Zod validates request params,
   **And** invalid input returns 400 with field-level error details.

## Tasks / Subtasks

- [x] Task 1: Add Prisma schema — UserProgress and ChapterProgress tables (AC: #4)
  - [x] 1.1 Add `UserProgress` model to `prisma/schema.prisma`:
    - `id` (String, UUID, @id)
    - `userId` (String, FK → User)
    - `missionId` (String) — matches curriculum structure IDs like "1.1.1"
    - `status` (enum: `AVAILABLE`, `IN_PROGRESS`, `COMPLETED`)
    - `completedAt` (DateTime?)
    - `createdAt` (DateTime, @default(now()))
    - `updatedAt` (DateTime, @updatedAt)
    - Unique constraint: `@@unique([userId, missionId])`
    - Index on `userId` for efficient user progress queries
  - [x] 1.2 Add `ChapterProgress` model:
    - `id` (String, UUID, @id)
    - `userId` (String, FK → User)
    - `chapterId` (String) — matches curriculum structure IDs like "1.1"
    - `status` (enum: `LOCKED`, `AVAILABLE`, `IN_PROGRESS`, `COMPLETED`)
    - `completedAt` (DateTime?)
    - `createdAt` (DateTime, @default(now()))
    - `updatedAt` (DateTime, @updatedAt)
    - Unique constraint: `@@unique([userId, chapterId])`
    - Index on `userId`
  - [x] 1.3 Add enum `MissionStatus { AVAILABLE IN_PROGRESS COMPLETED }` and `ChapterStatus { LOCKED AVAILABLE IN_PROGRESS COMPLETED }` to Prisma schema
  - [x] 1.4 Add relations: `User` has many `UserProgress` and `ChapterProgress` (cascade delete)
  - [x] 1.5 Run `npx prisma migrate dev --name add-curriculum-progress` to create migration
  - [x] 1.6 Update seed script to optionally create sample progress for test user

- [x] Task 2: Add shared Zod schemas and types for curriculum progress API (AC: #7)
  - [x] 2.1 Create `packages/shared/src/schemas/progress.ts`:
    - `missionIdParamSchema`: `{ missionId: z.string().regex(/^\d+\.\d+\.\d+$/) }` — validates "X.Y.Z" format
    - `missionStatusSchema`: `z.enum(["available", "inProgress", "completed"])` — camelCase for API responses
    - `chapterStatusSchema`: `z.enum(["locked", "available", "inProgress", "completed"])`
  - [x] 2.2 Create response types in `packages/shared/src/types/progress.ts`:
    - `MissionProgressOverlay`: `{ missionId, status, completedAt? }`
    - `ChapterProgressOverlay`: `{ chapterId, status, completedAt?, missions: MissionProgressOverlay[] }`
    - `CategoryProgressOverlay`: `{ categoryId, status, chapters: ChapterProgressOverlay[] }`
    - `CurriculumWithProgress`: `{ categories: CategoryProgressOverlay[], completionPercentage: number, totalMissions: number, completedMissions: number }`
    - `MissionDetailResponse`: `{ id, title, description, learningObjective, exerciseType, exerciseContent, estimatedMinutes, status, tooltipTerms?: string[] }`
  - [x] 2.3 Export new schemas and types from `packages/shared/src/index.ts`

- [x] Task 3: Create curriculumService.ts (AC: #1, #2, #3, #5, #6)
  - [x] 3.1 Create `apps/api/src/services/curriculumService.ts` with:
    - `getCurriculumWithProgress(userId: string, locale: string): CurriculumWithProgress`
    - `getMissionDetail(userId: string, missionId: string, locale: string): MissionDetailResponse`
  - [x] 3.2 `getCurriculumWithProgress` implementation:
    - Load curriculum structure from `getContent().curriculum`
    - Fetch all `UserProgress` rows for user (single query, not N+1)
    - Fetch all `ChapterProgress` rows for user (single query)
    - Merge progress overlay onto curriculum structure
    - **Unlock logic**: A mission is `available` if it is the first mission in an available chapter, or the previous mission in the same chapter is `completed`. A chapter is `available` if it is the first chapter in the category, or the previous chapter is `completed`. Category 1, Chapter 1.1, Mission 1.1.1 are always available for new users.
    - Compute `completionPercentage` = `completedMissions / 69 * 100` (rounded to 1 decimal)
    - For new users with zero progress rows, apply default: only 1.1.1 is `available`, everything else `locked`
  - [x] 3.3 `getMissionDetail` implementation:
    - Validate missionId exists in curriculum structure (404 `MISSION_NOT_FOUND` if not)
    - Check user progress for this mission — if no progress row AND mission is not the first available, return 403 `MISSION_LOCKED`
    - Load mission content from `getContent().missions(locale)` keyed by missionId
    - Return mission metadata + exercise content + user's status for this mission

- [x] Task 4: Create curriculum.ts routes (AC: #1, #2, #5, #6, #7)
  - [x] 4.1 Create `apps/api/src/routes/curriculum.ts` with:
    - `GET /api/v1/curriculum` — authenticated, returns full curriculum with progress overlay
    - `GET /api/v1/curriculum/missions/:missionId` — authenticated, returns mission detail with exercise content
  - [x] 4.2 Both routes require `requireAuth` middleware
  - [x] 4.3 Mission detail route validates `:missionId` param with `missionIdParamSchema`
  - [x] 4.4 Use `req.user.locale` (from session/user) for locale-specific content; default to "en"
  - [x] 4.5 Register curriculum router in `app.ts` under `/api/v1/curriculum`

- [x] Task 5: Implement progress initialization for new users (AC: #3)
  - [x] 5.1 When `getCurriculumWithProgress` is called for a user with zero progress rows, compute status dynamically from the curriculum structure — do NOT pre-create rows
  - [x] 5.2 Progress rows are only created when the user actually starts or completes a mission (Story 3.3's `POST /missions/:missionId/complete` endpoint will create these)
  - [x] 5.3 The unlock computation must handle zero-row state gracefully: if no `UserProgress` row exists for a mission, its status is derived from its position in the curriculum (first available mission = `available`, everything after = `locked`)

- [x] Task 6: Write tests (AC: #1–#7)
  - [x] 6.1 Unit tests for `curriculumService.ts`:
    - `getCurriculumWithProgress` — new user with no progress: returns 1.1.1 as available, all else locked, completion 0%
    - `getCurriculumWithProgress` — user with some completed missions: correct unlock cascade, correct completion %
    - `getCurriculumWithProgress` — user who completed all of chapter 1.1: chapter 1.2 becomes available, mission 1.2.1 available
    - `getMissionDetail` — valid available mission: returns full content with exercise data
    - `getMissionDetail` — locked mission: throws 403 MISSION_LOCKED
    - `getMissionDetail` — non-existent mission ID: throws 404 MISSION_NOT_FOUND
    - `getMissionDetail` — locale fallback: uses "en" if locale content unavailable
  - [x] 6.2 Integration tests for routes:
    - `GET /api/v1/curriculum` (authenticated, new user) → 200 with curriculum + 0% completion
    - `GET /api/v1/curriculum` (authenticated, some progress) → 200 with correct unlock states
    - `GET /api/v1/curriculum` (unauthenticated) → 401
    - `GET /api/v1/curriculum/missions/1.1.1` (authenticated, new user) → 200 with mission content
    - `GET /api/v1/curriculum/missions/1.2.1` (authenticated, new user, locked) → 403 MISSION_LOCKED
    - `GET /api/v1/curriculum/missions/99.99.99` (authenticated) → 404 MISSION_NOT_FOUND
    - `GET /api/v1/curriculum/missions/invalid` (authenticated) → 400 INVALID_INPUT
    - `GET /api/v1/curriculum/missions/1.1.1` (unauthenticated) → 401
  - [x] 6.3 Schema validation tests (`packages/shared/`):
    - `progress.test.ts`: missionIdParamSchema validates "1.1.1", rejects "abc", rejects "1.1"
  - [x] 6.4 Regression: all existing 274 tests still pass

## Dev Notes

### Critical Architecture Patterns

- **Route handlers are thin**: validate → service → respond. All business logic lives in `curriculumService.ts`. Routes do NOT use try/catch — Express 5 auto-catches async rejections and forwards to the global `errorHandler` middleware. [Source: architecture.md § Implementation Patterns]
- **Error handling**: Services throw `AppError` instances with `new AppError(statusCode, code, message)`. AppError class is at `apps/api/src/utils/AppError.ts`. [Source: Story 2.7 Dev Notes]
- **Response format**: Success = `{ data: T }`, Error = `{ error: { code, message, details? } }`. [Source: architecture.md § Format Patterns]
- **Middleware order** in `app.ts`: helmet → cors → json → urlencoded → rateLimiter → session → passport.initialize() → passport.session() → routes → 404 → errorHandler. Add curriculum router alongside existing auth, users, and disclaimers routers.
- **Prisma as data access**: Services import the Prisma client from `config/database.ts` (`import { prisma } from '../config/database.js'`). Never access Prisma directly from routes.

### Content Loader — How to Access Curriculum Data

Story 3.1 created `contentLoader.ts` which loads all curriculum JSON at server startup. Access cached content via:

```typescript
import { getContent } from '../utils/contentLoader.js';

// In service methods:
const content = getContent();
const curriculum = content.curriculum;                    // CurriculumStructure (Category[])
const missions = content.missions.get(locale);           // MissionContentCollection (Record<string, MissionContent>)
const tooltips = content.tooltips.get(locale);           // TooltipCollection (Record<string, Tooltip>)
const uiStrings = content.uiStrings.get(locale);         // UIStrings
```

**Content is read-only and cached in memory.** Never modify the returned objects. The `CurriculumStructure` type is `Category[]` where each category has `chapters` → `missions` — a nested tree structure.

### Curriculum Structure — Key Data Points

- **69 missions** total across 6 categories, 18 chapters
- **Mission IDs**: `"{categoryNum}.{chapterNum}.{missionNum}"` (e.g., "1.1.1", "2.2.4", "6.3.4")
- **Chapter IDs**: `"{categoryNum}.{chapterNum}"` (e.g., "1.1", "2.3", "6.3")
- **Category IDs**: `"{categoryNum}"` (e.g., "1", "2", "6")
- **Exercise types**: `"SI"` | `"CM"` | `"IP"` | `"ST"` — stored in `structure.json` per mission
- **Sequential unlock**: Chapter N requires all missions of Chapter N-1 completed. Within a chapter, Mission M requires Mission M-1 completed. First mission of first chapter is always available.
- **Cross-category unlock**: Category N Chapter 1 is available once Category N-1's last chapter is completed.

### Unlock Logic — Detailed Algorithm

```
For each category (ordered by category.order):
  If categoryIndex === 0:
    category is available
  Else:
    If previous category's last chapter is COMPLETED:
      category is available
    Else:
      category and all its chapters/missions are LOCKED

  For each chapter in available category (ordered by chapter.order):
    If chapterIndex === 0 in this category:
      chapter is available (if category is available)
    Else:
      If previous chapter in same category is COMPLETED:
        chapter is available
      Else:
        chapter is LOCKED

    For each mission in available chapter (ordered by mission.order):
      If missionIndex === 0 in this chapter:
        mission is available (if chapter is available)
      Else:
        If previous mission in same chapter is COMPLETED:
          mission is available
        Else:
          mission is LOCKED
```

A chapter is `COMPLETED` when ALL its missions are `COMPLETED`.
A chapter is `IN_PROGRESS` when at least one mission is `COMPLETED` but not all.
A mission is `IN_PROGRESS` once the user has started it (will be set by Story 3.3's completion endpoint).

### Database Schema Design Decisions

**Why separate `UserProgress` and `ChapterProgress` tables:**
- `UserProgress` tracks individual mission status — 1 row per (user, mission) pair
- `ChapterProgress` is a denormalized summary — avoids computing chapter status from mission rows on every request
- Story 3.3 (Mission Completion) will update both tables atomically in a Prisma transaction

**Why NOT pre-create all 69 progress rows per user:**
- A new user would need 69 `UserProgress` rows + 18 `ChapterProgress` rows = 87 rows created at registration
- Instead: compute unlock status dynamically from existing rows + curriculum structure
- Rows are created lazily: only when a mission is started or completed
- This is simpler, uses less storage, and avoids migration issues when curriculum structure changes

**Status values — Prisma enums vs API response strings:**
- Prisma schema uses UPPER_SNAKE enums: `AVAILABLE`, `IN_PROGRESS`, `COMPLETED`, `LOCKED`
- API responses use camelCase strings: `"available"`, `"inProgress"`, `"completed"`, `"locked"`
- The service layer maps between them

### Existing Prisma Schema — Current State

```prisma
// Existing models (DO NOT MODIFY):
enum AuthProvider { LOCAL, GOOGLE, FACEBOOK }
model User { ... }           // id, email, passwordHash, displayName, bio, avatarUrl, locale, etc.
model OAuthAccount { ... }   // OAuth provider links
model PasswordResetToken { ... }

// NEW models to add:
enum MissionStatus { AVAILABLE, IN_PROGRESS, COMPLETED }
enum ChapterStatus { LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED }

model UserProgress { ... }     // userId + missionId + status + completedAt
model ChapterProgress { ... }  // userId + chapterId + status + completedAt
```

**Important:** The `User.locale` field (default "en") is already available on the user model. Use `req.user.locale` to determine which content locale to serve.

### Mission Detail Response — What to Return

For `GET /api/v1/curriculum/missions/:missionId`:

```typescript
{
  data: {
    id: "1.1.1",
    title: "Who Do You Trust?",                    // from missions.json
    description: "Explore why trust matters...",    // from missions.json
    learningObjective: "Understand why...",         // from missions.json
    exerciseType: "SI",                            // from structure.json
    exerciseContent: { scenario, question, options }, // from missions.json
    estimatedMinutes: 3,                           // from structure.json
    status: "available",                           // from UserProgress or computed
    progressiveReveal: null                        // from structure.json (null or { mechanic, description })
  }
}
```

Do NOT return the full curriculum tree in the mission detail response — that's what `GET /api/v1/curriculum` is for.

### Testing Patterns from Story 3.1

- **274 tests** currently pass across API (227) + shared (47)
- Schema tests in `packages/shared/src/schemas/` co-located with schema files
- Content loader tests use actual `content/` JSON files (integration tests)
- `vi.hoisted()` for mocks in Vitest
- Mock Prisma client for service tests: `vi.mock('../config/database.js', ...)`
- Use `supertest.agent(app)` for route integration tests with session cookies
- Express 5 auto-catches async rejections — no try/catch in route tests needed

### Mock Pattern for Prisma in Service Tests

```typescript
const mockPrisma = vi.hoisted(() => ({
  userProgress: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
  chapterProgress: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    upsert: vi.fn(),
  },
}));

vi.mock('../config/database.js', () => ({
  prisma: mockPrisma,
}));
```

### Mock Pattern for Content Loader in Service Tests

```typescript
const mockContent = vi.hoisted(() => ({
  getContent: vi.fn(),
}));

vi.mock('../utils/contentLoader.js', () => mockContent);
```

### Performance Consideration

The `getCurriculumWithProgress` endpoint returns the full curriculum tree with progress overlay. With 69 missions, this is a moderately sized response. Key optimizations:
- **Two DB queries** maximum: one for UserProgress, one for ChapterProgress (batch, not N+1)
- **Content from in-memory cache**: zero file I/O
- **No joins needed**: progress rows are fetched by userId, then merged in-memory with the cached curriculum structure

### Project Structure Notes

New files this story creates:
```
apps/api/prisma/
  schema.prisma                    # MODIFIED — add UserProgress, ChapterProgress models + enums
  migrations/XXXX_add_curriculum_progress/  # NEW — auto-generated migration

apps/api/src/
  services/
    curriculumService.ts           # NEW — curriculum progress business logic
    curriculumService.test.ts      # NEW — unit tests
  routes/
    curriculum.ts                  # NEW — curriculum API routes
    curriculum.test.ts             # NEW — integration tests

packages/shared/src/
  schemas/
    progress.ts                    # NEW — missionIdParam, status schemas
    progress.test.ts               # NEW — schema validation tests
  types/
    progress.ts                    # NEW — progress response types
  index.ts                         # MODIFIED — export new schemas + types

apps/api/src/
  app.ts                           # MODIFIED — register curriculum router
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.2]
- [Source: _bmad-output/planning-artifacts/architecture.md § API Communication Patterns: REST /api/v1/, response format]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns: thin routes, service layer, co-located tests]
- [Source: _bmad-output/planning-artifacts/architecture.md § Data Architecture: Prisma schema as single source of truth]
- [Source: _bmad-output/planning-artifacts/architecture.md § Naming Patterns: PascalCase models, camelCase columns, UPPER_SNAKE enums]
- [Source: _bmad-output/planning-artifacts/prd.md — FR10: sequential module unlocking, FR14: progress percentage]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Curriculum map: locked/available/in-progress/completed states]
- [Source: _bmad-output/implementation-artifacts/3-1-curriculum-content-json-structure-and-loader.md — contentLoader API, content cache structure, curriculum schema details]
- [Source: apps/api/src/utils/contentLoader.ts — getContent() API for cached curriculum data]
- [Source: apps/api/prisma/schema.prisma — current User model with locale field]
- [Source: packages/shared/src/schemas/curriculum.ts — curriculumStructureSchema, missionSchema]
- [Source: packages/shared/src/types/curriculum.ts — CurriculumStructure, Mission, Chapter, Category types]
- [Source: content/structure.json — 6 categories, 18 chapters, 69 missions with IDs and exercise types]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed pre-existing migration issue: `20260309140000_remove_instagram_auth_provider` needed DROP DEFAULT before enum type change
- Dev database reset required due to migration drift from previously modified migration

### Completion Notes List

- Task 1: Added `MissionStatus` and `ChapterStatus` Prisma enums, `UserProgress` and `ChapterProgress` models with cascade delete relations to User, migration applied successfully. Updated seed script with optional progress seeding (SEED_PROGRESS=true).
- Task 2: Created `packages/shared/src/schemas/progress.ts` (missionIdParamSchema, missionStatusSchema, chapterStatusSchema, categoryStatusSchema) and `packages/shared/src/types/progress.ts` (all response types). Added "locked" to missionStatusSchema per AC#1 requirement. Exported from index.ts.
- Task 3: Implemented `curriculumService.ts` with `getCurriculumWithProgress()` (batch 2-query fetch, in-memory merge with cached curriculum, sequential unlock logic across categories/chapters/missions) and `getMissionDetail()` (mission lookup, lock checking via full progress computation, locale fallback to "en").
- Task 4: Created `curriculum.ts` routes with `GET /api/v1/curriculum` and `GET /api/v1/curriculum/missions/:missionId`. Both require `requireAuth`, mission detail validates params with Zod. Registered in `app.ts`.
- Task 5: Implemented as part of Task 3 — zero-row state computed dynamically from curriculum structure position. No pre-created rows.
- Task 6: 17 unit tests for service (getCurriculumWithProgress: 4 tests, getMissionAccessStatus: 7 tests, getMissionDetail: 6 tests), 10 integration tests for routes (200/401/403/404/400 cases + cross-category unlock), 12 schema validation tests. All 400 tests pass (254 API + 118 shared + 28 web), zero regressions.

### File List

- `apps/api/prisma/schema.prisma` — MODIFIED: added MissionStatus/ChapterStatus enums, UserProgress/ChapterProgress models, User relations
- `apps/api/prisma/migrations/20260309160922_add_curriculum_progress/migration.sql` — NEW: auto-generated migration
- `apps/api/prisma/migrations/20260309140000_remove_instagram_auth_provider/migration.sql` — MODIFIED: fixed shadow DB cast error by dropping/restoring default
- `apps/api/prisma/seed.ts` — MODIFIED: added optional progress seeding
- `apps/api/src/services/curriculumService.ts` — NEW: curriculum progress business logic
- `apps/api/src/services/curriculumService.test.ts` — NEW: 10 unit tests
- `apps/api/src/routes/curriculum.ts` — NEW: curriculum API routes
- `apps/api/src/routes/curriculum.test.ts` — NEW: 8 integration tests
- `apps/api/src/app.ts` — MODIFIED: registered curriculumRouter
- `packages/shared/src/schemas/progress.ts` — NEW: Zod schemas for progress
- `packages/shared/src/schemas/progress.test.ts` — NEW: 12 schema validation tests
- `packages/shared/src/types/progress.ts` — NEW: TypeScript types for progress API responses
- `packages/shared/src/index.ts` — MODIFIED: exported new schemas and types
- `apps/api/src/__fixtures__/curriculum.ts` — NEW: shared test fixture for curriculum tests

## Change Log

- 2026-03-09: Story 3.2 implemented — Curriculum Progress API with UserProgress/ChapterProgress tables, GET /api/v1/curriculum and GET /api/v1/curriculum/missions/:missionId endpoints, sequential unlock logic, Zod validation, 30 new tests (all passing)
- 2026-03-09: Code review fixes — Refactored getMissionDetail to use targeted getMissionAccessStatus (1-2 queries vs full overlay), fixed completedAt type consistency, added cross-category route tests, extracted shared test fixtures, added MissionStatus.AVAILABLE schema comment. 39 total tests for this story (17 service + 10 route + 12 schema).
