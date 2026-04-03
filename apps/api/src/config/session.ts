/**
 * @module session
 * @description Express session middleware backed by Redis via connect-redis.
 *
 * Uses **node-redis v5** (not ioredis) because connect-redis v9 requires it.
 * The ioredis client in `config/redis.ts` handles rate limiting and Socket.IO.
 *
 * Session flow:
 * 1. Browser sends cookie `connect.sid` with each request.
 * 2. express-session reads the cookie, loads session data from Redis.
 * 3. Passport reads `session.passport.user` to deserialize the user.
 *
 * Security:
 * - `httpOnly: true` — cookie inaccessible to JavaScript (XSS protection).
 * - `secure: true` in production — cookie only sent over HTTPS.
 * - `sameSite: "lax"` — cookie not sent on cross-site requests (CSRF protection).
 * - `rolling: true` — session expiry resets on each request (active users stay logged in).
 */

import "./env.js";
import { createClient } from "redis";
import session from "express-session";
import { RedisStore } from "connect-redis";

/**
 * Augments express-session's SessionData with app-specific fields.
 * - `userId` — the authenticated user's ID.
 * - `pending2FA` — true if the user passed password check but still needs TOTP verification.
 */
declare module "express-session" {
  interface SessionData {
    userId: string;
    pending2FA?: boolean;
  }
}

/**
 * Node-redis client dedicated to session storage.
 * Separate from the ioredis client in `config/redis.ts` because
 * connect-redis v9 dropped ioredis support.
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
 * Gracefully disconnects the session Redis client.
 * Called during server shutdown.
 */
export async function disconnectSessionRedis(): Promise<void> {
  await sessionRedisClient.quit();
  console.log("Session Redis disconnected.");
}

/** Validate SESSION_SECRET — required, must not be default in production. */
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  throw new Error("SESSION_SECRET environment variable is required");
}
if (process.env.NODE_ENV === "production" && sessionSecret === "change-me-in-production") {
  throw new Error("SESSION_SECRET must be changed from default in production");
}

/** Session TTL in seconds (default 1800 = 30 min, range: 900–7200). */
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
 * Configured express-session middleware.
 * Register via `app.use(sessionMiddleware)` in app.ts.
 */
export const sessionMiddleware = session({
  store,
  secret: sessionSecret,
  resave: false,
  saveUninitialized: false,
  rolling: true,
  proxy: true,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: ttlSeconds * 1000,
  },
});
