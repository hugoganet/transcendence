import { checkAllReengagements } from "../services/engagementService.js";
import { REENGAGEMENT_CHECK_INTERVAL_MS } from "@transcendence/shared";
import type { IO } from "../socket/index.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startReengagementScheduler(io: IO): void {
  if (intervalId) return;

  intervalId = setInterval(() => {
    checkAllReengagements(io).catch(() => {
      // Best-effort — scheduler errors should not crash the server
    });
  }, REENGAGEMENT_CHECK_INTERVAL_MS);
}

export function stopReengagementScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
