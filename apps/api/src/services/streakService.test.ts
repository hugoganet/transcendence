import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (arg: unknown) => {
    // Support both interactive (callback) and batch (array) transactions
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => Promise<unknown>)(mockPrisma);
    }
    // Batch transaction: resolve the array of promises
    return Promise.all(arg as Promise<unknown>[]);
  }),
  user: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  userProgress: {
    count: vi.fn(),
  },
  chapterProgress: {
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

const { updateStreakWithClient, updateStreak, getStreak } =
  await import("./streakService.js");

import { minimalCurriculum, createMockContent } from "../__fixtures__/curriculum.js";
const setupContent = createMockContent(mockGetContent);

beforeEach(() => {
  vi.clearAllMocks();
  setupContent();
});

describe("updateStreakWithClient", () => {
  it("first mission ever → currentStreak=1, longestStreak=1", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 0,
      longestStreak: 0,
      lastMissionCompletedAt: null,
    });
    mockPrisma.user.update.mockResolvedValue({});

    await updateStreakWithClient(mockPrisma, "user-1");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        currentStreak: 1,
        longestStreak: 1,
        lastMissionCompletedAt: expect.any(Date),
      },
    });
  });

  it("second mission same day → currentStreak unchanged", async () => {
    const today = new Date();
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 1,
      longestStreak: 1,
      lastMissionCompletedAt: today,
    });
    mockPrisma.user.update.mockResolvedValue({});

    await updateStreakWithClient(mockPrisma, "user-1");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        lastMissionCompletedAt: expect.any(Date),
      },
    });
  });

  it("mission on consecutive day → currentStreak incremented", async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 3,
      longestStreak: 5,
      lastMissionCompletedAt: yesterday,
    });
    mockPrisma.user.update.mockResolvedValue({});

    await updateStreakWithClient(mockPrisma, "user-1");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        currentStreak: 4,
        longestStreak: 5,
        lastMissionCompletedAt: expect.any(Date),
      },
    });
  });

  it("mission after gap → currentStreak reset to 1, longestStreak preserved", async () => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 2,
      longestStreak: 5,
      lastMissionCompletedAt: threeDaysAgo,
    });
    mockPrisma.user.update.mockResolvedValue({});

    await updateStreakWithClient(mockPrisma, "user-1");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        longestStreak: 5,
        currentStreak: 1,
        lastMissionCompletedAt: expect.any(Date),
      },
    });
  });

  it("longestStreak updated when currentStreak exceeds it", async () => {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 5,
      longestStreak: 5,
      lastMissionCompletedAt: yesterday,
    });
    mockPrisma.user.update.mockResolvedValue({});

    await updateStreakWithClient(mockPrisma, "user-1");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        currentStreak: 6,
        longestStreak: 6,
        lastMissionCompletedAt: expect.any(Date),
      },
    });
  });

  it("gap resets streak but saves current if it was a new record", async () => {
    const fiveDaysAgo = new Date();
    fiveDaysAgo.setUTCDate(fiveDaysAgo.getUTCDate() - 5);
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 10,
      longestStreak: 7,
      lastMissionCompletedAt: fiveDaysAgo,
    });
    mockPrisma.user.update.mockResolvedValue({});

    await updateStreakWithClient(mockPrisma, "user-1");

    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: {
        longestStreak: 10,
        currentStreak: 1,
        lastMissionCompletedAt: expect.any(Date),
      },
    });
  });
});

describe("updateStreak", () => {
  it("wraps updateStreakWithClient in a transaction", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 0,
      longestStreak: 0,
      lastMissionCompletedAt: null,
    });
    mockPrisma.user.update.mockResolvedValue({});

    await updateStreak("user-1");

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    expect(mockPrisma.user.update).toHaveBeenCalled();
  });
});

describe("getStreak", () => {
  it("returns all zeros/null for new user", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 0,
      longestStreak: 0,
      lastMissionCompletedAt: null,
    });
    mockPrisma.userProgress.count.mockResolvedValue(0);
    mockPrisma.chapterProgress.findMany.mockResolvedValue([]);

    const result = await getStreak("user-1");

    expect(result).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      lastMissionCompletedAt: null,
      totalMissionsCompleted: 0,
      totalModulesMastered: 0,
    });
  });

  it("returns correct totalMissionsCompleted", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 3,
      longestStreak: 5,
      lastMissionCompletedAt: new Date("2026-03-10T14:00:00Z"),
    });
    mockPrisma.userProgress.count.mockResolvedValue(5);
    mockPrisma.chapterProgress.findMany.mockResolvedValue([]);

    const result = await getStreak("user-1");

    expect(result.totalMissionsCompleted).toBe(5);
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(5);
  });

  it("returns correct totalModulesMastered when a category is fully completed", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 2,
      longestStreak: 2,
      lastMissionCompletedAt: new Date("2026-03-10T14:00:00Z"),
    });
    mockPrisma.userProgress.count.mockResolvedValue(3);
    // Category 1 has chapter 1.1, category 2 has chapter 2.1
    // If chapter 1.1 is completed, category 1 is mastered
    mockPrisma.chapterProgress.findMany.mockResolvedValue([
      { chapterId: "1.1" },
    ]);

    const result = await getStreak("user-1");

    expect(result.totalModulesMastered).toBe(1);
  });

  it("does not count partially completed categories as mastered", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      currentStreak: 1,
      longestStreak: 1,
      lastMissionCompletedAt: new Date(),
    });
    mockPrisma.userProgress.count.mockResolvedValue(1);
    // No completed chapters
    mockPrisma.chapterProgress.findMany.mockResolvedValue([]);

    const result = await getStreak("user-1");

    expect(result.totalModulesMastered).toBe(0);
  });
});
