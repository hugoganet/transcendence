import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import supertest from "supertest";
import { app } from "./helpers/app.js";
import { getContent } from "../../utils/contentLoader.js";

/**
 * Get all mission IDs from the curriculum in sequential order.
 */
function getAllMissionIds(): string[] {
  const curriculum = getContent().curriculum;
  const ids: string[] = [];
  for (const cat of curriculum) {
    for (const chap of cat.chapters) {
      for (const mission of chap.missions) {
        ids.push(mission.id);
      }
    }
  }
  return ids;
}

/**
 * Seed a user's progress so that all missions except the last one (6.3.4)
 * are COMPLETED, and all chapter/category progress is properly set.
 * This makes mission 6.3.4 accessible for the final completion call.
 */
async function seedAllProgressExceptLast(userId: string): Promise<void> {
  const curriculum = getContent().curriculum;
  const allMissions = getAllMissionIds();
  const allExceptLast = allMissions.slice(0, -1); // All except 6.3.4

  // Seed all missions as COMPLETED
  for (const missionId of allExceptLast) {
    await prisma.userProgress.create({
      data: { userId, missionId, status: "COMPLETED", completedAt: new Date() },
    });
  }

  // Seed chapter progress for all chapters
  for (const cat of curriculum) {
    for (const chap of cat.chapters) {
      const lastChapter = cat.chapters[cat.chapters.length - 1];
      const isLastChapterOfLastCat =
        cat.id === curriculum[curriculum.length - 1].id && chap.id === lastChapter.id;

      // All chapters are completed except the last chapter of the last category
      // (since mission 6.3.4 is not yet completed)
      if (!isLastChapterOfLastCat) {
        await prisma.chapterProgress.create({
          data: { userId, chapterId: chap.id, status: "COMPLETED", completedAt: new Date() },
        });
      } else {
        // Last chapter of last category is IN_PROGRESS
        await prisma.chapterProgress.create({
          data: { userId, chapterId: chap.id, status: "IN_PROGRESS" },
        });
      }
    }
  }

  // Seed token balance (missions earn tokens, needed for gas fees)
  await prisma.user.update({
    where: { id: userId },
    data: { tokenBalance: 1000 },
  });
}

describe("Certificate Integration", () => {
  let agent: TestAgent;
  let userId: string;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createAndLoginUser({
      email: "cert-user@example.com",
      password: "Test123!@#",
    });
    const meRes = await agent.get("/api/v1/users/me").expect(200);
    userId = meRes.body.data.id;
  });

  describe("GET /api/v1/users/me/certificate (AC #5, #8)", () => {
    it("returns 404 CERTIFICATE_NOT_AVAILABLE when no missions completed", async () => {
      const res = await agent.get("/api/v1/users/me/certificate");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("CERTIFICATE_NOT_AVAILABLE");
    });

    it("returns 401 for unauthenticated request", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get("/api/v1/users/me/certificate");
      expect(res.status).toBe(401);
    });
  });

  describe("Certificate generation via completeMission (AC #1, #2, #3, #7)", () => {
    beforeEach(async () => {
      // Accept disclaimer for category 6 chapter 3 (if required)
      await seedAllProgressExceptLast(userId);
    });

    it("completeMission response includes certificateGenerated: true for mission 6.3.4", async () => {
      const res = await agent
        .post("/api/v1/curriculum/missions/6.3.4/complete")
        .send({})
        .expect(200);

      expect(res.body.data.certificateGenerated).toBe(true);
    });

    it("after completing all missions, GET /me/certificate returns certificate with correct shape", async () => {
      // Complete the final mission
      await agent
        .post("/api/v1/curriculum/missions/6.3.4/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/users/me/certificate").expect(200);

      expect(res.body.data).toMatchObject({
        id: expect.any(String),
        completionDate: expect.any(String),
        curriculumTitle: "Blockchain Fundamentals",
        shareToken: expect.any(String),
        totalMissions: 69,
        totalCategories: 6,
      });
    });

    it("GET /me/certificate/share returns shareable URL with share token", async () => {
      await agent
        .post("/api/v1/curriculum/missions/6.3.4/complete")
        .send({})
        .expect(200);

      const res = await agent.get("/api/v1/users/me/certificate/share").expect(200);

      expect(res.body.data.shareUrl).toMatch(/\/certificates\/[0-9a-f-]+$/);
    });

    it("certificate generation is idempotent", async () => {
      await agent
        .post("/api/v1/curriculum/missions/6.3.4/complete")
        .send({})
        .expect(200);

      const res1 = await agent.get("/api/v1/users/me/certificate").expect(200);
      const res2 = await agent.get("/api/v1/users/me/certificate").expect(200);

      expect(res1.body.data.id).toBe(res2.body.data.id);
      expect(res1.body.data.shareToken).toBe(res2.body.data.shareToken);
    });
  });

  describe("GET /api/v1/certificates/:shareToken (AC #4, #6)", () => {
    it("returns public certificate without internal IDs", async () => {
      await seedAllProgressExceptLast(userId);
      await agent
        .post("/api/v1/curriculum/missions/6.3.4/complete")
        .send({})
        .expect(200);

      const certRes = await agent.get("/api/v1/users/me/certificate").expect(200);
      const shareToken = certRes.body.data.shareToken;

      // Public endpoint — no auth required
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get(`/api/v1/certificates/${shareToken}`).expect(200);

      expect(res.body.data).not.toHaveProperty("id");
      expect(res.body.data).toMatchObject({
        displayName: null,
        completionDate: expect.any(String),
        curriculumTitle: "Blockchain Fundamentals",
        shareToken,
        totalMissions: 69,
        totalCategories: 6,
      });
    });

    it("returns 404 for invalid token", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get("/api/v1/certificates/invalid-token");
      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("CERTIFICATE_NOT_FOUND");
    });

    it("public certificate endpoint does NOT require auth", async () => {
      await seedAllProgressExceptLast(userId);
      await agent
        .post("/api/v1/curriculum/missions/6.3.4/complete")
        .send({})
        .expect(200);

      const certRes = await agent.get("/api/v1/users/me/certificate").expect(200);
      const shareToken = certRes.body.data.shareToken;

      // Completely unauthenticated request should succeed
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get(`/api/v1/certificates/${shareToken}`);
      expect(res.status).toBe(200);
    });
  });
});
