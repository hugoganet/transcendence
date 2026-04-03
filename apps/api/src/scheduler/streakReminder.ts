/**
 * @module scheduler/streakReminder
 * @description Periodic scheduler that checks for users at risk of losing
 * their daily streak and sends reminder notifications via Socket.IO.
 * Runs on a fixed interval defined by STREAK_REMINDER_INTERVAL_MS.
 * Best-effort — errors are silently caught to avoid crashing the server.
 */

import { checkStreakReminders } from "../services/engagementService.js";
import { STREAK_REMINDER_INTERVAL_MS } from "@transcendence/shared";
import type { IO } from "../socket/index.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

/** Starts the streak reminder check loop. Idempotent — safe to call multiple times. */
export function startStreakReminderScheduler(io: IO): void {
  if (intervalId) return;

  intervalId = setInterval(() => {
    checkStreakReminders(io).catch(() => {
      // Best-effort — scheduler errors should not crash the server
    });
  }, STREAK_REMINDER_INTERVAL_MS);
}

/** Stops the streak reminder scheduler. Called during graceful shutdown. */
export function stopStreakReminderScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
