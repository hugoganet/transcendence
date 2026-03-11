import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  notification: {
    create: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    update: vi.fn(),
    findFirst: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

const {
  createNotification,
  createAndPushNotification,
  getNotifications,
  markAsRead,
  getUnreadNotifications,
} = await import("./notificationService.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("createNotification", () => {
  it("creates a notification in the database", async () => {
    const mockNotification = {
      id: "notif-1",
      userId: "user-1",
      type: "STREAK_MILESTONE",
      title: "Great streak!",
      body: "You have a 7-day streak!",
      read: false,
      data: { streakCount: 7 },
      createdAt: new Date(),
    };
    mockPrisma.notification.create.mockResolvedValue(mockNotification);

    const result = await createNotification(
      "user-1",
      "STREAK_MILESTONE",
      "Great streak!",
      "You have a 7-day streak!",
      { streakCount: 7 },
    );

    expect(result).toEqual(mockNotification);
    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "STREAK_MILESTONE",
        title: "Great streak!",
        body: "You have a 7-day streak!",
        data: { streakCount: 7 },
      },
    });
  });

  it("sets data to null when not provided", async () => {
    mockPrisma.notification.create.mockResolvedValue({});

    await createNotification("user-1", "STREAK_REMINDER", "Keep going!", "Don't break your streak");

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        type: "STREAK_REMINDER",
        title: "Keep going!",
        body: "Don't break your streak",
        data: null,
      },
    });
  });
});

describe("createAndPushNotification", () => {
  it("creates notification and emits via Socket.IO", async () => {
    const mockNotification = {
      id: "notif-2",
      userId: "user-1",
      type: "MODULE_COMPLETE",
      title: "Module done!",
      body: "You completed Blockchain Foundations",
      read: false,
      data: null,
      createdAt: new Date(),
    };
    mockPrisma.notification.create.mockResolvedValue(mockNotification);

    const mockEmit = vi.fn();
    const mockIo = { to: vi.fn().mockReturnValue({ emit: mockEmit }) } as unknown as Parameters<typeof createAndPushNotification>[0];

    const result = await createAndPushNotification(
      mockIo,
      "user-1",
      "MODULE_COMPLETE",
      "Module done!",
      "You completed Blockchain Foundations",
    );

    expect(result).toEqual(mockNotification);
    expect(mockIo.to).toHaveBeenCalledWith("user:user-1");
    expect(mockEmit).toHaveBeenCalledWith("notification:push", {
      id: "notif-2",
      type: "MODULE_COMPLETE",
      title: "Module done!",
      body: "You completed Blockchain Foundations",
      data: null,
    });
  });
});

describe("getNotifications", () => {
  it("returns paginated notifications newest first", async () => {
    const now = new Date("2026-03-11T10:00:00Z");
    const notifications = [
      {
        id: "notif-2",
        type: "MODULE_COMPLETE",
        title: "Module done!",
        body: "Body 2",
        read: false,
        data: null,
        createdAt: now,
      },
    ];
    mockPrisma.notification.findMany.mockResolvedValue(notifications);
    mockPrisma.notification.count.mockResolvedValue(5);

    const result = await getNotifications("user-1", 1, 20);

    expect(result.notifications).toEqual([
      {
        id: "notif-2",
        type: "MODULE_COMPLETE",
        title: "Module done!",
        body: "Body 2",
        read: false,
        data: null,
        createdAt: "2026-03-11T10:00:00.000Z",
      },
    ]);
    expect(result.meta).toEqual({ page: 1, pageSize: 20, total: 5 });
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        read: true,
        data: true,
        createdAt: true,
      },
    });
  });

  it("applies correct offset for page 2", async () => {
    mockPrisma.notification.findMany.mockResolvedValue([]);
    mockPrisma.notification.count.mockResolvedValue(0);

    await getNotifications("user-1", 2, 10);

    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });
});

describe("markAsRead", () => {
  it("marks an owned notification as read", async () => {
    mockPrisma.notification.findFirst.mockResolvedValue({
      id: "notif-1",
      userId: "user-1",
    });
    mockPrisma.notification.update.mockResolvedValue({
      id: "notif-1",
      read: true,
    });

    const result = await markAsRead("user-1", "notif-1");

    expect(result).toEqual({ id: "notif-1", read: true });
    expect(mockPrisma.notification.findFirst).toHaveBeenCalledWith({
      where: { id: "notif-1", userId: "user-1" },
    });
    expect(mockPrisma.notification.update).toHaveBeenCalledWith({
      where: { id: "notif-1" },
      data: { read: true },
    });
  });

  it("throws NotFound if notification does not belong to user", async () => {
    mockPrisma.notification.findFirst.mockResolvedValue(null);

    await expect(markAsRead("user-1", "notif-999")).rejects.toThrow(
      "Notification not found",
    );
  });

  it("skips DB update if notification is already read", async () => {
    const alreadyRead = { id: "notif-1", userId: "user-1", read: true };
    mockPrisma.notification.findFirst.mockResolvedValue(alreadyRead);

    const result = await markAsRead("user-1", "notif-1");

    expect(result).toEqual(alreadyRead);
    expect(mockPrisma.notification.update).not.toHaveBeenCalled();
  });
});

describe("getUnreadNotifications", () => {
  it("returns unread notifications ordered by createdAt ascending", async () => {
    const unread = [
      { id: "notif-1", type: "STREAK_REMINDER", title: "T1", body: "B1", data: null },
      { id: "notif-2", type: "MODULE_COMPLETE", title: "T2", body: "B2", data: null },
    ];
    mockPrisma.notification.findMany.mockResolvedValue(unread);

    const result = await getUnreadNotifications("user-1");

    expect(result).toEqual(unread);
    expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1", read: false },
      orderBy: { createdAt: "asc" },
      take: 50,
      select: {
        id: true,
        type: true,
        title: true,
        body: true,
        data: true,
      },
    });
  });
});
