import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import type {
  Notification,
  NotificationPushPayload,
} from "@transcendence/shared";
import { useAuth } from "./AuthContext.js";
import { notificationsApi } from "../api/notifications.js";
import { connectSocket, disconnectSocket } from "../api/socket.js";

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  markAsRead: (id: string) => Promise<void>;
  loadMore: () => Promise<void>;
  hasMore: boolean;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(isAuthenticated);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Load initial notifications
  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    notificationsApi.getNotifications(1, 20).then(
      ({ notifications: notifs, meta }) => {
        if (cancelled) return;
        setNotifications(notifs);
        setHasMore(meta.page * meta.pageSize < meta.total);
        setPage(1);
        setIsLoading(false);
      },
      () => {
        if (!cancelled) setIsLoading(false);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  // Socket.IO connection for real-time notifications
  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      return;
    }

    const socket = connectSocket();

    const handlePush = (payload: NotificationPushPayload) => {
      const newNotif: Notification = {
        id: payload.id,
        type: payload.type as Notification["type"],
        title: payload.title,
        body: payload.body,
        read: false,
        data: payload.data,
        createdAt: new Date().toISOString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
    };

    socket.on("notification:push", handlePush);

    return () => {
      socket.off("notification:push", handlePush);
    };
  }, [isAuthenticated]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    await notificationsApi.markAsRead(id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  }, []);

  const loadMore = useCallback(async () => {
    const nextPage = page + 1;
    const { notifications: notifs, meta } =
      await notificationsApi.getNotifications(nextPage, 20);
    setNotifications((prev) => [...prev, ...notifs]);
    setHasMore(meta.page * meta.pageSize < meta.total);
    setPage(nextPage);
  }, [page]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        markAsRead,
        loadMore,
        hasMore,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error(
      "useNotifications must be used within NotificationProvider",
    );
  return ctx;
}
