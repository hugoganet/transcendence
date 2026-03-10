import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database
const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
    return callback(mockPrisma);
  }),
  exerciseAttempt: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
  },
  userProgress: {
    findUnique: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findUniqueOrThrow: vi.fn(),
  },
  tokenTransaction: {
    create: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

// Mock tokenService — deductGasFeeWithClient + checkTokenDebt
const mockDeductGasFeeWithClient = vi.hoisted(() => vi.fn());
const mockCheckTokenDebt = vi.hoisted(() => vi.fn());
vi.mock("./tokenService.js", () => ({
  deductGasFeeWithClient: mockDeductGasFeeWithClient,
  checkTokenDebt: mockCheckTokenDebt,
  creditMissionTokensWithClient: vi.fn(),
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

const { submitExercise, getMissionExerciseStatus } = await import("./exerciseService.js");

// -- Test fixtures --

const siContent = {
  scenario: "You receive an email claiming to be from your bank.",
  question: "What should you do?",
  options: [
    { id: "a", text: "Click the link", isCorrect: false, explanation: "This could be phishing." },
    { id: "b", text: "Ignore it", isCorrect: true, explanation: "Correct approach." },
  ],
};

const cmContent = {
  instruction: "Match each term with its definition",
  pairs: [
    { id: "1", term: "Blockchain", definition: "A shared digital ledger", analogy: "Like a Google Doc" },
    { id: "2", term: "Consensus", definition: "Network agreement" },
  ],
};

const ipContent = {
  instruction: "Arrange the blocks in order",
  items: [
    { id: "1", label: "Block #1", correctPosition: 0 },
    { id: "2", label: "Block #2", correctPosition: 1 },
  ],
};

const stContent = {
  instruction: "Set up your wallet",
  steps: [
    {
      id: "1",
      prompt: "Choose a wallet type:",
      options: [
        { id: "a", text: "Hot wallet", isCorrect: true, explanation: "Good for beginners" },
        { id: "b", text: "Cold wallet", isCorrect: false, explanation: "More advanced" },
      ],
      microExplanation: "A hot wallet is an app on your device.",
    },
    {
      id: "2",
      prompt: "Set a password:",
      options: [
        { id: "a", text: "Strong password", isCorrect: true, explanation: "Always use strong passwords" },
        { id: "b", text: "1234", isCorrect: false, explanation: "Too weak" },
      ],
      microExplanation: "Strong passwords protect your wallet.",
    },
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
          {
            id: "1.1.2",
            order: 2,
            name: "m1.1.2",
            description: "Mission 1.1.2",
            exerciseType: "CM",
            estimatedMinutes: 3,
            lastReviewedDate: "2026-03-09",
            progressiveReveal: null,
          },
          {
            id: "1.1.3",
            order: 3,
            name: "m1.1.3",
            description: "Mission 1.1.3",
            exerciseType: "IP",
            estimatedMinutes: 3,
            lastReviewedDate: "2026-03-09",
            progressiveReveal: null,
          },
          {
            id: "1.1.4",
            order: 4,
            name: "m1.1.4",
            description: "Mission 1.1.4",
            exerciseType: "ST",
            estimatedMinutes: 3,
            lastReviewedDate: "2026-03-09",
            progressiveReveal: null,
          },
        ],
      },
    ],
  },
];

function setupContentMock(
  exerciseContent: Record<string, unknown>,
  missionId = "1.1.1",
) {
  const missionsMap = new Map([
    [
      "en",
      {
        [missionId]: {
          title: "Test Mission",
          description: "Test",
          learningObjective: "Test",
          exerciseContent,
        },
      },
    ],
  ]);

  mockGetContent.mockReturnValue({
    curriculum: minimalCurriculum,
    missions: missionsMap,
    tooltips: new Map(),
    uiStrings: new Map(),
  });
}

/**
 * Helper: mock userProgress so getMissionAccessStatus returns "available" for a given mission.
 * For first mission (1.1.1): no mocking needed (always available).
 * For subsequent missions: mock findUnique to return null (no direct progress),
 * then COMPLETED for the previous mission.
 */
function mockMissionAvailable(missionId: string) {
  if (missionId === "1.1.1") {
    // First mission is always available — findUnique returns null (no progress = compute from position)
    mockPrisma.userProgress.findUnique.mockResolvedValue(null);
  } else {
    // Non-first mission: findUnique returns null for target, COMPLETED for previous
    mockPrisma.userProgress.findUnique
      .mockResolvedValueOnce(null) // no direct progress on target
      .mockResolvedValueOnce({ status: "COMPLETED" }); // previous mission completed
  }
}

describe("exerciseService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockPrisma.userProgress.findUnique.mockResolvedValue(null);
    mockPrisma.exerciseAttempt.create.mockResolvedValue({ id: "attempt-1" });
    mockPrisma.exerciseAttempt.count.mockResolvedValue(0); // first attempt by default
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ tokenBalance: 50 }); // positive balance
    mockDeductGasFeeWithClient.mockResolvedValue(undefined);
    mockCheckTokenDebt.mockResolvedValue(undefined);
  });

  describe("submitExercise — SI", () => {
    it("returns correct result for right answer with gas fee", async () => {
      setupContentMock(siContent);

      const result = await submitExercise("user-1", "1.1.1", {
        type: "SI",
        submission: { selectedOptionId: "b" },
      }, "en");

      expect(result.correct).toBe(true);
      expect(result.score).toBe(1);
      expect(result.totalPoints).toBe(1);
      expect(result.feedback).toHaveLength(1);
      expect(result.feedback[0].correct).toBe(true);
      expect(result.feedback[0].correctAnswer).toBeNull();
      expect(result.gasFee).toBe(2);
      expect(result.tokenBalance).toBe(50);
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockDeductGasFeeWithClient).toHaveBeenCalledWith(
        mockPrisma, "user-1", "1.1.1",
      );
    });

    it("returns incorrect result for wrong answer with same gas fee", async () => {
      setupContentMock(siContent);

      const result = await submitExercise("user-1", "1.1.1", {
        type: "SI",
        submission: { selectedOptionId: "a" },
      }, "en");

      expect(result.correct).toBe(false);
      expect(result.score).toBe(0);
      expect(result.feedback[0].correct).toBe(false);
      expect(result.feedback[0].correctAnswer).toBe("Ignore it");
      // Gas fee is the same regardless of correctness
      expect(result.gasFee).toBe(2);
      expect(result.tokenBalance).toBe(50);
    });

    it("throws 400 for invalid option ID", async () => {
      setupContentMock(siContent);

      await expect(
        submitExercise("user-1", "1.1.1", {
          type: "SI",
          submission: { selectedOptionId: "nonexistent" },
        }, "en"),
      ).rejects.toThrow("not found in exercise");
    });
  });

  describe("submitExercise — CM", () => {
    it("returns correct result for all correct matches", async () => {
      setupContentMock(cmContent, "1.1.2");
      mockMissionAvailable("1.1.2");

      const result = await submitExercise("user-1", "1.1.2", {
        type: "CM",
        submission: {
          matches: [
            { termId: "1", definitionId: "1" },
            { termId: "2", definitionId: "2" },
          ],
        },
      }, "en");

      expect(result.correct).toBe(true);
      expect(result.score).toBe(2);
      expect(result.totalPoints).toBe(2);
    });

    it("returns mixed feedback for partial correct matches", async () => {
      setupContentMock(cmContent, "1.1.2");
      mockMissionAvailable("1.1.2");

      const result = await submitExercise("user-1", "1.1.2", {
        type: "CM",
        submission: {
          matches: [
            { termId: "1", definitionId: "1" },
            { termId: "2", definitionId: "1" }, // wrong
          ],
        },
      }, "en");

      expect(result.correct).toBe(false);
      expect(result.score).toBe(1);
      expect(result.feedback[0].correct).toBe(true);
      expect(result.feedback[1].correct).toBe(false);
    });

    it("counts missing matches as incorrect", async () => {
      setupContentMock(cmContent, "1.1.2");
      mockMissionAvailable("1.1.2");

      const result = await submitExercise("user-1", "1.1.2", {
        type: "CM",
        submission: {
          matches: [{ termId: "1", definitionId: "1" }],
        },
      }, "en");

      expect(result.correct).toBe(false);
      expect(result.score).toBe(1);
      expect(result.totalPoints).toBe(2);
    });
  });

  describe("submitExercise — IP", () => {
    it("returns correct result for right positions", async () => {
      setupContentMock(ipContent, "1.1.3");
      mockMissionAvailable("1.1.3");

      const result = await submitExercise("user-1", "1.1.3", {
        type: "IP",
        submission: {
          positions: [
            { itemId: "1", position: 0 },
            { itemId: "2", position: 1 },
          ],
        },
      }, "en");

      expect(result.correct).toBe(true);
      expect(result.score).toBe(2);
    });

    it("throws 400 for duplicate positions", async () => {
      setupContentMock(ipContent, "1.1.3");
      mockMissionAvailable("1.1.3");

      await expect(
        submitExercise("user-1", "1.1.3", {
          type: "IP",
          submission: {
            positions: [
              { itemId: "1", position: 0 },
              { itemId: "2", position: 0 },
            ],
          },
        }, "en"),
      ).rejects.toThrow("Duplicate positions");
    });

    it("counts missing items as incorrect", async () => {
      setupContentMock(ipContent, "1.1.3");
      mockMissionAvailable("1.1.3");

      const result = await submitExercise("user-1", "1.1.3", {
        type: "IP",
        submission: {
          positions: [{ itemId: "1", position: 0 }],
        },
      }, "en");

      expect(result.correct).toBe(false);
      expect(result.score).toBe(1);
      expect(result.totalPoints).toBe(2);
    });
  });

  describe("submitExercise — ST", () => {
    it("returns correct result for all correct step answers", async () => {
      setupContentMock(stContent, "1.1.4");
      mockMissionAvailable("1.1.4");

      const result = await submitExercise("user-1", "1.1.4", {
        type: "ST",
        submission: {
          stepAnswers: [
            { stepId: "1", selectedOptionId: "a" },
            { stepId: "2", selectedOptionId: "a" },
          ],
        },
      }, "en");

      expect(result.correct).toBe(true);
      expect(result.score).toBe(2);
      expect(result.totalPoints).toBe(2);
    });

    it("throws 400 for partial step answers", async () => {
      setupContentMock(stContent, "1.1.4");
      mockMissionAvailable("1.1.4");

      await expect(
        submitExercise("user-1", "1.1.4", {
          type: "ST",
          submission: {
            stepAnswers: [{ stepId: "1", selectedOptionId: "a" }],
          },
        }, "en"),
      ).rejects.toThrow("Answers required for all steps");
    });

    it("throws 400 for invalid option in step", async () => {
      setupContentMock(stContent, "1.1.4");
      mockMissionAvailable("1.1.4");

      await expect(
        submitExercise("user-1", "1.1.4", {
          type: "ST",
          submission: {
            stepAnswers: [
              { stepId: "1", selectedOptionId: "nonexistent" },
              { stepId: "2", selectedOptionId: "a" },
            ],
          },
        }, "en"),
      ).rejects.toThrow("not found in step");
    });
  });

  describe("submitExercise — error cases", () => {
    it("throws 404 for non-existent exercise", async () => {
      setupContentMock(siContent);

      await expect(
        submitExercise("user-1", "99.99.99", {
          type: "SI",
          submission: { selectedOptionId: "a" },
        }, "en"),
      ).rejects.toThrow("not found");
    });

    it("throws 403 for locked mission", async () => {
      setupContentMock(cmContent, "1.1.2");
      // Mission 1.1.2 requires 1.1.1 to be completed
      // findUnique returns null for both → previous not completed → locked
      mockPrisma.userProgress.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      await expect(
        submitExercise("user-1", "1.1.2", {
          type: "CM",
          submission: { matches: [{ termId: "1", definitionId: "1" }] },
        }, "en"),
      ).rejects.toThrow("locked");
    });

    it("throws 400 for type mismatch", async () => {
      setupContentMock(siContent);
      mockMissionAvailable("1.1.1");

      await expect(
        submitExercise("user-1", "1.1.1", {
          type: "CM",
          submission: { matches: [{ termId: "1", definitionId: "1" }] },
        }, "en"),
      ).rejects.toThrow("type SI, not CM");
    });

    it("throws 501 for placeholder content", async () => {
      setupContentMock({ placeholder: true });

      await expect(
        submitExercise("user-1", "1.1.1", {
          type: "SI",
          submission: { selectedOptionId: "a" },
        }, "en"),
      ).rejects.toThrow("not yet available");
    });
  });

  describe("getMissionExerciseStatus", () => {
    it("returns completable=true when correct attempt exists", async () => {
      setupContentMock(siContent);
      mockPrisma.exerciseAttempt.findMany.mockResolvedValue([
        { id: "1", correct: false, createdAt: new Date("2026-01-01") },
        { id: "2", correct: true, createdAt: new Date("2026-01-02") },
      ]);

      const status = await getMissionExerciseStatus("user-1", "1.1.1");

      expect(status.completable).toBe(true);
      expect(status.attempts).toBe(2);
      expect(status.lastAttemptCorrect).toBe(false); // ordered desc, first is most recent
    });

    it("returns completable=false when no correct attempt", async () => {
      setupContentMock(siContent);
      mockPrisma.exerciseAttempt.findMany.mockResolvedValue([
        { id: "1", correct: false, createdAt: new Date() },
      ]);

      const status = await getMissionExerciseStatus("user-1", "1.1.1");

      expect(status.completable).toBe(false);
      expect(status.attempts).toBe(1);
      expect(status.lastAttemptCorrect).toBe(false);
    });

    it("returns completable=false and null lastAttemptCorrect when no attempts", async () => {
      setupContentMock(siContent);
      mockPrisma.exerciseAttempt.findMany.mockResolvedValue([]);

      const status = await getMissionExerciseStatus("user-1", "1.1.1");

      expect(status.completable).toBe(false);
      expect(status.attempts).toBe(0);
      expect(status.lastAttemptCorrect).toBeNull();
    });

    it("throws 404 for non-existent mission", async () => {
      setupContentMock(siContent);

      await expect(
        getMissionExerciseStatus("user-1", "99.99.99"),
      ).rejects.toThrow("not found");
    });
  });

  describe("submitExercise — gas fee debt check", () => {
    it("blocks first attempt on new mission when balance is negative", async () => {
      setupContentMock(siContent);
      mockPrisma.exerciseAttempt.count.mockResolvedValue(0); // first attempt
      mockCheckTokenDebt.mockRejectedValue(
        new Error("You must earn more tokens to start a new mission"),
      );

      await expect(
        submitExercise("user-1", "1.1.1", {
          type: "SI",
          submission: { selectedOptionId: "b" },
        }, "en"),
      ).rejects.toThrow("You must earn more tokens");
      expect(mockCheckTokenDebt).toHaveBeenCalledWith("user-1");
    });

    it("allows continued attempt on existing mission even with negative balance", async () => {
      setupContentMock(siContent);
      mockPrisma.exerciseAttempt.count.mockResolvedValue(1); // has prior attempts
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ tokenBalance: -4 });

      const result = await submitExercise("user-1", "1.1.1", {
        type: "SI",
        submission: { selectedOptionId: "b" },
      }, "en");

      expect(result.correct).toBe(true);
      expect(result.gasFee).toBe(2);
      expect(result.tokenBalance).toBe(-4);
      // checkTokenDebt should NOT be called for continued attempts
      expect(mockCheckTokenDebt).not.toHaveBeenCalled();
    });

    it("allows first attempt on new mission with zero balance", async () => {
      setupContentMock(siContent);
      mockPrisma.exerciseAttempt.count.mockResolvedValue(0);
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ tokenBalance: 0 });

      const result = await submitExercise("user-1", "1.1.1", {
        type: "SI",
        submission: { selectedOptionId: "b" },
      }, "en");

      expect(result.correct).toBe(true);
      expect(mockCheckTokenDebt).toHaveBeenCalledWith("user-1");
    });
  });
});
