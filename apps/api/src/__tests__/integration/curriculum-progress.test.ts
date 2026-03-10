import { resetDatabase } from "./helpers/db.js";
import { createAndLoginUser } from "./helpers/auth.js";

beforeEach(async () => {
  await resetDatabase();
});

describe("Curriculum progress flow (real DB + real content loader)", () => {
  const credentials = {
    email: "curriculum@example.com",
    password: "Test123!@#",
    ageConfirmed: true,
  };

  it("GET /api/v1/curriculum → 200 with real content from structure.json", async () => {
    const agent = await createAndLoginUser(credentials);

    const res = await agent.get("/api/v1/curriculum").expect(200);

    // Response shape: { data: { categories, completionPercentage, totalMissions, completedMissions } }
    expect(res.body.data).toBeDefined();
    expect(res.body.data.categories).toBeDefined();
    expect(Array.isArray(res.body.data.categories)).toBe(true);
    expect(res.body.data.categories.length).toBeGreaterThan(0);
    expect(res.body.data.totalMissions).toBe(69);

    // First category
    const firstCategory = res.body.data.categories[0];
    expect(firstCategory.categoryId).toBe("1");
    expect(firstCategory.chapters).toBeDefined();
  });

  it("new user sees mission 1.1.1 as available", async () => {
    const agent = await createAndLoginUser(credentials);

    const res = await agent.get("/api/v1/curriculum").expect(200);

    const firstCategory = res.body.data.categories[0];
    const firstChapter = firstCategory.chapters[0];
    const firstMission = firstChapter.missions[0];

    expect(firstMission.missionId).toBe("1.1.1");
    expect(firstMission.status).toBe("available");
  });

  it("complete mission 1.1.1 → 200, re-fetch → 1.1.2 unlocked", async () => {
    const agent = await createAndLoginUser(credentials);

    // Complete mission 1.1.1
    const completeRes = await agent
      .post("/api/v1/curriculum/missions/1.1.1/complete")
      .send({ confidenceRating: 4 })
      .expect(200);

    expect(completeRes.body.data.missionId).toBe("1.1.1");
    expect(completeRes.body.data.status).toBe("completed");

    // Re-fetch curriculum — mission 1.1.2 should now be unlocked
    const currRes = await agent.get("/api/v1/curriculum").expect(200);

    const firstChapter = currRes.body.data.categories[0].chapters[0];
    const mission2 = firstChapter.missions.find(
      (m: { missionId: string }) => m.missionId === "1.1.2",
    );

    expect(mission2).toBeDefined();
    expect(mission2.status).toBe("available");
  });

  it("GET /api/v1/curriculum/chain → returns learning chain with real mission data", async () => {
    const agent = await createAndLoginUser(credentials);

    // Complete a mission first to have chain data
    await agent
      .post("/api/v1/curriculum/missions/1.1.1/complete")
      .send({ confidenceRating: 3 })
      .expect(200);

    const res = await agent.get("/api/v1/curriculum/chain").expect(200);

    expect(res.body.data).toBeDefined();
    expect(res.body.data.blocks).toBeDefined();
    expect(res.body.data.blocks.length).toBeGreaterThanOrEqual(1);
  });
});
