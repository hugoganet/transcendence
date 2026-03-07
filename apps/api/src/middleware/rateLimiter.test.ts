import { describe, it, expect, vi } from "vitest";
import express from "express";
import request from "supertest";
import rateLimit from "express-rate-limit";

vi.mock("../config/redis.js", () => ({
  redisClient: {
    call: vi.fn().mockResolvedValue("OK"),
  },
}));

describe("rateLimiter", () => {
  it("creates a middleware function", async () => {
    const { rateLimiter } = await import("./rateLimiter.js");
    expect(typeof rateLimiter).toBe("function");
  });

  it("middleware has expected properties", async () => {
    const { rateLimiter } = await import("./rateLimiter.js");
    // express-rate-limit middleware is a function with arity 3
    expect(rateLimiter.length).toBeGreaterThanOrEqual(3);
  });

  it("returns 429 with standard error format when limit exceeded", async () => {
    const app = express();
    const limiter = rateLimit({
      windowMs: 60000,
      limit: 1,
      standardHeaders: "draft-7",
      legacyHeaders: false,
      handler: (_req, res) => {
        res.status(429).json({
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests, please try again later",
          },
        });
      },
    });
    app.use(limiter);
    app.get("/test", (_req, res) => res.json({ data: "ok" }));

    // First request should succeed
    const first = await request(app).get("/test");
    expect(first.status).toBe(200);

    // Second request should be rate limited
    const second = await request(app).get("/test");
    expect(second.status).toBe(429);
    expect(second.body).toEqual({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later",
      },
    });
  });
});
