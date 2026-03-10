import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

// Mock database
const mockPrisma = vi.hoisted(() => ({
  user: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  tokenTransaction: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    groupBy: vi.fn(),
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
vi.mock("../utils/contentLoader.js", () => ({
  getContent: vi.fn(),
  initializeContent: vi.fn(),
  loadCurriculum: vi.fn(),
  loadMissions: vi.fn(),
  loadTooltips: vi.fn(),
  loadUIStrings: vi.fn(),
  getStaleContent: vi.fn(),
}));

const { tokensRouter } = await import("./tokens.js");

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

  app.use("/api/v1/tokens", tokensRouter);
  app.use(errorHandler);
  return app;
}

describe("Tokens Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/tokens/balance", () => {
    it("returns 200 with balance data for authenticated user", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ tokenBalance: 30 });
      mockPrisma.tokenTransaction.groupBy.mockResolvedValue([
        { type: "EARN", _sum: { amount: 30 } },
      ]);
      mockPrisma.tokenTransaction.findFirst.mockResolvedValue({
        createdAt: new Date("2026-03-10T14:30:00.000Z"),
      });

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/tokens/balance");

      expect(res.status).toBe(200);
      expect(res.body.data.tokenBalance).toBe(30);
      expect(res.body.data.totalEarned).toBe(30);
      expect(res.body.data.totalSpent).toBe(0);
      expect(res.body.data.lastEarned).toBe("2026-03-10T14:30:00.000Z");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/tokens/balance");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/tokens/history", () => {
    it("returns 200 with paginated history for authenticated user", async () => {
      mockPrisma.tokenTransaction.findMany.mockResolvedValue([
        {
          id: "tx-1",
          amount: 10,
          type: "EARN",
          missionId: "1.1.1",
          exerciseId: null,
          description: "Completed mission: Who Do You Trust?",
          createdAt: new Date("2026-03-10T14:30:00.000Z"),
        },
      ]);
      mockPrisma.tokenTransaction.count.mockResolvedValue(1);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/tokens/history");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe("EARN");
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
    });

    it("accepts custom page and pageSize", async () => {
      mockPrisma.tokenTransaction.findMany.mockResolvedValue([]);
      mockPrisma.tokenTransaction.count.mockResolvedValue(25);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/tokens/history?page=2&pageSize=10");

      expect(res.status).toBe(200);
      expect(res.body.meta).toEqual({ page: 2, pageSize: 10, total: 25 });
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/tokens/history");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 for pageSize exceeding max", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/tokens/history?pageSize=200");

      expect(res.status).toBe(400);
    });

    it("returns 400 for page < 1", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/tokens/history?page=0");

      expect(res.status).toBe(400);
    });
  });
});
