# FR Content Quality Review
**Date:** 2026-03-16
**Sample:** 20 missions across 6 categories
**Reviewer:** Claude Sonnet 4.6

---

## Overall Assessment

The French translation is of high quality overall. The register is consistently formal ("vous") throughout all 20 missions with no "tu" found anywhere in the file. Tone is warm and pedagogical without being condescending. Crypto terminology is largely consistent — "portefeuille" for wallet, "jeton" for token, "contrat intelligent" for smart contract, "frais de gas" for gas fees — with the exceptions noted below. Analogies translate naturally and feel appropriate for a French audience rather than literally rendered. The main issues are: three occurrences of the anglicism "genuinement" (not a French word), one double-negation grammatical error, one missing "ne" in a negation, and inconsistent spelling of "gas" vs "gaz" in a handful of locations.

---

## Issues Found and Fixed

### [2.1.1] — Anglicism: "genuinement"
**Location:** Option d explanation
**Before:** `"L'invention de Satoshi était quelque chose de genuinement nouveau"`
**After:** `"L'invention de Satoshi était quelque chose de véritablement nouveau"`
**Why:** "Genuinement" does not exist in French. It is a calque of the English "genuinely". The correct French equivalent is "véritablement" or "authentiquement".

---

### [2.3.4] — Anglicism: "genuinement" (two occurrences)
**Location:** Option c explanation
**Before:** `"Vous avez genuinement appris quelque chose de précieux"` and `"C'est une distinction intellectuelle genuinement importante."`
**After:** `"Vous avez véritablement appris quelque chose de précieux"` and `"C'est une distinction intellectuelle véritablement importante."`
**Why:** Same issue as above — "genuinement" is not a French word.

---

### [2.1.4 / Amara scenario] — Double negation: "pas ne règlerait pas"
**Location:** Option a explanation (mission about crypto value proposition)
**Before:** `"Investir ses gains dans un actif volatile introduirait des risques entièrement nouveaux, pas ne règlerait pas les problèmes d'infrastructure de paiement auxquels elle fait face."`
**After:** `"Investir ses gains dans un actif volatile introduirait des risques entièrement nouveaux, et ne règlerait pas les problèmes d'infrastructure de paiement auxquels elle fait face."`
**Why:** "Pas ne règlerait pas" is a double-negative construction that is grammatically malformed. The intended meaning is a contrast ("would introduce new risks, and would not fix the problems"), requiring "et ne … pas".

---

### [2.3.1] — Missing "ne" in negation: "Bitcoin avait presque aucune valeur"
**Location:** Analogy for "Effets de réseau" pair
**Before:** `"Bitcoin avait presque aucune valeur en 2009 quand presque personne ne l'utilisait."`
**After:** `"Bitcoin n'avait presque aucune valeur en 2009 quand presque personne ne l'utilisait."`
**Why:** In standard French, "ne … aucune" requires the "ne" particle. Without it, the sentence is grammatically incomplete.

---

### [5.1.4 + 6.1.3] — Terminology inconsistency: "frais de gaz" vs "frais de gas"
**Location:** Mission 5.1.4 (4 occurrences) and 6.1.3 (1 occurrence)
**Before:** `"frais de gaz"`, `"le gaz est un coût réseau"` (in missions 5.1.4 and 6.1.3)
**After:** `"frais de gas"`, `"le gas est un coût réseau"` (normalized to match the rest of the file)
**Why:** The entire file (30+ occurrences) uses the anglicism "gas" as a technical crypto term. Five occurrences in missions 5.1.4 and 6.1.3 used the French spelling "gaz" instead. Technical terms of art in crypto (gas, hash, block, nonce) are conventionally kept in their English form in French crypto education. Consistency is critical for learners.

---

## No Issues Found In

The following missions were reviewed and found clean — correct register throughout, terminology consistent, analogies natural, all fields present, isCorrect integrity intact:

- **1.1.1** — Clear scenario, one correct option, warm professional tone
- **1.2.4** — Consensus explanation is accurate and well-paced
- **1.3.3** — Good critical thinking framing; the bakery analogy lands naturally
- **2.2.2** — Ethereum "world computer" explanation is technically precise and pedagogically clear
- **2.3.3** — Volatility explanation nuanced and balanced
- **3.1.4** — Multi-step wallet creation simulation; all 5 steps have correct single answers; MetaMask/Ledger framing accurate
- **3.2.2** — Transaction sending simulation; clipboard hijacker warning is excellent real-world detail
- **3.3.3** — Gas fee simulation with 4 steps, all correct; the "Knowledge Token gas" tie-in is pedagogically strong
- **3.4.2** — Phishing scenario is accurate and the explanation correctly identifies MetaMask's non-custodial nature
- **4.1.1** — Vending machine analogy translates perfectly to French
- **4.1.4** — DAO hack scenario is technically accurate; "le code fait loi dans les deux sens" is an elegant formulation
- **4.2.2** — Real estate escrow simulation; oracle problem explanation in step 4 is appropriately nuanced
- **5.1.2** — Amazon/1984 scenario; the distinction between licence and ownership is clearly stated
- **5.2.2** — Sofia's creator economy story; redevances mechanic explained accurately
- **5.3.2** — NFT red flags; "wash trading" left in English as a recognized technical term, which is acceptable
- **6.1.2** — DeFi lending simulation; health factor and liquidation risk explained correctly
- **6.2.1** — DAO governance; the plutocracy vs. democracy tension is acknowledged, which is intellectually honest
- **6.3.4** — Diploma/certification finale; multiple `isCorrect: true` options are intentional (reflective exercise design)

---

## Terminology Consistency Notes

The following conventions are applied consistently across the file and should be maintained in future content:

| English term | French rendering used | Note |
|---|---|---|
| gas (fees) | gas (frais de gas) | Technical term of art — keep in English. Do NOT use "gaz". |
| wallet | portefeuille | Good — use consistently |
| token | jeton | Good — use consistently. Never use "token" in French text. |
| smart contract | contrat intelligent | Good — use consistently |
| hash | hash | Technical term — keep in English |
| blockchain | blockchain | Technical term — keep as-is |
| node | nœud | Good — French form used |
| stablecoin | stablecoin | Acceptable as technical term with no French equivalent |
| rug pull | rug pull (once, in 5.3.2) | Acceptable as no standard French equivalent exists; consider adding a brief French gloss in parentheses in future content |
| minting | frapper / création (varies) | Both forms appear; "frapper" and "minting" are both used — not a problem but worth monitoring |
| DeFi | DeFi | Technical acronym — keep as-is |
| NFT | NFT | Technical acronym — keep as-is |

**Watch for in future content:** The word "genuinement" must never be used — it is not French. Use "véritablement", "authentiquement", or "sincèrement" depending on context.

---

## Second Review — Remaining 49 Missions
**Date:** 2026-03-16

### Issues Found and Fixed

#### [3.1.1] — Anglicism: "supportent" (false cognate)
**Location:** Pair 4 definition
**Before:** `"De nombreux portefeuilles modernes supportent plusieurs blockchains à partir d'un seul jeu de clés, servant d'interface unique pour de nombreux réseaux."`
**After:** `"De nombreux portefeuilles modernes prennent en charge plusieurs blockchains à partir d'un seul jeu de clés, servant d'interface unique pour de nombreux réseaux."`
**Why:** "Supporter" in French means "to endure/bear (something unpleasant)" — it is a false cognate of the English "to support". The correct phrase is "prendre en charge" (to handle/manage) or "être compatible avec". This is the same class of anglicism as "genuinement" — a word that exists in French but does not carry the English meaning.

---

### Observation (out of scope — mission 3.1.4, already reviewed in pass 1)
**Location:** Step 3, option a explanation (line 1067)
**Issue found but not fixed (outside scope of this pass):** `"c'est votre dernière chance de réaliser que vous n'avez pas correctement sauvegardé votre phrase"` — "réaliser que" is an anglicism. Should be "se rendre compte que". The first review did not flag this. Recommended fix for a future pass.

---

### Clean Missions (no issues)

The following 48 missions were reviewed and found clean — correct register throughout, terminology consistent, isCorrect integrity intact, no anglicisms, no grammatical errors, all fields present:

**Chapter 1 — Blockchain Foundations**
- **1.1.2** — Single failure point scenario; one correct answer, clear prose
- **1.1.3** — MT (matching) type; no isCorrect; analogies natural and precise
- **1.2.1** — SO (sorting) type; drag-and-drop block construction; clean
- **1.2.2** — SO type; tamper chain sequence; correct order logic
- **1.2.3** — MT type; distributed ledger analogies; all four pairs accurate
- **1.2.5** — MT type; blockchain vs database comparison; technically precise
- **1.3.1** — MT type; decentralization in the real world; analogies excellent
- **1.3.2** — SI type; real-world blockchain adoption; one correct answer

**Chapter 2 — Crypto and Tokens**
- **2.1.2** — MT type; digital money vs bank account; technically accurate
- **2.1.3** — SO type; where does crypto live; correct categorization logic
- **2.1.4** — SI type; Amara scenario; previously-fixed double-negation confirmed clean; one correct answer
- **2.2.1** — MT type; coins vs tokens; technically correct
- **2.2.3** — SO type; token universe; three zones clearly defined
- **2.2.4** — MT type; Knowledge Tokens mechanics; well-explained
- **2.3.1** — MT type; previously-fixed "Bitcoin n'avait presque aucune valeur" confirmed correct
- **2.3.2** — SO type; reading a price chart; categorization logic sound

**Chapter 3 — Wallets, Transactions, Gas, Security**
- **3.1.1** — MT type; one fix applied (see above); otherwise clean
- **3.1.2** — SO type; public/private key sorting; correct
- **3.1.3** — MT type; hot vs cold wallets; analogies accurate
- **3.2.1** — SO type; transaction anatomy; five components correct
- **3.2.3** — SI type; mempool pending scenario; one correct answer, technically accurate
- **3.2.4** — ST type (3 steps); each step has exactly one correct answer; blockchain explorer explanation precise
- **3.3.1** — MT type; gas concepts; four analogies accurate
- **3.3.2** — SI type; gas price spike during NFT mint; one correct answer; market mechanics accurate
- **3.3.4** — SI type; failed transaction gas cost; one correct answer; technically accurate
- **3.4.1** — ST type (4 steps); one correct per step; seed phrase security content accurate
- **3.4.3** — MT type; security best practices; four pairs technically sound
- **3.4.4** — SO type; security checklist; three zones; categorizations correct

**Chapter 4 — Smart Contracts**
- **4.1.2** — SO type; what smart contracts can automate; correct categorizations
- **4.1.3** — MT type; smart contract properties; technically precise
- **4.2.1** — SI type; parametric insurance scenario; one correct answer; oracle concept introduced correctly
- **4.2.3** — SI type; Marc lunch explanation; one correct answer; explanation accurate

**Chapter 5 — NFTs**
- **5.1.1** — MT type; fungible vs non-fungible; clear analogies
- **5.1.3** — SO type; how NFTs work (5-step ordering); correct sequence
- **5.1.4** — ST type (4 steps); one correct per step; minting simulation accurate; "frais de gas" consistently used
- **5.2.1** — MT type; NFT use cases; four accurate pairings
- **5.2.3** — SI type; NFT ownership scenario; one correct answer; honest about storage limitations
- **5.3.1** — SI type; NFT boom/bust; one correct answer; market cycle analysis balanced
- **5.3.3** — MT type; NFT evaluation framework; four criteria well-explained
- **5.3.4** — SI type; honest NFT assessment; one correct answer; balanced conclusion

**Chapter 6 — DeFi, Web3, Synthesis**
- **6.1.1** — MT type; DeFi services vs banking; four accurate pairings; risk warning present
- **6.1.3** — SI type; CEX vs DEX; one correct answer; FTX mention accurate; risk warning present
- **6.1.4** — SI type; DeFi risks; one correct answer; risk warning present; TAP acronym used correctly
- **6.2.2** — MT type; Web1/2/3 concepts; four pairings accurate
- **6.2.3** — SI type; blockchain in daily life; one correct answer; MNBC mention current
- **6.2.4** — SI type; skeptic questions; one correct answer; energy/scalability claims accurate (Ethereum's ~99% reduction post-merge)
- **6.3.1** — SO type; ecosystem layers; three zones; categorizations correct
- **6.3.2** — SI type; explain to parent; one correct answer; "tu" in direct speech quotation is intentional (informal register within a quotation, not a breach of platform voice)
- **6.3.3** — ST type (4 steps); one correct per step; synthesis questions accurate

---

### Final Status
Total missions reviewed (both passes): 69/69
Total issues found: 6 (first review: 5 + second review: 1)
Total issues fixed directly in file: 6 (all fixes applied)

**Additional observation for future pass:** mission 3.1.4 step 3 contains "réaliser que" (anglicism, should be "se rendre compte que") — was outside scope of this review but flagged above.
