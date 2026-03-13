# Transcendence — Developer Guide

> Last updated: 2026-03-13

This document is your onboarding reference for the Transcendence project. It covers everything built so far — architecture, API, database, testing, deployment — so you can contribute from day one.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Tech Stack](#2-tech-stack)
3. [Project Structure](#3-project-structure)
4. [Getting Started](#4-getting-started)
5. [Architecture Overview](#5-architecture-overview)
6. [Database](#6-database)
7. [API Reference](#7-api-reference)
8. [Real-Time (Socket.IO)](#8-real-time-socketio)
9. [Shared Package](#9-shared-package-packagesshared)
10. [Business Logic Deep Dives](#10-business-logic-deep-dives)
11. [Testing](#11-testing)
12. [Docker & Deployment](#12-docker--deployment)
13. [Known Tech Debt & Gotchas](#13-known-tech-debt--gotchas)

---

## 1. Introduction

**Transcendence** is a gamified blockchain learning platform built as a 42 School project. It teaches blockchain concepts to non-technical adults through bite-sized missions (2-5 minutes each), with a Duolingo-meets-Headspace experience.

**Current state:** The entire backend is complete (8 epics, 48 stories). The frontend is scaffolding only — a landing page with Privacy Policy and Terms of Service pages. The real frontend development starts now.

**Domain:** EdTech — 6 categories, 18 chapters, 69 missions covering Blockchain Foundations through DeFi & Beyond.

---

## 2. Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript | 5.9 |
| Runtime | Node.js | 22 |
| Monorepo | Turborepo + pnpm workspaces | pnpm 10.22 |
| Backend | Express | 5.2 |
| ORM | Prisma (with `@prisma/adapter-pg`) | 7.4 |
| Database | PostgreSQL | 17 |
| Cache / Sessions | Redis | 7 |
| Real-time | Socket.IO + `@socket.io/redis-adapter` | 4.8 |
| Auth | Passport.js (local + Google + Facebook) | 0.7 |
| Validation | Zod | 3.25 |
| Email | Resend | 6.9 |
| Image processing | Sharp | 0.34 |
| Frontend (scaffold) | React 19 + Vite 7 + Tailwind 4 | — |
| Testing | Vitest + Supertest | 4.0 / 7.2 |
| Containerization | Docker Compose | — |
| Reverse proxy | Nginx | stable-alpine |

---

## 3. Project Structure

```
transcendence/
├── apps/
│   ├── api/                        # Express backend (the bulk of the work)
│   │   ├── prisma/
│   │   │   ├── schema.prisma       # Database models
│   │   │   ├── seed.ts             # Achievement + test user seeding
│   │   │   └── migrations/         # 19 migration files
│   │   ├── src/
│   │   │   ├── app.ts              # Express app factory + registerRoutes()
│   │   │   ├── index.ts            # Server entry point, graceful shutdown
│   │   │   ├── config/             # database, redis, session, passport
│   │   │   ├── middleware/         # auth, errorHandler, rateLimiter, validate
│   │   │   ├── routes/             # 12 route files (one per domain)
│   │   │   ├── services/           # 15+ service files (business logic)
│   │   │   ├── socket/             # Socket.IO: presence, notifications, engagement
│   │   │   ├── scheduler/          # Streak reminders, re-engagement cron
│   │   │   ├── utils/              # AppError, contentLoader, crypto helpers
│   │   │   ├── content/            # Static disclaimer copy
│   │   │   └── __tests__/          # Integration tests + helpers
│   │   └── generated/prisma/       # Auto-generated Prisma client (git-ignored)
│   └── web/                        # React frontend (scaffold only)
│       └── src/
│           ├── App.tsx             # Landing + routing (Privacy, ToS, 404)
│           └── pages/              # PrivacyPolicy.tsx, TermsOfService.tsx
├── packages/
│   └── shared/                     # Zod schemas, TypeScript types, constants
│       └── src/index.ts            # Single barrel export
├── content/                        # Static curriculum content (JSON)
│   ├── structure.json              # 6 categories → 18 chapters → 69 missions
│   ├── en/                         # missions.json, tooltips.json, ui.json
│   └── fr/                         # French translations
├── docker/
│   ├── api.Dockerfile
│   ├── web.Dockerfile
│   └── nginx/nginx.conf
├── docker-compose.yml
├── turbo.json                      # Turborepo pipeline config
├── pnpm-workspace.yaml
└── package.json                    # Root scripts
```

### Key files to look at first

| File | Why |
|------|-----|
| `apps/api/src/app.ts` | Middleware stack order, all route mounts |
| `apps/api/src/index.ts` | Server startup sequence, graceful shutdown |
| `apps/api/prisma/schema.prisma` | All 16 database models |
| `packages/shared/src/index.ts` | Every shared type, schema, and constant |
| `content/structure.json` | Curriculum tree (categories/chapters/missions) |

---

## 4. Getting Started

### Prerequisites

- **Node.js 22** — install directly from [nodejs.org](https://nodejs.org), or use a version manager like `nvm` or `fnm` if you work on multiple projects with different Node versions
- **pnpm 10.22+** (`corepack enable && corepack prepare pnpm@10.22.0 --activate`)
- **Docker & Docker Compose** — used to run PostgreSQL and Redis locally (you do **not** need to install Postgres or Redis on your machine)
- **mkcert** (optional, for local HTTPS)

### Setup steps

```bash
# 1. Clone and install
git clone <repo-url> && cd transcendence
pnpm install

# 2. Start PostgreSQL and Redis (dev containers)
# You need two databases: one for dev (port 54322), one for tests (same server).
# If you use docker-compose for dev infra, make sure ports don't collide
# with the production docker-compose.yml.
#
# Quick start with standalone containers:
docker run -d --name transcendence-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres \
  -p 54322:5432 postgres:17

docker run -d --name transcendence-redis -p 6379:6379 redis:7-alpine

# 3. Configure environment
cp apps/api/.env.example apps/api/.env   # If .env.example exists
# Otherwise create apps/api/.env with at minimum:
#   DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
#   DATABASE_POOL_SIZE=10

# 4. Generate Prisma client + run migrations + seed
pnpm --filter api db:generate
pnpm --filter api db:migrate
pnpm --filter api db:seed

# 5. Create the test database (for integration tests)
docker exec transcendence-db psql -U postgres -c "CREATE DATABASE transcendence_test;"
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/transcendence_test" \
  pnpm --filter api db:migrate:deploy
DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54322/transcendence_test" \
  pnpm --filter api db:seed

# 6. Start dev servers
pnpm dev
# API: http://localhost:3000
# Web: http://localhost:5173
```

### Verify it works

```bash
# Health check
curl http://localhost:3000/api/v1/health
# → {"data":{"status":"ok"}}

# Run unit tests
pnpm test

# Run integration tests
pnpm test:integration
```

### Useful scripts

| Command | What it does |
|---------|-------------|
| `pnpm dev` | Start API (tsx watch) + Web (Vite) concurrently |
| `pnpm build` | Build all workspaces via Turborepo |
| `pnpm test` | Unit tests across all workspaces |
| `pnpm test:integration` | Integration tests (API only) |
| `pnpm lint` | ESLint across all workspaces |
| `pnpm format` | Prettier format all files |
| `pnpm --filter api db:studio` | Open Prisma Studio (visual DB browser) |
| `pnpm --filter api db:migrate` | Create + apply new migration |
| `pnpm --filter api db:seed` | Re-run database seed |
| `pnpm --filter api db:reset` | Drop DB + re-migrate + re-seed |

---

## 5. Architecture Overview

### Request lifecycle

Every HTTP request passes through this middleware stack (defined in `apps/api/src/app.ts`):

```
Request
  │
  ├── 1. helmet()                    Security headers (CSP, HSTS, etc.)
  ├── 2. cors()                      CORS with credentials (FRONTEND_URL origin)
  ├── 3. express.json()              JSON body parsing
  ├── 4. express.urlencoded()        Form body parsing (for Passport)
  ├── 5. rateLimiter                 Redis-backed, 100 req/15min per IP
  ├── 6. sessionMiddleware           express-session + connect-redis
  ├── 7. passport.initialize()       Passport setup
  ├── 8. passport.session()          Deserialize user from session
  ├── 9. Route handler               Business logic
  ├── 10. 404 catch-all              AppError.notFound("Route not found")
  └── 11. errorHandler               Formats errors into consistent JSON
```

### Error handling

All errors flow through a single global error handler (`middleware/errorHandler.ts`). The pattern:

```typescript
// In routes/services — throw an AppError:
throw AppError.badRequest("Email already registered");
throw AppError.notFound("Mission not found");
throw AppError.forbidden("Mission is locked");

// Zod validation errors are caught automatically (thrown by validate middleware)

// The error handler produces:
{
  "error": {
    "code": "BAD_REQUEST",        // Machine-readable code
    "message": "Email already registered",  // Human-readable
    "details": { ... }            // Optional, field-level for validation errors
  }
}
```

`AppError` static factories: `badRequest(msg, details?)`, `unauthorized(msg)`, `forbidden(msg)`, `notFound(msg)`, `conflict(msg, details?)`, `internal(msg)`.

### Validation

Routes use the `validate()` middleware with Zod schemas from `@transcendence/shared`:

```typescript
// In a route file:
router.post(
  "/register",
  validate({ body: registerSchema }),  // Zod parses req.body
  async (req, res, next) => { ... }
);

// For query params:
router.get(
  "/history",
  requireAuth,
  validate({ query: tokenHistoryQuerySchema }),
  async (req, res, next) => {
    const { page, pageSize } = res.locals.query;  // ← validated query lives here
  }
);
```

Key detail: validated query params are placed on `res.locals.query` (not `req.query`), because Express 5 types make `req.query` read-only.

### Authentication

- **Strategy:** Server-side sessions using `express-session` + Redis (`connect-redis`)
- **Passport strategies:** Local (email/password), Google OAuth2, Facebook OAuth
- **Session TTL:** 30 minutes by default (rolling — extends on activity)
- **2FA:** TOTP-based (6-digit, 30s window), secrets encrypted at rest with AES-256-GCM
- **The `requireAuth` middleware** checks `req.isAuthenticated() && !req.session.pending2FA`

When a user with 2FA enabled logs in, the session is created but flagged as `pending2FA`. They must call `POST /auth/2fa/verify` with their TOTP code before any other authenticated endpoint will accept them.

### Content system

Curriculum content is **static JSON files** in the `content/` directory, not stored in the database. The content is loaded and Zod-validated at server startup via `initializeContent()`. If content validation fails, the server refuses to start.

The database only stores **user state** (progress, tokens, streaks) — never content. This means curriculum updates are code deployments, not database migrations.

Content structure: `structure.json` defines the tree (categories → chapters → missions). Per-locale files (`en/missions.json`, `en/tooltips.json`, `en/ui.json`) hold the translated text. Currently `en` and `fr` are loaded.

---

## 6. Database

### Schema diagram (simplified)

```
User (central model)
 ├── OAuthAccount[]          (Google/Facebook linked accounts)
 ├── PasswordResetToken[]    (1-hour expiry tokens)
 ├── UserProgress[]          (mission completion tracking)
 ├── ChapterProgress[]       (chapter-level progress)
 ├── SelfAssessment[]        (confidence ratings per category)
 ├── ExerciseAttempt[]       (every submission recorded)
 ├── TokenTransaction[]      (EARN / GAS_SPEND ledger)
 ├── UserAchievement[]       (earned achievements)
 ├── Friendship[]            (PENDING / ACCEPTED, bidirectional)
 ├── Notification[]          (in-app notifications)
 ├── Certificate?            (one per user, auto-generated on completion)
 ├── GdprExportToken[]       (24h single-use data export tokens)
 └── GdprDeletionToken[]     (24h single-use account deletion tokens)

Achievement                  (13 definitions, seeded from shared constants)
GdprAuditLog                 (best-effort audit trail)
```

### Important model details

| Model | Key constraint | Notes |
|-------|---------------|-------|
| `User` | `email` unique | `email` and `passwordHash` nullable (for OAuth-only users) |
| `UserProgress` | `(userId, missionId)` unique | `AVAILABLE` status is computed, never persisted |
| `TokenTransaction` | `(userId, missionId, type)` unique | Prevents double-crediting mission rewards |
| `ExerciseAttempt` | indexed on `(userId, exerciseId)` | Multiple attempts allowed (gas is charged each time) |
| `Certificate` | `userId` unique, `shareToken` unique | Auto-generated when mission 6.3.4 is completed |

### Enums

- `AuthProvider`: LOCAL, GOOGLE, FACEBOOK
- `MissionStatus`: AVAILABLE (computed only), IN_PROGRESS, COMPLETED
- `ChapterStatus`: LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED
- `FriendshipStatus`: PENDING, ACCEPTED

### Prisma commands cheat sheet

```bash
pnpm --filter api db:generate       # Regenerate Prisma client after schema changes
pnpm --filter api db:migrate        # Create a new migration (interactive, names it)
pnpm --filter api db:migrate:deploy # Apply pending migrations (CI/production)
pnpm --filter api db:seed           # Run seed script (achievements + test user)
pnpm --filter api db:studio         # Open Prisma Studio at http://localhost:5555
pnpm --filter api db:reset          # ⚠️  Drop everything and re-migrate + re-seed
```

### Prisma driver adapter

We use `@prisma/adapter-pg` with a raw `pg.Pool` (not the default Prisma binary connector). This is configured in `config/database.ts`. The pool is exported alongside the Prisma client because some operations (like the graceful shutdown) need to close both.

---

## 7. API Reference

Base URL: `/api/v1/`

All authenticated endpoints require an active session cookie. Unauthenticated requests get `401 { error: { code: "UNAUTHORIZED" } }`.

All responses follow the envelope format: `{ data: ... }` for success, `{ error: { code, message, details? } }` for errors.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | No | Returns `{ data: { status: "ok" } }` |

### Auth (`/auth`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/register` | No | Register with email, password, ageConfirmed |
| POST | `/auth/login` | No | Login; returns `{ requires2FA: true }` if 2FA enabled |
| POST | `/auth/logout` | Yes | Destroys session, clears cookie |
| GET | `/auth/me` | Yes | Returns current user |
| POST | `/auth/forgot-password` | No | Send password reset email (rate-limited: 5/15min) |
| POST | `/auth/reset-password` | No | Consume reset token, set new password (rate-limited: 5/15min) |
| POST | `/auth/2fa/setup` | Yes | Generate TOTP secret + QR code data URL |
| POST | `/auth/2fa/verify-setup` | Yes | Confirm TOTP code to enable 2FA (rate-limited: 3/15min) |
| POST | `/auth/2fa/verify` | Partial | Complete 2FA login with TOTP code (rate-limited: 3/15min) |
| POST | `/auth/2fa/disable` | Yes | Disable 2FA with current TOTP code (rate-limited: 3/15min) |
| GET | `/auth/google` | No | Initiates Google OAuth2 flow |
| GET | `/auth/google/callback` | No | OAuth callback, redirects to frontend |
| GET | `/auth/facebook` | No | Initiates Facebook OAuth flow |
| GET | `/auth/facebook/callback` | No | OAuth callback, redirects to frontend |

### Users (`/users`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/users/me` | Yes | Current user's profile |
| PATCH | `/users/me` | Yes | Update displayName, bio |
| POST | `/users/me/avatar` | Yes | Upload avatar (multipart, 2MB max, JPEG/PNG/WebP → resized 256x256) |
| GET | `/users/me/reveals` | Yes | Progressive reveal status (4 boolean flags) |
| GET | `/users/me/certificate` | Yes | User's completion certificate |
| GET | `/users/me/certificate/share` | Yes | Shareable certificate URL |
| GET | `/users/:userId/profile` | Yes | Another user's public profile |
| GET | `/users/avatars/:file` | No | Static file serving for uploaded avatars |

### Disclaimers (`/disclaimers`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/disclaimers/` | No | General disclaimer text |
| GET | `/disclaimers/onboarding` | Yes | Onboarding disclaimer |
| GET | `/disclaimers/module/:moduleId` | Yes | Module-specific disclaimer |
| POST | `/disclaimers/accept` | Yes | Record disclaimer acceptance |

### Curriculum (`/curriculum`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/curriculum/` | Yes | Full curriculum tree with user progress overlay |
| GET | `/curriculum/chain` | Yes | Learning chain (completed missions in order) |
| GET | `/curriculum/resume` | Yes | Next mission to resume + optional concept refresher |
| GET | `/curriculum/missions/:missionId` | Yes | Mission detail (locked missions → 403) |
| POST | `/curriculum/missions/:missionId/complete` | Yes | Mark mission complete (optional `confidenceRating`) |

### Exercises (`/exercises`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/exercises/:exerciseId/submit` | Yes | Submit exercise answer (SI/CM/IP/ST) |
| GET | `/exercises/missions/:missionId/status` | Yes | Check if mission exercise is completable |

### Tokens (`/tokens`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tokens/balance` | Yes | Token balance, totalEarned, totalSpent, lastEarned |
| GET | `/tokens/history` | Yes | Paginated transaction history (`?page=1&pageSize=20`) |

### Gamification (`/gamification`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/gamification/streak` | Yes | Current streak, longest streak, totals |
| GET | `/gamification/achievements` | Yes | All achievements with earned/unearned status |
| GET | `/gamification/leaderboard` | Yes | Weekly leaderboard (paginated, includes current user) |

### Friends (`/friends`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/friends/` | Yes | List accepted friends with online status |
| GET | `/friends/requests` | Yes | List pending incoming friend requests |
| POST | `/friends/:userId` | Yes | Send friend request |
| POST | `/friends/:userId/accept` | Yes | Accept friend request |
| DELETE | `/friends/:userId` | Yes | Remove friend |

### Notifications (`/notifications`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/notifications/` | Yes | Paginated notification list |
| GET | `/notifications/preferences` | Yes | User's notification preferences (5 flags) |
| PATCH | `/notifications/preferences` | Yes | Update notification preferences |
| PATCH | `/notifications/:id/read` | Yes | Mark notification as read |

### GDPR (`/gdpr`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/gdpr/export` | Yes | Request data export (sends email with download link) |
| GET | `/gdpr/export/:token` | No | Download export JSON (token-based, single-use, 24h) |
| POST | `/gdpr/delete` | Yes | Request account deletion (sends confirmation email) |
| POST | `/gdpr/delete/confirm/:token` | No | Confirm account deletion (token-based, single-use, 24h) |

### Certificates (`/certificates`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/certificates/:shareToken` | No | Public certificate view |

### Tooltips (`/tooltips`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/tooltips/` | Yes | Full glossary, sorted alphabetically |
| GET | `/tooltips/:term` | Yes | Single tooltip by term |

---

## 8. Real-Time (Socket.IO)

### Connection setup

The Socket.IO server is mounted on the same HTTP server as Express. It uses the Redis adapter (`@socket.io/redis-adapter`) for horizontal scaling across processes.

**Authentication:** The Express session middleware runs on every Socket.IO handshake. Unauthenticated connections (no valid session) are immediately disconnected. Each authenticated socket joins a room named `user:{userId}`.

### Server → Client events

| Event | Payload | When |
|-------|---------|------|
| `notification:push` | `{ id, type, title, body, data }` | New notification created for the user |
| `presence:online` | `userId` (string) | A friend comes online |
| `presence:offline` | `userId` (string) | A friend goes offline |

On connect, the server also pushes up to **50 unread notifications** immediately, so the client catches up on anything missed while offline.

### Presence system

- On connect: user ID is added to Redis `online-users` SET → `presence:online` broadcast to all accepted friends
- On disconnect: **5-second debounce** (handles tab refreshes / reconnects), then if no remaining sockets in the user's room → removed from `online-users` → `presence:offline` broadcast to friends
- Friends list endpoint (`GET /friends/`) includes each friend's online status (looked up from Redis)

### Re-engagement check

When a user connects via Socket.IO, the server checks if they've been inactive for 7+ days. If so, it creates a re-engagement notification and sends a re-engagement email (if email is configured).

### Client → Server events

None currently defined. All mutations go through REST endpoints.

---

## 9. Shared Package (`packages/shared`)

Location: `packages/shared/src/index.ts` — a single barrel export.

This package is used by both `apps/api` and `apps/web`. It exports:

### Zod schemas (for validation)

Used by the API's `validate()` middleware and will be used by the frontend for form validation:

- **Auth:** `registerSchema`, `loginSchema`, `totpCodeSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- **User:** `updateProfileSchema`
- **Curriculum:** `curriculumStructureSchema`, exercise content schemas (SI, CM, IP, ST)
- **Exercises:** `exerciseSubmissionSchema`, type-specific submission schemas, `exerciseResultSchema`
- **Progress:** `missionIdParamSchema`, `completeMissionBodySchema`
- **Tokens:** `tokenHistoryQuerySchema`
- **Gamification:** `streakSchema`, `leaderboardQuerySchema`
- **Friends, Notifications, GDPR, Certificates, Tooltips, Public Profile**

### TypeScript types

Inferred from schemas or defined separately:

- `ApiResponse<T>`, `ApiError` — API response envelope types
- `Mission`, `Chapter`, `Category` — curriculum content types
- All exercise content and submission types (SI, CM, IP, ST)
- `CurriculumWithProgress`, `MissionDetailResponse`, `CompleteMissionResponse`
- `TokenBalance`, `StreakStatus`, `AchievementStatus`, `RevealStatus`
- `LeaderboardEntry`, `FriendListEntry`, `PublicProfile`
- `Certificate`, `Notification`, `NotificationPreferences`
- `GdprExportData`

### Constants

```typescript
MISSION_COMPLETION_TOKEN_REWARD = 10   // Tokens earned per mission
GAS_FEE_PER_SUBMISSION = 2            // Tokens spent per exercise attempt
DEFAULT_PAGE_SIZE = 20
MAX_PAGE_SIZE = 100
STREAK_REMINDER_INTERVAL_MS = 3_600_000    // 1 hour
REENGAGEMENT_CHECK_INTERVAL_MS = 86_400_000 // 24 hours
ACHIEVEMENT_DEFINITIONS                     // 13 achievement definitions
```

### Adding to shared

1. Add your schema/type/constant to `packages/shared/src/index.ts`
2. Run `pnpm build` (Turborepo ensures shared builds before dependents)
3. Import from `@transcendence/shared` in `apps/api` or `apps/web`

---

## 10. Business Logic Deep Dives

### Mission completion flow

The most complex transaction in the system. When `POST /curriculum/missions/:missionId/complete` is called:

1. **Validation** — mission exists, is unlocked, not already completed
2. **Inside a single Prisma transaction (`$transaction`):**
   - Create/update `UserProgress` record → `COMPLETED`
   - Credit `MISSION_COMPLETION_TOKEN_REWARD` (10) tokens (idempotent via unique constraint)
   - Update user's `tokenBalance`
   - Check if all missions in the chapter are complete → update `ChapterProgress`
   - Update streak (`currentStreak`, `longestStreak`, `lastMissionCompletedAt`)
   - Check and award achievements (module completion, token thresholds, streak targets)
   - Check and trigger progressive reveals (token UI, wallet, gas fees, dashboard)
   - If this is mission `6.3.4` (the last mission) → generate completion certificate
3. **After transaction:** Push notifications for achievements earned, via Socket.IO

### Token economy

- **Earning:** +10 tokens per completed mission (via `creditMissionTokensWithClient()`)
- **Spending:** -2 tokens per exercise submission (via `deductGasFeeWithClient()`) — charged regardless of correct/incorrect
- **Debt:** Users can go negative mid-mission (they submitted answers and spent more than they have). They **cannot start a new mission** while in debt. `checkTokenDebt()` enforces this.
- **Balance** is denormalized on `User.tokenBalance` for fast reads. The `TokenTransaction` table is the source-of-truth ledger.

### Progressive reveal system

The platform gradually reveals its own mechanics as users learn about those concepts:

| Flag | Triggered at | What it unlocks |
|------|-------------|-----------------|
| `revealTokens` | Mission 2.2.4 | Token balance visible in UI |
| `revealWallet` | Mission 3.1.4 | Wallet/profile section |
| `revealGas` | Mission 3.3.3 | Gas fee costs visible on exercises |
| `revealDashboard` | Mission 6.3.4 | Full dashboard view |

Reveals are triggered inside the mission completion transaction. Once set to `true`, they never revert.

### Exercise types

| Code | Type | How it works |
|------|------|-------------|
| SI | Single Item | Select one correct answer from options |
| CM | Correct Mapping | Match items to their correct pair |
| IP | Input Puzzle | Fill in blanks with correct text |
| ST | Sorting | Order items in the correct sequence |

Each type has its own Zod submission schema and grading logic in `exerciseService.ts`. Gas fee is deducted **before** grading. The `ExerciseAttempt` records every submission (answer + correct/incorrect).

### Streaks & achievements

- **Streaks** track consecutive days with at least one mission completed. Updated inside the mission completion transaction using `updateStreakWithClient()`. If the user completes a mission on the same day as their last completion, the streak doesn't change. If it's the next day, it increments. If more than one day has passed, it resets to 1.

- **Achievements** (13 total) are checked after every mission completion:
  - 6 module completion achievements (complete all missions in a category)
  - 3 token threshold achievements (reach 100, 500, 1000 tokens)
  - 4 streak target achievements (3-day, 7-day, 14-day, 30-day streaks)

Achievement definitions live in `@transcendence/shared` (`ACHIEVEMENT_DEFINITIONS`) and are seeded into the `Achievement` table via `prisma db seed`.

---

## 11. Testing

### Unit tests

Co-located with source files as `*.test.ts`. Run with:

```bash
pnpm test                    # All workspaces
pnpm --filter api test       # API only
```

### Integration tests

Located in `apps/api/src/__tests__/integration/`. These test real HTTP requests against a real database and Redis.

```bash
pnpm test:integration
```

**Test suites (17 files):**

| Suite | What it tests |
|-------|--------------|
| `auth-flow.test.ts` | Registration, login, logout, 2FA, OAuth, password reset |
| `curriculum-progress.test.ts` | Full curriculum progression flow |
| `exercise-submission.test.ts` | All 4 exercise types (SI, CM, IP, ST) |
| `gas-fee.test.ts` | Gas fee deduction and debt enforcement |
| `token-system.test.ts` | Token balance and transaction history |
| `streak.test.ts` | Streak calculation and edge cases |
| `achievements.test.ts` | Achievement awarding logic |
| `reveals.test.ts` | Progressive reveal triggers |
| `friends.test.ts` | Friend requests, acceptance, removal, presence |
| `leaderboard.test.ts` | Weekly leaderboard with rankings |
| `notifications.test.ts` | Notification creation, delivery, preferences |
| `engagement.test.ts` | Streak reminders, re-engagement logic |
| `certificate.test.ts` | Certificate generation and sharing |
| `gdpr.test.ts` | Data export and account deletion |
| `presence.test.ts` | Socket.IO online/offline tracking |
| `publicProfile.test.ts` | Public profile endpoint |
| `health.test.ts` | Health endpoint |

### Integration test infrastructure

**Test database:** `postgresql://postgres:postgres@127.0.0.1:54322/transcendence_test` (override with `DATABASE_URL_TEST`)

**Test Redis:** `redis://localhost:6379/1` (database 1, separate from dev on database 0)

**Key helpers** (`src/__tests__/integration/helpers/`):

```typescript
// helpers/app.ts — shared app instance
import { setupApp, teardownApp, app, prisma } from "./app.js";

// helpers/db.ts — database management
import { resetDatabase, seedTestUser } from "./db.js";

// helpers/auth.ts — session management
import { createAndLoginUser, signupUser, loginUser } from "./auth.js";
```

**Writing a new integration test:**

```typescript
import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import supertest from "supertest";
import { setupApp, app, prisma } from "./helpers/app.js";
import { resetDatabase } from "./helpers/db.js";
import { createAndLoginUser } from "./helpers/auth.js";

beforeAll(() => setupApp());

describe("My feature", () => {
  beforeEach(() => resetDatabase());  // Truncates all tables + flushes Redis

  it("should do something", async () => {
    // Create an authenticated agent (registers + logs in)
    const agent = await createAndLoginUser({ email: "user@test.com" });

    // Make authenticated requests (session cookie auto-managed)
    const res = await agent.get("/api/v1/some-endpoint").expect(200);

    expect(res.body.data).toBeDefined();
  });
});
```

**Important config details** (`vitest.integration.config.ts`):
- Tests run sequentially (`fileParallelism: false`, `sequence.concurrent: false`) — they share one database
- Rate limit is set to 10,000 to avoid rate-limiting during tests
- Test timeout is 15 seconds
- Global setup runs `prisma migrate deploy` + `prisma db seed` once before all suites

---

## 12. Docker & Deployment

### Services

```
docker-compose.yml defines 4 services:

┌──────────────────────────────────────────────────────────┐
│                         web (nginx)                       │
│              Ports 80 (HTTP) → 443 (HTTPS)               │
│    Serves React SPA, proxies /api/ and /socket.io/       │
└──────────────────────┬───────────────────────────────────┘
                       │ depends_on: api (healthy)
┌──────────────────────▼───────────────────────────────────┐
│                      api (Express)                        │
│                  Internal port 3000                       │
│        Runs: prisma migrate deploy → tsx dist/            │
└───────┬──────────────────────────────────┬───────────────┘
        │ depends_on: db (healthy)         │ depends_on: redis (healthy)
┌───────▼──────────┐              ┌────────▼──────────┐
│  db (postgres:17) │              │ redis (redis:7)    │
│  Volume: db_data  │              │ No persistence     │
└──────────────────┘              └───────────────────┘
```

### Running with Docker Compose

```bash
# Generate self-signed certs for local HTTPS (one-time)
mkdir -p docker/nginx/certs
mkcert -cert-file docker/nginx/certs/cert.pem -key-file docker/nginx/certs/key.pem localhost

# Create a .env at the repo root for docker-compose:
cat > .env << 'EOF'
POSTGRES_USER=transcendence
POSTGRES_PASSWORD=change-me-in-production
POSTGRES_DB=transcendence
SESSION_SECRET=change-me-in-production
EOF

# Build and start
docker compose up --build -d

# Check health
docker compose ps
curl -k https://localhost/api/v1/health
```

### Nginx configuration highlights

- **HTTPS only** — HTTP on port 80 redirects to HTTPS on port 443
- **TLS 1.2 / 1.3** with strong cipher suite
- **Proxy rules:** `/api/` and `/socket.io/` → `api:3000` (with WebSocket upgrade for Socket.IO)
- **SPA fallback:** `try_files $uri $uri/ /index.html` for client-side routing
- **Security headers:** HSTS, X-Content-Type-Options, X-Frame-Options (SAMEORIGIN)

### Environment variables reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `DATABASE_POOL_SIZE` | No | `10` | pg.Pool max connections |
| `REDIS_URL` | No | `redis://localhost:6379` | Redis connection string |
| `SESSION_SECRET` | Yes | — | Secret for signing session cookies |
| `SESSION_TTL_SECONDS` | No | `1800` | Session expiry (30 min default, rolling) |
| `FRONTEND_URL` | No | `http://localhost:5173` | CORS allowed origin |
| `PORT` | No | `3000` | API server port |
| `RATE_LIMIT_WINDOW_MS` | No | `900000` | Rate limit window (15 min) |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window per IP |
| `TOTP_ENCRYPTION_KEY` | For 2FA | — | 32-byte hex key for AES-256-GCM TOTP encryption |
| `GOOGLE_CLIENT_ID` | For Google OAuth | — | Google OAuth2 client ID |
| `GOOGLE_CLIENT_SECRET` | For Google OAuth | — | Google OAuth2 client secret |
| `FACEBOOK_APP_ID` | For Facebook OAuth | — | Facebook app ID |
| `FACEBOOK_APP_SECRET` | For Facebook OAuth | — | Facebook app secret |
| `OAUTH_CALLBACK_BASE_URL` | For OAuth | — | Base URL for OAuth callbacks |
| `RESEND_API_KEY` | For emails | — | Resend API key (emails no-op if absent) |
| `RESEND_FROM_EMAIL` | For emails | — | Sender email address |
| `AVATAR_UPLOAD_DIR` | No | `uploads/avatars` | Directory for avatar storage |

---

## 13. Known Tech Debt & Gotchas

### `tsx` in Docker production

The API Dockerfile's CMD uses `tsx dist/src/index.js` instead of plain `node dist/src/index.js`. This is a workaround for a Prisma 7 ESM compatibility issue where the generated client doesn't resolve correctly under pure Node ESM. Once Prisma fixes this upstream, `tsx` can be removed from the production image.

### Two Redis clients

The project uses **two separate Redis client libraries**:

- **`ioredis`** (`config/redis.ts`) — for `rate-limit-redis` and the Socket.IO Redis adapter. These libraries require ioredis.
- **`redis` (node-redis v5)** (`config/session.ts`) — for `connect-redis` v9. This library dropped ioredis support in June 2024 and only works with node-redis.

Both connect to the same Redis instance. This is not ideal but is forced by library compatibility. Both are properly shut down in the graceful shutdown chain.

### MissionStatus.AVAILABLE is never persisted

The `MissionStatus` enum includes `AVAILABLE`, but this value should **never** appear in the database. It exists only as a computed status used in API responses. A mission is "available" when it has no `UserProgress` row but its prerequisites are met. The enum includes it for type completeness in the shared package.

### Graceful shutdown order matters

The shutdown chain in `index.ts` must close resources in dependency order:

1. Stop schedulers (streak reminder, re-engagement)
2. `httpServer.close()` — stop new HTTP connections
3. `io.close()` — close Socket.IO + its internal ioredis pub/sub clients
4. `disconnectSessionRedis()` — close node-redis session store
5. `disconnectRedis()` — close ioredis rate-limit client
6. `prisma.$disconnect()` — close Prisma
7. `prismaPool.end()` — close pg pool

If you add new infrastructure (e.g., a queue, another cache), add its shutdown **after** consumers and **before** databases.

### Integration tests are sequential

All integration tests share one database and run sequentially (`fileParallelism: false`). Each test suite calls `resetDatabase()` in `beforeEach` to truncate all tables and flush Redis. This makes tests slower but avoids race conditions. If test runtime becomes a problem, consider per-suite database isolation.

### Email silently no-ops without RESEND_API_KEY

All email functions (password reset, GDPR export, re-engagement) gracefully skip sending if `RESEND_API_KEY` is not set. This is intentional for local development but means you won't see email-related bugs unless you configure Resend. For testing email flows locally, check the Resend dashboard or use their test mode.

### Avatar storage is local filesystem

Avatars are stored on the local filesystem (`AVATAR_UPLOAD_DIR`), not cloud storage. In Docker, this is a named volume (`avatar-data`). This works for a single-server deployment but would need to move to S3/GCS for multi-server setups.

### Content is loaded at startup, not hot-reloaded

Changes to `content/structure.json` or locale files require a server restart. There's no file watcher or hot-reload for content. In development with `tsx watch`, changes to content files don't trigger a restart because they're not TypeScript imports — you need to manually restart.
