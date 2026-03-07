import "dotenv/config";
import Redis from "ioredis";

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
