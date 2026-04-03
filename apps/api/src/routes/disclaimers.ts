/**
 * @file Disclaimer Routes — serves general, onboarding, and module-specific disclaimers.
 * FR: Routes de disclaimers — sert les avertissements generaux, d'onboarding et par module.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { moduleIdParamSchema } from "@transcendence/shared";
import {
  getGeneralDisclaimerResponse,
  getOnboardingDisclaimer,
  getModuleDisclaimerResponse,
  acceptDisclaimer,
} from "../services/disclaimerService.js";

/** Disclaimers router — all /api/v1/disclaimers endpoints. / FR: Routeur des avertissements. */
export const disclaimersRouter = Router();

/** GET / — return general financial disclaimer (public). / FR: Retourne l'avertissement financier general (public). */
disclaimersRouter.get(
  "/",
  async (_req: Request, res: Response) => {
    const disclaimer = getGeneralDisclaimerResponse();
    res.json({ data: disclaimer });
  },
);

/** GET /onboarding — return onboarding disclaimer. / FR: Retourne l'avertissement d'onboarding. */
disclaimersRouter.get(
  "/onboarding",
  requireAuth,
  async (_req: Request, res: Response) => {
    const disclaimer = getOnboardingDisclaimer();
    res.json({ data: disclaimer });
  },
);

/** GET /module/:moduleId — return module-specific disclaimer. / FR: Retourne l'avertissement specifique au module. */
disclaimersRouter.get(
  "/module/:moduleId",
  requireAuth,
  validate({ params: moduleIdParamSchema }),
  async (req: Request, res: Response) => {
    const disclaimer = getModuleDisclaimerResponse(String(req.params.moduleId));
    res.json({ data: disclaimer });
  },
);

/** POST /accept — record disclaimer acceptance. / FR: Enregistre l'acceptation de l'avertissement. */
disclaimersRouter.post(
  "/accept",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await acceptDisclaimer((req.user as Express.User).id);
    res.json({ data: user });
  },
);
