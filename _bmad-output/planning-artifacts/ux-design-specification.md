---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]
inputDocuments:
  - product-brief-transcendence-2026-02-20.md
  - prd.md
  - prd-validation-report.md
  - market-blockchain-crypto-nft-learning-products-research-2026-02-20.md
  - brainstorming-session-2026-02-20.md
  - transcendence.subject.md
date: 2026-02-24
author: Transcender
---

# UX Design Specification transcendence

**Author:** Transcender
**Date:** 2026-02-24

---

## Executive Summary

### Project Vision

transcendence is a gamified blockchain learning platform — the "Duolingo for blockchain" — designed to take complete beginners from zero understanding to genuine confidence through a progressive, learn-by-doing curriculum. The platform's core UX innovation is that its gamification mechanics ARE the education: Knowledge Tokens teach what tokens are, gas-fee costs on every action teach what gas is, wallet-profiles teach what wallets are. The design philosophy is explicitly anti-crypto-bro — clean, calm, professional, and trustworthy — positioning against the intimidating, jargon-heavy crypto ecosystem.

Built as a 42 School project (SPA with real-time features, Docker deployment), the platform delivers 10-15 minute interactive missions covering the full blockchain landscape, from distributed ledgers to DeFi, with four exercise types (interactive placement, concept-matching, simulated transactions, scenario interpretation) embedded directly in the learning flow.

### Target Users

**Primary Persona 1: Sarah — The Aspiring Investor (28-35yo, ~40% of learners)**
- Wants to invest in crypto but is terrified of losing money through ignorance
- Has tried YouTube and exchange tutorials but drowned in jargon
- Comfortable with apps (Duolingo, banking apps) but intimidated by crypto interfaces
- 10-15 minute daily sessions, often on mobile during commute — one-handed use, bumpy rides, notification interruptions
- Success = confidently understanding what she's buying when she opens a real exchange account

**Primary Persona 2: Marc — The Curious Generalist (35-50yo, ~25% of learners)**
- Doesn't want to invest — wants to stop feeling uninformed when blockchain comes up at work or family dinners
- Professional background, desktop-first usage, evening sessions 2-3x/week
- Values calm, professional presentation; repelled by crypto-bro culture
- Self-paced, not streak-driven; browses supplementary content
- Success = explaining smart contracts correctly at a work lunch

**Shared User Characteristics:**
- Intelligent adults with zero blockchain knowledge — approachable, not patronizing
- Low trust in crypto ecosystem — need professional, trustworthy visual cues
- High dropout risk (industry: 5-35%) — need quick wins and visible progress each session
- Both mouse and touch users across desktop, tablet, and mobile viewports

### Key Design Challenges

1. **Onboarding as emotional trust-building.** The target audience is actively intimidated by blockchain. The first 30 seconds must communicate "you're safe here and you're going to be okay" before communicating anything else. Onboarding is a trust exercise, not a feature setup.

2. **Approachable without patronizing.** Target users are intelligent adults who know nothing about blockchain. The UX must be welcoming and confidence-building without being childish — professional trust, not cartoon hand-holding.

3. **Four exercise types, one cohesive product.** Interactive placement (spatial/tactile), concept-matching (categorical), simulated transactions (sequential/procedural), and scenario interpretation (analytical) are four distinct cognitive modes. They must feel like one product through consistent feedback patterns — same animation style, same correct/incorrect micro-interactions, same gas-fee mechanic across all types.

4. **Gamification as education, not decoration.** Knowledge Tokens, gas-fee mechanics, wallet-profiles, and learning chains must feel like natural crypto metaphors that click intuitively. Gas fees apply to every action (not just mistakes) — mirroring how real blockchain gas works. Mistakes cost more gas, but the baseline mechanic is that doing things costs gas. The user internalizes that gas is the cost of doing anything on the blockchain.

5. **Progressive reveal of complexity.** Gamification elements (wallet-profile, Knowledge Tokens dashboard, leaderboard) are introduced only after early wins, not during onboarding. The UI itself grows in sophistication alongside the user's knowledge — early screens are minimal and focused; later screens introduce richer data displays and crypto-native UI patterns the user now understands. Step-by-step philosophy extends to feature exposure.

6. **Graceful re-engagement after absence.** Punitive streak resets kill motivation (Journey 3). The UX must celebrate cumulative progress over streak length, making return feel welcoming rather than shameful.

7. **Mobile as distinct experience context.** Sarah's bus-ride sessions are not "the same content in a smaller container" — they involve one-handed use, interruptions, and compressed attention. Mobile missions need dedicated interaction design, not just responsive layout.

8. **Premium visual quality at a free price point.** For an audience with high price sensitivity and low trust, the interface must feel premium despite being free. If it looks like a free tool, trust drops. If it looks like a premium product that happens to be free, trust rises.

### Design Opportunities

1. **Wallet-profile as signature design element.** The user profile designed as a simulated crypto wallet — showing Knowledge Token balance, "transaction history" of completed missions, learning "portfolio" — teaches wallet concepts through daily use. Introduced progressively after the user has earned initial tokens, not as a first-screen feature.

2. **Gas-fee mechanic as experiential teaching.** Every exercise action consumes gas — submitting answers, moving to next missions, unlocking modules. Mistakes cost more gas (mirroring failed transactions on Ethereum). Users learn what gas fees are by living them, not reading about them. Visual gas gauge and refill animations turn a mechanic into an aha moment.

3. **Anti-crypto-bro aesthetic as competitive advantage.** In a market of neon gradients and rocket emojis, a calm, clean, trustworthy design language (think Headspace/Notion, not Binance/Robinhood) is itself a differentiator that signals safety and credibility. Every competitor does multiple-choice-and-move-on — four distinct exercise types that each teach differently make "learn by doing" real, not just a tagline.

4. **Progressive disclosure mirroring curriculum.** The UI grows in sophistication alongside the user's knowledge. The curriculum map itself could evolve visually — starting as a simple linear path and gradually resembling an actual blockchain visualization as the user progresses. The UI teaches what blockchain looks like by becoming one.

### Exercise Type Framework

Four distinct exercise types, each targeting a different cognitive mode, unified by consistent feedback patterns:

**Interactive Placement (spatial/tactile — teaches structure, sequence, relationships)**
- Build a blockchain: drag blocks into correct chain order, see how altering one breaks downstream links
- Wallet anatomy: drag components (public key, private key, seed phrase) into correct positions
- Transaction flow: order the steps of a Bitcoin transaction from "click send" to "confirmed on blockchain"

**Concept Matching (categorical — teaches vocabulary, definitions, mental models)**
- Jargon decoder: match technical terms to plain-language definitions AND real-world analogies (three-column matching)
- Crypto vs traditional finance: match crypto concepts to banking equivalents (wallet ↔ bank account, private key ↔ PIN)
- Spot the scam: match red-flag phrases to scam types they indicate

**Step-by-Step Simulated Transactions (sequential/procedural — teaches procedures, builds confidence)**
- First Bitcoin purchase: walk through buying $50 of Bitcoin with fee breakdown and micro-explanations at each step
- Wallet setup: create wallet, receive seed phrase, prove you saved it, send test transaction to yourself
- DeFi lending walkthrough: deposit tokens into simulated lending pool, watch interest accrue, withdraw

**Scenario-Based Interpretation (analytical — teaches critical thinking, real-world application)**
- News interpretation: read real headline, assess likely market impact and implications (multiple-choice with explanations)
- Scam or legit: evaluate realistic crypto offers and identify red flags
- Investment scenario: assess whether to act on a friend's crypto tip — scored on quality of questioning, not buy/don't-buy

## Core User Experience

### Defining Experience

The core experience of transcendence is the **exercise-feedback-reward micro-loop**: the user performs an action (drags, matches, selects, steps through) → sees clear, immediate feedback (<200ms) → pays gas (Knowledge Tokens) for the submission → feels progress. This loop is the atomic unit of the product. Every design decision serves it.

The loop operates inside **2-5 minute bite-sized missions** — short, focused, and completable in a single moment of availability (a bus stop, a coffee break, a bathroom scroll). Users can chain multiple missions in a single sitting when they want a longer session, but each mission is a self-contained unit of learning with a clear start and end. The SPA architecture eliminates page reloads between missions, making chaining feel seamless.

Four exercise types (interactive placement, concept matching, simulated transactions, scenario interpretation) are blended across missions into a continuous curriculum flow. Within a mission, transitions between exercises are seamless.

The secondary defining experience is **daily mission completion rewarding tokens** — completing at least one mission in a day earns Knowledge Tokens and extends the streak, reinforcing the habit loop and teaching what token earning means through lived experience.

### Token Economy

The platform's gamification mechanics ARE the education. Three interconnected systems teach crypto concepts by being crypto concepts:

**XP (Experience Points)**
- Simple counter: +1 per completed mission
- Represents total missions completed across the user's lifetime
- Visible on the wallet-profile dashboard as a progress metric, not during exercises
- Teaches the concept of on-chain activity history

**Knowledge Tokens**
- The platform's currency, earned by completing missions
- Displayed as a balance in the wallet-profile
- Spent as gas fees on every exercise submission
- Teaches what tokens are and how wallet balances work through daily use

**Gas Fees**
- Every exercise submission (correct or incorrect) costs a flat amount of Knowledge Tokens
- Mirrors real blockchain: every transaction costs gas, regardless of outcome
- Wrong answers don't cost more gas per submission — they cost more gas mechanically because the user must submit again
- Users can go into token debt mid-mission (mission is never interrupted) but cannot start a new mission while in debt
- Debt creates a natural pacing mechanic: the user must earn tokens from completed missions before continuing
- Teaches what gas fees are by living them — every action has a cost

### Platform Strategy

**Platform:** Single Page Application (web), no native apps.

**Viewport Priority:**
- **Mobile (320-767px) — Primary.** Sarah's bus-ride sessions define the design. One-handed use, touch-first interactions, vertical layouts, bottom navigation, thumb-zone-optimized action targets. All exercises designed for touch first, adapted for mouse second.
- **Tablet (768-1023px) — Secondary.** Touch-friendly with more screen real estate. Exercises can show more context simultaneously.
- **Desktop (1024px+) — Secondary.** Marc's evening sessions. Mouse/keyboard input, expanded layouts for curriculum map and wallet-profile. Richer data displays where space allows.

**Browser Support:** Chrome (mandatory) + Firefox + Safari.

**No offline functionality** — the app requires backend communication for progress persistence, token calculations, and real-time features.

**SPA Architecture Implications:**
- Client-side routing for seamless transitions between missions, curriculum map, and profile
- Exercise flow within missions feels continuous — no visible navigation breaks
- State persisted to backend at each meaningful interaction (exercise completion, token earn, gas spend) to prevent data loss on connection drop
- Mission chaining feels like one continuous session, not separate page loads

### Effortless Interactions

These interactions must feel zero-friction — requiring no thought, no searching, no waiting:

1. **Session start.** Open app → see exactly where you left off → tap to resume → in exercise flow within seconds. No dashboard to parse, no decisions to make. The app knows what's next.

2. **Curriculum clarity.** At any moment, the user knows where they are, what's next, and how far they've come. The curriculum map is a dedicated full-page view, reachable in 1-2 taps from anywhere. It serves as both navigation and progress visualization.

3. **Exercise flow.** Within a mission, moving between exercises is continuous. Feedback from one exercise transitions naturally into the setup for the next. The SPA eliminates any perception of "loading the next page."

4. **Mission chaining.** After completing a mission, the next mission is one tap away. The user never has to navigate back to a menu to continue — unless they want to.

5. **Jargon resolution.** Any technical term, one tap = instant plain-language definition with real-world analogy. The tooltip appears in context — the user never leaves the current screen or loses their place.

6. **Re-engagement after absence.** No guilt, no shame. Progress is highlighted ("You've completed 14 missions and mastered 3 modules"), the resume point is obvious, and a brief concept refresher eases the user back into flow.

### Critical Success Moments

These are the make-or-break interactions that determine whether a user stays, learns, and completes the curriculum:

1. **First 30 seconds (Trust).** The user lands on a clean, calm interface — no crypto noise, no jargon bombardment. The immediate emotional signal is "you're safe here and you're going to be okay." This moment sells trust, not features.

2. **First exercise completion (Aha).** The user completes their first interactive exercise — dragging blocks into a chain, matching terms to definitions — and realizes they're learning by doing, not reading. They earn their first Knowledge Tokens. The gamification-as-education promise lands.

3. **First gas-fee encounter (Mechanic click).** The user submits an answer and sees gas consumed from their token balance. A brief explanation connects the mechanic to real blockchain gas fees: "Every action on a blockchain costs gas — even this one." The moment the user thinks "oh, THAT'S what gas fees are" — the platform's core differentiator is proven.

4. **First streak reward (Daily habit).** The user completes a mission, earns daily tokens, and sees their streak counter increment. The habit loop engages — tomorrow they'll want to come back. The token reward teaches what token earning means in crypto.

5. **First wallet-profile reveal (Deeper understanding).** After earning initial tokens, the user discovers their profile is designed as a simulated wallet — token balance, XP as activity count, "transaction history" of completed missions, learning "portfolio." The realization that the UI itself has been teaching wallet concepts is a second-order aha moment.

6. **Return after break (Retention).** The user comes back after days or weeks away. Instead of "Streak: 0," they see cumulative progress highlighted. The experience welcomes them back, preserves everything they earned, and makes resuming obvious. This moment determines whether a drop-off becomes permanent or temporary.

### Experience Principles

These principles guide every UX decision for transcendence:

1. **The loop is sacred.** Every screen, every transition, every UI element either serves the exercise-feedback-reward loop or gets out of its way. Nothing interrupts flow during a mission.

2. **Mobile defines the design.** If it doesn't work one-handed on a bus, it doesn't ship. Desktop enhances the mobile experience — mobile doesn't shrink the desktop one.

3. **Experience first, explanation second.** The platform mechanics (tokens, gas, wallets, chains) teach through interaction. Brief, targeted explanations reinforce what the user just experienced — never the other way around. If the mechanic doesn't make the concept click on its own, the explanation fills the gap in one or two sentences.

4. **Trust before features.** Every new user is intimidated. The UX earns trust through calm, clean, professional design before asking anything of the user. The anti-crypto-bro aesthetic is not a style preference — it's a trust strategy.

5. **Progress is permanent, streaks are gentle.** Knowledge Tokens, XP, and completed missions never disappear. Streaks motivate daily engagement but never punish absence. Cumulative progress is always more visible than streak status.

## Desired Emotional Response

### Primary Emotional Goals

The emotional arc of transcendence is a transformation: **from intimidation to quiet confidence.** Every design decision supports this arc.

**Primary emotion: Calm confidence.** The user feels capable, safe, and gently guided. Not excited — confident. Not entertained — empowered. The emotional register is closer to Headspace than Duolingo: warm, focused, professional, with moments of genuine satisfaction when concepts click.

**Secondary emotion: Earned understanding.** Each completed mission leaves the user feeling "I know something I didn't know 3 minutes ago." This isn't the hollow dopamine of a correct quiz answer — it's the deeper satisfaction of genuine comprehension.

**Differentiating emotion: Safe surprise.** The progressive reveal of platform mechanics (tokens, gas, wallet-profile) creates layered aha moments where the user realizes the app was teaching them through its own interface. This feeling — "wait, I was learning without realizing it" — is what makes them tell a friend.

### Emotional Journey Mapping

| Stage | Target Emotion | Design Implication |
|-------|---------------|-------------------|
| **First visit** | Safety, relief — "finally, not intimidating" | Clean, calm visual language. No jargon on first screen. No feature overload. Anti-crypto-bro aesthetic does the emotional heavy lifting. |
| **First exercise** | Gentle surprise, curiosity — "wait, I'm actually doing this?" | Immediate hands-on interaction. No long onboarding. The learn-by-doing promise must feel real within 60 seconds. |
| **First mission complete** | Quiet pride, momentum — "I understood that" | Clear completion signal. XP increment visible. Immediate path to next mission. Satisfaction without fanfare. |
| **Token introduction (curriculum milestone)** | Amused recognition — "oh, I've been earning these?" | When the curriculum teaches tokens, the UI reveals token rewards retroactively or from that point. The mechanic becomes real because the user now understands what it represents. |
| **Gas-fee activation (curriculum milestone)** | Knowing smile — "so THAT'S what gas fees are" | When the curriculum teaches gas, the mechanic activates. The user's own exercise submissions now cost gas. Theory becomes lived experience. |
| **Mid-session flow** | Calm focus, gentle absorption | Minimal UI during exercises. No distracting notifications. No timers or pressure mechanics. The user is absorbed in learning, not managing a game. |
| **Streak building** | Gentle momentum — "I want to come back" | Streaks visible but not aggressive. Daily token reward is the pull, not streak-loss fear. The app invites return, never demands it. |
| **Wallet-profile reveal (curriculum milestone)** | Delighted realization — "my profile was a wallet all along" | When the curriculum teaches wallets, the profile view transforms. XP, tokens, transaction history, learning portfolio — all recontextualized as wallet concepts the user now understands. |
| **Returning after break** | Welcome, continuity — "everything's still here" | Cumulative progress highlighted. No streak shame. Resume point obvious. Brief concept refresher offered, not forced. |
| **Curriculum completion** | Earned confidence — "I actually understand this now" | Certificate as proof. Clear signal that knowledge is real and portable. The user feels ready for the real crypto world, not dependent on the app. |

### Progressive Mechanic Reveal — Emotional Sequence

The platform's gamification mechanics are revealed in curriculum order, creating a layered emotional arc:

1. **XP only (early missions).** The user completes missions and sees a simple XP counter (+1 per mission). No complexity, no cognitive load from gamification. The emotional focus is purely on learning and building initial confidence.

2. **Knowledge Tokens introduced (when curriculum teaches tokens).** The UI adds token balance and rewards. The user realizes the app's currency maps to the concept they just learned. First aha moment: "The platform is using the thing it's teaching me."

3. **Gas fees activated (when curriculum teaches gas).** Every exercise submission now visibly costs Knowledge Tokens. The user experiences gas fees as a real mechanic, not an abstract concept. Second aha moment: the lived experience of "every action costs something on the blockchain."

4. **Wallet-profile revealed (when curriculum teaches wallets).** The user's profile transforms into a simulated wallet view — token balance, transaction history, learning portfolio. Third aha moment: "My profile page has been a wallet this whole time." The platform's deepest teaching-through-design payoff.

Each reveal is both a curriculum milestone and an emotional event. The user's understanding and the UI's complexity grow in lockstep.

### Micro-Emotions

**Critical positive micro-emotions to cultivate:**

- **Confidence over confusion.** At every decision point, the user knows what to do next. No ambiguity in navigation, exercise instructions, or progression. When confused, help is one tap away (jargon tooltips, brief explanations).
- **Trust over skepticism.** The visual language, tone of voice, and interaction patterns consistently signal professionalism and safety. No dark patterns, no aggressive engagement tactics, no crypto-bro energy.
- **Quiet accomplishment over excitement.** Completion feedback is satisfying but restrained — a gentle confirmation, not fireworks. The satisfaction comes from understanding, not from reward animations.
- **Curiosity over anxiety.** New concepts are framed as discoveries, not challenges. "Let's explore what smart contracts do" rather than "Can you answer this correctly?"
- **Belonging over isolation.** Leaderboards and streaks create gentle social context — "you're part of a community of learners" — without competitive pressure.

**Negative micro-emotions to actively prevent:**

- **Overwhelm.** Never show more than the user needs at their current stage. Progressive reveal applies to UI elements, features, and information density.
- **Shame.** No punitive messaging for wrong answers, broken streaks, or token debt. Mistakes are reframed as "transactions that cost more gas" — a neutral mechanic, not a judgment.
- **Distrust.** Any element that feels like a crypto exchange, a trading platform, or a sales funnel violates the core emotional promise. The platform is a teacher, never a broker.
- **Impatience.** Transitions, feedback, and navigation must feel instant. Any perceived lag breaks the calm-focus state and introduces frustration.

### Emotional Design Principles

1. **Calm is the baseline.** The default emotional state during any interaction is focused calm. Excitement is a brief peak (aha moments, milestone reveals), not the sustained register. Design for sustained calm with punctuated satisfaction.

2. **The app is a patient teacher.** Every micro-interaction — error states, tooltips, navigation prompts, exercise instructions — should feel like it comes from someone who genuinely wants you to succeed and has all the time in the world. Never rushed, never condescending.

3. **Mistakes are transactions, not failures.** Wrong answers cost gas. That's it. No red screens, no disappointing sounds, no "try again!" messaging. The gas mechanic itself is the feedback — neutral, mechanical, educational. The user learns that failed blockchain transactions still cost gas, through experience.

4. **Reveal, don't overwhelm.** Every new UI element, mechanic, or feature is introduced at the moment the user has the context to understand it. Nothing appears before its curriculum moment. The UI teaches patience by practicing it.

5. **Celebrate understanding, not completion.** The emotional reward for finishing a mission isn't "you finished!" — it's "you now understand X." The certificate at the end isn't a trophy — it's proof of knowledge. The distinction matters: the user should feel smarter, not just further along.

## UX Pattern Analysis & Inspiration

### Inspiring Products Analysis

**Headspace (Primary Influence — Emotional Foundation)**

- **What it solves elegantly:** Makes meditation — something intimidating and abstract — feel accessible, safe, and achievable in minutes. Direct parallel to transcendence making blockchain accessible.
- **Onboarding:** Gentle, guided, no feature dump. The first session starts almost immediately. Trust is built through tone, not explanation.
- **Navigation:** Minimal. The app knows what you should do next. Home screen surfaces the next session, not a dashboard of options.
- **Visual design:** Soft colors, generous whitespace, rounded shapes, warm illustrations. Everything signals "this is a safe space." Premium quality at a free-tier entry point.
- **Emotional register:** Calm authority. The app speaks like a teacher who has infinite patience and genuinely wants you to succeed.
- **Key UX lesson for transcendence:** The entire app is an exercise in trust-building through restraint. What's NOT on the screen matters as much as what is.

**Duolingo (Secondary Influence — Mechanic Foundation)**

- **What it solves elegantly:** Makes language learning — something that requires years of commitment — feel achievable in 2-5 minute daily sessions. Direct parallel to transcendence's bite-sized missions.
- **Core loop:** Exercise → feedback → reward → next exercise. Tight, addictive, frictionless. The user is always doing, never just reading.
- **Streak mechanic:** Simple, powerful. Daily engagement driven by not wanting to break the chain. But Duolingo's streak-loss anxiety is something transcendence must avoid.
- **Progressive difficulty:** Each lesson builds on the last. New concepts are introduced gradually alongside familiar ones. The user always feels slightly stretched but never overwhelmed.
- **Mission chaining:** After completing a lesson, the next one is immediately available. The "one more lesson" pull is the primary retention mechanic.
- **Key UX lesson for transcendence:** The exercise-feedback-reward loop is proven. Adopt the mechanic, but strip out the anxiety (streak-loss guilt, hearts system, aggressive notifications) and replace with calm momentum.

**Notion (Tertiary Influence — Aesthetic Foundation)**

- **What it solves elegantly:** Makes complex information management feel clean, professional, and not overwhelming. The interface scales from simple to sophisticated based on user need.
- **Visual design:** Monochrome-dominant with selective color. Clean typography. Generous spacing. The aesthetic says "this is a serious tool for serious people" without being cold.
- **Information hierarchy:** Progressive disclosure at every level. A page can be a single sentence or a deep database — the UI accommodates both without clutter.
- **Premium feel:** Notion looks and feels like a premium product at its free tier. This perception of quality builds trust and justifies engagement.
- **Key UX lesson for transcendence:** The anti-crypto-bro aesthetic should land here — clean, typographically strong, professional. Notion proves that "calm and minimal" can feel premium, not cheap.

**Banking Apps — Revolut/N26 (Domain Influence — Financial UX Patterns)**

- **What they solve elegantly:** Present financial data — balances, transactions, spending — in a way that feels safe, clear, and in-control. Direct parallel to the wallet-profile.
- **Balance display:** Large, centered, confident. The number is the hero. No clutter around it.
- **Transaction history:** Chronological list with clear labels, amounts, and categories. Each entry is scannable in under a second.
- **Trust signals:** Clean layouts, clear numbers, no ambiguity. The user always knows exactly where their money is and what happened.
- **Key UX lesson for transcendence:** The wallet-profile should borrow directly from banking app patterns. Users already trust this visual language for financial data. Knowledge Token balance, gas transaction history, and learning portfolio should feel like checking a bank account — familiar, clear, trustworthy.

**Khan Academy (Supporting Influence — Educational UX Patterns)**

- **What it solves elegantly:** Self-paced learning with mastery tracking and zero competitive pressure. Serves both the motivated daily learner and the casual weekly visitor.
- **Progression:** Mastery-based, not speed-based. The curriculum map shows what's learned, what's in progress, and what's ahead. No time pressure.
- **Tone:** Encouraging, patient, never condescending. Errors are treated as part of learning, not failures.
- **Curriculum visualization:** Clear skill trees showing dependencies and progress. The user always knows where they stand.
- **Key UX lesson for transcendence:** The curriculum map should borrow Khan Academy's clarity — visual, dependency-aware, progress-highlighted. Marc's self-paced behavior is best served by this model. No pressure, just clarity.

### Transferable UX Patterns

**Navigation Patterns:**

- **Headspace "next session" home screen.** The app surfaces what to do next, not a menu of everything possible. On mobile, opening the app = seeing your next mission, one tap to start. Reduces decision fatigue to zero.
- **Duolingo bottom navigation bar.** Mobile-primary apps need persistent bottom nav with 3-5 core destinations (Home/Next Mission, Curriculum Map, Wallet-Profile, Settings). Thumb-zone optimized, always accessible.
- **Khan Academy curriculum map.** Dedicated full-page view showing the entire learning path with clear progress indicators. Modules as nodes, missions as steps within nodes. Dependencies visible.

**Interaction Patterns:**

- **Duolingo exercise-feedback micro-loop.** Action → immediate feedback → brief pause → next action. The 200ms feedback target supports this. Adopt the tight loop, strip the anxiety.
- **Duolingo mission chaining.** Mission complete → "Continue" button → next mission starts. No mandatory return to menu. The user stays in flow until they choose to stop.
- **Headspace guided progression.** Each session ends with a gentle "what's next" suggestion, not a demand. The app recommends but doesn't push. Apply to post-mission flow.

**Visual Patterns:**

- **Notion's typographic hierarchy.** Clean type scale, generous whitespace, monochrome-dominant with selective accent color. Professional without being cold. Apply to all non-exercise screens (curriculum map, wallet-profile, settings).
- **Headspace's soft visual language.** Rounded corners, warm color palette, soft shadows. Apply to exercise screens and feedback states to maintain the calm register during learning.
- **Revolut's balance and transaction display.** Large centered balance, chronological transaction list, clear categories. Apply directly to wallet-profile for Knowledge Token balance and gas transaction history.

**Engagement Patterns:**

- **Duolingo's streak with Headspace's gentleness.** Track daily streaks but present them as positive momentum ("Day 5!") rather than loss anxiety ("Don't lose your streak!"). On return after break, show cumulative progress first, streak second.
- **Khan Academy's mastery indicators.** Progress shown as mastery levels (not percentages) — gives the user a sense of depth, not just completion.

### Anti-Patterns to Avoid

**From Duolingo — avoid:**

- **Hearts/lives system.** Punishing mistakes with limited attempts creates anxiety. Transcendence uses gas fees instead — a teaching mechanic, not a punishment.
- **Aggressive streak-loss notifications.** "Your streak is about to end!" induces guilt, not motivation. Transcendence notifications should invite, never guilt.
- **Competitive leaderboard pressure.** Duolingo's leagues create anxiety for casual users. Transcendence leaderboards should be opt-in or gentle ("active learners this week"), not ranked competitions.
- **Mascot interruptions.** Duo the owl's persistent nudging breaks flow. Transcendence should have minimal personality intrusions during exercises.

**From crypto platforms — avoid:**

- **Neon/dark theme aesthetics.** Binance, Coinbase Pro, and most crypto platforms use dark themes with neon accents. This signals "trading platform" and "risk." Transcendence must signal "learning environment" and "safety."
- **Information overload dashboards.** Crypto exchanges show price charts, order books, and market data simultaneously. Transcendence shows only what the user needs at their current curriculum stage.
- **Jargon-first interfaces.** Most crypto platforms assume knowledge. Transcendence assumes none.
- **Aggressive engagement tactics.** Push notifications for price movements, FOMO-driven messaging, urgency timers. All violate the calm-trust emotional contract.

**From general apps — avoid:**

- **Feature-dump onboarding.** Showing all features on first use. Transcendence reveals features progressively as the curriculum unlocks them.
- **Modal interruptions.** Rating prompts, notification permission requests, or feature announcements that interrupt exercise flow.
- **Tiny touch targets.** Mobile-primary means minimum 44x44px touch targets, especially for exercise interactions during bumpy bus rides.

### Design Inspiration Strategy

**Adopt directly:**

- Headspace's trust-building onboarding approach (calm, guided, immediate value)
- Duolingo's exercise-feedback-reward micro-loop timing and rhythm
- Duolingo's bottom navigation bar for mobile-primary SPA
- Revolut's balance and transaction history patterns for wallet-profile
- Khan Academy's curriculum map structure with dependency visualization
- Notion's typographic hierarchy and premium-at-free visual quality

**Adapt for transcendence:**

- Duolingo's streak mechanic → keep the daily reward, remove the guilt. Streaks are celebrated but never punished.
- Duolingo's mission chaining → add a gentle "take a break?" suggestion after 3+ consecutive missions, but never block continuation
- Headspace's session-end flow → adapt for post-mission: show progress, suggest next, but include curriculum map access for users who want to browse
- Banking app balance display → adapt for Knowledge Tokens with gas fee transaction log, but add educational context ("This is what a real wallet looks like")

**Avoid entirely:**

- Dark/neon crypto aesthetic — conflicts with trust-building emotional goals
- Competitive leaderboard pressure — conflicts with "streaks are gentle" principle
- Hearts/lives punishment systems — replaced by gas-fee teaching mechanic
- Feature-dump onboarding — replaced by progressive mechanic reveal tied to curriculum
- Aggressive re-engagement notifications — replaced by welcoming, progress-first messaging

## Design System Foundation

### Design System Choice

**Tailwind CSS + Custom Component Library**

A utility-first CSS framework (Tailwind CSS) providing the low-level design token infrastructure, with a fully custom component library of 10+ reusable components built on top. This satisfies the 42 subject's "custom-made design system" module requirement while giving the team development speed through Tailwind's utility classes.

The design system is not a CSS framework choice — it's the visual language of transcendence. Every component, color, spacing decision, and interaction pattern must serve the Headspace-soul, Notion-clean, anti-crypto-bro identity established in earlier steps.

### Rationale for Selection

1. **Satisfies 42 Module 5 requirement.** The custom component library (10+ reusable components, defined color palette, typography scale) is fully owned by the team. Tailwind is the toolkit underneath, not the design system itself.

2. **Mobile-first by design.** Tailwind's responsive prefix system (`sm:`, `md:`, `lg:`) maps directly to the mobile-primary viewport strategy. Components are authored mobile-first and enhanced for larger screens.

3. **Visual identity control.** Tailwind imposes zero visual opinions — no default buttons, no pre-styled cards. The anti-crypto-bro aesthetic (calm, warm, professional) is achieved through custom design tokens configured in `tailwind.config`, not by fighting a framework's defaults.

4. **Development speed for a 4-5 person team.** Utility classes eliminate the need to write custom CSS for layout, spacing, and responsive behavior. The team spends time on component logic and interaction design, not on CSS architecture.

5. **Consistency at scale.** Design tokens (colors, spacing, typography, border radius, shadows) are defined once in Tailwind config and enforced everywhere. No "slightly different blue" across screens. No inconsistent padding.

6. **Exercise type flexibility.** Four distinct exercise types need different layouts but consistent visual treatment. Tailwind's utility approach makes it easy to build varied layouts (drag-and-drop grids, matching columns, step-by-step flows, scenario cards) while maintaining the same color, spacing, and typography tokens.

### Implementation Approach

**Design Token Layer (tailwind.config):**

Define the complete visual language as Tailwind design tokens:

- **Color palette:** Primary, secondary, accent, neutral, success, warning, error — all tuned for the calm, warm, professional aesthetic. WCAG AA contrast ratios enforced.
- **Typography scale:** Font family, size scale (minimum 16px body), line heights (1.5 body), heading hierarchy with minimum 4px size difference between levels.
- **Spacing scale:** Consistent spacing tokens for padding, margin, and gap — generous whitespace as a design principle.
- **Border radius:** Rounded corners (Headspace-influenced) — consistent radius tokens across all components.
- **Shadows:** Soft, subtle shadows for elevation — no harsh drop shadows.
- **Breakpoints:** Mobile-first — `default` (320px+), `sm` (640px+), `md` (768px+), `lg` (1024px+).

**Component Library Layer (10+ reusable components):**

Custom components built with Tailwind utilities, encapsulating the design language:

| # | Component | Purpose | Used In |
|---|-----------|---------|---------|
| 1 | **Button** | Primary, secondary, ghost variants. Touch-optimized (min 44x44px) | Everywhere |
| 2 | **Card** | Mission card, module card, achievement card | Curriculum map, home, wallet |
| 3 | **ExerciseContainer** | Unified wrapper for all 4 exercise types — consistent header, feedback area, gas display | All missions |
| 4 | **ProgressBar** | Linear and circular variants. Module progress, mission progress, curriculum progress | Curriculum map, mission flow, home |
| 5 | **TokenDisplay** | Knowledge Token balance, XP counter, gas cost indicator | Wallet-profile, exercise feedback, home |
| 6 | **Tooltip** | Jargon tooltip with plain-language definition + analogy. Tap-triggered on mobile, hover on desktop | All content screens |
| 7 | **BottomNav** | Mobile-primary persistent navigation (Home, Curriculum, Wallet, Settings) | App shell |
| 8 | **FeedbackBanner** | Correct/incorrect exercise feedback with gas cost. Calm, neutral tone — not celebratory or punitive | All exercises |
| 9 | **MissionComplete** | End-of-mission summary: XP earned, tokens earned, gas spent, next mission prompt | Post-mission flow |
| 10 | **StreakIndicator** | Daily streak display — gentle, progress-first, never punitive | Home, wallet-profile |
| 11 | **CurriculumNode** | Module node in curriculum map — shows progress state (locked, available, in-progress, completed) | Curriculum map |
| 12 | **TransactionList** | Chronological list of token transactions (earned, spent as gas) — Revolut-inspired | Wallet-profile |

### Customization Strategy

**Theme Architecture:**

The design system is structured in three layers:

1. **Tokens (tailwind.config)** — Colors, typography, spacing, shadows, radii. Single source of truth. Changing a token updates every component that uses it. This layer defines what transcendence looks like.

2. **Components (React component library)** — Reusable UI building blocks that consume tokens via Tailwind utilities. Each component handles its own responsive behavior, interaction states, and accessibility. This layer defines how transcendence behaves.

3. **Compositions (page layouts)** — Screen-level arrangements of components. Home screen, curriculum map, exercise view, wallet-profile. Each composition is mobile-first and adapts to larger viewports. This layer defines how transcendence is organized.

**Customization Boundaries:**

- **Do customize:** Colors, typography, spacing, component variants, animation timing, responsive breakpoint behavior.
- **Don't customize:** Tailwind's utility class API, CSS reset, responsive prefix system. Use the framework as intended.
- **Exercise-specific styling:** Each exercise type (placement, matching, simulation, scenario) may need unique layout patterns, but all share the same ExerciseContainer wrapper, FeedbackBanner, and TokenDisplay components for visual consistency.

**Accessibility Built In:**

- All components meet WCAG AA color contrast (4.5:1 normal text, 3:1 large text)
- Touch targets minimum 44x44px on all interactive elements
- Keyboard navigation support on all components
- Focus indicators visible and consistent
- Semantic HTML structure within all components
- Screen reader-compatible labels and ARIA attributes

## Defining Experience

### The Core Interaction

**"It's the first app that teaches blockchain to normal people. No jargon, no pressure, just bite-sized lessons that actually make sense."**

This is what users say to friends. This is the defining experience. Not the tokens, not the gas fees, not the wallet-profile — those are mechanics that serve this promise. The defining experience is: **a complete beginner opens the app, spends 3 minutes, and closes it understanding something they didn't before.** Every time. Without effort. Without anxiety.

The core interaction users would describe: "You open it, do a quick exercise about some blockchain concept, and by the end you actually get it. Then you do another one tomorrow."

### User Mental Model

**What users bring to transcendence:**

Users arrive with a mental model shaped by two experiences:

1. **Duolingo / language learning apps.** They expect: open app → do a quick lesson → feel progress → close. They expect it to be gentle, mobile-friendly, and completable in minutes. They expect streaks and rewards. They do NOT expect to feel stupid.

2. **Failed crypto learning attempts.** They bring baggage: YouTube videos that lost them at "consensus mechanism," exchange tutorials that assumed knowledge, Reddit threads full of jargon. They expect blockchain education to be confusing, intimidating, and alienating. This is the expectation transcendence must break in the first 30 seconds.

**The mental model gap:** Users expect "learning blockchain" to be hard. Transcendence must make it feel as easy as a Duolingo lesson. The gap between expectation and reality IS the delight.

**How users currently solve the problem:**

- YouTube videos — passive, overwhelming, inconsistent quality, jargon-heavy
- Exchange tutorials (Binance Academy, Coinbase Learn) — shallow, trading-focused, not structured
- Asking friends/family — embarrassing, unreliable, incomplete
- Avoiding it entirely — the most common "solution"

**What they hate about existing approaches:** feeling stupid, drowning in jargon, not knowing where to start, not knowing if they're making progress, crypto-bro culture.

**What they want:** to feel like a capable adult learning something new at their own pace, without anyone making them feel dumb.

### Success Criteria

The defining experience succeeds when:

1. **3-minute comprehension.** The user completes a 2-5 minute mission and can explain the concept they just learned in their own words. Not memorize — understand.

2. **Zero confusion about what to do.** At every point in the app, the user knows exactly what to do next. No searching, no decision paralysis, no "where do I go?" moments.

3. **No jargon shock.** The user never encounters a technical term without an immediate, accessible explanation. Every piece of jargon has a tooltip. Every concept has a real-world analogy.

4. **Instant feedback.** Every exercise action gets visual feedback in <200ms. The user always knows whether they're on the right track. Feedback is calm and informative, never punitive.

5. **Session completeness.** Every mission is a complete unit. The user never has to stop mid-thought. Open, learn, close — each session is satisfying on its own.

6. **"I actually get this" feeling.** The ultimate success metric. After the first mission, the user should feel a spark of "oh, that's what that means." After a week, they should feel genuinely more knowledgeable. After completion, they should feel confident explaining blockchain to someone else.

### Novel vs. Established Patterns

**The defining experience uses established patterns with one novel twist:**

**Established (adopt directly):**

- Bite-sized lesson format (Duolingo) — proven for mobile learning, short attention spans, habit formation
- Exercise-feedback loop (every learning app) — action → response → reward is universal
- Progressive curriculum (Khan Academy) — sequential unlocking, dependency-based progression
- Streak + daily reward (Duolingo, Headspace) — habit mechanics that drive return visits
- Bottom navigation (every mobile app) — thumb-friendly persistent nav

**Novel (transcendence's unique contribution):**

- **Progressive mechanic reveal tied to curriculum.** The platform's gamification mechanics (tokens, gas fees, wallet-profile) don't exist from day one — they appear when the curriculum teaches the concept they represent. This isn't a UX pattern users have seen before. It requires no user education because it IS the education — the reveal moment is the lesson landing.
- This is not the defining experience itself, but it's the design innovation that elevates the defining experience from "another learning app" to something users remember and talk about.

**Teaching the novel pattern:** No teaching needed. The reveals are designed as aha moments, not new features to learn. When tokens appear, the user just learned what tokens are. When gas activates, the user just learned what gas is. The curriculum does the teaching; the UI reveal is the payoff.

### Experience Mechanics

**The core loop — step by step:**

**1. Initiation (open → start):**

- User opens app → home screen shows next mission with title, topic, and estimated time (2-5 min)
- One tap to start. No menu to navigate, no choice to make
- If returning after absence: progress summary shown first, then resume point
- If in token debt: gentle message explaining they need to complete a mission to earn tokens before starting a new one (debt can only occur after gas fees are activated in curriculum)

**2. Interaction (the exercise flow):**

- Mission begins immediately with context — a brief (1-2 sentence) setup framing the concept
- Exercise appears: the user drags, matches, taps, or selects based on exercise type
- Each exercise is self-contained within the mission — the user understands the task without external instructions
- Touch-first design: all interactions work one-handed on mobile. Drag targets are large. Tap zones are generous (44x44px minimum)
- Mid-exercise, jargon tooltips are available on any technical term — one tap, instant definition, no context switch

**3. Feedback (response → understanding):**

- Every submission triggers immediate visual feedback (<200ms)
- Correct: calm confirmation — subtle color change, brief animation, gas cost shown (after gas mechanic is activated)
- Incorrect: neutral feedback — gas cost shown (same as correct — it's a transaction, not a punishment), brief explanation of why the answer was wrong, option to try again
- After gas activation: a small gas indicator shows the cost of each submission. This is informational, not stressful — it mirrors a real blockchain transaction log
- Brief explanation (1-2 sentences) accompanies each answer, reinforcing understanding. Experience first, explanation second — but the explanation is there

**4. Completion (mission end → satisfaction):**

- Mission complete screen: concept summary ("You just learned: what a blockchain hash is and why it matters"), XP increment, tokens earned (after token mechanic is activated), gas spent summary (after gas mechanic is activated)
- "Continue" button leads to next mission — one tap to chain
- "Curriculum Map" option for users who want to browse or take a break
- No forced upsell, no rating prompt, no modal interruption
- The feeling: "I know something I didn't know 3 minutes ago"

## Visual Design Foundation

### Color System

**Philosophy:** Warm neutrals for safety and approachability, cool accent for trust and action. The palette must feel like the opposite of a crypto exchange — no neon, no dark backgrounds, no high-saturation gradients.

**Primary Palette:**

| Token | Role | Value | Usage |
|-------|------|-------|-------|
| `primary` | Main action color | Cool teal/blue-green | Buttons, links, active states, progress indicators |
| `primary-light` | Soft primary | Lighter tint of primary | Hover states, selected backgrounds, subtle highlights |
| `primary-dark` | Emphasis primary | Darker shade of primary | Pressed states, focus rings |
| `secondary` | Supporting accent | Warm amber/gold | Token displays, rewards, streak indicators, achievement highlights |
| `secondary-light` | Soft secondary | Lighter tint of secondary | Token background, reward celebrations |

**Neutral Palette (warm-tinted):**

| Token | Role | Value | Usage |
|-------|------|-------|-------|
| `neutral-50` | Page background | Warm off-white | App background, card backgrounds |
| `neutral-100` | Subtle background | Slightly darker warm white | Section dividers, input backgrounds |
| `neutral-200` | Borders | Warm light gray | Card borders, separators, inactive states |
| `neutral-300` | Disabled | Warm medium-light gray | Disabled text, placeholder text |
| `neutral-500` | Secondary text | Warm medium gray | Captions, labels, secondary information |
| `neutral-700` | Primary text | Warm dark gray | Body text, descriptions |
| `neutral-900` | Heading text | Near-black warm | Headings, emphasis text, primary labels |

**Semantic Colors:**

| Token | Role | Value | Usage |
|-------|------|-------|-------|
| `success` | Correct/positive | Soft green | Correct exercise feedback, completion states |
| `error` | Incorrect/warning | Soft coral/red | Incorrect exercise feedback (not alarming — soft, not bright red) |
| `warning` | Attention | Soft amber | Token debt indicator, low-gas warning |
| `info` | Informational | Soft blue | Tooltips, jargon definitions, help text |

**Color Principles:**

1. **No pure black or pure white.** All neutrals are warm-tinted. Pure black feels harsh; pure white feels clinical. Warm tints maintain the Headspace-like safety.
2. **Low saturation by default.** The overall palette is muted and calm. High saturation is reserved for small, meaningful moments — a token earned, a mission completed.
3. **Cool for action, warm for reward.** The primary (cool teal) guides the user's eye to what to do. The secondary (warm amber/gold) rewards and celebrates. This creates a natural visual hierarchy: action is calm, reward is warm.
4. **Error is soft, not alarming.** Incorrect exercise feedback uses soft coral, not bright red. Wrong answers are transactions, not failures. The color reinforces the emotional design principle.
5. **WCAG AA enforced.** All text-on-background combinations meet 4.5:1 contrast for normal text, 3:1 for large text. Verified across all neutral-on-neutral and color-on-neutral pairings.

**Dark Mode (Post-MVP):**

- Invert the neutral scale (dark warm backgrounds, light warm text)
- Primary and secondary colors adjusted for dark background contrast
- Same semantic meanings preserved
- Not in MVP scope — light mode only at launch

### Typography System

**Philosophy:** Geometric authority for structure, humanist warmth for reading. The typography should feel like a well-designed textbook written by someone who actually cares about the reader.

**Font Pairing:**

| Role | Font Family | Style | Rationale |
|------|------------|-------|-----------|
| **Headings** | Plus Jakarta Sans (or Inter) | Geometric sans-serif | Clean, modern, authoritative. Notion-like professionalism. Signals "this is a serious learning tool." |
| **Body** | Source Sans 3 (or Nunito) | Humanist sans-serif | Warm, readable, approachable. The voice of a patient teacher. Optimized for extended reading on screen. |
| **Mono** | JetBrains Mono (or Fira Code) | Monospace | For any code snippets, hash displays, or blockchain data shown in exercises. Technical without being intimidating. |

**Type Scale:**

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-xs` | 12px | 1.5 | Regular | Fine print, timestamps, metadata |
| `text-sm` | 14px | 1.5 | Regular | Captions, labels, secondary text |
| `text-base` | 16px | 1.5 | Regular | Body text — minimum for readability |
| `text-lg` | 18px | 1.5 | Medium | Emphasized body, exercise instructions |
| `text-xl` | 20px | 1.4 | Semibold | H4 — subsection headings |
| `text-2xl` | 24px | 1.3 | Semibold | H3 — section headings, mission titles |
| `text-3xl` | 30px | 1.2 | Bold | H2 — page headings, module titles |
| `text-4xl` | 36px | 1.2 | Bold | H1 — screen titles (mobile: may scale to 30px) |
| `text-display` | 48px | 1.1 | Bold | Token balance display, large numbers |

**Typography Principles:**

1. **16px minimum body text.** No exceptions. Readability on mobile is non-negotiable.
2. **Minimum 4px size difference between heading levels.** Clear visual hierarchy at every level.
3. **1.5 line height for body.** Generous leading for comfortable reading — especially for users who may be reading carefully to understand new concepts.
4. **Geometric for structure, humanist for content.** Headings (Plus Jakarta Sans) create clear hierarchy and authority. Body text (Source Sans 3) invites reading and feels warm. The pairing communicates "professional teacher."
5. **Weight for emphasis, not size.** Within body text, use semibold/bold for emphasis rather than increasing size. Keeps the vertical rhythm clean.
6. **Display size for numbers.** Token balance, XP count, and other key metrics use `text-display` (48px) — Revolut-inspired large number displays that make data feel confident and clear.

### Spacing & Layout Foundation

**Philosophy:** Generous whitespace is a design principle, not wasted space. The spacing system creates breathing room that reinforces the calm, no-pressure emotional register. Dense layouts feel like crypto exchanges. Airy layouts feel like Headspace.

**Spacing Scale (8px base unit):**

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight spacing — icon padding, inline gaps |
| `space-2` | 8px | Base unit — minimum gap between related elements |
| `space-3` | 12px | Small spacing — between list items, form labels to inputs |
| `space-4` | 16px | Medium spacing — between content blocks, card padding (mobile) |
| `space-6` | 24px | Large spacing — between sections, card padding (desktop) |
| `space-8` | 32px | XL spacing — between major sections, screen top/bottom padding |
| `space-12` | 48px | 2XL spacing — between page-level sections |
| `space-16` | 64px | 3XL spacing — hero spacing, major visual breaks |

**Layout Grid:**

- **Mobile (320-767px):** Single column, 16px horizontal padding, 8px gutter. Content fills the width. No sidebar, no multi-column layouts.
- **Tablet (768-1023px):** Flexible 2-column where appropriate (curriculum map nodes). 24px horizontal padding, 16px gutter.
- **Desktop (1024px+):** Max content width of 1024px centered. 32px horizontal padding, 24px gutter. Curriculum map and wallet-profile can use wider layouts.

**Layout Principles:**

1. **Single column on mobile.** No side-by-side layouts that require horizontal scanning on small screens. Everything stacks vertically. Exercise interactions use the full width.
2. **Content max-width on desktop.** Even on large screens, content never stretches beyond 1024px. Generous side margins keep reading comfortable and prevent the "spreadsheet" feel.
3. **Consistent card pattern.** Cards are the primary content container — mission cards, module cards, exercise containers, wallet transactions. All cards use the same padding, border-radius, and shadow tokens for visual consistency.
4. **Bottom navigation persistent.** On mobile, the bottom nav is always visible (except during exercise flow where it may minimize). This is the user's anchor — Home, Curriculum, Wallet, Settings are always 1 tap away.
5. **Generous touch zones.** All interactive elements have minimum 44x44px touch targets. On mobile, buttons are full-width where possible. Spacing between tappable elements prevents mis-taps.

**Border Radius:**

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Small elements — tags, badges, tooltips |
| `rounded-md` | 8px | Default — buttons, inputs, small cards |
| `rounded-lg` | 12px | Cards, modals, exercise containers |
| `rounded-xl` | 16px | Large cards, featured content |
| `rounded-full` | 9999px | Circular elements — avatars, progress circles, token icons |

**Shadow System:**

| Token | Usage |
|-------|-------|
| `shadow-sm` | Subtle lift — cards at rest, input fields |
| `shadow-md` | Active lift — cards on hover, floating elements |
| `shadow-lg` | Modal/overlay shadow — tooltips, bottom sheets |

All shadows use warm-tinted black (not pure black) for softness.

### Accessibility Considerations

**Color Accessibility:**

- All text meets WCAG AA contrast ratios (4.5:1 normal, 3:1 large)
- Semantic colors (success, error) never rely on color alone — always paired with icons or text labels
- Exercise feedback uses color + icon + text — the gas cost message reinforces the color signal
- Focus indicators use a visible ring (primary color, 2px) that doesn't rely on color alone

**Typography Accessibility:**

- 16px minimum body text across all viewports
- 1.5 line height for body text
- Heading hierarchy maintained with minimum 4px size difference between levels
- Font weights provide additional hierarchy beyond size
- System font fallbacks defined for all font families

**Touch & Interaction Accessibility:**

- 44x44px minimum touch targets on all interactive elements
- Spacing between adjacent touch targets prevents mis-taps (minimum 8px gap)
- All exercises operable via keyboard (tab, enter, arrow keys, space)
- Drag-and-drop exercises provide keyboard alternative (arrow keys to reorder, enter to place)
- Focus order follows visual reading order (top-to-bottom, left-to-right)

**Motion & Animation:**

- All animations respect `prefers-reduced-motion` media query
- Default animation duration: 150-300ms (fast enough to feel responsive, slow enough to be perceived)
- No auto-playing animations that can't be paused
- Exercise feedback animations are subtle — opacity changes, gentle slides — not bounces or shakes

## Design Direction Decision

### Design Directions Explored

Three design directions were evaluated against transcendence's emotional goals (calm confidence, trust-first, anti-crypto-bro) and platform requirements (mobile-primary SPA):

**Direction 1: "Focused Flow"** — Ultra-minimal, Headspace-dominant. Next mission only on home, bottom nav hidden during exercises. Maximum calm but potentially too stripped for curriculum visibility.

**Direction 2: "Guided Path"** — Balanced Duolingo-meets-Headspace. Next mission + curriculum progress + streak on home, persistent progress bar during exercises, vertical path curriculum map. Balance of information and calm.

**Direction 3: "Dashboard Lite"** — Notion-dominant. Soft dashboard home with multiple data points, grid-based curriculum map. More information density, risk of feeling too data-heavy for intimidated beginners.

### Chosen Direction

**Direction 2: "Guided Path"** — selected as the design direction for transcendence.

The Guided Path balances the calm emotional register (Headspace influence) with enough information to orient the user (Duolingo influence). The user always knows where they are, what's next, and how they're progressing — without being overwhelmed by data.

### Design Rationale

1. **Home screen serves the "zero-decision start."** Next mission is the hero with one-tap start. Streak and curriculum progress are visible but secondary — the user can glance at progress without it competing with the core action.

2. **Vertical path curriculum map matches the mental model.** A linear, top-to-bottom path with completed/current/locked nodes is immediately understandable. It communicates progressive unlocking visually without explanation. Duolingo proved this pattern works for sequential learning.

3. **Exercise view is focused but not stripped.** Progress bar at top provides orientation within the mission. Gas indicator is subtle but always present (after activation). Bottom nav fades during exercises — present but not distracting. The user stays in flow.

4. **Feedback is calm and educational.** Correct answers get soft green confirmation with a reinforcing explanation. Incorrect answers get soft coral with educational context — never red alerts or failure messaging. Gas cost shown identically for both, reinforcing "mistakes are transactions."

5. **Wallet profile borrows directly from banking apps.** Large centered token balance (Revolut-inspired), XP/streak as secondary stats, chronological transaction list. Users already trust this visual language for financial data.

6. **Color application validated.** Cool teal for actions, warm amber for tokens/rewards, warm neutrals for backgrounds. The palette reads as professional-calm, not crypto-exchange. Soft coral for errors avoids the alarming red of typical error states.

### Implementation Approach

**Reference Implementation:** The HTML mockup at `_bmad-output/planning-artifacts/ux-design-directions.html` serves as the visual reference for all screens. It includes:

- Exact CSS custom properties matching Tailwind design tokens
- All 6 core screens at mobile viewport (375px)
- Component samples for the 12 design system components
- Color palette, typography specimen, and spacing demonstrations
- Feedback states showing both correct and incorrect patterns

**From Mockup to Code:**

- Design tokens from the HTML mockup map directly to `tailwind.config` values
- Component structures translate to React components with Tailwind utility classes
- Screen layouts become page compositions using the component library
- Responsive behavior extends mobile-first designs to tablet and desktop breakpoints

**Key Visual Decisions Locked:**

- Warm off-white page background (`neutral-50`) — not pure white
- Cool teal primary (`#2B9E9E`) for all action elements
- Warm amber/gold secondary (`#D4A843`) for token-related displays
- Soft coral for error states — not bright red
- Rounded corners (`12px` cards, `8px` buttons) — Headspace softness
- Warm-tinted shadows — not pure black
- Bottom navigation with 4 items: Home, Curriculum, Wallet, Settings

## User Journey Flows

### Journey 1: First-Time User (Onboarding → First Mission)

**Entry:** User arrives from search/referral → lands on marketing landing page.

**Goal:** Sign up, complete first mission, feel "I actually get this" — all within 5 minutes of landing.

**Flow diagram:** See `user-journey-flows.md` — Journey 1

**Key Design Decisions:**

- **Landing page is trust-first.** Clean, calm, no crypto noise. The value prop is "learn blockchain without the jargon" — not feature lists. Sign-up buttons are prominent but not aggressive.
- **Micro-onboarding is 1 screen max.** A single "What brings you here?" question (Invest / Understand / Curiosity) personalizes the welcome message tone but doesn't gate anything. Skippable.
- **Home screen surfaces the first mission immediately.** No dashboard, no feature tour. The user sees "What is a Blockchain?" with a big "Start" button. Zero decision fatigue.
- **First mission is XP-only.** No tokens, no gas, no wallet. The user's only cognitive load is the exercise itself. Progressive reveal hasn't started yet.
- **Mission complete screen celebrates understanding, not points.** "You just learned: how blocks link together in a chain" — the concept is the hero, XP is secondary.

**Flow summary:** Landing Page → Sign Up (OAuth or Email) → Welcome Screen → Micro-Onboarding (1 screen, skippable) → Home Screen (next mission surfaced) → Tap Start → Mission Intro Card → Exercise Flow (action → feedback → next) → Mission Complete (XP +1, concept summary) → Continue / Curriculum Map / Close.

### Journey 2: Daily Session (Return → Mission → Chain)

**Entry:** User opens app (has completed 3+ missions previously).

**Goal:** Resume learning with zero friction, complete 1-3 missions, maintain streak.

**Flow diagram:** See `user-journey-flows.md` — Journey 2

**Key Design Decisions:**

- **App open = instant resume.** Home screen shows the next mission based on curriculum progress. No menu navigation, no decisions. The Headspace "next session" pattern.
- **Mission chaining is 1 tap.** "Continue" button on mission complete leads directly to the next mission. The user never returns to a menu unless they choose to. The "one more lesson" pull is the primary retention mechanic.
- **Gentle break after 3+ missions.** Not a blocker — a suggestion. "Nice session! Take a break or keep going?" The app cares about the user, not engagement metrics.
- **Streak increments silently.** The streak counter on home updates after the first mission of the day. No fanfare, no "Don't lose your streak!" — just quiet momentum.
- **Token/gas displays appear only after curriculum activation.** A user who hasn't reached the token curriculum milestone sees only XP on the mission complete screen.

**Flow summary:** Open App → Home Screen (next mission + streak) → Tap Start → Mission Intro → Exercise Flow → Mission Complete (XP, tokens*, gas*) → Continue (1 tap, chains to next) / Curriculum Map / Close. After 3+ chained missions: gentle break suggestion (keep going or done).

### Journey 3: Progressive Mechanic Reveal (XP → Tokens → Gas → Wallet)

**Entry:** User progresses through curriculum milestones that unlock platform mechanics.

**Goal:** Each reveal is an aha moment that teaches a crypto concept through the user's own experience of the platform.

**Flow diagram:** See `user-journey-flows.md` — Journey 3

**Key Design Decisions:**

- **Each reveal is triggered by the corresponding curriculum mission.** The user learns "what are tokens" → the UI reveals tokens. The reveal IS the lesson landing. No teaching needed because the curriculum just taught it.
- **Reveals are warm, not flashy.** A brief moment of delight — warm amber highlight, gentle animation — not confetti or fireworks. The emotional register is "knowing smile," not "slot machine jackpot."
- **Retroactive token count on reveal.** When tokens are introduced, the user sees they've already been accumulating them. This reinforces "you've been earning tokens without knowing" — the aha moment is stronger when there's already a balance.
- **Gas fees apply identically to correct and incorrect.** Every submission costs gas. Wrong answers cost more only because the user resubmits. This mirrors real blockchain: every transaction costs gas regardless of outcome.
- **Wallet-profile is the deepest payoff.** The profile page the user has been visiting transforms into a recognizable wallet interface. The realization is the reward — "my profile page was teaching me what a wallet looks like this whole time."
- **Token debt mechanic.** After gas activation, users can go negative mid-mission (mission never interrupted) but can't start a new mission while in debt. A gentle message: "Complete a mission to earn more tokens before starting a new one."

**Phase summary:** Phase 1 (XP only, early missions) → Phase 2 (Tokens introduced when curriculum teaches tokens — retroactive balance revealed) → Phase 3 (Gas fees activated when curriculum teaches gas — every submission costs tokens) → Phase 4 (Wallet-profile revealed when curriculum teaches wallets — profile transforms into wallet view).

### Journey 4: Drop-off & Return

**Entry:** User returns after days/weeks of inactivity.

**Goal:** Make return feel welcoming, preserve all progress, resume with confidence.

**Flow diagram:** See `user-journey-flows.md` — Journey 4

**Key Design Decisions:**

- **No streak shame.** The streak counter resets but is never the hero of the return screen. Cumulative progress (missions completed, modules mastered, tokens earned) is always more prominent than streak status.
- **Welcome back is tiered by absence length.** Short absence (1-3 days) = normal home screen, no special treatment. Medium absence (4-14 days) = warm welcome-back card. Long absence (14+ days) = full progress summary emphasizing everything that's preserved.
- **Concept refresher is offered, not forced.** "Want a quick refresher before continuing?" leads to a 1-2 minute review exercise. The user decides, never the app.
- **Progress is permanent.** Tokens, XP, completed missions, module progress — nothing disappears. The emotional message: "everything you earned is still here."
- **Re-engagement notification tone.** Push notification (if enabled): "Your learning journey is still here. Pick up where you left off." Never: "You're falling behind!" or "Don't lose your progress!"

**Flow summary:** Open App (after absence) → Tiered by absence length: 1-3 days (normal home), 4-14 days (welcome back card), 14+ days (full progress summary) → Progress Summary (missions, modules, tokens preserved) → Resume Point + optional refresher → Start Mission / Quick Refresher / Curriculum Map → Normal mission flow.

### Journey 5: Curriculum Navigation

**Entry:** User taps "Curriculum" in bottom navigation from any screen.

**Goal:** See the full learning path, understand progress, select any available mission.

**Flow diagram:** See `user-journey-flows.md` — Journey 5

**Key Design Decisions:**

- **Vertical path, not grid.** The curriculum map is a single vertical scrolling path (Duolingo-inspired). Modules are nodes on the path, connected by a visual line. This communicates sequential progression without explanation.
- **Four clear node states.** Completed (green), In Progress (blue/teal), Available (white/open), Locked (gray with lock). The user instantly understands what they can and can't access.
- **Module detail on tap.** Tapping any node opens a detail view listing all missions within the module, their completion state, and estimated time. No separate "module page" — it's an inline expansion or bottom sheet.
- **Locked modules show dependencies.** If a module is locked, the user sees exactly which prerequisite module they need to complete. No mystery, no frustration.
- **Review without reward.** Completed missions can be replayed for review but don't earn additional XP or tokens. This prevents gaming while supporting learning.
- **Current module is always visible on scroll.** When the map loads, it auto-scrolls to the current in-progress module. The user's position in the curriculum is immediately clear.

**Flow summary:** Tap Curriculum → Vertical scrolling path (modules as nodes: completed/in-progress/available/locked) → Tap node → Module Detail (missions listed, progress shown) → Start/Continue mission or Review completed mission → Back to map at any time.

### Journey Patterns

**Navigation Patterns:**
- **Zero-decision start.** Home screen always surfaces the next action. The user never needs to decide where to go — the app knows.
- **1-tap depth.** Any screen is reachable within 2 taps from anywhere via the persistent bottom navigation (Home, Curriculum, Wallet, Settings).
- **Back = safe.** Navigation never loses progress. Leaving a mission mid-flow auto-saves position. Returning picks up exactly where the user stopped.

**Feedback Patterns:**
- **Instant response (<200ms).** Every user action gets immediate visual feedback. No loading states during exercise interactions.
- **Calm confirmation.** Correct answers: soft green highlight + brief reinforcing explanation. No fireworks, no sound effects.
- **Neutral correction.** Incorrect answers: soft coral highlight + educational explanation of why. Gas cost shown identically to correct answers. Mistakes are transactions, not failures.

**Decision Patterns:**
- **Binary choices only.** At any decision point, the user faces at most 2 clear options (Continue / Curriculum Map, Start / Refresher, Keep Going / Done). No multi-option menus during flow.
- **Default is always forward.** The primary button always moves the user toward the next learning moment. Secondary options are visible but not competing.

**Progressive Disclosure Patterns:**
- **Curriculum-triggered reveals.** New UI elements (tokens, gas, wallet) appear only when the corresponding curriculum milestone is reached. Nothing before its time.
- **Gentle introductions.** Each new mechanic gets a 1-screen explanation with warm amber highlighting before becoming a permanent part of the UI.
- **Complexity grows with comprehension.** Early screens are minimal (XP only). Later screens show richer data (token balance, gas history, transaction log). The UI's information density matches the user's knowledge level.

### Flow Optimization Principles

1. **Minimum steps to value.** From app open to learning something: 1 tap (returning user) or 3 taps (new user: sign up → start → exercise). No journey exceeds this.

2. **No dead ends.** Every screen has a clear forward path. Mission complete → Continue. Curriculum map → Start mission. Welcome back → Resume. The user is never stranded.

3. **Graceful interruption handling.** If the user closes the app mid-mission, progress is saved. Returning reopens at the exact point. The app accommodates Sarah's bus-ride interruptions without penalty.

4. **Error states as teaching moments.** Wrong answers teach through the gas mechanic. Token debt teaches budgeting. Locked modules teach prerequisites. Every "block" is reframed as a learning opportunity.

5. **Delight through recognition, not animation.** The emotional high points are aha moments — "oh, I've been earning tokens!" — not UI spectacles. The design creates space for the user's own realization rather than celebrating for them.

## Component Strategy

### Design System Components

**Tailwind CSS provides the token infrastructure** — colors, typography, spacing, shadows, radii, breakpoints — configured in `tailwind.config`. No pre-built UI components from Tailwind; every component below is custom-built using Tailwind utility classes.

**Total component count: 20** (12 original from design system foundation + 8 new from journey analysis).

### Original Components (from Design System Foundation)

#### 1. Button

**Purpose:** Primary interactive element across all screens.
**Variants:**
- **Primary** — Cool teal background, white text. Main actions (Start Mission, Continue, Submit).
- **Secondary** — Teal outline, teal text. Alternative actions (Curriculum Map, Back).
- **Ghost** — No background, teal text. Tertiary actions (Skip, Cancel).
- **Token** — Warm amber background, white text. Token-related actions (reserved for post-reveal).

**States:** Default, Hover (slight darken), Active/Pressed (scale 98%), Disabled (neutral-300, no interaction), Loading (spinner replaces text).
**Sizing:** Minimum 44x44px touch target. Full-width on mobile by default. Auto-width on desktop.
**Accessibility:** `role="button"`, `aria-disabled` when disabled, visible focus ring (2px primary), keyboard-activatable (Enter/Space).

#### 2. Card

**Purpose:** Primary content container for mission cards, module cards, and achievement displays.
**Variants:**
- **MissionCard** — Title, topic, estimated time, progress indicator. Used on home screen and curriculum detail.
- **ModuleCard** — Module title, mission count, progress bar. Used in curriculum map detail views.
- **AchievementCard** — Badge icon, title, description. Used in wallet-profile.

**States:** Default (shadow-sm), Hover/Tap (shadow-md, slight lift), Active (scale 98%), Locked (reduced opacity, lock icon overlay).
**Anatomy:** Rounded-lg (12px), neutral-50 background, space-4 padding (mobile) / space-6 (desktop). Optional header accent stripe using primary or secondary color.
**Accessibility:** Semantic `<article>` or `<section>`, descriptive heading hierarchy, interactive cards use `role="link"` or wrapping `<a>`.

#### 3. ExerciseContainer

**Purpose:** Unified wrapper for all 4 exercise types — provides consistent structure for header, exercise area, feedback area, and gas display.
**Anatomy:**
- **Header:** Mission title + exercise count ("3 of 5") + progress bar.
- **Exercise Area:** Full-width, flexible height. Each exercise type renders its own layout within this area.
- **Feedback Area:** Slides in from bottom on submission. Contains FeedbackBanner.
- **Gas Display:** Subtle gas indicator in header (visible only after gas mechanic activation).

**States:** Active (exercise in progress), Feedback (showing correct/incorrect), Transitioning (moving to next exercise — 200ms crossfade).
**Responsive:** Exercise area fills available viewport height minus header and bottom nav. On mobile, exercises are vertically stacked. On desktop, exercises may use horizontal layouts where appropriate.
**Accessibility:** `role="main"`, exercise instructions announced on load, feedback announced on submission via `aria-live="polite"`.

#### 4. ProgressBar

**Purpose:** Visual progress indicator across multiple contexts.
**Variants:**
- **Linear** — Horizontal bar. Used for mission progress (exercises completed), module progress (missions completed).
- **Circular** — Ring/donut. Used for curriculum completion percentage on home screen.
- **Segmented** — Divided into discrete segments. Used for exercise count within a mission (dots or segments).

**States:** Empty, Partial (animated fill), Complete (primary color fill + subtle pulse).
**Sizing:** Linear: full-width, 6px height (mobile), 8px (desktop). Circular: 48px diameter (compact), 80px (featured). Segmented: adapts to exercise count.
**Accessibility:** `role="progressbar"`, `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax`, `aria-label` describing context.

#### 5. TokenDisplay

**Purpose:** Show Knowledge Token balance, XP counter, or gas cost amounts.
**Variants:**
- **Balance** — Large centered number (text-display 48px) for wallet-profile hero display. Revolut-inspired.
- **Compact** — Inline display with icon + number. Used in home screen, mission complete, exercise header.
- **Cost** — Small inline display with minus sign. Used in gas cost indicators.
- **Earned** — Small inline display with plus sign and warm amber. Used in mission complete rewards.

**States:** Default, Animating (number count-up on change — 300ms), Debt (warning color when balance negative).
**Accessibility:** `aria-label` describes the full context ("Knowledge Token balance: 42 tokens"), number changes announced via `aria-live="polite"`.

#### 6. Tooltip

**Purpose:** Jargon tooltip with plain-language definition + real-world analogy. The core "no jargon shock" mechanism.
**Anatomy:** Trigger text (underlined/dotted underline) → Tooltip popup with: term, plain-language definition, real-world analogy. Optional "Learn more" link to relevant curriculum mission.
**Trigger:** Tap on mobile, hover on desktop. Tap-outside or scroll to dismiss on mobile.
**Positioning:** Auto-positioned above or below trigger, centered. Stays within viewport bounds. On mobile, may render as a bottom sheet for longer definitions.
**States:** Hidden, Visible, Transitioning (150ms fade-in).
**Accessibility:** `aria-describedby` linking trigger to tooltip content, `role="tooltip"`, dismissible via Escape key, focus-trappable when open on mobile (bottom sheet variant).

#### 7. BottomNav

**Purpose:** Mobile-primary persistent navigation. 4 items: Home, Curriculum, Wallet, Settings.
**Anatomy:** Fixed to bottom of viewport. 4 equally-spaced items, each with icon + label. Active item highlighted with primary color. Inactive items in neutral-500.
**States:** Default, Active (primary color icon + label + top indicator bar), Hidden (fades out during exercise flow, reappears on mission complete).
**Responsive:** Visible on mobile and tablet. On desktop (1024px+), transforms to a sidebar or top navigation (to be determined in responsive patterns step).
**Accessibility:** `<nav>` element with `aria-label="Main navigation"`, each item is a link with `aria-current="page"` for active, minimum 44x44px touch targets.

#### 8. FeedbackBanner

**Purpose:** Exercise submission feedback — correct or incorrect. Calm, neutral tone.
**Variants:**
- **Correct** — Soft green background (success-light), checkmark icon, brief reinforcing explanation, gas cost (after activation).
- **Incorrect** — Soft coral background (error-light), X icon, educational explanation of why, gas cost (after activation), "Try again" prompt.

**Anatomy:** Slides up from bottom of ExerciseContainer. Icon + status text + explanation (1-2 sentences) + gas cost display (if active).
**Timing:** Appears on submission (<200ms), stays visible for 2 seconds minimum or until user taps next/retry.
**Accessibility:** `role="status"`, `aria-live="polite"`, content announced immediately on appearance. Gas cost included in announcement.

#### 9. MissionComplete

**Purpose:** End-of-mission summary screen. Celebrates understanding, not just completion.
**Anatomy:**
- **Concept summary** (hero) — "You just learned: [concept]" in text-2xl.
- **Stats row** — XP earned, tokens earned (after reveal), gas spent (after reveal). Uses TokenDisplay compact variant.
- **Actions** — Primary: "Continue" (next mission). Secondary: "Curriculum Map."
- **Streak update** — If first mission of the day, streak increments with subtle animation.

**States:** Default (fresh completion), Chained (after 3+ missions, includes BreakSuggestion).
**Accessibility:** Focus moves to concept summary on load, screen reader announces full summary including stats.

#### 10. StreakIndicator

**Purpose:** Daily streak display — gentle, progress-first, never punitive.
**Variants:**
- **Compact** — Flame icon + day count. Used on home screen.
- **Expanded** — Flame icon + day count + weekly calendar dots showing active days. Used in wallet-profile.

**States:** Active (primary color flame), Incrementing (flame animation + count-up on first mission of day), Inactive (neutral-300, no special attention drawn to streak loss).
**Accessibility:** `aria-label="Current streak: X days"`. Never uses negative language in labels.

#### 11. CurriculumNode

**Purpose:** Module node in the vertical curriculum map path.
**Variants/States:**
- **Completed** — Green fill, checkmark, fully opaque. Tappable for review.
- **In Progress** — Primary teal fill with pulse animation, progress indicator. Tappable to continue.
- **Available** — White/open, subtle border. Tappable to start.
- **Locked** — Gray fill, lock icon, reduced opacity. Tappable to show prerequisite.

**Anatomy:** Circular node (48px mobile, 56px desktop) on the vertical path line. Module title to the right (or alternating left/right). Mission count and progress bar below title.
**Accessibility:** `role="listitem"` within curriculum `role="list"`, `aria-label` includes module name and state ("Module 3: Smart Contracts — In Progress, 4 of 7 missions complete").

#### 12. TransactionList

**Purpose:** Chronological list of token transactions — Revolut-inspired. Used in wallet-profile.
**Anatomy:** Each row: icon (earned/spent) + description ("Completed: What is a Hash?") + amount (+5 / -2) + timestamp. Grouped by date.
**States:** Default, Empty ("No transactions yet — complete a mission to see your first!"), Loading (skeleton rows).
**Accessibility:** `<table>` or `<dl>` with semantic structure, each transaction row has complete context in screen reader announcement.

### New Components (from Journey Analysis)

#### 13. AuthForm

**Purpose:** Sign-up and login interface. First touchpoint for new users — must feel safe, simple, and fast.
**Variants:**
- **SignUp** — OAuth buttons (Google primary, email/password secondary). "Get started in seconds" messaging.
- **Login** — Email/password fields + OAuth buttons. "Welcome back" messaging.

**Anatomy:**
- OAuth buttons: Full-width, branded icons, large touch targets. Google OAuth as primary (most users).
- Divider: "or" separator.
- Email/password: Standard form fields with inline validation.
- Submit button: Primary Button variant.
- Toggle: "Already have an account? Log in" / "New here? Sign up" link.

**States:** Default, Validating (inline field validation), Submitting (button loading state), Error (field-level error messages — soft coral, never alarming).
**Accessibility:** `<form>` with `aria-label`, field labels linked via `for`/`id`, error messages linked via `aria-describedby`, autofocus on first field, keyboard-navigable.

#### 14. MicroOnboarding

**Purpose:** Single-screen personalization after sign-up. "What brings you here?" Skippable, never blocks.
**Anatomy:**
- Heading: "What brings you here?" in text-2xl.
- 3 option cards: "I want to invest" / "I want to understand" / "Just curious" — each with icon and 1-line description.
- Skip link: "Skip for now" in ghost text.

**Interaction:** Tap an option → brief visual confirmation → auto-advance to home screen (300ms delay). Skip → immediate advance.
**States:** Default (3 options), Selected (tapped option highlights with primary color, others fade), Skipped.
**Accessibility:** Options are `role="radio"` within `role="radiogroup"`, skip link is keyboard-accessible, selection announced.

#### 15. WelcomeBack

**Purpose:** Tiered return screen after user absence. Celebrates preserved progress, never shames.
**Variants:**
- **Medium (4-14 days)** — Welcome-back card overlaying home screen. Progress summary + resume button.
- **Extended (14+ days)** — Full-screen welcome with detailed progress summary, concept refresher offer, and resume path.

**Anatomy:**
- Greeting: "Welcome back!" in text-2xl.
- Progress summary: Missions completed, modules mastered, tokens earned — using TokenDisplay compact variants.
- Resume point: "Pick up from: [mission name]" with primary Button.
- Refresher offer (extended variant): "Want a quick refresher?" secondary Button.
- Curriculum Map link: Ghost button for users who want to browse.

**States:** Default, Dismissing (fade-out on action selection, 200ms).
**Accessibility:** Focus moves to greeting on load, progress stats announced, all actions keyboard-accessible.

#### 16. MechanicReveal

**Purpose:** Full-screen takeover for aha moments when platform mechanics are revealed (tokens, gas fees, wallet-profile). The emotional climax of the progressive reveal system.

**Variants:**
- **TokenReveal** — "You've been earning Knowledge Tokens!" Reveals retroactive token count.
- **GasReveal** — "Every action on a blockchain costs gas — even yours." Introduces gas cost mechanic.
- **WalletReveal** — "Your profile has been a wallet all along." Transforms profile understanding.

**Anatomy:**
- **Backdrop:** Full-screen warm amber gradient overlay (secondary color at 10-15% opacity), blurring the content behind.
- **Content card:** Centered, rounded-xl, generous padding (space-8).
  - Icon/illustration: Mechanic-specific (token coin, gas flame, wallet icon) — warm amber accent, 64px.
  - Headline: The aha statement in text-3xl, bold.
  - Explanation: 2-3 sentences connecting the mechanic to the crypto concept just learned. text-lg.
  - Visual proof: TokenReveal shows retroactive balance count-up animation. GasReveal shows a sample gas cost indicator. WalletReveal shows a mini wallet-profile preview.
  - CTA: "Got it" primary Button → dismisses and returns to flow with new mechanic now active in UI.

**Animation:**
- Entrance: Fade-in backdrop (300ms) → card slides up from bottom (300ms, ease-out).
- Visual proof animation: Starts 500ms after card appears (token count-up: 1.5s, gas indicator pulse, wallet preview build).
- Exit: Card slides down (200ms) → backdrop fades (200ms) → mechanic now visible in underlying UI.

**States:** Entering, Active (content visible, awaiting user action), Exiting.
**Accessibility:** Focus trapped within modal, `role="dialog"`, `aria-modal="true"`, `aria-labelledby` pointing to headline, "Got it" button focused by default. Content announced on appearance via `aria-live`. Escape key dismisses.

#### 17. GasIndicator

**Purpose:** Inline gas cost display during exercises. Distinct from TokenDisplay — shows the cost of the current/last action, not the balance.
**Anatomy:** Small inline element: gas flame icon (16px) + cost number ("-1") + "gas" label. Positioned in ExerciseContainer header, next to progress bar.
**States:**
- **Hidden** — Before gas mechanic is activated in curriculum.
- **Idle** — Shows current gas price for next submission.
- **Spent** — Brief animation on submission: number decrements, flame flickers (200ms).
- **Debt Warning** — Amber color when user is approaching zero balance.

**Accessibility:** `aria-label="Gas cost: 1 Knowledge Token per submission"`, cost changes announced via `aria-live="polite"`.

#### 18. MissionIntroCard

**Purpose:** Brief context-setter shown before exercises begin. Frames the concept for the mission.
**Anatomy:**
- Module label: Small, neutral-500 text ("Module 2: Wallets & Keys").
- Mission title: text-2xl ("What is a Private Key?").
- Context: 1-2 sentences framing the concept in plain language (text-base, neutral-700).
- Estimated time: "~3 min" with clock icon.
- Start button: Primary Button, full-width on mobile.

**Animation:** Fades in on mission load (200ms), transitions to first exercise on tap (crossfade 200ms).
**States:** Default (awaiting start), Transitioning (fading to exercise).
**Accessibility:** Focus on mission title on load, content announced. Start button keyboard-accessible.

#### 19. ConceptRefresher

**Purpose:** Quick 1-2 minute review exercise offered on return after extended absence. Reinforces previous module concepts before continuing.
**Anatomy:**
- Header: "Quick refresher" label + module name being reviewed.
- Exercise: A single lightweight exercise (typically concept-matching or interactive placement) covering key concepts from the last completed module.
- Uses ExerciseContainer internally but with a "review" visual indicator (subtle neutral border instead of primary).
- Completion: "All caught up!" message → transitions to normal mission flow. No XP or tokens earned.

**States:** Offered (within WelcomeBack component), Active (review in progress), Complete (transition to next mission).
**Accessibility:** Same as ExerciseContainer. Clearly labeled as review, not new content.

#### 20. BreakSuggestion

**Purpose:** Gentle suggestion to take a break after 3+ consecutive missions. The app cares about the user.
**Anatomy:**
- Appears as an overlay card on the MissionComplete screen after 3rd chained mission.
- Heading: "Nice session!" in text-xl.
- Stats: Session summary — missions completed, time spent, concepts learned.
- Actions: Primary: "Keep going" (continues chaining). Secondary: "Done for now" (returns to home).
- Tone: Warm, congratulatory, never blocking. The "keep going" button is equally prominent — this is a suggestion, not a gate.

**Animation:** Slides up gently from bottom of MissionComplete card (200ms).
**States:** Visible (on 3rd+ chained mission), Dismissed (user selects action).
**Accessibility:** `role="complementary"`, announced on appearance, both actions keyboard-accessible.

### Component Implementation Strategy

**Build Order Principle:** Components are built in the order they're needed by the user journey, starting with the first-time user flow and progressing through daily usage to advanced features.

**Shared Foundation:**

All 20 components consume the same Tailwind design tokens:
- Colors from `tailwind.config` extend palette
- Typography from `tailwind.config` font families and scale
- Spacing from `tailwind.config` spacing scale
- Border radius and shadows from `tailwind.config` theme extend

**Component Architecture:**

- Each component is a standalone React component with its own file
- Props-driven variants (no CSS class manipulation from outside)
- All components accept a `className` prop for layout-level overrides (margin, width) but not internal styling
- States managed via props or internal state — never global state for UI-only concerns
- All components include TypeScript interfaces for props

### Implementation Roadmap

**Phase 1 — Core Flow (MVP Launch Blockers):**

Must ship for any user to complete the first-time user journey.

| Priority | Component | Needed For |
|----------|-----------|------------|
| 1 | Button | Every screen |
| 2 | AuthForm | Sign-up/login (Journey 1 entry) |
| 3 | BottomNav | App shell navigation |
| 4 | Card | Mission cards, module cards |
| 5 | MissionIntroCard | Mission start (all journeys) |
| 6 | ExerciseContainer | All exercise flows |
| 7 | FeedbackBanner | Exercise feedback loop |
| 8 | ProgressBar | Mission and module progress |
| 9 | MissionComplete | Mission end flow |
| 10 | CurriculumNode | Curriculum map navigation |

**Phase 2 — Engagement Layer (MVP Pre-Launch):**

Needed for daily session flow and retention mechanics.

| Priority | Component | Needed For |
|----------|-----------|------------|
| 11 | MicroOnboarding | First-time personalization |
| 12 | StreakIndicator | Daily engagement |
| 13 | Tooltip | Jargon resolution (critical for trust) |
| 14 | BreakSuggestion | Mission chaining health |
| 15 | WelcomeBack | Return user flow |
| 16 | ConceptRefresher | Return after extended absence |

**Phase 3 — Progressive Reveal System (Curriculum-Gated):**

Built before launch but activated by curriculum milestones — no user sees these until they reach the corresponding lesson.

| Priority | Component | Needed For |
|----------|-----------|------------|
| 17 | TokenDisplay | Token reveal + ongoing display |
| 18 | GasIndicator | Gas fee reveal + exercise display |
| 19 | MechanicReveal | All three aha-moment takeovers |
| 20 | TransactionList | Wallet-profile reveal |

## UX Consistency Patterns

### Exercise Interaction Patterns

**Universal Exercise Behavior (applies to all 4 exercise types):**

| Pattern | Rule | Rationale |
|---------|------|-----------|
| **Instruction clarity** | Every exercise opens with a 1-sentence instruction in text-lg, visible at all times during the exercise | Users must never wonder "what am I supposed to do?" |
| **Action feedback** | Every user action (drag, tap, select) gets visual feedback in <200ms | Instant response maintains calm focus state |
| **Submission** | Explicit submit action required — no auto-submit on selection | Prevents accidental gas spend, gives user control |
| **Feedback duration** | FeedbackBanner stays 2s minimum, dismisses on tap or auto-advances after 3s | Long enough to read, never blocking |
| **Transition** | 200ms crossfade between exercises within a mission | Seamless flow, no perceived page load |
| **Progress visibility** | Segmented ProgressBar always visible in ExerciseContainer header | User always knows "3 of 5" position |
| **Exit safety** | Leaving mid-exercise auto-saves position, return resumes exactly | Sarah's bus-ride interruptions handled gracefully |

**Exercise-Specific Interaction Rules:**

**Interactive Placement (drag-and-drop):**
- Drag targets: minimum 48x48px, with 8px gap between targets
- Visual lift on grab (shadow-md + scale 105%)
- Drop zones highlight on approach (primary-light background)
- Snap animation on successful drop (150ms ease-out)
- Keyboard alternative: arrow keys to select item, arrow keys to move position, Enter to place

**Concept Matching:**
- Tap-to-select on mobile (first tap selects source, second tap selects target)
- Drag-to-connect on desktop (line drawn between matched pairs)
- Matched pairs dim to 50% opacity, keeping focus on remaining items
- Incorrect match: brief shake animation (150ms), items return to unmatched state

**Simulated Transactions (step-by-step):**
- Each step is a discrete screen within the exercise
- "Next Step" button advances — user controls the pace
- Micro-explanations appear inline below each action (text-sm, neutral-500)
- Running transaction summary visible as steps accumulate

**Scenario Interpretation:**
- Multiple-choice options presented as tappable cards (Card component)
- Selected option highlights with primary border
- Submit button confirms selection (not auto-submit on tap)
- Feedback includes explanation for both correct answer AND why other options were wrong

### Feedback Patterns

**Feedback Hierarchy:**

All feedback in transcendence follows a consistent emotional register — calm, informational, never punitive.

| Feedback Type | Visual Treatment | Icon | Tone | Duration |
|---------------|-----------------|------|------|----------|
| **Correct** | Soft green background (success-light) | Checkmark | "That's right. [Reinforcing explanation]" | 2-3s, auto-advance |
| **Incorrect** | Soft coral background (error-light) | X mark | "Not quite. [Educational explanation]" | Stays until user taps Retry |
| **Gas Spent** | Inline amber text in FeedbackBanner | Gas flame | "-1 gas" (neutral, same for correct/incorrect) | Appears with feedback |
| **Token Earned** | Inline amber text in MissionComplete | Token coin | "+5 tokens" | Appears on mission complete |
| **Streak Update** | Subtle animation in StreakIndicator | Flame | Day count increments silently | 500ms animation |
| **Token Debt** | Warning amber banner at top of home | Warning triangle | "Complete a mission to earn tokens before starting a new one" | Persistent until resolved |
| **System Error** | Soft coral card with retry action | Alert circle | "Something went wrong. Your progress is saved." | Persistent until dismissed |

**Feedback Principles:**

1. **Same gas cost display for correct and incorrect.** The gas indicator behaves identically regardless of answer correctness. This reinforces "gas is the cost of doing, not the cost of failing."
2. **Explanation always accompanies feedback.** A bare checkmark or X is never sufficient. Every correct answer gets a reinforcing sentence. Every incorrect answer gets an educational sentence.
3. **No sound effects.** The calm register is maintained through visual-only feedback. No correct/incorrect sounds, no celebration jingles. Silent by default.
4. **No negative language.** Never: "Wrong!", "Try again!", "You failed." Always: "Not quite.", "Let's look at this differently.", "Here's why."
5. **Progress feedback is additive.** The app always tells users what they gained, never what they lost. "+1 XP" not "-1 life." "14 missions completed" not "86% remaining."

### Form Patterns

**Form Design Rules (AuthForm + Settings):**

| Pattern | Rule |
|---------|------|
| **Label position** | Above field, always visible (never placeholder-only labels) |
| **Field sizing** | Full-width on mobile, max-width 400px on desktop |
| **Validation timing** | On blur (not on keystroke) — respects the user's pace |
| **Error display** | Inline below field, soft coral text, icon + message. Linked via `aria-describedby` |
| **Success display** | Inline checkmark on valid field (green, subtle) |
| **Submit button** | Full-width below fields, disabled until required fields valid |
| **Loading state** | Button shows spinner, fields become readonly |
| **OAuth buttons** | Full-width, branded, above email/password with "or" divider |

**Error Message Tone:**

- Email field: "Please enter a valid email address" (not "Invalid email!")
- Password field: "Password needs at least 8 characters" (not "Password too short!")
- Auth failure: "We couldn't find that account. Double-check your email or sign up." (not "Login failed!")

### Navigation Patterns

**Navigation Hierarchy:**

| Level | Mechanism | Components |
|-------|-----------|------------|
| **App-level** | BottomNav (persistent) | Home, Curriculum, Wallet, Settings |
| **Screen-level** | Back arrow in top-left header | Returns to previous screen |
| **In-mission** | ExerciseContainer header with progress | Forward-only within mission (no back to previous exercise) |
| **In-curriculum** | CurriculumNode tap → Module detail | Drill-down with back to map |

**Navigation Rules:**

1. **BottomNav is always accessible.** Visible on all screens except during active exercise flow (where it fades to minimize distraction). Reappears on mission complete.
2. **No hamburger menus.** All navigation is visible. Four bottom nav items cover the entire app. Settings is a full screen, not a drawer.
3. **Back is always predictable.** Back arrow returns to the previous screen in the navigation stack. Never skips levels. Never loses data.
4. **Forward is always obvious.** The primary action on every screen is visually dominant (primary Button) and moves the user forward in their journey.
5. **Deep links preserve context.** If a user arrives at a specific mission (from notification or share link), back navigates to the curriculum map, not to the home screen.
6. **No horizontal navigation.** No tab bars, no swipe-to-navigate between sections. Vertical scrolling only. This simplifies the mobile experience and prevents accidental navigation during exercises.

**Screen Transition Animations:**

| Transition | Animation | Duration |
|------------|-----------|----------|
| Screen push (forward navigation) | Slide in from right | 200ms ease-out |
| Screen pop (back navigation) | Slide in from left | 200ms ease-out |
| Modal/overlay open | Fade backdrop + slide up content | 300ms ease-out |
| Modal/overlay close | Slide down content + fade backdrop | 200ms ease-in |
| Exercise transition (within mission) | Crossfade | 200ms |

### Loading & Empty States

**Loading States:**

| Context | Treatment |
|---------|-----------|
| **App launch** | Splash screen with logo (max 2s), then home screen. If data isn't ready, show home screen skeleton. |
| **Screen navigation** | Instant screen shell with skeleton content (gray placeholder blocks matching expected layout). No spinners for screen loads. |
| **Exercise load** | ExerciseContainer shell with pulsing placeholder. Exercise content fades in when ready. Target: <500ms. |
| **Action submission** | Button shows inline spinner. No full-screen loading overlay. The action feels instant. |
| **Data refresh** | Pull-to-refresh on mobile (curriculum map, wallet). Subtle spinner at top, content updates in place. |

**Skeleton Design:**
- Rounded rectangles matching the expected content dimensions
- Neutral-100 background with subtle pulse animation (opacity 0.5 → 1.0, 1.5s loop)
- Same layout as loaded state — no layout shift when content appears

**Empty States:**

| Screen | Empty State Message | Action |
|--------|-------------------|--------|
| **Curriculum map (new user)** | "Your learning journey starts here." | Primary button: "Start first mission" |
| **Wallet-profile (pre-token reveal)** | Shows XP only. No empty state — XP exists from mission 1. | — |
| **Wallet-profile (post-reveal, no transactions)** | "Complete a mission to see your first transaction." | Primary button: "Start mission" |
| **Transaction list (empty)** | "No transactions yet. Your history will appear as you learn." | — |

**Empty State Principles:**
1. **Never show a blank screen.** Every empty state has a message and (where applicable) an action.
2. **Tone is inviting.** Empty states frame the absence as an opportunity, not a deficiency.
3. **One clear action.** If the user can fix the empty state, show exactly one button to do so.

### Modal & Overlay Patterns

**Overlay Hierarchy (from lightest to heaviest):**

| Type | Use Case | Components | Behavior |
|------|----------|------------|----------|
| **Tooltip** | Jargon definitions | Tooltip | Tap/hover to open, tap-outside to dismiss. Positioned inline. |
| **Bottom Sheet** | Long tooltip content, module detail on mobile | — (pattern, not a component) | Slides up from bottom, 50% screen max height, drag to dismiss. |
| **Overlay Card** | BreakSuggestion, WelcomeBack (medium) | BreakSuggestion, WelcomeBack | Appears over current content with light backdrop. Tap action to dismiss. |
| **Full-Screen Takeover** | MechanicReveal, WelcomeBack (extended) | MechanicReveal, WelcomeBack | Full viewport, blurred backdrop. Focus-trapped. Explicit dismiss action required. |

**Overlay Rules:**

1. **Maximum one overlay at a time.** Never stack modals, tooltips, or sheets. If a new overlay is triggered while one is open, the previous one closes first.
2. **Always dismissible.** Every overlay can be closed: Escape key, tap-outside (except full-screen takeover), explicit close/action button.
3. **Focus management.** On open: focus moves into overlay. On close: focus returns to trigger element. Full-screen takeovers trap focus.
4. **No overlay during exercises.** Tooltips are the only overlay allowed during active exercise flow. No modals, no bottom sheets, no interruptions to the core loop.
5. **Backdrop treatment.** Overlay cards: semi-transparent neutral-900 at 20% opacity. Full-screen takeovers: secondary-warm at 10-15% opacity with backdrop blur.

### Progressive Disclosure Patterns

**UI Element Visibility Rules:**

| UI Element | Visibility Condition | Reveal Trigger |
|------------|---------------------|----------------|
| XP counter | Always (from first mission) | Immediate |
| Token balance | After token curriculum milestone | TokenReveal (MechanicReveal) |
| Gas indicator | After gas curriculum milestone | GasReveal (MechanicReveal) |
| Wallet-profile full view | After wallet curriculum milestone | WalletReveal (MechanicReveal) |
| Transaction list | After wallet curriculum milestone | Part of wallet-profile reveal |
| Gas cost in FeedbackBanner | After gas curriculum milestone | Automatic — appears in feedback |
| Token earned in MissionComplete | After token curriculum milestone | Automatic — appears in summary |

**Reveal Animation Pattern:**

All progressive reveals follow the same animation sequence:
1. **Pre-reveal:** UI element's slot is simply absent (not hidden or placeholder). The layout is complete without it.
2. **Trigger:** User completes the corresponding curriculum mission.
3. **MechanicReveal takeover:** Full-screen moment (see component spec #16).
4. **Post-dismiss:** UI element fades into its permanent position (300ms). Surrounding layout adjusts smoothly (200ms).
5. **Permanent:** Element is now always visible in its position. No re-reveal on subsequent visits.

**Disclosure Principles:**

1. **No placeholder or "coming soon" indicators.** Users don't see locked slots for features they don't know about. The UI is simply smaller/simpler early on.
2. **Layout never breaks on reveal.** New elements are designed to insert cleanly into existing layouts. The home screen, mission complete, and exercise views all have predefined slots that activate gracefully.
3. **One reveal per mission.** If multiple mechanics could theoretically unlock in the same session, they queue — one MechanicReveal per mission complete, never stacked.

### Micro-Interaction Patterns

**Touch Interaction Standards:**

| Interaction | Feedback | Timing |
|-------------|----------|--------|
| **Tap** | Subtle scale (98%) + opacity change | 100ms |
| **Long press** | Not used anywhere in the app | — |
| **Drag** | Element lifts (shadow-md), origin shows ghost | Immediate on grab |
| **Swipe** | Not used for navigation. Only for dismiss on bottom sheets (vertical swipe down). | — |
| **Pull to refresh** | Spinner appears at top of scrollable area | Activates after 60px pull |

**Animation Standards:**

| Category | Duration | Easing | Notes |
|----------|----------|--------|-------|
| **Micro-feedback** (tap, hover) | 100-150ms | ease-out | Fastest — feels instant |
| **Component transitions** (fade, slide) | 200ms | ease-out | Standard for most UI changes |
| **Screen transitions** | 200ms | ease-out | Push/pop navigation |
| **Overlay enter** | 300ms | ease-out | Slightly slower for emphasis |
| **Overlay exit** | 200ms | ease-in | Faster exit than enter |
| **Number count-up** (tokens, XP) | 300ms | ease-out | Satisfying but not slow |
| **MechanicReveal proof animation** | 1-1.5s | custom ease | The one moment of extended animation — the aha payoff |
| **Skeleton pulse** | 1.5s loop | ease-in-out | Slow, calming pulse |

**`prefers-reduced-motion` Overrides:**

When the user has reduced motion enabled:
- All transitions become instant (0ms) or use opacity-only fades (150ms)
- Skeleton pulse becomes static (neutral-100 background, no animation)
- MechanicReveal proof animation becomes a simple fade-in of the final state
- Number count-ups become instant number display
- Drag feedback uses opacity change instead of lift/shadow

## Responsive Design & Accessibility

### Responsive Strategy

**Design Philosophy:** Mobile defines the design, desktop enhances it. Every screen is authored mobile-first and progressively enhanced for larger viewports. The mobile experience is never a compressed version of desktop — desktop is an expanded version of mobile.

**Breakpoints (Tailwind mobile-first):**

| Breakpoint | Range | Prefix | Primary User |
|------------|-------|--------|-------------|
| **Default** | 320px+ | (none) | Sarah — bus ride, one-handed |
| **sm** | 640px+ | `sm:` | Large phones, small tablets |
| **md** | 768px+ | `md:` | Tablets — touch-friendly, more real estate |
| **lg** | 1024px+ | `lg:` | Desktop — Marc's evening sessions |

### Screen-by-Screen Responsive Adaptation

#### Home Screen

| Element | Mobile (default) | Tablet (md) | Desktop (lg) |
|---------|-----------------|-------------|--------------|
| **Navigation** | BottomNav (fixed bottom) | BottomNav (fixed bottom) | TopNav (fixed top, logo left, 4 items right) |
| **Next mission card** | Full-width, stacked layout | Full-width, stacked | Max-width 600px, centered |
| **Streak indicator** | Compact (flame + count) below mission card | Compact, beside mission card | Compact, in TopNav area or beside mission card |
| **Curriculum progress** | Circular ProgressBar below streak | Beside streak (horizontal row) | Sidebar summary or inline with mission card |
| **Layout** | Single column, 16px padding | Single column, 24px padding | Centered content column (max 768px), 32px padding |

#### Exercise View

| Element | Mobile (default) | Tablet (md) | Desktop (lg) |
|---------|-----------------|-------------|--------------|
| **ExerciseContainer** | Full viewport height minus header | Full viewport height minus header | Max-width 800px centered, generous vertical padding |
| **Exercise header** | Mission title + segmented progress + gas indicator | Same, slightly more spacious | Same, with more whitespace |
| **Interactive Placement** | Vertical stack, full-width drag targets (48x48px) | Vertical or horizontal layout depending on exercise | Horizontal layout possible, larger drag targets (56x56px) |
| **Concept Matching** | Tap-to-select (two sequential taps) | Tap-to-select or drag-to-connect | Drag-to-connect (lines between columns), side-by-side columns |
| **Simulated Transaction** | Vertical steps, full-width | Vertical steps with wider context panel | Two-column: steps left, running summary right |
| **Scenario Interpretation** | Stacked option cards, full-width | Stacked cards, wider | 2-column grid of option cards |
| **FeedbackBanner** | Slides up from bottom, full-width | Same, full-width | Max-width 800px centered, same slide-up |
| **BottomNav** | Fades out during exercise, reappears on complete | Same behavior | TopNav remains visible (less intrusive at top) |

#### Curriculum Map

| Element | Mobile (default) | Tablet (md) | Desktop (lg) |
|---------|-----------------|-------------|--------------|
| **Path layout** | Vertical scrolling path, nodes centered | Vertical path, nodes alternate left/right with more detail | Vertical path centered in content area, module detail panel to the right on node tap |
| **CurriculumNode** | 48px circular nodes, title to the right | 56px nodes, title + mission count visible | 56px nodes, expanded detail inline or in side panel |
| **Module detail** | Bottom sheet on node tap | Bottom sheet or inline expansion | Side panel (right, 320px wide) — no navigation away from map |
| **Scroll position** | Auto-scrolls to current module on load | Same | Same |

#### Wallet-Profile

| Element | Mobile (default) | Tablet (md) | Desktop (lg) |
|---------|-----------------|-------------|--------------|
| **Token balance** | Large centered display (48px) | Same | Same, with more surrounding whitespace |
| **Stats row** | XP + Streak, stacked or horizontal | Horizontal row | Horizontal row with more spacing |
| **Transaction list** | Full-width list, grouped by date | Same, wider rows | Max-width 600px centered, same grouping |
| **Layout** | Single column, vertical scroll | Single column | Two-column option: balance/stats left, transactions right |

#### MechanicReveal (Full-Screen Takeover)

| Element | Mobile (default) | Tablet (md) | Desktop (lg) |
|---------|-----------------|-------------|--------------|
| **Backdrop** | Full viewport, amber gradient + blur | Same | Same |
| **Content card** | Near full-width (16px margin), slides up from bottom | Centered, max-width 500px, slides up | Centered, max-width 500px, fades in (no slide — desktop feels more refined with fade) |
| **Icon** | 48px | 56px | 64px |
| **Headline** | text-2xl | text-3xl | text-3xl |

### Desktop Navigation — TopNav

**At lg breakpoint (1024px+), BottomNav transforms to TopNav:**

**Anatomy:**
- Fixed to top of viewport, full-width, 64px height
- Logo/wordmark on the left (links to home)
- 4 navigation items on the right: Home, Curriculum, Wallet, Settings
- Active item: primary color text + underline indicator
- Inactive items: neutral-500 text
- Warm off-white background (neutral-50) with subtle bottom border (neutral-200)

**Behavior:**
- Always visible on all screens including during exercises (top position is less intrusive than bottom for desktop exercise flow)
- No collapse/hamburger — all 4 items always visible
- Hover states on items (primary-light background)

**Accessibility:** Same `<nav>` structure as BottomNav, `aria-current="page"` on active item, keyboard-navigable with Tab.

### Accessibility Strategy

**Compliance Target: WCAG 2.1 AA**

This is the industry standard for good UX and covers the needs of transcendence's audience. AAA is not targeted but several AAA criteria are met incidentally (generous spacing, large text, no time limits on exercises).

#### Color Accessibility

| Requirement | Target | Implementation |
|-------------|--------|----------------|
| **Normal text contrast** | 4.5:1 minimum | All neutral-700/900 on neutral-50/100 backgrounds verified |
| **Large text contrast** | 3:1 minimum | All heading text on backgrounds verified |
| **Non-text contrast** | 3:1 minimum | Icons, borders, focus rings against backgrounds |
| **Color independence** | Never color-only | Feedback uses icon + text + color. Progress uses shape + color. States use icon + label. |
| **Focus indicators** | 2px ring, primary color | Visible on all interactive elements, not just browser default |

#### Keyboard Navigation

**Tab Order by Screen:**

| Screen | Tab Order |
|--------|-----------|
| **Home** | Skip link → Nav items → Streak → Mission card → Start button |
| **Exercise** | Skip link → Progress bar (informational) → Exercise interaction zone → Submit button → Feedback (when visible) |
| **Curriculum** | Skip link → Nav items → Current module node → Next nodes (sequential) |
| **Wallet** | Skip link → Nav items → Token balance → Stats → Transaction list items |

**Keyboard Interactions:**

| Component | Keys | Action |
|-----------|------|--------|
| **Button** | Enter, Space | Activate |
| **Card (interactive)** | Enter | Navigate to destination |
| **BottomNav/TopNav** | Tab between items, Enter to select | Navigate |
| **Drag-and-drop** | Tab to select item, Arrow keys to move, Enter to place | Keyboard alternative to drag |
| **Concept matching** | Tab to source, Enter to select, Tab to target, Enter to match | Sequential tap equivalent |
| **Tooltip** | Focus trigger = show tooltip, Escape = dismiss | Keyboard equivalent of hover/tap |
| **Modal/Overlay** | Tab cycles within modal, Escape = close | Focus trap |
| **Scenario options** | Tab between cards, Enter to select, Tab to Submit | Card selection |

**Skip Links:**
- "Skip to main content" link visible on keyboard focus, hidden visually
- Appears on every screen, targets the main content area (exercise, mission card, curriculum map)
- Styled as primary Button when focused, positioned absolutely at top-left

#### Screen Reader Support

**ARIA Live Regions:**

| Region | Type | Announces |
|--------|------|-----------|
| **Exercise feedback** | `aria-live="polite"` | "Correct. [Explanation]. Gas cost: 1 token." or "Not quite. [Explanation]. Gas cost: 1 token." |
| **Progress update** | `aria-live="polite"` | "Exercise 3 of 5 complete" |
| **Token balance change** | `aria-live="polite"` | "Knowledge Token balance: 37 tokens" |
| **Mission complete** | `aria-live="polite"` | "Mission complete. You learned: [concept]. XP: +1." |
| **Streak update** | `aria-live="polite"` | "Streak: day 5" |
| **Gas indicator** | `aria-live="polite"` | "Gas spent: 1 token. Remaining: 36 tokens." |

**Semantic Structure:**

| Component | HTML Element | ARIA |
|-----------|-------------|------|
| **App shell** | `<main>`, `<nav>`, `<header>` | Landmark roles |
| **ExerciseContainer** | `<main>` | `role="main"`, `aria-label="Exercise: [title]"` |
| **FeedbackBanner** | `<div>` | `role="status"`, `aria-live="polite"` |
| **MechanicReveal** | `<div>` | `role="dialog"`, `aria-modal="true"`, `aria-labelledby` |
| **Tooltip** | `<div>` | `role="tooltip"`, `aria-describedby` on trigger |
| **CurriculumNode** | `<li>` inside `<ol>` | `aria-label="Module [n]: [name] — [state]"` |
| **ProgressBar** | `<div>` | `role="progressbar"`, `aria-valuenow`, `aria-valuemax` |
| **BottomNav/TopNav** | `<nav>` | `aria-label="Main navigation"`, `aria-current="page"` |

#### Motion & Animation Accessibility

- All animations gated behind `prefers-reduced-motion` check (defined in micro-interaction patterns)
- No auto-playing animations that can't be paused
- No flashing content (WCAG 2.3.1 — three flashes threshold)
- Exercise feedback is never animation-only — always accompanied by text and ARIA announcement

#### Touch Accessibility

| Requirement | Standard | Implementation |
|-------------|----------|----------------|
| **Touch target size** | 44x44px minimum (WCAG 2.5.5 AAA, adopted voluntarily) | All buttons, nav items, cards, exercise targets |
| **Target spacing** | 8px minimum between adjacent targets | Prevents mis-taps on mobile |
| **Gesture alternatives** | All gestures have tap/button alternatives | Drag-and-drop has keyboard alternative; swipe-to-dismiss has close button |
| **Input modality** | Support touch, mouse, and keyboard | No interaction locked to a single input method |

### Testing Strategy

**Responsive Testing:**

| Test Type | Tools | Frequency |
|-----------|-------|-----------|
| **Viewport testing** | Browser DevTools responsive mode | Every component, every PR |
| **Real device testing** | Physical iPhone (Safari), Android (Chrome) | Before each milestone release |
| **Cross-browser** | Chrome (primary), Firefox, Safari | Every PR for critical paths |
| **Breakpoint transitions** | Manual resize through breakpoints | Every layout component |

**Target Devices:**
- iPhone SE (375px) — smallest supported mobile
- iPhone 14/15 (390px) — common mobile
- iPad (768px) — tablet baseline
- MacBook 13" (1440px) — common desktop
- External monitor (1920px) — wide desktop

**Accessibility Testing:**

| Test Type | Tools | Frequency |
|-----------|-------|-----------|
| **Automated audit** | axe-core (via browser extension or CI) | Every PR — zero violations policy |
| **Keyboard navigation** | Manual testing (Tab, Enter, Escape, Arrows) | Every new component, every interactive flow |
| **Screen reader** | VoiceOver (macOS/iOS) — primary team testing | Every new component, key flow changes |
| **Color contrast** | Automated (axe-core) + manual spot-check | Design token changes, new color usage |
| **Reduced motion** | Toggle `prefers-reduced-motion` in OS settings | Every animated component |

**Acceptance Criteria for Accessibility:**
- Zero axe-core violations on all pages
- All interactive elements keyboard-operable
- All exercise flows completable via keyboard alone
- Screen reader announces all feedback, progress changes, and navigation
- No color-only information — always redundant icon/text

### Implementation Guidelines

**Responsive Development Rules:**

1. **Write mobile styles first.** Default CSS/Tailwind classes target mobile. Add `sm:`, `md:`, `lg:` prefixes only for larger viewport enhancements.
2. **Use relative units.** `rem` for typography and spacing. `%` or `vw` for widths where fluid behavior is needed. `px` only for borders, shadows, and fixed-dimension elements (icons, touch target minimums).
3. **Test at 320px.** If it works at 320px, it works everywhere. This is the floor — the narrowest supported viewport.
4. **No horizontal scroll.** Ever. On any viewport. If content overflows horizontally, the layout is broken.
5. **Images and media.** Use `max-width: 100%` and `height: auto` on all media. Serve appropriately sized assets (not desktop images on mobile).

**Accessibility Development Rules:**

1. **Semantic HTML first.** Use `<button>` for buttons, `<a>` for links, `<nav>` for navigation, `<main>` for main content. ARIA is a supplement, not a substitute for correct HTML.
2. **Label everything.** Every interactive element has a visible label or `aria-label`. Every image has `alt` text (or `alt=""` if decorative).
3. **Test with keyboard.** Before any component is considered complete, navigate it using only Tab, Enter, Escape, and Arrow keys.
4. **Announce dynamic changes.** Any content that updates without a page reload (feedback, progress, token balance) uses `aria-live` to announce the change.
5. **Focus management.** When opening modals/overlays, move focus in. When closing, return focus to trigger. Never leave focus in a removed element.
