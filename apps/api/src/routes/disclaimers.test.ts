import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

// Mock database
vi.mock("../config/database.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock session (required by authService import chain)
vi.mock("../config/session.js", () => ({
  sessionRedisClient: { scan: vi.fn(), get: vi.fn(), del: vi.fn() },
  sessionMiddleware: vi.fn(),
}));

// Mock email service (required by authService import chain)
vi.mock("../services/emailService.js", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

// Mock totpCrypto (required by authService import chain)
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

const { prisma } = await import("../config/database.js");
const { disclaimersRouter } = await import("./disclaimers.js");
const { usersRouter } = await import("./users.js");

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

  app.use("/api/v1/disclaimers", disclaimersRouter);
  app.use("/api/v1/users", usersRouter);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("Disclaimers Routes", () => {
  describe("GET /api/v1/disclaimers", () => {
    it("returns 200 with general disclaimer (unauthenticated)", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/disclaimers");

      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe("general");
      expect(res.body.data.text).toContain("educational purposes only");
    });
  });

  describe("GET /api/v1/disclaimers/onboarding", () => {
    it("returns 200 with onboarding disclaimer (authenticated)", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/disclaimers/onboarding");

      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe("onboarding");
      expect(res.body.data.text).toContain("educational purposes only");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/disclaimers/onboarding");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/disclaimers/module/:moduleId", () => {
    it("returns 200 with module disclaimer for investment module '2.3' (authenticated)", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/disclaimers/module/2.3");

      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe("module");
      expect(res.body.data.moduleId).toBe("2.3");
      expect(res.body.data.text).toContain("educational understanding only");
    });

    it("returns 404 NO_DISCLAIMER for non-investment module '1.1' (authenticated)", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/disclaimers/module/1.1");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NO_DISCLAIMER");
    });

    it("returns 400 INVALID_INPUT with field-level details for invalid module ID format (authenticated)", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/disclaimers/module/invalid");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
      expect(res.body.error.details).toBeDefined();
      expect(res.body.error.details.moduleId).toBeDefined();
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/disclaimers/module/2.3");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/disclaimers/accept", () => {
    it("returns 200 with updated user on first acceptance (authenticated)", async () => {
      const now = new Date("2026-03-09T12:00:00Z");
      const updatedUser = { ...mockUser, disclaimerAcceptedAt: now };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      const app = createTestApp(true);
      const res = await request(app).post("/api/v1/disclaimers/accept");

      expect(res.status).toBe(200);
      expect(res.body.data.disclaimerAcceptedAt).toBe("2026-03-09T12:00:00.000Z");
    });

    it("returns 200 with same user when already accepted (idempotent)", async () => {
      const acceptedDate = new Date("2026-03-01T00:00:00Z");
      const userWithDisclaimer = { ...mockUser, disclaimerAcceptedAt: acceptedDate };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithDisclaimer);

      const app = createTestApp(true, userWithDisclaimer);
      const res = await request(app).post("/api/v1/disclaimers/accept");

      expect(res.status).toBe(200);
      expect(res.body.data.disclaimerAcceptedAt).toBe("2026-03-01T00:00:00.000Z");
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).post("/api/v1/disclaimers/accept");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/users/me — disclaimerAcceptedAt field (AC #6)", () => {
    it("returns disclaimerAcceptedAt as null for user who has not accepted", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/users/me");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("disclaimerAcceptedAt");
      expect(res.body.data.disclaimerAcceptedAt).toBeNull();
    });

    it("returns disclaimerAcceptedAt as ISO string for user who accepted", async () => {
      const acceptedDate = new Date("2026-03-01T00:00:00Z");
      const userWithDisclaimer = { ...mockUser, disclaimerAcceptedAt: acceptedDate };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithDisclaimer);

      const app = createTestApp(true, userWithDisclaimer);
      const res = await request(app).get("/api/v1/users/me");

      expect(res.status).toBe(200);
      expect(res.body.data.disclaimerAcceptedAt).toBe("2026-03-01T00:00:00.000Z");
    });
  });
});
