import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext.js";

export function NotificationBell() {
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
        className="relative p-1 text-gray-500 hover:text-gray-700"
        aria-label="Notifications"
      >
        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-lg border border-gray-200 bg-white shadow-lg">
          <div className="border-b border-gray-100 px-4 py-2">
            <span className="text-sm font-semibold text-gray-900">
              Notifications
            </span>
          </div>
          {recent.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              No notifications yet
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {recent.map((notif) => (
                <button
                  key={notif.id}
                  onClick={() => {
                    if (!notif.read) markAsRead(notif.id);
                  }}
                  className={`block w-full px-4 py-3 text-left text-sm hover:bg-gray-50 ${
                    !notif.read ? "bg-blue-50/50" : ""
                  }`}
                >
                  <p className="font-medium text-gray-900">{notif.title}</p>
                  <p className="mt-0.5 text-xs text-gray-500">{notif.body}</p>
                </button>
              ))}
            </div>
          )}
          <div className="border-t border-gray-100 px-4 py-2">
            <Link
              to="/notifications"
              className="text-xs text-primary hover:text-primary/80"
              onClick={() => setOpen(false)}
            >
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
