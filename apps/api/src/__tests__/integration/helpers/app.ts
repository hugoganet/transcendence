/**
 * Integration test app helper.
 * Provides the real Express app connected to the test database and real Redis.
 *
 * The vitest.integration.config.ts sets DATABASE_URL, REDIS_URL, SESSION_SECRET
 * etc. before any imports, so all singletons (Prisma, Redis, session) automatically
 * connect to the correct test infrastructure.
 */
import { initializeContent } from "../../../utils/contentLoader.js";
import { app, registerRoutes } from "../../../app.js";
import {
  sessionMiddleware,
  sessionRedisClient,
  disconnectSessionRedis,
} from "../../../config/session.js";
import { prisma, prismaPool } from "../../../config/database.js";
import { disconnectRedis } from "../../../config/redis.js";

let initialized = false;
let routesRegistered = false;

/**
 * Initialize the app for integration testing.
 * Idempotent — safe to call multiple times across test files.
 * Routes are registered only once (Express app persists across files in same worker).
 */
export async function setupApp(): Promise<void> {
  if (initialized) return;

  // Load real curriculum content
  initializeContent(["en", "fr"]);

  // Connect the session Redis client (reconnect if previously disconnected)
  if (!sessionRedisClient.isOpen) {
    await sessionRedisClient.connect();
  }

  // Wire up session middleware, passport, routes, error handler — ONCE only
  // The Express app instance persists across test files in the same worker,
  // so routes must only be registered once to avoid duplicate middleware.
  if (!routesRegistered) {
    registerRoutes(sessionMiddleware);
    routesRegistered = true;
  }

  initialized = true;
}

/**
 * Gracefully disconnect all infrastructure.
 * Call once in afterAll of the outermost describe.
 */
export async function teardownApp(): Promise<void> {
  await disconnectSessionRedis();
  await disconnectRedis();
  await prisma.$disconnect();
  await prismaPool.end();
  initialized = false;
}

export { app, prisma };
