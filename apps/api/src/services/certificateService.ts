import crypto from "node:crypto";
import { prisma } from "../config/database.js";
import { getContent } from "../utils/contentLoader.js";
import { AppError } from "../utils/AppError.js";
import { mintCertificateNFT } from "./blockchainService.js";
import type { Certificate, PublicCertificate } from "@transcendence/shared";

export type DbClient = Pick<typeof prisma, "certificate" | "userProgress" | "user">;

// Helper: Validate missions completed
async function validateMissionsCompleted(client: DbClient, userId: string): Promise<number> {
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

  return completed;
}

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
      nftTokenId: existing.nftTokenId ?? undefined,
      nftTxHash: existing.nftTxHash ?? undefined,
      contractAddress: existing.contractAddress ?? undefined,
    };
  }

  // Validate all missions completed
  const totalMissions = await validateMissionsCompleted(client, userId);

  const curriculum = getContent().curriculum;

  const cert = await client.certificate.create({
    data: {
      userId,
      displayName,
      completionDate: new Date(),
      curriculumTitle: "Blockchain Fundamentals",
      shareToken: crypto.randomUUID(),
      totalMissions,
      totalCategories: curriculum.length,
    },
  });

  // Return certificate without NFT info, blockchain call happens separately
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

// Mint NFT for certificate, call this OUTSIDE of transaction (blockchain calls are slow)
export async function mintNFTForCertificate(userId: string): Promise<void> {
  console.log("[mintNFTForCertificate] Starting for user:", userId);

  const cert = await prisma.certificate.findUnique({ where: { userId } });
  if (!cert) {
    return;
  }

  // Skip if already minted
  if (cert.nftTokenId) {
    console.log("[mintNFTForCertificate] Already minted, skipping:", cert.nftTokenId);
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { ethereumWallet: true },
  });

  // Skip if user has no wallet, NFT needs a real recipient
  if (!user?.ethereumWallet) {
    console.log("[mintNFTForCertificate] User has no wallet configured, skipping NFT mint");
    return;
  }

  try {
    const result = await mintCertificateNFT(
      userId,
      user.ethereumWallet,
      cert.curriculumTitle,
      cert.totalMissions,
    );

    // Certificate already exists on blockchain, still save tokenId if found
    if (result.alreadyExists) {
      if (result.tokenId > 0) {
        await prisma.certificate.update({
          where: { id: cert.id },
          data: { nftTokenId: result.tokenId, contractAddress: result.contractAddress },
        });
      }
    } else {
      await prisma.certificate.update({
        where: { id: cert.id },
        data: { nftTokenId: result.tokenId, nftTxHash: result.txHash, contractAddress: result.contractAddress },
      });
    }
  } catch (error) {
    // Log error but don't fail, certificate exists, NFT is optional
    console.error("Failed to mint NFT for user:", userId, error);
  }
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
    nftTokenId: cert.nftTokenId ?? undefined,
    nftTxHash: cert.nftTxHash ?? undefined,
    contractAddress: cert.contractAddress ?? undefined,
  };
}

export async function getCertificateByShareToken(shareToken: string): Promise<PublicCertificate> {
  const cert = await prisma.certificate.findUnique({
    where: { shareToken },
    select: {
      displayName: true,
      completionDate: true,
      curriculumTitle: true,
      shareToken: true,
      totalMissions: true,
      totalCategories: true,
      nftTokenId: true,
      contractAddress: true,
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
    nftTokenId: cert.nftTokenId ?? undefined,
    contractAddress: cert.contractAddress ?? undefined,
  };
}

export async function getShareableUrl(userId: string): Promise<{ shareUrl: string }> {
  const certificate = await getCertificate(userId);
  const baseUrl = process.env.BASE_URL || "https://localhost";
  const shareUrl = `${baseUrl}/certificates/${certificate.shareToken}`;
  return { shareUrl };
}
