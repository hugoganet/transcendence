# Email Copy Spec

> Platform: Transcendence (gamified blockchain literacy platform)
> Tone: warm, concise, encouraging without being saccharine — treats learners as intelligent adults
> Last updated: 2026-03-16

## How to use this document

Hugo: each section below maps to one email type. English copy is the reference (already in `emailService.ts` for emails 1–4). French copy is ready to implement alongside it. For emails 5–7, both EN and FR are new copy to implement.

The streak reminder (email 5) is currently in-app only (Socket.IO push, skips offline users). The spec below adds the offline email path — same trigger logic, new `sendStreakReminderEmail()` function to add to `emailService.ts`.

Emails 6 and 7 are not yet implemented anywhere. Both are specced here as new functions for Hugo to build.

---

## 1. Password Reset

**Trigger:** User submits a password reset request
**Function:** `sendPasswordResetEmail(to, resetLink)`
**Token in URL:** expires in 1 hour

### English (reference — already in emailService.ts)

**Subject:** Reset Your Password

**Body:**
You requested a password reset. Click the button below to choose a new password.

[Reset Password]

This link expires in 1 hour. If you didn't request this, you can safely ignore this email.

---

### French

**Subject:** Réinitialisation de votre mot de passe

**Body:**
Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.

[Réinitialiser mon mot de passe]

Ce lien expire dans 1 heure. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre compte reste intact.

---

## 2. GDPR Data Export Ready

**Trigger:** User requests data export via settings; export has been generated
**Function:** `sendGdprExportEmail(to, downloadLink)`
**Token in URL:** expires in 24 hours, single-use

### English (reference — already in emailService.ts)

**Subject:** Your Data Export Is Ready

**Body:**
You requested an export of your personal data. Click the button below to download your data as a JSON file.

[Download Your Data]

This link expires in 24 hours and can only be used once. If you didn't request this, you can safely ignore this email.

---

### French

**Subject:** Votre export de données est prêt

**Body:**
Vous avez demandé un export de vos données personnelles. Cliquez sur le bouton ci-dessous pour télécharger votre fichier JSON.

[Télécharger mes données]

Ce lien expire dans 24 heures et ne peut être utilisé qu'une seule fois. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email.

---

## 3. GDPR Deletion Confirmation

**Trigger:** User requests account deletion via settings
**Function:** `sendGdprDeletionConfirmEmail(to, confirmLink)`
**Token in URL:** expires in 24 hours
**Note:** CTA button uses red (`#D44D4D`) to signal irreversibility — keep that in FR version too. Email is calm, not alarming.

### English (reference — already in emailService.ts)

**Subject:** Confirm Account Deletion

**Body:**
You requested to delete your account and all personal data. This action is permanent and cannot be undone.

[Confirm Deletion]

This link expires in 24 hours. If you didn't request this, you can safely ignore this email — your account will not be deleted.

---

### French

**Subject:** Confirmez la suppression de votre compte

**Body:**
Vous avez demandé la suppression de votre compte et de toutes vos données personnelles. Cette action est définitive.

[Confirmer la suppression]

Ce lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, ignorez simplement cet email — votre compte ne sera pas supprimé.

---

## 4. Re-engagement Email

**Trigger:** User has not completed any mission for 7 or more days and is currently offline (no active Socket.IO connection)
**Function:** `sendReEngagementEmail(to, displayName, stats, resumeLink)`
**Dedup:** max one per user per 24 hours (enforced in `engagementService.ts`)
**Stats available:** `totalMissions`, `totalChapters`, `daysSinceLastMission`

### English (reference — already in emailService.ts)

**Subject:** Your learning journey awaits

**Body:**
Welcome back, [name]! You've completed [N] missions and mastered [N] chapters. Your progress is still here — pick up where you left off!

[Continue Learning]

Not interested? You can manage your notification preferences in settings.

---

### French

**Subject:** Votre parcours vous attend

**Body:**
Bon retour, [prénom] ! Vous avez terminé [N] mission(s) et maîtrisé [N] chapitre(s). Tout votre avancement est intact — reprenez là où vous vous êtes arrêté·e.

[Reprendre l'apprentissage]

Vous préférez ne plus recevoir ces emails ? Gérez vos préférences de notification dans les paramètres.

---

**Copy notes:**
- If `displayName` is null, EN uses "Welcome back!" and FR uses "Bon retour !" (no name, no awkwardness)
- The plural logic (`mission(s)`, `chapitre(s)`) is already handled in the EN implementation — apply the same conditional pluralisation in FR

---

## 5. Streak Reminder

**Trigger:** User has an active streak (`currentStreak > 0`) and has not completed any mission today (UTC). Currently only fires as an in-app Socket.IO push to online users. This email path is for offline users.
**Function to create:** `sendStreakReminderEmail(to, displayName, currentStreak, resumeLink)`
**Dedup:** max one per user per calendar day UTC (same dedup pattern as in-app version)
**Note:** Encouraging, not scolding. The streak is the user's achievement — the email is a friendly heads-up, not a warning.

### English

**Subject:** Your [N]-day streak is on the line

**Body:**
[Name], you're on a [N]-day streak. One mission today keeps it going.

[Keep My Streak Alive]

You can turn off these reminders in settings.

---

**Subject (when streak is 1 day — no "streak" drama needed):**
One more day and you've got a streak

**Body:**
[Name], you completed a mission yesterday. One more today and your streak is officially started.

[Start Today's Mission]

You can turn off these reminders in settings.

---

### French

**Subject:** Votre série de [N] jours est en jeu

**Body:**
[Prénom], vous êtes sur une série de [N] jours. Une mission aujourd'hui et elle continue.

[Maintenir ma série]

Vous pouvez désactiver ces rappels dans les paramètres.

---

**Subject (streak = 1 day):**
Encore un jour et vous avez une série

**Body:**
[Prénom], vous avez complété une mission hier. Une de plus aujourd'hui et votre série est lancée.

[Commencer la mission du jour]

Vous pouvez désactiver ces rappels dans les paramètres.

---

**Copy notes:**
- If `displayName` is null, drop the name entirely — "You're on a [N]-day streak." / "Vous êtes sur une série de [N] jours."
- "Streak" is kept in English in the FR subject/body only if there is no clean French equivalent — "série" works well and is preferred here

---

## 6. Achievement Unlock

**Trigger:** User earns an achievement that warrants an email (high-value milestones only — see note below). Currently achievements only fire in-app toasts via Socket.IO. This email is for offline users at high-value milestones.
**Function to create:** `sendAchievementEmail(to, displayName, achievementName, achievementBody, resumeLink)`
**When to send:** Recommend limiting to certificate-level and course-completion achievements to avoid inbox fatigue. Suggested trigger set:
  - **Certified** (all 69 missions complete — certificate earned)
  - **DeFi Graduate** (all 6 categories complete)
  - **Month Streak** (30-day streak reached)

### English

**Subject:** You earned: [Achievement Name]

**Body:**
[Name], you just unlocked [Achievement Name].

[Achievement description line — pulled from toast body, e.g. "Your proof of completion is ready to share."]

[View Your Achievement]

---

**Example — Certified:**

**Subject:** You earned: Certificate

**Body:**
[Name], you've completed every mission on Transcendence. Your certificate is ready.

[View My Certificate]

---

**Example — DeFi Graduate:**

**Subject:** You earned: Course Complete

**Body:**
[Name], all six categories. Every concept. You earned this.

[View Your Progress]

---

### French

**Subject:** Vous avez débloqué : [Nom de l'accomplissement]

**Body:**
[Prénom], vous venez de débloquer [Nom de l'accomplissement].

[Ligne de description de l'accomplissement]

[Voir mon accomplissement]

---

**Example — Certified:**

**Subject:** Vous avez débloqué : Certificat

**Body:**
[Prénom], vous avez terminé toutes les missions de Transcendence. Votre certificat est prêt.

[Voir mon certificat]

---

**Example — DeFi Graduate:**

**Subject:** Vous avez débloqué : Cours terminé

**Body:**
[Prénom], les six catégories. Chaque concept. Vous l'avez mérité.

[Voir ma progression]

---

**Copy notes:**
- The description line maps 1:1 to the existing toast body copy in `copy-bank-system-messages.md` (Section A). No new copy needed — reuse what's already there.
- Do not email every achievement. Toast-only for streak milestones, token milestones, chapter and category completions. Email only for the milestone set above.

---

## 7. Welcome Email (onboarding)

**Trigger:** New user completes signup (account created + email verified)
**Function to create:** `sendWelcomeEmail(to, displayName, startLink)`
**Note:** Not yet implemented anywhere in the codebase. Hugo to build. This is the first email a user receives — sets the tone for the platform.

### English

**Subject:** You're in. Let's start.

**Body:**
Welcome to Transcendence, [Name].

You're about to learn how blockchain actually works — no jargon, no hype, just clear explanations and hands-on missions. By the end, you'll understand a technology that most people only pretend to.

[Start Your First Mission]

---

### French

**Subject:** Vous êtes inscrit·e. C'est parti.

**Body:**
Bienvenue sur Transcendence, [Prénom].

Vous allez apprendre comment la blockchain fonctionne vraiment — sans jargon inutile, sans buzz. Des explications claires et des missions concrètes. À la fin, vous maîtriserez une technologie que la plupart des gens font semblant de comprendre.

[Commencer ma première mission]

---

**Copy notes:**
- If `displayName` is null, EN: "Welcome to Transcendence." / FR: "Bienvenue sur Transcendence."
- No unsubscribe link needed on welcome email (transactional). Still include standard footer with settings link for preference management.
- `startLink` should point to `/curriculum` or the first unlocked mission, not the home screen

---

## Implementation reference

| Email | Function | Status |
|---|---|---|
| Password Reset | `sendPasswordResetEmail` | Implemented (EN only) |
| GDPR Data Export | `sendGdprExportEmail` | Implemented (EN only) |
| GDPR Deletion Confirm | `sendGdprDeletionConfirmEmail` | Implemented (EN only) |
| Re-engagement | `sendReEngagementEmail` | Implemented (EN only) |
| Streak Reminder | `sendStreakReminderEmail` | Not implemented — spec above |
| Achievement Unlock | `sendAchievementEmail` | Not implemented — spec above |
| Welcome | `sendWelcomeEmail` | Not implemented — spec above |

All functions live in `apps/api/src/services/emailService.ts`.
Streak reminder email caller: `apps/api/src/services/engagementService.ts` → `checkStreakReminders()` — add offline path (mirror the re-engagement offline check on line 68–77).
