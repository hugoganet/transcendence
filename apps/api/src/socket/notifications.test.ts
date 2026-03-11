import { describe, it, expect, vi, beforeEach } from "vitest";

const mockGetUnreadNotifications = vi.fn();

vi.mock("../services/notificationService.js", () => ({
  getUnreadNotifications: mockGetUnreadNotifications,
}));

const { handleNotificationConnect } = await import("./notifications.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("handleNotificationConnect", () => {
  it("emits unread notifications to the connecting socket", async () => {
    const unread = [
      { id: "n1", type: "STREAK_REMINDER", title: "Keep going!", body: "Body 1", data: null },
      { id: "n2", type: "MODULE_COMPLETE", title: "Done!", body: "Body 2", data: { moduleId: "1" } },
    ];
    mockGetUnreadNotifications.mockResolvedValue(unread);

    const mockEmit = vi.fn();
    const mockSocket = { data: { userId: "user-1" }, emit: mockEmit } as unknown as Parameters<typeof handleNotificationConnect>[1];
    const mockIo = {} as unknown as Parameters<typeof handleNotificationConnect>[0];

    await handleNotificationConnect(mockIo, mockSocket);

    expect(mockGetUnreadNotifications).toHaveBeenCalledWith("user-1");
    expect(mockEmit).toHaveBeenCalledTimes(2);
    expect(mockEmit).toHaveBeenCalledWith("notification:push", {
      id: "n1",
      type: "STREAK_REMINDER",
      title: "Keep going!",
      body: "Body 1",
      data: null,
    });
    expect(mockEmit).toHaveBeenCalledWith("notification:push", {
      id: "n2",
      type: "MODULE_COMPLETE",
      title: "Done!",
      body: "Body 2",
      data: { moduleId: "1" },
    });
  });

  it("does nothing when userId is not set", async () => {
    const mockSocket = { data: {}, emit: vi.fn() } as unknown as Parameters<typeof handleNotificationConnect>[1];
    const mockIo = {} as unknown as Parameters<typeof handleNotificationConnect>[0];

    await handleNotificationConnect(mockIo, mockSocket);

    expect(mockGetUnreadNotifications).not.toHaveBeenCalled();
    expect(mockSocket.emit).not.toHaveBeenCalled();
  });

  it("does nothing when there are no unread notifications", async () => {
    mockGetUnreadNotifications.mockResolvedValue([]);

    const mockEmit = vi.fn();
    const mockSocket = { data: { userId: "user-1" }, emit: mockEmit } as unknown as Parameters<typeof handleNotificationConnect>[1];
    const mockIo = {} as unknown as Parameters<typeof handleNotificationConnect>[0];

    await handleNotificationConnect(mockIo, mockSocket);

    expect(mockGetUnreadNotifications).toHaveBeenCalledWith("user-1");
    expect(mockEmit).not.toHaveBeenCalled();
  });
});
