import { vi } from "vitest";

/**
 * Shared helpers for tests that import curriculumService (directly or via routes).
 *
 * completeMission() calls 5 WithClient services inside its transaction.
 * Any test importing curriculumService must mock all 5 to prevent real DB calls.
 *
 * IMPORTANT: vi.mock() calls must use string literals and stay inline in each
 * test file (Vitest hoists them before imports). You cannot wrap vi.mock() in
 * a helper function. Copy the blocks below into your test file.
 *
 * Similarly, vi.hoisted(() => mockPrisma) must be inline — it runs before
 * imports, so it can't reference imported functions.
 *
 * === For service tests (path prefix "./") ===
 *
 *   vi.mock("./tokenService.js", () => ({ creditMissionTokensWithClient: vi.fn().mockResolvedValue(undefined) }));
 *   vi.mock("./streakService.js", () => ({ updateStreakWithClient: vi.fn().mockResolvedValue(undefined) }));
 *   vi.mock("./achievementService.js", () => ({ checkAndAwardAchievementsWithClient: vi.fn().mockResolvedValue([]) }));
 *   vi.mock("./revealService.js", () => ({ triggerRevealWithClient: vi.fn().mockResolvedValue(false) }));
 *   vi.mock("./certificateService.js", () => ({ generateCertificateWithClient: vi.fn().mockResolvedValue({ id: "mock-cert-id", displayName: null, completionDate: new Date().toISOString(), curriculumTitle: "Blockchain Fundamentals", shareToken: "mock-token", totalMissions: 69, totalCategories: 6 }) }));
 *
 * === For route tests (path prefix "../services/") ===
 *
 *   vi.mock("../services/tokenService.js", () => ({ creditMissionTokensWithClient: vi.fn().mockResolvedValue(undefined) }));
 *   vi.mock("../services/streakService.js", () => ({ updateStreakWithClient: vi.fn().mockResolvedValue(undefined) }));
 *   vi.mock("../services/achievementService.js", () => ({ checkAndAwardAchievementsWithClient: vi.fn().mockResolvedValue([]) }));
 *   vi.mock("../services/revealService.js", () => ({ triggerRevealWithClient: vi.fn().mockResolvedValue(false) }));
 *   vi.mock("../services/certificateService.js", () => ({ generateCertificateWithClient: vi.fn().mockResolvedValue({ id: "mock-cert-id", displayName: null, completionDate: new Date().toISOString(), curriculumTitle: "Blockchain Fundamentals", shareToken: "mock-token", totalMissions: 69, totalCategories: 6 }) }));
 *
 * When a new WithClient service is added to completeMission(), update:
 *   1. This file (add to the lists above + setupCompleteMissionDefaults)
 *   2. curriculumService.test.ts (add vi.mock)
 *   3. curriculum.test.ts (add vi.mock)
 *   4. Any other test file that transitively imports curriculumService
 */

interface MockPrisma {
  userProgress: { findUnique: ReturnType<typeof vi.fn>; count: ReturnType<typeof vi.fn>; upsert: ReturnType<typeof vi.fn> };
  chapterProgress: { upsert: ReturnType<typeof vi.fn>; findMany: ReturnType<typeof vi.fn> };
  selfAssessment: { upsert: ReturnType<typeof vi.fn> };
  user: { findUniqueOrThrow: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
}

/**
 * Sets safe defaults for all Prisma mocks used by completeMission().
 * Call in beforeEach() after vi.clearAllMocks().
 */
export function setupCompleteMissionDefaults(mockPrisma: MockPrisma) {
  mockPrisma.userProgress.findUnique.mockResolvedValue(null);
  mockPrisma.userProgress.count.mockResolvedValue(0);
  mockPrisma.userProgress.upsert.mockResolvedValue({});
  mockPrisma.chapterProgress.upsert.mockResolvedValue({});
  mockPrisma.selfAssessment.upsert.mockResolvedValue({});
  mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ tokenBalance: 5, currentStreak: 1 });
  mockPrisma.user.findUnique.mockResolvedValue({ displayName: null });
}
