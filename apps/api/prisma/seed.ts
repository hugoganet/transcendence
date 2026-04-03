import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client.js";
import { ACHIEVEMENT_DEFINITIONS } from "@transcendence/shared";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// All missions except 6.3.4 (the last one)
const ALL_MISSIONS = [
  "1.1.1",
  "1.1.2",
  "1.1.3",
  "1.2.1",
  "1.2.2",
  "1.2.3",
  "1.2.4",
  "1.2.5",
  "1.3.1",
  "1.3.2",
  "1.3.3",
  "2.1.1",
  "2.1.2",
  "2.1.3",
  "2.1.4",
  "2.2.1",
  "2.2.2",
  "2.2.3",
  "2.2.4",
  "2.3.1",
  "2.3.2",
  "2.3.3",
  "2.3.4",
  "3.1.1",
  "3.1.2",
  "3.1.3",
  "3.1.4",
  "3.2.1",
  "3.2.2",
  "3.2.3",
  "3.2.4",
  "3.3.1",
  "3.3.2",
  "3.3.3",
  "3.3.4",
  "3.4.1",
  "3.4.2",
  "3.4.3",
  "3.4.4",
  "4.1.1",
  "4.1.2",
  "4.1.3",
  "4.1.4",
  "4.2.1",
  "4.2.2",
  "4.2.3",
  "5.1.1",
  "5.1.2",
  "5.1.3",
  "5.1.4",
  "5.2.1",
  "5.2.2",
  "5.2.3",
  "5.3.1",
  "5.3.2",
  "5.3.3",
  "5.3.4",
  "6.1.1",
  "6.1.2",
  "6.1.3",
  "6.1.4",
  "6.2.1",
  "6.2.2",
  "6.2.3",
  "6.2.4",
  "6.3.1",
  "6.3.2",
  "6.3.3",
  // 6.3.4 is intentionally excluded - the last mission
];

// All completed chapters (6.3 is IN_PROGRESS because 6.3.4 is not done)
const COMPLETED_CHAPTERS = [
  "1.1",
  "1.2",
  "1.3",
  "2.1",
  "2.2",
  "2.3",
  "3.1",
  "3.2",
  "3.3",
  "3.4",
  "4.1",
  "4.2",
  "5.1",
  "5.2",
  "5.3",
  "6.1",
  "6.2",
];

async function main() {
  const passwordHash = await bcrypt.hash("Test1234", 12);

  const testUser = await prisma.user.upsert({
    where: { email: "test@transcendence.local" },
    update: {},
    create: {
      email: "test@transcendence.local",
      passwordHash,
      displayName: "Test User",
      locale: "en",
      ageConfirmed: true,
    },
  });
  console.log("Seeded test user:", testUser.id);

  // Create eval user with all missions completed except 6.3.4
  // ethereumWallet is intentionally left blank for manual configuration
  const evalUser = await prisma.user.upsert({
    where: { email: "eval@transcendence.local" },
    update: {},
    create: {
      email: "eval@transcendence.local",
      passwordHash,
      displayName: "Eval User",
      locale: "en",
      ageConfirmed: true,
      disclaimerAcceptedAt: new Date(),
      // ethereumWallet is intentionally null - to be filled when compiling the project
      tokenBalance: 6500, // Approximate tokens from completing all missions
      currentStreak: 30,
      longestStreak: 30,
      lastMissionCompletedAt: new Date(),
      revealTokens: true,
      revealWallet: true,
      revealGas: true,
      revealDashboard: true,
    },
  });
  console.log("Seeded eval user:", evalUser.id);

  // Seed all completed missions for eval user
  const completedAt = new Date();
  for (const missionId of ALL_MISSIONS) {
    await prisma.userProgress.upsert({
      where: { userId_missionId: { userId: evalUser.id, missionId } },
      update: {},
      create: {
        userId: evalUser.id,
        missionId,
        status: "COMPLETED",
        completedAt,
      },
    });
  }
  console.log(`Seeded ${ALL_MISSIONS.length} completed missions for eval user`);

  // Seed completed chapters for eval user
  for (const chapterId of COMPLETED_CHAPTERS) {
    await prisma.chapterProgress.upsert({
      where: { userId_chapterId: { userId: evalUser.id, chapterId } },
      update: {},
      create: {
        userId: evalUser.id,
        chapterId,
        status: "COMPLETED",
        completedAt,
      },
    });
  }

  // Mark chapter 6.3 as IN_PROGRESS (since 6.3.4 is not done)
  await prisma.chapterProgress.upsert({
    where: { userId_chapterId: { userId: evalUser.id, chapterId: "6.3" } },
    update: {},
    create: {
      userId: evalUser.id,
      chapterId: "6.3",
      status: "IN_PROGRESS",
    },
  });
  console.log(`Seeded ${COMPLETED_CHAPTERS.length + 1} chapter progress entries for eval user`);

  // Seed achievement definitions (idempotent via upsert on unique code)
  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await prisma.achievement.upsert({
      where: { code: def.code },
      update: {
        title: def.title,
        description: def.description,
        type: def.type,
        threshold: def.threshold,
      },
      create: {
        code: def.code,
        title: def.title,
        description: def.description,
        type: def.type,
        threshold: def.threshold,
      },
    });
  }
  console.log(`Seeded ${ACHIEVEMENT_DEFINITIONS.length} achievements`);

  // Seed achievements for eval user (all except DEFI_EXPLORER since category 6 not complete)
  const evalUserAchievements = [
    // Module completions (categories 1-5 completed)
    "BLOCKCHAIN_BEGINNER",
    "CRYPTO_CURIOUS",
    "WALLET_WIZARD",
    "SMART_COOKIE",
    "NFT_NATIVE",
    // Token thresholds (has 6500 tokens)
    "FIRST_TOKENS",
    "TOKEN_COLLECTOR",
    "TOKEN_RICH",
    // Streak targets (has 30 day streak)
    "GETTING_STARTED",
    "WEEK_WARRIOR",
    "DEDICATED_LEARNER",
    "MONTHLY_MASTER",
  ];

  for (const code of evalUserAchievements) {
    const achievement = await prisma.achievement.findUnique({ where: { code } });
    if (achievement) {
      await prisma.userAchievement.upsert({
        where: { userId_achievementId: { userId: evalUser.id, achievementId: achievement.id } },
        update: {},
        create: {
          userId: evalUser.id,
          achievementId: achievement.id,
          earnedAt: completedAt,
        },
      });
    }
  }
  console.log(`Seeded ${evalUserAchievements.length} achievements for eval user`);

  // Optional: seed sample curriculum progress for test user
  if (process.env.SEED_PROGRESS === "true") {
    await prisma.userProgress.upsert({
      where: { userId_missionId: { userId: testUser.id, missionId: "1.1.1" } },
      update: {},
      create: {
        userId: testUser.id,
        missionId: "1.1.1",
        status: "COMPLETED",
        completedAt: new Date(),
      },
    });
    await prisma.chapterProgress.upsert({
      where: { userId_chapterId: { userId: testUser.id, chapterId: "1.1" } },
      update: {},
      create: {
        userId: testUser.id,
        chapterId: "1.1",
        status: "IN_PROGRESS",
      },
    });
    console.log("Seeded sample curriculum progress for test user");
  }
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
