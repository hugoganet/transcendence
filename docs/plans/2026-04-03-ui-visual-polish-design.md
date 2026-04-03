# UI Visual Polish Design — Approach B

**Branch:** `arthur-test-front`
**Date:** 2026-04-03
**Goal:** Transform the functional-but-basic UI into a production-grade, modern interface that impresses 42 evaluators and looks startup-ready.
**Constraints:** Zero new npm dependencies. CSS-only animations. No structural/layout changes. No logic changes.

---

## 1. Dark Mode Foundation

### Theme System
- New `ThemeContext.tsx` — stores `light`/`dark` in state + `localStorage`
- Toggles `dark` class on `<html>` element (Tailwind `dark:` strategy)
- New `ThemeToggle.tsx` — sun/moon icon button, placed in navbar next to LanguageSwitcher

### Color Mapping in `index.css`
- Light mode: current palette (warm-50 bg, white surfaces)
- Dark mode additions:
  - Background: `warm-900`
  - Surfaces: `warm-800`
  - Text: `warm-50` / `warm-300`
  - Borders: `warm-700`
  - Primary teal + secondary amber: unchanged (they pop on both)

### Migration Pattern
Replace all hardcoded grays with `dark:` variants across every file:
- `bg-gray-50` -> `bg-gray-50 dark:bg-warm-900`
- `bg-white` -> `bg-white dark:bg-warm-800`
- `text-gray-900` -> `text-gray-900 dark:text-warm-50`
- `border-gray-200` -> `border-gray-200 dark:border-warm-700`
- `text-gray-600` -> `text-gray-600 dark:text-warm-300`
- `text-gray-500` -> `text-gray-500 dark:text-warm-400`
- `text-gray-400` -> `text-gray-400 dark:text-warm-500`

## 2. CSS Animations & Keyframes

### Global Keyframes (in `index.css`)

```css
@keyframes fade-in-up {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 4px rgba(249, 115, 22, 0.4); }
  50% { box-shadow: 0 0 12px rgba(249, 115, 22, 0.8); }
}
```

### Utility Classes
```css
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

### Applied Where
- Page content wrappers: `animate-fade-in-up`
- Mobile menu: `animate-fade-in-up` instead of instant toggle
- Card hover: `transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5`
- Button primary hover: `hover:shadow-md hover:shadow-primary/25`
- Nav links: `transition-colors duration-150`
- ProgressBar fill: shimmer overlay
- StreakWidget flame: `animate-pulse-glow` when streak > 0
- AchievementCard earned: ping dot animation

## 3. Component Visual Upgrades

### Landing Page (`Landing.tsx`)
- Full-viewport gradient hero: `bg-gradient-to-b from-teal-900 via-warm-900 to-warm-800` (dark feel)
- Light mode variant: `from-teal-50 via-white to-warm-50`
- Radial accent shape (CSS pseudo-element or div) for depth
- White/light text on dark hero
- Glowing CTA button: `shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40`

### Navbar (`AppLayout.tsx`)
- Glassmorphism: `bg-white/80 backdrop-blur-md dark:bg-warm-900/80`
- Border: `border-b border-gray-200/50 dark:border-warm-700/50`
- Sticky behavior already exists, just needs the glass effect

### Card (`Card.tsx`)
- Mouse-follow glow effect via `useMouse` hook
- Radial gradient mask follows cursor position
- Subtle multi-color gradient on hover (teal -> amber sweep)
- Dark mode: `bg-warm-800 border-warm-700`

### Button (`Button.tsx`)
- Primary: subtle gradient `bg-gradient-to-r from-primary to-teal-500`
- Hover: `hover:shadow-md hover:shadow-primary/25`
- All variants: `transition-all duration-150`

### StreakWidget (`StreakWidget.tsx`)
- Flame icon gets `animate-pulse-glow` when streak > 0
- Background: subtle orange gradient on the circle
- Dark mode colors

### AchievementCard (`AchievementCard.tsx`)
- Earned: animated ping dot (CSS `animate-ping`) on amber color
- Shimmer sweep on the card background for earned achievements
- Dark mode: `bg-amber-900/20 border-amber-700/30`

### ProgressBar (`ProgressBar.tsx`)
- Fill: `bg-gradient-to-r from-teal-400 to-teal-600`
- Shimmer overlay via pseudo-element
- Dark mode track: `bg-warm-700`

### LoadingSpinner (`LoadingSpinner.tsx`)
- Add skeleton variant option for Dashboard/Home loading states
- Skeleton: `bg-gray-200 dark:bg-warm-700 animate-pulse rounded-lg`

### Input (`Input.tsx`)
- Focus ring: `focus:ring-2 focus:ring-primary/30 focus:border-primary`
- Dark mode: `bg-warm-800 border-warm-600 text-warm-50`

### Alert (`Alert.tsx`)
- Dark mode variants for error/success/info states

## 4. New Files

| File | Purpose |
|------|---------|
| `contexts/ThemeContext.tsx` | Theme state + localStorage persistence + toggle |
| `components/ThemeToggle.tsx` | Sun/moon toggle button |
| `hooks/useMouse.ts` | Mouse position tracker for card glow effect |

## 5. Files Modified (~25)

| Layer | Files |
|-------|-------|
| Styles | `index.css` |
| Layouts | `AppLayout.tsx`, `AuthLayout.tsx` |
| UI primitives | `Button.tsx`, `Card.tsx`, `Input.tsx`, `Alert.tsx`, `ProgressBar.tsx`, `LoadingSpinner.tsx`, `FormField.tsx`, `StatusBadge.tsx`, `ExerciseTypeBadge.tsx` |
| Components | `StreakWidget.tsx`, `AchievementCard.tsx`, `TokenBalance.tsx`, `NotificationBell.tsx`, `LanguageSwitcher.tsx` |
| Pages | `Landing.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `HomePage.tsx`, `DashboardPage.tsx`, `CurriculumPage.tsx`, `LeaderboardPage.tsx`, `AchievementsPage.tsx`, `ProfilePage.tsx`, `Settings.tsx`, `NotFound.tsx` |

## 6. What We DON'T Change

- No structural/layout changes (top nav stays top nav)
- No new npm dependencies
- No component API changes (props stay the same)
- No logic changes — pure visual layer
- No i18n key changes
- No router changes

## 7. Inspiration Sources (from 21st.dev research)

- **Mouse-follow card glow**: Adapted from "Animated Card" component (pure JS + CSS, no Framer Motion)
- **Hero gradient + radial accent**: From Hero section patterns
- **Glassmorphism navbar**: `backdrop-blur-md bg-white/80` pattern
- **Ping dot badges**: From "Animated Badge" component
- **Gradient progress bar + shimmer**: From "Progress Bar" component
