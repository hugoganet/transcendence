# Progressive Reveal Specification

> Applies to: `apps/web` (React 19 frontend)
> Backend contract: `GET /api/v1/users/me/reveals` returns `RevealStatus` (4 boolean flags)
> Reveal flags are set inside `completeMission()` transaction via `revealService.ts`
> Last updated: 2026-03-16

---

## Overview

The platform conceals its own economy from new learners and reveals each layer exactly when the learner has earned the conceptual vocabulary to understand it. This is not gamification for its own sake — each reveal moment is a pedagogical payoff: the learner has just studied the concept in the abstract, and now the platform demonstrates it concretely by activating it in front of them.

Reveals are one-way and permanent. Once a flag is `true`, it stays `true`. The frontend must check `RevealStatus` on every authenticated page load and store it in global state.

---

## Reveal 1 — Knowledge Tokens

### Mission ID and Title

**Mission 2.2.4** — final mission of Chapter 2.2 "Coins, Tokens & the Crypto Zoo"

### Trigger Condition

`completeMission("2.2.4")` sets `User.revealTokens = true` inside the Prisma transaction. The API response for this completion includes `{ reveals: { tokens: true } }` in the `CompleteMissionResponse`. The flag is also available at any time via `GET /api/v1/users/me/reveals`.

### Pedagogical Justification

By the end of mission 2.2.4, the learner has completed four missions covering the distinction between coins (native blockchain currency) and tokens (assets built on top of a blockchain), utility tokens vs. governance tokens, and why digital assets can hold value. They now understand the concept of a token as a unit of value native to a digital system.

Revealing the Knowledge Token balance at this exact moment creates a direct bridge from abstract concept to lived experience. The learner has just studied what tokens are — and they immediately discover they have been accumulating them all along without knowing it. The surprise and the "aha" are simultaneous. This is pedagogically more powerful than either explaining the token system upfront (abstract, unmotivated) or revealing it randomly later (disconnected from learning).

### Reveal Screen Copy

**Title:** Your tokens just appeared.

**Body:** You've been earning Knowledge Tokens since your very first mission — you just couldn't see them yet. Now that you understand what tokens are, they're yours to watch. Every mission you complete adds to your balance.

**CTA Button:** See my tokens

### Post-Reveal UI State

The following elements become visible for the first time and must remain visible on all subsequent sessions:

- Token balance display in the navigation bar (e.g., "340 KT")
- Token balance card on the profile/dashboard page
- Transaction history accessible via profile (list of EARN entries)
- Token balance shown on the mission completion screen after each mission
- Token reward preview ("+ 10 KT") shown before starting a mission

Nothing is hidden again after this point. If the user reloads, closes the app, or returns days later, all token UI remains visible.

### Connection to Learning

The reveal is a live demonstration of what the learner just studied. Tokens are units of value on a digital system — the platform is that system, and the learner is holding proof. The copy explicitly names this ("You've been earning Knowledge Tokens since your very first mission") to make the connection explicit rather than leaving it implicit.

### Implementation Note for JB

1. Read `revealStatus.tokens` from global auth/user state (populated from `GET /api/v1/users/me/reveals` on login and after every `completeMission` call).
2. When `completeMission("2.2.4")` response arrives and `reveals.tokens` transitions from `false` to `true`, trigger the reveal modal before navigating to the next screen.
3. The reveal modal must be a full-screen or large overlay (not a toast) — this is a milestone moment, not a notification.
4. After the user dismisses the modal via CTA, navigate to the token balance view or resume normal flow.
5. Token UI components (`<TokenBalance />`, `<NavTokenDisplay />`) should be conditionally rendered based on `revealStatus.tokens`. Use a single context value — do not scatter conditional checks.
6. Suggested state shape: `useRevealStore()` Zustand store with `{ tokens, wallet, gas, dashboard }` booleans, hydrated on app load from `/users/me/reveals`.

---

## Reveal 2 — Wallet Interface

### Mission ID and Title

**Mission 3.1.4** — final mission of Chapter 3.1 "Your Digital Wallet"

### Trigger Condition

`completeMission("3.1.4")` sets `User.revealWallet = true`. Response includes `{ reveals: { wallet: true } }`.

### Pedagogical Justification

Chapter 3.1 ("Your Digital Wallet") covers what a wallet is, why it holds keys rather than coins, the difference between custodial and non-custodial wallets, and the concept of a wallet address as identity. After four missions on this topic, the learner has a complete mental model of the wallet as a control interface for a blockchain address.

At this moment, transforming their profile page into a wallet-style interface is not decorative — it is a direct application of what they learned. Their profile now looks like a wallet because, structurally, it is one: it holds their address (user ID), their balance, and a transaction history. Seeing this transformation makes the abstraction concrete and memorable.

Placing this reveal at mission 3.1.4 (the chapter's final mission, immediately before gas fees and transaction mechanics) also sets the stage perfectly: the learner now has a wallet and will, in the next chapter, learn how to use it to make transactions.

### Reveal Screen Copy

**Title:** Your profile just became a wallet.

**Body:** A wallet doesn't hold coins — it holds the keys that prove what's yours. Your profile on this platform now works the same way: it's your address, your balance, and your transaction record all in one place. Welcome to your wallet.

**CTA Button:** Open my wallet

### Post-Reveal UI State

- Profile page redesigned as a wallet interface: prominent address display (user ID), balance, transaction history tab
- Navigation item renamed or restyled from "Profile" to "Wallet" (or shows a wallet icon)
- Token history now framed as "transaction history" with EARN/GAS_SPEND entries
- User avatar section remains but is secondary to the wallet data display

### Connection to Learning

The profile's visual transformation from "account page" to "wallet interface" mirrors the conceptual transformation the learner just completed. They learned that a wallet is a control surface, not a container — and now they see their own profile through that lens.

### Implementation Note for JB

1. `revealStatus.wallet` gates the wallet layout variant of the profile page.
2. Use a layout fork: `<ProfilePage />` renders either `<ProfileLayout />` (pre-reveal) or `<WalletLayout />` (post-reveal) based on `revealStatus.wallet`.
3. `<WalletLayout />` is a new component that displays address, balance, and transaction history in a wallet-style UI (teal/amber design tokens, monospace address display).
4. Trigger the full-screen reveal modal on the `completeMission("3.1.4")` response before navigating away.
5. Navigation label/icon update should happen immediately after modal dismiss, not before.

---

## Reveal 3 — Gas Fees

### Mission ID and Title

**Mission 3.3.3** — third mission of Chapter 3.3 "Gas Fees"

### Trigger Condition

`completeMission("3.3.3")` sets `User.revealGas = true`. Response includes `{ reveals: { gas: true } }`.

Note: this is mission 3 of 4 in the chapter, not the final mission. The reveal fires mid-chapter deliberately (see pedagogical justification).

### Pedagogical Justification

Chapter 3.3 teaches gas fees: what they are, why they exist (incentivising validators), how they're calculated, and how to minimize them. By the end of mission 3.3.3, the learner understands that every on-chain action costs gas, that gas is deducted from your wallet, and that this is a feature of the system's incentive design rather than a bug.

Activating gas fees on exercise submissions at this precise moment — mid-chapter, with one mission still to go — creates a uniquely powerful learning moment. The learner has studied gas conceptually for three missions and now experiences it personally: their next exercise submission will cost 2 tokens. The cost is real (their balance decreases), proportionate (2 tokens, minor), and expected (they just learned this would happen). This is controlled immersion: the learner is prepared, so the experience reinforces rather than frustrates.

Placing the activation at mission 3.3.3 rather than 3.3.4 (the chapter end) means the learner will encounter their first gas deduction while still in the Gas Fees chapter — the pedagogical container is intact. They finish the chapter having both learned about gas and experienced it.

### Reveal Screen Copy

**Title:** Gas fees are now active.

**Body:** Every exercise submission on this platform now costs 2 Knowledge Tokens — just like every transaction on a real blockchain costs gas. This is how you experience what you've been studying. Your balance is yours to manage.

**CTA Button:** I understand, continue

### Post-Reveal UI State

- Gas cost indicator ("2 KT") appears on exercise submission buttons and exercise start screens
- Token balance in navigation bar updates in real time after each submission
- Transaction history shows GAS_SPEND entries alongside EARN entries
- If user balance drops below 0 (debt), a warning indicator appears on the wallet/profile page
- Gas fee line item is shown on the mission completion summary screen

### Connection to Learning

This reveal is the platform's most direct act of learning-by-doing. The abstract concept (gas = cost of on-chain action) becomes immediate and personal (each answer attempt costs 2 tokens). The copy is intentionally direct about this ("This is how you experience what you've been studying"), because transparency about the pedagogical mechanism increases trust and engagement.

### Implementation Note for JB

1. `revealStatus.gas` gates the gas cost display on all exercise components.
2. Exercise submission button: before reveal = standard CTA; after reveal = shows "Submit (−2 KT)" or a gas indicator badge.
3. Gas is deducted server-side regardless of `revealGas` status (the backend charges gas after 3.3.3 completes). The frontend reveal is purely visual — do not add client-side gas logic.
4. After `completeMission("3.3.3")` response, show the full-screen reveal modal. On dismiss, return user to the chapter missions list (mission 3.3.4 is now available).
5. Token balance in nav must reactively update after every exercise submission (use Socket.IO `notification:push` or refetch `/tokens/balance` after submission response).
6. Debt state: if `tokenBalance < 0`, show a persistent amber warning in the wallet view. Do not block navigation — only starting new missions is blocked server-side.

---

## Reveal 4 — Full Dashboard & Certificate

### Mission ID and Title

**Mission 6.3.4** — final mission of Chapter 6.3 "Everything Connected" — the last mission of the entire curriculum

### Trigger Condition

`completeMission("6.3.4")` sets `User.revealDashboard = true` and simultaneously generates the completion certificate (`Certificate` record created). Response includes `{ reveals: { dashboard: true }, certificate: { shareToken, ... } }`.

This is the only reveal that happens at curriculum completion. It is also the only event in the system that generates a certificate.

### Pedagogical Justification

Category 6 covers DeFi, the broader blockchain ecosystem, and the interconnectedness of all concepts studied. Chapter 6.3 ("Everything Connected") is explicitly about synthesis — bringing together wallets, gas, tokens, smart contracts, NFTs, and DeFi into a unified picture.

Unlocking the full dashboard and certificate at the final mission is the correct culmination of the progressive reveal arc. The learner has watched the platform reveal itself in layers throughout their journey, mirroring how blockchain systems reveal their complexity gradually to practitioners. The final reveal — a complete analytics dashboard showing their full learning path, all tokens earned, all gas spent, all milestones reached — is both a reward and a mirror: here is everything you did, expressed in the same language the platform has been teaching you.

The certificate is the human-scale counterpart: shareable, permanent proof of completion.

### Reveal Screen Copy

**Title:** You've reached the end. The dashboard is yours.

**Body:** You started with no tokens, no wallet, and no gas costs. You've earned them all by learning how they work. Your full learning dashboard is now unlocked — every mission, every token, every transaction, all in one place. And your completion certificate is ready to share.

**CTA Button:** Open my dashboard

### Post-Reveal UI State

- Full stats dashboard unlocked: total missions completed (69/69), total tokens earned, total gas spent, net balance, completion date, learning time, achievement summary
- Category-by-category breakdown of progress (all 6 categories shown as completed)
- Certificate section with learner name, completion date, and unique share link
- Social share buttons for certificate (link to `GET /certificates/:shareToken`)
- "Course completed" badge visible on profile/wallet page

### Connection to Learning

The dashboard expresses the learner's entire journey in the vocabulary of the blockchain economy: tokens earned, gas spent, net balance. These are not arbitrary metrics — they are the exact concepts the learner studied, applied to their own learning history. The "net balance" (tokens earned minus gas spent) is the learner's own P&L for their blockchain education journey.

### Implementation Note for JB

1. `revealStatus.dashboard` gates the full dashboard view. Before this flag is set, the dashboard route should either be absent from navigation or show a locked/preview state.
2. On `completeMission("6.3.4")` response, this reveal requires a distinct, full-screen celebration screen — not just the standard reveal modal. This is the end of the curriculum.
3. The celebration screen sequence: (a) confetti / celebration animation, (b) reveal modal copy, (c) certificate preview with share button, (d) CTA to open dashboard.
4. Certificate share URL: `/certificates/:shareToken` — this is a public, unauthenticated route. The share button should copy the URL to clipboard and/or open native share sheet.
5. The full dashboard component (`<DashboardView />`) aggregates data from multiple endpoints: `/tokens/balance`, `/tokens/history`, `/gamification/achievements`, `/gamification/streak`, `/curriculum/` (for completion stats). Fetch all in parallel.
6. Do not show the dashboard nav item at all before `revealStatus.dashboard`. Add it to the nav dynamically on reveal.

---

## Frontend State Management Summary

| Flag | API field | Reveal modal | Nav change | Page unlock |
|------|-----------|--------------|------------|-------------|
| `revealTokens` | `revealTokens` | Full-screen modal | Token balance in nav bar | Token balance page |
| `revealWallet` | `revealWallet` | Full-screen modal | Profile → Wallet label | Wallet layout on profile |
| `revealGas` | `revealGas` | Full-screen modal | Gas indicator on exercise buttons | Gas history in wallet |
| `revealDashboard` | `revealDashboard` | Celebration screen | Dashboard in nav | Full dashboard + certificate |

**Hydration order on app load:**
1. Fetch `GET /api/v1/users/me/reveals` after authentication.
2. Populate `useRevealStore` with the 4 flags.
3. All conditional renders read from this store — never directly from local component state.
4. After every `completeMission` call, merge the response's `reveals` object into the store.

**Reveal modal must not be shown again** on subsequent sessions. Track in-session modal display state separately from the persistent flag. The flag persisting as `true` is sufficient — the modal fires only on the response that first sets it to `true`.
