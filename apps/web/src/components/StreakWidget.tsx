import type { StreakStatus } from "@transcendence/shared";
import { Flame } from "lucide-react";

interface StreakWidgetProps {
  streak: StreakStatus;
  compact?: boolean;
}

export function StreakWidget({ streak, compact = false }: StreakWidgetProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm" title="Current streak">
        <Flame
          className={`h-4 w-4 ${streak.currentStreak > 0 ? "text-orange-500" : "text-gray-300"}`}
        />
        <span
          className={`font-medium ${streak.currentStreak > 0 ? "text-orange-600" : "text-gray-400"}`}
        >
          {streak.currentStreak}
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100">
        <Flame
          className={`h-6 w-6 ${streak.currentStreak > 0 ? "text-orange-500" : "text-gray-300"}`}
        />
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-gray-900">
            {streak.currentStreak}
          </span>
          <span className="text-sm text-gray-500">day streak</span>
        </div>
        <div className="mt-0.5 flex gap-3 text-xs text-gray-400">
          <span>Best: {streak.longestStreak}</span>
          <span>{streak.totalMissionsCompleted} missions</span>
          <span>{streak.totalModulesMastered} modules</span>
        </div>
      </div>
    </div>
  );
}
