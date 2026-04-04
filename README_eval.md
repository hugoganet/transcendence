*This project has been created as part of the 42 curriculum by hgannet, agravier, jbriz, ktombola, theveste.*

# TRANSCENDENCE — Unblock

## DESCRIPTION

Unblock is a gamified web platform for learning blockchain. It makes concepts like blockchain, RPC endpoints, wallets, smart contracts and decentralized applications accessible to anyone — no prior knowledge required.

The platform uses a structured curriculum of missions and exercises, rewarding progress with Knowledge Tokens, streaks, and achievements. A leaderboard, friend system, real-time direct messaging, live notifications, and customizable profiles keep learners engaged.

The repository is a TypeScript monorepo. The backend runs Express 5 with Prisma on PostgreSQL, Redis for sessions and rate limiting, Passport for local and OAuth sign-in with optional TOTP 2FA, and Socket.IO for real-time notifications and presence. The frontend is a React 19 SPA built with Vite and Tailwind CSS. Curriculum text, tooltips, and UI strings are validated at API startup. Production deployment uses Docker Compose with an Nginx reverse proxy and self-signed TLS certificates.

---

## INSTRUCTIONS

### Prerequisites

- **Software**: Docker, Docker Compose, Git
- **Versions**: latest stable Docker and Git (tested with Docker 29.3.1, Git 2.53)
- **Browser**: Google Chrome (recommended), Firefox and Safari also supported

### Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd transcendence
   ```

2. Create a `.env` file at the project root. Copy from the example:
   ```bash
   cp .env.example .env
   ```

3. Generate a secure session secret:
   ```bash
   # Replace the placeholder in .env with a strong random value:
   openssl rand -hex 32
   # Paste the output as SESSION_SECRET in your .env
   ```

4. Configure optional services in `.env`:
   - **OAuth**: add Google (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`) and/or Facebook (`FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET`) credentials
   - **2FA**: generate `TOTP_ENCRYPTION_KEY` with `openssl rand -hex 32`
   - **Email**: set `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for password reset emails
   - **Blockchain**: provide `CONTRACT_ADDRESS`, `AVALANCHE_RPC_URL`, and `BLOCKCHAIN_PRIVATE_KEY` for NFT certificate minting

5. Launch the full stack:
   ```bash
   make
   ```

6. Open **https://localhost:8443** in your browser (accept the self-signed certificate warning).

### Makefile Commands

| Command | Description |
|---------|-------------|
| `make` or `make start` | Build and start the full production stack (Docker Compose + Nginx + TLS) |
| `make stop` | Stop containers without removing them |
| `make down` | Stop and remove containers |
| `make full-down` | Stop containers, remove containers and volumes (clean database) |
| `make re` | Full restart: removes everything then rebuilds and starts |
| `make setup` | Local development mode: installs dependencies, starts standalone Postgres and Redis containers, runs Prisma migrations and seed, then starts dev servers on the host |

### Development Mode

For local development without Docker Compose:
```bash
make setup
# API: http://localhost:3000 — Web: http://localhost:5173
```

For compilation checks, tests, and lint:
```bash
pnpm build          # Build all workspaces
pnpm test           # Run unit tests
pnpm test:integration  # Run API integration tests
pnpm lint           # Lint all workspaces
```

---

## RESOURCES

Official documentation and tutorials used while building this stack:

- Node.js runtime: https://nodejs.org/docs/latest/api/
- TypeScript: https://www.typescriptlang.org/docs/
- pnpm (workspaces): https://pnpm.io/workspaces
- Docker: https://docs.docker.com/get-started/
- Docker Compose: https://docs.docker.com/compose/
- PostgreSQL: https://www.postgresql.org/docs/current/
- Redis: https://redis.io/docs/latest/
- Prisma ORM: https://www.prisma.io/docs
- Express: https://expressjs.com/
- React: https://react.dev/
- Vite: https://vite.dev/guide/
- Tailwind CSS: https://tailwindcss.com/docs
- Passport (authentication): https://www.passportjs.org/
- Socket.IO: https://socket.io/docs/v4/
- Zod (validation): https://zod.dev/
- Vitest: https://vitest.dev/guide/
- Nginx: https://nginx.org/en/docs/
- Solidity: https://docs.soliditylang.org/
- ethers.js v6: https://docs.ethers.org/v6/
- Avalanche: https://docs.avax.network/
- i18next: https://www.i18next.com/overview/getting-started

Internal project documentation: `docs/DEVELOPER_GUIDE.md`, `docs/TEAM_STATUS.md`, and specification files under `docs/` for curriculum, UX, and QA.

### Use of Artificial Intelligence

AI tools (Claude, ChatGPT) were used in the following ways during development:

- **Concept clarification**: to simplify and verify understanding of complex topics (blockchain internals, OAuth flows, Prisma relations) before implementing them.
- **Test generation**: to produce comprehensive test suites covering edge cases that might not be immediately obvious, ensuring broader coverage across integration and unit tests.
- **Code review and debugging**: to identify potential issues, suggest improvements, and validate architectural decisions.
- **Content and documentation**: to assist with bilingual curriculum content (EN/FR), JSDoc documentation, and specification writing.

All AI-generated code was reviewed, tested, and adapted by team members before integration. The team maintained full ownership of architectural decisions, product design, and final implementation.

---

## TEAM INFORMATION

| 42 Login | Name | Role |
|----------|------|------|
| hgannet | Hugo Ganet | Technical Lead and Developer |
| agravier | Arthur | Product Owner and Content Owner |
| jbriz | JB | Developer, Frontend |
| kamaral | Kauana | Developer, Backend and Blockchain |
| theveste | Theo | Project Manager and Developer |

**Hugo Ganet (hgannet)** — Technical Lead and Developer. Owns backend architecture, Express API design, Prisma schema and migrations, integration tests, session and security middleware, and coordination of API contracts with the frontend.

**Arthur (agravier)** — Product Owner and Content Owner. Defines curriculum scope, mission copy, tooltips, UI copy in English and French, QA scenarios, and alignment between pedagogy and product specifications.

**JB (jbriz)** — Developer, Frontend. Builds the React application, routing, forms, gamification and social screens, Tailwind layout, and hooks the UI to shared Zod types and REST plus Socket.IO.

**Kauana (kamaral)** — Developer, Backend and Blockchain. Works on certificate flows, smart contract interaction, Avalanche RPC usage, and related persistence and API surfaces alongside core backend features.

**Theo (theveste)** — Project Manager and Developer. Keeps milestones and tasks visible, facilitates syncs and blockers, and contributes to the codebase (Docker, Makefile, deployment flow, and shared fixes across API and tooling).

---

## PROJECT MANAGEMENT

The team organized work by domain expertise: backend and data, frontend, content, blockchain, and infrastructure. Team members were assigned to areas matching their strengths.

Communication and coordination:
- **GitHub**: single repository with feature branches, pull requests with review, and GitHub Actions for CI validation before merging to main.
- **Discord**: daily communication between team members for questions, blockers, and coordination.
- **Meetings**: weekly meetings mixing remote (video call) and in-person sessions at 42, since some team members are remote.

---

## TECHNICAL STACK

**Frontend**: React 19, Vite 7, TypeScript, Tailwind CSS 4, react-router-dom, i18next for locales, Socket.IO client.

**Backend**: Express 5, TypeScript, Prisma 7 with PostgreSQL 17, Redis 7, Passport (local, Google, Facebook), TOTP 2FA, express-rate-limit, multer for uploads, Resend for transactional email, Sharp for image processing, Socket.IO for WebSockets.

**Blockchain**: ethers.js v6 against an Avalanche-compatible JSON-RPC endpoint and a deployed Solidity certificate contract.

**Tooling**: pnpm workspaces, Turborepo, ESLint, Prettier, Vitest, Supertest.

**Deployment**: multi-stage Dockerfiles for API and web, docker-compose.yml, Nginx reverse proxy with self-signed TLS.

PostgreSQL was chosen for strong relational modelling across users, progress, gamification, messaging, and audit-style tables, with Prisma migrations for reproducible schema changes. Express keeps the HTTP surface explicit and straightforward to test with Supertest.

---

## DATABASE SCHEMA

The full model is in `apps/api/prisma/schema.prisma`. At a glance: User links to OAuth accounts, password reset tokens, progress rows (missions and chapters), token ledger, streak fields, achievements and user achievements, friendships, messages, notifications and preferences, GDPR-related entities, certificates with optional NFT fields, and supporting enums and indexes. Relations use foreign keys and unique constraints (for example one row per user per mission progress, one friendship pair, one user-achievement pair). Migration history lives in `apps/api/prisma/migrations`.

---

## FEATURES LIST

**Authentication and account**: email registration and login, hashed passwords, logout, password reset mail flow, Google and Facebook OAuth, optional TOTP 2FA — Hugo Ganet, Kauana; UI JB.

**Curriculum and learning**: structure from `content/structure.json`, mission pages, exercises (several types), completion and progress tracking — Arthur (content), Hugo Ganet (engine), JB (UI).

**Gamification**: Knowledge Tokens, transactions, streaks, achievements, weekly-style leaderboard — Hugo Ganet, Kauana; UI JB.

**Social**: friend requests and list, public profile, direct messages, online presence via sockets — Hugo Ganet, Kauana; UI JB.

**Notifications**: REST listing and Socket.IO push for new events — Hugo Ganet; UI JB.

**Profile and files**: profile fields, avatar upload — Hugo Ganet, Kauana; UI JB.

**Legal**: Privacy Policy and Terms of Service pages — Arthur (copy), JB (pages).

**GDPR**: data export and account deletion flows with email confirmation — Hugo Ganet, Kauana; UI JB.

**Certificates**: completion certificate, PDF generation, mint and metadata fields on-chain — Kauana, Hugo Ganet; copy Arthur; UI JB.

**Internationalization**: English and French content and UI strings; i18n wiring in the web app — Arthur, JB.

**Infrastructure**: Dockerfiles, docker-compose, Makefile (start and setup), TLS certificate generation, Prisma migrate and seed in the API container startup — Theo, Hugo Ganet.

---

## MODULES

Point scale: Major = 2 points, Minor = 1 point. **Total claimed: 21 points** (7 points of headroom above the 14-point minimum).

| # | Module | Type | Pts | Description | Contributors |
|---|--------|------|-----|-------------|--------------|
| 1 | Web — Frontend and Backend Frameworks (React + Express) | Major | 2 | Full stack in `apps/web` and `apps/api` | Hugo, JB, Kauana, Theo, Arthur |
| 2 | Web — Frontend Framework (React) | Minor | 1 | React 19 SPA with Vite, Tailwind, routing | JB, Arthur, Theo |
| 3 | Web — Backend Framework (Express) | Minor | 1 | Express 5 API with Prisma, Redis, Passport | Hugo, Kauana |
| 4 | Web — Real-time Features (Socket.IO) | Major | 2 | Notifications and presence | Hugo, Theo |
| 5 | Web — User Interaction (chat, profiles, friends) | Major | 2 | Messaging, profiles, friends | Hugo, JB, Theo |
| 6 | Web — ORM (Prisma) | Minor | 1 | All persistence through Prisma | Hugo |
| 7 | Web — Notification System | Minor | 1 | Creation, read paths, real-time delivery | Hugo, JB |
| 8 | Web — Custom Design System | Minor | 1 | Reusable UI components, palette, typography | Arthur, Theo |
| 9 | User Management — Standard | Major | 2 | Profile, avatar, friends, status | Hugo, JB |
| 10 | User Management — OAuth 2.0 | Minor | 1 | Google and Facebook | JB |
| 11 | User Management — 2FA | Minor | 1 | TOTP enrollment and login step | Hugo, JB |
| 12 | Gaming UX — Gamification | Minor | 1 | Tokens, streaks, achievements, leaderboard | Hugo, JB, Kauana |
| 13 | Accessibility — Multiple Languages | Minor | 1 | English and French across content and UI | Arthur, JB |
| 14 | Accessibility — Additional Browsers | Minor | 1 | Chrome (primary), Firefox and Safari verified | JB, Arthur |
| 15 | Data — GDPR Features | Minor | 1 | Export and deletion with confirmations | Hugo |
| 16 | Blockchain — Adapted IV.9 | Major | 2 | Certificates on Avalanche with Solidity contract | Kauana |
| | **TOTAL** | | **21** | | |

### Blockchain Module Justification (Adapted IV.9)

The project implements the spirit of IV.9 Blockchain with a domain-adapted use case: **on-chain certificate issuance** instead of tournament score storage.

- **Why this adaptation**: Unblock is an educational platform, so immutable proof of curriculum completion is a core business artifact, while tournament scores are not part of the product domain.
- **What was implemented**: Solidity smart contract for certificate records, Avalanche RPC integration via ethers.js, backend minting and retrieval flows, persistence of `nftTokenId`, `nftTxHash`, and `contractAddress`, and authenticated API plus PDF exposure of blockchain certificate data.
- **Technical challenges addressed**: smart contract interaction from backend services, idempotent minting flow, async blockchain failure handling without breaking certificate issuance, and DB/API schema evolution.
- **Why this qualifies as Major**: it introduces a full extra technical layer (smart contract + chain integration + persistence + API contract changes) with non-trivial architecture and operational complexity.

---

## INDIVIDUAL CONTRIBUTIONS

**Hugo Ganet (hgannet)** built and tested the majority of the Express API, Prisma layer, auth and session stack, curriculum and exercise services, gamification and leaderboard logic, GDPR endpoints, test suites, and Docker/Nginx wiring. He integrated Socket.IO on the server and aligned REST shapes with the shared package.

**Arthur (agravier)** produced the bilingual curriculum (69 missions, tooltips, UI copy), specification documents under `docs/`, QA scenarios, and product wording for emails and legal pages. He kept narrative and learning goals consistent across JSON content files and oversaw product direction.

**JB (jbriz)** implemented the React SPA: auth flows, curriculum and mission views, exercise UI, gamification dashboards, friends and messages, notifications client, settings, and i18n switching, using Tailwind and shared schemas for validation parity with the API.

**Kauana (kamaral)** focused on certificates end to end: smart contract and Avalanche RPC usage from Node, persistence of chain fields, and co-owned backend areas such as tokens and heavy Prisma work alongside Hugo.

**Theo (theveste)** acted as project manager for scheduling and follow-up, and contributed to Dockerfiles, docker-compose, Makefile, local and CI database seeding flow, environment and TLS setup for one-command startup, plus cross-cutting fixes so the stack runs reliably for the whole team.

---

## BONUS

The team claims 21 module points. Any extra scope beyond 14 is documented in the module table above.

---

## LIMITATIONS

- Self-signed TLS on localhost produces browser warnings until the certificate is manually trusted.
- Blockchain features require a reachable Avalanche RPC endpoint and a deployed contract matching `CONTRACT_ADDRESS`.
- Email features (password reset, notifications) require a valid Resend API key with a verified domain for non-test recipients.
- A third language beyond English and French may be partial unless explicitly completed in i18n files.
13. Data — Minor — GDPR features: 1 pt — Export and deletion with confirmations — Hugo Ganet.

14. Blockchain — Major — Adapted IV.9: 2 pts — Certificates recorded on Avalanche with a Solidity contract, ethers.js integration, fields nftTokenId, nftTxHash, contractAddress, and certificate APIs. The subject text mentions tournament scores; this project stores completion certificates instead because they match an education product. Same technical bar: deploy contract, call chain from backend, persist proofs, expose authenticated reads — Kauana (deployment and env wiring).


INDIVIDUAL CONTRIBUTIONS

Hugo Ganet built and tested the majority of the Express API, Prisma layer, auth and session stack, curriculum and exercise services, gamification and leaderboard logic, GDPR endpoints, test suites, and Docker/Nginx wiring. He integrated Socket.IO on the server and aligned REST shapes with the shared package.

Arthur produced the bilingual curriculum (69 missions, tooltips, UI copy), specification documents under docs/, QA scenarios, and product wording for emails and legal pages. He kept narrative and learning goals consistent across JSON content files.

JB implemented the React SPA: auth flows, curriculum and mission views, exercise UI, gamification dashboards, friends and messages, notifications client, settings, and i18n switching, using Tailwind and shared schemas for validation parity with the API.

Kauana focused on certificates end to end, smart contract and Avalanche RPC usage from Node, persistence of chain fields, and co-owned backend areas such as tokens and heavy Prisma work alongside Hugo.

Theo (theveste) acted as project manager for scheduling and follow-up, and contributed to Dockerfiles, docker-compose, Makefile, local and CI database seeding flow, environment and TLS setup for one-command startup, plus cross-cutting fixes so the stack runs reliably for the whole team.

BONUS

The team claims 19 module points. Any extra scope beyond 14 is documented in the module table above; no separate bonus-only module is listed beyond that headroom.

LIMITATIONS

Self-signed TLS on localhost produces browser warnings until a trusted certificate is installed. Blockchain features need a reachable RPC and a deployed contract matching CONTRACT_ADDRESS. Third natural language beyond English and French may be partial unless explicitly completed in i18n files.
