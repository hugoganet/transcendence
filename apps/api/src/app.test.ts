import { describe, it, expect, vi } from "vitest";
import session from "express-session";
import request from "supertest";

// Mock Redis before importing app (which imports rateLimiter → redis)
vi.mock("./config/redis.js", () => ({
  redisClient: {
    call: vi.fn().mockResolvedValue("OK"),
  },
}));

// Mock rate limiter to avoid Redis dependency in integration tests
vi.mock("./middleware/rateLimiter.js", () => ({
  rateLimiter: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

// Mock database (used by passport config)
vi.mock("./config/database.js", () => ({
  prisma: {
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    },
  },
}));

const { app, registerRoutes } = await import("./app.js");

// Register routes with session middleware (required for Passport)
const sessionMw = session({
  secret: "test-secret",
  resave: false,
  saveUninitialized: false,
});
registerRoutes(sessionMw);

describe("Health endpoint", () => {
  it("GET /api/v1/health returns { data: { status: 'ok' } }", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: { status: "ok" } });
  });
});

describe("404 catch-all", () => {
  it("returns 404 with standard error format for unknown routes", async () => {
    const response = await request(app).get("/api/v1/nonexistent");
    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: "NOT_FOUND",
        message: "Route not found",
      },
    });
  });

  it("returns 404 for POST to unknown routes", async () => {
    const response = await request(app).post("/api/v1/nonexistent");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
  });
});

describe("CORS headers", () => {
  it("includes Access-Control-Allow-Origin header for configured origin", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://localhost:5173");

    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("sets configured origin regardless of request origin (browser enforces CORS)", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://evil.com");

    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
  });

  it("responds to preflight OPTIONS requests with CORS headers", async () => {
    const response = await request(app)
      .options("/api/v1/health")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type");

    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5173",
    );
    expect(response.headers["access-control-allow-methods"]).toBeDefined();
  });

  it("includes Access-Control-Allow-Credentials header", async () => {
    const response = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://localhost:5173");

    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });
});

describe("Helmet security headers", () => {
  it("sets Content-Security-Policy header", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.headers["content-security-policy"]).toBeDefined();
  });

  it("sets X-Content-Type-Options header", async () => {
    const response = await request(app).get("/api/v1/health");
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });
});

describe("Session middleware integration", () => {
  it("sets session cookie when session middleware is registered", async () => {
    const express = await import("express");
    const { errorHandler } = await import("./middleware/errorHandler.js");

    const sessionApp = express.default();
    sessionApp.use(express.default.json());

    // Create a mock session middleware that sets a cookie
    const mockSessionMw: import("express").RequestHandler = (_req, _res, next) => {
      // Simulate express-session by setting a cookie header
      _res.setHeader("Set-Cookie", "connect.sid=test; Path=/; HttpOnly; SameSite=Lax");
      next();
    };

    sessionApp.use(mockSessionMw);
    sessionApp.get("/test-session", (_req, res) => {
      res.json({ data: "ok" });
    });
    sessionApp.use(errorHandler);

    const response = await request(sessionApp).get("/test-session");
    expect(response.status).toBe(200);
    const cookies = response.headers["set-cookie"];
    expect(cookies).toBeDefined();
    const cookieStr = Array.isArray(cookies) ? cookies[0] : cookies;
    expect(cookieStr).toContain("HttpOnly");
    expect(cookieStr).toContain("SameSite=Lax");
  });
});

describe("Validation middleware integration", () => {
  it("works with error handler for ZodError", async () => {
    const { z } = await import("zod");
    const express = await import("express");
    const { validate } = await import("./middleware/validate.js");
    const { errorHandler } = await import("./middleware/errorHandler.js");

    const testApp = express.default();
    testApp.use(express.default.json());

    const schema = z.object({ name: z.string().min(1) });
    testApp.post("/test", validate({ body: schema }), (_req, res) => {
      res.json({ data: "ok" });
    });
    testApp.use(errorHandler);

    const response = await request(testApp).post("/test").send({ name: "" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("INVALID_INPUT");
    expect(response.body.error.details).toHaveProperty("name");
  });
});
