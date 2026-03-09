import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../generated/prisma/client.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

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
