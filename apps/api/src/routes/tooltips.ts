import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { termParamSchema } from "@transcendence/shared";
import { getTooltip, getGlossary } from "../services/tooltipService.js";

export const tooltipsRouter = Router();

// GET /api/v1/tooltips — authenticated, returns full glossary sorted alphabetically
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

// GET /api/v1/tooltips/:term — authenticated, returns single tooltip
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
