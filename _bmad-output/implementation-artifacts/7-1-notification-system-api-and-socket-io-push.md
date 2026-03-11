# Story 7.1: Notification System API & Socket.IO Push

Status: done

## Story

As a user,
I want to receive real-time notifications for streak reminders and milestones,
so that I stay engaged with my learning journey.

## Acceptance Criteria

1. **AC #1 — Socket.IO push notification:**
   Given a connected user via Socket.IO,
   When a notification event fires (one of: streak reminder, module completion, token threshold, streak milestone),
   Then `notification:push` is emitted to that user's socket room with payload `{ type, title, body, data }`,
   And delivery completes within <500ms (NFR3).

2. **AC #2 — Auto-reconnect and missed notifications:**
   Given a user's Socket.IO connection drops,
   When the client reconnects (within 5 seconds per NFR13),
   Then missed notifications during disconnection are delivered on reconnect.

3. **AC #3 — Notification table in DB:**
   Given the notification system,
   When DB tables are needed,
   Then a `Notification` table is created with fields: `id`, `userId`, `type`, `title`, `body`, `read`, `data`, `createdAt`.

4. **AC #4 — HTTP notification history endpoint:**
   Given an authenticated user,
   When they call `GET /api/v1/notifications`,
   Then their notification history is returned, paginated, newest first.

5. **AC #5 — Mark notification as read:**
   Given an authenticated user,
   When they call `PATCH /api/v1/notifications/:id/read`,
   Then the notification's `read` field is set to `true`.

## Tasks / Subtasks

- [x] Task 1: Add Notification model to Prisma schema (AC: #3)
  - [x] 1.1 Add `Notification` model to `apps/api/prisma/schema.prisma`
  - [x] 1.2 Add `notifications Notification[]` relation to `User` model
  - [x] 1.3 Run `npx prisma migrate dev --name add_notification_model`
  - [x] 1.4 Add `"Notification"` to TRUNCATE list in `apps/api/src/__tests__/integration/helpers/db.ts`

- [x] Task 2: Add shared schemas and types (AC: #4, #5)
  - [x] 2.1 Create `packages/shared/src/schemas/notification.ts` with Zod schemas
  - [x] 2.2 Create `packages/shared/src/types/notification.ts` with inferred types
  - [x] 2.3 Export all new schemas/types from `packages/shared/src/index.ts`

- [x] Task 3: Create notificationService (AC: #1, #2, #4, #5)
  - [x] 3.1 Create `apps/api/src/services/notificationService.ts`
  - [x] 3.2 Implement `createNotification(userId, type, title, body, data?)` — writes to DB
  - [x] 3.3 Implement `createAndPushNotification(io, userId, type, title, body, data?)` — writes to DB + emits via Socket.IO
  - [x] 3.4 Implement `getNotifications(userId, page, pageSize)` — paginated query
  - [x] 3.5 Implement `markAsRead(userId, notificationId)` — sets `read: true`
  - [x] 3.6 Implement `getUnreadNotifications(userId)` — for reconnect replay
  - [x] 3.7 Write unit tests `apps/api/src/services/notificationService.test.ts`

- [x] Task 4: Create socket notification handler (AC: #2)
  - [x] 4.1 Create `apps/api/src/socket/notifications.ts`
  - [x] 4.2 Implement `handleNotificationConnect(io, socket)` — queries unread notifications and emits them on connect
  - [x] 4.3 Register handler in `apps/api/src/socket/index.ts` — add call in `io.on("connection")` after `handleUserConnect`
  - [x] 4.4 Type the `notification:push` payload in `ServerToClientEvents` — replace `unknown` with `NotificationPushPayload`
  - [x] 4.5 Write unit tests `apps/api/src/socket/notifications.test.ts`

- [x] Task 5: Create notifications route (AC: #4, #5)
  - [x] 5.1 Create `apps/api/src/routes/notifications.ts` with `GET /` and `PATCH /:id/read`
  - [x] 5.2 Mount router in `apps/api/src/app.ts` as `/api/v1/notifications`
  - [x] 5.3 Write route unit tests `apps/api/src/routes/notifications.test.ts`

- [x] Task 6: Integration tests (AC: #1, #2, #4, #5)
  - [x] 6.1 Create `apps/api/src/__tests__/integration/notifications.test.ts`
  - [x] 6.2 Test GET /notifications pagination (empty, with data, page/pageSize)
  - [x] 6.3 Test PATCH /:id/read (success, not found, not owned)
  - [x] 6.4 Test Socket.IO notification push (create notification → verify client receives `notification:push`)
  - [x] 6.5 Test missed notification replay on reconnect

## Dev Notes

### Prisma Model

```prisma
model Notification {
  id        String   @id @default(cuid())
  userId    String
  type      String   // "STREAK_REMINDER", "MODULE_COMPLETE", "TOKEN_THRESHOLD", "STREAK_MILESTONE", "REENGAGEMENT"
  title     String
  body      String
  read      Boolean  @default(false)
  data      Json?    // Optional structured payload (e.g., { achievementId, streakCount })
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, createdAt])
  @@index([userId, read])
}
```

Add to User model:
```prisma
notifications      Notification[]
```

### Shared Schemas

```typescript
// packages/shared/src/schemas/notification.ts
import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/tokens.js";

export const notificationTypeSchema = z.enum([
  "STREAK_REMINDER",
  "MODULE_COMPLETE",
  "TOKEN_THRESHOLD",
  "STREAK_MILESTONE",
  "REENGAGEMENT",
]);

export const notificationSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  data: z.unknown().nullable(),
  createdAt: z.string(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const notificationIdParamSchema = z.object({
  id: z.string().min(1),
});

export const notificationPushPayloadSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.unknown().nullable(),
});
```

### Socket.IO Push Mechanism

The `notification:push` event is already declared in `ServerToClientEvents` in `apps/api/src/socket/index.ts` (line 17). Replace `unknown` with the typed payload:

```typescript
export interface NotificationPushPayload {
  id: string;
  type: string;
  title: string;
  body: string;
  data: unknown;
}

export interface ServerToClientEvents {
  "notification:push": (payload: NotificationPushPayload) => void;
  "presence:online": (userId: string) => void;
  "presence:offline": (userId: string) => void;
}
```

**Emitting to a specific user** (room pattern from presence.ts):
```typescript
io.to(`user:${userId}`).emit("notification:push", { id, type, title, body, data });
```

The `io` instance must be passed as a parameter to `createAndPushNotification()` — follow the same pattern as `handleUserConnect(io, socket)` in presence.ts. Do NOT import `io` from `index.ts` in the service.

### Missed Notifications on Reconnect (AC #2)

Create `apps/api/src/socket/notifications.ts`:

```typescript
export async function handleNotificationConnect(io: IO, socket: AppSocket): Promise<void> {
  const userId = socket.data.userId;
  if (!userId) return;

  const unread = await getUnreadNotifications(userId);
  for (const notification of unread) {
    socket.emit("notification:push", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    });
  }
}
```

Register in `socket/index.ts` after `handleUserConnect`:
```typescript
import { handleNotificationConnect } from "./notifications.js";

// Inside io.on("connection"):
handleNotificationConnect(io, socket).catch(() => {
  // Notifications are best-effort — don't crash on connect errors
});
```

### Route Handler Pattern

```typescript
// apps/api/src/routes/notifications.ts
import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { notificationQuerySchema, notificationIdParamSchema } from "@transcendence/shared";
import { getNotifications, markAsRead } from "../services/notificationService.js";

export const notificationsRouter = Router();

// GET /api/v1/notifications
notificationsRouter.get(
  "/",
  requireAuth,
  validate({ query: notificationQuerySchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const { page, pageSize } = res.locals.query;
    const result = await getNotifications(user.id, page, pageSize);
    res.json({ data: result.notifications, meta: result.meta });
  },
);

// PATCH /api/v1/notifications/:id/read
notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  validate({ params: notificationIdParamSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    await markAsRead(user.id, req.params.id);
    res.status(204).send();
  },
);
```

Mount in `app.ts` after `friendsRouter`, **before** the 404 catch-all:
```typescript
import { notificationsRouter } from "./routes/notifications.js";
app.use("/api/v1/notifications", notificationsRouter);
```

### Files to Create

| File | Purpose |
|------|---------|
| `packages/shared/src/schemas/notification.ts` | Zod schemas |
| `packages/shared/src/types/notification.ts` | TypeScript types (inferred from Zod) |
| `apps/api/src/services/notificationService.ts` | Service layer |
| `apps/api/src/services/notificationService.test.ts` | Unit tests |
| `apps/api/src/socket/notifications.ts` | Socket handler for reconnect replay |
| `apps/api/src/socket/notifications.test.ts` | Unit tests |
| `apps/api/src/routes/notifications.ts` | REST endpoints |
| `apps/api/src/routes/notifications.test.ts` | Route unit tests |
| `apps/api/src/__tests__/integration/notifications.test.ts` | Integration tests |

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `Notification` model + `notifications` relation on `User` |
| `packages/shared/src/index.ts` | Export new schemas/types |
| `apps/api/src/app.ts` | Import + mount `notificationsRouter` |
| `apps/api/src/socket/index.ts` | Import + call `handleNotificationConnect`, type `notification:push` payload |
| `apps/api/src/__tests__/integration/helpers/db.ts` | Add `"Notification"` to TRUNCATE list |

### Testing Patterns

**Service unit tests** — mock Prisma:
```typescript
const mockPrisma = vi.hoisted(() => ({
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  },
}));
vi.mock("../config/database.js", () => ({ prisma: mockPrisma }));
```

**Route unit tests** — follow `friends.test.ts` pattern:
- Mock service module: `vi.mock("../services/notificationService.js", () => mockService)`
- Mock all infrastructure: `database.js`, `redis.js`, `session.js`
- Use `createTestApp()` helper with auth middleware injection
- Test 401 without auth, 200 with pagination, 204 for mark-as-read, 404 for invalid ID

**Socket unit tests** — follow `presence.test.ts` pattern:
- Mock `prisma` and service functions
- Mock IO: `{ to: vi.fn().mockReturnValue({ emit: vi.fn() }) }`
- Mock socket: `{ data: { userId: "test-id" }, emit: vi.fn() }`
- Test that unread notifications are emitted on connect

**Integration tests** — follow `presence.test.ts` pattern for Socket.IO:
- Use real HTTP server + Socket.IO + session
- `createAndLoginUser()` → get cookie → `createSocketClient(cookie)`
- `waitForEvent(socket, "notification:push")` for async event assertions
- Create notifications via direct DB insert, verify HTTP endpoint returns them
- Verify Socket.IO push delivery by inserting + emitting in test

### Key Constraints

1. **Do NOT hook into `completeMission()`** in this story — that is Story 7.2 territory. This story only builds the notification infrastructure.
2. **`io` must be passed as a parameter** to service functions that need to emit — never import `io` from `index.ts` in services.
3. **Notifications are best-effort** — Socket.IO emit failures should not crash the server. Use `.catch(() => {})` pattern.
4. **`notification:push` payload must include `id`** — the client needs it to call `PATCH /:id/read`.
5. **`markAsRead` must verify ownership** — user can only mark their own notifications as read. Throw `AppError.notFound()` if notification doesn't belong to user.
6. **Dates as ISO 8601 strings** in API responses — use `.toISOString()` on `createdAt`.
7. **Reuse `DEFAULT_PAGE_SIZE` and `MAX_PAGE_SIZE`** from `packages/shared/src/constants/tokens.ts`.

### Project Structure Notes

- Follows existing monorepo conventions: schemas/types in `packages/shared`, service/route/socket in `apps/api/src`
- No new dependencies required — Socket.IO 4.8, Prisma 7, Zod already installed
- Route registration order in `app.ts`: add after `certificatesRouter`, before the 404 catch-all
- Socket handler registration in `socket/index.ts`: add after `handleUserConnect` call

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7 — Story 7.1]
- [Source: _bmad-output/planning-artifacts/architecture.md — Socket.IO, REST API, Prisma patterns]
- [Source: apps/api/src/socket/index.ts — ServerToClientEvents, createSocketServer]
- [Source: apps/api/src/socket/presence.ts — handleUserConnect, user room pattern, IO/AppSocket types]
- [Source: apps/api/src/routes/friends.ts — thin route handler pattern]
- [Source: packages/shared/src/schemas/token.ts — pagination schema pattern]
- [Source: docs/project-context.md — WithClient pattern, API response format, test organization]
- [Source: _bmad-output/implementation-artifacts/6-4-certificate-generation-and-sharing-api.md — previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Prisma client needed explicit `npx prisma generate` after migration — integration tests failed until client was regenerated.

### Completion Notes List

- All 6 tasks completed with full test coverage
- Notification model added to Prisma schema with 3 indexes (userId, userId+createdAt, userId+read)
- Shared Zod schemas and TypeScript types exported from @transcendence/shared
- notificationService implements 5 functions: createNotification, createAndPushNotification, getNotifications, markAsRead, getUnreadNotifications
- Socket.IO handler replays unread notifications on reconnect (AC #2)
- `notification:push` payload properly typed with NotificationPushPayload interface
- markAsRead verifies ownership — returns 404 if notification doesn't belong to requesting user
- io passed as parameter to service (not imported) per project convention
- Notifications are best-effort — socket errors caught with `.catch(() => {})`
- Unit tests: 18 tests (8 service + 3 socket + 7 route)
- Integration tests: 9 tests covering all 5 ACs
- Full regression suite: 500 unit tests + 126 integration tests — all passing

### Change Log

- 2026-03-11: Story 7.1 implemented — Notification system API and Socket.IO push
- 2026-03-11: Code review fixes applied — H1: removed duplicate NotificationPushPayload type (import from shared), M1: notificationSchema now uses notificationTypeSchema enum for type field, M2: getUnreadNotifications capped at 50 results, M3: markAsRead is now idempotent (skips DB update if already read), +1 new unit test

### File List

**New files:**
- `packages/shared/src/schemas/notification.ts`
- `packages/shared/src/types/notification.ts`
- `apps/api/src/services/notificationService.ts`
- `apps/api/src/services/notificationService.test.ts`
- `apps/api/src/socket/notifications.ts`
- `apps/api/src/socket/notifications.test.ts`
- `apps/api/src/routes/notifications.ts`
- `apps/api/src/routes/notifications.test.ts`
- `apps/api/src/__tests__/integration/notifications.test.ts`
- `apps/api/prisma/migrations/20260311154940_add_notification_model/migration.sql`

**Modified files:**
- `apps/api/prisma/schema.prisma` — Added Notification model + notifications relation on User
- `packages/shared/src/index.ts` — Exported notification schemas and types
- `apps/api/src/app.ts` — Imported + mounted notificationsRouter
- `apps/api/src/socket/index.ts` — Imported handleNotificationConnect, typed notification:push payload, added NotificationPushPayload interface
- `apps/api/src/__tests__/integration/helpers/db.ts` — Added "Notification" to TRUNCATE list
