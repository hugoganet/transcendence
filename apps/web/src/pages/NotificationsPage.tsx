import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../contexts/NotificationContext.js";
import { Card } from "../components/ui/Card.js";
import { Button } from "../components/ui/Button.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";

export function NotificationsPage() {
  const { t } = useTranslation();

  const typeLabels: Record<string, string> = {
    STREAK_REMINDER: t("notifications.streak_milestone"),
    MODULE_COMPLETE: t("notifications.level_up"),
    TOKEN_THRESHOLD: t("notifications.token_earned"),
    STREAK_MILESTONE: t("notifications.streak_milestone"),
    REENGAGEMENT: t("notifications.mission_reminder"),
  };
  const { notifications, isLoading, markAsRead, loadMore, hasMore } =
    useNotifications();

  useEffect(() => {
    document.title = `${t("labels.notifications")} — Unblock.chain`;
  }, []);

  if (isLoading && notifications.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        {t("labels.notifications")}
      </h1>

      <Card>
        {notifications.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-500">
            {t("emptyStates.noNotifications")}
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => {
                  if (!notif.read) markAsRead(notif.id);
                }}
                className={`block w-full px-4 py-4 text-left transition-colors hover:bg-gray-50 ${
                  !notif.read ? "bg-blue-50/30" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 rounded bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                    {typeLabels[notif.type] ?? notif.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {notif.title}
                    </p>
                    <p className="mt-0.5 text-sm text-gray-500">
                      {notif.body}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(notif.createdAt).toLocaleString()}
                    </p>
                  </div>
                  {!notif.read && (
                    <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {hasMore && (
          <div className="border-t border-gray-100 pt-4 text-center">
            <Button variant="ghost" onClick={loadMore}>
              {t("pages.notifications.loadMore")}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
