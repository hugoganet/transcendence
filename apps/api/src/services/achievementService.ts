import { prisma } from "../config/database.js";
import type { AchievementStatus } from "@transcendence/shared";

/** Minimal interface for a Prisma-like client (real or transaction). */
type DbClient = Pick<typeof prisma, "achievement" | "userAchievement">;

export interface AchievementContext {
  categoryCompleted?: number;
  tokenBalance: number;
  currentStreak: number;
}

export interface AwardedAchievement {
  code: string;
  title: string;
  description: string;
}

/**
 * Check and award achievements using the provided DB client.
 * Designed to be called inside an existing interactive transaction.
 */
export async function checkAndAwardAchievementsWithClient(
  client: DbClient,
  userId: string,
  context: AchievementContext,
): Promise<AwardedAchievement[]> {
  // 1. Query all achievements
  const allAchievements = await client.achievement.findMany();

  // 2. Query user's already-earned achievement IDs
  const earned = await client.userAchievement.findMany({
    where: { userId },
    select: { achievementId: true },
  });
  const earnedIds = new Set(earned.map((e) => e.achievementId));

  // 3. Determine newly qualifying achievements
  const newAwards: AwardedAchievement[] = [];
  const toCreate: { userId: string; achievementId: string }[] = [];

  for (const achievement of allAchievements) {
    if (earnedIds.has(achievement.id)) continue;

    let qualifies = false;
    switch (achievement.type) {
      case "MODULE_COMPLETION":
        qualifies = context.categoryCompleted === achievement.threshold;
        break;
      case "TOKEN_THRESHOLD":
        qualifies = context.tokenBalance >= achievement.threshold;
        break;
      case "STREAK_TARGET":
        qualifies = context.currentStreak >= achievement.threshold;
        break;
    }

    if (qualifies) {
      toCreate.push({ userId, achievementId: achievement.id });
      newAwards.push({
        code: achievement.code,
        title: achievement.title,
        description: achievement.description,
      });
    }
  }

  // 4. Batch insert (skipDuplicates for concurrent safety)
  if (toCreate.length > 0) {
    await client.userAchievement.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
  }

  return newAwards;
}

/**
 * Standalone version: wraps in its own interactive transaction.
 */
export async function checkAndAwardAchievements(
  userId: string,
  context: AchievementContext,
): Promise<AwardedAchievement[]> {
  return prisma.$transaction(async (tx) => {
    return checkAndAwardAchievementsWithClient(tx, userId, context);
  });
}

/**
 * Get all achievements with earned/unearned status for a user.
 */
export async function getAchievements(userId: string): Promise<AchievementStatus[]> {
  const achievements = await prisma.achievement.findMany({
    include: {
      userAchievements: {
        where: { userId },
        select: { earnedAt: true },
      },
    },
    orderBy: [{ type: "asc" }, { threshold: "asc" }],
  });

  return achievements.map((a) => ({
    id: a.id,
    code: a.code,
    title: a.title,
    description: a.description,
    iconUrl: a.iconUrl,
    type: a.type,
    threshold: a.threshold,
    earnedAt: a.userAchievements[0]?.earnedAt.toISOString() ?? null,
  }));
}
