import type {
  StreakStatus,
  AchievementStatus,
  LeaderboardEntry,
  LeaderboardCurrentUser,
  PaginationMeta,
} from "@transcendence/shared";
import { api } from "./client.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const gamificationApi = {
  getStreak: () => api.get<StreakStatus>("/api/v1/gamification/streak"),

  getAchievements: () =>
    api.get<AchievementStatus[]>("/api/v1/gamification/achievements"),

  getLeaderboard: async (
    page = 1,
    pageSize = 20,
  ): Promise<{
    entries: LeaderboardEntry[];
    currentUser: LeaderboardCurrentUser;
    meta: PaginationMeta;
  }> => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(
      `${BASE_URL}/api/v1/gamification/leaderboard?${params}`,
      { credentials: "include" },
    );
    const json = await res.json();
    return {
      entries: json.data,
      currentUser: json.currentUser,
      meta: json.meta,
    };
  },
};
