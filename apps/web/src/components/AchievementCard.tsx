import type { AchievementStatus } from "@transcendence/shared";

interface AchievementCardProps {
  achievement: AchievementStatus;
}

export function AchievementCard({ achievement }: AchievementCardProps) {
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
            <svg
              className="h-5 w-5 text-amber-600"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 013 3v1a1 1 0 102 0v-1a5 5 0 00-5-5H8.414l1.293-1.293z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              className="h-5 w-5 text-gray-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                clipRule="evenodd"
              />
            </svg>
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
              Earned{" "}
              {new Date(achievement.earnedAt).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
