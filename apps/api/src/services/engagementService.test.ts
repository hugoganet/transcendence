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

const {
  checkReengagement,
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
        });

      mockPrisma.notification.findFirst.mockResolvedValue(null);
      mockPrisma.userProgress.count.mockResolvedValue(5);
      mockPrisma.chapterProgress.count.mockResolvedValue(2);
      mockNotificationService.createAndPushNotification.mockResolvedValue({});

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
        });

      mockPrisma.notification.findFirst.mockResolvedValue({ id: "existing-notif" });

      await checkReengagement(mockIo, TEST_USER_ID);

      expect(mockNotificationService.createAndPushNotification).not.toHaveBeenCalled();
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
