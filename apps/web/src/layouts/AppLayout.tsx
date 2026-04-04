/**
 * @file AppLayout — App Layout — authenticated layout with sidebar, header, and navigation.
 * FR: Layout App — layout authentifie avec sidebar, header et navigation.
 */
import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext.js";
import { useReveals } from "../contexts/RevealContext.js";
import { StreakWidget } from "../components/StreakWidget.js";
import { TokenBalanceDisplay } from "../components/TokenBalance.js";
import type { StreakStatus, TokenBalance } from "@transcendence/shared";
import { gamificationApi } from "../api/gamification.js";
import { tokensApi } from "../api/tokens.js";
import { NotificationBell } from "../components/NotificationBell.js";
import { LanguageSwitcher } from "../components/LanguageSwitcher.js";
import { ThemeToggle } from "../components/ThemeToggle.js";

export function AppLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { tokensRevealed, walletRevealed } = useReveals();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [streak, setStreak] = useState<StreakStatus | null>(null);
  const [balance, setBalance] = useState<TokenBalance | null>(null);

  useEffect(() => {
    let cancelled = false;
    gamificationApi.getStreak().then(
      (data) => { if (!cancelled) setStreak(data); },
      () => {},
    );
    if (tokensRevealed) {
      tokensApi.getBalance().then(
        (data) => { if (!cancelled) setBalance(data); },
        () => {},
      );
    }
    return () => { cancelled = true; };
  }, [tokensRevealed]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const navLinks = (onClick?: () => void) => (
    <>
      <Link
        to="/curriculum"
        className="text-sm font-medium text-gray-600 transition-colors hover:text-primary dark:text-warm-200 dark:hover:text-teal-400"
        onClick={onClick}
      >
        {t("labels.curriculum")}
      </Link>
      <Link
        to="/leaderboard"
        className="text-sm font-medium text-gray-600 transition-colors hover:text-primary dark:text-warm-200 dark:hover:text-teal-400"
        onClick={onClick}
      >
        {t("labels.leaderboard")}
      </Link>
      <Link
        to="/achievements"
        className="text-sm font-medium text-gray-600 transition-colors hover:text-primary dark:text-warm-200 dark:hover:text-teal-400"
        onClick={onClick}
      >
        {t("labels.achievements")}
      </Link>
      {walletRevealed && (
        <Link
          to="/dashboard"
          className="text-sm font-medium text-gray-600 transition-colors hover:text-primary dark:text-warm-200 dark:hover:text-teal-400"
          onClick={onClick}
        >
          {t("labels.wallet")}
        </Link>
      )}
      <Link
        to="/friends"
        className="text-sm font-medium text-gray-600 transition-colors hover:text-primary dark:text-warm-200 dark:hover:text-teal-400"
        onClick={onClick}
      >
        {t("labels.friends")}
      </Link>
      <Link
        to="/glossary"
        className="text-sm font-medium text-gray-600 transition-colors hover:text-primary dark:text-warm-200 dark:hover:text-teal-400"
        onClick={onClick}
      >
        {t("labels.glossary")}
      </Link>
    </>
  );

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-background)]">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-warm-700/50 dark:bg-warm-900/80">
        <div className="mx-auto flex h-14 max-w-5xl items-center px-4">
          <Link
            to="/home"
            className="flex shrink-0 items-center gap-2 text-lg font-bold font-heading"
          >
            <img src="/blocky-logo.svg" alt="" className="h-8 w-8 rounded" />
            <span>
              <span className="text-primary dark:text-teal-400">Unblock</span>
              <span className="text-amber-500">.chain</span>
            </span>
          </Link>

          {/* Spacer — min-w ensures brand and nav never overlap */}
          <div className="min-w-8 flex-1" />

          {/* Desktop nav */}
          <nav className="hidden items-center gap-2 lg:flex">
            {navLinks()}

            {/* Streak + Tokens in nav */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4 dark:border-warm-700">
              {streak && <StreakWidget streak={streak} compact />}
              {balance && <TokenBalanceDisplay balance={balance} compact />}
            </div>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-4 dark:border-warm-700">
              <ThemeToggle />
              <LanguageSwitcher variant="pill" />
              <NotificationBell />
              <Link
                to="/profile"
                className="text-sm font-medium text-gray-600 hover:text-primary dark:text-warm-200 dark:hover:text-teal-400"
              >
                {user?.displayName || user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600 dark:text-warm-200"
              >
                {t("labels.logout")}
              </button>
            </div>
          </nav>

          {/* Mobile: streak + tokens + hamburger */}
          <div className="flex items-center gap-2 lg:hidden">
            <div className="hidden items-center gap-2 sm:flex">
              {streak && <StreakWidget streak={streak} compact />}
              {balance && <TokenBalanceDisplay balance={balance} compact />}
            </div>
            <NotificationBell />
            <button
              className="p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t("labels.toggleMenu")}
            >
              {menuOpen ? (
                <X className="h-6 w-6 text-[var(--color-text-muted)]" />
              ) : (
                <Menu className="h-6 w-6 text-[var(--color-text-muted)]" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="animate-fade-in-up border-t border-gray-100 bg-white px-4 py-3 lg:hidden dark:border-warm-700 dark:bg-warm-900">
            <div className="flex flex-col gap-3">
              {navLinks(() => setMenuOpen(false))}
              <Link
                to="/profile"
                className="text-sm font-medium text-gray-600 hover:text-primary dark:text-warm-200 dark:hover:text-teal-400"
                onClick={() => setMenuOpen(false)}
              >
                {t("labels.profile")}
              </Link>
              <div className="flex items-center gap-2 border-t border-gray-100 pt-3 dark:border-warm-700">
                <ThemeToggle />
                <LanguageSwitcher variant="menu-item" />
              </div>
              <button
                onClick={handleLogout}
                className="text-left text-sm text-red-600 dark:text-red-400"
              >
                {t("labels.logout")}
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 animate-fade-in-up">
        <Outlet />
      </main>

      <footer className="border-t border-[var(--color-border)] py-4 text-center text-xs text-[var(--color-text-muted)]">
        <Link to="/privacy-policy" className="underline decoration-[var(--color-border)] underline-offset-2 transition-colors hover:text-[var(--color-primary)]">{t("footer.privacy")}</Link>
        <span className="mx-2">·</span>
        <Link to="/terms-of-service" className="underline decoration-[var(--color-border)] underline-offset-2 transition-colors hover:text-[var(--color-primary)]">{t("footer.terms")}</Link>
      </footer>
    </div>
  );
}
