import { randomBytes } from "crypto";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";
import {
  sendGdprExportEmail,
  sendGdprDeletionConfirmEmail,
} from "./emailService.js";
import { getContent } from "../utils/contentLoader.js";
import type { GdprExportData } from "@transcendence/shared";

const EXPORT_TOKEN_EXPIRY_HOURS = 24;
const DELETION_TOKEN_EXPIRY_HOURS = 24;

function generateSecureToken(): string {
  return randomBytes(32).toString("hex");
}

function getTotalMissions(): number {
  const content = getContent();
  return content.curriculum.reduce(
    (sum, cat) =>
      sum + cat.chapters.reduce((s, ch) => s + ch.missions.length, 0),
    0,
  );
}

async function logGdprAction(
  userId: string,
  action: string,
  ipAddress: string | undefined,
): Promise<void> {
  try {
    await prisma.gdprAuditLog.create({
      data: { userId, action, ipAddress: ipAddress ?? null },
    });
  } catch {
    // Audit logging is best-effort — don't fail the primary operation
  }
}

export async function gatherUserData(
  userId: string,
): Promise<GdprExportData> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError(404, "NOT_FOUND", "User not found");
  }

  const [
    missions,
    chapters,
    tokenTransactions,
    achievements,
    friendships,
    notifications,
    certificate,
    exerciseAttempts,
    selfAssessments,
    oauthAccounts,
  ] = await Promise.all([
    prisma.userProgress.findMany({ where: { userId } }),
    prisma.chapterProgress.findMany({ where: { userId } }),
    prisma.tokenTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
    }),
    prisma.friendship.findMany({
      where: {
        OR: [{ requesterId: userId }, { addresseeId: userId }],
        status: "ACCEPTED",
      },
    }),
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.certificate.findUnique({ where: { userId } }),
    prisma.exerciseAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }),
    prisma.selfAssessment.findMany({ where: { userId } }),
    prisma.oAuthAccount.findMany({
      where: { userId },
      select: { provider: true, createdAt: true },
    }),
  ]);

  const missionsCompleted = missions.filter(
    (m) => m.status === "COMPLETED",
  ).length;
  const chaptersCompleted = chapters.filter(
    (c) => c.status === "COMPLETED",
  ).length;
  const totalMissions = getTotalMissions();

  return {
    exportedAt: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      ageConfirmed: user.ageConfirmed,
      createdAt: user.createdAt.toISOString(),
    },
    progress: {
      missionsCompleted,
      chaptersCompleted,
      completionPercentage:
        totalMissions > 0
          ? Math.round((missionsCompleted / totalMissions) * 100)
          : 0,
      missions: missions.map((m) => ({
        missionId: m.missionId,
        status: m.status,
        completedAt: m.completedAt?.toISOString() ?? null,
      })),
    },
    tokens: {
      balance: user.tokenBalance,
      transactions: tokenTransactions.map((t) => ({
        amount: t.amount,
        type: t.type,
        description: t.description,
        createdAt: t.createdAt.toISOString(),
      })),
    },
    achievements: achievements.map((ua) => ({
      title: ua.achievement.title,
      description: ua.achievement.description,
      earnedAt: ua.earnedAt.toISOString(),
    })),
    friends: friendships.map((f) => ({
      friendId: f.requesterId === userId ? f.addresseeId : f.requesterId,
      status: f.status,
      since: f.createdAt.toISOString(),
    })),
    notifications: notifications.map((n) => ({
      type: n.type,
      title: n.title,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    })),
    exerciseAttempts: exerciseAttempts.map((ea) => ({
      exerciseId: ea.exerciseId,
      correct: ea.correct,
      createdAt: ea.createdAt.toISOString(),
    })),
    selfAssessments: selfAssessments.map((sa) => ({
      categoryId: sa.categoryId,
      confidenceRating: sa.confidenceRating,
      createdAt: sa.createdAt.toISOString(),
    })),
    oauthAccounts: oauthAccounts.map((oa) => ({
      provider: oa.provider,
      createdAt: oa.createdAt.toISOString(),
    })),
    certificate: certificate
      ? {
          completionDate: certificate.completionDate.toISOString(),
          curriculumTitle: certificate.curriculumTitle,
        }
      : null,
  };
}

export async function requestDataExport(
  userId: string,
  userEmail: string,
  ipAddress: string | undefined,
): Promise<void> {
  const exportData = await gatherUserData(userId);

  const token = generateSecureToken();
  const expiresAt = new Date(
    Date.now() + EXPORT_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  await prisma.gdprExportToken.create({
    data: { token, userId, data: exportData as object, expiresAt },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const downloadLink = `${frontendUrl}/gdpr/export/${token}`;
  await sendGdprExportEmail(userEmail, downloadLink);

  await logGdprAction(userId, "EXPORT_REQUESTED", ipAddress);
}

export async function downloadExport(
  token: string,
  ipAddress: string | undefined,
): Promise<unknown> {
  // Atomic token consumption: update only if valid, unused, and unexpired
  const now = new Date();
  const updated = await prisma.gdprExportToken.updateMany({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  if (updated.count === 0) {
    // Distinguish between not found, used, and expired for error messages
    const record = await prisma.gdprExportToken.findUnique({
      where: { token },
    });
    if (!record) {
      throw new AppError(400, "INVALID_EXPORT_TOKEN", "Invalid export token");
    }
    if (record.usedAt) {
      throw new AppError(
        400,
        "INVALID_EXPORT_TOKEN",
        "Export token already used",
      );
    }
    throw new AppError(400, "INVALID_EXPORT_TOKEN", "Export token expired");
  }

  // Fetch the record to get data and userId for audit
  const record = await prisma.gdprExportToken.findUnique({
    where: { token },
  });

  await logGdprAction(record!.userId, "EXPORT_DOWNLOADED", ipAddress);

  return record!.data;
}

export async function requestAccountDeletion(
  userId: string,
  userEmail: string,
  ipAddress: string | undefined,
): Promise<void> {
  const token = generateSecureToken();
  const expiresAt = new Date(
    Date.now() + DELETION_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  );

  await prisma.gdprDeletionToken.create({
    data: { token, userId, expiresAt },
  });

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const confirmLink = `${frontendUrl}/gdpr/delete/confirm/${token}`;
  await sendGdprDeletionConfirmEmail(userEmail, confirmLink);

  await logGdprAction(userId, "DELETION_REQUESTED", ipAddress);
}

export async function confirmAccountDeletion(
  token: string,
  ipAddress: string | undefined,
): Promise<void> {
  // Atomic token consumption: update only if valid, unused, and unexpired
  const now = new Date();
  const updated = await prisma.gdprDeletionToken.updateMany({
    where: {
      token,
      usedAt: null,
      expiresAt: { gt: now },
    },
    data: { usedAt: now },
  });

  if (updated.count === 0) {
    const record = await prisma.gdprDeletionToken.findUnique({
      where: { token },
    });
    if (!record) {
      throw new AppError(
        400,
        "INVALID_DELETION_TOKEN",
        "Invalid deletion token",
      );
    }
    if (record.usedAt) {
      throw new AppError(
        400,
        "INVALID_DELETION_TOKEN",
        "Deletion token already used",
      );
    }
    throw new AppError(
      400,
      "INVALID_DELETION_TOKEN",
      "Deletion token expired",
    );
  }

  // Get userId from token record
  const record = await prisma.gdprDeletionToken.findUnique({
    where: { token },
  });
  const userId = record!.userId;

  // Atomic: delete user + create audit log in a single transaction
  await prisma.$transaction([
    prisma.user.delete({ where: { id: userId } }),
    prisma.gdprAuditLog.create({
      data: {
        userId,
        action: "DELETION_CONFIRMED",
        ipAddress: ipAddress ?? null,
      },
    }),
  ]);

  // Sessions invalidate naturally: deserializeUser will return null for deleted user
}
