*This project has been created as part of the 42 curriculum by hgannet, agravier, jbriz, kamaral, theveste.*

TRANSCENDENCE — PROJECT README (EVALUATION)

DESCRIPTION

Transcendence is a gamified web platform for learning blockchain: a structured curriculum (missions and exercises), Knowledge Tokens, streaks, achievements, leaderboards, friends, direct messages, notifications, profile and settings, legal pages (Privacy Policy and Terms of Service), GDPR-oriented export and account deletion, and certificates with optional on-chain metadata on Avalanche via a Solidity contract.

The repository is a TypeScript monorepo. The backend is Express with Prisma on PostgreSQL, Redis for sessions and rate limiting, Passport for local and OAuth sign-in and TOTP 2FA, and Socket.IO for live notifications and presence. The frontend is React with Vite and Tailwind. Curriculum text, tooltips, and UI strings live under content/ and are validated when the API starts. Production traffic uses Docker Compose, Nginx, and HTTPS on localhost with project-generated certificates.

INSTRUCTIONS

Prerequisites: Node.js 22, pnpm, Docker and Docker Compose. Use a current stable Google Chrome to run the app. At the repo root, keep a .env file: copy from .env.example and set POSTGRES_*, SESSION_SECRET, FRONTEND_URL, REDIS_URL, blockchain variables (CONTRACT_ADDRESS, AVALANCHE_RPC_URL, BLOCKCHAIN_PRIVATE_KEY), and OAuth secrets if you use social login.

Execution is driven by the Makefile at the repository root.

make and make start are the same.
They create .env from .env.example if it is missing, generate TLS certs when needed, rebuild Docker images without cache, and start the full stack with docker compose up in the background. Then open https://localhost (you may need to trust the local certificate).

make down
stops and removes the Compose stack (containers and default network). make stop only stops containers without removing them. make full-down runs docker compose down and removes volumes. make re runs full-down then start for a clean database volume and a fresh bring-up.

make setup
is for local development without the full Compose app: it runs pnpm install, starts standalone Postgres and Redis containers, runs Prisma generate, migrate, and seed, then pnpm dev so the API and web dev servers run on the host.

For compilation checks, tests, and lint from source: pnpm build, pnpm test, pnpm test:integration, pnpm lint. More detail lives in docs/DEVELOPER_GUIDE.md.

RESOURCES

Official documentation and tutorials used while building this stack (one primary entry point per area):

Node.js runtime: https://nodejs.org/docs/latest/api/

TypeScript: https://www.typescriptlang.org/docs/

pnpm (workspaces and scripts): https://pnpm.io/workspaces

Docker: https://docs.docker.com/get-started/

Docker Compose: https://docs.docker.com/compose/

PostgreSQL: https://www.postgresql.org/docs/current/

Redis: https://redis.io/docs/latest/

Prisma ORM: https://www.prisma.io/docs

Express: https://expressjs.com/

React: https://react.dev/

Vite: https://vite.dev/guide/

Tailwind CSS: https://tailwindcss.com/docs

Passport (authentication): https://www.passportjs.org/

Socket.IO: https://socket.io/docs/v4/

Zod (validation): https://zod.dev/

Vitest: https://vitest.dev/guide/

Nginx: https://nginx.org/en/docs/

Solidity: https://docs.soliditylang.org/

ethers.js v6: https://docs.ethers.org/v6/

Avalanche (network and tooling): https://docs.avax.network/

i18next: https://www.i18next.com/overview/getting-started

Internal project docs: docs/DEVELOPER_GUIDE.md, docs/TEAM_STATUS.md, and specs under docs/ for curriculum, UX, and QA.

Use of artificial intelligence: 
need to explain

TEAM INFORMATION

Hugo Ganet (hgannet) — Technical Lead and Developer. Owns backend architecture, Express API design, Prisma schema and migrations, integration tests, session and security middleware, and coordination of API contracts with the frontend.

Arthur (agravier) — Product Owner and content owner. Defines curriculum scope, mission copy, tooltips, UI copy in English and French, QA scenarios, and alignment between pedagogy and product specs.

JB (jbriz) — Developer, frontend. Builds the React application, routing, forms, gamification and social screens, Tailwind layout, and hooks the UI to shared Zod types and REST plus Socket.IO.

Kauana (ktombola) — Developer, backend and blockchain. Works on certificate flows, smart contract interaction, Avalanche RPC usage, and related persistence and API surfaces alongside core backend features.

Theo (theveste) — Project Manager and Developer. Keeps milestones and tasks visible, facilitates syncs and blockers, and contributes to the codebase (Docker, Makefile, deployment flow, and shared fixes across API and tooling).

PROJECT MANAGEMENT

Work is split by area: API and data, web client, content, and blockchain. Theo (theveste) tracks planning and check-ins; the team meets on a weekly rhythm for planning and blockers, uses GitHub for issues and pull requests, and discusses day-to-day questions on Discord. Mainline development targets the main branch; features land through reviewed PRs. Larger scope is tracked against the epic and story documents in the repository.

TECHNICAL STACK

Frontend: React 19, Vite 7, TypeScript, Tailwind 4, react-router-dom, i18next for locales, Socket.IO client. Backend: Express 5, TypeScript, Prisma 7 with PostgreSQL 17, Redis 7, Passport (local, Google, Facebook), TOTP 2FA, express-rate-limit, multer for uploads, Resend for email where configured, Sharp for images, Socket.IO for WebSockets. Blockchain: ethers.js v6 against an Avalanche-compatible JSON-RPC endpoint and a deployed certificate contract. Tooling: pnpm workspaces, Turborepo, ESLint, Prettier, Vitest, Supertest. Deployment: multi-stage Dockerfiles for api and web, docker-compose.yml, Nginx reverse proxy with TLS.

PostgreSQL was chosen for strong relational modelling across users, progress, gamification, messaging, and audit-style tables, with Prisma migrations for reproducible schema changes. Express keeps the HTTP surface explicit and easy to test with Supertest.

DATABASE SCHEMA

The full model is in apps/api/prisma/schema.prisma. At a glance: User links to OAuth accounts, password reset tokens, progress rows (missions and chapters), token ledger, streak fields, achievements and user achievements, friendships, messages, notifications and preferences, GDPR-related entities, certificates with optional NFT fields, and supporting enums and indexes. Relations use foreign keys and unique constraints (for example one row per user per mission progress, one friendship pair, one user–achievement pair). Migration history lives in apps/api/prisma/migrations. For a diagram, generate one from Prisma or refer to the Developer Guide sections on data.

FEATURES LIST

Authentication and account: email registration and login, hashed passwords, logout, password reset mail flow, Google and Facebook OAuth, optional TOTP 2FA — Hugo Ganet, Kauana; UI JB.

Curriculum and learning: structure from content/structure.json, mission pages, exercises (several types), completion and progress — Arthur (content), Hugo Ganet (engine), JB (UI).

Gamification: Knowledge Tokens, transactions, streaks, achievements, weekly-style leaderboard — Hugo Ganet, Kauana; UI JB.

Social: friend requests and list, public profile, direct messages, online-style presence via sockets — Hugo Ganet, Kauana; UI JB.

Notifications: REST listing and Socket.IO push for new events — Hugo Ganet; UI JB.

Profile and files: profile fields, avatar upload — Hugo Ganet, Kauana; UI JB.

Legal: Privacy Policy and Terms of Service pages linked from the app — Arthur (copy), JB (pages).

GDPR: data export and account deletion flows with confirmation — Hugo Ganet, Kauana; UI JB.

Certificates: completion certificate, mint and metadata fields on chain — Kauana, Hugo Ganet; copy Arthur; UI JB.

Internationalization: English and French content and UI strings; i18n wiring in the web app — Arthur, JB.

Infrastructure: Dockerfiles, docker-compose, Makefile (start and setup), TLS cert script, Prisma migrate and seed in the API container startup — Theo, Hugo Ganet.

MODULES

Point scale: Major 2 points, Minor 1 point. Total claimed: 19 points (five points of headroom above the 14 minimum).

1. Web — Major — Frontend and backend frameworks (React + Express): 2 pts — Full stack in apps/web and apps/api — Hugo Ganet, JB, Kauana, Theo.

2. Web — Major — Real-time features (Socket.IO): 2 pts — Notifications and presence — Hugo Ganet, JB, Theo.

3. Web — Major — User interaction (chat, profiles, friends): 2 pts — Messaging, profiles, friends — Hugo Ganet, JB, Theo.

4. Web — Minor — ORM (Prisma): 1 pt — All persistence through Prisma — Hugo Ganet.

5. Web — Minor — Notification system: 1 pt — Creation and read paths plus real-time delivery — Hugo Ganet, JB.

6. Web — Minor — Custom design system: 1 pt — Reusable UI components, palette, typography (Tailwind theme and components under apps/web) — Arthur.

7. User management — Major — Standard user management: 2 pts — Profile, avatar, friends, status — Hugo Ganet, JB.

8. User management — Minor — OAuth 2.0: 1 pt — Google and Facebook — Hugo Ganet.

9. User management — Minor — 2FA: 1 pt — TOTP enrollment and login step — Hugo Ganet, JB, Arthur.

10. Gaming UX — Minor — Gamification: 1 pt — Tokens, streaks, achievements, leaderboard — Hugo Ganet, JB.

11. Accessibility and i18n — Minor — Multiple languages: 1 pt — English and French across content and UI — Arthur, JB.

12. Accessibility — Minor — Additional browsers: 1 pt — Primary development on Chrome; Firefox and Safari checked on main flows — JB, Arthur.

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
