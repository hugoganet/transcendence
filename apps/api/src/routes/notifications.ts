/**
 * @module routes/notifications
 * @description Notification routes: paginated list, mark as read,
 * and per-user notification preferences (streaks, milestones, etc.).
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  notificationQuerySchema,
  notificationIdParamSchema,
  updateNotificationPreferencesSchema,
} from "@transcendence/shared";
import { getNotifications, markAsRead } from "../services/notificationService.js";
import {
  getUserNotificationPreferences,
  updateNotificationPreferences,
} from "../services/engagementService.js";

export const notificationsRouter = Router();

/** GET /api/v1/notifications — Returns paginated notification list. */
notificationsRouter.get(
  "/",
  requireAuth,
  validate({ query: notificationQuerySchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const { page, pageSize } = res.locals.query;
    const result = await getNotifications(user.id, page, pageSize);
    res.json({ data: result.notifications, meta: result.meta });
  },
);

/** GET /api/v1/notifications/preferences — Returns user's notification preference flags. */
notificationsRouter.get(
  "/preferences",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const preferences = await getUserNotificationPreferences(user.id);
    res.json({ data: preferences });
  },
);

/** PATCH /api/v1/notifications/preferences — Updates notification preference flags. */
notificationsRouter.patch(
  "/preferences",
  requireAuth,
  validate({ body: updateNotificationPreferencesSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const updated = await updateNotificationPreferences(user.id, req.body);
    res.json({ data: updated });
  },
);

/** PATCH /api/v1/notifications/:id/read — Marks a single notification as read. Returns 204. */
notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  validate({ params: notificationIdParamSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    await markAsRead(user.id, String(req.params.id));
    res.status(204).send();
  },
);
