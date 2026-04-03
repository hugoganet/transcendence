/**
 * @file StreakWidget — displays the user's current learning streak with flame icon.
 * FR: StreakWidget — affiche la série d'apprentissage en cours de l'utilisateur avec une icône flamme.
 */
import type { StreakStatus } from "@transcendence/shared";
import { Flame } from "lucide-react";
import { useTranslation } from "react-i18next";
import { AnimatedCounter } from "./AnimatedCounter.js";

/** Props for StreakWidget. / FR: Props pour StreakWidget. */
interface StreakWidgetProps {
  streak: StreakStatus;
  compact?: boolean;
}

/**
 * Shows the current streak count, best streak, and stats in compact or full mode.
 * FR: Affiche le nombre de jours consécutifs, le meilleur record et les stats en mode compact ou complet.
 */
export function StreakWidget({ streak, compact = false }: StreakWidgetProps) {
  const { t } = useTranslation();

  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm" title={t("labels.currentStreak")}>
        <Flame
          className={`h-4 w-4 ${streak.currentStreak > 0 ? "text-orange-500 animate-pulse-glow" : "text-gray-300"}`}
        />
        <span
          className={`font-medium ${streak.currentStreak > 0 ? "text-orange-600 dark:text-orange-400" : "text-gray-400 dark:text-warm-200"}`}
        >
          {streak.currentStreak}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white dark:border-warm-700 dark:bg-warm-800 p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
        <Flame
          className={`h-6 w-6 ${streak.currentStreak > 0 ? "text-orange-500 animate-pulse-glow" : "text-gray-300"}`}
        />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-warm-50">
            <AnimatedCounter target={streak.currentStreak} duration={1000} />
          </span>
          <span className="text-sm text-gray-500 dark:text-warm-200">{t("labels.dayStreak")}</span>
        </div>
        <div className="mt-0.5 flex gap-3 text-xs text-gray-400 dark:text-warm-200">
          <span>{t("labels.best")} {streak.longestStreak}</span>
          <span>{streak.totalMissionsCompleted} {t("labels.missions")}</span>
          <span>{streak.totalModulesMastered} {t("labels.modules")}</span>
        </div>
      </div>
    </div>
  );
}
