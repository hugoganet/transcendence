import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUniqueOrThrow: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn(),
  },
  notification: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
  },
  userProgress: {
    count: vi.fn(),
  },
  chapterProgress: {
    count: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({ prisma: mockPrisma }));

const mockNotificationService = vi.hoisted(() => ({
  createAndPushNotification: vi.fn(),
  createNotification: vi.fn(),
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  getUnreadNotifications: vi.fn(),
}));

vi.mock("./notificationService.js", () => mockNotificationService);

const mockEmailService = vi.hoisted(() => ({
  sendReEngagementEmail: vi.fn(),
}));

vi.mock("./emailService.js", () => mockEmailService);

const {
  checkReengagement,
  checkAllReengagements,
  checkStreakReminders,
  getUserNotificationPreferences,
  updateNotificationPreferences,
  shouldSendNotification,
} = await import("./engagementService.js");

const mockFetchSockets = vi.fn();
const mockIo = {
  in: vi.fn(() => ({ fetchSockets: mockFetchSockets })),
} as unknown as Parameters<typeof checkReengagement>[0];

const TEST_USER_ID = "user-123";

describe("engagementService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("checkReengagement", () => {
    it("creates re-engagement notification for 7+ day inactive user", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
      });
      // Second call for lastMissionCompletedAt
      mockPrisma.user.findUniqueOrThrow
        .mockResolvedValueOnce({
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        })
        .mockResolvedValueOnce({
          lastMissionCompletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          displayName: "TestUser",
          email: "testuser@example.com",
        });

      mockPrisma.notification.findFirst.mockResolvedValue(null);
      mockPrisma.userProgress.count.mockResolvedValue(5);
      mockPrisma.chapterProgress.count.mockResolvedValue(2);
      mockNotificationService.createAndPushNotification.mockResolvedValue({});
      mockFetchSockets.mockResolvedValue([{ id: "socket-1" }]); // user is connected

      await checkReengagement(mockIo, TEST_USER_ID);

      expect(mockNotificationService.createAndPushNotification).toHaveBeenCalledWith(
        mockIo,
        TEST_USER_ID,
        "REENGAGEMENT",
        "Welcome back!",
        expect.stringContaining("5 missions"),
        expect.objectContaining({ totalMissionsCompleted: 5, totalChaptersCompleted: 2 }),
      );
    });

    it("skips if user opted out of reengagement notifications", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        notificationPreferences: { streakReminder: true, reengagement: false, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
      });

      await checkReengagement(mockIo, TEST_USER_ID);

      expect(mockNotificationService.createAndPushNotification).not.toHaveBeenCalled();
    });

    it("skips if user never completed a mission", async () => {
      mockPrisma.user.findUniqueOrThrow
        .mockResolvedValueOnce({
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        })
        .mockResolvedValueOnce({
          lastMissionCompletedAt: null,
          displayName: "TestUser",
          email: "testuser@example.com",
        });

      await checkReengagement(mockIo, TEST_USER_ID);

      expect(mockNotificationService.createAndPushNotification).not.toHaveBeenCalled();
    });

    it("skips if last mission was less than 7 days ago", async () => {
      mockPrisma.user.findUniqueOrThrow
        .mockResolvedValueOnce({
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        })
        .mockResolvedValueOnce({
          lastMissionCompletedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          displayName: "TestUser",
          email: "testuser@example.com",
        });

      await checkReengagement(mockIo, TEST_USER_ID);

      expect(mockNotificationService.createAndPushNotification).not.toHaveBeenCalled();
    });

    it("deduplicates — skips if REENGAGEMENT notification sent within 24 hours", async () => {
      mockPrisma.user.findUniqueOrThrow
        .mockResolvedValueOnce({
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        })
        .mockResolvedValueOnce({
          lastMissionCompletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          displayName: "TestUser",
          email: "testuser@example.com",
        });

      mockPrisma.notification.findFirst.mockResolvedValue({ id: "existing-notif" });

      await checkReengagement(mockIo, TEST_USER_ID);

      expect(mockNotificationService.createAndPushNotification).not.toHaveBeenCalled();
    });

    it("sends re-engagement email to disconnected users", async () => {
      mockPrisma.user.findUniqueOrThrow
        .mockResolvedValueOnce({
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        })
        .mockResolvedValueOnce({
          lastMissionCompletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          displayName: "OfflineUser",
          email: "offline@example.com",
        });

      mockPrisma.notification.findFirst.mockResolvedValue(null);
      mockPrisma.userProgress.count.mockResolvedValue(3);
      mockPrisma.chapterProgress.count.mockResolvedValue(1);
      mockNotificationService.createAndPushNotification.mockResolvedValue({});
      mockFetchSockets.mockResolvedValue([]); // user is NOT connected

      await checkReengagement(mockIo, TEST_USER_ID);

      expect(mockEmailService.sendReEngagementEmail).toHaveBeenCalledWith(
        "offline@example.com",
        "OfflineUser",
        expect.objectContaining({
          totalMissions: 3,
          totalChapters: 1,
        }),
        expect.stringContaining("/curriculum"),
      );
    });

    it("does NOT send re-engagement email to connected users", async () => {
      mockPrisma.user.findUniqueOrThrow
        .mockResolvedValueOnce({
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        })
        .mockResolvedValueOnce({
          lastMissionCompletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          displayName: "OnlineUser",
          email: "online@example.com",
        });

      mockPrisma.notification.findFirst.mockResolvedValue(null);
      mockPrisma.userProgress.count.mockResolvedValue(5);
      mockPrisma.chapterProgress.count.mockResolvedValue(2);
      mockNotificationService.createAndPushNotification.mockResolvedValue({});
      mockFetchSockets.mockResolvedValue([{ id: "socket-1" }]); // user IS connected

      await checkReengagement(mockIo, TEST_USER_ID);

      expect(mockEmailService.sendReEngagementEmail).not.toHaveBeenCalled();
    });

    it("does NOT send re-engagement email when user has no email", async () => {
      mockPrisma.user.findUniqueOrThrow
        .mockResolvedValueOnce({
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        })
        .mockResolvedValueOnce({
          lastMissionCompletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          displayName: "NoEmailUser",
          email: null,
        });

      mockPrisma.notification.findFirst.mockResolvedValue(null);
      mockPrisma.userProgress.count.mockResolvedValue(3);
      mockPrisma.chapterProgress.count.mockResolvedValue(1);
      mockNotificationService.createAndPushNotification.mockResolvedValue({});
      mockFetchSockets.mockResolvedValue([]); // user is NOT connected

      await checkReengagement(mockIo, TEST_USER_ID);

      // In-app notification should still be created
      expect(mockNotificationService.createAndPushNotification).toHaveBeenCalled();
      // But email should NOT be sent (no email address)
      expect(mockEmailService.sendReEngagementEmail).not.toHaveBeenCalled();
    });

    it("respects reengagement preference for email too", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        notificationPreferences: { streakReminder: true, reengagement: false, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
      });

      await checkReengagement(mockIo, TEST_USER_ID);

      expect(mockEmailService.sendReEngagementEmail).not.toHaveBeenCalled();
    });
  });

  describe("checkAllReengagements", () => {
    it("queries inactive users and calls checkReengagement for each", async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { id: "user-a" },
        { id: "user-b" },
      ]);

      // Mock the full checkReengagement flow for each user (preference check + user fetch + dedup)
      mockPrisma.user.findUniqueOrThrow
        // user-a: preference check
        .mockResolvedValueOnce({
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        })
        // user-a: user data
        .mockResolvedValueOnce({
          lastMissionCompletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
          displayName: "UserA",
          email: "a@example.com",
        })
        // user-b: preference check
        .mockResolvedValueOnce({
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        })
        // user-b: user data
        .mockResolvedValueOnce({
          lastMissionCompletedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          displayName: "UserB",
          email: "b@example.com",
        });

      mockPrisma.notification.findFirst.mockResolvedValue(null); // no dedup
      mockPrisma.userProgress.count.mockResolvedValue(3);
      mockPrisma.chapterProgress.count.mockResolvedValue(1);
      mockNotificationService.createAndPushNotification.mockResolvedValue({});
      mockFetchSockets.mockResolvedValue([]); // both users offline → email sent

      const count = await checkAllReengagements(mockIo);

      expect(count).toBe(2);
      expect(mockEmailService.sendReEngagementEmail).toHaveBeenCalledTimes(2);
    });

    it("returns 0 when no inactive users found", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const count = await checkAllReengagements(mockIo);

      expect(count).toBe(0);
      expect(mockEmailService.sendReEngagementEmail).not.toHaveBeenCalled();
    });
  });

  describe("checkStreakReminders", () => {
    it("sends streak reminder to connected users with active streaks", async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "user-1",
          currentStreak: 5,
          displayName: "Streak User",
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        },
      ]);

      mockPrisma.notification.findMany.mockResolvedValue([]); // no dedup hits
      mockFetchSockets.mockResolvedValue([{ id: "socket-1" }]); // user is connected
      mockNotificationService.createAndPushNotification.mockResolvedValue({});

      const count = await checkStreakReminders(mockIo);

      expect(count).toBe(1);
      expect(mockNotificationService.createAndPushNotification).toHaveBeenCalledWith(
        mockIo,
        "user-1",
        "STREAK_REMINDER",
        "Keep your streak alive!",
        "You're on a 5-day streak. Complete a mission today to keep it going!",
        { currentStreak: 5 },
      );
    });

    it("skips users who are not connected via Socket.IO", async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "user-1",
          currentStreak: 5,
          displayName: "Offline User",
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        },
      ]);

      mockPrisma.notification.findMany.mockResolvedValue([]);
      mockFetchSockets.mockResolvedValue([]); // user is NOT connected

      const count = await checkStreakReminders(mockIo);

      expect(count).toBe(0);
      expect(mockNotificationService.createAndPushNotification).not.toHaveBeenCalled();
    });

    it("skips users who opted out of streak reminders", async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "user-1",
          currentStreak: 3,
          displayName: "Opted Out",
          notificationPreferences: { streakReminder: false, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        },
      ]);

      const count = await checkStreakReminders(mockIo);

      expect(count).toBe(0);
      expect(mockNotificationService.createAndPushNotification).not.toHaveBeenCalled();
    });

    it("deduplicates — skips if streak reminder already sent today", async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        {
          id: "user-1",
          currentStreak: 5,
          displayName: "Already Notified",
          notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
        },
      ]);

      mockPrisma.notification.findMany.mockResolvedValue([{ userId: "user-1" }]); // already sent

      const count = await checkStreakReminders(mockIo);

      expect(count).toBe(0);
      expect(mockNotificationService.createAndPushNotification).not.toHaveBeenCalled();
    });

    it("returns 0 when no users at risk", async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);

      const count = await checkStreakReminders(mockIo);

      expect(count).toBe(0);
    });
  });

  describe("getUserNotificationPreferences", () => {
    it("returns parsed preferences from user", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        notificationPreferences: { streakReminder: false, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
      });

      const prefs = await getUserNotificationPreferences(TEST_USER_ID);

      expect(prefs.streakReminder).toBe(false);
      expect(prefs.reengagement).toBe(true);
    });

    it("returns defaults if preferences are null", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        notificationPreferences: null,
      });

      const prefs = await getUserNotificationPreferences(TEST_USER_ID);

      expect(prefs).toEqual({
        streakReminder: true,
        reengagement: true,
        moduleComplete: true,
        tokenThreshold: true,
        streakMilestone: true,
      });
    });
  });

  describe("updateNotificationPreferences", () => {
    it("merges partial updates with existing preferences", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
      });
      mockPrisma.user.update.mockResolvedValue({});

      const result = await updateNotificationPreferences(TEST_USER_ID, {
        streakReminder: false,
      });

      expect(result.streakReminder).toBe(false);
      expect(result.reengagement).toBe(true);
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: TEST_USER_ID },
        data: {
          notificationPreferences: {
            streakReminder: false,
            reengagement: true,
            moduleComplete: true,
            tokenThreshold: true,
            streakMilestone: true,
          },
        },
      });
    });
  });

  describe("shouldSendNotification", () => {
    it("returns true when preference is enabled", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        notificationPreferences: { streakReminder: true, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
      });

      expect(await shouldSendNotification(TEST_USER_ID, "streakReminder")).toBe(true);
    });

    it("returns false when preference is disabled", async () => {
      mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
        notificationPreferences: { streakReminder: false, reengagement: true, moduleComplete: true, tokenThreshold: true, streakMilestone: true },
      });

      expect(await shouldSendNotification(TEST_USER_ID, "streakReminder")).toBe(false);
    });
  });
});
