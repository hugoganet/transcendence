import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
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

describe("Notifications Integration", () => {
  let user: TestUser;
  const clients: ClientSocket[] = [];

  beforeEach(async () => {
    await resetDatabase();
    user = await createUserWithCookie("notif-user@example.com");
  });

  afterEach(async () => {
    clearAllDisconnectTimers();
    for (const client of clients) {
      if (client.connected) client.disconnect();
    }
    clients.length = 0;
  });

  describe("GET /api/v1/notifications (AC #4)", () => {
    it("returns empty list when no notifications exist", async () => {
      const res = await supertest(app)
        .get("/api/v1/notifications")
        .set("Cookie", user.cookie)
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.meta).toEqual({ page: 1, pageSize: 20, total: 0 });
    });

    it("returns notifications paginated, newest first", async () => {
      // Seed 3 notifications with different timestamps
      await prisma.notification.createMany({
        data: [
          { userId: user.id, type: "STREAK_REMINDER", title: "T1", body: "B1", createdAt: new Date("2026-03-10T10:00:00Z") },
          { userId: user.id, type: "MODULE_COMPLETE", title: "T2", body: "B2", createdAt: new Date("2026-03-10T11:00:00Z") },
          { userId: user.id, type: "STREAK_MILESTONE", title: "T3", body: "B3", createdAt: new Date("2026-03-10T12:00:00Z") },
        ],
      });

      // Page 1, size 2
      const res = await supertest(app)
        .get("/api/v1/notifications?page=1&pageSize=2")
        .set("Cookie", user.cookie)
        .expect(200);

      expect(res.body.data).toHaveLength(2);
      expect(res.body.data[0].title).toBe("T3"); // newest first
      expect(res.body.data[1].title).toBe("T2");
      expect(res.body.meta).toEqual({ page: 1, pageSize: 2, total: 3 });

      // Page 2, size 2
      const res2 = await supertest(app)
        .get("/api/v1/notifications?page=2&pageSize=2")
        .set("Cookie", user.cookie)
        .expect(200);

      expect(res2.body.data).toHaveLength(1);
      expect(res2.body.data[0].title).toBe("T1"); // oldest
    });

    it("does not return other users' notifications", async () => {
      const otherUser = await createUserWithCookie("other-user@example.com");
      await prisma.notification.create({
        data: { userId: otherUser.id, type: "STREAK_REMINDER", title: "Other", body: "Not yours" },
      });

      const res = await supertest(app)
        .get("/api/v1/notifications")
        .set("Cookie", user.cookie)
        .expect(200);

      expect(res.body.data).toEqual([]);
      expect(res.body.meta.total).toBe(0);
    });
  });

  describe("PATCH /api/v1/notifications/:id/read (AC #5)", () => {
    it("marks own notification as read", async () => {
      const notif = await prisma.notification.create({
        data: { userId: user.id, type: "MODULE_COMPLETE", title: "Done!", body: "You did it" },
      });

      await supertest(app)
        .patch(`/api/v1/notifications/${notif.id}/read`)
        .set("Cookie", user.cookie)
        .expect(204);

      // Verify in DB
      const updated = await prisma.notification.findUnique({ where: { id: notif.id } });
      expect(updated?.read).toBe(true);
    });

    it("returns 404 for non-existent notification", async () => {
      const res = await supertest(app)
        .patch("/api/v1/notifications/nonexistent-id/read")
        .set("Cookie", user.cookie)
        .expect(404);

      expect(res.body.error.code).toBe("NOT_FOUND");
    });

    it("returns 404 when trying to mark another user's notification", async () => {
      const otherUser = await createUserWithCookie("other2@example.com");
      const notif = await prisma.notification.create({
        data: { userId: otherUser.id, type: "MODULE_COMPLETE", title: "Other", body: "Not yours" },
      });

      const res = await supertest(app)
        .patch(`/api/v1/notifications/${notif.id}/read`)
        .set("Cookie", user.cookie)
        .expect(404);

      expect(res.body.error.code).toBe("NOT_FOUND");
    });
  });

  describe("Socket.IO notification:push (AC #1)", () => {
    it("pushes notification to connected user via Socket.IO", async () => {
      const client = createSocketClient(user.cookie);
      clients.push(client);
      await waitForEvent(client, "connect");

      // Small delay to ensure socket is fully joined to room
      await new Promise((resolve) => setTimeout(resolve, 200));

      // Create notification via service — which emits to Socket.IO
      const { createAndPushNotification } = await import("../../services/notificationService.js");
      const notifPromise = waitForEvent<{ id: string; type: string; title: string; body: string; data: unknown }>(
        client,
        "notification:push",
      );

      await createAndPushNotification(
        ioServer,
        user.id,
        "STREAK_MILESTONE",
        "7-day streak!",
        "You've been learning for 7 days straight!",
        { streakCount: 7 },
      );

      const payload = await notifPromise;
      expect(payload.type).toBe("STREAK_MILESTONE");
      expect(payload.title).toBe("7-day streak!");
      expect(payload.body).toBe("You've been learning for 7 days straight!");
      expect(payload.data).toEqual({ streakCount: 7 });
      expect(payload.id).toBeDefined();
    });
  });

  describe("Missed notification replay on reconnect (AC #2)", () => {
    it("delivers unread notifications on reconnect", async () => {
      // Create notifications while user is NOT connected
      await prisma.notification.createMany({
        data: [
          { userId: user.id, type: "STREAK_REMINDER", title: "Come back!", body: "Don't break your streak", read: false },
          { userId: user.id, type: "MODULE_COMPLETE", title: "Module done", body: "You completed a module", read: false },
        ],
      });

      // Now connect — should receive unread notifications
      const client = createSocketClient(user.cookie);
      clients.push(client);

      const received: unknown[] = [];
      client.on("notification:push", (payload) => {
        received.push(payload);
      });

      await waitForEvent(client, "connect");

      // Wait for all notifications to be delivered
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(received).toHaveLength(2);
    });

    it("does not replay read notifications", async () => {
      // Create one read and one unread notification
      await prisma.notification.create({
        data: { userId: user.id, type: "STREAK_REMINDER", title: "Old", body: "Already read", read: true },
      });
      await prisma.notification.create({
        data: { userId: user.id, type: "MODULE_COMPLETE", title: "New", body: "Still unread", read: false },
      });

      const client = createSocketClient(user.cookie);
      clients.push(client);

      const received: { title: string }[] = [];
      client.on("notification:push", (payload: { title: string }) => {
        received.push(payload);
      });

      await waitForEvent(client, "connect");
      await new Promise((resolve) => setTimeout(resolve, 500));

      expect(received).toHaveLength(1);
      expect(received[0].title).toBe("New");
    });
  });
});
