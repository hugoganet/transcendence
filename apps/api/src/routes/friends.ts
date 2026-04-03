/**
 * @module routes/friends
 * @description Friends routes: send/accept/remove friend requests,
 * list accepted friends, and list pending incoming/outgoing requests.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { friendUserIdParamSchema } from "@transcendence/shared";
import {
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getFriends,
  getPendingRequests,
  getSentRequests,
} from "../services/friendService.js";

export const friendsRouter = Router();

/** GET /api/v1/friends — Returns list of accepted friends. */
friendsRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getFriends(user.id);
    res.json({ data });
  },
);

/** GET /api/v1/friends/requests — Returns pending incoming friend requests. */
friendsRouter.get(
  "/requests",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getPendingRequests(user.id);
    res.json({ data });
  },
);

/** GET /api/v1/friends/requests/sent — Returns pending outgoing friend requests. */
friendsRouter.get(
  "/requests/sent",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getSentRequests(user.id);
    res.json({ data });
  },
);

/** POST /api/v1/friends/:userId — Sends a friend request. Returns 201. */
friendsRouter.post(
  "/:userId",
  requireAuth,
  validate({ params: friendUserIdParamSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await sendFriendRequest(user.id, String(req.params.userId));
    res.status(201).json({ data });
  },
);

/** POST /api/v1/friends/:userId/accept — Accepts a pending friend request. */
friendsRouter.post(
  "/:userId/accept",
  requireAuth,
  validate({ params: friendUserIdParamSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await acceptFriendRequest(user.id, String(req.params.userId));
    res.json({ data });
  },
);

/** DELETE /api/v1/friends/:userId — Removes friendship. Returns 204. */
friendsRouter.delete(
  "/:userId",
  requireAuth,
  validate({ params: friendUserIdParamSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    await removeFriend(user.id, String(req.params.userId));
    res.status(204).send();
  },
);
