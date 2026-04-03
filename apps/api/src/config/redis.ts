/**
 * @module redis
 * @description ioredis client for rate limiting and Socket.IO pub/sub.
 *
 * This project uses **two** Redis client libraries connecting to the same server:
 * - **ioredis** (this file) — used by `rate-limit-redis` and `@socket.io/redis-adapter`.
 * - **node-redis v5** (`config/session.ts`) — used by `connect-redis` for session storage.
 *
 * The split is required because `connect-redis` v9 dropped ioredis support (June 2024).
 * Both are stable and officially maintained.
 *
 * Uses a singleton pattern on `globalThis` to survive hot-reloads in development.
 */

import "./env.js";
import Redis from "ioredis";

/** Singleton storage to prevent multiple Redis connections during hot-reload. */
const globalForRedis = globalThis as typeof globalThis & {
  redisClient?: Redis;
};

if (!globalForRedis.redisClient) {
  globalForRedis.redisClient = new Redis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
    {
      maxRetriesPerRequest: null,
    },
  );

  globalForRedis.redisClient.on("error", (err) => {
    console.error("Redis Client Error:", err);
  });

  globalForRedis.redisClient.on("connect", () => {
    console.log("Redis connected.");
  });

  globalForRedis.redisClient.on("ready", () => {
    console.log("Redis ready.");
  });
}

/** Singleton ioredis client — used by rate limiter and Socket.IO adapter. */
export const redisClient: Redis = globalForRedis.redisClient;

/**
 * Gracefully disconnects the ioredis client.
 * Called during server shutdown to prevent dangling connections.
 */
export async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
  console.log("Redis disconnected.");
}
