import { describe, it, expect, vi, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import supertest from "supertest";
import { app, prisma } from "./helpers/app.js";
import { setupApp } from "./helpers/app.js";
import { resetDatabase } from "./helpers/db.js";
import { sessionMiddleware } from "../../config/session.js";
import { createSocketServer } from "../../socket/index.js";
import { clearAllDisconnectTimers } from "../../socket/presence.js";
import * as emailService from "../../services/emailService.js";

let httpServer: HttpServer;
let ioServer: ReturnType<typeof createSocketServer>;
let port: number;

interface TestUser {
  id: string;
  cookie: string;
}

async function createUserWithCookie(email: string): Promise<TestUser> {
  const agent = supertest.agent(app);
  await agent.post("/api/v1/auth/register").send({
    email,
    password: "Test123!@#",
    ageConfirmed: true,
  }).expect(201);

  const loginRes = await agent.post("/api/v1/auth/login").send({
    email,
    password: "Test123!@#",
  });

  const setCookies: string[] = loginRes.headers["set-cookie"] ?? [];
  const sidCookie = setCookies
    .map((c: string) => c.split(";")[0])
    .find((c: string) => c.startsWith("connect.sid="));

  const meRes = await agent.get("/api/v1/users/me").expect(200);

  return {
    id: meRes.body.data.id,
    cookie: sidCookie ?? "",
  };
}

function createSocketClient(cookie: string): ClientSocket {
  return ioc(`http://localhost:${port}`, {
    transports: ["websocket"],
    extraHeaders: { cookie },
  });
}

function waitForEvent<T>(socket: ClientSocket, event: string, timeoutMs = 10_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

beforeAll(async () => {
  await setupApp();

  httpServer = createServer(app);
  ioServer = createSocketServer(httpServer, sessionMiddleware);

  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  port = (httpServer.address() as AddressInfo).port;
});

afterAll(async () => {
  clearAllDisconnectTimers();
  await ioServer?.close();
  httpServer?.close();
});

describe("Engagement Integration", () => {
  let user: TestUser;
  const clients: ClientSocket[] = [];

  beforeEach(async () => {
    await resetDatabase();
    user = await createUserWithCookie("engage-user@example.com");
  });

  afterEach(async () => {
    clearAllDisconnectTimers();
    for (const client of clients) {
      if (client.connected) client.disconnect();
    }
    clients.length = 0;
  });

  describe("Re-engagement notification on Socket.IO connect (AC #1, #6)", () => {
    it("creates re-engagement notification for 7+ day inactive user", async () => {
      // Set lastMissionCompletedAt to 10 days ago and create some progress
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { lastMissionCompletedAt: tenDaysAgo },
      });
      await prisma.userProgress.create({
        data: { userId: user.id, missionId: "1.1.1", status: "COMPLETED", completedAt: tenDaysAgo },
      });

      const client = createSocketClient(user.cookie);
      clients.push(client);

      const received: { type: string; title: string; body: string; data: unknown }[] = [];
      client.on("notification:push", (payload: { type: string; title: string; body: string; data: unknown }) => {
        received.push(payload);
      });

      await waitForEvent(client, "connect");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const reengagement = received.find((n) => n.type === "REENGAGEMENT");
      expect(reengagement).toBeDefined();
      expect(reengagement!.title).toBe("Welcome back!");
      expect(reengagement!.body).toContain("1 mission");
      expect(reengagement!.body).toContain("Pick up where you left off!");
    });

    it("does NOT create re-engagement notification for recently active user", async () => {
      // Set lastMissionCompletedAt to 2 days ago (under threshold)
      await prisma.user.update({
        where: { id: user.id },
        data: { lastMissionCompletedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      });

      const client = createSocketClient(user.cookie);
      clients.push(client);

      const received: { type: string }[] = [];
      client.on("notification:push", (payload: { type: string }) => {
        received.push(payload);
      });

      await waitForEvent(client, "connect");
      await new Promise((resolve) => setTimeout(resolve, 500));

      const reengagement = received.find((n) => n.type === "REENGAGEMENT");
      expect(reengagement).toBeUndefined();
    });

    it("deduplicates re-engagement notifications (second connect does NOT create duplicate)", async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { lastMissionCompletedAt: tenDaysAgo },
      });

      // First connection — should create notification
      const client1 = createSocketClient(user.cookie);
      clients.push(client1);
      await waitForEvent(client1, "connect");
      await new Promise((resolve) => setTimeout(resolve, 1000));
      client1.disconnect();
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Second connection — should NOT create duplicate
      const client2 = createSocketClient(user.cookie);
      clients.push(client2);

      const received: { type: string }[] = [];
      client2.on("notification:push", (payload: { type: string }) => {
        received.push(payload);
      });

      await waitForEvent(client2, "connect");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Count REENGAGEMENT notifications in DB
      const notifs = await prisma.notification.findMany({
        where: { userId: user.id, type: "REENGAGEMENT" },
      });

      expect(notifs).toHaveLength(1); // Only one, despite two connections
    });

    it("includes progress stats in re-engagement notification", async () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { lastMissionCompletedAt: tenDaysAgo },
      });
      // Create 3 completed missions and 1 completed chapter
      await prisma.userProgress.createMany({
        data: [
          { userId: user.id, missionId: "1.1.1", status: "COMPLETED", completedAt: tenDaysAgo },
          { userId: user.id, missionId: "1.1.2", status: "COMPLETED", completedAt: tenDaysAgo },
          { userId: user.id, missionId: "1.1.3", status: "COMPLETED", completedAt: tenDaysAgo },
        ],
      });
      await prisma.chapterProgress.create({
        data: { userId: user.id, chapterId: "1.1", status: "COMPLETED", completedAt: tenDaysAgo },
      });

      const client = createSocketClient(user.cookie);
      clients.push(client);

      const received: { type: string; body: string; data: unknown }[] = [];
      client.on("notification:push", (payload: { type: string; body: string; data: unknown }) => {
        received.push(payload);
      });

      await waitForEvent(client, "connect");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const reengagement = received.find((n) => n.type === "REENGAGEMENT");
      expect(reengagement).toBeDefined();
      expect(reengagement!.body).toContain("3 missions");
      expect(reengagement!.body).toContain("1 chapter");
      const data = reengagement!.data as { totalMissionsCompleted: number; totalChaptersCompleted: number };
      expect(data.totalMissionsCompleted).toBe(3);
      expect(data.totalChaptersCompleted).toBe(1);
    });
  });

  describe("Streak reminder logic (AC #2, #5)", () => {
    it("sends streak reminder to user with active streak who hasn't completed a mission today", async () => {
      // Set user with active streak, last mission = yesterday
      const now = new Date();
      const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
      const yesterday = new Date(todayStart);
      yesterday.setUTCDate(yesterday.getUTCDate() - 1);
      yesterday.setUTCHours(12);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          currentStreak: 5,
          lastMissionCompletedAt: yesterday,
        },
      });

      // User must be connected via Socket.IO (AC #5: only send to connected users)
      const client = createSocketClient(user.cookie);
      clients.push(client);
      await waitForEvent(client, "connect");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Call checkStreakReminders directly
      const { checkStreakReminders } = await import("../../services/engagementService.js");
      const count = await checkStreakReminders(ioServer);

      expect(count).toBe(1);

      // Verify notification was created in DB
      const notifs = await prisma.notification.findMany({
        where: { userId: user.id, type: "STREAK_REMINDER" },
      });
      expect(notifs).toHaveLength(1);
      expect(notifs[0].title).toBe("Keep your streak alive!");
      expect(notifs[0].body).toContain("5-day streak");
    });
  });

  describe("Re-engagement email for disconnected users (AC #2 email)", () => {
    it("sends re-engagement email when user is inactive 7+ days and not connected", async () => {
      const sendEmailSpy = vi.spyOn(emailService, "sendReEngagementEmail").mockResolvedValue();

      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { lastMissionCompletedAt: tenDaysAgo },
      });
      await prisma.userProgress.create({
        data: { userId: user.id, missionId: "1.1.1", status: "COMPLETED", completedAt: tenDaysAgo },
      });

      // Call checkReengagement directly WITHOUT the user being connected via Socket.IO
      const { checkReengagement } = await import("../../services/engagementService.js");
      await checkReengagement(ioServer, user.id);

      // User is not connected, so email should be sent
      expect(sendEmailSpy).toHaveBeenCalledWith(
        "engage-user@example.com",
        null, // User registered without a displayName
        expect.objectContaining({
          totalMissions: 1,
          totalChapters: 0,
        }),
        expect.stringContaining("/curriculum"),
      );

      // In-app notification should also be created
      const notifs = await prisma.notification.findMany({
        where: { userId: user.id, type: "REENGAGEMENT" },
      });
      expect(notifs).toHaveLength(1);

      sendEmailSpy.mockRestore();
    });

    it("does NOT send re-engagement email when user is connected via Socket.IO", async () => {
      const sendEmailSpy = vi.spyOn(emailService, "sendReEngagementEmail").mockResolvedValue();

      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      await prisma.user.update({
        where: { id: user.id },
        data: { lastMissionCompletedAt: tenDaysAgo },
      });
      await prisma.userProgress.create({
        data: { userId: user.id, missionId: "1.1.1", status: "COMPLETED", completedAt: tenDaysAgo },
      });

      // Connect user via Socket.IO first
      const client = createSocketClient(user.cookie);
      clients.push(client);
      await waitForEvent(client, "connect");
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Clear the notification and dedup record created on initial connect
      await prisma.notification.deleteMany({ where: { userId: user.id, type: "REENGAGEMENT" } });
      sendEmailSpy.mockClear();

      // Actually call checkReengagement while user IS connected
      const { checkReengagement } = await import("../../services/engagementService.js");
      await checkReengagement(ioServer, user.id);

      // User is connected via Socket.IO, so email should NOT be sent
      expect(sendEmailSpy).not.toHaveBeenCalled();

      sendEmailSpy.mockRestore();
    });
  });

  describe("Notification preferences (AC #3, #4)", () => {
    it("GET /preferences returns default preferences", async () => {
      const res = await supertest(app)
        .get("/api/v1/notifications/preferences")
        .set("Cookie", user.cookie)
        .expect(200);

      expect(res.body.data).toEqual({
        streakReminder: true,
        reengagement: true,
        moduleComplete: true,
        tokenThreshold: true,
        streakMilestone: true,
      });
    });

    it("PATCH /preferences updates and returns merged preferences", async () => {
      const res = await supertest(app)
        .patch("/api/v1/notifications/preferences")
        .set("Cookie", user.cookie)
        .send({ streakReminder: false, reengagement: false })
        .expect(200);

      expect(res.body.data.streakReminder).toBe(false);
      expect(res.body.data.reengagement).toBe(false);
      expect(res.body.data.moduleComplete).toBe(true); // unchanged

      // Verify via GET
      const getRes = await supertest(app)
        .get("/api/v1/notifications/preferences")
        .set("Cookie", user.cookie)
        .expect(200);

      expect(getRes.body.data.streakReminder).toBe(false);
      expect(getRes.body.data.reengagement).toBe(false);
    });

    it("respects notification preferences — opted-out user gets no notification", async () => {
      // Opt out of reengagement
      await supertest(app)
        .patch("/api/v1/notifications/preferences")
        .set("Cookie", user.cookie)
        .send({ reengagement: false })
        .expect(200);

      // Set user as 10-day inactive
      await prisma.user.update({
        where: { id: user.id },
        data: { lastMissionCompletedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) },
      });

      const client = createSocketClient(user.cookie);
      clients.push(client);

      const received: { type: string }[] = [];
      client.on("notification:push", (payload: { type: string }) => {
        received.push(payload);
      });

      await waitForEvent(client, "connect");
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const reengagement = received.find((n) => n.type === "REENGAGEMENT");
      expect(reengagement).toBeUndefined();
    });
  });
});
