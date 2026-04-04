/**
 * @file Socket Notifications — delivers unread notifications on user connect.
 * FR: Socket Notifications — envoie les notifications non lues a la connexion de l'utilisateur.
 */
import type { Server, Socket } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./index.js";
import { getUnreadNotifications } from "../services/notificationService.js";

type IO = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

/**
 * Emits all unread notifications to the newly connected socket.
 * FR: Emet toutes les notifications non lues vers le socket nouvellement connecte.
 */
export async function handleNotificationConnect(io: IO, socket: AppSocket): Promise<void> {
  const userId = socket.data.userId;
  if (!userId) return;

  const unread = await getUnreadNotifications(userId);
  for (const notification of unread) {
    socket.emit("notification:push", {
      id: notification.id,
      type: notification.type,
      title: notification.title,
      body: notification.body,
      data: notification.data,
    });
  }
}
