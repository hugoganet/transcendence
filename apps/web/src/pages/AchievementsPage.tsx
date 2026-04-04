/**
 * @file AchievementsPage — displays all user achievements with unlock status and ranks.
 * FR: Page Succès — affiche tous les succès utilisateur avec statut et rangs.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AchievementStatus } from "@transcendence/shared";
import { gamificationApi } from "../api/gamification.js";
import { AchievementCard, type AchievementRank } from "../components/AchievementCard.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

function getRank(index: number): AchievementRank {
  if (index < 2) return "legendary";
  if (index < 5) return "epic";
  if (index < 10) return "rare";
  return "common";
}

export function AchievementsPage() {
  const { t } = useTranslation();
  const [achievements, setAchievements] = useState<AchievementStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `${t("pages.achievements.title")} — Unblock.chain`;
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
          setError(t("pages.achievements.loadError"));
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
        <h1 className="text-2xl font-bold text-[var(--color-text)] font-heading">
          {t("pages.achievements.title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          {t("pages.achievements.earnedCount", { earned: earned.length, total: achievements.length })}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {achievements.map((achievement, i) => (
          <div
            key={achievement.id}
            style={{
              animation: "stagger-in 0.4s ease-out both",
              animationDelay: `${i * 60}ms`,
            }}
          >
            <AchievementCard achievement={achievement} rank={getRank(i)} />
          </div>
        ))}
      </div>
    </div>
  );
}
