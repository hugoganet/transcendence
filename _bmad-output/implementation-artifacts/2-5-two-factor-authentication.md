# Story 2.5: Two-Factor Authentication

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to enable 2FA on my account,
So that my account has an extra layer of security.

## Acceptance Criteria

1. **Given** an authenticated user,
   **When** they request to enable 2FA,
   **Then** a TOTP secret is generated and encrypted at rest (AES-256-GCM, 256-bit minimum key),
   **And** a QR code data URI and manual base32 key are returned for authenticator app setup,
   **And** the user must verify with a valid TOTP code before 2FA is activated.

2. **Given** a user with 2FA enabled,
   **When** they log in with correct email/password,
   **Then** a partial session is created (flagged as `pending2FA`),
   **And** the response indicates `requires2FA: true` (without user profile data),
   **And** the user must submit a valid TOTP code to complete login and receive their profile.

3. **Given** a user with 2FA enabled submitting an invalid TOTP code,
   **When** the code is verified,
   **Then** a 401 error is returned with code `INVALID_2FA_CODE`.

4. **Given** a user with 2FA enabled,
   **When** they request to disable 2FA,
   **Then** they must verify with a valid TOTP code,
   **And** the 2FA secret is deleted from the database,
   **And** `twoFactorEnabled` is set to `false`,
   **And** all sessions for that user are invalidated.

5. **Given** all 2FA endpoints,
   **When** input is submitted,
   **Then** Zod validates request bodies on the backend,
   **And** invalid input returns 400 with field-level error details.

6. **Given** a user who initiated 2FA setup but hasn't verified yet,
   **When** they request setup again,
   **Then** the old unverified secret is overwritten with a new one (no stale secrets).

7. **Given** a user with a pending 2FA session (`pending2FA: true`),
   **When** they attempt to access any protected endpoint (not 2FA verify),
   **Then** a 401 error is returned (partial session does NOT grant access).

## Tasks / Subtasks

- [x] Task 1: Install TOTP and QR code dependencies (AC: #1)
  - [x] 1.1 Install `otpauth` in `apps/api` (v9.5.x — native TypeScript, zero deps, actively maintained)
  - [x] 1.2 Install `qrcode` and `@types/qrcode` in `apps/api` (v1.5.x — QR code data URI generation)
  - [x] 1.3 Add `TOTP_ENCRYPTION_KEY` to `.env.example` with documentation (generate with `openssl rand -hex 32`)

- [x] Task 2: Implement TOTP encryption utilities (AC: #1)
  - [x] 2.1 Create `apps/api/src/utils/totpCrypto.ts`:
    - `encryptTotpSecret(plaintext: string): string` — AES-256-GCM, random 12-byte IV, returns hex string `iv(12) + authTag(16) + ciphertext`
    - `decryptTotpSecret(stored: string): string` — reverse of encrypt
    - Use `TOTP_ENCRYPTION_KEY` env var (64 hex chars = 32 bytes = 256 bits)
    - Throw clear error if `TOTP_ENCRYPTION_KEY` is not set (2FA cannot function without it)
  - [x] 2.2 Write unit tests for encrypt/decrypt round-trip, invalid key handling, tampered ciphertext detection (GCM auth tag)

- [x] Task 3: Implement 2FA service functions in `authService.ts` (AC: #1, #2, #3, #4, #6)
  - [x] 3.1 Add `setup2FA(userId: string)`:
    - Generate TOTP secret using `new OTPAuth.Secret({ size: 20 })` (160 bits, RFC 4226 minimum)
    - Create TOTP object with `issuer: "Transcendence"`, `label: user.email`, `algorithm: "SHA1"`, `digits: 6`, `period: 30`
    - Generate QR code data URI using `QRCode.toDataURL(totp.toString())`
    - Encrypt the base32 secret with `encryptTotpSecret()`
    - Store encrypted secret in `user.twoFactorSecret` (overwrite if exists — AC #6)
    - Keep `twoFactorEnabled = false` until verification
    - Return `{ qrCodeDataUri, manualKey: secret.base32, otpauthUri: totp.toString() }`
  - [x] 3.2 Add `verifyAndEnable2FA(userId: string, code: string)`:
    - Load user, decrypt `twoFactorSecret`
    - Verify TOTP code using `totp.validate({ token: code, window: 1 })` (±30s tolerance)
    - If valid: set `twoFactorEnabled = true`, return success
    - If invalid: throw `AppError(401, 'INVALID_2FA_CODE', 'Invalid two-factor code')`
    - If no secret stored: throw `AppError(400, 'TWO_FACTOR_NOT_SETUP', '2FA setup has not been initiated')`
  - [x] 3.3 Add `verify2FALogin(userId: string, code: string)`:
    - Load user, verify 2FA is enabled and secret exists
    - Decrypt secret, verify TOTP code with `window: 1`
    - If valid: return user (caller will complete login)
    - If invalid: throw `AppError(401, 'INVALID_2FA_CODE', 'Invalid two-factor code')`
  - [x] 3.4 Add `disable2FA(userId: string, code: string)`:
    - Load user, verify 2FA is currently enabled
    - Decrypt secret, verify TOTP code with `window: 1`
    - If valid: set `twoFactorEnabled = false`, `twoFactorSecret = null`
    - Invalidate all sessions using existing `invalidateUserSessions(userId)`
    - If invalid: throw `AppError(401, 'INVALID_2FA_CODE', 'Invalid two-factor code')`

- [x] Task 4: Update session handling for 2FA partial session (AC: #2, #7)
  - [x] 4.1 Extend `express-session.SessionData` in `config/session.ts` to include `pending2FA?: boolean`
  - [x] 4.2 Update `Express.User` type in `config/passport.ts` to include `twoFactorEnabled: boolean` and `twoFactorSecret: string | null` (needed for login route 2FA check)
  - [x] 4.3 Update `requireAuth` middleware in `middleware/auth.ts`:
    - Check `req.isAuthenticated() && !req.session?.pending2FA` for full auth
    - If `pending2FA === true` → return 401 (partial session cannot access protected routes)
  - [x] 4.4 Update login route in `routes/auth.ts`:
    - After successful passport authentication, check `user.twoFactorEnabled`
    - If `twoFactorEnabled === true`: call `req.login()`, set `req.session.pending2FA = true`, return `{ data: { requires2FA: true } }`
    - If `twoFactorEnabled === false`: proceed with normal login flow (return user profile)

- [x] Task 5: Add shared validation schemas (AC: #5)
  - [x] 5.1 Add `totpCodeSchema` to `packages/shared/src/schemas/auth.ts`:
    - `code`: `z.string().length(6).regex(/^\d{6}$/, 'Code must be 6 digits')`
  - [x] 5.2 Export from `packages/shared/src/index.ts`

- [x] Task 6: Add 2FA routes (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 6.0 Add stricter rate limiter for 2FA verify endpoints (3 requests per 15 minutes per IP) — only 1,000,000 possible 6-digit codes, brute-force prevention is critical. Use same pattern as `forgotPasswordLimiter` in `auth.ts` with Redis store and `rl:2fa-verify:` prefix.
  - [x] 6.1 Add `POST /api/v1/auth/2fa/setup` (authenticated, requireAuth):
    - Call `authService.setup2FA(req.user.id)`
    - Return `{ data: { qrCodeDataUri, manualKey, otpauthUri } }` with 200
  - [x] 6.2 Add `POST /api/v1/auth/2fa/verify-setup` (authenticated, requireAuth):
    - Apply 2FA rate limiter
    - Validate body with `totpCodeSchema`
    - Call `authService.verifyAndEnable2FA(req.user.id, code)`
    - Return `{ data: { message: 'Two-factor authentication has been enabled.' } }` with 200
  - [x] 6.3 Add `POST /api/v1/auth/2fa/verify` (special auth — must have session with `pending2FA: true`):
    - Apply 2FA rate limiter
    - Validate body with `totpCodeSchema`
    - Verify `req.isAuthenticated() && req.session.pending2FA === true` (else 401)
    - Call `authService.verify2FALogin(req.user.id, code)`
    - Clear `req.session.pending2FA`, return `{ data: sanitizeUser(req.user) }` with 200
  - [x] 6.4 Add `POST /api/v1/auth/2fa/disable` (authenticated, requireAuth):
    - Apply 2FA rate limiter
    - Validate body with `totpCodeSchema`
    - Call `authService.disable2FA(req.user.id, code)`
    - Return `{ data: { message: 'Two-factor authentication has been disabled.' } }` with 200

- [x] Task 7: Write tests (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 7.1 Unit tests for `totpCrypto.ts`:
    - Encrypt/decrypt round-trip produces original value
    - Different plaintexts produce different ciphertexts (unique IV)
    - Tampered ciphertext throws error (GCM integrity)
    - Missing `TOTP_ENCRYPTION_KEY` throws clear error
  - [x] 7.2 Unit tests for `setup2FA()`:
    - Returns QR code data URI, manual key, and otpauth URI
    - Stores encrypted secret in DB (not plaintext)
    - Overwrites existing unverified secret (AC #6)
    - Does not set `twoFactorEnabled = true` before verification
  - [x] 7.3 Unit tests for `verifyAndEnable2FA()`:
    - Valid TOTP code → enables 2FA (`twoFactorEnabled = true`)
    - Invalid TOTP code → throws `INVALID_2FA_CODE`
    - No secret stored → throws `TWO_FACTOR_NOT_SETUP`
  - [x] 7.4 Unit tests for `verify2FALogin()`:
    - Valid code → returns user
    - Invalid code → throws `INVALID_2FA_CODE`
  - [x] 7.5 Unit tests for `disable2FA()`:
    - Valid code → disables 2FA, nulls secret, invalidates sessions
    - Invalid code → throws `INVALID_2FA_CODE`
    - 2FA not enabled → throws error
  - [x] 7.6 Integration tests for routes:
    - POST /2fa/setup (authenticated) → 200 with QR data
    - POST /2fa/setup (unauthenticated) → 401
    - POST /2fa/verify-setup with valid code → 200
    - POST /2fa/verify-setup with invalid code → 401 INVALID_2FA_CODE
    - Login with 2FA enabled → 200 with `{ requires2FA: true }`
    - POST /2fa/verify with valid code → 200 with user profile
    - POST /2fa/verify with invalid code → 401 INVALID_2FA_CODE
    - Protected endpoint with pending2FA session → 401 (AC #7)
    - POST /2fa/disable with valid code → 200
    - POST /2fa/verify-setup with invalid body → 400 INVALID_INPUT
  - [x] 7.7 Regression: existing auth flows (register, login, logout, OAuth, password reset) still pass

## Dev Notes

### Critical Architecture Patterns

- **Route handlers are thin**: validate → service → respond. All business logic lives in `authService.ts`. The new routes follow this exact pattern.
- **Error handling**: Services throw `AppError` instances with `new AppError(statusCode, code, message)`. Routes do NOT use try/catch — Express 5 auto-catches async rejections and forwards to the global `errorHandler` middleware.
- **Response format**: Success = `{ data: T }`, Error = `{ error: { code, message, details? } }`.
- **Middleware order** in `app.ts`: helmet → cors → json → urlencoded → rateLimiter → session → passport.initialize() → passport.session() → routes → 404 → errorHandler. The new routes are added to the existing `auth.ts` router — no changes to middleware order.

### 2FA Flow — Detailed Implementation Guide

#### Enable 2FA Flow
```
User calls POST /api/v1/auth/2fa/setup (authenticated)
  → authService.setup2FA(userId)
    → Generate TOTP secret (otpauth library, 160-bit)
    → Encrypt secret with AES-256-GCM
    → Store encrypted secret in user.twoFactorSecret
    → Keep twoFactorEnabled = false (not yet verified)
    → Generate QR code data URI via qrcode library
    → Return { qrCodeDataUri, manualKey, otpauthUri }
  → Return 200 with setup data

User scans QR code with authenticator app (Google Authenticator, Authy, etc.)

User calls POST /api/v1/auth/2fa/verify-setup with { code: "123456" }
  → authService.verifyAndEnable2FA(userId, code)
    → Decrypt twoFactorSecret
    → Verify TOTP code with window: 1 (±30s tolerance)
    → If valid: set twoFactorEnabled = true
    → If invalid: throw INVALID_2FA_CODE
  → Return 200 success
```

#### Login with 2FA Flow
```
User calls POST /api/v1/auth/login with { email, password }
  → Passport local strategy verifies credentials
  → If valid AND user.twoFactorEnabled === true:
    → req.login(user) — creates session
    → req.session.pending2FA = true
    → Return 200 { data: { requires2FA: true } }
  → If valid AND user.twoFactorEnabled === false:
    → Normal login flow (return user profile)

User calls POST /api/v1/auth/2fa/verify with { code: "123456" }
  → Check: req.isAuthenticated() AND req.session.pending2FA === true
  → authService.verify2FALogin(userId, code)
    → Decrypt secret, verify TOTP code
    → If valid: return user
  → Set req.session.pending2FA = false (or delete the key)
  → Return 200 { data: sanitizeUser(user) }

Meanwhile: any other protected endpoint with pending2FA → 401
  → requireAuth middleware blocks: isAuthenticated() && !pending2FA
```

#### Disable 2FA Flow
```
User calls POST /api/v1/auth/2fa/disable with { code: "123456" } (authenticated)
  → authService.disable2FA(userId, code)
    → Decrypt secret, verify TOTP code
    → If valid: set twoFactorEnabled = false, twoFactorSecret = null
    → Call invalidateUserSessions(userId) — reuse from Story 2.4
  → Return 200 success
```

### TOTP Library — `otpauth` v9.5.x

Architecture says "speakeasy or otpauth" — **use `otpauth`**. speakeasy is officially ABANDONED (README says "NOT MAINTAINED"). otpauth is actively maintained, has native TypeScript types, zero dependencies, and 1M+ weekly downloads.

```typescript
import * as OTPAuth from "otpauth";

// Generate secret
const secret = new OTPAuth.Secret({ size: 20 }); // 160-bit (RFC 4226 minimum)

// Create TOTP object
const totp = new OTPAuth.TOTP({
  issuer: "Transcendence",
  label: userEmail,
  algorithm: "SHA1",  // SHA1 is universal across authenticator apps
  digits: 6,
  period: 30,
  secret: secret,
});

// Get otpauth:// URI for QR code
const uri = totp.toString();

// Verify a code (returns time-step delta or null)
const delta = totp.validate({ token: userCode, window: 1 });
const isValid = delta !== null;
```

### QR Code Generation — `qrcode` v1.5.x

```typescript
import QRCode from "qrcode";

// Generate data URI (base64 PNG) — send directly to frontend for <img src="...">
const qrDataUri = await QRCode.toDataURL(otpauthUri, {
  errorCorrectionLevel: "M",
  width: 256,
  margin: 2,
});
```

### TOTP Secret Encryption at Rest — AES-256-GCM

**The `twoFactorSecret` field in the User model MUST be encrypted.** Architecture requires "256-bit minimum" encryption at rest. Use AES-256-GCM (authenticated encryption with integrity).

```typescript
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
// TOTP_ENCRYPTION_KEY: 64 hex chars = 32 bytes = 256 bits
const KEY = Buffer.from(process.env.TOTP_ENCRYPTION_KEY!, "hex");

function encryptTotpSecret(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit IV (GCM standard)
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag(); // 16-byte integrity tag
  // Pack: iv(12) + authTag(16) + ciphertext → hex string
  return Buffer.concat([iv, authTag, encrypted]).toString("hex");
}

function decryptTotpSecret(stored: string): string {
  const data = Buffer.from(stored, "hex");
  const iv = data.subarray(0, 12);
  const authTag = data.subarray(12, 28);
  const ciphertext = data.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}
```

**Key management:**
- Generate with `openssl rand -hex 32`
- Store in `.env` only — NEVER commit to git
- Separate from `SESSION_SECRET`
- Add `TOTP_ENCRYPTION_KEY` to `.env.example` with empty value and documentation

### Session Data Extension for `pending2FA`

The `express-session.SessionData` declaration in `config/session.ts` already has a `userId` augmentation. Add `pending2FA`:

```typescript
declare module "express-session" {
  interface SessionData {
    userId: string;
    pending2FA?: boolean;
  }
}
```

### `requireAuth` Middleware Update

Current implementation (`middleware/auth.ts`):
```typescript
export function requireAuth(req, _res, next) {
  if (req.isAuthenticated()) return next();
  next(AppError.unauthorized("Authentication required"));
}
```

Update to block partial sessions:
```typescript
export function requireAuth(req, _res, next) {
  if (req.isAuthenticated() && !req.session?.pending2FA) return next();
  next(AppError.unauthorized("Authentication required"));
}
```

### Login Route Modification

The current login route in `routes/auth.ts` (lines 49-68) uses a custom `passport.authenticate` callback. After `req.login(user)` succeeds, add a check:

```typescript
req.login(user, (loginErr) => {
  if (loginErr) return next(loginErr);
  // Check if 2FA is required
  if ((user as any).twoFactorEnabled) {
    req.session.pending2FA = true;
    return res.json({ data: { requires2FA: true } });
  }
  res.json({ data: sanitizeUser(user) });
});
```

Note: The `Express.User` type declaration in `config/passport.ts` needs `twoFactorEnabled: boolean` added.

### OAuth + 2FA Scope

The ACs specify 2FA challenge "When they log in with correct email/password" — this is for the local login flow only. OAuth login (Google/Facebook callback) does NOT trigger a 2FA challenge in this story. If an OAuth user enables 2FA, it only applies to email/password login attempts. A future story (2.8 frontend) may extend this to OAuth flows if needed.

### `sanitizeUser` Update

The existing `sanitizeUser()` in `authService.ts` does NOT include `twoFactorEnabled` in its output. The frontend needs this field to know whether to show 2FA settings. Add `twoFactorEnabled: user.twoFactorEnabled` to the sanitized output. Do NOT expose `twoFactorSecret`.

### Database Schema — No Migration Needed

The User model already has the required fields from the initial schema design:
```prisma
twoFactorSecret    String?        // Will store AES-256-GCM encrypted base32 secret
twoFactorEnabled   Boolean      @default(false)
```

**No Prisma migration needed for this story.** The fields exist and are nullable/defaulted correctly.

### Previous Story Learnings Applied

From Stories 2.1, 2.2, 2.3, 2.4:
- **bcryptjs** (not native bcrypt) — already established, use same import
- **Express 5 async handling** — no try/catch in routes, Express 5 auto-catches async rejections
- **Testing with supertest.agent(app)** — use same pattern for cookie-based session tests
- **Prisma error handling** — catch `P2002` for unique constraint violations if needed
- **AppError constructor** — use `new AppError(statusCode, code, message)` for custom error codes (e.g., `INVALID_2FA_CODE`). The factory methods like `AppError.badRequest()` use fixed codes.
- **Session invalidation** — reuse `invalidateUserSessions(userId)` from Story 2.4 for disable-2FA flow
- **Rate limiting** — the `/2fa/verify` and `/2fa/verify-setup` endpoints should have stricter rate limiting to prevent TOTP brute-force (only 1,000,000 possible 6-digit codes)
- **Mocking pattern** — use `vi.hoisted()` for mocks referenced inside `vi.mock` factories (established in 2.4)
- **vi.resetModules()** — needed when testing module-level `process.env` reads (used in emailService tests)

### Open Review Follow-ups from Story 2.3

The following review items from Story 2.3 are still outstanding and may interact with this story:
- `[AI-Review][HIGH]` Remove `INSTAGRAM` from `AuthProvider` enum — dead code. Requires new Prisma migration.
- `[AI-Review][HIGH]` Encrypt OAuth access/refresh tokens at rest in database (AES-256). Currently plaintext.

The encryption utility (`totpCrypto.ts`) created in this story could potentially be reused for OAuth token encryption. Design it generically enough (`encryptSecret`/`decryptSecret` naming) if practical, but do not block on fixing 2.3 review items.

### Git Intelligence

Latest commits show the auth system has been building incrementally:
```
0122f2f feat(auth): add password reset via email with Resend SDK (Story 2.4)
801982b feat(auth): add email/password and OAuth 2.0 authentication (Epic 2)
```

Key files that will be modified (all exist and follow established patterns):
- `apps/api/src/services/authService.ts` — add 2FA service functions
- `apps/api/src/routes/auth.ts` — add 2FA routes
- `apps/api/src/middleware/auth.ts` — update requireAuth for pending2FA
- `apps/api/src/config/session.ts` — extend SessionData type
- `apps/api/src/config/passport.ts` — add twoFactorEnabled to Express.User
- `packages/shared/src/schemas/auth.ts` — add totpCodeSchema
- `packages/shared/src/index.ts` — export new schema
- `.env.example` — add TOTP_ENCRYPTION_KEY

Key new files:
- `apps/api/src/utils/totpCrypto.ts` — encryption/decryption for TOTP secrets
- `apps/api/src/utils/totpCrypto.test.ts` — encryption tests

### Project Structure Notes

- All new code follows established patterns in `apps/api/src/`
- 2FA service methods added to existing `services/authService.ts`
- 2FA routes added to existing `routes/auth.ts`
- Encryption utility is new file in `utils/` (alongside `AppError.ts`)
- Shared schemas updated in existing `packages/shared/src/schemas/auth.ts`
- Tests co-located with source files as per project convention

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.5]
- [Source: _bmad-output/planning-artifacts/architecture.md — Authentication & Security section]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md — Implementation Patterns (error handling, response format)]
- [Source: _bmad-output/planning-artifacts/architecture.md — Backend Project Structure]
- [Source: _bmad-output/implementation-artifacts/2-4-password-reset.md — Dev Notes (session invalidation, rate limiting, Express 5 patterns)]
- [Source: _bmad-output/implementation-artifacts/2-3-oauth-2-0-authentication.md — Dev Notes (passport config, account linking)]
- [Source: otpauth npm v9.5.0 — TOTP generation/verification, native TypeScript]
- [Source: qrcode npm v1.5.4 — QR code data URI generation]
- [Source: Node.js crypto — AES-256-GCM for secret encryption at rest]
- [Source: RFC 6238 — TOTP specification, window:1 tolerance recommendation]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered during implementation.

### Completion Notes List

- Implemented complete TOTP-based 2FA system with AES-256-GCM encryption at rest
- Used `otpauth` v9.5.x (actively maintained, native TypeScript) instead of abandoned `speakeasy`
- Added 4 service functions: setup2FA, verifyAndEnable2FA, verify2FALogin, disable2FA
- Added 4 API routes: /2fa/setup, /2fa/verify-setup, /2fa/verify, /2fa/disable
- Implemented partial session (`pending2FA`) to block protected routes during 2FA verification
- Added strict rate limiting (3 req/15 min) on all 2FA verify endpoints to prevent brute-force
- Updated `sanitizeUser()` to include `twoFactorEnabled` (but NOT `twoFactorSecret`)
- All 149 tests pass (13 test files), including 8 totpCrypto tests, 13 new service tests, 12 new route integration tests, plus all pre-existing regression tests
- No Prisma migration needed — twoFactorSecret and twoFactorEnabled fields already exist in schema

### Implementation Plan

- Task 1: Installed otpauth + qrcode dependencies, added TOTP_ENCRYPTION_KEY to .env.example
- Task 2: Created totpCrypto.ts utility with AES-256-GCM encrypt/decrypt, 8 unit tests
- Task 3: Added 4 2FA service functions to authService.ts following established patterns
- Task 4: Extended SessionData with pending2FA, updated Express.User type, updated requireAuth middleware, modified login route for 2FA check
- Task 5: Added totpCodeSchema to shared package with Zod validation (6-digit numeric)
- Task 6: Added 4 2FA routes with rate limiting, Zod validation, proper auth checks
- Task 7: Comprehensive unit + integration tests covering all ACs, all 149 tests pass

### Change Log

- 2026-03-09: Implemented Story 2.5 Two-Factor Authentication — all 7 tasks completed, all ACs satisfied
- 2026-03-09: Code review (AI) — 7 issues found (2H, 2M, 3L), 4 fixed automatically: added twoFactorEnabled to userProfileSchema (H1), added key length validation in totpCrypto (H2), extracted createTotpInstance helper to eliminate DRY violation (M1), moved auth check before rate limiter on /2fa/verify (M2). Added 2 new tests. 151 total tests pass.

### File List

New files:
- apps/api/src/utils/totpCrypto.ts
- apps/api/src/utils/totpCrypto.test.ts

Modified files:
- apps/api/package.json (added otpauth, qrcode, @types/qrcode)
- apps/api/src/services/authService.ts (added 2FA service functions, updated sanitizeUser)
- apps/api/src/services/authService.test.ts (added 2FA unit tests, updated sanitizeUser test)
- apps/api/src/routes/auth.ts (added 2FA routes, rate limiter, login 2FA check)
- apps/api/src/routes/auth.test.ts (added 2FA integration tests)
- apps/api/src/middleware/auth.ts (updated requireAuth for pending2FA)
- apps/api/src/config/session.ts (extended SessionData with pending2FA)
- apps/api/src/config/passport.ts (added twoFactorEnabled/twoFactorSecret to Express.User)
- packages/shared/src/schemas/auth.ts (added totpCodeSchema)
- packages/shared/src/index.ts (exported totpCodeSchema)
- .env.example (added TOTP_ENCRYPTION_KEY)
- pnpm-lock.yaml (updated dependencies)
