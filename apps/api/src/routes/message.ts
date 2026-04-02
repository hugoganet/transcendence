import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { sendMessage, getConversation } from "../services/messageService.js";
import { getIO } from "../socket/index.js";

export const messageRouter = Router()

messageRouter.post("/", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const { receiverId, content } = req.body;
    if (!receiverId || typeof receiverId !== "string" || receiverId.trim().length === 0) {
      return res.status(400).json({ error: "Invalid receiverId" });
    }
    if (!content || content.trim().length === 0 || content.length > 100) {
      return res.status(400).json({ error: "Invalid message" });
    }
    const data = await sendMessage(user.id, receiverId, content);
    const payload = {
      id: data.id,
      senderId: data.senderId,
      receiverId: data.receiverId,
      content: data.content,
      createdAt: data.createdAt.toISOString(),
    };
    getIO().to(`user:${receiverId}`).emit("message:new", payload);
    getIO().to(`user:${user.id}`).emit("message:new", payload);
    res.status(201).json({ data });
});


messageRouter.get("/:userId", requireAuth, async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getConversation(user.id, String(req.params.userId));
    res.json({ data });
  });