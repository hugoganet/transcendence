/**
 * @module rateLimiter
 * @description Global rate limiting middleware to prevent brute-force and DoS attacks.
 *
 * Limits each IP address to a configurable number of requests per time window.
 * Counters are stored in Redis (via ioredis) so they persist across server
 * restarts and are shared across multiple instances.
 *
 * This is the **global** rate limiter applied to all routes. Sensitive endpoints
 * (login, password reset, 2FA) have additional stricter limits defined in their
 * route files.
 */

import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.js";

/**
 * Global rate limiter middleware.
 *
 * - `windowMs` — Time window in ms (default: 900000 = 15 minutes).
 * - `limit` — Max requests per IP per window (default: 100).
 * - `standardHeaders: "draft-7"` — Returns `RateLimit-*` headers per IETF draft-7.
 * - `store` — Redis-backed store so counters survive restarts and scale horizontally.
 * - `handler` — Custom 429 response matching the app's error format.
 */
export const rateLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS ?? "900000", 10),
  limit: parseInt(process.env.RATE_LIMIT_MAX ?? "100", 10),
  standardHeaders: "draft-7",
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (command: string, ...args: string[]) =>
      redisClient.call(command, ...args) as Promise<never>,
  }),
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    });
  },
});
