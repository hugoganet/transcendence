---
stepsCompleted: [1, 2, 3, 4]
status: COMPLETE
completedAt: '2026-03-04'
inputDocuments:
  - prd.md
  - architecture.md
  - ux-design-specification.md
  - curriculum-roadmap.md
---

# transcendence - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for transcendence, decomposing the requirements from the PRD, UX Design, Architecture, and Curriculum Roadmap into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Users can sign up with email and password
FR2: Users can sign up and log in using OAuth 2.0 providers (Google, Facebook, Instagram)
FR3: Users can enable and use two-factor authentication (2FA) on their account
FR4: Users can create and edit their profile information (display name, bio, avatar)
FR5: Users can upload a custom avatar or use a default avatar
FR6: Users can view their wallet-profile page displaying Knowledge Tokens balance, completed missions, and learning "portfolio"
FR7: Users can log out of their account
FR8: Users can reset their password
FR9: Users can view a curriculum map showing all available modules and their progression
FR10: Users can follow a progressive learning path where each module unlocks sequentially (Module N requires Module N-1 completion)
FR11: Users can complete missions of 2-5 minutes each covering blockchain topics (distributed ledgers, consensus mechanisms, cryptocurrencies, wallets, smart contracts, NFTs, DeFi, real-world applications)
FR12: Users can resume their learning from exactly where they left off after any absence
FR13: Users can receive a concept refresher when returning after 7 or more days of inactivity
FR14: Users can view their overall curriculum progress and completion percentage
FR15: Users can receive a shareable certificate upon completing the learning path
FR16: Users can access jargon tooltips providing non-technical definitions with real-world analogies for all technical terms encountered
FR17: Users can view their learning progress visualized as a learning chain (blockchain metaphor)
FR18: Users can complete interactive placement exercises within missions (drag-and-drop, spatial/tactile)
FR19: Users can complete concept-matching exercises within missions (categorical, vocabulary, mental models)
FR20: Users can complete step-by-step simulated transaction exercises (e.g., wallet setup, buying crypto)
FR21: Users can complete scenario-based interpretation exercises presenting real-world blockchain situations with multiple-choice responses
FR22: Users can receive feedback on exercise responses within <200ms
FR23: Users can interact with exercises using both mouse and touch input
FR24: Users can earn Knowledge Tokens by completing missions and exercises
FR25: Users can maintain and view daily learning streaks
FR26: Users experience a gas-fee mechanic where every exercise submission costs Knowledge Tokens (flat cost per submission, correct or incorrect)
FR27: Users can view their position on leaderboards
FR28: Users can earn achievements for completing modules, reaching Knowledge Token thresholds, and maintaining streak targets
FR29: Users see their cumulative progress (missions completed, modules mastered) highlighted after a streak reset, rather than a zero-streak counter
FR30: Users can view their Knowledge Token balance and earning history
FR31: Users can add and remove other users as friends
FR32: Users can see the online status of their friends
FR33: Users can view other users' public profiles
FR34: Users can share certificates and achievements to external platforms (LinkedIn, Twitter/X)
FR35: Users can receive notifications for streak reminders, delivered within <500ms
FR36: Users can receive notifications for module completions, Knowledge Token thresholds, and streak milestones
FR37: Users can receive re-engagement notifications after 7 or more days of inactivity
FR38: Users receive notifications within <500ms while connected to the platform
FR39: Users can switch the platform language between at least three languages (French, English, and one additional)
FR40: Users can access the platform across desktop (1024px+), tablet (768-1023px), and mobile (320-767px) viewports with adapted layouts
FR41: Users can navigate all interactive exercises using keyboard input
FR42: Users can access the platform on Chrome, Firefox, and Safari browsers
FR43: Users can request an export of their personal data
FR44: Users can request deletion of their account and personal data
FR45: Users can receive confirmation emails for data operations
FR46: Users can view the Privacy Policy page
FR47: Users can view the Terms of Service page
FR48: Users can complete a post-module self-assessment rating their confidence on the module's topics
FR49: Users experience a consistent visual design system comprising a minimum of 10 reusable UI components, a defined color palette, and a typography scale
FR50: Users can view a financial disclaimer stating that educational content does not constitute investment advice, displayed during onboarding and accessible from every module
FR51: Users must confirm they are 16 or older during account registration (age eligibility gate)
FR52: All curriculum content is tagged with a last-reviewed date, and content older than 6 months is flagged for review
FR53: Each module includes a disclaimer distinguishing educational content from financial advice where investment-related topics are covered

### NonFunctional Requirements

NFR1: Exercise interaction feedback must complete in <200ms visual response
NFR2: Page/section transitions must complete in <1 second
NFR3: Real-time message delivery must complete in <500ms to connected clients
NFR4: Platform must support 20+ simultaneous active users while maintaining above performance targets
NFR5: Zero browser console warnings or errors (42 mandatory)
NFR6: Passwords must be hashed and salted using industry-standard adaptive hashing algorithm (bcrypt)
NFR7: All client-server communication must use HTTPS
NFR8: All secrets must be stored in .env files, never in source code (.env.example provided, .env in .gitignore)
NFR9: Sessions must expire after 30 minutes of inactivity (configurable: 15-120 min)
NFR10: All forms must be validated on both frontend and backend (prevent XSS, SQL injection)
NFR11: OAuth tokens must be stored server-side or in HTTP-only secure cookies, never in localStorage
NFR12: 2FA secrets must be encrypted at rest with minimum 256-bit key strength
NFR13: Real-time connections must auto-reconnect within 5 seconds without data loss or user intervention
NFR14: User data must survive session ends, server restarts, and extended absence
NFR15: No data corruption or race conditions under simultaneous user actions
NFR16: Core features must remain available via HTTP fallback during real-time connection outage of up to 30 minutes
NFR17: Responsive design functional across desktop (1024px+), tablet (768-1023px), mobile (320-767px)
NFR18: All interactive exercises operable via keyboard
NFR19: WCAG AA minimum color contrast (4.5:1 normal text, 3:1 large text)
NFR20: Minimum 16px body text, 1.5 line height, distinct heading scale (minimum 4px size difference between heading levels)
NFR21: All user-facing text translatable, language switching within <500ms without page reload
NFR22: All exercises completable and all interaction targets reachable with both touch and mouse input, minimum 44x44px touch targets
NFR23: Entire stack must run via single `docker compose up` command
NFR24: .env.example with all required variables documented
NFR25: All FRs functional on Chrome, Firefox, Safari (latest stable)
NFR26: OAuth providers (Google, Facebook, Instagram) with standardized OAuth 2.0 flow
NFR27: Graceful OAuth fallback with clear error messaging when provider is temporarily unavailable

### Additional Requirements

**From Architecture:**

- Starter template: DIY Monorepo using Turborepo + pnpm workspaces (no existing template selected). Project structure: apps/web (React+Vite+Tailwind), apps/api (Express+Prisma+Socket.IO), packages/shared (Zod schemas, types, constants). This must be Epic 1 Story 1.
- Technology stack: TypeScript 5.8, React 19, Vite 7, Tailwind 4, Express 5, Prisma 7, PostgreSQL, Socket.IO 4.8, Redis, Resend (email), react-i18next
- Database design: Prisma schema as single source of truth for user state (progress, tokens, streaks, friends, sessions). Content in static JSON files, not DB.
- Authentication: Passport.js (local + Google + Facebook + Instagram strategies) + express-session + connect-redis. HTTP-only cookies. WebSocket auth via session cookie on Socket.IO handshake.
- Security middleware stack: Helmet.js, CORS (frontend origin only), rate limiting (express-rate-limit + rate-limit-redis), Zod validation on every route handler
- API design: REST `/api/v1/`, versioned, resource-oriented. Consistent error format: `{ error: { code, message, details? } }`. Success format: `{ data: T }` or `{ data: T[], meta: { page, pageSize, total } }`
- State management: TanStack Query (server state) + Zustand (client state: progressive reveal flags, exercise flow state, UI state)
- Docker: 4 services (web/nginx, api/express, db/postgres, redis). Nginx serves frontend and reverse-proxies /api/* and /socket.io/*. HTTPS termination at Nginx.
- Testing: Vitest + React Testing Library + Supertest + Playwright (E2E across Chrome/Firefox/Safari)
- Implementation patterns: camelCase throughout (DB, API, code), PascalCase for components/types, co-located tests, thin route handlers (validate -> service -> respond), domain-based component organization
- Curriculum content as static JSON files: structure.json (language-independent), per-locale folders (en/, fr/) with missions.json, tooltips.json, ui.json
- Shared Zod validation schemas in packages/shared for frontend + backend consistency
- Error handling: Express error-handling middleware with typed AppError class. React Error Boundaries for component crashes. TanStack Query onError for API failures.

**From UX Design:**

- Mobile-primary design: all designs mobile-first (320px floor), enhanced for desktop. Bottom nav on mobile, top nav on desktop (1024px+ breakpoint).
- Exercise flow hides navigation to minimize distraction during missions
- 20 custom components defined across 6 domains (common, exercise, curriculum, wallet, auth, engagement)
- Progressive mechanic reveal: UI elements conditionally rendered based on curriculum milestone completion (Tokens at 2.2.4, Wallet-profile at 3.1.4, Gas-fee at 3.3.3, Full dashboard at 6.3.4)
- Micro-onboarding: trust-building first (calm, clean, no feature dump), immediate hands-on exercise within 60 seconds
- MechanicReveal component is a full-screen takeover moment
- Break suggestion after 3+ consecutive missions
- WelcomeBack component for returning users (progress-first messaging, no streak shame)
- ConceptRefresher for users returning after 7+ days
- Anti-crypto-bro aesthetic: Headspace soul + Duolingo mechanics, warm-cool color blend (teal primary #2B9E9E, amber secondary #D4A843)
- Typography: Plus Jakarta Sans (headings) + Source Sans 3 (body)
- Light mode only for MVP
- Skeleton loading components (neutral-100 pulsing blocks) for screen loads, inline spinners for actions
- No full-screen loading overlays

**From Curriculum Roadmap:**

- 6 categories, 18 chapters, 69 missions total
- Mission duration: 2-5 minutes each (~5-6 hours total learning time)
- 4 exercise types distributed: SI (43%), CM (25%), IP (17%), ST (15%)
- Progressive reveal moments tied to specific missions: Tokens at 2.2.4, Wallet-profile at 3.1.4, Gas-fee at 3.3.3, Full dashboard at 6.3.4
- Curriculum content JSON must include all 69 missions with learning objectives, exercise types, and content per locale
- Post-module self-assessments at end of each category
- Financial disclaimer embedded in mission 2.3.4 + onboarding
- Content freshness tags on every mission (FR52)

### FR Coverage Map

FR1: Epic 2 - Email/password sign-up
FR2: Epic 2 - OAuth 2.0 sign-up/login
FR3: Epic 2 - Two-factor authentication
FR4: Epic 2 - Profile creation and editing
FR5: Epic 2 - Avatar upload/default
FR6: Epic 5 - Wallet-profile page
FR7: Epic 2 - Logout
FR8: Epic 2 - Password reset
FR9: Epic 3 - Curriculum map view
FR10: Epic 3 - Sequential module unlocking
FR11: Epic 3 - Mission completion (2-5 min, blockchain topics)
FR12: Epic 3 - Resume from where user left off
FR13: Epic 7 - Concept refresher after 7+ days inactivity
FR14: Epic 3 - Curriculum progress and completion percentage
FR15: Epic 6 - Shareable certificate on path completion
FR16: Epic 3 - Jargon tooltips with analogies
FR17: Epic 3 - Learning chain visualization
FR18: Epic 4 - Interactive placement exercises (drag-and-drop)
FR19: Epic 4 - Concept-matching exercises
FR20: Epic 4 - Step-by-step simulated transaction exercises
FR21: Epic 4 - Scenario-based interpretation exercises
FR22: Epic 4 - Exercise feedback within <200ms
FR23: Epic 4 - Mouse and touch input support
FR24: Epic 5 - Earn Knowledge Tokens from missions
FR25: Epic 5 - Daily learning streaks
FR26: Epic 5 - Gas-fee mechanic (flat cost per submission)
FR27: Epic 5 - Leaderboard position
FR28: Epic 5 - Achievements (modules, tokens, streaks)
FR29: Epic 5 - Cumulative progress highlight after streak reset
FR30: Epic 5 - Knowledge Token balance and earning history
FR31: Epic 6 - Add/remove friends
FR32: Epic 6 - Friend online status
FR33: Epic 6 - Public profile viewing
FR34: Epic 6 - Share certificates/achievements to external platforms
FR35: Epic 7 - Streak reminder notifications (<500ms)
FR36: Epic 7 - Module completion/milestone notifications
FR37: Epic 7 - Re-engagement notifications after 7+ days
FR38: Epic 7 - Notification delivery <500ms while connected
FR39: Epic 8 - Language switching (FR/EN/+1)
FR40: Epic 8 - Responsive design across all viewports
FR41: Epic 8 - Keyboard navigation for exercises
FR42: Epic 8 - Chrome, Firefox, Safari support
FR43: Epic 8 - GDPR data export
FR44: Epic 8 - GDPR account/data deletion
FR45: Epic 8 - Confirmation emails for data operations
FR46: Epic 1 - Privacy Policy page
FR47: Epic 1 - Terms of Service page
FR48: Epic 3 - Post-module self-assessment
FR49: Epic 8 - Design system (10+ components, color palette, typography)
FR50: Epic 2 - Financial disclaimer during onboarding and per-module
FR51: Epic 2 - Age eligibility gate (16+)
FR52: Epic 3 - Content freshness tags (last-reviewed date)
FR53: Epic 3 - Financial disclaimer per module (investment topics)

## Epic List

### Epic 1: Project Foundation & Infrastructure
Users can access a deployed, secure platform via HTTPS with Docker. Delivers the Turborepo monorepo scaffold, Prisma database schema, Docker Compose (4 services), Nginx reverse proxy with HTTPS, shared Zod schemas, Privacy Policy and Terms of Service pages. All subsequent epics build on this foundation.
**FRs covered:** FR46, FR47
**NFRs addressed:** NFR5, NFR7, NFR8, NFR23, NFR24
**Note:** Stories tagged [BE], [FE], [SHARED] to enable backend-first development.

### Epic 2: User Authentication & Profiles
Users can register (email/password or OAuth), log in, manage their profile (display name, bio, avatar), reset passwords, enable 2FA, and see the financial disclaimer. Complete identity system with age eligibility gate.
**FRs covered:** FR1, FR2, FR3, FR4, FR5, FR7, FR8, FR50, FR51
**NFRs addressed:** NFR6, NFR9, NFR10, NFR11, NFR12, NFR26, NFR27

### Epic 3: Curriculum Engine & Learning Path
Users can view the curriculum map, follow a sequential learning path (69 missions across 18 chapters and 6 categories), resume where they left off, track overall progress, access jargon tooltips, view learning chain visualization, and complete post-module self-assessments. Curriculum content served from static JSON files.
**FRs covered:** FR9, FR10, FR11, FR12, FR14, FR16, FR17, FR48, FR52, FR53
**NFRs addressed:** NFR2, NFR14

### Epic 4: Interactive Exercise Framework
Users can complete all 4 exercise types (interactive placement, concept matching, simulated transactions, scenario interpretation) with immediate feedback (<200ms), touch + mouse support, and keyboard navigation. The exercise-feedback-reward micro-loop works end-to-end.
**FRs covered:** FR18, FR19, FR20, FR21, FR22, FR23
**NFRs addressed:** NFR1, NFR18, NFR22

### Epic 5: Token Economy & Gamification
Users can earn Knowledge Tokens, experience gas-fee mechanics (flat cost per submission), maintain streaks, earn achievements, view leaderboards, and access their wallet-profile with token balance and earning history. Progressive mechanic reveal tied to curriculum milestones (Tokens at 2.2.4, Wallet-profile at 3.1.4, Gas-fee at 3.3.3, Full dashboard at 6.3.4).
**FRs covered:** FR6, FR24, FR25, FR26, FR27, FR28, FR29, FR30
**NFRs addressed:** NFR4, NFR15

### Epic 6: Social & Community
Users can add/remove friends, see friend online status, view public profiles, earn and share certificates upon curriculum completion, and share achievements to external platforms (LinkedIn, Twitter/X).
**FRs covered:** FR15, FR31, FR32, FR33, FR34
**NFRs addressed:** NFR3 (presence via Socket.IO)

### Epic 7: Real-Time Notifications & Engagement
Users receive real-time notifications (streak reminders, milestones, re-engagement after 7+ days), welcome-back experience with progress-first messaging, concept refresher after extended absence, and break suggestions after 3+ consecutive missions. Socket.IO push system with auto-reconnect and HTTP fallback.
**FRs covered:** FR13, FR35, FR36, FR37, FR38
**NFRs addressed:** NFR3, NFR13, NFR16

### Epic 8: Accessibility, i18n & Compliance
Users can switch languages (FR/EN/+1), access the platform across all viewports with adapted layouts, navigate with keyboard, use the platform on Chrome/Firefox/Safari, request GDPR data export and account deletion with confirmation emails. Design system delivers 10+ reusable components with WCAG AA compliance.
**FRs covered:** FR39, FR40, FR41, FR42, FR43, FR44, FR45, FR49
**NFRs addressed:** NFR17, NFR19, NFR20, NFR21, NFR25

## Epic 1: Project Foundation & Infrastructure

Users can access a deployed, secure platform via HTTPS with Docker. Delivers the Turborepo monorepo scaffold, Prisma database schema, Docker Compose (4 services), Nginx reverse proxy with HTTPS, shared Zod schemas, Privacy Policy and Terms of Service pages.

### Story 1.1: Monorepo Scaffold & Dev Tooling `[SHARED]`

As a developer,
I want a working monorepo with frontend, backend, and shared packages configured,
So that the team can begin development with a consistent, type-safe foundation.

**Acceptance Criteria:**

**Given** a fresh clone of the repository
**When** `pnpm install` is run at the root
**Then** all workspace dependencies are installed for apps/web, apps/api, and packages/shared
**And** TypeScript strict mode compiles without errors across all workspaces
**And** Turborepo tasks (`build`, `dev`, `lint`, `test`) run successfully
**And** `packages/shared` exports are importable from both apps/web and apps/api
**And** ESLint + Prettier are configured with project conventions (camelCase, PascalCase components)
**And** Vitest is configured in apps/web and apps/api with a passing placeholder test each
**And** `.gitignore` includes node_modules, dist, .env, and build artifacts
**And** `README.md` exists at the repo root with all 42-required sections (project description, setup instructions, environment variables, usage, team members)

### Story 1.2: Database Schema & Prisma Setup `[BE]`

As a developer,
I want a PostgreSQL database with Prisma ORM configured and initial schema designed,
So that backend services have a type-safe data access layer from day one.

**Acceptance Criteria:**

**Given** the apps/api workspace
**When** `npx prisma migrate dev` is run
**Then** the database is created with the initial schema including: User table (id, email, passwordHash, displayName, bio, avatarUrl, locale, ageConfirmed, createdAt, updatedAt)
**And** Prisma Client is generated with TypeScript types
**And** A seed script creates at least one test user
**And** `prisma/schema.prisma` follows naming conventions (PascalCase tables, camelCase columns)
**And** Environment variables for DB connection are documented in `.env.example`

### Story 1.3: Express Server & Security Middleware `[BE]`

As a developer,
I want an Express 5 server with security middleware stack configured,
So that all API endpoints are secure by default.

**Acceptance Criteria:**

**Given** the apps/api workspace
**When** the server starts
**Then** Express listens on the configured port (default 3000)
**And** Helmet.js sets security headers on all responses
**And** CORS is configured to allow only the frontend origin
**And** Rate limiting is active (express-rate-limit) with Redis store
**And** A global error handler catches all errors and returns `{ error: { code, message, details? } }` format
**And** An `AppError` class is available for typed errors with HTTP status codes
**And** A health check endpoint `GET /api/v1/health` returns 200
**And** Input validation middleware using Zod is available for route handlers
**And** All endpoints return proper HTTP status codes (400, 401, 403, 404, 500)

### Story 1.4: Redis & Session Infrastructure `[BE]`

As a developer,
I want Redis configured for session storage and Socket.IO adapter,
So that user sessions and real-time connections are properly managed.

**Acceptance Criteria:**

**Given** a running Redis instance
**When** express-session is configured with connect-redis
**Then** sessions are stored in Redis with configurable TTL (default 30 min inactivity)
**And** Session cookies are HTTP-only, secure, and SameSite
**And** Redis client connection is verified on server startup
**And** Socket.IO server is initialized with Redis adapter
**And** Socket.IO authenticates via session cookie on handshake
**And** Environment variables for Redis are documented in `.env.example`

### Story 1.5: Docker Compose & HTTPS Deployment `[BE]`

As a user,
I want the entire platform to start with a single `docker compose up` command,
So that the application is deployable and accessible via HTTPS.

**Acceptance Criteria:**

**Given** a configured `.env` file (from `.env.example`)
**When** `docker compose up` is run
**Then** 4 services start: web (Nginx), api (Express), db (PostgreSQL), redis
**And** Nginx serves static frontend files and reverse-proxies `/api/*` to Express and `/socket.io/*` to Socket.IO
**And** HTTPS is enabled with self-signed certificates for local development
**And** All services are healthy and connected (API can reach DB and Redis)
**And** The health check endpoint is accessible at `https://localhost/api/v1/health`
**And** Dockerfiles exist for web and api services in `docker/`
**And** `.env.example` documents all required environment variables

### Story 1.6: Privacy Policy & Terms of Service Pages `[FE]`

As a user,
I want to view the Privacy Policy and Terms of Service,
So that I understand how my data is handled before signing up.

**Acceptance Criteria:**

**Given** the user navigates to `/privacy-policy`
**When** the page loads
**Then** the Privacy Policy content is displayed in a readable format
**And** the page is accessible without authentication (public route)

**Given** the user navigates to `/terms-of-service`
**When** the page loads
**Then** the Terms of Service content is displayed in a readable format
**And** the page is accessible without authentication (public route)

**Given** both pages
**When** viewed on any viewport (mobile, tablet, desktop)
**Then** content is properly formatted and readable
**And** a navigation link exists to return to the landing/login page

## Epic 2: User Authentication & Profiles

Users can register (email/password or OAuth), log in, manage their profile (display name, bio, avatar), reset passwords, enable 2FA, and see the financial disclaimer. Complete identity system with age eligibility gate.

### Story 2.1: Email/Password Registration & Login `[BE]`

As a user,
I want to register with my email and password and log in to my account,
So that I can access the learning platform securely.

**Acceptance Criteria:**

**Given** a visitor on the registration endpoint
**When** they submit a valid email, password, and age confirmation (16+)
**Then** a new user account is created with the password hashed using bcrypt
**And** a session is created and stored in Redis
**And** a session cookie (HTTP-only, secure, SameSite) is returned
**And** the response includes the user profile data

**Given** a visitor submits registration with an already-used email
**When** the request is processed
**Then** a 409 error is returned with code `EMAIL_ALREADY_EXISTS`

**Given** a visitor submits registration without confirming age (16+)
**When** the request is processed
**Then** a 400 error is returned with code `AGE_CONFIRMATION_REQUIRED`

**Given** a registered user
**When** they submit valid email and password to the login endpoint
**Then** a session is created and a session cookie is returned
**And** the response includes the user profile data

**Given** a user submits invalid credentials
**When** the request is processed
**Then** a 401 error is returned with code `INVALID_CREDENTIALS`
**And** no information leaks about whether the email exists

**Given** all auth endpoints
**When** input is submitted
**Then** Zod validates request bodies on the backend
**And** invalid input returns 400 with field-level error details

### Story 2.2: Logout & Session Management `[BE]`

As a user,
I want to log out and have my session properly terminated,
So that my account is secure when I'm done.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they call the logout endpoint
**Then** their session is destroyed in Redis
**And** the session cookie is cleared
**And** subsequent requests with the old cookie return 401

**Given** a user session
**When** 30 minutes of inactivity pass (configurable 15-120 min)
**Then** the session expires automatically in Redis
**And** the next request returns 401

### Story 2.3: OAuth 2.0 Authentication `[BE]`

As a user,
I want to sign up and log in using Google, Facebook, or Instagram,
So that I can access the platform without creating a new password.

**Acceptance Criteria:**

**Given** a visitor initiating OAuth login (Google, Facebook, or Instagram)
**When** they complete the provider's authorization flow
**Then** a user account is created (if new) or matched (if existing email)
**And** a session is created with OAuth tokens stored server-side (never in localStorage)
**And** a session cookie is returned

**Given** an OAuth provider is temporarily unavailable
**When** the user attempts OAuth login
**Then** a graceful error message is returned with code `OAUTH_PROVIDER_UNAVAILABLE`
**And** the user is directed to try again or use email/password

**Given** a user who registered with email/password
**When** they log in via OAuth with the same email
**Then** the accounts are linked and both login methods work

**Given** Passport.js strategies
**When** configured for each provider
**Then** `passport-google-oauth20`, `passport-facebook`, and `passport-instagram` strategies are registered
**And** OAuth callback URLs are documented in `.env.example`

### Story 2.4: Password Reset `[BE]`

As a user,
I want to reset my password via email,
So that I can regain access to my account if I forget my password.

**Acceptance Criteria:**

**Given** a user requests password reset with their email
**When** the email exists in the system
**Then** a time-limited reset token is generated and stored
**And** a reset email is sent via Resend with a secure link
**And** the API returns a generic success message (no email existence leak)

**Given** a user with a valid reset token
**When** they submit a new password
**Then** the password is updated (hashed with bcrypt)
**And** all existing sessions for that user are invalidated
**And** the reset token is consumed (single-use)

**Given** an expired or invalid reset token
**When** a password reset is attempted
**Then** a 400 error is returned with code `INVALID_RESET_TOKEN`

### Story 2.5: Two-Factor Authentication `[BE]`

As a user,
I want to enable 2FA on my account,
So that my account has an extra layer of security.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they request to enable 2FA
**Then** a TOTP secret is generated and encrypted at rest (256-bit minimum)
**And** a QR code URI and manual key are returned for authenticator app setup
**And** the user must verify with a valid TOTP code before 2FA is activated

**Given** a user with 2FA enabled
**When** they log in with correct email/password
**Then** a 2FA challenge is returned (partial session)
**And** the user must submit a valid TOTP code to complete login

**Given** a user with 2FA enabled submitting an invalid TOTP code
**When** the code is verified
**Then** a 401 error is returned with code `INVALID_2FA_CODE`

**Given** a user with 2FA enabled
**When** they request to disable 2FA
**Then** they must verify with a valid TOTP code
**And** the 2FA secret is deleted from the database
**And** all sessions are invalidated

### Story 2.6: User Profile Management `[BE]`

As a user,
I want to create and edit my profile information,
So that other users can see who I am.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they update their profile (display name, bio)
**Then** the changes are saved and returned in the response
**And** Zod validates all input fields

**Given** an authenticated user
**When** they upload a custom avatar image
**Then** the image is stored (local filesystem/Docker volume)
**And** the avatar URL is updated on the user profile
**And** only image files under a size limit (e.g., 2MB) are accepted

**Given** a user who hasn't uploaded an avatar
**When** their profile is requested
**Then** a default avatar URL is returned

**Given** the `GET /api/v1/users/me` endpoint
**When** called by an authenticated user
**Then** the full user profile is returned (id, email, displayName, bio, avatarUrl, ageConfirmed, createdAt)

### Story 2.7: Financial Disclaimer & Onboarding Gate `[BE]`

As a user,
I want to see a financial disclaimer during onboarding,
So that I understand the platform provides education, not investment advice.

**Acceptance Criteria:**

**Given** a newly registered user
**When** they access the platform for the first time
**Then** the financial disclaimer is served via API (text content stating education ≠ investment advice)
**And** the user's acceptance is recorded in the database

**Given** the disclaimer content endpoint
**When** requested with a module ID for investment-related topics
**Then** the module-specific disclaimer is returned (FR53)

**Given** the disclaimer endpoint
**When** called without authentication
**Then** the general disclaimer is still accessible (public)

### Story 2.8: Auth Frontend - Registration, Login & Profile Pages `[FE]`

As a user,
I want to register, log in, manage my profile, and see the financial disclaimer through a polished UI,
So that I can access and personalize my account.

**Acceptance Criteria:**

**Given** the landing page
**When** a visitor arrives
**Then** they see a clean, calm interface with sign-up and login options
**And** OAuth buttons (Google, Facebook, Instagram) are visible
**And** links to Privacy Policy and Terms of Service are accessible

**Given** the registration form
**When** a user fills in email, password, and confirms age (16+)
**Then** Zod validates input on blur and on submit (frontend validation)
**And** errors display inline per field
**And** on success, the user is redirected to micro-onboarding

**Given** the login form
**When** a user submits credentials
**Then** on success they are redirected to the home screen
**And** if 2FA is enabled, a TOTP input is shown before completion

**Given** the profile/settings page
**When** an authenticated user visits
**Then** they can edit display name, bio, and upload avatar
**And** they can enable/disable 2FA
**And** changes are validated and saved via API

**Given** all auth pages
**When** viewed on mobile (320px+)
**Then** layouts are touch-friendly with minimum 44x44px targets
**And** forms are single-column and thumb-zone optimized

## Epic 3: Curriculum Engine & Learning Path

Users can view the curriculum map, follow a sequential learning path (69 missions across 18 chapters and 6 categories), resume where they left off, track overall progress, access jargon tooltips, view learning chain visualization, and complete post-module self-assessments. Curriculum content served from static JSON files.

### Story 3.1: Curriculum Content JSON Structure & Loader `[SHARED]`

As a developer,
I want the curriculum structure and content defined as static JSON files with a server-side loader,
So that content is versioned in git, translatable, and decoupled from code.

**Acceptance Criteria:**

**Given** the `content/` directory
**When** the content files are loaded
**Then** `structure.json` defines all 6 categories, 18 chapters, 69 missions with: IDs, ordering, unlock rules (sequential), exercise types (IP/CM/ST/SI), progressive reveal trigger flags, and last-reviewed dates
**And** `content/en/missions.json` contains English mission titles, descriptions, learning objectives, and exercise content for all 69 missions
**And** `content/en/tooltips.json` contains jargon tooltip definitions with plain-language definitions and real-world analogies
**And** `content/fr/` mirrors the English structure for French translations
**And** a `contentLoader.ts` utility in apps/api loads and caches the JSON files at server startup
**And** Zod schemas in `packages/shared` validate the content JSON structure
**And** each mission has a `lastReviewedDate` field (FR52)
**And** investment-related modules include disclaimer flags (FR53)

### Story 3.2: Curriculum Progress API `[BE]`

As a user,
I want to track my progress through the curriculum,
So that I can see what I've completed and what's next.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they call `GET /api/v1/curriculum`
**Then** the full curriculum structure is returned with the user's progress overlay (locked/available/in-progress/completed per chapter and mission)
**And** the response includes overall completion percentage (FR14)
**And** sequential unlock rules are enforced: chapter N requires chapter N-1 completion (FR10)

**Given** an authenticated user
**When** they call `GET /api/v1/curriculum/missions/:missionId`
**Then** the mission content is returned (title, description, learning objective, exercises, tooltips)
**And** the response includes the mission's exercise type and content in the user's locale

**Given** a new user with no progress
**When** they request the curriculum
**Then** only Category 1, Chapter 1.1, Mission 1.1.1 is available (all else locked)

**Given** the curriculum API
**When** any endpoint is called
**Then** DB tables are created: `UserProgress` (userId, missionId, status, completedAt), `ChapterProgress` (userId, chapterId, status)
**And** Prisma schema is updated with these tables

### Story 3.3: Mission Completion & Progress Tracking `[BE]`

As a user,
I want to mark missions as complete and have my progress saved,
So that I can advance through the curriculum and resume where I left off.

**Acceptance Criteria:**

**Given** an authenticated user who has completed all exercises in a mission
**When** `POST /api/v1/curriculum/missions/:missionId/complete` is called
**Then** the mission is marked as completed in the database
**And** the next mission in sequence is unlocked
**And** if all missions in a chapter are complete, the chapter is marked complete
**And** if all chapters in a category are complete, the category is marked complete
**And** the updated progress is returned in the response

**Given** a user resuming after absence (FR12)
**When** they call `GET /api/v1/curriculum/resume`
**Then** the response returns their last incomplete mission ID and chapter context
**And** progress data persists across sessions and server restarts (NFR14)

**Given** a user completing a category
**When** the category contains a post-module self-assessment (FR48)
**Then** the self-assessment mission is presented as the final mission of the category
**And** the user's confidence rating is recorded

### Story 3.4: Jargon Tooltips API `[BE]`

As a user,
I want to look up any technical term and get a plain-language definition with a real-world analogy,
So that I never feel lost when encountering blockchain jargon.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they call `GET /api/v1/tooltips/:term`
**Then** the tooltip definition is returned with: term, plain-language definition, real-world analogy, related terms
**And** the content is served in the user's locale

**Given** an authenticated user
**When** they call `GET /api/v1/tooltips`
**Then** the full glossary is returned (all terms for the user's locale)
**And** terms are alphabetically sorted

**Given** a term that doesn't exist
**When** the endpoint is called
**Then** a 404 is returned with code `TERM_NOT_FOUND`

### Story 3.5: Learning Chain Visualization API `[BE]`

As a user,
I want to see my learning progress visualized as a blockchain-style chain,
So that I have a motivating visual metaphor of my journey.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they call `GET /api/v1/curriculum/chain`
**Then** the response returns a structured representation of their learning chain: completed missions as "blocks" with timestamps, linked sequentially
**And** each block includes: mission ID, title, completion date, category
**And** the chain grows as the user completes more missions

### Story 3.6: Curriculum Frontend - Map, Mission Flow & Tooltips `[FE]`

As a user,
I want to browse the curriculum map, start missions, see my progress, and access jargon tooltips,
So that I can navigate my learning journey visually and intuitively.

**Acceptance Criteria:**

**Given** the curriculum map page (`/curriculum`)
**When** an authenticated user visits
**Then** all 6 categories and their chapters are displayed as a visual map
**And** each node shows its state: locked, available, in-progress, completed (CurriculumNode component)
**And** the overall completion percentage is visible (ProgressBar component)
**And** the map is navigable and responsive (mobile single-column, desktop expanded)

**Given** the home page
**When** an authenticated user visits
**Then** the next available mission is surfaced with one-tap access ("Headspace next session" pattern)
**And** the learning chain visualization is displayed (FR17)
**And** page transitions complete in <1 second (NFR2)

**Given** a mission intro
**When** the user taps on an available mission
**Then** a MissionIntroCard shows: mission title, learning objective, estimated duration, exercise type
**And** a "Start" button begins the mission

**Given** any screen with technical terms
**When** the user taps a highlighted term (mobile) or hovers (desktop)
**Then** a Tooltip component appears with plain-language definition and analogy
**And** the tooltip appears in-context without navigating away

**Given** a returning user
**When** they open the app
**Then** the resume point is immediately visible on home and curriculum map
**And** the last incomplete mission is highlighted

## Epic 4: Interactive Exercise Framework

Users can complete all 4 exercise types (interactive placement, concept matching, simulated transactions, scenario interpretation) with immediate feedback (<200ms), touch + mouse support, and keyboard navigation. The exercise-feedback-reward micro-loop works end-to-end.

### Story 4.1: Exercise Submission API & Feedback Engine `[BE]`

As a user,
I want to submit exercise answers and receive immediate validation,
So that I know whether my answer was correct and can learn from mistakes.

**Acceptance Criteria:**

**Given** an authenticated user in an active mission
**When** they call `POST /api/v1/exercises/:exerciseId/submit` with their answer
**Then** the answer is validated against the correct answer defined in the content JSON
**And** the response includes: correct/incorrect status, correct answer (if wrong), explanation text
**And** the response is returned within <200ms (NFR1)
**And** the exercise attempt is recorded in the database (ExerciseAttempt table: userId, exerciseId, missionId, answer, correct, createdAt)

**Given** a mission with multiple exercises
**When** the user completes all exercises in the mission
**Then** `GET /api/v1/missions/:missionId/status` returns the mission as completable
**And** the user can trigger mission completion via Story 3.3's endpoint

**Given** any exercise submission
**When** Zod validates the request body
**Then** the submission format matches the exercise type (placement order, matched pairs, step selections, or selected option)

### Story 4.2: Interactive Placement Exercise Component `[FE]`

As a user,
I want to complete drag-and-drop exercises where I arrange items in the correct order or position,
So that I learn blockchain structures through spatial, tactile interaction.

**Acceptance Criteria:**

**Given** a mission containing an interactive placement exercise
**When** the exercise loads within the ExerciseContainer
**Then** draggable items are displayed with clear visual affordance (grab cursor, shadow on drag)
**And** drop zones are clearly marked with visual feedback on hover/proximity
**And** items can be dragged with mouse (desktop) and touch (mobile) input (FR23)
**And** the exercise is operable via keyboard: Tab to select, Arrow keys to move, Enter to place (NFR18)
**And** touch targets are minimum 44x44px (NFR22)

**Given** a user places all items
**When** they submit their answer
**Then** the FeedbackBanner shows correct/incorrect with calm, neutral tone
**And** visual feedback appears within <200ms (NFR1)
**And** incorrect placements are highlighted with the correct position shown

**Given** exercise types from curriculum
**When** interactive placement exercises load
**Then** they support: ordering (e.g., chain blocks in sequence), positioning (e.g., wallet anatomy), and sorting (e.g., transaction steps)

### Story 4.3: Concept Matching Exercise Component `[FE]`

As a user,
I want to complete matching exercises where I connect related concepts,
So that I build vocabulary and mental models for blockchain terminology.

**Acceptance Criteria:**

**Given** a mission containing a concept-matching exercise
**When** the exercise loads within the ExerciseContainer
**Then** two (or three) columns of items are displayed for matching
**And** users can draw connections by tapping/clicking items in sequence
**And** matched pairs are visually linked (line, color, or grouping)
**And** touch and mouse input both work (FR23)
**And** keyboard navigation: Tab between items, Enter to select/match (NFR18)

**Given** a user completes all matches
**When** they submit their answer
**Then** the FeedbackBanner shows results per match (correct/incorrect)
**And** feedback appears within <200ms (NFR1)
**And** incorrect matches show the correct pairing

**Given** concept-matching exercises from curriculum
**When** they load
**Then** they support: term-to-definition, concept-to-analogy, and three-column matching (term + definition + analogy)

### Story 4.4: Step-by-Step Simulated Transaction Component `[FE]`

As a user,
I want to complete step-by-step simulations of blockchain operations,
So that I build procedural confidence through guided practice.

**Acceptance Criteria:**

**Given** a mission containing a simulated transaction exercise
**When** the exercise loads within the ExerciseContainer
**Then** a multi-step flow is presented with clear step indicators (step 1 of N)
**And** each step has an action the user must perform (select option, enter value, confirm)
**And** micro-explanations appear at each step explaining what's happening
**And** touch and mouse input both work (FR23)
**And** keyboard navigation works for all step interactions (NFR18)

**Given** a user completes a step correctly
**When** they advance to the next step
**Then** the transition is smooth and immediate
**And** previous steps are visible but dimmed (showing progress)

**Given** a user makes an error at a step
**When** feedback is shown
**Then** the FeedbackBanner explains what went wrong
**And** the user can retry the step
**And** feedback appears within <200ms (NFR1)

**Given** simulated transaction types from curriculum
**When** they load
**Then** they support: wallet setup flow, crypto purchase flow, lending/borrowing flow, and NFT minting flow

### Story 4.5: Scenario-Based Interpretation Component `[FE]`

As a user,
I want to analyze real-world blockchain scenarios and select the best interpretation,
So that I develop critical thinking about blockchain applications.

**Acceptance Criteria:**

**Given** a mission containing a scenario-based interpretation exercise
**When** the exercise loads within the ExerciseContainer
**Then** a scenario is presented (news headline, situation, or offer) with context
**And** multiple-choice options are displayed as tappable cards
**And** touch and mouse input both work (FR23)
**And** keyboard navigation: Arrow keys between options, Enter to select (NFR18)
**And** touch targets are minimum 44x44px (NFR22)

**Given** a user selects an option
**When** they submit their answer
**Then** the FeedbackBanner shows whether their interpretation was correct
**And** an explanation is provided for why the correct answer is best
**And** feedback appears within <200ms (NFR1)

**Given** scenario exercises from curriculum
**When** they load
**Then** they support: news interpretation, scam-or-legit evaluation, and investment scenario analysis

### Story 4.6: ExerciseContainer & Mission Flow Integration `[FE]`

As a user,
I want a seamless flow between exercises within a mission,
So that learning feels continuous and immersive.

**Acceptance Criteria:**

**Given** a mission with multiple exercises
**When** the user starts the mission
**Then** the ExerciseContainer wraps all exercise types with consistent header (mission title, progress indicator), feedback area, and navigation
**And** navigation is hidden during exercise flow to minimize distraction (UX spec)
**And** transitions between exercises within a mission are seamless (no page reload, SPA)

**Given** the user completes an exercise
**When** they advance to the next exercise
**Then** the transition is smooth with a brief feedback pause
**And** progress within the mission updates (e.g., "Exercise 2 of 4")

**Given** the user completes the last exercise in a mission
**When** the mission ends
**Then** the MissionComplete component shows: mission summary, XP earned placeholder, next mission prompt
**And** a "Continue" button chains to the next mission (Duolingo pattern)
**And** a "Back to Map" option returns to the curriculum map

**Given** all exercise components
**When** rendered on mobile (320px+)
**Then** layouts are single-column, touch-optimized, thumb-zone friendly
**And** all interactions work one-handed

## Epic 5: Token Economy & Gamification

Users can earn Knowledge Tokens, experience gas-fee mechanics (flat cost per submission), maintain streaks, earn achievements, view leaderboards, and access their wallet-profile with token balance and earning history. Progressive mechanic reveal tied to curriculum milestones.

### Story 5.1: Token Ledger & Balance API `[BE]`

As a user,
I want to earn Knowledge Tokens from completing missions and see my balance,
So that I experience the platform's currency system that mirrors real crypto tokens.

**Acceptance Criteria:**

**Given** an authenticated user completing a mission
**When** the mission completion endpoint is called
**Then** Knowledge Tokens are credited to the user's balance
**And** a `TokenTransaction` record is created (userId, amount, type: EARN, missionId, createdAt)
**And** the updated balance is returned in the response

**Given** an authenticated user
**When** they call `GET /api/v1/tokens/balance`
**Then** the current Knowledge Token balance is returned (total earned, total spent, net balance)

**Given** an authenticated user
**When** they call `GET /api/v1/tokens/history`
**Then** a paginated chronological list of token transactions is returned (amount, type, description, timestamp)

**Given** the token system
**When** DB tables are needed
**Then** `TokenTransaction` table is created (userId, amount, type, missionId?, exerciseId?, description, createdAt)
**And** User table is extended with `tokenBalance` field
**And** no data corruption occurs under concurrent transactions (NFR15)

### Story 5.2: Gas-Fee Mechanic API `[BE]`

As a user,
I want every exercise submission to cost Knowledge Tokens as gas,
So that I experience how real blockchain gas fees work through daily use.

**Acceptance Criteria:**

**Given** an authenticated user submitting an exercise answer
**When** the submission is processed
**Then** a flat gas cost in Knowledge Tokens is deducted from the user's balance
**And** a `TokenTransaction` record is created (type: GAS_SPEND, exerciseId)
**And** the gas cost is the same regardless of whether the answer is correct or incorrect

**Given** a user whose token balance goes negative mid-mission
**When** they continue submitting exercises within the same mission
**Then** submissions are still accepted (mission is never interrupted)

**Given** a user with negative token balance (debt)
**When** they attempt to start a new mission
**Then** a 403 error is returned with code `INSUFFICIENT_TOKENS`

**Given** the gas-fee system
**When** gas costs are configured
**Then** the flat gas cost per submission is defined as a constant in `packages/shared`

### Story 5.3: Streak Tracking API `[BE]`

As a user,
I want to maintain a daily learning streak and see my cumulative progress,
So that I'm motivated to return daily without feeling punished for breaks.

**Acceptance Criteria:**

**Given** an authenticated user completing at least one mission in a day
**When** the mission completion is recorded
**Then** the user's streak is incremented (or maintained if already active today)

**Given** a user who misses a day
**When** they complete a mission the next day
**Then** the current streak resets to 1 and the longest streak is preserved
**And** cumulative progress (total missions, modules mastered) is highlighted (FR29)

**Given** an authenticated user
**When** they call `GET /api/v1/gamification/streak`
**Then** the response includes: currentStreak, longestStreak, lastActiveDate, totalMissionsCompleted, totalModulesMastered

**Given** the streak system
**When** DB tables are needed
**Then** `Streak` table is created (userId, currentStreak, longestStreak, lastActiveDate)

### Story 5.4: Achievements API `[BE]`

As a user,
I want to earn achievements for reaching milestones,
So that I feel recognized for my progress.

**Acceptance Criteria:**

**Given** defined achievement criteria
**When** a user meets a criterion (module completion, token threshold, streak target)
**Then** the achievement is awarded and recorded (id, title, description, iconUrl, earnedAt)

**Given** an authenticated user
**When** they call `GET /api/v1/gamification/achievements`
**Then** all achievements are returned with earned/unearned status

**Given** the achievement system
**When** DB tables are needed
**Then** `Achievement` and `UserAchievement` tables are created

### Story 5.5: Leaderboard API `[BE]`

As a user,
I want to see how I rank among other learners,
So that I feel part of a community with gentle social context.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they call `GET /api/v1/gamification/leaderboard`
**Then** a paginated ranked list is returned sorted by XP (missions completed)
**And** the current user's position is always included
**And** framing is "Active learners this week" (not competitive ranking)

### Story 5.6: Progressive Mechanic Reveal API `[BE]`

As a user,
I want gamification mechanics to appear only when I've learned about them in the curriculum,
So that the platform teaches me through its own interface.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they call `GET /api/v1/users/me/reveals`
**Then** the response includes: tokensRevealed, walletRevealed, gasRevealed, dashboardRevealed

**Given** a user completing reveal trigger missions (2.2.4, 3.1.4, 3.3.3, 6.3.4)
**When** the mission is completed
**Then** the corresponding reveal flag is set to true
**And** the response signals the frontend to trigger a MechanicReveal moment

**Given** the reveal system
**When** DB fields are needed
**Then** User table is extended with reveal flag columns (all default false)

### Story 5.7: Wallet-Profile & Gamification Frontend `[FE]`

As a user,
I want to see my wallet-profile with token balance, transaction history, streak, achievements, and leaderboard,
So that I have a motivating dashboard that mirrors a real crypto wallet.

**Acceptance Criteria:**

**Given** the wallet-profile page (`/wallet`) with `walletRevealed: true`
**When** an authenticated user visits
**Then** TokenDisplay shows balance, TransactionList shows history, StreakIndicator shows streak, achievements are listed

**Given** `walletRevealed: false`
**When** the user navigates to `/wallet`
**Then** a simplified profile view is shown (displayName, bio, avatar, XP only)

**Given** a progressive reveal trigger mission completion
**When** a reveal fires
**Then** the MechanicReveal component displays as a full-screen takeover explaining the new mechanic

**Given** the streak display after a reset
**When** displayed
**Then** cumulative progress is shown prominently, streak count is secondary (FR29)

## Epic 6: Social & Community

Users can add/remove friends, see friend online status, view public profiles, earn and share certificates upon curriculum completion, and share achievements to external platforms.

### Story 6.1: Friends System API `[BE]`

As a user,
I want to add and remove friends and see their online status,
So that I feel connected to other learners.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they call `POST /api/v1/friends/:userId`
**Then** a friend request is sent and recorded in the database

**Given** a friend request
**When** the recipient accepts
**Then** both users appear in each other's friend lists

**Given** an authenticated user
**When** they call `DELETE /api/v1/friends/:userId`
**Then** the friendship is removed from both sides

**Given** an authenticated user
**When** they call `GET /api/v1/friends`
**Then** their friend list is returned with each friend's displayName, avatarUrl, and online status

**Given** the friends system
**When** DB tables are needed
**Then** `Friendship` table is created (userId, friendId, status, createdAt)

### Story 6.2: Online Presence via Socket.IO `[BE]`

As a user,
I want to see which of my friends are currently online,
So that I feel part of an active learning community.

**Acceptance Criteria:**

**Given** a user connects via Socket.IO
**When** the connection is authenticated
**Then** `presence:online` event is emitted to their friends

**Given** a user disconnects
**When** the Socket.IO connection drops
**Then** `presence:offline` event is emitted to their friends after a brief debounce (to handle reconnects)

**Given** the presence system
**When** online status is queried
**Then** Redis tracks connected user IDs for fast lookup

### Story 6.3: Public Profiles API `[BE]`

As a user,
I want to view other users' public profiles,
So that I can see their progress and achievements.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they call `GET /api/v1/users/:userId/profile`
**Then** the public profile is returned: displayName, avatarUrl, xp, streakLength, achievements earned, curriculum completion percentage

**Given** private data
**When** a public profile is requested
**Then** email, token balance, and detailed transaction history are NOT included

### Story 6.4: Certificate Generation & Sharing API `[BE]`

As a user,
I want to receive a shareable certificate upon completing the full curriculum,
So that I can prove my blockchain knowledge to others.

**Acceptance Criteria:**

**Given** a user who has completed all 69 missions (mission 6.3.4 "Graduation")
**When** the graduation mission is completed
**Then** a certificate is generated with: user displayName, completion date, curriculum title
**And** the certificate is stored and accessible via `GET /api/v1/users/me/certificate`

**Given** a user with a certificate
**When** they call `GET /api/v1/users/me/certificate/share`
**Then** a shareable URL or image is returned suitable for LinkedIn/Twitter sharing

**Given** a user without curriculum completion
**When** they request a certificate
**Then** a 404 is returned with code `CERTIFICATE_NOT_AVAILABLE`

### Story 6.5: Social Frontend - Friends, Profiles & Certificates `[FE]`

As a user,
I want to manage friends, view profiles, and share my certificate through the UI,
So that I can engage with the learning community.

**Acceptance Criteria:**

**Given** the friends section (accessible from wallet/settings)
**When** an authenticated user visits
**Then** they see their friend list with online/offline status indicators
**And** they can search for and add new friends
**And** they can remove existing friends

**Given** a public profile link
**When** the user taps on a friend or leaderboard entry
**Then** the public profile page shows: displayName, avatar, XP, streak, achievements, completion %

**Given** a user with a certificate
**When** they view it
**Then** share buttons for LinkedIn and Twitter/X are available
**And** sharing opens the external platform with pre-filled content

## Epic 7: Real-Time Notifications & Engagement

Users receive real-time notifications (streak reminders, milestones, re-engagement), welcome-back experience, concept refresher after extended absence, and break suggestions. Socket.IO push system with auto-reconnect and HTTP fallback.

### Story 7.1: Notification System API & Socket.IO Push `[BE]`

As a user,
I want to receive real-time notifications for streak reminders and milestones,
So that I stay engaged with my learning journey.

**Acceptance Criteria:**

**Given** a connected user via Socket.IO
**When** a notification event fires (streak reminder, module completion, token threshold, streak milestone)
**Then** `notification:push` is emitted with: type, title, body, data
**And** delivery completes within <500ms (NFR3)

**Given** a user's Socket.IO connection drops
**When** the client reconnects
**Then** auto-reconnect happens within 5 seconds (NFR13)
**And** missed notifications during disconnection are delivered on reconnect

**Given** the notification system
**When** DB tables are needed
**Then** `Notification` table is created (userId, type, title, body, read, createdAt)

**Given** an authenticated user
**When** they call `GET /api/v1/notifications`
**Then** their notification history is returned (paginated, newest first)

### Story 7.2: Re-Engagement & Streak Reminder Logic `[BE]`

As a user,
I want to receive re-engagement notifications after extended absence,
So that I'm gently reminded to continue learning without feeling guilty.

**Acceptance Criteria:**

**Given** a user who has been inactive for 7+ days (FR37)
**When** the re-engagement check runs (scheduled job or on-login check)
**Then** a re-engagement notification is created with welcoming, progress-first messaging

**Given** a user approaching end of day without completing a mission
**When** they have an active streak
**Then** a streak reminder notification is sent (FR35)

**Given** notification preferences
**When** the user opts out of specific notification types
**Then** those notifications are not sent

### Story 7.3: Concept Refresher API `[BE]`

As a user,
I want a concept refresher when returning after 7+ days,
So that I can ease back into learning without feeling lost.

**Acceptance Criteria:**

**Given** a user returning after 7+ days of inactivity (FR13)
**When** they call `GET /api/v1/curriculum/resume`
**Then** the response includes a `refresher` field with: a brief review exercise covering key concepts from the last completed module
**And** the refresher is optional (the user can skip it)

### Story 7.4: Engagement Frontend - Notifications, WelcomeBack & Refresher `[FE]`

As a user,
I want to see notifications, a welcome-back experience, and concept refreshers in the UI,
So that I stay engaged and can smoothly return after breaks.

**Acceptance Criteria:**

**Given** a connected user
**When** a notification arrives via Socket.IO
**Then** a toast/banner appears briefly without interrupting exercise flow
**And** notifications are accessible from a notification area

**Given** a user returning after 7+ days
**When** they open the app
**Then** the WelcomeBack component shows: cumulative progress (missions completed, modules mastered), no streak shame
**And** a ConceptRefresher is offered (optional)

**Given** a user completing 3+ consecutive missions
**When** a break is suggested
**Then** the BreakSuggestion component appears gently (not blocking)
**And** the user can dismiss and continue

**Given** core features during real-time outage
**When** Socket.IO is disconnected for up to 30 minutes
**Then** curriculum navigation, exercise completion, and progress saving remain available via HTTP fallback (NFR16)

## Epic 8: Accessibility, i18n & Compliance

Users can switch languages (FR/EN/+1), access the platform across all viewports, navigate with keyboard, use Chrome/Firefox/Safari, request GDPR data export and deletion with confirmation emails. Design system delivers 10+ reusable components with WCAG AA compliance.

### Story 8.1: i18n Infrastructure & Language Switching `[SHARED]`

As a user,
I want to switch the platform language between French, English, and one additional language,
So that I can learn in my preferred language.

**Acceptance Criteria:**

**Given** react-i18next configured in the frontend
**When** the user changes language in settings
**Then** all UI text switches within <500ms without page reload (NFR21)
**And** the selected locale is saved to the user profile

**Given** the i18n system
**When** translation files are loaded
**Then** `public/locales/{en,fr}/translation.json` contain all UI strings
**And** curriculum content is served from `content/{locale}/` via API based on user locale

**Given** a third language
**When** added
**Then** only new JSON files are needed (no code changes)

### Story 8.2: GDPR Data Export & Deletion API `[BE]`

As a user,
I want to export or delete my personal data,
So that I maintain control over my information.

**Acceptance Criteria:**

**Given** an authenticated user
**When** they call `POST /api/v1/gdpr/export`
**Then** a data export is generated containing all personal data (profile, progress, tokens, friends, notifications)
**And** a confirmation email is sent via Resend with a download link (FR45)

**Given** an authenticated user
**When** they call `POST /api/v1/gdpr/delete`
**Then** a confirmation email is sent requiring the user to confirm deletion
**And** upon confirmation, all personal data is permanently deleted
**And** the user's account is deactivated and sessions invalidated

**Given** the GDPR endpoints
**When** called
**Then** operations are logged for compliance auditing

### Story 8.3: Email Service Integration `[BE]`

As a user,
I want to receive confirmation emails for data operations and password resets,
So that sensitive operations are verified.

**Acceptance Criteria:**

**Given** the Resend email service
**When** integrated into the backend
**Then** emails can be sent for: password reset, GDPR export confirmation, GDPR deletion confirmation, re-engagement notifications
**And** email templates are professional and match the platform's anti-crypto-bro aesthetic
**And** Resend API key is documented in `.env.example`

### Story 8.4: Design System Component Library `[FE]`

As a user,
I want a consistent visual experience across the entire platform,
So that the interface feels professional, trustworthy, and cohesive.

**Acceptance Criteria:**

**Given** the design system
**When** implemented
**Then** 10+ reusable components are available: Button, Card, ProgressBar, TokenDisplay, Tooltip, BottomNav, TopNav, FeedbackBanner, MissionComplete, StreakIndicator, CurriculumNode, TransactionList (FR49)
**And** Tailwind config defines design tokens: colors (teal primary #2B9E9E, amber secondary #D4A843, warm neutrals), typography (Plus Jakarta Sans headings, Source Sans 3 body), spacing, border radius, shadows
**And** all components meet WCAG AA contrast (4.5:1 normal, 3:1 large text) (NFR19)
**And** minimum 16px body text, 1.5 line height (NFR20)
**And** light mode only for MVP

**Given** responsive behavior
**When** components render on different viewports
**Then** BottomNav appears on mobile (<1024px), TopNav on desktop (1024px+)
**And** layouts adapt across mobile (320px+), tablet (768px+), desktop (1024px+) (NFR17)

### Story 8.5: Cross-Browser Testing & Keyboard Navigation `[FE]`

As a user,
I want the platform to work on Chrome, Firefox, and Safari with full keyboard navigation,
So that I can use my preferred browser and input method.

**Acceptance Criteria:**

**Given** the platform
**When** tested on Chrome, Firefox, and Safari (latest stable)
**Then** all FRs are functional with no browser-specific workarounds visible to users (NFR25)
**And** zero console warnings or errors (NFR5)

**Given** all interactive exercises
**When** navigated via keyboard only
**Then** all exercises are completable without mouse/touch (NFR18, FR41)
**And** focus indicators are visible and consistent
**And** Tab order is logical

**Given** Playwright E2E tests
**When** configured
**Then** tests run across Chrome, Firefox, and Safari
**And** key user journeys (onboarding, exercise completion, curriculum navigation) are covered

### Story 8.6: GDPR & Settings Frontend `[FE]`

As a user,
I want to manage my language, request data export/deletion, and configure settings through the UI,
So that I have full control over my account and preferences.

**Acceptance Criteria:**

**Given** the settings page
**When** an authenticated user visits
**Then** they can switch language (FR/EN/+1) with immediate effect
**And** they can request data export (triggers email confirmation)
**And** they can request account deletion (triggers email confirmation with clear warning)
**And** they can manage notification preferences

**Given** all settings actions
**When** performed
**Then** confirmation dialogs are shown for destructive actions (deletion)
**And** success/error feedback is clear and immediate
