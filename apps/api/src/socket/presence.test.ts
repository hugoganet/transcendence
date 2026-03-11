import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock redisClient
const mockSadd = vi.fn().mockResolvedValue(1);
const mockSrem = vi.fn().mockResolvedValue(1);

vi.mock("../config/redis.js", () => ({
  redisClient: {
    sadd: mockSadd,
    srem: mockSrem,
  },
}));

// Mock prisma
const mockFindMany = vi.fn().mockResolvedValue([]);

vi.mock("../config/database.js", () => ({
  prisma: {
    friendship: {
      findMany: mockFindMany,
    },
  },
}));

const { handleUserConnect, handleUserDisconnect, getAcceptedFriendIds, clearAllDisconnectTimers, ONLINE_USERS_KEY } =
  await import("./presence.js");

// Helper to create a mock Socket.IO `io` server
function createMockIo(fetchSocketsResult: unknown[] = []) {
  const emitFn = vi.fn();
  const toFn = vi.fn().mockReturnValue({ emit: emitFn });
  const inFn = vi.fn().mockReturnValue({
    fetchSockets: vi.fn().mockResolvedValue(fetchSocketsResult),
  });

  return { io: { to: toFn, in: inFn } as unknown, emitFn, toFn, inFn };
}

// Helper to create a mock socket
function createMockSocket(userId: string) {
  return {
    data: { userId },
    join: vi.fn(),
  };
}

describe("presence module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearAllDisconnectTimers();
  });

  afterEach(() => {
    clearAllDisconnectTimers();
  });

  describe("ONLINE_USERS_KEY", () => {
    it("is 'online-users'", () => {
      expect(ONLINE_USERS_KEY).toBe("online-users");
    });
  });

  describe("getAcceptedFriendIds", () => {
    it("returns correct IDs for bidirectional friendships", async () => {
      const userId = "user-1";
      mockFindMany.mockResolvedValueOnce([
        { requesterId: "user-1", addresseeId: "friend-a" },
        { requesterId: "friend-b", addresseeId: "user-1" },
      ]);

      const result = await getAcceptedFriendIds(userId);

      expect(result).toEqual(["friend-a", "friend-b"]);
      expect(mockFindMany).toHaveBeenCalledWith({
        where: {
          status: "ACCEPTED",
          OR: [{ requesterId: userId }, { addresseeId: userId }],
        },
        select: { requesterId: true, addresseeId: true },
      });
    });

    it("returns empty array when no friends", async () => {
      mockFindMany.mockResolvedValueOnce([]);
      const result = await getAcceptedFriendIds("lonely-user");
      expect(result).toEqual([]);
    });
  });

  describe("handleUserConnect", () => {
    it("first connection: adds to Redis SET and emits presence:online to each friend", async () => {
      const { io, emitFn, toFn } = createMockIo();
      const socket = createMockSocket("user-1");

      mockSadd.mockResolvedValueOnce(1); // newly added
      mockFindMany.mockResolvedValueOnce([
        { requesterId: "user-1", addresseeId: "friend-a" },
        { requesterId: "friend-b", addresseeId: "user-1" },
      ]);

      await handleUserConnect(io as never, socket as never);

      // Should join user room
      expect(socket.join).toHaveBeenCalledWith("user:user-1");

      // Should add to Redis (atomic sadd)
      expect(mockSadd).toHaveBeenCalledWith("online-users", "user-1");

      // Should emit to each friend
      expect(toFn).toHaveBeenCalledWith("user:friend-a");
      expect(toFn).toHaveBeenCalledWith("user:friend-b");
      expect(emitFn).toHaveBeenCalledTimes(2);
      expect(emitFn).toHaveBeenCalledWith("presence:online", "user-1");
    });

    it("second connection (multi-tab): does NOT re-emit (sadd returns 0)", async () => {
      const { io, emitFn } = createMockIo();
      const socket = createMockSocket("user-1");

      mockSadd.mockResolvedValueOnce(0); // already existed in SET

      await handleUserConnect(io as never, socket as never);

      // Should still join room
      expect(socket.join).toHaveBeenCalledWith("user:user-1");

      // sadd was called but returned 0 (already existed) — no emit
      expect(mockSadd).toHaveBeenCalledWith("online-users", "user-1");
      expect(emitFn).not.toHaveBeenCalled();
    });

    it("clears pending disconnect timer on reconnect", async () => {
      vi.useFakeTimers();

      const { io, inFn } = createMockIo([]);
      const socket = createMockSocket("user-1");

      // First: user connects
      mockSadd.mockResolvedValueOnce(1);
      mockFindMany.mockResolvedValueOnce([]);
      await handleUserConnect(io as never, socket as never);

      // Disconnect starts debounce timer
      await handleUserDisconnect(io as never, socket as never);

      // Reconnect before debounce expires
      mockSadd.mockResolvedValueOnce(0); // already in SET (still in Redis)
      const socket2 = createMockSocket("user-1");
      await handleUserConnect(io as never, socket2 as never);

      // Advance past debounce — should NOT trigger offline
      vi.advanceTimersByTime(6000);
      // Give any pending promises time to resolve
      await vi.runAllTimersAsync();

      // fetchSockets should NOT have been called (timer was cleared)
      expect(inFn).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe("handleUserDisconnect", () => {
    it("last connection closes: after debounce, removes from Redis and emits offline", async () => {
      vi.useFakeTimers();

      const { io, emitFn, toFn, inFn } = createMockIo([]); // no remaining sockets
      const socket = createMockSocket("user-1");

      mockFindMany.mockResolvedValueOnce([
        { requesterId: "user-1", addresseeId: "friend-a" },
      ]);

      await handleUserDisconnect(io as never, socket as never);

      // Should not emit immediately
      expect(emitFn).not.toHaveBeenCalled();

      // Advance past debounce
      await vi.advanceTimersByTimeAsync(5100);

      // Should check remaining sockets
      expect(inFn).toHaveBeenCalledWith("user:user-1");

      // Should remove from Redis
      expect(mockSrem).toHaveBeenCalledWith("online-users", "user-1");

      // Should emit offline to friends
      expect(toFn).toHaveBeenCalledWith("user:friend-a");
      expect(emitFn).toHaveBeenCalledWith("presence:offline", "user-1");

      vi.useRealTimers();
    });

    it("tab closes but other tab remains: no offline, no Redis removal", async () => {
      vi.useFakeTimers();

      const remainingSocket = { id: "socket-2", data: { userId: "user-1" } };
      const { io, emitFn, inFn } = createMockIo([remainingSocket]); // one socket remains
      const socket = createMockSocket("user-1");

      await handleUserDisconnect(io as never, socket as never);

      // Advance past debounce
      await vi.advanceTimersByTimeAsync(5100);

      // Should check remaining sockets
      expect(inFn).toHaveBeenCalledWith("user:user-1");

      // Should NOT remove from Redis or emit offline
      expect(mockSrem).not.toHaveBeenCalled();
      expect(emitFn).not.toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("reconnect within debounce: timer cleared, no offline emitted", async () => {
      vi.useFakeTimers();

      const { io, emitFn, inFn } = createMockIo([]);
      const socket = createMockSocket("user-1");

      // Disconnect
      await handleUserDisconnect(io as never, socket as never);

      // Reconnect within debounce (simulated by clearing timer)
      mockSadd.mockResolvedValueOnce(0); // already in SET
      const socket2 = createMockSocket("user-1");
      await handleUserConnect(io as never, socket2 as never);

      // Advance past debounce
      await vi.advanceTimersByTimeAsync(6000);

      // No offline should be emitted
      expect(inFn).not.toHaveBeenCalled();
      expect(mockSrem).not.toHaveBeenCalled();
      expect(emitFn).not.toHaveBeenCalled();

      vi.useRealTimers();
    });
  });
});
