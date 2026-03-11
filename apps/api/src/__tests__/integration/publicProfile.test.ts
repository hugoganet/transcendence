import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { app, setupApp, teardownApp } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import supertest from "supertest";

beforeAll(async () => {
  await setupApp();
});

afterAll(async () => {
  await teardownApp();
});

describe("Public Profile Integration", () => {
  let viewerAgent: TestAgent;
  let targetAgent: TestAgent;
  let viewerId: string;
  let targetId: string;

  beforeEach(async () => {
    await resetDatabase();
    viewerAgent = await createAndLoginUser({ email: "viewer@example.com", password: "Test123!@#" });
    targetAgent = await createAndLoginUser({ email: "target@example.com", password: "Test123!@#" });

    const res1 = await viewerAgent.get("/api/v1/users/me").expect(200);
    const res2 = await targetAgent.get("/api/v1/users/me").expect(200);
    viewerId = res1.body.data.id;
    targetId = res2.body.data.id;
  });

  describe("Authentication (AC #4)", () => {
    it("returns 401 for unauthenticated request", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get(`/api/v1/users/${targetId}/profile`);
      expect(res.status).toBe(401);
    });
  });

  describe("Successful profile retrieval (AC #1, #5)", () => {
    it("authenticated user can view another user's public profile", async () => {
      const res = await viewerAgent.get(`/api/v1/users/${targetId}/profile`).expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(targetId);
    });

    it("profile returns expected fields", async () => {
      const res = await viewerAgent.get(`/api/v1/users/${targetId}/profile`).expect(200);

      const profile = res.body.data;
      expect(profile).toHaveProperty("id");
      expect(profile).toHaveProperty("displayName");
      expect(profile).toHaveProperty("avatarUrl");
      expect(profile).toHaveProperty("xp");
      expect(profile).toHaveProperty("currentStreak");
      expect(profile).toHaveProperty("achievements");
      expect(profile).toHaveProperty("completionPercentage");
    });

    it("user with no progress returns all zeros/empty (AC #5)", async () => {
      const res = await viewerAgent.get(`/api/v1/users/${targetId}/profile`).expect(200);

      const profile = res.body.data;
      expect(profile.xp).toBe(0);
      expect(profile.currentStreak).toBe(0);
      expect(profile.achievements).toEqual([]);
      expect(profile.completionPercentage).toBe(0);
    });

    it("user can view their own public profile (no self-exclusion)", async () => {
      const res = await viewerAgent.get(`/api/v1/users/${viewerId}/profile`).expect(200);

      expect(res.body.data.id).toBe(viewerId);
    });
  });

  describe("Private field exclusion (AC #2)", () => {
    it("profile does NOT contain private fields", async () => {
      const res = await viewerAgent.get(`/api/v1/users/${targetId}/profile`).expect(200);

      const profile = res.body.data;
      expect(profile).not.toHaveProperty("email");
      expect(profile).not.toHaveProperty("tokenBalance");
      expect(profile).not.toHaveProperty("passwordHash");
      expect(profile).not.toHaveProperty("twoFactorSecret");
      expect(profile).not.toHaveProperty("twoFactorEnabled");
      expect(profile).not.toHaveProperty("locale");
      expect(profile).not.toHaveProperty("ageConfirmed");
      expect(profile).not.toHaveProperty("disclaimerAcceptedAt");
      expect(profile).not.toHaveProperty("revealTokens");
      expect(profile).not.toHaveProperty("revealWallet");
      expect(profile).not.toHaveProperty("revealGas");
      expect(profile).not.toHaveProperty("revealDashboard");
    });
  });

  describe("Error handling (AC #3)", () => {
    it("returns 404 for non-existent userId", async () => {
      const fakeUuid = "00000000-0000-0000-0000-000000000000";
      const res = await viewerAgent.get(`/api/v1/users/${fakeUuid}/profile`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });

    it("returns 400 for invalid UUID format (Zod validation)", async () => {
      const res = await viewerAgent.get("/api/v1/users/not-a-uuid/profile");

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("INVALID_INPUT");
      expect(res.body.error.details).toHaveProperty("userId");
    });
  });
});
