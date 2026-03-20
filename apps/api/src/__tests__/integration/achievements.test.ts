import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { app, prisma } from "./helpers/app.js";
import { setupApp } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import supertest from "supertest";

beforeAll(async () => {
  await setupApp();
});

describe("Achievements Integration", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createAndLoginUser();
  });

  describe("GET /api/v1/gamification/achievements", () => {
    it("new user → all achievements with earnedAt: null", async () => {
      const res = await agent.get("/api/v1/gamification/achievements").expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(13);
      expect(res.body.data.every((a: { earnedAt: string | null }) => a.earnedAt === null)).toBe(true);
    });

    it("returns 401 without auth", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get("/api/v1/gamification/achievements");
      expect(res.status).toBe(401);
    });

    it("returns correct structure for each achievement", async () => {
      const res = await agent.get("/api/v1/gamification/achievements").expect(200);

      const achievement = res.body.data[0];
      expect(achievement).toHaveProperty("id");
      expect(achievement).toHaveProperty("code");
      expect(achievement).toHaveProperty("title");
      expect(achievement).toHaveProperty("description");
      expect(achievement).toHaveProperty("iconUrl");
      expect(achievement).toHaveProperty("type");
      expect(achievement).toHaveProperty("threshold");
      expect(achievement).toHaveProperty("earnedAt");
    });
  });

  describe("TOKEN_THRESHOLD achievements via mission completion", () => {
    it("completing 1 mission (10 tokens) → earns FIRST_TOKENS", async () => {
      const completeRes = await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // newAchievements in response should include FIRST_TOKENS
      expect(completeRes.body.data.newAchievements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "FIRST_TOKENS" }),
        ]),
      );

      // GET achievements should show FIRST_TOKENS as earned
      const res = await agent.get("/api/v1/gamification/achievements").expect(200);
      const firstTokens = res.body.data.find((a: { code: string }) => a.code === "FIRST_TOKENS");
      expect(firstTokens.earnedAt).toBeTruthy();
    });
  });

  describe("MODULE_COMPLETION achievements via category completion", () => {
    it("completing all missions in category 1 → earns BLOCKCHAIN_BEGINNER", async () => {
      const category1Missions = [
        "1.1.1", "1.1.2", "1.1.3",
        "1.2.1", "1.2.2", "1.2.3", "1.2.4", "1.2.5",
        "1.3.1", "1.3.2", "1.3.3",
      ];

      let lastRes;
      for (const missionId of category1Missions) {
        lastRes = await agent
          .post(`/api/v1/curriculum/missions/${missionId}/complete`)
          .send({})
          .expect(200);
      }

      // Last mission should trigger BLOCKCHAIN_BEGINNER
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(lastRes!.body.data.newAchievements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "BLOCKCHAIN_BEGINNER" }),
        ]),
      );

      // Verify via GET
      const res = await agent.get("/api/v1/gamification/achievements").expect(200);
      const blockchainBeginner = res.body.data.find((a: { code: string }) => a.code === "BLOCKCHAIN_BEGINNER");
      expect(blockchainBeginner.earnedAt).toBeTruthy();
    });
  });

  describe("STREAK_TARGET achievements", () => {
    it("completing missions on 3 consecutive days → earns GETTING_STARTED", async () => {
      // Complete first mission (streak = 1)
      await agent.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      // Simulate: set lastMissionCompletedAt to 2 days ago, streak to 2
      const user = await prisma.user.findFirst({ where: { email: "test@example.com" } });
      const twoDaysAgo = new Date();
      twoDaysAgo.setUTCDate(twoDaysAgo.getUTCDate() - 1);
      // Set to yesterday so next completion extends streak
      await prisma.user.update({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        where: { id: user!.id },
        data: { lastMissionCompletedAt: twoDaysAgo, currentStreak: 2, longestStreak: 2 },
      });

      // Complete second mission (should bump streak to 3)
      const res = await agent.post("/api/v1/curriculum/missions/1.1.2/complete").send({}).expect(200);

      expect(res.body.data.newAchievements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ code: "GETTING_STARTED" }),
        ]),
      );
    });
  });

  describe("Idempotency", () => {
    it("same achievement cannot be earned twice", async () => {
      // Complete mission 1.1.1 → earns FIRST_TOKENS (10 tokens)
      await agent.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      // Verify FIRST_TOKENS earned
      const res1 = await agent.get("/api/v1/gamification/achievements").expect(200);
      const firstTokens1 = res1.body.data.find((a: { code: string }) => a.code === "FIRST_TOKENS");
      const earnedAt1 = firstTokens1.earnedAt;
      expect(earnedAt1).toBeTruthy();

      // Complete another mission — FIRST_TOKENS should NOT be re-awarded
      const completeRes = await agent.post("/api/v1/curriculum/missions/1.1.2/complete").send({}).expect(200);
      const rearwarded = completeRes.body.data.newAchievements.find(
        (a: { code: string }) => a.code === "FIRST_TOKENS",
      );
      expect(rearwarded).toBeUndefined();

      // earnedAt should remain the same
      const res2 = await agent.get("/api/v1/gamification/achievements").expect(200);
      const firstTokens2 = res2.body.data.find((a: { code: string }) => a.code === "FIRST_TOKENS");
      expect(firstTokens2.earnedAt).toBe(earnedAt1);
    });
  });

  describe("Mixed earned/unearned state", () => {
    it("after earning some achievements → GET returns mix of earned and unearned", async () => {
      // Complete one mission → earns FIRST_TOKENS only
      await agent.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      const res = await agent.get("/api/v1/gamification/achievements").expect(200);

      const earned = res.body.data.filter((a: { earnedAt: string | null }) => a.earnedAt !== null);
      const unearned = res.body.data.filter((a: { earnedAt: string | null }) => a.earnedAt === null);

      expect(earned.length).toBeGreaterThanOrEqual(1);
      expect(unearned.length).toBeGreaterThanOrEqual(1);
    });
  });
});
