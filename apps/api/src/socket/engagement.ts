/**
 * @file Socket Engagement — triggers re-engagement check when a user connects.
 * FR: Socket Engagement — declenche la verification de re-engagement a la connexion d'un utilisateur.
 */
import { checkReengagement } from "../services/engagementService.js";
import type { IO, AppSocket } from "./index.js";

/**
 * Called on socket connect to evaluate and push re-engagement prompts.
 * FR: Appelee a la connexion socket pour evaluer et envoyer les relances de re-engagement.
 */
export async function handleEngagementConnect(io: IO, socket: AppSocket): Promise<void> {
  const userId = socket.data.userId;
  if (!userId) return;

  await checkReengagement(io, userId);
}
