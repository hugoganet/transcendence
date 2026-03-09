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
