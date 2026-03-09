# Story 2.4: Password Reset

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to reset my password via email,
So that I can regain access to my account if I forget my password.

## Acceptance Criteria

1. **Given** a user requests password reset with their email,
   **When** the email exists in the system,
   **Then** a time-limited reset token is generated and stored,
   **And** a reset email is sent via Resend with a secure link,
   **And** the API returns a generic success message (no email existence leak).

2. **Given** a user requests password reset with an email that does NOT exist,
   **When** the request is processed,
   **Then** the API returns the same generic success message as AC #1 (email enumeration prevention),
   **And** no email is sent.

3. **Given** a user with a valid reset token,
   **When** they submit a new password via the reset endpoint,
   **Then** the password is updated (hashed with bcrypt),
   **And** all existing sessions for that user are invalidated in Redis,
   **And** the reset token is consumed (single-use),
   **And** a success response is returned.

4. **Given** an expired reset token (older than 1 hour),
   **When** a password reset is attempted,
   **Then** a 400 error is returned with code `INVALID_RESET_TOKEN`.

5. **Given** an invalid or already-used reset token,
   **When** a password reset is attempted,
   **Then** a 400 error is returned with code `INVALID_RESET_TOKEN`.

6. **Given** a user requests multiple password resets,
   **When** a new reset is requested,
   **Then** all previous reset tokens for that user are invalidated,
   **And** only the latest token is valid.

7. **Given** all password reset endpoints,
   **When** input is submitted,
   **Then** Zod validates request bodies on the backend,
   **And** invalid input returns 400 with field-level error details.

## Tasks / Subtasks

- [x] Task 1: Install Resend SDK (AC: #1)
  - [x] 1.1 Install `resend` package in `apps/api`
  - [x] 1.2 Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `.env.example` with documentation
  - [x] 1.3 Make Resend env vars optional (app works without them, but reset emails won't send)

- [x] Task 2: Create PasswordResetToken Prisma model (AC: #1, #3, #4, #5, #6)
  - [x] 2.1 Add `PasswordResetToken` model to `prisma/schema.prisma`:
    - `id` (String, uuid, @id)
    - `token` (String, unique) — cryptographically random, 64 hex chars
    - `userId` (String, FK → User)
    - `expiresAt` (DateTime) — 1 hour from creation
    - `usedAt` (DateTime?) — null until consumed
    - `createdAt` (DateTime, @default(now()))
  - [x] 2.2 Add relation `User.passwordResetTokens PasswordResetToken[]`
  - [x] 2.3 Add `@@index([token])` for fast lookup
  - [x] 2.4 Run `npx prisma migrate dev` to create migration

- [x] Task 3: Create email service (AC: #1)
  - [x] 3.1 Create `apps/api/src/services/emailService.ts`
  - [x] 3.2 Initialize Resend client with `RESEND_API_KEY` (lazy init, null if no key)
  - [x] 3.3 Implement `sendPasswordResetEmail(to: string, resetLink: string): Promise<void>`
    - Use clean HTML template matching platform aesthetic (teal primary #2B9E9E)
    - Include: reset link button, expiry notice (1 hour), "didn't request this" note
    - Include plain text fallback
  - [x] 3.4 Log warning if Resend is not configured (do not throw — graceful degradation)
  - [x] 3.5 Export email service for use in auth routes

- [x] Task 4: Implement password reset service functions (AC: #1, #2, #3, #4, #5, #6)
  - [x] 4.1 Add `requestPasswordReset(email: string)` to `authService.ts`:
    - Look up user by email (if not found, return silently — no enumeration)
    - Delete all existing reset tokens for this user (AC #6)
    - Generate cryptographically secure token using `crypto.randomBytes(32).toString('hex')`
    - Create `PasswordResetToken` record with 1-hour expiry
    - Build reset link: `${FRONTEND_URL}/reset-password?token=${token}`
    - Call `emailService.sendPasswordResetEmail()`
  - [x] 4.2 Add `resetPassword(token: string, newPassword: string)` to `authService.ts`:
    - Look up token in DB (include user relation)
    - Validate: token exists, not used (`usedAt` is null), not expired (`expiresAt > now`)
    - If invalid → throw `AppError(400, 'INVALID_RESET_TOKEN', 'Reset token is invalid or expired')`
    - Hash new password with bcryptjs (cost factor 12, matching existing register flow)
    - Update user's `passwordHash` in DB
    - Mark token as used (`usedAt = now`)
    - Invalidate all sessions for this user in Redis
  - [x] 4.3 Implement `invalidateUserSessions(userId: string)`:
    - Scan Redis keys matching session prefix (`sess:*`)
    - For each session, deserialize and check if `passport.user` matches userId
    - Delete matching session keys
    - Note: acceptable for 20-user scale per NFR4; for larger scale would use userId→sessionId index

- [x] Task 5: Add shared validation schemas (AC: #7)
  - [x] 5.1 Add `passwordResetRequestSchema` to `packages/shared/src/schemas/auth.ts`:
    - `email`: z.string().email()
  - [x] 5.2 Add `passwordResetSchema` to `packages/shared/src/schemas/auth.ts`:
    - `token`: z.string().min(1)
    - `password`: z.string().min(8) (match existing register password rules)
  - [x] 5.3 Export from `packages/shared/src/index.ts`

- [x] Task 6: Add password reset routes (AC: #1, #2, #3, #4, #5, #7)
  - [x] 6.1 Add `POST /api/v1/auth/forgot-password`:
    - Validate body with `passwordResetRequestSchema`
    - Call `authService.requestPasswordReset(email)`
    - Always return `{ data: { message: 'If an account with that email exists, a reset link has been sent.' } }` with 200
    - Rate limit: stricter than global (e.g., 5 requests per 15 minutes per IP)
  - [x] 6.2 Add `POST /api/v1/auth/reset-password`:
    - Validate body with `passwordResetSchema`
    - Call `authService.resetPassword(token, password)`
    - Return `{ data: { message: 'Password has been reset successfully.' } }` with 200
  - [x] 6.3 Both routes are public (no `requireAuth` middleware)

- [x] Task 7: Write tests (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 7.1 Unit tests for `requestPasswordReset()`:
    - Existing email → token created, email service called
    - Non-existent email → no error, no email sent
    - Multiple requests → old tokens invalidated, only latest valid
  - [x] 7.2 Unit tests for `resetPassword()`:
    - Valid token → password updated, token consumed, sessions invalidated
    - Expired token → throws INVALID_RESET_TOKEN
    - Already-used token → throws INVALID_RESET_TOKEN
    - Non-existent token → throws INVALID_RESET_TOKEN
  - [x] 7.3 Integration tests for routes:
    - POST /forgot-password with valid email → 200 + generic message
    - POST /forgot-password with unknown email → 200 + same generic message
    - POST /forgot-password with invalid body → 400 validation error
    - POST /reset-password with valid token + password → 200
    - POST /reset-password with expired token → 400 INVALID_RESET_TOKEN
    - POST /reset-password with used token → 400 INVALID_RESET_TOKEN
    - POST /reset-password → verify old sessions are invalidated
    - POST /reset-password with weak password → 400 validation error
  - [x] 7.4 Unit tests for `sendPasswordResetEmail()`:
    - Mock Resend SDK, verify email sent with correct params
    - Resend not configured → log warning, no throw
  - [x] 7.5 Regression: existing auth flows (register, login, logout, OAuth) still pass

## Dev Notes

### Critical Architecture Patterns

- **Route handlers are thin**: validate → service → respond. All business logic lives in `authService.ts`. The new routes follow this exact pattern.
- **Error handling**: Services throw `AppError` instances with factory methods (`AppError.badRequest(code, message)`). Routes do NOT use try/catch — Express 5 auto-catches async rejections and forwards to the global `errorHandler` middleware.
- **Response format**: Success = `{ data: T }`, Error = `{ error: { code, message, details? } }`.
- **Middleware order** in `app.ts`: helmet → cors → json → urlencoded → rateLimiter → session → passport.initialize() → passport.session() → routes → 404 → errorHandler. The new routes are added to the existing `auth.ts` router — no changes to middleware order.
- **Email enumeration prevention**: The forgot-password endpoint MUST return the same 200 response regardless of whether the email exists. This matches the pattern established in Story 2.1 where login returns same 401 for both non-existent users and wrong passwords.

### Password Reset Flow

```
User submits email to POST /auth/forgot-password
  → authService.requestPasswordReset(email)
    → Find user by email (if not found → return silently)
    → Delete old tokens for user
    → Generate crypto token (64 hex chars)
    → Store PasswordResetToken (expires in 1 hour)
    → emailService.sendPasswordResetEmail(email, resetLink)
  → Return generic success message (always 200)

User clicks link → navigates to FRONTEND_URL/reset-password?token=xxx
  → Frontend extracts token, shows new password form

User submits new password to POST /auth/reset-password
  → authService.resetPassword(token, newPassword)
    → Look up token (validate: exists, not used, not expired)
    → Hash new password (bcryptjs, cost 12)
    → Update user.passwordHash
    → Mark token as used (usedAt = now)
    → Invalidate all user sessions in Redis
  → Return success message (200)
```

### Email Service — First Email Integration in Project

This is the first story that introduces Resend email sending. Key decisions:

- **Lazy initialization**: Resend client is only created if `RESEND_API_KEY` is set. If not configured, `sendPasswordResetEmail()` logs a warning and returns (no throw). This allows local dev without a Resend account.
- **`RESEND_FROM_EMAIL`**: Configurable sender address. Default could be `noreply@yourdomain.com`. For local dev without a verified domain, Resend provides a free `onboarding@resend.dev` sender.
- **HTML template**: Keep it simple and inline. No template engine needed. Use platform colors (teal #2B9E9E for CTA button). Include plain-text fallback.
- **This emailService.ts will be reused** by Stories 8.2 (GDPR emails) and 8.3 (full email integration). Design it as a clean, reusable service from the start.

### Session Invalidation Strategy

When a password is reset, ALL existing sessions for that user must be destroyed (AC #3). The challenge: Redis stores sessions by session ID (e.g., `sess:abc123`), not by user ID.

**Approach for this story**: Scan Redis keys matching the session prefix, deserialize each session, check if `passport.user` matches the target userId, and delete matching keys. This is O(n) over all sessions but perfectly acceptable for the 20-user scale (NFR4).

**Implementation detail**: Use the same Redis client already configured in `apps/api/src/config/redis.ts`. The session store uses the `node-redis` client (not ioredis). Use `SCAN` (not `KEYS`) to avoid blocking Redis on larger datasets.

```typescript
// Pattern for session invalidation
async function invalidateUserSessions(userId: string): Promise<void> {
  const prefix = 'sess:';
  let cursor = 0;
  do {
    const result = await redisClient.scan(cursor, { MATCH: `${prefix}*`, COUNT: 100 });
    cursor = result.cursor;
    for (const key of result.keys) {
      const sessionData = await redisClient.get(key);
      if (sessionData) {
        const session = JSON.parse(sessionData);
        if (session.passport?.user === userId) {
          await redisClient.del(key);
        }
      }
    }
  } while (cursor !== 0);
}
```

### Token Generation Security

- Use `crypto.randomBytes(32)` (Node.js built-in) for 256-bit entropy
- Store as 64-character hex string
- Token is looked up by exact match (indexed column)
- Single-use: `usedAt` timestamp prevents reuse
- Time-limited: 1-hour expiry (`expiresAt` column)
- Old tokens invalidated when new request is made (prevents token hoarding)

### Rate Limiting

The `POST /auth/forgot-password` endpoint needs stricter rate limiting than the global rate limiter to prevent abuse (email bombing). Options:
- Use `express-rate-limit` with a separate limiter for this endpoint (e.g., 5 requests per 15 minutes per IP)
- The existing `rateLimiter.ts` middleware uses Redis store — create a similar instance with stricter settings
- Apply as route-level middleware on the forgot-password route only

### Resend SDK (v4+)

```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const { data, error } = await resend.emails.send({
  from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
  to: userEmail,
  subject: 'Reset Your Password',
  html: '...', // HTML template
  text: '...'  // Plain text fallback
});
```

### Previous Story Learnings Applied

From Stories 2.1, 2.2, 2.3:
- **bcryptjs** (not native bcrypt) — already established, use same import and cost factor 12
- **Express 5 async handling** — no try/catch in routes, Express 5 auto-catches async rejections
- **Testing with supertest.agent(app)** — use same pattern for cookie-based session tests
- **Prisma error handling** — catch `P2002` for unique constraint violations if needed
- **AppError factory methods** — use `AppError.badRequest()` for invalid tokens
- **sanitizeUser()** — no changes needed, password reset tokens are in separate table

### Git Intelligence

Latest commit (801982b): Implemented OAuth 2.0 auth for Google + Facebook. Files modified include authService.ts, auth.ts routes, passport.ts, schema.prisma. The password reset story adds to these same files — be careful not to break OAuth flows.

### Project Structure Notes

- **Modified files**: `authService.ts`, `auth.ts` (routes), `schema.prisma`, `packages/shared/src/schemas/auth.ts`, `packages/shared/src/index.ts`, `.env.example`
- **New files**: `apps/api/src/services/emailService.ts`, `apps/api/src/services/emailService.test.ts`
- **Migration**: New Prisma migration for `PasswordResetToken` model
- **No new route files** — routes added to existing `apps/api/src/routes/auth.ts`
- **Co-located tests** as per project convention
- Alignment with existing structure: all new code follows established patterns

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.4]
- [Source: _bmad-output/planning-artifacts/architecture.md — Authentication & Security section]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md — Implementation Patterns (error handling, response format)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Backend Project Structure]
- [Source: _bmad-output/implementation-artifacts/2-1-email-password-registration-and-login.md — Dev Notes (bcryptjs, Express 5, testing patterns)]
- [Source: _bmad-output/implementation-artifacts/2-2-logout-and-session-management.md — Dev Notes (session invalidation)]
- [Source: _bmad-output/implementation-artifacts/2-3-oauth-2-0-authentication.md — Dev Notes (account linking, service patterns)]
- [Source: Resend Node.js SDK — v4+, resend.emails.send() API]
- [Source: Node.js crypto — crypto.randomBytes() for secure token generation]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Fixed test mock issues: Resend class mock needed proper constructor via `vi.hoisted()`, session Redis mock needed hoisting for vi.mock factory access, rate-limit-redis mock needed proper SCRIPT/EVALSHA return values
- Fixed app.test.ts: needed session.ts and emailService.ts mocks since authService.ts now imports session.ts

### Completion Notes List

- Installed `resend` v6.9.3 SDK in apps/api
- Added `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `.env.example` with documentation
- Created `PasswordResetToken` Prisma model with uuid id, unique token, userId FK, expiresAt, usedAt, createdAt, and @@index([token])
- Added `passwordResetTokens` relation to User model
- Created migration `20260309100442_add_password_reset_token`
- Created `emailService.ts` with lazy Resend init, HTML+text email templates using platform teal (#2B9E9E), graceful degradation when unconfigured
- Implemented `requestPasswordReset()` — email enumeration prevention, old token cleanup, crypto.randomBytes token generation, 1-hour expiry
- Implemented `resetPassword()` — token validation (exists, not used, not expired), bcrypt hash, Prisma transaction for password+token update, session invalidation
- Implemented `invalidateUserSessions()` — SCAN-based Redis session lookup, passport.user matching, key deletion
- Added `passwordResetRequestSchema` and `passwordResetSchema` to shared package with same password rules as register
- Added `POST /api/v1/auth/forgot-password` with route-level rate limiter (5 req/15min/IP via Redis) and `POST /api/v1/auth/reset-password`, both public routes
- Wrote 11 new unit tests (authService password reset functions + email service) and 8 new integration tests (route endpoints)
- All 116 tests pass (12 test files), 0 regressions. All pre-existing lint errors are unchanged (7 errors in unmodified files)

### File List

- `apps/api/package.json` — modified (added resend dependency)
- `apps/api/prisma/schema.prisma` — modified (added PasswordResetToken model, User relation)
- `apps/api/prisma/migrations/20260309100442_add_password_reset_token/migration.sql` — new
- `apps/api/src/services/emailService.ts` — new (Resend email service)
- `apps/api/src/services/emailService.test.ts` — new (email service unit tests)
- `apps/api/src/services/authService.ts` — modified (added requestPasswordReset, resetPassword, invalidateUserSessions)
- `apps/api/src/services/authService.test.ts` — modified (added password reset unit tests, session/email mocks)
- `apps/api/src/routes/auth.ts` — modified (added forgot-password and reset-password routes with rate limiter)
- `apps/api/src/routes/auth.test.ts` — modified (added password reset route integration tests)
- `apps/api/src/app.test.ts` — modified (added session.ts and emailService.ts mocks for authService import)
- `packages/shared/src/schemas/auth.ts` — modified (added passwordResetRequestSchema, passwordResetSchema)
- `packages/shared/src/index.ts` — modified (exported new schemas)
- `.env.example` — modified (added RESEND_API_KEY, RESEND_FROM_EMAIL)
- `pnpm-lock.yaml` — modified (resend dependency)

## Change Log

- 2026-03-09: Implemented Story 2.4 — Password Reset via email with Resend SDK, PasswordResetToken model, email enumeration prevention, session invalidation, rate limiting, and comprehensive test coverage (116 tests pass)
- 2026-03-09: Code review fixes — HTML-escaped email template links (XSS prevention), lazy FROM_EMAIL evaluation, OAuth-only user guard in requestPasswordReset, rate limiter on reset-password endpoint, removed redundant @@index([token]), removed redundant try/catch from register route (Express 5), added multi-page SCAN pagination test and OAuth-only guard test (118 tests pass)
