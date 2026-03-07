import "dotenv/config";
import Redis from "ioredis";

// Two Redis Client Libraries (Epic 1, Stories 1.3-1.4)
// This project uses TWO Redis client libraries connecting to the same REDIS_URL:
//   - ioredis (this file): used by rate-limit-redis (Story 1.3) and @socket.io/redis-adapter (Story 1.4)
//   - redis/node-redis v5 (config/session.ts): used by connect-redis v9 session store (Story 1.4)
// Split required because connect-redis v9 dropped ioredis support (June 2024).
// Both are stable and officially maintained. See config/session.ts for the other client.

const globalForRedis = globalThis as typeof globalThis & {
  redisClient?: Redis;
};

if (!globalForRedis.redisClient) {
  globalForRedis.redisClient = new Redis(
    process.env.REDIS_URL ?? "redis://localhost:6379",
  );
}

export const redisClient: Redis = globalForRedis.redisClient;

export async function disconnectRedis(): Promise<void> {
  await redisClient.quit();
  console.log("Redis disconnected.");
}
