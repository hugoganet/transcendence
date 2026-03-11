import { z } from "zod";

export const earnedAchievementSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  iconUrl: z.string().min(1),
  earnedAt: z.string().datetime(),
});

export const publicProfileSchema = z.object({
  id: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  xp: z.number().int().min(0),
  currentStreak: z.number().int().min(0),
  achievements: z.array(earnedAchievementSchema),
  completionPercentage: z.number().int().min(0).max(100),
});

export const userIdParamSchema = z.object({
  userId: z.string().uuid(),
});
