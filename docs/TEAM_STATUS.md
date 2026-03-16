# Team Status — Transcendence
*Last updated: 2026-03-16*

---

## Project Overview

Transcendence is a gamified blockchain learning platform — Duolingo-style, built for non-technical adults. Learners progress through 69 bite-sized missions (2–5 min each) organized into 6 categories, 18 chapters. The platform uses a progressive reveal mechanic: it gradually exposes its own economy (tokens, wallet, gas fees, dashboard) exactly as learners study those concepts. The entire backend is complete. All content (missions, tooltips, UI copy) is written in EN and FR. Frontend development has not started.

---

## What's Complete

### Hugo — Backend ✅

**Auth (Epic 2)**
- Local email/password registration and login
- Google OAuth2 and Facebook OAuth
- TOTP-based 2FA (AES-256-GCM encrypted secrets at rest)
- Password reset via email (Resend, rate-limited)
- Express sessions + Redis (`connect-redis`)

**Curriculum engine (Epic 3)**
- Content loader with Zod validation at startup — server refuses to start if content is invalid
- Full curriculum tree endpoint with user progress overlay
- Mission unlock logic (sequential progression)
- Mission completion with token reward, streak update, achievement check, progressive reveal triggers — all inside a single Prisma transaction
- Learning chain visualization endpoint
- Resume endpoint with optional concept refresher

**Exercises (Epic 4)**
- 4 exercise types: SI (single choice), CM (correct mapping), IP (input puzzle), ST (sorting)
- Gas fee deduction per submission (after `revealGas` is set)
- Token debt enforcement: users cannot start a new mission while in debt
- Integration test infrastructure: Vitest + Supertest against real PostgreSQL + Redis

**Token economy (Epic 5)**
- +10 KT per mission completed (idempotent via unique DB constraint)
- −2 KT gas per exercise submission
- Token balance, transaction history (paginated ledger)
- Streak tracking (consecutive days, longest streak, reset logic)
- 13 achievements: 6 category completions, 3 token thresholds, 4 streak targets
- Leaderboard (weekly, paginated)
- Progressive reveal API: `GET /users/me/reveals` returns 4 boolean flags

**Social (Epic 6)**
- Friend requests, acceptance, removal
- Online presence via Socket.IO Redis adapter (5-second disconnect debounce)
- Public profile endpoint
- Completion certificate auto-generated on mission 6.3.4, shareable via public URL

**Notifications + re-engagement (Epic 7)**
- In-app notifications (paginated, preferences flags)
- Socket.IO `notification:push` with 50-message catch-up on connect
- Streak reminder scheduler (cron, 1-hour interval)
- Re-engagement check on Socket.IO connect (7-day inactivity threshold)
- Re-engagement email via Resend

**GDPR (Epic 8)**
- Data export: sends email with 24h single-use download link
- Account deletion: sends confirmation email with 24h token
- GDPR audit log

**Infrastructure**
- Docker Compose: Nginx reverse proxy (HTTPS, TLS 1.2/1.3) → API → PostgreSQL + Redis
- 19 Prisma migrations, 16 DB models
- 17 integration test suites (auth, curriculum, exercises, gas, tokens, streak, achievements, reveals, friends, leaderboard, notifications, engagement, certificate, GDPR, presence, public profile, health)
- `@transcendence/shared` package: Zod schemas, TypeScript types, constants used by both API and web

---

### Arthur — Content & Product ✅

**Mission content**
- 69/69 EN missions: title, learning intro, exercise (question + answer options/pairs/blanks + correct answer + explanation)
- 69/69 FR missions: full French translation of all mission content
- Exercise type distribution: SI (single choice), CM (correct mapping), IP (input puzzle), ST (sorting) — all 4 types covered across the curriculum

**Glossary**
- 40 tooltips EN: term, short definition (tooltip hover), full explanation (glossary page)
- 40 tooltips FR: full French translation
- `tooltip-triggers.json` (EN + FR): maps which tooltip terms appear contextually in each mission

**UI copy**
- `content/en/ui.json`: complete English copy for 15 platform sections — navigation, auth, curriculum, exercises, tokens, gamification, wallet, dashboard, notifications, settings, onboarding, errors, tooltips, achievements, certificate
- `content/fr/ui.json`: complete French translation

**Spec documents (9 docs in `docs/`)**
- `onboarding-flow-spec.md` — screen-by-screen onboarding flow (landing → account → first 3 missions)
- `progressive-reveal-spec.md` — all 4 reveals: pedagogical justification, exact copy, post-reveal UI state, implementation notes for JB
- `curriculum-syllabus.md` — all 18 chapters with learning outcomes, pedagogical purpose, reveal triggers, disclaimer gates, post-chapter copy
- `copy-bank-system-messages.md` — final-quality copy for achievements, streaks, welcome-back, concept refreshers, post-mission/chapter/category messages, disclaimer gate, gas fee notifications
- `accessibility-copy-spec.md` — ARIA labels, screen reader text, alt text patterns for all exercise types
- `certificate-spec.md` — certificate page layout, share flow, social card metadata
- `email-copy-spec.md` — all email copy EN+FR (emails 1–4 already in `emailService.ts`; emails 5–7 are new and need implementation by Hugo)
- `docs/qa/core-learning-flow-scenarios.md` — functional test scenarios for the core learning flow
- `docs/qa/progressive-reveal-scenarios.md` — test scenarios for all 4 reveal mechanics
- `docs/qa/gamification-scenarios.md` — test scenarios for tokens, streaks, achievements, leaderboard
- `docs/qa/fr-content-review.md` — FR content quality review notes

---

### JB — Frontend 🚧

**What's scaffolded (exists in `apps/web/`)**
- React 19 + Vite 7 + Tailwind 4 project
- `App.tsx` with React Router v7: landing page, Privacy Policy, Terms of Service, 404
- Docker/Nginx config for the web container

**What needs building — see "What's Left" section below**

---

## Branch State

| Branch | Description |
|--------|-------------|
| `main` | Backend complete. Original README and developer guide. |
| `feat/arthur-content-curriculum` | 6 commits ahead of main. Adds: all content files (EN+FR missions, tooltips, tooltip-triggers, UI copy), all spec docs (onboarding, reveals, syllabus, copy bank, accessibility, certificate, email, QA scenarios). **This branch must be merged before frontend work starts.** |

---

## Content Files Reference
*For JB — everything you need to build the frontend is in these files. The API serves all content; you do not read JSON directly from disk in the frontend.*

| File | Purpose | Format |
|------|---------|--------|
| `content/structure.json` | Full curriculum tree — categories, chapters, missions with IDs, exercise types, estimated minutes, progressive reveal flags | JSON array of category objects |
| `content/en/missions.json` | All EN mission content keyed by mission ID — title, learning intro, exercise (type + question + options/correct answer + explanation) | JSON object keyed by `missionId` |
| `content/fr/missions.json` | Same, French | JSON object keyed by `missionId` |
| `content/en/tooltips.json` | 40 blockchain term glossary entries in EN — term, short definition, full explanation | JSON array |
| `content/fr/tooltips.json` | Same, French | JSON array |
| `content/en/tooltip-triggers.json` | Maps which tooltip terms appear contextually per mission in EN | JSON object keyed by `missionId` |
| `content/fr/tooltip-triggers.json` | Same, French | JSON object keyed by `missionId` |
| `content/en/ui.json` | Complete EN platform copy — 15 sections (nav, auth, curriculum, exercises, tokens, gamification, wallet, dashboard, notifications, settings, onboarding, errors, tooltips, achievements, certificate) | Nested JSON object by section |
| `content/fr/ui.json` | Same, French | Nested JSON object by section |

**API endpoints that serve this content:**
- `GET /api/v1/curriculum/` — curriculum tree with user progress overlay
- `GET /api/v1/curriculum/missions/:missionId` — mission detail with exercise content
- `GET /api/v1/tooltips/` — full glossary
- `GET /api/v1/tooltips/:term` — single tooltip
- UI copy is served directly from the `content/` files — the API does not have a `/ui-copy` endpoint; the frontend reads `content/{locale}/ui.json` at build time or serves it as a static asset

---

## Docs Reference
*Spec documents JB should read before building each feature:*

| Doc | Read before building |
|-----|---------------------|
| `docs/onboarding-flow-spec.md` | Onboarding screens (landing → register/login → first missions) |
| `docs/progressive-reveal-spec.md` | All 4 reveal mechanics — exact copy, trigger conditions, frontend state management, implementation notes |
| `docs/accessibility-copy-spec.md` | Any interactive exercise component |
| `docs/certificate-spec.md` | Certificate page and share flow |
| `docs/email-copy-spec.md` | Email templates reference (Hugo: emails 5–7 need implementing) |
| `docs/curriculum-syllabus.md` | Full curriculum structure understanding — chapter arcs, reveal triggers, disclaimer gates |
| `docs/copy-bank-system-messages.md` | All gamification copy — achievement toasts, streak messages, welcome-back variants, gas fee copy, disclaimer modal |
| `docs/qa/core-learning-flow-scenarios.md` | Core flow functional test scenarios |
| `docs/qa/progressive-reveal-scenarios.md` | Reveal feature test scenarios |
| `docs/qa/gamification-scenarios.md` | Gamification test scenarios |

---

## What's Left

### Frontend (JB)

All of `apps/web/src/` beyond the scaffold. High-priority order:

**Auth & onboarding**
- Registration form (email/password + Google/Facebook OAuth buttons)
- Login form with 2FA step
- Onboarding flow: screen 1–N as specced in `docs/onboarding-flow-spec.md`
- Password reset request + reset form

**Core learning flow**
- Home screen (resume CTA + curriculum overview)
- Curriculum tree view (categories → chapters → missions, lock/unlock states)
- Mission detail screen (learning content + exercise)
- 4 exercise components: SI (radio choice), CM (matching), IP (fill-in-blank), ST (drag-to-sort)
- Mission completion screen (tokens earned, streak update, chapter/category celebration)
- Chapter completion celebration screen
- Category completion celebration screen

**Progressive reveal (4 mechanics)**
- Reveal 1 (mission 2.2.4): token balance modal + token UI in nav bar
- Reveal 2 (mission 3.1.4): wallet reveal modal + profile → wallet layout fork
- Reveal 3 (mission 3.3.3): gas fee reveal modal + gas cost display on exercises
- Reveal 4 (mission 6.3.4): final celebration screen + full dashboard unlock + certificate
- `useRevealStore` (Zustand) hydrated from `GET /users/me/reveals` on app load

**Profile / wallet page**
- Pre-wallet-reveal: standard profile (avatar, display name, stats)
- Post-wallet-reveal: wallet layout (address display, token balance, transaction history)

**Full dashboard** (unlocked at reveal 4 only)
- Aggregates: `/tokens/balance`, `/tokens/history`, `/gamification/achievements`, `/gamification/streak`, `/curriculum/`
- All 6 categories shown as completed, total missions, token P&L

**Gamification UI**
- Token balance in nav (post-reveal 1)
- Streak tracker
- Achievements list (earned + unearned)
- Leaderboard

**Social**
- Friends list with online status
- Friend request flow
- Public profile view

**Notifications**
- Notification list (paginated)
- Notification preferences panel
- Socket.IO real-time push (achievement toasts, presence)

**Settings**
- Profile edit (display name, bio)
- Avatar upload
- Notification preferences
- 2FA setup/disable
- GDPR: data export + account deletion

**Certificate page**
- Public-facing certificate (unauthenticated route `/certificates/:shareToken`)
- Share button (clipboard copy + native share)

**Disclaimer gates**
- Modal for chapters 2.3, 6.1, 6.2 — copy in `docs/copy-bank-system-messages.md` Section F

**Tooltip system**
- Hover/click tooltips on highlighted terms in mission content
- Full glossary page (alphabetical, from `GET /tooltips/`)

---

### Backend gaps (for Hugo)

**Emails 5–7 from `docs/email-copy-spec.md`** — not yet implemented anywhere:

| Email | Trigger | Function to add |
|-------|---------|----------------|
| Email 5 — Streak reminder (FR) | User offline when streak is at risk | Add FR path to existing streak reminder logic |
| Email 6 — Achievement earned | Achievement unlocked | New `sendAchievementEmail()` function |
| Email 7 — Course completion | Mission 6.3.4 completed | New `sendCompletionEmail()` function |

French copy for all existing emails (1–4) is also ready in `docs/email-copy-spec.md` and needs to be added to `emailService.ts` alongside the English.

---

### Open questions / decisions needed

1. **Disclaimer modal on re-entry**: `docs/copy-bank-system-messages.md` notes this is unresolved — should the disclaimer modal show on every entry to chapters 2.3/6.1/6.2, or only on first entry? Recommendation: first entry only. Confirm before JB builds the gate.
2. **UI copy delivery**: `content/{locale}/ui.json` is not served by an API endpoint. Decide whether JB should import it at build time (Vite static import) or whether Hugo adds a `/ui-copy` endpoint. Build-time import is simpler and avoids an extra network round-trip.
3. **Concept refresher UI**: `GET /curriculum/resume` can return an optional `conceptRefresher` object. The intro copy variants are in `docs/copy-bank-system-messages.md` Section D. JB needs to design the wrapper component.
4. **Locale switching**: both EN and FR content is ready. If the app ships multilingual on day one, JB needs an `i18n` context. If EN-first is acceptable, FR can be wired in later.

---

## Getting Started

```bash
# Prerequisites: Node.js 22, pnpm 10.22+, Docker

# 1. Clone and install
git clone <repo-url> && cd transcendence
pnpm install

# 2. Switch to the content branch (has all content + spec docs)
git switch feat/arthur-content-curriculum

# 3. Start PostgreSQL and Redis
docker run -d --name transcendence-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres \
  -p 54322:5432 postgres:17
docker run -d --name transcendence-redis -p 6379:6379 redis:7-alpine

# 4. Set up the database
pnpm --filter api db:generate
pnpm --filter api db:migrate
pnpm --filter api db:seed

# 5. Start dev servers
pnpm dev
# API: http://localhost:3000
# Web: http://localhost:5173

# 6. Verify
curl http://localhost:3000/api/v1/health
# → {"data":{"status":"ok"}}

# 7. Run integration tests
pnpm test:integration
```

Full environment variable reference: `docs/DEVELOPER_GUIDE.md` section 12.
