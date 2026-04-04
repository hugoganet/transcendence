/**
 * @file AchievementCard — displays an achievement with rank-based styling and unlock status.
 * FR: AchievementCard — affiche un succès avec un style basé sur la rareté et le statut de déblocage.
 */
import type { AchievementStatus } from "@transcendence/shared";
import { Award, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

export type AchievementRank = "legendary" | "epic" | "rare" | "common";

const rankStyles: Record<AchievementRank, { border: string; bg: string; icon: string; badge: string; ping: string }> = {
  legendary: {
    border: "border-purple-300 dark:border-purple-700/50",
    bg: "bg-gradient-to-br from-purple-50 to-amber-50 dark:from-purple-900/20 dark:to-amber-900/20",
    icon: "bg-purple-100 dark:bg-purple-900/40",
    badge: "text-purple-600 dark:text-purple-400",
    ping: "bg-purple-400",
  },
  epic: {
    border: "border-blue-300 dark:border-blue-700/50",
    bg: "bg-gradient-to-br from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20",
    icon: "bg-blue-100 dark:bg-blue-900/40",
    badge: "text-blue-600 dark:text-blue-400",
    ping: "bg-blue-400",
  },
  rare: {
    border: "border-amber-300 dark:border-amber-700/50",
    bg: "bg-amber-50/50 dark:bg-amber-900/20",
    icon: "bg-amber-100 dark:bg-amber-900/40",
    badge: "text-amber-600 dark:text-amber-400",
    ping: "bg-amber-400",
  },
  common: {
    border: "border-[var(--color-border)]",
    bg: "bg-[var(--color-surface)]",
    icon: "bg-[var(--color-border)]",
    badge: "text-gray-500 dark:text-warm-300",
    ping: "bg-gray-400",
  },
};

/** Props for AchievementCard. / FR: Props pour AchievementCard. */
interface AchievementCardProps {
  achievement: AchievementStatus;
  rank?: AchievementRank;
}

/**
 * Displays a card with achievement details, rank badge, and unlock status.
 * FR: Affiche une carte avec les détails du succès, le badge de rareté et le statut de déblocage.
 */
export function AchievementCard({ achievement, rank = "common" }: AchievementCardProps) {
  const { t } = useTranslation();
  const isEarned = achievement.earnedAt !== null;
  const style = isEarned ? rankStyles[rank] : rankStyles.common;

  return (
    <div
      className={`relative rounded-lg border p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        isEarned
          ? `${style.border} ${style.bg}`
          : "border-gray-200 bg-gray-50 opacity-60 dark:border-warm-700 dark:bg-warm-800"
      }`}
    >
      {isEarned && rank !== "common" && (
        <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${style.badge} bg-white/80 dark:bg-warm-900/80`}>
          {rank}
        </span>
      )}
      <div className="flex items-start gap-3">
        <div
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
            isEarned ? style.icon : "bg-[var(--color-border)]"
          }`}
        >
          {isEarned ? (
            <>
              <Award className={`h-5 w-5 ${style.badge}`} />
              <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${style.ping} opacity-75`} />
                <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${style.ping}`} />
              </span>
            </>
          ) : (
            <Lock className="h-5 w-5 text-gray-400 dark:text-warm-200" />
          )}
        </div>
        <div className="min-w-0">
          <h3
            className={`text-sm font-semibold ${isEarned ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)]"}`}
          >
            {achievement.title}
          </h3>
          <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
            {achievement.description}
          </p>
          {isEarned && achievement.earnedAt && (
            <p className={`mt-1 text-xs ${style.badge}`}>
              {t("labels.earnedDate")}{" "}
              {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
