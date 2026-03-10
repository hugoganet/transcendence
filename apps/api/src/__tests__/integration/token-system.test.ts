import { describe, it, expect, beforeEach } from "vitest";
import { app } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import { prisma } from "./helpers/app.js";
import supertest from "supertest";
import { MISSION_COMPLETION_TOKEN_REWARD } from "@transcendence/shared";

describe("Token System Integration", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createAndLoginUser();
  });

  describe("Token earning via mission completion", () => {
    it("completing a mission credits tokens and creates a transaction record", async () => {
      // Complete mission 1.1.1 (first mission, always available)
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Verify token transaction was created in DB
      const txns = await prisma.tokenTransaction.findMany({
        where: { type: "EARN" },
      });
      expect(txns).toHaveLength(1);
      expect(txns[0].amount).toBe(MISSION_COMPLETION_TOKEN_REWARD);
      expect(txns[0].missionId).toBe("1.1.1");
      expect(txns[0].type).toBe("EARN");
      expect(txns[0].description).toContain("Completed mission:");
    });

    it("completing the same mission twice does not double-credit tokens", async () => {
      // Complete mission 1.1.1
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Try to complete again — should get 409 from completeMission
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(409);

      // Verify only 1 token transaction exists
      const txns = await prisma.tokenTransaction.findMany({
        where: { type: "EARN", missionId: "1.1.1" },
      });
      expect(txns).toHaveLength(1);
    });

    it("completing a mission updates user tokenBalance", async () => {
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Check balance via API
      const res = await agent.get("/api/v1/tokens/balance").expect(200);

      expect(res.body.data.tokenBalance).toBe(MISSION_COMPLETION_TOKEN_REWARD);
      expect(res.body.data.totalEarned).toBe(MISSION_COMPLETION_TOKEN_REWARD);
      expect(res.body.data.totalSpent).toBe(0);
      expect(res.body.data.lastEarned).toBeTruthy();
    });
  });

  describe("GET /api/v1/tokens/balance", () => {
    it("returns zero balance for new user with no transactions", async () => {
      const res = await agent.get("/api/v1/tokens/balance").expect(200);

      expect(res.body.data.tokenBalance).toBe(0);
      expect(res.body.data.totalEarned).toBe(0);
      expect(res.body.data.totalSpent).toBe(0);
      expect(res.body.data.lastEarned).toBeNull();
    });

    it("returns correct totals after multiple mission completions", async () => {
      // Complete mission 1.1.1
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Complete mission 1.1.2 (should be unlocked now)
      await agent
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/tokens/balance").expect(200);

      expect(res.body.data.tokenBalance).toBe(MISSION_COMPLETION_TOKEN_REWARD * 2);
      expect(res.body.data.totalEarned).toBe(MISSION_COMPLETION_TOKEN_REWARD * 2);
      expect(res.body.data.totalSpent).toBe(0);
    });

    it("returns 401 without authentication", async () => {
      const res = await supertest(app).get("/api/v1/tokens/balance").expect(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });
  });

  describe("GET /api/v1/tokens/history", () => {
    it("returns paginated transaction list with correct entries", async () => {
      // Complete mission 1.1.1
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/tokens/history").expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].type).toBe("EARN");
      expect(res.body.data[0].amount).toBe(MISSION_COMPLETION_TOKEN_REWARD);
      expect(res.body.data[0].missionId).toBe("1.1.1");
      expect(res.body.meta).toEqual({
        page: 1,
        pageSize: 20,
        total: 1,
      });
    });

    it("returns transactions ordered by createdAt DESC", async () => {
      // Complete two missions
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      await agent
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/tokens/history").expect(200);

      expect(res.body.data).toHaveLength(2);
      // Most recent first
      expect(res.body.data[0].missionId).toBe("1.1.2");
      expect(res.body.data[1].missionId).toBe("1.1.1");
    });

    it("respects custom page and pageSize parameters", async () => {
      // Complete two missions
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      await agent
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({})
        .expect(200);

      // Request page 2 with pageSize 1
      const res = await agent
        .get("/api/v1/tokens/history?page=2&pageSize=1")
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.meta).toEqual({
        page: 2,
        pageSize: 1,
        total: 2,
      });
    });

    it("returns empty array for page beyond total results", async () => {
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      const res = await agent
        .get("/api/v1/tokens/history?page=5")
        .expect(200);

      expect(res.body.data).toHaveLength(0);
      expect(res.body.meta.total).toBe(1);
    });

    it("returns 401 without authentication", async () => {
      const res = await supertest(app).get("/api/v1/tokens/history").expect(401);
      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 400 for pageSize exceeding max (100)", async () => {
      const res = await agent
        .get("/api/v1/tokens/history?pageSize=200")
        .expect(400);

      expect(res.body.error).toBeDefined();
    });
  });
});
