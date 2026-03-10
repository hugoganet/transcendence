import { z } from "zod";
import { MAX_PAGE_SIZE, DEFAULT_PAGE_SIZE } from "../constants/tokens.js";

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

export const revealStatusSchema = z.object({
  tokensRevealed: z.boolean(),
  walletRevealed: z.boolean(),
  gasRevealed: z.boolean(),
  dashboardRevealed: z.boolean(),
});

export const leaderboardEntrySchema = z.object({
  rank: z.number().int().min(1),
  userId: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  missionsCompleted: z.number().int().min(0),
});

export const leaderboardCurrentUserSchema = z.object({
  rank: z.number().int().min(1).nullable(),
  userId: z.string(),
  displayName: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  missionsCompleted: z.number().int().min(0),
});

export const leaderboardQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
