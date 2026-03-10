import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

// Mock database
const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => Promise<unknown>)(mockPrisma);
    }
    return Promise.all(arg as Promise<unknown>[]);
  }),
  user: {
    findUniqueOrThrow: vi.fn(),
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
});
