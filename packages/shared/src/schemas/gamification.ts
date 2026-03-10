import { z } from "zod";

export const streakSchema = z.object({
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastMissionCompletedAt: z.string().datetime().nullable(),
  totalMissionsCompleted: z.number().int().min(0),
  totalModulesMastered: z.number().int().min(0),
});

export const achievementStatusSchema = z.object({
  id: z.string(),
  code: z.string(),
  title: z.string(),
  description: z.string(),
  iconUrl: z.string(),
  type: z.enum(["MODULE_COMPLETION", "TOKEN_THRESHOLD", "STREAK_TARGET"]),
  threshold: z.number().int(),
  earnedAt: z.string().datetime().nullable(),
});

export const achievementsResponseSchema = z.array(achievementStatusSchema);
