import { Router, type Request, type Response } from "express";
import { AppError } from "../utils/AppError.js";
import { getContent } from "../utils/contentLoader.js";
import type { UIStrings } from "@transcendence/shared";

export const uiCopyRouter = Router();

const VALID_LOCALES = new Set(["en", "fr"]);

// GET /api/v1/ui-copy/:locale — public, returns UI strings for given locale
uiCopyRouter.get(
  "/:locale",
  (req: Request, res: Response) => {
    const { locale } = req.params;

    if (!VALID_LOCALES.has(String(locale))) {
      throw new AppError(400, "INVALID_LOCALE", "Locale must be en or fr");
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
