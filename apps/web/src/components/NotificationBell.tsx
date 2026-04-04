/**
 * @file NotificationBell — bell icon with badge and dropdown listing recent notifications.
 * FR: NotificationBell — icône cloche avec badge et menu déroulant listant les notifications récentes.
 */
import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useNotifications } from "../contexts/NotificationContext.js";

/**
 * Renders a notification bell with unread count badge and a dropdown of recent notifications.
 * FR: Affiche une cloche de notifications avec un badge de non-lus et un dropdown des notifications récentes.
 */
export function NotificationBell() {
  const { t } = useTranslation();
  const { notifications, unreadCount, markAsRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const recent = notifications.slice(0, 5);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative p-1 text-gray-500 hover:text-[var(--color-text)] dark:hover:text-warm-200"
        aria-label={t("labels.notifications")}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg dark:border-warm-700 dark:bg-warm-800">
          <div className="border-b border-gray-100 dark:border-warm-700 px-4 py-2">
            <span className="text-sm font-semibold text-[var(--color-text)]">
              {t("labels.notifications")}
            </span>
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400 dark:text-warm-200">
              {t("labels.noNotificationsYet")}
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {recent.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif.id);
                  }}
                  className={`block w-full px-4 py-3 text-left text-sm hover:bg-gray-50 dark:hover:bg-warm-700 ${
                    !notif.read ? "bg-blue-50/50 dark:bg-blue-900/20" : ""
                  }`}
                >
                  <p className="font-medium text-[var(--color-text)]">{notif.title}</p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">{notif.body}</p>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 dark:border-warm-700 px-4 py-2">
            <Link
              to="/notifications"
              className="text-xs text-primary hover:text-primary/80"
              onClick={() => setOpen(false)}
            >
              {t("labels.viewAll")}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
