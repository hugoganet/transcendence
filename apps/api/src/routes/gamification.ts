/**
 * @file Gamification Routes — streaks, achievements, leaderboard.
 * FR: Routes Gamification — series, succes, classement.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { leaderboardQuerySchema } from "@transcendence/shared";
import { getStreak } from "../services/streakService.js";
import { getAchievements } from "../services/achievementService.js";
import { getLeaderboard } from "../services/leaderboardService.js";

/** Gamification router — all /api/v1/gamification endpoints. / FR: Routeur gamification. */
export const gamificationRouter = Router();

/** GET /streak — return current streak and cumulative progress. / FR: Retourne la serie en cours et la progression cumulee. */
gamificationRouter.get(
  "/streak",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getStreak(user.id);
    res.json({ data });
  },
);

/** GET /achievements — return all achievements with earned status. / FR: Retourne tous les succes avec leur statut d'obtention. */
gamificationRouter.get(
  "/achievements",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getAchievements(user.id);
    res.json({ data });
  },
);

/** GET /leaderboard — return paginated weekly leaderboard. / FR: Retourne le classement hebdomadaire pagine. */
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
