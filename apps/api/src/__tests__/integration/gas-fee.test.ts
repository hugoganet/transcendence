import { describe, it, expect, beforeEach } from "vitest";
import { app } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import { prisma } from "./helpers/app.js";
import supertest from "supertest";
import { GAS_FEE_PER_SUBMISSION, MISSION_COMPLETION_TOKEN_REWARD } from "@transcendence/shared";

describe("Gas Fee Integration", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createAndLoginUser();
  });

  describe("Gas fee deduction on exercise submission", () => {
    it("deducts gas fee from balance on submission", async () => {
      const res = await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      expect(res.body.data.gasFee).toBe(GAS_FEE_PER_SUBMISSION);
      expect(res.body.data.tokenBalance).toBe(-GAS_FEE_PER_SUBMISSION);
    });

    it("creates GAS_SPEND transaction record", async () => {
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      const txns = await prisma.tokenTransaction.findMany({
        where: { type: "GAS_SPEND" },
      });
      expect(txns).toHaveLength(1);
      expect(txns[0].amount).toBe(-GAS_FEE_PER_SUBMISSION);
      expect(txns[0].exerciseId).toBe("1.1.1");
      expect(txns[0].missionId).toBeNull();
      expect(txns[0].description).toBe("Gas fee: exercise submission");
    });

    it("charges same gas fee for correct and incorrect answers", async () => {
      // Incorrect answer
      const wrongRes = await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);

      // Correct answer
      const rightRes = await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      expect(wrongRes.body.data.gasFee).toBe(GAS_FEE_PER_SUBMISSION);
      expect(rightRes.body.data.gasFee).toBe(GAS_FEE_PER_SUBMISSION);
    });

    it("creates multiple GAS_SPEND records for multiple submissions", async () => {
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);

      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      const txns = await prisma.tokenTransaction.findMany({
        where: { type: "GAS_SPEND" },
        orderBy: { createdAt: "asc" },
      });
      expect(txns).toHaveLength(2);
      expect(txns[0].amount).toBe(-GAS_FEE_PER_SUBMISSION);
      expect(txns[1].amount).toBe(-GAS_FEE_PER_SUBMISSION);
    });
  });

  describe("Balance interaction with mission completion", () => {
    it("earn tokens then spend gas — balance changes correctly", async () => {
      // Complete mission to earn tokens
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Check balance after earning
      const balanceRes1 = await agent
        .get("/api/v1/tokens/balance")
        .expect(200);
      expect(balanceRes1.body.data.tokenBalance).toBe(MISSION_COMPLETION_TOKEN_REWARD);

      // Submit exercise on next mission (1.1.2 — need to unlock it first by completing 1.1.1, which we did)
      const submitRes = await agent
        .post("/api/v1/exercises/1.1.2/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      expect(submitRes.body.data.tokenBalance).toBe(MISSION_COMPLETION_TOKEN_REWARD - GAS_FEE_PER_SUBMISSION);

      // Check balance via API
      const balanceRes2 = await agent
        .get("/api/v1/tokens/balance")
        .expect(200);
      expect(balanceRes2.body.data.tokenBalance).toBe(MISSION_COMPLETION_TOKEN_REWARD - GAS_FEE_PER_SUBMISSION);
      expect(balanceRes2.body.data.totalSpent).toBe(GAS_FEE_PER_SUBMISSION);
    });
  });

  describe("Negative balance (debt) handling", () => {
    it("allows balance to go negative mid-mission", async () => {
      // Submit exercise without earning first — balance goes to -2
      const res = await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);

      expect(res.body.data.tokenBalance).toBe(-GAS_FEE_PER_SUBMISSION);

      // Submit again — balance goes to -4, still accepted (mid-mission)
      const res2 = await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      expect(res2.body.data.tokenBalance).toBe(-2 * GAS_FEE_PER_SUBMISSION);
    });

    it("blocks first attempt on new mission when in debt", async () => {
      // Create debt by submitting exercise
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      // Complete mission 1.1.1 to unlock 1.1.2, but don't earn enough to clear debt
      // Actually: completing mission gives +10, debt is -2, so balance = +8. Need more debt.
      // Let's submit many times first to build debt
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);

      // Now balance is -12 (6 submissions * -2)
      // Complete mission: +10, so balance = -12 + 10 = -2
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Try to submit on new mission 1.1.2 — should be blocked (debt)
      const res = await agent
        .post("/api/v1/exercises/1.1.2/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(403);

      expect(res.body.error.code).toBe("INSUFFICIENT_TOKENS");
    });

    it("allows new mission after debt is cleared", async () => {
      // Submit exercise to create small debt
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      // Balance is -2. Complete mission to earn +10 → balance = +8
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Now can start new mission
      const res = await agent
        .post("/api/v1/exercises/1.1.2/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      expect(res.body.data.gasFee).toBe(GAS_FEE_PER_SUBMISSION);
    });
  });

  describe("Auth guard", () => {
    it("returns 401 for unauthenticated exercise submission", async () => {
      const unauthAgent = supertest.agent(app);
      await unauthAgent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(401);
    });
  });
});
