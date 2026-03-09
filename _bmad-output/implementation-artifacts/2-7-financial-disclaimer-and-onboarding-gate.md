# Story 2.7: Financial Disclaimer & Onboarding Gate

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to see a financial disclaimer during onboarding,
So that I understand the platform provides education, not investment advice.

## Acceptance Criteria

1. **Given** a newly registered user (disclaimerAcceptedAt is null),
   **When** they call `GET /api/v1/disclaimers/onboarding`,
   **Then** the general financial disclaimer text is returned via API (stating education ≠ investment advice),
   **And** the endpoint is accessible to authenticated users only.

2. **Given** a newly registered user,
   **When** they call `POST /api/v1/disclaimers/accept`,
   **Then** the user's `disclaimerAcceptedAt` field is set to the current timestamp in the database,
   **And** the updated user profile is returned in the response.

3. **Given** a user who has already accepted the disclaimer (disclaimerAcceptedAt is not null),
   **When** they call `POST /api/v1/disclaimers/accept` again,
   **Then** a 200 response is returned (idempotent — no error, no update),
   **And** the existing `disclaimerAcceptedAt` value is preserved.

4. **Given** the disclaimer content endpoint,
   **When** called with a module ID for investment-related topics via `GET /api/v1/disclaimers/module/:moduleId`,
   **Then** the module-specific disclaimer is returned (FR53),
   **And** only modules flagged as investment-related return a disclaimer,
   **And** non-investment modules return 404 with code `NO_DISCLAIMER`.

5. **Given** the general disclaimer endpoint `GET /api/v1/disclaimers`,
   **When** called without authentication,
   **Then** the general disclaimer text is still accessible (public route).

6. **Given** an authenticated user,
   **When** they call `GET /api/v1/users/me`,
   **Then** the response includes `disclaimerAcceptedAt` field (ISO 8601 string or null),
   **And** the frontend can use this to determine whether to show the onboarding disclaimer gate.

7. **Given** all disclaimer endpoints,
   **When** input is submitted,
   **Then** Zod validates request params and bodies,
   **And** invalid input returns 400 with field-level error details.

## Tasks / Subtasks

- [x] Task 1: Create disclaimer content module (AC: #1, #4, #5)
  - [x] 1.1 Create `apps/api/src/content/disclaimers.ts` with:
    - `getGeneralDisclaimer(): string` — returns the general financial disclaimer text
    - `getModuleDisclaimer(moduleId: string): string | null` — returns module-specific disclaimer for investment-related modules, null for non-investment modules
    - `INVESTMENT_MODULE_IDS: string[]` — list of module/chapter IDs that require a financial disclaimer (2.3, 6.1, 6.2 — chapters covering crypto value, DeFi, real-world applications)
  - [x] 1.2 Disclaimer text should be a constant string (not i18n'd yet — English only for now, i18n comes in Epic 8)

- [x] Task 2: Create disclaimerService.ts (AC: #1, #2, #3, #4, #5)
  - [x] 2.1 Create `apps/api/src/services/disclaimerService.ts` with:
    - `getOnboardingDisclaimer()`: returns `{ text: string, type: 'onboarding' }`
    - `getGeneralDisclaimer()`: returns `{ text: string, type: 'general' }`
    - `getModuleDisclaimer(moduleId: string)`: returns `{ text: string, type: 'module', moduleId: string }` or throws AppError(404, 'NO_DISCLAIMER')
    - `acceptDisclaimer(userId: string)`: sets disclaimerAcceptedAt if null, returns sanitized user. If already accepted, returns user without update (idempotent).
  - [x] 2.2 `acceptDisclaimer` must check if user exists (throw 404 if not) and handle idempotency

- [x] Task 3: Add shared validation schemas (AC: #4, #7)
  - [x] 3.1 Create `moduleIdParamSchema` in `packages/shared/src/schemas/disclaimer.ts`:
    - `moduleId`: `z.string().min(1).regex(/^\d+\.\d+$/, 'Module ID must be in format X.Y')`
  - [x] 3.2 Export from `packages/shared/src/index.ts`

- [x] Task 4: Create disclaimers.ts routes (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 4.1 Create `apps/api/src/routes/disclaimers.ts` with:
    - `GET /api/v1/disclaimers` — public, returns general disclaimer
    - `GET /api/v1/disclaimers/onboarding` — authenticated, returns onboarding disclaimer
    - `GET /api/v1/disclaimers/module/:moduleId` — authenticated, returns module-specific disclaimer (validates moduleId with Zod)
    - `POST /api/v1/disclaimers/accept` — authenticated, records disclaimer acceptance
  - [x] 4.2 Register disclaimers router in `app.ts`

- [x] Task 5: Update sanitizeUser to include disclaimerAcceptedAt (AC: #6)
  - [x] 5.1 Add `disclaimerAcceptedAt` to the `sanitizeUser()` function in `authService.ts`
  - [x] 5.2 Update the `sanitizeUser` type signature to accept `disclaimerAcceptedAt: Date | null`
  - [x] 5.3 Return `disclaimerAcceptedAt` as ISO 8601 string or null in sanitized output
  - [x] 5.4 Update `UserProfile` schema in `packages/shared/src/schemas/auth.ts` to include `disclaimerAcceptedAt`

- [x] Task 6: Write tests (AC: #1, #2, #3, #4, #5, #6, #7)
  - [x] 6.1 Unit tests for `disclaimerService.ts`:
    - `getOnboardingDisclaimer()` — returns disclaimer text with type 'onboarding'
    - `getGeneralDisclaimer()` — returns disclaimer text with type 'general'
    - `getModuleDisclaimer()` — returns disclaimer for investment module (e.g., '2.3')
    - `getModuleDisclaimer()` — throws 404 for non-investment module (e.g., '1.1')
    - `acceptDisclaimer()` — sets disclaimerAcceptedAt for user with null value
    - `acceptDisclaimer()` — returns user unchanged when already accepted (idempotent)
    - `acceptDisclaimer()` — throws 404 for non-existent user
  - [x] 6.2 Integration tests for routes:
    - `GET /api/v1/disclaimers` (unauthenticated) → 200 with general disclaimer
    - `GET /api/v1/disclaimers/onboarding` (authenticated) → 200 with onboarding disclaimer
    - `GET /api/v1/disclaimers/onboarding` (unauthenticated) → 401
    - `GET /api/v1/disclaimers/module/2.3` (authenticated) → 200 with module disclaimer
    - `GET /api/v1/disclaimers/module/1.1` (authenticated) → 404 NO_DISCLAIMER
    - `GET /api/v1/disclaimers/module/invalid` (authenticated) → 400 INVALID_INPUT
    - `POST /api/v1/disclaimers/accept` (authenticated, first time) → 200 with updated user
    - `POST /api/v1/disclaimers/accept` (authenticated, already accepted) → 200 with same user
    - `POST /api/v1/disclaimers/accept` (unauthenticated) → 401
    - `GET /api/v1/users/me` (authenticated) → 200 with disclaimerAcceptedAt field present
  - [x] 6.3 Regression: existing auth flows (register, login, logout, OAuth, password reset, 2FA, profile) still pass
  - [x] 6.4 Verify sanitizeUser includes disclaimerAcceptedAt in all auth endpoints

## Dev Notes

### Critical Architecture Patterns

- **Route handlers are thin**: validate → service → respond. All business logic lives in `disclaimerService.ts`. Routes do NOT use try/catch — Express 5 auto-catches async rejections and forwards to the global `errorHandler` middleware.
- **Error handling**: Services throw `AppError` instances with `new AppError(statusCode, code, message)`. The global error handler in `middleware/errorHandler.ts` catches everything.
- **Response format**: Success = `{ data: T }`, Error = `{ error: { code, message, details? } }`.
- **Middleware order** in `app.ts`: helmet → cors → json → urlencoded → rateLimiter → session → passport.initialize() → passport.session() → routes → 404 → errorHandler. Add disclaimers router alongside existing auth and users routers.

### Disclaimer Content Strategy

The disclaimer content is **hardcoded in English** for this story. i18n support for disclaimers comes in Epic 8 (Story 8.1). The content module (`content/disclaimers.ts`) centralizes all disclaimer text for easy future extraction to translation files.

**General/Onboarding Disclaimer Text:**
```
This platform is designed for educational purposes only. The content provided does not constitute
financial, investment, or legal advice. Cryptocurrency and blockchain investments carry significant
risk, including the potential loss of all invested capital. Always consult a qualified financial
advisor before making any investment decisions. Past performance of any cryptocurrency or blockchain
project does not guarantee future results.
```

**Module-Specific Disclaimer Text (shorter, contextual):**
```
The concepts covered in this module are for educational understanding only and should not be
interpreted as investment recommendations or financial advice.
```

### Investment-Related Modules

Based on curriculum roadmap analysis, these chapters cover investment-adjacent content and require FR53 disclaimers:
- **2.3** — "Crypto & Value" (Why Does Crypto Have Value?, Reading a Price Chart, Why Prices Swing, The Investment Disclaimer)
- **6.1** — "DeFi: Banking Without Banks" (DeFi lending, DEXs, DeFi risks)
- **6.2** — "The Bigger Picture" (Real-world applications, institutional adoption)

Module ID format follows curriculum structure: `{categoryNum}.{chapterNum}` (e.g., "2.3", "6.1").

### Database Schema — Already Ready

The `User` table in `prisma/schema.prisma` already has:
```prisma
disclaimerAcceptedAt DateTime?
```

This was added as part of the initial schema design (Story 1.2). **No Prisma migration needed.** The field is already in the database, just not exposed through the API yet.

### Onboarding Gate Flow (Frontend Context)

This story delivers the **backend API only** (tagged [BE]). The frontend onboarding gate will be built in Story 2.8. However, the backend must support this frontend flow:

```
User registers → Login → GET /api/v1/users/me
  → Check disclaimerAcceptedAt
  → If null → Frontend shows disclaimer screen
    → User reads and accepts → POST /api/v1/disclaimers/accept
    → Backend sets disclaimerAcceptedAt → Return updated user
  → If not null → Frontend proceeds to home/micro-onboarding
```

The frontend will use `disclaimerAcceptedAt` from the user profile to determine routing. The backend does NOT enforce the gate — it provides the data and acceptance endpoint. The frontend enforces the gate.

### sanitizeUser Update

Currently `sanitizeUser()` in `authService.ts` does NOT include `disclaimerAcceptedAt`. It needs to be added so the frontend can check disclaimer status. This is a **non-breaking change** — it adds a new field to the existing response.

Current sanitizeUser output:
```typescript
{ id, email, displayName, bio, avatarUrl, locale, ageConfirmed, twoFactorEnabled, createdAt }
```

After this story:
```typescript
{ id, email, displayName, bio, avatarUrl, locale, ageConfirmed, twoFactorEnabled, disclaimerAcceptedAt, createdAt }
```

### Route Design

```
GET  /api/v1/disclaimers                    → Public. General disclaimer text.
GET  /api/v1/disclaimers/onboarding         → Auth required. Onboarding disclaimer.
GET  /api/v1/disclaimers/module/:moduleId   → Auth required. Module-specific disclaimer.
POST /api/v1/disclaimers/accept             → Auth required. Record acceptance.
```

The `GET /api/v1/disclaimers` route is public because FR50 states the disclaimer should be "accessible from every module" — guests viewing public pages may need it too.

### Testing Patterns from Previous Stories

From Stories 2.1–2.6:
- **Express 5 async handling** — no try/catch in routes, Express 5 auto-catches async rejections
- **Testing with `supertest.agent(app)`** — use same pattern for cookie-based session tests
- **AppError constructor** — `new AppError(statusCode, code, message)` for error codes
- **Middleware authentication** — `requireAuth` middleware blocks unauthenticated AND pending2FA sessions
- **sanitizeUser()** — import from `authService.ts`, do not duplicate
- **vi.hoisted()** for mocks in Vitest test files
- **Mock pattern** — mock `../config/session.js`, `./emailService.js`, and `../utils/totpCrypto.js` in test files that import from authService chain

### Existing disclaimerAcceptedAt Usage

Current codebase references:
- `prisma/schema.prisma:30` — field defined as `DateTime?`
- `authService.test.ts:148` — mock user has `disclaimerAcceptedAt: null`
- `auth.test.ts:146` — mock user has `disclaimerAcceptedAt: null`

The field exists in the schema and test mocks but is NOT included in `sanitizeUser` output yet. This story adds it.

### Project Structure Notes

- **New route file**: `routes/disclaimers.ts` — architecture maps FR50-FR51 to `pages.ts`, but using a dedicated `disclaimers.ts` for clarity and single-responsibility. This is a deliberate deviation from architecture.md § Project Structure; the architecture doc should be updated when `pages.ts` is created for privacy/ToS (Story 1.6+) to reference both files.
- **New service file**: `services/disclaimerService.ts` — disclaimer business logic
- **New content file**: `content/disclaimers.ts` — disclaimer text constants (not a service, just content)
- **New shared schema file**: `packages/shared/src/schemas/disclaimer.ts` — moduleId param validation
- Tests co-located with source files as per project convention
- Modified files: `app.ts` (register router), `authService.ts` (sanitizeUser update), `packages/shared/src/index.ts` (exports)

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 2, Story 2.7]
- [Source: _bmad-output/planning-artifacts/prd.md — FR50: Financial disclaimer during onboarding and accessible from every module]
- [Source: _bmad-output/planning-artifacts/prd.md — FR53: Per-module disclaimer for investment-related topics]
- [Source: _bmad-output/planning-artifacts/architecture.md — API Communication Patterns: REST /api/v1/, response format]
- [Source: _bmad-output/planning-artifacts/architecture.md — Implementation Patterns: thin routes, service layer, error handling]
- [Source: _bmad-output/planning-artifacts/architecture.md — Project Structure: routes/pages.ts for disclaimers]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Micro-onboarding flow, trust-first landing]
- [Source: _bmad-output/planning-artifacts/curriculum-roadmap.md — Chapters 2.3, 6.1, 6.2 as investment-related]
- [Source: _bmad-output/implementation-artifacts/2-6-user-profile-management.md — Previous story patterns, sanitizeUser]
- [Source: apps/api/prisma/schema.prisma:30 — disclaimerAcceptedAt field already exists]
- [Source: apps/api/src/services/authService.ts:334 — sanitizeUser function to update]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No issues encountered during implementation.

### Completion Notes List

- Implemented disclaimer content module with hardcoded English text (general + module-specific)
- Created disclaimerService with getOnboardingDisclaimer, getGeneralDisclaimerResponse, getModuleDisclaimerResponse, and acceptDisclaimer (idempotent)
- Added moduleIdParamSchema in shared package for Zod validation of X.Y format module IDs
- Created 4 disclaimer routes: GET / (public), GET /onboarding (auth), GET /module/:moduleId (auth+validated), POST /accept (auth)
- Updated sanitizeUser to include disclaimerAcceptedAt as ISO 8601 string or null
- Updated UserProfile schema in shared package to include disclaimerAcceptedAt
- Updated existing test mock users (userService.test.ts, users.test.ts, authService.test.ts) to include disclaimerAcceptedAt field
- All 199 tests pass across 17 test files with 0 regressions
- Pre-existing lint errors in database.ts, errorHandler, socket files remain unchanged (not related to this story)

### Change Log

- 2026-03-09: Implemented Story 2.7 — Financial Disclaimer & Onboarding Gate (all 6 tasks, 7 ACs satisfied)
- 2026-03-09: Code review — 4 MEDIUM, 3 LOW issues found. Fixed: M1 (AC#7 test assertion gap), M2 (removed unnecessary INVESTMENT_MODULE_IDS export), M3 (documented benign TOCTOU race in acceptDisclaimer), M4 (documented architecture deviation for disclaimers.ts vs pages.ts). All 199 tests pass.

### File List

New files:
- apps/api/src/content/disclaimers.ts
- apps/api/src/services/disclaimerService.ts
- apps/api/src/services/disclaimerService.test.ts
- apps/api/src/routes/disclaimers.ts
- apps/api/src/routes/disclaimers.test.ts
- packages/shared/src/schemas/disclaimer.ts

Modified files:
- apps/api/src/app.ts (registered disclaimers router)
- apps/api/src/services/authService.ts (added disclaimerAcceptedAt to sanitizeUser)
- apps/api/src/services/authService.test.ts (updated sanitizeUser test expected output, mockUser already had field)
- apps/api/src/services/userService.test.ts (added disclaimerAcceptedAt to mockUser and expected output)
- apps/api/src/routes/users.test.ts (added disclaimerAcceptedAt to mockUser)
- packages/shared/src/schemas/auth.ts (added disclaimerAcceptedAt to userProfileSchema)
- packages/shared/src/index.ts (exported moduleIdParamSchema)
