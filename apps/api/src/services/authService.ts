import bcrypt from "bcryptjs";
import type { AuthProvider } from "../../generated/prisma/client.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

const BCRYPT_COST_FACTOR = 12;

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
        accessToken: tokens.accessToken ?? null,
        refreshToken: tokens.refreshToken ?? null,
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
          accessToken: tokens.accessToken ?? null,
          refreshToken: tokens.refreshToken ?? null,
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
          accessToken: tokens.accessToken ?? null,
          refreshToken: tokens.refreshToken ?? null,
        },
      },
    },
  });

  return user;
}

export function sanitizeUser(user: {
  id: string;
  email: string | null;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  locale: string;
  ageConfirmed: boolean;
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
    createdAt: user.createdAt.toISOString(),
  };
}
