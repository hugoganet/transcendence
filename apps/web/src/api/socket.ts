import { io, type Socket } from "socket.io-client";
import type { NotificationPushPayload } from "@transcendence/shared";

interface ServerToClientEvents {
  "notification:push": (payload: NotificationPushPayload) => void;
  "presence:online": (userId: string) => void;
  "presence:offline": (userId: string) => void;
}

type AppSocket = Socket<ServerToClientEvents>;

let socket: AppSocket | null = null;

export function connectSocket(): AppSocket {
  if (socket?.connected) return socket;

  socket = io({
    withCredentials: true,
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10,
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function getSocket(): AppSocket | null {
  return socket;
}
