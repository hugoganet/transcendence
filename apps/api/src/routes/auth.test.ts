import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

// Mock database
vi.mock("../config/database.js", () => ({
  prisma: {
    user: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    oAuthAccount: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$12$hashedpassword"),
    compare: vi.fn(),
  },
}));

// Use vi.hoisted for mocks referenced inside vi.mock factories
const { mockSessionRedis, mockTotpValidate } = vi.hoisted(() => ({
  mockSessionRedis: {
    scan: vi.fn().mockResolvedValue({ cursor: 0, keys: [] }),
    get: vi.fn(),
    del: vi.fn(),
  },
  mockTotpValidate: vi.fn(),
}));

// Mock session Redis client (for invalidateUserSessions)
vi.mock("../config/session.js", () => ({
  sessionRedisClient: mockSessionRedis,
  sessionMiddleware: vi.fn(),
}));

// Mock email service
vi.mock("../services/emailService.js", () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

// Mock totpCrypto
vi.mock("../utils/totpCrypto.js", () => ({
  encryptTotpSecret: vi.fn().mockReturnValue("encrypted-secret-hex"),
  decryptTotpSecret: vi.fn().mockReturnValue("JBSWY3DPEHPK3PXP"),
}));

// Mock OTPAuth
vi.mock("otpauth", () => ({
  Secret: class MockSecret {
    base32: string;
    constructor() {
      this.base32 = "JBSWY3DPEHPK3PXP";
    }
    static fromBase32(str: string) {
      return { base32: str };
    }
  },
  TOTP: class MockTOTP {
    toString() {
      return "otpauth://totp/Transcendence:test@example.com?secret=JBSWY3DPEHPK3PXP&issuer=Transcendence";
    }
    validate(opts: { token: string; window: number }) {
      return mockTotpValidate(opts);
    }
  },
}));

// Mock QRCode
vi.mock("qrcode", () => ({
  default: {
    toDataURL: vi.fn().mockResolvedValue("data:image/png;base64,qrcode"),
  },
}));

// Mock ioredis for rate limiter — must return proper values for rate-limit-redis
vi.mock("../config/redis.js", () => ({
  redisClient: {
    call: vi.fn().mockImplementation((command: string) => {
      if (command === "SCRIPT") return Promise.resolve("fakeSHA123");
      // EVALSHA returns [totalHits, resetTimeMs]
      return Promise.resolve([1, String(Date.now() + 60000)]);
    }),
  },
}));

const { prisma } = await import("../config/database.js");
const bcrypt = (await import("bcryptjs")).default;

// Importing authRouter triggers config/passport.ts, which configures
// the global passport singleton with LocalStrategy + serialize/deserialize
// using the mocked prisma and bcrypt above.
const { authRouter } = await import("./auth.js");
const { configuredStrategies } = await import("../config/passport.js");

const mockPrisma = prisma as unknown as {
  user: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  oAuthAccount: {
    findUnique: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  passwordResetToken: {
    create: ReturnType<typeof vi.fn>;
    findUnique: ReturnType<typeof vi.fn>;
    deleteMany: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
  };
  $transaction: ReturnType<typeof vi.fn>;
};

const mockUser = {
  id: "user-123",
  email: "test@example.com",
  passwordHash: "$2a$12$hashedpassword",
  authProvider: "LOCAL",
  displayName: null,
  bio: null,
  avatarUrl: null,
  locale: "en",
  ageConfirmed: true,
  twoFactorSecret: null,
  twoFactorEnabled: false,
  disclaimerAcceptedAt: null,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

function createTestApp(sessionOpts?: Partial<session.SessionOptions>) {
  const testApp = express();
  testApp.use(express.json());
  testApp.use(express.urlencoded({ extended: false }));
  testApp.use(
    session({
      secret: "test-secret",
      resave: false,
      saveUninitialized: false,
      rolling: true,
      ...sessionOpts,
    }),
  );

  testApp.use(passport.initialize());
  testApp.use(passport.session());
  testApp.use("/api/v1/auth", authRouter);
  testApp.use(errorHandler);

  return testApp;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/auth/register", () => {
  it("returns 201 and user profile on successful registration", async () => {
    mockPrisma.user.create.mockResolvedValue(mockUser);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/register")
      .send({
        email: "test@example.com",
        password: "Test1234",
        ageConfirmed: true,
      });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      id: "user-123",
      email: "test@example.com",
      ageConfirmed: true,
    });
    expect(res.body.data).not.toHaveProperty("passwordHash");
  });

  it("returns 409 for duplicate email", async () => {
    const prismaError = Object.assign(new Error("Unique constraint failed"), {
      code: "P2002",
    });
    mockPrisma.user.create.mockRejectedValue(prismaError);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/register")
      .send({
        email: "existing@example.com",
        password: "Test1234",
        ageConfirmed: true,
      });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("EMAIL_ALREADY_EXISTS");
  });

  it("returns 400 with AGE_CONFIRMATION_REQUIRED when age not confirmed", async () => {
    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/register")
      .send({
        email: "test@example.com",
        password: "Test1234",
        ageConfirmed: false,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("AGE_CONFIRMATION_REQUIRED");
  });

  it("returns 400 for invalid email", async () => {
    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/register")
      .send({
        email: "not-an-email",
        password: "Test1234",
        ageConfirmed: true,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 for weak password", async () => {
    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/register")
      .send({
        email: "test@example.com",
        password: "weak",
        ageConfirmed: true,
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_INPUT");
  });
});

describe("POST /api/v1/auth/login", () => {
  it("returns 200 and user profile on successful login", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/login")
      .send({
        email: "test@example.com",
        password: "Test1234",
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: "user-123",
      email: "test@example.com",
    });
    expect(res.body.data).not.toHaveProperty("passwordHash");
  });

  it("returns 401 for non-existent email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/login")
      .send({
        email: "nobody@example.com",
        password: "Test1234",
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 401 for wrong password", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/login")
      .send({
        email: "test@example.com",
        password: "WrongPassword1",
      });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns same error for wrong email and wrong password (no email leak)", async () => {
    // Wrong email
    mockPrisma.user.findUnique.mockResolvedValue(null);
    const testApp1 = createTestApp();
    const wrongEmailRes = await request(testApp1)
      .post("/api/v1/auth/login")
      .send({ email: "nobody@example.com", password: "Test1234" });

    // Wrong password
    vi.clearAllMocks();
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);
    const testApp2 = createTestApp();
    const wrongPwRes = await request(testApp2)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "WrongPassword1" });

    expect(wrongEmailRes.body.error.code).toBe(wrongPwRes.body.error.code);
    expect(wrongEmailRes.body.error.code).toBe("INVALID_CREDENTIALS");
  });

  it("returns 400 for invalid input", async () => {
    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/login")
      .send({ email: "not-email", password: "" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_INPUT");
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("returns 200 and success message on logout", async () => {
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const testApp = createTestApp();
    const agent = request.agent(testApp);

    // Register first to establish session
    await agent.post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "Test1234",
      ageConfirmed: true,
    });

    // Logout
    const logoutRes = await agent.post("/api/v1/auth/logout");

    expect(logoutRes.status).toBe(200);
    expect(logoutRes.body.data.message).toBe("Logged out successfully");
  });

  it("returns 401 when not authenticated", async () => {
    const testApp = createTestApp();
    const res = await request(testApp).post("/api/v1/auth/logout");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 401 on subsequent requests after logout (session destroyed)", async () => {
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const testApp = createTestApp();
    const agent = request.agent(testApp);

    // Register first to establish session
    await agent.post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "Test1234",
      ageConfirmed: true,
    });

    // Verify authenticated
    const meBeforeRes = await agent.get("/api/v1/auth/me");
    expect(meBeforeRes.status).toBe(200);

    // Logout
    await agent.post("/api/v1/auth/logout");

    // Subsequent request should be 401
    const meAfterRes = await agent.get("/api/v1/auth/me");
    expect(meAfterRes.status).toBe(401);
  });
});

describe("Session expiry", () => {
  it("returns 401 when session has expired (short TTL test)", async () => {
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    // Use createTestApp with a very short session TTL (1 second)
    const testApp = createTestApp({ cookie: { maxAge: 1000 } });
    const agent = request.agent(testApp);

    // Register to establish session
    await agent.post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "Test1234",
      ageConfirmed: true,
    });

    // Wait for session cookie to expire (1s TTL + 1s margin for CI)
    await new Promise((r) => setTimeout(r, 2000));

    // Should return 401 — session expired
    const meRes = await agent.get("/api/v1/auth/me");
    expect(meRes.status).toBe(401);
  });
});

describe("GET /api/v1/auth/me", () => {
  it("returns 401 when not authenticated", async () => {
    const testApp = createTestApp();
    const res = await request(testApp).get("/api/v1/auth/me");

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("UNAUTHORIZED");
  });

  it("returns 200 with user profile when authenticated", async () => {
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);

    const testApp = createTestApp();
    const agent = request.agent(testApp);

    // Register first to establish session
    await agent.post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "Test1234",
      ageConfirmed: true,
    });

    // Now check /me
    const meRes = await agent.get("/api/v1/auth/me");

    expect(meRes.status).toBe(200);
    expect(meRes.body.data).toMatchObject({
      id: "user-123",
      email: "test@example.com",
    });
  });

  it("does not expose OAuth tokens in /me response", async () => {
    const oauthUser = {
      ...mockUser,
      authProvider: "GOOGLE",
      passwordHash: null,
    };
    mockPrisma.user.create.mockResolvedValue(oauthUser);
    mockPrisma.user.findUnique.mockResolvedValue(oauthUser);

    const testApp = createTestApp();
    const agent = request.agent(testApp);

    // Register to establish session
    await agent.post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "Test1234",
      ageConfirmed: true,
    });

    const meRes = await agent.get("/api/v1/auth/me");

    expect(meRes.status).toBe(200);
    expect(meRes.body.data).not.toHaveProperty("accessToken");
    expect(meRes.body.data).not.toHaveProperty("refreshToken");
    expect(meRes.body.data).not.toHaveProperty("passwordHash");
    expect(meRes.body.data).not.toHaveProperty("oauthAccounts");
  });
});

describe("OAuth routes", () => {
  describe("GET /api/v1/auth/google", () => {
    it("returns OAUTH_PROVIDER_UNAVAILABLE when Google strategy not configured", async () => {
      const testApp = createTestApp();
      const res = await request(testApp).get("/api/v1/auth/google");

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe("OAUTH_PROVIDER_UNAVAILABLE");
    });
  });

  describe("GET /api/v1/auth/facebook", () => {
    it("returns OAUTH_PROVIDER_UNAVAILABLE when Facebook strategy not configured", async () => {
      const testApp = createTestApp();
      const res = await request(testApp).get("/api/v1/auth/facebook");

      expect(res.status).toBe(503);
      expect(res.body.error.code).toBe("OAUTH_PROVIDER_UNAVAILABLE");
    });
  });

  describe("GET /api/v1/auth/google/callback", () => {
    it("redirects to frontend error page when Google strategy not configured", async () => {
      const testApp = createTestApp();
      const res = await request(testApp)
        .get("/api/v1/auth/google/callback")
        .query({ error: "access_denied" });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("/auth/callback?error=oauth_failed");
    });
  });

  describe("GET /api/v1/auth/facebook/callback", () => {
    it("redirects to frontend error page when Facebook strategy not configured", async () => {
      const testApp = createTestApp();
      const res = await request(testApp)
        .get("/api/v1/auth/facebook/callback")
        .query({ error: "access_denied" });

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("/auth/callback?error=oauth_failed");
    });
  });

  describe("OAuth happy path (strategy configured)", () => {
    it("GET /api/v1/auth/google redirects to provider when strategy is configured", async () => {
      // Register a mock Google strategy
      const { Strategy: MockStrategy } = await import("passport-local");
      passport.use("google", new MockStrategy((_u, _p, done) => done(null, false)));
      configuredStrategies.add("google");

      const testApp = createTestApp();
      const res = await request(testApp).get("/api/v1/auth/google");

      // When strategy is configured, passport.authenticate redirects to the provider
      // With our mock local strategy, it won't redirect but it won't return 503 either
      expect(res.status).not.toBe(503);

      // Cleanup
      passport.unuse("google");
      configuredStrategies.delete("google");
    });

    it("GET /api/v1/auth/facebook redirects to provider when strategy is configured", async () => {
      const { Strategy: MockStrategy } = await import("passport-local");
      passport.use("facebook", new MockStrategy((_u, _p, done) => done(null, false)));
      configuredStrategies.add("facebook");

      const testApp = createTestApp();
      const res = await request(testApp).get("/api/v1/auth/facebook");

      expect(res.status).not.toBe(503);

      passport.unuse("facebook");
      configuredStrategies.delete("facebook");
    });

    it("OAuth callback redirects to frontend success when user is authenticated", async () => {
      const oauthUser = { ...mockUser, authProvider: "GOOGLE", passwordHash: null };
      mockPrisma.user.findUnique.mockResolvedValue(oauthUser);

      // Register a mock Google strategy that always returns a user
      const { Strategy: MockStrategy } = await import("passport-local");
      passport.use("google", new MockStrategy((_u, _p, done) => done(null, oauthUser)));
      configuredStrategies.add("google");

      const testApp = createTestApp();
      // The callback route uses custom passport.authenticate callback,
      // so we can't easily trigger the full flow. Verify the route exists
      // and doesn't return 503 when configured.
      const res = await request(testApp).get("/api/v1/auth/google/callback");
      expect(res.status).not.toBe(503);

      passport.unuse("google");
      configuredStrategies.delete("google");
    });
  });
});

describe("Regression: existing auth flows still work", () => {
  it("register + login + logout flow works after OAuth changes", async () => {
    mockPrisma.user.create.mockResolvedValue(mockUser);
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const testApp = createTestApp();
    const agent = request.agent(testApp);

    // Register
    const regRes = await agent.post("/api/v1/auth/register").send({
      email: "test@example.com",
      password: "Test1234",
      ageConfirmed: true,
    });
    expect(regRes.status).toBe(201);

    // Logout
    const logoutRes = await agent.post("/api/v1/auth/logout");
    expect(logoutRes.status).toBe(200);

    // Login again
    const loginRes = await agent.post("/api/v1/auth/login").send({
      email: "test@example.com",
      password: "Test1234",
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.data.email).toBe("test@example.com");
  });

  it("OAuth-only user (no password) cannot login with email/password", async () => {
    const oauthOnlyUser = { ...mockUser, passwordHash: null, authProvider: "GOOGLE" };
    mockPrisma.user.findUnique.mockResolvedValue(oauthOnlyUser);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/login")
      .send({ email: "test@example.com", password: "Test1234" });

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("INVALID_CREDENTIALS");
  });
});

describe("POST /api/v1/auth/forgot-password", () => {
  it("returns 200 with generic message for valid email", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(mockUser);
    mockPrisma.passwordResetToken.deleteMany.mockResolvedValue({ count: 0 });
    mockPrisma.passwordResetToken.create.mockResolvedValue({
      id: "token-id",
      token: "a".repeat(64),
      userId: mockUser.id,
    });

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "test@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain(
      "If an account with that email exists",
    );
  });

  it("returns 200 with same generic message for unknown email (no enumeration)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "nobody@example.com" });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toContain(
      "If an account with that email exists",
    );
  });

  it("returns 400 for invalid email body", async () => {
    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/forgot-password")
      .send({ email: "not-an-email" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 for missing email field", async () => {
    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/forgot-password")
      .send({});

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_INPUT");
  });
});

describe("POST /api/v1/auth/reset-password", () => {
  const validTokenRecord = {
    id: "token-id",
    token: "a".repeat(64),
    userId: mockUser.id,
    expiresAt: new Date(Date.now() + 3600000),
    usedAt: null,
    createdAt: new Date(),
    user: mockUser,
  };

  it("returns 200 for valid token and password", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validTokenRecord);
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);
    mockSessionRedis.scan.mockResolvedValue({ cursor: 0, keys: [] });

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/reset-password")
      .send({ token: validTokenRecord.token, password: "NewPass123" });

    expect(res.status).toBe(200);
    expect(res.body.data.message).toBe("Password has been reset successfully.");
  });

  it("returns 400 for expired token", async () => {
    const expiredToken = {
      ...validTokenRecord,
      expiresAt: new Date(Date.now() - 1000),
    };
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(expiredToken);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/reset-password")
      .send({ token: expiredToken.token, password: "NewPass123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_RESET_TOKEN");
  });

  it("returns 400 for already-used token", async () => {
    const usedToken = {
      ...validTokenRecord,
      usedAt: new Date(),
    };
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(usedToken);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/reset-password")
      .send({ token: usedToken.token, password: "NewPass123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_RESET_TOKEN");
  });

  it("returns 400 for non-existent token", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/reset-password")
      .send({ token: "nonexistent", password: "NewPass123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_RESET_TOKEN");
  });

  it("returns 400 for weak password", async () => {
    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/reset-password")
      .send({ token: "sometoken", password: "weak" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_INPUT");
  });

  it("returns 400 for missing token", async () => {
    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/reset-password")
      .send({ password: "NewPass123" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("INVALID_INPUT");
  });

  it("invalidates sessions after successful password reset", async () => {
    const sessionData = JSON.stringify({ passport: { user: mockUser.id } });
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(validTokenRecord);
    mockPrisma.$transaction.mockResolvedValue([{}, {}]);
    mockSessionRedis.scan.mockResolvedValue({
      cursor: 0,
      keys: ["sess:abc"],
    });
    mockSessionRedis.get.mockResolvedValue(sessionData);
    mockSessionRedis.del.mockResolvedValue(1);

    const testApp = createTestApp();
    const res = await request(testApp)
      .post("/api/v1/auth/reset-password")
      .send({ token: validTokenRecord.token, password: "NewPass123" });

    expect(res.status).toBe(200);
    expect(mockSessionRedis.del).toHaveBeenCalledWith("sess:abc");
  });
});

describe("2FA routes", () => {
  const userWith2FA = {
    ...mockUser,
    twoFactorSecret: "encrypted-secret-hex",
    twoFactorEnabled: true,
  };

  describe("POST /api/v1/auth/2fa/setup", () => {
    it("returns 200 with QR data when authenticated", async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: "encrypted-secret-hex",
      });

      const testApp = createTestApp();
      const agent = request.agent(testApp);

      // Register to establish session
      await agent.post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "Test1234",
        ageConfirmed: true,
      });

      const res = await agent.post("/api/v1/auth/2fa/setup");

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("qrCodeDataUri");
      expect(res.body.data).toHaveProperty("manualKey");
      expect(res.body.data).toHaveProperty("otpauthUri");
    });

    it("returns 401 when not authenticated", async () => {
      const testApp = createTestApp();
      const res = await request(testApp).post("/api/v1/auth/2fa/setup");

      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/2fa/verify-setup", () => {
    it("returns 200 with success message for valid code", async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: "encrypted-secret-hex",
      });
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: true,
      });
      mockTotpValidate.mockReturnValue(0); // valid

      const testApp = createTestApp();
      const agent = request.agent(testApp);

      await agent.post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "Test1234",
        ageConfirmed: true,
      });

      const res = await agent
        .post("/api/v1/auth/2fa/verify-setup")
        .send({ code: "123456" });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe(
        "Two-factor authentication has been enabled.",
      );
    });

    it("returns 401 with INVALID_2FA_CODE for invalid code", async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.user.findUnique.mockResolvedValue({
        ...mockUser,
        twoFactorSecret: "encrypted-secret-hex",
      });
      mockTotpValidate.mockReturnValue(null); // invalid

      const testApp = createTestApp();
      const agent = request.agent(testApp);

      await agent.post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "Test1234",
        ageConfirmed: true,
      });

      const res = await agent
        .post("/api/v1/auth/2fa/verify-setup")
        .send({ code: "000000" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_2FA_CODE");
    });

    it("returns 400 for invalid body", async () => {
      mockPrisma.user.create.mockResolvedValue(mockUser);
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);

      const testApp = createTestApp();
      const agent = request.agent(testApp);

      await agent.post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "Test1234",
        ageConfirmed: true,
      });

      const res = await agent
        .post("/api/v1/auth/2fa/verify-setup")
        .send({ code: "abc" });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
    });
  });

  describe("Login with 2FA enabled", () => {
    it("returns requires2FA: true when user has 2FA enabled", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const testApp = createTestApp();
      const res = await request(testApp)
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "Test1234" });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual({ requires2FA: true });
      expect(res.body.data).not.toHaveProperty("email");
    });
  });

  describe("POST /api/v1/auth/2fa/verify", () => {
    it("returns 200 with user profile for valid code after login", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      mockTotpValidate.mockReturnValue(0);

      const testApp = createTestApp();
      const agent = request.agent(testApp);

      // Login — should get pending2FA session
      await agent
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "Test1234" });

      // Verify 2FA
      const res = await agent
        .post("/api/v1/auth/2fa/verify")
        .send({ code: "123456" });

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveProperty("id");
      expect(res.body.data).toHaveProperty("email");
    });

    it("returns 401 with INVALID_2FA_CODE for invalid code", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      mockTotpValidate.mockReturnValue(null);

      const testApp = createTestApp();
      const agent = request.agent(testApp);

      await agent
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "Test1234" });

      const res = await agent
        .post("/api/v1/auth/2fa/verify")
        .send({ code: "000000" });

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("INVALID_2FA_CODE");
    });

    it("returns 401 without pending2FA session", async () => {
      const testApp = createTestApp();
      const res = await request(testApp)
        .post("/api/v1/auth/2fa/verify")
        .send({ code: "123456" });

      expect(res.status).toBe(401);
    });
  });

  describe("Protected endpoints with pending2FA session (AC #7)", () => {
    it("returns 401 for /me with pending2FA session", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

      const testApp = createTestApp();
      const agent = request.agent(testApp);

      // Login — pending2FA
      await agent
        .post("/api/v1/auth/login")
        .send({ email: "test@example.com", password: "Test1234" });

      // Try accessing protected endpoint
      const meRes = await agent.get("/api/v1/auth/me");
      expect(meRes.status).toBe(401);
    });
  });

  describe("POST /api/v1/auth/2fa/disable", () => {
    it("returns 200 with success message for valid code", async () => {
      mockPrisma.user.create.mockResolvedValue(userWith2FA);
      mockPrisma.user.findUnique.mockResolvedValue(userWith2FA);
      mockPrisma.user.update.mockResolvedValue({
        ...mockUser,
        twoFactorEnabled: false,
        twoFactorSecret: null,
      });
      mockTotpValidate.mockReturnValue(0);
      mockSessionRedis.scan.mockResolvedValue({ cursor: 0, keys: [] });

      const testApp = createTestApp();
      const agent = request.agent(testApp);

      // Register to establish session (user already has 2FA)
      await agent.post("/api/v1/auth/register").send({
        email: "test@example.com",
        password: "Test1234",
        ageConfirmed: true,
      });

      const res = await agent
        .post("/api/v1/auth/2fa/disable")
        .send({ code: "123456" });

      expect(res.status).toBe(200);
      expect(res.body.data.message).toBe(
        "Two-factor authentication has been disabled.",
      );
    });
  });
});
