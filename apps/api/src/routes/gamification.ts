import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { getStreak } from "../services/streakService.js";
import { getAchievements } from "../services/achievementService.js";

export const gamificationRouter = Router();

// GET /api/v1/gamification/streak — authenticated, returns streak + cumulative progress
gamificationRouter.get(
  "/streak",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getStreak(user.id);
    res.json({ data });
  },
);

// GET /api/v1/gamification/achievements — authenticated, returns all achievements with earned status
gamificationRouter.get(
  "/achievements",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getAchievements(user.id);
    res.json({ data });
  },
);
