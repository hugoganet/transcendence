import type { Server, Socket } from "socket.io";
import { redisClient } from "../config/redis.js";
import { prisma } from "../config/database.js";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./index.js";

export const ONLINE_USERS_KEY = "online-users";
const DISCONNECT_DEBOUNCE_MS = 5000;

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const disconnectTimers = new Map<string, NodeJS.Timeout>();

export async function getAcceptedFriendIds(userId: string): Promise<string[]> {
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "ACCEPTED",
      OR: [{ requesterId: userId }, { addresseeId: userId }],
    },
    select: { requesterId: true, addresseeId: true },
  });

  return friendships.map((f) =>
    f.requesterId === userId ? f.addresseeId : f.requesterId,
  );
}

export async function handleUserConnect(io: IO, socket: AppSocket): Promise<void> {
  const userId = socket.data.userId;
  if (!userId) return;
  socket.join(`user:${userId}`);

  // Clear any pending disconnect debounce timer
  if (disconnectTimers.has(userId)) {
    clearTimeout(disconnectTimers.get(userId)!);
    disconnectTimers.delete(userId);
  }

  try {
    // sadd returns 1 if added (new), 0 if already existed — atomic, no TOCTOU race
    const added = await redisClient.sadd(ONLINE_USERS_KEY, userId);
    if (added) {
      const friendIds = await getAcceptedFriendIds(userId);
      for (const friendId of friendIds) {
        io.to(`user:${friendId}`).emit("presence:online", userId);
      }
    }
  } catch {
    // Redis unavailable — presence is best-effort, don't crash the socket server
  }
}

export async function handleUserDisconnect(io: IO, socket: AppSocket): Promise<void> {
  const userId = socket.data.userId;
  if (!userId) return;

  // Clear any existing timer for this user to prevent orphaned timers (e.g., two tabs closing in succession)
  if (disconnectTimers.has(userId)) {
    clearTimeout(disconnectTimers.get(userId)!);
  }

  const timer = setTimeout(async () => {
    try {
      const sockets = await io.in(`user:${userId}`).fetchSockets();
      if (sockets.length === 0) {
        await redisClient.srem(ONLINE_USERS_KEY, userId);
        const friendIds = await getAcceptedFriendIds(userId);
        for (const friendId of friendIds) {
          io.to(`user:${friendId}`).emit("presence:offline", userId);
        }
      }
    } catch {
      // Redis unavailable — best-effort cleanup
    }
    disconnectTimers.delete(userId);
  }, DISCONNECT_DEBOUNCE_MS);

  disconnectTimers.set(userId, timer);
}

export function clearAllDisconnectTimers(): void {
  for (const timer of disconnectTimers.values()) {
    clearTimeout(timer);
  }
  disconnectTimers.clear();
}
