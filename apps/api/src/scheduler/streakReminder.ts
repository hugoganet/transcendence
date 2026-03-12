import { checkStreakReminders } from "../services/engagementService.js";
import { STREAK_REMINDER_INTERVAL_MS } from "@transcendence/shared";
import type { IO } from "../socket/index.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

export function startStreakReminderScheduler(io: IO): void {
  if (intervalId) return;

  intervalId = setInterval(() => {
    checkStreakReminders(io).catch(() => {
      // Best-effort — scheduler errors should not crash the server
    });
  }, STREAK_REMINDER_INTERVAL_MS);
}

export function stopStreakReminderScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
