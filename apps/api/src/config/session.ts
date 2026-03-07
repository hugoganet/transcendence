import "dotenv/config";
import { createClient } from "redis";
import session from "express-session";
import { RedisStore } from "connect-redis";

// Augment session data with userId for future auth stories
declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

// Node-redis client specifically for connect-redis session store
// Separate from the ioredis client in config/redis.ts
export const sessionRedisClient = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

sessionRedisClient.on("error", (err) => {
  console.error("Session Redis client error:", err);
});

sessionRedisClient.on("ready", () => {
  console.log("Session Redis client connected.");
});

export async function disconnectSessionRedis(): Promise<void> {
  await sessionRedisClient.quit();
  console.log("Session Redis disconnected.");
}

// Validate SESSION_SECRET
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}
if (process.env.NODE_ENV === "production" && sessionSecret === "change-me-in-production") {
  throw new Error("SESSION_SECRET must be changed from default in production");
}

const ttlSeconds = parseInt(process.env.SESSION_TTL_SECONDS ?? "1800", 10);

const store = new RedisStore({
  client: sessionRedisClient,
});

export const sessionMiddleware = session({
  store,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ttlSeconds * 1000,
  },
});
