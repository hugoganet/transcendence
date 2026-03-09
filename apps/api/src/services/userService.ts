import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../config/database.js";
import { sanitizeUser } from "./authService.js";
import { AppError } from "../utils/AppError.js";

const AVATAR_UPLOAD_DIR =
  process.env.AVATAR_UPLOAD_DIR ?? "./uploads/avatars";

export async function ensureUploadDir(): Promise<void> {
  await fs.mkdir(AVATAR_UPLOAD_DIR, { recursive: true });
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found");
  }
  return sanitizeUser(user);
}

export async function updateProfile(
  userId: string,
  data: { displayName?: string; bio?: string },
) {
  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw AppError.notFound("User not found");
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });
  return sanitizeUser(user);
}

export async function uploadAvatar(
  userId: string,
  file: Express.Multer.File,
) {
  // Get current user to check for existing avatar
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  // Process image with Sharp
  const filename = `${userId}-${Date.now()}.jpg`;
  const outputPath = path.join(AVATAR_UPLOAD_DIR, filename);

  await ensureUploadDir();

  try {
    await sharp(file.buffer)
      .resize(256, 256, { fit: "cover", position: "centre" })
      .jpeg({ quality: 80 })
      .toFile(outputPath);
  } catch {
    throw new AppError(
      400,
      "INVALID_FILE",
      "File could not be processed as an image",
    );
  }

  // Delete old avatar if exists
  await deleteAvatarFile(user.avatarUrl);

  // Update avatarUrl in DB
  const avatarUrl = `/api/v1/users/avatars/${filename}`;
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: { avatarUrl },
  });

  return sanitizeUser(updatedUser);
}

export async function deleteAvatarFile(
  avatarUrl: string | null,
): Promise<void> {
  if (!avatarUrl) return;

  // Extract filename from URL path
  const filename = path.basename(avatarUrl);
  if (!filename) return;

  const filePath = path.join(AVATAR_UPLOAD_DIR, filename);
  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist — ignore
  }
}
