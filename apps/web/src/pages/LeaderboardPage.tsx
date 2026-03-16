import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
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
      setError("Failed to load leaderboard");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Leaderboard — Transcendence";
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
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        Weekly Leaderboard
      </h1>

      {/* Current user position */}
      {currentUser && currentUser.rank !== null && (
        <Card className="bg-primary/5 border-primary/20">
          <div className="flex items-center gap-4">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              #{currentUser.rank}
            </span>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">
                {currentUser.displayName ?? "You"}
              </p>
              <p className="text-xs text-gray-500">
                {currentUser.missionsCompleted} missions this week
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Leaderboard table */}
      <Card>
        {entries.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            No entries yet this week. Complete missions to climb the ranks!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {entries.map((entry) => (
              <div
                key={entry.userId}
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
                      : "bg-gray-100 text-gray-500"
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
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-medium text-gray-500">
                      {(entry.displayName ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="truncate text-sm font-medium text-gray-900">
                    {entry.displayName ?? "Anonymous"}
                  </span>
                </Link>
                <span className="text-sm font-medium text-gray-600">
                  {entry.missionsCompleted}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-2 border-t border-gray-100 pt-4">
            <Button
              variant="ghost"
              disabled={currentPage <= 1 || isLoading}
              onClick={() => loadPage(currentPage - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-500">
              {currentPage} / {totalPages}
            </span>
            <Button
              variant="ghost"
              disabled={currentPage >= totalPages || isLoading}
              onClick={() => loadPage(currentPage + 1)}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
