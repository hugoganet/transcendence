import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";

export function Landing() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Transcendence — Learn Blockchain by Doing";
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4">
      <div className="max-w-lg text-center">
        <h1 className="mb-4 text-4xl font-bold text-primary font-heading">
          Transcendence
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          {t("pages.landing.subtitle")}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/register">
            <Button>{t("pages.landing.getStarted")}</Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost">{t("pages.landing.signIn")}</Button>
          </Link>
        </div>
      </div>
      <nav className="mt-12 flex gap-4 text-sm text-gray-400">
        <Link to="/privacy-policy" className="hover:text-primary">
          {t("pages.landing.privacyPolicy")}
        </Link>
        <Link to="/terms-of-service" className="hover:text-primary">
          {t("pages.landing.termsOfService")}
        </Link>
      </nav>
    </div>
  );
}
