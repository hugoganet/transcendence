import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  user: {
    findUnique: vi.fn(),
  },
  friendship: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

const mockRedisClient = vi.hoisted(() => ({
  smembers: vi.fn(),
}));

vi.mock("../config/redis.js", () => ({
  redisClient: mockRedisClient,
}));

const {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
} = await import("./friendService.js");

describe("friendService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("sendFriendRequest", () => {
    it("creates PENDING friendship", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-b" });
      mockPrisma.friendship.findFirst.mockResolvedValue(null);
      mockPrisma.friendship.create.mockResolvedValue({
        id: "fr-1",
        requesterId: "user-a",
        addresseeId: "user-b",
        status: "PENDING",
        createdAt: new Date("2026-03-10T14:00:00.000Z"),
        updatedAt: new Date("2026-03-10T14:00:00.000Z"),
      });

      const result = await sendFriendRequest("user-a", "user-b");

      expect(result.status).toBe("PENDING");
      expect(result.requesterId).toBe("user-a");
      expect(result.addresseeId).toBe("user-b");
      expect(result.updatedAt).toBe("2026-03-10T14:00:00.000Z");
      expect(mockPrisma.friendship.create).toHaveBeenCalledWith({
        data: { requesterId: "user-a", addresseeId: "user-b" },
      });
    });

    it("rejects self-friending (CANNOT_FRIEND_SELF)", async () => {
      await expect(sendFriendRequest("user-a", "user-a")).rejects.toMatchObject({ code: "CANNOT_FRIEND_SELF" });
    });

    it("rejects duplicate request (FRIENDSHIP_ALREADY_EXISTS)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-b" });
      mockPrisma.friendship.findFirst.mockResolvedValue({ id: "existing" });

      await expect(sendFriendRequest("user-a", "user-b")).rejects.toMatchObject({ code: "FRIENDSHIP_ALREADY_EXISTS" });
    });

    it("rejects duplicate in reverse direction", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-b" });
      mockPrisma.friendship.findFirst.mockResolvedValue({ id: "existing-reverse" });

      await expect(sendFriendRequest("user-a", "user-b")).rejects.toMatchObject({ code: "FRIENDSHIP_ALREADY_EXISTS" });

      // Verify the query checks both directions
      expect(mockPrisma.friendship.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { requesterId: "user-a", addresseeId: "user-b" },
            { requesterId: "user-b", addresseeId: "user-a" },
          ],
        },
      });
    });

    it("rejects non-existent addressee (USER_NOT_FOUND)", async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(sendFriendRequest("user-a", "user-b")).rejects.toMatchObject({ code: "USER_NOT_FOUND" });
    });

    it("returns 409 on Prisma P2002 unique constraint race condition", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-b" });
      mockPrisma.friendship.findFirst.mockResolvedValue(null);
      mockPrisma.friendship.create.mockRejectedValue({ code: "P2002" });

      await expect(sendFriendRequest("user-a", "user-b")).rejects.toMatchObject({
        code: "FRIENDSHIP_ALREADY_EXISTS",
        statusCode: 409,
      });
    });

    it("re-throws non-P2002 errors", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-b" });
      mockPrisma.friendship.findFirst.mockResolvedValue(null);
      mockPrisma.friendship.create.mockRejectedValue(new Error("DB connection lost"));

      await expect(sendFriendRequest("user-a", "user-b")).rejects.toThrow("DB connection lost");
    });

    it("detects reverse-direction race condition after create", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: "user-b" });
      // First findFirst (pre-create check) returns null
      mockPrisma.friendship.findFirst
        .mockResolvedValueOnce(null)
        // Second findFirst (post-create reverse check) finds a reverse record
        .mockResolvedValueOnce({ id: "reverse-fr", requesterId: "user-b", addresseeId: "user-a" });
      mockPrisma.friendship.create.mockResolvedValue({
        id: "fr-1",
        requesterId: "user-a",
        addresseeId: "user-b",
        status: "PENDING",
        createdAt: new Date("2026-03-10T14:00:00.000Z"),
        updatedAt: new Date("2026-03-10T14:00:00.000Z"),
      });
      mockPrisma.friendship.delete.mockResolvedValue({});

      await expect(sendFriendRequest("user-a", "user-b")).rejects.toMatchObject({
        code: "FRIENDSHIP_ALREADY_EXISTS",
        statusCode: 409,
      });

      // Verify our record was cleaned up
      expect(mockPrisma.friendship.delete).toHaveBeenCalledWith({ where: { id: "fr-1" } });
    });
  });

  describe("acceptFriendRequest", () => {
    it("changes status to ACCEPTED", async () => {
      mockPrisma.friendship.findFirst.mockResolvedValue({
        id: "fr-1",
        requesterId: "user-a",
        addresseeId: "user-b",
        status: "PENDING",
        createdAt: new Date("2026-03-10T14:00:00.000Z"),
        updatedAt: new Date("2026-03-10T14:00:00.000Z"),
      });
      mockPrisma.friendship.update.mockResolvedValue({
        id: "fr-1",
        requesterId: "user-a",
        addresseeId: "user-b",
        status: "ACCEPTED",
        createdAt: new Date("2026-03-10T14:00:00.000Z"),
        updatedAt: new Date("2026-03-10T14:01:00.000Z"),
      });

      const result = await acceptFriendRequest("user-b", "user-a");

      expect(result.status).toBe("ACCEPTED");
      expect(result.updatedAt).toBe("2026-03-10T14:01:00.000Z");
      expect(mockPrisma.friendship.update).toHaveBeenCalledWith({
        where: { id: "fr-1" },
        data: { status: "ACCEPTED" },
      });
    });

    it("rejects if no pending request (FRIEND_REQUEST_NOT_FOUND)", async () => {
      mockPrisma.friendship.findFirst.mockResolvedValue(null);

      await expect(acceptFriendRequest("user-b", "user-a")).rejects.toMatchObject({ code: "FRIEND_REQUEST_NOT_FOUND" });
    });
  });

  describe("removeFriend", () => {
    it("deletes friendship", async () => {
      mockPrisma.friendship.findFirst.mockResolvedValue({ id: "fr-1" });
      mockPrisma.friendship.delete.mockResolvedValue({});

      await removeFriend("user-a", "user-b");

      expect(mockPrisma.friendship.delete).toHaveBeenCalledWith({
        where: { id: "fr-1" },
      });
    });

    it("works regardless of direction (requester or addressee can remove)", async () => {
      mockPrisma.friendship.findFirst.mockResolvedValue({ id: "fr-1" });
      mockPrisma.friendship.delete.mockResolvedValue({});

      await removeFriend("user-b", "user-a");

      expect(mockPrisma.friendship.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { requesterId: "user-b", addresseeId: "user-a" },
            { requesterId: "user-a", addresseeId: "user-b" },
          ],
        },
      });
    });

    it("rejects if no friendship (FRIENDSHIP_NOT_FOUND)", async () => {
      mockPrisma.friendship.findFirst.mockResolvedValue(null);

      await expect(removeFriend("user-a", "user-b")).rejects.toMatchObject({ code: "FRIENDSHIP_NOT_FOUND" });
    });
  });

  describe("getFriends", () => {
    it("returns only ACCEPTED friendships", async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          requesterId: "user-a",
          addresseeId: "user-b",
          requester: { id: "user-a", displayName: "Alice", avatarUrl: null },
          addressee: { id: "user-b", displayName: "Bob", avatarUrl: null },
        },
      ]);
      mockRedisClient.smembers.mockResolvedValue([]);

      const result = await getFriends("user-a");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("user-b");
      expect(result[0].displayName).toBe("Bob");
      expect(mockPrisma.friendship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "ACCEPTED" }),
        }),
      );
    });

    it("includes online status", async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          requesterId: "user-a",
          addresseeId: "user-b",
          requester: { id: "user-a", displayName: "Alice", avatarUrl: null },
          addressee: { id: "user-b", displayName: "Bob", avatarUrl: null },
        },
      ]);
      mockRedisClient.smembers.mockResolvedValue(["user-b"]);

      const result = await getFriends("user-a");

      expect(result[0].online).toBe(true);
    });

    it("returns friends from both directions", async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          requesterId: "user-a",
          addresseeId: "user-c",
          requester: { id: "user-a", displayName: "Alice", avatarUrl: null },
          addressee: { id: "user-c", displayName: "Charlie", avatarUrl: null },
        },
        {
          requesterId: "user-d",
          addresseeId: "user-a",
          requester: { id: "user-d", displayName: "Dave", avatarUrl: null },
          addressee: { id: "user-a", displayName: "Alice", avatarUrl: null },
        },
      ]);
      mockRedisClient.smembers.mockResolvedValue([]);

      const result = await getFriends("user-a");

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe("user-c");
      expect(result[1].id).toBe("user-d");
    });

    it("defaults online to false when Redis is unavailable", async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          requesterId: "user-a",
          addresseeId: "user-b",
          requester: { id: "user-a", displayName: "Alice", avatarUrl: null },
          addressee: { id: "user-b", displayName: "Bob", avatarUrl: null },
        },
      ]);
      mockRedisClient.smembers.mockRejectedValue(new Error("Redis down"));

      const result = await getFriends("user-a");

      expect(result[0].online).toBe(false);
    });
  });

  describe("getPendingRequests", () => {
    it("returns only PENDING incoming requests", async () => {
      mockPrisma.friendship.findMany.mockResolvedValue([
        {
          requester: { id: "user-a", displayName: "Alice", avatarUrl: null },
          createdAt: new Date("2026-03-10T14:00:00.000Z"),
        },
      ]);

      const result = await getPendingRequests("user-b");

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("user-a");
      expect(result[0].displayName).toBe("Alice");
      expect(result[0].createdAt).toBe("2026-03-10T14:00:00.000Z");
      expect(mockPrisma.friendship.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { addresseeId: "user-b", status: "PENDING" },
        }),
      );
    });
  });
});
