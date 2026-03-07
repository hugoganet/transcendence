import type { Server as HttpServer } from "node:http";
import type { RequestHandler } from "express";
import { Server } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";

// Augment IncomingMessage to include session from express-session
declare module "node:http" {
  interface IncomingMessage {
    session?: import("express-session").Session & Partial<import("express-session").SessionData>;
  }
}

// Socket.IO typed event interfaces
export interface ServerToClientEvents {
  "notification:push": (payload: unknown) => void;
  "presence:online": (userId: string) => void;
  "presence:offline": (userId: string) => void;
}

export interface ClientToServerEvents {}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
}

export function createSocketServer(
  httpServer: HttpServer,
  sessionMw: RequestHandler,
): Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData> {
  const io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: process.env.FRONTEND_URL ?? "http://localhost:5173",
        credentials: true,
      },
    },
  );

  // Configure Redis adapter using ioredis pub/sub clients
  const pubClient = new Redis(process.env.REDIS_URL ?? "redis://localhost:6379");
  const subClient = pubClient.duplicate();
  io.adapter(createAdapter(pubClient, subClient));

  // Share session middleware with Socket.IO engine (runs on HTTP upgrade handshake)
  io.engine.use(sessionMw);

  // Handle connections
  io.on("connection", (socket) => {
    const req = socket.request;
    const userId = req.session?.userId;

    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;
    console.log(`Socket connected: user ${userId}`);

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: user ${userId}`);
    });
  });

  return io;
}
