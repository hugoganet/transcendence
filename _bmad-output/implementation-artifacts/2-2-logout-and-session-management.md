# Story 2.2: Logout & Session Management

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to log out and have my session properly terminated,
So that my account is secure when I'm done.

## Acceptance Criteria

1. **Given** an authenticated user **When** they call the logout endpoint **Then** their session is destroyed in Redis **And** the session cookie is cleared **And** subsequent requests with the old cookie return 401

2. **Given** a user session **When** 30 minutes of inactivity pass (configurable 15-120 min) **Then** the session expires automatically in Redis **And** the next request returns 401

## Tasks / Subtasks

- [x] Task 1: Create logout route (AC: #1)
  - [x] 1.1: Add `POST /api/v1/auth/logout` to `apps/api/src/routes/auth.ts`
  - [x] 1.2: Guard with `requireAuth` middleware (only authenticated users can log out)
  - [x] 1.3: Call `req.logout()` (Passport method — removes `req.user` and clears passport session data)
  - [x] 1.4: Call `req.session.destroy()` to fully destroy the session in Redis
  - [x] 1.5: Clear the session cookie in the response (`res.clearCookie('connect.sid')`)
  - [x] 1.6: Return `{ data: { message: "Logged out successfully" } }` with 200 status

- [x] Task 2: Verify session expiry behavior (AC: #2)
  - [x] 2.1: Confirm `SESSION_TTL_SECONDS` env var drives Redis TTL (already set in `config/session.ts` — `maxAge: ttlSeconds * 1000`)
  - [x] 2.2: Verify that connect-redis store respects the TTL and auto-expires sessions
  - [x] 2.3: Verify that express-session's `rolling` option is set to `true` so that the TTL resets on each request (inactivity-based expiry, NOT absolute expiry) — if not already set, add it
  - [x] 2.4: Confirm the configurable range (15-120 min) by validating `SESSION_TTL_SECONDS` with Zod or a manual check in `config/session.ts`

- [x] Task 3: Write tests (AC: #1, #2)
  - [x] 3.1: Add logout integration tests to `apps/api/src/routes/auth.test.ts`:
    - POST /api/v1/auth/logout — success (200), returns expected JSON
    - POST /api/v1/auth/logout — unauthenticated user returns 401
    - POST /api/v1/auth/logout — subsequent requests with old session return 401 (session destroyed)
  - [x] 3.2: Add session expiry test (if feasible — may require mocking Redis TTL or time):
    - Verify expired session returns 401 on next request
  - [x] 3.3: Verify all existing tests still pass (no regressions)

## Dev Notes

### Logout Implementation Pattern

The logout flow requires THREE steps in sequence to fully terminate a session:

```typescript
// 1. req.logout() — Passport method: clears req.user, removes passport data from session
// 2. req.session.destroy() — express-session method: destroys session in Redis store
// 3. res.clearCookie() — Express method: tells browser to delete the session cookie

authRouter.post("/logout", requireAuth, (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((destroyErr) => {
      if (destroyErr) return next(destroyErr);
      res.clearCookie("connect.sid", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      res.json({ data: { message: "Logged out successfully" } });
    });
  });
});
```

**Why all three steps?**
- `req.logout()` alone only clears Passport's `req.user` — the session still exists in Redis
- `req.session.destroy()` removes the session from Redis — but the browser still holds the cookie
- `res.clearCookie()` instructs the browser to delete the session cookie — prevents stale cookie being sent

**Critical: `clearCookie` options must match session cookie options** — `httpOnly`, `secure`, `sameSite` must be identical to the values in `config/session.ts`. Mismatched options cause the cookie NOT to be cleared.

[Source: Express session docs, Passport.js logout docs]

### Session Cookie Name

The default cookie name for express-session is `connect.sid`. The current `config/session.ts` does NOT set a custom `name` option, so the cookie name is `connect.sid`. Use this exact name in `res.clearCookie()`.

If a custom name is ever set in `config/session.ts`, the logout route must match it. Consider extracting the cookie name as a constant.

[Source: apps/api/src/config/session.ts]

### Session Inactivity Expiry (Rolling Sessions)

The current session configuration in `config/session.ts`:
- `maxAge: ttlSeconds * 1000` on the cookie (default 1800s = 30 min)
- `SESSION_TTL_SECONDS` env var controls TTL

**Important:** The NFR requires "30 minutes of **inactivity**" expiry. This means the TTL should reset on every request (rolling sessions). Check if `rolling: true` is set in `express-session` config. If not, add it:

```typescript
export const sessionMiddleware = session({
  store,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,  // <-- Reset maxAge on every response
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ttlSeconds * 1000,
  },
});
```

Without `rolling: true`, sessions expire 30 min after **creation**, not after **last activity**. This is a critical distinction.

**Configurable range (15-120 min):** The env var `SESSION_TTL_SECONDS` already provides configurability. Values 900 (15 min) to 7200 (120 min) should be valid. Consider adding a validation check.

[Source: apps/api/src/config/session.ts, architecture.md#Authentication & Security, NFR9]

### Express 5 + Passport 0.7 Logout

In Passport 0.7.0+, `req.logout()` requires a callback (it's async):

```typescript
// Passport 0.7+ (current)
req.logout((err) => {
  if (err) return next(err);
  // continue...
});

// NOT: req.logout(); (this was Passport 0.5 API — will throw)
```

Express 5 auto-propagates promise rejections, but `req.logout()` uses callbacks, not promises. So the callback pattern is required.

[Source: Passport.js 0.7 changelog, Story 2.1 dev notes]

### Testing Strategy

**Supertest agent for session persistence:** Use the same `supertest.agent(app)` pattern from Story 2.1 tests. The agent maintains cookies across requests, which is essential for testing:
1. Register/login → get session cookie
2. Logout → session destroyed
3. GET /me → should return 401 (proves session was destroyed)

```typescript
const agent = supertest(app);

// Login first
await agent.post("/api/v1/auth/register").send({ ... });

// Logout
const logoutRes = await agent.post("/api/v1/auth/logout");
expect(logoutRes.status).toBe(200);

// Verify session is gone
const meRes = await agent.get("/api/v1/auth/me");
expect(meRes.status).toBe(401);
```

**Session expiry testing:** Testing TTL-based expiry is tricky in integration tests. Options:
- Mock Redis TTL (complex, brittle)
- Set a very short TTL for test (e.g., 1s) and `await new Promise(r => setTimeout(r, 1500))`
- Write this as a unit test verifying the session config has `rolling: true` and correct `maxAge`
- **Recommended:** Test config verification (rolling: true, maxAge matches env var) rather than real expiry

[Source: Story 2.1 testing patterns, apps/api/src/routes/auth.test.ts]

### What This Story Does NOT Include

- No "logout all sessions" (invalidating all sessions for a user) — no current mechanism to query Redis by userId. This could be added in Story 2.4 (password reset invalidates all sessions) using a session store scan or a separate user-sessions tracking mechanism.
- No frontend UI (Story 2.8)
- No rate limiting specific to logout (general rate limiter already covers all endpoints)

### Project Structure Notes

- Alignment with unified project structure: all changes in existing files, no new files needed
- Logout route added to existing `apps/api/src/routes/auth.ts`
- Tests added to existing `apps/api/src/routes/auth.test.ts`
- Session config potentially modified in `apps/api/src/config/session.ts` (rolling option)
- No new dependencies required

### References

- [Source: apps/api/src/routes/auth.ts] — Existing auth routes (register, login, me)
- [Source: apps/api/src/config/session.ts] — Session configuration with Redis store, TTL
- [Source: apps/api/src/config/redis.ts] — Dual Redis client setup (ioredis + node-redis)
- [Source: apps/api/src/middleware/auth.ts] — requireAuth middleware
- [Source: apps/api/src/utils/AppError.ts] — Error class with factory methods
- [Source: apps/api/src/services/authService.ts] — sanitizeUser function
- [Source: apps/api/src/app.ts] — Middleware chain, route registration
- [Source: architecture.md#Authentication & Security] — Session management, 30-min expiry
- [Source: epics.md#Story 2.2] — Acceptance criteria
- [Source: Story 2.1 dev notes] — Passport.js + Express 5 compatibility, testing patterns
- [Source: NFR9] — Sessions must expire after 30 minutes of inactivity (configurable: 15-120 min)

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered.

### Completion Notes List

- Task 1: Implemented `POST /api/v1/auth/logout` in `auth.ts` with the three-step logout flow: `req.logout()` → `req.session.destroy()` → `res.clearCookie()`. Guarded by `requireAuth` middleware.
- Task 2: Added `rolling: true` to session config for inactivity-based expiry. Added TTL range validation (900-7200s) for `SESSION_TTL_SECONDS`. Confirmed `maxAge` drives both cookie and Redis TTL.
- Task 3: Added 4 new tests: logout success, logout unauthenticated, session destroyed after logout, and session expiry with short TTL. All 16 auth route tests pass. Pre-existing `app.test.ts` dist artifact failure unrelated.

### Change Log

- 2026-03-09: Implemented logout route, session rolling, TTL validation, and 4 tests
- 2026-03-09: Code review fixes — refactored tests to use real authRouter (H1), extracted cookie name constant with cross-ref comment (M1), added path to clearCookie (L2), updated test session config to include rolling:true (M2), increased session expiry test margin (M4)

### File List

- `apps/api/src/routes/auth.ts` — Added POST /api/v1/auth/logout route; extracted SESSION_COOKIE_NAME constant, added path to clearCookie
- `apps/api/src/routes/auth.test.ts` — Added 4 tests: logout (3) + session expiry (1); refactored to use real authRouter instead of duplicated routes
- `apps/api/src/config/session.ts` — Added `rolling: true` and TTL range validation
