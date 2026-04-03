/**
 * @module database
 * @description PostgreSQL connection via Prisma ORM with pg connection pool.
 *
 * Uses a singleton pattern (stored on `globalThis`) to prevent multiple
 * Prisma clients during hot-reload in development. The pg.Pool provides
 * connection pooling (default 10 connections, configurable via DATABASE_POOL_SIZE).
 */

import "./env.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import { PrismaClient } from "../../generated/prisma/client.js";

/** Singleton storage to survive hot-reloads in development. */
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClient;
  prismaPool?: pg.Pool;
};

/**
 * Creates a new Prisma client backed by a pg connection pool.
 * @returns The Prisma client and the underlying pg.Pool instance.
 */
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

/** Singleton Prisma client — use this for all database operations. */
export const prisma: PrismaClient = globalForPrisma.prisma;

/** Underlying pg.Pool — exposed for graceful shutdown. */
export const prismaPool: pg.Pool = globalForPrisma.prismaPool as pg.Pool;

/**
 * Registers SIGTERM/SIGINT handlers for graceful shutdown.
 * Disconnects Prisma and closes the pg.Pool before exiting,
 * preventing dangling connections to PostgreSQL.
 */
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
