import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

// Mock database
const mockPrisma = vi.hoisted(() => ({
  exerciseAttempt: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  userProgress: {
    findUnique: vi.fn(),
    count: vi.fn(),
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

const { exercisesRouter } = await import("./exercises.js");

// -- Test fixtures --

const siContent = {
  scenario: "Test scenario",
  question: "What should you do?",
  options: [
    { id: "a", text: "Wrong", isCorrect: false, explanation: "Nope." },
    { id: "b", text: "Right", isCorrect: true, explanation: "Correct!" },
  ],
};

const minimalCurriculum = [
  {
    id: "1",
    order: 1,
    name: "cat1",
    description: "Category 1",
    platformMechanic: "xpOnly",
    chapters: [
      {
        id: "1.1",
        order: 1,
        name: "ch1.1",
        description: "Chapter 1.1",
        disclaimerRequired: false,
        missions: [
          {
            id: "1.1.1",
            order: 1,
            name: "m1.1.1",
            description: "Mission 1.1.1",
            exerciseType: "SI",
            estimatedMinutes: 3,
            lastReviewedDate: "2026-03-09",
            progressiveReveal: null,
          },
        ],
      },
    ],
  },
];

function setupMock() {
  mockGetContent.mockReturnValue({
    curriculum: minimalCurriculum,
    missions: new Map([
      ["en", { "1.1.1": { title: "Test", description: "Test", learningObjective: "Test", exerciseContent: siContent } }],
    ]),
    tooltips: new Map(),
    uiStrings: new Map(),
  });
  // First mission always available
  mockPrisma.userProgress.findUnique.mockResolvedValue(null);
  mockPrisma.exerciseAttempt.create.mockResolvedValue({ id: "attempt-1" });
}

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

  app.use("/api/v1/exercises", exercisesRouter);
  app.use(errorHandler);
  return app;
}

describe("Exercises Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupMock();
  });

  describe("POST /api/v1/exercises/:exerciseId/submit", () => {
    it("returns 200 with correct result for valid submission", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } });

      expect(res.status).toBe(200);
      expect(res.body.data.correct).toBe(true);
      expect(res.body.data.score).toBe(1);
      expect(res.body.data.totalPoints).toBe(1);
      expect(res.body.data.feedback).toHaveLength(1);
    });

    it("returns 200 with incorrect result for wrong answer", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } });

      expect(res.status).toBe(200);
      expect(res.body.data.correct).toBe(false);
      expect(res.body.data.feedback[0].correctAnswer).toBe("Right");
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app)
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 for invalid submission body", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "INVALID", submission: {} });

      expect(res.status).toBe(400);
    });

    it("returns 400 for missing submission field", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI" });

      expect(res.status).toBe(400);
    });

    it("returns 404 for non-existent exercise", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .post("/api/v1/exercises/99.99.99/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } });

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("EXERCISE_NOT_FOUND");
    });

    it("records attempt in database", async () => {
      const app = createTestApp(true);
      await request(app)
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } });

      expect(mockPrisma.exerciseAttempt.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: "user-1",
          exerciseId: "1.1.1",
          correct: true,
        }),
      });
    });
  });

  describe("GET /api/v1/exercises/missions/:missionId/status", () => {
    it("returns 200 with completable=true when correct attempt exists", async () => {
      mockPrisma.exerciseAttempt.findMany.mockResolvedValue([
        { id: "1", correct: true, createdAt: new Date() },
      ]);

      const app = createTestApp(true);
      const res = await request(app)
        .get("/api/v1/exercises/missions/1.1.1/status");

      expect(res.status).toBe(200);
      expect(res.body.data.missionId).toBe("1.1.1");
      expect(res.body.data.completable).toBe(true);
      expect(res.body.data.attempts).toBe(1);
    });

    it("returns 200 with completable=false when no attempts", async () => {
      mockPrisma.exerciseAttempt.findMany.mockResolvedValue([]);

      const app = createTestApp(true);
      const res = await request(app)
        .get("/api/v1/exercises/missions/1.1.1/status");

      expect(res.status).toBe(200);
      expect(res.body.data.completable).toBe(false);
      expect(res.body.data.attempts).toBe(0);
      expect(res.body.data.lastAttemptCorrect).toBeNull();
    });

    it("returns 401 when unauthenticated", async () => {
      const app = createTestApp(false);
      const res = await request(app)
        .get("/api/v1/exercises/missions/1.1.1/status");

      expect(res.status).toBe(401);
    });

    it("returns 404 for non-existent mission", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .get("/api/v1/exercises/missions/99.99.99/status");

      expect(res.status).toBe(404);
    });
  });
});
