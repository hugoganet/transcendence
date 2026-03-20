# Accessibility Copy Spec
## Exercise Types Covered: SI, CM, IP, ST

Platform: Transcendence — gamified blockchain literacy
Last updated: 2026-03-16
Author: Accessibility Specialist

> **Usage**: JB implements ARIA attributes directly from this document. Every label, role, and
> screen reader string is specified for both EN and FR. States are listed exhaustively — implement
> all states, not just the happy path.

---

## SI — Scenario Interpretation

**Schema reference**: `siExerciseContentSchema` — fields: `scenario`, `question`, `options[]`
(each option: `id`, `text`, `isCorrect`, `explanation`)

**Content example**: Mission 1.1.1 "Who Do You Trust?" — scenario about a 800-euro guitar purchase,
4 radio options, one correct answer with per-option explanations.

### Structure

```
<article>                        ← exercise container
  <section>                      ← scenario region
  <fieldset>                     ← question + radio options group
    <legend>                     ← question text
    <label><input type="radio">  ← each option (4×)
  <button>                       ← submit
  <section>                      ← feedback region (hidden until submit)
```

### ARIA Labels (EN)

**Exercise container**
```html
<article
  role="main"
  aria-label="Exercise: [mission title]"
  aria-describedby="exercise-type-hint"
>
<span id="exercise-type-hint" class="sr-only">
  Scenario interpretation exercise. Read the scenario, then choose the best answer.
</span>
```

**Scenario region**
```html
<section
  aria-label="Exercise scenario"
  aria-describedby="scenario-text"
>
<p id="scenario-text">[scenario content]</p>
```

**Question + options group**
```html
<fieldset>
  <legend id="question-text">[question content]</legend>

  <!-- Each option -->
  <label>
    <input
      type="radio"
      name="exercise-answer"
      value="[option id]"
      aria-label="Option [A/B/C/D]: [option text]"
    />
    [option text]
  </label>
```

Note: use uppercase letter label (A, B, C, D) in `aria-label`, even though internal IDs are
lowercase (a, b, c, d). This matches how screen readers pronounce single letters.

**Submit button — before selection**
```html
<button
  type="submit"
  disabled
  aria-disabled="true"
  aria-label="Select an answer to continue"
>
  Submit
</button>
```

**Submit button — after selection, before submit**
```html
<button
  type="submit"
  aria-label="Submit your answer"
>
  Submit
</button>
```

**Submit button — loading state**
```html
<button
  type="submit"
  disabled
  aria-disabled="true"
  aria-label="Submitting your answer, please wait"
  aria-busy="true"
>
  Submit
</button>
```

**Feedback region**
```html
<section
  role="status"
  aria-live="polite"
  aria-atomic="true"
  aria-label="[Correct / Incorrect]. [explanation text]"
  id="feedback-region"
>
```

Correct state:
```html
aria-label="Correct. [explanation text]"
```

Incorrect state:
```html
aria-label="Incorrect. [explanation text]"
```

**Next / Continue button (after feedback)**
```html
<button
  aria-label="Continue to next exercise"
>
  Continue
</button>
```

### ARIA Labels (FR)

**Exercise container**
```html
<article
  role="main"
  aria-label="Exercice : [titre de la mission]"
  aria-describedby="exercise-type-hint"
>
<span id="exercise-type-hint" class="sr-only">
  Exercice d'interprétation de scénario. Lisez le scénario, puis choisissez la meilleure réponse.
</span>
```

**Scenario region**
```html
<section
  aria-label="Scénario de l'exercice"
  aria-describedby="scenario-text"
>
```

**Question + options group**
```html
<fieldset>
  <legend id="question-text">[contenu de la question]</legend>

  <label>
    <input
      type="radio"
      name="exercise-answer"
      value="[id de l'option]"
      aria-label="Option [A/B/C/D] : [texte de l'option]"
    />
  </label>
```

**Submit button — before selection**
```html
<button
  disabled
  aria-disabled="true"
  aria-label="Sélectionnez une réponse pour continuer"
>
  Valider
</button>
```

**Submit button — after selection**
```html
<button
  aria-label="Soumettre votre réponse"
>
  Valider
</button>
```

**Submit button — loading state**
```html
<button
  disabled
  aria-disabled="true"
  aria-label="Envoi de votre réponse, veuillez patienter"
  aria-busy="true"
>
  Valider
</button>
```

**Feedback region**
```html
<section
  role="status"
  aria-live="polite"
  aria-atomic="true"
>
```

Correct state:
```html
aria-label="Correct. [texte de l'explication]"
```

Incorrect state:
```html
aria-label="Incorrect. [texte de l'explication]"
```

**Continue button**
```html
<button aria-label="Continuer vers l'exercice suivant">Continuer</button>
```

### Screen Reader Announcements (EN)

| Trigger | Announcement |
|---------|-------------|
| Radio option focused | "Option A: [option text], radio button, 1 of 4" *(browser default)* |
| Radio option selected | "Option A: [option text], selected" *(browser default)* |
| Submit clicked — correct | "Correct. [explanation text]" *(via aria-live region)* |
| Submit clicked — incorrect | "Incorrect. [explanation text]" *(via aria-live region)* |
| Continue button focused | "Continue to next exercise, button" |

### Screen Reader Announcements (FR)

| Déclencheur | Annonce |
|-------------|---------|
| Option survolée | "Option A : [texte], bouton radio, 1 sur 4" *(navigateur)* |
| Option sélectionnée | "Option A : [texte], sélectionné" *(navigateur)* |
| Soumission — correct | "Correct. [texte de l'explication]" *(aria-live)* |
| Soumission — incorrect | "Incorrect. [texte de l'explication]" *(aria-live)* |
| Bouton continuer | "Continuer vers l'exercice suivant, bouton" |

---

## CM — Concept Matching

**Schema reference**: `cmExerciseContentSchema` — fields: `instruction`, `pairs[]`
(each pair: `id`, `term`, `definition`, `analogy?`)

**Content example**: Mission 1.1.3 "A World Without Middlemen" — 4 pairs matching traditional
financial concepts (bank verification, notary, PayPal, central server) to blockchain equivalents.

### Structure

CM is a drag-and-drop matching exercise. Each `term` card is draggable; each `definition` card is
a drop target. The exercise is complete when all terms are matched to definitions.

```
<section>                        ← exercise container
  <p>                            ← instruction text
  <div>                          ← two-column layout
    <ul>                         ← term cards (draggable)
      <li>                       ← each term card
    <ul>                         ← definition drop targets
      <li>                       ← each drop zone
  <button>                       ← check / submit button
  <section>                      ← feedback region
```

**Keyboard-accessible fallback**: Because drag-and-drop is inaccessible to many users, implement a
`<select>` fallback per term (see Keyboard Navigation Requirements below).

### ARIA Labels (EN)

**Exercise container**
```html
<section
  aria-label="Concept matching exercise"
  aria-describedby="cm-instruction cm-keyboard-hint"
>
<span id="cm-keyboard-hint" class="sr-only">
  Use Tab to move between cards. Press Enter or Space to pick up a term card,
  then Tab to a definition and press Enter or Space to drop it.
  Alternatively, use the dropdowns to match each term.
</span>
```

**Instruction**
```html
<p id="cm-instruction">[instruction text]</p>
```

**Term cards list**
```html
<ul
  aria-label="Terms to match"
  role="list"
>
```

**Each term card (unmatched)**
```html
<li
  role="button"
  tabindex="0"
  draggable="true"
  aria-grabbed="false"
  aria-label="Term: [term text]. Not yet matched. Press Enter or Space to pick up."
  data-term-id="[id]"
>
  [term text]
</li>
```

**Each term card (grabbed / being dragged)**
```html
aria-grabbed="true"
aria-label="Term: [term text]. Picked up. Tab to a definition slot and press Enter to drop."
```

**Each term card (matched)**
```html
aria-grabbed="false"
aria-disabled="true"
aria-label="Term: [term text]. Matched to: [definition text]."
```

**Definition drop zones list**
```html
<ul
  aria-label="Definitions — drop matching terms here"
  role="list"
>
```

**Each definition drop zone (empty)**
```html
<li
  role="listitem"
  aria-dropeffect="move"
  aria-label="Definition slot: [definition text]. Empty — no term matched yet."
  data-zone-id="[id]"
>
  [definition text]
</li>
```

**Each definition drop zone (occupied)**
```html
aria-dropeffect="none"
aria-label="Definition slot: [definition text]. Matched with: [term text]."
```

**Analogy tooltip (optional, on hover/focus)**
```html
<button
  aria-label="See analogy for this pair"
  aria-expanded="false"
  aria-controls="analogy-[id]"
>
  Hint
</button>
<div
  id="analogy-[id]"
  role="tooltip"
  aria-label="Analogy: [analogy text]"
>
```

**Check / Submit button — incomplete (not all terms matched)**
```html
<button
  disabled
  aria-disabled="true"
  aria-label="Match all terms before checking. [N] of [total] matched."
>
  Check answers
</button>
```

**Check / Submit button — ready**
```html
<button
  aria-label="Check your matches"
>
  Check answers
</button>
```

**Feedback region**
```html
<section
  role="status"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Results"
  id="cm-feedback"
>
```

**Per-pair feedback (inside feedback region)**

Correct match:
```html
<p aria-label="Correct: [term text] matches [definition text]."></p>
```

Incorrect match:
```html
<p aria-label="Incorrect: [term text] does not match [definition text]. The correct match is [correct definition text]."></p>
```

**Overall result**
```html
<p aria-label="You matched [N] out of [total] pairs correctly."></p>
```

### ARIA Labels (FR)

**Exercise container**
```html
<section
  aria-label="Exercice d'association de concepts"
  aria-describedby="cm-instruction cm-keyboard-hint"
>
<span id="cm-keyboard-hint" class="sr-only">
  Utilisez Tab pour naviguer entre les cartes. Appuyez sur Entrée ou Espace pour saisir une carte,
  puis Tab vers une définition et Entrée pour la déposer.
  Vous pouvez aussi utiliser les menus déroulants pour associer chaque terme.
</span>
```

**Term cards list**
```html
<ul aria-label="Termes à associer" role="list">
```

**Each term card (unmatched)**
```html
aria-label="Terme : [texte du terme]. Non associé. Appuyez sur Entrée ou Espace pour saisir."
```

**Each term card (grabbed)**
```html
aria-label="Terme : [texte du terme]. Saisi. Tabulez vers un emplacement et appuyez sur Entrée pour déposer."
```

**Each term card (matched)**
```html
aria-label="Terme : [texte du terme]. Associé à : [texte de la définition]."
```

**Definition drop zones list**
```html
<ul aria-label="Définitions — déposez les termes correspondants ici" role="list">
```

**Each definition drop zone (empty)**
```html
aria-label="Emplacement définition : [texte de la définition]. Vide — aucun terme associé."
```

**Each definition drop zone (occupied)**
```html
aria-label="Emplacement définition : [texte de la définition]. Associé avec : [texte du terme]."
```

**Analogy hint**
```html
<button aria-label="Voir l'analogie pour cette paire" aria-expanded="false">Indice</button>
<div role="tooltip" aria-label="Analogie : [texte de l'analogie]">
```

**Submit button — incomplete**
```html
aria-label="Associez tous les termes avant de vérifier. [N] sur [total] associés."
```

**Submit button — ready**
```html
aria-label="Vérifier vos associations"
```

**Per-pair feedback**

Correct:
```html
aria-label="Correct : [terme] correspond à [définition]."
```

Incorrect:
```html
aria-label="Incorrect : [terme] ne correspond pas à [définition]. La bonne réponse est [définition correcte]."
```

**Overall result**
```html
aria-label="Vous avez correctement associé [N] paires sur [total]."
```

### Screen Reader Announcements (EN)

| Trigger | Announcement |
|---------|-------------|
| Term card focused | "Term: [term text]. Not yet matched. Press Enter or Space to pick up." |
| Term card grabbed | "Term: [term text]. Picked up. Tab to a definition and press Enter to drop." |
| Drop onto definition | "Matched: [term text] with [definition text]." *(aria-live)* |
| Drop rejected (wrong) | Not announced live — only shown in post-submit feedback |
| All matched | "All terms matched. Check answers button is now available." *(aria-live)* |
| Submit — all correct | "You matched all [N] pairs correctly." *(aria-live)* |
| Submit — partial | "You matched [N] of [total] pairs correctly. [list of incorrect pairs]" |

### Screen Reader Announcements (FR)

| Déclencheur | Annonce |
|-------------|---------|
| Carte terme focalisée | "Terme : [texte]. Non associé. Entrée ou Espace pour saisir." |
| Carte saisie | "Terme : [texte]. Saisi. Tabulez et Entrée pour déposer." |
| Dépôt effectué | "Associé : [terme] avec [définition]." *(aria-live)* |
| Tout associé | "Tous les termes sont associés. Le bouton de vérification est disponible." *(aria-live)* |
| Soumission — tout correct | "Vous avez correctement associé les [N] paires." |
| Soumission — partiel | "Vous avez associé [N] paires sur [total] correctement. [liste des erreurs]" |

---

## IP — Interactive Placement

**Schema reference**: `ipExerciseContentSchema` — fields: `instruction`, `items[]`
(each item: `id`, `label`, `correctPosition`), `zones[]` (each zone: `id`, `label`)

**Content example**: Mission 1.2.1 "What is a Block?" — 4 block components (transactions list,
timestamp, block number, hash) must be dragged into 4 slots (Data, When, Where, Identity).

### Structure

IP is an ordering/placement exercise. Items are draggable; zones are positional drop targets.
Each item maps to a `correctPosition` (integer index). Zones have descriptive labels.

```
<section>                        ← exercise container
  <p>                            ← instruction
  <div>                          ← source tray (unplaced items)
    <div>                        ← each draggable item
  <ol>                           ← ordered drop zones
    <li>                         ← each zone (labeled slot)
  <button>                       ← check button
  <section>                      ← per-item feedback (after submit)
```

### ARIA Labels (EN)

**Exercise container**
```html
<section
  aria-label="Interactive placement exercise"
  aria-describedby="ip-instruction ip-keyboard-hint"
>
<span id="ip-keyboard-hint" class="sr-only">
  Drag each item into the correct slot. Use Tab to move between items and slots.
  Press Enter or Space to pick up an item, then Tab to a slot and press Enter to place it.
  Alternatively, use the dropdowns next to each slot to select an item.
</span>
```

**Instruction**
```html
<p id="ip-instruction">[instruction text]</p>
```

**Source tray (unplaced items)**
```html
<div
  role="list"
  aria-label="Items to place — [N] remaining"
>
```

Update `aria-label` dynamically as items are placed: "Items to place — 3 remaining", etc.

**Each draggable item (in tray, unplaced)**
```html
<div
  role="listitem button"
  tabindex="0"
  draggable="true"
  aria-grabbed="false"
  aria-label="Item: [item label]. Not placed. Press Enter or Space to pick up."
  data-item-id="[id]"
>
  [item label]
</div>
```

**Each draggable item (grabbed)**
```html
aria-grabbed="true"
aria-label="Item: [item label]. Picked up. Tab to a slot and press Enter to place."
```

**Drop zones (ordered)**
```html
<ol
  aria-label="Placement slots"
>
```

**Each drop zone (empty)**
```html
<li
  role="listitem"
  aria-dropeffect="move"
  aria-label="Slot [N]: [zone label]. Empty."
  data-zone-id="[id]"
  data-position="[0-indexed position]"
>
  <span>[zone label]</span>
  <div aria-label="Drop target for slot [N]"></div>
</li>
```

**Each drop zone (filled)**
```html
aria-dropeffect="none"
aria-label="Slot [N]: [zone label]. Contains: [item label]."
```

**Check button — incomplete**
```html
<button
  disabled
  aria-disabled="true"
  aria-label="Place all items before checking. [N] of [total] placed."
>
  Check
</button>
```

**Check button — ready**
```html
<button
  aria-label="Check your placements"
>
  Check
</button>
```

**Per-item feedback (after submit)**

Correct placement:
```html
<p aria-label="Correct: [item label] belongs in slot [N] — [zone label]."></p>
```

Incorrect placement:
```html
<p aria-label="Incorrect: [item label] was placed in slot [N] — [zone label], but belongs in slot [correct N] — [correct zone label]."></p>
```

**Overall result**
```html
<section
  role="status"
  aria-live="polite"
  aria-atomic="false"
  aria-label="Results"
>
<p aria-label="You placed [N] of [total] items correctly."></p>
```

### ARIA Labels (FR)

**Exercise container**
```html
<section
  aria-label="Exercice de placement interactif"
  aria-describedby="ip-instruction ip-keyboard-hint"
>
<span id="ip-keyboard-hint" class="sr-only">
  Faites glisser chaque élément dans l'emplacement correct. Utilisez Tab pour naviguer.
  Appuyez sur Entrée ou Espace pour saisir un élément, puis Tab vers un emplacement et Entrée pour le déposer.
  Vous pouvez aussi utiliser les menus déroulants à côté de chaque emplacement.
</span>
```

**Source tray**
```html
<div role="list" aria-label="Éléments à placer — [N] restant(s)">
```

**Each item (unplaced)**
```html
aria-label="Élément : [libellé]. Non placé. Entrée ou Espace pour saisir."
```

**Each item (grabbed)**
```html
aria-label="Élément : [libellé]. Saisi. Tabulez vers un emplacement et Entrée pour déposer."
```

**Drop zones**
```html
<ol aria-label="Emplacements de dépôt">
```

**Each zone (empty)**
```html
aria-label="Emplacement [N] : [libellé de la zone]. Vide."
```

**Each zone (filled)**
```html
aria-label="Emplacement [N] : [libellé de la zone]. Contient : [libellé de l'élément]."
```

**Check button — incomplete**
```html
aria-label="Placez tous les éléments avant de vérifier. [N] sur [total] placés."
```

**Check button — ready**
```html
aria-label="Vérifier vos placements"
```

**Per-item feedback**

Correct:
```html
aria-label="Correct : [libellé] appartient à l'emplacement [N] — [libellé de la zone]."
```

Incorrect:
```html
aria-label="Incorrect : [libellé] a été placé à l'emplacement [N] — [libellé de la zone], mais appartient à l'emplacement [N correct] — [libellé correct]."
```

**Overall result**
```html
aria-label="Vous avez correctement placé [N] éléments sur [total]."
```

### Screen Reader Announcements (EN)

| Trigger | Announcement |
|---------|-------------|
| Item focused in tray | "Item: [item label]. Not placed. Press Enter or Space to pick up." |
| Item grabbed | "Item: [item label]. Picked up." *(then silent — user Tabs to slots)* |
| Item placed in slot | "Placed: [item label] in slot [N] — [zone label]." *(aria-live)* |
| Item removed from slot | "[item label] removed from slot [N]." *(aria-live)* |
| All placed | "All items placed. Check button is now available." *(aria-live)* |
| Submit — all correct | "You placed all [N] items correctly." |
| Submit — partial | "You placed [N] of [total] items correctly. [list of errors]" |

### Screen Reader Announcements (FR)

| Déclencheur | Annonce |
|-------------|---------|
| Élément focalisé | "Élément : [libellé]. Non placé. Entrée ou Espace pour saisir." |
| Élément saisi | "Élément : [libellé]. Saisi." |
| Élément déposé | "Déposé : [libellé] dans l'emplacement [N] — [zone]." *(aria-live)* |
| Élément retiré | "[libellé] retiré de l'emplacement [N]." *(aria-live)* |
| Tout placé | "Tous les éléments sont placés. Le bouton de vérification est disponible." |
| Soumission — tout correct | "Vous avez correctement placé les [N] éléments." |
| Soumission — partiel | "Vous avez correctement placé [N] éléments sur [total]. [liste des erreurs]" |

---

## ST — Step-by-Step Simulation

**Schema reference**: `stExerciseContentSchema` — fields: `instruction`, `steps[]`
(each step: `id`, `prompt`, `options[]`, `microExplanation`)

**Content example**: Mission 3.1.4 "Set Up Your First Wallet" — 5 sequential steps simulating
wallet creation (choose wallet type, secure seed phrase, verify phrase, share public address,
understand what wallet means on the platform). Each step has 2–3 options and a microExplanation
shown after answering.

### Structure

ST is a linear simulation. The user answers step 1 before step 2 is revealed. After each answer,
a `microExplanation` is shown before the next step loads. A progress indicator shows current
position.

```
<section>                        ← exercise container
  <p>                            ← overall instruction (shown once)
  <nav>                          ← step progress indicator
  <article>                      ← current step card
    <p>                          ← step prompt
    <fieldset>                   ← options group
      <legend>                   ← accessible grouping label (sr-only)
      <label><input type="radio"> ← each option
    <button>                     ← confirm step answer
    <section>                    ← micro-explanation (shown after confirming step)
    <button>                     ← next step / finish
```

### ARIA Labels (EN)

**Exercise container**
```html
<section
  aria-label="Step-by-step simulation exercise"
  aria-describedby="st-instruction"
>
<p id="st-instruction">[instruction text]</p>
```

**Step progress indicator**
```html
<nav aria-label="Exercise progress">
  <p aria-live="polite" aria-atomic="true">
    Step [current] of [total]
  </p>
  <!-- Visual step dots, decorative only -->
  <ol aria-hidden="true">...</ol>
</nav>
```

`aria-live="polite"` on the progress text ensures screen readers announce the step number when it
updates after advancing.

**Step card**
```html
<article
  aria-label="Step [current]: [first 8 words of prompt]..."
  aria-describedby="step-prompt-[id]"
>
<p id="step-prompt-[id]">[prompt text]</p>
```

**Options group (within step)**
```html
<fieldset>
  <legend class="sr-only">Choose your action for step [current]</legend>

  <!-- Each option -->
  <label>
    <input
      type="radio"
      name="step-[id]-answer"
      value="[option id]"
      aria-label="Option [A/B/C]: [option text]"
    />
    [option text]
  </label>
</fieldset>
```

Note: ST steps may have 2 or 3 options (not always 4 like SI). Use A/B or A/B/C accordingly.

**Confirm step button — before selection**
```html
<button
  disabled
  aria-disabled="true"
  aria-label="Select an option to confirm this step"
>
  Confirm
</button>
```

**Confirm step button — after selection**
```html
<button
  aria-label="Confirm your choice for step [current]"
>
  Confirm
</button>
```

**Confirm step button — loading**
```html
<button
  disabled
  aria-disabled="true"
  aria-label="Processing your answer, please wait"
  aria-busy="true"
>
  Confirm
</button>
```

**Micro-explanation region (shown after confirming step)**
```html
<section
  role="status"
  aria-live="polite"
  aria-atomic="true"
  id="micro-explanation-[step-id]"
  aria-label="[Correct / Incorrect]. [explanation text]. [microExplanation text]"
>
```

Correct step:
```html
aria-label="Correct. [option explanation]. [microExplanation]"
```

Incorrect step:
```html
aria-label="Incorrect. [option explanation]. [microExplanation]"
```

**Next step button (after micro-explanation)**
```html
<!-- If more steps remain -->
<button
  aria-label="Continue to step [next number]"
>
  Next
</button>

<!-- If on final step -->
<button
  aria-label="Finish the simulation"
>
  Finish
</button>
```

**Completion summary (after all steps)**
```html
<section
  role="status"
  aria-live="polite"
  aria-atomic="true"
  aria-label="Simulation complete. You answered [N] of [total] steps correctly."
>
```

### ARIA Labels (FR)

**Exercise container**
```html
<section
  aria-label="Simulation pas à pas"
  aria-describedby="st-instruction"
>
<p id="st-instruction">[texte de l'instruction]</p>
```

**Step progress indicator**
```html
<nav aria-label="Progression de l'exercice">
  <p aria-live="polite" aria-atomic="true">
    Étape [actuelle] sur [total]
  </p>
</nav>
```

**Step card**
```html
<article
  aria-label="Étape [actuelle] : [8 premiers mots de l'invite]..."
  aria-describedby="step-prompt-[id]"
>
```

**Options group**
```html
<fieldset>
  <legend class="sr-only">Choisissez votre action pour l'étape [actuelle]</legend>

  <label>
    <input
      type="radio"
      name="step-[id]-answer"
      value="[id option]"
      aria-label="Option [A/B/C] : [texte de l'option]"
    />
  </label>
</fieldset>
```

**Confirm button — before selection**
```html
aria-label="Sélectionnez une option pour confirmer cette étape"
```

**Confirm button — after selection**
```html
aria-label="Confirmer votre choix pour l'étape [actuelle]"
```

**Confirm button — loading**
```html
aria-label="Traitement de votre réponse, veuillez patienter"
aria-busy="true"
```

**Micro-explanation region**

Correct:
```html
aria-label="Correct. [explication de l'option]. [texte de la micro-explication]"
```

Incorrect:
```html
aria-label="Incorrect. [explication de l'option]. [texte de la micro-explication]"
```

**Next step button**
```html
<!-- Étapes suivantes -->
<button aria-label="Continuer vers l'étape [suivante]">Suivant</button>

<!-- Dernière étape -->
<button aria-label="Terminer la simulation">Terminer</button>
```

**Completion summary**
```html
aria-label="Simulation terminée. Vous avez répondu correctement à [N] étapes sur [total]."
```

### Screen Reader Announcements (EN)

| Trigger | Announcement |
|---------|-------------|
| Step loads | "Step [N] of [total]" *(via aria-live on progress text)* |
| Step card focused | "Step [N]: [prompt text]" *(article aria-label)* |
| Option selected | "Option A: [option text], selected" *(browser default)* |
| Confirm clicked — correct | "Correct. [explanation]. [microExplanation]" *(aria-live)* |
| Confirm clicked — incorrect | "Incorrect. [explanation]. [microExplanation]" *(aria-live)* |
| Next step button focused | "Continue to step [N], button" |
| Final step completed | "Simulation complete. You answered [N] of [total] steps correctly." *(aria-live)* |

### Screen Reader Announcements (FR)

| Déclencheur | Annonce |
|-------------|---------|
| Étape chargée | "Étape [N] sur [total]" *(aria-live)* |
| Carte étape focalisée | "Étape [N] : [texte de l'invite]" |
| Option sélectionnée | "Option A : [texte], sélectionné" |
| Confirmation — correct | "Correct. [explication]. [micro-explication]" *(aria-live)* |
| Confirmation — incorrect | "Incorrect. [explication]. [micro-explication]" *(aria-live)* |
| Bouton étape suivante | "Continuer vers l'étape [N], bouton" |
| Dernière étape terminée | "Simulation terminée. [N] étapes sur [total] correctes." *(aria-live)* |

---

## Keyboard Navigation Requirements

### SI — Scenario Interpretation

| Action | Keys |
|--------|------|
| Move to scenario text | Tab |
| Move between options | Tab / Arrow keys (within fieldset) |
| Select an option | Space / Enter |
| Submit (when enabled) | Tab to button, Enter |
| Continue after feedback | Tab to button, Enter |

Full keyboard path: Tab → scenario → Tab → option A → Arrow Down/Up → cycle options → Tab →
Submit → Tab → Continue.

### CM — Concept Matching

| Action | Keys |
|--------|------|
| Move between term cards | Tab |
| Pick up a term card | Enter / Space (sets aria-grabbed="true") |
| Move to definition zones | Tab (while a card is grabbed) |
| Drop on a definition zone | Enter / Space |
| Cancel a grab | Escape |
| Move between dropdown selects (fallback) | Tab |
| Change dropdown selection | Arrow Up / Down, Enter |
| Submit (when all matched) | Tab to button, Enter |

Fallback: Each term must have an associated `<select>` element visible to screen readers
(visually hidden or shown alongside), listing all definitions as options.

### IP — Interactive Placement

| Action | Keys |
|--------|------|
| Move between items in tray | Tab |
| Pick up an item | Enter / Space |
| Move between drop zones | Tab (while item is grabbed) |
| Place item in zone | Enter / Space |
| Cancel a grab | Escape |
| Remove item from zone | Tab to filled zone, Enter / Space to grab back |
| Dropdown fallback per zone | Tab to select, Arrow keys, Enter |
| Check (when all placed) | Tab to button, Enter |

### ST — Step-by-Step Simulation

| Action | Keys |
|--------|------|
| Read step prompt | Tab to step card (aria-describedby covers it) |
| Move between options | Tab / Arrow keys (within fieldset) |
| Select an option | Space / Enter |
| Confirm step | Tab to Confirm button, Enter |
| Read micro-explanation | Content announced via aria-live; Tab to region to re-read |
| Advance to next step | Tab to Next button, Enter |
| Complete simulation | Tab to Finish button, Enter |

---

## Color Contrast Notes

These apply to all 4 exercise types. Meet WCAG 2.1 AA minimum at all times; aim for AAA where
feasible given the game visual design.

| State | Foreground | Background | Minimum ratio | Notes |
|-------|-----------|------------|---------------|-------|
| Default text | — | — | 4.5:1 | All body text, labels |
| Option text (unselected) | — | — | 4.5:1 | Radio labels, term cards, item labels |
| Option text (selected) | — | highlight bg | 4.5:1 | Highlighted/selected state |
| Submit button (active) | — | button bg | 4.5:1 | Ensure sufficient contrast on branded color |
| Submit button (disabled) | — | disabled bg | 3:1 | Disabled elements exempt from 4.5:1 but aim for 3:1 |
| Correct feedback text | white or dark | green bg | 4.5:1 | Do not rely on green alone — pair with icon + text |
| Incorrect feedback text | white or dark | red bg | 4.5:1 | Do not rely on red alone — pair with icon + text |
| Focus ring | focus color | any bg behind | 3:1 | WCAG 2.2 focus ring requirement |
| Drag-over zone highlight | — | drop zone bg | 3:1 | State indicator when dragging over a valid zone |
| Analogy tooltip text | — | tooltip bg | 4.5:1 | |

**Critical rule — never use color alone to convey meaning.** Correct/incorrect states must always
combine: color + icon (checkmark/cross) + text label ("Correct" / "Incorrect"). This covers users
with color blindness.

**Suggested accessible palette** (adjust to match brand):
- Correct: `#1a7a3c` on white (7.2:1) or white on `#1a7a3c` (7.2:1)
- Incorrect: `#c0392b` on white (5.1:1) or white on `#c0392b` (5.1:1)
- Focus ring: `#0057b7` (meets 3:1 on white backgrounds)

---

## Focus Management

### After submitting an answer (all types)

Move focus to the feedback region immediately after the result loads:

```javascript
// After submit resolves and feedback region is rendered:
document.getElementById('feedback-region').focus();
```

The feedback region must have `tabindex="-1"` to be programmatically focusable without being in
the natural Tab order:

```html
<section
  role="status"
  aria-live="polite"
  tabindex="-1"
  id="feedback-region"
>
```

### SI — After feedback, Continue button

When the Continue button appears, do not auto-move focus to it. The user is still reading the
feedback. Let them Tab to it naturally, or provide a skip link:

```html
<a href="#continue-btn" class="sr-only focus:not-sr-only">
  Skip to continue button
</a>
```

### CM — After checking matches

Move focus to the feedback summary heading:
```html
<h2 tabindex="-1" id="cm-results-heading">Results</h2>
<!-- call .focus() on this after render -->
```

Incorrect items should be listed with a "Try again" control that focuses the relevant term card
when activated:
```html
<button
  onclick="document.querySelector('[data-term-id=\\'[id]\\']').focus()"
  aria-label="Try again: [term text]"
>
  Try again
</button>
```

### IP — After checking placements

Same pattern as CM: focus the results heading, list errors with "Try again" buttons pointing back
to the misplaced item.

### ST — After confirming a step

Move focus to the micro-explanation region:
```javascript
document.getElementById(`micro-explanation-${stepId}`).focus();
```

After the user reads and presses Next, move focus to the new step card:
```javascript
document.querySelector('[aria-label^="Step [next]"]').focus();
```

On final step completion, move focus to the completion summary:
```javascript
document.getElementById('st-completion').focus();
```

### Avoid focus traps

None of these exercises should trap keyboard focus. All modals, tooltips, and overlay panels must:
1. Trap focus internally while open (so Tab cycles within the modal).
2. Return focus to the trigger element when closed.

---

## Notes for Implementation

1. **`aria-live` regions must exist in the DOM before content is injected.** Mount empty
   `role="status"` regions on exercise load, then populate them — do not inject the region itself
   dynamically.

2. **`aria-atomic="true"` vs `aria-atomic="false"`**: Use `true` when the entire region should be
   re-read as a unit (SI feedback, ST micro-explanation). Use `false` for CM/IP per-item results
   where each item can be announced individually.

3. **`aria-grabbed` is deprecated in ARIA 1.2.** It remains in this spec for backward
   compatibility with older assistive technologies. Pair it with the keyboard-accessible select
   fallback as the primary accessible path for drag-and-drop in CM and IP.

4. **Internationalization**: All `aria-label` strings must go through the i18n system
   (`apps/dreamweaver/messages/{en,fr}/`). Do not hardcode label strings in component code.
   Use translation keys following the pattern `exercise.[type].[element].[state]`.

5. **`role="status"` announces immediately on content change** with `aria-live="polite"`. Ensure
   feedback content is set in a single DOM update — multiple rapid updates may cause announcements
   to be dropped.

6. **Touch / mobile**: All drag-and-drop interactions (CM, IP) must support touch events
   (`touchstart`, `touchmove`, `touchend`). ARIA attributes for grab/drop still apply.
   Consider a long-press + drag model to avoid conflicting with scroll gestures.
