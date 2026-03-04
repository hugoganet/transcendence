---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-03-04'
inputDocuments:
  - product-brief-transcendence-2026-02-20.md
  - prd.md
  - prd-validation-report.md
  - ux-design-specification.md
  - user-journey-flows.md
  - market-blockchain-crypto-nft-learning-products-research-2026-02-20.md
  - transcendence.subject.md
workflowType: 'architecture'
project_name: 'transcendence'
user_name: 'Transcender'
date: '2026-03-03'
---

# Architecture Decision Document

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**

53 FRs across 10 domains, clustering into 4 architectural subsystems:

1. **Curriculum & Exercise Engine (FR9-FR23, FR48, FR52-53)** — Sequential module unlocking, 4 exercise types (interactive placement, concept matching, simulated transactions, scenario interpretation), mission composition, progress tracking, concept refreshers, jargon tooltips, shareable certificates. The most architecturally complex subsystem — requires a flexible exercise rendering engine, a curriculum state machine, and content separated from code.

2. **Token Economy & Gamification (FR24-FR30)** — Knowledge Tokens as currency, gas-fee cost per submission, debt mechanics, streak tracking, leaderboard, achievements. A ledger/transaction system with balance calculations, earning rules, and spending rules. Tightly integrated with the exercise engine (gas on submit) and curriculum engine (progressive reveal triggers).

3. **User Management & Social (FR1-FR8, FR31-FR34, FR50-FR51)** — Auth (email/password + OAuth + 2FA), profiles, avatars, wallet-profile view, friends system, online status, age verification, financial disclaimer. Standard user management with the unique twist of wallet-profile as a progressive reveal.

4. **Platform Infrastructure (FR35-FR47, FR49)** — Notifications (real-time + re-engagement), i18n (3+ languages), cross-browser support, GDPR (export, deletion, confirmation emails), design system (10+ components), privacy/ToS pages.

**Non-Functional Requirements:**

| NFR Area | Key Targets | Architectural Impact |
|----------|------------|---------------------|
| Performance | <200ms exercise feedback, <1s page transitions, <500ms notifications, 20+ concurrent users | SPA with optimistic UI updates, WebSocket for real-time, lightweight exercise rendering |
| Security | Hashed/salted passwords, HTTPS everywhere, .env secrets, HTTP-only cookies for OAuth tokens, 256-bit 2FA encryption, 30-min session expiry | Server-side session management, secure token storage, input validation on both ends |
| Reliability | Auto-reconnect <5s, progress persistence across restarts, no data corruption under concurrency, 30-min graceful degradation via HTTP fallback | Transactional data writes, WebSocket reconnect logic, HTTP fallback for core features |
| Accessibility | WCAG AA (4.5:1 contrast), keyboard navigation on all exercises, 44x44px touch targets, screen reader support | Semantic HTML, ARIA live regions, focus management, prefers-reduced-motion support |
| Deployment | Single `docker compose up`, .env.example documented | Containerized frontend, backend, DB, reverse proxy with HTTPS |

**Scale & Complexity:**

- Primary domain: Full-stack web SPA (EdTech + gamification)
- Complexity level: Medium-High
- Architectural components: ~6 (frontend SPA, backend API, database, WebSocket layer, reverse proxy, static curriculum content files)

### Content Architecture Decision

**Curriculum content as static JSON files, database for user state only.**

- **Static JSON files** (git-versioned, in repo): Curriculum structure (module ordering, mission sequences, unlock rules, reveal trigger flags), exercise definitions, mission content, jargon tooltip definitions. Organized by locale for i18n (`/content/{locale}/`). Structure metadata in a shared language-independent file.
- **Database**: User progress, token balances, transactions, streaks, friends, sessions — everything that changes per-user at runtime. References mission IDs from JSON files.

**Rationale:**
- Curriculum is fixed and authored (6 categories → 18 chapters → 69 missions), not user-generated or dynamic
- i18n libraries (react-i18next) natively consume JSON translation files — avoids extracting DB content to JSON for the frontend
- Git-versioned content enables reviewable diffs, supporting FR52 (content tagged with last-reviewed date)
- No DB migration or seed scripts needed for content edits
- Parallel content creation and translation by team members without touching code or DB

### Technical Constraints & Dependencies

**42 Subject Hard Constraints:**
- Docker Compose single-command deployment
- HTTPS on all backend communication
- Chrome compatibility mandatory; Firefox + Safari via module
- Zero browser console warnings/errors
- .env for credentials, .env.example provided, .env in .gitignore
- Frontend framework + backend framework required (Module 1)
- ORM required (Module 3)
- Team of 4-5 people

**Product Constraints:**
- Light mode only for MVP (dark mode post-MVP)
- No offline functionality — requires backend for all progress tracking
- Mobile-primary design (320px floor), desktop secondary
- 4 distinct exercise types with unified feedback patterns

**UX Constraints:**
- 20 custom components defined with specific variants, states, and accessibility requirements
- Tailwind CSS as design token infrastructure (configured in tailwind.config)
- Progressive mechanic reveal — UI elements conditionally rendered based on curriculum milestone completion
- Bottom nav (mobile) transforms to top nav (desktop at 1024px+)
- Exercise flow hides navigation to minimize distraction

### Cross-Cutting Concerns Identified

1. **Authentication & Authorization** — Every API endpoint needs auth checks. OAuth tokens server-side. Session management with 30-min expiry. 2FA flow. Affects backend middleware, frontend route guards, WebSocket auth.

2. **Internationalization (i18n)** — All user-facing text translatable across 3+ languages. <500ms language switch without reload. Integrates with JSON content file structure. Affects every component, every content string, every error message.

3. **Progressive Reveal State** — Frontend rendering of tokens, gas, wallet-profile is conditional on curriculum progress. State fetched from backend on app load and updated on mission completion. Affects home screen, exercise view, mission complete, wallet-profile, and all token/gas display components.

4. **Curriculum Progress State** — Drives module unlocking, exercise availability, mechanic visibility, streak calculations, and resume-from-where-you-left-off. Central state that most features depend on.

5. **Input Validation** — Frontend AND backend validation on all forms (42 mandatory). Consistent validation rules and error messaging across both layers.

6. **Real-Time Connectivity** — WebSocket for online status, notifications, leaderboard. Must handle disconnect/reconnect within 5s, graceful degradation to HTTP for 30-min outages. Affects frontend connection management and backend event broadcasting.

7. **Content Governance** — Curriculum content tagged with last-reviewed dates, flagged after 6 months. Financial disclaimers on investment-related modules. Managed via JSON file metadata.

## Starter Template Evaluation

### Primary Technology Domain

Full-stack web SPA — React frontend with Express backend, PostgreSQL database, real-time WebSocket layer. Monorepo structure for shared TypeScript types between frontend and backend.

### Technology Stack (verified March 2026)

| Layer | Technology | Version | Role |
|-------|-----------|---------|------|
| **Language** | TypeScript | 5.8.x (stable) | Shared across frontend + backend |
| **Frontend** | React | 19.x | UI library |
| **Build Tool** | Vite | 7.x | Dev server, HMR, production bundling |
| **Styling** | Tailwind CSS | 4.x | Design token infrastructure, utility-first CSS |
| **Backend** | Express | 5.x | REST API server |
| **ORM** | Prisma | 7.x | Database access, schema management, migrations |
| **Database** | PostgreSQL | latest stable | Relational data store for user state |
| **Real-Time** | Socket.IO | 4.8.x | WebSocket connections (presence, notifications, leaderboard) |
| **Email** | Resend | latest | Transactional emails (GDPR confirmations, notifications) |
| **i18n** | react-i18next | latest | Frontend internationalization, consumes JSON content files |

### Starter Options Considered

**Option 1: Existing monorepo templates** (PDMLab, react-trpc-turbo, etc.)
- Several exist on GitHub but none match React+Vite+Express+Prisma+Socket.IO+Tailwind v4 exactly
- Most are stale or use outdated dependencies
- Risk of inheriting technical debt from day one
- **Verdict: Rejected**

**Option 2: T3 Stack (`create-t3-app`)**
- Well-maintained and popular, but uses Next.js as both frontend AND API layer
- No separate Express backend — wrong fit for decoupled architecture with WebSocket support
- **Verdict: Rejected**

**Option 3: DIY Monorepo on Turborepo + Vite (selected)**
- Scaffold a Turborepo monorepo, add Vite React frontend + Express backend as separate apps
- Everything on latest versions, no legacy baggage, full control over structure
- pnpm workspaces + Turborepo for task caching and pipeline ordering
- **Verdict: Selected**

### Selected Starter: DIY Monorepo (Turborepo + pnpm workspaces)

**Rationale:**
1. No well-maintained template matches the exact stack — using one would mean fighting someone else's opinions or upgrading stale dependencies
2. Full control over structure from day one
3. Latest versions of everything (Vite 7, Express 5, Tailwind 4, Prisma 7)
4. `packages/shared/` workspace enables shared TypeScript types and validation schemas (Zod) between frontend and backend — type-safe API contracts without code generation

**Project Structure:**

```
transcendence/
├── apps/
│   ├── web/              # React + Vite + Tailwind + TypeScript (frontend)
│   └── api/              # Express + Prisma + Socket.IO + TypeScript (backend)
├── packages/
│   └── shared/           # Shared types, validation schemas (Zod), constants
├── content/              # Curriculum JSON files organized by locale
│   ├── structure.json    # Language-independent curriculum structure, unlock rules, reveal triggers
│   ├── en/               # English content
│   └── fr/               # French content
├── tests/
│   └── e2e/              # Playwright end-to-end tests
├── docker/               # Dockerfiles for each service
├── docker-compose.yml
├── turbo.json
├── pnpm-workspace.yaml
├── .env.example
└── README.md
```

### Testing Strategy

| Layer | Tool | Scope | Location |
|-------|------|-------|----------|
| **Unit + Integration** | Vitest | Backend logic, utility functions, API routes (with Supertest) | `apps/api/` |
| **Component** | Vitest + React Testing Library | React component rendering, user interactions, accessibility | `apps/web/` |
| **API Integration** | Vitest + Supertest | Express route testing — HTTP assertions without starting a real server | `apps/api/` |
| **End-to-End** | Playwright | Full user flows in real browsers (Chrome + Firefox + Safari) | `tests/e2e/` |

**Tool rationale:**
- **Vitest** over Jest — Vite-native, shares TypeScript config and path aliases with the build tool, no separate configuration needed
- **Playwright** over Cypress — native multi-browser support (Chrome/Firefox/Safari in one run), directly validates the 42 cross-browser module requirement
- **Supertest** — lightweight HTTP assertion library, pairs naturally with Express
- **React Testing Library** — standard for testing React components from the user's perspective

**Note:** Project initialization using Turborepo + Vite scaffolding should be the first implementation story.

## Core Architectural Decisions

### Decision Summary

| Category | Decision | Technology | Rationale |
|----------|----------|-----------|-----------|
| Validation | Shared validation schemas | Zod | Write once in `packages/shared/`, use on frontend + backend. TypeScript-native. |
| Caching/Sessions | In-memory data store | Redis (Docker container) | Session storage, Socket.IO adapter, potential caching. Free, self-hosted. |
| Authentication | Auth middleware | Passport.js | Strategies for local, Google, Facebook, Instagram. Battle-tested with Express. |
| Sessions | Server-side sessions | express-session + connect-redis | HTTP-only cookies, 30-min expiry, easy invalidation. More secure than JWT. |
| API Style | RESTful API | Express routes | Simple, well-understood, fits the stack. |
| API Docs | In-repo documentation | Markdown in `docs/api/` | Dev-team-only audience, no Swagger overhead needed. |
| Server State | Server state management | TanStack Query (React Query) | Caching, refetching, optimistic updates for API data. |
| Client State | Client state management | Zustand | Lightweight, TypeScript-friendly. UI state, progressive reveal flags, exercise flow. |
| Routing | Client-side routing | React Router | Standard for Vite React SPAs. Protected routes for authenticated content. |

### Data Architecture

**Database:** PostgreSQL (via Prisma 7 ORM)
- User data, progress, token balances, transactions, streaks, friends, sessions metadata
- Prisma schema as single source of truth for DB structure
- Prisma migrations for schema changes

**Validation:** Zod schemas in `packages/shared/`
- Shared between frontend form validation and backend request validation
- Prisma-generated types + Zod schemas = type-safe from DB to UI
- Error messages i18n-compatible (validation returns keys, not hardcoded strings)

**Caching:** Redis (Docker container)
- Primary use: session storage (connect-redis)
- Secondary: Socket.IO adapter for WebSocket state
- Optional: curriculum JSON caching (if needed for performance)

### Authentication & Security

**Auth flow:** Passport.js with 3 strategy types:
- `passport-local` — email/password (bcrypt for hashing)
- `passport-google-oauth20`, `passport-facebook`, `passport-instagram` — OAuth 2.0
- 2FA via TOTP (e.g., speakeasy or otpauth library) — added as a second factor on local + OAuth accounts

**Session management:** express-session + connect-redis
- Sessions stored in Redis, referenced by session ID in HTTP-only secure cookie
- 30-minute inactivity expiry (configurable 15-120 min per NFR)
- Session invalidation on logout, password change, 2FA disable
- WebSocket auth: session cookie validated on Socket.IO handshake

**Security middleware stack (Express):**
- Helmet.js — security headers
- CORS — configured for frontend origin only
- Rate limiting (express-rate-limit + rate-limit-redis) — API abuse prevention
- Input validation — Zod schemas on every route handler
- HTTPS — enforced via reverse proxy (Nginx)

### API & Communication Patterns

**REST API structure:**
- Versioned: `/api/v1/`
- Resource-oriented routes (e.g., `/api/v1/missions/:id/submit`, `/api/v1/users/me/progress`)
- Consistent error response format: `{ error: { code, message, details? } }`
- HTTP status codes used correctly (200, 201, 400, 401, 403, 404, 500)

**WebSocket events (Socket.IO):**
- `presence:online` / `presence:offline` — friend online status
- `notification:push` — streak reminders, milestones, re-engagement
- `leaderboard:update` — near-real-time leaderboard changes
- Auth via session cookie on handshake, auto-reconnect within 5s

**API documentation:**
- In-repo markdown docs (`docs/api/`) describing endpoints, request/response shapes, auth requirements
- Zod schemas serve as living documentation of request/response types

### Frontend Architecture

**State management split:**
- **TanStack Query** — all server state (user profile, curriculum progress, token balance, leaderboard, friends). Handles caching, background refetching, optimistic updates.
- **Zustand** — client-only state: progressive reveal flags (loaded from server on app init), exercise flow state (current exercise index, answers), UI state (bottom nav visibility, active tooltips), locale preference.

**Routing (React Router):**
- Public routes: landing, login, signup, privacy policy, ToS
- Protected routes (require auth): home, curriculum map, exercise flow, wallet-profile, settings
- Route guards via auth context checking session status

**Component architecture:**
- 20 UX components from the design spec, built with Tailwind utility classes
- Props-driven variants, no external CSS class manipulation
- TypeScript interfaces for all component props
- Components organized by domain: `components/exercise/`, `components/curriculum/`, `components/wallet/`, `components/common/`

### Infrastructure & Deployment

**Docker Compose services:**

| Service | Image | Port | Role |
|---------|-------|------|------|
| `web` | Vite build → Nginx static | 80/443 | Frontend SPA + reverse proxy |
| `api` | Node.js (Express) | 3000 | Backend API + Socket.IO |
| `db` | PostgreSQL | 5432 | Database |
| `redis` | Redis | 6379 | Sessions + Socket.IO adapter |

**Reverse proxy:** Nginx (bundled with frontend container)
- Serves static frontend build
- Proxies `/api/*` to Express backend
- Proxies `/socket.io/*` to Socket.IO
- Handles HTTPS termination (self-signed cert for local dev, configurable for production)

**Environment configuration:**
- `.env` at repo root (gitignored)
- `.env.example` with all required variables documented
- Docker Compose reads from `.env`

### Deferred Decisions (Post-MVP)

| Decision | Rationale for Deferral |
|----------|----------------------|
| Dark mode theming | UX spec: light mode only for MVP |
| CI/CD pipeline (automated testing + deployment on git push) | Not required by 42 subject, can be added when needed |
| Horizontal scaling | 20+ concurrent users doesn't require it |
| Monitoring/logging (ELK, Prometheus) | Available as future 42 modules (DevOps category) |
| CDN for static assets (global caching network) | Not needed at MVP scale |

### Decision Dependencies

```
Zod schemas (shared) ← used by → Express routes + React forms
Prisma schema ← generates → TypeScript types ← consumed by → Zod schemas
express-session ← stores in → Redis
Socket.IO ← adapter → Redis
Passport.js ← creates → Sessions ← stored in → Redis
TanStack Query ← fetches from → REST API ← validated by → Zod
Zustand ← initialized from → TanStack Query (progressive reveal state)
React Router ← guards via → Session auth check
```

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database (Prisma schema):**

| Element | Convention | Example |
|---------|-----------|---------|
| Table names | PascalCase, singular | `User`, `Mission`, `TokenTransaction` |
| Column names | camelCase | `userId`, `createdAt`, `tokenBalance` |
| Foreign keys | `{relatedModel}Id` | `userId`, `missionId` |
| Enums | PascalCase name, UPPER_SNAKE values | `enum ExerciseType { INTERACTIVE_PLACEMENT, CONCEPT_MATCHING }` |
| Indexes | auto-generated by Prisma | — |

**API endpoints:**

| Element | Convention | Example |
|---------|-----------|---------|
| Base path | `/api/v1/` | `/api/v1/missions` |
| Resources | plural, kebab-case | `/api/v1/token-transactions` |
| Route params | `:camelCase` | `/api/v1/missions/:missionId/submit` |
| Query params | camelCase | `?pageSize=10&sortBy=createdAt` |

**Code (TypeScript):**

| Element | Convention | Example |
|---------|-----------|---------|
| Files — React components | PascalCase.tsx | `MissionCard.tsx`, `ExerciseContainer.tsx` |
| Files — utilities, hooks, services | camelCase.ts | `useAuth.ts`, `tokenService.ts` |
| Files — tests | `*.test.ts` / `*.test.tsx` | `tokenService.test.ts` |
| Variables & functions | camelCase | `getUserProgress`, `tokenBalance` |
| Types & interfaces | PascalCase, no `I` prefix | `UserProfile`, `MissionProgress` |
| Constants | UPPER_SNAKE_CASE | `MAX_GAS_COST`, `SESSION_TIMEOUT_MS` |
| React components | PascalCase | `function MissionCard()` |
| Custom hooks | `use` prefix, camelCase | `useProgress`, `useTokenBalance` |
| Zustand stores | `use{Name}Store` | `useRevealStore`, `useExerciseStore` |

### Structure Patterns

**Test location:** Co-located with source files.

```
components/
  Button/
    Button.tsx
    Button.test.tsx
services/
  tokenService.ts
  tokenService.test.ts
```

**Component organization:** By domain, not by type.

```
components/
  common/       # Button, Card, ProgressBar, Tooltip, BottomNav
  exercise/     # ExerciseContainer, FeedbackBanner, GasIndicator
  curriculum/   # CurriculumNode, MissionIntroCard, MissionComplete
  wallet/       # TokenDisplay, TransactionList, StreakIndicator
  auth/         # AuthForm, MicroOnboarding
  engagement/   # WelcomeBack, MechanicReveal, BreakSuggestion, ConceptRefresher
```

**Backend organization:** By domain layer.

```
apps/api/src/
  routes/         # Express route handlers (thin — validate, call service, respond)
  services/       # Business logic (token calculations, streak logic, progress tracking)
  middleware/     # Auth, validation, error handling, rate limiting
  prisma/         # Prisma schema, migrations, seed
  socket/         # Socket.IO event handlers
  utils/          # Shared helpers
```

**Key rule:** Route handlers are thin — they validate input (Zod), call a service, and return a response. Business logic lives in services, not in routes.

### Format Patterns

**API response format:**

```typescript
// Success
{ data: T }

// Success with pagination
{ data: T[], meta: { page: number, pageSize: number, total: number } }

// Error
{ error: { code: string, message: string, details?: Record<string, string> } }
```

**Error codes:** UPPER_SNAKE_CASE — e.g., `INVALID_INPUT`, `UNAUTHORIZED`, `MISSION_LOCKED`, `INSUFFICIENT_TOKENS`.

**Dates:** ISO 8601 strings in API responses (`2026-03-04T14:30:00.000Z`). Never timestamps, never locale-formatted strings.

**JSON field naming:** camelCase everywhere (API requests, responses, WebSocket payloads). The frontend never sees snake_case.

**Null handling:** Use `null` for absent optional values in API responses, never `undefined` or empty string. Prisma handles this naturally.

### Communication Patterns

**Socket.IO events:** `domain:action` format, all lowercase.

| Event | Direction | Payload |
|-------|-----------|---------|
| `presence:online` | server → client | `{ userId: string }` |
| `presence:offline` | server → client | `{ userId: string }` |
| `notification:push` | server → client | `{ type: string, title: string, body: string, data?: object }` |
| `leaderboard:update` | server → client | `{ entries: LeaderboardEntry[] }` |

**Zustand store pattern:**

```typescript
// One store per domain concern
export const useRevealStore = create<RevealState>((set) => ({
  tokensRevealed: false,
  gasRevealed: false,
  walletRevealed: false,
  setRevealed: (mechanic, value) => set({ [mechanic]: value }),
}))
```

**TanStack Query key convention:** `[domain, ...params]`

```typescript
queryKey: ['progress', userId]
queryKey: ['missions', moduleId]
queryKey: ['leaderboard']
queryKey: ['user', 'me']
```

### Process Patterns

**Error handling:**

- Backend: Express error-handling middleware catches all errors. Services throw typed errors (`AppError` class with code + message + status). Routes never try/catch — the middleware handles it.
- Frontend: React Error Boundaries for component crashes. TanStack Query `onError` for API failures. Toast/banner for user-facing errors — never `alert()`.

**Loading states:**

- TanStack Query provides `isLoading`, `isError`, `data` — use these directly, don't duplicate in local state.
- Skeleton components (neutral-100 pulsing blocks) for screen loads, inline spinners for action submissions.
- Never full-screen loading overlays — matches UX spec.

**Validation flow:**

1. Frontend: Zod validates form input on blur (not keystroke)
2. Frontend: Zod validates full form on submit
3. Backend: Zod validates request body/params in middleware before route handler runs
4. If validation fails: return `400` with `{ error: { code: 'INVALID_INPUT', message, details: { field: 'error key' } } }`

### Enforcement

**All code must:**

- Pass TypeScript strict mode (no `any`, no `@ts-ignore`)
- Follow the naming conventions above — ESLint rules will enforce where possible
- Use Zod for all validation (no manual `if` checks on request bodies)
- Use the standard API response format (no custom wrappers)
- Co-locate tests with source files
- Keep route handlers thin (validate → service → respond)

## Project Structure & Boundaries

### Complete Project Directory Structure

```
transcendence/
├── apps/
│   ├── web/                              # FRONTEND (React + Vite + Tailwind)
│   │   ├── public/
│   │   │   ├── favicon.ico
│   │   │   └── locales/                  # i18n JSON files (loaded by react-i18next)
│   │   │       ├── en/
│   │   │       │   └── translation.json
│   │   │       └── fr/
│   │   │           └── translation.json
│   │   ├── src/
│   │   │   ├── main.tsx                  # App entry point
│   │   │   ├── App.tsx                   # Root component, router setup
│   │   │   ├── index.css                 # Tailwind directives
│   │   │   ├── components/
│   │   │   │   ├── common/               # Button, Card, ProgressBar, Tooltip, BottomNav, TopNav
│   │   │   │   │   ├── Button/
│   │   │   │   │   │   ├── Button.tsx
│   │   │   │   │   │   └── Button.test.tsx
│   │   │   │   │   ├── Card/
│   │   │   │   │   ├── ProgressBar/
│   │   │   │   │   ├── Tooltip/
│   │   │   │   │   ├── BottomNav/
│   │   │   │   │   └── TopNav/
│   │   │   │   ├── exercise/             # ExerciseContainer, FeedbackBanner, GasIndicator
│   │   │   │   │   ├── ExerciseContainer/
│   │   │   │   │   ├── FeedbackBanner/
│   │   │   │   │   ├── GasIndicator/
│   │   │   │   │   ├── InteractivePlacement/
│   │   │   │   │   ├── ConceptMatching/
│   │   │   │   │   ├── SimulatedTransaction/
│   │   │   │   │   └── ScenarioInterpretation/
│   │   │   │   ├── curriculum/           # CurriculumNode, MissionIntroCard, MissionComplete
│   │   │   │   │   ├── CurriculumNode/
│   │   │   │   │   ├── MissionIntroCard/
│   │   │   │   │   └── MissionComplete/
│   │   │   │   ├── wallet/              # TokenDisplay, TransactionList, StreakIndicator
│   │   │   │   │   ├── TokenDisplay/
│   │   │   │   │   ├── TransactionList/
│   │   │   │   │   └── StreakIndicator/
│   │   │   │   ├── auth/               # AuthForm, MicroOnboarding
│   │   │   │   │   ├── AuthForm/
│   │   │   │   │   └── MicroOnboarding/
│   │   │   │   └── engagement/          # WelcomeBack, MechanicReveal, BreakSuggestion, ConceptRefresher
│   │   │   │       ├── WelcomeBack/
│   │   │   │       ├── MechanicReveal/
│   │   │   │       ├── BreakSuggestion/
│   │   │   │       └── ConceptRefresher/
│   │   │   ├── pages/                   # Route-level page components
│   │   │   │   ├── Landing.tsx
│   │   │   │   ├── Login.tsx
│   │   │   │   ├── Signup.tsx
│   │   │   │   ├── Home.tsx
│   │   │   │   ├── CurriculumMap.tsx
│   │   │   │   ├── ExerciseView.tsx
│   │   │   │   ├── WalletProfile.tsx
│   │   │   │   ├── Settings.tsx
│   │   │   │   ├── PrivacyPolicy.tsx
│   │   │   │   └── TermsOfService.tsx
│   │   │   ├── hooks/                   # Custom React hooks
│   │   │   │   ├── useAuth.ts
│   │   │   │   ├── useProgress.ts
│   │   │   │   ├── useTokenBalance.ts
│   │   │   │   ├── useSocket.ts
│   │   │   │   └── useExercise.ts
│   │   │   ├── stores/                  # Zustand stores (client state)
│   │   │   │   ├── useRevealStore.ts
│   │   │   │   ├── useExerciseStore.ts
│   │   │   │   └── useUIStore.ts
│   │   │   ├── api/                     # TanStack Query hooks (server state)
│   │   │   │   ├── queryClient.ts
│   │   │   │   ├── useUser.ts
│   │   │   │   ├── useMissions.ts
│   │   │   │   ├── useLeaderboard.ts
│   │   │   │   └── useFriends.ts
│   │   │   ├── lib/                     # Utility functions
│   │   │   │   ├── i18n.ts             # react-i18next config
│   │   │   │   ├── socket.ts           # Socket.IO client setup
│   │   │   │   └── api.ts             # Fetch wrapper with auth
│   │   │   └── types/                  # Frontend-specific types
│   │   │       └── index.ts
│   │   ├── tailwind.config.ts          # Design tokens, custom theme
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   └── package.json
│   │
│   └── api/                             # BACKEND (Express + Prisma + Socket.IO)
│       ├── src/
│       │   ├── index.ts                 # Server entry point (Express + Socket.IO)
│       │   ├── app.ts                   # Express app setup (middleware, routes)
│       │   ├── routes/                  # Route handlers (thin: validate → service → respond)
│       │   │   ├── auth.ts             # FR1-FR3, FR7-FR8: signup, login, logout, OAuth, 2FA
│       │   │   ├── users.ts            # FR4-FR6, FR31-FR34: profiles, avatars, friends, wallet-profile
│       │   │   ├── curriculum.ts       # FR9-FR14, FR16-FR17: modules, missions, progress, tooltips
│       │   │   ├── exercises.ts        # FR18-FR23, FR48: exercise submission, feedback
│       │   │   ├── tokens.ts           # FR24-FR26, FR30: balance, transactions, gas
│       │   │   ├── gamification.ts     # FR27-FR29: leaderboard, achievements, streaks
│       │   │   ├── notifications.ts    # FR35-FR38: notification preferences, history
│       │   │   ├── gdpr.ts            # FR43-FR45: data export, deletion
│       │   │   ├── content.ts         # FR39, FR52-FR53: language, content metadata
│       │   │   └── pages.ts           # FR46-FR47, FR50-FR51: privacy, ToS, disclaimers
│       │   ├── services/               # Business logic
│       │   │   ├── authService.ts
│       │   │   ├── userService.ts
│       │   │   ├── curriculumService.ts
│       │   │   ├── exerciseService.ts
│       │   │   ├── tokenService.ts
│       │   │   ├── streakService.ts
│       │   │   ├── leaderboardService.ts
│       │   │   ├── notificationService.ts
│       │   │   ├── gdprService.ts
│       │   │   └── emailService.ts     # Resend integration
│       │   ├── middleware/
│       │   │   ├── auth.ts             # Session/passport checks
│       │   │   ├── validate.ts         # Zod validation middleware
│       │   │   ├── errorHandler.ts     # Global error handler
│       │   │   └── rateLimiter.ts      # express-rate-limit + Redis
│       │   ├── socket/                 # Socket.IO event handlers
│       │   │   ├── index.ts            # Socket.IO server setup
│       │   │   ├── presence.ts         # Online status tracking
│       │   │   ├── notifications.ts    # Push notifications
│       │   │   └── leaderboard.ts      # Leaderboard updates
│       │   ├── config/
│       │   │   ├── passport.ts         # Passport strategies (local, Google, Facebook, Instagram)
│       │   │   ├── session.ts          # express-session + connect-redis config
│       │   │   ├── redis.ts            # Redis client setup
│       │   │   └── env.ts             # Environment variable validation (Zod)
│       │   ├── utils/
│       │   │   ├── AppError.ts         # Typed error class
│       │   │   ├── contentLoader.ts    # Load curriculum JSON files
│       │   │   └── logger.ts           # Logging utility
│       │   └── types/                  # Backend-specific types
│       │       └── index.ts
│       ├── prisma/
│       │   ├── schema.prisma           # Database schema
│       │   ├── migrations/             # Prisma migrations
│       │   └── seed.ts                 # DB seed data
│       ├── tsconfig.json
│       ├── vitest.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                          # SHARED (types, validation, constants)
│       ├── src/
│       │   ├── schemas/                # Zod validation schemas
│       │   │   ├── auth.ts            # Login, signup, 2FA schemas
│       │   │   ├── user.ts            # Profile update, avatar schemas
│       │   │   ├── exercise.ts        # Exercise submission schemas
│       │   │   ├── mission.ts         # Mission-related schemas
│       │   │   └── common.ts          # Pagination, ID params, etc.
│       │   ├── types/                 # Shared TypeScript types
│       │   │   ├── api.ts            # API response/error types
│       │   │   ├── user.ts
│       │   │   ├── curriculum.ts
│       │   │   ├── exercise.ts
│       │   │   ├── token.ts
│       │   │   └── socket.ts         # Socket.IO event types
│       │   ├── constants/            # Shared constants
│       │   │   ├── exercises.ts      # Exercise type enums
│       │   │   ├── curriculum.ts     # Module/mission constants
│       │   │   └── config.ts         # Shared config values
│       │   └── index.ts              # Barrel export
│       ├── tsconfig.json
│       └── package.json
│
├── content/                             # CURRICULUM CONTENT (static JSON)
│   ├── structure.json                  # Language-independent: module order, missions, unlock rules, reveal triggers
│   ├── en/                             # English content
│   │   ├── missions.json              # Mission titles, descriptions, exercise content
│   │   ├── tooltips.json              # Jargon tooltip definitions + analogies
│   │   └── ui.json                    # UI strings (overrides for curriculum-specific text)
│   └── fr/                             # French content
│       ├── missions.json
│       ├── tooltips.json
│       └── ui.json
│
├── tests/
│   └── e2e/                            # PLAYWRIGHT E2E TESTS
│       ├── fixtures/                   # Test fixtures and helpers
│       ├── specs/
│       │   ├── onboarding.spec.ts     # Journey 1: first-time user
│       │   ├── dailySession.spec.ts   # Journey 2: return → mission → chain
│       │   ├── mechanicReveal.spec.ts # Journey 3: progressive reveals
│       │   ├── returnUser.spec.ts     # Journey 4: drop-off & return
│       │   └── curriculum.spec.ts     # Journey 5: curriculum navigation
│       ├── playwright.config.ts
│       └── package.json
│
├── docker/                              # DOCKER CONFIGURATION
│   ├── web.Dockerfile                  # Frontend: build with Vite, serve with Nginx
│   ├── api.Dockerfile                  # Backend: Node.js with Express
│   └── nginx.conf                      # Reverse proxy config (HTTPS, /api/*, /socket.io/*)
│
├── docs/                                # PROJECT DOCUMENTATION
│   └── api/                            # API endpoint documentation (markdown)
│       ├── auth.md
│       ├── users.md
│       ├── curriculum.md
│       ├── exercises.md
│       └── tokens.md
│
├── docker-compose.yml                   # Orchestrates: web, api, db, redis
├── .env.example                         # All required env vars documented
├── .gitignore
├── turbo.json                           # Turborepo pipeline config
├── pnpm-workspace.yaml                  # Workspace definitions
├── package.json                         # Root package.json
└── README.md
```

### Architectural Boundaries

**API Boundaries:**

- Frontend ↔ Backend: REST API at `/api/v1/*`, authenticated via session cookie
- Frontend ↔ WebSocket: Socket.IO at `/socket.io/*`, authenticated via session cookie on handshake
- Backend ↔ Database: Prisma client, all access through service layer (never direct DB calls from routes)
- Backend ↔ Redis: Session storage + Socket.IO adapter + rate limiting
- Backend ↔ Resend: Email service for GDPR confirmations, notifications
- Backend ↔ OAuth providers: Passport.js strategies (Google, Facebook, Instagram)

**Component Boundaries:**

- Pages import components, never other pages
- Components never import pages
- Components within a domain (e.g., `exercise/`) can import from `common/` but not from other domains
- Cross-domain data sharing goes through hooks/stores, not direct component imports
- Zustand stores are domain-scoped (reveal, exercise, UI) — no global store

**Data Boundaries:**

- Route handlers never access Prisma directly — always through services
- Services own all business logic and data access
- Curriculum content loaded from JSON files via `contentLoader.ts` — never from DB
- User state loaded from PostgreSQL via Prisma — never from JSON files

### FR Category to Structure Mapping

| FR Category | Routes | Services | Frontend Pages | Components |
|-------------|--------|----------|---------------|------------|
| User Management (FR1-FR8) | `auth.ts`, `users.ts` | `authService`, `userService` | Login, Signup, Settings | `auth/`, `common/` |
| Curriculum (FR9-FR17, FR48) | `curriculum.ts` | `curriculumService` | Home, CurriculumMap | `curriculum/` |
| Exercises (FR18-FR23) | `exercises.ts` | `exerciseService` | ExerciseView | `exercise/` |
| Gamification (FR24-FR30) | `tokens.ts`, `gamification.ts` | `tokenService`, `streakService`, `leaderboardService` | WalletProfile, Home | `wallet/` |
| Social (FR31-FR34) | `users.ts` | `userService` | WalletProfile, Settings | `common/` |
| Notifications (FR35-FR38) | `notifications.ts` | `notificationService` | (all pages via socket) | `common/` |
| i18n (FR39-FR42) | `content.ts` | — | (all pages) | (all components) |
| GDPR (FR43-FR47) | `gdpr.ts`, `pages.ts` | `gdprService`, `emailService` | Settings, PrivacyPolicy, ToS | `common/` |
| Design System (FR49) | — | — | — | All 20 components |
| Content Governance (FR50-FR53) | `pages.ts`, `content.ts` | — | (disclaimers on relevant pages) | `common/` |

### Data Flow

```
User Action (click, drag, submit)
  → React Component (UI event)
    → Zustand Store (if client state) OR TanStack Query mutation (if server state)
      → REST API call (fetch with auth cookie)
        → Express Route Handler (validate with Zod)
          → Service Layer (business logic)
            → Prisma (DB read/write) + Content JSON (curriculum data)
          ← Response
        ← JSON response { data } or { error }
      ← TanStack Query cache update
    ← Component re-render

Real-time events:
  Server Event (streak reminder, friend online, leaderboard change)
    → Socket.IO server emit
      → Socket.IO client receive
        → Zustand Store update OR TanStack Query cache invalidation
          → Component re-render
```

## Architecture Validation Results

### Coherence Validation

**Decision Compatibility:** All technology choices are compatible:

- React 19 + Vite 7 + Tailwind 4 — proven combination, well-supported
- Express 5 + Prisma 7 + PostgreSQL — standard backend stack, no conflicts
- Socket.IO 4.8 works with Express 5 and Redis adapter
- Passport.js + express-session + connect-redis — battle-tested session auth chain
- TanStack Query + Zustand — complementary (server state vs client state), no overlap
- Zod works on both frontend and backend via shared package
- Turborepo + pnpm workspaces — standard monorepo tooling for TypeScript projects

**Pattern Consistency:** No contradictions found:

- camelCase in TypeScript code + camelCase in JSON API responses + camelCase Prisma columns = consistent throughout
- PascalCase for React components + PascalCase.tsx filenames = aligned
- Co-located tests match the domain-based component organization
- Thin routes → services pattern is consistent with the data boundary rule (routes never touch Prisma)

**Structure Alignment:** Project structure supports all decisions:

- `packages/shared/` enables the Zod schema sharing strategy
- `content/` directory structure maps to the JSON content + i18n decision
- Backend `services/` layer enforces the data boundary rules
- Socket handlers in `socket/` are cleanly separated from REST routes

### Requirements Coverage

**FR Coverage (53 FRs):**

| FR Range | Category | Architectural Support | Status |
|----------|----------|----------------------|--------|
| FR1-FR8 | User Management | Passport.js + express-session + Prisma User model | Covered |
| FR9-FR17, FR48 | Curriculum | JSON content files + curriculumService + curriculum components | Covered |
| FR18-FR23 | Exercises | 4 exercise components + exerciseService + ExerciseContainer wrapper | Covered |
| FR24-FR30 | Gamification | tokenService + streakService + leaderboardService + wallet components | Covered |
| FR31-FR34 | Social | userService + friends + Socket.IO presence | Covered |
| FR35-FR38 | Notifications | Socket.IO push + notificationService | Covered |
| FR39-FR42 | Accessibility/i18n | react-i18next + JSON locale files + Tailwind responsive + Playwright cross-browser | Covered |
| FR43-FR47 | GDPR/Legal | gdprService + emailService (Resend) + static pages | Covered |
| FR49 | Design System | 20 Tailwind components in domain-organized structure | Covered |
| FR50-FR53 | Content Governance | JSON metadata + disclaimers in pages | Covered |

**NFR Coverage:**

| NFR | Architectural Support | Status |
|-----|----------------------|--------|
| <200ms exercise feedback | SPA with optimistic UI (TanStack Query mutations) | Covered |
| <1s page transitions | Client-side routing (React Router), Vite code splitting | Covered |
| <500ms notifications | Socket.IO server push | Covered |
| 20+ concurrent users | PostgreSQL + Redis + Express (single process sufficient) | Covered |
| HTTPS everywhere | Nginx reverse proxy with SSL termination | Covered |
| Hashed passwords | bcrypt via Passport.js local strategy | Covered |
| HTTP-only cookies | express-session config | Covered |
| 30-min session expiry | connect-redis TTL configuration | Covered |
| Auto-reconnect <5s | Socket.IO built-in reconnection | Covered |
| WCAG AA | Semantic HTML + ARIA in component specs + axe-core testing | Covered |
| Docker single-command | docker-compose.yml orchestrating 4 services | Covered |
| Zero console errors | TypeScript strict + ESLint + Playwright E2E validation | Covered |

### Gap Analysis

**Critical Gaps:** None found.

**Minor Gaps (non-blocking):**

1. **Database schema not defined yet** — Prisma schema needs to be designed during implementation. The architecture defines which services access which data, but the actual table structure is an implementation task.
2. **Avatar upload storage** — FR5 requires avatar upload. For MVP with Docker: local filesystem mapped to a Docker volume. Add storage path to `.env.example`.
3. **Certificate generation** — FR15 (shareable certificates) needs a rendering approach. Deferred to implementation.
4. **Third i18n language** — FR39 requires French + English + 1 more. The architecture supports it (just add another locale folder), but the third language hasn't been chosen.

### Architecture Completeness Checklist

**Requirements Analysis**

- [x] Project context thoroughly analyzed (53 FRs, NFRs, 42 constraints)
- [x] Scale and complexity assessed (Medium-High)
- [x] Technical constraints identified (42 subject, UX spec, product constraints)
- [x] Cross-cutting concerns mapped (7 concerns)

**Architectural Decisions**

- [x] Critical decisions documented with versions (10 technology choices)
- [x] Technology stack fully specified (all versions verified March 2026)
- [x] Integration patterns defined (REST + Socket.IO + Prisma + Redis)
- [x] Performance considerations addressed (optimistic UI, WebSocket, caching)

**Implementation Patterns**

- [x] Naming conventions established (DB, API, code — all camelCase-aligned)
- [x] Structure patterns defined (co-located tests, domain-based organization)
- [x] Communication patterns specified (Socket.IO events, Zustand stores, TanStack Query keys)
- [x] Process patterns documented (error handling, loading states, validation flow)

**Project Structure**

- [x] Complete directory structure defined (~80 files/directories mapped)
- [x] Component boundaries established (domain isolation, data flow rules)
- [x] Integration points mapped (API ↔ frontend, Socket.IO, Redis, OAuth)
- [x] Requirements to structure mapping complete (all 53 FRs mapped)

### Architecture Readiness Assessment

**Overall Status: READY FOR IMPLEMENTATION**

**Confidence Level:** High

**Key Strengths:**

- Every FR has a clear home (route, service, component)
- Shared Zod schemas prevent frontend/backend validation drift
- Domain-based organization scales well for a 4-5 person team (each person can own a domain)
- Progressive reveal cleanly handled via Zustand store + curriculum milestone flags
- Content architecture (JSON files) enables parallel content creation without code changes

**Areas for Future Enhancement:**

- Database schema design (first implementation task after scaffolding)
- Avatar storage strategy (Docker volume for MVP)
- Third language selection
- Certificate rendering approach
- Performance profiling once 20+ user target is tested

### Implementation Handoff

**First implementation priorities (in order):**

1. Scaffold Turborepo monorepo with pnpm workspaces
2. Set up Vite React app (`apps/web/`) with Tailwind 4
3. Set up Express server (`apps/api/`) with TypeScript
4. Set up shared package (`packages/shared/`) with Zod
5. Design and create Prisma schema
6. Set up Docker Compose (web, api, db, redis)
7. Configure Nginx reverse proxy with HTTPS
