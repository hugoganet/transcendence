/**
 * @file Friends Routes — manage friend requests, accept/reject, list friends.
 * FR: Routes Amis — gere les demandes d'amis, acceptation/rejet, liste d'amis.
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

/** Friends router — all /api/v1/friends endpoints. / FR: Routeur amis. */
export const friendsRouter = Router();

/** GET / — list accepted friends. / FR: Liste les amis acceptes. */
friendsRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getFriends(user.id);
    res.json({ data });
  },
);

/** GET /requests — list pending incoming requests. / FR: Liste les demandes recues en attente. */
friendsRouter.get(
  "/requests",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getPendingRequests(user.id);
    res.json({ data });
  },
);

/** GET /requests/sent — list pending outgoing requests. / FR: Liste les demandes envoyees en attente. */
friendsRouter.get(
  "/requests/sent",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getSentRequests(user.id);
    res.json({ data });
  },
);

/** POST /:userId — send a friend request. / FR: Envoie une demande d'ami. */
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

/** POST /:userId/accept — accept a friend request. / FR: Accepte une demande d'ami. */
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

/** DELETE /:userId — remove a friend. / FR: Supprime un ami. */
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
