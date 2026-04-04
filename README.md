*This project has been created as part of the 42 curriculum by hganet, anebbou, jmader, ktombola, theveste.*

# TRANSCENDENCE

## Description

**(App name: Unblock)**

Transcendence is a gamified web platform for learning blockchain, it's been made for the purpose of making certain concept like blockchain, RPC endpoint, Wallet, and all available to anyone who want's to learn without having prior knowledge and deep understanding of the concept.

It uses a structured curriculum (missions and exercises) that includes Knowledge Tokens, streaks, achievements to keep the player active.

There is also a leaderboard, you can add friends, send direct messages in real-time, real-time notifications about other users achieving or completing level in the curriculum, and you'r profile that you can customize with an avatar or name.

## Instructions

- **Software:** Docker
- **Tools needed:** Git
- **Versions:** You can use the latest version of Docker and Git it will function
  (if specific needed: use Docker 29.3.1 and Git 2.53)

For the project to be well started, you will first clone it
using the `git clone <git@repo>` command.

Then you will create a `.env` file.
You can copy the `.env.example` file and use it as a blueprint.

You will need to make your own `SESSION_SECRET=add-something`.

For a more protected secret you can use `openssl rand -hex 32` and paste it in.

Then you will have to either change `NODE_ENV` to `production` or `development` depending on you'r need
and also add all the needed API key for OAuth, Facebook, Google, and for the NFT minting
you will need to provide a `contact_address`, Avalanche RPC and blockchain private key.

You are now full set to launch the full stack.

---

### Useful Commands

| Command | Description |
|---|---|
| `make` or `make start` | Start the stack in production mode, using nginx generating the self-signed certificates. |
| `make stop` | Stop the container. |
| `make down` | Delete the container. |
| `make full-down` | Delete the container as well as the volume. |
| `make re` | Relaunch the full stack (delete container and volume and then relaunch it). |

---

`make setup` is for local development without the full Compose app: it runs `pnpm install`, starts standalone Postgres and Redis containers, runs Prisma generate, migrate, and seed, then `pnpm dev` so the API and web dev servers run on the host.

## Resources

Official documentation and tutorials used while building this stack:

- [Node.js runtime](https://nodejs.org/docs/latest/api/)
- [TypeScript](https://www.typescriptlang.org/docs/)
- [pnpm (workspaces and scripts)](https://pnpm.io/workspaces)
- [Docker](https://docs.docker.com/get-started/)
- [Docker Compose](https://docs.docker.com/compose/)
- [PostgreSQL](https://www.postgresql.org/docs/current/)
- [Redis](https://redis.io/docs/latest/)
- [Prisma ORM](https://www.prisma.io/docs)
- [Express](https://expressjs.com/)
- [React](https://react.dev/)
- [Vite](https://vite.dev/guide/)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Passport (authentication)](https://www.passportjs.org/)
- [Socket.IO](https://socket.io/docs/v4/)
- [Zod (validation)](https://zod.dev/)
- [Vitest](https://vitest.dev/guide/)
- [Nginx](https://nginx.org/en/docs/)
- [Solidity](https://docs.soliditylang.org/)
- [ethers.js v6](https://docs.ethers.org/v6/)
- [Avalanche (network and tooling)](https://docs.avax.network/)
- [i18next](https://www.i18next.com/overview/getting-started)

**Use of artificial intelligence:**
The use of artificial was used to confirm certain point that were difficult to understand and to get a much simpler explication of what we were dealing about before continuing.
It was also used to create tests and be sure that we tested all the edges cases that we couldn't think about on top of our head.

## Team Information

- **Hugo Ganet (hganet)** — Technical Lead and Developer. Owns backend architecture, Express API design, Prisma schema and migrations, integration tests, session and security middleware, and coordination of API contracts with the frontend.
- **Arthur (anebbou)** — Product Owner and content owner. Defines curriculum scope, mission copy, tooltips, UI copy in English, French and Spanish, QA scenarios, and alignment between pedagogy and product specs.
- **JB (jmader)** — Developer, frontend. Builds the React application, routing, forms, gamification and social screens, Tailwind layout, and hooks the UI to shared Zod types and REST plus Socket.IO.
- **Kauana (ktombola)** — Developer, backend and blockchain. Works on certificate flows, smart contract interaction, Avalanche RPC usage, and related persistence and API surfaces alongside core backend features.
- **Theo (theveste)** — Project Manager and Developer. Keeps milestones and tasks visible, facilitates syncs and blockers, and contributes to the codebase (Docker, Makefile, deployment flow, and shared fixes across API and tooling).

## Project Management

The team organized the work beetween all the team members by what they knew what to do best,
Team members that knew backend were more oriented towards backend, front-end also.

We tried to do at least one weekly presential meetings,
because we have some team members that don't live at paris so, we tried to mix remote and presential.

We used github to have a single repository, using multiple branch for creating new functionnality.
We also used github action to validate the CI before merging different branches into main.
We used discord to communicates beetween the team members..

## Technical Stack

- **Frontend:** React, Vite, TypeScript, Tailwind, react-router-dom, i18next for locales
- **Backend:** Express, Prisma with PostgreSQL, Redis, Passport (local, Google, Facebook), TOTP 2FA, express-rate-limit, multer for uploads, Resend for email, Socket.IO for WebSockets.

PostgreSQL was chosen for strong relational modelling across users
with Prisma migrations for reproducible schema changes. Express keeps the HTTP surface explicit and easy to test.

- **Blockchain:** ethers.js v6 against an Avalanche-compatible JSON-RPC endpoint and a deployed certificate contract.

## Database Schema

The full model is in `apps/api/prisma/schema.prisma`. The database is separated in 17 tables with each tables
having is own columns inside of it, you can see a full version of the database opening `npx prisma studio`.

Ww have as tables:

- User
- OAuthAccount
- PasswordResetToken
- UserProgress
- ChapterProgress
- SelfAssessment
- TokenTransaction
- ExerciseAttempt
- Achievement
- UserAchievement
- Friendship
- Notification
- Certificate
- GdprExportToken
- GdprDeletionToken
- GdprAuditLog
- Message

For data types we have: `String`, `Boolean`, `Json`, `DateTime`.

## Features List

- **Authentication and account:** email registration and login, hashed passwords, logout, password reset mail flow, Google and Facebook OAuth, optional TOTP 2FA — Hugo Ganet; UI JB.
- **Curriculum and learning:** structure from content/structure.json, mission pages, exercises (several types), completion and progress — Arthur (content), JB (UI).
- **Gamification:** Knowledge Tokens, transactions, streaks, achievements, weekly-style leaderboard — Hugo Ganet; UI JB.
- **Social:** friend requests and list, public profile, direct messages, online-style presence via sockets — theveste; UI JB.
- **Notifications:** REST listing and Socket.IO push for new events — theveste; UI JB.
- **Profile and files:** profile fields, avatar upload — Hugo Ganet; UI JB.
- **Legal:** Privacy Policy and Terms of Service pages linked from the app — Arthur.
- **GDPR:** data export and account deletion flows with confirmation — Hugo Ganet; UI JB.
- **Certificates:** completion certificate, PDF when implemented, mint and metadata fields on chain — Kauana, Hugo Ganet; UI JB.
- **Internationalization:** English and French content and UI strings; i18n wiring in the web app — Arthur, JB.
- **Infrastructure:** Dockerfiles, docker-compose, Makefile (start and setup), TLS cert script, Prisma migrate and seed in the API container startup — Theo, Hugo Ganet.

## Modules

| Module | Type | Points | Description | Contributors |
|---|---|---|---|---|
| Frontend and backend frameworks (React + Express) | Web — Major | 2 pts | Full stack in apps/web and apps/api | Hugo Ganet, JB, Kauana, Theo, Arthur |
| Frontend framework | Web — Minor | 1 pt | Use of React and Vite for frontend programming | Kauana, Theo, Arthur |
| Backend framework | Web — Minor | 1 pt | Use of Express for backend framework | Hugo Ganet, JB |
| Real-time features (Socket.IO) | Web — Major | 2 pts | Notifications and presence | Hugo Ganet, Theo |
| User interaction (chat, profiles, friends) | Web — Major | 2 pts | Messaging, profiles, friends | Hugo Ganet, JB, Theo |
| ORM (Prisma) | Web — Minor | 1 pt | All persistence through Prisma | Hugo Ganet |
| Notification system | Web — Minor | 1 pt | Creation and read paths plus real-time delivery | Hugo Ganet, JB |
| Custom design system | Web — Minor | 1 pt | Reusable UI components, palette, typography (Tailwind theme and components under apps/web) | Arthur, Theo |
| Search functionality with filter | Web — Minor | 1 pt | Implement advanced search functionality with filters, sorting, and pagination | Hugo, JB |
| Multiple languages | Accessibility/i18n — Minor | 1 pt | Language switcher, English, French, Spanish across content and UI | Arthur, JB |
| RTL language support | Accessibility — Minor | 1 pt | Added RTL language Arabic | Arthur |
| Additional browsers | Accessibility — Minor | 1 pt | Primary development on Chrome; Firefox and Safari checked on main flows | JB, Arthur |
| Standard user management | User management — Major | 2 pts | Profile, avatar, friends, status | Hugo Ganet, JB |
| OAuth 2.0 | User management — Minor | 1 pt | Google and Facebook | JB |
| 2FA | User management — Minor | 1 pt | TOTP enrollment and login step | Hugo Ganet, JB |
| Gamification | Gaming UX — Minor | 1 pt | Tokens, streaks, achievements, leaderboard | Hugo Ganet, JB, Kauana |
| GDPR features | Data — Minor | 1 pt | Export and deletion with confirmations | Hugo Ganet |
| Blockchain (Adapted IV.9) | Blockchain — Major | 2 pts | Certificates recorded on Avalanche with a Solidity contract | Kauana |

**TOTAL: 23 points.**

## Individual Contributions

**Hugo** built and tested the majority of the Express API, Prisma layer, auth and session stack, curriculum and exercise services,
gamification and leaderboard logic, GDPR endpoints, test suites, and Docker/Nginx wiring. He integrated Socket.IO on the server and aligned REST shapes with the shared package.

**Arthur** produced the bilingual curriculum (69 missions, tooltips, UI copy), specification documents under docs/, QA scenarios,
and product wording for emails and legal pages. He kept narrative and learning goals consistent across JSON content files.

**JB** implemented the React SPA: auth flows, curriculum and mission views, exercise UI, gamification dashboards, friends and messages,
notifications client, settings, and i18n switching, using Tailwind and shared schemas for validation parity with the API.

**Kauana** focused on certificates end to end, smart contract and Avalanche RPC usage from Node, persistence of chain fields, and co-owned
backend areas such as tokens and heavy Prisma work alongside Hugo.

**Theo** acted as project manager for scheduling and follow-up, and contributed to Dockerfiles, docker-compose, Makefile, local and CI database
seeding flow, environment and TLS setup for one-command startup, plus cross-cutting fixes so the stack runs reliably for the whole team.
