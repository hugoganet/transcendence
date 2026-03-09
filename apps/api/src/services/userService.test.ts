import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getProfile,
  updateProfile,
  uploadAvatar,
  deleteAvatarFile,
} from "./userService.js";
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

// Import mocked prisma after vi.mock
const { prisma } = await import("../config/database.js");

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  displayName: "Test User",
  bio: "A bio",
  avatarUrl: null,
  locale: "en",
  ageConfirmed: true,
  twoFactorEnabled: false,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  passwordHash: "hashed",
  authProvider: "LOCAL" as const,
  twoFactorSecret: null,
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

describe("userService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getProfile", () => {
    it("returns sanitized user profile", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);

      const result = await getProfile("user-1");

      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        displayName: "Test User",
        bio: "A bio",
        avatarUrl: null,
        locale: "en",
        ageConfirmed: true,
        twoFactorEnabled: false,
        createdAt: "2026-01-01T00:00:00.000Z",
      });
    });

    it("throws 404 for non-existent user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(getProfile("nonexistent")).rejects.toThrow(AppError);
      await expect(getProfile("nonexistent")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("updateProfile", () => {
    it("updates displayName and bio", async () => {
      const updatedUser = { ...mockUser, displayName: "New Name", bio: "New bio" };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      const result = await updateProfile("user-1", {
        displayName: "New Name",
        bio: "New bio",
      });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { displayName: "New Name", bio: "New bio" },
      });
      expect(result.displayName).toBe("New Name");
      expect(result.bio).toBe("New bio");
    });

    it("updates only displayName when only displayName provided", async () => {
      const updatedUser = { ...mockUser, displayName: "Only Name" };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      await updateProfile("user-1", { displayName: "Only Name" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { displayName: "Only Name" },
      });
    });

    it("updates only bio when only bio provided", async () => {
      const updatedUser = { ...mockUser, bio: "Only bio" };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue(updatedUser);

      await updateProfile("user-1", { bio: "Only bio" });

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { bio: "Only bio" },
      });
    });

    it("throws 404 for non-existent user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(
        updateProfile("nonexistent", { displayName: "Test" }),
      ).rejects.toThrow(AppError);
      await expect(
        updateProfile("nonexistent", { displayName: "Test" }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("uploadAvatar", () => {
    const mockFile = {
      buffer: Buffer.from("fake-image"),
      mimetype: "image/jpeg",
      originalname: "photo.jpg",
      fieldname: "avatar",
      encoding: "7bit",
      size: 1024,
    } as Express.Multer.File;

    it("processes image and saves to filesystem", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        avatarUrl: "/api/v1/users/avatars/user-1-123.jpg",
      });

      const result = await uploadAvatar("user-1", mockFile);

      expect(mockSharp.resize).toHaveBeenCalledWith(256, 256, {
        fit: "cover",
        position: "centre",
      });
      expect(mockSharp.jpeg).toHaveBeenCalledWith({ quality: 80 });
      expect(mockSharp.toFile).toHaveBeenCalled();
      expect(mockFsMkdir).toHaveBeenCalled();
      expect(result.avatarUrl).toMatch(/^\/api\/v1\/users\/avatars\/user-1-\d+\.jpg$/);
    });

    it("deletes old avatar file when replacing", async () => {
      const userWithAvatar = {
        ...mockUser,
        avatarUrl: "/api/v1/users/avatars/user-1-old.jpg",
      };
      vi.mocked(prisma.user.findUnique).mockResolvedValue(userWithAvatar);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        avatarUrl: "/api/v1/users/avatars/user-1-new.jpg",
      });

      await uploadAvatar("user-1", mockFile);

      expect(mockFsUnlink).toHaveBeenCalled();
    });

    it("updates avatarUrl in database", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      vi.mocked(prisma.user.update).mockResolvedValue({
        ...mockUser,
        avatarUrl: "/api/v1/users/avatars/user-1-123.jpg",
      });

      await uploadAvatar("user-1", mockFile);

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "user-1" },
          data: expect.objectContaining({
            avatarUrl: expect.stringMatching(/^\/api\/v1\/users\/avatars\/user-1-\d+\.jpg$/),
          }),
        }),
      );
    });

    it("throws 404 for non-existent user", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

      await expect(uploadAvatar("nonexistent", mockFile)).rejects.toThrow(AppError);
    });

    it("throws 400 when Sharp fails to process file", async () => {
      vi.mocked(prisma.user.findUnique).mockResolvedValue(mockUser);
      mockSharp.toFile.mockRejectedValueOnce(new Error("Input buffer is not a valid image"));

      const error = await uploadAvatar("user-1", mockFile).catch((e) => e);
      expect(error).toBeInstanceOf(AppError);
      expect(error.statusCode).toBe(400);
      expect(error.code).toBe("INVALID_FILE");
    });
  });

  describe("deleteAvatarFile", () => {
    it("does nothing when avatarUrl is null", async () => {
      await deleteAvatarFile(null);
      expect(mockFsUnlink).not.toHaveBeenCalled();
    });

    it("handles missing file gracefully", async () => {
      mockFsUnlink.mockRejectedValueOnce(new Error("ENOENT"));
      await expect(deleteAvatarFile("/api/v1/users/avatars/missing.jpg")).resolves.toBeUndefined();
    });
  });
});
