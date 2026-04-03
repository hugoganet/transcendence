/**
 * @file Tooltips Routes — glossary lookup and single-term tooltip.
 * FR: Routes Infobulles — consultation du glossaire et infobulle par terme.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { termParamSchema } from "@transcendence/shared";
import { getTooltip, getGlossary } from "../services/tooltipService.js";

/** Tooltips router — all /api/v1/tooltips endpoints. / FR: Routeur infobulles. */
export const tooltipsRouter = Router();

/** GET / — return full glossary sorted alphabetically. / FR: Retourne le glossaire complet tri par ordre alphabetique. */
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

/** GET /:term — return a single tooltip by term. / FR: Retourne une infobulle par terme. */
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
