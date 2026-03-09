# Story 2.3: OAuth 2.0 Authentication

Status: in-progress

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to sign up and log in using Google or Facebook,
So that I can access the platform without creating a new password.

> **Scope Change from Epics:** Instagram OAuth has been removed from this story. The Instagram Basic Display API was shut down on December 4, 2024, and the replacement Instagram Login API only supports Business/Creator accounts — not personal accounts. Since the target audience is non-technical adults with personal accounts, Instagram OAuth is not viable. This story implements Google and Facebook OAuth only.

## Acceptance Criteria

1. **Given** a visitor initiating OAuth login (Google or Facebook),
   **When** they complete the provider's authorization flow,
   **Then** a user account is created (if new) or matched (if existing email),
   **And** a session is created with OAuth tokens stored server-side (never in localStorage),
   **And** a session cookie is returned.

2. **Given** an OAuth provider is temporarily unavailable,
   **When** the user attempts OAuth login,
   **Then** a graceful error message is returned with code `OAUTH_PROVIDER_UNAVAILABLE`,
   **And** the user is directed to try again or use email/password.

3. **Given** a user who registered with email/password,
   **When** they log in via OAuth with the same email,
   **Then** the accounts are linked and both login methods work.

4. **Given** a user who registered via OAuth (no password set),
   **When** they attempt email/password login,
   **Then** a 401 is returned with code `INVALID_CREDENTIALS` (no email enumeration leak).

5. **Given** Passport.js strategies,
   **When** configured for each provider,
   **Then** `passport-google-oauth20` and `passport-facebook` strategies are registered,
   **And** OAuth callback URLs are documented in `.env.example`.

6. **Given** an OAuth user whose provider does not return an email (e.g., Facebook phone-only registration),
   **When** the OAuth callback is processed,
   **Then** the user account is created with a null email,
   **And** the user is prompted to add an email on first login (future story concern — for now, create account without email).

7. **Given** an OAuth user who has not confirmed age,
   **When** they first authenticate via OAuth,
   **Then** the account is created with `ageConfirmed: false`,
   **And** the response indicates onboarding is needed (age gate handled by frontend/future story 2.8).

## Tasks / Subtasks

- [x] Task 1: Install OAuth dependencies (AC: #5)
  - [x] 1.1 Install `passport-google-oauth20` and `@types/passport-google-oauth20`
  - [x] 1.2 Install `passport-facebook` and `@types/passport-facebook`
  - [x] 1.3 Verify no version conflicts with existing passport ^0.7.0

- [x] Task 2: Update environment configuration (AC: #5)
  - [x] 2.1 Add OAuth env vars to `.env.example`: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`, `OAUTH_CALLBACK_BASE_URL`
  - [x] 2.2 Update `apps/api/src/config/env.ts` Zod schema to validate new env vars (make OAuth vars optional — app should work without them)
  - [x] 2.3 Document callback URLs: `/api/v1/auth/google/callback`, `/api/v1/auth/facebook/callback`

- [x] Task 3: Update Prisma schema for account linking (AC: #1, #3)
  - [x] 3.1 Create `OAuthAccount` model: `id`, `provider` (AuthProvider), `providerAccountId` (String), `userId` (FK → User), `accessToken` (String?), `refreshToken` (String?), `createdAt`, `updatedAt`
  - [x] 3.2 Add unique constraint on `@@unique([provider, providerAccountId])` to prevent duplicate OAuth links
  - [x] 3.3 Add relation `User.oauthAccounts OAuthAccount[]`
  - [x] 3.4 Keep `User.authProvider` field for backward compatibility (set to provider of first registration method)
  - [x] 3.5 Run `npx prisma migrate dev` to create migration
  - [x] 3.6 Update seed.ts if needed

- [x] Task 4: Implement OAuth service layer (AC: #1, #3, #6)
  - [x] 4.1 Create `findOrCreateOAuthUser(provider, profile, tokens)` in `authService.ts`
    - Extract email from profile (handle missing email case)
    - If user with that email exists → link OAuth account (create OAuthAccount record)
    - If no user exists → create new User + OAuthAccount record
    - Store access/refresh tokens in OAuthAccount (server-side only)
    - Return the user object
  - [x] 4.2 Update `sanitizeUser()` to exclude OAuth tokens from responses

- [x] Task 5: Configure Passport OAuth strategies (AC: #5)
  - [x] 5.1 Add Google strategy to `apps/api/src/config/passport.ts`:
    - `passport-google-oauth20` with scope `['profile', 'email']`
    - Callback URL: `${OAUTH_CALLBACK_BASE_URL}/api/v1/auth/google/callback`
    - Verify callback calls `findOrCreateOAuthUser()`
  - [x] 5.2 Add Facebook strategy to `apps/api/src/config/passport.ts`:
    - `passport-facebook` with scope `['public_profile', 'email']`
    - Set `profileFields: ['id', 'displayName', 'photos', 'email']`
    - Set `enableProof: true` (security: HMAC proof prevents token hijacking)
    - Callback URL: `${OAUTH_CALLBACK_BASE_URL}/api/v1/auth/facebook/callback`
    - Verify callback calls `findOrCreateOAuthUser()`
  - [x] 5.3 Only register strategies if corresponding env vars are present (graceful degradation)
  - [x] 5.4 Update Passport serialization/deserialization if needed (should already work — stores user.id)

- [x] Task 6: Implement OAuth routes (AC: #1, #2)
  - [x] 6.1 Add `GET /api/v1/auth/google` — initiates Google OAuth flow (`passport.authenticate('google', { scope })`)
  - [x] 6.2 Add `GET /api/v1/auth/google/callback` — handles Google callback, creates session via `req.login()`, redirects to frontend
  - [x] 6.3 Add `GET /api/v1/auth/facebook` — initiates Facebook OAuth flow
  - [x] 6.4 Add `GET /api/v1/auth/facebook/callback` — handles Facebook callback, creates session, redirects to frontend
  - [x] 6.5 Implement error handling in callbacks: catch provider errors, return `OAUTH_PROVIDER_UNAVAILABLE`
  - [x] 6.6 On success callback, redirect to frontend URL (e.g., `${FRONTEND_URL}/auth/callback?success=true`); on failure redirect to `${FRONTEND_URL}/auth/callback?error=oauth_failed`

- [x] Task 7: Add shared validation schemas (AC: #5)
  - [x] 7.1 Add `oauthProviderSchema` to `packages/shared/src/schemas/auth.ts` (enum: 'google', 'facebook')
  - [x] 7.2 Export from `packages/shared/src/index.ts`

- [x] Task 8: Write tests (AC: #1, #2, #3, #4)
  - [x] 8.1 Unit tests for `findOrCreateOAuthUser()`:
    - New user creation from Google profile
    - New user creation from Facebook profile
    - Account linking (existing email user + new OAuth)
    - Missing email handling
    - Duplicate OAuth account (same provider + providerAccountId)
  - [x] 8.2 Integration tests for OAuth routes:
    - Mock passport.authenticate for Google/Facebook strategies
    - Test successful OAuth callback creates session
    - Test OAuth callback with existing email links accounts
    - Test OAuth error returns OAUTH_PROVIDER_UNAVAILABLE
    - Test that OAuth tokens are not exposed in `/auth/me` response
  - [x] 8.3 Test that existing auth flows (register, login, logout) still work (regression)

### Review Follow-ups (AI)

- [ ] [AI-Review][HIGH] Remove `INSTAGRAM` from `AuthProvider` enum — dead code contradicts documented scope change. Requires new Prisma migration. [apps/api/prisma/schema.prisma:15]
- [ ] [AI-Review][HIGH] Encrypt OAuth access/refresh tokens at rest in database (AES-256 with server-side key). Currently stored as plaintext. [apps/api/prisma/schema.prisma:43-44, apps/api/src/services/authService.ts:78-79]

## Dev Notes

### Critical Architecture Patterns

- **Route handlers are thin**: validate → service → respond. All business logic lives in `authService.ts`.
- **Error handling**: Services throw `AppError` instances. Routes do NOT use try/catch — Express 5 auto-catches async rejections and forwards to the global `errorHandler` middleware.
- **Response format**: Success = `{ data: T }`, Error = `{ error: { code, message, details? } }`.
- **Middleware order** in `app.ts` is critical: helmet → cors → json → urlencoded → rateLimiter → session → passport.initialize() → passport.session() → routes → 404 → errorHandler.

### OAuth-Specific Implementation Guidance

- **OAuth is a redirect-based flow**, not JSON API. The initiation route (`GET /auth/google`) redirects the browser to the provider. The callback route (`GET /auth/google/callback`) receives the redirect back. After creating the session, redirect the user to the frontend app — do NOT return JSON from the callback.
- **`passport-facebook` requires `enableProof: true`** — this adds an HMAC-SHA256 `appsecret_proof` parameter to Graph API requests, preventing token theft in MITM scenarios.
- **Facebook may not return email** if the user registered with phone number. The `profile.emails` array may be `undefined`. Handle this gracefully.
- **`passport-google-oauth20` v2.0.0 is stable** despite being old. Google's OAuth2 flow hasn't changed. No known CVEs.
- **passport-facebook v3.0.0** — use explicit `profileFields` configuration. Facebook Graph API v2.4+ does not return fields unless explicitly requested.
- **Account linking strategy**: Match by email. If a user registered with email/password and later clicks "Login with Google" using the same email, create an OAuthAccount linked to the existing User. Both auth methods should work afterward.
- **`passwordHash` is already nullable** in the Prisma schema — OAuth-only users will have `null` passwordHash. The local strategy's verify callback already handles this (user with no password → login fails with INVALID_CREDENTIALS).

### Previous Story Learnings (from 2.1 and 2.2)

- **Express 5 + Passport**: Body parser MUST come before Passport. `req.body` defaults to `undefined` in Express 5.
- **bcryptjs, not native bcrypt**: Already decided — pure JS for Alpine Docker compatibility.
- **Session management**: Three-step logout (req.logout → req.session.destroy → res.clearCookie). Rolling sessions with `rolling: true` in session config.
- **Passport 0.7+**: `req.logout()` is async and requires callback.
- **Testing pattern**: Use `supertest.agent(app)` to maintain cookies across requests.
- **Prisma error handling**: Catch `P2002` for unique constraint violations.
- **Email enumeration prevention**: Login returns same 401 `INVALID_CREDENTIALS` for both non-existent users and wrong passwords.

### Database Schema Change

New model needed — do NOT add OAuth fields directly to User table. Use a separate `OAuthAccount` table for clean 1-to-many relationship (one user can have multiple OAuth providers):

```prisma
model OAuthAccount {
  id                String       @id @default(uuid())
  provider          AuthProvider
  providerAccountId String
  accessToken       String?
  refreshToken      String?
  userId            String
  user              User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt

  @@unique([provider, providerAccountId])
  @@index([userId])
}
```

Update User model:
```prisma
model User {
  // ... existing fields ...
  oauthAccounts OAuthAccount[]
}
```

### Instagram OAuth — Removed from Scope

Instagram Basic Display API was shut down December 4, 2024. The replacement Instagram Login API only supports Business/Creator accounts. Since the target audience is non-technical adults with personal Instagram accounts, implementing Instagram OAuth is not possible. This has been descoped. If Instagram support is needed in the future, it would require:
- Meta app approval for Instagram Login
- Users to have Business/Creator accounts
- Custom passport-oauth2 strategy (no maintained passport-instagram library exists)

### Project Structure Notes

- All new code follows established patterns in `apps/api/src/`
- OAuth strategies added to existing `config/passport.ts` (extend, don't create new files)
- OAuth service methods added to existing `services/authService.ts`
- OAuth routes added to existing `routes/auth.ts`
- New `OAuthAccount` model in existing `prisma/schema.prisma`
- Shared schemas updated in existing `packages/shared/src/schemas/auth.ts`
- No new files needed except tests (co-located with source)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.3]
- [Source: _bmad-output/planning-artifacts/architecture.md — Authentication & Security section]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Communication Patterns]
- [Source: _bmad-output/planning-artifacts/architecture.md — Backend Project Structure]
- [Source: _bmad-output/implementation-artifacts/2-1-email-password-registration-and-login.md — Dev Notes]
- [Source: _bmad-output/implementation-artifacts/2-2-logout-and-session-management.md — Dev Notes]
- [Source: passport-google-oauth20 npm — v2.0.0, stable]
- [Source: passport-facebook npm — v3.0.0, use enableProof:true]
- [Source: Meta Developer Blog — Instagram Basic Display API EOL, Sept 2024]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- No debug issues encountered during implementation.

### Completion Notes List

- **Task 1:** Installed `passport-google-oauth20@2.0.0`, `passport-facebook@3.0.0` and their type definitions. No version conflicts with passport@0.7.0.
- **Task 2:** Added OAuth env vars to `.env.example` with callback URL documentation. No `env.ts` Zod schema file exists in the project — env vars are accessed via `process.env` directly with conditional checks in passport config for graceful degradation.
- **Task 3:** Created `OAuthAccount` model with `@@unique([provider, providerAccountId])` and `@@index([userId])`. Made `User.email` nullable to support Facebook phone-only users (AC #6). Migration `20260309084316_add_oauth_account_model` created and applied. Seed.ts unchanged (still works).
- **Task 4:** Implemented `findOrCreateOAuthUser()` in authService.ts with three code paths: (1) existing OAuth account → update tokens, (2) existing email user → link OAuth account, (3) new user → create with OAuthAccount. Updated `sanitizeUser()` to accept nullable email. OAuth tokens never exposed in responses.
- **Task 5:** Added Google and Facebook strategies to passport.ts. Strategies only registered when env vars are present. `enableProof: true` set for Facebook. Serialization unchanged (uses user.id).
- **Task 6:** Added 4 OAuth routes (initiate + callback for each provider). Routes check strategy availability via `isStrategyConfigured()` helper — returns `OAUTH_PROVIDER_UNAVAILABLE` (503) when not configured. Callbacks redirect to frontend with success/error query params.
- **Task 7:** Added `oauthProviderSchema` (enum: 'google', 'facebook') to shared schemas and exported from index.
- **Task 8:** Added 12 new tests (5 unit + 7 integration). All 90 tests pass (78 pre-existing + 12 new). No regressions. Unit tests cover all `findOrCreateOAuthUser` scenarios. Integration tests verify OAuth route behavior, token non-exposure, and regression for existing auth flows.

### Change Log

- 2026-03-09: Implemented OAuth 2.0 authentication (Google + Facebook) — all 8 tasks completed
- 2026-03-09: Code review fixes — added null email guard in LocalStrategy (H3), replaced internal `_strategy()` API with strategy registry Set (M2), added CSRF `state` parameter to OAuth flows (M4), added 3 happy-path OAuth integration tests (M3)

### File List

**Modified:**
- `.env.example` — Added OAuth env vars and callback URL documentation
- `apps/api/package.json` — Added passport-google-oauth20, passport-facebook dependencies
- `apps/api/prisma/schema.prisma` — Added OAuthAccount model, made User.email nullable, added oauthAccounts relation
- `apps/api/src/config/passport.ts` — Added Google and Facebook OAuth strategies, updated Express.User type for nullable email
- `apps/api/src/services/authService.ts` — Added findOrCreateOAuthUser(), OAuthProfile/OAuthTokens types, updated sanitizeUser() for nullable email
- `apps/api/src/services/authService.test.ts` — Added 5 unit tests for findOrCreateOAuthUser()
- `apps/api/src/routes/auth.ts` — Added 4 OAuth routes (google, google/callback, facebook, facebook/callback) with isStrategyConfigured() helper
- `apps/api/src/routes/auth.test.ts` — Added 7 integration tests for OAuth routes and regression
- `packages/shared/src/schemas/auth.ts` — Added oauthProviderSchema, updated userProfileSchema for nullable email
- `packages/shared/src/index.ts` — Exported oauthProviderSchema and OAuthProvider type
- `pnpm-lock.yaml` — Updated with new dependencies

**Created:**
- `apps/api/prisma/migrations/20260309084316_add_oauth_account_model/migration.sql` — Database migration for OAuthAccount table
