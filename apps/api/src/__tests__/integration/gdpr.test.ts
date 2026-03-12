import { describe, it, expect, beforeEach } from "vitest";
import { prisma } from "./helpers/app.js";
import { createAndLoginUser, type TestAgent } from "./helpers/auth.js";
import { resetDatabase } from "./helpers/db.js";
import supertest from "supertest";
import { app } from "./helpers/app.js";

describe("GDPR Integration", () => {
  let agent: TestAgent;

  beforeEach(async () => {
    await resetDatabase();
    agent = await createAndLoginUser();
  });

  describe("Full export flow", () => {
    it("request → email sent → download → token consumed", async () => {
      // 1. Request export
      const exportRes = await agent.post("/api/v1/gdpr/export").expect(200);
      expect(exportRes.body.data.message).toContain("email");

      // 2. Verify token was created in DB
      const tokens = await prisma.gdprExportToken.findMany();
      expect(tokens).toHaveLength(1);
      const token = tokens[0];
      expect(token.usedAt).toBeNull();

      // 3. Download export using token
      const downloadRes = await supertest(app)
        .get(`/api/v1/gdpr/export/${token.token}`)
        .expect(200);

      expect(downloadRes.body.data).toBeDefined();
      expect(downloadRes.body.data.user).toBeDefined();
      expect(downloadRes.body.data.user.email).toBe("test@example.com");
      expect(downloadRes.body.data.exportedAt).toBeDefined();
      expect(downloadRes.body.data.progress).toBeDefined();
      expect(downloadRes.body.data.tokens).toBeDefined();
      expect(downloadRes.body.data.achievements).toBeDefined();
      expect(downloadRes.body.data.friends).toBeDefined();
      expect(downloadRes.body.data.notifications).toBeDefined();

      // Sensitive fields must not be present
      expect(downloadRes.body.data.user).not.toHaveProperty("passwordHash");
      expect(downloadRes.body.data.user).not.toHaveProperty("twoFactorSecret");

      // 4. Token should now be consumed
      const usedToken = await prisma.gdprExportToken.findUnique({
        where: { token: token.token },
      });
      expect(usedToken?.usedAt).not.toBeNull();

      // 5. Second download attempt should fail (token consumed)
      const secondDownload = await supertest(app)
        .get(`/api/v1/gdpr/export/${token.token}`)
        .expect(400);
      expect(secondDownload.body.error.code).toBe("INVALID_EXPORT_TOKEN");

      // 6. Verify audit logs
      const auditLogs = await prisma.gdprAuditLog.findMany({
        orderBy: { createdAt: "asc" },
      });
      expect(auditLogs).toHaveLength(2);
      expect(auditLogs[0].action).toBe("EXPORT_REQUESTED");
      expect(auditLogs[1].action).toBe("EXPORT_DOWNLOADED");
    });
  });

  describe("Full deletion flow", () => {
    it("request → email sent → confirm → user gone from DB", async () => {
      // Get user ID from session
      const meRes = await agent.get("/api/v1/auth/me").expect(200);
      const userId = meRes.body.data.id;

      // 1. Request deletion
      const deleteRes = await agent.post("/api/v1/gdpr/delete").expect(200);
      expect(deleteRes.body.data.message).toContain("email");

      // 2. Verify token was created
      const tokens = await prisma.gdprDeletionToken.findMany();
      expect(tokens).toHaveLength(1);
      const token = tokens[0];

      // 3. User should still exist
      const userBefore = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(userBefore).not.toBeNull();

      // 4. Confirm deletion
      await supertest(app)
        .post(`/api/v1/gdpr/delete/confirm/${token.token}`)
        .expect(200);

      // 5. User should be gone
      const userAfter = await prisma.user.findUnique({
        where: { id: userId },
      });
      expect(userAfter).toBeNull();

      // 6. Verify audit logs
      const auditLogs = await prisma.gdprAuditLog.findMany({
        orderBy: { createdAt: "asc" },
      });
      expect(auditLogs).toHaveLength(2);
      expect(auditLogs[0].action).toBe("DELETION_REQUESTED");
      expect(auditLogs[1].action).toBe("DELETION_CONFIRMED");
    });

    it("deletion cascades: all related records removed", async () => {
      const meRes = await agent.get("/api/v1/auth/me").expect(200);
      const userId = meRes.body.data.id;

      // Seed some related data
      await prisma.userProgress.create({
        data: { userId, missionId: "1.1.1", status: "COMPLETED", completedAt: new Date() },
      });
      await prisma.tokenTransaction.create({
        data: {
          userId,
          amount: 1,
          type: "EARN",
          missionId: "1.1.1",
          description: "Mission 1.1.1",
        },
      });
      await prisma.notification.create({
        data: { userId, type: "STREAK_MILESTONE", title: "Streak!", body: "7 days" },
      });

      // Request + confirm deletion
      await agent.post("/api/v1/gdpr/delete").expect(200);
      const tokens = await prisma.gdprDeletionToken.findMany();
      await supertest(app)
        .post(`/api/v1/gdpr/delete/confirm/${tokens[0].token}`)
        .expect(200);

      // Verify all related records are gone
      const progress = await prisma.userProgress.findMany({ where: { userId } });
      const transactions = await prisma.tokenTransaction.findMany({ where: { userId } });
      const notifications = await prisma.notification.findMany({ where: { userId } });
      const user = await prisma.user.findUnique({ where: { id: userId } });

      expect(user).toBeNull();
      expect(progress).toHaveLength(0);
      expect(transactions).toHaveLength(0);
      expect(notifications).toHaveLength(0);

      // But GDPR tokens and audit logs survive (no FK to User)
      const gdprTokens = await prisma.gdprDeletionToken.findMany({ where: { userId } });
      const auditLogs = await prisma.gdprAuditLog.findMany({ where: { userId } });
      expect(gdprTokens.length).toBeGreaterThan(0);
      expect(auditLogs.length).toBeGreaterThan(0);
    });
  });

  describe("Error cases", () => {
    it("export with invalid token returns 400", async () => {
      const res = await supertest(app)
        .get("/api/v1/gdpr/export/nonexistent-token")
        .expect(400);
      expect(res.body.error.code).toBe("INVALID_EXPORT_TOKEN");
    });

    it("deletion confirm with invalid token returns 400", async () => {
      const res = await supertest(app)
        .post("/api/v1/gdpr/delete/confirm/nonexistent-token")
        .expect(400);
      expect(res.body.error.code).toBe("INVALID_DELETION_TOKEN");
    });

    it("export requires auth", async () => {
      await supertest(app).post("/api/v1/gdpr/export").expect(401);
    });

    it("delete requires auth", async () => {
      await supertest(app).post("/api/v1/gdpr/delete").expect(401);
    });
  });
});
