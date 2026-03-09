import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getOnboardingDisclaimer,
  getGeneralDisclaimerResponse,
  getModuleDisclaimerResponse,
  acceptDisclaimer,
} from "./disclaimerService.js";
import { AppError } from "../utils/AppError.js";

// Mock dependencies
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
vi.mock("./emailService.js", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

// Mock totpCrypto (required by authService import chain)
vi.mock("../utils/totpCrypto.js", () => ({
  encryptTotpSecret: vi.fn(),
  decryptTotpSecret: vi.fn(),
}));

const { prisma } = await import("../config/database.js");

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

describe("disclaimerService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOnboardingDisclaimer", () => {
    it("returns disclaimer text with type 'onboarding'", () => {
      const result = getOnboardingDisclaimer();
      expect(result.type).toBe("onboarding");
      expect(result.text).toContain("educational purposes only");
    });
  });

  describe("getGeneralDisclaimerResponse", () => {
    it("returns disclaimer text with type 'general'", () => {
      const result = getGeneralDisclaimerResponse();
      expect(result.type).toBe("general");
      expect(result.text).toContain("educational purposes only");
    });
  });

  describe("getModuleDisclaimerResponse", () => {
    it("returns disclaimer for investment module (e.g., '2.3')", () => {
      const result = getModuleDisclaimerResponse("2.3");
      expect(result.type).toBe("module");
      expect(result.moduleId).toBe("2.3");
      expect(result.text).toContain("educational understanding only");
    });

    it("returns disclaimer for module '6.1'", () => {
      const result = getModuleDisclaimerResponse("6.1");
      expect(result.type).toBe("module");
      expect(result.moduleId).toBe("6.1");
    });

    it("returns disclaimer for module '6.2'", () => {
      const result = getModuleDisclaimerResponse("6.2");
      expect(result.type).toBe("module");
      expect(result.moduleId).toBe("6.2");
    });

    it("throws 404 NO_DISCLAIMER for non-investment module (e.g., '1.1')", () => {
      expect(() => getModuleDisclaimerResponse("1.1")).toThrow(AppError);
      try {
        getModuleDisclaimerResponse("1.1");
      } catch (err) {
        expect((err as AppError).statusCode).toBe(404);
        expect((err as AppError).code).toBe("NO_DISCLAIMER");
      }
    });
  });

  describe("acceptDisclaimer", () => {
    it("sets disclaimerAcceptedAt for user with null value", async () => {
      const now = new Date("2026-03-09T12:00:00Z");
      const updatedUser = { ...mockUser, disclaimerAcceptedAt: now };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      const result = await acceptDisclaimer("user-1");

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { disclaimerAcceptedAt: expect.any(Date) },
      });
      expect(result.disclaimerAcceptedAt).toBe("2026-03-09T12:00:00.000Z");
    });

    it("returns user unchanged when already accepted (idempotent)", async () => {
      const acceptedDate = new Date("2026-03-01T00:00:00Z");
      const userWithDisclaimer = { ...mockUser, disclaimerAcceptedAt: acceptedDate };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithDisclaimer);

      const result = await acceptDisclaimer("user-1");

      expect(prisma.user.update).not.toHaveBeenCalled();
      expect(result.disclaimerAcceptedAt).toBe("2026-03-01T00:00:00.000Z");
    });

    it("throws 404 for non-existent user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(acceptDisclaimer("nonexistent")).rejects.toThrow(AppError);
      await expect(acceptDisclaimer("nonexistent")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });
});
