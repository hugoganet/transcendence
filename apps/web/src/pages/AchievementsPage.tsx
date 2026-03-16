import { useEffect, useState } from "react";
import type { AchievementStatus } from "@transcendence/shared";
import { gamificationApi } from "../api/gamification.js";
import { AchievementCard } from "../components/AchievementCard.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Achievements — Transcendence";
    let cancelled = false;
    gamificationApi.getAchievements().then(
      (data) => {
        if (!cancelled) {
          setAchievements(data);
          setIsLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError("Failed to load achievements");
          setIsLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  const earned = achievements.filter((a) => a.earnedAt !== null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 font-heading">
          Achievements
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          {earned.length} of {achievements.length} earned
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {achievements.map((achievement) => (
          <AchievementCard key={achievement.id} achievement={achievement} />
        ))}
      </div>
    </div>
  );
}
