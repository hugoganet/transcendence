/**
 * @file FriendsPage — Friends Page — manage friend list and requests.
 * FR: Page Amis — gestion de la liste d'amis et des demandes.
 */
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type {
  FriendListEntry,
  FriendRequestEntry,
} from "@transcendence/shared";
import { friendsApi } from "../api/friends.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";
import { ChatBox } from "../components/ChatBox.js";

export function FriendsPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [friends, setFriends] = useState<FriendListEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequestEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [chatWith, setChatWith] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: string; displayName: string | null }[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const [f, r] = await Promise.all([
        friendsApi.getFriends(),
        friendsApi.getPendingRequests(),
      ]);
      setFriends(f);
      setRequests(r);
    } catch {
      setError(t("pages.friends.loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    document.title = `${t("social.friendsList.title")} — Unblock.chain`;
    loadData();
  }, [loadData]);

  const handleAccept = async (userId: string) => {
    await friendsApi.acceptRequest(userId);
    await loadData();
  };

  const handleSearch = async (q: string) => {
    setSearch(q);
    if (!q.trim()) return setSearchResults([]);
    const res = await fetch(`/api/v1/users/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
    const body = await res.json();
    setSearchResults(body.data);
  };

  const handleAddFriend = async (userId: string) => {
    await friendsApi.sendRequest(userId);
    setSearch("");
    setSearchResults([]);
    await loadData();
  };

  const handleRemove = async (userId: string) => {
    await friendsApi.removeFriend(userId);
    setFriends((prev) => prev.filter((f) => f.id !== userId));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-warm-50 font-heading">
        {t("social.friendsList.title")}
      </h1>

      {/* Search */}
      <div className="relative">
        <input
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t("social.friendsList.searchPlaceholder")}
          className="w-full rounded-lg border border-gray-200 dark:border-warm-700 px-3 py-2 text-sm bg-white dark:bg-warm-800 text-gray-900 dark:text-warm-50"
        />
        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 dark:border-warm-700 bg-white dark:bg-warm-800 shadow">
            {searchResults.map((u) => (
              <div key={u.id} className="flex items-center justify-between px-3 py-2 hover:bg-gray-50 dark:hover:bg-warm-700">
                <span className="text-sm text-gray-900 dark:text-warm-50">{u.displayName ?? t("pages.publicProfile.anonymous")}</span>
                <button
                  onClick={() => handleAddFriend(u.id)}
                  className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-300"
                >
                  {t("social.friendsList.addFriend")}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 dark:bg-warm-700 p-1">
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "friends"
              ? "bg-white dark:bg-warm-800 text-gray-900 dark:text-warm-50 shadow-sm"
              : "text-gray-500 dark:text-warm-200 hover:text-gray-700 dark:hover:text-warm-50"
          }`}
        >
          {t("pages.friends.tabFriends", { count: friends.length })}
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "requests"
              ? "bg-white dark:bg-warm-800 text-gray-900 dark:text-warm-50 shadow-sm"
              : "text-gray-500 dark:text-warm-200 hover:text-gray-700 dark:hover:text-warm-50"
          }`}
        >
          {t("pages.friends.tabRequests", { count: requests.length })}
        </button>
      </div>

      {tab === "friends" && (
        <Card>
          {friends.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-warm-200">
              {t("social.friendsList.noFriendsYet")}
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-warm-700">
              {friends.map((friend) => (
                <div
                  key={friend.id}
                  className="flex items-center gap-3 py-3"
                >
                  <div className="relative">
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt=""
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-warm-700 text-sm font-medium text-gray-500 dark:text-warm-200">
                        {(friend.displayName ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white dark:border-warm-800 ${
                        friend.online ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <Link
                    to={`/users/${friend.id}`}
                    className="flex-1 text-sm font-medium text-gray-900 dark:text-warm-50 hover:text-primary"
                  >
                    {friend.displayName ?? t("pages.publicProfile.anonymous")}
                  </Link>
                  <button
                    onClick={() => setChatWith(friend.id)}
                    className="text-xs text-gray-400 dark:text-warm-300 hover:text-blue-500"
                  >
                    {t("pages.friends.message")}
                  </button>
                  <button
                    onClick={() => handleRemove(friend.id)}
                    className="text-xs text-gray-400 dark:text-warm-300 hover:text-red-500"
                  >
                    {t("social.friendsList.removeButton")}
                  </button>

                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === "requests" && (
        <Card>
          {requests.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500 dark:text-warm-200">
              {t("pages.friends.noPendingRequests")}
            </p>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-warm-700">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 py-3">
                  {req.avatarUrl ? (
                    <img
                      src={req.avatarUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 dark:bg-warm-700 text-sm font-medium text-gray-500 dark:text-warm-200">
                      {(req.displayName ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/users/${req.id}`}
                      className="text-sm font-medium text-gray-900 dark:text-warm-50 hover:text-primary"
                    >
                      {req.displayName ?? t("pages.publicProfile.anonymous")}
                    </Link>
                    <p className="text-xs text-gray-400 dark:text-warm-300">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAccept(req.id)}
                    className="text-xs"
                  >
                    {t("social.friendsList.acceptButton")}
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
      {chatWith && (
        <ChatBox userId={chatWith} onClose={() => setChatWith(null)} />
      )}
    </div>
  );
}
