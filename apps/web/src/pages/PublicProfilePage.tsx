import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import type { PublicProfile } from "@transcendence/shared";
import { usersApi } from "../api/users.js";
import { friendsApi } from "../api/friends.js";
import { ApiError } from "../api/client.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { ProgressBar } from "../components/ui/ProgressBar.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function PublicProfilePage() {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [friendStatus, setFriendStatus] = useState<
    "none" | "pending" | "friends" | "self"
  >("none");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    setIsLoading(true);

    usersApi.getPublicProfile(userId).then(
      (data) => {
        if (cancelled) return;
        setProfile(data);
        document.title = `${data.displayName ?? "User"} — Transcendence`;
        setIsLoading(false);
      },
      () => {
        if (!cancelled) {
          setError("Failed to load profile");
          setIsLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const handleSendRequest = async () => {
    if (!userId) return;
    setIsSending(true);
    try {
      await friendsApi.sendRequest(userId);
      setFriendStatus("pending");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === "ALREADY_FRIENDS") setFriendStatus("friends");
        else if (err.code === "REQUEST_ALREADY_EXISTS")
          setFriendStatus("pending");
        else if (err.code === "CANNOT_FRIEND_SELF") setFriendStatus("self");
      }
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !profile) {
    return <Alert variant="error">{error ?? "Profile not found"}</Alert>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <div className="flex flex-col items-center text-center">
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt=""
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gray-200 text-2xl font-bold text-gray-400">
              {(profile.displayName ?? "?")[0].toUpperCase()}
            </div>
          )}
          <h1 className="mt-3 text-xl font-bold text-gray-900 font-heading">
            {profile.displayName ?? "Anonymous"}
          </h1>

          <div className="mt-3 flex gap-6 text-sm text-gray-500">
            <div>
              <span className="block text-lg font-bold text-gray-900">
                {profile.xp}
              </span>
              XP
            </div>
            <div>
              <span className="block text-lg font-bold text-gray-900">
                {profile.currentStreak}
              </span>
              Streak
            </div>
          </div>

          <ProgressBar
            value={profile.completionPercentage}
            showLabel
            className="mt-4 w-full max-w-xs"
          />

          {friendStatus === "none" && (
            <Button
              onClick={handleSendRequest}
              isLoading={isSending}
              className="mt-4"
            >
              Add Friend
            </Button>
          )}
          {friendStatus === "pending" && (
            <p className="mt-4 text-sm text-gray-500">Request sent</p>
          )}
          {friendStatus === "friends" && (
            <p className="mt-4 text-sm text-green-600">Already friends</p>
          )}
        </div>
      </Card>

      {profile.achievements.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            Achievements ({profile.achievements.length})
          </h2>
          <div className="space-y-2">
            {profile.achievements.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 rounded-lg bg-amber-50 p-3"
              >
                <span className="text-sm font-medium text-amber-800">
                  {a.title}
                </span>
                <span className="ml-auto text-xs text-amber-600">
                  {new Date(a.earnedAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
