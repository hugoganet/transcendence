import { describe, it, expect, vi, afterEach } from "vitest";
import { createServer } from "node:http";
import { type AddressInfo } from "node:net";
import express from "express";
import { io as ioc } from "socket.io-client";

// Mock ioredis — must be a constructor class
const mockDuplicate = vi.fn();
vi.mock("ioredis", () => {
  const MockRedis = vi.fn(function (this: { duplicate: typeof mockDuplicate }) {
    this.duplicate = mockDuplicate.mockReturnValue(this);
  });
  return { default: MockRedis };
});

// Mock @socket.io/redis-adapter with a functional in-memory adapter
// Must implement addAll/del/delAll/broadcast that Socket.IO calls internally
vi.mock("@socket.io/redis-adapter", () => ({
  createAdapter: vi.fn(() => {
    return class MockAdapter {
      rooms: Map<string, Set<string>> = new Map();
      sids: Map<string, Set<string>> = new Map();
      nsp: unknown;
      constructor(nsp: unknown) {
        this.nsp = nsp;
      }
      init() {}
      close() {}
      addAll(id: string, rooms: Set<string>) {
        for (const room of rooms) {
          if (!this.rooms.has(room)) this.rooms.set(room, new Set());
          this.rooms.get(room)!.add(id);
        }
        if (!this.sids.has(id)) this.sids.set(id, new Set());
        for (const room of rooms) this.sids.get(id)!.add(room);
      }
      del(id: string, room: string) {
        this.rooms.get(room)?.delete(id);
        this.sids.get(id)?.delete(room);
      }
      delAll(id: string) {
        const rooms = this.sids.get(id);
        if (rooms) {
          for (const room of rooms) this.rooms.get(room)?.delete(id);
          this.sids.delete(id);
        }
      }
      broadcast() {}
      serverCount() { return Promise.resolve(1); }
      fetchSockets() { return Promise.resolve([]); }
    };
  }),
}));

const { createSocketServer } = await import("./index.js");

describe("createSocketServer", () => {
  const mockSessionMw = vi.fn((_req: unknown, _res: unknown, next: () => void) => next());

  it("returns a Socket.IO server instance", () => {
    const app = express();
    const httpServer = createServer(app);
    const io = createSocketServer(httpServer, mockSessionMw as never);

    expect(io).toBeDefined();
    expect(typeof io.on).toBe("function");
    expect(typeof io.emit).toBe("function");

    io.close();
  });

  it("configures Redis adapter with pub/sub clients", async () => {
    const app = express();
    const httpServer = createServer(app);
    const io = createSocketServer(httpServer, mockSessionMw as never);

    const { createAdapter } = await import("@socket.io/redis-adapter");
    expect(createAdapter).toHaveBeenCalled();
    expect(mockDuplicate).toHaveBeenCalled();

    io.close();
  });

  it("registers session middleware on engine", () => {
    const app = express();
    const httpServer = createServer(app);
    const io = createSocketServer(httpServer, mockSessionMw as never);

    expect(io.engine).toBeDefined();

    io.close();
  });

  it("registers connection handler that rejects unauthenticated sockets", () => {
    const app = express();
    const httpServer = createServer(app);
    const io = createSocketServer(httpServer, mockSessionMw as never);

    expect(io.listenerCount("connection")).toBe(1);

    io.close();
  });

  describe("connection auth behavior", () => {
    let httpServer: ReturnType<typeof createServer>;
    let io: ReturnType<typeof createSocketServer>;

    afterEach(async () => {
      await io?.close();
      httpServer?.close();
    });

    it("disconnects sockets without userId in session", async () => {
      const app = express();
      httpServer = createServer(app);

      // Session middleware that sets NO userId — simulates unauthenticated request
      const noAuthSessionMw = vi.fn((_req: unknown, _res: unknown, next: () => void) => next());
      io = createSocketServer(httpServer, noAuthSessionMw as never);

      await new Promise<void>((resolve) => httpServer.listen(0, resolve));
      const port = (httpServer.address() as AddressInfo).port;

      const client = ioc(`http://localhost:${port}`, { transports: ["websocket"] });

      await new Promise<void>((resolve, reject) => {
        client.on("disconnect", () => resolve());
        client.on("connect_error", () => reject(new Error("connect_error")));
        setTimeout(() => reject(new Error("timeout — socket was not disconnected")), 3000);
      });

      client.close();
    });
  });
});
