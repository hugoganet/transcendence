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

// POST /api/v1/gdpr/export — request data export (requires auth)
gdprRouter.post("/export", requireAuth, async (req: Request, res: Response) => {
  const user = req.user as { id: string; email: string };
  await requestDataExport(user.id, user.email, req.ip);
  res.json({
    data: { message: "Export initiated. Check your email for a download link." },
  });
});

// GET /api/v1/gdpr/export/:token — download export (token-based, no auth)
gdprRouter.get(
  "/export/:token",
  validate({ params: gdprExportTokenParamSchema }),
  async (req: Request, res: Response) => {
    const data = await downloadExport(req.params.token as string, req.ip);
    res.json({ data });
  },
);

// POST /api/v1/gdpr/delete — request account deletion (requires auth)
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

// POST /api/v1/gdpr/delete/confirm/:token — confirm deletion (token-based, no auth)
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
