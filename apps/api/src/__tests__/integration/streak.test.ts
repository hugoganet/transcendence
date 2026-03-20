import { describe, it, expect, beforeEach } from "vitest";
import { app, prisma } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import supertest from "supertest";

describe("Streak System Integration", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createAndLoginUser();
  });

  describe("GET /api/v1/gamification/streak", () => {
    it("new user → all zeros/null", async () => {
      const res = await agent.get("/api/v1/gamification/streak").expect(200);

      expect(res.body.data).toEqual({
        currentStreak: 0,
        longestStreak: 0,
        lastMissionCompletedAt: null,
        totalMissionsCompleted: 0,
        totalModulesMastered: 0,
      });
    });

    it("returns 401 without auth", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get("/api/v1/gamification/streak");
      expect(res.status).toBe(401);
    });
  });

  describe("Streak updates via mission completion", () => {
    it("complete first mission → currentStreak=1, longestStreak=1", async () => {
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/gamification/streak").expect(200);

      expect(res.body.data.currentStreak).toBe(1);
      expect(res.body.data.longestStreak).toBe(1);
      expect(res.body.data.lastMissionCompletedAt).toBeTruthy();
      expect(res.body.data.totalMissionsCompleted).toBe(1);
    });

    it("complete second mission same day → currentStreak=1 (no change)", async () => {
      // Complete mission 1.1.1
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Complete mission 1.1.2 (same day)
      await agent
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/gamification/streak").expect(200);

      expect(res.body.data.currentStreak).toBe(1);
      expect(res.body.data.longestStreak).toBe(1);
      expect(res.body.data.totalMissionsCompleted).toBe(2);
    });

    it("complete mission on next day → currentStreak=2", async () => {
      // Complete mission 1.1.1
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Simulate: set lastMissionCompletedAt to yesterday
      const yesterday = new Date();
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);

      // Get user ID from DB
      const user = await prisma.user.findFirst();
      await prisma.user.update({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        where: { id: user!.id },
        data: { lastMissionCompletedAt: yesterday },
      });

      // Complete mission 1.1.2 (now counts as next day)
      await agent
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/gamification/streak").expect(200);

      expect(res.body.data.currentStreak).toBe(2);
      expect(res.body.data.longestStreak).toBe(2);
    });

    it("complete mission after gap → currentStreak=1, longestStreak preserved", async () => {
      // Complete mission 1.1.1
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      // Simulate: set lastMissionCompletedAt to 3 days ago with streak=3
      const threeDaysAgo = new Date();
      threeDaysAgo.setUTCDate(threeDaysAgo.getUTCDate() - 3);

      const user = await prisma.user.findFirst();
      await prisma.user.update({
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        where: { id: user!.id },
        data: {
          lastMissionCompletedAt: threeDaysAgo,
          currentStreak: 3,
          longestStreak: 3,
        },
      });

      // Complete mission 1.1.2 (after gap)
      await agent
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/gamification/streak").expect(200);

      expect(res.body.data.currentStreak).toBe(1);
      expect(res.body.data.longestStreak).toBe(3);
    });

    it("GET streak → correct totalMissionsCompleted count", async () => {
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);
      await agent
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/gamification/streak").expect(200);

      expect(res.body.data.totalMissionsCompleted).toBe(2);
    });

    it("GET streak → totalModulesMastered is 0 when category is partially completed", async () => {
      // Complete 2 of 3 missions in chapter 1.1 (real curriculum has 1.1.1, 1.1.2, 1.1.3)
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);
      await agent
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/gamification/streak").expect(200);

      // Category 1 has 3 chapters — not all completed, so 0 modules mastered
      expect(res.body.data.totalModulesMastered).toBe(0);
    });

    it("GET streak → totalModulesMastered is 1 when all chapters in a category are completed", async () => {
      const user = await prisma.user.findFirst();

      // Directly insert ChapterProgress for all 3 chapters of category 1 (1.1, 1.2, 1.3)
      // This simulates a user who completed the entire category without needing to
      // call completeMission 11 times for all missions in category 1
      await prisma.chapterProgress.createMany({
        data: [
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          { userId: user!.id, chapterId: "1.1", status: "COMPLETED", completedAt: new Date() },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          { userId: user!.id, chapterId: "1.2", status: "COMPLETED", completedAt: new Date() },
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          { userId: user!.id, chapterId: "1.3", status: "COMPLETED", completedAt: new Date() },
        ],
      });

      const res = await agent.get("/api/v1/gamification/streak").expect(200);

      expect(res.body.data.totalModulesMastered).toBe(1);
    });
  });
});
