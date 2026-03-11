import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { notificationQuerySchema, notificationIdParamSchema } from "@transcendence/shared";
import { getNotifications, markAsRead } from "../services/notificationService.js";

export const notificationsRouter = Router();

// GET /api/v1/notifications
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

// PATCH /api/v1/notifications/:id/read
notificationsRouter.patch(
  "/:id/read",
  requireAuth,
  validate({ params: notificationIdParamSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    await markAsRead(user.id, req.params.id);
    res.status(204).send();
  },
);
