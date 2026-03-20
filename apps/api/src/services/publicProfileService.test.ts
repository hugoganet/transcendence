import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => Promise<unknown>)(mockPrisma);
    }
    return Promise.all(arg as Promise<unknown>[]);
  }),
  user: {
    findUnique: vi.fn(),
  },
  userProgress: {
    count: vi.fn(),
  },
  userAchievement: {
    findMany: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

const mockGetContent = vi.hoisted(() => vi.fn());

vi.mock("../utils/contentLoader.js", () => ({
  getContent: mockGetContent,
}));

const { getPublicProfile } = await import("./publicProfileService.js");

import { createMockContent } from "../__fixtures__/curriculum.js";
const setupContent = createMockContent(mockGetContent);

beforeEach(() => {
  vi.clearAllMocks();
  setupContent();
});

describe("getPublicProfile", () => {
  const userId = "user-123";

  const mockUser = {
    id: userId,
    displayName: "Alice",
    avatarUrl: "https://example.com/avatar.jpg",
    currentStreak: 5,
  };

  const mockAchievements = [
    {
      id: "ua-1",
      userId,
      achievementId: "ach-1",
      earnedAt: new Date("2026-03-01T00:00:00.000Z"),
      achievement: {
        id: "ach-1",
        code: "FIRST_MISSION",
        title: "First Steps",
        description: "Complete your first mission",
        iconUrl: "/icons/first.svg",
        type: "STREAK_TARGET",
        threshold: 1,
        createdAt: new Date("2026-01-01"),
      },
    },
  ];

  it("returns correct public profile with all fields", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userProgress.count.mockResolvedValue(2);
    mockPrisma.userAchievement.findMany.mockResolvedValue(mockAchievements);

    const profile = await getPublicProfile(userId);

    expect(profile).toEqual({
      id: userId,
      displayName: "Alice",
      avatarUrl: "https://example.com/avatar.jpg",
      xp: 2,
      currentStreak: 5,
      achievements: [
        {
          id: "ach-1",
          code: "FIRST_MISSION",
          title: "First Steps",
          description: "Complete your first mission",
          iconUrl: "/icons/first.svg",
          earnedAt: "2026-03-01T00:00:00.000Z",
        },
      ],
      completionPercentage: 67, // Math.round(2/3 * 100) = 67
    });
  });

  it("xp equals count of COMPLETED missions", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userProgress.count.mockResolvedValue(1);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    const profile = await getPublicProfile(userId);

    expect(profile.xp).toBe(1);
  });

  it("achievements include only earned ones with correct shape", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userProgress.count.mockResolvedValue(0);
    mockPrisma.userAchievement.findMany.mockResolvedValue(mockAchievements);

    const profile = await getPublicProfile(userId);

    expect(profile.achievements).toHaveLength(1);
    expect(profile.achievements[0]).toEqual({
      id: "ach-1",
      code: "FIRST_MISSION",
      title: "First Steps",
      description: "Complete your first mission",
      iconUrl: "/icons/first.svg",
      earnedAt: "2026-03-01T00:00:00.000Z",
    });
  });

  it("completionPercentage is Math.round((completed / totalMissions) * 100)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userProgress.count.mockResolvedValue(1);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    const profile = await getPublicProfile(userId);

    // minimalCurriculum has 3 missions total → 1/3 * 100 = 33.33 → 33
    expect(profile.completionPercentage).toBe(33);
  });

  it("throws USER_NOT_FOUND for non-existent user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    mockPrisma.userProgress.count.mockResolvedValue(0);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    await expect(getPublicProfile("no-such-id")).rejects.toThrow("User not found");
    await expect(getPublicProfile("no-such-id")).rejects.toMatchObject({
      code: "USER_NOT_FOUND",
      statusCode: 404,
    });
  });

  it("does NOT include private fields in response", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userProgress.count.mockResolvedValue(0);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    const profile = await getPublicProfile(userId);

    // Verify no private fields leak
    const profileKeys = Object.keys(profile);
    expect(profileKeys).not.toContain("email");
    expect(profileKeys).not.toContain("tokenBalance");
    expect(profileKeys).not.toContain("passwordHash");
    expect(profileKeys).not.toContain("twoFactorSecret");
    expect(profileKeys).not.toContain("twoFactorEnabled");
    expect(profileKeys).not.toContain("locale");
    expect(profileKeys).not.toContain("ageConfirmed");
    expect(profileKeys).not.toContain("disclaimerAcceptedAt");
    expect(profileKeys).not.toContain("revealTokens");
    expect(profileKeys).not.toContain("revealWallet");
    expect(profileKeys).not.toContain("revealGas");
    expect(profileKeys).not.toContain("revealDashboard");
  });

  it("user with zero progress returns xp=0, currentStreak=0, achievements=[], completionPercentage=0", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: userId,
      displayName: null,
      avatarUrl: null,
      currentStreak: 0,
    });
    mockPrisma.userProgress.count.mockResolvedValue(0);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    const profile = await getPublicProfile(userId);

    expect(profile.xp).toBe(0);
    expect(profile.currentStreak).toBe(0);
    expect(profile.achievements).toEqual([]);
    expect(profile.completionPercentage).toBe(0);
  });

  it("uses prisma.$transaction for snapshot consistency", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userProgress.count.mockResolvedValue(0);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);

    await getPublicProfile(userId);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
