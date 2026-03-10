# Story 4.0: Integration Testing Infrastructure (Real DB, No Mocks)

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want an integration testing infrastructure using Vitest + Supertest against a real PostgreSQL database, real Redis, and real content loader (zero mocks),
So that we catch mock drift and integration regressions before they compound across epics.

## Acceptance Criteria

1. **Given** the project root,
   **When** `pnpm test:integration` is run,
   **Then** Vitest executes integration tests against the real Express app connected to a real test PostgreSQL database and real Redis,
   **And** zero Prisma mocks are used — all queries hit the real database,
   **And** the real content loader loads from `content/` directory.

2. **Given** the integration test environment,
   **When** tests start,
   **Then** a dedicated test database is provisioned (separate from dev DB),
   **And** Prisma migrations are applied to the test database,
   **And** the test database is in a clean, known state before each test suite.

3. **Given** the integration test environment,
   **When** tests complete (pass or fail),
   **Then** the test database tables are truncated (ready for next run),
   **And** no test artifacts leak into the development database.

4. **Given** the test infrastructure,
   **When** a developer writes a new integration test,
   **Then** documented helpers are available for: creating authenticated sessions, making API calls with cookies, resetting the database, seeding test data,
   **And** patterns are consistent with the existing Vitest + Supertest setup in `apps/api/`.

5. **Given** the baseline integration test suite,
   **When** all tests pass,
   **Then** at least 3-5 tests cover critical real-DB paths:
   - Health check endpoint responds 200 (real Redis connection verified)
   - User registration + login flow (real bcrypt hashing, real session in Redis, real user in PostgreSQL)
   - Curriculum progress flow (real content loader, real DB writes, real unlock cascade)
   **And** each test proves the full stack works without mocks.

6. **Given** the test infrastructure,
   **When** integration tests run,
   **Then** they coexist with existing mocked unit/integration tests without conflict,
   **And** a separate Vitest config or project targets the real-DB tests,
   **And** existing 452 tests continue to pass unchanged.

7. **Given** the Turborepo pipeline,
   **When** `turbo run test:integration` is executed,
   **Then** the integration tests run as part of the pipeline,
   **And** they depend on the `build` task and a running PostgreSQL + Redis.

## Tasks / Subtasks

- [x] Task 1: Set up test database infrastructure (AC: #2, #3)
  - [x] 1.1 Add a PostgreSQL init script (or docker-compose override) that creates a `transcendence_test` database alongside the dev database within the same `db` Docker container
  - [x] 1.2 Add `DATABASE_URL_TEST` to `.env.example` with documentation: `postgresql://transcendence:transcendence@localhost:5432/transcendence_test?schema=public`
  - [x] 1.3 Create `apps/api/src/__tests__/setup-integration.ts`:
    - Import PrismaClient configured with `DATABASE_URL_TEST`
    - Run `prisma migrate deploy` programmatically or via shell to apply migrations to test DB
    - Export `resetDatabase()`: truncate all user-data tables using `TRUNCATE ... CASCADE`
    - Export `testPrisma`: PrismaClient instance connected to test DB
  - [x] 1.4 Create `apps/api/vitest.integration.config.ts`:
    - Extends base vitest config
    - Sets `env.DATABASE_URL` to `DATABASE_URL_TEST`
    - Points `include` to `src/__tests__/integration/**/*.test.ts`
    - Sets `globalSetup` to run migrations before all tests
    - Sets `sequence.concurrent: false` (tests run sequentially to avoid DB race conditions)

- [x] Task 2: Create integration test helpers and fixtures (AC: #4)
  - [x] 2.1 Create `apps/api/src/__tests__/integration/helpers/auth.ts`:
    - `createAndLoginUser(agent: SuperTestAgent, overrides?)`: registers + logs in a user via real API endpoints, returns the agent with session cookie
    - `signupUser(agent, data)`: calls `POST /api/v1/auth/signup` with real data
    - `loginUser(agent, credentials)`: calls `POST /api/v1/auth/login`, session cookie auto-persisted by supertest agent
  - [x] 2.2 Create `apps/api/src/__tests__/integration/helpers/db.ts`:
    - Re-exports `resetDatabase()` and `testPrisma` from setup
    - `seedTestUser(overrides?)`: creates a user directly in DB with hashed password (for tests that need a pre-existing user without calling signup API)
  - [x] 2.3 Create `apps/api/src/__tests__/integration/helpers/app.ts`:
    - Exports the real Express `app` instance configured with test environment
    - Ensures content loader initializes with real `content/` files
    - Ensures Redis connects to the real Redis instance (or test Redis DB index)

- [x] Task 3: Write 3-5 baseline integration tests (AC: #5)
  - [x] 3.1 `apps/api/src/__tests__/integration/health.test.ts`:
    - `GET /api/v1/health` returns 200
    - Verifies real DB connection (Prisma can query)
    - Verifies real Redis connection (session store functional)
  - [x] 3.2 `apps/api/src/__tests__/integration/auth-flow.test.ts`:
    - Register a new user (email, password, ageConfirmed) → 201, user exists in real DB
    - Login with those credentials → 200 + session cookie set
    - `GET /api/v1/users/me` with session → returns user profile from real DB
    - Logout → session destroyed in real Redis → `GET /api/v1/users/me` → 401
    - Duplicate registration → 409 `EMAIL_ALREADY_EXISTS`
  - [x] 3.3 `apps/api/src/__tests__/integration/curriculum-progress.test.ts`:
    - Authenticated user calls `GET /api/v1/curriculum` → 200 with real content from `content/structure.json` and progress overlay
    - New user sees only mission 1.1.1 available
    - Complete mission 1.1.1 via `POST /api/v1/curriculum/missions/1.1.1/complete` → 200, real DB write
    - Re-fetch curriculum → mission 1.1.2 now unlocked (real unlock cascade verified)
    - `GET /api/v1/curriculum/chain` → 1 block with real mission title from content loader
  - [x] 3.4 Each test suite calls `resetDatabase()` in `beforeEach` or `beforeAll` to ensure isolation
  - [x] 3.5 Regression: all existing 452 mocked tests still pass (run `pnpm test` alongside `pnpm test:integration`)

- [x] Task 4: Integrate into scripts and pipeline (AC: #6, #7)
  - [x] 4.1 Add `test:integration` script to `apps/api/package.json`: `vitest run --config vitest.integration.config.ts`
  - [x] 4.2 Add `test:integration` script to root `package.json`: `pnpm --filter api test:integration`
  - [x] 4.3 Update `turbo.json` to include `test:integration` task with dependency on `build`
  - [x] 4.4 Verify `pnpm test:integration` runs successfully from the repo root
  - [x] 4.5 Verify `pnpm test` (existing mocked tests) still runs independently and passes

## Dev Notes

### Critical Architecture Patterns

- **Testing strategy from architecture.md**: Vitest for unit + integration tests in `apps/api/`. Supertest for HTTP assertions. [Source: architecture.md § Testing Strategy]
- **Route handlers are thin**: Integration tests hit the full stack: HTTP request → route → service → Prisma → real PostgreSQL → response. This is what the retro demands. [Source: architecture.md § Implementation Patterns]
- **Response format**: All API responses follow `{ data: T }` or `{ error: { code, message, details? } }`. Integration test assertions must verify this shape. [Source: architecture.md § Format Patterns]
- **Session auth**: HTTP-only cookies via express-session + connect-redis. Supertest's `agent()` method persists cookies across requests — same agent = same session. [Source: architecture.md § Authentication & Security]

### Why This Story Exists (Epic 3 Retro Finding)

From the Epic 3 retrospective:
> "**No e2e tests** — All 452 tests are unit/integration with mocks. No tests hit the real database + real content loader together. Mock drift risk grows with each epic."

The retro called for: "test DB, real app integration, 3-5 baseline tests, documented pattern."

**Scope clarification:** No frontend exists yet (Stories 2.8 and 3.6 are backlog). Browser-based E2E with Playwright is deferred to Story 8.5. This story focuses on API-level integration tests against real infrastructure — the actual gap identified in the retro.

### Why Vitest + Supertest (Not Playwright)

- **No frontend to test** — Playwright is a browser automation tool; without UI pages, it adds complexity for zero benefit
- **Vitest + Supertest already in the project** — no new dependencies needed for the test runner
- **Supertest `agent()` handles cookies** — session persistence works identically to a real client
- **Same patterns the team knows** — extends existing test infrastructure rather than introducing a new tool
- **Playwright comes later** — Story 8.5 adds Playwright for browser E2E once frontend exists

### Test Database Strategy

**Approach: Separate test database in Supabase local PostgreSQL**

```
Dev DB:  postgresql://postgres:postgres@127.0.0.1:54322/postgres
Test DB: postgresql://postgres:postgres@127.0.0.1:54322/transcendence_test
```

- Supabase local CLI runs PostgreSQL on port 54322. Test DB created via `CREATE DATABASE transcendence_test`.
- Apply migrations via `prisma migrate deploy` (not `dev` — don't generate new migrations).
- Truncate all tables between test suites using `TRUNCATE ... CASCADE`.
- Run tests sequentially (`sequence.concurrent: false`) to avoid DB race conditions.
- Redis runs as a standalone Docker container (`redis:7-alpine`) on port 6379.

### Supertest Agent for Session Persistence

```typescript
import supertest from 'supertest';
import { app } from '../helpers/app';

// agent() persists cookies across requests — same session
const agent = supertest.agent(app);

// Register
await agent
  .post('/api/v1/auth/signup')
  .send({ email: 'test@example.com', password: 'Test123!@#', ageConfirmed: true })
  .expect(201);

// Login — session cookie auto-saved by agent
await agent
  .post('/api/v1/auth/login')
  .send({ email: 'test@example.com', password: 'Test123!@#' })
  .expect(200);

// Authenticated request — agent sends cookie automatically
const res = await agent.get('/api/v1/users/me').expect(200);
expect(res.body.data.email).toBe('test@example.com');
```

### DB Truncation Utility

```typescript
import { PrismaClient } from '@prisma/client';

const testPrisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL_TEST } },
});

export async function resetDatabase() {
  await testPrisma.$executeRawUnsafe(`
    TRUNCATE TABLE "SelfAssessment", "ChapterProgress", "UserProgress", "Session", "User" CASCADE;
  `);
}
```

**Table truncation order**: children first (SelfAssessment, ChapterProgress, UserProgress, Session), then parents (User). `CASCADE` handles FK dependencies but explicit ordering is clearer.

### App Instance for Integration Tests

The key difference from mocked tests: the app must connect to the **real** test database and **real** Redis.

```typescript
// apps/api/src/__tests__/integration/helpers/app.ts
// Option 1: Import the real app and override env before import
process.env.DATABASE_URL = process.env.DATABASE_URL_TEST;
process.env.NODE_ENV = 'test';

// Must import AFTER setting env vars
const { app } = await import('../../../app.js');
export { app };
```

Alternatively, if `app.ts` reads `DATABASE_URL` at import time, the Vitest integration config must set the env var before any imports via `globalSetup`.

### Content Loader — No Mocking Needed

The content loader reads from `content/` at startup. Integration tests use the **real** content — this is the whole point. The content loader caches at server startup via `getContent()`. Ensure the test app calls `loadContent()` during initialization (it already does in `app.ts` or `index.ts`).

### Vitest Integration Config

```typescript
// apps/api/vitest.integration.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/__tests__/integration/**/*.test.ts'],
    globalSetup: ['src/__tests__/setup-integration.ts'],
    sequence: { concurrent: false },
    testTimeout: 15000, // DB operations may be slower than mocked tests
    env: {
      DATABASE_URL: process.env.DATABASE_URL_TEST ||
        'postgresql://transcendence:transcendence@localhost:5432/transcendence_test?schema=public',
      NODE_ENV: 'test',
    },
  },
});
```

### Edge Cases to Handle

1. **Redis isolation**: Integration tests share the same Redis instance as dev. Use a different Redis DB index for test sessions: `redis://localhost:6379/1` (dev uses DB 0 by default)
2. **Rate limiting**: Rate limiter may block rapid test requests. Set high limits or disable rate limiting when `NODE_ENV=test`
3. **Cookie security**: Session cookies may need `secure: false` for HTTP test requests. Check that `NODE_ENV=test` handling in session config sets `cookie.secure = false`
4. **Port conflict**: Integration tests use Supertest's `agent(app)` which doesn't listen on a port — no conflict with dev server
5. **Content loader init**: Ensure `loadContent()` is called before tests run. If it's called in `app.ts` module init, importing app is sufficient
6. **Prisma client caching**: The production Prisma client singleton reads `DATABASE_URL`. Integration tests need a separate client pointing to `DATABASE_URL_TEST`, or must override the env var before the singleton initializes

### Files This Story Creates

```
apps/api/
  vitest.integration.config.ts              # NEW — Vitest config for real-DB integration tests
  src/__tests__/
    setup-integration.ts                    # NEW — Global setup: migrate test DB, export resetDatabase()
    integration/
      helpers/
        app.ts                              # NEW — Real Express app configured for test env
        auth.ts                             # NEW — createAndLoginUser(), signupUser(), loginUser()
        db.ts                               # NEW — resetDatabase(), seedTestUser(), testPrisma
        setup.ts                            # NEW — Shared beforeAll/afterAll for all integration tests
      health.test.ts                        # NEW — Real health check (DB + Redis verified)
      auth-flow.test.ts                     # NEW — Real registration → login → profile → logout
      curriculum-progress.test.ts           # NEW — Real curriculum fetch → complete → unlock → chain
```

**Modified files:**
```
.env.example                                # MODIFIED — add DATABASE_URL_TEST
turbo.json                                  # MODIFIED — add test:integration pipeline task
package.json (root)                         # MODIFIED — add test:integration script
apps/api/package.json                       # MODIFIED — add test:integration script
apps/api/vitest.config.ts                   # MODIFIED — exclude integration tests from default config
```

### Previous Story Intelligence

From Story 3.5 (latest completed):
- 452 total tests (306 API + 146 shared), all passing, all using mocks
- Mock patterns: `vi.mock('@prisma/client')`, `vi.mock('../utils/contentLoader.js')` — these are what we're bypassing
- Supertest `agent(app)` already used for route integration tests — extend same pattern
- Content loader caches at startup — integration tests validate this works with real files
- Existing test fixtures in `apps/api/src/__fixtures__/curriculum.ts` — integration tests don't need these (real content)

### Git Intelligence

Recent commits show consistent patterns:
- `feat(domain):` commit convention
- Tests included in every commit
- Co-located test files (e.g., `curriculumService.test.ts` next to `curriculumService.ts`)
- Integration tests should follow similar naming: `*.test.ts` suffix

### Project Structure Notes

- New `src/__tests__/integration/` directory within `apps/api/` — keeps integration tests close to the API code they test, separate from co-located unit tests
- `vitest.integration.config.ts` at `apps/api/` level — parallel to existing `vitest.config.ts`
- No changes to `tests/e2e/` — that directory is reserved for Playwright browser tests (Story 8.5)

### References

- [Source: _bmad-output/implementation-artifacts/epic-3-retro-2026-03-09.md — "No e2e tests" challenge, "E2E testing infrastructure" action item]
- [Source: _bmad-output/planning-artifacts/architecture.md § Testing Strategy — Vitest + Supertest for API integration]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns — thin routes, service layer]
- [Source: _bmad-output/planning-artifacts/architecture.md § Authentication & Security — HTTP-only cookies, session management]
- [Source: _bmad-output/planning-artifacts/architecture.md § Format Patterns — API response shapes]
- [Source: _bmad-output/implementation-artifacts/3-5-learning-chain-visualization-api.md — latest test patterns, 452 test baseline]
- [Source: apps/api/vitest.config.ts — existing Vitest configuration to extend]
- [Source: apps/api/src/__fixtures__/curriculum.ts — existing fixture patterns (for reference, not reused)]
- [Source: docker-compose.yml — PostgreSQL and Redis service configuration]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed `resetDatabase()` — removed `"Session"` table reference (sessions stored in Redis, not PostgreSQL)
- Fixed curriculum test assertions — `getCurriculumWithProgress` returns `{ categories, completionPercentage, totalMissions, completedMissions }` not an array
- Fixed mission field names — `missionId` not `id`, `status` uses lowercase (`available`, not `AVAILABLE`)
- Fixed singleton lifecycle — moved setup/teardown to shared `setupFiles` to prevent Redis/Prisma disconnect between test files
- Adapted story from Docker Compose DB to Supabase local PostgreSQL (port 54322, user `postgres`)

### Completion Notes List

- 12 integration tests across 3 test files (added Redis health check)
- Test DB: `transcendence_test` in Supabase local PostgreSQL (port 54322)
- Redis: standalone Docker container (`redis:7-alpine`) on port 6379
- Rate limiter set to 10000 max in test config to avoid blocking rapid requests
- `vitest.config.ts` excludes `src/__tests__/integration/**` so `pnpm test` (306 existing tests) passes unchanged
- `pnpm test:integration` runs from repo root via `pnpm --filter api test:integration`
- `turbo.json` includes `test:integration` task with `^build` dependency and `cache: false`
- Redis uses DB index 1 for test isolation (dev uses DB 0)

### Change Log

- 2026-03-09: Story 4.0 implemented — integration testing infrastructure with real DB, Redis, and content loader
- 2026-03-09: Code review fixes — C1: added auto-creation of test DB in setup-integration.ts; C2: added Redis health check test; H1: isolated Redis to DB index 1; H2: createAndLoginUser now explicitly calls login; H3: turbo.json uses ^build for upstream deps; M1: createAndLoginUser accepts optional agent param; M2: seedTestUser now used in auth-flow login test; M3: health.test.ts now calls resetDatabase()

### File List

New files:
- apps/api/vitest.integration.config.ts
- apps/api/src/__tests__/setup-integration.ts
- apps/api/src/__tests__/integration/helpers/app.ts
- apps/api/src/__tests__/integration/helpers/auth.ts
- apps/api/src/__tests__/integration/helpers/db.ts
- apps/api/src/__tests__/integration/helpers/setup.ts
- apps/api/src/__tests__/integration/health.test.ts
- apps/api/src/__tests__/integration/auth-flow.test.ts
- apps/api/src/__tests__/integration/curriculum-progress.test.ts

Modified files:
- .env.example (added DATABASE_URL_TEST)
- turbo.json (added test:integration task)
- package.json (added test:integration script)
- apps/api/package.json (added test:integration script)
- apps/api/vitest.config.ts (excluded integration tests from default config)
