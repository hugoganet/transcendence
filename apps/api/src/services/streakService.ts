import { prisma } from "../config/database.js";
import { getContent } from "../utils/contentLoader.js";
import type { StreakStatus } from "@transcendence/shared";

/** Minimal interface for a Prisma-like client (real or transaction). */
type DbClient = Pick<typeof prisma, "user">;

function getUtcDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/**
 * Update streak for a user using the provided DB client.
 * Designed to be called inside an existing interactive transaction.
 */
export async function updateStreakWithClient(
  client: DbClient,
  userId: string,
): Promise<void> {
  const user = await client.user.findUniqueOrThrow({
    where: { id: userId },
    select: { currentStreak: true, longestStreak: true, lastMissionCompletedAt: true },
  });

  const now = new Date();
  const todayStr = getUtcDateString(now);

  if (user.lastMissionCompletedAt === null) {
    // First ever mission
    await client.user.update({
      where: { id: userId },
      data: { currentStreak: 1, longestStreak: 1, lastMissionCompletedAt: now },
    });
    return;
  }

  const lastDateStr = getUtcDateString(user.lastMissionCompletedAt);

  if (lastDateStr === todayStr) {
    // Same day — only update timestamp
    await client.user.update({
      where: { id: userId },
      data: { lastMissionCompletedAt: now },
    });
    return;
  }

  // Check if yesterday
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = getUtcDateString(yesterday);

  if (lastDateStr === yesterdayStr) {
    // Consecutive day
    const newStreak = user.currentStreak + 1;
    await client.user.update({
      where: { id: userId },
      data: {
        currentStreak: newStreak,
        longestStreak: Math.max(user.longestStreak, newStreak),
        lastMissionCompletedAt: now,
      },
    });
    return;
  }

  // Gap of 2+ days — save old streak if record, then reset
  await client.user.update({
    where: { id: userId },
    data: {
      longestStreak: Math.max(user.longestStreak, user.currentStreak),
      currentStreak: 1,
      lastMissionCompletedAt: now,
    },
  });
}

/**
 * Standalone version: wraps in its own interactive transaction.
 */
export async function updateStreak(userId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await updateStreakWithClient(tx, userId);
  });
}

/**
 * Get streak status and cumulative progress for a user.
 */
export async function getStreak(userId: string): Promise<StreakStatus> {
  // Wrap in a read transaction for snapshot consistency across the 3 queries
  const [user, totalMissionsCompleted, completedChapters] = await prisma.$transaction([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { currentStreak: true, longestStreak: true, lastMissionCompletedAt: true },
    }),
    prisma.userProgress.count({
      where: { userId, status: "COMPLETED" },
    }),
    prisma.chapterProgress.findMany({
      where: { userId, status: "COMPLETED" },
      select: { chapterId: true },
    }),
  ]);

  // Count completed categories (modules mastered)
  const content = getContent();
  const completedChapterIds = new Set(completedChapters.map((c) => c.chapterId));

  let totalModulesMastered = 0;
  for (const category of content.curriculum) {
    const allChaptersCompleted = category.chapters.every((ch) =>
      completedChapterIds.has(ch.id),
    );
    if (allChaptersCompleted && category.chapters.length > 0) {
      totalModulesMastered++;
    }
  }

  return {
    currentStreak: user.currentStreak,
    longestStreak: user.longestStreak,
    lastMissionCompletedAt: user.lastMissionCompletedAt?.toISOString() ?? null,
    totalMissionsCompleted,
    totalModulesMastered,
  };
}
