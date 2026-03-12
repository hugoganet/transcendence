import { checkReengagement } from "../services/engagementService.js";
import type { IO, AppSocket } from "./index.js";

export async function handleEngagementConnect(io: IO, socket: AppSocket): Promise<void> {
  const userId = socket.data.userId;
  if (!userId) return;

  await checkReengagement(io, userId);
}
