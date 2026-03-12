import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

const mockGdprService = vi.hoisted(() => ({
  requestDataExport: vi.fn(),
  downloadExport: vi.fn(),
  requestAccountDeletion: vi.fn(),
  confirmAccountDeletion: vi.fn(),
  gatherUserData: vi.fn(),
}));

vi.mock("../services/gdprService.js", () => mockGdprService);

vi.mock("../config/database.js", () => ({
  prisma: {},
}));

vi.mock("../config/redis.js", () => ({
  redisClient: { smembers: vi.fn() },
}));

vi.mock("../config/session.js", () => ({
  sessionRedisClient: { scan: vi.fn(), get: vi.fn(), del: vi.fn() },
  sessionMiddleware: vi.fn(),
}));

vi.mock("../services/emailService.js", () => ({
  sendPasswordResetEmail: vi.fn(),
  sendGdprExportEmail: vi.fn(),
  sendGdprDeletionConfirmEmail: vi.fn(),
}));

vi.mock("../utils/totpCrypto.js", () => ({
  encryptTotpSecret: vi.fn(),
  decryptTotpSecret: vi.fn(),
}));

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

vi.mock("../utils/contentLoader.js", () => ({
  getContent: vi.fn(),
  initializeContent: vi.fn(),
  loadCurriculum: vi.fn(),
  loadMissions: vi.fn(),
  loadTooltips: vi.fn(),
  loadUIStrings: vi.fn(),
  getStaleContent: vi.fn(),
}));

const { gdprRouter } = await import("./gdpr.js");

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const TEST_USER_EMAIL = "test@example.com";

function createTestApp(authenticated: boolean) {
  const app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());

  if (authenticated) {
    app.use((req, _res, next) => {
      req.user = { id: TEST_USER_ID, email: TEST_USER_EMAIL } as Express.User;
      req.isAuthenticated = () => true;
      next();
    });
  }

  app.use("/api/v1/gdpr", gdprRouter);
  app.use(errorHandler);
  return app;
}

describe("GDPR Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("POST /export", () => {
    it("requires auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).post("/api/v1/gdpr/export");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns success when authenticated", async () => {
      const app = createTestApp(true);
      mockGdprService.requestDataExport.mockResolvedValue(undefined);

      const res = await request(app).post("/api/v1/gdpr/export");
      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain("email");
      expect(mockGdprService.requestDataExport).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_USER_EMAIL,
        expect.anything(),
      );
    });
  });

  describe("GET /export/:token", () => {
    it("returns JSON download for valid token", async () => {
      const app = createTestApp(false);
      const exportData = { user: { id: "user-1" }, exportedAt: "2026-03-12" };
      mockGdprService.downloadExport.mockResolvedValue(exportData);

      const res = await request(app).get("/api/v1/gdpr/export/abc123");
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(exportData);
    });

    it("returns 400 for invalid/expired token", async () => {
      const app = createTestApp(false);
      const { AppError } = await import("../utils/AppError.js");
      mockGdprService.downloadExport.mockRejectedValue(
        new AppError(400, "INVALID_EXPORT_TOKEN", "Invalid export token"),
      );

      const res = await request(app).get("/api/v1/gdpr/export/bad-token");
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_EXPORT_TOKEN");
    });
  });

  describe("POST /delete", () => {
    it("requires auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).post("/api/v1/gdpr/delete");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns success when authenticated", async () => {
      const app = createTestApp(true);
      mockGdprService.requestAccountDeletion.mockResolvedValue(undefined);

      const res = await request(app).post("/api/v1/gdpr/delete");
      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain("email");
      expect(mockGdprService.requestAccountDeletion).toHaveBeenCalledWith(
        TEST_USER_ID,
        TEST_USER_EMAIL,
        expect.anything(),
      );
    });
  });

  describe("POST /delete/confirm/:token", () => {
    it("returns success for valid token", async () => {
      const app = createTestApp(false);
      mockGdprService.confirmAccountDeletion.mockResolvedValue(undefined);

      const res = await request(app).post("/api/v1/gdpr/delete/confirm/abc123");
      expect(res.status).toBe(200);
      expect(res.body.data.message).toContain("permanently deleted");
    });

    it("returns 400 for invalid/expired token", async () => {
      const app = createTestApp(false);
      const { AppError } = await import("../utils/AppError.js");
      mockGdprService.confirmAccountDeletion.mockRejectedValue(
        new AppError(400, "INVALID_DELETION_TOKEN", "Invalid deletion token"),
      );

      const res = await request(app).post("/api/v1/gdpr/delete/confirm/bad-token");
      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_DELETION_TOKEN");
    });
  });
});
