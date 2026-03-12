import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCheckStreakReminders = vi.hoisted(() => vi.fn());

vi.mock("../services/engagementService.js", () => ({
  checkStreakReminders: mockCheckStreakReminders,
}));

vi.mock("../config/database.js", () => ({ prisma: {} }));
vi.mock("../services/notificationService.js", () => ({
  createAndPushNotification: vi.fn(),
  createNotification: vi.fn(),
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  getUnreadNotifications: vi.fn(),
}));

const { startStreakReminderScheduler, stopStreakReminderScheduler } = await import(
  "./streakReminder.js"
);

const mockIo = {} as Parameters<typeof startStreakReminderScheduler>[0];

describe("streakReminderScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    stopStreakReminderScheduler();
  });

  afterEach(() => {
    stopStreakReminderScheduler();
    vi.useRealTimers();
  });

  it("calls checkStreakReminders at the configured interval", async () => {
    mockCheckStreakReminders.mockResolvedValue(0);

    startStreakReminderScheduler(mockIo);

    // Advance by 1 hour (STREAK_REMINDER_INTERVAL_MS = 3_600_000)
    await vi.advanceTimersByTimeAsync(3_600_000);

    expect(mockCheckStreakReminders).toHaveBeenCalledTimes(1);
    expect(mockCheckStreakReminders).toHaveBeenCalledWith(mockIo);

    // Advance another hour
    await vi.advanceTimersByTimeAsync(3_600_000);

    expect(mockCheckStreakReminders).toHaveBeenCalledTimes(2);
  });

  it("does not start multiple intervals", () => {
    mockCheckStreakReminders.mockResolvedValue(0);

    startStreakReminderScheduler(mockIo);
    startStreakReminderScheduler(mockIo); // second call should be no-op

    vi.advanceTimersByTime(3_600_000);

    expect(mockCheckStreakReminders).toHaveBeenCalledTimes(1);
  });

  it("stops the interval when stopStreakReminderScheduler is called", async () => {
    mockCheckStreakReminders.mockResolvedValue(0);

    startStreakReminderScheduler(mockIo);
    stopStreakReminderScheduler();

    await vi.advanceTimersByTimeAsync(3_600_000);

    expect(mockCheckStreakReminders).not.toHaveBeenCalled();
  });

  it("catches errors from checkStreakReminders without crashing", async () => {
    mockCheckStreakReminders.mockRejectedValue(new Error("DB error"));

    startStreakReminderScheduler(mockIo);

    // Should not throw
    await vi.advanceTimersByTimeAsync(3_600_000);

    expect(mockCheckStreakReminders).toHaveBeenCalledTimes(1);
  });
});
