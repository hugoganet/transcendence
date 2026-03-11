import type { z } from "zod";
import type {
  publicProfileSchema,
  earnedAchievementSchema,
} from "../schemas/publicProfile.js";

export type PublicProfile = z.infer<typeof publicProfileSchema>;
export type EarnedAchievement = z.infer<typeof earnedAchievementSchema>;
