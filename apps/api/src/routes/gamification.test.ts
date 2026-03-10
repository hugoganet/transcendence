import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

// Mock database — supports both batch transactions (array) and interactive transactions (callback)
const mockPrisma = vi.hoisted(() => {
  const db = {
    $transaction: vi.fn(async (arg: unknown) => {
      if (typeof arg === "function") {
        return (arg as (tx: typeof db) => Promise<unknown>)(db);
      }
      return Promise.all(arg as Promise<unknown>[]);
    }),
    user: {
      findUniqueOrThrow: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    userProgress: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    chapterProgress: {
      findMany: vi.fn(),
    },
    achievement: {
      findMany: vi.fn(),
    },
    userAchievement: {
      findMany: vi.fn(),
      createMany: vi.fn(),
    },
  };
  return db;
});

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

// Mock session
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

// Mock sharp and fs
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

const { gamificationRouter } = await import("./gamification.js");

import { createMockContent } from "../__fixtures__/curriculum.js";
const setupContent = createMockContent(mockGetContent);

function createTestApp(authenticated: boolean) {
  const app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());

  if (authenticated) {
    app.use((req, _res, next) => {
      req.user = { id: "user-1", locale: "en" } as Express.User;
      req.isAuthenticated = () => true;
      next();
    });
  }

  app.use("/api/v1/gamification", gamificationRouter);
  app.use(errorHandler);
  return app;
}

describe("Gamification Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupContent();
  });

  describe("GET /api/v1/gamification/streak", () => {
    it("returns 200 with streak data for authenticated user", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        currentStreak: 5,
        longestStreak: 12,
        lastMissionCompletedAt: new Date("2026-03-10T14:30:00.000Z"),
      });
      mockPrisma.userProgress.count.mockResolvedValue(23);
      mockPrisma.chapterProgress.findMany.mockResolvedValue([
        { chapterId: "1.1" },
      ]);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/gamification/streak");

      expect(res.status).toBe(200);
      expect(res.body.data.currentStreak).toBe(5);
      expect(res.body.data.longestStreak).toBe(12);
      expect(res.body.data.lastMissionCompletedAt).toBe("2026-03-10T14:30:00.000Z");
      expect(res.body.data.totalMissionsCompleted).toBe(23);
      expect(res.body.data.totalModulesMastered).toBe(1);
    });

    it("returns 200 with zeros for new user", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        currentStreak: 0,
        longestStreak: 0,
        lastMissionCompletedAt: null,
      });
      mockPrisma.userProgress.count.mockResolvedValue(0);
      mockPrisma.chapterProgress.findMany.mockResolvedValue([]);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/gamification/streak");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastMissionCompletedAt: null,
        totalMissionsCompleted: 0,
        totalModulesMastered: 0,
      });
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/gamification/streak");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/gamification/achievements", () => {
    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/gamification/achievements");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns achievement list for authenticated user", async () => {
      mockPrisma.achievement.findMany.mockResolvedValue([
        {
          id: "a1",
          code: "BLOCKCHAIN_BEGINNER",
          title: "Blockchain Beginner",
          description: "Complete Category 1",
          iconUrl: "",
          type: "MODULE_COMPLETION",
          threshold: 1,
          userAchievements: [{ earnedAt: new Date("2026-03-10T14:30:00.000Z") }],
        },
        {
          id: "a2",
          code: "CRYPTO_CURIOUS",
          title: "Crypto Curious",
          description: "Complete Category 2",
          iconUrl: "",
          type: "MODULE_COMPLETION",
          threshold: 2,
          userAchievements: [],
        },
      ]);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/gamification/achievements");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].earnedAt).toBe("2026-03-10T14:30:00.000Z");
      expect(res.body.data[1].earnedAt).toBeNull();
    });

    it("returns correct structure per achievementStatusSchema", async () => {
      mockPrisma.achievement.findMany.mockResolvedValue([
        {
          id: "a1",
          code: "FIRST_TOKENS",
          title: "First Tokens",
          description: "Earn 10 tokens",
          iconUrl: "",
          type: "TOKEN_THRESHOLD",
          threshold: 10,
          userAchievements: [],
        },
      ]);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/gamification/achievements");

      expect(res.status).toBe(200);
      const achievement = res.body.data[0];
      expect(achievement).toHaveProperty("id");
      expect(achievement).toHaveProperty("code");
      expect(achievement).toHaveProperty("title");
      expect(achievement).toHaveProperty("description");
      expect(achievement).toHaveProperty("iconUrl");
      expect(achievement).toHaveProperty("type");
      expect(achievement).toHaveProperty("threshold");
      expect(achievement).toHaveProperty("earnedAt");
    });
  });

  describe("GET /api/v1/gamification/leaderboard", () => {
    function setupLeaderboardMocks() {
      mockPrisma.userProgress.findMany.mockResolvedValue([
        { userId: "user-1" },
        { userId: "user-2" },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "user-1", displayName: "Alice", avatarUrl: null,
          _count: { userProgress: 10 },
          userProgress: [{ completedAt: new Date("2026-03-10T10:00:00Z") }],
        },
        {
          id: "user-2", displayName: "Bob", avatarUrl: null,
          _count: { userProgress: 5 },
          userProgress: [{ completedAt: new Date("2026-03-10T12:00:00Z") }],
        },
      ]);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "user-1", displayName: "Alice", avatarUrl: null,
      });
      mockPrisma.userProgress.count.mockResolvedValue(10);
    }

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/gamification/leaderboard");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns leaderboard with data + currentUser + meta", async () => {
      setupLeaderboardMocks();

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/gamification/leaderboard");

      expect(res.status).toBe(200);

      // Verify data array is sorted by missionsCompleted DESC
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].missionsCompleted).toBeGreaterThanOrEqual(res.body.data[1].missionsCompleted);
      expect(res.body.data[0].rank).toBe(1);
      expect(res.body.data[1].rank).toBe(2);

      // Verify each entry has required fields with correct types
      for (const entry of res.body.data) {
        expect(typeof entry.rank).toBe("number");
        expect(typeof entry.userId).toBe("string");
        expect(typeof entry.missionsCompleted).toBe("number");
      }

      // Verify currentUser matches authenticated user
      expect(res.body.currentUser.userId).toBe("user-1");
      expect(typeof res.body.currentUser.rank).toBe("number");
      expect(typeof res.body.currentUser.missionsCompleted).toBe("number");

      // Verify meta with correct defaults
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 2 });
    });

    it("validates and passes page/pageSize params to service", async () => {
      setupLeaderboardMocks();

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/gamification/leaderboard?page=1&pageSize=10");

      expect(res.status).toBe(200);
      expect(res.body.meta.page).toBe(1);
      expect(res.body.meta.pageSize).toBe(10);
    });

    it("returns 400 for invalid pageSize (>100)", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/gamification/leaderboard?pageSize=101");

      expect(res.status).toBe(400);
    });
  });
});
