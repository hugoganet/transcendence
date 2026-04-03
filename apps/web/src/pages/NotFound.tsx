import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";

export function NotFound() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = `${t("errors.notFound")} — Transcendence`;
  }, [t]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <h1 className="mb-4 text-3xl font-bold text-gray-900">{t("errors.notFound")}</h1>
      <p className="mb-6 text-gray-500">
        {t("pages.notFound.body")}
      </p>
      <Link to="/">
        <Button variant="ghost">{t("pages.notFound.backHome")}</Button>
      </Link>
    </div>
  );
}
