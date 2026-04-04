/**
 * @file Streak Reminder Scheduler — periodic check for users at risk of losing their streak.
 * FR: Planificateur de rappel de serie — verification periodique des utilisateurs risquant de perdre leur serie.
 */
import { checkStreakReminders } from "../services/engagementService.js";
import { STREAK_REMINDER_INTERVAL_MS } from "@transcendence/shared";
import type { IO } from "../socket/index.js";

let intervalId: ReturnType<typeof setInterval> | null = null;

/**
 * Starts the interval that periodically checks for streak reminders.
 * FR: Demarre l'intervalle qui verifie periodiquement les rappels de serie.
 */
export function startStreakReminderScheduler(io: IO): void {
  if (intervalId) return;

  intervalId = setInterval(() => {
    checkStreakReminders(io).catch(() => {
      // Best-effort — scheduler errors should not crash the server
    });
  }, STREAK_REMINDER_INTERVAL_MS);
}

/**
 * Stops the streak reminder scheduler interval.
 * FR: Arrete l'intervalle du planificateur de rappel de serie.
 */
export function stopStreakReminderScheduler(): void {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
}
