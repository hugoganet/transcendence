/**
 * @file Rate Limiter — Redis-backed request rate limiting middleware.
 * FR: Limiteur de debit — middleware de limitation de requetes adosse a Redis.
 */
import rateLimit from "express-rate-limit";
import { RedisStore } from "rate-limit-redis";
import { redisClient } from "../config/redis.js";

/**
 * Express rate limiter backed by Redis, returns 429 when the limit is exceeded.
 * FR: Limiteur de debit Express adosse a Redis, renvoie 429 en cas de depassement.
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
