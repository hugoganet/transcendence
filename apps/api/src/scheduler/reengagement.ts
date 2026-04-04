/**
 * @file Reengagement Scheduler — periodic check for inactive users needing a nudge.
 * FR: Planificateur de re-engagement — verification periodique des utilisateurs inactifs a relancer.
 */
import { checkAllReengagements } from "../services/engagementService.js";
import { REENGAGEMENT_CHECK_INTERVAL_MS } from "@transcendence/shared";
import type { IO } from "../socket/index.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the interval that periodically checks all users for re-engagement.
 * FR: Demarre l'intervalle qui verifie periodiquement le re-engagement de tous les utilisateurs.
 */
export function startReengagementScheduler(io: IO): void {
  if (intervalId) return;

  intervalId = setInterval(() => {
    checkAllReengagements(io).catch(() => {
      // Best-effort — scheduler errors should not crash the server
    });
  }, REENGAGEMENT_CHECK_INTERVAL_MS);
}

/**
 * Stops the re-engagement scheduler interval.
 * FR: Arrete l'intervalle du planificateur de re-engagement.
 */
export function stopReengagementScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
