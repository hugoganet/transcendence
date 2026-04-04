/**
 * @file GDPR Routes — data export, account deletion requests and confirmation.
 * FR: Routes RGPD — export de donnees, demande et confirmation de suppression de compte.
 */

import { Router, type Request, type Response } from "express";
import { requireAuth } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  gdprExportTokenParamSchema,
  gdprDeletionTokenParamSchema,
} from "@transcendence/shared";
import {
  requestDataExport,
  downloadExport,
  requestAccountDeletion,
  confirmAccountDeletion,
} from "../services/gdprService.js";

/** GDPR router — all /api/v1/gdpr endpoints. / FR: Routeur RGPD. */
export const gdprRouter = Router();

/** POST /export — request a personal data export. / FR: Demande un export de donnees personnelles. */
gdprRouter.post("/export", requireAuth, async (req: Request, res: Response) => {
  const user = req.user as { id: string; email: string };
  await requestDataExport(user.id, user.email, req.ip);
  res.json({
    data: { message: "Export initiated. Check your email for a download link." },
  });
});

/** GET /export/:token — download export via token (no auth). / FR: Telecharge l'export via token (sans auth). */
gdprRouter.get(
  "/export/:token",
  validate({ params: gdprExportTokenParamSchema }),
  async (req: Request, res: Response) => {
    const data = await downloadExport(req.params.token as string, req.ip);
    res.json({ data });
  },
);

/** POST /delete — request account deletion. / FR: Demande la suppression du compte. */
gdprRouter.post(
  "/delete",
  requireAuth,
  async (req: Request, res: Response) => {
    const user = req.user as { id: string; email: string };
    await requestAccountDeletion(user.id, user.email, req.ip);
    res.json({
      data: {
        message: "Deletion requested. Check your email to confirm.",
      },
    });
  },
);

/** POST /delete/confirm/:token — confirm account deletion via token. / FR: Confirme la suppression du compte via token. */
gdprRouter.post(
  "/delete/confirm/:token",
  validate({ params: gdprDeletionTokenParamSchema }),
  async (req: Request, res: Response) => {
    await confirmAccountDeletion(req.params.token as string, req.ip);
    res.json({
      data: {
        message:
          "Account and all personal data have been permanently deleted.",
      },
    });
  },
);
