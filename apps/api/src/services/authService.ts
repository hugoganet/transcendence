import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import type { AuthProvider } from "../../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { sessionRedisClient } from "../config/session.js";
import { sendPasswordResetEmail, sendWelcomeEmail } from "./emailService.js";
import { AppError } from "../utils/AppError.js";
import { encryptTotpSecret, decryptTotpSecret } from "../utils/totpCrypto.js";
import { encryptOAuthToken } from "../utils/oauthCrypto.js";

const BCRYPT_COST_FACTOR = 12;

function createTotpInstance(
  email: string | null,
  userId: string,
  secret: OTPAuth.Secret | { base32: string },
): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: "Transcendence",
    label: email ?? userId,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: secret instanceof OTPAuth.Secret ? secret : OTPAuth.Secret.fromBase32(secret.base32),
  });
}

export interface OAuthProfile {
  providerAccountId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface OAuthTokens {
  accessToken: string | undefined;
  refreshToken: string | undefined;
}

export async function register(
  email: string,
  password: string,
  ageConfirmed: boolean,
) {
  if (!ageConfirmed) {
    throw new AppError(400, "AGE_CONFIRMATION_REQUIRED", "Age confirmation is required");
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST_FACTOR);

  try {
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        ageConfirmed: true,
      },
    });

    // Fire-and-forget — don't block registration on email delivery
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const startLink = `${frontendUrl}/curriculum`;
    sendWelcomeEmail(user.email, "en", null, startLink).catch(() => {});

    return user;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "code" in err &&
      (err as { code: string }).code === "P2002"
    ) {
      throw new AppError(409, "EMAIL_ALREADY_EXISTS", "Email already exists");
    }
    throw err;
  }
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export async function findOrCreateOAuthUser(
  provider: AuthProvider,
  profile: OAuthProfile,
  tokens: OAuthTokens,
) {
  // Check if this OAuth account already exists
  const existingOAuth = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });

  if (existingOAuth) {
    // Update tokens on existing OAuth account
    await prisma.oAuthAccount.update({
      where: { id: existingOAuth.id },
      data: {
        accessToken: tokens.accessToken ? encryptOAuthToken(tokens.accessToken) : null,
        refreshToken: tokens.refreshToken ? encryptOAuthToken(tokens.refreshToken) : null,
      },
    });
    return existingOAuth.user;
  }

  // Check if a user with this email already exists (account linking)
  if (profile.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (existingUser) {
      // Link OAuth account to existing user
      await prisma.oAuthAccount.create({
        data: {
          provider,
          providerAccountId: profile.providerAccountId,
          accessToken: tokens.accessToken ? encryptOAuthToken(tokens.accessToken) : null,
          refreshToken: tokens.refreshToken ? encryptOAuthToken(tokens.refreshToken) : null,
          userId: existingUser.id,
        },
      });
      return existingUser;
    }
  }

  // Create new user with OAuth account
  const user = await prisma.user.create({
    data: {
      email: profile.email,
      displayName: profile.displayName,
      avatarUrl: profile.avatarUrl,
      authProvider: provider,
      ageConfirmed: false,
      oauthAccounts: {
        create: {
          provider,
          providerAccountId: profile.providerAccountId,
          accessToken: tokens.accessToken ? encryptOAuthToken(tokens.accessToken) : null,
          refreshToken: tokens.refreshToken ? encryptOAuthToken(tokens.refreshToken) : null,
        },
      },
    },
  });

  return user;
}

const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:5173";

export async function requestPasswordReset(email: string): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // Silent return — no email enumeration
  if (!user.passwordHash) return; // OAuth-only users cannot reset a password they don't have

  // Invalidate all previous tokens for this user (AC #6)
  await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

  // Generate cryptographically secure token
  const token = crypto.randomBytes(32).toString("hex");

  await prisma.passwordResetToken.create({
    data: {
      token,
      userId: user.id,
      expiresAt: new Date(Date.now() + RESET_TOKEN_EXPIRY_MS),
    },
  });

  const resetLink = `${FRONTEND_URL}/reset-password?token=${token}`;
  await sendPasswordResetEmail(email, resetLink);
}

export async function resetPassword(
  token: string,
  newPassword: string,
): Promise<void> {
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
    throw new AppError(
      400,
      "INVALID_RESET_TOKEN",
      "Reset token is invalid or expired",
    );
  }

  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST_FACTOR);

  // Update password and mark token as used in a transaction
  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    }),
  ]);

  // Invalidate all existing sessions for this user
  await invalidateUserSessions(resetToken.userId);
}

export async function invalidateUserSessions(
  userId: string,
): Promise<void> {
  const prefix = "sess:";
  let cursor = 0;
  do {
    const result = await sessionRedisClient.scan(cursor, {
      MATCH: `${prefix}*`,
      COUNT: 100,
    });
    cursor = result.cursor;
    for (const key of result.keys) {
      const sessionData = await sessionRedisClient.get(key);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          if (session.passport?.user === userId) {
            await sessionRedisClient.del(key);
          }
        } catch {
          // Skip malformed session data
        }
      }
    }
  } while (cursor !== 0);
}

export async function setup2FA(userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw AppError.notFound("User not found");
  }

  const secret = new OTPAuth.Secret({ size: 20 }); // 160-bit (RFC 4226 minimum)
  const totp = createTotpInstance(user.email, userId, secret);

  const otpauthUri = totp.toString();
  const qrCodeDataUri = await QRCode.toDataURL(otpauthUri, {
    errorCorrectionLevel: "M",
    width: 256,
    margin: 2,
  });

  const encryptedSecret = encryptTotpSecret(secret.base32);

  // Overwrite if exists (AC #6 — no stale secrets)
  await prisma.user.update({
    where: { id: userId },
    data: {
      twoFactorSecret: encryptedSecret,
      twoFactorEnabled: false,
    },
  });

  return { qrCodeDataUri, manualKey: secret.base32, otpauthUri };
}

export async function verifyAndEnable2FA(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorSecret) {
    throw new AppError(
      400,
      "TWO_FACTOR_NOT_SETUP",
      "2FA setup has not been initiated",
    );
  }

  const decryptedSecret = decryptTotpSecret(user.twoFactorSecret);
  const totp = createTotpInstance(user.email, userId, { base32: decryptedSecret });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    throw new AppError(401, "INVALID_2FA_CODE", "Invalid two-factor code");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: true },
  });
}

export async function verify2FALogin(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError(401, "INVALID_2FA_CODE", "Invalid two-factor code");
  }

  const decryptedSecret = decryptTotpSecret(user.twoFactorSecret);
  const totp = createTotpInstance(user.email, userId, { base32: decryptedSecret });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    throw new AppError(401, "INVALID_2FA_CODE", "Invalid two-factor code");
  }

  return user;
}

export async function disable2FA(userId: string, code: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
    throw new AppError(
      400,
      "TWO_FACTOR_NOT_ENABLED",
      "Two-factor authentication is not enabled",
    );
  }

  const decryptedSecret = decryptTotpSecret(user.twoFactorSecret);
  const totp = createTotpInstance(user.email, userId, { base32: decryptedSecret });

  const delta = totp.validate({ token: code, window: 1 });
  if (delta === null) {
    throw new AppError(401, "INVALID_2FA_CODE", "Invalid two-factor code");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });

  await invalidateUserSessions(userId);
}

export function sanitizeUser(user: {
  id: string;
  email: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  locale: string;
  ageConfirmed: boolean;
  twoFactorEnabled: boolean;
  disclaimerAcceptedAt: Date | null;
  createdAt: Date;
}) {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    locale: user.locale,
    ageConfirmed: user.ageConfirmed,
    twoFactorEnabled: user.twoFactorEnabled,
    disclaimerAcceptedAt: user.disclaimerAcceptedAt?.toISOString() ?? null,
    createdAt: user.createdAt.toISOString(),
  };
}
