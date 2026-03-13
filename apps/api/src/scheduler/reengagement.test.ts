import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockCheckAllReengagements = vi.hoisted(() => vi.fn());

vi.mock("../services/engagementService.js", () => ({
  checkAllReengagements: mockCheckAllReengagements,
}));

vi.mock("../config/database.js", () => ({ prisma: {} }));
vi.mock("../services/notificationService.js", () => ({
  createAndPushNotification: vi.fn(),
  createNotification: vi.fn(),
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  getUnreadNotifications: vi.fn(),
}));
vi.mock("../services/emailService.js", () => ({
  sendReEngagementEmail: vi.fn(),
}));

const { startReengagementScheduler, stopReengagementScheduler } = await import(
  "./reengagement.js"
);

const mockIo = {} as Parameters<typeof startReengagementScheduler>[0];

describe("reengagementScheduler", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    stopReengagementScheduler();
  });

  afterEach(() => {
    stopReengagementScheduler();
    vi.useRealTimers();
  });

  it("calls checkAllReengagements at the configured interval (24h)", async () => {
    mockCheckAllReengagements.mockResolvedValue(0);

    startReengagementScheduler(mockIo);

    // Advance by 24 hours (REENGAGEMENT_CHECK_INTERVAL_MS = 86_400_000)
    await vi.advanceTimersByTimeAsync(86_400_000);

    expect(mockCheckAllReengagements).toHaveBeenCalledTimes(1);
    expect(mockCheckAllReengagements).toHaveBeenCalledWith(mockIo);
  });

  it("does not start multiple intervals", () => {
    mockCheckAllReengagements.mockResolvedValue(0);

    startReengagementScheduler(mockIo);
    startReengagementScheduler(mockIo); // second call should be no-op

    vi.advanceTimersByTime(86_400_000);

    expect(mockCheckAllReengagements).toHaveBeenCalledTimes(1);
  });

  it("stops the interval when stopReengagementScheduler is called", async () => {
    mockCheckAllReengagements.mockResolvedValue(0);

    startReengagementScheduler(mockIo);
    stopReengagementScheduler();

    await vi.advanceTimersByTimeAsync(86_400_000);

    expect(mockCheckAllReengagements).not.toHaveBeenCalled();
  });

  it("catches errors from checkAllReengagements without crashing", async () => {
    mockCheckAllReengagements.mockRejectedValue(new Error("DB error"));

    startReengagementScheduler(mockIo);

    // Should not throw
    await vi.advanceTimersByTimeAsync(86_400_000);

    expect(mockCheckAllReengagements).toHaveBeenCalledTimes(1);
  });
});
