import { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.js";
import { useReveals } from "../contexts/RevealContext.js";
import { StreakWidget } from "../components/StreakWidget.js";
import { TokenBalanceDisplay } from "../components/TokenBalance.js";
import type { StreakStatus, TokenBalance } from "@transcendence/shared";
import { gamificationApi } from "../api/gamification.js";
import { tokensApi } from "../api/tokens.js";
import { NotificationBell } from "../components/NotificationBell.js";

export function AppLayout() {
  const { user, logout } = useAuth();
  const { tokensRevealed, dashboardRevealed } = useReveals();
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
        to="/home"
        className="text-sm font-medium text-gray-600 hover:text-primary"
        onClick={onClick}
      >
        Home
      </Link>
      <Link
        to="/curriculum"
        className="text-sm font-medium text-gray-600 hover:text-primary"
        onClick={onClick}
      >
        Curriculum
      </Link>
      <Link
        to="/leaderboard"
        className="text-sm font-medium text-gray-600 hover:text-primary"
        onClick={onClick}
      >
        Leaderboard
      </Link>
      <Link
        to="/achievements"
        className="text-sm font-medium text-gray-600 hover:text-primary"
        onClick={onClick}
      >
        Achievements
      </Link>
      {dashboardRevealed && (
        <Link
          to="/dashboard"
          className="text-sm font-medium text-gray-600 hover:text-primary"
          onClick={onClick}
        >
          Dashboard
        </Link>
      )}
      <Link
        to="/friends"
        className="text-sm font-medium text-gray-600 hover:text-primary"
        onClick={onClick}
      >
        Friends
      </Link>
      <Link
        to="/glossary"
        className="text-sm font-medium text-gray-600 hover:text-primary"
        onClick={onClick}
      >
        Glossary
      </Link>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link
            to="/home"
            className="text-lg font-bold text-primary font-heading"
          >
            Transcendence
          </Link>

          {/* Desktop nav */}
          <nav className="hidden items-center gap-5 md:flex">
            {navLinks()}

            {/* Streak + Tokens in nav */}
            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              {streak && <StreakWidget streak={streak} compact />}
              {balance && <TokenBalanceDisplay balance={balance} compact />}
            </div>

            <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
              <NotificationBell />
              <Link
                to="/profile"
                className="text-sm font-medium text-gray-600 hover:text-primary"
              >
                {user?.displayName || user?.email}
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Logout
              </button>
            </div>
          </nav>

          {/* Mobile: streak + tokens + hamburger */}
          <div className="flex items-center gap-3 md:hidden">
            {streak && <StreakWidget streak={streak} compact />}
            {balance && <TokenBalanceDisplay balance={balance} compact />}
            <NotificationBell />
            <button
              className="p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <svg
                className="h-6 w-6 text-gray-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                {menuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <nav className="border-t border-gray-100 bg-white px-4 py-3 md:hidden">
            <div className="flex flex-col gap-3">
              {navLinks(() => setMenuOpen(false))}
              <Link
                to="/profile"
                className="text-sm font-medium text-gray-600 hover:text-primary"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
              <button
                onClick={handleLogout}
                className="text-left text-sm text-red-600"
              >
                Logout
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
