/**
 * @module routes/gdpr
 * @description GDPR compliance routes: data export and account deletion,
 * both with email-based token confirmation flows.
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

export const gdprRouter = Router();

/** POST /api/v1/gdpr/export — Initiates data export, sends download link via email. */
gdprRouter.post("/export", requireAuth, async (req: Request, res: Response) => {
  const user = req.user as { id: string; email: string };
  await requestDataExport(user.id, user.email, req.ip);
  res.json({
    data: { message: "Export initiated. Check your email for a download link." },
  });
});

/** GET /api/v1/gdpr/export/:token — Downloads exported user data as JSON. No auth (token-based). */
gdprRouter.get(
  "/export/:token",
  validate({ params: gdprExportTokenParamSchema }),
  async (req: Request, res: Response) => {
    const data = await downloadExport(req.params.token as string, req.ip);
    res.json({ data });
  },
);

/** POST /api/v1/gdpr/delete — Initiates account deletion, sends confirmation email. */
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

/** POST /api/v1/gdpr/delete/confirm/:token — Permanently deletes user and all data. No auth (token-based). */
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
