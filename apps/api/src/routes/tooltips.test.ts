import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

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

// Mock database (required by auth import chain)
vi.mock("../config/database.js", () => ({
  prisma: {},
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

const { tooltipsRouter } = await import("./tooltips.js");

const enTooltips = {
  blockchain: {
    term: "Blockchain",
    definition: "A shared digital record that stores information in linked blocks",
    analogy: "Like a shared Google Doc that nobody can secretly edit",
    relatedTerms: ["block", "hash"],
  },
  hash: {
    term: "Hash",
    definition: "A unique digital fingerprint of data",
    analogy: "Like a fingerprint that uniquely identifies a person",
    relatedTerms: ["block", "blockchain"],
  },
};

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

  app.use("/api/v1/tooltips", tooltipsRouter);
  app.use(errorHandler);
  return app;
}

const frTooltips = {
  blockchain: {
    term: "Blockchain",
    definition: "Un registre numerique partage qui stocke des informations",
    analogy: "Comme un Google Doc partage que personne ne peut modifier secretement",
    relatedTerms: ["block", "hash"],
  },
};

beforeEach(() => {
  vi.clearAllMocks();
  mockGetContent.mockReturnValue({
    tooltips: new Map([
      ["en", enTooltips],
      ["fr", frTooltips],
    ]),
    curriculum: [],
    missions: new Map(),
    uiStrings: new Map(),
  });
});

describe("Tooltips Routes", () => {
  describe("GET /api/v1/tooltips", () => {
    it("returns 200 with all terms sorted alphabetically when authenticated", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/tooltips");

      expect(res.status).toBe(200);
      expect(res.body.data.terms).toHaveLength(2);
      expect(res.body.data.terms[0].term).toBe("Blockchain");
      expect(res.body.data.terms[1].term).toBe("Hash");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/tooltips");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/tooltips/:term", () => {
    it("returns 200 with tooltip for valid term when authenticated", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/tooltips/blockchain");

      expect(res.status).toBe(200);
      expect(res.body.data.term).toBe("Blockchain");
      expect(res.body.data.definition).toContain("shared digital record");
      expect(res.body.data.analogy).toContain("Google Doc");
      expect(res.body.data.relatedTerms).toEqual(["block", "hash"]);
    });

    it("returns 404 TERM_NOT_FOUND for nonexistent term when authenticated", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/tooltips/nonexistent");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("TERM_NOT_FOUND");
    });

    it("returns 400 INVALID_INPUT for invalid term format when authenticated", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/tooltips/INVALID!@%23");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/tooltips/blockchain");

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("locale fallback", () => {
    it("returns French content when user locale is fr", async () => {
      const frUser = { ...mockUser, locale: "fr" };
      const app = createTestApp(true, frUser);
      const res = await request(app).get("/api/v1/tooltips/blockchain");

      expect(res.status).toBe(200);
      expect(res.body.data.definition).toContain("registre numerique");
    });

    it("falls back to English when user locale is unavailable", async () => {
      const xxUser = { ...mockUser, locale: "xx" };
      const app = createTestApp(true, xxUser);
      const res = await request(app).get("/api/v1/tooltips/blockchain");

      expect(res.status).toBe(200);
      expect(res.body.data.definition).toContain("shared digital record");
    });
  });
});
