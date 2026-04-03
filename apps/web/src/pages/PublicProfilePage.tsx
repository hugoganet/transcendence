import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { PublicProfile } from "@transcendence/shared";
import { usersApi } from "../api/users.js";
import { friendsApi } from "../api/friends.js";
import { useAuth } from "../contexts/AuthContext.js";
import { ApiError } from "../api/client.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { ProgressBar } from "../components/ui/ProgressBar.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function PublicProfilePage() {
  const { t } = useTranslation();
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [friendStatus, setFriendStatus] = useState<
    "none" | "pending" | "friends" | "self"
  >(userId === user?.id ? "self" : "none");
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    if (!userId) return;
    if (userId === user?.id) {
      setFriendStatus("self");
      // still load the profile, just skip friendship checks
      usersApi.getPublicProfile(userId).then((data) => {
        setProfile(data);
        document.title = `${data.displayName ?? t("pages.publicProfile.defaultUser")} — Transcendence`;
        setIsLoading(false);
      }, () => { setError(t("pages.publicProfile.loadError")); setIsLoading(false); });
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    Promise.all([
      usersApi.getPublicProfile(userId),
      friendsApi.getFriends(),
      friendsApi.getPendingRequests(),
      friendsApi.getSentRequests(),
    ]).then(
      ([data, friends, incoming, sent]) => {
        if (cancelled) return;
        setProfile(data);
        document.title = `${data.displayName ?? t("pages.publicProfile.defaultUser")} — Transcendence`;
        if (friends.some((f) => f.id === userId)) setFriendStatus("friends");
        else if (incoming.some((p) => p.id === userId) || sent.some((p) => p.id === userId)) setFriendStatus("pending");
        else setFriendStatus("none");
        setIsLoading(false);
      },
      () => {
        if (!cancelled) {
          setError(t("pages.publicProfile.loadError"));
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
        if (err.code === "FRIENDSHIP_ALREADY_EXISTS") setFriendStatus("friends");
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
    return <Alert variant="error">{error ?? t("pages.publicProfile.notFound")}</Alert>;
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
            {profile.displayName ?? t("pages.publicProfile.anonymous")}
          </h1>

          <div className="mt-3 flex gap-6 text-sm text-gray-500">
            <div>
              <span className="block text-lg font-bold text-gray-900">
                {profile.xp}
              </span>
              {t("pages.publicProfile.xp")}
            </div>
            <div>
              <span className="block text-lg font-bold text-gray-900">
                {profile.currentStreak}
              </span>
              {t("social.publicProfile.streak")}
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
              {t("pages.publicProfile.addFriend")}
            </Button>
          )}
          {friendStatus === "pending" && (
            <p className="mt-4 text-sm text-gray-500">{t("pages.publicProfile.requestPending")}</p>
          )}
          {friendStatus === "friends" && (
            <p className="mt-4 text-sm text-green-600">{t("pages.publicProfile.alreadyFriends")}</p>
          )}
        </div>
      </Card>

      {profile.achievements.length > 0 && (
        <Card>
          <h2 className="mb-3 text-sm font-semibold text-gray-900">
            {t("pages.publicProfile.achievementsHeading", { count: profile.achievements.length })}
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
