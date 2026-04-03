import { Router, type Request, type Response } from "express";
import { getCertificateByShareToken, getCertificate } from "../services/certificateService.js";
import { validate } from "../middleware/validate.js";
import { shareTokenParamSchema } from "@transcendence/shared";
import { requireAuth } from "../middleware/auth.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export const certificatesRouter = Router();

// GET /api/v1/certificates/me — Return certificate data (with on-chain info)
certificatesRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = req.user.id;
  const cert = await getCertificate(userId);
  res.json({ data: cert });
});

// GET /api/v1/certificates/:shareToken — public certificate view (no auth required)
certificatesRouter.get(
  "/:shareToken",
  validate({ params: shareTokenParamSchema }),
  async (req: Request, res: Response) => {
    const certificate = await getCertificateByShareToken(String(req.params.shareToken));
    res.json({ data: certificate });
  },
);
