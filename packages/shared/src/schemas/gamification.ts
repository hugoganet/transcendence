import { z } from "zod";

export const streakSchema = z.object({
  currentStreak: z.number().int().min(0),
  longestStreak: z.number().int().min(0),
  lastMissionCompletedAt: z.string().datetime().nullable(),
  totalMissionsCompleted: z.number().int().min(0),
  totalModulesMastered: z.number().int().min(0),
});
