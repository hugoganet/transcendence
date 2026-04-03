/**
 * @file Session Config — Redis-backed session middleware with secure cookie settings.
 * FR: Config Session — middleware de session Redis avec cookies securises.
 */
import "./env.js";
import { createClient } from "redis";
import session from "express-session";
import { RedisStore } from "connect-redis";

// Augment session data with userId for future auth stories
declare module "express-session" {
  interface SessionData {
    userId: string;
    pending2FA?: boolean;
  }
}

/**
 * Redis client dedicated to the session store (node-redis, separate from ioredis).
 * FR: Client Redis dedie au store de session (node-redis, distinct de ioredis).
 */
export const sessionRedisClient = createClient({
  url: process.env.REDIS_URL ?? "redis://localhost:6379",
});

sessionRedisClient.on("error", (err) => {
  console.error("Session Redis client error:", err);
});

sessionRedisClient.on("ready", () => {
  console.log("Session Redis client connected.");
});

/**
 * Gracefully close the session Redis connection.
 * FR: Ferme proprement la connexion Redis de session.
 */
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
if (isNaN(ttlSeconds) || ttlSeconds < 900 || ttlSeconds > 7200) {
  throw new Error(
    "SESSION_TTL_SECONDS must be between 900 (15 min) and 7200 (120 min)",
  );
}

const store = new RedisStore({
  client: sessionRedisClient,
});

/**
 * Express session middleware configured with Redis store and secure cookies.
 * FR: Middleware de session Express configure avec un store Redis et cookies securises.
 */
export const sessionMiddleware = session({
  store,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  // only that.. after 2 hours .....
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ttlSeconds * 1000,
  },
});
