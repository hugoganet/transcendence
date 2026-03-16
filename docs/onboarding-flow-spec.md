# Onboarding Flow Spec

> Version: 1.0
> Author: UX Design
> Last updated: 2026-03-16
> For implementation by: JB
> Depends on: `progressive-reveal-spec.md`, `curriculum-syllabus.md`, `apps/api/src/routes/auth.ts`

---

## Overview

Onboarding covers everything from first landing to the moment the user completes Chapter 1.1 (3 missions) and sees their first chapter completion screen. At the end of onboarding the user has:

- A verified account (email/password or Google/Facebook OAuth)
- A chosen username (if OAuth did not provide a display name)
- Understood what the platform does and how missions work
- Completed 3 real missions (Chapter 1.1 — "The Trust Problem")
- Earned their first XP (3 points) and seen a chapter completion celebration
- Been given a clear teaser that something more is coming in Category 2 (the first hint of the progressive reveal arc)

The platform mechanic during all of Category 1 is `xpOnly` — no tokens visible, no gas, no wallet. The UI is clean and minimal. No gamification complexity is surfaced until the learner has earned the conceptual vocabulary to understand it.

---

## Flow Diagram

```
[Screen 1: Landing / Sign Up]
        |
        |-- Email/password -------> [Screen 2: Email Verification Gate]
        |                                   |
        |-- Google OAuth ------\            |
        |                       \--> [Screen 3: Username Setup]
        |-- Facebook OAuth ----/     (only if display name missing)
                                            |
                                            v
                               [Screen 4: Welcome Splash]
                               (first login only — never shown again)
                                            |
                                            v
                               [Screen 5: Motivation Check]
                               ("What brings you here?" — 1 screen)
                                            |
                                            v
                               [Screen 6: First Mission Intro]
                               (explains how SI exercises work)
                                            |
                                            v
                               [Screen 7: Mission 1.1.1 — Exercise Flow]
                                            |
                               [Screen 8: First Correct Answer Moment]
                               (celebration + XP explanation)
                                            |
                               [Screen 9: Mission 1.1.1 Complete]
                                            |
                               [Screen 10: Mission 1.1.2 — seamless chain]
                                            |
                               [Screen 11: Mission 1.1.3 — seamless chain]
                                            |
                               [Screen 12: Chapter 1.1 Complete]
                               (mini celebration, XP summary)
                                            |
                                            v
                               [Screen 13: End of Category 1 (after Ch 1.2 + 1.3)]
                               (achievement unlock + token reveal teaser)
                                            |
                                            v
                               [Dashboard — Home Screen]
```

**Note:** Screens 10–13 are not shown immediately after Screen 9. Missions 1.1.2 and 1.1.3 follow the same exercise pattern as 1.1.1. Screen 12 fires after the third mission of Chapter 1.1 is complete. Screen 13 fires after the user completes Category 1's final chapter (1.3). The diagram shows logical sequence, not a continuous session.

---

## Screen 1: Landing / Sign Up

**Route:** `/`
**Goal:** User creates an account or signs in. First emotional impression: calm, safe, not a crypto exchange.
**Shown to:** Unauthenticated visitors only. Authenticated users are redirected to `/home`.

### Layout

Full-screen centered layout. Background: off-white (`#F9F7F4`). No navigation bar. No crypto imagery. No price tickers. No neon. One ambient illustration (abstract interconnected nodes — subtle, teal-tinted, non-representational).

### Copy — EN

| Element | Text |
|---------|------|
| Headline | Blockchain, explained simply. |
| Subheadline | A 10-minute-a-day course that takes you from zero to genuinely understanding crypto. No jargon. No pressure. |
| Primary CTA | Create free account |
| Secondary CTA | Sign in |
| Google OAuth button | Continue with Google |
| Facebook OAuth button | Continue with Facebook |
| Legal microcopy | By continuing, you agree to our Terms of Service and Privacy Policy. |
| Trust signal (below fold) | No crypto wallet required. No real money involved. Just learning. |

### Copy — FR

| Element | Text |
|---------|------|
| Headline | La blockchain, expliquée simplement. |
| Subheadline | Un cours de 10 minutes par jour pour passer de zéro à vraiment comprendre la crypto. Sans jargon. Sans pression. |
| Primary CTA | Créer un compte gratuit |
| Secondary CTA | Se connecter |
| Google OAuth button | Continuer avec Google |
| Facebook OAuth button | Continuer avec Facebook |
| Legal microcopy | En continuant, vous acceptez nos Conditions d'utilisation et notre Politique de confidentialité. |
| Trust signal | Aucun portefeuille crypto requis. Aucun argent réel. Juste de l'apprentissage. |

### Form — Email/Password Path

Fields: Email address, Password (min 8 chars), Age confirmation checkbox ("I confirm I am 13 years or older").

Inline validation: real-time on blur. Error messages are direct and calm — no red screens. Example: "That email is already registered. Sign in instead?" with a link to `/login`.

**Password strength indicator:** 3-bar visual (weak / good / strong). No score labels — just color (amber / teal / teal-dark). Appears on focus, not on page load.

### Logic

- Email/password submit → `POST /api/v1/auth/register` → on 201 → redirect to Screen 2 (email verification)
- Google OAuth → `GET /api/v1/auth/google` → callback `GET /api/v1/auth/google/callback?success=true` → check if `user.username` exists → route to Screen 3 (no username) or Screen 4 (has display name)
- Facebook OAuth → same pattern via `/api/v1/auth/facebook`
- Returning user taps "Sign in" → login form inline (same page, no navigation). On login → if `user.isFirstLogin` → Screen 4. If returning user → Dashboard.
- If OAuth callback returns `error=oauth_failed` → show inline error: "Something went wrong connecting to [provider]. Try again or use email instead."

---

## Screen 2: Email Verification Gate

**Route:** `/verify-email`
**Goal:** User confirms their email before accessing the platform. Shown only for email/password registration — not for OAuth paths.

### Layout

Centered card on the same off-white background as Screen 1. Calm, non-urgent. No countdown timer.

### Copy — EN

| Element | Text |
|---------|------|
| Headline | Check your inbox. |
| Body | We sent a confirmation link to **{email}**. Click it to activate your account — it takes about 10 seconds. |
| Resend link | Didn't get it? Resend the email |
| Spam note | Check your spam folder if you don't see it within a minute. |
| Resend confirmation | Email resent. Give it a minute. |
| Wrong email? | Entered the wrong address? Go back |

### Copy — FR

| Element | Text |
|---------|------|
| Headline | Vérifiez votre boîte mail. |
| Body | Nous avons envoyé un lien de confirmation à **{email}**. Cliquez dessus pour activer votre compte — ça prend environ 10 secondes. |
| Resend link | Vous ne l'avez pas reçu ? Renvoyer l'email |
| Spam note | Vérifiez vos spams si vous ne le voyez pas dans la minute. |
| Resend confirmation | Email renvoyé. Patientez un moment. |
| Wrong email? | Mauvaise adresse ? Retourner en arrière |

### Logic

- Page polls or waits for user to click the verification link in their email.
- Verification link hits a backend route → marks email as verified → redirects to `/auth/callback?success=true`.
- On callback success: check `user.username` → route to Screen 3 (no username) or Screen 4 (has username).
- Resend: rate-limited. After 3 requests in 15 minutes, resend button is disabled with label "Too many requests — try again in 15 minutes."

---

## Screen 3: Username Setup

**Route:** `/onboarding/username`
**Goal:** User picks a display name. Required for OAuth users whose provider did not return a usable display name, or where the name conflicts with an existing user.
**Shown to:** New users without a `username` field set. Skipped entirely if the user already has a username.

### Layout

Centered card. Single field. Minimal. The headline does the emotional work — this is the first moment we address the user directly by their future name.

### Copy — EN

| Element | Text |
|---------|------|
| Headline | What should we call you? |
| Body | This is the name other learners will see. You can change it later in settings. |
| Field label | Your display name |
| Field placeholder | e.g. Alex, sarah_learns, curious_marc |
| Validation — too short | Needs to be at least 3 characters |
| Validation — taken | That name is taken. Try adding a number or a word. |
| Validation — invalid chars | Only letters, numbers, and underscores, please. |
| CTA | Continue |

### Copy — FR

| Element | Text |
|---------|------|
| Headline | Comment vous appeler ? |
| Body | C'est le nom que les autres apprenants verront. Vous pourrez le modifier plus tard dans les paramètres. |
| Field label | Votre nom d'affichage |
| Field placeholder | ex. Alex, sarah_apprend, marc_curieux |
| Validation — too short | Il faut au moins 3 caractères |
| Validation — taken | Ce nom est déjà pris. Essayez d'ajouter un chiffre ou un mot. |
| Validation — invalid chars | Lettres, chiffres et tirets bas uniquement, s'il vous plaît. |
| CTA | Continuer |

### Logic

- Availability check: debounced `GET /api/v1/users/check-username?q={name}` after 400ms of no input. Shows inline indicator (checking... / available / taken).
- Submit → `PATCH /api/v1/users/me` with `{ username }` → on success → Screen 4.
- Validation is server-confirmed on submit, not just client-side.

---

## Screen 4: Welcome Splash

**Route:** `/welcome`
**Goal:** Set the emotional tone and expectations for the platform. Show 3 value propositions. Confirm the user is in the right place. This is the first time the platform speaks to the user directly as a learner.
**Shown to:** First login only. Detected via `user.isFirstLogin` flag (or absence of any completed missions). Never shown to returning users.

### Layout

Full-screen, centered. Warm background (teal tint, very subtle — `#F0F7F7`). Three value prop cards arranged vertically (mobile) or as a row (desktop). No bottom nav yet — the nav appears after this screen.

### Copy — EN

| Element | Text |
|---------|------|
| Welcome greeting | Welcome, {username}. |
| Subheadline | You're about to learn how blockchain actually works — through doing, not reading. Here's what to expect. |
| Value prop 1 — icon: puzzle piece | **Bite-sized missions** — Each lesson takes 3 to 5 minutes. Do one on your commute. Do three on a slow afternoon. There's no pressure. |
| Value prop 2 — icon: shield | **No jargon, no prior knowledge needed** — Everything is explained in plain language, with real-world comparisons. If you've ever wondered what people mean by "on the blockchain," you're in the right place. |
| Value prop 3 — icon: chart growing | **The platform teaches through its own mechanics** — As you learn about tokens, wallets, and gas fees, you'll discover you've been experiencing them here all along. |
| Primary CTA | Start learning |
| Secondary link (below CTA) | What is this course about? (expands a short paragraph inline — see below) |

**What is this course about? (expanded inline — EN):**
> Transcendence is a structured course covering blockchain from the ground up — distributed ledgers, Bitcoin, Ethereum, smart contracts, tokens, NFTs, DeFi, and wallets. It's 69 bite-sized missions organized into 6 categories. Most people finish a category per week at a casual pace. There are no timed tests, no grades, and no subscription required.

### Copy — FR

| Element | Text |
|---------|------|
| Welcome greeting | Bienvenue, {username}. |
| Subheadline | Vous êtes sur le point d'apprendre comment fonctionne vraiment la blockchain — en pratiquant, pas en lisant. Voici ce qui vous attend. |
| Value prop 1 | **Des missions courtes** — Chaque leçon dure 3 à 5 minutes. Faites-en une dans les transports. Faites-en trois un après-midi tranquille. Aucune pression. |
| Value prop 2 | **Aucun jargon, aucun prérequis** — Tout est expliqué en langage clair, avec des comparaisons concrètes. Si vous avez déjà voulu savoir ce que les gens entendent par « sur la blockchain », vous êtes au bon endroit. |
| Value prop 3 | **La plateforme enseigne à travers ses propres mécaniques** — Au fur et à mesure que vous apprenez ce que sont les tokens, les portefeuilles et les frais de gas, vous découvrirez que vous les avez vécus ici depuis le début. |
| Primary CTA | Commencer à apprendre |
| Secondary link | Qu'est-ce que ce cours ? (se déroule en ligne) |

**Expanded inline — FR:**
> Transcendence est un cours structuré couvrant la blockchain de A à Z — registres distribués, Bitcoin, Ethereum, contrats intelligents, tokens, NFT, DeFi et portefeuilles. Il comprend 69 missions courtes organisées en 6 catégories. La plupart des gens finissent une catégorie par semaine à un rythme décontracté. Pas d'examens chronométrés, pas de notes, pas d'abonnement requis.

### Logic

- "Start learning" → Screen 5 (Motivation Check).
- `isFirstLogin` flag set to `false` on backend the moment this screen is rendered/confirmed (or on Screen 5 submit). Either approach is acceptable — what matters is that it never shows again.

---

## Screen 5: Motivation Check

**Route:** `/onboarding/why` (part of onboarding wizard, no back nav)
**Goal:** Personalize the experience lightly. Understand why the user is here so the platform can tailor post-mission copy and progress framing. This is also the platform's first interactive moment — it models the question/answer pattern of missions.
**Shown to:** First-time users only, immediately after Screen 4.

### Layout

Centered card. Single question. Three tap-to-select answer cards (no dropdowns, no radio buttons — large touch targets, full-width on mobile).

### Copy — EN

| Element | Text |
|---------|------|
| Question | What brings you here? |
| Body | There's no wrong answer. This helps us frame your progress in a way that's meaningful to you. |
| Option A | I want to invest in crypto without feeling lost. |
| Option B | I want to understand blockchain — I keep hearing about it at work or in the news. |
| Option C | I'm just curious. I don't have a specific goal yet. |
| CTA (after selection) | Let's go |

### Copy — FR

| Element | Text |
|---------|------|
| Question | Qu'est-ce qui vous amène ici ? |
| Body | Il n'y a pas de mauvaise réponse. Cela nous aide à formuler votre progression d'une façon qui vous parle. |
| Option A | Je veux investir dans la crypto sans me sentir perdu(e). |
| Option B | Je veux comprendre la blockchain — j'en entends parler partout au travail ou dans l'actualité. |
| Option C | Je suis juste curieux/curieuse. Je n'ai pas encore d'objectif précis. |
| CTA | C'est parti |

### Logic

- User must tap one option before CTA activates. Selected state: card gets a teal left border and a checkmark icon.
- Selection saved to backend: `PATCH /api/v1/users/me` with `{ motivation: "invest" | "understand" | "curious" }`.
- All three paths continue to Screen 6 — no branching in the flow. Motivation is used for copy personalization in post-mission summaries later (not implemented in MVP if needed).
- Skipping is not offered. This is a one-tap interaction with zero cognitive cost.

---

## Screen 6: First Mission Intro

**Route:** `/onboarding/how-it-works`
**Goal:** Set expectations for how missions and exercises work before the user enters the first real mission. This is a single informational screen — not a tutorial, not a walkthrough. The user does not need to do anything here except read and tap Continue.

This screen exists because Mission 1.1.1 opens with an interactive placement exercise (drag-and-drop). Without a one-sentence primer, the first interaction might surprise the user. One screen of context is sufficient — do not over-explain.

### Layout

Centered card with three short instruction items (icon + 1-2 sentence each). Bottom: single CTA button.

### Copy — EN

| Element | Text |
|---------|------|
| Headline | Here's how a mission works. |
| Item 1 — icon: hand with gesture | **You do, not just read.** Each mission is an interactive exercise — dragging, matching, stepping through a process. No long walls of text. |
| Item 2 — icon: checkmark circle | **Feedback is immediate.** When you submit an answer, you'll see right away if it was correct — and a brief explanation of why. |
| Item 3 — icon: plus XP badge | **Progress is real.** Each completed mission earns you XP. You'll see it add up as you go. |
| CTA | Start my first mission |

### Copy — FR

| Element | Text |
|---------|------|
| Headline | Voici comment fonctionne une mission. |
| Item 1 | **Vous pratiquez, vous ne lisez pas.** Chaque mission est un exercice interactif — glisser-déposer, associer des concepts, suivre un processus étape par étape. Pas de longs textes. |
| Item 2 | **Le retour est immédiat.** Quand vous soumettez une réponse, vous voyez immédiatement si c'est correct — et une brève explication du pourquoi. |
| Item 3 | **La progression est réelle.** Chaque mission complétée vous rapporte des XP. Vous les verrez s'accumuler au fil du temps. |
| CTA | Commencer ma première mission |

### Logic

- "Start my first mission" → triggers `GET /api/v1/curriculum/missions/1.1.1` → renders Mission 1.1.1 (Screen 7).
- This screen is shown exactly once — immediately before the user's very first mission. It is part of the onboarding wizard and is never shown again.
- No back button. No skip. This screen is 10 seconds of reading maximum.

---

## Screen 7: Mission 1.1.1 — Exercise Flow

**Route:** `/missions/1.1.1`
**Goal:** The user completes their first real mission. Mission 1.1.1 is the first mission of Chapter 1.1 "The Trust Problem." It introduces the core problem blockchain solves — why we can't trust strangers in digital transactions — through an interactive placement exercise.

### Mission Intro Card (first thing shown when mission opens)

This is a 1–2 sentence context-setter that appears before the first exercise. It is not a lesson — it is an orienting sentence that tells the user what question they are about to explore.

**EN:**
> **What is the trust problem?**
> Every time you send money online or make a digital agreement with a stranger, you're relying on someone in the middle to make sure nobody cheats. This mission explores why that matters — and why it's a harder problem than it looks.

**FR:**
> **Quel est le problème de confiance ?**
> Chaque fois que vous envoyez de l'argent en ligne ou passez un accord numérique avec un inconnu, vous faites confiance à un intermédiaire pour s'assurer que personne ne triche. Cette mission explore pourquoi c'est important — et pourquoi c'est un problème plus difficile qu'il n'y paraît.

**CTA on intro card:**
- EN: "Begin"
- FR: "Commencer"

### Exercise Layout

Standard `<ExerciseContainer>` component. Header: mission title ("The Trust Problem — 1 of 3") + XP progress indicator (e.g., "XP: 0"). No token balance shown (not yet revealed). No gas indicator (not yet active).

Exercise type for Mission 1.1.1: **Interactive Placement** (drag-and-drop ordering).

Prompt (EN): *"A buyer and a seller want to trade online — but they've never met. Arrange the steps of a typical bank transfer in the correct order to show how a bank solves the trust problem."*

Prompt (FR): *"Un acheteur et un vendeur veulent échanger en ligne — mais ils ne se connaissent pas. Placez les étapes d'un virement bancaire classique dans le bon ordre pour montrer comment une banque résout le problème de confiance."*

Items to order (EN): Buyer sends payment to bank / Bank holds funds in escrow / Bank verifies both parties / Seller confirms delivery / Bank releases funds to seller

Items to order (FR): L'acheteur envoie le paiement à la banque / La banque conserve les fonds en séquestre / La banque vérifie les deux parties / Le vendeur confirme la livraison / La banque libère les fonds au vendeur

### Logic

- Drag-and-drop on mobile (touch), drag on desktop. Items snap to slots.
- Submit button activates only after all items have been placed.
- Submission → Screen 8 (first correct answer moment) or inline incorrect feedback.
- For incorrect: `<FeedbackBanner>` variant `incorrect` — calm, neutral. No red screen.
  - EN: "Not quite. Look at the role the bank plays at each step — it's always the one holding or releasing control."
  - FR: "Pas tout à fait. Observez le rôle que joue la banque à chaque étape — c'est toujours elle qui retient ou libère le contrôle."
  - Below: "Try again" button. No penalty during Category 1 (gas not active yet).

---

## Screen 8: First Correct Answer Moment

**Route:** (overlay on `/missions/1.1.1` — full-screen feedback state, not a new route)
**Goal:** Celebrate the user's first correct answer in a way that is warm but not over-the-top. Explain what XP is. Leave the user feeling capable and curious, not merely rewarded.

This is a critical moment. The user has just completed their first real interaction. The response must feel like a teacher saying "exactly right — here's why that matters," not a slot machine saying "YOU WIN!"

### Layout

Full-screen overlay (above the exercise). Teal background, very soft. Large checkmark icon (teal). No confetti — this is calm, not a party. Satisfaction without fanfare.

### Copy — EN

| Element | Text |
|---------|------|
| Confirmation mark | ✓ (large, teal, centered) |
| Headline | That's exactly right. |
| Explanation | The bank is the trusted middleman — it holds the money, verifies identities, and only releases funds when conditions are met. Without it, neither party could safely transact with a stranger. Blockchain will later offer a different answer to this same problem. |
| XP callout | **+1 XP** — you've completed your first exercise. |
| XP explanation | XP tracks your activity on the platform. You earn 1 per completed mission — think of it as your learning history. |
| CTA | Continue |

### Copy — FR

| Element | Text |
|---------|------|
| Confirmation mark | ✓ |
| Headline | C'est exactement ça. |
| Explanation | La banque est l'intermédiaire de confiance — elle conserve l'argent, vérifie les identités et ne libère les fonds que lorsque les conditions sont remplies. Sans elle, aucune des deux parties ne pourrait transacter en sécurité avec un inconnu. La blockchain proposera plus tard une réponse différente à ce même problème. |
| XP callout | **+1 XP** — vous avez terminé votre premier exercice. |
| XP explanation | Les XP suivent votre activité sur la plateforme. Vous en gagnez 1 par mission complétée — considérez-les comme votre historique d'apprentissage. |
| CTA | Continuer |

### Logic

- This overlay fires only on the user's first correct answer across their entire account lifetime (check `user.totalMissionsCompleted === 0` before the current mission completes).
- Subsequent correct answers within missions use the standard `<FeedbackBanner>` component (smaller, inline) — not this full-screen moment.
- "Continue" → advances to the next exercise within Mission 1.1.1, or if 1.1.1 is complete → Screen 9.

---

## Screen 9: Mission 1.1.1 Complete

**Route:** (overlay or full-screen transition, no new URL — stays at `/missions/1.1.1` until user taps Continue)
**Goal:** Confirm the mission is done. Show XP earned. Surface the natural next action. Keep the user in flow.

### Layout

`<MissionComplete>` component. Clean, centered. Warm background (`#F9F7F4`). No fireworks. A clean summary card with the mission title, XP earned, a one-line summary of what was learned, and two actions: Continue to next mission or view the Curriculum Map.

### Copy — EN

| Element | Text |
|---------|------|
| Label | Mission complete |
| Mission title | 1.1.1 — The Trust Problem |
| XP earned | +1 XP |
| What you learned | You can explain why digital strangers can't transact safely without a trusted third party. |
| Next mission label | Up next: |
| Next mission title | 1.1.2 — The Cost of Middlemen |
| Primary CTA | Continue |
| Secondary CTA | View curriculum map |

### Copy — FR

| Element | Text |
|---------|------|
| Label | Mission terminée |
| Mission title | 1.1.1 — Le problème de confiance |
| XP earned | +1 XP |
| What you learned | Vous pouvez expliquer pourquoi des inconnus ne peuvent pas transacter en toute sécurité sans un tiers de confiance. |
| Next mission label | Prochaine mission : |
| Next mission title | 1.1.2 — Le coût des intermédiaires |
| Primary CTA | Continuer |
| Secondary CTA | Voir le programme |

### Logic

- "Continue" → seamless transition to Mission 1.1.2. No page reload. No decision menu. The SPA makes this feel like one continuous session.
- "View curriculum map" → `/curriculum` — the user leaves the mission flow and enters the curriculum overview. Progress is already saved. They can return to the next mission from there.
- If the user closes the app (or navigates away without tapping either CTA), progress is saved. On next session, the home screen surfaces Mission 1.1.2 as "Up next."
- No streak display yet — streak UI is not shown until after Chapter 1.1 is complete (reduces cognitive load in the first session).

---

## Screens 10–11: Missions 1.1.2 and 1.1.3

**Route:** `/missions/1.1.2`, `/missions/1.1.3`
**Goal:** Complete Chapter 1.1. Each mission follows the exact same structure as Mission 1.1.1: intro card → exercise flow → feedback → mission complete card. No new UX elements are introduced here.

### Mission Intro Cards

**Mission 1.1.2 — EN:**
> **The cost of middlemen**
> Banks solve the trust problem — but at a price. Transaction fees, processing delays, geographic exclusions: these are the costs of centralized trust. This mission asks you to weigh them.

**Mission 1.1.2 — FR:**
> **Le coût des intermédiaires**
> Les banques résolvent le problème de confiance — mais à un prix. Frais de transaction, délais de traitement, exclusions géographiques : ce sont les coûts de la confiance centralisée. Cette mission vous invite à les évaluer.

**Mission 1.1.3 — EN:**
> **Single points of failure**
> When trust depends on one institution, that institution becomes a target — for hackers, for governments, for failure. This mission explores what happens when the middleman can't be trusted anymore.

**Mission 1.1.3 — FR:**
> **Les points de défaillance uniques**
> Lorsque la confiance dépend d'une seule institution, cette institution devient une cible — pour les pirates, pour les gouvernements, pour la défaillance. Cette mission explore ce qui se passe quand l'intermédiaire lui-même n'est plus fiable.

### Logic

- Same as Mission 1.1.1. No new onboarding elements.
- After Mission 1.1.2 completes → seamless chain to 1.1.3. Mission complete card shows next mission as "1.1.3 — Single Points of Failure."
- After Mission 1.1.3 completes → triggers Chapter 1.1 complete state (Screen 12).

---

## Screen 12: Chapter 1.1 Complete

**Route:** (full-screen transition after Mission 1.1.3 complete confirmation)
**Goal:** Mark the completion of the user's first chapter. Provide a brief summary of what they learned. Celebrate quietly. Surface the streak indicator for the first time. Confirm the path forward.

### Layout

Full-screen. Amber-tinted background (very soft — `#FDF6E8`) to distinguish chapter completion from mission completion. Centered. Chapter summary card with three bullet points (one per mission in the chapter). Streak indicator appears here for the first time.

### Copy — EN

| Element | Text |
|---------|------|
| Label | Chapter complete |
| Chapter title | Chapter 1.1 — The Trust Problem |
| XP summary | 3 XP earned today |
| What you can now explain | - Why digital strangers can't safely transact without a trusted third party |
| | - The hidden costs and limitations of centralized trust |
| | - What happens when institutions themselves become single points of failure |
| Post-chapter message (from curriculum) | You now see the problem. Everything that follows is about how the world tried to solve it. |
| Streak — first appearance | Day 1 streak started. Come back tomorrow to extend it. |
| Up next | **Chapter 1.2 — Blocks, Chains & Consensus** — The technical heart of blockchain: how data gets chained, how networks reach agreement, and why altering one record breaks everything after it. |
| Primary CTA | Continue to Chapter 1.2 |
| Secondary CTA | Come back later |

### Copy — FR

| Element | Text |
|---------|------|
| Label | Chapitre terminé |
| Chapter title | Chapitre 1.1 — Le problème de confiance |
| XP summary | 3 XP gagnés aujourd'hui |
| What you can now explain | - Pourquoi les inconnus ne peuvent pas transacter en sécurité sans un tiers de confiance |
| | - Les coûts cachés et les limites de la confiance centralisée |
| | - Ce qui se passe quand les institutions elles-mêmes deviennent des points de défaillance uniques |
| Post-chapter message | Vous voyez maintenant le problème. Tout ce qui suit porte sur la façon dont le monde a essayé de le résoudre. |
| Streak — first appearance | Jour 1 commencé. Revenez demain pour prolonger votre série. |
| Up next | **Chapitre 1.2 — Blocs, chaînes et consensus** — Le cœur technique de la blockchain : comment les données sont chaînées, comment les réseaux se mettent d'accord, et pourquoi modifier un enregistrement casse tout ce qui vient après. |
| Primary CTA | Continuer vers le chapitre 1.2 |
| Secondary CTA | Revenir plus tard |

### Logic

- "Continue to Chapter 1.2" → seamless chain to Mission 1.2.1.
- "Come back later" → navigates to the Home Screen (Dashboard). Home shows "Up next: Chapter 1.2 — Mission 1.2.1" as the hero action.
- Streak indicator appears here for the first time. It is minimal: "Day 1 — keep it going." No aggressive push notification prompt — that is reserved for Settings and is entirely optional.
- The bottom navigation bar is now fully visible for the first time: Home | Curriculum | (Profile — greyed out until tokens are revealed) | Settings.

---

## Screen 13: End of Category 1 — Achievement Unlock + Token Reveal Teaser

**Route:** (full-screen milestone screen, fires after Mission 1.3.{last} completes and Category 1 is marked complete)
**Goal:** Celebrate the completion of Category 1 (all 3 chapters, all missions). Unlock the first achievement badge. Plant the seed of the progressive reveal — the user gets a hint that something is coming, without knowing what. This screen bridges Category 1 (xpOnly) and Category 2 (which will eventually trigger the token reveal at Mission 2.2.4).

### Layout

Full-screen. Teal background. Centered. Achievement badge animation (badge "drops in" with a subtle bounce — restrained, not over-the-top). Below the badge: category summary. Below the summary: a single teaser paragraph. One CTA.

### Achievement Badge

Badge name (EN): **Foundations Earned**
Badge name (FR): **Fondations acquises**

Visual: hexagonal badge, teal border, a stylized chain-link icon inside. Subtle metallic sheen. No neon.

### Copy — EN

| Element | Text |
|---------|------|
| Label | Category complete |
| Category title | Category 1 — Blockchain Foundations |
| Achievement | You've unlocked: **Foundations Earned** |
| Achievement description | Awarded to learners who can explain the trust problem, how a blockchain solves it, and what it costs. |
| XP total | Total XP: {n} |
| What you now understand | The trust problem / How blocks and chains work / What consensus means / Why Bitcoin was a breakthrough |
| Teaser — headline | Something is building. |
| Teaser — body | You've been active on this platform since your first mission. In Category 2, you'll learn what that activity has actually been generating — and once you understand it, you'll be able to see it. |
| Primary CTA | Start Category 2 |
| Secondary CTA | See the full curriculum |

### Copy — FR

| Element | Text |
|---------|------|
| Label | Catégorie terminée |
| Category title | Catégorie 1 — Fondations de la blockchain |
| Achievement | Vous avez débloqué : **Fondations acquises** |
| Achievement description | Décerné aux apprenants capables d'expliquer le problème de confiance, comment la blockchain le résout, et ce que ça coûte. |
| XP total | XP total : {n} |
| What you now understand | Le problème de confiance / Comment les blocs et les chaînes fonctionnent / Ce que signifie le consensus / Pourquoi Bitcoin a été une percée |
| Teaser — headline | Quelque chose se construit. |
| Teaser — body | Vous êtes actif(ve) sur cette plateforme depuis votre première mission. Dans la Catégorie 2, vous apprendrez ce que cette activité a réellement généré — et une fois que vous le comprendrez, vous pourrez le voir. |
| Primary CTA | Commencer la Catégorie 2 |
| Secondary CTA | Voir le programme complet |

### Logic

- "Start Category 2" → Mission 2.1.1.
- "See the full curriculum" → `/curriculum` — full curriculum map, with Category 1 shown as completed and Category 2 shown as unlocked.
- This screen is shown exactly once. The backend marks `categoryOnComplete = true` for Category 1.
- The teaser copy is intentionally vague. It does not mention tokens by name. It says "what that activity has actually been generating" — which refers to Knowledge Tokens the user has been earning silently since Mission 1.1.1. The reveal at Mission 2.2.4 will be the payoff.
- After dismissal: the Home Screen now shows Category 2 progress, XP counter, and the streak indicator persistently. The bottom nav is fully functional.

---

## Dashboard — Home Screen (End State)

**Route:** `/home`
**Goal:** The user knows where they are, what to do next, and how far they've come. The home screen surfaces the next mission prominently. No decision fatigue.

### Layout

Mobile-first. Top: XP counter + streak. Hero: "Up next" mission card (large, one tap to start). Below: recent progress (last completed mission, current chapter name). Bottom: `<BottomNav>` (Home | Curriculum | Profile | Settings).

### Copy — EN

| Element | Text |
|---------|------|
| XP counter | {n} XP |
| Streak indicator | Day {n} — keep going |
| Hero card label | Up next |
| Hero CTA | Start mission |
| Recent activity label | Your progress |
| Curriculum map link | View full curriculum |

### Copy — FR

| Element | Text |
|---------|------|
| XP counter | {n} XP |
| Streak indicator | Jour {n} — continuez |
| Hero card label | Prochaine mission |
| Hero CTA | Commencer la mission |
| Recent activity label | Votre progression |
| Curriculum map link | Voir le programme complet |

---

## Skip / Exit Logic

### Can the user skip onboarding?

**Screens 1–3 (Account creation):** Cannot be skipped — account creation and email verification are required to access any content.

**Screen 4 (Welcome splash):** Cannot be skipped. It is a single tap (or scroll past). The information is minimal enough that a skip button would create more friction than it removes.

**Screen 5 (Motivation check):** Cannot be skipped. It requires one tap before the CTA activates. The interaction takes under 3 seconds. No skip is offered.

**Screen 6 (How it works):** Cannot be skipped. One read, one tap. If a user is clearly returning (has completed missions before — e.g., cookie cleared), this screen is automatically skipped by the backend: if `user.totalMissionsCompleted > 0`, route directly to the home screen.

**Mission flow (Screens 7–13):** The user can leave at any time by closing the app or tapping the Curriculum Map link. Progress up to the last completed exercise is saved. There is no penalty for leaving mid-onboarding.

### What happens if they close mid-onboarding?

- Any completed mission progress is saved to backend.
- On next open: the session resumes at the earliest incomplete step in the onboarding flow.
  - If they completed Screen 5 but haven't started Mission 1.1.1: they see Screen 6 again.
  - If they completed Mission 1.1.1 but not 1.1.2: the Home Screen shows "Up next: Mission 1.1.2" as the hero card.
  - They are never forced back to Screens 4 or 5 — those are first-login-only screens and are not shown again.
- There is no "resume onboarding" modal. The home screen state naturally surfaces what to do next.

---

## Return User Logic

### Returning after 1 day (streak active)

User opens app → straight to Home Screen. No onboarding screens. No welcome back message. The hero card shows the next mission. Streak indicator shows the current count.

If the streak is intact: indicator shows "Day {n}" in teal.
If the streak was broken (missed a day): indicator shows "Day 1" without any negative framing. No "you broke your streak" messaging. The reset is silent and the day count simply restarts.

**EN streak restart copy:** Your current streak: Day 1
**FR streak restart copy:** Votre série actuelle : Jour 1

No apology. No guilt. The platform does not punish absence.

### Returning after 4–14 days (welcome back screen)

**Route:** `/home` — the welcome back message appears as a dismissable banner at the top of the home screen (not a full-screen takeover).

**EN:**
> Welcome back. Your progress is safe — {n} missions completed, {n} XP earned. Ready to pick up where you left off?
> **Resume: {mission title}** [button]

**FR:**
> Bon retour. Votre progression est sauvegardée — {n} missions terminées, {n} XP gagnés. Prêt(e) à reprendre là où vous vous êtes arrêté(e) ?
> **Reprendre : {mission title}** [bouton]

Below the banner, the hero card also shows the next mission. The user can dismiss the banner or tap the button — both lead to the same place.

If the user has completed 5+ missions since their last session began, a soft refresher offer appears:

**EN:** "It's been a few days — want a quick 2-minute refresher on {previous chapter name} before continuing?"
**FR:** "Cela fait quelques jours — voulez-vous un rappel rapide de 2 minutes sur {nom du chapitre précédent} avant de continuer ?"

The refresher is optional (link below the main CTA, not blocking).

### Returning after 7+ days (re-engagement state)

**Route:** `/home` — a slightly richer welcome-back card replaces the standard hero card. Full-screen-width card, not full-screen takeover.

**EN:**
> You've been away for a while. Here's everything you've built:
> {n} missions completed · {n} chapters mastered · XP: {n}
>
> Your next mission: **{mission title}**
>
> [Start mission] [See full progress]

**FR:**
> Vous avez été absent(e) un moment. Voici ce que vous avez construit :
> {n} missions terminées · {n} chapitres maîtrisés · XP : {n}
>
> Prochaine mission : **{mission title}**
>
> [Commencer la mission] [Voir ma progression complète]

If `user.totalMissionsCompleted >= 5` and absence was 7+ days, offer the concept refresher more prominently:

**EN:** "Before diving back in, want to spend 2 minutes reviewing what {previous chapter name} covered? It'll make the next mission easier."
**FR:** "Avant de replonger, voulez-vous passer 2 minutes à revoir ce que couvrait le {nom du chapitre précédent} ? Ça facilitera la prochaine mission."

Refresher offer appears as a secondary CTA card below the main one, not as a modal or blocking gate.

**Tone rule for all return states:** The platform is a patient teacher. It never says "You left," "You missed," or "Your streak broke." It says "Welcome back" and shows the user what they built. Progress is the headline — absence is never mentioned.

---

## Appendix A: Auth Endpoint Reference

| Action | Endpoint | Method |
|--------|----------|--------|
| Register with email | `/api/v1/auth/register` | POST |
| Login with email | `/api/v1/auth/login` | POST |
| Google OAuth initiate | `/api/v1/auth/google` | GET |
| Google OAuth callback | `/api/v1/auth/google/callback` | GET |
| Facebook OAuth initiate | `/api/v1/auth/facebook` | GET |
| Facebook OAuth callback | `/api/v1/auth/facebook/callback` | GET |
| Get current user | `/api/v1/auth/me` | GET |
| Logout | `/api/v1/auth/logout` | POST |
| Password reset request | `/api/v1/auth/forgot-password` | POST |
| Password reset confirm | `/api/v1/auth/reset-password` | POST |

Google and Facebook OAuth are gated — if `GOOGLE_CLIENT_ID` / `FACEBOOK_APP_ID` are not configured in the environment, the corresponding button should not render on Screen 1. The backend returns `503 OAUTH_PROVIDER_UNAVAILABLE` — the frontend should detect this on app load and hide the button proactively rather than showing an error at click time.

---

## Appendix B: Progressive Reveal — Onboarding Scope

The 4 progressive reveals (Tokens at 2.2.4, Wallet at 3.1.4, Gas at 3.3.3, Dashboard at 6.3.4) are outside the scope of this onboarding spec. They are documented in full in `docs/progressive-reveal-spec.md`.

What this spec covers in the progressive reveal arc: Screen 13 (End of Category 1 teaser). This screen plants the seed — "something is building" — without revealing the mechanic. The teaser is deliberate misdirection in the best sense: it tells the user that something is happening, without naming it as tokens. The payoff lands at Mission 2.2.4 when the token reveal fires.

The teaser copy must not be updated to mention tokens, wallets, or any specific mechanic. It should remain abstract: "what that activity has actually been generating." The mystery is the point.

---

## Appendix C: Accessibility Notes for JB

- All tap targets minimum 44×44px — applies especially to Screens 5 (option cards) and 7 (drag items).
- Screen 7 (drag-and-drop exercise): must have a non-drag fallback for keyboard users and screen readers. Numbered order inputs or select menus are acceptable alternatives.
- All copy is provided in EN and FR. Language preference detected from `navigator.language` on first load, stored as `user.locale`. Can be overridden in Settings.
- Color usage in this flow: teal (`#2B9E9E`) for correct/positive states, amber (`#D4A843`) for chapter/milestone moments, off-white (`#F9F7F4`) as default background. No red is used in this flow — even for validation errors, use amber with a calm label, not red.
- Feedback animations: keep under 300ms and respect `prefers-reduced-motion`. Confetti, bounce, and drop-in effects must all be disabled when `prefers-reduced-motion: reduce` is set.
