import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock redis client before importing session module
const mockRedisClient = {
  on: vi.fn(),
  connect: vi.fn().mockResolvedValue(undefined),
  quit: vi.fn().mockResolvedValue(undefined),
};

vi.mock("redis", () => ({
  createClient: vi.fn(() => mockRedisClient),
}));

// Mock connect-redis
const MockRedisStore = vi.fn();
vi.mock("connect-redis", () => ({
  RedisStore: MockRedisStore,
}));

// Mock express-session
const mockSession = vi.fn().mockReturnValue((_req: unknown, _res: unknown, next: () => void) => next());
vi.mock("express-session", () => ({
  default: mockSession,
}));

// Mock env.ts to prevent dotenv from re-loading SESSION_SECRET on re-import
vi.mock("./env.js", () => ({}));

// Set required env vars before import
process.env.SESSION_SECRET = "test-secret-for-tests";
process.env.SESSION_TTL_SECONDS = "3600";

const { sessionRedisClient, disconnectSessionRedis, sessionMiddleware } = await import("./session.js");

describe("Session Redis client", () => {
  it("registers error and ready event listeners", () => {
    const onCalls = mockRedisClient.on.mock.calls;
    const eventNames = onCalls.map((call: unknown[]) => call[0]);
    expect(eventNames).toContain("error");
    expect(eventNames).toContain("ready");
  });

  it("exports sessionRedisClient", () => {
    expect(sessionRedisClient).toBe(mockRedisClient);
  });

  it("disconnectSessionRedis calls quit on client", async () => {
    await disconnectSessionRedis();
    expect(mockRedisClient.quit).toHaveBeenCalled();
  });
});

describe("Session middleware configuration", () => {
  it("creates RedisStore with the session redis client", () => {
    expect(MockRedisStore).toHaveBeenCalledWith({
      client: mockRedisClient,
    });
  });

  it("configures express-session with correct options", () => {
    expect(mockSession).toHaveBeenCalledTimes(1);
    const options = mockSession.mock.calls[0][0];

    expect(options.secret).toBe("test-secret-for-tests");
    expect(options.resave).toBe(false);
    expect(options.saveUninitialized).toBe(false);
    expect(options.store).toBeInstanceOf(MockRedisStore);
  });

  it("configures cookie with httpOnly, sameSite lax, and correct maxAge", () => {
    const options = mockSession.mock.calls[0][0];
    expect(options.cookie.httpOnly).toBe(true);
    expect(options.cookie.sameSite).toBe("lax");
    expect(options.cookie.maxAge).toBe(3600 * 1000); // SESSION_TTL_SECONDS * 1000
  });

  it("sets cookie.secure based on NODE_ENV", () => {
    const options = mockSession.mock.calls[0][0];
    // In test env, NODE_ENV is not "production"
    expect(options.cookie.secure).toBe(false);
  });

  it("exports sessionMiddleware as a function", () => {
    expect(typeof sessionMiddleware).toBe("function");
  });
});

describe("SESSION_SECRET validation", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("throws if SESSION_SECRET is missing", async () => {
    const original = process.env.SESSION_SECRET;
    delete process.env.SESSION_SECRET;

    await expect(import("./session.js")).rejects.toThrow(
      "SESSION_SECRET environment variable is required",
    );

    process.env.SESSION_SECRET = original;
  });

  it("throws if SESSION_SECRET is default in production", async () => {
    const originalSecret = process.env.SESSION_SECRET;
    const originalEnv = process.env.NODE_ENV;
    process.env.SESSION_SECRET = "change-me-in-production";
    process.env.NODE_ENV = "production";

    await expect(import("./session.js")).rejects.toThrow(
      "SESSION_SECRET must be changed from default in production",
    );

    process.env.SESSION_SECRET = originalSecret;
    process.env.NODE_ENV = originalEnv;
  });
});
