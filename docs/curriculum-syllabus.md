# Curriculum Syllabus — Transcendence

> 6 categories · 18 chapters · 69 missions
> Audience: non-technical adults, no prior blockchain knowledge assumed
> Format: Duolingo-style bite-sized missions (2–5 minutes each)
> Last updated: 2026-03-16

---

## Reading This Document

Each chapter entry follows this structure:
- **Learning outcomes** — what the learner can articulate by chapter end
- **Pedagogical purpose** — why this chapter exists and where it fits in the arc
- **Difficulty delta** — relative to the immediately preceding chapter
- **Completion criteria** — what the system considers this chapter "completed"
- **Post-chapter message** — copy shown on chapter completion screen
- **Unlock effect** — what becomes available after completion
- **Special notes** — disclaimer gates, reveal triggers, or structural anomalies

---

## Category 1 — Blockchain Foundations

**Platform mechanic:** `xpOnly` — no tokens visible, no gas, no wallet. Pure learning.

**Category arc:** Establish the problem blockchain solves (trust between strangers) before introducing any solution. The learner leaves Category 1 knowing *why* the technology exists, not just what it is.

---

### Chapter 1.1 — The Trust Problem

**Missions:** 1.1.1, 1.1.2, 1.1.3 (3 missions)

**Learning outcomes**
- Explain why trust between strangers is a fundamental problem in digital transactions
- Describe the role that intermediaries (banks, notaries, platforms) play in establishing trust
- Articulate the core limitation of centralized trust: single points of failure and control

**Pedagogical purpose**
This chapter is the problem statement for the entire course. No solution is introduced here. Learners who arrive with the misconception that blockchain is primarily about cryptocurrency will be reoriented: it is first and foremost a response to a trust problem. By framing the need before the technology, the rest of the curriculum has a motivating question to answer.

**Difficulty delta**
Starting baseline — conceptually approachable, no technical prerequisites.

**Completion criteria**
All 3 missions completed (each mission's exercise submitted correctly or acknowledged).

**Post-chapter message**
You now see the problem. Everything that follows is about how the world tried to solve it.

**Unlock effect**
Chapter 1.2 unlocks.

**Special notes**
None.

---

### Chapter 1.2 — Blocks, Chains & Consensus

**Missions:** 1.2.1, 1.2.2, 1.2.3, 1.2.4, 1.2.5 (5 missions)

**Learning outcomes**
- Describe what a block contains (data, timestamp, hash, previous hash)
- Explain how chaining hashes creates tamper-evidence
- Define consensus and explain why it replaces central authority
- Distinguish between Proof of Work and Proof of Stake at a conceptual level
- Explain why altering one block invalidates all subsequent blocks

**Pedagogical purpose**
The technical heart of Category 1. This chapter builds the mechanical model of a blockchain from first principles: blocks as records, chains as linked history, consensus as distributed agreement. It is the longest chapter in Category 1 (5 missions) because this vocabulary is foundational — every subsequent category builds on it. The learner does not need to understand cryptographic hashing in depth; they need the intuition that changing data changes its fingerprint.

**Difficulty delta**
Moderate increase. Introduces technical vocabulary (hash, consensus, validator). More abstract than 1.1.

**Completion criteria**
All 5 missions completed.

**Post-chapter message**
Blocks. Chains. Consensus. You now speak the language. The rest of this course is built on what you just learned.

**Unlock effect**
Chapter 1.3 unlocks.

**Special notes**
None.

---

### Chapter 1.3 — Why Decentralization Matters

**Missions:** 1.3.1, 1.3.2, 1.3.3 (3 missions)

**Learning outcomes**
- Define decentralization and contrast it with centralization and federation
- Describe the censorship-resistance property of decentralized systems
- Articulate the tradeoffs of decentralization (speed, efficiency, coordination cost)
- Give real-world examples of why decentralization has value for specific use cases

**Pedagogical purpose**
This chapter closes Category 1 by answering the "so what?" question. The learner now understands the mechanism (1.2); this chapter establishes why decentralization as a design principle matters beyond the technology. It introduces honest tradeoffs — this platform does not advocate for blockchain uncritically — which builds trust with learners and prepares them for the more nuanced content in Category 5 (NFT hype/scams) and Category 6 (DeFi risks).

**Difficulty delta**
Slight decrease from 1.2 — more conceptual and values-oriented than technical.

**Completion criteria**
All 3 missions completed.

**Post-chapter message**
You understand the foundations. Time to meet the assets that run on top of them.

**Unlock effect**
Category 2 unlocks. Chapter 2.1 becomes available.

**Special notes**
None.

---

## Category 2 — Crypto & Tokens

**Platform mechanic:** `tokensRevealed` — Knowledge Tokens are revealed partway through this category (at mission 2.2.4).

**Category arc:** Move from infrastructure (Category 1) to the assets that run on it. Introduce the economic layer of blockchain: what coins and tokens are, how they differ, and why their value is volatile. End with an honest treatment of price risk.

---

### Chapter 2.1 — Digital Money

**Missions:** 2.1.1, 2.1.2, 2.1.3, 2.1.4 (4 missions)

**Learning outcomes**
- Define cryptocurrency as digital money native to a blockchain network
- Explain Bitcoin as the original cryptocurrency and its fixed supply model
- Describe how cryptocurrency transactions are recorded on the blockchain
- Distinguish cryptocurrency from traditional digital payments (PayPal, card payments)

**Pedagogical purpose**
The first chapter that introduces learners to assets. Bitcoin is used as the canonical example because it is the most widely known and has the clearest conceptual model (fixed supply, no issuer). This chapter establishes the mental model of cryptocurrency before introducing the broader and more varied world of tokens in Chapter 2.2.

**Difficulty delta**
Accessible — Bitcoin is culturally familiar. Most learners arrive with partial knowledge here; the chapter fills gaps without assuming much.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
Bitcoin was just the beginning. What came next was a much wider zoo.

**Unlock effect**
Chapter 2.2 unlocks.

**Special notes**
None.

---

### Chapter 2.2 — Coins, Tokens & the Crypto Zoo

**Missions:** 2.2.1, 2.2.2, 2.2.3, 2.2.4 (4 missions)

**Learning outcomes**
- Distinguish between coins (native blockchain currency) and tokens (built on top of a blockchain)
- Identify the main token categories: utility tokens, governance tokens, stablecoins, wrapped tokens
- Understand that a token's value derives from the utility or rights it represents
- Recognize that this platform uses Knowledge Tokens as a concrete example of a utility token

**Pedagogical purpose**
This chapter expands the learner's vocabulary from "cryptocurrency" (a single concept) to the full spectrum of digital assets. The taxonomy is kept practical — no exhaustive classification, just the distinctions that matter for understanding the rest of the course. Mission 2.2.4 is the reveal trigger: the learner discovers their own token balance immediately after completing a chapter about what tokens are.

**Difficulty delta**
Moderate increase from 2.1 — introduces vocabulary (utility token, governance token, stablecoin) and requires distinguishing between similar concepts.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
You now know what tokens are. And it turns out you've had some for a while.

**Unlock effect**
Progressive reveal `tokensRevealed` fires on 2.2.4 completion. Token UI becomes visible platform-wide. Chapter 2.3 unlocks (with disclaimer gate).

**Special notes**
**Reveal trigger:** Mission 2.2.4 triggers `tokensRevealed`. See `docs/progressive-reveal-spec.md` for full reveal screen copy and frontend implementation notes.

---

### Chapter 2.3 — Value, Price & Volatility

**Missions:** 2.3.1, 2.3.2, 2.3.3, 2.3.4 (4 missions)

**Learning outcomes**
- Explain why cryptocurrency prices are volatile (low liquidity, sentiment-driven, speculative demand)
- Distinguish between intrinsic value arguments and speculative value
- Understand market capitalization as a metric and its limitations
- Articulate the difference between short-term price movements and long-term value propositions

**Pedagogical purpose**
This chapter introduces financial risk literacy without moralizing. It does not recommend or discourage investment — it equips learners to think critically about price claims they will encounter in the wild. Placed here (end of Category 2, after learners understand what assets are), it completes the "what are crypto assets" arc with an honest treatment of their most misunderstood property: volatility.

**Difficulty delta**
Slight increase — introduces financial reasoning that may be unfamiliar. Kept accessible through concrete examples.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
You know what crypto is, and you know that its price is not the same as its value. That distinction will serve you.

**Unlock effect**
Category 3 unlocks. Chapter 3.1 becomes available.

**Special notes**
**DISCLAIMER GATE:** A financial disclaimer modal must be shown and accepted before this chapter can be entered. Use `POST /api/v1/disclaimers/accept` with the chapter's module ID. The disclaimer modal copy is in `docs/copy-bank-system-messages.md` Section F.

---

## Category 3 — Wallets & Gas

**Platform mechanic:** `walletAndGasRevealed` — both wallet interface and gas fees are revealed during this category.

**Category arc:** The practical layer. After understanding what blockchain assets are, learners now learn how to hold and use them. The category culminates in security: how to not lose what you have.

---

### Chapter 3.1 — Your Digital Wallet

**Missions:** 3.1.1, 3.1.2, 3.1.3, 3.1.4 (4 missions)

**Learning outcomes**
- Explain that a wallet holds private keys, not coins
- Distinguish between custodial and non-custodial wallets
- Understand the concept of a wallet address as a public identifier
- Recognize the seed phrase as the ultimate recovery mechanism and its importance

**Pedagogical purpose**
The wallet is the learner's primary interface to the blockchain ecosystem. This chapter corrects the most common misconception ("my coins are in my wallet") with the accurate mental model ("my wallet holds the keys that prove ownership"). This distinction is not pedantic — it determines how users think about security, custody, and recovery. Mission 3.1.4 triggers the wallet reveal, transforming the learner's own profile page into a wallet-style interface.

**Difficulty delta**
Accessible — the wallet concept is introduced from scratch. The key/custody distinction requires careful attention but no prior technical knowledge.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
Your profile just changed. That's your wallet now — and you know exactly why it looks the way it does.

**Unlock effect**
Progressive reveal `walletRevealed` fires on 3.1.4 completion. Profile page transforms to wallet layout. Chapter 3.2 unlocks.

**Special notes**
**Reveal trigger:** Mission 3.1.4 triggers `walletRevealed`. See `docs/progressive-reveal-spec.md`.

---

### Chapter 3.2 — Making a Transaction

**Missions:** 3.2.1, 3.2.2, 3.2.3, 3.2.4 (4 missions)

**Learning outcomes**
- Describe the lifecycle of a blockchain transaction (creation → signing → broadcast → confirmation)
- Explain what transaction signing means and why it proves ownership without revealing the private key
- Understand confirmation time and why transactions are not instant
- Distinguish between a pending transaction and a confirmed transaction

**Pedagogical purpose**
Builds on the wallet foundation (3.1) by explaining what happens when you actually use one. The transaction lifecycle is the practical expression of everything learned in Categories 1–3: blocks record transactions, consensus confirms them, the wallet signs them. This chapter is the synthesis point for the first three categories.

**Difficulty delta**
Moderate — transaction signing requires understanding public/private key pairs. The chapter stays at the conceptual level (what, not how).

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
Every transaction on a blockchain follows that same path. Now you know what's happening when you wait for a confirmation.

**Unlock effect**
Chapter 3.3 unlocks.

**Special notes**
None.

---

### Chapter 3.3 — Gas Fees

**Missions:** 3.3.1, 3.3.2, 3.3.3, 3.3.4 (4 missions)

**Learning outcomes**
- Define gas as the unit of computational cost for blockchain operations
- Explain why gas fees exist (validator incentives, spam prevention)
- Understand how gas prices fluctuate with network demand
- Identify strategies for managing gas costs (timing, layer 2 solutions)

**Pedagogical purpose**
Gas fees are the most common point of frustration for new blockchain users. This chapter reframes gas from "annoying cost" to "intentional design feature" — a mechanism for prioritizing transactions and compensating the validators who secure the network. Mission 3.3.3 activates gas fees on the platform's own exercise submissions, giving learners immediate hands-on experience of what they just learned.

**Difficulty delta**
Moderate — gas pricing involves economic reasoning about supply/demand for block space. The chapter uses analogies (toll roads, auction pricing) to keep it accessible.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
You've paid gas. You've studied gas. You now understand something that trips up most new users of blockchain apps.

**Unlock effect**
Progressive reveal `gasRevealed` fires on 3.3.3 completion (mid-chapter). Chapter 3.4 unlocks after all 4 missions complete.

**Special notes**
**Reveal trigger:** Mission 3.3.3 (not 3.3.4) triggers `gasRevealed`. Gas fees on exercise submissions activate mid-chapter so the learner experiences gas costs while still in the Gas Fees chapter. See `docs/progressive-reveal-spec.md`.

---

### Chapter 3.4 — Staying Safe

**Missions:** 3.4.1, 3.4.2, 3.4.3, 3.4.4 (4 missions)

**Learning outcomes**
- Identify the most common attack vectors: phishing, fake wallets, social engineering, rug pulls
- Understand that lost private keys and seed phrases are unrecoverable
- Apply basic security hygiene: hardware wallets, seed phrase storage, transaction verification
- Recognize red flags in token offerings and wallet connection requests

**Pedagogical purpose**
Security education belongs here — immediately after the learner has internalized wallets, transactions, and gas. The stakes are now clear: the learner knows what a private key controls, which makes the risk of losing it comprehensible rather than abstract. This placement avoids the common mistake of front-loading security warnings before learners have context to evaluate them.

**Difficulty delta**
Accessible — applies learned concepts to practical scenarios. Exercise types include scenario-based decisions (SI) that simulate real attack patterns.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
The most secure blockchain in the world is worthless if your keys aren't safe. You now know how to protect them.

**Unlock effect**
Category 4 unlocks. Chapter 4.1 becomes available.

**Special notes**
None.

---

## Category 4 — Smart Contracts

**Platform mechanic:** `xpOnly` — tokens remain visible (from Category 2 reveal), gas costs active (from Category 3 reveal), but no new reveals.

**Category arc:** Expand the learner's model of blockchain from "ledger for value transfer" to "programmable platform." Smart contracts are the foundation of everything in Categories 5 and 6.

---

### Chapter 4.1 — What Are Smart Contracts?

**Missions:** 4.1.1, 4.1.2, 4.1.3, 4.1.4 (4 missions)

**Learning outcomes**
- Define a smart contract as self-executing code stored on a blockchain
- Explain the "if/then" logic model: conditions trigger automatic outcomes
- Understand immutability: once deployed, smart contract code cannot be changed
- Describe the Ethereum virtual machine (EVM) at a conceptual level as the execution environment

**Pedagogical purpose**
Smart contracts are the paradigm shift from "blockchain as ledger" to "blockchain as computer." This chapter introduces the core concept carefully: most learners will have heard the term but have a vague definition. The four missions move from definition → logic model → immutability → execution environment, building a complete mental model before showing applications.

**Difficulty delta**
Moderate increase — "code that runs itself" is abstract. The chapter uses vending machine analogies and real-world examples throughout.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
You've gone from blockchain as a record to blockchain as a computer. That changes everything.

**Unlock effect**
Chapter 4.2 unlocks.

**Special notes**
None.

---

### Chapter 4.2 — Smart Contracts Everywhere

**Missions:** 4.2.1, 4.2.2, 4.2.3 (3 missions)

**Learning outcomes**
- Identify real-world use cases of smart contracts: escrow, voting, insurance, supply chain
- Understand token standards (ERC-20, ERC-721) as smart contract templates
- Recognize the connection between smart contracts and the DeFi/NFT ecosystems they enable

**Pedagogical purpose**
Applies the Chapter 4.1 model to concrete domains. Learners who understand smart contract mechanics in the abstract often struggle to connect them to real applications until they see enough examples. This chapter bridges that gap and simultaneously prepares learners for Categories 5 (NFTs use ERC-721) and 6 (DeFi is built on smart contracts).

**Difficulty delta**
Lower than 4.1 — application-focused, reinforces rather than introduces new concepts.

**Completion criteria**
All 3 missions completed.

**Post-chapter message**
Every NFT, every DeFi protocol, every DAO — built on what you just learned.

**Unlock effect**
Category 5 unlocks. Chapter 5.1 becomes available.

**Special notes**
None.

---

## Category 5 — NFTs & Digital Ownership

**Platform mechanic:** `xpOnly` — all prior reveals active. No new reveals.

**Category arc:** Apply smart contract knowledge to the most culturally visible (and most misunderstood) blockchain application. The category begins with honest mechanics, moves to real use cases beyond art, and ends with a critical examination of hype and fraud.

---

### Chapter 5.1 — What Is an NFT?

**Missions:** 5.1.1, 5.1.2, 5.1.3, 5.1.4 (4 missions)

**Learning outcomes**
- Define an NFT as a non-fungible token: a unique, indivisible digital asset
- Explain the difference between fungible (interchangeable) and non-fungible (unique) assets
- Understand that an NFT proves ownership of a record on the blockchain, not the underlying file
- Describe the minting process: creating an NFT by deploying a smart contract interaction

**Pedagogical purpose**
NFTs are culturally loaded. Many learners arrive with strong opinions (enthusiasm or dismissal) based on media coverage. This chapter focuses on mechanics first — what an NFT technically is — before addressing value or hype. The distinction between owning the NFT record and owning the underlying file is a critical misconception to correct early (addressed in 5.1.3).

**Difficulty delta**
Accessible — applies ERC-721 concept from 4.2 to a culturally familiar domain.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
An NFT is a record of unique ownership on a blockchain. What that record is worth is a completely different question.

**Unlock effect**
Chapter 5.2 unlocks.

**Special notes**
None.

---

### Chapter 5.2 — NFTs Beyond Art

**Missions:** 5.2.1, 5.2.2, 5.2.3 (3 missions)

**Learning outcomes**
- Identify non-art NFT use cases: event tickets, gaming assets, domain names, identity credentials
- Understand the "programmable ownership" concept: NFTs with embedded smart contract logic
- Recognize that NFT utility determines long-term value more than speculative demand

**Pedagogical purpose**
The dominant cultural image of NFTs is profile picture art collections. This chapter breaks that frame and shows the underlying technology applied to use cases with clearer utility. By expanding the learner's model, it prepares them for the critical chapter (5.3) with enough context to evaluate hype claims accurately.

**Difficulty delta**
Lower — application-focused. Builds on 5.1 without introducing new core concepts.

**Completion criteria**
All 3 missions completed.

**Post-chapter message**
Tickets. Game items. Domain names. The technology is the same. The use cases are just getting started.

**Unlock effect**
Chapter 5.3 unlocks.

**Special notes**
None.

---

### Chapter 5.3 — Hype, Scams & Reality

**Missions:** 5.3.1, 5.3.2, 5.3.3, 5.3.4 (4 missions)

**Learning outcomes**
- Identify NFT-specific scam patterns: wash trading, rug pulls, fake royalties, copyright infringement
- Understand why NFT prices collapsed in 2022-2023 (speculation, liquidity, sentiment cycles)
- Apply a framework for evaluating an NFT project's genuine utility vs. speculative narrative
- Articulate the difference between the NFT technology and the NFT market bubble

**Pedagogical purpose**
The platform's commitment to honest education requires addressing failure modes. This chapter is not anti-NFT — it is pro-critical-thinking. It equips learners with pattern recognition for fraud and a framework for separating technology from market behavior. Placed at the end of Category 5, it lands after learners have a solid mechanics and use-case foundation, which makes the critical analysis credible rather than dismissive.

**Difficulty delta**
Moderate — requires synthesizing multiple concepts (market dynamics, smart contract limitations, social engineering). Scenario-based exercises (SI) simulate real decision scenarios.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
The technology is real. The hype cycle was real. Knowing the difference is what you came here for.

**Unlock effect**
Category 6 unlocks. Chapter 6.1 becomes available (with disclaimer gate).

**Special notes**
None.

---

## Category 6 — DeFi & Beyond

**Platform mechanic:** `fullDashboard` — all prior reveals active. Final reveal (`dashboardRevealed`) fires at the very last mission (6.3.4).

**Category arc:** The culmination of the curriculum. DeFi as the full expression of programmable blockchain; the broader ecosystem (DAOs, layer 2, cross-chain); synthesis of all concepts. Ends with the dashboard reveal and completion certificate.

---

### Chapter 6.1 — DeFi: Banking Without Banks

**Missions:** 6.1.1, 6.1.2, 6.1.3, 6.1.4 (4 missions)

**Learning outcomes**
- Define DeFi (decentralized finance) as financial services built on smart contracts without intermediaries
- Explain core DeFi primitives: DEX (decentralized exchange), lending/borrowing protocols, liquidity pools
- Understand the concept of yield farming and liquidity mining at a conceptual level
- Identify the key risks of DeFi: smart contract bugs, impermanent loss, protocol exploits

**Pedagogical purpose**
DeFi is smart contracts applied to finance — the most high-stakes application in the curriculum. This chapter builds directly on Chapters 3.1–3.3 (wallets, transactions, gas) and Chapter 4.1 (smart contracts). It shows how those components combine into complete financial systems. The chapter is balanced: it explains genuine innovation (permissionless lending, global liquidity) alongside genuine risks (protocol hacks, economic attack vectors).

**Difficulty delta**
Significant increase — DeFi concepts (AMMs, liquidity pools, impermanent loss) require careful scaffolding. This is the most technically dense chapter in the course. Concept refresher prompt likely to appear here.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
A bank that runs on code, has no opening hours, and accepts anyone. That's DeFi. The risks are just as real as the promise.

**Unlock effect**
Chapter 6.2 unlocks (with disclaimer gate).

**Special notes**
**DISCLAIMER GATE:** Financial disclaimer modal required before entering this chapter. Use `POST /api/v1/disclaimers/accept` with the chapter's module ID.

---

### Chapter 6.2 — The Bigger Picture

**Missions:** 6.2.1, 6.2.2, 6.2.3, 6.2.4 (4 missions)

**Learning outcomes**
- Understand DAOs (decentralized autonomous organizations) as governance structures encoded in smart contracts
- Explain layer 2 scaling solutions (rollups, sidechains) and why they exist
- Describe the concept of interoperability and cross-chain bridges
- Articulate the regulatory landscape: how different jurisdictions approach blockchain assets

**Pedagogical purpose**
This chapter zooms out from individual applications (DeFi, NFTs) to the evolving infrastructure and governance layer of the blockchain ecosystem. It introduces concepts that learners will encounter in the real world (DAO governance votes, L2 networks, regulatory news) and gives them enough context to follow those conversations. The regulatory section is deliberately factual and jurisdiction-neutral.

**Difficulty delta**
Lower than 6.1 — broader and more conceptual, less mechanically dense.

**Completion criteria**
All 4 missions completed.

**Post-chapter message**
The ecosystem keeps evolving. You now have the map to follow where it goes.

**Unlock effect**
Chapter 6.3 unlocks (with disclaimer gate).

**Special notes**
**DISCLAIMER GATE:** Financial disclaimer modal required before entering this chapter. Use `POST /api/v1/disclaimers/accept` with the chapter's module ID.

---

### Chapter 6.3 — Everything Connected

**Missions:** 6.3.1, 6.3.2, 6.3.3, 6.3.4 (4 missions)

**Learning outcomes**
- Connect all six categories into a unified mental model of the blockchain ecosystem
- Trace how a single DeFi transaction touches wallets, gas, tokens, smart contracts, and consensus
- Evaluate real-world blockchain projects using the full analytical framework built across the course
- Articulate what you know, what remains uncertain, and how to continue learning

**Pedagogical purpose**
This is the synthesis chapter. Rather than introducing new concepts, it invites learners to see the connections between everything they have studied. Mission 6.3.4 — the final mission — is deliberately metacognitive: it asks learners to reflect on their own model rather than answer a factual question. Completing this mission triggers the dashboard reveal and certificate generation, making the ending simultaneously pedagogical (synthesis) and experiential (the platform's own economy is made fully visible).

**Difficulty delta**
Moderate — synthesis requires holding many concepts simultaneously. No new mechanics to learn; the challenge is integration.

**Completion criteria**
All 4 missions completed. Mission 6.3.4 is the final mission of the entire curriculum.

**Post-chapter message**
Displayed as part of the dashboard reveal celebration screen — see `docs/progressive-reveal-spec.md` Reveal 4 section.

**Unlock effect**
Progressive reveal `dashboardRevealed` fires on 6.3.4 completion. Completion certificate generated. Full dashboard unlocked. Platform learning journey complete.

**Special notes**
**Reveal trigger:** Mission 6.3.4 triggers `dashboardRevealed` AND generates the `Certificate` record. This is the only event that generates a certificate. See `docs/progressive-reveal-spec.md`.
**DISCLAIMER GATE:** Chapter 6.2 (which precedes this chapter) has a disclaimer gate. 6.3 itself does not require a separate disclaimer — it is treated as a continuation of Category 6's acknowledged financial context.

---

## Curriculum Summary

| Category | Chapters | Missions | Platform mechanic | Reveals triggered |
|----------|----------|----------|-------------------|------------------|
| 1 — Blockchain Foundations | 3 | 11 | xpOnly | — |
| 2 — Crypto & Tokens | 3 | 12 | tokensRevealed | tokensRevealed (2.2.4) |
| 3 — Wallets & Gas | 4 | 16 | walletAndGasRevealed | walletRevealed (3.1.4), gasRevealed (3.3.3) |
| 4 — Smart Contracts | 2 | 7 | xpOnly | — |
| 5 — NFTs & Digital Ownership | 3 | 11 | xpOnly | — |
| 6 — DeFi & Beyond | 3 | 12 | fullDashboard | dashboardRevealed (6.3.4) |
| **Total** | **18** | **69** | | **4 reveals** |

**Disclaimer gates:** Chapters 2.3, 6.1, 6.2
