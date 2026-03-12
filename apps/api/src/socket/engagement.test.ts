import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCheckReengagement = vi.hoisted(() => vi.fn());

vi.mock("../services/engagementService.js", () => ({
  checkReengagement: mockCheckReengagement,
}));

vi.mock("../config/database.js", () => ({ prisma: {} }));
vi.mock("../services/notificationService.js", () => ({
  createAndPushNotification: vi.fn(),
  createNotification: vi.fn(),
  getNotifications: vi.fn(),
  markAsRead: vi.fn(),
  getUnreadNotifications: vi.fn(),
}));

const { handleEngagementConnect } = await import("./engagement.js");

const mockIo = {} as Parameters<typeof handleEngagementConnect>[0];

describe("handleEngagementConnect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls checkReengagement with correct userId", async () => {
    mockCheckReengagement.mockResolvedValue(undefined);

    const mockSocket = { data: { userId: "user-123" } } as Parameters<typeof handleEngagementConnect>[1];

    await handleEngagementConnect(mockIo, mockSocket);

    expect(mockCheckReengagement).toHaveBeenCalledWith(mockIo, "user-123");
  });

  it("does nothing if userId is not set", async () => {
    const mockSocket = { data: {} } as Parameters<typeof handleEngagementConnect>[1];

    await handleEngagementConnect(mockIo, mockSocket);

    expect(mockCheckReengagement).not.toHaveBeenCalled();
  });
});
