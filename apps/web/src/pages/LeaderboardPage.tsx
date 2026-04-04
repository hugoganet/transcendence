/**
 * @file LeaderboardPage — Leaderboard Page — ranked user standings.
 * FR: Page Classement — classement des utilisateurs.
 */
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  LeaderboardEntry,
  LeaderboardCurrentUser,
  PaginationMeta,
} from "@transcendence/shared";
import { Trophy } from "lucide-react";
import { gamificationApi } from "../api/gamification.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function LeaderboardPage() {
  const { t } = useTranslation();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [currentUser, setCurrentUser] =
    useState<LeaderboardCurrentUser | null>(null);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPage = useCallback(async (page: number) => {
    setIsLoading(true);
    setError("");
    try {
      const data = await gamificationApi.getLeaderboard(page, 20);
      setEntries(data.entries);
      setCurrentUser(data.currentUser);
      setMeta(data.meta);
    } catch {
      setError(t("pages.leaderboard.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    document.title = `${t("gamification.leaderboard.title")} — Unblock.chain`;
    loadPage(1);
  }, [loadPage]);

  if (isLoading && entries.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="error">{error}</Alert>;
  }

  const totalPages = meta ? Math.ceil(meta.total / meta.pageSize) : 1;
  const currentPage = meta?.page ?? 1;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-warm-50 font-heading">
        {t("pages.leaderboard.weeklyTitle")}
      </h1>

      {/* Current user position */}
      {currentUser && currentUser.rank !== null && (
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              #{currentUser.rank}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 dark:text-warm-50">
                {currentUser.displayName ?? t("pages.leaderboard.you")}
              </p>
              <p className="text-xs text-gray-500 dark:text-warm-200">
                {t("pages.leaderboard.missionsThisWeek", { count: currentUser.missionsCompleted })}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Podium top 3 */}
      {entries.length >= 3 && (
        <div className="flex items-end justify-center gap-3">
          {/* 2nd */}
          <div className="flex flex-col items-center" style={{ animation: "stagger-in 0.5s ease-out 0.1s both" }}>
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-200 dark:bg-warm-700 text-sm font-bold text-gray-600 dark:text-warm-200 ring-2 ring-gray-300 dark:ring-warm-600 overflow-hidden">
              {entries[1].avatarUrl ? <img src={entries[1].avatarUrl} alt="" className="h-full w-full object-cover" /> : (entries[1].displayName ?? "?")[0].toUpperCase()}
            </div>
            <span className="mt-1 max-w-[80px] truncate text-xs font-medium text-gray-600 dark:text-warm-200">{entries[1].displayName ?? "Anonymous"}</span>
            <div className="mt-1 flex h-16 w-20 items-center justify-center rounded-t-lg bg-gray-100 dark:bg-warm-700">
              <span className="text-lg font-bold text-gray-500 dark:text-warm-300">2</span>
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center" style={{ animation: "stagger-in 0.5s ease-out both" }}>
            <Trophy className="mb-1 h-6 w-6 text-amber-500" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-sm font-bold text-amber-700 dark:text-amber-300 ring-2 ring-amber-400 overflow-hidden">
              {entries[0].avatarUrl ? <img src={entries[0].avatarUrl} alt="" className="h-full w-full object-cover" /> : (entries[0].displayName ?? "?")[0].toUpperCase()}
            </div>
            <span className="mt-1 max-w-[80px] truncate text-xs font-semibold text-gray-900 dark:text-warm-50">{entries[0].displayName ?? "Anonymous"}</span>
            <div className="mt-1 flex h-24 w-20 items-center justify-center rounded-t-lg bg-gradient-to-b from-amber-100 to-amber-200 dark:from-amber-900/30 dark:to-amber-800/30">
              <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">1</span>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center" style={{ animation: "stagger-in 0.5s ease-out 0.2s both" }}>
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30 text-sm font-bold text-orange-600 dark:text-orange-300 ring-2 ring-orange-300 dark:ring-orange-700 overflow-hidden">
              {entries[2].avatarUrl ? <img src={entries[2].avatarUrl} alt="" className="h-full w-full object-cover" /> : (entries[2].displayName ?? "?")[0].toUpperCase()}
            </div>
            <span className="mt-1 max-w-[80px] truncate text-xs font-medium text-gray-600 dark:text-warm-200">{entries[2].displayName ?? "Anonymous"}</span>
            <div className="mt-1 flex h-12 w-20 items-center justify-center rounded-t-lg bg-orange-50 dark:bg-orange-900/20">
              <span className="text-lg font-bold text-orange-500 dark:text-orange-400">3</span>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard table */}
      <Card>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-warm-200">
            {t("pages.leaderboard.noEntries")}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-warm-700">
            {entries.filter(e => e.rank > 3).map((entry, i) => (
              <div
                key={entry.userId}
                style={{
                  animation: "stagger-in 0.3s ease-out both",
                  animationDelay: `${i * 40}ms`,
                }}
                className={`flex items-center gap-4 py-3 ${
                  currentUser && entry.userId === currentUser.userId
                    ? "bg-primary/5 rounded"
                    : ""
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    entry.rank <= 3
                      ? "bg-secondary/20 text-secondary"
                      : "bg-gray-100 dark:bg-warm-700 text-gray-500 dark:text-warm-200"
                  }`}
                >
                  {entry.rank}
                </span>
                <Link
                  to={`/users/${entry.userId}`}
                  className="flex flex-1 items-center gap-3 min-w-0"
                >
                  {entry.avatarUrl ? (
                    <img
                      src={entry.avatarUrl}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 dark:bg-warm-700 text-xs font-medium text-gray-500 dark:text-warm-200">
                      {(entry.displayName ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="truncate text-sm font-medium text-gray-900 dark:text-warm-50">
                    {entry.displayName ?? t("pages.leaderboard.anonymous")}
                  </span>
                </Link>
                <span className="text-sm font-medium text-gray-600 dark:text-warm-200">
                  {entry.missionsCompleted}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-gray-100 dark:border-warm-700 pt-4">
            <Button
              variant="ghost"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => loadPage(currentPage - 1)}
            >
              {t("labels.previous")}
            </Button>
            <span className="text-sm text-gray-500 dark:text-warm-200">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => loadPage(currentPage + 1)}
            >
              {t("labels.next")}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
