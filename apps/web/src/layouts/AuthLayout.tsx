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
      <Link to="/" className="mb-8 text-2xl font-bold text-primary font-heading dark:text-teal-400">
        Unblock.chain
      </Link>
      <div className="w-full max-w-md animate-fade-in-up">
        <Outlet />
      </div>
    </div>
  );
}
