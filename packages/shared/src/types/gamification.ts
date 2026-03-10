import type { z } from "zod";
import type {
  streakSchema,
  achievementStatusSchema,
  revealStatusSchema,
  leaderboardEntrySchema,
  leaderboardCurrentUserSchema,
  leaderboardQuerySchema,
} from "../schemas/gamification.js";

export type StreakStatus = z.infer<typeof streakSchema>;
export type AchievementStatus = z.infer<typeof achievementStatusSchema>;
export type RevealStatus = z.infer<typeof revealStatusSchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardCurrentUser = z.infer<typeof leaderboardCurrentUserSchema>;
export type LeaderboardQuery = z.infer<typeof leaderboardQuerySchema>;
