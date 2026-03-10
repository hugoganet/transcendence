import supertest from "supertest";
import { app, prisma } from "./helpers/app.js";
import { resetDatabase } from "./helpers/db.js";
import { sessionRedisClient } from "../../../config/session.js";

beforeEach(async () => {
  await resetDatabase();
});

describe("GET /api/v1/health", () => {
  it("returns 200 with status ok", async () => {
    const res = await supertest(app).get("/api/v1/health").expect(200);

    expect(res.body).toEqual({ data: { status: "ok" } });
  });

  it("can query the real database (Prisma connected)", async () => {
    // Verify Prisma can execute a raw query against the test DB
    const result = await prisma.$queryRawUnsafe<{ now: Date }[]>(
      "SELECT NOW() as now",
    );
    expect(result).toHaveLength(1);
    expect(result[0].now).toBeInstanceOf(Date);
  });

  it("can connect to the real Redis instance (session store functional)", async () => {
    // Verify Redis is reachable by setting and reading a test key
    const testKey = "__integration_health_check__";
    await sessionRedisClient.set(testKey, "ok");
    const value = await sessionRedisClient.get(testKey);
    expect(value).toBe("ok");
    await sessionRedisClient.del(testKey);
  });
});
