import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
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

const { uiCopyRouter } = await import("./uiCopy.js");

const enUiStrings = {
  categories: {
    blockchainFoundations: "Blockchain Foundations",
    cryptoAndTokens: "Crypto & Tokens",
  },
  chapters: {
    theTrustProblem: "The Trust Problem",
  },
  exerciseTypes: {
    scenarioInterpretation: "Scenario Interpretation",
  },
  labels: {
    next: "Next",
    back: "Back",
  },
};

const frUiStrings = {
  categories: {
    blockchainFoundations: "Fondations Blockchain",
    cryptoAndTokens: "Crypto & Tokens",
  },
  chapters: {
    theTrustProblem: "Le Probleme de Confiance",
  },
  exerciseTypes: {
    scenarioInterpretation: "Interpretation de Scenario",
  },
  labels: {
    next: "Suivant",
    back: "Retour",
  },
};

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use("/api/v1/ui-copy", uiCopyRouter);
  app.use(errorHandler);
  return app;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetContent.mockReturnValue({
    tooltips: new Map(),
    curriculum: [],
    missions: new Map(),
    uiStrings: new Map([
      ["en", enUiStrings],
      ["fr", frUiStrings],
    ]),
  });
});

describe("UI Copy Routes", () => {
  describe("GET /api/v1/ui-copy/:locale", () => {
    it("returns 200 with English UI strings", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/v1/ui-copy/en");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(enUiStrings);
    });

    it("returns 200 with French UI strings", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/v1/ui-copy/fr");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(frUiStrings);
    });

    it("returns 400 INVALID_LOCALE for unsupported locale", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/v1/ui-copy/de");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_LOCALE");
      expect(res.body.error.message).toBe("Locale must be en or fr");
    });

    it("sets Cache-Control header", async () => {
      const app = createTestApp();
      const res = await request(app).get("/api/v1/ui-copy/en");

      expect(res.status).toBe(200);
      expect(res.headers["cache-control"]).toBe("public, max-age=3600");
    });

    it("EN and FR responses have the same top-level keys", async () => {
      const app = createTestApp();
      const enRes = await request(app).get("/api/v1/ui-copy/en");
      const frRes = await request(app).get("/api/v1/ui-copy/fr");

      const enKeys = Object.keys(enRes.body.data).sort();
      const frKeys = Object.keys(frRes.body.data).sort();
      expect(enKeys).toEqual(frKeys);
    });
  });
});
