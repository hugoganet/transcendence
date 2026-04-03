/**
 * @module routes/certificates
 * @description Certificate routes: retrieve user certificate, download PDF,
 * and public viewing via share token (no auth required).
 */

import { Router, type Request, type Response } from "express";
import { getCertificateByShareToken, getCertificate } from "../services/certificateService.js";
import { validate } from "../middleware/validate.js";
import { shareTokenParamSchema } from "@transcendence/shared";
import { requireAuth } from "../middleware/auth.js";
import { generateCertificatePdf } from "../services/certificatePdfService.js";
import { prisma } from "../config/database.js";
import { AppError } from "../utils/AppError.js";

export const certificatesRouter = Router();

/** GET /api/v1/certificates/me — Returns the authenticated user's certificate data. */
certificatesRouter.get("/me", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = req.user.id;
  const cert = await getCertificate(userId);
  res.json({ data: cert });
});

/** GET /api/v1/certificates/me/pdf — Downloads certificate as PDF. */
certificatesRouter.get("/me/pdf", requireAuth, async (req: Request, res: Response) => {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const userId = req.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  });

  const certificate = await getCertificate(userId);
  if (!certificate) {
    throw new AppError(404, "CERTIFICATE_NOT_AVAILABLE", "No certificate found");
  }
  const pdfBuffer = await generateCertificatePdf(certificate, user?.displayName ?? "Learner");

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="certificate-${userId}.pdf"`);
  res.send(pdfBuffer);
});

/** GET /api/v1/certificates/:shareToken — Public certificate view (no auth required). */
certificatesRouter.get(
  "/:shareToken",
  validate({ params: shareTokenParamSchema }),
  async (req: Request, res: Response) => {
    const certificate = await getCertificateByShareToken(String(req.params.shareToken));
    res.json({ data: certificate });
  },
);
