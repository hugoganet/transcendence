---
stepsCompleted: [1, 2]
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
