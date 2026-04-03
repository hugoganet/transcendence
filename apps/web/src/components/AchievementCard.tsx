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
          ? "border-amber-200 bg-amber-50/50"
          : "border-gray-200 bg-gray-50 opacity-60"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg ${
            isEarned ? "bg-amber-100" : "bg-gray-200"
          }`}
        >
          {isEarned ? (
            <Award className="h-5 w-5 text-amber-600" />
          ) : (
            <Lock className="h-5 w-5 text-gray-400" />
          )}
        </div>
        <div className="min-w-0">
          <h3
            className={`text-sm font-semibold ${isEarned ? "text-gray-900" : "text-gray-500"}`}
          >
            {achievement.title}
          </h3>
          <p className="mt-0.5 text-xs text-gray-500">
            {achievement.description}
          </p>
          {isEarned && achievement.earnedAt && (
            <p className="mt-1 text-xs text-amber-600">
              {t("labels.earnedDate")}{" "}
              {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
