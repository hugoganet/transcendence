import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  $transaction: vi.fn(async (arg: unknown) => {
    if (typeof arg === "function") {
      return (arg as (tx: unknown) => Promise<unknown>)(mockPrisma);
    }
    return Promise.all(arg as Promise<unknown>[]);
  }),
  user: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../config/database.js", () => ({
  prisma: mockPrisma,
}));

const { triggerRevealWithClient, getReveals } =
  await import("./revealService.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getReveals", () => {
  it("returns all false for new user", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      revealTokens: false,
      revealWallet: false,
      revealGas: false,
      revealDashboard: false,
    });

    const result = await getReveals("user-1");

    expect(result).toEqual({
      tokensRevealed: false,
      walletRevealed: false,
      gasRevealed: false,
      dashboardRevealed: false,
    });
  });

  it("returns correct flags for user with some reveals", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      revealTokens: true,
      revealWallet: false,
      revealGas: true,
      revealDashboard: false,
    });

    const result = await getReveals("user-1");

    expect(result).toEqual({
      tokensRevealed: true,
      walletRevealed: false,
      gasRevealed: true,
      dashboardRevealed: false,
    });
  });

  it("maps DB fields to API fields correctly", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      revealTokens: true,
      revealWallet: true,
      revealGas: true,
      revealDashboard: true,
    });

    const result = await getReveals("user-1");

    expect(result).toEqual({
      tokensRevealed: true,
      walletRevealed: true,
      gasRevealed: true,
      dashboardRevealed: true,
    });
    expect(mockPrisma.user.findUniqueOrThrow).toHaveBeenCalledWith({
      where: { id: "user-1" },
      select: {
        revealTokens: true,
        revealWallet: true,
        revealGas: true,
        revealDashboard: true,
      },
    });
  });
});

describe("triggerRevealWithClient", () => {
  it("sets flag to true and returns true (newly set)", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      revealTokens: false,
    });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await triggerRevealWithClient(mockPrisma, "user-1", "tokensRevealed");

    expect(result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { revealTokens: true },
    });
  });

  it("is idempotent — returns false if already set", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      revealTokens: true,
    });

    const result = await triggerRevealWithClient(mockPrisma, "user-1", "tokensRevealed");

    expect(result).toBe(false);
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("with unknown mechanic returns false (no error)", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await triggerRevealWithClient(mockPrisma, "user-1", "unknownMechanic");

    expect(result).toBe(false);
    expect(mockPrisma.user.findUniqueOrThrow).not.toHaveBeenCalled();
    expect(mockPrisma.user.update).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledWith(
      'Unknown reveal mechanic: "unknownMechanic" — ignoring.',
    );

    warnSpy.mockRestore();
  });

  it("handles walletRevealed mechanic", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      revealWallet: false,
    });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await triggerRevealWithClient(mockPrisma, "user-1", "walletRevealed");

    expect(result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { revealWallet: true },
    });
  });

  it("handles gasRevealed mechanic", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      revealGas: false,
    });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await triggerRevealWithClient(mockPrisma, "user-1", "gasRevealed");

    expect(result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { revealGas: true },
    });
  });

  it("handles dashboardRevealed mechanic", async () => {
    mockPrisma.user.findUniqueOrThrow.mockResolvedValue({
      revealDashboard: false,
    });
    mockPrisma.user.update.mockResolvedValue({});

    const result = await triggerRevealWithClient(mockPrisma, "user-1", "dashboardRevealed");

    expect(result).toBe(true);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { revealDashboard: true },
    });
  });
});

