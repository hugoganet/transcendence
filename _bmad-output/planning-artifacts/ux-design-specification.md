---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
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
