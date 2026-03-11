import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import { app } from "./helpers/app.js";
import { setupApp } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import supertest from "supertest";

beforeAll(async () => {
  await setupApp();
});

describe("Friends Integration", () => {
  let agent1: TestAgent;
  let agent2: TestAgent;
  let user1Id: string;
  let user2Id: string;

  beforeEach(async () => {
    await resetDatabase();
    agent1 = await createAndLoginUser({ email: "user1@example.com", password: "Test123!@#" });
    agent2 = await createAndLoginUser({ email: "user2@example.com", password: "Test123!@#" });

    // Get user IDs
    const res1 = await agent1.get("/api/v1/users/me").expect(200);
    const res2 = await agent2.get("/api/v1/users/me").expect(200);
    user1Id = res1.body.data.id;
    user2Id = res2.body.data.id;
  });

  describe("Authentication (AC #11)", () => {
    it("GET /friends without auth → 401", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.get("/api/v1/friends");
      expect(res.status).toBe(401);
    });

    it("POST /friends/:userId without auth → 401", async () => {
      const unauthAgent = supertest.agent(app);
      const res = await unauthAgent.post(`/api/v1/friends/${user2Id}`);
      expect(res.status).toBe(401);
    });
  });

  describe("Send friend request (AC #1)", () => {
    it("sends friend request → 201 with PENDING friendship", async () => {
      const res = await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);

      expect(res.body.data.status).toBe("PENDING");
      expect(res.body.data.requesterId).toBe(user1Id);
      expect(res.body.data.addresseeId).toBe(user2Id);
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.createdAt).toBeDefined();
      expect(res.body.data.updatedAt).toBeDefined();
    });
  });

  describe("Accept friend request (AC #2)", () => {
    it("accepts friend request → 200 with ACCEPTED friendship", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);

      const res = await agent2.post(`/api/v1/friends/${user1Id}/accept`).expect(200);

      expect(res.body.data.status).toBe("ACCEPTED");
    });
  });

  describe("Get friends list (AC #4)", () => {
    it("returns only ACCEPTED friends with displayName, avatarUrl, online", async () => {
      // Send and accept friend request
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);
      await agent2.post(`/api/v1/friends/${user1Id}/accept`).expect(200);

      const res = await agent1.get("/api/v1/friends").expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(user2Id);
      expect(res.body.data[0]).toHaveProperty("displayName");
      expect(res.body.data[0]).toHaveProperty("avatarUrl");
      expect(res.body.data[0]).toHaveProperty("online");
      expect(typeof res.body.data[0].online).toBe("boolean");
    });

    it("does not return PENDING friendships in friends list", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);

      const res = await agent1.get("/api/v1/friends").expect(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("Get pending requests (AC #5)", () => {
    it("returns pending incoming requests with requester info", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);

      const res = await agent2.get("/api/v1/friends/requests").expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(user1Id);
      expect(res.body.data[0]).toHaveProperty("displayName");
      expect(res.body.data[0]).toHaveProperty("avatarUrl");
      expect(res.body.data[0]).toHaveProperty("createdAt");
    });

    it("does not return requests sent by user", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);

      // user1 should NOT see their own sent request in "requests"
      const res = await agent1.get("/api/v1/friends/requests").expect(200);
      expect(res.body.data).toHaveLength(0);
    });
  });

  describe("Error cases", () => {
    it("self-friend request → 400 CANNOT_FRIEND_SELF (AC #6)", async () => {
      const res = await agent1.post(`/api/v1/friends/${user1Id}`);

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe("CANNOT_FRIEND_SELF");
    });

    it("duplicate friend request → 409 FRIENDSHIP_ALREADY_EXISTS (AC #7)", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);

      const res = await agent1.post(`/api/v1/friends/${user2Id}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("FRIENDSHIP_ALREADY_EXISTS");
    });

    it("accept non-existent request → 404 FRIEND_REQUEST_NOT_FOUND (AC #8)", async () => {
      const res = await agent2.post(`/api/v1/friends/${user1Id}/accept`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("FRIEND_REQUEST_NOT_FOUND");
    });

    it("friend request to non-existent user → 404 USER_NOT_FOUND (AC #12)", async () => {
      const fakeId = "00000000-0000-0000-0000-000000000000";
      const res = await agent1.post(`/api/v1/friends/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("USER_NOT_FOUND");
    });
  });

  describe("Remove friend (AC #3)", () => {
    it("removes friend → 204", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);
      await agent2.post(`/api/v1/friends/${user1Id}/accept`).expect(200);

      await agent1.delete(`/api/v1/friends/${user2Id}`).expect(204);

      // Verify neither user sees the other
      const res1 = await agent1.get("/api/v1/friends").expect(200);
      const res2 = await agent2.get("/api/v1/friends").expect(200);
      expect(res1.body.data).toHaveLength(0);
      expect(res2.body.data).toHaveLength(0);
    });

    it("removes PENDING friendship (decline request) → 204", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);

      // Addressee declines by deleting the pending friendship
      await agent2.delete(`/api/v1/friends/${user1Id}`).expect(204);

      // Verify the pending request is gone
      const res = await agent2.get("/api/v1/friends/requests").expect(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("remove non-existent friend → 404 FRIENDSHIP_NOT_FOUND (AC #9)", async () => {
      const res = await agent1.delete(`/api/v1/friends/${user2Id}`);

      expect(res.status).toBe(404);
      expect(res.body.error.code).toBe("FRIENDSHIP_NOT_FOUND");
    });
  });

  describe("Bidirectional behavior", () => {
    it("both users see each other in friends list after acceptance", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);
      await agent2.post(`/api/v1/friends/${user1Id}/accept`).expect(200);

      const res1 = await agent1.get("/api/v1/friends").expect(200);
      const res2 = await agent2.get("/api/v1/friends").expect(200);

      expect(res1.body.data).toHaveLength(1);
      expect(res1.body.data[0].id).toBe(user2Id);
      expect(res2.body.data).toHaveLength(1);
      expect(res2.body.data[0].id).toBe(user1Id);
    });

    it("removal: neither user sees the other after removal", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);
      await agent2.post(`/api/v1/friends/${user1Id}/accept`).expect(200);

      // User 2 removes the friendship
      await agent2.delete(`/api/v1/friends/${user1Id}`).expect(204);

      const res1 = await agent1.get("/api/v1/friends").expect(200);
      const res2 = await agent2.get("/api/v1/friends").expect(200);
      expect(res1.body.data).toHaveLength(0);
      expect(res2.body.data).toHaveLength(0);
    });

    it("reverse duplicate: B→A when A→B exists → 409", async () => {
      await agent1.post(`/api/v1/friends/${user2Id}`).expect(201);

      const res = await agent2.post(`/api/v1/friends/${user1Id}`);
      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe("FRIENDSHIP_ALREADY_EXISTS");
    });
  });
});
