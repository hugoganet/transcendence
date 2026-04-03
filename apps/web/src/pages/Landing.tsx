import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button.js";
import { ThemeToggle } from "../components/ThemeToggle.js";
import { LanguageSwitcher } from "../components/LanguageSwitcher.js";

export function Landing() {
  const { t } = useTranslation();

  useEffect(() => {
    document.title = "Transcendence — Learn Blockchain by Doing";
  }, []);

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gradient-to-b from-teal-50 via-white to-warm-50 px-4 dark:from-teal-900/40 dark:via-warm-900 dark:to-warm-900">
      {/* Radial accent */}
      <div className="absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-teal-400/10 blur-3xl dark:bg-teal-500/5" />

      {/* Top bar */}
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher variant="pill" />
      </div>

      <div className="relative max-w-lg text-center animate-fade-in-up">
        <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900 font-heading dark:text-warm-50">
          Transcendence
        </h1>
        <p className="mb-8 text-lg text-gray-600 dark:text-warm-400">
          {t("pages.landing.subtitle")}
        </p>
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link to="/register">
            <Button className="shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40">
              {t("pages.landing.getStarted")}
            </Button>
          </Link>
          <Link to="/login">
            <Button variant="ghost">{t("pages.landing.signIn")}</Button>
          </Link>
        </div>
      </div>
      <nav className="mt-12 flex gap-4 text-sm text-gray-400 dark:text-warm-500">
        <Link to="/privacy-policy" className="transition-colors hover:text-primary">
          {t("pages.landing.privacyPolicy")}
        </Link>
        <Link to="/terms-of-service" className="transition-colors hover:text-primary">
          {t("pages.landing.termsOfService")}
        </Link>
      </nav>
    </div>
  );
}
