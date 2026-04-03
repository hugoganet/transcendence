/**
 * @module routes/tooltips
 * @description Tooltip routes: full glossary and single-term lookup.
 * Content is locale-aware (EN/FR) based on the user's locale setting.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { termParamSchema } from "@transcendence/shared";
import { getTooltip, getGlossary } from "../services/tooltipService.js";

export const tooltipsRouter = Router();

/** GET /api/v1/tooltips — Returns full glossary sorted alphabetically for user's locale. */
tooltipsRouter.get(
  "/",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const locale = user.locale ?? "en";
    const data = await getGlossary(locale);
    res.json({ data });
  },
);

/** GET /api/v1/tooltips/:term — Returns a single tooltip definition for the given term. */
tooltipsRouter.get(
  "/:term",
  requireAuth,
  validate({ params: termParamSchema }),
  async (req: Request, res: Response) => {
    const user = req.user as Express.User;
    const locale = user.locale ?? "en";
    const term = req.params.term as string;
    const data = await getTooltip(term, locale);
    res.json({ data });
  },
);
