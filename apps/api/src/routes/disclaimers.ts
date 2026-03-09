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

export const disclaimersRouter = Router();

// GET /api/v1/disclaimers — public, returns general disclaimer
disclaimersRouter.get(
  "/",
  async (_req: Request, res: Response) => {
    const disclaimer = getGeneralDisclaimerResponse();
    res.json({ data: disclaimer });
  },
);

// GET /api/v1/disclaimers/onboarding — authenticated, returns onboarding disclaimer
disclaimersRouter.get(
  "/onboarding",
  requireAuth,
  async (_req: Request, res: Response) => {
    const disclaimer = getOnboardingDisclaimer();
    res.json({ data: disclaimer });
  },
);

// GET /api/v1/disclaimers/module/:moduleId — authenticated, returns module-specific disclaimer
disclaimersRouter.get(
  "/module/:moduleId",
  requireAuth,
  validate({ params: moduleIdParamSchema }),
  async (req: Request, res: Response) => {
    const disclaimer = getModuleDisclaimerResponse(req.params.moduleId);
    res.json({ data: disclaimer });
  },
);

// POST /api/v1/disclaimers/accept — authenticated, records disclaimer acceptance
disclaimersRouter.post(
  "/accept",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = await acceptDisclaimer((req.user as Express.User).id);
    res.json({ data: user });
  },
);
