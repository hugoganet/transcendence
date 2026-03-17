import type {
  Notification,
  NotificationPreferences,
  PaginationMeta,
} from "@transcendence/shared";
import { api } from "./client.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

export const notificationsApi = {
  getNotifications: async (
    page = 1,
    pageSize = 20,
  ): Promise<{ notifications: Notification[]; meta: PaginationMeta }> => {
    const params = new URLSearchParams({
      page: String(page),
      pageSize: String(pageSize),
    });
    const res = await fetch(
      `${BASE_URL}/api/v1/notifications?${params}`,
      { credentials: "include" },
    );
    const json = await res.json();
    return { notifications: json.data, meta: json.meta };
  },

  markAsRead: (id: string) =>
    api.patch<undefined>(`/api/v1/notifications/${id}/read`),

  getPreferences: () =>
    api.get<NotificationPreferences>("/api/v1/notifications/preferences"),

  updatePreferences: (prefs: Partial<NotificationPreferences>) =>
    api.patch<NotificationPreferences>(
      "/api/v1/notifications/preferences",
      prefs,
    ),
};
