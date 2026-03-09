# Story 3.4: Jargon Tooltips API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to look up any technical term and get a plain-language definition with a real-world analogy,
So that I never feel lost when encountering blockchain jargon.

## Acceptance Criteria

1. **Given** an authenticated user,
   **When** they call `GET /api/v1/tooltips/:term`,
   **Then** the tooltip definition is returned with: term, plain-language definition, real-world analogy, related terms,
   **And** the content is served in the user's locale.

2. **Given** an authenticated user,
   **When** they call `GET /api/v1/tooltips`,
   **Then** the full glossary is returned (all terms for the user's locale),
   **And** terms are alphabetically sorted.

3. **Given** a term that doesn't exist,
   **When** the endpoint is called,
   **Then** a 404 is returned with code `TERM_NOT_FOUND`.

4. **Given** the tooltips endpoint,
   **When** called without authentication,
   **Then** a 401 error is returned.

5. **Given** the tooltips endpoint with `:term` param,
   **When** the term param contains invalid characters or exceeds max length,
   **Then** a 400 error is returned with code `INVALID_INPUT`.

6. **Given** an authenticated user whose locale is not available,
   **When** they call any tooltips endpoint,
   **Then** the response falls back to English (`en`) content.

## Tasks / Subtasks

- [x] Task 1: Add shared Zod schemas and types for tooltips API (AC: #1, #2, #5)
  - [x] 1.1 Add to `packages/shared/src/schemas/tooltip.ts`:
    - `termParamSchema`: `z.object({ term: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/) })` — validates the `:term` URL param (lowercase kebab-case)
  - [x] 1.2 Add to `packages/shared/src/types/curriculum.ts`:
    - `TooltipResponse`: `{ term: string, definition: string, analogy: string, relatedTerms: string[] }` — single tooltip response
    - `GlossaryResponse`: `{ terms: TooltipResponse[] }` — full glossary response (array sorted alphabetically by term)
  - [x] 1.3 Export new schemas and types from `packages/shared/src/index.ts`

- [x] Task 2: Create `tooltipService.ts` service (AC: #1, #2, #3, #6)
  - [x] 2.1 Create `apps/api/src/services/tooltipService.ts` with:
    - `getTooltip(term: string, locale: string): TooltipResponse` — looks up a single term from cached content, throws 404 `TERM_NOT_FOUND` if not found
    - `getGlossary(locale: string): GlossaryResponse` — returns all tooltips sorted alphabetically by term field
  - [x] 2.2 Both methods:
    - Access content via `getContent().tooltips.get(locale)` (already cached at startup)
    - Fall back to `getContent().tooltips.get("en")` if requested locale unavailable
    - Throw `AppError(500, "CONTENT_UNAVAILABLE", ...)` if neither locale nor "en" available (defensive)
  - [x] 2.3 `getTooltip` uses the term param as the key into the `TooltipCollection` record (e.g., `tooltips["blockchain"]`)
  - [x] 2.4 `getGlossary` converts the `TooltipCollection` record to an array, sorts by `term` field (case-insensitive), and returns

- [x] Task 3: Add tooltip routes (AC: #1, #2, #3, #4, #5)
  - [x] 3.1 Create `apps/api/src/routes/tooltips.ts` with a new `tooltipsRouter`:
    - `GET /` — authenticated, calls `getGlossary(user.locale ?? "en")`, returns `{ data: GlossaryResponse }`
    - `GET /:term` — authenticated, validates params with `termParamSchema`, calls `getTooltip(term, user.locale ?? "en")`, returns `{ data: TooltipResponse }`
  - [x] 3.2 Both routes require `requireAuth` middleware
  - [x] 3.3 The `GET /:term` route uses `validate({ params: termParamSchema })` middleware
  - [x] 3.4 Register `tooltipsRouter` in `apps/api/src/app.ts` at `/api/v1/tooltips`

- [x] Task 4: Write tests (AC: #1-#6)
  - [x] 4.1 Unit tests for `tooltipService.ts` (`apps/api/src/services/tooltipService.test.ts`):
    - `getTooltip("blockchain", "en")`: returns correct tooltip object
    - `getTooltip("blockchain", "fr")`: returns French content
    - `getTooltip("nonexistent", "en")`: throws 404 TERM_NOT_FOUND
    - `getTooltip("blockchain", "xx")`: falls back to English
    - `getGlossary("en")`: returns all terms sorted alphabetically
    - `getGlossary("fr")`: returns French glossary
    - `getGlossary("xx")`: falls back to English
  - [x] 4.2 Integration tests for routes (`apps/api/src/routes/tooltips.test.ts`):
    - `GET /api/v1/tooltips` (authenticated) -> 200 with all terms sorted
    - `GET /api/v1/tooltips` (unauthenticated) -> 401
    - `GET /api/v1/tooltips/blockchain` (authenticated) -> 200 with tooltip
    - `GET /api/v1/tooltips/nonexistent` (authenticated) -> 404 TERM_NOT_FOUND
    - `GET /api/v1/tooltips/INVALID!@#` (authenticated) -> 400 INVALID_INPUT
    - `GET /api/v1/tooltips/blockchain` (unauthenticated) -> 401
  - [x] 4.3 Schema validation tests (`packages/shared/src/schemas/tooltip.test.ts` — extend existing):
    - `termParamSchema` validates `{ term: "blockchain" }` -> success
    - `termParamSchema` validates `{ term: "private-key" }` -> success (kebab-case with hyphen)
    - `termParamSchema` rejects `{ term: "" }` -> error
    - `termParamSchema` rejects `{ term: "UPPERCASE" }` -> error
    - `termParamSchema` rejects `{ term: "has spaces" }` -> error
    - `termParamSchema` rejects `{ term: "special!@#" }` -> error
  - [x] 4.4 Regression: all existing tests still pass (294 API tests + 134 shared tests)

## Dev Notes

### Critical Architecture Patterns

- **Route handlers are thin**: validate -> service -> respond. All business logic lives in `tooltipService.ts`. Routes do NOT use try/catch — Express 5 auto-catches async rejections and forwards to the global `errorHandler` middleware. [Source: architecture.md § Implementation Patterns]
- **Error handling**: Services throw `AppError` instances with `new AppError(statusCode, code, message)`. AppError class is at `apps/api/src/utils/AppError.ts`. [Source: Story 2.7 Dev Notes]
- **Response format**: Success = `{ data: T }`, Error = `{ error: { code, message, details? } }`. [Source: architecture.md § Format Patterns]
- **New router required**: This story creates a NEW `tooltipsRouter` (not extending `curriculumRouter`) because tooltips are a separate resource at `/api/v1/tooltips`. Register in `app.ts`.

### Content Loader — How to Access Tooltip Data

Story 3.1 created `contentLoader.ts` which loads all content JSON at server startup. Access cached tooltips via:

```typescript
import { getContent } from '../utils/contentLoader.js';

const content = getContent();
const tooltips = content.tooltips.get(locale);  // TooltipCollection (Record<string, Tooltip>)
// Fallback:
const fallback = content.tooltips.get("en");
```

**No database access needed** — tooltips are static content served from cached JSON files. This is a pure read-from-cache story with no Prisma queries.

### Tooltip Data Shape (Already Defined)

The `TooltipCollection` type is `Record<string, Tooltip>` where:

```typescript
interface Tooltip {
  term: string;           // "Blockchain"
  definition: string;     // "A shared digital record that stores information..."
  analogy: string;        // "Like a shared Google Doc..."
  relatedTerms: string[]; // ["block", "hash", "distributed-ledger", "decentralization"]
}
```

Keys are kebab-case slugs (e.g., `"blockchain"`, `"private-key"`, `"smart-contract"`).

Currently **20 terms** in both `content/en/tooltips.json` and `content/fr/tooltips.json`:
`blockchain`, `block`, `hash`, `consensus`, `distributed-ledger`, `cryptocurrency`, `token`, `bitcoin`, `ethereum`, `wallet`, `private-key`, `public-key`, `gas-fee`, `smart-contract`, `nft`, `defi`, `mining`, `staking`, `decentralization`, `peer-to-peer`

### Locale Fallback Pattern (Established in Story 3.2)

```typescript
let tooltips = content.tooltips.get(locale);
if (!tooltips) {
  tooltips = content.tooltips.get("en");
}
if (!tooltips) {
  throw new AppError(500, "CONTENT_UNAVAILABLE", "Tooltip content not available");
}
```

This same pattern is used in `curriculumService.ts` for mission content. Follow it exactly.

### Route Registration — Where to Add

Create a NEW router file `apps/api/src/routes/tooltips.ts`. Register it in `apps/api/src/app.ts`:

```typescript
import { tooltipsRouter } from "./routes/tooltips.js";
// ...
app.use("/api/v1/tooltips", tooltipsRouter);
```

Current routers in `app.ts`:
- `/api/v1/auth` → `authRouter`
- `/api/v1/users` → `usersRouter`
- `/api/v1/disclaimers` → `disclaimersRouter`
- `/api/v1/curriculum` → `curriculumRouter`
- `/api/v1/tooltips` → `tooltipsRouter` (NEW)

### Route Ordering Note

The `GET /` (glossary) route MUST be defined BEFORE `GET /:term` in the router to avoid Express interpreting a bare path as a term param. Example:

```typescript
tooltipsRouter.get("/", requireAuth, async (req, res) => { ... });
tooltipsRouter.get("/:term", requireAuth, validate({ params: termParamSchema }), async (req, res) => { ... });
```

### Testing Patterns from Story 3.3

- **Mock content**: `vi.hoisted(() => ({ getContent: vi.fn() }))` + `vi.mock('../utils/contentLoader.js', ...)`
- **No Prisma mocks needed** — this story has no DB access
- **Route integration tests**: `supertest.agent(app)` with session cookies
- **Test fixtures**: Create a small tooltip fixture (2-3 terms) for unit tests rather than using the full 20-term JSON
- **400+ tests** currently pass. Ensure zero regressions.

### Mock Pattern for Content Loader (No Prisma Needed)

```typescript
const mockGetContent = vi.hoisted(() => vi.fn());

vi.mock('../utils/contentLoader.js', () => ({
  getContent: mockGetContent,
}));

// In beforeEach:
mockGetContent.mockReturnValue({
  tooltips: new Map([
    ["en", {
      "blockchain": {
        term: "Blockchain",
        definition: "A shared digital record...",
        analogy: "Like a shared Google Doc...",
        relatedTerms: ["block", "hash"],
      },
      "hash": {
        term: "Hash",
        definition: "A unique digital fingerprint...",
        analogy: "Like a fingerprint...",
        relatedTerms: ["block", "blockchain"],
      },
    }],
    ["fr", {
      "blockchain": {
        term: "Blockchain",
        definition: "Un registre numerique partage...",
        analogy: "Comme un Google Doc partage...",
        relatedTerms: ["block", "hash"],
      },
    }],
  ]),
  // Other content fields if needed by the module
  curriculum: [],
  missions: new Map(),
  uiStrings: new Map(),
});
```

### Edge Cases to Handle

1. **Term casing**: The `:term` param should be lowercase kebab-case. The Zod schema enforces `^[a-z0-9-]+$`. If a user passes `"Blockchain"` or `"BLOCKCHAIN"`, it's rejected with 400.
2. **Empty glossary**: If a locale has no tooltips and fallback also fails, return 500 `CONTENT_UNAVAILABLE`. This should never happen in practice (content loaded at startup).
3. **Glossary sorting**: Sort by the `term` field value (the display name like "Blockchain"), NOT by the record key (the slug like "blockchain"). Use case-insensitive comparison: `terms.sort((a, b) => a.term.localeCompare(b.term))`.

### Project Structure Notes

Files this story creates or modifies:
```
apps/api/src/
  services/
    tooltipService.ts              # NEW — getTooltip(), getGlossary()
    tooltipService.test.ts         # NEW — ~7 unit tests
  routes/
    tooltips.ts                    # NEW — GET / and GET /:term routes
    tooltips.test.ts               # NEW — ~6 integration tests
  app.ts                           # MODIFIED — register tooltipsRouter

packages/shared/src/
  schemas/
    tooltip.ts                     # MODIFIED — add termParamSchema
    tooltip.test.ts                # MODIFIED — add ~6 schema validation tests
  types/
    curriculum.ts                  # MODIFIED — add TooltipResponse, GlossaryResponse types
  index.ts                         # MODIFIED — export termParamSchema, TooltipResponse, GlossaryResponse
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.4]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns: thin routes, service layer]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns: response format, error codes]
- [Source: _bmad-output/planning-artifacts/prd.md — FR16: jargon tooltips with analogies]
- [Source: _bmad-output/implementation-artifacts/3-1-curriculum-content-json-structure-and-loader.md — contentLoader API, tooltip caching]
- [Source: _bmad-output/implementation-artifacts/3-3-mission-completion-and-progress-tracking.md — locale fallback pattern, test patterns]
- [Source: apps/api/src/utils/contentLoader.ts — getContent().tooltips access]
- [Source: packages/shared/src/schemas/tooltip.ts — existing tooltipSchema, tooltipCollectionSchema]
- [Source: packages/shared/src/types/curriculum.ts — existing Tooltip, TooltipCollection types]
- [Source: content/en/tooltips.json — 20 terms, kebab-case keys]
- [Source: apps/api/src/app.ts — router registration pattern]
- [Source: apps/api/src/middleware/validate.ts — Zod validation middleware]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Implemented `termParamSchema` in shared package validating lowercase kebab-case terms (1-100 chars, `^[a-z0-9-]+$`)
- Added `TooltipResponse` and `GlossaryResponse` interfaces to shared types
- Created `tooltipService.ts` with `getTooltip()` and `getGlossary()` — pure cache reads, no DB access
- Locale fallback pattern: requested locale -> "en" -> 500 CONTENT_UNAVAILABLE
- Glossary sorted by `term` field using case-insensitive `localeCompare`
- Created `tooltipsRouter` with `GET /` (glossary) and `GET /:term` (single tooltip), both requiring auth
- Route ordering: `/` before `/:term` to avoid Express param collision
- 9 unit tests for service (including locale fallback and content unavailable edge cases)
- 6 integration tests for routes (auth, 200/401/404/400 scenarios)
- 6 schema validation tests for `termParamSchema`
- All 294 API tests + 134 shared tests pass — zero regressions

### File List

- `packages/shared/src/schemas/tooltip.ts` — MODIFIED (added `termParamSchema`)
- `packages/shared/src/schemas/tooltip.test.ts` — MODIFIED (added 6 `termParamSchema` tests)
- `packages/shared/src/types/curriculum.ts` — MODIFIED (added `TooltipResponse`, `GlossaryResponse`)
- `packages/shared/src/index.ts` — MODIFIED (exported `termParamSchema`, `TooltipResponse`, `GlossaryResponse`)
- `apps/api/src/services/tooltipService.ts` — NEW (getTooltip, getGlossary)
- `apps/api/src/services/tooltipService.test.ts` — NEW (9 unit tests)
- `apps/api/src/routes/tooltips.ts` — NEW (tooltipsRouter with GET / and GET /:term)
- `apps/api/src/routes/tooltips.test.ts` — NEW (6 integration tests)
- `apps/api/src/app.ts` — MODIFIED (registered tooltipsRouter at /api/v1/tooltips)

## Change Log

- 2026-03-09: Implemented Jargon Tooltips API (Story 3.4) — added GET /api/v1/tooltips and GET /api/v1/tooltips/:term endpoints with locale fallback, input validation, and comprehensive test coverage (21 new tests)
- 2026-03-09: Code review fixes — stricter kebab-case regex (rejects leading/trailing hyphens), TooltipResponse as type alias of Tooltip (removes duplication), extracted locale fallback helper in service, added max-length schema test + locale fallback integration tests (5 new tests, 26 total)
