import { describe, it, expect } from "vitest";
import {
  streakSchema,
  achievementStatusSchema,
  achievementsResponseSchema,
  leaderboardEntrySchema,
  leaderboardCurrentUserSchema,
  leaderboardQuerySchema,
} from "./gamification.js";

describe("streakSchema", () => {
  it("accepts valid streak data", () => {
    const data = {
      currentStreak: 5,
      longestStreak: 12,
      lastMissionCompletedAt: "2026-03-10T14:30:00.000Z",
      totalMissionsCompleted: 23,
      totalModulesMastered: 2,
    };
    expect(streakSchema.parse(data)).toEqual(data);
  });

  it("accepts new user with all zeros and null", () => {
    const data = {
      currentStreak: 0,
      longestStreak: 0,
      lastMissionCompletedAt: null,
      totalMissionsCompleted: 0,
      totalModulesMastered: 0,
    };
    expect(streakSchema.parse(data)).toEqual(data);
  });

  it("rejects negative currentStreak", () => {
    const data = {
      currentStreak: -1,
      longestStreak: 0,
      lastMissionCompletedAt: null,
      totalMissionsCompleted: 0,
      totalModulesMastered: 0,
    };
    expect(() => streakSchema.parse(data)).toThrow();
  });

  it("rejects non-integer values", () => {
    const data = {
      currentStreak: 1.5,
      longestStreak: 0,
      lastMissionCompletedAt: null,
      totalMissionsCompleted: 0,
      totalModulesMastered: 0,
    };
    expect(() => streakSchema.parse(data)).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => streakSchema.parse({})).toThrow();
    expect(() => streakSchema.parse({ currentStreak: 0 })).toThrow();
  });
});

describe("achievementStatusSchema", () => {
  const validAchievement = {
    id: "clxyz123",
    code: "BLOCKCHAIN_BEGINNER",
    title: "Blockchain Beginner",
    description: "Complete Category 1: Blockchain Foundations",
    iconUrl: "",
    type: "MODULE_COMPLETION",
    threshold: 1,
    earnedAt: "2026-03-10T14:30:00.000Z",
  };

  it("accepts valid earned achievement", () => {
    expect(achievementStatusSchema.parse(validAchievement)).toEqual(validAchievement);
  });

  it("accepts unearned achievement with earnedAt null", () => {
    const unearned = { ...validAchievement, earnedAt: null };
    expect(achievementStatusSchema.parse(unearned)).toEqual(unearned);
  });

  it("rejects missing required fields", () => {
    expect(() => achievementStatusSchema.parse({})).toThrow();
    expect(() => achievementStatusSchema.parse({ id: "x" })).toThrow();
  });

  it("rejects non-integer threshold", () => {
    expect(() =>
      achievementStatusSchema.parse({ ...validAchievement, threshold: 1.5 }),
    ).toThrow();
  });

  it("rejects invalid datetime for earnedAt", () => {
    expect(() =>
      achievementStatusSchema.parse({ ...validAchievement, earnedAt: "not-a-date" }),
    ).toThrow();
  });

  it("rejects invalid type value", () => {
    expect(() =>
      achievementStatusSchema.parse({ ...validAchievement, type: "INVALID_TYPE" }),
    ).toThrow();
  });

  it("accepts all valid type values", () => {
    for (const type of ["MODULE_COMPLETION", "TOKEN_THRESHOLD", "STREAK_TARGET"]) {
      expect(achievementStatusSchema.parse({ ...validAchievement, type })).toBeDefined();
    }
  });
});

describe("achievementsResponseSchema", () => {
  it("accepts array of achievement statuses", () => {
    const data = [
      {
        id: "a1",
        code: "BLOCKCHAIN_BEGINNER",
        title: "Blockchain Beginner",
        description: "Complete Category 1",
        iconUrl: "",
        type: "MODULE_COMPLETION",
        threshold: 1,
        earnedAt: "2026-03-10T14:30:00.000Z",
      },
      {
        id: "a2",
        code: "CRYPTO_CURIOUS",
        title: "Crypto Curious",
        description: "Complete Category 2",
        iconUrl: "",
        type: "MODULE_COMPLETION",
        threshold: 2,
        earnedAt: null,
      },
    ];
    expect(achievementsResponseSchema.parse(data)).toEqual(data);
  });

  it("accepts empty array", () => {
    expect(achievementsResponseSchema.parse([])).toEqual([]);
  });
});

describe("leaderboardEntrySchema", () => {
  const validEntry = {
    rank: 1,
    userId: "uuid-1",
    displayName: "Alice",
    avatarUrl: "/uploads/avatars/uuid-1.jpg",
    missionsCompleted: 45,
  };

  it("accepts valid leaderboard entry", () => {
    expect(leaderboardEntrySchema.parse(validEntry)).toEqual(validEntry);
  });

  it("accepts entry with null displayName and avatarUrl", () => {
    const entry = { ...validEntry, displayName: null, avatarUrl: null };
    expect(leaderboardEntrySchema.parse(entry)).toEqual(entry);
  });

  it("rejects rank less than 1", () => {
    expect(() => leaderboardEntrySchema.parse({ ...validEntry, rank: 0 })).toThrow();
  });

  it("rejects negative missionsCompleted", () => {
    expect(() => leaderboardEntrySchema.parse({ ...validEntry, missionsCompleted: -1 })).toThrow();
  });

  it("rejects non-integer rank", () => {
    expect(() => leaderboardEntrySchema.parse({ ...validEntry, rank: 1.5 })).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => leaderboardEntrySchema.parse({})).toThrow();
    expect(() => leaderboardEntrySchema.parse({ rank: 1 })).toThrow();
  });
});

describe("leaderboardCurrentUserSchema", () => {
  const validCurrentUser = {
    rank: 5,
    userId: "uuid-current",
    displayName: "CurrentUser",
    avatarUrl: null,
    missionsCompleted: 23,
  };

  it("accepts valid current user with rank", () => {
    expect(leaderboardCurrentUserSchema.parse(validCurrentUser)).toEqual(validCurrentUser);
  });

  it("accepts current user with null rank (not active this week)", () => {
    const user = { ...validCurrentUser, rank: null };
    expect(leaderboardCurrentUserSchema.parse(user)).toEqual(user);
  });

  it("accepts current user with null displayName and avatarUrl", () => {
    const user = { ...validCurrentUser, displayName: null, avatarUrl: null };
    expect(leaderboardCurrentUserSchema.parse(user)).toEqual(user);
  });

  it("rejects rank less than 1 when not null", () => {
    expect(() => leaderboardCurrentUserSchema.parse({ ...validCurrentUser, rank: 0 })).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => leaderboardCurrentUserSchema.parse({})).toThrow();
  });
});

describe("leaderboardQuerySchema", () => {
  it("parses valid page and pageSize", () => {
    const result = leaderboardQuerySchema.parse({ page: "2", pageSize: "10" });
    expect(result).toEqual({ page: 2, pageSize: 10 });
  });

  it("applies defaults when no params provided", () => {
    const result = leaderboardQuerySchema.parse({});
    expect(result).toEqual({ page: 1, pageSize: 20 });
  });

  it("coerces string values to numbers", () => {
    const result = leaderboardQuerySchema.parse({ page: "3", pageSize: "50" });
    expect(result.page).toBe(3);
    expect(result.pageSize).toBe(50);
  });

  it("rejects page less than 1", () => {
    expect(() => leaderboardQuerySchema.parse({ page: "0" })).toThrow();
  });

  it("rejects pageSize greater than MAX_PAGE_SIZE (100)", () => {
    expect(() => leaderboardQuerySchema.parse({ pageSize: "101" })).toThrow();
  });

  it("rejects pageSize less than 1", () => {
    expect(() => leaderboardQuerySchema.parse({ pageSize: "0" })).toThrow();
  });
});
