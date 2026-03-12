# Story 8.2: GDPR Data Export & Deletion API

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to export or delete my personal data,
so that I maintain control over my information.

## Acceptance Criteria

1. **AC #1 — Data export endpoint:**
   Given an authenticated user,
   When they call `POST /api/v1/gdpr/export`,
   Then a data export is generated containing all personal data (profile, progress, tokens, friends, notifications),
   And a confirmation email is sent via Resend with a secure, time-limited download link (FR45),
   And the API returns a success response immediately (export generation is synchronous for MVP scale).

2. **AC #2 — Data export download:**
   Given a user with a valid, unexpired export download token,
   When they call `GET /api/v1/gdpr/export/:token`,
   Then the JSON export file is returned as a download,
   And the token is consumed (single-use).

3. **AC #3 — Expired or invalid export token:**
   Given an expired or invalid export download token,
   When `GET /api/v1/gdpr/export/:token` is called,
   Then a 400 error is returned with code `INVALID_EXPORT_TOKEN`.

4. **AC #4 — Account deletion request:**
   Given an authenticated user,
   When they call `POST /api/v1/gdpr/delete`,
   Then a confirmation email is sent via Resend with a secure, time-limited confirmation link,
   And the account is NOT deleted yet (pending confirmation),
   And the API returns a success response.

5. **AC #5 — Account deletion confirmation:**
   Given a user with a valid, unexpired deletion confirmation token,
   When they call `POST /api/v1/gdpr/delete/confirm/:token`,
   Then all personal data is permanently deleted (user, progress, tokens, friends, notifications, certificate, exercise attempts, self-assessments, OAuth accounts, password reset tokens),
   And the user's sessions are invalidated in Redis,
   And the deletion token is consumed (single-use).

6. **AC #6 — Expired or invalid deletion token:**
   Given an expired or invalid deletion confirmation token,
   When `POST /api/v1/gdpr/delete/confirm/:token` is called,
   Then a 400 error is returned with code `INVALID_DELETION_TOKEN`.

7. **AC #7 — Compliance audit logging:**
   Given any GDPR endpoint call (export or delete),
   When the operation is processed,
   Then a `GdprAuditLog` record is created with: userId, action (EXPORT_REQUESTED, EXPORT_DOWNLOADED, DELETION_REQUESTED, DELETION_CONFIRMED), ipAddress, timestamp.

## Tasks / Subtasks

- [x] Task 1: Add Prisma schema changes (AC: #1, #2, #4, #5, #7)
  - [x] 1.1 Add `GdprExportToken` model: id, token (unique), userId, expiresAt, usedAt?, createdAt
  - [x] 1.2 Add `GdprDeletionToken` model: id, token (unique), userId, expiresAt, usedAt?, createdAt
  - [x] 1.3 Add `GdprAuditLog` model: id, userId, action (string), ipAddress, metadata (Json?), createdAt
  - [x] 1.4 Run `npx prisma migrate dev --name add-gdpr-models`

- [x] Task 2: Add shared Zod schemas and types (AC: #1, #2, #3, #4, #5, #6)
  - [x] 2.1 Create `packages/shared/src/schemas/gdpr.ts` with `gdprExportTokenParamSchema` and `gdprDeletionTokenParamSchema`
  - [x] 2.2 Create `packages/shared/src/types/gdpr.ts` with `GdprExportResponse`, `GdprDeletionResponse` types
  - [x] 2.3 Export from `packages/shared/src/index.ts`

- [x] Task 3: Implement gdprService (AC: #1, #2, #4, #5, #7)
  - [x] 3.1 Create `apps/api/src/services/gdprService.ts`
  - [x] 3.2 Implement `requestDataExport(userId, ipAddress)`: generate export JSON, create token, send email, log audit
  - [x] 3.3 Implement `downloadExport(token)`: validate token, return export data, mark used, log audit
  - [x] 3.4 Implement `requestAccountDeletion(userId, ipAddress)`: create deletion token, send confirmation email, log audit
  - [x] 3.5 Implement `confirmAccountDeletion(token, ipAddress)`: validate token, delete all user data via transaction, invalidate sessions, log audit
  - [x] 3.6 Implement `gatherUserData(userId)`: collect all user data for export (profile, progress, tokens, friends, notifications, achievements, certificate)

- [x] Task 4: Extend emailService (AC: #1, #4)
  - [x] 4.1 Add `sendGdprExportEmail(to, downloadLink)` in `emailService.ts`
  - [x] 4.2 Add `sendGdprDeletionConfirmEmail(to, confirmLink)` in `emailService.ts`
  - [x] 4.3 Build HTML + text templates matching existing anti-crypto-bro aesthetic

- [x] Task 5: Create GDPR routes (AC: #1, #2, #3, #4, #5, #6)
  - [x] 5.1 Create `apps/api/src/routes/gdpr.ts` with `gdprRouter`
  - [x] 5.2 `POST /export` — requireAuth, call `requestDataExport`
  - [x] 5.3 `GET /export/:token` — no auth required (token-based), call `downloadExport`
  - [x] 5.4 `POST /delete` — requireAuth, call `requestAccountDeletion`
  - [x] 5.5 `POST /delete/confirm/:token` — no auth required (token-based), call `confirmAccountDeletion`
  - [x] 5.6 Register `gdprRouter` in `app.ts` at `/api/v1/gdpr`

- [x] Task 6: Unit tests (AC: #1–#7)
  - [x] 6.1 Create `apps/api/src/services/gdprService.test.ts`
  - [x] 6.2 Test `requestDataExport`: generates token, sends email, creates audit log
  - [x] 6.3 Test `downloadExport`: valid token returns data, expired token throws, used token throws
  - [x] 6.4 Test `requestAccountDeletion`: generates token, sends email, creates audit log
  - [x] 6.5 Test `confirmAccountDeletion`: deletes all user data, invalidates sessions, creates audit log
  - [x] 6.6 Test `gatherUserData`: returns complete user data export

- [x] Task 7: Route tests (AC: #1–#7)
  - [x] 7.1 Create `apps/api/src/routes/gdpr.test.ts`
  - [x] 7.2 Test POST /export: requires auth, returns success
  - [x] 7.3 Test GET /export/:token: valid token returns JSON download
  - [x] 7.4 Test GET /export/:token: invalid/expired token returns 400
  - [x] 7.5 Test POST /delete: requires auth, returns success
  - [x] 7.6 Test POST /delete/confirm/:token: valid token returns success
  - [x] 7.7 Test POST /delete/confirm/:token: invalid/expired token returns 400

- [x] Task 8: Integration tests (AC: #1, #2, #5)
  - [x] 8.1 Add integration tests in `apps/api/src/__tests__/integration/gdpr.test.ts`
  - [x] 8.2 Test full export flow: request → email sent → download → token consumed
  - [x] 8.3 Test full deletion flow: request → email sent → confirm → user gone from DB
  - [x] 8.4 Test deletion cascades: verify all related records (progress, tokens, friends, notifications, certificate) are deleted

## Dev Notes

### Architecture Overview

This story creates a new GDPR domain with two new routes, one new service, and extensions to the existing email service. It follows the established thin-route-handler pattern.

**Data flow:**
1. User requests export → `gdprService.requestDataExport()` → gathers data, creates token, sends email
2. User clicks email link → `gdprService.downloadExport(token)` → validates, returns JSON, marks token used
3. User requests deletion → `gdprService.requestAccountDeletion()` → creates token, sends confirmation email
4. User clicks confirmation link → `gdprService.confirmAccountDeletion(token)` → validates, deletes all data in transaction

### Key Design Decisions

1. **Synchronous export for MVP.** At MVP scale (20+ concurrent users), generating a JSON export synchronously is fine. No background job system needed. The export is generated in-memory and stored as a JSON column on the `GdprExportToken` row (avoids file system complexity in Docker).

2. **Export data stored on the token record.** The generated JSON is stored in a `data` Json column on `GdprExportToken`. This avoids file system management, cleanup jobs, and volume mounting issues in Docker. The trade-off is DB size, but at MVP scale this is negligible.

3. **Deletion uses `onDelete: Cascade` from Prisma schema.** The existing schema already has `onDelete: Cascade` on all User relations. Deleting the User record will cascade-delete all related records (progress, tokens, friends, notifications, certificate, etc.). We just need to delete the User, and Prisma/PostgreSQL handles the rest.

4. **Two-step deletion (request → confirm via email).** This prevents accidental deletion and matches GDPR best practices. The confirmation link expires after 24 hours.

5. **Export token expires after 24 hours.** Short-lived for security. User can request a new export if it expires.

6. **Deletion confirmation token expires after 24 hours.** After expiry, user must request deletion again.

7. **Session invalidation on deletion.** After user data is deleted, all Redis sessions for that user must be invalidated. Use the session store's `destroy()` method or clear sessions by pattern.

8. **Audit logging is best-effort.** If audit log creation fails, the primary operation should still succeed. Use try/catch around audit log writes.

### Shared Type Changes

Create `packages/shared/src/schemas/gdpr.ts`:

```typescript
import { z } from "zod";

export const gdprExportTokenParamSchema = z.object({
  token: z.string().min(1),
});

export const gdprDeletionTokenParamSchema = z.object({
  token: z.string().min(1),
});
```

Create `packages/shared/src/types/gdpr.ts`:

```typescript
export interface GdprExportResponse {
  message: string;
}

export interface GdprDeletionResponse {
  message: string;
}

export interface GdprExportData {
  exportedAt: string;
  user: {
    id: string;
    email: string | null;
    displayName: string | null;
    bio: string | null;
    avatarUrl: string | null;
    locale: string;
    ageConfirmed: boolean;
    createdAt: string;
  };
  progress: {
    missionsCompleted: number;
    chaptersCompleted: number;
    completionPercentage: number;
    missions: Array<{
      missionId: string;
      status: string;
      completedAt: string | null;
    }>;
  };
  tokens: {
    balance: number;
    transactions: Array<{
      amount: number;
      type: string;
      description: string;
      createdAt: string;
    }>;
  };
  achievements: Array<{
    title: string;
    description: string;
    earnedAt: string;
  }>;
  friends: Array<{
    friendId: string;
    status: string;
    since: string;
  }>;
  notifications: Array<{
    type: string;
    title: string;
    body: string;
    createdAt: string;
  }>;
  certificate: {
    completionDate: string;
    curriculumTitle: string;
  } | null;
}
```

### Prisma Schema Changes

```prisma
model GdprExportToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String
  data      Json      // The full export JSON
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([token])
  @@index([userId])
}

model GdprDeletionToken {
  id        String    @id @default(uuid())
  token     String    @unique
  userId    String
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime  @default(now())

  @@index([token])
  @@index([userId])
}

model GdprAuditLog {
  id        String   @id @default(uuid())
  userId    String
  action    String   // "EXPORT_REQUESTED", "EXPORT_DOWNLOADED", "DELETION_REQUESTED", "DELETION_CONFIRMED"
  ipAddress String?
  metadata  Json?
  createdAt DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
}
```

**Important:** `GdprExportToken` and `GdprDeletionToken` do NOT have a foreign key to `User`. This is intentional — when a user is deleted, we still want audit tokens to exist for compliance. The `GdprAuditLog` also has no FK to User for the same reason.

### Service Implementation

```typescript
// apps/api/src/services/gdprService.ts
import { randomBytes } from "crypto";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import { sendGdprExportEmail, sendGdprDeletionConfirmEmail } from "./emailService.js";

const EXPORT_TOKEN_EXPIRY_HOURS = 24;
const DELETION_TOKEN_EXPIRY_HOURS = 24;

function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

export async function requestDataExport(
  userId: string,
  userEmail: string,
  ipAddress: string | undefined,
): Promise<void> {
  // 1. Gather all user data
  const exportData = await gatherUserData(userId);

  // 2. Generate secure download token
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + EXPORT_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  // 3. Store export with token
  await prisma.gdprExportToken.create({
    data: { token, userId, data: exportData, expiresAt },
  });

  // 4. Send email with download link
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const downloadLink = `${frontendUrl}/gdpr/export/${token}`;
  await sendGdprExportEmail(userEmail, downloadLink);

  // 5. Audit log
  await logGdprAction(userId, "EXPORT_REQUESTED", ipAddress);
}

export async function downloadExport(token: string, ipAddress: string | undefined): Promise<unknown> {
  const record = await prisma.gdprExportToken.findUnique({ where: { token } });

  if (!record) {
    throw AppError.badRequest("Invalid export token", "INVALID_EXPORT_TOKEN");
  }
  if (record.usedAt) {
    throw AppError.badRequest("Export token already used", "INVALID_EXPORT_TOKEN");
  }
  if (record.expiresAt < new Date()) {
    throw AppError.badRequest("Export token expired", "INVALID_EXPORT_TOKEN");
  }

  // Mark as used
  await prisma.gdprExportToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  await logGdprAction(record.userId, "EXPORT_DOWNLOADED", ipAddress);

  return record.data;
}

export async function requestAccountDeletion(
  userId: string,
  userEmail: string,
  ipAddress: string | undefined,
): Promise<void> {
  const token = generateSecureToken();
  const expiresAt = new Date(Date.now() + DELETION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

  await prisma.gdprDeletionToken.create({
    data: { token, userId, expiresAt },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const confirmLink = `${frontendUrl}/gdpr/delete/confirm/${token}`;
  await sendGdprDeletionConfirmEmail(userEmail, confirmLink);

  await logGdprAction(userId, "DELETION_REQUESTED", ipAddress);
}

export async function confirmAccountDeletion(
  token: string,
  ipAddress: string | undefined,
): Promise<void> {
  const record = await prisma.gdprDeletionToken.findUnique({ where: { token } });

  if (!record) {
    throw AppError.badRequest("Invalid deletion token", "INVALID_DELETION_TOKEN");
  }
  if (record.usedAt) {
    throw AppError.badRequest("Deletion token already used", "INVALID_DELETION_TOKEN");
  }
  if (record.expiresAt < new Date()) {
    throw AppError.badRequest("Deletion token expired", "INVALID_DELETION_TOKEN");
  }

  const userId = record.userId;

  // Mark token as used
  await prisma.gdprDeletionToken.update({
    where: { token },
    data: { usedAt: new Date() },
  });

  // Delete user — onDelete: Cascade handles all related records
  await prisma.user.delete({ where: { id: userId } });

  // Invalidate all Redis sessions for this user
  // (Implementation depends on session store — see Key Constraints below)

  await logGdprAction(userId, "DELETION_CONFIRMED", ipAddress);
}
```

**Note on session invalidation:** The existing session infrastructure uses `connect-redis`. To invalidate all sessions for a deleted user, you can either:
- Pattern-scan Redis keys matching the user's sessions (if session data includes userId)
- Or simply delete the user and let session lookups fail naturally (session middleware checks `req.user` which won't exist → auto-logout on next request)

The pragmatic MVP approach is the latter: don't actively purge sessions from Redis. When the session middleware tries to deserialize the user (via Passport's `deserializeUser`), the `findUnique` call returns null → session is invalid → user is logged out.

### Route Changes

Create `apps/api/src/routes/gdpr.ts`:

```typescript
import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { gdprExportTokenParamSchema, gdprDeletionTokenParamSchema } from "@transcendence/shared";
import {
  requestDataExport,
  downloadExport,
  requestAccountDeletion,
  confirmAccountDeletion,
} from "../services/gdprService.js";

export const gdprRouter = Router();

// POST /api/v1/gdpr/export — request data export (requires auth)
gdprRouter.post("/export", requireAuth, async (req: Request, res: Response) => {
  const user = req.user as { id: string; email: string };
  await requestDataExport(user.id, user.email, req.ip);
  res.json({ data: { message: "Export initiated. Check your email for a download link." } });
});

// GET /api/v1/gdpr/export/:token — download export (token-based, no auth)
gdprRouter.get(
  "/export/:token",
  validate({ params: gdprExportTokenParamSchema }),
  async (req: Request, res: Response) => {
    const data = await downloadExport(req.params.token, req.ip);
    res.json({ data });
  },
);

// POST /api/v1/gdpr/delete — request account deletion (requires auth)
gdprRouter.post("/delete", requireAuth, async (req: Request, res: Response) => {
  const user = req.user as { id: string; email: string };
  await requestAccountDeletion(user.id, user.email, req.ip);
  res.json({ data: { message: "Deletion requested. Check your email to confirm." } });
});

// POST /api/v1/gdpr/delete/confirm/:token — confirm deletion (token-based, no auth)
gdprRouter.post(
  "/delete/confirm/:token",
  validate({ params: gdprDeletionTokenParamSchema }),
  async (req: Request, res: Response) => {
    await confirmAccountDeletion(req.params.token, req.ip);
    res.json({ data: { message: "Account and all personal data have been permanently deleted." } });
  },
);
```

Register in `app.ts`:

```typescript
import { gdprRouter } from "./routes/gdpr.js";
// ...
app.use("/api/v1/gdpr", gdprRouter);
```

### Files to Create

| File | Purpose |
|------|---------|
| `packages/shared/src/schemas/gdpr.ts` | Zod schemas for GDPR token params |
| `packages/shared/src/types/gdpr.ts` | TypeScript types for GDPR responses and export data |
| `apps/api/src/services/gdprService.ts` | GDPR business logic (export, deletion, audit) |
| `apps/api/src/services/gdprService.test.ts` | Unit tests for gdprService |
| `apps/api/src/routes/gdpr.ts` | GDPR route handlers |
| `apps/api/src/routes/gdpr.test.ts` | Route tests |
| `apps/api/src/__tests__/integration/gdpr.test.ts` | Integration tests |

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `GdprExportToken`, `GdprDeletionToken`, `GdprAuditLog` models |
| `apps/api/src/services/emailService.ts` | Add `sendGdprExportEmail()` and `sendGdprDeletionConfirmEmail()` functions |
| `apps/api/src/app.ts` | Import and register `gdprRouter` at `/api/v1/gdpr` |
| `packages/shared/src/index.ts` | Export GDPR schemas and types |

### Testing Patterns

**Service unit tests** — follow existing mocking patterns:

```typescript
// Mock Prisma
const mockPrisma = vi.hoisted(() => ({
  gdprExportToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  gdprDeletionToken: { create: vi.fn(), findUnique: vi.fn(), update: vi.fn() },
  gdprAuditLog: { create: vi.fn() },
  user: { findUnique: vi.fn(), delete: vi.fn() },
  // ... other models needed by gatherUserData
}));

vi.mock("../config/database.js", () => ({ prisma: mockPrisma }));
vi.mock("./emailService.js", () => ({
  sendGdprExportEmail: vi.fn(),
  sendGdprDeletionConfirmEmail: vi.fn(),
}));
```

**Route tests** — follow existing supertest pattern:

```typescript
const res = await request(app)
  .post("/api/v1/gdpr/export")
  .set("Cookie", sessionCookie);
expect(res.status).toBe(200);
expect(res.body.data.message).toContain("email");
```

**Integration tests** — follow `createAndLoginUser()` pattern:

```typescript
// 1. Create user, complete some missions, earn tokens
// 2. POST /gdpr/export → get email
// 3. Extract token from email mock
// 4. GET /gdpr/export/:token → verify JSON contains all data
// 5. POST /gdpr/delete → get confirmation email
// 6. POST /gdpr/delete/confirm/:token → user deleted
// 7. Verify user and all related records are gone from DB
```

### Key Constraints

1. **No FK from GDPR tokens/audit to User.** These records must survive user deletion for compliance. Use `userId` as a plain string, not a Prisma relation.

2. **Use `crypto.randomBytes(32).toString("hex")` for tokens.** Gives 64-character hex strings with OS-level entropy. Same approach used in `PasswordResetToken`.

3. **onDelete: Cascade handles related data deletion.** All existing User relations already have `onDelete: Cascade`. Deleting the User record cascades to: `OAuthAccount`, `PasswordResetToken`, `UserProgress`, `ChapterProgress`, `SelfAssessment`, `ExerciseAttempt`, `TokenTransaction`, `UserAchievement`, `Friendship` (both directions), `Certificate`, `Notification`. **Verify this in the Prisma schema before implementation.**

4. **Token expiry: 24 hours.** Both export download and deletion confirmation tokens expire after 24 hours.

5. **Export and deletion endpoints don't overlap with Story 8.3 (Email Service Integration).** Story 8.3 may extend email templates further, but this story adds the minimum needed GDPR emails. The `sendGdprExportEmail` and `sendGdprDeletionConfirmEmail` functions follow the same pattern as `sendPasswordResetEmail`.

6. **Rate limit GDPR endpoints.** Consider a stricter rate limit on GDPR endpoints (e.g., 3 requests per hour per user) to prevent abuse. Can use existing `rateLimiter` middleware or a route-specific limiter.

7. **Email templates must match existing aesthetic.** Use the same HTML structure as `buildPasswordResetHtml` — Source Sans 3 font, #FAF8F5 background, #2B9E9E teal CTA button, #FFFFFF card, rounded corners.

8. **`req.ip` may be `undefined`.** Express 5 types allow `undefined` for `req.ip`. The audit log `ipAddress` field is nullable.

9. **`gatherUserData` must NOT include sensitive fields.** Exclude: `passwordHash`, `twoFactorSecret`, session data. Include only user-facing data per GDPR Article 15 (right of access).

10. **Follow thin route handler pattern.** Routes validate → call service → return response. No business logic in routes.

### Previous Story Intelligence

**From Story 7.3 (most recent):**
- `buildRefresher()` as a private helper pattern — `gatherUserData()` can follow this as a private function in gdprService
- Reuse `vi.hoisted()` + `vi.mock()` pattern for Prisma mocking
- Integration tests: `createAndLoginUser()` → cookie → supertest agent

**From Story 2.4 (Password Reset — most relevant pattern):**
- Token generation with `crypto.randomBytes` → stored in DB with expiry
- Email sent via Resend with secure link
- Token consumed on use (single-use)
- Same architectural pattern applies to GDPR export/deletion tokens

**From existing emailService.ts:**
- `getResendClient()` lazy initialization with graceful fallback when API key missing
- `escapeHtml()` utility for HTML template safety
- HTML template structure: `<!DOCTYPE html>` → body with `#FAF8F5` background → card with `#FFFFFF` background → teal `#2B9E9E` CTA button
- Text alternative alongside HTML

### Git Intelligence

Recent commits follow `feat(domain): description (Story X.Y)` convention. Expected commit:
`feat(gdpr): add data export and deletion API (Story 8.2)`

### Project Structure Notes

- New files follow existing organization: `routes/gdpr.ts`, `services/gdprService.ts`
- Shared schemas go in `packages/shared/src/schemas/gdpr.ts` — consistent with per-domain schema files
- GDPR models in Prisma schema are standalone (no FK to User) — different from all other models
- `emailService.ts` is extended, not replaced — add functions following existing pattern
- Route registered in `app.ts` following alphabetical order with other routers

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 8 — Story 8.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — REST API patterns, gdprService, emailService, routes/gdpr.ts]
- [Source: _bmad-output/planning-artifacts/prd.md — FR43: GDPR data export, FR44: GDPR account/data deletion, FR45: confirmation emails]
- [Source: apps/api/prisma/schema.prisma — User model with onDelete: Cascade on all relations]
- [Source: apps/api/src/services/emailService.ts — sendPasswordResetEmail pattern, HTML template structure]
- [Source: apps/api/src/routes/certificates.ts — public route pattern (no auth, token-based)]
- [Source: apps/api/src/middleware/auth.ts — requireAuth middleware]
- [Source: apps/api/src/middleware/validate.ts — Zod validation middleware]
- [Source: apps/api/src/app.ts — route registration pattern]
- [Source: docs/project-context.md — API response format, thin route handlers, test organization]
- [Source: _bmad-output/implementation-artifacts/7-3-concept-refresher-api.md — previous story patterns and learnings]

## Change Log

- 2026-03-12: Implemented GDPR data export and deletion API with full test coverage (Story 8.2)
- 2026-03-12: Code review fixes — added ExerciseAttempt/SelfAssessment/OAuthAccount to export, atomic token consumption, $transaction for deletion, dynamic TOTAL_MISSIONS

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Pre-existing build errors in `userService.test.ts` and `contentLoader.ts` unrelated to GDPR changes
- Pre-existing flaky test in `engagement.test.ts` (streak reminder timing) unrelated to GDPR changes
- Express 5 `req.params` type is `string | string[]`; used `as string` cast consistent with existing routes

### Completion Notes List

- All 8 tasks and 34 subtasks completed successfully
- 12 unit tests pass (gdprService.test.ts): gatherUserData, requestDataExport, downloadExport, requestAccountDeletion, confirmAccountDeletion with valid/invalid/expired/used token scenarios
- 8 route tests pass (gdpr.test.ts): auth enforcement, success responses, error codes for all 4 endpoints
- 7 integration tests pass (gdpr.test.ts): full export flow, full deletion flow, cascade verification, error cases, auth enforcement
- 553 unit/route tests pass (0 regressions), 144/145 integration tests pass (1 pre-existing flaky test)
- GDPR tokens/audit logs intentionally have no FK to User (survive user deletion for compliance)
- Session invalidation uses pragmatic approach: Passport deserializeUser returns null for deleted user
- Email templates match existing aesthetic: Source Sans 3, #FAF8F5 background, teal #2B9E9E CTA button (export), red #D44D4D CTA button (deletion)
- Audit logging is best-effort (try/catch) per story Dev Notes specification

### File List

New files:
- `packages/shared/src/schemas/gdpr.ts`
- `packages/shared/src/types/gdpr.ts`
- `apps/api/src/services/gdprService.ts`
- `apps/api/src/services/gdprService.test.ts`
- `apps/api/src/routes/gdpr.ts`
- `apps/api/src/routes/gdpr.test.ts`
- `apps/api/src/__tests__/integration/gdpr.test.ts`
- `apps/api/prisma/migrations/20260312174218_add_gdpr_models/migration.sql`

Modified files:
- `apps/api/prisma/schema.prisma` — Added GdprExportToken, GdprDeletionToken, GdprAuditLog models
- `apps/api/src/services/emailService.ts` — Added sendGdprExportEmail, sendGdprDeletionConfirmEmail with HTML+text templates
- `apps/api/src/app.ts` — Imported and registered gdprRouter at /api/v1/gdpr
- `packages/shared/src/index.ts` — Exported GDPR schemas and types
- `apps/api/src/__tests__/integration/helpers/db.ts` — Added GDPR tables to resetDatabase truncation
