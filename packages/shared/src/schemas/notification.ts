import { z } from "zod";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../constants/tokens.js";

export const notificationTypeSchema = z.enum([
  "STREAK_REMINDER",
  "MODULE_COMPLETE",
  "TOKEN_THRESHOLD",
  "STREAK_MILESTONE",
  "REENGAGEMENT",
]);

export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
  data: z.unknown().nullable(),
  createdAt: z.string(),
});

export const notificationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});

export const notificationIdParamSchema = z.object({
  id: z.string().min(1),
});

export const notificationPushPayloadSchema = z.object({
  id: z.string(),
  type: z.string(),
  title: z.string(),
  body: z.string(),
  data: z.unknown().nullable(),
});

export const notificationPreferencesSchema = z.object({
  streakReminder: z.boolean(),
  reengagement: z.boolean(),
  moduleComplete: z.boolean(),
  tokenThreshold: z.boolean(),
  streakMilestone: z.boolean(),
});

export const updateNotificationPreferencesSchema = notificationPreferencesSchema.partial();
