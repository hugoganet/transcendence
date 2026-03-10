import type { z } from "zod";
import type { streakSchema, achievementStatusSchema } from "../schemas/gamification.js";

export type StreakStatus = z.infer<typeof streakSchema>;
export type AchievementStatus = z.infer<typeof achievementStatusSchema>;
