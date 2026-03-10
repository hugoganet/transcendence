import { describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { app } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import { prisma } from "./helpers/app.js";

describe("Exercise Submission Integration", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createAndLoginUser();
  });

  describe("POST /api/v1/exercises/:exerciseId/submit", () => {
    it("returns correct result for correct SI answer and records attempt in DB", async () => {
      // Mission 1.1.1 is SI type, first mission = always available
      // Option "b" is correct in real content
      const res = await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      expect(res.body.data.correct).toBe(true);
      expect(res.body.data.score).toBe(1);
      expect(res.body.data.totalPoints).toBe(1);
      expect(res.body.data.feedback).toHaveLength(1);
      expect(res.body.data.feedback[0].correct).toBe(true);
      expect(res.body.data.feedback[0].correctAnswer).toBeNull();

      // Verify attempt was recorded in real DB
      const attempts = await prisma.exerciseAttempt.findMany({
        where: { exerciseId: "1.1.1" },
      });
      expect(attempts).toHaveLength(1);
      expect(attempts[0].correct).toBe(true);
    });

    it("returns incorrect result for wrong SI answer with feedback", async () => {
      const res = await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);

      expect(res.body.data.correct).toBe(false);
      expect(res.body.data.score).toBe(0);
      expect(res.body.data.feedback[0].correct).toBe(false);
      expect(res.body.data.feedback[0].correctAnswer).toBeTruthy();
      expect(res.body.data.feedback[0].explanation).toBeTruthy();

      // Verify incorrect attempt recorded
      const attempts = await prisma.exerciseAttempt.findMany({
        where: { exerciseId: "1.1.1" },
      });
      expect(attempts).toHaveLength(1);
      expect(attempts[0].correct).toBe(false);
    });

    it("allows multiple submissions for the same exercise", async () => {
      // First attempt: wrong
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);

      // Second attempt: correct
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      const attempts = await prisma.exerciseAttempt.findMany({
        where: { exerciseId: "1.1.1" },
      });
      expect(attempts).toHaveLength(2);
    });

    it("returns 403 MISSION_LOCKED for locked mission", async () => {
      // Mission 1.1.2 requires 1.1.1 to be completed first
      const res = await agent
        .post("/api/v1/exercises/1.1.2/submit")
        .send({ type: "CM", submission: { matches: [{ termId: "1", definitionId: "1" }] } })
        .expect(403);

      expect(res.body.error.code).toBe("MISSION_LOCKED");
    });

    it("returns 400 INVALID_INPUT for invalid body", async () => {
      const res = await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "INVALID", submission: {} })
        .expect(400);

      expect(res.body.error).toBeDefined();
    });

    it("returns 401 UNAUTHORIZED without auth", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(401);

      expect(res.body.error.code).toBe("UNAUTHORIZED");
    });

    it("returns 404 EXERCISE_NOT_FOUND for non-existent exercise", async () => {
      const res = await agent
        .post("/api/v1/exercises/99.99.99/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(404);

      expect(res.body.error.code).toBe("EXERCISE_NOT_FOUND");
    });

    it("submits CM exercise after unlocking mission via completion", async () => {
      // Complete missions 1.1.1 and 1.1.2 (both SI) to unlock 1.1.3 (CM type)
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);
      await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);

      await agent
        .post("/api/v1/exercises/1.1.2/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);
      await agent
        .post("/api/v1/curriculum/missions/1.1.2/complete")
        .send({})
        .expect(200);

      // Now 1.1.3 should be available — submit CM exercise
      // Mission 1.1.3 is CM type — 4 pairs from real content
      const res = await agent
        .post("/api/v1/exercises/1.1.3/submit")
        .send({
          type: "CM",
          submission: {
            matches: [
              { termId: "1", definitionId: "1" },
              { termId: "2", definitionId: "2" },
              { termId: "3", definitionId: "3" },
              { termId: "4", definitionId: "4" },
            ],
          },
        })
        .expect(200);

      expect(res.body.data.score).toBeGreaterThanOrEqual(0);
      expect(res.body.data.totalPoints).toBeGreaterThan(0);
      expect(res.body.data.feedback).toBeDefined();
    });
  });

  describe("GET /api/v1/exercises/missions/:missionId/status", () => {
    it("returns completable=false with no attempts", async () => {
      const res = await agent
        .get("/api/v1/exercises/missions/1.1.1/status")
        .expect(200);

      expect(res.body.data.missionId).toBe("1.1.1");
      expect(res.body.data.completable).toBe(false);
      expect(res.body.data.attempts).toBe(0);
      expect(res.body.data.lastAttemptCorrect).toBeNull();
    });

    it("returns completable=true after correct submission", async () => {
      // Submit correct answer first
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      const res = await agent
        .get("/api/v1/exercises/missions/1.1.1/status")
        .expect(200);

      expect(res.body.data.completable).toBe(true);
      expect(res.body.data.attempts).toBe(1);
      expect(res.body.data.lastAttemptCorrect).toBe(true);
    });

    it("returns completable=false after only incorrect submissions", async () => {
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "a" } })
        .expect(200);

      const res = await agent
        .get("/api/v1/exercises/missions/1.1.1/status")
        .expect(200);

      expect(res.body.data.completable).toBe(false);
      expect(res.body.data.attempts).toBe(1);
      expect(res.body.data.lastAttemptCorrect).toBe(false);
    });

    it("chains exercise → status → mission complete", async () => {
      // 1. Submit correct exercise
      await agent
        .post("/api/v1/exercises/1.1.1/submit")
        .send({ type: "SI", submission: { selectedOptionId: "b" } })
        .expect(200);

      // 2. Check status → completable
      const statusRes = await agent
        .get("/api/v1/exercises/missions/1.1.1/status")
        .expect(200);
      expect(statusRes.body.data.completable).toBe(true);

      // 3. Complete mission
      const completeRes = await agent
        .post("/api/v1/curriculum/missions/1.1.1/complete")
        .send({})
        .expect(200);
      expect(completeRes.body.data.status).toBe("completed");
      expect(completeRes.body.data.nextMissionId).toBeTruthy();

      // 4. Verify progress updated
      const curriculumRes = await agent
        .get("/api/v1/curriculum")
        .expect(200);
      expect(curriculumRes.body.data.completedMissions).toBe(1);
    });

    it("returns 401 without auth", async () => {
      const unauthAgent = supertest.agent(app);
      await unauthAgent
        .get("/api/v1/exercises/missions/1.1.1/status")
        .expect(401);
    });
  });
});
