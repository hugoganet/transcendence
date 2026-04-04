/**
 * @file NotFound — Not Found — 404 error page.
 * FR: Page 404 — page d'erreur introuvable.
 */
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";

export function NotFound() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("errors.notFound")} — Unblock.chain`;
  }, [t]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--color-background)]">
      <h1 className="mb-4 text-3xl font-bold text-[var(--color-text)]">{t("errors.notFound")}</h1>
      <p className="mb-6 text-[var(--color-text-muted)]">
        {t("pages.notFound.body")}
      </p>
      <Link to="/">
        <Button variant="ghost">{t("pages.notFound.backHome")}</Button>
      </Link>
    </div>
  );
}
