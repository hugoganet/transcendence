import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => Promise<unknown>)(mockPrisma);
    }
    return Promise.all(arg as Promise<unknown>[]);
  }),
  achievement: {
    findMany: vi.fn(),
  },
  userAchievement: {
    findMany: vi.fn(),
    createMany: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

const {
  checkAndAwardAchievementsWithClient,
  checkAndAwardAchievements,
  getAchievements,
} = await import("./achievementService.js");

const MOCK_ACHIEVEMENTS = [
  { id: "a1", code: "BLOCKCHAIN_BEGINNER", title: "Blockchain Beginner", description: "Complete Category 1", iconUrl: "", type: "MODULE_COMPLETION", threshold: 1, createdAt: new Date() },
  { id: "a2", code: "CRYPTO_CURIOUS", title: "Crypto Curious", description: "Complete Category 2", iconUrl: "", type: "MODULE_COMPLETION", threshold: 2, createdAt: new Date() },
  { id: "a3", code: "FIRST_TOKENS", title: "First Tokens", description: "Earn 10 tokens", iconUrl: "", type: "TOKEN_THRESHOLD", threshold: 10, createdAt: new Date() },
  { id: "a4", code: "TOKEN_COLLECTOR", title: "Token Collector", description: "Earn 50 tokens", iconUrl: "", type: "TOKEN_THRESHOLD", threshold: 50, createdAt: new Date() },
  { id: "a5", code: "GETTING_STARTED", title: "Getting Started", description: "3-day streak", iconUrl: "", type: "STREAK_TARGET", threshold: 3, createdAt: new Date() },
  { id: "a6", code: "WEEK_WARRIOR", title: "Week Warrior", description: "7-day streak", iconUrl: "", type: "STREAK_TARGET", threshold: 7, createdAt: new Date() },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockPrisma.achievement.findMany.mockResolvedValue(MOCK_ACHIEVEMENTS);
  mockPrisma.userAchievement.findMany.mockResolvedValue([]);
  mockPrisma.userAchievement.createMany.mockResolvedValue({ count: 0 });
});

describe("checkAndAwardAchievementsWithClient", () => {
  it("awards MODULE_COMPLETION when category is completed", async () => {
    const result = await checkAndAwardAchievementsWithClient(
      mockPrisma,
      "user-1",
      { categoryCompleted: 1, tokenBalance: 5, currentStreak: 1 },
    );

    expect(result).toEqual([
      { code: "BLOCKCHAIN_BEGINNER", title: "Blockchain Beginner", description: "Complete Category 1" },
    ]);
    expect(mockPrisma.userAchievement.createMany).toHaveBeenCalledWith({
      data: [{ userId: "user-1", achievementId: "a1" }],
      skipDuplicates: true,
    });
  });

  it("awards all qualifying TOKEN_THRESHOLD achievements", async () => {
    const result = await checkAndAwardAchievementsWithClient(
      mockPrisma,
      "user-1",
      { tokenBalance: 55, currentStreak: 1 },
    );

    expect(result).toEqual([
      { code: "FIRST_TOKENS", title: "First Tokens", description: "Earn 10 tokens" },
      { code: "TOKEN_COLLECTOR", title: "Token Collector", description: "Earn 50 tokens" },
    ]);
    expect(mockPrisma.userAchievement.createMany).toHaveBeenCalledWith({
      data: [
        { userId: "user-1", achievementId: "a3" },
        { userId: "user-1", achievementId: "a4" },
      ],
      skipDuplicates: true,
    });
  });

  it("awards STREAK_TARGET when streak reaches threshold", async () => {
    const result = await checkAndAwardAchievementsWithClient(
      mockPrisma,
      "user-1",
      { tokenBalance: 5, currentStreak: 3 },
    );

    expect(result).toEqual([
      { code: "GETTING_STARTED", title: "Getting Started", description: "3-day streak" },
    ]);
  });

  it("awards nothing when no criteria met", async () => {
    const result = await checkAndAwardAchievementsWithClient(
      mockPrisma,
      "user-1",
      { tokenBalance: 5, currentStreak: 1 },
    );

    expect(result).toEqual([]);
    expect(mockPrisma.userAchievement.createMany).not.toHaveBeenCalled();
  });

  it("skips already-earned achievements (idempotent)", async () => {
    mockPrisma.userAchievement.findMany.mockResolvedValue([
      { achievementId: "a3" },
    ]);

    const result = await checkAndAwardAchievementsWithClient(
      mockPrisma,
      "user-1",
      { tokenBalance: 55, currentStreak: 1 },
    );

    // Should only award TOKEN_COLLECTOR (a4), not FIRST_TOKENS (a3) which is already earned
    expect(result).toEqual([
      { code: "TOKEN_COLLECTOR", title: "Token Collector", description: "Earn 50 tokens" },
    ]);
    expect(mockPrisma.userAchievement.createMany).toHaveBeenCalledWith({
      data: [{ userId: "user-1", achievementId: "a4" }],
      skipDuplicates: true,
    });
  });

  it("awards multiple criteria at once", async () => {
    const result = await checkAndAwardAchievementsWithClient(
      mockPrisma,
      "user-1",
      { categoryCompleted: 1, tokenBalance: 55, currentStreak: 7 },
    );

    expect(result).toHaveLength(5); // BLOCKCHAIN_BEGINNER + FIRST_TOKENS + TOKEN_COLLECTOR + GETTING_STARTED + WEEK_WARRIOR
    expect(result.map((r) => r.code)).toEqual([
      "BLOCKCHAIN_BEGINNER",
      "FIRST_TOKENS",
      "TOKEN_COLLECTOR",
      "GETTING_STARTED",
      "WEEK_WARRIOR",
    ]);
  });
});

describe("checkAndAwardAchievements (standalone)", () => {
  it("wraps in a transaction", async () => {
    const result = await checkAndAwardAchievements(
      "user-1",
      { tokenBalance: 10, currentStreak: 1 },
    );

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(result).toEqual([
      { code: "FIRST_TOKENS", title: "First Tokens", description: "Earn 10 tokens" },
    ]);
  });
});

describe("getAchievements", () => {
  it("returns all achievements with earnedAt null for new user", async () => {
    mockPrisma.achievement.findMany.mockResolvedValue(
      MOCK_ACHIEVEMENTS.map((a) => ({ ...a, userAchievements: [] })),
    );

    const result = await getAchievements("user-1");

    expect(result).toHaveLength(6);
    expect(result.every((a) => a.earnedAt === null)).toBe(true);
    expect(result[0]).toMatchObject({
      id: "a1",
      code: "BLOCKCHAIN_BEGINNER",
      earnedAt: null,
    });
  });

  it("returns mix of earned and unearned achievements", async () => {
    const earnedAt = new Date("2026-03-10T14:30:00.000Z");
    mockPrisma.achievement.findMany.mockResolvedValue([
      { ...MOCK_ACHIEVEMENTS[0], userAchievements: [{ earnedAt }] },
      { ...MOCK_ACHIEVEMENTS[1], userAchievements: [] },
    ]);

    const result = await getAchievements("user-1");

    expect(result).toHaveLength(2);
    expect(result[0].earnedAt).toBe("2026-03-10T14:30:00.000Z");
    expect(result[1].earnedAt).toBeNull();
  });
});
