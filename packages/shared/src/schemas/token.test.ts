import { describe, it, expect } from "vitest";
import {
  tokenBalanceSchema,
  tokenTransactionSchema,
  tokenHistoryQuerySchema,
  paginationMetaSchema,
  tokenTransactionTypeSchema,
} from "./token.js";

describe("tokenTransactionTypeSchema", () => {
  it("accepts EARN", () => {
    expect(tokenTransactionTypeSchema.parse("EARN")).toBe("EARN");
  });

  it("accepts GAS_SPEND", () => {
    expect(tokenTransactionTypeSchema.parse("GAS_SPEND")).toBe("GAS_SPEND");
  });

  it("rejects invalid type", () => {
    expect(() => tokenTransactionTypeSchema.parse("INVALID")).toThrow();
  });
});

describe("tokenBalanceSchema", () => {
  it("parses valid balance", () => {
    const result = tokenBalanceSchema.parse({
      tokenBalance: 150,
      totalEarned: 200,
      totalSpent: 50,
      lastEarned: "2026-03-10T14:30:00.000Z",
    });
    expect(result.tokenBalance).toBe(150);
    expect(result.lastEarned).toBe("2026-03-10T14:30:00.000Z");
  });

  it("accepts null lastEarned", () => {
    const result = tokenBalanceSchema.parse({
      tokenBalance: 0,
      totalEarned: 0,
      totalSpent: 0,
      lastEarned: null,
    });
    expect(result.lastEarned).toBeNull();
  });

  it("rejects negative totalEarned", () => {
    expect(() =>
      tokenBalanceSchema.parse({
        tokenBalance: 0,
        totalEarned: -1,
        totalSpent: 0,
        lastEarned: null,
      }),
    ).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => tokenBalanceSchema.parse({})).toThrow();
  });
});

describe("tokenTransactionSchema", () => {
  it("parses valid EARN transaction", () => {
    const result = tokenTransactionSchema.parse({
      id: "cuid123",
      amount: 10,
      type: "EARN",
      missionId: "1.1.1",
      exerciseId: null,
      description: "Completed mission: Who Do You Trust?",
      createdAt: "2026-03-10T14:30:00.000Z",
    });
    expect(result.type).toBe("EARN");
    expect(result.missionId).toBe("1.1.1");
  });

  it("parses valid GAS_SPEND transaction", () => {
    const result = tokenTransactionSchema.parse({
      id: "cuid456",
      amount: -5,
      type: "GAS_SPEND",
      missionId: null,
      exerciseId: "3.3.1",
      description: "Gas fee for exercise submission",
      createdAt: "2026-03-10T15:00:00.000Z",
    });
    expect(result.type).toBe("GAS_SPEND");
    expect(result.exerciseId).toBe("3.3.1");
  });

  it("rejects invalid type", () => {
    expect(() =>
      tokenTransactionSchema.parse({
        id: "cuid",
        amount: 10,
        type: "INVALID",
        missionId: null,
        exerciseId: null,
        description: "test",
        createdAt: "2026-03-10T14:30:00.000Z",
      }),
    ).toThrow();
  });
});

describe("tokenHistoryQuerySchema", () => {
  it("applies defaults for empty query", () => {
    const result = tokenHistoryQuerySchema.parse({});
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(20);
  });

  it("coerces string values to numbers", () => {
    const result = tokenHistoryQuerySchema.parse({ page: "2", pageSize: "50" });
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
  });

  it("rejects page < 1", () => {
    expect(() => tokenHistoryQuerySchema.parse({ page: 0 })).toThrow();
  });

  it("rejects pageSize > 100", () => {
    expect(() => tokenHistoryQuerySchema.parse({ pageSize: 101 })).toThrow();
  });

  it("rejects pageSize < 1", () => {
    expect(() => tokenHistoryQuerySchema.parse({ pageSize: 0 })).toThrow();
  });
});

describe("paginationMetaSchema", () => {
  it("parses valid meta", () => {
    const result = paginationMetaSchema.parse({
      page: 1,
      pageSize: 20,
      total: 47,
    });
    expect(result.total).toBe(47);
  });

  it("accepts zero total", () => {
    const result = paginationMetaSchema.parse({
      page: 1,
      pageSize: 20,
      total: 0,
    });
    expect(result.total).toBe(0);
  });

  it("rejects negative total", () => {
    expect(() =>
      paginationMetaSchema.parse({ page: 1, pageSize: 20, total: -1 }),
    ).toThrow();
  });
});
