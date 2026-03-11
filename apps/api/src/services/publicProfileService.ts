import { prisma } from "../config/database.js";
import { getContent } from "../utils/contentLoader.js";
import type { PublicProfile } from "@transcendence/shared";
import { AppError } from "../utils/AppError.js";

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  const [user, completedCount, userAchievements] = await prisma.$transaction([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        displayName: true,
        avatarUrl: true,
        currentStreak: true,
      },
    }),
    prisma.userProgress.count({
      where: { userId, status: "COMPLETED" },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
  ]);

  if (!user) {
    throw new AppError(404, "USER_NOT_FOUND", "User not found");
  }

  const content = getContent();
  const totalMissions = content.curriculum.reduce(
    (sum, cat) =>
      sum + cat.chapters.reduce((s, ch) => s + ch.missions.length, 0),
    0,
  );
  const completionPercentage =
    totalMissions > 0
      ? Math.min(Math.round((completedCount / totalMissions) * 100), 100)
      : 0;

  const achievements = userAchievements.map((ua) => ({
    id: ua.achievement.id,
    code: ua.achievement.code,
    title: ua.achievement.title,
    description: ua.achievement.description,
    iconUrl: ua.achievement.iconUrl,
    earnedAt: ua.earnedAt.toISOString(),
  }));

  return {
    id: user.id,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
    xp: completedCount,
    currentStreak: user.currentStreak,
    achievements,
    completionPercentage,
  };
}
