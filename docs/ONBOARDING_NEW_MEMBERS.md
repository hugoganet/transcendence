# Transcendence: New Member Onboarding Guide

Welcome to the Transcendence project. This guide will get you productive within 2 hours.

**TL;DR:** Clone repo → install dependencies → read SECTION 7 (Key Docs) → pick a story → build.

---

## SECTION 1: Project Overview

### What We're Building

Transcendence is a **gamified blockchain literacy platform** inspired by Duolingo. Users learn cryptocurrency, smart contracts, and blockchain concepts through 69 interactive missions across 6 categories and 18 chapters. Completing missions earns tokens, unlocks achievements, builds streaks, and climbs leaderboards.

### Tech Stack

| Layer | Technologies |
|-------|---|
| **Build** | Turborepo 2.8 + pnpm 10.22 |
| **Backend API** | Express 5 + Prisma 7 ORM + PostgreSQL 17 + Redis |
| **Frontend** | React 19 + Vite 7 + Tailwind 4 + Socket.IO (client) |
| **Database** | PostgreSQL 17 + Redis (sessions/cache) |
| **Auth** | Passport.js + express-session + connect-redis + TOTP 2FA |
| **Deployment** | Docker Compose + Nginx reverse proxy + HTTPS |
| **Testing** | Vitest + Playwright + Supertest |
| **Code Quality** | ESLint 9 + Prettier + TypeScript 5.9 |

### Module Points Target

42 ft_transcendence requires **22 module points** (14 required):
- 10 mandatory modules (14 points): setup, auth, API design, testing, security, DB, Docker, frontend, deployment, bonus
- 6 optional modules (8 points): advanced auth, advanced state mgmt, advanced UI, caching, WebSocket, advanced security

All modules are mapped in SECTION 5.

---

## SECTION 2: What's Already Done — By Whom

### Hugo Ganet — Backend & Planning (49 commits, 59,019 lines, Feb 20 – Mar 13)

**Role:** Architect + Backend Lead

**Planning & Design:**
- Product Requirements Document (PRD)
- Full system architecture & component diagrams
- UX flows (onboarding, mission progression, exercise flow)
- Curriculum roadmap (6 categories, 18 chapters, 69 missions)
- Epic breakdown (8 epics × 3-7 stories each)

**Backend Implementation (100% complete):**
- **Epic 1 (6/6):** Monorepo scaffold, Prisma+PostgreSQL migrations (16 files), Express security middleware, Redis session store, Docker Compose (4 services), Nginx HTTPS proxy, Privacy/TOS pages
- **Epic 2 (7/7):** Email/password auth, logout+sessions, OAuth (Google+Facebook), password reset flow, TOTP 2FA, user profiles, disclaimer modals
- **Epic 3 (5/5):** Content loader+Zod validation, curriculum progress API, mission completion tracking, tooltips API, learning chain integrity
- **Epic 4 (1/1):** Exercise submission handler + 4 exercise type feedback engines (SI/CM/IP/ST)
- **Epic 5 (6/6):** Token ledger (gas mechanics), streak tracking, achievement unlocks, leaderboard (top 100), progressive reveal system
- **Epic 6 (4/4):** Friend request/accept/reject, Socket.IO user presence, public profiles, certificate generation
- **Epic 7 (3/3):** Push notifications, re-engagement email (streak reminders), concept refresher system
- **Epic 8 (2/2):** GDPR data export/deletion endpoints, email service abstraction

**Infrastructure & Testing:**
- Docker Compose with PostgreSQL, Redis, Nginx, API services
- 19 Prisma migrations (16 models: User, Mission, Exercise, Token, Achievement, etc.)
- 579 unit tests across all routes + models
- 17 integration test suites (auth, content, gamification, social, notifications)

**Deliverable:** Fully functional backend API (40+ endpoints), documented via OpenAPI spec, ready for frontend integration.

### Arthur (Artnebs) — Content & DevOps (34 commits, 17,969 lines, Mar 16 – Mar 29)

**Role:** Content Lead + DevOps

**Content & Curriculum:**
- **69 missions:** English copy + French translations (complete)
- **40 tooltips:** English + French, with trigger conditions per mission
- **UI copy:** 15 sections (auth, dashboard, missions, exercises, social, settings) in EN+FR
- **Content validation:** Script with 9 automated integrity checks (missing translations, orphaned refs, etc.)

**i18n & Localization:**
- react-i18next setup (namespaces: auth, nav, missions, exercises, settings, tooltips, emails)
- Translation files: EN (403 lines), FR (403 lines), ES (403 lines)
- useLocale hook for client-side locale detection & switching
- UI Copy API endpoint (`/api/content/ui-copy/:section/:lang`) for client access

**Email Service (8 email templates):**
- Welcome (on registration)
- Password reset (with token)
- GDPR export ready notification
- GDPR deletion confirmation
- Streak reminder (sent offline when streak > 3)
- Achievement unlock (on milestone completion)
- Re-engagement (after 7+ days inactive)
- Certificate completion (on final mission)
- All templates in English + French

**Design System & UI Tokens:**
- Tailwind 4 configuration (teal/amber/warm color palettes)
- Typography: Plus Jakarta Sans (headings) + Source Sans 3 (body)
- Component tokens for interactive elements (buttons, cards, forms)

**CI/CD & Testing:**
- GitHub Actions workflow: 5 parallel jobs (lint, type-check, unit test, integration test, build)
- Playwright E2E setup (Chrome, Firefox, Safari targets)
- 5 API smoke tests (auth flow, curriculum load, mission submit, etc.)

**Deployments:**
- Docker image builds (multi-stage, optimized for web+api)
- Nginx config (reverse proxy, HTTPS, gzip compression)
- Environment variable management (Vercel secrets + local .env.example)

**Deliverable:** Complete content, localization pipeline, CI/CD automation, and deployment scaffolding. Backend API is production-ready.

### JB (JBmader) — Frontend Scaffold (2 commits, 5,770 lines, Mar 16–17)

**Role:** Frontend Lead

**Page Components (scaffolds only):**
- 25 page components: Login, Register, Dashboard, Curriculum, Mission, Exercise (all 4 types), Profile, Friends, Notifications, Settings, etc.
- Status: **NOT merged.** Branch: `feat/frontpages`. Not tested, not wired to backend, architecture not reviewed.

**UI Primitives (scaffolds only):**
- 4 exercise type components (SI/CM/IP/ST)
- Common components: AchievementCard, DisclaimerModal, NotificationBell, StreakWidget, TokenBalance, ProgressBar, StatusBadge, LoadingSpinner

**Architecture Scaffolds:**
- AuthContext + useAuth hook
- NotificationContext + useNotification hook
- RevealContext (for progressive disclosure)
- API client layer (TypeScript-typed requests)
- AppLayout wrapper

**Status:** All components are **untested stubs**. No backend API integration. No state wiring. No styling validation. Requires full implementation + review before merge.

---

## SECTION 3: Work Share Summary

| Member | Commits | Lines | % Share | Role |
|--------|---------|-------|---------|------|
| **Hugo** | 49 | 59,019 | 71.3% | Backend, planning, infrastructure |
| **Arthur** | 34 | 17,969 | 21.7% | Content, i18n, DevOps, CI/CD |
| **JB** | 2 | 5,770 | 7.0% | Frontend scaffolds (unmerged) |
| **TOTAL** | 85 | 82,758 | 100% | — |

---

## SECTION 4: What's Left To Do (For New Members)

### Frontend Stories (11 major stories) — ~40% of remaining work

These are the critical path items. Pick one and own it.

| Story ID | Name | Priority | Complexity | Assigned | Description |
|----------|------|----------|-----------|----------|---|
| 2.8 | Auth Frontend | P0 | High | — | Register/login pages, OAuth redirect handlers, 2FA verification step, profile/settings page, password reset flow |
| 3.6 | Curriculum Frontend | P0 | High | — | Curriculum map (tree view), mission list, resume point tracking, mission selection & entry, chapter/category breadcrumbs |
| 4.2 | Interactive Placement (IP) Exercise | P1 | Medium | — | Drag-and-drop UI: place items into categories, validation, feedback display, submit & next |
| 4.3 | Concept Matching (CM) Exercise | P1 | Medium | — | Connect related concepts: draw lines, snap-to-grid, validation, feedback, submit & next |
| 4.4 | Step-by-Step Simulation (SS) Exercise | P1 | Medium | — | Multi-step guided walkthrough (blockchain tx simulation), prev/next buttons, step validation, final feedback |
| 4.5 | Scenario Interpretation (SI) Exercise | P1 | Medium | — | Multiple-choice cards (pick correct answers from scenario), card flips, submit, feedback display |
| 4.6 | ExerciseContainer & Integration | P0 | Medium | — | Route to correct exercise type, pass mission data, capture submission, handle feedback modal, progress tracking |
| 5.7 | Wallet & Gamification Frontend | P1 | High | — | Token balance display, streak widget, achievement cards (grid), leaderboard (top 100), progressive reveal toggles, wallet/inventory modal |
| 6.5 | Social Frontend | P1 | Medium | — | Friends list, add friend (search), public profiles (view stats, certs), certificate viewer, friend activity timeline |
| 7.4 | Engagement Frontend | P1 | Medium | — | Notification bell (dropdown), welcome-back modal, concept refresher modal, break suggestion modal, in-app toast notifications |
| 8.6 | GDPR & Settings Frontend | P1 | Medium | — | Language switcher (EN/FR/ES), notification preferences, data export button, data deletion button with confirmation |

**Notes on 4.2–4.5:** Each exercise type has a unique UI. Use the 4 API response formats from Epic 4 as data contracts. See `apps/api/src/routes/exercises.ts` for submission format.

**Status:** JB's scaffolds in `feat/frontpages` can be rebased, but expect 70% rewrite for real state wiring & styling.

### Backend Gaps (4 minor items) — ~2% of remaining work

| Item | Description | Dependency |
|------|---|---|
| FR48 | Post-module self-assessment GET endpoint | Content feedback loop |
| FR52 | Content freshness flag (6-month enforcement) | Backend-driven stale content checks |
| NFR16 | HTTP polling fallback (for notifications when WebSocket unavailable) | Resilience |
| Break Suggestion After 3+ Missions | Auto-trigger break modal after consecutive mission completions | Engagement feature |

### Integration Work (after frontend + gaps)

- Merge JB's `feat/frontpages` branch (rebase onto main after Arthur's work)
- Wire all frontend routes to real API endpoints (update API client config)
- End-to-end integration testing (Playwright: full user journeys)
- Cross-browser testing (Chrome, Firefox, Safari)
- Performance verification (NFR1–4: load times, Lighthouse scores)
- WCAG AA accessibility audit (use axe-core in Playwright)
- Full Docker production deploy (test image builds, env config)

### Team Decisions Needed (blocking)

1. **3rd OAuth provider:** Instagram deprecated. Choose: GitHub, Apple, or Twitter/X? (see `apps/api/src/middleware/passport-config.ts`)
2. **Disclaimer modal re-entry:** Show on first login only, or every session? (affects UX flow design)

---

## SECTION 5: Module Mapping — 22 Points Target

| # | Module | Points | Mandatory | Status | Coverage |
|---|--------|--------|-----------|--------|----------|
| 1 | Monorepo Setup | 1 | Yes | ✓ Done | Turborepo scaffold + pnpm |
| 2 | Database (Prisma + PostgreSQL) | 2 | Yes | ✓ Done | 16 models, 19 migrations |
| 3 | Backend API (Express) | 2 | Yes | ✓ Done | 40+ endpoints, auth, content, gamification |
| 4 | Backend Testing | 1 | Yes | ✓ Done | 579 unit tests + 17 integration suites |
| 5 | Security | 2 | Yes | ✓ Done | HTTPS, TOTP 2FA, GDPR compliance, password reset |
| 6 | Frontend Setup | 1 | Yes | ⚙️ In Progress | React 19 + Vite + Tailwind scaffold + routing |
| 7 | Frontend Pages & Components | 2 | Yes | ⚙️ In Progress | 25 pages (unmerged), 15+ UI primitives (scaffolds) |
| 8 | Frontend State & Integration | 2 | Yes | TODO | TanStack Query + Zustand wiring, API integration |
| 9 | Frontend Testing | 1 | Yes | TODO | Playwright E2E, unit tests for components |
| 10 | Deployment (Docker) | 2 | Yes | ✓ Done | Docker Compose + Nginx + HTTPS ready |
| 11 | Advanced Auth (OAuth + 2FA) | 1 | No | ✓ Done | Google + Facebook OAuth, TOTP 2FA |
| 12 | Advanced State (TanStack Query) | 1 | No | TODO | Server state caching, mutation handling, retry logic |
| 13 | Advanced UI (Animations + A11y) | 1 | No | TODO | Framer Motion transitions, WCAG AA compliance |
| 14 | Caching & Optimization | 1 | No | TODO | Redis caching, image optimization, code splitting |
| 15 | WebSockets (Socket.IO) | 2 | No | ✓ Done | Real-time presence, friend notifications, leaderboard |
| 16 | Advanced Security | 1 | No | TODO | CSP headers, CORS policy, rate limiting, input sanitization |
| — | **TOTAL (14 required)** | **14** | — | **11/14 done** | **78% complete** |
| — | **TOTAL (all 16)** | **22** | — | **13/16 done** | **81% complete** |

---

## SECTION 6: Getting Started

### Prerequisites

Install these first:

```bash
# Required
Node.js 22+ (check: node --version)
pnpm 10.22+ (check: pnpm --version)
Docker + Docker Compose (check: docker --version && docker-compose --version)
Git (check: git --version)

# Recommended
VS Code with:
  - ESLint extension
  - Prettier extension
  - Thunder Client (for API testing)
  - PostgreSQL client (pgAdmin or psql CLI)
```

### Clone & Install

```bash
# Clone repo
git clone <repo_url>
cd transcendence

# Install dependencies
pnpm install

# Generate Prisma client
pnpm run db:generate

# Create .env file (copy from .env.example)
cp .env.example .env
# Edit .env with local settings:
# - DATABASE_URL=postgresql://user:pass@localhost:5432/transcendence
# - REDIS_URL=redis://localhost:6379
# - FRONTEND_URL=http://localhost:5173
# - BACKEND_URL=http://localhost:3000
```

### Start Dev Environment

```bash
# Terminal 1: Start Docker services (PostgreSQL + Redis + Nginx)
docker-compose up -d

# Terminal 2: Run database migrations
pnpm run db:migrate

# Terminal 3: Start Turborepo dev servers (API + Web)
pnpm run dev
# Runs:
#   - API on http://localhost:3000
#   - Web on http://localhost:5173
#   - Swagger UI on http://localhost:3000/api/docs
```

### Verify Installation

```bash
# Check API health
curl http://localhost:3000/api/health

# Check database connection
pnpm --filter api test

# Check frontend build
pnpm --filter web build

# Lint & format
pnpm run lint
pnpm run format
```

### Branch Strategy

All work happens on feature branches. Main is production.

```bash
# Create feature branch from main
git checkout main
git pull
git checkout -b feat/story-2-8-auth-frontend

# Work, commit, push
git push origin feat/story-2-8-auth-frontend

# Open PR for code review
# PR naming: [Story ID] Brief title
# Title example: [2.8] Auth Frontend - Login & OAuth Flow
```

**For JB's frontend work:** Rebase the `feat/frontpages` branch onto main before opening new PRs.

### Branch State Table

| Branch | Status | Last Updated | Notes |
|--------|--------|---|---|
| `main` | Stable | Mar 29 | Backend complete. Ready for frontend integration. |
| `feat/frontpages` | Unmerged | Mar 17 | JB's scaffolds. Needs testing + styling + API wiring. Rebase required. |
| `feature/*` | N/A | — | Create as needed for new stories. |

---

## SECTION 7: Key Docs Reference

Read these before starting each story type.

### Foundational (Read First)

| File | What You'll Learn | Read Before |
|------|---|---|
| `/docs/API.md` | All 40+ endpoint specs, request/response formats, auth headers, error codes | Any backend/integration work |
| `/docs/ARCHITECTURE.md` | System design, data flow (user → API → DB), caching strategy, WebSocket design | Any backend or complex frontend |
| `/docs/CONTENT_STRUCTURE.md` | Curriculum schema (categories, chapters, missions), mission format, tooltip format | Building mission/curriculum pages |
| `/docs/EXERCISE_TYPES.md` | All 4 exercise type specs: SI, CM, IP, ST. Request/response formats. Validation rules. | Building exercise components |

### Frontend Development

| File | What You'll Learn | Read Before |
|------|---|---|
| `/docs/FRONTEND_SETUP.md` | React 19 + Vite + Tailwind setup, state management (TanStack Query + Zustand), component architecture | Any React component work |
| `/docs/COMPONENT_LIBRARY.md` | All reusable UI primitives (Button, Card, Input, etc.). Props, variants, usage examples | Building any component |
| `/docs/STYLING_GUIDE.md` | Tailwind 4 tokens, color palettes (teal/amber/warm), spacing scale, responsive design | Any styling work |
| `/docs/FORM_PATTERNS.md` | Form validation (Zod), error handling, field states, accessibility patterns | Building forms (login, settings) |
| `/docs/STATE_MANAGEMENT.md` | TanStack Query for server state, Zustand for client state, AuthContext patterns | Building pages with data |
| `/docs/I18N_GUIDE.md` | react-i18next setup, translation file structure, useLocale hook, language switching | Building multilingual features |

### Backend Development

| File | What You'll Learn | Read Before |
|------|---|---|
| `/docs/DATABASE.md` | Prisma schema, 16 models, relationships, migrations, querying patterns | Building any backend feature |
| `/docs/AUTH_GUIDE.md` | Passport.js setup, session handling, OAuth flow, TOTP 2FA, password reset | Building auth endpoints |
| `/docs/EXERCISE_SUBMISSION.md` | Exercise submission handler, feedback engine, validation per type, progress updates | Building exercise submit endpoints |
| `/docs/EMAIL_SERVICE.md` | Email template structure, i18n, SMTP config, queueing, testing | Building email-triggered features |

### Quality & Deployment

| File | What You'll Learn | Read Before |
|------|---|---|
| `/docs/TESTING_GUIDE.md` | Vitest unit tests, integration test patterns, Playwright E2E, test organization | Writing any tests |
| `/docs/DEPLOYMENT.md` | Docker Compose setup, Nginx config, HTTPS, environment variables, production checklist | Deploying to production |
| `/docs/PERFORMANCE.md` | NFR1–4 specs (load times, Lighthouse scores), caching strategy, optimization tips | Optimizing performance |
| `/docs/ACCESSIBILITY.md` | WCAG AA compliance, keyboard navigation, screen reader support, testing tools | Building accessible features |

### Reference

| File | What You'll Learn |
|------|---|
| `/docs/GLOSSARY.md` | Terms: mission, chapter, category, exercise type, token, streak, etc. |
| `/docs/DECISIONS.md` | Architecture decisions (why Express over Hono, why TanStack Query, why Zustand, etc.) |
| `/docs/FAQ.md` | Common setup issues, debugging tips, known bugs, workarounds |

---

## SECTION 8: Architecture Quick Reference

**Monorepo Structure:**

```
transcendence/
├── apps/
│   ├── api/              (Express backend)
│   │   ├── src/
│   │   │   ├── routes/   (40+ endpoints)
│   │   │   ├── models/   (Prisma interactions)
│   │   │   ├── middleware/
│   │   │   ├── services/ (business logic)
│   │   │   └── tests/    (579 unit + 17 integration)
│   │   └── package.json
│   └── web/              (React frontend)
│       ├── src/
│       │   ├── pages/    (25 page components)
│       │   ├── components/ (UI primitives)
│       │   ├── hooks/    (custom hooks + contexts)
│       │   ├── lib/      (API client, utils)
│       │   └── tests/    (Playwright E2E)
│       └── package.json
├── packages/
│   ├── shared/           (shared types, constants)
│   │   ├── src/
│   │   │   ├── types.ts  (TypeScript interfaces)
│   │   │   ├── constants.ts
│   │   │   └── zod/      (Zod validation schemas)
│   │   └── package.json
│   └── content/          (static mission/tooltip content)
│       ├── missions.json
│       ├── tooltips.json
│       └── ui-copy.json
├── docker-compose.yml    (PostgreSQL, Redis, Nginx)
├── turbo.json            (Turborepo config)
├── pnpm-workspace.yaml   (pnpm monorepo config)
└── docs/                 (this documentation)
```

**API Response Format:**

All endpoints return one of two formats:

```typescript
// Success
{ data: T }

// Error
{ error: { code: string; message: string } }
```

Example:

```bash
# Success
GET /api/curriculum/1/progress
{ "data": { "completedMissions": 5, "totalMissions": 10 } }

# Error
GET /api/missions/999
{ "error": { "code": "NOT_FOUND", "message": "Mission not found" } }
```

**Authentication:**

1. **Passport.js** handles strategy (local, Google OAuth, Facebook OAuth)
2. **express-session** stores session ID in cookie
3. **connect-redis** persists session in Redis
4. **TOTP 2FA** optional; user can enable in settings

Request with auth:

```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Cookie: connect.sid=..." \
  -H "Content-Type: application/json"
```

**Frontend State:**

- **Server State (TanStack Query):** User profile, missions, exercises, leaderboard. Synced with API.
- **Client State (Zustand):** UI state (modals open/closed, selected mission, current language). Local only.
- **Contexts (React Context API):** Auth, Notification, Reveal. Passed down to providers.

Example:

```typescript
// Fetch server state
const { data: missions } = useQuery({
  queryKey: ['missions'],
  queryFn: () => api.get('/api/curriculum/missions')
});

// Update client state
const { setLanguage } = useLocaleStore();
setLanguage('fr');
```

**Content Distribution:**

- **Static content** (missions, tooltips, UI copy) stored in `/content/*.json`
- **Backend** loads & validates content on startup using Zod
- **Frontend** requests via `/api/content/*` endpoints (never reads disk directly)
- **i18n** handled by react-i18next; translations live in `/apps/web/public/locales/`

**Naming Conventions:**

| Context | Convention | Example |
|---------|---|---|
| Database / API | camelCase | `userId`, `missionTitle`, `exerciseType` |
| TypeScript Types | PascalCase | `User`, `Mission`, `ExerciseSubmission` |
| React Components | PascalCase | `LoginPage`, `MissionCard`, `ExerciseContainer` |
| Folders | kebab-case | `exercise-types`, `ui-primitives`, `auth-context` |
| Constants | UPPER_SNAKE_CASE | `MAX_STREAK`, `TOKEN_DECIMALS`, `API_BASE_URL` |
| CSS Classes | kebab-case | `btn-primary`, `card-body`, `form-error` |

---

## Quick Tips for New Members

1. **Read the docs in order:** SECTION 7 lists the right sequence. Start with API.md + ARCHITECTURE.md.

2. **Ask in #dev Slack channel** (or equivalent) if docs are unclear. We update them based on questions.

3. **Run tests before committing:**
   ```bash
   pnpm run lint
   pnpm run test
   pnpm run test:integration
   pnpm run test:e2e
   ```

4. **Check the OpenAPI spec** for API endpoints: `http://localhost:3000/api/docs`

5. **Use Thunder Client or Postman** to test API endpoints before building frontend components.

6. **Frontend scaffolds in `feat/frontpages`:** JB built 25 page stubs. Use them as starting points, but expect to rewrite 70% for real state & styling.

7. **Content is static JSON:** Never hardcode mission/tooltip copy in components. Use the `/api/content/*` endpoints.

8. **Commit often, push daily:** Small commits = easier code review.

9. **Ask questions in PRs:** We don't bite. Architecture decisions are flexible if you have a better idea.

10. **Docker services must be running:** `docker-compose up -d` before starting dev. Check with `docker ps`.

---

## For Each New Story

1. **Read the story spec** (in Linear or Notion, linked in PR template)
2. **Read the relevant doc** from SECTION 7
3. **Check the API endpoint spec** (OpenAPI at `/api/docs` or `API.md`)
4. **Write the code** (frontend page + components, or backend endpoint)
5. **Add tests** (unit + Playwright E2E for frontend, unit + integration for backend)
6. **Open PR** with story ID in title + link to spec
7. **Address code review** (maintainers: Hugo + Arthur)
8. **Merge to main** once approved

---

## Common Gotchas

| Issue | Solution |
|-------|----------|
| Docker services won't start | Run `docker-compose down && docker-compose up -d` |
| Database migrations fail | Check PostgreSQL is running: `docker ps \| grep postgres` |
| TypeScript errors after code change | Run `pnpm run db:generate` to regenerate Prisma types |
| Frontend can't reach API | Check API is running on 3000, CORS is enabled, backend URL in `.env` |
| Tests fail with "cannot find module" | Run `pnpm install` and `pnpm run db:generate` |
| Node version mismatch | Use Node 22. Check `.nvmrc` or `nvm use` |
| pnpm errors | Clear cache: `pnpm store prune && pnpm install` |

---

## Next Steps

1. Clone the repo and follow SECTION 6 setup
2. Run `pnpm run dev` and verify both API (3000) and web (5173) are running
3. Read `/docs/API.md` and `/docs/ARCHITECTURE.md`
4. Pick a story from SECTION 4 (Frontend Stories) — start with P0 (2.8 or 3.6) or P1 if you're comfortable
5. Check the corresponding doc in SECTION 7
6. Create a feature branch and start building
7. Ping Hugo or Arthur with questions

**Welcome aboard. Let's ship.**
