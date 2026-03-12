import type { z } from "zod";
import type {
  notificationTypeSchema,
  notificationSchema,
  notificationQuerySchema,
  notificationPushPayloadSchema,
  notificationPreferencesSchema,
} from "../schemas/notification.js";

export type NotificationType = z.infer<typeof notificationTypeSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type NotificationQuery = z.infer<typeof notificationQuerySchema>;
export type NotificationPushPayload = z.infer<typeof notificationPushPayloadSchema>;
export type NotificationPreferences = z.infer<typeof notificationPreferencesSchema>;
