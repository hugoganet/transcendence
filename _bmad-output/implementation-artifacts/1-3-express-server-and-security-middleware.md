# Story 1.3: Express Server & Security Middleware

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want an Express 5 server with security middleware stack configured,
So that all API endpoints are secure by default.

## Acceptance Criteria

1. **Given** the apps/api workspace **When** the server starts **Then** Express listens on the configured port (default 3000)

2. **Given** a running server **When** any response is sent **Then** Helmet.js sets security headers on all responses

3. **Given** a running server **When** a request arrives from a non-frontend origin **Then** CORS blocks the request **And** when a request arrives from the configured frontend origin **Then** CORS allows the request

4. **Given** a running server **When** a client exceeds the rate limit **Then** express-rate-limit returns 429 **And** rate limit state is stored in Redis via rate-limit-redis

5. **Given** any API error **When** caught by the global error handler **Then** the response follows the format `{ error: { code, message, details? } }` **And** appropriate HTTP status codes are used (400, 401, 403, 404, 500)

6. **Given** the `AppError` class **When** a service throws a typed error **Then** the error handler extracts the HTTP status code and error code from the AppError instance

7. **Given** the server **When** `GET /api/v1/health` is called **Then** it returns 200 with `{ data: { status: "ok" } }`

8. **Given** a route handler with Zod validation middleware **When** invalid input is submitted **Then** a 400 error is returned with field-level error details in the standard error format

9. **Given** all API endpoints **When** responses are sent **Then** proper HTTP status codes are used (400, 401, 403, 404, 500)

## Tasks / Subtasks

- [x] Task 1: Install security middleware dependencies (AC: #2, #3, #4, #8)
  - [x] 1.1: Install runtime deps: `helmet`, `cors`, `express-rate-limit`, `rate-limit-redis`, `zod`
  - [x] 1.2: Install dev deps: `@types/cors`
  - [x] 1.3: Verify all packages install cleanly in the pnpm monorepo

- [x] Task 2: Create AppError class (AC: #5, #6, #9)
  - [x] 2.1: Create `apps/api/src/utils/AppError.ts` with typed error class
  - [x] 2.2: AppError extends Error with: statusCode (number), code (string, UPPER_SNAKE_CASE), message (string), details (optional Record<string, string>)
  - [x] 2.3: Export convenience factory methods: `AppError.badRequest()`, `AppError.unauthorized()`, `AppError.forbidden()`, `AppError.notFound()`, `AppError.internal()`
  - [x] 2.4: Create `apps/api/src/utils/AppError.test.ts` testing all factory methods and property assignment

- [x] Task 3: Create global error handler middleware (AC: #5, #6, #9)
  - [x] 3.1: Create `apps/api/src/middleware/errorHandler.ts`
  - [x] 3.2: Handle AppError instances — extract statusCode, code, message, details
  - [x] 3.3: Handle unknown errors — return 500 with `INTERNAL_ERROR` code, log actual error (never expose internals to client)
  - [x] 3.4: Handle Zod validation errors (ZodError) — return 400 with `INVALID_INPUT` code and field-level details
  - [x] 3.5: Express 5 automatically forwards async errors — do NOT add try/catch wrappers in routes
  - [x] 3.6: Create `apps/api/src/middleware/errorHandler.test.ts` testing all error types

- [x] Task 4: Create Zod validation middleware (AC: #8)
  - [x] 4.1: Create `apps/api/src/middleware/validate.ts`
  - [x] 4.2: Middleware accepts a Zod schema and validates `req.body`, `req.params`, and/or `req.query` depending on configuration
  - [x] 4.3: On validation failure, throw a ZodError (caught by error handler in Task 3)
  - [x] 4.4: On validation success, attach parsed (type-safe) data to the request object (body/params directly, query via res.locals due to Express 5 read-only req.query)
  - [x] 4.5: Create `apps/api/src/middleware/validate.test.ts` testing valid/invalid inputs

- [x] Task 5: Create Redis client configuration (AC: #4)
  - [x] 5.1: Create `apps/api/src/config/redis.ts` with Redis client setup
  - [x] 5.2: Use `ioredis` package (standard for Node.js Redis, compatible with rate-limit-redis via sendCommand adapter)
  - [x] 5.3: Connection URL from `REDIS_URL` environment variable (default: `redis://localhost:6379`)
  - [x] 5.4: Add graceful shutdown for Redis client in `registerRedisShutdownHandlers()`
  - [x] 5.5: Add `REDIS_URL` to `.env.example` (already present, added FRONTEND_URL and RATE_LIMIT_* vars)
  - [x] 5.6: Install `ioredis` (types included in ioredis package)

- [x] Task 6: Create rate limiter middleware (AC: #4)
  - [x] 6.1: Create `apps/api/src/middleware/rateLimiter.ts`
  - [x] 6.2: Configure express-rate-limit with RedisStore from rate-limit-redis
  - [x] 6.3: Use `sendCommand` adapter pattern for ioredis: `(command, ...args) => client.call(command, ...args)`
  - [x] 6.4: Default: 100 requests per 15-minute window (configurable via env)
  - [x] 6.5: Use `standardHeaders: 'draft-7'`, `legacyHeaders: false`
  - [x] 6.6: On rate limit exceeded, return standard error format `{ error: { code: "RATE_LIMIT_EXCEEDED", message } }`
  - [x] 6.7: Create `apps/api/src/middleware/rateLimiter.test.ts` (unit test verifying middleware creation)

- [x] Task 7: Wire up all middleware in app.ts (AC: #1, #2, #3, #4, #7)
  - [x] 7.1: Refactor `apps/api/src/app.ts` to apply middleware in correct order:
    1. `helmet()` — security headers first
    2. `cors({ origin: FRONTEND_URL })` — CORS policy
    3. `express.json()` — body parsing (already present)
    4. `rateLimiter` — rate limiting with Redis
    5. Routes (health check + future routes)
    6. `errorHandler` — global error handler LAST (Express 5 pattern)
  - [x] 7.2: Update health check to return `{ data: { status: "ok" } }` (standard response format)
  - [x] 7.3: Add 404 catch-all for undefined routes returning `{ error: { code: "NOT_FOUND", message: "Route not found" } }`
  - [x] 7.4: Add `FRONTEND_URL` to `.env.example` (default: `http://localhost:5173`)
  - [x] 7.5: Add `RATE_LIMIT_WINDOW_MS` and `RATE_LIMIT_MAX` to `.env.example`

- [x] Task 8: Update existing tests and add integration tests (AC: #1-#9)
  - [x] 8.1: Update `apps/api/src/app.test.ts` to verify health check returns `{ data: { status: "ok" } }`
  - [x] 8.2: Add test for 404 catch-all route
  - [x] 8.3: Add test for CORS headers present on responses
  - [x] 8.4: Add test for Helmet security headers present on responses
  - [x] 8.5: Add integration test for validation middleware with a mock route
  - [x] 8.6: Verify all tests pass with `pnpm test`

## Dev Notes

### Critical: Express 5 Breaking Changes

Express 5.2.1 is already installed. Key patterns the developer MUST follow:

1. **Async error handling is automatic**: Express 5 forwards rejected promises to error handler. Do NOT wrap routes in try/catch — just throw errors or let promises reject.
2. **Named wildcards required**: `app.all('*')` is INVALID in Express 5. Use `app.all('/{*splat}')` for catch-all routes.
3. **`req.query` is read-only**: Cannot assign to `req.query`.
4. **Error handler signature**: Must have 4 params `(err, req, res, next)` — Express uses arity to identify error handlers.

### Architecture Compliance

**Middleware order matters (from architecture.md):**
```
Helmet → CORS → Body Parser → Rate Limiter → Routes → Error Handler
```

**API response format (MANDATORY — from architecture.md#Format Patterns):**
```typescript
// Success
{ data: T }

// Error
{ error: { code: string, message: string, details?: Record<string, string> } }
```

**Error codes:** UPPER_SNAKE_CASE — e.g., `INVALID_INPUT`, `UNAUTHORIZED`, `NOT_FOUND`, `RATE_LIMIT_EXCEEDED`, `INTERNAL_ERROR`

**Route handler pattern:** Thin handlers — validate input (Zod), call service, return response. Business logic lives in services, not routes. [Source: architecture.md#Process Patterns]

**Backend file organization:**
```
apps/api/src/
  routes/         # Thin route handlers
  services/       # Business logic
  middleware/     # Auth, validation, error handling, rate limiting
  config/         # Redis, session, passport, env
  utils/          # AppError, contentLoader, logger
```

### Library & Framework Requirements

| Package | Version | Purpose | Notes |
|---|---|---|---|
| `helmet` | 8.1.0 | Security headers | Standard `app.use(helmet())`, fully Express 5 compatible |
| `cors` | 2.8.6 | CORS policy | `cors({ origin: FRONTEND_URL })`, Express 5 compatible |
| `express-rate-limit` | 8.3.0 | Rate limiting | Use `limit` (not `max`), `standardHeaders: 'draft-7'` |
| `rate-limit-redis` | 4.x | Redis store for rate limiter | Uses `sendCommand` adapter pattern |
| `ioredis` | latest | Redis client | For rate limiting store (Session/Socket.IO Redis is Story 1.4) |
| `zod` | 3.25.x | Input validation | Import from `'zod'` (v3 stable). Already in packages/shared, verify availability in apps/api |

**IMPORTANT — rate-limit-redis with ioredis pattern:**
```typescript
import Redis from 'ioredis';
import { RedisStore } from 'rate-limit-redis';

const client = new Redis(process.env.REDIS_URL);

const store = new RedisStore({
  sendCommand: (command: string, ...args: string[]) =>
    client.call(command, ...args) as Promise<any>,
});
```

### File Structure Requirements

**Files to CREATE:**
- `apps/api/src/utils/AppError.ts` — Typed error class
- `apps/api/src/utils/AppError.test.ts` — AppError unit tests
- `apps/api/src/middleware/errorHandler.ts` — Global error handler
- `apps/api/src/middleware/errorHandler.test.ts` — Error handler tests
- `apps/api/src/middleware/validate.ts` — Zod validation middleware
- `apps/api/src/middleware/validate.test.ts` — Validation middleware tests
- `apps/api/src/middleware/rateLimiter.ts` — Rate limiter with Redis store
- `apps/api/src/middleware/rateLimiter.test.ts` — Rate limiter tests
- `apps/api/src/config/redis.ts` — Redis client singleton

**Files to MODIFY:**
- `apps/api/src/app.ts` — Wire middleware stack, update health endpoint
- `apps/api/src/app.test.ts` — Update tests for new response format
- `apps/api/src/index.ts` — May need Redis shutdown handler
- `apps/api/package.json` — Add new dependencies
- `.env.example` — Add REDIS_URL, FRONTEND_URL, RATE_LIMIT_* vars
- `pnpm-lock.yaml` — Updated automatically

**Files NOT to touch:**
- `apps/api/src/config/database.ts` — Prisma setup, already done (Story 1.2)
- `apps/api/prisma/*` — No schema changes needed
- `packages/shared/*` — Zod schemas will be shared in future stories, but for now the validation middleware just needs to accept any Zod schema

### Testing Requirements

**Testing framework:** Vitest + Supertest (established in Story 1.1)

**Test patterns:**
- Co-located tests (`middleware/errorHandler.test.ts` next to `middleware/errorHandler.ts`)
- Use Supertest for HTTP-level integration tests (`request(app).get(...)`)
- Unit tests for AppError class (no HTTP needed)
- For rate limiter tests: mock Redis or test middleware creation without Redis connection
- Tests must pass without requiring a running Redis instance (use mocks for unit tests)

**Coverage targets:**
- AppError: all factory methods, property assertions
- errorHandler: AppError handling, unknown error handling, ZodError handling
- validate: valid input passes, invalid input returns 400 with details
- Integration: health check, 404 catch-all, CORS headers, Helmet headers

### Previous Story Intelligence (from 1.2)

**Key learnings:**
- TypeScript resolved to 5.9.3 (not 5.8.x) — forward compatible, no issue
- Generated Prisma client imports use `.js` extension even for TypeScript files (ESM requirement)
- `apps/api/tsconfig.json` has `rootDir: "."` (not `"src"`) because generated Prisma client is outside `src/`
- Supabase is used for local PostgreSQL development (port 54322)
- The existing `app.ts` is minimal (just `express.json()` and health route) — good starting point for middleware wiring
- The existing `app.test.ts` uses Supertest with Vitest — follow this pattern
- `registerShutdownHandlers()` in `config/database.ts` handles SIGTERM/SIGINT for Prisma — extend this pattern for Redis

**Code review feedback from 1.2:**
- Build dependency management matters: turbo.json `dependsOn` was needed for db:generate
- Pool leak in shutdown was caught — always close connections properly
- Side-effect signal handlers should be explicit functions, not import side effects

### Git Intelligence

**Recent commits (most recent first):**
1. `0b3c9c0` — feat(api): add Prisma 7 ORM with PostgreSQL and User schema (Story 1.2)
2. `26c6aae` — feat(scaffold): add monorepo scaffold with React, Express, and shared packages (Story 1.1)

**Existing file state:**
- `apps/api/src/app.ts` — 11 lines, minimal Express app with `express.json()` and health route
- `apps/api/src/index.ts` — 10 lines, imports app, registers shutdown handlers, starts server on PORT
- `apps/api/src/config/database.ts` — PrismaClient singleton with pg.Pool adapter and graceful shutdown
- `apps/api/src/app.test.ts` — Single Supertest test for health endpoint

**Established patterns to follow:**
- ESM throughout (`"type": "module"` in package.json)
- `.js` extensions in TypeScript imports
- Vitest for testing, Supertest for HTTP assertions
- `import "dotenv/config"` for env loading (NOT automatic)

### Latest Tech Information

**Express 5.2.1 (already installed):**
- Async errors auto-forwarded to error handler — no try/catch needed
- Named wildcards: use `/{*splat}` not `*` for catch-all routes
- `req.query` is read-only

**Helmet 8.1.0:**
- Standard `app.use(helmet())` — no Express 5 specific changes
- Sets Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, etc.

**express-rate-limit 8.3.0:**
- Use `limit` property (not deprecated `max`)
- `standardHeaders: 'draft-7'` for modern rate limit headers
- `legacyHeaders: false` to disable old `X-RateLimit-*` headers

**rate-limit-redis 4.x:**
- CRITICAL: uses `sendCommand` adapter, NOT direct client pass
- ioredis adapter: `(command, ...args) => client.call(command, ...args)`

**Zod 3.25.x:**
- Stable v3 API, import from `'zod'`
- Zod 4 is available at `zod/v4` but not needed — use v3 for now

### Redis Requirement for Development

This story introduces Redis as a dependency for rate limiting. The developer needs a running Redis instance. Options:
1. **Supabase local** may include Redis — check `supabase/config.toml`
2. **Docker standalone**: `docker run -d --name redis-transcendence -p 6379:6379 redis:7`
3. **Homebrew**: `brew install redis && brew services start redis`

**Important:** Rate limiter tests should NOT require a running Redis instance — use mocks. Only integration/E2E tests should need actual Redis.

### What This Story Does NOT Include

- No session management (Story 1.4 — Redis sessions + connect-redis)
- No Passport.js authentication (Story 2.1)
- No route handlers beyond health check (future stories add domain routes)
- No Socket.IO setup (Story 1.4)
- No Docker Compose changes (Story 1.5)
- No HTTPS configuration (Story 1.5 — Nginx handles this)

### Environment Variables Summary

Add to `.env.example`:
```bash
# Server
PORT=3000
FRONTEND_URL=http://localhost:5173

# Redis
REDIS_URL=redis://localhost:6379

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Project Structure Notes

- All new middleware files go in `apps/api/src/middleware/` per architecture spec [Source: architecture.md#Structure Patterns]
- AppError goes in `apps/api/src/utils/` per architecture spec [Source: architecture.md#Complete Project Directory Structure]
- Redis config goes in `apps/api/src/config/` following the established database.ts pattern [Source: architecture.md#Complete Project Directory Structure]
- Tests co-located with source files [Source: architecture.md#Structure Patterns]

### References

- [Source: architecture.md#Authentication & Security] — Security middleware stack (Helmet, CORS, rate limiting, Zod validation)
- [Source: architecture.md#API & Communication Patterns] — REST `/api/v1/`, error format, status codes
- [Source: architecture.md#Implementation Patterns & Consistency Rules] — Naming, format, and process patterns
- [Source: architecture.md#Complete Project Directory Structure] — File placement for middleware, utils, config
- [Source: architecture.md#Process Patterns] — Error handling, validation flow
- [Source: epics.md#Story 1.3] — Acceptance criteria and user story
- [Express 5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)
- [Helmet.js Docs](https://helmetjs.github.io/)
- [express-rate-limit Docs](https://express-rate-limit.mintlify.app/overview)
- [rate-limit-redis GitHub](https://github.com/express-rate-limit/rate-limit-redis)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6 (claude-opus-4-6)

### Debug Log References

- Express 5 `req.query` is read-only — query validation stores parsed data in `res.locals.query` instead of reassigning `req.query`
- CORS with string origin always sets that origin in response header regardless of request origin; browser enforces the mismatch blocking

### Completion Notes List

- Installed helmet, cors, express-rate-limit, rate-limit-redis, zod, ioredis, @types/cors
- Created AppError class with 5 factory methods (badRequest, unauthorized, forbidden, notFound, internal)
- Created errorHandler middleware handling AppError, ZodError, and unknown errors
- Created validate middleware supporting body, params, and query validation via Zod schemas
- Created Redis client singleton with graceful shutdown handler
- Created rateLimiter middleware with RedisStore adapter (100 req/15min default, configurable)
- Wired full middleware stack in app.ts: Helmet → CORS → JSON → RateLimiter → Routes → ErrorHandler
- Updated health endpoint to standard `{ data: { status: "ok" } }` format
- Added 404 catch-all with Express 5 named wildcard `/{*splat}`
- Added Redis shutdown handlers to index.ts
- Added FRONTEND_URL and RATE_LIMIT_* env vars to .env.example
- All 35 tests pass (34 api + 1 web), zero regressions

### Change Log

- 2026-03-07: Implemented Express 5 security middleware stack — helmet, CORS, rate limiting (Redis-backed), Zod validation, global error handler, AppError class. 34 new/updated API tests all passing.
- 2026-03-07: Code review fixes — [H1] Fixed graceful shutdown race condition: unified Redis+Prisma shutdown in index.ts with sequential disconnect. [H2] Added supertest to api devDependencies. [M1] Added rate limiter 429 integration test. [M2] Added CORS preflight OPTIONS test. 36 API tests passing.

### File List

**Created:**
- `apps/api/src/utils/AppError.ts`
- `apps/api/src/utils/AppError.test.ts`
- `apps/api/src/middleware/errorHandler.ts`
- `apps/api/src/middleware/errorHandler.test.ts`
- `apps/api/src/middleware/validate.ts`
- `apps/api/src/middleware/validate.test.ts`
- `apps/api/src/middleware/rateLimiter.ts`
- `apps/api/src/middleware/rateLimiter.test.ts`
- `apps/api/src/config/redis.ts`

**Modified:**
- `apps/api/src/app.ts`
- `apps/api/src/app.test.ts`
- `apps/api/src/index.ts`
- `apps/api/package.json`
- `.env.example`
- `pnpm-lock.yaml`
