import crypto from "node:crypto";
import { prisma } from "../config/database.js";
import { getContent } from "../utils/contentLoader.js";
import { AppError } from "../utils/AppError.js";
import type { Certificate, PublicCertificate } from "@transcendence/shared";

type DbClient = Pick<typeof prisma, "certificate" | "userProgress">;

export async function generateCertificateWithClient(
  client: DbClient,
  userId: string,
  displayName: string | null,
): Promise<Certificate> {
  // Idempotent: return existing certificate if already generated
  const existing = await client.certificate.findUnique({ where: { userId } });
  if (existing) {
    return {
      id: existing.id,
      displayName: existing.displayName,
      completionDate: existing.completionDate.toISOString(),
      curriculumTitle: existing.curriculumTitle,
      shareToken: existing.shareToken,
      totalMissions: existing.totalMissions,
      totalCategories: existing.totalCategories,
    };
  }

  // Verify all missions completed
  const completed = await client.userProgress.count({
    where: { userId, status: "COMPLETED" },
  });

  const curriculum = getContent().curriculum;
  const totalMissions = curriculum.reduce(
    (sum, cat) => sum + cat.chapters.reduce((s, ch) => s + ch.missions.length, 0),
    0,
  );

  if (completed !== totalMissions) {
    throw new AppError(
      500,
      "CERTIFICATE_GENERATION_FAILED",
      `User has completed ${completed}/${totalMissions} missions`,
    );
  }

  const shareToken = crypto.randomUUID();
  const totalCategories = curriculum.length;

  const cert = await client.certificate.create({
    data: {
      userId,
      displayName,
      completionDate: new Date(),
      curriculumTitle: "Blockchain Fundamentals",
      shareToken,
      totalMissions: completed,
      totalCategories,
    },
  });

  return {
    id: cert.id,
    displayName: cert.displayName,
    completionDate: cert.completionDate.toISOString(),
    curriculumTitle: cert.curriculumTitle,
    shareToken: cert.shareToken,
    totalMissions: cert.totalMissions,
    totalCategories: cert.totalCategories,
  };
}

export async function getCertificate(userId: string): Promise<Certificate> {
  const cert = await prisma.certificate.findUnique({ where: { userId } });
  if (!cert) {
    throw new AppError(
      404,
      "CERTIFICATE_NOT_AVAILABLE",
      "Complete all missions to earn your certificate",
    );
  }
  return {
    id: cert.id,
    displayName: cert.displayName,
    completionDate: cert.completionDate.toISOString(),
    curriculumTitle: cert.curriculumTitle,
    shareToken: cert.shareToken,
    totalMissions: cert.totalMissions,
    totalCategories: cert.totalCategories,
  };
}

export async function getCertificateByShareToken(
  shareToken: string,
): Promise<PublicCertificate> {
  const cert = await prisma.certificate.findUnique({
    where: { shareToken },
    select: {
      displayName: true,
      completionDate: true,
      curriculumTitle: true,
      shareToken: true,
      totalMissions: true,
      totalCategories: true,
    },
  });
  if (!cert) {
    throw new AppError(404, "CERTIFICATE_NOT_FOUND", "Certificate not found");
  }
  return {
    displayName: cert.displayName,
    completionDate: cert.completionDate.toISOString(),
    curriculumTitle: cert.curriculumTitle,
    shareToken: cert.shareToken,
    totalMissions: cert.totalMissions,
    totalCategories: cert.totalCategories,
  };
}

export async function getShareableUrl(
  userId: string,
): Promise<{ shareUrl: string }> {
  const certificate = await getCertificate(userId);
  const baseUrl = process.env.BASE_URL || "https://localhost";
  const shareUrl = `${baseUrl}/certificates/${certificate.shareToken}`;
  return { shareUrl };
}
