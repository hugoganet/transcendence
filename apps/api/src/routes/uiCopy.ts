/**
 * @file UI Copy Routes — serve localized UI strings by locale.
 * FR: Routes UI Copy — fournit les chaines d'interface localisees par langue.
 */

import { Router, type Request, type Response } from "express";
import { AppError } from "../utils/AppError.js";
import { getContent } from "../utils/contentLoader.js";
import type { UIStrings } from "@transcendence/shared";

/** UI Copy router — all /api/v1/ui-copy endpoints. / FR: Routeur UI Copy. */
export const uiCopyRouter = Router();

const VALID_LOCALES = new Set(["en", "fr", "es"]);

/** GET /:locale — return UI strings for the given locale. / FR: Retourne les chaines d'interface pour la langue donnee. */
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
