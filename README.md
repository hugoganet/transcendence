# Transcendence

## Project Description

A **gamified blockchain learning platform** — think Duolingo, but for blockchain technology.

Most people are confused by blockchain, crypto, NFTs, and all that world. Existing education is either too shallow (watch a 2-min video, earn $3 in tokens) or too technical (developer bootcamps). There's nothing in between for normal people who just want to understand it.

Transcendence is a structured, progressive curriculum where you learn by doing — interactive missions, quizzes, simulations — all wrapped in crypto-themed gamification (Knowledge Tokens, streaks, leaderboards). No crypto-bro vibes, just clean and professional design.

## Setup Instructions

### Prerequisites

- **Node.js** >= 20.19
- **pnpm** >= 10.x (enable with `corepack enable`)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd transcendence

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env

# Start development servers
pnpm dev
```

### Available Commands

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `pnpm dev`          | Start all development servers |
| `pnpm build`        | Build all packages and apps   |
| `pnpm test`         | Run all tests                 |
| `pnpm lint`         | Lint all workspaces           |
| `pnpm format`       | Format code with Prettier     |
| `pnpm format:check` | Check formatting              |

## Environment Variables

Copy `.env.example` to `.env` and fill in the values:

| Variable         | Description                  | Default |
| ---------------- | ---------------------------- | ------- |
| `PORT`           | API server port              | `3000`  |
| `DATABASE_URL`   | PostgreSQL connection string | —       |
| `REDIS_URL`      | Redis connection string      | —       |
| `SESSION_SECRET` | Secret for session signing   | —       |

## Usage

### Development

The project uses a Turborepo monorepo with three workspaces:

- **`apps/web`** — React 19 + Vite 7 + Tailwind CSS 4 frontend
- **`apps/api`** — Express 5 backend API
- **`packages/shared`** — Shared TypeScript types, Zod schemas, and constants

Run `pnpm dev` to start both the frontend and backend in development mode.

### Testing

```bash
# Run all tests
pnpm test

# Run tests for a specific workspace
pnpm --filter @transcendence/web test
pnpm --filter @transcendence/api test
```

## Team Members

| Name       | Role      |
| ---------- | --------- |
| Hugo Ganet | Developer |

## Planning Artifacts

All planning documents live in [`_bmad-output/planning-artifacts/`](_bmad-output/planning-artifacts/). Here's the reading order:

### 1. Vision & Research

- **[Product Brief](_bmad-output/planning-artifacts/product-brief-transcendence-2026-02-20.md)** — Product vision, target users, success metrics, MVP scope, and future roadmap.
- **[Market Research](_bmad-output/planning-artifacts/research/market-blockchain-crypto-nft-learning-products-research-2026-02-20.md)** — Competitive landscape, user segments, pain points, and market opportunity.

### 2. Product Requirements

- **[PRD](_bmad-output/planning-artifacts/prd.md)** — Detailed product requirements: features, user stories, token economy, and acceptance criteria.
- **[PRD Validation Report](_bmad-output/planning-artifacts/prd-validation-report.md)** — Independent review of the PRD (4/5 — usable with minor measurability fixes needed).

### 3. UX & Design

- **[UX Design Specification](_bmad-output/planning-artifacts/ux-design-specification.md)** — Full UX spec: design system (colors, typography, components), interaction patterns, mobile-first approach, Duolingo-meets-Headspace direction.
- **[User Journey Flows](_bmad-output/planning-artifacts/user-journey-flows.md)** — 5 user journey flows with Mermaid diagrams (onboarding, daily session, token economy, social, re-engagement).
- **[Visual Design Directions](_bmad-output/planning-artifacts/ux-design-directions.html)** — Open in a browser to see the interactive HTML mockup with color palettes, typography, and component previews.

### 4. Curriculum

- **[Curriculum Roadmap](_bmad-output/planning-artifacts/curriculum-roadmap.md)** — 6 categories, 18 chapters, 69 missions. Every mission defined with exercise type, difficulty, token rewards, and progressive reveal moments.

### 5. Technical Architecture

- **[Architecture](_bmad-output/planning-artifacts/architecture.md)** — Tech stack (React 19, Express 5, Prisma 7, PostgreSQL, Redis), monorepo structure, API design, auth strategy, deployment with Docker.

### 6. Development Plan

- **[Epics & Stories](_bmad-output/planning-artifacts/epics.md)** — 8 epics, 48 stories. Backend-first workflow, each story tagged [BE]/[FE]/[SHARED] with acceptance criteria and story points.

## Module Mapping

Features mapped to Transcendence subject modules (22 points total):

| #   | Subject Module                              | Pts    | Features                                                             |
| --- | ------------------------------------------- | ------ | -------------------------------------------------------------------- |
| 1   | Web: FE + BE Frameworks (Major)             | 2      | React/Next.js + NestJS/Express                                       |
| 2   | Web: Real-time features (Major)             | 2      | Live market ticker, real-time notifications, WebSocket updates       |
| 3   | Web: User interaction (Major)               | 2      | Community resources, profiles, friends system                        |
| 4   | Web: ORM (Minor)                            | 1      | Prisma or TypeORM                                                    |
| 5   | Web: Notification system (Minor)            | 1      | Market alerts, streak reminders, milestones                          |
| 6   | Web: Custom design system (Minor)           | 1      | 10+ reusable components                                              |
| 7   | User Mgmt: Standard user management (Major) | 2      | Profile, avatar, friends, online status, wallet-profile              |
| 8   | User Mgmt: OAuth 2.0 (Minor)                | 1      | Google + Facebook + Instagram                                        |
| 9   | User Mgmt: 2FA (Minor)                      | 1      | Two-factor authentication                                            |
| 10  | AI: LLM system interface (Major)            | 2      | AI Coach — adaptive, Feynman evaluation, market news interpretation  |
| 11  | AI: RAG system (Major)                      | 2      | AI Coach memory — user history, learning gaps, personalized coaching |
| 12  | AI: Sentiment analysis (Minor)              | 1      | Analyze user responses for confidence/confusion                      |
| 13  | Gaming: Gamification (Minor)                | 1      | Knowledge Tokens, daily streaks, achievements, leaderboards          |
| 14  | Accessibility: Multiple languages (Minor)   | 1      | French + English + 1 more                                            |
| 15  | Accessibility: Additional browsers (Minor)  | 1      | Chrome + Firefox + Safari                                            |
| 16  | Data: GDPR compliance (Minor)               | 1      | Data export, deletion, confirmation emails                           |
|     | **TOTAL**                                   | **22** |                                                                      |
