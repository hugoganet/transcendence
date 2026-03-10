/**
 * Database helpers for integration tests.
 * Uses the real Prisma client connected to the test database.
 */
import bcrypt from "bcryptjs";
import { prisma } from "./app.js";

/**
 * Truncate all user-data tables.
 * CASCADE handles FK dependencies.
 */
export async function resetDatabase(): Promise<void> {
  await prisma.$executeRawUnsafe(`
    TRUNCATE TABLE
      "SelfAssessment",
      "ChapterProgress",
      "UserProgress",
      "PasswordResetToken",
      "OAuthAccount",
      "User"
    CASCADE;
  `);
}

/**
 * Seed a user directly in the DB (bypasses API registration).
 * Useful for tests that need a pre-existing user without calling signup.
 */
export async function seedTestUser(
  overrides: {
    email?: string;
    password?: string;
    ageConfirmed?: boolean;
    displayName?: string;
  } = {},
) {
  const email = overrides.email ?? "seed@example.com";
  const password = overrides.password ?? "Test123!@#";
  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.user.create({
    data: {
      email,
      passwordHash,
      ageConfirmed: overrides.ageConfirmed ?? true,
      displayName: overrides.displayName ?? null,
    },
  });
}
