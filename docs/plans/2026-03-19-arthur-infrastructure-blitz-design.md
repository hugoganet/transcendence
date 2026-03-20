# Arthur Infrastructure Blitz — Design Document

*Date: 2026-03-19*
*Author: Arthur Nebbou*
*Branch: `feat/arthur-content-curriculum`*

## Goal

Advance the Transcendence project across infrastructure, backend, shared packages, testing, and CI/CD — without touching JB's frontend components/pages (`apps/web/src/pages/`, `apps/web/src/components/`).

## Workstreams

### WS1: Emails 5-7 + FR Copy (Backend)

Add 3 missing email functions to `apps/api/src/services/emailService.ts`:
- `sendStreakReminderEmail(to, locale, streakCount)` — EN + FR
- `sendAchievementEmail(to, locale, achievementTitle)` — EN + FR
- `sendCompletionEmail(to, locale, displayName)` — EN + FR

Add French copy to existing emails 1-4 (password reset, GDPR export, GDPR delete, re-engagement) using copy from `docs/email-copy-spec.md`.

Unit tests for all new functions in `emailService.test.ts`.

### WS2: Shared Zod Schemas + API Response Types

Extend `packages/shared/src/schemas/` with frontend-facing schemas:
- `auth.ts` — register, login, 2FA verify request/response shapes
- `curriculum.ts` — curriculum tree response, mission detail response
- `exercise.ts` — submission request per exercise type, feedback response
- `token.ts` — balance response, transaction history response
- `gamification.ts` — streak, achievements, leaderboard responses
- `social.ts` — friend list, public profile, certificate responses
- `notification.ts` — notification list, preferences
- `user.ts` — profile update request, reveals response

Export all from `packages/shared/src/index.ts`.

### WS3: i18n Infrastructure

In `apps/web/`:
- Install `react-i18next`, `i18next`, `i18next-browser-languagedetector`
- Create `src/i18n.ts` config with EN/FR namespaces
- Generate `public/locales/{en,fr}/translation.json` from `content/{en,fr}/ui.json`
- Create `src/hooks/useLocale.ts` helper hook

Does NOT touch existing pages/components — just adds the plumbing.

### WS4: Playwright E2E Test Infrastructure

At repo root:
- Install `@playwright/test`
- Create `playwright.config.ts` (Chrome, Firefox, Safari)
- Create `e2e/fixtures/` with auth helpers (login, register)
- Create `e2e/api-smoke.spec.ts` — health check, curriculum endpoint, auth flow
- Create `e2e/README.md` with instructions

### WS5: Content Validation Scripts

Create `scripts/validate-content.ts`:
- All mission IDs in `content/{locale}/missions.json` match `structure.json`
- EN/FR parity (same keys, same count)
- Tooltip triggers reference valid tooltip terms
- Exercise type distribution matches curriculum roadmap
- Runnable via `pnpm validate:content`

### WS6: CI/CD Pipeline (GitHub Actions)

Create `.github/workflows/ci.yml`:
- Lint + typecheck on PR
- Unit tests (api + web)
- Content validation
- Integration tests (with Postgres + Redis services)

### WS7: Design System Tokens (Tailwind Config)

In `apps/web/`:
- Configure Tailwind 4 with UX spec design tokens
- Colors: teal primary (#2B9E9E), amber secondary (#D4A843), warm neutrals
- Typography: Plus Jakarta Sans (headings), Source Sans 3 (body)
- CSS custom properties for theme consistency
- Does NOT create components — just the token foundation

### WS8: Docker Production Build

- Update `docker/web.Dockerfile` for Vite production build
- Ensure `docker compose up` builds and serves frontend correctly
- Verify Nginx proxy configuration for API + Socket.IO

### WS9: API Documentation (OpenAPI)

- Create `apps/api/src/docs/openapi.yaml` with all 30+ endpoints documented
- Request/response shapes, error codes, auth requirements
- Add `swagger-ui-express` at `/api/docs` in development mode

### WS10: UI Copy API Endpoint

Add `GET /api/v1/ui-copy/:locale` route:
- Serves `content/{locale}/ui.json`
- Zod validation for locale parameter
- Response caching headers
- Unit + route tests

## Commit Strategy

Each workstream = 1-2 atomic commits with conventional commit messages.
Target: 15-20 commits total, all on `feat/arthur-content-curriculum`.

## Non-Goals

- No changes to existing backend logic (Hugo's code)
- No changes to `apps/web/src/pages/` or `apps/web/src/components/` (JB's scope)
- No database schema changes
- No breaking changes to existing APIs
