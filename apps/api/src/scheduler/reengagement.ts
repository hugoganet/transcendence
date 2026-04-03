/**
 * @module scheduler/reengagement
 * @description Periodic scheduler that checks for inactive users and sends
 * re-engagement notifications via Socket.IO. Runs on a fixed interval
 * defined by REENGAGEMENT_CHECK_INTERVAL_MS. Best-effort — errors are
 * silently caught to avoid crashing the server.
 */

import { checkAllReengagements } from "../services/engagementService.js";
import { REENGAGEMENT_CHECK_INTERVAL_MS } from "@transcendence/shared";
import type { IO } from "../socket/index.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

/** Starts the re-engagement check loop. Idempotent — safe to call multiple times. */
export function startReengagementScheduler(io: IO): void {
  if (intervalId) return;

  intervalId = setInterval(() => {
    checkAllReengagements(io).catch(() => {
      // Best-effort — scheduler errors should not crash the server
    });
  }, REENGAGEMENT_CHECK_INTERVAL_MS);
}

/** Stops the re-engagement scheduler. Called during graceful shutdown. */
export function stopReengagementScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
