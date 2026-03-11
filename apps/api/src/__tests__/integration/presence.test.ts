import { describe, it, expect, beforeAll, beforeEach, afterEach, afterAll } from "vitest";
import { createServer, type Server as HttpServer } from "node:http";
import type { AddressInfo } from "node:net";
import { io as ioc, type Socket as ClientSocket } from "socket.io-client";
import supertest from "supertest";
import { app } from "./helpers/app.js";
import { setupApp } from "./helpers/app.js";
import { resetDatabase } from "./helpers/db.js";
import { sessionMiddleware } from "../../config/session.js";
import { createSocketServer } from "../../socket/index.js";
import { redisClient } from "../../config/redis.js";
import { clearAllDisconnectTimers, ONLINE_USERS_KEY } from "../../socket/presence.js";

const DEBOUNCE_MS = 5000;

let httpServer: HttpServer;
let ioServer: ReturnType<typeof createSocketServer>;
let port: number;

interface TestUser {
  id: string;
  cookie: string;
}

/** Register + login a user, capturing the raw Set-Cookie header. */
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

  // Extract connect.sid from Set-Cookie header
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

/** Create a Socket.IO client connected with the given session cookie. */
function createSocketClient(cookie: string): ClientSocket {
  return ioc(`http://localhost:${port}`, {
    transports: ["websocket"],
    extraHeaders: { cookie },
  });
}

/** Wait for a specific event on a socket with timeout. */
function waitForEvent<T>(socket: ClientSocket, event: string, timeoutMs = 10_000): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timeout waiting for ${event}`)), timeoutMs);
    socket.once(event, (data: T) => {
      clearTimeout(timer);
      resolve(data);
    });
  });
}

/** Helper to make friends between two users. */
async function makeFriends(user1Cookie: string, user2Cookie: string, user1Id: string, user2Id: string) {
  const agent1 = supertest.agent(app);
  const agent2 = supertest.agent(app);

  // Use cookies from login
  await agent1.post(`/api/v1/friends/${user2Id}`)
    .set("Cookie", user1Cookie)
    .expect(201);
  await agent2.post(`/api/v1/friends/${user1Id}/accept`)
    .set("Cookie", user2Cookie)
    .expect(200);
}

beforeAll(async () => {
  await setupApp();

  // Create a real HTTP server + Socket.IO for integration testing
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

describe("Presence Integration", () => {
  let user1: TestUser;
  let user2: TestUser;
  const clients: ClientSocket[] = [];

  beforeEach(async () => {
    await resetDatabase();
    await redisClient.del(ONLINE_USERS_KEY);

    user1 = await createUserWithCookie("presence1@example.com");
    user2 = await createUserWithCookie("presence2@example.com");

    await makeFriends(user1.cookie, user2.cookie, user1.id, user2.id);
  });

  afterEach(async () => {
    clearAllDisconnectTimers();
    for (const client of clients) {
      if (client.connected) client.disconnect();
    }
    clients.length = 0;
    await redisClient.del(ONLINE_USERS_KEY);
  });

  it("AC #1: user connects → friend receives presence:online", async () => {
    const client2 = createSocketClient(user2.cookie);
    clients.push(client2);
    await waitForEvent(client2, "connect");

    // Now connect user1 — user2 should receive presence:online
    const onlinePromise = waitForEvent<string>(client2, "presence:online");

    const client1 = createSocketClient(user1.cookie);
    clients.push(client1);

    const receivedUserId = await onlinePromise;
    expect(receivedUserId).toBe(user1.id);

    // Verify user1 is in Redis SET
    const isOnline = await redisClient.sismember(ONLINE_USERS_KEY, user1.id);
    expect(isOnline).toBe(1);
  });

  it("AC #2: user disconnects → friend receives presence:offline after debounce", async () => {
    const client2 = createSocketClient(user2.cookie);
    clients.push(client2);
    await waitForEvent(client2, "connect");

    const client1 = createSocketClient(user1.cookie);
    clients.push(client1);
    await waitForEvent<string>(client2, "presence:online");

    // Now disconnect user1
    const offlinePromise = waitForEvent<string>(client2, "presence:offline", DEBOUNCE_MS + 5000);
    client1.disconnect();

    const receivedUserId = await offlinePromise;
    expect(receivedUserId).toBe(user1.id);

    // Verify user1 is removed from Redis SET
    const isOnline = await redisClient.sismember(ONLINE_USERS_KEY, user1.id);
    expect(isOnline).toBe(0);
  });

  it("AC #3: multi-tab — one tab disconnects, no offline sent", async () => {
    const client2 = createSocketClient(user2.cookie);
    clients.push(client2);
    await waitForEvent(client2, "connect");

    // User1 opens two connections
    const client1a = createSocketClient(user1.cookie);
    clients.push(client1a);
    await waitForEvent<string>(client2, "presence:online");

    const client1b = createSocketClient(user1.cookie);
    clients.push(client1b);
    await waitForEvent(client1b, "connect");

    let offlineReceived = false;
    client2.on("presence:offline", () => { offlineReceived = true; });

    // Close one tab
    client1a.disconnect();

    // Wait past debounce + buffer
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS + 1000));

    expect(offlineReceived).toBe(false);

    const isOnline = await redisClient.sismember(ONLINE_USERS_KEY, user1.id);
    expect(isOnline).toBe(1);
  });

  it("AC #4: all multi-tabs disconnect → single presence:offline after debounce", async () => {
    const client2 = createSocketClient(user2.cookie);
    clients.push(client2);
    await waitForEvent(client2, "connect");

    // User1 opens two connections
    const client1a = createSocketClient(user1.cookie);
    clients.push(client1a);
    await waitForEvent<string>(client2, "presence:online");

    const client1b = createSocketClient(user1.cookie);
    clients.push(client1b);
    await waitForEvent(client1b, "connect");

    // Track offline events
    let offlineCount = 0;
    client2.on("presence:offline", () => { offlineCount++; });

    // Disconnect BOTH tabs
    client1a.disconnect();
    client1b.disconnect();

    // Wait past debounce + buffer
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS + 2000));

    // Should receive exactly one offline event
    expect(offlineCount).toBe(1);

    const isOnline = await redisClient.sismember(ONLINE_USERS_KEY, user1.id);
    expect(isOnline).toBe(0);
  });

  it("AC #5: GET /friends returns accurate online status", async () => {
    // Before connecting: online should be false
    const resBefore = await supertest(app)
      .get("/api/v1/friends")
      .set("Cookie", user2.cookie)
      .expect(200);
    const friendBefore = resBefore.body.data.find((f: { id: string }) => f.id === user1.id);
    expect(friendBefore.online).toBe(false);

    // Connect user1
    const client1 = createSocketClient(user1.cookie);
    clients.push(client1);
    await waitForEvent(client1, "connect");
    await new Promise((resolve) => setTimeout(resolve, 200));

    // After connecting: online should be true
    const resAfter = await supertest(app)
      .get("/api/v1/friends")
      .set("Cookie", user2.cookie)
      .expect(200);
    const friendAfter = resAfter.body.data.find((f: { id: string }) => f.id === user1.id);
    expect(friendAfter.online).toBe(true);
  });

  it("AC #7: reconnect within debounce — no offline emitted", async () => {
    const client2 = createSocketClient(user2.cookie);
    clients.push(client2);
    await waitForEvent(client2, "connect");

    const client1 = createSocketClient(user1.cookie);
    clients.push(client1);
    await waitForEvent<string>(client2, "presence:online");

    let offlineReceived = false;
    client2.on("presence:offline", () => { offlineReceived = true; });

    // Disconnect user1
    client1.disconnect();

    // Reconnect within debounce window (1 second)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const client1b = createSocketClient(user1.cookie);
    clients.push(client1b);
    await waitForEvent(client1b, "connect");

    // Wait past the original debounce window
    await new Promise((resolve) => setTimeout(resolve, DEBOUNCE_MS + 1000));

    expect(offlineReceived).toBe(false);

    const isOnline = await redisClient.sismember(ONLINE_USERS_KEY, user1.id);
    expect(isOnline).toBe(1);
  });
});
