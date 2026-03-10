import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { app } from "./helpers/app.js";
import { setupApp } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import supertest from "supertest";

beforeAll(async () => {
  await setupApp();
});

describe("Progressive Reveal Integration", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createAndLoginUser({ email: "reveal@example.com", password: "Test123!@#" });
  });

  describe("GET /api/v1/users/me/reveals", () => {
    it("returns 401 without auth", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get("/api/v1/users/me/reveals");
      expect(res.status).toBe(401);
    });

    it("new user has all reveals false", async () => {
      const res = await agent.get("/api/v1/users/me/reveals").expect(200);

      expect(res.body.data).toEqual({
        tokensRevealed: false,
        walletRevealed: false,
        gasRevealed: false,
        dashboardRevealed: false,
      });
    });
  });

  describe("Reveal triggers via mission completion", () => {
    it("after completing a non-reveal mission → reveals unchanged", async () => {
      // Mission 1.1.1 has progressiveReveal: null
      await agent.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      const res = await agent.get("/api/v1/users/me/reveals").expect(200);

      expect(res.body.data).toEqual({
        tokensRevealed: false,
        walletRevealed: false,
        gasRevealed: false,
        dashboardRevealed: false,
      });
    });

    it("after completing mission 2.2.4 → tokensRevealed becomes true, others remain false", async () => {
      // Complete all prerequisite missions up to 2.2.3 in sequential order
      // Category 1: 1.1.1-1.1.3, 1.2.1-1.2.5, 1.3.1-1.3.3 (11 missions)
      // Category 2: 2.1.1-2.1.4, 2.2.1-2.2.3 (7 missions)
      const missionsToComplete = [
        "1.1.1", "1.1.2", "1.1.3",
        "1.2.1", "1.2.2", "1.2.3", "1.2.4", "1.2.5",
        "1.3.1", "1.3.2", "1.3.3",
        "2.1.1", "2.1.2", "2.1.3", "2.1.4",
        "2.2.1", "2.2.2", "2.2.3",
      ];

      for (const missionId of missionsToComplete) {
        await agent.post(`/api/v1/curriculum/missions/${missionId}/complete`).send({}).expect(200);
      }

      // Now complete 2.2.4 which triggers tokensRevealed
      const completeRes = await agent
        .post("/api/v1/curriculum/missions/2.2.4/complete")
        .send({})
        .expect(200);

      expect(completeRes.body.data.progressiveReveal).toEqual({
        mechanic: "tokensRevealed",
        description: expect.any(String),
      });
      expect(completeRes.body.data.revealTriggered).toBe(true);

      // Verify reveals endpoint
      const revealsRes = await agent.get("/api/v1/users/me/reveals").expect(200);

      expect(revealsRes.body.data.tokensRevealed).toBe(true);
      expect(revealsRes.body.data.walletRevealed).toBe(false);
      expect(revealsRes.body.data.gasRevealed).toBe(false);
      expect(revealsRes.body.data.dashboardRevealed).toBe(false);
    });

    it("re-completing a reveal trigger mission returns 409 but reveal flag remains true", async () => {
      // Complete prerequisites up to and including 2.2.4
      const missionsToComplete = [
        "1.1.1", "1.1.2", "1.1.3",
        "1.2.1", "1.2.2", "1.2.3", "1.2.4", "1.2.5",
        "1.3.1", "1.3.2", "1.3.3",
        "2.1.1", "2.1.2", "2.1.3", "2.1.4",
        "2.2.1", "2.2.2", "2.2.3", "2.2.4",
      ];

      for (const missionId of missionsToComplete) {
        await agent.post(`/api/v1/curriculum/missions/${missionId}/complete`).send({}).expect(200);
      }

      // Re-completing 2.2.4 is rejected by completeMission guard (409),
      // but the reveal flag set during the first completion remains true.
      const res = await agent
        .post("/api/v1/curriculum/missions/2.2.4/complete")
        .send({});

      expect(res.status).toBe(409);

      // Reveals should still show tokensRevealed as true
      const revealsRes = await agent.get("/api/v1/users/me/reveals").expect(200);
      expect(revealsRes.body.data.tokensRevealed).toBe(true);
    });

    it("multiple reveal triggers accumulate correctly", async () => {
      // Complete all missions up to 3.1.3 (tokensRevealed at 2.2.4, walletRevealed at 3.1.4)
      const missionsToComplete = [
        "1.1.1", "1.1.2", "1.1.3",
        "1.2.1", "1.2.2", "1.2.3", "1.2.4", "1.2.5",
        "1.3.1", "1.3.2", "1.3.3",
        "2.1.1", "2.1.2", "2.1.3", "2.1.4",
        "2.2.1", "2.2.2", "2.2.3", "2.2.4",
        "2.3.1", "2.3.2", "2.3.3", "2.3.4",
        "3.1.1", "3.1.2", "3.1.3",
      ];

      for (const missionId of missionsToComplete) {
        await agent.post(`/api/v1/curriculum/missions/${missionId}/complete`).send({}).expect(200);
      }

      // Complete 3.1.4 which triggers walletRevealed
      const completeRes = await agent
        .post("/api/v1/curriculum/missions/3.1.4/complete")
        .send({})
        .expect(200);

      expect(completeRes.body.data.revealTriggered).toBe(true);

      // Both tokensRevealed (from 2.2.4) and walletRevealed (from 3.1.4) should be true
      const revealsRes = await agent.get("/api/v1/users/me/reveals").expect(200);
      expect(revealsRes.body.data.tokensRevealed).toBe(true);
      expect(revealsRes.body.data.walletRevealed).toBe(true);
      expect(revealsRes.body.data.gasRevealed).toBe(false);
      expect(revealsRes.body.data.dashboardRevealed).toBe(false);
    });
  });
});
