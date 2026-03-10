import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { leaderboardQuerySchema } from "@transcendence/shared";
import { getStreak } from "../services/streakService.js";
import { getAchievements } from "../services/achievementService.js";
import { getLeaderboard } from "../services/leaderboardService.js";

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

// GET /api/v1/gamification/leaderboard — authenticated, returns paginated weekly leaderboard
gamificationRouter.get(
  "/leaderboard",
  requireAuth,
  validate({ query: leaderboardQuerySchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const { page, pageSize } = res.locals.query as { page: number; pageSize: number };
    const { entries, currentUser, total } = await getLeaderboard(user.id, page, pageSize);
    res.json({
      data: entries,
      currentUser,
      meta: { page, pageSize, total },
    });
  },
);
