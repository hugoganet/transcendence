/**
 * @module routes/uiCopy
 * @description UI copy routes: serves localized UI strings (EN/FR/ES).
 * Public endpoint — no auth required. Cached for 1 hour.
 */

import { Router, type Request, type Response } from "express";
import { AppError } from "../utils/AppError.js";
import { getContent } from "../utils/contentLoader.js";
import type { UIStrings } from "@transcendence/shared";

export const uiCopyRouter = Router();

const VALID_LOCALES = new Set(["en", "fr", "es"]);

/** GET /api/v1/ui-copy/:locale — Returns all UI strings for the given locale. Cached 1h. */
uiCopyRouter.get(
  "/:locale",
  (req: Request, res: Response) => {
    const { locale } = req.params;

    if (!VALID_LOCALES.has(String(locale))) {
      throw new AppError(400, "INVALID_LOCALE", "Locale must be en, fr, or es");
    }

    const content = getContent();
    const uiStrings: UIStrings | undefined = content.uiStrings.get(String(locale));

    if (!uiStrings) {
      throw new AppError(500, "CONTENT_UNAVAILABLE", "UI copy not available for this locale");
    }

    res.set("Cache-Control", "public, max-age=3600");
    res.json({ data: uiStrings });
  },
);
