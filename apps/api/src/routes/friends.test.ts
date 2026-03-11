import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";

const mockFriendService = vi.hoisted(() => ({
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  getFriends: vi.fn(),
  getPendingRequests: vi.fn(),
}));

vi.mock("../services/friendService.js", () => mockFriendService);

vi.mock("../config/database.js", () => ({
  prisma: {},
}));

vi.mock("../config/redis.js", () => ({
  redisClient: { smembers: vi.fn() },
}));

vi.mock("../config/session.js", () => ({
  sessionRedisClient: { scan: vi.fn(), get: vi.fn(), del: vi.fn() },
  sessionMiddleware: vi.fn(),
}));

vi.mock("../services/emailService.js", () => ({
  sendPasswordResetEmail: vi.fn(),
}));

vi.mock("../utils/totpCrypto.js", () => ({
  encryptTotpSecret: vi.fn(),
  decryptTotpSecret: vi.fn(),
}));

vi.mock("sharp", () => ({
  default: vi.fn(() => ({
    resize: vi.fn().mockReturnThis(),
    jpeg: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock("node:fs/promises", () => ({
  default: {
    mkdir: vi.fn().mockResolvedValue(undefined),
    unlink: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../utils/contentLoader.js", () => ({
  getContent: vi.fn(),
  initializeContent: vi.fn(),
  loadCurriculum: vi.fn(),
  loadMissions: vi.fn(),
  loadTooltips: vi.fn(),
  loadUIStrings: vi.fn(),
  getStaleContent: vi.fn(),
}));

const { friendsRouter } = await import("./friends.js");

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";
const FRIEND_USER_ID = "660e8400-e29b-41d4-a716-446655440001";

function createTestApp(authenticated: boolean) {
  const app = express();
  app.use(express.json());
  app.use(session({ secret: "test", resave: false, saveUninitialized: false }));
  app.use(passport.initialize());
  app.use(passport.session());

  if (authenticated) {
    app.use((req, _res, next) => {
      req.user = { id: TEST_USER_ID, locale: "en" } as Express.User;
      req.isAuthenticated = () => true;
      next();
    });
  }

  app.use("/api/v1/friends", friendsRouter);
  app.use(errorHandler);
  return app;
}

describe("Friends Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication (AC #11)", () => {
    it("GET / returns 401 without auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/friends");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("GET /requests returns 401 without auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/friends/requests");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("POST /:userId returns 401 without auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).post(`/api/v1/friends/${FRIEND_USER_ID}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("POST /:userId/accept returns 401 without auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).post(`/api/v1/friends/${FRIEND_USER_ID}/accept`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("DELETE /:userId returns 401 without auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).delete(`/api/v1/friends/${FRIEND_USER_ID}`);
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("POST /:userId — send friend request", () => {
    it("calls sendFriendRequest and returns 201", async () => {
      const friendshipData = {
        id: "fr-1",
        requesterId: TEST_USER_ID,
        addresseeId: FRIEND_USER_ID,
        status: "PENDING",
        createdAt: "2026-03-10T14:00:00.000Z",
        updatedAt: "2026-03-10T14:00:00.000Z",
      };
      mockFriendService.sendFriendRequest.mockResolvedValue(friendshipData);

      const app = createTestApp(true);
      const res = await request(app).post(`/api/v1/friends/${FRIEND_USER_ID}`);

      expect(res.status).toBe(201);
      expect(res.body.data).toEqual(friendshipData);
      expect(mockFriendService.sendFriendRequest).toHaveBeenCalledWith(TEST_USER_ID, FRIEND_USER_ID);
    });

    it("returns 400 for invalid UUID param", async () => {
      const app = createTestApp(true);
      const res = await request(app).post("/api/v1/friends/not-a-uuid");

      expect(res.status).toBe(400);
    });
  });

  describe("POST /:userId/accept — accept friend request", () => {
    it("calls acceptFriendRequest and returns 200", async () => {
      const friendshipData = {
        id: "fr-1",
        requesterId: FRIEND_USER_ID,
        addresseeId: TEST_USER_ID,
        status: "ACCEPTED",
        createdAt: "2026-03-10T14:00:00.000Z",
        updatedAt: "2026-03-10T14:01:00.000Z",
      };
      mockFriendService.acceptFriendRequest.mockResolvedValue(friendshipData);

      const app = createTestApp(true);
      const res = await request(app).post(`/api/v1/friends/${FRIEND_USER_ID}/accept`);

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(friendshipData);
      expect(mockFriendService.acceptFriendRequest).toHaveBeenCalledWith(TEST_USER_ID, FRIEND_USER_ID);
    });
  });

  describe("DELETE /:userId — remove friend", () => {
    it("calls removeFriend and returns 204", async () => {
      mockFriendService.removeFriend.mockResolvedValue(undefined);

      const app = createTestApp(true);
      const res = await request(app).delete(`/api/v1/friends/${FRIEND_USER_ID}`);

      expect(res.status).toBe(204);
      expect(mockFriendService.removeFriend).toHaveBeenCalledWith(TEST_USER_ID, FRIEND_USER_ID);
    });
  });

  describe("GET / — list friends", () => {
    it("calls getFriends and returns 200 with data array", async () => {
      const friends = [
        { id: "user-2", displayName: "Bob", avatarUrl: null, online: true },
      ];
      mockFriendService.getFriends.mockResolvedValue(friends);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/friends");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(friends);
      expect(mockFriendService.getFriends).toHaveBeenCalledWith(TEST_USER_ID);
    });
  });

  describe("GET /requests — list pending requests", () => {
    it("calls getPendingRequests and returns 200 with data array", async () => {
      const requests = [
        { id: "user-3", displayName: "Charlie", avatarUrl: null, createdAt: "2026-03-10T14:00:00.000Z" },
      ];
      mockFriendService.getPendingRequests.mockResolvedValue(requests);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/friends/requests");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(requests);
      expect(mockFriendService.getPendingRequests).toHaveBeenCalledWith(TEST_USER_ID);
    });
  });
});
