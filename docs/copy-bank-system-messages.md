# Copy Bank — System Messages

> Platform: Transcendence (gamified blockchain learning)
> Tone: clear, warm, encouraging without being saccharine; treats learners as intelligent adults
> All copy is final-quality and ready for implementation
> Last updated: 2026-03-16

---

## A. Achievement Unlock Notifications

Displayed as toast notifications when an achievement is earned. Fires via Socket.IO `notification:push` event.
Format: title (max 40 chars) + body (max 80 chars).

All achievement toasts use an amber accent and appear for 5 seconds in the top-right corner.

---

| Achievement name | Trigger condition | Toast title | Toast body |
|---|---|---|---|
| **First Steps** | Complete mission 1.1.1 (very first mission) | First mission done. | You've started. That's the step most people skip. |
| **Chapter Complete** | Complete any chapter for the first time | Chapter complete. | One more piece of the puzzle in place. |
| **Foundations Laid** | Complete all of Category 1 (Blockchain Foundations) | Category 1 complete. | You understand the problem blockchain solves. |
| **Token Holder** | Complete all of Category 2 (Crypto & Tokens) | Category 2 complete. | Coins, tokens, volatility — you've got the vocabulary. |
| **Self-Custody** | Complete all of Category 3 (Wallets & Gas) | Category 3 complete. | Wallets, transactions, gas. You know how it actually works. |
| **Contract Aware** | Complete all of Category 4 (Smart Contracts) | Category 4 complete. | Blockchain as a computer. You now see what's possible. |
| **NFT Literate** | Complete all of Category 5 (NFTs & Digital Ownership) | Category 5 complete. | You can see through the hype now. |
| **DeFi Graduate** | Complete all of Category 6 (DeFi & Beyond) | Course complete. | All six categories. Every concept. You earned this. |
| **Century** | Token balance reaches 100 KT | 100 Knowledge Tokens. | Your balance just hit triple digits. |
| **Five Hundred** | Token balance reaches 500 KT | 500 Knowledge Tokens. | Half a thousand. This is what sustained effort looks like. |
| **One Thousand** | Token balance reaches 1000 KT | 1,000 Knowledge Tokens. | Four digits. Your learning has compounded. |
| **Three-Day Run** | Reach a 3-day streak | 3 days in a row. | Consistency is a skill. You're building it. |
| **Week Streak** | Reach a 7-day streak | 7-day streak. | A full week without missing a day. |
| **Two Weeks** | Reach a 14-day streak | 14-day streak. | Two weeks straight. This is a habit now. |
| **Month Streak** | Reach a 30-day streak | 30 days straight. | A month of daily learning. That's remarkable. |
| **Connected** | Send or accept a first friend request | First connection. | Learning alongside others changes how it sticks. |
| **Certified** | Complete all 69 missions (triggers certificate) | Certificate earned. | Your proof of completion is ready to share. |

---

## B. Streak Messages

Displayed as inline messages (not toasts) in the streak tracker section or as a brief banner on the home screen.

---

**Day 1 — Starting a streak:**
> Today counts. Keep going tomorrow.

---

**Day 3 milestone:**
> Three days running. You're past the hardest part.

---

**Day 7 milestone:**
> Seven days. A week of showing up. This is what learning looks like.

---

**Day 14 milestone:**
> Two weeks straight. At this point, the habit is doing most of the work.

---

**Day 30 milestone:**
> Thirty days. A month. The consistency you've shown here transfers to everything.

---

**Streak lost — missed a day:**
> You missed a day. It happens. Your progress is exactly where you left it — start again from today.

---

**Streak recovered — returns the next day after a miss:**
> Back. One day doesn't define a streak. Today does.

---

## C. Welcome-Back Messages

Displayed on the home screen when a user returns after 3 or more days away. Warm and factual — no guilt, no drama. The system selects one variant at random.

---

**Variant 1** (after 3–6 days away):
> Good to have you back. Your progress is right where you left it.

---

**Variant 2** (after 7–13 days away):
> It's been a week. No worries — your knowledge doesn't expire. Pick up where you stopped.

---

**Variant 3** (after 14–29 days away):
> You've been away a while. Everything is still here. Whenever you're ready, the next mission is waiting.

---

**Variant 4** (after 30+ days away):
> Welcome back. It's been a while, but what you learned hasn't gone anywhere. There's no pressure — just the next mission when you're ready.

---

**Variant 5** (generic, used as fallback):
> Back again. Your progress is intact. Carry on.

---

## D. Concept Refresher Intro Copy

Displayed at the start of a mission when the system determines the learner may benefit from a brief recap (e.g., after a long absence, or when the mission builds on a concept from several chapters back). The refresher itself is injected by the API at `GET /api/v1/curriculum/resume`. These are intro variants for the wrapper UI.

---

**Variant 1:**
> Before you start, here's a quick reminder of what this mission builds on.

---

**Variant 2:**
> It's been a while since you covered this topic. A quick recap before you dive in.

---

**Variant 3:**
> This mission references something from earlier. Here's the key idea — thirty seconds, then you're ready.

---

## E. Post-Mission Messages

### After correct completion (mission completed)

Displayed on the mission completion screen. The system rotates through these variants to avoid repetition.

---

**Variant 1:**
> Correct. Another piece of the picture in place.

---

**Variant 2:**
> Well done. That concept is yours now.

---

**Variant 3:**
> Nailed it. On to the next one.

---

**Variant 4:**
> That's right. You just added to something that compounds.

---

### After chapter completion

Displayed after the final mission of a chapter, following the standard mission completion message.

---

**Variant 1:**
> Chapter complete. You've covered the full scope of this topic. The next chapter builds on what you just finished.

---

**Variant 2:**
> That's the whole chapter. Every concept in there is part of your foundation now.

---

**Variant 3:**
> Chapter done. Take a moment — this is real progress.

---

### After category completion

Displayed after the final chapter of a category. Larger milestone acknowledgement — displayed as a dedicated screen, not just a banner.

---

**Variant 1:**
> Category complete. You've finished everything in this section. The next category takes what you've learned here and goes further.

---

**Variant 2:**
> You've completed this category. Six sections total — this is one of them done. Keep going.

---

## F. Disclaimer Gate Copy

Displayed as a modal before the user can enter chapters 2.3 (Value, Price & Volatility), 6.1 (DeFi: Banking Without Banks), and 6.2 (The Bigger Picture). The modal must be explicitly accepted before the chapter unlocks.

Tone: direct, responsible, non-scaremongering, treats the learner as an adult. No wall of legal text. Concise.

---

### Modal Title:
> A quick note before you continue

### Modal Body:

> The content in this chapter discusses financial topics, including cryptocurrency prices, investment concepts, and financial instruments.
>
> This content is for educational purposes only. Nothing in this chapter is financial advice, and nothing you learn here should be treated as a recommendation to buy, sell, or hold any asset.
>
> Financial decisions involve real risk. If you're considering any investment, speak with a qualified financial adviser.

### Accept Button:
> I understand — continue

### Decline / Go Back Button:
> Go back

---

**Implementation notes:**
- The modal body is the same for all three chapters (2.3, 6.1, 6.2). No chapter-specific variations.
- Acceptance is recorded via `POST /api/v1/disclaimers/accept` with the module ID.
- The modal must appear every time the chapter is entered (or only on first entry — confirm product decision with Arthur). Recommended: only on first entry per chapter.
- Do not use a checkbox pattern. A single explicit CTA button is sufficient for legal clarity and UX.

---

## G. Gas Fee Notification Copy

### First time gas is deducted (immediately after mission 3.3.3 reveal)

Displayed as an inline notice on the first exercise the user sees after the gasRevealed flag is set. This is the first time they actually pay gas — the reveal modal has already explained the concept.

---

> Each exercise attempt costs 2 KT. This is gas — the same mechanism you just studied. Your balance has been updated.

---

### Subsequent gas deductions (all exercise submissions after the first)

Displayed as a brief inline note beneath the submission result, or as a subtle balance update animation. Should not interrupt the flow.

---

**Standard (after any submission):**
> −2 KT gas

---

**When balance is running low (below 10 KT):**
> −2 KT gas · Your balance is running low. Complete a mission to top up.

---

**When balance hits zero after deduction:**
> −2 KT gas · Your balance is at 0. You can still continue this mission, but you'll need to complete it before starting a new one.

---

**When balance goes negative (debt) after deduction:**
> −2 KT gas · Your balance is below 0. Complete this mission to earn tokens and clear your debt before starting anything new.

---

**Implementation notes:**
- The "low balance" threshold of 10 KT is a suggested UI nudge — adjust based on UX testing.
- The debt warning should also appear as a persistent indicator on the wallet/profile page and on the home/curriculum screen (wherever the user would naturally try to start a new mission).
- Gas messages should never block or interrupt the exercise flow. They appear after the submission result is shown, not before.
