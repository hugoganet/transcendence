import type { StreakStatus } from "@transcendence/shared";

interface StreakWidgetProps {
  streak: StreakStatus;
  compact?: boolean;
}

export function StreakWidget({ streak, compact = false }: StreakWidgetProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-1 text-sm" title="Current streak">
        <svg
          className={`h-4 w-4 ${streak.currentStreak > 0 ? "text-orange-500" : "text-gray-300"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
            clipRule="evenodd"
          />
        </svg>
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
        <svg
          className={`h-6 w-6 ${streak.currentStreak > 0 ? "text-orange-500" : "text-gray-300"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z"
            clipRule="evenodd"
          />
        </svg>
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
