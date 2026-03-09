import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
    return callback(mockPrisma);
  }),
  userProgress: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    count: vi.fn(),
    upsert: vi.fn(),
  },
  chapterProgress: {
    findMany: vi.fn(),
    upsert: vi.fn(),
  },
  selfAssessment: {
    upsert: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

const mockGetContent = vi.hoisted(() => vi.fn());

vi.mock("../utils/contentLoader.js", () => ({
  getContent: mockGetContent,
}));

const { getCurriculumWithProgress, getMissionDetail, getMissionAccessStatus, completeMission, getResumePoint } =
  await import("./curriculumService.js");

import { createMockContent } from "../__fixtures__/curriculum.js";
const setupContent = createMockContent(mockGetContent);

beforeEach(() => {
  vi.clearAllMocks();
  setupContent();
  // Defaults for targeted access checks
  mockPrisma.userProgress.findUnique.mockResolvedValue(null);
  mockPrisma.userProgress.count.mockResolvedValue(0);
});

describe("getCurriculumWithProgress", () => {
  it("new user with no progress: returns 1.1.1 as available, all else locked, 0%", async () => {
    mockPrisma.userProgress.findMany.mockResolvedValue([]);
    mockPrisma.chapterProgress.findMany.mockResolvedValue([]);

    const result = await getCurriculumWithProgress("user-1");

    expect(result.completedMissions).toBe(0);
    expect(result.totalMissions).toBe(3); // 2 + 1
    expect(result.completionPercentage).toBe(0);

    // Category 1 is available
    expect(result.categories[0].status).toBe("available");
    // Chapter 1.1 is available
    expect(result.categories[0].chapters[0].status).toBe("available");
    // Mission 1.1.1 is available
    expect(result.categories[0].chapters[0].missions[0].status).toBe(
      "available",
    );
    // Mission 1.1.2 is locked (prev not completed)
    expect(result.categories[0].chapters[0].missions[1].status).toBe("locked");

    // Category 2 is locked (cat 1's last chapter not completed)
    expect(result.categories[1].status).toBe("locked");
    expect(result.categories[1].chapters[0].status).toBe("locked");
    expect(result.categories[1].chapters[0].missions[0].status).toBe("locked");
  });

  it("user with some completed missions: correct unlock cascade and completion %", async () => {
    mockPrisma.userProgress.findMany.mockResolvedValue([
      {
        missionId: "1.1.1",
        status: "COMPLETED",
        completedAt: new Date("2026-03-01"),
      },
    ]);
    mockPrisma.chapterProgress.findMany.mockResolvedValue([]);

    const result = await getCurriculumWithProgress("user-1");

    expect(result.completedMissions).toBe(1);
    expect(result.completionPercentage).toBe(33.3); // 1/3 * 100 rounded to 1 decimal

    // Mission 1.1.1 is completed
    expect(result.categories[0].chapters[0].missions[0].status).toBe(
      "completed",
    );
    // Mission 1.1.2 is now available (prev completed)
    expect(result.categories[0].chapters[0].missions[1].status).toBe(
      "available",
    );
    // Chapter 1.1 is in progress
    expect(result.categories[0].chapters[0].status).toBe("inProgress");
  });

  it("user who completed all of chapter 1.1: chapter 1.1 completed, next unlocked", async () => {
    mockPrisma.userProgress.findMany.mockResolvedValue([
      { missionId: "1.1.1", status: "COMPLETED", completedAt: new Date() },
      { missionId: "1.1.2", status: "COMPLETED", completedAt: new Date() },
    ]);
    mockPrisma.chapterProgress.findMany.mockResolvedValue([]);

    const result = await getCurriculumWithProgress("user-1");

    expect(result.completedMissions).toBe(2);
    // Chapter 1.1 completed (all missions done)
    expect(result.categories[0].chapters[0].status).toBe("completed");
    // Category 2 becomes available (cat 1's last chapter completed)
    expect(result.categories[1].status).toBe("available");
    expect(result.categories[1].chapters[0].status).toBe("available");
    expect(result.categories[1].chapters[0].missions[0].status).toBe(
      "available",
    );
  });

  it("respects ChapterProgress row for completed chapters", async () => {
    mockPrisma.userProgress.findMany.mockResolvedValue([
      { missionId: "1.1.1", status: "COMPLETED", completedAt: new Date() },
      { missionId: "1.1.2", status: "COMPLETED", completedAt: new Date() },
    ]);
    mockPrisma.chapterProgress.findMany.mockResolvedValue([
      {
        chapterId: "1.1",
        status: "COMPLETED",
        completedAt: new Date("2026-03-05"),
      },
    ]);

    const result = await getCurriculumWithProgress("user-1");

    expect(result.categories[0].chapters[0].status).toBe("completed");
    expect(result.categories[0].chapters[0].completedAt).not.toBeNull();
  });
});

describe("getMissionAccessStatus", () => {
  it("returns 'available' for first mission (1.1.1) of new user", async () => {
    const status = await getMissionAccessStatus("user-1", "1.1.1");
    expect(status).toBe("available");
  });

  it("returns 'completed' when user has completed the mission", async () => {
    mockPrisma.userProgress.findUnique.mockResolvedValue({
      status: "COMPLETED",
    });
    const status = await getMissionAccessStatus("user-1", "1.1.1");
    expect(status).toBe("completed");
  });

  it("returns 'inProgress' when user has started the mission", async () => {
    mockPrisma.userProgress.findUnique.mockResolvedValue({
      status: "IN_PROGRESS",
    });
    const status = await getMissionAccessStatus("user-1", "1.1.1");
    expect(status).toBe("inProgress");
  });

  it("returns 'locked' for second mission when first is not completed", async () => {
    // findUnique for 1.1.2 → null (no progress), then findUnique for prev mission 1.1.1 → null
    mockPrisma.userProgress.findUnique.mockResolvedValue(null);
    const status = await getMissionAccessStatus("user-1", "1.1.2");
    expect(status).toBe("locked");
  });

  it("returns 'available' for second mission when first is completed", async () => {
    mockPrisma.userProgress.findUnique
      .mockResolvedValueOnce(null) // 1.1.2 direct progress → none
      .mockResolvedValueOnce({ status: "COMPLETED" }); // prev mission 1.1.1 → completed
    const status = await getMissionAccessStatus("user-1", "1.1.2");
    expect(status).toBe("available");
  });

  it("returns 'locked' for mission in non-first category when prev category incomplete", async () => {
    // findUnique for 2.1.1 → null, count for prev category's last chapter → 0
    mockPrisma.userProgress.findUnique.mockResolvedValue(null);
    mockPrisma.userProgress.count.mockResolvedValue(0);
    const status = await getMissionAccessStatus("user-1", "2.1.1");
    expect(status).toBe("locked");
  });

  it("returns 'available' for mission in non-first category when prev category completed", async () => {
    mockPrisma.userProgress.findUnique.mockResolvedValue(null);
    mockPrisma.userProgress.count.mockResolvedValue(2); // both missions in chapter 1.1 completed
    const status = await getMissionAccessStatus("user-1", "2.1.1");
    expect(status).toBe("available");
  });
});

describe("getMissionDetail", () => {
  it("returns full content for available mission", async () => {
    // 1.1.1 is first mission → always available (findUnique returns null)
    const result = await getMissionDetail("user-1", "1.1.1", "en");

    expect(result.id).toBe("1.1.1");
    expect(result.title).toBe("Who Do You Trust?");
    expect(result.description).toBe("Explore trust in transactions");
    expect(result.learningObjective).toBe("Understand middlemen");
    expect(result.exerciseType).toBe("SI");
    expect(result.estimatedMinutes).toBe(3);
    expect(result.status).toBe("available");
    expect(result.exerciseContent).toBeDefined();
  });

  it("throws 403 MISSION_LOCKED for locked mission", async () => {
    // 1.1.2: findUnique → null (no direct progress), prev mission 1.1.1 findUnique → null (not completed)
    await expect(
      getMissionDetail("user-1", "1.1.2", "en"),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 403,
        code: "MISSION_LOCKED",
      }),
    );
  });

  it("throws 404 MISSION_NOT_FOUND for non-existent mission", async () => {
    await expect(
      getMissionDetail("user-1", "99.99.99", "en"),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 404,
        code: "MISSION_NOT_FOUND",
      }),
    );
  });

  it("falls back to 'en' locale when requested locale unavailable", async () => {
    const result = await getMissionDetail("user-1", "1.1.1", "fr");
    // Should fall back to English content
    expect(result.title).toBe("Who Do You Trust?");
  });

  it("returns completed mission with correct status", async () => {
    mockPrisma.userProgress.findUnique.mockResolvedValue({
      status: "COMPLETED",
      completedAt: new Date(),
    });

    const result = await getMissionDetail("user-1", "1.1.1", "en");
    expect(result.status).toBe("completed");
  });

  it("throws 403 for mission in locked category", async () => {
    // 2.1.1: findUnique → null, count prev category missions → 0 (not completed)
    await expect(
      getMissionDetail("user-1", "2.1.1", "en"),
    ).rejects.toThrow(
      expect.objectContaining({
        statusCode: 403,
        code: "MISSION_LOCKED",
      }),
    );
  });
});

describe("completeMission", () => {
  beforeEach(() => {
    mockPrisma.userProgress.upsert.mockResolvedValue({});
    mockPrisma.chapterProgress.upsert.mockResolvedValue({});
    mockPrisma.selfAssessment.upsert.mockResolvedValue({});
  });

  it("completes first mission (1.1.1): creates UserProgress, returns next mission 1.1.2", async () => {
    // getMissionAccessStatus: findUnique → null (no progress), first mission → available
    mockPrisma.userProgress.findUnique.mockResolvedValue(null);
    // count completed missions in chapter after upsert (within transaction)
    mockPrisma.userProgress.count.mockResolvedValueOnce(1); // 1 of 2 missions done → chapter not complete
    // count total completed missions for percentage
    mockPrisma.userProgress.count.mockResolvedValueOnce(1);

    const result = await completeMission("user-1", "1.1.1");

    expect(result.missionId).toBe("1.1.1");
    expect(result.status).toBe("completed");
    expect(result.chapterCompleted).toBe(false);
    expect(result.categoryCompleted).toBe(false);
    expect(result.nextMissionId).toBe("1.1.2");
    expect(result.progressiveReveal).toBeNull();
    expect(mockPrisma.userProgress.upsert).toHaveBeenCalled();
  });

  it("completes last mission in chapter: marks chapter completed", async () => {
    mockPrisma.userProgress.findUnique
      .mockResolvedValueOnce(null) // direct progress on 1.1.2 → none
      .mockResolvedValueOnce({ status: "COMPLETED" }); // prev mission 1.1.1 → completed (for access check)
    // count completed missions in chapter after upsert = all 2
    mockPrisma.userProgress.count.mockResolvedValueOnce(2);
    // count total completed missions for percentage
    mockPrisma.userProgress.count.mockResolvedValueOnce(2);
    // isCategoryComplete: check all chapters completed
    mockPrisma.chapterProgress.findMany.mockResolvedValue([
      { chapterId: "1.1", status: "COMPLETED" },
    ]);

    const result = await completeMission("user-1", "1.1.2");

    expect(result.chapterCompleted).toBe(true);
    expect(result.nextMissionId).toBe("2.1.1");
    expect(mockPrisma.chapterProgress.upsert).toHaveBeenCalled();
  });

  it("completes last mission in category: categoryCompleted = true", async () => {
    mockPrisma.userProgress.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: "COMPLETED" });
    // count completed missions in chapter after upsert = all 2
    mockPrisma.userProgress.count.mockResolvedValueOnce(2);
    // count total completed for percentage
    mockPrisma.userProgress.count.mockResolvedValueOnce(2);
    // isCategoryComplete: all chapters in category 1 completed
    mockPrisma.chapterProgress.findMany.mockResolvedValue([
      { chapterId: "1.1", status: "COMPLETED" },
    ]);

    const result = await completeMission("user-1", "1.1.2");

    expect(result.categoryCompleted).toBe(true);
  });

  it("completes mission with progressive reveal trigger: returns reveal object", async () => {
    // 1.1.2 has progressiveReveal in our updated fixture
    mockPrisma.userProgress.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: "COMPLETED" });
    mockPrisma.userProgress.count.mockResolvedValueOnce(2);
    mockPrisma.userProgress.count.mockResolvedValueOnce(2);
    mockPrisma.chapterProgress.findMany.mockResolvedValue([
      { chapterId: "1.1", status: "COMPLETED" },
    ]);

    const result = await completeMission("user-1", "1.1.2");

    expect(result.progressiveReveal).toEqual({
      mechanic: "tokensRevealed",
      description: "You've unlocked Knowledge Tokens!",
    });
  });

  it("throws 403 MISSION_LOCKED for locked mission", async () => {
    // 2.1.1 is locked because category 1 not completed
    mockPrisma.userProgress.findUnique.mockResolvedValue(null);
    mockPrisma.userProgress.count.mockResolvedValue(0);

    await expect(completeMission("user-1", "2.1.1")).rejects.toThrow(
      expect.objectContaining({
        statusCode: 403,
        code: "MISSION_LOCKED",
      }),
    );
  });

  it("throws 409 MISSION_ALREADY_COMPLETED for already completed mission", async () => {
    mockPrisma.userProgress.findUnique.mockResolvedValue({
      status: "COMPLETED",
    });

    await expect(completeMission("user-1", "1.1.1")).rejects.toThrow(
      expect.objectContaining({
        statusCode: 409,
        code: "MISSION_ALREADY_COMPLETED",
      }),
    );
  });

  it("throws 404 MISSION_NOT_FOUND for non-existent mission", async () => {
    await expect(completeMission("user-1", "99.99.99")).rejects.toThrow(
      expect.objectContaining({
        statusCode: 404,
        code: "MISSION_NOT_FOUND",
      }),
    );
  });

  it("completes with confidenceRating on self-assessment mission: creates SelfAssessment record", async () => {
    // 1.1.2 is the last mission of category 1 (self-assessment mission)
    mockPrisma.userProgress.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ status: "COMPLETED" });
    mockPrisma.userProgress.count.mockResolvedValueOnce(2); // chapter: 2/2
    mockPrisma.userProgress.count.mockResolvedValueOnce(2); // total
    mockPrisma.chapterProgress.findMany.mockResolvedValue([
      { chapterId: "1.1", status: "COMPLETED" },
    ]);

    await completeMission("user-1", "1.1.2", 4);

    expect(mockPrisma.selfAssessment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_categoryId: { userId: "user-1", categoryId: "1" } },
        update: { confidenceRating: 4 },
        create: expect.objectContaining({
          userId: "user-1",
          categoryId: "1",
          confidenceRating: 4,
        }),
      }),
    );
  });

  it("ignores confidenceRating for non-self-assessment mission", async () => {
    // 1.1.1 is NOT the last mission of category 1 → confidenceRating should be ignored
    mockPrisma.userProgress.findUnique.mockResolvedValue(null);
    mockPrisma.userProgress.count.mockResolvedValueOnce(1); // chapter: 1/2
    mockPrisma.userProgress.count.mockResolvedValueOnce(1); // total

    await completeMission("user-1", "1.1.1", 4);

    expect(mockPrisma.selfAssessment.upsert).not.toHaveBeenCalled();
  });

  it("completes final curriculum mission (2.1.1 in fixture): nextMissionId = null", async () => {
    // In our minimal fixture, 2.1.1 is the last mission
    mockPrisma.userProgress.findUnique.mockResolvedValue(null);
    mockPrisma.userProgress.count.mockResolvedValueOnce(2); // prev category completed (for access)
    mockPrisma.userProgress.count.mockResolvedValueOnce(1); // chapter missions completed
    mockPrisma.userProgress.count.mockResolvedValueOnce(3); // total completed
    mockPrisma.chapterProgress.findMany.mockResolvedValue([
      { chapterId: "2.1", status: "COMPLETED" },
    ]);

    const result = await completeMission("user-1", "2.1.1");

    expect(result.nextMissionId).toBeNull();
  });
});

describe("getResumePoint", () => {
  it("new user (no progress): returns mission 1.1.1", async () => {
    mockPrisma.userProgress.findFirst.mockResolvedValue(null);
    mockPrisma.userProgress.count.mockResolvedValue(0);

    const result = await getResumePoint("user-1", "en");

    expect(result).not.toBeNull();
    expect(result!.missionId).toBe("1.1.1");
    expect(result!.chapterId).toBe("1.1");
    expect(result!.categoryId).toBe("1");
    expect(result!.completionPercentage).toBe(0);
  });

  it("user with some progress: returns next mission after last completed", async () => {
    mockPrisma.userProgress.findFirst.mockResolvedValue({
      missionId: "1.1.1",
      completedAt: new Date("2026-03-05"),
    });
    mockPrisma.userProgress.count.mockResolvedValue(1);

    const result = await getResumePoint("user-1", "en");

    expect(result).not.toBeNull();
    expect(result!.missionId).toBe("1.1.2");
    expect(result!.missionTitle).toBe("What Could Go Wrong?");
  });

  it("user who completed everything: returns null", async () => {
    mockPrisma.userProgress.findFirst.mockResolvedValue({
      missionId: "2.1.1",
      completedAt: new Date("2026-03-05"),
    });
    mockPrisma.userProgress.count.mockResolvedValue(3);

    const result = await getResumePoint("user-1", "en");

    expect(result).toBeNull();
  });

  it("locale-aware: returns titles in requested locale", async () => {
    mockPrisma.userProgress.findFirst.mockResolvedValue(null);
    mockPrisma.userProgress.count.mockResolvedValue(0);

    // Default fixture only has 'en', so 'fr' falls back to 'en'
    const result = await getResumePoint("user-1", "fr");

    expect(result).not.toBeNull();
    expect(result!.missionTitle).toBe("Who Do You Trust?");
  });
});
