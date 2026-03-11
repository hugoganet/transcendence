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

// Mock sharp
const { mockSharp, mockFsMkdir, mockFsUnlink } = vi.hoisted(() => ({
  mockSharp: {
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue(undefined),
  },
  mockFsMkdir: vi.fn().mockResolvedValue(undefined),
  mockFsUnlink: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sharp", () => ({
  default: vi.fn(() => mockSharp),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: mockFsMkdir,
    unlink: mockFsUnlink,
  },
}));

const mockGetReveals = vi.hoisted(() => vi.fn());
vi.mock("../services/revealService.js", () => ({
  getReveals: mockGetReveals,
}));

const { mockGetCertificate, mockGetShareableUrl } = vi.hoisted(() => ({
  mockGetCertificate: vi.fn(),
  mockGetShareableUrl: vi.fn(),
}));

vi.mock("../services/certificateService.js", () => ({
  getCertificate: mockGetCertificate,
  getShareableUrl: mockGetShareableUrl,
}));

const { prisma } = await import("../config/database.js");
const { usersRouter } = await import("./users.js");

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  displayName: "Test User",
  bio: "A bio",
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

  // Simulate authentication
  if (authenticated) {
    app.use((req, _res, next) => {
      req.user = user as Express.User;
      req.isAuthenticated = () => true;
      next();
    });
  }

  app.use("/api/v1/users", usersRouter);
  app.use(errorHandler);
  return app;
}

describe("Users Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("GET /api/v1/users/me", () => {
    it("returns 200 with user profile when authenticated", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/users/me");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: "user-1",
        email: "test@example.com",
        displayName: "Test User",
        bio: "A bio",
        avatarUrl: null,
        locale: "en",
        ageConfirmed: true,
        twoFactorEnabled: false,
      });
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/users/me");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("PATCH /api/v1/users/me", () => {
    it("returns 200 with updated profile when updating displayName", async () => {
      const updated = { ...mockUser, displayName: "New Name" };
      vi.mocked(prisma.user.update).mockResolvedValue(updated);

      const app = createTestApp(true);
      const res = await request(app)
        .patch("/api/v1/users/me")
        .send({ displayName: "New Name" });

      expect(res.status).toBe(200);
      expect(res.body.data.displayName).toBe("New Name");
    });

    it("returns 200 with updated profile when updating bio", async () => {
      const updated = { ...mockUser, bio: "New bio" };
      vi.mocked(prisma.user.update).mockResolvedValue(updated);

      const app = createTestApp(true);
      const res = await request(app)
        .patch("/api/v1/users/me")
        .send({ bio: "New bio" });

      expect(res.status).toBe(200);
      expect(res.body.data.bio).toBe("New bio");
    });

    it("returns 200 with updated profile when updating both fields", async () => {
      const updated = { ...mockUser, displayName: "New", bio: "Bio" };
      vi.mocked(prisma.user.update).mockResolvedValue(updated);

      const app = createTestApp(true);
      const res = await request(app)
        .patch("/api/v1/users/me")
        .send({ displayName: "New", bio: "Bio" });

      expect(res.status).toBe(200);
      expect(res.body.data.displayName).toBe("New");
      expect(res.body.data.bio).toBe("Bio");
    });

    it("returns 400 INVALID_INPUT with empty body", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .patch("/api/v1/users/me")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });

    it("returns 400 INVALID_INPUT when displayName exceeds 50 chars", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .patch("/api/v1/users/me")
        .send({ displayName: "a".repeat(51) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });

    it("returns 400 INVALID_INPUT when bio exceeds 300 chars", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .patch("/api/v1/users/me")
        .send({ bio: "a".repeat(301) });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app)
        .patch("/api/v1/users/me")
        .send({ displayName: "New" });

      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/users/me/reveals", () => {
    it("returns 200 with all four boolean flags in { data } format", async () => {
      mockGetReveals.mockResolvedValue({
        tokensRevealed: true,
        walletRevealed: false,
        gasRevealed: false,
        dashboardRevealed: false,
      });

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/users/me/reveals");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({
        tokensRevealed: true,
        walletRevealed: false,
        gasRevealed: false,
        dashboardRevealed: false,
      });
      expect(mockGetReveals).toHaveBeenCalledWith("user-1");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/users/me/reveals");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/users/me/certificate", () => {
    it("returns 200 with certificate data when authenticated", async () => {
      mockGetCertificate.mockResolvedValue({
        id: "cert-1",
        displayName: "Test User",
        completionDate: "2026-03-01T00:00:00.000Z",
        curriculumTitle: "Blockchain Fundamentals",
        shareToken: "abc-def-123",
        totalMissions: 69,
        totalCategories: 6,
      });

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/users/me/certificate");

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        id: "cert-1",
        curriculumTitle: "Blockchain Fundamentals",
        totalMissions: 69,
      });
      expect(mockGetCertificate).toHaveBeenCalledWith("user-1");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/users/me/certificate");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/users/me/certificate/share", () => {
    it("returns 200 with shareable URL when authenticated", async () => {
      mockGetShareableUrl.mockResolvedValue({
        shareUrl: "https://localhost/certificates/abc-def-123",
      });

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/users/me/certificate/share");

      expect(res.status).toBe(200);
      expect(res.body.data.shareUrl).toBe("https://localhost/certificates/abc-def-123");
      expect(mockGetShareableUrl).toHaveBeenCalledWith("user-1");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/users/me/certificate/share");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("POST /api/v1/users/me/avatar", () => {
    it("returns 200 with updated avatarUrl for valid JPEG", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        avatarUrl: "/api/v1/users/avatars/user-1-123.jpg",
      });

      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/users/me/avatar")
        .attach("avatar", Buffer.from("fake-jpeg-data"), {
          filename: "photo.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(200);
      expect(res.body.data.avatarUrl).toMatch(/^\/api\/v1\/users\/avatars\//);
    });

    it("returns 400 FILE_TOO_LARGE for files over 2MB", async () => {
      const app = createTestApp(true);
      const largeBuffer = Buffer.alloc(2 * 1024 * 1024 + 1); // Just over 2MB

      const res = await request(app)
        .post("/api/v1/users/me/avatar")
        .attach("avatar", largeBuffer, {
          filename: "large.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("FILE_TOO_LARGE");
    });

    it("returns 400 INVALID_FILE_TYPE for non-image file", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/users/me/avatar")
        .attach("avatar", Buffer.from("not-an-image"), {
          filename: "document.pdf",
          contentType: "application/pdf",
        });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_FILE_TYPE");
    });

    it("returns 400 NO_FILE when no file is provided", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/users/me/avatar");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("NO_FILE");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app)
        .post("/api/v1/users/me/avatar")
        .attach("avatar", Buffer.from("fake"), {
          filename: "photo.jpg",
          contentType: "image/jpeg",
        });

      expect(res.status).toBe(401);
    });
  });
});
