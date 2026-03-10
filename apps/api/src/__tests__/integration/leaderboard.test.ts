import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { app, prisma } from "./helpers/app.js";
import { setupApp } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import supertest from "supertest";

beforeAll(async () => {
  await setupApp();
});

describe("Leaderboard Integration", () => {
  let agent1: TestAgent;

  beforeEach(async () => {
    await resetDatabase();
    agent1 = await createAndLoginUser({ email: "user1@example.com", password: "Test123!@#" });
  });

  describe("GET /api/v1/gamification/leaderboard", () => {
    it("returns 401 without auth", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get("/api/v1/gamification/leaderboard");
      expect(res.status).toBe(401);
    });

    it("single active user this week → appears as rank 1 and as currentUser", async () => {
      // Complete a mission to become active this week
      await agent1.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      const res = await agent1.get("/api/v1/gamification/leaderboard").expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].rank).toBe(1);
      expect(res.body.data[0].missionsCompleted).toBe(1);
      expect(res.body.currentUser.rank).toBe(1);
      expect(res.body.currentUser.missionsCompleted).toBe(1);
      expect(res.body.meta.total).toBe(1);
    });

    it("multiple users → ranked by missions completed DESC", async () => {
      // User 1 completes 2 missions
      await agent1.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);
      await agent1.post("/api/v1/curriculum/missions/1.1.2/complete").send({}).expect(200);

      // User 2 completes 1 mission
      const agent2 = await createAndLoginUser({ email: "user2@example.com", password: "Test123!@#" });
      await agent2.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      const res = await agent1.get("/api/v1/gamification/leaderboard").expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].missionsCompleted).toBe(2); // user1
      expect(res.body.data[1].missionsCompleted).toBe(1); // user2
      expect(res.body.data[0].rank).toBe(1);
      expect(res.body.data[1].rank).toBe(2);
      expect(res.body.meta.total).toBe(2);
    });

    it("current user not active this week → rank null in currentUser, absent from data", async () => {
      // User 2 completes a mission (active this week)
      const agent2 = await createAndLoginUser({ email: "user2@example.com", password: "Test123!@#" });
      await agent2.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      // User 1 does NOT complete anything → not active this week
      const res = await agent1.get("/api/v1/gamification/leaderboard").expect(200);

      // User 1 should NOT be in the ranked list
      const user1Entry = res.body.data.find(
        (e: { userId: string }) => e.userId === res.body.currentUser.userId,
      );
      expect(user1Entry).toBeUndefined();

      // currentUser should have rank null
      expect(res.body.currentUser.rank).toBeNull();
      expect(res.body.currentUser.missionsCompleted).toBe(0);
    });

    it("pagination → page 1 returns first N, page 2 returns next N, meta.total correct", async () => {
      // Create 3 users, each completes a different number of missions
      await agent1.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);
      await agent1.post("/api/v1/curriculum/missions/1.1.2/complete").send({}).expect(200);
      await agent1.post("/api/v1/curriculum/missions/1.1.3/complete").send({}).expect(200);

      const agent2 = await createAndLoginUser({ email: "user2@example.com", password: "Test123!@#" });
      await agent2.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);
      await agent2.post("/api/v1/curriculum/missions/1.1.2/complete").send({}).expect(200);

      const agent3 = await createAndLoginUser({ email: "user3@example.com", password: "Test123!@#" });
      await agent3.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      // Page 1 with pageSize=2
      const res1 = await agent1.get("/api/v1/gamification/leaderboard?page=1&pageSize=2").expect(200);
      expect(res1.body.data).toHaveLength(2);
      expect(res1.body.meta.total).toBe(3);
      expect(res1.body.meta.page).toBe(1);
      expect(res1.body.meta.pageSize).toBe(2);

      // Page 2 with pageSize=2
      const res2 = await agent1.get("/api/v1/gamification/leaderboard?page=2&pageSize=2").expect(200);
      expect(res2.body.data).toHaveLength(1);
      expect(res2.body.meta.total).toBe(3);
      expect(res2.body.meta.page).toBe(2);
    });

    it("tied users share same rank, ordered by earliest last completion (AC #5)", async () => {
      // User 1 completes mission 1.1.1
      await agent1.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      // User 2 completes mission 1.1.1 (same count, but later)
      const agent2 = await createAndLoginUser({ email: "user2@example.com", password: "Test123!@#" });
      await agent2.post("/api/v1/curriculum/missions/1.1.1/complete").send({}).expect(200);

      const res = await agent1.get("/api/v1/gamification/leaderboard").expect(200);

      expect(res.body.data).toHaveLength(2);
      // Both have 1 mission completed — they should share rank 1 (dense ranking)
      expect(res.body.data[0].rank).toBe(1);
      expect(res.body.data[1].rank).toBe(1);
      expect(res.body.data[0].missionsCompleted).toBe(1);
      expect(res.body.data[1].missionsCompleted).toBe(1);
      // First entry should be the earlier completer (user1 completed first)
      expect(res.body.data[0].userId).toBe(res.body.currentUser.userId);
    });

    it("user with no missions at all → rank null, empty leaderboard", async () => {
      // No missions completed by anyone
      const res = await agent1.get("/api/v1/gamification/leaderboard").expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
      expect(res.body.currentUser.rank).toBeNull();
      expect(res.body.currentUser.missionsCompleted).toBe(0);
    });
  });
});
