# Transcendence

A **gamified blockchain learning platform** — think Duolingo, but for blockchain technology.

Most people are confused by blockchain, crypto, NFTs, and all that world. Existing education is either too shallow or too technical. Transcendence is a structured, progressive curriculum where you learn by doing — interactive missions, quizzes, simulations — all wrapped in crypto-themed gamification (Knowledge Tokens, streaks, leaderboards).

## Current State

**Backend: complete.** All 8 epics (48 stories) are implemented, tested, and deployed. This includes authentication (local + OAuth + 2FA), curriculum engine, exercise system, token economy, gamification, social features, notifications, and GDPR compliance.

**Frontend: not started.** The `apps/web` directory contains only scaffolding (landing page, Privacy Policy, Terms of Service). The real frontend development begins now.

### What's ready for the frontend team

- 50+ REST API endpoints across 12 domains (auth, users, curriculum, exercises, tokens, gamification, friends, notifications, GDPR, certificates, tooltips, disclaimers)
- Real-time Socket.IO events (notifications, presence)
- Shared Zod schemas and TypeScript types in `@transcendence/shared` — use them for form validation and API response typing
- Full integration test suite (17 test files) as living documentation of API behavior
- Docker Compose deployment with Nginx reverse proxy

**Read the [Developer Guide](docs/DEVELOPER_GUIDE.md) to get started.** It covers everything: setup, architecture, full API reference, database schema, testing, and known gotchas.

## Quick Start

```bash
# Prerequisites: Node.js 22, pnpm 10.22+, Docker

pnpm install

# Start Postgres and Redis
docker run -d --name transcendence-db \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres \
  -p 54322:5432 postgres:17
docker run -d --name transcendence-redis -p 6379:6379 redis:7-alpine

# Setup database
pnpm --filter api db:generate
pnpm --filter api db:migrate
pnpm --filter api db:seed

# Start dev servers
pnpm dev
# API: http://localhost:3000 — Web: http://localhost:5173
```

For the full setup (test database, environment variables, Docker deployment), see the [Developer Guide](docs/DEVELOPER_GUIDE.md#4-getting-started).

## Project Structure

```
transcendence/
├── apps/
│   ├── api/             # Express 5 backend (complete)
│   └── web/             # React 19 + Vite 7 frontend (to build)
├── packages/
│   └── shared/          # Zod schemas, TypeScript types, constants
├── content/             # Curriculum JSON (6 categories, 18 chapters, 69 missions)
├── docker/              # Dockerfiles + Nginx config
└── docs/
    └── DEVELOPER_GUIDE.md  # ← Start here
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.9 |
| Monorepo | Turborepo + pnpm workspaces |
| Backend | Express 5, Prisma 7, PostgreSQL 17, Redis 7 |
| Real-time | Socket.IO 4.8 |
| Auth | Passport.js (local + Google + Facebook), TOTP 2FA |
| Frontend | React 19, Vite 7, Tailwind 4 |
| Testing | Vitest, Supertest |
| Deployment | Docker Compose, Nginx |

## Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start API + Web dev servers |
| `pnpm build` | Build all workspaces |
| `pnpm test` | Run unit tests |
| `pnpm test:integration` | Run API integration tests |
| `pnpm lint` | Lint all workspaces |
| `pnpm format` | Format with Prettier |
| `pnpm --filter api db:studio` | Open Prisma Studio (visual DB browser) |

## Documentation

| Document | Description |
|----------|-------------|
| **[Developer Guide](docs/DEVELOPER_GUIDE.md)** | Full onboarding guide — setup, architecture, API reference, testing, deployment |
| [Architecture](_bmad-output/planning-artifacts/architecture.md) | Technical architecture decisions |
| [Epics & Stories](_bmad-output/planning-artifacts/epics.md) | 8 epics, 48 stories with acceptance criteria |
| [PRD](_bmad-output/planning-artifacts/prd.md) | Product requirements |
| [UX Design Spec](_bmad-output/planning-artifacts/ux-design-specification.md) | Design system, components, interaction patterns |
| [Curriculum Roadmap](_bmad-output/planning-artifacts/curriculum-roadmap.md) | 69 missions across 6 categories |
| [User Journey Flows](_bmad-output/planning-artifacts/user-journey-flows.md) | 5 user journeys with Mermaid diagrams |

## Module Mapping

Features mapped to Transcendence subject modules (22 points total):

| # | Subject Module | Pts | Features |
|---|---------------|-----|----------|
| 1 | Web: FE + BE Frameworks (Major) | 2 | React/Next.js + NestJS/Express |
| 2 | Web: Real-time features (Major) | 2 | Live market ticker, real-time notifications, WebSocket updates |
| 3 | Web: User interaction (Major) | 2 | Community resources, profiles, friends system |
| 4 | Web: ORM (Minor) | 1 | Prisma or TypeORM |
| 5 | Web: Notification system (Minor) | 1 | Market alerts, streak reminders, milestones |
| 6 | Web: Custom design system (Minor) | 1 | 10+ reusable components |
| 7 | User Mgmt: Standard user management (Major) | 2 | Profile, avatar, friends, online status, wallet-profile |
| 8 | User Mgmt: OAuth 2.0 (Minor) | 1 | Google + Facebook + Instagram |
| 9 | User Mgmt: 2FA (Minor) | 1 | Two-factor authentication |
| 10 | AI: LLM system interface (Major) | 2 | AI Coach — adaptive, Feynman evaluation, market news interpretation |
| 11 | AI: RAG system (Major) | 2 | AI Coach memory — user history, learning gaps, personalized coaching |
| 12 | AI: Sentiment analysis (Minor) | 1 | Analyze user responses for confidence/confusion |
| 13 | Gaming: Gamification (Minor) | 1 | Knowledge Tokens, daily streaks, achievements, leaderboards |
| 14 | Accessibility: Multiple languages (Minor) | 1 | French + English + 1 more |
| 15 | Accessibility: Additional browsers (Minor) | 1 | Chrome + Firefox + Safari |
| 16 | Data: GDPR compliance (Minor) | 1 | Data export, deletion, confirmation emails |
| | **TOTAL** | **22** | |

## Team

| Name | Role |
|------|------|
| Hugo Ganet | Developer |
