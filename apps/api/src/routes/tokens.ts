/**
 * @file Tokens Routes — check balance, view transaction history.
 * FR: Routes Tokens — consulte le solde, affiche l'historique des transactions.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { tokenHistoryQuerySchema } from "@transcendence/shared";
import { getTokenBalance, getTokenHistory } from "../services/tokenService.js";

/** Tokens router — all /api/v1/tokens endpoints. / FR: Routeur tokens. */
export const tokensRouter = Router();

/** GET /balance — return token balance summary. / FR: Retourne le resume du solde de tokens. */
tokensRouter.get(
  "/balance",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const data = await getTokenBalance(user.id);
    res.json({ data });
  },
);

/** GET /history — return paginated transaction history. / FR: Retourne l'historique des transactions pagine. */
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
