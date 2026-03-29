import { Router, type Request, type Response } from "express";
import { getCertificateByShareToken } from "../services/certificateService.js";
import { validate } from "../middleware/validate.js";
import { shareTokenParamSchema } from "@transcendence/shared";

export const certificatesRouter = Router();

// GET /api/v1/certificates/:shareToken — public certificate view (no auth required)
certificatesRouter.get(
  "/:shareToken",
  validate({ params: shareTokenParamSchema }),
  async (req: Request, res: Response) => {
    const certificate = await getCertificateByShareToken(String(req.params.shareToken));
    res.json({ data: certificate });
  },
);
