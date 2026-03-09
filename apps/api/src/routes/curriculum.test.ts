import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

// Mock database
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

// Mock session (required by authService import chain)
vi.mock("../config/session.js", () => ({
  sessionRedisClient: { scan: vi.fn(), get: vi.fn(), del: vi.fn() },
  sessionMiddleware: vi.fn(),
}));

// Mock email service
vi.mock("../services/emailService.js", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

// Mock totpCrypto
vi.mock("../utils/totpCrypto.js", () => ({
  encryptTotpSecret: vi.fn(),
  decryptTotpSecret: vi.fn(),
}));

// Mock sharp and fs (required by userService import chain)
vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

// Mock contentLoader
const mockGetContent = vi.hoisted(() => vi.fn());
vi.mock("../utils/contentLoader.js", () => ({
  getContent: mockGetContent,
  initializeContent: vi.fn(),
  loadCurriculum: vi.fn(),
  loadMissions: vi.fn(),
  loadTooltips: vi.fn(),
  loadUIStrings: vi.fn(),
  getStaleContent: vi.fn(),
}));

const { curriculumRouter } = await import("./curriculum.js");

import { createMockContent } from "../__fixtures__/curriculum.js";
const setupContent = createMockContent(mockGetContent);

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  displayName: null,
  bio: null,
  avatarUrl: null,
  locale: "en",
  ageConfirmed: true,
  twoFactorEnabled: false,
  disclaimerAcceptedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  passwordHash: "hashed",
  authProvider: "LOCAL" as const,
  twoFactorSecret: null,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

function createTestApp(authenticated = false, user = mockUser) {
  const app = express();
  app.use(express.json());
  app.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
    }),
  );
  app.use(passport.initialize());
  app.use(passport.session());

  if (authenticated) {
    app.use((req, _res, next) => {
      req.user = user as Express.User;
      req.isAuthenticated = () => true;
      next();
    });
  }

  app.use("/api/v1/curriculum", curriculumRouter);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  setupContent();
  mockPrisma.userProgress.findMany.mockResolvedValue([]);
  mockPrisma.chapterProgress.findMany.mockResolvedValue([]);
  mockPrisma.userProgress.findUnique.mockResolvedValue(null);
  mockPrisma.userProgress.findFirst.mockResolvedValue(null);
  mockPrisma.userProgress.count.mockResolvedValue(0);
  mockPrisma.userProgress.upsert.mockResolvedValue({});
  mockPrisma.chapterProgress.upsert.mockResolvedValue({});
  mockPrisma.selfAssessment.upsert.mockResolvedValue({});
});

describe("Curriculum Routes", () => {
  describe("GET /api/v1/curriculum", () => {
    it("returns 200 with curriculum + 0% completion for new user", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum");

      expect(res.status).toBe(200);
      expect(res.body.data.completionPercentage).toBe(0);
      expect(res.body.data.completedMissions).toBe(0);
      expect(res.body.data.categories).toHaveLength(2);
      expect(res.body.data.categories[0].categoryId).toBe("1");
      expect(res.body.data.categories[1].categoryId).toBe("2");
      expect(res.body.data.categories[1].status).toBe("locked");
    });

    it("returns 200 with correct unlock states for user with progress", async () => {
      mockPrisma.userProgress.findMany.mockResolvedValue([
        { missionId: "1.1.1", status: "COMPLETED", completedAt: new Date() },
      ]);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum");

      expect(res.status).toBe(200);
      expect(res.body.data.completedMissions).toBe(1);
      const chapter = res.body.data.categories[0].chapters[0];
      expect(chapter.missions[0].status).toBe("completed");
      expect(chapter.missions[1].status).toBe("available");
    });

    it("returns 200 with cross-category unlock when previous category completed", async () => {
      mockPrisma.userProgress.findMany.mockResolvedValue([
        { missionId: "1.1.1", status: "COMPLETED", completedAt: new Date() },
        { missionId: "1.1.2", status: "COMPLETED", completedAt: new Date() },
      ]);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum");

      expect(res.status).toBe(200);
      expect(res.body.data.completedMissions).toBe(2);
      // Category 1 fully completed
      expect(res.body.data.categories[0].chapters[0].status).toBe("completed");
      // Category 2 should now be available
      expect(res.body.data.categories[1].status).toBe("available");
      expect(res.body.data.categories[1].chapters[0].status).toBe("available");
      expect(res.body.data.categories[1].chapters[0].missions[0].status).toBe(
        "available",
      );
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/curriculum");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/curriculum/missions/:missionId", () => {
    it("returns 200 with mission content for available mission (new user, 1.1.1)", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum/missions/1.1.1");

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe("1.1.1");
      expect(res.body.data.title).toBe("Who Do You Trust?");
      expect(res.body.data.exerciseType).toBe("SI");
      expect(res.body.data.exerciseContent).toBeDefined();
    });

    it("returns 403 MISSION_LOCKED for locked mission (new user, 1.1.2)", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum/missions/1.1.2");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("MISSION_LOCKED");
    });

    it("returns 404 MISSION_NOT_FOUND for non-existent mission", async () => {
      const app = createTestApp(true);
      const res = await request(app).get(
        "/api/v1/curriculum/missions/99.99.99",
      );

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("MISSION_NOT_FOUND");
    });

    it("returns 400 INVALID_INPUT for invalid mission ID format", async () => {
      const app = createTestApp(true);
      const res = await request(app).get(
        "/api/v1/curriculum/missions/invalid",
      );

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/curriculum/missions/1.1.1");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 403 MISSION_LOCKED for mission in locked category", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum/missions/2.1.1");

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("MISSION_LOCKED");
    });
  });

  describe("POST /api/v1/curriculum/missions/:missionId/complete", () => {
    it("returns 200 with CompleteMissionResponse for valid completion", async () => {
      // 1.1.1 is first mission, always available
      mockPrisma.userProgress.count.mockResolvedValueOnce(1); // chapter check: 1 of 2
      mockPrisma.userProgress.count.mockResolvedValueOnce(1); // total completed

      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.missionId).toBe("1.1.1");
      expect(res.body.data.status).toBe("completed");
      expect(res.body.data.nextMissionId).toBe("1.1.2");
      expect(res.body.data.chapterCompleted).toBe(false);
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app)
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({});

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 403 MISSION_LOCKED for locked mission", async () => {
      // 2.1.1 is locked (category 1 not completed)
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/curriculum/missions/2.1.1/complete")
        .send({});

      expect(res.status).toBe(403);
      expect(res.body.error.code).toBe("MISSION_LOCKED");
    });

    it("returns 409 MISSION_ALREADY_COMPLETED for already completed mission", async () => {
      mockPrisma.userProgress.findUnique.mockResolvedValue({
        status: "COMPLETED",
      });

      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({});

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("MISSION_ALREADY_COMPLETED");
    });

    it("returns 404 MISSION_NOT_FOUND for non-existent mission", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/curriculum/missions/99.99.99/complete")
        .send({});

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("MISSION_NOT_FOUND");
    });

    it("returns 400 INVALID_INPUT for invalid mission ID format", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/curriculum/missions/invalid/complete")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });

    it("stores confidenceRating for self-assessment mission", async () => {
      // 1.1.2 is the last mission of category 1 (self-assessment)
      mockPrisma.userProgress.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ status: "COMPLETED" });
      mockPrisma.userProgress.count.mockResolvedValueOnce(2); // chapter: 2/2
      mockPrisma.userProgress.count.mockResolvedValueOnce(2); // total
      mockPrisma.chapterProgress.findMany.mockResolvedValue([
        { chapterId: "1.1", status: "COMPLETED" },
      ]);

      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({ confidenceRating: 4 });

      expect(res.status).toBe(200);
      expect(mockPrisma.selfAssessment.upsert).toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/curriculum/chain", () => {
    it("returns 200 with blocks for authenticated user with completions", async () => {
      mockPrisma.userProgress.findMany.mockResolvedValue([
        { missionId: "1.1.1", completedAt: new Date("2026-03-01T10:00:00Z") },
        { missionId: "1.1.2", completedAt: new Date("2026-03-02T10:00:00Z") },
      ]);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum/chain");

      expect(res.status).toBe(200);
      expect(res.body.data.totalBlocks).toBe(2);
      expect(res.body.data.blocks).toHaveLength(2);
      expect(res.body.data.blocks[0].missionId).toBe("1.1.1");
      expect(res.body.data.blocks[0].previousMissionId).toBeNull();
      expect(res.body.data.blocks[1].previousMissionId).toBe("1.1.1");
      expect(res.body.data.categoriesReached).toBe(1);
      expect(res.body.data.latestBlockAt).toBe("2026-03-02T10:00:00.000Z");
    });

    it("returns 200 with empty chain for authenticated user with no completions", async () => {
      mockPrisma.userProgress.findMany.mockResolvedValue([]);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum/chain");

      expect(res.status).toBe(200);
      expect(res.body.data.blocks).toEqual([]);
      expect(res.body.data.totalBlocks).toBe(0);
      expect(res.body.data.categoriesReached).toBe(0);
      expect(res.body.data.latestBlockAt).toBeNull();
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/curriculum/chain");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/curriculum/resume", () => {
    it("returns 200 with first mission for new user", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum/resume");

      expect(res.status).toBe(200);
      expect(res.body.data.missionId).toBe("1.1.1");
      expect(res.body.data.chapterId).toBe("1.1");
      expect(res.body.data.categoryId).toBe("1");
    });

    it("returns 200 with next mission for user with progress", async () => {
      mockPrisma.userProgress.findFirst.mockResolvedValue({
        missionId: "1.1.1",
        completedAt: new Date("2026-03-05"),
      });
      mockPrisma.userProgress.count.mockResolvedValue(1);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum/resume");

      expect(res.status).toBe(200);
      expect(res.body.data.missionId).toBe("1.1.2");
    });

    it("returns 200 with null data when curriculum complete", async () => {
      mockPrisma.userProgress.findFirst.mockResolvedValue({
        missionId: "2.1.1",
        completedAt: new Date("2026-03-05"),
      });
      mockPrisma.userProgress.count.mockResolvedValue(3);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/curriculum/resume");

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/curriculum/resume");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });
});
