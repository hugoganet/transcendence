import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  userProgress: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
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

const { getCurriculumWithProgress, getMissionDetail, getMissionAccessStatus } =
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
