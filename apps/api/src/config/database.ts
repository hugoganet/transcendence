import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaPool?: pg.Pool;
};

function createPrismaClient(): { client: PrismaClient; pool: pg.Pool } {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    max: parseInt(process.env.DATABASE_POOL_SIZE || "10", 10),
  });
  const adapter = new PrismaPg(pool);
  const client = new PrismaClient({ adapter });
  return { client, pool };
}

if (!globalForPrisma.prisma) {
  const { client, pool } = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaPool = pool;
}

export const prisma: PrismaClient = globalForPrisma.prisma;
export const prismaPool: pg.Pool = globalForPrisma.prismaPool as pg.Pool;

export function registerShutdownHandlers(): void {
  function gracefulShutdown(signal: string) {
    console.log(`Received ${signal}. Disconnecting Prisma...`);
    prisma
      .$disconnect()
      .then(() => prismaPool.end())
      .then(() => {
        process.exit(0);
      });
  }

  process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  process.on("SIGINT", () => gracefulShutdown("SIGINT"));
}
