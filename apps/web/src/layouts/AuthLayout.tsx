/**
 * @file AuthLayout — Auth Layout — centered layout for login and register pages.
 * FR: Layout Auth — layout centre pour les pages de login et inscription.
 */
import { Outlet, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "../components/LanguageSwitcher.js";
import { ThemeToggle } from "../components/ThemeToggle.js";

export function AuthLayout() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col bg-gray-50 dark:bg-warm-900">
      <div className="absolute end-4 top-4 z-50 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher variant="pill" />
      </div>
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <Link to="/" className="mb-8 flex items-center gap-3 text-2xl font-bold font-heading">
          <img src="/blocky-logo.svg" alt="" className="h-10 w-10 rounded" />
          <span>
            <span className="text-primary dark:text-teal-400">Unblock</span>
            <span className="text-amber-500">.chain</span>
          </span>
        </Link>
        <div className="w-full max-w-md animate-fade-in-up">
          <Outlet />
        </div>
      </div>
      <footer className="py-4 text-center text-xs text-[var(--color-text-muted)]">
        <Link to="/privacy-policy" className="underline decoration-[var(--color-border)] underline-offset-2 transition-colors hover:text-[var(--color-primary)]">{t("footer.privacy")}</Link>
        <span className="mx-2">·</span>
        <Link to="/terms-of-service" className="underline decoration-[var(--color-border)] underline-offset-2 transition-colors hover:text-[var(--color-primary)]">{t("footer.terms")}</Link>
      </footer>
    </div>
  );
}
