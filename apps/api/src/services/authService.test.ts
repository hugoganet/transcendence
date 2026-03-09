import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import { register, sanitizeUser, getUserById, findOrCreateOAuthUser } from "./authService.js";
import { AppError } from "../utils/AppError.js";

// Mock Prisma
vi.mock("../config/database.js", () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    oAuthAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashed"),
    compare: vi.fn(),
  },
}));

const { prisma } = await import("../config/database.js");
const mockPrisma = prisma as unknown as {
  user: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
  };
  oAuthAccount: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
};

const mockUser = {
  id: "test-uuid",
  email: "test@example.com",
  passwordHash: "$2a$12$hashed",
  authProvider: "LOCAL",
  displayName: null,
  bio: null,
  avatarUrl: null,
  locale: "en",
  ageConfirmed: true,
  twoFactorSecret: null,
  twoFactorEnabled: false,
  disclaimerAcceptedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("register", () => {
    it("hashes password and creates user", async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);

      const result = await register("test@example.com", "Test1234", true);

      expect(bcrypt.hash).toHaveBeenCalledWith("Test1234", 12);
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: {
          email: "test@example.com",
          passwordHash: "$2a$12$hashed",
          ageConfirmed: true,
        },
      });
      expect(result.email).toBe("test@example.com");
      expect(result).toHaveProperty("passwordHash");
    });

    it("throws AGE_CONFIRMATION_REQUIRED when ageConfirmed is false", async () => {
      await expect(
        register("test@example.com", "Test1234", false),
      ).rejects.toThrow(AppError);

      await expect(
        register("test@example.com", "Test1234", false),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "AGE_CONFIRMATION_REQUIRED",
      });
    });

    it("throws EMAIL_ALREADY_EXISTS on Prisma P2002 error", async () => {
      const prismaError = Object.assign(new Error("Unique constraint failed"), {
        code: "P2002",
      });
      mockPrisma.user.create.mockRejectedValue(prismaError);

      await expect(
        register("test@example.com", "Test1234", true),
      ).rejects.toMatchObject({
        statusCode: 409,
        code: "EMAIL_ALREADY_EXISTS",
      });
    });

    it("re-throws non-P2002 Prisma errors", async () => {
      const genericError = new Error("Connection failed");
      mockPrisma.user.create.mockRejectedValue(genericError);

      await expect(
        register("test@example.com", "Test1234", true),
      ).rejects.toThrow("Connection failed");
    });
  });

  describe("sanitizeUser", () => {
    it("strips sensitive fields and formats dates", () => {
      const result = sanitizeUser(mockUser);

      expect(result).toEqual({
        id: "test-uuid",
        email: "test@example.com",
        displayName: null,
        bio: null,
        avatarUrl: null,
        locale: "en",
        ageConfirmed: true,
        createdAt: "2026-01-01T00:00:00.000Z",
      });
      expect(result).not.toHaveProperty("passwordHash");
      expect(result).not.toHaveProperty("twoFactorSecret");
      expect(result).not.toHaveProperty("authProvider");
    });
  });

  describe("findOrCreateOAuthUser", () => {
    const googleProfile = {
      providerAccountId: "google-123",
      email: "oauth@example.com",
      displayName: "OAuth User",
      avatarUrl: "https://example.com/photo.jpg",
    };

    const tokens = {
      accessToken: "access-token-123",
      refreshToken: "refresh-token-123",
    };

    it("creates new user from Google profile", async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        id: "new-oauth-user",
        email: "oauth@example.com",
        authProvider: "GOOGLE",
        passwordHash: null,
      });

      const result = await findOrCreateOAuthUser("GOOGLE", googleProfile, tokens);

      expect(result.id).toBe("new-oauth-user");
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: "oauth@example.com",
          displayName: "OAuth User",
          authProvider: "GOOGLE",
          ageConfirmed: false,
        }),
      });
    });

    it("creates new user from Facebook profile", async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        id: "new-fb-user",
        email: "fb@example.com",
        authProvider: "FACEBOOK",
      });

      const fbProfile = { ...googleProfile, providerAccountId: "fb-456", email: "fb@example.com" };
      const result = await findOrCreateOAuthUser("FACEBOOK", fbProfile, tokens);

      expect(result.id).toBe("new-fb-user");
    });

    it("links OAuth account to existing email user", async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.oAuthAccount.create.mockResolvedValue({
        id: "oauth-acc-1",
        provider: "GOOGLE",
        providerAccountId: "google-123",
        userId: mockUser.id,
      });

      const profileWithExistingEmail = { ...googleProfile, email: mockUser.email };
      const result = await findOrCreateOAuthUser("GOOGLE", profileWithExistingEmail, tokens);

      expect(result.id).toBe(mockUser.id);
      expect(mockPrisma.oAuthAccount.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          provider: "GOOGLE",
          providerAccountId: "google-123",
          userId: mockUser.id,
        }),
      });
    });

    it("handles missing email (Facebook phone-only)", async () => {
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        ...mockUser,
        id: "no-email-user",
        email: null,
        authProvider: "FACEBOOK",
      });

      const noEmailProfile = { ...googleProfile, email: null };
      const result = await findOrCreateOAuthUser("FACEBOOK", noEmailProfile, tokens);

      expect(result.id).toBe("no-email-user");
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: null,
        }),
      });
    });

    it("returns existing user for duplicate OAuth account (same provider + providerAccountId)", async () => {
      const existingOAuth = {
        id: "existing-oauth-id",
        provider: "GOOGLE",
        providerAccountId: "google-123",
        userId: mockUser.id,
        user: mockUser,
      };
      mockPrisma.oAuthAccount.findUnique.mockResolvedValue(existingOAuth);
      mockPrisma.oAuthAccount.update.mockResolvedValue(existingOAuth);

      const result = await findOrCreateOAuthUser("GOOGLE", googleProfile, tokens);

      expect(result.id).toBe(mockUser.id);
      expect(mockPrisma.user.create).not.toHaveBeenCalled();
      expect(mockPrisma.oAuthAccount.update).toHaveBeenCalledWith({
        where: { id: "existing-oauth-id" },
        data: {
          accessToken: "access-token-123",
          refreshToken: "refresh-token-123",
        },
      });
    });
  });

  describe("getUserById", () => {
    it("fetches user from database by id", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await getUserById("test-uuid");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: "test-uuid" },
      });
      expect(result).toEqual(mockUser);
    });

    it("returns null for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await getUserById("non-existent");
      expect(result).toBeNull();
    });
  });
});
