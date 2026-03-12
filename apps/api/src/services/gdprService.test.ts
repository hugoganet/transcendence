import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  gdprExportToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  gdprDeletionToken: {
    create: vi.fn(),
    findUnique: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
  },
  gdprAuditLog: {
    create: vi.fn(),
  },
  user: {
    findUnique: vi.fn(),
    delete: vi.fn(),
  },
  userProgress: {
    findMany: vi.fn(),
  },
  chapterProgress: {
    findMany: vi.fn(),
  },
  tokenTransaction: {
    findMany: vi.fn(),
  },
  userAchievement: {
    findMany: vi.fn(),
  },
  friendship: {
    findMany: vi.fn(),
  },
  notification: {
    findMany: vi.fn(),
  },
  certificate: {
    findUnique: vi.fn(),
  },
  exerciseAttempt: {
    findMany: vi.fn(),
  },
  selfAssessment: {
    findMany: vi.fn(),
  },
  oAuthAccount: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn(),
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

vi.mock("../utils/contentLoader.js", () => ({
  getContent: vi.fn(() => ({
    curriculum: [
      {
        chapters: [
          { missions: Array(10).fill({}) },
          { missions: Array(10).fill({}) },
        ],
      },
      {
        chapters: [
          { missions: Array(10).fill({}) },
          { missions: Array(10).fill({}) },
        ],
      },
    ],
  })),
}));

const mockSendGdprExportEmail = vi.fn();
const mockSendGdprDeletionConfirmEmail = vi.fn();

vi.mock("./emailService.js", () => ({
  sendGdprExportEmail: mockSendGdprExportEmail,
  sendGdprDeletionConfirmEmail: mockSendGdprDeletionConfirmEmail,
}));

const {
  requestDataExport,
  downloadExport,
  requestAccountDeletion,
  confirmAccountDeletion,
  gatherUserData,
} = await import("./gdprService.js");

const mockUser = {
  id: "user-1",
  email: "test@example.com",
  displayName: "Test User",
  bio: null,
  avatarUrl: null,
  locale: "en",
  ageConfirmed: true,
  tokenBalance: 50,
  createdAt: new Date("2026-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("gatherUserData", () => {
  it("returns complete user data export", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userProgress.findMany.mockResolvedValue([
      {
        missionId: "1.1.1",
        status: "COMPLETED",
        completedAt: new Date("2026-02-01"),
      },
    ]);
    mockPrisma.chapterProgress.findMany.mockResolvedValue([
      { chapterId: "1.1", status: "COMPLETED", completedAt: new Date("2026-02-01") },
    ]);
    mockPrisma.tokenTransaction.findMany.mockResolvedValue([
      {
        amount: 1,
        type: "EARN",
        description: "Mission 1.1.1",
        createdAt: new Date("2026-02-01"),
      },
    ]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([
      {
        achievement: {
          title: "First Steps",
          description: "Complete your first mission",
        },
        earnedAt: new Date("2026-02-01"),
      },
    ]);
    mockPrisma.friendship.findMany.mockResolvedValue([
      {
        requesterId: "user-1",
        addresseeId: "user-2",
        status: "ACCEPTED",
        createdAt: new Date("2026-02-01"),
      },
    ]);
    mockPrisma.notification.findMany.mockResolvedValue([
      {
        type: "STREAK_MILESTONE",
        title: "Streak!",
        body: "7-day streak",
        createdAt: new Date("2026-02-01"),
      },
    ]);
    mockPrisma.certificate.findUnique.mockResolvedValue(null);
    mockPrisma.exerciseAttempt.findMany.mockResolvedValue([
      {
        exerciseId: "1.1.1",
        correct: true,
        createdAt: new Date("2026-02-01"),
      },
    ]);
    mockPrisma.selfAssessment.findMany.mockResolvedValue([
      {
        categoryId: "1",
        confidenceRating: 4,
        createdAt: new Date("2026-02-01"),
      },
    ]);
    mockPrisma.oAuthAccount.findMany.mockResolvedValue([
      {
        provider: "GOOGLE",
        createdAt: new Date("2026-02-01"),
      },
    ]);

    const result = await gatherUserData("user-1");

    expect(result.user.id).toBe("user-1");
    expect(result.user.email).toBe("test@example.com");
    expect(result.progress.missionsCompleted).toBe(1);
    expect(result.progress.chaptersCompleted).toBe(1);
    expect(result.progress.completionPercentage).toBe(3); // 1/40 * 100 = 2.5, rounded to 3
    expect(result.tokens.balance).toBe(50);
    expect(result.tokens.transactions).toHaveLength(1);
    expect(result.achievements).toHaveLength(1);
    expect(result.friends).toHaveLength(1);
    expect(result.friends[0].friendId).toBe("user-2");
    expect(result.notifications).toHaveLength(1);
    expect(result.exerciseAttempts).toHaveLength(1);
    expect(result.exerciseAttempts[0].exerciseId).toBe("1.1.1");
    expect(result.selfAssessments).toHaveLength(1);
    expect(result.selfAssessments[0].categoryId).toBe("1");
    expect(result.oauthAccounts).toHaveLength(1);
    expect(result.oauthAccounts[0].provider).toBe("GOOGLE");
    expect(result.certificate).toBeNull();
    // Sensitive fields must NOT be present
    expect(result.user).not.toHaveProperty("passwordHash");
    expect(result.user).not.toHaveProperty("twoFactorSecret");
  });

  it("throws when user not found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);
    await expect(gatherUserData("nonexistent")).rejects.toThrow("User not found");
  });
});

describe("requestDataExport", () => {
  it("generates token, sends email, creates audit log", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.userProgress.findMany.mockResolvedValue([]);
    mockPrisma.chapterProgress.findMany.mockResolvedValue([]);
    mockPrisma.tokenTransaction.findMany.mockResolvedValue([]);
    mockPrisma.userAchievement.findMany.mockResolvedValue([]);
    mockPrisma.friendship.findMany.mockResolvedValue([]);
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.certificate.findUnique.mockResolvedValue(null);
    mockPrisma.exerciseAttempt.findMany.mockResolvedValue([]);
    mockPrisma.selfAssessment.findMany.mockResolvedValue([]);
    mockPrisma.oAuthAccount.findMany.mockResolvedValue([]);
    mockPrisma.gdprExportToken.create.mockResolvedValue({});
    mockPrisma.gdprAuditLog.create.mockResolvedValue({});

    await requestDataExport("user-1", "test@example.com", "127.0.0.1");

    expect(mockPrisma.gdprExportToken.create).toHaveBeenCalledTimes(1);
    const createArg = mockPrisma.gdprExportToken.create.mock.calls[0][0];
    expect(createArg.data.userId).toBe("user-1");
    expect(createArg.data.token).toBeDefined();
    expect(createArg.data.token.length).toBe(64); // 32 bytes hex
    expect(createArg.data.expiresAt).toBeInstanceOf(Date);
    expect(createArg.data.data).toBeDefined();

    expect(mockSendGdprExportEmail).toHaveBeenCalledTimes(1);
    expect(mockSendGdprExportEmail.mock.calls[0][0]).toBe("test@example.com");
    expect(mockSendGdprExportEmail.mock.calls[0][1]).toContain("/gdpr/export/");

    expect(mockPrisma.gdprAuditLog.create).toHaveBeenCalledWith({
      data: { userId: "user-1", action: "EXPORT_REQUESTED", ipAddress: "127.0.0.1" },
    });
  });
});

describe("downloadExport", () => {
  it("valid token returns data via atomic consumption", async () => {
    const exportData = { user: { id: "user-1" } };
    mockPrisma.gdprExportToken.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.gdprExportToken.findUnique.mockResolvedValue({
      token: "abc123",
      userId: "user-1",
      data: exportData,
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: new Date(),
    });
    mockPrisma.gdprAuditLog.create.mockResolvedValue({});

    const result = await downloadExport("abc123", "127.0.0.1");

    expect(result).toEqual(exportData);
    expect(mockPrisma.gdprExportToken.updateMany).toHaveBeenCalledWith({
      where: {
        token: "abc123",
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: { usedAt: expect.any(Date) },
    });
    expect(mockPrisma.gdprAuditLog.create).toHaveBeenCalledWith({
      data: { userId: "user-1", action: "EXPORT_DOWNLOADED", ipAddress: "127.0.0.1" },
    });
  });

  it("throws for nonexistent token", async () => {
    mockPrisma.gdprExportToken.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.gdprExportToken.findUnique.mockResolvedValue(null);
    await expect(downloadExport("bad-token", undefined)).rejects.toThrow(
      "Invalid export token",
    );
  });

  it("throws for already-used token", async () => {
    mockPrisma.gdprExportToken.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.gdprExportToken.findUnique.mockResolvedValue({
      token: "abc123",
      userId: "user-1",
      data: {},
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: new Date(),
    });
    await expect(downloadExport("abc123", undefined)).rejects.toThrow(
      "Export token already used",
    );
  });

  it("throws for expired token", async () => {
    mockPrisma.gdprExportToken.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.gdprExportToken.findUnique.mockResolvedValue({
      token: "abc123",
      userId: "user-1",
      data: {},
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });
    await expect(downloadExport("abc123", undefined)).rejects.toThrow(
      "Export token expired",
    );
  });
});

describe("requestAccountDeletion", () => {
  it("generates token, sends email, creates audit log", async () => {
    mockPrisma.gdprDeletionToken.create.mockResolvedValue({});
    mockPrisma.gdprAuditLog.create.mockResolvedValue({});

    await requestAccountDeletion("user-1", "test@example.com", "127.0.0.1");

    expect(mockPrisma.gdprDeletionToken.create).toHaveBeenCalledTimes(1);
    const createArg = mockPrisma.gdprDeletionToken.create.mock.calls[0][0];
    expect(createArg.data.userId).toBe("user-1");
    expect(createArg.data.token).toBeDefined();
    expect(createArg.data.token.length).toBe(64);
    expect(createArg.data.expiresAt).toBeInstanceOf(Date);

    expect(mockSendGdprDeletionConfirmEmail).toHaveBeenCalledTimes(1);
    expect(mockSendGdprDeletionConfirmEmail.mock.calls[0][0]).toBe("test@example.com");
    expect(mockSendGdprDeletionConfirmEmail.mock.calls[0][1]).toContain(
      "/gdpr/delete/confirm/",
    );

    expect(mockPrisma.gdprAuditLog.create).toHaveBeenCalledWith({
      data: { userId: "user-1", action: "DELETION_REQUESTED", ipAddress: "127.0.0.1" },
    });
  });
});

describe("confirmAccountDeletion", () => {
  it("atomically deletes user and creates audit log", async () => {
    mockPrisma.gdprDeletionToken.updateMany.mockResolvedValue({ count: 1 });
    mockPrisma.gdprDeletionToken.findUnique.mockResolvedValue({
      token: "del-token",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: new Date(),
    });
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);

    await confirmAccountDeletion("del-token", "127.0.0.1");

    expect(mockPrisma.gdprDeletionToken.updateMany).toHaveBeenCalledWith({
      where: {
        token: "del-token",
        usedAt: null,
        expiresAt: { gt: expect.any(Date) },
      },
      data: { usedAt: expect.any(Date) },
    });
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("throws for nonexistent token", async () => {
    mockPrisma.gdprDeletionToken.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.gdprDeletionToken.findUnique.mockResolvedValue(null);
    await expect(confirmAccountDeletion("bad-token", undefined)).rejects.toThrow(
      "Invalid deletion token",
    );
  });

  it("throws for already-used token", async () => {
    mockPrisma.gdprDeletionToken.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.gdprDeletionToken.findUnique.mockResolvedValue({
      token: "del-token",
      userId: "user-1",
      expiresAt: new Date(Date.now() + 86400000),
      usedAt: new Date(),
    });
    await expect(confirmAccountDeletion("del-token", undefined)).rejects.toThrow(
      "Deletion token already used",
    );
  });

  it("throws for expired token", async () => {
    mockPrisma.gdprDeletionToken.updateMany.mockResolvedValue({ count: 0 });
    mockPrisma.gdprDeletionToken.findUnique.mockResolvedValue({
      token: "del-token",
      userId: "user-1",
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });
    await expect(confirmAccountDeletion("del-token", undefined)).rejects.toThrow(
      "Deletion token expired",
    );
  });
});
