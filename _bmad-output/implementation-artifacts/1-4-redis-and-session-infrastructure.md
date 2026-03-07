# Story 1.4: Redis & Session Infrastructure

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want Redis configured for session storage and Socket.IO adapter,
So that user sessions and real-time connections are properly managed.

## Acceptance Criteria

1. **Given** a running Redis instance **When** express-session is configured with connect-redis **Then** sessions are stored in Redis with configurable TTL (default 30 min inactivity)

2. **Given** session configuration **When** a session cookie is set **Then** the cookie is HTTP-only, secure (in production), and SameSite=lax

3. **Given** the server starting **When** Redis client connects **Then** connection is verified on startup and logged

4. **Given** the Express app **When** Socket.IO server is initialized **Then** it uses the Redis adapter for pub/sub

5. **Given** a Socket.IO client connecting **When** the WebSocket handshake occurs **Then** Socket.IO authenticates via the session cookie using `io.engine.use(sessionMiddleware)`

6. **Given** environment variables **When** Redis configuration is needed **Then** `REDIS_URL`, `SESSION_SECRET`, and `SESSION_TTL_SECONDS` are documented in `.env.example`

## Tasks / Subtasks

- [x] Task 1: Install session and Socket.IO dependencies (AC: #1, #4)
  - [x] 1.1: Install runtime deps: `express-session`, `connect-redis`, `redis` (node-redis v5+), `socket.io`, `@socket.io/redis-adapter`
  - [x]1.2: Install dev deps: `@types/express-session`
  - [x]1.3: Verify all packages install cleanly in the pnpm monorepo

- [x]Task 2: Create node-redis session client (AC: #1, #3)
  - [x]2.1: Create `apps/api/src/config/session.ts`
  - [x]2.2: Create a `redis` (node-redis) client specifically for connect-redis session store — separate from the existing ioredis client in `config/redis.ts`
  - [x]2.3: Connect on startup with `await sessionRedisClient.connect()`
  - [x]2.4: Add error and ready event listeners with logging
  - [x]2.5: Export `sessionRedisClient` and a `disconnectSessionRedis()` function
  - [x]2.6: Export the configured `sessionMiddleware` from this file (see Task 3)

- [x]Task 3: Configure express-session with RedisStore (AC: #1, #2)
  - [x]3.1: In `apps/api/src/config/session.ts`, create RedisStore using `connect-redis` v9 with the node-redis client
  - [x]3.2: Configure express-session:
    - `store`: RedisStore instance
    - `secret`: from `SESSION_SECRET` env var (MUST be set, throw on missing)
    - `resave`: false
    - `saveUninitialized`: false
    - `cookie.httpOnly`: true
    - `cookie.secure`: `process.env.NODE_ENV === "production"`
    - `cookie.sameSite`: `"lax"`
    - `cookie.maxAge`: from `SESSION_TTL_SECONDS` env var (default 1800 = 30 min), converted to ms
  - [x]3.3: Augment `express-session` `SessionData` interface with `userId: string` (for future auth stories)
  - [x]3.4: Export `sessionMiddleware` as a named export

- [x]Task 4: Configure Socket.IO server with Redis adapter (AC: #4, #5)
  - [x]4.1: Create `apps/api/src/socket/index.ts`
  - [x]4.2: Create and export a function `createSocketServer(httpServer: HttpServer, sessionMiddleware)` that:
    - Creates `new Server(httpServer, { cors: { origin: FRONTEND_URL, credentials: true } })`
    - Configures Redis adapter using ioredis pub/sub clients (`pubClient.duplicate()` for subClient)
    - Registers `sessionMiddleware` on Socket.IO engine via `io.engine.use(sessionMiddleware)`
    - Sets up a `connection` event handler that:
      - Reads `socket.request.session` to get userId
      - Rejects unauthenticated connections (no userId in session) with `socket.disconnect()`
      - Logs authenticated connections
    - Returns the `io` instance
  - [x]4.3: Define TypeScript interfaces for Socket.IO events (minimal for now):
    - `ServerToClientEvents`: `notification:push`, `presence:online`, `presence:offline`
    - `ClientToServerEvents`: empty for now
    - `InterServerEvents`: empty for now
    - `SocketData`: `userId: string`
  - [x]4.4: Add type declaration for `socket.request.session` (extend `http.IncomingMessage`)

- [x]Task 5: Wire everything into the server entry point (AC: #1, #3, #4, #5)
  - [x]5.1: Refactor `apps/api/src/index.ts`:
    - Import `createServer` from `node:http`
    - Create HTTP server wrapping the Express app: `const httpServer = createServer(app)`
    - Import and await `sessionRedisClient.connect()` before server start
    - Import `sessionMiddleware` and register on Express app: `app.use(sessionMiddleware)` — insert AFTER rate limiter, BEFORE routes
    - Import `createSocketServer` and call it with `httpServer` and `sessionMiddleware`
    - Change `app.listen()` to `httpServer.listen()` (required for Socket.IO)
  - [x]5.2: Update graceful shutdown to disconnect session Redis client too:
    - `disconnectSessionRedis()` → `disconnectRedis()` → `prisma.$disconnect()` → `prismaPool.end()`
  - [x]5.3: Export `io` instance for use by future service modules (notifications, presence)

- [x]Task 6: Update app.ts for session middleware integration (AC: #2)
  - [x]6.1: Refactor `apps/api/src/app.ts` to accept session middleware injection OR move session middleware registration to index.ts
  - [x]6.2: Ensure middleware order remains: Helmet → CORS → JSON → RateLimiter → **Session** → Routes → 404 → ErrorHandler
  - [x]6.3: Update CORS config to include `credentials: true` (required for cross-origin cookie sending)

- [x]Task 7: Update environment variables (AC: #6)
  - [x]7.1: Add to `.env.example`:
    - `SESSION_SECRET=change-me-in-production` (already present, verify)
    - `SESSION_TTL_SECONDS=1800`
  - [x]7.2: Validate `SESSION_SECRET` is set on startup — throw clear error if missing or still set to default in production

- [x]Task 8: Write tests (AC: #1-#6)
  - [x]8.1: Create `apps/api/src/config/session.test.ts` — unit test session middleware creation, verify RedisStore configuration
  - [x]8.2: Create `apps/api/src/socket/index.test.ts` — unit test Socket.IO server creation, verify Redis adapter attachment
  - [x]8.3: Add integration test in `apps/api/src/app.test.ts`: verify session cookie is set on response after session interaction
  - [x]8.4: Tests must pass WITHOUT requiring a running Redis instance — mock Redis clients
  - [x]8.5: Verify all existing tests still pass (zero regressions)

## Dev Notes

### Critical: Two Redis Client Libraries

**This project uses TWO Redis client libraries pointing at the same Redis server:**

| Library | Used By | Why |
|---|---|---|
| `ioredis` | rate-limit-redis (Story 1.3), @socket.io/redis-adapter | Socket.IO adapter requires ioredis; rate-limit-redis already uses it |
| `redis` (node-redis v5+) | connect-redis v9 (session store) | connect-redis v9 **dropped ioredis support** — only works with node-redis |

Both connect to the same `REDIS_URL`. This is the officially recommended split — connect-redis maintainers explicitly dropped ioredis in v9.0.0 (June 2024).

**Existing Redis client in `apps/api/src/config/redis.ts`:** This is the ioredis client used by the rate limiter. Do NOT modify it. Create a SEPARATE node-redis client in `config/session.ts` for sessions.

### Critical: Express 5 Patterns (from Story 1.3)

1. **Async error handling is automatic** — Express 5 forwards rejected promises. Do NOT wrap routes in try/catch.
2. **Named wildcards** — `/{*splat}` not `*` for catch-all routes.
3. **`req.query` is read-only** — Cannot assign to `req.query`.
4. **Error handler signature** — Must have 4 params `(err, req, res, next)`.

### Critical: Socket.IO + Express Session Sharing

The official pattern uses `io.engine.use(sessionMiddleware)`:

```typescript
// 1. Create session middleware ONCE
const sessionMiddleware = session({ store, secret, ... });

// 2. Register on Express
app.use(sessionMiddleware);

// 3. Register SAME instance on Socket.IO engine (runs on HTTP upgrade handshake)
io.engine.use(sessionMiddleware);

// 4. Access session in socket handlers
io.on("connection", (socket) => {
  const session = (socket.request as any).session;
  const userId = session?.userId;
});
```

This works because Socket.IO performs an HTTP upgrade handshake where the session cookie is parsed.

### Critical: httpServer Required for Socket.IO

Socket.IO attaches to the underlying Node.js `http.Server`, NOT to the Express app. The current `app.listen()` in `index.ts` must change to:

```typescript
import { createServer } from "node:http";
const httpServer = createServer(app);
// ... attach Socket.IO to httpServer ...
httpServer.listen(PORT);
```

### Architecture Compliance

**Middleware order (updated with session):**
```
Helmet → CORS → Body Parser → Rate Limiter → Session → Routes → 404 → Error Handler
```

**CORS must include `credentials: true`:** Required for cross-origin cookie sending (dev mode: Vite on :5173, API on :3000). [Source: architecture.md#Authentication & Security]

**Socket.IO event naming:** `domain:action` format, all lowercase. [Source: architecture.md#Communication Patterns]

**Socket.IO events defined in architecture:**
- `presence:online` / `presence:offline` — friend online status
- `notification:push` — streak reminders, milestones, re-engagement
- `leaderboard:update` — near-real-time leaderboard changes

**Backend file organization:** [Source: architecture.md#Complete Project Directory Structure]
```
apps/api/src/
  config/         # session.ts (NEW), redis.ts (existing — do not modify)
  socket/         # index.ts (NEW) — Socket.IO server setup
  middleware/     # existing middleware (no changes)
```

### Library & Framework Requirements

| Package | Version | Purpose | Notes |
|---|---|---|---|
| `express-session` | 1.19.0 | Session middleware | Needs separate `@types/express-session@1.18.2` |
| `connect-redis` | 9.0.0 | Redis session store | Named export: `import { RedisStore } from "connect-redis"` |
| `redis` | 5.x | node-redis client for connect-redis | connect-redis v9 requires this, NOT ioredis |
| `socket.io` | 4.8.3 | WebSocket server | Types bundled, no @types needed |
| `@socket.io/redis-adapter` | 8.3.0 | Socket.IO Redis pub/sub adapter | Uses ioredis (existing client compatible) |
| `@types/express-session` | 1.18.2 | TypeScript types | Dev dependency |

**connect-redis v9 import pattern (BREAKING from v7/v8):**
```typescript
// v9 — named export
import { RedisStore } from "connect-redis";

// NOT: import RedisStore from "connect-redis" (v7 pattern, WRONG)
```

**@socket.io/redis-adapter requires TWO ioredis connections:**
```typescript
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";

const pubClient = new Redis(REDIS_URL);
const subClient = pubClient.duplicate(); // separate connection for SUBSCRIBE mode

io.adapter(createAdapter(pubClient, subClient));
```

### File Structure Requirements

**Files to CREATE:**
- `apps/api/src/config/session.ts` — node-redis client + express-session config + RedisStore
- `apps/api/src/config/session.test.ts` — Session config unit tests
- `apps/api/src/socket/index.ts` — Socket.IO server setup with Redis adapter
- `apps/api/src/socket/index.test.ts` — Socket.IO setup unit tests

**Files to MODIFY:**
- `apps/api/src/index.ts` — Switch to httpServer, wire session + Socket.IO, update shutdown
- `apps/api/src/app.ts` — Add `credentials: true` to CORS config, potentially accept session middleware
- `apps/api/src/app.test.ts` — Add session cookie integration tests
- `apps/api/package.json` — Add new dependencies
- `.env.example` — Add `SESSION_TTL_SECONDS`
- `pnpm-lock.yaml` — Updated automatically

**Files NOT to touch:**
- `apps/api/src/config/redis.ts` — Existing ioredis client for rate limiter, leave as-is
- `apps/api/src/config/database.ts` — Prisma setup, unchanged
- `apps/api/prisma/*` — No schema changes
- `apps/api/src/middleware/*` — Existing middleware, no changes needed
- `apps/api/src/utils/*` — AppError, no changes needed
- `packages/shared/*` — No shared schema changes

### Testing Requirements

**Testing framework:** Vitest + Supertest (established in Story 1.1)

**Test patterns:**
- Co-located tests (e.g., `config/session.test.ts` next to `config/session.ts`)
- Mock Redis clients — tests must pass without a running Redis instance
- For session tests: verify middleware creation, cookie configuration, RedisStore attachment
- For Socket.IO tests: verify server creation, Redis adapter attachment, session middleware registration on engine
- Integration tests: use Supertest to verify session cookie behavior

**Coverage targets:**
- Session config: RedisStore creation, middleware options, cookie settings, TTL configuration
- Socket.IO: server creation with CORS, Redis adapter configuration, session auth on handshake
- Integration: session cookie set on response, CORS credentials header present
- Regression: all 36 existing API tests still pass

### Previous Story Intelligence (from 1.3)

**Key learnings to apply:**
- Express 5 automatically forwards async errors — no try/catch in routes
- Graceful shutdown pattern: sequential disconnect (`disconnectRedis()` → `prisma.$disconnect()` → `prismaPool.end()`) — extend with `disconnectSessionRedis()` at the front
- ESM throughout: `"type": "module"`, `.js` extensions in TypeScript imports
- `import "dotenv/config"` for env loading
- Rate limiter tests mock Redis — follow same pattern for session tests
- Tests use Vitest + Supertest (`request(app).get(...)`)
- CORS with string origin always sets that origin in response header

**Code review fixes from 1.3 to apply proactively:**
- Unified shutdown: all disconnects in one sequential chain in `index.ts`
- Ensure supertest is in devDependencies (already done)
- Side-effect signal handlers as explicit functions, not import side effects

### What This Story Does NOT Include

- No Passport.js authentication strategies (Story 2.1)
- No login/registration endpoints (Story 2.1)
- No Socket.IO event handlers beyond connection/disconnect logging (Stories 6.2, 7.1)
- No presence tracking logic (Story 6.2)
- No notification push logic (Story 7.1)
- No Docker Compose Redis service (Story 1.5)
- No HTTPS/Nginx configuration (Story 1.5)
- No frontend Socket.IO client (future frontend stories)

### Environment Variables Summary

Verify/add in `.env.example`:
```bash
# Session
SESSION_SECRET=change-me-in-production
SESSION_TTL_SECONDS=1800
```

`SESSION_SECRET` already exists in `.env.example`. Add `SESSION_TTL_SECONDS`.

### Project Structure Notes

- `config/session.ts` follows the established pattern of `config/redis.ts` and `config/database.ts` — one file per infrastructure concern [Source: architecture.md#Complete Project Directory Structure]
- `socket/index.ts` is the Socket.IO server setup file per architecture spec [Source: architecture.md#Complete Project Directory Structure — `socket/` directory]
- Tests co-located with source files [Source: architecture.md#Structure Patterns]
- Session middleware placed after rate limiter, before routes [Source: architecture.md#Authentication & Security]

### References

- [Source: architecture.md#Authentication & Security] — Passport.js + express-session + connect-redis, HTTP-only cookies, session expiry
- [Source: architecture.md#Core Architectural Decisions] — Redis for sessions + Socket.IO adapter
- [Source: architecture.md#Communication Patterns] — Socket.IO event naming and patterns
- [Source: architecture.md#Complete Project Directory Structure] — File placement for config/, socket/
- [Source: architecture.md#Infrastructure & Deployment] — Docker services (redis on 6379)
- [Source: epics.md#Story 1.4] — Acceptance criteria and user story
- [Socket.IO + express-session integration](https://socket.io/how-to/use-with-express-session)
- [connect-redis v9 migration — ioredis dropped](https://github.com/tj/connect-redis/releases)
- [@socket.io/redis-adapter docs](https://socket.io/docs/v4/redis-adapter/)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Socket.IO adapter mock required returning a proper constructor class (not a plain object/undefined) since `io.adapter()` calls `new adapter(nsp)` internally.

### Completion Notes List

- **Task 1:** Installed `express-session`, `connect-redis`, `redis` (node-redis v5), `socket.io`, `@socket.io/redis-adapter` as runtime deps, `@types/express-session` as dev dep. All 36 existing tests pass after install.
- **Task 2:** Created `config/session.ts` with a dedicated node-redis client for connect-redis (separate from existing ioredis client in `config/redis.ts`). Includes startup connect, error/ready logging, and `disconnectSessionRedis()` export.
- **Task 3:** Configured express-session with RedisStore (connect-redis v9 named import), SESSION_SECRET validation (throws if missing or default in production), configurable TTL via `SESSION_TTL_SECONDS`, HTTP-only/secure/sameSite=lax cookies. Augmented `SessionData` with `userId: string`.
- **Task 4:** Created `socket/index.ts` with `createSocketServer()` that creates Socket.IO server with CORS credentials, Redis adapter via ioredis pub/sub pair, session middleware on engine, and connection handler that rejects unauthenticated sockets. Defined typed event interfaces (`ServerToClientEvents`, `ClientToServerEvents`, `InterServerEvents`, `SocketData`).
- **Task 5:** Refactored `index.ts` to use `node:http` createServer, wired session middleware via `registerRoutes()`, attached Socket.IO to httpServer, added `sessionRedisClient.connect()` before server start, updated graceful shutdown chain: `disconnectSessionRedis → disconnectRedis → prisma.$disconnect → prismaPool.end`.
- **Task 6:** Refactored `app.ts` with `registerRoutes(sessionMw?)` pattern to ensure middleware order: Helmet → CORS → JSON → RateLimiter → Session → Routes → 404 → ErrorHandler. Added `credentials: true` to CORS config.
- **Task 7:** Added `SESSION_TTL_SECONDS=1800` to `.env.example`. `SESSION_SECRET` was already present. Validated SESSION_SECRET on startup with clear error messages.
- **Task 8:** Created `config/session.test.ts` (9 tests) and `socket/index.test.ts` (4 tests). Updated `app.test.ts` for `registerRoutes` pattern and added CORS credentials test (10 tests total). All tests mock Redis — no running Redis required. Full suite: 50 tests, 0 failures, 0 regressions.

### Change Log

- 2026-03-07: Implemented Redis session infrastructure and Socket.IO server with Redis adapter. 14 new tests added, all 50 tests pass.
- 2026-03-07: **Code review fixes** — Fixed 6 issues (3 HIGH, 3 MEDIUM):
  - H1: Added `httpServer.close()` + `io.close()` to graceful shutdown (fixes leaked Socket.IO pub/sub ioredis clients)
  - H2: Added session cookie integration test in `app.test.ts`
  - H3: Fixed NO-OP SESSION_SECRET validation tests — now properly tests throw on missing/default secret
  - M1: Graceful shutdown now closes HTTP server and Socket.IO before disconnecting backends
  - M2: Added behavioral auth test — verifies unauthenticated sockets are disconnected
  - M3: Resolved via io.close() in shutdown (Socket.IO closes adapter connections internally)
  - Also: Removed unnecessary type assertion in socket/index.ts (L2)
  - Test count: 50 → 53 (3 new tests added). All pass, 0 regressions.

### File List

**Created:**
- `apps/api/src/config/session.ts` — node-redis client + express-session + RedisStore configuration
- `apps/api/src/config/session.test.ts` — Session config unit tests (10 tests, was 9)
- `apps/api/src/socket/index.ts` — Socket.IO server with Redis adapter and session auth
- `apps/api/src/socket/index.test.ts` — Socket.IO setup unit tests (5 tests, was 4)

**Modified:**
- `apps/api/src/index.ts` — Switched to httpServer, wired session + Socket.IO, updated shutdown with httpServer.close() + io.close()
- `apps/api/src/app.ts` — Added `registerRoutes()` pattern, `credentials: true` in CORS
- `apps/api/src/app.test.ts` — Updated for registerRoutes, added CORS credentials + session cookie tests (11 tests, was 10)
- `apps/api/package.json` — Added runtime and dev dependencies (+ socket.io-client devDep for tests)
- `.env.example` — Added `SESSION_TTL_SECONDS=1800`
- `pnpm-lock.yaml` — Updated automatically
