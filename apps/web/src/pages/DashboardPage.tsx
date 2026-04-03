import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useScrollReveal } from "../hooks/useScrollReveal.js";
import type {
  TokenBalance,
  TokenTransaction,
  StreakStatus,
  AchievementStatus,
  LearningChainResponse,
} from "@transcendence/shared";
import { useReveals } from "../contexts/RevealContext.js";
import { tokensApi } from "../api/tokens.js";
import { gamificationApi } from "../api/gamification.js";
import { curriculumApi } from "../api/curriculum.js";
import { TokenBalanceDisplay } from "../components/TokenBalance.js";
import { StreakWidget } from "../components/StreakWidget.js";
import { AchievementCard } from "../components/AchievementCard.js";
import { Card } from "../components/ui/Card.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";

export function DashboardPage() {
  const { t } = useTranslation();
  const { dashboardRevealed } = useReveals();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [transactions, setTransactions] = useState<TokenTransaction[]>([]);
  const [streak, setStreak] = useState<StreakStatus | null>(null);
  const [achievements, setAchievements] = useState<AchievementStatus[]>([]);
  const [chain, setChain] = useState<LearningChainResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const chainRef = useScrollReveal<HTMLDivElement>({ delay: 100 });
  const txRef = useScrollReveal<HTMLDivElement>({ delay: 200 });
  const achRef = useScrollReveal<HTMLDivElement>({ delay: 300 });

  useEffect(() => {
    document.title = `${t("pages.dashboard.title")} — Unblock.chain`;
    let cancelled = false;

    Promise.all([
      tokensApi.getBalance(),
      tokensApi.getHistory(1, 10),
      gamificationApi.getStreak(),
      gamificationApi.getAchievements(),
      curriculumApi.getLearningChain(),
    ]).then(
      ([bal, hist, str, ach, ch]) => {
        if (cancelled) return;
        setBalance(bal);
        setTransactions(hist.transactions);
        setStreak(str);
        setAchievements(ach);
        setChain(ch);
        setIsLoading(false);
      },
      () => {
        if (!cancelled) setIsLoading(false);
      },
    );

    return () => {
      cancelled = true;
    };
  }, [t]);

  if (!dashboardRevealed) {
    return <Navigate to="/home" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const earnedAchievements = achievements.filter((a) => a.earnedAt !== null);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-warm-50 font-heading">
        {t("pages.dashboard.title")}
      </h1>

      {/* Top stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        {balance && <TokenBalanceDisplay balance={balance} />}
        {streak && <StreakWidget streak={streak} />}
      </div>

      {/* Learning chain */}
      {chain && chain.blocks.length > 0 && (
        <div ref={chainRef}><Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-warm-50">
            {t("pages.dashboard.learningChain", { count: chain.totalBlocks })}
          </h2>
          <div className="flex gap-2 overflow-x-auto pb-2">
            {chain.blocks.slice(-20).map((block) => (
              <Link
                key={block.missionId}
                to={`/missions/${block.missionId}`}
                className="flex shrink-0 flex-col items-center rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 hover:border-primary/40"
              >
                <span className="text-xs font-bold text-primary">
                  #{block.index + 1}
                </span>
                <span className="mt-0.5 max-w-[80px] truncate text-xs text-gray-600 dark:text-warm-200">
                  {block.missionTitle}
                </span>
              </Link>
            ))}
          </div>
          {chain.totalBlocks > 20 && (
            <p className="mt-2 text-xs text-gray-400 dark:text-warm-200">
              {t("pages.dashboard.learningChainTruncated", { total: chain.totalBlocks })}
            </p>
          )}
        </Card></div>
      )}

      {/* Token history */}
      {transactions.length > 0 && (
        <div ref={txRef}><Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-warm-50">
            {t("pages.dashboard.recentTransactions")}
          </h2>
          <div className="divide-y divide-gray-100 dark:divide-warm-700">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm text-gray-900 dark:text-warm-50">{tx.description}</p>
                  <p className="text-xs text-gray-400 dark:text-warm-200">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-sm font-medium ${
                    tx.type === "EARN" ? "text-green-600" : "text-red-500"
                  }`}
                >
                  {tx.type === "EARN" ? "+" : ""}
                  {tx.amount}
                </span>
              </div>
            ))}
          </div>
        </Card></div>
      )}

      {/* Achievements */}
      {earnedAchievements.length > 0 && (
        <div ref={achRef}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-warm-50">
              {t("pages.dashboard.achievements", { earned: earnedAchievements.length, total: achievements.length })}
            </h2>
            <Link
              to="/achievements"
              className="text-xs text-primary hover:text-primary/80"
            >
              {t("pages.dashboard.viewAll")}
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {earnedAchievements.slice(0, 4).map((a) => (
              <AchievementCard key={a.id} achievement={a} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
