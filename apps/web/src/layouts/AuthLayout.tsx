/**
 * @file AuthLayout — Auth Layout — centered layout for login and register pages.
 * FR: Layout Auth — layout centre pour les pages de login et inscription.
 */
import { Outlet, Link } from "react-router-dom";
import { LanguageSwitcher } from "../components/LanguageSwitcher.js";
import { ThemeToggle } from "../components/ThemeToggle.js";

export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 dark:bg-warm-900">
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <ThemeToggle />
        <LanguageSwitcher variant="pill" />
      </div>
      <Link to="/" className="mb-8 flex items-center gap-3 text-2xl font-bold font-heading">
        <img src="/blocky-logo.png" alt="" className="h-10 w-10 rounded" />
        <span>
          <span className="text-primary dark:text-teal-400">Unblock</span>
          <span className="text-amber-500">.chain</span>
        </span>
      </Link>
      <div className="w-full max-w-md animate-fade-in-up">
        <Outlet />
      </div>
    </div>
  );
}
