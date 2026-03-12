import type { Server as HttpServer } from "node:http";
import type { RequestHandler } from "express";
import { Server, type Socket } from "socket.io";
import Redis from "ioredis";
import { createAdapter } from "@socket.io/redis-adapter";
import { handleUserConnect, handleUserDisconnect } from "./presence.js";
import { handleNotificationConnect } from "./notifications.js";
import { handleEngagementConnect } from "./engagement.js";
import type { NotificationPushPayload } from "@transcendence/shared";

// Augment IncomingMessage to include session from express-session
declare module "node:http" {
  interface IncomingMessage {
    session?: import("express-session").Session & Partial<import("express-session").SessionData>;
  }
}

// Socket.IO typed event interfaces
export interface ServerToClientEvents {
  "notification:push": (payload: NotificationPushPayload) => void;
  "presence:online": (userId: string) => void;
  "presence:offline": (userId: string) => void;
}

export interface ClientToServerEvents {}

export interface InterServerEvents {}

export interface SocketData {
  userId: string;
}

export type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export function createSocketServer(
  httpServer: HttpServer,
  sessionMw: RequestHandler,
): IO {
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

  // Share session middleware with Socket.IO (runs on each connection handshake)
  io.use((socket, next) => {
    sessionMw(socket.request as Parameters<typeof sessionMw>[0], {} as Parameters<typeof sessionMw>[1], next as Parameters<typeof sessionMw>[2]);
  });

  // Handle connections
  io.on("connection", (socket) => {
    const req = socket.request;
    // Passport stores serialized user ID in session.passport.user
    const passport = (req.session as Record<string, unknown> | undefined)?.passport as { user?: string } | undefined;
    const userId = passport?.user;

    if (!userId) {
      socket.disconnect();
      return;
    }

    socket.data.userId = userId;

    handleUserConnect(io, socket).catch(() => {
      // Presence is best-effort — don't crash on connect errors
    });

    handleNotificationConnect(io, socket).catch(() => {
      // Notifications are best-effort — don't crash on connect errors
    });

    handleEngagementConnect(io, socket).catch(() => {
      // Engagement checks are best-effort — don't crash on connect errors
    });

    socket.on("disconnect", () => {
      handleUserDisconnect(io, socket).catch(() => {
        // Presence is best-effort — don't crash on disconnect errors
      });
    });
  });

  return io;
}
