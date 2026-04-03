import type { AchievementStatus } from "@transcendence/shared";
import { Award, Lock } from "lucide-react";
import { useTranslation } from "react-i18next";

interface AchievementCardProps {
  achievement: AchievementStatus;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
  const { t } = useTranslation();
  const isEarned = achievement.earnedAt !== null;

  return (
    <div
      className={`rounded-lg border p-4 transition-colors ${
        isEarned
          ? "border-amber-200 bg-amber-50/50 dark:border-amber-700/30 dark:bg-amber-900/20"
          : "border-gray-200 bg-gray-50 opacity-60 dark:border-warm-700 dark:bg-warm-800"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
            isEarned ? "bg-amber-100 dark:bg-amber-900/40" : "bg-gray-200 dark:bg-warm-700"
          }`}
        >
          {isEarned ? (
            <>
              <Award className="h-5 w-5 text-amber-600" />
              {isEarned && (
                <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
                </span>
              )}
            </>
          ) : (
            <Lock className="h-5 w-5 text-gray-400 dark:text-warm-500" />
          )}
        </div>
        <div className="min-w-0">
          <h3
            className={`text-sm font-semibold ${isEarned ? "text-gray-900 dark:text-warm-50" : "text-gray-500 dark:text-warm-500"}`}
          >
            {achievement.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-warm-400">
            {achievement.description}
          </p>
          {isEarned && achievement.earnedAt && (
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-400">
              {t("labels.earnedDate")}{" "}
              {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
