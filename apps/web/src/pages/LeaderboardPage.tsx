import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  LeaderboardEntry,
  LeaderboardCurrentUser,
  PaginationMeta,
} from "@transcendence/shared";
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
    document.title = `${t("gamification.leaderboard.title")} — Transcendence`;
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

      {/* Leaderboard table */}
      <Card>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500 dark:text-warm-200">
            {t("pages.leaderboard.noEntries")}
          </p>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-warm-700">
            {entries.map((entry, i) => (
              <div
                key={entry.userId}
                style={{
                  animation: "stagger-in 0.3s ease-out both",
                  animationDelay: `${i * 40}ms`,
                }}
                className={`flex items-center gap-4 py-3 ${
                  currentUser && entry.userId === currentUser.userId
                    ? "bg-primary/5 -mx-6 px-6 rounded"
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
