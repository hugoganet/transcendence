import { describe, it, expect, vi, beforeEach } from "vitest";
import bcrypt from "bcryptjs";
import {
  register,
  sanitizeUser,
  getUserById,
  findOrCreateOAuthUser,
  requestPasswordReset,
  resetPassword,
  invalidateUserSessions,
  setup2FA,
  verifyAndEnable2FA,
  verify2FALogin,
  disable2FA,
} from "./authService.js";
import { AppError } from "../utils/AppError.js";

// Mock Prisma
vi.mock("../config/database.js", () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    oAuthAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashed"),
    compare: vi.fn(),
  },
}));

// Use vi.hoisted for mocks referenced inside vi.mock factories
const {
  mockSessionRedis,
  mockSendPasswordResetEmail,
  mockEncryptTotpSecret,
  mockDecryptTotpSecret,
  mockTotpValidate,
  mockQRCodeToDataURL,
} = vi.hoisted(() => ({
  mockSessionRedis: {
    scan: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
  },
  mockSendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
  mockEncryptTotpSecret: vi.fn().mockReturnValue("encrypted-secret-hex"),
  mockDecryptTotpSecret: vi.fn().mockReturnValue("JBSWY3DPEHPK3PXP"),
  mockTotpValidate: vi.fn(),
  mockQRCodeToDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qrcode"),
}));

// Mock session Redis client
vi.mock("../config/session.js", () => ({
  sessionRedisClient: mockSessionRedis,
  sessionMiddleware: vi.fn(),
}));

// Mock email service
vi.mock("./emailService.js", () => ({
  sendPasswordResetEmail: mockSendPasswordResetEmail,
}));

// Mock totpCrypto
vi.mock("../utils/totpCrypto.js", () => ({
  encryptTotpSecret: mockEncryptTotpSecret,
  decryptTotpSecret: mockDecryptTotpSecret,
}));

// Mock OTPAuth
vi.mock("otpauth", () => ({
  Secret: class MockSecret {
    base32: string;
    constructor() {
      this.base32 = "JBSWY3DPEHPK3PXP";
    }
    static fromBase32(str: string) {
      return { base32: str };
    }
  },
  TOTP: class MockTOTP {
    toString() {
      return "otpauth://totp/Transcendence:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Transcendence";
    }
    validate(opts: { token: string; window: number }) {
      return mockTotpValidate(opts);
    }
  },
}));

// Mock QRCode
vi.mock("qrcode", () => ({
  default: {
    toDataURL: mockQRCodeToDataURL,
  },
}));

const { prisma } = await import("../config/database.js");
const mockPrisma = prisma as unknown as {
  user: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  oAuthAccount: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  passwordResetToken: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
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
        twoFactorEnabled: false,
        disclaimerAcceptedAt: null,
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

  describe("requestPasswordReset", () => {
    it("creates token and sends email for existing user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: "token-id",
        token: "a".repeat(64),
        userId: mockUser.id,
      });

      await requestPasswordReset("test@example.com");

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: "test@example.com" },
      });
      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUser.id,
        }),
      });
      expect(mockSendPasswordResetEmail).toHaveBeenCalledWith(
        "test@example.com",
        expect.stringContaining("/reset-password?token="),
      );
    });

    it("returns silently for non-existent email (no enumeration)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        requestPasswordReset("nobody@example.com"),
      ).resolves.toBeUndefined();

      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("returns silently for OAuth-only user (no passwordHash)", async () => {
      const oauthUser = { ...mockUser, passwordHash: null, authProvider: "GOOGLE" };
      mockPrisma.user.findUnique.mockResolvedValue(oauthUser);

      await expect(
        requestPasswordReset("test@example.com"),
      ).resolves.toBeUndefined();

      expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled();
      expect(mockSendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it("invalidates old tokens when new request is made", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.passwordResetToken.create.mockResolvedValue({
        id: "new-token-id",
        token: "b".repeat(64),
        userId: mockUser.id,
      });

      await requestPasswordReset("test@example.com");

      expect(mockPrisma.passwordResetToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
    });
  });

  describe("resetPassword", () => {
    const validToken = {
      id: "token-id",
      token: "a".repeat(64),
      userId: mockUser.id,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      usedAt: null,
      createdAt: new Date(),
      user: mockUser,
    };

    it("updates password, consumes token, and invalidates sessions for valid token", async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validToken);
      mockPrisma.$transaction.mockResolvedValue([{}, {}]);
      // Mock session invalidation (no sessions to clear)
      mockSessionRedis.scan.mockResolvedValue({ cursor: 0, keys: [] });

      await resetPassword(validToken.token, "NewPass123");

      expect(mockPrisma.passwordResetToken.findUnique).toHaveBeenCalledWith({
        where: { token: validToken.token },
        include: { user: true },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith("NewPass123", 12);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });

    it("throws INVALID_RESET_TOKEN for expired token", async () => {
      const expiredToken = {
        ...validToken,
        expiresAt: new Date(Date.now() - 1000), // expired
      };
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(expiredToken);

      await expect(
        resetPassword(expiredToken.token, "NewPass123"),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_RESET_TOKEN",
      });
    });

    it("throws INVALID_RESET_TOKEN for already-used token", async () => {
      const usedToken = {
        ...validToken,
        usedAt: new Date(), // already used
      };
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(usedToken);

      await expect(
        resetPassword(usedToken.token, "NewPass123"),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_RESET_TOKEN",
      });
    });

    it("throws INVALID_RESET_TOKEN for non-existent token", async () => {
      mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

      await expect(
        resetPassword("nonexistent", "NewPass123"),
      ).rejects.toMatchObject({
        statusCode: 400,
        code: "INVALID_RESET_TOKEN",
      });
    });
  });

  describe("invalidateUserSessions", () => {
    it("deletes matching sessions from Redis", async () => {
      const sessionData = JSON.stringify({ passport: { user: "test-uuid" } });
      const otherSessionData = JSON.stringify({ passport: { user: "other-uuid" } });

      mockSessionRedis.scan.mockResolvedValue({
        cursor: 0,
        keys: ["sess:abc", "sess:def"],
      });
      mockSessionRedis.get
        .mockResolvedValueOnce(sessionData)
        .mockResolvedValueOnce(otherSessionData);
      mockSessionRedis.del.mockResolvedValue(1);

      await invalidateUserSessions("test-uuid");

      expect(mockSessionRedis.del).toHaveBeenCalledWith("sess:abc");
      expect(mockSessionRedis.del).not.toHaveBeenCalledWith("sess:def");
    });

    it("handles empty session store gracefully", async () => {
      mockSessionRedis.scan.mockResolvedValue({ cursor: 0, keys: [] });

      await expect(
        invalidateUserSessions("test-uuid"),
      ).resolves.toBeUndefined();
    });

    it("paginates through multiple SCAN pages", async () => {
      const targetSession = JSON.stringify({ passport: { user: "test-uuid" } });
      const otherSession = JSON.stringify({ passport: { user: "other-uuid" } });

      // First SCAN returns cursor 42 (more pages), second returns cursor 0 (done)
      mockSessionRedis.scan
        .mockResolvedValueOnce({ cursor: 42, keys: ["sess:page1-match"] })
        .mockResolvedValueOnce({ cursor: 0, keys: ["sess:page2-other"] });
      mockSessionRedis.get
        .mockResolvedValueOnce(targetSession)
        .mockResolvedValueOnce(otherSession);
      mockSessionRedis.del.mockResolvedValue(1);

      await invalidateUserSessions("test-uuid");

      expect(mockSessionRedis.scan).toHaveBeenCalledTimes(2);
      expect(mockSessionRedis.del).toHaveBeenCalledWith("sess:page1-match");
      expect(mockSessionRedis.del).not.toHaveBeenCalledWith("sess:page2-other");
    });
  });

  describe("setup2FA", () => {
    it("returns QR code data URI, manual key, and otpauth URI", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, twoFactorSecret: "encrypted-secret-hex" });

      const result = await setup2FA("test-uuid");

      expect(result).toHaveProperty("qrCodeDataUri");
      expect(result).toHaveProperty("manualKey");
      expect(result).toHaveProperty("otpauthUri");
      expect(result.qrCodeDataUri).toBe("data:image/png;base64,qrcode");
      expect(result.manualKey).toBe("JBSWY3DPEHPK3PXP");
      expect(result.otpauthUri).toContain("otpauth://totp/");
    });

    it("stores encrypted secret in DB (not plaintext)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, twoFactorSecret: "encrypted-secret-hex" });

      await setup2FA("test-uuid");

      expect(mockEncryptTotpSecret).toHaveBeenCalledWith("JBSWY3DPEHPK3PXP");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-uuid" },
        data: {
          twoFactorSecret: "encrypted-secret-hex",
          twoFactorEnabled: false,
        },
      });
    });

    it("overwrites existing unverified secret (AC #6)", async () => {
      const userWithSecret = { ...mockUser, twoFactorSecret: "old-encrypted-secret" };
      mockPrisma.user.findUnique.mockResolvedValue(userWithSecret);
      mockPrisma.user.update.mockResolvedValue({ ...userWithSecret, twoFactorSecret: "encrypted-secret-hex" });

      await setup2FA("test-uuid");

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-uuid" },
        data: {
          twoFactorSecret: "encrypted-secret-hex",
          twoFactorEnabled: false,
        },
      });
    });

    it("throws NOT_FOUND for non-existent user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(setup2FA("non-existent")).rejects.toMatchObject({
        statusCode: 404,
        code: "NOT_FOUND",
      });
    });

    it("does not set twoFactorEnabled = true before verification", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, twoFactorSecret: "encrypted-secret-hex" });

      await setup2FA("test-uuid");

      expect(mockPrisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            twoFactorEnabled: false,
          }),
        }),
      );
    });
  });

  describe("verifyAndEnable2FA", () => {
    const userWithSecret = {
      ...mockUser,
      twoFactorSecret: "encrypted-secret-hex",
      twoFactorEnabled: false,
    };

    it("valid TOTP code enables 2FA", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWithSecret);
      mockTotpValidate.mockReturnValue(0); // valid (delta = 0)
      mockPrisma.user.update.mockResolvedValue({ ...userWithSecret, twoFactorEnabled: true });

      await verifyAndEnable2FA("test-uuid", "123456");

      expect(mockDecryptTotpSecret).toHaveBeenCalledWith("encrypted-secret-hex");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-uuid" },
        data: { twoFactorEnabled: true },
      });
    });

    it("invalid TOTP code throws INVALID_2FA_CODE", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWithSecret);
      mockTotpValidate.mockReturnValue(null); // invalid

      await expect(verifyAndEnable2FA("test-uuid", "000000")).rejects.toMatchObject({
        statusCode: 401,
        code: "INVALID_2FA_CODE",
      });
    });

    it("no secret stored throws TWO_FACTOR_NOT_SETUP", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, twoFactorSecret: null });

      await expect(verifyAndEnable2FA("test-uuid", "123456")).rejects.toMatchObject({
        statusCode: 400,
        code: "TWO_FACTOR_NOT_SETUP",
      });
    });
  });

  describe("verify2FALogin", () => {
    const userWith2FA = {
      ...mockUser,
      twoFactorSecret: "encrypted-secret-hex",
      twoFactorEnabled: true,
    };

    it("valid code returns user", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
      mockTotpValidate.mockReturnValue(0);

      const result = await verify2FALogin("test-uuid", "123456");

      expect(result).toEqual(userWith2FA);
    });

    it("invalid code throws INVALID_2FA_CODE", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
      mockTotpValidate.mockReturnValue(null);

      await expect(verify2FALogin("test-uuid", "000000")).rejects.toMatchObject({
        statusCode: 401,
        code: "INVALID_2FA_CODE",
      });
    });
  });

  describe("disable2FA", () => {
    const userWith2FA = {
      ...mockUser,
      twoFactorSecret: "encrypted-secret-hex",
      twoFactorEnabled: true,
    };

    it("valid code disables 2FA, nulls secret, invalidates sessions", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
      mockTotpValidate.mockReturnValue(0);
      mockPrisma.user.update.mockResolvedValue({ ...mockUser, twoFactorEnabled: false, twoFactorSecret: null });
      mockSessionRedis.scan.mockResolvedValue({ cursor: 0, keys: [] });

      await disable2FA("test-uuid", "123456");

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "test-uuid" },
        data: { twoFactorEnabled: false, twoFactorSecret: null },
      });
      expect(mockSessionRedis.scan).toHaveBeenCalled();
    });

    it("invalid code throws INVALID_2FA_CODE", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
      mockTotpValidate.mockReturnValue(null);

      await expect(disable2FA("test-uuid", "000000")).rejects.toMatchObject({
        statusCode: 401,
        code: "INVALID_2FA_CODE",
      });
    });

    it("2FA not enabled throws TWO_FACTOR_NOT_ENABLED", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ ...mockUser, twoFactorEnabled: false, twoFactorSecret: null });

      await expect(disable2FA("test-uuid", "123456")).rejects.toMatchObject({
        statusCode: 400,
        code: "TWO_FACTOR_NOT_ENABLED",
      });
    });
  });
});
