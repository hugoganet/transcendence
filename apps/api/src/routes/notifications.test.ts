import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import session from "express-session";
import passport from "passport";
import request from "supertest";
import { errorHandler } from "../middleware/errorHandler.js";
import { AppError } from "../utils/AppError.js";

const mockNotificationService = vi.hoisted(() => ({
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  createNotification: vi.fn(),
  createAndPushNotification: vi.fn(),
  getUnreadNotifications: vi.fn(),
}));

vi.mock("../services/notificationService.js", () => mockNotificationService);

const mockEngagementService = vi.hoisted(() => ({
  getUserNotificationPreferences: vi.fn(),
  updateNotificationPreferences: vi.fn(),
  checkReengagement: vi.fn(),
  checkStreakReminders: vi.fn(),
  shouldSendNotification: vi.fn(),
}));

vi.mock("../services/engagementService.js", () => mockEngagementService);

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

const { notificationsRouter } = await import("./notifications.js");

const TEST_USER_ID = "550e8400-e29b-41d4-a716-446655440000";

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

  app.use("/api/v1/notifications", notificationsRouter);
  app.use(errorHandler);
  return app;
}

describe("Notifications Routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Authentication", () => {
    it("GET / returns 401 without auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/notifications");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("PATCH /:id/read returns 401 without auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).patch("/api/v1/notifications/notif-1/read");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("GET /preferences returns 401 without auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).get("/api/v1/notifications/preferences");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("PATCH /preferences returns 401 without auth", async () => {
      const app = createTestApp(false);
      const res = await request(app).patch("/api/v1/notifications/preferences");
      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET / — list notifications", () => {
    it("returns paginated notifications with default params", async () => {
      const notifications = [
        {
          id: "n1",
          type: "STREAK_MILESTONE",
          title: "7-day streak!",
          body: "Keep it up!",
          read: false,
          data: null,
          createdAt: "2026-03-11T10:00:00.000Z",
        },
      ];
      mockNotificationService.getNotifications.mockResolvedValue({
        notifications,
        meta: { page: 1, pageSize: 20, total: 1 },
      });

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/notifications");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(notifications);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 1 });
      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(TEST_USER_ID, 1, 20);
    });

    it("passes custom page and pageSize query params", async () => {
      mockNotificationService.getNotifications.mockResolvedValue({
        notifications: [],
        meta: { page: 2, pageSize: 5, total: 0 },
      });

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/notifications?page=2&pageSize=5");

      expect(res.status).toBe(200);
      expect(mockNotificationService.getNotifications).toHaveBeenCalledWith(TEST_USER_ID, 2, 5);
    });

    it("returns 400 for invalid page param", async () => {
      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/notifications?page=0");
      expect(res.status).toBe(400);
    });
  });

  describe("GET /preferences — get notification preferences", () => {
    it("returns user notification preferences", async () => {
      const prefs = {
        streakReminder: true,
        reengagement: true,
        moduleComplete: true,
        tokenThreshold: true,
        streakMilestone: false,
      };
      mockEngagementService.getUserNotificationPreferences.mockResolvedValue(prefs);

      const app = createTestApp(true);
      const res = await request(app).get("/api/v1/notifications/preferences");

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(prefs);
      expect(mockEngagementService.getUserNotificationPreferences).toHaveBeenCalledWith(
        TEST_USER_ID,
      );
    });
  });

  describe("PATCH /preferences — update notification preferences", () => {
    it("updates and returns merged preferences", async () => {
      const updated = {
        streakReminder: false,
        reengagement: true,
        moduleComplete: true,
        tokenThreshold: true,
        streakMilestone: true,
      };
      mockEngagementService.updateNotificationPreferences.mockResolvedValue(updated);

      const app = createTestApp(true);
      const res = await request(app)
        .patch("/api/v1/notifications/preferences")
        .send({ streakReminder: false });

      expect(res.status).toBe(200);
      expect(res.body.data).toEqual(updated);
      expect(mockEngagementService.updateNotificationPreferences).toHaveBeenCalledWith(
        TEST_USER_ID,
        { streakReminder: false },
      );
    });

    it("returns 400 for invalid preference key type", async () => {
      const app = createTestApp(true);
      const res = await request(app)
        .patch("/api/v1/notifications/preferences")
        .send({ streakReminder: "not-a-boolean" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /:id/read — mark notification as read", () => {
    it("returns 204 on success", async () => {
      mockNotificationService.markAsRead.mockResolvedValue({});

      const app = createTestApp(true);
      const res = await request(app).patch("/api/v1/notifications/notif-1/read");

      expect(res.status).toBe(204);
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(TEST_USER_ID, "notif-1");
    });

    it("returns 404 when notification not found", async () => {
      mockNotificationService.markAsRead.mockRejectedValue(
        AppError.notFound("Notification not found"),
      );

      const app = createTestApp(true);
      const res = await request(app).patch("/api/v1/notifications/notif-999/read");

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });
});
