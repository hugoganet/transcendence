import { prisma } from "../config/database.js";
import { createAndPushNotification } from "./notificationService.js";
import { notificationPreferencesSchema } from "@transcendence/shared";
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

export async function checkReengagement(io: IO, userId: string): Promise<void> {
  if (!(await shouldSendNotification(userId, "reengagement"))) return;

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: {
      lastMissionCompletedAt: true,
      displayName: true,
    },
  });

  if (!user.lastMissionCompletedAt) return;

  const daysSinceLastMission = Math.floor(
    (Date.now() - user.lastMissionCompletedAt.getTime()) / (1000 * 60 * 60 * 24),
  );

  if (daysSinceLastMission < REENGAGEMENT_THRESHOLD_DAYS) return;

  const recentReengagement = await prisma.notification.findFirst({
    where: {
      userId,
      type: "REENGAGEMENT",
      createdAt: {
        gte: new Date(Date.now() - REENGAGEMENT_DEDUP_HOURS * 60 * 60 * 1000),
      },
    },
  });

  if (recentReengagement) return;

  const [totalMissions, completedChapters] = await Promise.all([
    prisma.userProgress.count({ where: { userId, status: "COMPLETED" } }),
    prisma.chapterProgress.count({ where: { userId, status: "COMPLETED" } }),
  ]);

  const title = "Welcome back!";
  const body = `Your learning journey is still here. You've completed ${totalMissions} mission${totalMissions !== 1 ? "s" : ""} and mastered ${completedChapters} chapter${completedChapters !== 1 ? "s" : ""}. Pick up where you left off!`;

  await createAndPushNotification(io, userId, "REENGAGEMENT", title, body, {
    daysSinceLastMission,
    totalMissionsCompleted: totalMissions,
    totalChaptersCompleted: completedChapters,
  });
}

export async function checkStreakReminders(io: IO): Promise<number> {
  const now = new Date();
  const todayStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
  const yesterdayStart = new Date(todayStart);
  yesterdayStart.setUTCDate(yesterdayStart.getUTCDate() - 1);

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

  // Filter by preferences first (in-memory, no DB call)
  const eligibleUsers = usersAtRisk.filter((user) => {
    const prefs = parsePreferences(user.notificationPreferences);
    return prefs.streakReminder;
  });

  if (eligibleUsers.length === 0) return 0;

  // Batch dedup check — single query for all eligible users (fixes N+1)
  const alreadySentNotifs = await prisma.notification.findMany({
    where: {
      userId: { in: eligibleUsers.map((u) => u.id) },
      type: "STREAK_REMINDER",
      createdAt: { gte: todayStart },
    },
    select: { userId: true },
  });
  const alreadySentUserIds = new Set(alreadySentNotifs.map((n) => n.userId));

  let sentCount = 0;

  for (const user of eligibleUsers) {
    if (alreadySentUserIds.has(user.id)) continue;

    // AC #5: only send to connected users (Socket.IO)
    const sockets = await io.in(`user:${user.id}`).fetchSockets();
    if (sockets.length === 0) continue;

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
  const result = notificationPreferencesSchema.safeParse(raw);
  return result.success ? result.data : DEFAULT_PREFERENCES;
}
