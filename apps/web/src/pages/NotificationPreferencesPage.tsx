/**
 * @file NotificationPreferencesPage — Notification Preferences — manage email and push settings.
 * FR: Preferences de Notifications — gerer les parametres email et push.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { NotificationPreferences } from "@transcendence/shared";
import { notificationsApi } from "../api/notifications.js";
import { Card } from "../components/ui/Card.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

export function NotificationPreferencesPage() {
  const { t } = useTranslation();
  const labels: Record<keyof NotificationPreferences, string> = {
    streakReminder: t("pages.notificationPreferences.streakReminder"),
    reengagement: t("pages.notificationPreferences.reengagement"),
    moduleComplete: t("pages.notificationPreferences.moduleComplete"),
    tokenThreshold: t("pages.notificationPreferences.tokenThreshold"),
    streakMilestone: t("pages.notificationPreferences.streakMilestone"),
    friendRequest: t("pages.notificationPreferences.friendRequest"),
    messageReceived: t("pages.notificationPreferences.messageReceived"),
  };
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = `${t("pages.notificationPreferences.title")} — Unblock.chain`;
    let cancelled = false;
    notificationsApi.getPreferences().then(
      (data) => {
        if (!cancelled) {
          setPrefs(data);
          setIsLoading(false);
        }
      },
      () => {
        if (!cancelled) {
          setError(t("pages.notificationPreferences.loadError"));
          setIsLoading(false);
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const handleToggle = async (key: keyof NotificationPreferences) => {
    if (!prefs) return;
    const newVal = !prefs[key];
    setPrefs({ ...prefs, [key]: newVal });
    try {
      await notificationsApi.updatePreferences({ [key]: newVal });
    } catch {
      // Revert on failure
      setPrefs({ ...prefs, [key]: !newVal });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !prefs) {
    return <Alert variant="error">{error ?? t("pages.notificationPreferences.loadError")}</Alert>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-[var(--color-text)] font-heading">
        {t("pages.notificationPreferences.title")}
      </h1>

      <Card>
        <div className="divide-y divide-gray-100 dark:divide-warm-700">
          {(Object.keys(labels) as Array<keyof NotificationPreferences>).map(
            (key) => (
              <div
                key={key}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm text-[var(--color-text)]">{labels[key]}</span>
                <button
                  onClick={() => handleToggle(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    prefs[key] ? "bg-primary" : "bg-[var(--color-border)]"
                  }`}
                  role="switch"
                  aria-checked={prefs[key]}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                      prefs[key] ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            ),
          )}
        </div>
      </Card>
    </div>
  );
}
