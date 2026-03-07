import { describe, it, expect } from "vitest";

describe("PrismaClient", () => {
  it("can be instantiated and exports prisma", async () => {
    const { prisma } = await import("./database.js");
    expect(prisma).toBeDefined();
    expect(prisma.$connect).toBeDefined();
    expect(prisma.$disconnect).toBeDefined();
    expect(prisma.user).toBeDefined();
  });

  it("exports pool for graceful shutdown", async () => {
    const { prismaPool } = await import("./database.js");
    expect(prismaPool).toBeDefined();
    expect(prismaPool.end).toBeDefined();
  });

  it("exports registerShutdownHandlers as a function", async () => {
    const { registerShutdownHandlers } = await import("./database.js");
    expect(registerShutdownHandlers).toBeDefined();
    expect(typeof registerShutdownHandlers).toBe("function");
  });
});
