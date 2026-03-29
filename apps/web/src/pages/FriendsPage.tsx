import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import type {
  FriendListEntry,
  FriendRequestEntry,
} from "@transcendence/shared";
import { friendsApi } from "../api/friends.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function FriendsPage() {
  const [tab, setTab] = useState<"friends" | "requests">("friends");
  const [friends, setFriends] = useState<FriendListEntry[]>([]);
  const [requests, setRequests] = useState<FriendRequestEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

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
      setError("Failed to load friends");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Friends — Transcendence";
    loadData();
  }, [loadData]);

  const handleAccept = async (userId: string) => {
    await friendsApi.acceptRequest(userId);
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
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        Friends
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setTab("friends")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "friends"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Friends ({friends.length})
        </button>
        <button
          onClick={() => setTab("requests")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            tab === "requests"
              ? "bg-white text-gray-900 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Requests ({requests.length})
        </button>
      </div>

      {tab === "friends" && (
        <Card>
          {friends.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-500">
              No friends yet. Visit other users' profiles to send requests.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
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
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-500">
                        {(friend.displayName ?? "?")[0].toUpperCase()}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        friend.online ? "bg-green-500" : "bg-gray-300"
                      }`}
                    />
                  </div>
                  <Link
                    to={`/users/${friend.id}`}
                    className="flex-1 text-sm font-medium text-gray-900 hover:text-primary"
                  >
                    {friend.displayName ?? "Anonymous"}
                  </Link>
                  <button
                    onClick={() => handleRemove(friend.id)}
                    className="text-xs text-gray-400 hover:text-red-500"
                  >
                    Remove
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
            <p className="py-8 text-center text-sm text-gray-500">
              No pending friend requests.
            </p>
          ) : (
            <div className="divide-y divide-gray-100">
              {requests.map((req) => (
                <div key={req.id} className="flex items-center gap-3 py-3">
                  {req.avatarUrl ? (
                    <img
                      src={req.avatarUrl}
                      alt=""
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium text-gray-500">
                      {(req.displayName ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1">
                    <Link
                      to={`/users/${req.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-primary"
                    >
                      {req.displayName ?? "Anonymous"}
                    </Link>
                    <p className="text-xs text-gray-400">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button
                    onClick={() => handleAccept(req.id)}
                    className="text-xs"
                  >
                    Accept
                  </Button>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
