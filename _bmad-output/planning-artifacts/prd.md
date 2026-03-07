---
stepsCompleted: [step-01-init, step-02-discovery, step-02b-vision, step-02c-executive-summary, step-03-success, step-04-journeys, step-05-domain, step-06-innovation, step-07-project-type, step-08-scoping, step-09-functional, step-10-nonfunctional, step-11-polish, step-12-complete]
inputDocuments:
  - product-brief-transcendence-2026-02-20.md
  - market-blockchain-crypto-nft-learning-products-research-2026-02-20.md
  - brainstorming-session-2026-02-20.md
  - transcendence.subject.md
documentCounts:
  briefs: 1
  research: 1
  brainstorming: 1
  projectDocs: 1
classification:
  projectType: web_app
  domain: edtech
  complexity: medium
  projectContext: greenfield
workflowType: 'prd'
date: 2026-02-23
author: Transcender
---

# Product Requirements Document - transcendence

**Author:** Transcender
**Date:** 2026-02-23

## Executive Summary

**transcendence** is a structured, gamified blockchain learning platform that takes complete beginners from "what is a blockchain?" to genuine understanding through a progressive, learn-by-doing curriculum. It targets the two largest underserved segments in blockchain education — **Aspiring Investors** (~40% of learners) and **Curious Generalists** (~25%) — who are failed by existing options: shallow exchange-backed quizzes, passive video lectures with 5-35% dropout rates, and developer-only bootcamps.

71% of U.S. adults lack basic blockchain understanding. The blockchain education market is valued at $2.4B (2025), growing at 24.9% CAGR, yet no dominant structured learning path exists for non-technical users. transcendence fills that gap.

The platform replaces passive content consumption with interactive missions — drag-and-drop wallet simulations, step-by-step transaction exercises, scenario-based interpretation, and concept matching — embedded directly in a progressive curriculum covering distributed ledgers, consensus mechanisms, cryptocurrencies, wallets, smart contracts, NFTs, DeFi, and real-world applications. Crypto-themed gamification (Knowledge Tokens, gas-fee mechanics, streaks, leaderboards) drives engagement while doubling as education — the platform mechanics themselves teach crypto concepts.

This is a 42 School Transcendence project (team of 4-5), constrained to a web application with frontend, backend, database, Docker deployment, HTTPS, and multi-user support. The MVP targets 14+ module points. Architecture will be designed to accommodate future features — AI Coach (LLM + RAG), NFT certificates, and community-curated resources — without requiring rearchitecture, though none are in MVP scope.

### What Makes This Special

1. **Designed for people who know nothing.** Anti-crypto-bro by design — clean, calm, professional, trustworthy. Every concept anchored to real-world situations. Jargon tooltips on every technical term. The opposite of the intimidating crypto ecosystem.
2. **Structured progressive curriculum.** The first Duolingo-style learning path for blockchain literacy. Not a content library, not video lectures, not quizzes for tokens — a curriculum where each concept builds on the last, covering the full technology stack rather than just crypto trading.
3. **Learn by doing, not by reading.** Interactive simulations embedded in missions — users practice wallet setup, transactions, and concept application within the learning flow. No separate sandbox to navigate.
4. **Gamification IS the education.** Knowledge Tokens teach what tokens are. Gas-fee mechanics teach what gas is. Wallet-profiles teach what wallets are. The platform's game mechanics are crypto metaphors that reinforce learning through use.

## Project Classification

| Attribute | Value |
| --- | --- |
| **Project Type** | Web Application (SPA with real-time features) |
| **Domain** | EdTech — blockchain education for non-technical adults |
| **Complexity** | Medium — EdTech concerns (content structure, accessibility, gamification, i18n) plus 42 subject module constraints |
| **Project Context** | Greenfield — building from scratch |
| **Constraints** | 42 School Transcendence subject: Docker deployment, HTTPS, Chrome + additional browsers, multi-user, 14+ module points |

## Success Criteria

### User Success

| Criteria | Metric | Target |
| --- | --- | --- |
| **Curriculum completion** | % of users who finish the core learning path | >40% (vs industry avg 5-35%) |
| **Knowledge retention** | Users correctly answer review questions from previous modules embedded in subsequent missions | >70% correct on review questions |
| **First-session engagement** | % of users who complete first interactive simulation in session 1 | >60% |
| **Return rate** | % of users who return within 48 hours of onboarding | >50% |
| **Streak retention** | Average streak length | >5 days |
| **Confidence gain** | Users rate their understanding via post-module self-assessment (FR48) | >80% report improved confidence |

### Business Success

Given the academic context (42 School Transcendence), business success is defined by delivering a complete, functional, demonstrable product:

| Criteria | Requirement |
| --- | --- |
| **Module coverage** | All 12 selected modules (15 points) implemented and fully functional |
| **Live demonstration** | Every module demonstrable during 42 evaluation, including live modification requests |
| **Multi-user support** | Platform handles concurrent users without data corruption or race conditions |
| **Docker deployment** | Full stack deploys and runs via single Docker Compose command |
| **Browser compatibility** | Chrome + Firefox + Safari fully functional |
| **Team contribution** | All team members can explain the project and their contributions |

### Technical Success

| Criteria | Target |
| --- | --- |
| **Zero console errors** | No warnings or errors in browser console (42 mandatory requirement) |
| **Input validation** | All forms validated on both frontend and backend |
| **HTTPS everywhere** | All backend communication over HTTPS |
| **Responsive design** | Clear, accessible UI across all devices |
| **Real-time reliability** | WebSocket connections handle disconnect/reconnect gracefully |
| **Database integrity** | Clear schema, well-defined relations, no data corruption under concurrent use |
| **Security baseline** | Hashed+salted passwords, secure credential storage (.env), no exposed secrets |

### Measurable Outcomes

The product is successful when:

1. A user can sign up (email/password or OAuth) and begin the learning path
2. The curriculum is completable end-to-end with interactive exercises at every stage
3. Gamification loops work: Knowledge Tokens earned, streaks tracked, gas-fee mechanics functional, leaderboard operational
4. Users have profiles with friends system and online status
5. Real-time features work across connected clients (notifications, streak reminders, live updates)
6. All 12 modules (15 points) pass 42 evaluation criteria

## User Journeys

### Journey 1: The Aspiring Investor — Success Path

**Sarah, 31, marketing manager, $65K income, bachelor's degree**

Sarah keeps hearing about Bitcoin from her brother and coworkers. She opened a Coinbase account six months ago but never bought anything — she's terrified of losing money because she doesn't understand what she'd actually be buying. She tried a YouTube series but got lost at "consensus mechanism" in episode 3. She Googled "learn blockchain basics" and found transcendence.

**Opening Scene:** Sarah lands on a clean, calm homepage — no rockets, no moon emojis, no flashing prices. She thinks "finally, something that doesn't look like a casino." She signs up with Google OAuth in one click.

**Rising Action:** She starts the first mission: "What is a blockchain?" It's a 10-minute interactive exercise, not a video. She drags blocks into a chain, sees how data gets linked, and completes a concept-matching exercise. She earns her first Knowledge Tokens. A tooltip explains "Knowledge Tokens are like XP — but we call them tokens because that's what crypto uses too." She grins — she's already learning without realizing it.

Over the next two weeks, Sarah does 10-15 minute sessions on the bus to work. She completes missions on distributed ledgers, then wallets. The wallet mission has her set up a simulated wallet step-by-step — she picks a password, gets a fake seed phrase, and the exercise explains why she'd never share it. The gas-fee mechanic kicks in when she makes mistakes — she waits 30 seconds or watches a quick explainer to "refill gas," and suddenly she understands what gas fees actually are.

Her streak hits 8 days. The leaderboard shows her in the top 30% of active learners. She checks a jargon tooltip for "DeFi" mid-lesson and it gives her a plain-language definition with a real-world analogy.

**Climax:** In the simulated transaction mission, Sarah walks through buying fake Bitcoin step-by-step — she sees the transaction fee, the confirmation time, and where the money actually goes. For the first time, she understands what happens when you "buy crypto." It clicks. She texts her brother: "I finally get what gas fees are."

**Resolution:** Sarah completes the full curriculum over 6 weeks. She receives a shareable certificate and posts it to LinkedIn. She opens her real Coinbase account and makes her first $50 Bitcoin purchase — not because transcendence told her to, but because she finally understands what she's buying. She feels confident, not reckless.

**Requirements revealed:** Sign-up (OAuth), progressive curriculum engine, interactive exercise framework (drag-and-drop, simulations, concept matching), Knowledge Tokens system, streak tracking, gas-fee mechanic, jargon tooltips, leaderboard, shareable certificates, mobile-responsive design.

---

### Journey 2: The Curious Generalist — Success Path

**Marc, 47, project manager at an insurance company, no tech background**

Marc's 22-year-old daughter keeps talking about NFTs and DeFi at family dinners. His colleagues discuss "blockchain in supply chain" at work. He nods along but feels like a fraud — he can't explain any of it. He's not interested in investing; he just wants to stop feeling stupid. He finds transcendence through a "blockchain explained for beginners" search.

**Opening Scene:** Marc signs up with email/password on his laptop after work. The interface feels like a professional learning tool, not a crypto exchange. He starts browsing the curriculum map — it goes from "What is a blockchain?" all the way to "Smart contracts in the real world." He thinks: "Okay, this is structured. I can do this."

**Rising Action:** Marc does 2-3 sessions per week, evenings after dinner. He's not chasing streaks — he moves at his own pace. The missions use real-world analogies he can relate to: blockchain as a shared ledger his company's accounting department would use, smart contracts as automatic insurance claim processors.

He hits the wallet-profile feature and notices his profile page looks like a crypto wallet — showing his Knowledge Tokens balance, his "transaction history" of completed lessons, his learning "portfolio." He realizes the platform is quietly teaching him wallet concepts just by existing. He adds a colleague as a friend to compare progress.

**Climax:** At a work lunch, someone mentions "smart contracts for automating vendor payments." Marc explains — clearly and correctly — what a smart contract is, using the insurance claim analogy from the platform. His colleague asks how he learned that. Marc feels informed for the first time, not left behind.

**Resolution:** Marc finishes the core curriculum over 3 months at his casual pace. He doesn't invest in crypto — that was never his goal. But he reads blockchain news with understanding, follows his daughter's NFT conversations, and contributes meaningfully when blockchain comes up at work. He shares his certificate on his company's internal chat.

**Requirements revealed:** Email/password sign-up, curriculum map/visualization, self-paced progression (no streak pressure), wallet-profile concept, friends system, real-world anchored content, shareable certificates, desktop-optimized experience.

---

### Journey 3: The Aspiring Investor — Edge Case (Drop-off & Return)

**Sarah returns after 3 weeks away**

Sarah was on a 12-day streak when a work crisis hit. She missed a day, then two, then a week. Her streak reset to zero. She felt defeated — the same feeling that made her quit Duolingo twice. Three weeks later, she sees a notification: "Your learning journey is still here. Pick up where you left off — no judgment."

**Opening Scene:** Sarah opens transcendence again. Instead of showing "Streak: 0 days" prominently, the platform highlights: "You've completed 14 missions and mastered 3 modules. Resume from: Smart Contracts Basics."

**Rising Action:** She picks up exactly where she left off. The first exercise includes a brief concept refresher — a quick drag-and-drop review of wallet concepts from the previous module, making sure the foundation is solid before moving forward. Within 5 minutes she's back in flow. Her Knowledge Tokens are still there. Her leaderboard position dropped but the platform doesn't shame her — it shows "Active learners this week" rather than "You fell behind."

**Climax:** By the end of her return session, she's earned a new streak of 1 day and completed a mission she'd been stuck on before the break. The break actually helped — the concepts settled.

**Resolution:** Sarah finishes the curriculum 2 weeks later than she would have without the break. The platform treated her return as normal, not as failure. She's one of the 40%+ who complete the full path — including drop-off recovery.

**Requirements revealed:** Streak reset handling (graceful, not punitive), re-engagement notifications, progress persistence, curriculum resume functionality, concept refresher mechanics, Knowledge Token persistence across inactivity.

---

### Journey Requirements Summary

The capabilities below are formally specified in the Functional Requirements section (FR1-FR47). This table traces each capability back to the journey that revealed the need.

| Capability Area | Revealed By Journey | Priority |
| --- | --- | --- |
| **OAuth sign-up (Google, Facebook, Instagram)** | Sarah (J1) | MVP Module |
| **Email/password sign-up** | Marc (J2) | MVP Mandatory |
| **Progressive curriculum engine** | Sarah (J1), Marc (J2) | MVP Core |
| **Interactive exercise framework** | Sarah (J1), Marc (J2) | MVP Core |
| **Knowledge Tokens system** | Sarah (J1), Marc (J2) | MVP Module |
| **Streak tracking + graceful reset** | Sarah (J1, J3) | MVP Module |
| **Gas-fee mechanic** | Sarah (J1) | MVP Core |
| **Jargon tooltips** | Sarah (J1) | MVP Core |
| **Leaderboard** | Sarah (J1) | MVP Module |
| **Wallet-profile** | Marc (J2) | MVP Module |
| **Friends system + online status** | Marc (J2) | MVP Module |
| **Shareable certificates** | Sarah (J1), Marc (J2) | MVP Core |
| **Curriculum map/visualization** | Marc (J2) | MVP Core |
| **Re-engagement notifications** | Sarah (J3) | MVP Module |
| **Progress persistence + resume** | Sarah (J3) | MVP Core |
| **Concept refresher on return** | Sarah (J3) | MVP Core |
| **2FA** | All users | MVP Module |
| **GDPR data export/deletion** | All users | MVP Module |
| **Multi-language (FR/EN/+1)** | All users | MVP Module |

## Web Application Specific Requirements

### Architecture Overview

transcendence is a **Single Page Application (SPA)** with real-time features, built as a learning platform with app-like interactions. Client-side routing provides smooth transitions between missions, curriculum map, and profile — critical for the "Duolingo feel" where users flow between exercises without page reloads.

SEO is not a concern for the in-app experience. Marketing/landing pages can be static or server-rendered separately if needed later.

### Browser Support Matrix

| Browser | Support Level | Notes |
| --- | --- | --- |
| **Google Chrome** (latest stable) | Full — mandatory | 42 subject requirement |
| **Mozilla Firefox** (latest stable) | Full — module | Additional browsers module |
| **Safari** (latest stable) | Full — module | Additional browsers module |

### Responsive Design

| Viewport | Priority | Experience |
| --- | --- | --- |
| **Mobile** (320-767px) | Primary | Single-column — mission-focused, swipeable exercises, bottom nav |
| **Tablet** (768-1023px) | Secondary | Adapted layout — touch-friendly exercises |
| **Desktop** (1024px+) | Secondary | Full layout — curriculum map, leaderboard, profile |

Interactive exercises (drag-and-drop, simulations) must work with both mouse and touch input.

### Real-Time Architecture

| Feature | Transport | Pattern |
| --- | --- | --- |
| **Online status** | WebSocket | Presence tracking, heartbeat |
| **Notifications** | WebSocket | Server push (streak reminders, milestones) |
| **Leaderboard updates** | WebSocket or polling | Near-real-time, can tolerate slight delay |

### Implementation Considerations

- **CSS framework:** Use a styling solution (Tailwind, Bootstrap, Material-UI, Styled Components) per 42 subject
- **State management:** SPA requires client-side state for curriculum progress, Knowledge Tokens, streak, user session
- **Routing:** Client-side router with protected routes for authenticated content
- **Form validation:** All inputs validated on both frontend and backend (42 mandatory)
- **HTTPS:** All communication over HTTPS (42 mandatory)
- **Credentials:** .env file for API keys and secrets, .env.example provided, .env in .gitignore

Measurable performance, accessibility, and deployment targets are specified in the Non-Functional Requirements section.

## Product Scope

### MVP Strategy & Philosophy

**MVP Approach:** Experience MVP — deliver the core learning experience end-to-end. A user must be able to sign up, start the curriculum, complete interactive missions, earn Knowledge Tokens, maintain streaks, and receive a certificate. The gamification-as-education differentiator must be felt from the first session.

**Resource Requirements:** Team of 4-5 (42 subject constraint). All members contribute to mandatory part and modules.

**Core User Journeys Supported:**

- Sarah (Aspiring Investor) — full success path
- Marc (Curious Generalist) — full success path
- Sarah (Drop-off & Return) — re-engagement path

### MVP Modules (15 points, 12 modules)

| # | Module | Pts | What It Delivers |
| --- | --- | --- | --- |
| 1 | Web: FE + BE Frameworks (Major) | 2 | React/Next.js + NestJS/Express full-stack |
| 2 | Web: Real-time features (Major) | 2 | Real-time notifications, WebSocket updates |
| 3 | Web: ORM (Minor) | 1 | Prisma or TypeORM |
| 4 | Web: Notification system (Minor) | 1 | Streak reminders, milestones |
| 5 | Web: Custom design system (Minor) | 1 | 10+ reusable components, anti-crypto-bro aesthetic |
| 6 | User Mgmt: Standard user management (Major) | 2 | Profile, avatar, friends, online status, wallet-profile |
| 7 | User Mgmt: OAuth 2.0 (Minor) | 1 | Google + Facebook + Instagram |
| 8 | User Mgmt: 2FA (Minor) | 1 | Two-factor authentication |
| 9 | Gaming: Gamification (Minor) | 1 | Knowledge Tokens, daily streaks, leaderboards, achievements |
| 10 | Accessibility: Multiple languages (Minor) | 1 | French + English + 1 more |
| 11 | Accessibility: Additional browsers (Minor) | 1 | Chrome + Firefox + Safari |
| 12 | Data: GDPR compliance (Minor) | 1 | Data export, deletion, confirmation emails |
|  | **TOTAL** | **15** | 1-point safety margin above 14 minimum |

### Non-Module MVP Features (core product, not scored)

- Structured progressive curriculum with bite-sized missions
- Interactive exercises (drag-and-drop, simulated transactions, concept matching, scenarios)
- Crypto-themed gamification mechanics (gas-fee mechanic, learning chains visualization)
- Jargon tooltips
- Shareable certificates (image/social media, not NFT)

### Mandatory Requirements (42 subject)

- Privacy Policy and Terms of Service pages
- HTTPS everywhere
- Docker Compose single-command deployment
- Multi-user concurrent support
- Chrome compatibility (+ Firefox/Safari via browser module)
- No browser console warnings/errors
- .env for credentials with .env.example provided
- Git with meaningful commits from all team members
- README.md with all required sections

### Growth Features (Post-MVP, architecture-ready)

| Feature | Related Modules | Points | Notes |
| --- | --- | --- | --- |
| **AI Coach** | LLM (Major) + RAG (Major) + Sentiment (Minor) | 5 | Adaptive coaching, Feynman technique, persistent memory |
| **NFT Certificates** | Blockchain: Store scores (Major) | 2 | Completion certs minted on test blockchain (Avalanche/Solidity) |
| **User interaction (chat)** | Web: User interaction (Major) | 2 | Chat system, profiles, friends — profiles/friends already in User Mgmt |
| **Community-curated resources** | — | 0 | Users attach/upvote external resources on lessons, URL deduplication |
| **Adaptive onboarding quiz** | — | 0 | Assesses starting point, builds personalized learning path |
| **Market news integration** | — | 0 | Real market news with learning exercises attached |

Post-MVP potential: up to 24 total points (15 MVP + 9 growth).

### Vision (Future)

- TikTok-style micro-lessons (short-form video content)
- Dedicated scam detection training module
- Mobile native app (iOS/Android)
- B2B enterprise blockchain literacy training
- User-generated mini-courses
- Real Knowledge Tokens (in-app points migrated to on-chain tokens)
- Localization for emerging markets (Africa, Southeast Asia, Latin America)

### Risk Mitigation Strategy

**Technical Risks:**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Interactive exercise engine complexity | High — core differentiator | Define a small set of exercise types (drag-and-drop, matching, step-by-step simulation, multiple choice) and build a reusable framework. Don't build a generic exercise builder — hardcode the types you need. |
| Curriculum content creation | High — no product without content | Separate content from code. Store curriculum as structured data (JSON/DB), not hardcoded. Allows parallel content creation and engineering work. |
| WebSocket reliability | Medium — real-time module | Use battle-tested library (Socket.IO). Implement heartbeat + auto-reconnect. Test with concurrent users early. |
| 1-point margin above 14 | Medium — if any module fails evaluation, you fail | Each module must be demonstrable and robust. Prioritize depth over breadth — 12 solid modules beat 16 fragile ones. |

**Resource Risks:**

| Risk | Mitigation |
| --- | --- |
| Team member drops or underperforms | Ensure no single-person dependencies. Every module should be understood by at least 2 people. |
| Scope creep | This PRD is the scope contract. If it's not in MVP, it doesn't get built until MVP is done. |
| Content bottleneck | Start curriculum content creation immediately in parallel with engineering. Don't wait for the platform to be built. |

## Functional Requirements

### User Management & Authentication

- **FR1:** Users can sign up with email and password
- **FR2:** Users can sign up and log in using OAuth 2.0 providers (Google, Facebook, Instagram)
- **FR3:** Users can enable and use two-factor authentication (2FA) on their account
- **FR4:** Users can create and edit their profile information (display name, bio, avatar)
- **FR5:** Users can upload a custom avatar or use a default avatar
- **FR6:** Users can view their wallet-profile page displaying Knowledge Tokens balance, completed missions, and learning "portfolio"
- **FR7:** Users can log out of their account
- **FR8:** Users can reset their password

### Curriculum & Learning Path

- **FR9:** Users can view a curriculum map showing all available modules and their progression
- **FR10:** Users can follow a progressive learning path where each module unlocks sequentially (Module N requires Module N-1 completion)
- **FR11:** Users can complete missions of 2-5 minutes each covering blockchain topics (distributed ledgers, consensus mechanisms, cryptocurrencies, wallets, smart contracts, NFTs, DeFi, real-world applications)
- **FR12:** Users can resume their learning from exactly where they left off after any absence
- **FR13:** Users can receive a concept refresher when returning after 7 or more days of inactivity
- **FR14:** Users can view their overall curriculum progress and completion percentage
- **FR15:** Users can receive a shareable certificate upon completing the learning path
- **FR16:** Users can access jargon tooltips providing non-technical definitions with real-world analogies for all technical terms encountered
- **FR17:** Users can view their learning progress visualized as a learning chain (blockchain metaphor)
- **FR48:** Users can complete a post-module self-assessment rating their confidence on the module's topics (used to measure US6 success criterion)

### Interactive Exercises & Simulations

- **FR18:** Users can complete interactive placement exercises within missions
- **FR19:** Users can complete concept-matching exercises within missions
- **FR20:** Users can complete step-by-step simulated transaction exercises (e.g., wallet setup, buying crypto)
- **FR21:** Users can complete scenario-based interpretation exercises presenting real-world blockchain situations with multiple-choice responses
- **FR22:** Users can receive feedback on exercise responses within <200ms (see NFR Performance)
- **FR23:** Users can interact with exercises using both mouse and touch input

### Gamification & Engagement

- **FR24:** Users can earn Knowledge Tokens by completing missions and exercises
- **FR25:** Users can maintain and view daily learning streaks
- **FR26:** Users experience a gas-fee mechanic where every exercise submission costs Knowledge Tokens (flat cost per submission, correct or incorrect)
- **FR27:** Users can view their position on leaderboards
- **FR28:** Users can earn achievements for completing modules, reaching Knowledge Token thresholds, and maintaining streak targets
- **FR29:** Users see their cumulative progress (missions completed, modules mastered) highlighted after a streak reset, rather than a zero-streak counter
- **FR30:** Users can view their Knowledge Token balance and earning history

### Social & Community

- **FR31:** Users can add and remove other users as friends
- **FR32:** Users can see the online status of their friends
- **FR33:** Users can view other users' public profiles
- **FR34:** Users can share certificates and achievements to external platforms (LinkedIn, Twitter/X)

### Notifications & Communication

- **FR35:** Users can receive notifications for streak reminders, delivered within <500ms (see NFR Performance)
- **FR36:** Users can receive notifications for module completions, Knowledge Token thresholds, and streak milestones
- **FR37:** Users can receive re-engagement notifications after 7 or more days of inactivity
- **FR38:** Users receive notifications within <500ms while connected to the platform (see NFR Performance)

### Content Accessibility & Internationalization

- **FR39:** Users can switch the platform language between at least three languages (French, English, and one additional)
- **FR40:** Users can access the platform across desktop (1024px+), tablet (768-1023px), and mobile (320-767px) viewports with adapted layouts
- **FR41:** Users can navigate all interactive exercises using keyboard input
- **FR42:** Users can access the platform on Chrome, Firefox, and Safari browsers

### Design System

- **FR49:** Users experience a consistent visual design system comprising a minimum of 10 reusable UI components, a defined color palette, and a typography scale (Module 5 deliverable)

### Data Privacy & Compliance

- **FR43:** Users can request an export of their personal data
- **FR44:** Users can request deletion of their account and personal data
- **FR45:** Users can receive confirmation emails for data operations
- **FR46:** Users can view the Privacy Policy page
- **FR47:** Users can view the Terms of Service page
- **FR50:** Users can view a financial disclaimer stating that educational content does not constitute investment advice, displayed during onboarding and accessible from every module
- **FR51:** Users must confirm they are 16 or older during account registration (age eligibility gate)

### Content Governance

- **FR52:** All curriculum content is tagged with a last-reviewed date, and content older than 6 months is flagged for review
- **FR53:** Each module includes a disclaimer distinguishing educational content from financial advice where investment-related topics are covered

## Non-Functional Requirements

### Performance

| Requirement | Target | Rationale |
| --- | --- | --- |
| Exercise interaction feedback | <200ms visual response | Latency above 200ms interrupts learning flow and perceived interactivity |
| Page/section transitions | <1 second | Sub-second transitions maintain Duolingo-like navigation continuity between missions, curriculum map, profile |
| Real-time message delivery | <500ms to connected clients | Notifications and online status updates perceived as immediate at <500ms |
| Concurrent user support | 20+ simultaneous active users while maintaining above performance targets | 42 subject multi-user requirement + evaluation demo |
| Browser console | Zero warnings or errors | 42 mandatory requirement |

### Security

| Requirement | Target | Rationale |
| --- | --- | --- |
| Password storage | Hashed and salted using industry-standard adaptive hashing algorithm | 42 mandatory — no plaintext passwords |
| Transport encryption | HTTPS on all client-server communication | 42 mandatory requirement |
| Credential management | All secrets in .env files, never in source code | 42 mandatory — .env.example provided, .env in .gitignore |
| Session management | Sessions expire after 30 minutes of inactivity (configurable: 15-120 min) | Protect user accounts from unauthorized access |
| Input validation | All forms validated on both frontend and backend | 42 mandatory — prevent injection attacks (XSS, SQL injection) |
| OAuth token handling | Tokens stored server-side or in HTTP-only secure cookies, never in localStorage or client-accessible JavaScript | Protect third-party authentication credentials |
| 2FA secrets | Encrypted at rest with minimum 256-bit key strength | Protect two-factor authentication setup |

### Reliability

| Requirement | Target | Rationale |
| --- | --- | --- |
| Real-time connection reconnection | Automatic reconnect within 5 seconds without data loss or user intervention | 42 subject requires graceful disconnect/reconnect handling |
| Progress persistence | User data survives session ends, server restarts, and extended absence | Journey 3 (drop-off & return) depends on this |
| Concurrent data integrity | No data corruption or race conditions under simultaneous user actions | 42 mandatory multi-user requirement |
| Graceful degradation | Core features (curriculum navigation, exercise completion, progress saving) remain available via HTTP fallback during real-time connection outage of up to 30 minutes | Users shouldn't lose work if connection drops |

### Accessibility & Usability

| Requirement | Target | Rationale |
| --- | --- | --- |
| Responsive design | Functional across desktop (1024px+), tablet (768-1023px), mobile (320-767px) | 42 mandatory — clear, responsive, accessible across all devices |
| Keyboard navigation | All interactive exercises operable via keyboard | Best practice for inclusive design |
| Color contrast | WCAG AA minimum (4.5:1 normal text, 3:1 large text) | Anti-crypto-bro design commitment — readability and trust |
| Typography | Minimum 16px body text, 1.5 line height, distinct heading scale (minimum 4px size difference between heading levels) | Supports readability and reduces visual strain |
| i18n coverage | All user-facing text translatable, language switching completes within <500ms without page reload | Multiple languages module requirement |
| Touch/mouse parity | All exercises completable and all interaction targets reachable with both touch and mouse input | Tablet and mobile users need full exercise functionality |

### Deployment & Infrastructure

| Requirement | Target | Rationale |
| --- | --- | --- |
| Single-command deployment | Entire stack runs via `docker compose up` | 42 mandatory requirement |
| Environment documentation | .env.example with all required variables documented | 42 mandatory — evaluators need to set up the project |
| Cross-browser compatibility | All FRs (FR1-FR47) functional on Chrome, Firefox, Safari (latest stable) with no browser-specific workarounds visible to users | Chrome mandatory + additional browsers module |

### Integration

| Requirement | Target | Rationale |
| --- | --- | --- |
| OAuth provider support | Google, Facebook, Instagram with standardized OAuth 2.0 flow | OAuth module requirement |
| OAuth failure handling | Graceful fallback with clear error messaging | Users must not be locked out if a provider is temporarily unavailable |
