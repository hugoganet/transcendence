# Unblock — Transcendence

A **gamified blockchain learning platform** — think Duolingo, but for blockchain technology.

Most people are confused by blockchain, crypto, NFTs, and all that world. Existing education is either too shallow or too technical. Unblock is a structured, progressive curriculum where you learn by doing — interactive missions, quizzes, simulations — all wrapped in crypto-themed gamification (Knowledge Tokens, streaks, leaderboards).

*Created as part of the 42 curriculum by hgannet, agravier, jbriz, kamaral, theveste.*

## Quick Start

### Production (Docker Compose)

```bash
cp .env.example .env
# Edit .env: set SESSION_SECRET (openssl rand -hex 32), OAuth keys, blockchain vars

make            # Build and start the full stack
# Open https://localhost:8443 (accept self-signed cert warning)
```

### Development (local)

```bash
make setup      # Install deps, start DB + Redis, migrate, seed, run dev servers
# API: http://localhost:3000 — Web: http://localhost:5173
```

| Command | Description |
|---------|-------------|
| `make` / `make start` | Production stack (Docker + Nginx + TLS) |
| `make stop` | Stop containers |
| `make down` | Stop and remove containers |
| `make full-down` | Remove containers and volumes |
| `make re` | Clean restart |
| `make setup` | Local dev mode |

For the full setup guide, see the [Developer Guide](docs/DEVELOPER_GUIDE.md).

## Content Files

All platform content lives in `content/`. The backend loads and validates it at startup via Zod. The frontend reads it through API responses — never directly from disk.

| File | What it contains |
|------|-----------------|
| `content/structure.json` | Full curriculum tree: 6 categories → 18 chapters → 69 missions (IDs, exercise types, progressive reveal flags) |
| `content/en/missions.json` | All EN mission text — title, learning intro, exercise content (question, options/pairs/blanks, correct answer, explanation) |
| `content/fr/missions.json` | Same, in French |
| `content/en/tooltips.json` | 40 blockchain term definitions in EN (term, short definition, full explanation) |
| `content/fr/tooltips.json` | Same, in French |
| `content/en/tooltip-triggers.json` | Map of which tooltips appear contextually in each mission (EN) |
| `content/fr/tooltip-triggers.json` | Same, in French |
| `content/en/ui.json` | All platform UI copy in EN — 15 sections: navigation, auth, curriculum, exercises, tokens, gamification, wallet, dashboard, notifications, settings, onboarding, errors, tooltips, achievements, certificate |
| `content/fr/ui.json` | Same, in French |

## Project Structure

```
transcendence/
├── apps/
│   ├── api/             # Express 5 backend (complete)
│   └── web/             # React 19 + Vite 7 frontend (to build)
├── packages/
│   └── shared/          # Zod schemas, TypeScript types, constants
├── content/
│   ├── structure.json   # Curriculum tree (6 categories, 18 chapters, 69 missions)
│   ├── en/              # missions.json, tooltips.json, tooltip-triggers.json, ui.json
│   └── fr/              # Same files, French translations
├── docker/              # Dockerfiles + Nginx config
└── docs/
    ├── DEVELOPER_GUIDE.md          # ← Backend/setup start here
    ├── TEAM_STATUS.md              # ← Team overview and handoff doc
    ├── onboarding-flow-spec.md     # ← Frontend: read before building onboarding
    ├── progressive-reveal-spec.md  # ← Frontend: read before building reveal mechanics
    ├── accessibility-copy-spec.md  # ← Frontend: read before building exercises
    ├── certificate-spec.md         # ← Frontend: read before building certificate page
    ├── email-copy-spec.md          # Backend/FR: 3 new emails to implement
    ├── curriculum-syllabus.md      # Full chapter-by-chapter breakdown
    ├── copy-bank-system-messages.md # All gamification copy
    └── qa/                         # Test scenarios (core flow, reveals, gamification, FR)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Language | TypeScript 5.9 |
| Monorepo | Turborepo + pnpm workspaces |
| Backend | Express 5, Prisma 7, PostgreSQL 17, Redis 7 |
| Blockchain | Solidity smart contract + ethers.js (Avalanche RPC) |
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
| **[Team Status](docs/TEAM_STATUS.md)** | Who built what, branch state, content file reference, what's left |
| [Onboarding Flow Spec](docs/onboarding-flow-spec.md) | Screen-by-screen onboarding flow for frontend |
| [Progressive Reveal Spec](docs/progressive-reveal-spec.md) | 4 reveal mechanics with copy, trigger conditions, and implementation notes |
| [Curriculum Syllabus](docs/curriculum-syllabus.md) | Chapter-by-chapter breakdown with pedagogical notes and reveal triggers |
| [Copy Bank — System Messages](docs/copy-bank-system-messages.md) | All gamification copy: achievements, streaks, welcome-back, gas, disclaimers |
| [Accessibility Copy Spec](docs/accessibility-copy-spec.md) | Copy and ARIA patterns for interactive exercises |
| [Certificate Spec](docs/certificate-spec.md) | Certificate page design and share flow |
| [Email Copy Spec](docs/email-copy-spec.md) | All email copy EN+FR (emails 5–7 are new, unimplemented) |
| [QA Scenarios](docs/qa/) | Functional test scenarios for core flow, reveals, gamification, FR content |
| [Architecture](_bmad-output/planning-artifacts/architecture.md) | Technical architecture decisions |
| [Epics & Stories](_bmad-output/planning-artifacts/epics.md) | 8 epics, 48 stories with acceptance criteria |
| [PRD](_bmad-output/planning-artifacts/prd.md) | Product requirements |
| [UX Design Spec](_bmad-output/planning-artifacts/ux-design-specification.md) | Design system, components, interaction patterns |
| [Curriculum Roadmap](_bmad-output/planning-artifacts/curriculum-roadmap.md) | 69 missions across 6 categories |
| [User Journey Flows](_bmad-output/planning-artifacts/user-journey-flows.md) | 5 user journeys with Mermaid diagrams |

## Module Mapping

Features mapped to Transcendence subject modules (17 points total):

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
| 10 | Gaming: Gamification (Minor) | 1 | Knowledge Tokens, daily streaks, achievements, leaderboards |
| 11 | Accessibility: Multiple languages (Minor) | 1 | French + English + 1 more |
| 12 | Accessibility: Additional browsers (Minor) | 1 | Chrome + Firefox + Safari |
| 13 | Data: GDPR compliance (Minor) | 1 | Data export, deletion, confirmation emails |
| 14 | IV.9 Blockchain (Major) | 2 | Avalanche + Solidity smart contract for on-chain certificate (mint, retrieval, integrity/immutability), integrated with backend, DB fields (`nftTokenId`, `nftTxHash`, `contractAddress`) and certificate APIs/PDF |
| | **TOTAL** | **19** | |

### Blockchain Module Justification (Adapted IV.9)

The project implements the spirit of IV.9 Blockchain with a domain-adapted use case: on-chain certificate issuance instead of tournament score storage.

- Why this adaptation: Transcendence is an educational platform, so immutable proof of curriculum completion is a core business artifact, while tournament scores are not part of the product domain.
- What was implemented: Solidity smart contract for certificate records, Avalanche RPC integration via ethers.js, backend minting/retrieval flows, persistence of `nftTokenId`/`nftTxHash`/`contractAddress`, and authenticated API + PDF exposure of blockchain certificate data.
- Technical challenges addressed: smart contract interaction from backend services, idempotent minting flow, async blockchain failure handling without breaking certificate issuance, and DB/API schema evolution.
- Why this qualifies as Major: it introduces a full extra technical layer (smart contract + chain integration + persistence + API contract changes) with non-trivial architecture and operational complexity.

## Team

| 42 Login | Name | Role |
|----------|------|------|
| hgannet | Hugo Ganet | Technical Lead, Backend |
| agravier | Arthur | Product Owner, Content |
| jbriz | JB | Frontend |
| kamaral | Kauana | Backend, Blockchain |
| theveste | Theo | Project Manager, DevOps |
