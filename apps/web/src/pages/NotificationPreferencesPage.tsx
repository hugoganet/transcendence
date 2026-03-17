import { useEffect, useState } from "react";
import type { NotificationPreferences } from "@transcendence/shared";
import { notificationsApi } from "../api/notifications.js";
import { Card } from "../components/ui/Card.js";
import { LoadingSpinner } from "../components/ui/LoadingSpinner.js";
import { Alert } from "../components/ui/Alert.js";

const labels: Record<keyof NotificationPreferences, string> = {
  streakReminder: "Streak Reminders",
  reengagement: "Re-engagement Nudges",
  moduleComplete: "Module Completion",
  tokenThreshold: "Token Thresholds",
  streakMilestone: "Streak Milestones",
};

export function NotificationPreferencesPage() {
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Notification Settings — Transcendence";
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
          setError("Failed to load preferences");
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
    return <Alert variant="error">{error ?? "Failed to load"}</Alert>;
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 font-heading">
        Notification Settings
      </h1>

      <Card>
        <div className="divide-y divide-gray-100">
          {(Object.keys(labels) as Array<keyof NotificationPreferences>).map(
            (key) => (
              <div
                key={key}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm text-gray-700">{labels[key]}</span>
                <button
                  onClick={() => handleToggle(key)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                    prefs[key] ? "bg-primary" : "bg-gray-200"
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
