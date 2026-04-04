/**
 * @file PublicLayout — Public Layout — minimal layout for public-facing pages.
 * FR: Layout Public — layout minimal pour les pages publiques.
 */
import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher.js";
import { ThemeToggle } from "../components/ThemeToggle.js";

export function PublicLayout() {
  const { t } = useTranslation();
  return (
    <div className="relative flex min-h-screen flex-col">
      <div className="absolute end-4 top-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher variant="pill" />
      </div>
      <div className="flex-1">
        <Outlet />
      </div>
      <footer className="py-4 text-center text-xs text-gray-400 dark:text-warm-300">
        <Link to="/privacy-policy" className="transition-colors hover:text-primary">{t("footer.privacy")}</Link>
        {" · "}
        <Link to="/terms-of-service" className="transition-colors hover:text-primary">{t("footer.terms")}</Link>
      </footer>
    </div>
  );
}
