import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => {
    return callback(mockPrisma);
  }),
  user: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
  tokenTransaction: {
    findFirst: vi.fn(),
    findMany: vi.fn(),
    count: vi.fn(),
    create: vi.fn(),
    groupBy: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

const { creditMissionTokens, creditMissionTokensWithClient, getTokenBalance, getTokenHistory } =
  await import("./tokenService.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("creditMissionTokens (standalone)", () => {
  it("creates transaction record and increments balance for new mission", async () => {
    mockPrisma.tokenTransaction.findFirst.mockResolvedValue(null);
    mockPrisma.tokenTransaction.create.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    await creditMissionTokens("user-1", "1.1.1", "Who Do You Trust?");

    // Wrapped in interactive transaction
    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.tokenTransaction.findFirst).toHaveBeenCalledWith({
      where: { userId: "user-1", type: "EARN", missionId: "1.1.1" },
    });
    expect(mockPrisma.tokenTransaction.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        amount: 10,
        type: "EARN",
        missionId: "1.1.1",
        description: "Completed mission: Who Do You Trust?",
      },
    });
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tokenBalance: { increment: 10 } },
    });
  });

  it("skips crediting if tokens already earned for this mission", async () => {
    mockPrisma.tokenTransaction.findFirst.mockResolvedValue({
      id: "existing-tx",
      userId: "user-1",
      missionId: "1.1.1",
      type: "EARN",
      amount: 10,
    });

    await creditMissionTokens("user-1", "1.1.1", "Who Do You Trust?");

    expect(mockPrisma.tokenTransaction.create).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("uses correct token amount and description for different missions", async () => {
    mockPrisma.tokenTransaction.findFirst.mockResolvedValue(null);
    mockPrisma.tokenTransaction.create.mockResolvedValue({});
    mockPrisma.user.update.mockResolvedValue({});

    await creditMissionTokens("user-1", "2.1.3", "Mining for Meaning");

    expect(mockPrisma.tokenTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        amount: 10,
        description: "Completed mission: Mining for Meaning",
        missionId: "2.1.3",
      }),
    });
  });
});

describe("creditMissionTokensWithClient", () => {
  it("uses the provided client instead of creating its own transaction", async () => {
    const fakeClient = {
      tokenTransaction: {
        findFirst: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({}),
      },
      user: {
        update: vi.fn().mockResolvedValue({}),
      },
    };

    await creditMissionTokensWithClient(
      fakeClient as never,
      "user-1",
      "1.1.1",
      "Who Do You Trust?",
    );

    expect(fakeClient.tokenTransaction.findFirst).toHaveBeenCalled();
    expect(fakeClient.tokenTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ amount: 10, type: "EARN" }),
    });
    expect(fakeClient.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { tokenBalance: { increment: 10 } },
    });
    // Should NOT touch the global prisma
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
  });
});

describe("getTokenBalance", () => {
  it("returns correct balance for user with earnings", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ tokenBalance: 150 });
    mockPrisma.tokenTransaction.groupBy.mockResolvedValue([
      { type: "EARN", _sum: { amount: 200 } },
      { type: "GAS_SPEND", _sum: { amount: -50 } },
    ]);
    mockPrisma.tokenTransaction.findFirst.mockResolvedValue({
      createdAt: new Date("2026-03-10T14:30:00.000Z"),
    });

    const result = await getTokenBalance("user-1");

    expect(result).toEqual({
      tokenBalance: 150,
      totalEarned: 200,
      totalSpent: 50,
      lastEarned: "2026-03-10T14:30:00.000Z",
    });
  });

  it("returns zero balance for new user with no transactions", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ tokenBalance: 0 });
    mockPrisma.tokenTransaction.groupBy.mockResolvedValue([]);
    mockPrisma.tokenTransaction.findFirst.mockResolvedValue(null);

    const result = await getTokenBalance("user-1");

    expect(result).toEqual({
      tokenBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastEarned: null,
    });
  });

  it("returns correct balance for user with only earnings (no spending)", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({ tokenBalance: 30 });
    mockPrisma.tokenTransaction.groupBy.mockResolvedValue([
      { type: "EARN", _sum: { amount: 30 } },
    ]);
    mockPrisma.tokenTransaction.findFirst.mockResolvedValue({
      createdAt: new Date("2026-03-09T10:00:00.000Z"),
    });

    const result = await getTokenBalance("user-1");

    expect(result).toEqual({
      tokenBalance: 30,
      totalEarned: 30,
      totalSpent: 0,
      lastEarned: "2026-03-09T10:00:00.000Z",
    });
  });
});

describe("getTokenHistory", () => {
  it("returns paginated transactions", async () => {
    const mockTxns = [
      {
        id: "tx-1",
        amount: 10,
        type: "EARN",
        missionId: "1.1.2",
        exerciseId: null,
        description: "Completed mission: Hash It Out",
        createdAt: new Date("2026-03-10T15:00:00.000Z"),
      },
      {
        id: "tx-2",
        amount: 10,
        type: "EARN",
        missionId: "1.1.1",
        exerciseId: null,
        description: "Completed mission: Who Do You Trust?",
        createdAt: new Date("2026-03-10T14:00:00.000Z"),
      },
    ];
    mockPrisma.tokenTransaction.findMany.mockResolvedValue(mockTxns);
    mockPrisma.tokenTransaction.count.mockResolvedValue(2);

    const result = await getTokenHistory("user-1", 1, 20);

    expect(result.transactions).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(result.transactions[0].createdAt).toBe("2026-03-10T15:00:00.000Z");
    expect(mockPrisma.tokenTransaction.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
      skip: 0,
      take: 20,
      select: {
        id: true,
        amount: true,
        type: true,
        missionId: true,
        exerciseId: true,
        description: true,
        createdAt: true,
      },
    });
  });

  it("handles pagination offset correctly", async () => {
    mockPrisma.tokenTransaction.findMany.mockResolvedValue([]);
    mockPrisma.tokenTransaction.count.mockResolvedValue(25);

    const result = await getTokenHistory("user-1", 2, 20);

    expect(result.transactions).toHaveLength(0);
    expect(result.total).toBe(25);
    expect(mockPrisma.tokenTransaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 20, take: 20 }),
    );
  });

  it("returns empty array for user with no transactions", async () => {
    mockPrisma.tokenTransaction.findMany.mockResolvedValue([]);
    mockPrisma.tokenTransaction.count.mockResolvedValue(0);

    const result = await getTokenHistory("user-1", 1, 20);

    expect(result.transactions).toHaveLength(0);
    expect(result.total).toBe(0);
  });
});
