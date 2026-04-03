# UI Visual Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform the Transcendence UI from functional-basic to production-grade with dark mode, CSS animations, glassmorphism, and mouse-follow card glow — zero new npm dependencies.

**Architecture:** Add a ThemeContext + `dark:` class strategy on `<html>`. All visual changes are additive CSS/Tailwind classes. One new hook (`useMouse`) for card glow. No component API changes, no logic changes, no layout changes.

**Tech Stack:** React 19, Tailwind 4, Vite 7, Lucide icons (already installed).

---

### Task 1: Add CSS keyframes and utility classes to index.css

**Files:**
- Modify: `apps/web/src/index.css`

**Step 1: Add dark mode color tokens and keyframes after the existing `@theme` block**

Add to `index.css` after line 64 (end of `@theme`):

```css
/* Dark mode overrides */
.dark {
  --color-background: var(--color-warm-900);
  --color-surface: var(--color-warm-800);
  --color-text: var(--color-warm-50);
  --color-text-muted: var(--color-warm-400);
  --color-border: var(--color-warm-700);
}

/* Animation keyframes */
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes shimmer {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(200%);
  }
}

@keyframes pulse-glow {
  0%, 100% {
    filter: drop-shadow(0 0 4px rgba(249, 115, 22, 0.4));
  }
  50% {
    filter: drop-shadow(0 0 12px rgba(249, 115, 22, 0.8));
  }
}

/* Utility classes */
.animate-fade-in-up {
  animation: fade-in-up 0.3s ease-out both;
}

.animate-shimmer {
  animation: shimmer 2s infinite;
}

.animate-pulse-glow {
  animation: pulse-glow 2s ease-in-out infinite;
}
```

**Step 2: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add apps/web/src/index.css
git commit -m "feat: add dark mode CSS tokens, animation keyframes and utility classes"
```

---

### Task 2: Create ThemeContext and ThemeToggle

**Files:**
- Create: `apps/web/src/contexts/ThemeContext.tsx`
- Create: `apps/web/src/components/ThemeToggle.tsx`
- Modify: `apps/web/src/main.tsx`

**Step 1: Create ThemeContext**

```tsx
// apps/web/src/contexts/ThemeContext.tsx
import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem("transcendence-theme");
    if (stored === "dark" || stored === "light") return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("transcendence-theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "dark" ? "light" : "dark"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
```

**Step 2: Create ThemeToggle component**

```tsx
// apps/web/src/components/ThemeToggle.tsx
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContext.js";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-warm-400 dark:hover:bg-warm-700 dark:hover:text-warm-200"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <Sun className="h-5 w-5" />
      ) : (
        <Moon className="h-5 w-5" />
      )}
    </button>
  );
}
```

**Step 3: Wrap app with ThemeProvider in main.tsx**

In `apps/web/src/main.tsx`, import `ThemeProvider` and wrap the app tree (inside BrowserRouter, wrapping all routes).

**Step 4: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 5: Commit**

```bash
git add apps/web/src/contexts/ThemeContext.tsx apps/web/src/components/ThemeToggle.tsx apps/web/src/main.tsx
git commit -m "feat: add dark/light theme system with ThemeContext and ThemeToggle"
```

---

### Task 3: Create useMouse hook for card glow effect

**Files:**
- Create: `apps/web/src/hooks/useMouse.ts`

**Step 1: Create the hook**

```tsx
// apps/web/src/hooks/useMouse.ts
import { useState, useRef, useEffect } from "react";

interface MousePosition {
  x: number | null;
  y: number | null;
}

export function useMouse<T extends HTMLElement = HTMLDivElement>() {
  const [mouse, setMouse] = useState<MousePosition>({ x: null, y: null });
  const ref = useRef<T>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      setMouse({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    };

    const handleLeave = () => setMouse({ x: null, y: null });

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return { mouse, ref };
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/useMouse.ts
git commit -m "feat: add useMouse hook for card glow effect"
```

---

### Task 4: Upgrade UI primitives (Button, Card, Input, Alert, ProgressBar, LoadingSpinner, FormField)

**Files:**
- Modify: `apps/web/src/components/ui/Button.tsx`
- Modify: `apps/web/src/components/ui/Card.tsx`
- Modify: `apps/web/src/components/ui/Input.tsx`
- Modify: `apps/web/src/components/ui/Alert.tsx`
- Modify: `apps/web/src/components/ui/ProgressBar.tsx`
- Modify: `apps/web/src/components/ui/LoadingSpinner.tsx`
- Modify: `apps/web/src/components/ui/FormField.tsx`

**Step 1: Upgrade Button.tsx**

Replace `variantClasses`:
```tsx
const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-primary to-teal-500 text-white hover:shadow-md hover:shadow-primary/25 focus-visible:ring-primary/50",
  secondary:
    "bg-secondary text-white hover:bg-secondary/90 hover:shadow-md hover:shadow-secondary/25 focus-visible:ring-secondary/50",
  danger:
    "bg-red-600 text-white hover:bg-red-700 hover:shadow-md focus-visible:ring-red-500/50",
  ghost:
    "bg-transparent text-gray-700 dark:text-warm-300 hover:bg-gray-100 dark:hover:bg-warm-700 focus-visible:ring-gray-300",
};
```

Update the className in the `<button>` element to add `transition-all duration-150`.

**Step 2: Upgrade Card.tsx with mouse-follow glow**

```tsx
import { type ReactNode } from "react";
import { useMouse } from "../../hooks/useMouse.js";

interface CardProps {
  children: ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className = "", glow = true }: CardProps) {
  const { mouse, ref } = useMouse<HTMLDivElement>();
  const showGlow = glow && mouse.x !== null && mouse.y !== null;

  return (
    <div
      ref={ref}
      className={`group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg dark:border-warm-700 dark:bg-warm-800 ${className}`}
    >
      {showGlow && (
        <div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          style={{
            width: 300,
            height: 300,
            left: mouse.x!,
            top: mouse.y!,
            background: "radial-gradient(circle, rgba(43,158,158,0.12) 0%, transparent 70%)",
          }}
        />
      )}
      <div className="relative">{children}</div>
    </div>
  );
}
```

**Step 3: Upgrade Input.tsx**

Add dark mode classes:
```tsx
className={`w-full rounded-lg border bg-white px-3 py-2.5 text-sm transition-all placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-warm-800 dark:text-warm-50 dark:placeholder:text-warm-500 ${
  error
    ? "border-red-500 focus:ring-red-500/50"
    : "border-gray-300 hover:border-gray-400 dark:border-warm-600 dark:hover:border-warm-500"
} ${className}`}
```

**Step 4: Upgrade Alert.tsx**

```tsx
const variantClasses: Record<AlertVariant, string> = {
  success: "bg-green-50 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800",
  error: "bg-red-50 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800",
  info: "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800",
};
```

**Step 5: Upgrade ProgressBar.tsx with gradient + shimmer**

```tsx
export function ProgressBar({
  value,
  max = 100,
  className = "",
  showLabel = false,
}: ProgressBarProps) {
  const percentage = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-warm-700">
        <div
          className="relative h-full overflow-hidden rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500"
          style={{ width: `${percentage}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500 dark:text-warm-400">{percentage}%</span>
      )}
    </div>
  );
}
```

**Step 6: Upgrade LoadingSpinner.tsx**

Add dark mode text color:
```tsx
className={`animate-spin text-primary dark:text-teal-400 ${sizeClasses[size]}`}
```

**Step 7: Upgrade FormField.tsx**

```tsx
<label
  htmlFor={htmlFor}
  className="block text-sm font-medium text-gray-700 dark:text-warm-300"
>
```
And error text:
```tsx
{error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
```

**Step 8: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 9: Commit**

```bash
git add apps/web/src/components/ui/
git commit -m "feat: upgrade UI primitives with dark mode, animations, card glow"
```

---

### Task 5: Upgrade layouts (AppLayout + AuthLayout)

**Files:**
- Modify: `apps/web/src/layouts/AppLayout.tsx`
- Modify: `apps/web/src/layouts/AuthLayout.tsx`

**Step 1: Upgrade AppLayout.tsx**

Key changes:
- Import `ThemeToggle`
- Root div: `bg-gray-50` -> `bg-gray-50 dark:bg-warm-900`
- Header: `border-b border-gray-200 bg-white` -> `border-b border-gray-200/50 bg-white/80 backdrop-blur-md dark:border-warm-700/50 dark:bg-warm-900/80`
- Logo: add `dark:text-teal-400`
- Nav links: add `dark:text-warm-300 dark:hover:text-teal-400`
- Divider borders: add `dark:border-warm-700`
- Add `<ThemeToggle />` next to `<LanguageSwitcher />` in desktop nav
- Add `<ThemeToggle />` in mobile menu
- Profile/logout links: add dark mode colors
- Mobile menu container: add `dark:bg-warm-900 dark:border-warm-700`
- Page content: add `animate-fade-in-up` to `<main>` inner content

**Step 2: Upgrade AuthLayout.tsx**

```tsx
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
        Transcendence
      </Link>
      <div className="w-full max-w-md animate-fade-in-up">
        <Outlet />
      </div>
    </div>
  );
}
```

**Step 3: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 4: Commit**

```bash
git add apps/web/src/layouts/
git commit -m "feat: glassmorphism navbar, dark mode layouts, fade-in animations"
```

---

### Task 6: Upgrade components (StreakWidget, AchievementCard, TokenBalance, NotificationBell)

**Files:**
- Modify: `apps/web/src/components/StreakWidget.tsx`
- Modify: `apps/web/src/components/AchievementCard.tsx`
- Modify: `apps/web/src/components/TokenBalance.tsx`
- Modify: `apps/web/src/components/NotificationBell.tsx`

**Step 1: Upgrade StreakWidget.tsx**

- Compact flame: add `animate-pulse-glow` when `streak.currentStreak > 0`
- Full widget: add dark mode: `border-gray-200 bg-white` -> `border-gray-200 bg-white dark:border-warm-700 dark:bg-warm-800`
- Text colors: add dark variants
- Flame circle: `bg-orange-100` -> `bg-orange-100 dark:bg-orange-900/30`

**Step 2: Upgrade AchievementCard.tsx**

- Earned state: add ping dot indicator
- Add shimmer sweep on earned card background
- Dark mode: earned `border-amber-200 bg-amber-50/50` -> add `dark:border-amber-700/30 dark:bg-amber-900/20`
- Dark mode: locked `border-gray-200 bg-gray-50` -> add `dark:border-warm-700 dark:bg-warm-800`
- Earned circle: `bg-amber-100` -> add `dark:bg-amber-900/40`
- Text colors: add dark variants

For the ping dot, add inside the earned icon container:
```tsx
{isEarned && (
  <span className="absolute -right-0.5 -top-0.5 flex h-2.5 w-2.5">
    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500" />
  </span>
)}
```

**Step 3: Upgrade TokenBalance.tsx**

- Compact: `text-gray-700` -> `text-gray-700 dark:text-warm-300`
- Full widget border/bg: add dark mode classes
- All text colors: add dark variants
- Border-t: `border-gray-100` -> `border-gray-100 dark:border-warm-700`

**Step 4: Upgrade NotificationBell.tsx**

- Button: `text-gray-500 hover:text-gray-700` -> add `dark:text-warm-400 dark:hover:text-warm-200`
- Dropdown: `border-gray-200 bg-white shadow-lg` -> add `dark:border-warm-700 dark:bg-warm-800`
- Inner borders, text colors: add dark variants
- Hover states: `hover:bg-gray-50` -> add `dark:hover:bg-warm-700`
- Unread bg: `bg-blue-50/50` -> add `dark:bg-blue-900/20`

**Step 5: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 6: Commit**

```bash
git add apps/web/src/components/StreakWidget.tsx apps/web/src/components/AchievementCard.tsx apps/web/src/components/TokenBalance.tsx apps/web/src/components/NotificationBell.tsx
git commit -m "feat: dark mode + animations for streak, achievements, tokens, notifications"
```

---

### Task 7: Upgrade Landing page with hero gradient

**Files:**
- Modify: `apps/web/src/pages/Landing.tsx`

**Step 1: Redesign Landing.tsx**

```tsx
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
        <Link to="/privacy-policy" className="hover:text-primary transition-colors">
          {t("pages.landing.privacyPolicy")}
        </Link>
        <Link to="/terms-of-service" className="hover:text-primary transition-colors">
          {t("pages.landing.termsOfService")}
        </Link>
      </nav>
    </div>
  );
}
```

**Step 2: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 3: Commit**

```bash
git add apps/web/src/pages/Landing.tsx
git commit -m "feat: hero gradient landing page with radial accent and dark mode"
```

---

### Task 8: Upgrade auth pages (LoginPage, RegisterPage)

**Files:**
- Modify: `apps/web/src/pages/LoginPage.tsx`
- Modify: `apps/web/src/pages/RegisterPage.tsx`

**Step 1: Upgrade LoginPage.tsx dark mode**

Add dark variants to all hardcoded grays:
- `text-gray-900` -> `text-gray-900 dark:text-warm-50`
- `text-gray-500` -> `text-gray-500 dark:text-warm-400`
- Links: add `dark:text-teal-400 dark:hover:text-teal-300`
- Checkbox (in 2FA): add dark mode border

**Step 2: Upgrade RegisterPage.tsx dark mode**

Same pattern as LoginPage:
- `text-gray-900` -> `text-gray-900 dark:text-warm-50`
- `text-gray-600` (age confirm label) -> add `dark:text-warm-300`
- `text-gray-500` -> `text-gray-500 dark:text-warm-400`
- `border-gray-300` (checkbox) -> add `dark:border-warm-600`
- Links: add `dark:text-teal-400`

**Step 3: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 4: Commit**

```bash
git add apps/web/src/pages/LoginPage.tsx apps/web/src/pages/RegisterPage.tsx
git commit -m "feat: dark mode for login and register pages"
```

---

### Task 9: Upgrade app pages (HomePage, DashboardPage)

**Files:**
- Modify: `apps/web/src/pages/HomePage.tsx`
- Modify: `apps/web/src/pages/DashboardPage.tsx`

**Step 1: Upgrade HomePage.tsx**

- Wrap content in `<div className="animate-fade-in-up">`
- `text-gray-900` -> `text-gray-900 dark:text-warm-50`
- `text-gray-500` -> `text-gray-500 dark:text-warm-400`
- `text-gray-400` -> `text-gray-400 dark:text-warm-500`

**Step 2: Upgrade DashboardPage.tsx**

- Wrap content in `<div className="animate-fade-in-up">`
- All `text-gray-*` get `dark:text-warm-*` variants
- Learning chain blocks: `border-primary/20 bg-primary/5` -> add `dark:border-primary/30 dark:bg-primary/10`
- Transaction dividers: `divide-gray-100` -> `divide-gray-100 dark:divide-warm-700`
- Transaction text colors: add dark variants
- Earn/spend colors: keep green-600/red-500 (they work on both themes)

**Step 3: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 4: Commit**

```bash
git add apps/web/src/pages/HomePage.tsx apps/web/src/pages/DashboardPage.tsx
git commit -m "feat: dark mode + fade-in for home and dashboard pages"
```

---

### Task 10: Upgrade remaining pages (Curriculum, Leaderboard, Achievements, Profile, Settings, NotFound)

**Files:**
- Modify: `apps/web/src/pages/CurriculumPage.tsx`
- Modify: `apps/web/src/pages/LeaderboardPage.tsx`
- Modify: `apps/web/src/pages/AchievementsPage.tsx`
- Modify: `apps/web/src/pages/ProfilePage.tsx`
- Modify: `apps/web/src/pages/Settings.tsx`
- Modify: `apps/web/src/pages/NotFound.tsx`

**Step 1: CurriculumPage.tsx**

- All headings: add `dark:text-warm-50`
- All `text-gray-500/400`: add `dark:text-warm-400/500`
- MissionNode borders/backgrounds: add dark variants
  - locked: `border-gray-100 bg-gray-50 text-gray-400` -> add `dark:border-warm-700 dark:bg-warm-800 dark:text-warm-500`
  - completed: `border-green-100 bg-green-50/50` -> add `dark:border-green-800 dark:bg-green-900/20`
  - available: `border-primary/20 bg-white hover:border-primary/40` -> add `dark:bg-warm-800`
- ChapterSection: `border-gray-200 bg-white` -> add `dark:border-warm-700 dark:bg-warm-800`
- Inner borders: `border-gray-100` -> add `dark:border-warm-700`

**Step 2: LeaderboardPage.tsx**

- Headings: add `dark:text-warm-50`
- Current user card already uses Card component (inherits dark mode)
- Rank badges: `bg-gray-100 text-gray-500` -> add `dark:bg-warm-700 dark:text-warm-400`
- Avatar fallback: `bg-gray-200 text-gray-500` -> add `dark:bg-warm-700 dark:text-warm-400`
- Entry text: add dark variants
- Dividers: `divide-gray-100` -> add `dark:divide-warm-700`
- Pagination: `border-gray-100` -> add `dark:border-warm-700`
- Current user highlight: `bg-primary/5` -> works on both

**Step 3: AchievementsPage.tsx**

- Heading + subtitle: add dark text variants
- Cards inherit from AchievementCard (already upgraded in Task 6)

**Step 4: ProfilePage.tsx**

- Heading and form labels: add dark text variants
- Card components inherit dark mode
- All form inputs inherit from Input (already upgraded)

**Step 5: Settings.tsx**

- Settings already uses CSS variables — it will inherit dark mode from the `.dark` class CSS override added in Task 1
- No changes needed if using `var(--color-*)` tokens

**Step 6: NotFound.tsx**

```tsx
<div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-warm-900">
  <h1 className="mb-4 text-3xl font-bold text-gray-900 dark:text-warm-50">{t("errors.notFound")}</h1>
  <p className="mb-6 text-gray-500 dark:text-warm-400">
    {t("pages.notFound.body")}
  </p>
  <Link to="/">
    <Button variant="ghost">{t("pages.notFound.backHome")}</Button>
  </Link>
</div>
```

**Step 7: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 8: Commit**

```bash
git add apps/web/src/pages/CurriculumPage.tsx apps/web/src/pages/LeaderboardPage.tsx apps/web/src/pages/AchievementsPage.tsx apps/web/src/pages/ProfilePage.tsx apps/web/src/pages/Settings.tsx apps/web/src/pages/NotFound.tsx
git commit -m "feat: dark mode for curriculum, leaderboard, achievements, profile, settings, 404"
```

---

### Task 11: Upgrade StatusBadge and ExerciseTypeBadge

**Files:**
- Modify: `apps/web/src/components/ui/StatusBadge.tsx`
- Modify: `apps/web/src/components/ui/ExerciseTypeBadge.tsx`

**Step 1: Add dark mode to both badge components**

For each status/type color, add `dark:` variant that works on dark backgrounds. Keep the same color hues, just adjust for dark backgrounds (e.g., `bg-green-100 text-green-700` -> add `dark:bg-green-900/30 dark:text-green-300`).

**Step 2: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 3: Commit**

```bash
git add apps/web/src/components/ui/StatusBadge.tsx apps/web/src/components/ui/ExerciseTypeBadge.tsx
git commit -m "feat: dark mode for status and exercise type badges"
```

---

### Task 12: Upgrade LanguageSwitcher

**Files:**
- Modify: `apps/web/src/components/LanguageSwitcher.tsx`

**Step 1: Add dark mode classes**

Add dark variants to all color classes in both `pill` and `menu-item` variants. Buttons, dropdowns, hover states, borders.

**Step 2: Verify build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`

**Step 3: Commit**

```bash
git add apps/web/src/components/LanguageSwitcher.tsx
git commit -m "feat: dark mode for language switcher"
```

---

### Task 13: Final visual QA and build verification

**Step 1: Full build**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm build`
Expected: Clean build, no errors.

**Step 2: Run tests**

Run: `cd ~/Documents/TRANSCENDANCE/transcendence && pnpm test`
Expected: All existing tests pass (we changed no logic).

**Step 3: Visual review**

Start dev server and check:
- Landing page: gradient hero, glowing CTA, dark mode toggle
- Login/Register: dark mode, card glow on hover
- Home/Dashboard: fade-in animation, dark mode
- Curriculum: expandable sections, dark mode
- Leaderboard: card glow, dark mode
- Toggle between light/dark mode on every page

**Step 4: Final commit if any fixes needed**

```bash
git commit -m "fix: visual QA adjustments"
```
