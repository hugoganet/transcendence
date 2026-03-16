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
