/**
 * @module routes/tokens
 * @description Token routes: Knowledge Token balance summary
 * and paginated transaction history (earnings + gas fee deductions).
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { tokenHistoryQuerySchema } from "@transcendence/shared";
import { getTokenBalance, getTokenHistory } from "../services/tokenService.js";

export const tokensRouter = Router();

/** GET /api/v1/tokens/balance — Returns current token balance and earning/spending totals. */
tokensRouter.get(
  "/balance",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getTokenBalance(user.id);
    res.json({ data });
  },
);

/** GET /api/v1/tokens/history — Returns paginated token transaction history (earnings + gas fees). */
tokensRouter.get(
  "/history",
  requireAuth,
  validate({ query: tokenHistoryQuerySchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const { page, pageSize } = res.locals.query as { page: number; pageSize: number };
    const { transactions, total } = await getTokenHistory(user.id, page, pageSize);
    res.json({
      data: transactions,
      meta: { page, pageSize, total },
    });
  },
);
