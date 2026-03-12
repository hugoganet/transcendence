# Story 7.2: Re-Engagement & Streak Reminder Logic

Status: done

## Story

As a user,
I want to receive re-engagement notifications after extended absence and streak reminders before my streak breaks,
so that I'm gently reminded to continue learning without feeling guilty.

## Acceptance Criteria

1. **AC #1 — Re-engagement notification after 7+ days inactivity:**
   Given a user who has been inactive for 7+ days (FR37),
   When the re-engagement check runs (on-login check via Socket.IO connection),
   Then a re-engagement notification is created with welcoming, progress-first messaging,
   And the notification type is `REENGAGEMENT`,
   And the notification body includes cumulative progress (missions completed, modules mastered),
   And the tone is warm and welcoming (never punitive — "Your learning journey is still here. Pick up where you left off.").

2. **AC #2 — Streak reminder notification:**
   Given a user approaching end of day without completing a mission,
   When they have an active streak (currentStreak > 0 and lastMissionCompletedAt is yesterday, not today),
   Then a streak reminder notification is created and pushed via Socket.IO (FR35),
   And the notification type is `STREAK_REMINDER`,
   And delivery completes within <500ms (NFR3).

3. **AC #3 — Notification preferences model:**
   Given notification preferences,
   When the user opts out of specific notification types,
   Then those notifications are not sent,
   And preferences are stored in the database (User model JSON field or separate table).

4. **AC #4 — Notification preferences API endpoints:**
   Given an authenticated user,
   When they call `GET /api/v1/notifications/preferences`,
   Then their current notification preferences are returned,
   And when they call `PATCH /api/v1/notifications/preferences` with updated preferences,
   Then the preferences are saved and confirmed.

5. **AC #5 — Streak reminder scheduled job:**
   Given the server is running,
   When the streak reminder scheduler runs (configurable interval, default every hour),
   Then it checks all users with active streaks who haven't completed a mission today,
   And sends streak reminder notifications only to connected users (Socket.IO),
   And respects notification preferences (skips users who opted out of STREAK_REMINDER).

6. **AC #6 — Re-engagement deduplication:**
   Given a user reconnecting multiple times,
   When re-engagement check runs on each connection,
   Then only one re-engagement notification is created per absence period (deduplication by checking if a REENGAGEMENT notification was already created within the last 24 hours).

## Tasks / Subtasks

- [x] Task 1: Add notification preferences to Prisma schema (AC: #3)
  - [x] 1.1 Add `notificationPreferences` JSON field to `User` model in `apps/api/prisma/schema.prisma` with default value `{"streakReminder": true, "reengagement": true, "moduleComplete": true, "tokenThreshold": true, "streakMilestone": true}`
  - [x] 1.2 Run `npx prisma migrate dev --name add_notification_preferences`
  - [x] 1.3 Add shared Zod schema `notificationPreferencesSchema` in `packages/shared/src/schemas/notification.ts`
  - [x] 1.4 Add `NotificationPreferences` type in `packages/shared/src/types/notification.ts`
  - [x] 1.5 Export new schemas/types from `packages/shared/src/index.ts`

- [x] Task 2: Create engagementService (AC: #1, #2, #5, #6)
  - [x] 2.1 Create `apps/api/src/services/engagementService.ts`
  - [x] 2.2 Implement `checkReengagement(io, userId)` — queries user's lastMissionCompletedAt, checks 7+ day gap, deduplicates, creates + pushes re-engagement notification with progress stats
  - [x] 2.3 Implement `checkStreakReminders(io)` — queries all users with active streaks (lastMissionCompletedAt = yesterday, NOT today), checks notification preferences, sends streak reminders to connected users
  - [x] 2.4 Implement `getUserNotificationPreferences(userId)` — returns preferences from User model
  - [x] 2.5 Implement `updateNotificationPreferences(userId, preferences)` — updates preferences
  - [x] 2.6 Implement `shouldSendNotification(userId, notificationType)` — checks preferences before sending
  - [x] 2.7 Write unit tests `apps/api/src/services/engagementService.test.ts`

- [x] Task 3: Create streak reminder scheduler (AC: #5)
  - [x] 3.1 Create `apps/api/src/scheduler/streakReminder.ts`
  - [x] 3.2 Implement `startStreakReminderScheduler(io)` — uses `setInterval` (default 1 hour) to call `checkStreakReminders(io)`
  - [x] 3.3 Implement `stopStreakReminderScheduler()` — clears interval (for graceful shutdown and tests)
  - [x] 3.4 Register scheduler start in `apps/api/src/index.ts` after server starts
  - [x] 3.5 Add `STREAK_REMINDER_INTERVAL_MS` constant to `packages/shared/src/constants/tokens.ts` (default 3600000)
  - [x] 3.6 Write unit tests `apps/api/src/scheduler/streakReminder.test.ts`

- [x] Task 4: Hook re-engagement check into Socket.IO connection (AC: #1, #6)
  - [x] 4.1 Create `apps/api/src/socket/engagement.ts`
  - [x] 4.2 Implement `handleEngagementConnect(io, socket)` — calls `checkReengagement(io, userId)` on connection
  - [x] 4.3 Register handler in `apps/api/src/socket/index.ts` after `handleNotificationConnect`
  - [x] 4.4 Write unit tests `apps/api/src/socket/engagement.test.ts`

- [x] Task 5: Add notification preferences routes (AC: #4)
  - [x] 5.1 Add `GET /preferences` route to `apps/api/src/routes/notifications.ts`
  - [x] 5.2 Add `PATCH /preferences` route to `apps/api/src/routes/notifications.ts`
  - [x] 5.3 Update route unit tests `apps/api/src/routes/notifications.test.ts`

- [x] Task 6: Integration tests (AC: #1, #2, #3, #4, #5, #6)
  - [x] 6.1 Create `apps/api/src/__tests__/integration/engagement.test.ts`
  - [x] 6.2 Test re-engagement notification created on Socket.IO connect for 7+ day inactive user
  - [x] 6.3 Test re-engagement deduplication (second connect does NOT create duplicate)
  - [x] 6.4 Test streak reminder logic (user with active streak, no mission today)
  - [x] 6.5 Test notification preferences respected (opted-out user gets no notification)
  - [x] 6.6 Test GET/PATCH /notifications/preferences endpoints
  - [x] 6.7 Test re-engagement notification content includes progress stats

## Dev Notes

### Architecture Overview

This story builds on the notification infrastructure from Story 7.1 (`notificationService.ts`, Socket.IO `notification:push` event, `Notification` model). It adds:

1. **Engagement service** — business logic for re-engagement and streak reminder checks
2. **Scheduler** — periodic streak reminder job using `setInterval` (no external dependency needed)
3. **Socket.IO hook** — re-engagement check on user connection
4. **Notification preferences** — user-level opt-out per notification type

### Prisma Schema Changes

Add to `User` model:
```prisma
notificationPreferences Json @default("{\"streakReminder\":true,\"reengagement\":true,\"moduleComplete\":true,\"tokenThreshold\":true,\"streakMilestone\":true}")
```

**Why JSON field instead of separate table:** Preferences are always read/written with the user, never queried independently. A JSON field avoids a join and keeps the schema simple. The field uses Prisma's `Json` type with a default string value.

### Shared Schemas

Add to `packages/shared/src/schemas/notification.ts`:

```typescript
export const notificationPreferencesSchema = z.object({
  streakReminder: z.boolean(),
  reengagement: z.boolean(),
  moduleComplete: z.boolean(),
  tokenThreshold: z.boolean(),
  streakMilestone: z.boolean(),
});

export const updateNotificationPreferencesSchema = notificationPreferencesSchema.partial();
```

Add to `packages/shared/src/types/notification.ts`:

```typescript
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
```

### Engagement Service

```typescript
// apps/api/src/services/engagementService.ts
import { prisma } from "../config/database.js";
import { createAndPushNotification } from "./notificationService.js";
import type { IO } from "../socket/index.js";
import type { NotificationPreferences } from "@transcendence/shared";

const DEFAULT_PREFERENCES: NotificationPreferences = {
  streakReminder: true,
  reengagement: true,
  moduleComplete: true,
  tokenThreshold: true,
  streakMilestone: true,
};

const REENGAGEMENT_THRESHOLD_DAYS = 7;
const REENGAGEMENT_DEDUP_HOURS = 24;

/**
 * Check if user should receive a re-engagement notification on connect.
 * Called from Socket.IO connection handler.
 */
export async function checkReengagement(io: IO, userId: string): Promise<void> {
  // 1. Check preferences
  if (!(await shouldSendNotification(userId, "reengagement"))) return;

  // 2. Check lastMissionCompletedAt for 7+ day gap
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      lastMissionCompletedAt: true,
      displayName: true,
    },
  });

  if (!user.lastMissionCompletedAt) return; // Never completed a mission — not a re-engagement case

  const daysSinceLastMission = Math.floor(
    (Date.now() - user.lastMissionCompletedAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (daysSinceLastMission < REENGAGEMENT_THRESHOLD_DAYS) return;

  // 3. Deduplication — check if REENGAGEMENT notification exists within last 24 hours
  const recentReengagement = await prisma.notification.findFirst({
    where: {
      userId,
      type: "REENGAGEMENT",
      createdAt: { gte: new Date(Date.now() - REENGAGEMENT_DEDUP_HOURS * 60 * 60 * 1000) },
    },
  });

  if (recentReengagement) return; // Already sent recently

  // 4. Get progress stats for the notification body
  const [totalMissions, completedChapters] = await Promise.all([
    prisma.userProgress.count({ where: { userId, status: "COMPLETED" } }),
    prisma.chapterProgress.count({ where: { userId, status: "COMPLETED" } }),
  ]);

  // 5. Create and push notification
  const title = "Welcome back!";
  const body = `Your learning journey is still here. You've completed ${totalMissions} mission${totalMissions !== 1 ? "s" : ""} and mastered ${completedChapters} chapter${completedChapters !== 1 ? "s" : ""}. Pick up where you left off!`;

  await createAndPushNotification(io, userId, "REENGAGEMENT", title, body, {
    daysSinceLastMission,
    totalMissionsCompleted: totalMissions,
    totalChaptersCompleted: completedChapters,
  });
}

/**
 * Check all users for streak reminders. Called by scheduler.
 * Sends reminders to users with active streaks who haven't completed a mission today.
 */
export async function checkStreakReminders(io: IO): Promise<number> {
  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

  // Find users with active streaks whose last mission was yesterday (not today)
  const usersAtRisk = await prisma.user.findMany({
    where: {
      currentStreak: { gt: 0 },
      lastMissionCompletedAt: {
        gte: yesterdayStart,
        lt: todayStart,
      },
    },
    select: {
      id: true,
      currentStreak: true,
      displayName: true,
      notificationPreferences: true,
    },
  });

  let sentCount = 0;

  for (const user of usersAtRisk) {
    // Check preferences
    const prefs = parsePreferences(user.notificationPreferences);
    if (!prefs.streakReminder) continue;

    // Deduplicate — check if STREAK_REMINDER was already sent today
    const alreadySent = await prisma.notification.findFirst({
      where: {
        userId: user.id,
        type: "STREAK_REMINDER",
        createdAt: { gte: todayStart },
      },
    });

    if (alreadySent) continue;

    const title = "Keep your streak alive!";
    const body = `You're on a ${user.currentStreak}-day streak. Complete a mission today to keep it going!`;

    await createAndPushNotification(io, user.id, "STREAK_REMINDER", title, body, {
      currentStreak: user.currentStreak,
    });

    sentCount++;
  }

  return sentCount;
}

export async function getUserNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { notificationPreferences: true },
  });
  return parsePreferences(user.notificationPreferences);
}

export async function updateNotificationPreferences(
  userId: string,
  updates: Partial<NotificationPreferences>,
): Promise<NotificationPreferences> {
  const current = await getUserNotificationPreferences(userId);
  const merged = { ...current, ...updates };
  await prisma.user.update({
    where: { id: userId },
    data: { notificationPreferences: merged },
  });
  return merged;
}

export async function shouldSendNotification(
  userId: string,
  notificationType: keyof NotificationPreferences,
): Promise<boolean> {
  const prefs = await getUserNotificationPreferences(userId);
  return prefs[notificationType] ?? true;
}

function parsePreferences(raw: unknown): NotificationPreferences {
  if (raw && typeof raw === "object") return raw as NotificationPreferences;
  return DEFAULT_PREFERENCES;
}
```

### Streak Reminder Scheduler

```typescript
// apps/api/src/scheduler/streakReminder.ts
import { checkStreakReminders } from "../services/engagementService.js";
import { STREAK_REMINDER_INTERVAL_MS } from "@transcendence/shared";
import type { IO } from "../socket/index.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startStreakReminderScheduler(io: IO): void {
  if (intervalId) return; // Already running

  intervalId = setInterval(() => {
    checkStreakReminders(io).catch(() => {
      // Best-effort — scheduler errors should not crash the server
    });
  }, STREAK_REMINDER_INTERVAL_MS);
}

export function stopStreakReminderScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
```

**Register in `apps/api/src/index.ts`** after the server starts:
```typescript
import { startStreakReminderScheduler } from "./scheduler/streakReminder.js";

// After httpServer.listen():
startStreakReminderScheduler(io);
```

### Socket.IO Engagement Handler

```typescript
// apps/api/src/socket/engagement.ts
import { checkReengagement } from "../services/engagementService.js";
import type { IO, AppSocket } from "./index.js";

export async function handleEngagementConnect(io: IO, socket: AppSocket): Promise<void> {
  const userId = socket.data.userId;
  if (!userId) return;

  await checkReengagement(io, userId);
}
```

**Register in `apps/api/src/socket/index.ts`** after `handleNotificationConnect`:
```typescript
import { handleEngagementConnect } from "./engagement.js";

// Inside io.on("connection"):
handleEngagementConnect(io, socket).catch(() => {
  // Best-effort — engagement checks should not crash on connect errors
});
```

### Route Additions

Add to `apps/api/src/routes/notifications.ts`:

```typescript
import {
  getUserNotificationPreferences,
  updateNotificationPreferences,
} from "../services/engagementService.js";
import { updateNotificationPreferencesSchema } from "@transcendence/shared";

// GET /api/v1/notifications/preferences
notificationsRouter.get(
  "/preferences",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const preferences = await getUserNotificationPreferences(user.id);
    res.json({ data: preferences });
  },
);

// PATCH /api/v1/notifications/preferences
notificationsRouter.patch(
  "/preferences",
  requireAuth,
  validate({ body: updateNotificationPreferencesSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const updated = await updateNotificationPreferences(user.id, res.locals.body);
    res.json({ data: updated });
  },
);
```

**IMPORTANT:** Register `/preferences` routes BEFORE the `/:id/read` route in the router to avoid `preferences` being matched as `:id`.

### Notification Type to Preference Key Mapping

| Notification Type | Preference Key |
|---|---|
| `STREAK_REMINDER` | `streakReminder` |
| `REENGAGEMENT` | `reengagement` |
| `MODULE_COMPLETE` | `moduleComplete` |
| `TOKEN_THRESHOLD` | `tokenThreshold` |
| `STREAK_MILESTONE` | `streakMilestone` |

### Files to Create

| File | Purpose |
|------|---------|
| `apps/api/src/services/engagementService.ts` | Re-engagement and streak reminder business logic |
| `apps/api/src/services/engagementService.test.ts` | Unit tests |
| `apps/api/src/scheduler/streakReminder.ts` | Periodic streak reminder scheduler |
| `apps/api/src/scheduler/streakReminder.test.ts` | Unit tests |
| `apps/api/src/socket/engagement.ts` | Socket.IO connection handler for re-engagement |
| `apps/api/src/socket/engagement.test.ts` | Unit tests |
| `apps/api/src/__tests__/integration/engagement.test.ts` | Integration tests |

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add `notificationPreferences` JSON field to User model |
| `packages/shared/src/schemas/notification.ts` | Add `notificationPreferencesSchema`, `updateNotificationPreferencesSchema` |
| `packages/shared/src/types/notification.ts` | Add `NotificationPreferences` type |
| `packages/shared/src/constants/tokens.ts` | Add `STREAK_REMINDER_INTERVAL_MS` |
| `packages/shared/src/index.ts` | Export new schemas/types/constants |
| `apps/api/src/routes/notifications.ts` | Add GET/PATCH `/preferences` routes |
| `apps/api/src/routes/notifications.test.ts` | Add tests for new routes |
| `apps/api/src/socket/index.ts` | Import + call `handleEngagementConnect` |
| `apps/api/src/index.ts` | Import + start streak reminder scheduler |

### Testing Patterns

**Service unit tests** — mock Prisma:
```typescript
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  notification: {
    findFirst: vi.fn(),
  },
  userProgress: {
    count: vi.fn(),
  },
  chapterProgress: {
    count: vi.fn(),
  },
}));
vi.mock("../config/database.js", () => ({ prisma: mockPrisma }));

const mockNotificationService = vi.hoisted(() => ({
  createAndPushNotification: vi.fn(),
}));
vi.mock("./notificationService.js", () => mockNotificationService);
```

**Scheduler unit tests:**
```typescript
// Use fake timers to test setInterval behavior
vi.useFakeTimers();
// Verify checkStreakReminders is called at the configured interval
// Verify stopStreakReminderScheduler clears the interval
```

**Socket unit tests** — follow `notifications.test.ts` pattern:
```typescript
// Mock engagementService.checkReengagement
// Verify it's called with correct userId on connection
// Verify errors are caught (best-effort)
```

**Integration tests** — follow `notifications.test.ts` pattern:
```typescript
// Create user with lastMissionCompletedAt 10 days ago
// Connect via Socket.IO → verify REENGAGEMENT notification received
// Connect again → verify NO duplicate notification
// Create user with active streak, lastMission = yesterday
// Call checkStreakReminders → verify STREAK_REMINDER notification created
// Update preferences to disable streakReminder → verify not sent
```

### Key Constraints

1. **Do NOT modify `completeMission()` in this story.** The streak reminder is a scheduled check, not a hook in the mission completion flow. Story 7.1's notification infrastructure handles mission-triggered notifications (MODULE_COMPLETE, STREAK_MILESTONE, TOKEN_THRESHOLD) — that wiring is a future task or already handled.
2. **`io` must be passed as a parameter** to `checkReengagement()` and `checkStreakReminders()` — never import `io` from index.ts in services.
3. **Engagement checks are best-effort** — errors should not crash the server or prevent Socket.IO connection. Use `.catch(() => {})` pattern.
4. **`/preferences` routes MUST be registered BEFORE `/:id/read`** in the notifications router, or Express will match `preferences` as `:id`.
5. **Re-engagement deduplication is critical** — without it, every page refresh / Socket.IO reconnect would create a new notification. Deduplicate by checking for existing REENGAGEMENT notification within last 24 hours.
6. **Streak reminder scheduler is NOT a cron job** — it's a `setInterval` in the Node.js process. This is sufficient for our scale (20+ concurrent users). No external dependencies needed.
7. **Notification tone must match UX spec** — "Your learning journey is still here. Pick up where you left off." Never punitive ("You're falling behind!").
8. **Dates as ISO 8601 strings** in API responses — use `.toISOString()` on dates.
9. **Reuse `DEFAULT_PAGE_SIZE` and `MAX_PAGE_SIZE`** from `packages/shared/src/constants/tokens.ts`.
10. **`checkStreakReminders` deduplication** — only send one streak reminder per user per day (check if already sent today before creating).

### UX Tone Guidelines (from UX spec)

**Re-engagement notification:**
- Title: "Welcome back!"
- Body: "Your learning journey is still here. You've completed X missions and mastered Y chapters. Pick up where you left off!"
- Tone: Warm, welcoming, progress-first. NEVER punitive.

**Streak reminder:**
- Title: "Keep your streak alive!"
- Body: "You're on a X-day streak. Complete a mission today to keep it going!"
- Tone: Encouraging, gentle. Not urgent or fear-based.

### Project Structure Notes

- Follows existing monorepo conventions: schemas/types in `packages/shared`, service/route/socket in `apps/api/src`
- New `scheduler/` directory in `apps/api/src/` for the streak reminder scheduler
- No new npm dependencies required — `setInterval` is native Node.js
- Route registration in notifications router: add `/preferences` routes BEFORE `/:id/read`
- Socket handler registration in `socket/index.ts`: add after `handleNotificationConnect` call

### Previous Story Intelligence (7.1)

**Key learnings from Story 7.1:**
- `notificationService.ts` provides `createAndPushNotification(io, userId, type, title, body, data?)` — use this directly
- Socket.IO `notification:push` event is typed with `NotificationPushPayload`
- `io` passed as parameter to service functions (never imported from index.ts)
- Notifications are best-effort — errors caught with `.catch(() => {})`
- `Notification` model already has indexes on `userId`, `userId+createdAt`, `userId+read`
- Prisma client needed explicit `npx prisma generate` after migration
- Integration test patterns: `createAndLoginUser()` → cookie → `createSocketClient(cookie)`

### Git Intelligence

Recent commits follow `feat(domain): description (Story X.Y)` convention. Last 5 commits:
- `feat(notifications): add notification system API and Socket.IO push (Story 7.1)`
- `feat(social): add certificate generation and sharing API (Story 6.4)`
- `feat(social): add public profiles API (Story 6.3)`
- `feat(social): add online presence via Socket.IO (Story 6.2)`
- `feat(social): add friends system API (Story 6.1)`

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Epic 7 — Story 7.2]
- [Source: _bmad-output/planning-artifacts/architecture.md — Socket.IO, REST API, Prisma patterns]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Re-engagement tone, WelcomeBack component, notification messaging]
- [Source: apps/api/src/services/notificationService.ts — createAndPushNotification, createNotification]
- [Source: apps/api/src/services/streakService.ts — streak data model, updateStreakWithClient]
- [Source: apps/api/src/services/curriculumService.ts — completeMission flow]
- [Source: apps/api/src/socket/index.ts — ServerToClientEvents, IO/AppSocket types, connection handler pattern]
- [Source: apps/api/src/routes/notifications.ts — existing routes to extend]
- [Source: packages/shared/src/schemas/notification.ts — notificationTypeSchema includes STREAK_REMINDER and REENGAGEMENT]
- [Source: docs/project-context.md — WithClient pattern, API response format, test organization]
- [Source: _bmad-output/implementation-artifacts/7-1-notification-system-api-and-socket-io-push.md — previous story learnings]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No blockers encountered. All tasks implemented in a single session.

### Completion Notes List

- Task 1: Added `notificationPreferences` JSON field to User model with default all-true preferences. Migration applied successfully. Added Zod schemas (`notificationPreferencesSchema`, `updateNotificationPreferencesSchema`) and `NotificationPreferences` type to shared package. Also added `STREAK_REMINDER_INTERVAL_MS` constant (3,600,000ms = 1 hour).
- Task 2: Created `engagementService.ts` with 6 exported functions: `checkReengagement`, `checkStreakReminders`, `getUserNotificationPreferences`, `updateNotificationPreferences`, `shouldSendNotification`, and internal `parsePreferences`. 14 unit tests covering all branches (opt-out, deduplication, no-mission users, default preferences, partial updates).
- Task 3: Created `scheduler/streakReminder.ts` with `startStreakReminderScheduler` and `stopStreakReminderScheduler`. Registered in `index.ts` after server listen. Added to graceful shutdown chain. 4 unit tests with fake timers.
- Task 4: Created `socket/engagement.ts` with `handleEngagementConnect`. Registered in `socket/index.ts` after `handleNotificationConnect` with best-effort `.catch()`. 2 unit tests.
- Task 5: Added `GET /preferences` and `PATCH /preferences` routes to notifications router, registered BEFORE `/:id/read` to avoid Express param matching. 4 new unit tests (auth, get, update, validation).
- Task 6: Created comprehensive integration test suite with 8 tests covering all ACs: re-engagement creation, deduplication, progress stats, streak reminders, preferences CRUD, and preference-respecting notification suppression.

### Change Log

- 2026-03-12: Implemented Story 7.2 — re-engagement notifications, streak reminders, notification preferences, and scheduled streak reminder job. All 6 tasks completed. 34 story-specific unit tests + 8 integration tests. No regressions.
- 2026-03-12: Code review fixes — AC #5 compliance (streak reminders only to connected users), Zod validation in parsePreferences, batch dedup query (N+1 fix), IO type deduplication (4 files → 1 export), moved STREAK_REMINDER_INTERVAL_MS to scheduler constants.

### File List

**New files:**
- `apps/api/src/services/engagementService.ts`
- `apps/api/src/services/engagementService.test.ts`
- `apps/api/src/scheduler/streakReminder.ts`
- `apps/api/src/scheduler/streakReminder.test.ts`
- `apps/api/src/socket/engagement.ts`
- `apps/api/src/socket/engagement.test.ts`
- `apps/api/src/__tests__/integration/engagement.test.ts`
- `apps/api/prisma/migrations/20260311161818_add_notification_preferences/migration.sql`

**New files (review fixes):**
- `packages/shared/src/constants/scheduler.ts` — `STREAK_REMINDER_INTERVAL_MS` moved from tokens.ts

**Modified files:**
- `apps/api/prisma/schema.prisma` — added `notificationPreferences` JSON field to User model
- `packages/shared/src/schemas/notification.ts` — added `notificationPreferencesSchema`, `updateNotificationPreferencesSchema`
- `packages/shared/src/types/notification.ts` — added `NotificationPreferences` type
- `packages/shared/src/constants/tokens.ts` — removed `STREAK_REMINDER_INTERVAL_MS` (moved to scheduler.ts)
- `packages/shared/src/constants/scheduler.ts` — `STREAK_REMINDER_INTERVAL_MS` constant
- `packages/shared/src/index.ts` — exported new schemas, types, and constants
- `apps/api/src/routes/notifications.ts` — added GET/PATCH `/preferences` routes
- `apps/api/src/routes/notifications.test.ts` — added tests for preferences routes + engagement service mock
- `apps/api/src/socket/index.ts` — imported and called `handleEngagementConnect`, exported IO/AppSocket types
- `apps/api/src/socket/engagement.ts` — uses IO/AppSocket from socket/index.ts
- `apps/api/src/services/engagementService.ts` — uses IO from socket/index.ts, Zod validation in parsePreferences, batch dedup, connected-only streak reminders
- `apps/api/src/services/notificationService.ts` — uses IO from socket/index.ts
- `apps/api/src/scheduler/streakReminder.ts` — uses IO from socket/index.ts
- `apps/api/src/index.ts` — imported and started streak reminder scheduler, added to graceful shutdown
