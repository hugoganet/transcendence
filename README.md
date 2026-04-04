*This project has been created as part of the 42 curriculum by hgannet, agravier, jbriz, ktombola, theveste.*

TRANSCENDENCE — README

DESCRIPTION:

( Name of the app: unblock )
Transcendence is a gamified web platform for learning blockchain, it's been made for the purpose of making certain concept like blockchain, RPC endpoint, Wallet, and all available to anyone who want's to learn without having prior knowledge and deep understanding of the concept.

It uses a structured curriculum (missions and exercises) that includes Knowledge Tokens, streaks, achievements to keep the player active.

There is also a leaderboard, you can add friends, send direct messages in real-time,  real-time notifications about other users achieving or completing level in the curriculum, and you'r profile that you can customize with an avatar or name.



INSTRUCTIONS


software: docker
tools needed: git
versions: you can use the latest version of docker and git it will function 
(if specific needed : use docker 29.3.1 and git 2.53)

For the project to be well started, you will first clone it 
using the git clone <gir-url> command

Then you will create a .env file at the root of the project and for an exemple of what is waited from you , you can copy the .env.example file and use it as a blueprint.

You will need to make your own SESSION_SECRET=add-something

For a more protected secret you can use 'openssl rand -hex 32' and paste it in.

Then you will have to either change NODE_ENV to production or development depending on you'r need
and also add all the needed api key for Oauth, Facebook, Google, and for the NFT minting
you will need to provide a contact_address avalanche RPC and blockchain private key

You are now full set to launch the full stack
-----
USEFUL COMMAND:

use: make or make start 
to start the stack in production mode, using nginx generating the self-signed certificates.

use: make stop 
to stop the container

use: make down
to delete the container

use: make full-down
to delete the container as well as the volume

use: make re
to relaunch the full stack, ( delete container and volume and then relaunch it )
-----

make setup
is for local development without the full Compose app: it runs pnpm install, starts standalone Postgres and Redis containers, runs Prisma generate, migrate, and seed, then pnpm dev so the API and web dev servers run on the host.


RESOURCES:

official documentation and tutorials used while building this stack

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


Use of artificial intelligence: 
The use of artificial was used to confirm certain point that were difficult to understand and to get a much simpler explication of what we were dealing about before continuing.
It was also used to create tests and be sure that we tested all the edges cases that we couldn't think about on top of our head.    

TEAM INFORMATION:

Hugo Ganet (hgannet) — Technical Lead and Developer. Owns backend architecture, Express API design, Prisma schema and migrations, integration tests, session and security middleware, and coordination of API contracts with the frontend.

Arthur (agravier) — Product Owner and content owner. Defines curriculum scope, mission copy, tooltips, UI copy in English, French and Spanish, QA scenarios, and alignment between pedagogy and product specs.

JB (jbriz) — Developer, frontend. Builds the React application, routing, forms, gamification and social screens, Tailwind layout, and hooks the UI to shared Zod types and REST plus Socket.IO.

Kauana (kamaral) — Developer, backend and blockchain. Works on certificate flows, smart contract interaction, Avalanche RPC usage, and related persistence and API surfaces alongside core backend features.

Theo (theveste) — Project Manager and Developer. Keeps milestones and tasks visible, facilitates syncs and blockers, and contributes to the codebase (Docker, Makefile, deployment flow, and shared fixes across API and tooling).



PROJECT MANAGEMENT:

The team organized the work beetween all the team members by what they knew what to do best, 
Team members that knew backend were more oriented towards backend, front-end also.
We tried to do weekly meetings, because we have some team members that don't live at paris so, we tried to mix remote and presential.

We used github to have a single repository, using multiple branch for creating new functionnality.
We also used github action to validate the CI before merging different branches into main.
We used discord to communicates beetween the team members..



TECHNICAL STACK:

Frontend: React 19, Vite 7, TypeScript, Tailwind 4, react-router-dom, i18next for locales, Socket.IO client. 

Backend: Express 5, Prisma 7 with PostgreSQL 17, Redis 7, Passport (local, Google, Facebook), TOTP 2FA, express-rate-limit, multer for uploads, Resend for email where configured, Sharp for images, Socket.IO for WebSockets. 

PostgreSQL was chosen for strong relational modelling across users, progress, gamification, messaging, and audit-style tables, with Prisma migrations for reproducible schema changes. Express keeps the HTTP surface explicit and easy to test with Supertest.

Blockchain: ethers.js v6 against an Avalanche-compatible JSON-RPC endpoint and a deployed certificate contract. Tooling: pnpm workspaces, Turborepo, ESLint, Prettier, Vitest, Supertest. Deployment: multi-stage Dockerfiles for api and web, docker-compose.yml, Nginx reverse proxy with TLS.


DATABASE SCHEMA

The full model is in apps/api/prisma/schema.prisma. At a glance: User links to OAuth accounts, password reset tokens, progress rows (missions and chapters), token ledger, streak fields, achievements and user achievements, friendships, messages, notifications and preferences, GDPR-related entities, certificates with optional NFT fields, and supporting enums and indexes. Relations use foreign keys and unique constraints (for example one row per user per mission progress, one friendship pair, one user–achievement pair). Migration history lives in apps/api/prisma/migrations. For a diagram, generate one from Prisma or refer to the Developer Guide sections on data.



FEATURES LIST

Authentication and account: email registration and login, hashed passwords, logout, password reset mail flow, Google and Facebook OAuth, optional TOTP 2FA — Hugo Ganet; UI JB.

Curriculum and learning: structure from content/structure.json, mission pages, exercises (several types), completion and progress — Arthur (content), JB (UI).

Gamification: Knowledge Tokens, transactions, streaks, achievements, weekly-style leaderboard — Hugo Ganet; UI JB.

Social: friend requests and list, public profile, direct messages, online-style presence via sockets — theveste; UI JB.

Notifications: REST listing and Socket.IO push for new events — theveste; UI JB.

Profile and files: profile fields, avatar upload — Hugo Ganet; UI JB.

Legal: Privacy Policy and Terms of Service pages linked from the app — Arthur ().

GDPR: data export and account deletion flows with confirmation — Hugo Ganet; UI JB.

Certificates: completion certificate, PDF when implemented, mint and metadata fields on chain — Kauana, Hugo Ganet; UI JB.

Internationalization: English and French content and UI strings; i18n wiring in the web app — Arthur, JB.

Infrastructure: Dockerfiles, docker-compose, Makefile (start and setup), TLS cert script, Prisma migrate and seed in the API container startup — Theo, Hugo Ganet.

MODULES

Point scale: Major 2 points, Minor 1 point. Total claimed: 21 points (five points of headroom above the 14 minimum).

Web — Major Frontend and backend frameworks (React + Express): 2 pts — Full stack in apps/web and apps/api — Hugo Ganet, JB, Kauana, Theo, Arthur.

Web- Minor frontend framwork : JB, Arthur, Theo 1pt

Web- Minor backend framework : Hugo, Kauana 1pt

Web — Major — Real-time features (Socket.IO): 2 pts — Notifications and presence — Hugo Ganet, Theo.

3. Web — Major — User interaction (chat, profiles, friends): 2 pts — Messaging, profiles, friends — Hugo Ganet, JB, Theo.

4. Web — Minor — ORM (Prisma): 1 pt — All persistence through Prisma — Hugo Ganet.

5. Web — Minor — Notification system: 1 pt — Creation and read paths plus real-time delivery — Hugo Ganet, JB.

6. Web — Minor — Custom design system: 1 pt — Reusable UI components, palette, typography (Tailwind theme and components under apps/web) — Arthur, Theo.

7. User management — Major — Standard user management: 2 pts — Profile, avatar, friends, status — Hugo Ganet, JB.

8. User management — Minor — OAuth 2.0: 1 pt — Google and Facebook — JB.

9. User management — Minor — 2FA: 1 pt — TOTP enrollment and login step — Hugo Ganet, JB.

10. Gaming UX — Minor — Gamification: 1 pt — Tokens, streaks, achievements, leaderboard — Hugo Ganet, JB, Kauana.

11. Accessibility and i18n — Minor — Multiple languages: 1 pt — English and French across content and UI — Arthur, JB.

12. Accessibility — Minor — Additional browsers: 1 pt — Primary development on Chrome; Firefox and Safari checked on main flows — JB, Arthur.

13. Data — Minor — GDPR features: 1 pt — Export and deletion with confirmations — Hugo Ganet.

14. Blockchain — Major — Adapted IV.9: 2 pts — Certificates recorded on Avalanche with a Solidity contract, ethers.js integration, fields nftTokenId, nftTxHash, contractAddress, and certificate APIs including PDF where enabled. The subject text mentions tournament scores; this project stores completion certificates instead because they match an education product. Same technical bar: deploy contract, call chain from backend, persist proofs, expose authenticated reads — Kauana (deployment and env wiring).


INDIVIDUAL CONTRIBUTIONS

Hugo built and tested the majority of the Express API, Prisma layer, auth and session stack, curriculum and exercise services, gamification and leaderboard logic, GDPR endpoints, test suites, and Docker/Nginx wiring. He integrated Socket.IO on the server and aligned REST shapes with the shared package.

Arthur produced the bilingual curriculum (69 missions, tooltips, UI copy), specification documents under docs/, QA scenarios, and product wording for emails and legal pages. He kept narrative and learning goals consistent across JSON content files.

JB implemented the React SPA: auth flows, curriculum and mission views, exercise UI, gamification dashboards, friends and messages, notifications client, settings, and i18n switching, using Tailwind and shared schemas for validation parity with the API.

Kauana focused on certificates end to end, smart contract and Avalanche RPC usage from Node, persistence of chain fields, and co-owned backend areas such as tokens and heavy Prisma work alongside Hugo.

Theo acted as project manager for scheduling and follow-up, and contributed to Dockerfiles, docker-compose, Makefile, local and CI database seeding flow, environment and TLS setup for one-command startup, plus cross-cutting fixes so the stack runs reliably for the whole team.

