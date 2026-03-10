import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database with transaction support
const mockTx = vi.hoisted(() => ({
  userProgress: {
    findMany: vi.fn(),
    count: vi.fn(),
  },
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
  },
}));

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)),
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

const { getLeaderboard, getWeekStart } = await import("./leaderboardService.js");

describe("getWeekStart", () => {
  it("returns Monday 00:00 UTC for a Wednesday", () => {
    // 2026-03-11 is a Wednesday
    const wed = new Date("2026-03-11T14:30:00.000Z");
    const result = getWeekStart(wed);
    expect(result.toISOString()).toBe("2026-03-09T00:00:00.000Z"); // Monday
    expect(result.getUTCDay()).toBe(1); // Monday
  });

  it("returns Monday 00:00 UTC for a Monday", () => {
    const mon = new Date("2026-03-09T10:00:00.000Z");
    const result = getWeekStart(mon);
    expect(result.toISOString()).toBe("2026-03-09T00:00:00.000Z");
  });

  it("returns Monday 00:00 UTC for a Sunday", () => {
    // 2026-03-15 is a Sunday
    const sun = new Date("2026-03-15T23:59:59.000Z");
    const result = getWeekStart(sun);
    expect(result.toISOString()).toBe("2026-03-09T00:00:00.000Z");
  });

  it("returns Monday 00:00 UTC for a Saturday", () => {
    // 2026-03-14 is a Saturday
    const sat = new Date("2026-03-14T18:00:00.000Z");
    const result = getWeekStart(sat);
    expect(result.toISOString()).toBe("2026-03-09T00:00:00.000Z");
    expect(result.getUTCDay()).toBe(1); // Monday
  });
});

describe("getLeaderboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns paginated ranked list sorted by missionsCompleted DESC", async () => {
    // Active user IDs this week
    mockTx.userProgress.findMany.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
      { userId: "u3" },
    ]);

    // Users with mission counts
    mockTx.user.findMany.mockResolvedValue([
      {
        id: "u1", displayName: "Alice", avatarUrl: null,
        _count: { userProgress: 45 },
        userProgress: [{ completedAt: new Date("2026-03-10T10:00:00Z") }],
      },
      {
        id: "u2", displayName: "Bob", avatarUrl: null,
        _count: { userProgress: 38 },
        userProgress: [{ completedAt: new Date("2026-03-10T12:00:00Z") }],
      },
      {
        id: "u3", displayName: "Charlie", avatarUrl: null,
        _count: { userProgress: 50 },
        userProgress: [{ completedAt: new Date("2026-03-10T08:00:00Z") }],
      },
    ]);

    const result = await getLeaderboard("u1", 1, 20);

    expect(result.entries).toHaveLength(3);
    expect(result.entries[0].rank).toBe(1);
    expect(result.entries[0].missionsCompleted).toBe(50); // Charlie
    expect(result.entries[1].rank).toBe(2);
    expect(result.entries[1].missionsCompleted).toBe(45); // Alice
    expect(result.entries[2].rank).toBe(3);
    expect(result.entries[2].missionsCompleted).toBe(38); // Bob
    expect(result.total).toBe(3);
  });

  it("always includes currentUser even when not on the page", async () => {
    // 3 active users, but we request page 1 size 2 — u1 would be on page 2
    mockTx.userProgress.findMany.mockResolvedValue([
      { userId: "u2" },
      { userId: "u3" },
      { userId: "u1" },
    ]);

    mockTx.user.findMany.mockResolvedValue([
      {
        id: "u2", displayName: "Bob", avatarUrl: null,
        _count: { userProgress: 50 },
        userProgress: [{ completedAt: new Date("2026-03-10T12:00:00Z") }],
      },
      {
        id: "u3", displayName: "Charlie", avatarUrl: null,
        _count: { userProgress: 40 },
        userProgress: [{ completedAt: new Date("2026-03-10T08:00:00Z") }],
      },
      {
        id: "u1", displayName: "Alice", avatarUrl: null,
        _count: { userProgress: 10 },
        userProgress: [{ completedAt: new Date("2026-03-10T10:00:00Z") }],
      },
    ]);

    const result = await getLeaderboard("u1", 1, 2);

    // Only 2 entries on page 1
    expect(result.entries).toHaveLength(2);
    // Current user still populated (reused from ranked list)
    expect(result.currentUser.userId).toBe("u1");
    expect(result.currentUser.rank).toBe(3);
    expect(result.currentUser.missionsCompleted).toBe(10);
    expect(result.total).toBe(3);
  });

  it("only shows users active this week in ranked list", async () => {
    // Only u2 active this week
    mockTx.userProgress.findMany.mockResolvedValue([
      { userId: "u2" },
    ]);

    mockTx.user.findMany.mockResolvedValue([
      {
        id: "u2", displayName: "Bob", avatarUrl: null,
        _count: { userProgress: 38 },
        userProgress: [{ completedAt: new Date("2026-03-10T12:00:00Z") }],
      },
    ]);

    // Current user (u1) not active this week — separate queries needed
    mockTx.user.findUnique.mockResolvedValue({
      id: "u1", displayName: "Alice", avatarUrl: null,
    });
    mockTx.userProgress.count.mockResolvedValue(45);

    const result = await getLeaderboard("u1", 1, 20);

    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].userId).toBe("u2");
  });

  it("returns rank null for current user not active this week", async () => {
    mockTx.userProgress.findMany.mockResolvedValue([
      { userId: "u2" },
    ]);

    mockTx.user.findMany.mockResolvedValue([
      {
        id: "u2", displayName: "Bob", avatarUrl: null,
        _count: { userProgress: 38 },
        userProgress: [{ completedAt: new Date("2026-03-10T12:00:00Z") }],
      },
    ]);

    mockTx.user.findUnique.mockResolvedValue({
      id: "u1", displayName: "Alice", avatarUrl: null,
    });
    mockTx.userProgress.count.mockResolvedValue(45);

    const result = await getLeaderboard("u1", 1, 20);

    // u1 is NOT in the active user list, so rank should be null
    expect(result.currentUser.rank).toBeNull();
    expect(result.currentUser.missionsCompleted).toBe(45);
  });

  it("tiebreaks by most recent completedAt ASC (earlier = higher rank)", async () => {
    mockTx.userProgress.findMany.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
    ]);

    // Both users have 30 missions, u1 completed earlier
    mockTx.user.findMany.mockResolvedValue([
      {
        id: "u1", displayName: "Alice", avatarUrl: null,
        _count: { userProgress: 30 },
        userProgress: [{ completedAt: new Date("2026-03-09T10:00:00Z") }], // Earlier
      },
      {
        id: "u2", displayName: "Bob", avatarUrl: null,
        _count: { userProgress: 30 },
        userProgress: [{ completedAt: new Date("2026-03-10T10:00:00Z") }], // Later
      },
    ]);

    const result = await getLeaderboard("u1", 1, 20);

    // Same missions, earlier completedAt gets higher rank (dense ranking — both rank 1)
    expect(result.entries[0].userId).toBe("u1");
    expect(result.entries[1].userId).toBe("u2");
    // Both share rank 1 (same missionsCompleted)
    expect(result.entries[0].rank).toBe(1);
    expect(result.entries[1].rank).toBe(1);
  });

  it("returns empty leaderboard when no active users this week", async () => {
    mockTx.userProgress.findMany.mockResolvedValue([]);
    mockTx.user.findMany.mockResolvedValue([]);

    mockTx.user.findUnique.mockResolvedValue({
      id: "u1", displayName: "Alice", avatarUrl: null,
    });
    mockTx.userProgress.count.mockResolvedValue(10);

    const result = await getLeaderboard("u1", 1, 20);

    expect(result.entries).toEqual([]);
    expect(result.total).toBe(0);
    expect(result.currentUser.rank).toBeNull();
    expect(result.currentUser.missionsCompleted).toBe(10);
  });

  it("paginates correctly (page 2)", async () => {
    // 3 active users
    mockTx.userProgress.findMany.mockResolvedValue([
      { userId: "u1" },
      { userId: "u2" },
      { userId: "u3" },
    ]);

    mockTx.user.findMany.mockResolvedValue([
      {
        id: "u1", displayName: "Alice", avatarUrl: null,
        _count: { userProgress: 50 },
        userProgress: [{ completedAt: new Date("2026-03-10T10:00:00Z") }],
      },
      {
        id: "u2", displayName: "Bob", avatarUrl: null,
        _count: { userProgress: 40 },
        userProgress: [{ completedAt: new Date("2026-03-10T12:00:00Z") }],
      },
      {
        id: "u3", displayName: "Charlie", avatarUrl: null,
        _count: { userProgress: 30 },
        userProgress: [{ completedAt: new Date("2026-03-10T08:00:00Z") }],
      },
    ]);

    const result = await getLeaderboard("u3", 2, 2);

    // Page 2 with pageSize 2 => 1 entry (u3 at rank 3)
    expect(result.entries).toHaveLength(1);
    expect(result.entries[0].rank).toBe(3);
    expect(result.entries[0].userId).toBe("u3");
    expect(result.total).toBe(3);
    // Current user still computed (reused from ranked list)
    expect(result.currentUser.userId).toBe("u3");
  });

  it("reuses active user data for currentUser instead of extra queries", async () => {
    // u1 is active this week
    mockTx.userProgress.findMany.mockResolvedValue([
      { userId: "u1" },
    ]);

    mockTx.user.findMany.mockResolvedValue([
      {
        id: "u1", displayName: "Alice", avatarUrl: "/avatar.jpg",
        _count: { userProgress: 15 },
        userProgress: [{ completedAt: new Date("2026-03-10T10:00:00Z") }],
      },
    ]);

    const result = await getLeaderboard("u1", 1, 20);

    // Should NOT have called findUnique or count — data reused from ranked list
    expect(mockTx.user.findUnique).not.toHaveBeenCalled();
    expect(mockTx.userProgress.count).not.toHaveBeenCalled();
    expect(result.currentUser.displayName).toBe("Alice");
    expect(result.currentUser.avatarUrl).toBe("/avatar.jpg");
    expect(result.currentUser.missionsCompleted).toBe(15);
    expect(result.currentUser.rank).toBe(1);
  });
});
