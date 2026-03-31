import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendMessage, getConversation } from "../services/messageService.js";
import { getIO } from "../socket/index.js";

export const messageRouter = Router()

messageRouter.post("/", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const { receiverId, content } = req.body;
    const data = await sendMessage(user.id, receiverId, content);
    getIO().to(`user:${receiverId}`).emit("message:new", data);
    res.status(201).json({ data });
});


messageRouter.get("/:userId", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getConversation(user.id, String(req.params.userId));
    res.json({ data });
  });