# Certificate Design Spec

> Platform: Transcendence (gamified blockchain learning)
> Audience: JB (frontend implementation)
> Tone: prestigious but accessible — earned, not handed out
> Last updated: 2026-03-16

---

## What the Certificate Shows

Every field below maps directly to what the certificate endpoint returns (see final section).

| Label on certificate | Data field | Source |
|---|---|---|
| Recipient name | `displayName` | User-provided name at completion time; falls back to "Anonymous" if null |
| Curriculum title | `curriculumTitle` | Always `"Blockchain Fundamentals"` (hardcoded in service) |
| Completion date | `completionDate` | ISO 8601 string — format as "Month DD, YYYY" for display |
| Total missions | `totalMissions` | Integer — currently 69 |
| Total categories | `totalCategories` | Integer — currently 6 |
| Certificate ID | `id` | UUID — display last 8 chars as a reference number (e.g. `#a3f8c21b`) |
| Share URL | derived from `shareToken` | `{BASE_URL}/certificates/{shareToken}` |

Fields NOT returned by the endpoint (not available on the certificate):
- Knowledge Token balance (not stored on certificate — omit from certificate design)
- Streak (not stored on certificate — omit from certificate design)

---

## Certificate Copy (EN)

**Headline:**
> Certificate of Completion

**Subheadline:**
> Blockchain Fundamentals

**Issuer line:**
> Issued by Transcendence — Blockchain Literacy Program

**Completion line:**
> This certifies that **[displayName]** has successfully completed all [totalMissions] missions across [totalCategories] categories of the Blockchain Fundamentals curriculum.

**Date line:**
> Completed on [Month DD, YYYY]

**Stats line:**
> [totalMissions] missions completed · [totalCategories] categories mastered

**Certificate reference (small, bottom corner):**
> Certificate ID: #[last 8 chars of id]

**Tagline / quote at bottom:**
> Understanding blockchain is understanding how trust gets built without asking permission.

---

## Certificate Copy (FR)

**Headline:**
> Certificat d'Accomplissement

**Subheadline:**
> Fondamentaux de la Blockchain

**Issuer line:**
> Délivré par Transcendence — Programme de Littératie Blockchain

**Completion line:**
> Ce certificat atteste que **[displayName]** a complété avec succès les [totalMissions] missions réparties sur [totalCategories] catégories du programme Fondamentaux de la Blockchain.

**Date line:**
> Complété le [JJ mois AAAA]

**Stats line:**
> [totalMissions] missions complétées · [totalCategories] catégories maîtrisées

**Certificate reference (small, bottom corner):**
> Certificat n° #[last 8 chars of id]

**Tagline / quote at bottom:**
> Comprendre la blockchain, c'est comprendre comment la confiance peut se construire sans demander la permission.

---

## Certificate Page UI Copy

This is the page the authenticated user sees after completing all missions, and also the public view anyone sees when they follow a share link.

### Authenticated owner view

#### EN

| Element | Copy |
|---|---|
| Page title (browser `<title>`) | Your Certificate — Transcendence |
| Page heading | Your certificate is ready. |
| Share prompt | You've completed the full Blockchain Fundamentals curriculum. Share your achievement. |
| Download button | Download PDF |
| Copy link button (default) | Copy link |
| Copy link button (after click) | Link copied |
| LinkedIn share button | Share on LinkedIn |
| Twitter/X share button | Share on X |

#### FR

| Element | Copy |
|---|---|
| Page title (browser `<title>`) | Votre Certificat — Transcendence |
| Page heading | Votre certificat est prêt. |
| Share prompt | Vous avez complété l'intégralité du programme Fondamentaux de la Blockchain. Partagez votre réussite. |
| Download button | Télécharger en PDF |
| Copy link button (default) | Copier le lien |
| Copy link button (after click) | Lien copié |
| LinkedIn share button | Partager sur LinkedIn |
| Twitter/X share button | Partager sur X |

### Public view (anyone visiting the share URL)

#### EN

| Element | Copy |
|---|---|
| Page title (browser `<title>`) | [displayName]'s Certificate — Transcendence |
| Page heading | [displayName] completed the Blockchain Fundamentals curriculum. |
| Sub-line | [totalMissions] missions · [totalCategories] categories · Blockchain Fundamentals |
| CTA below certificate | Learn blockchain yourself → Start for free |

#### FR

| Element | Copy |
|---|---|
| Page title (browser `<title>`) | Certificat de [displayName] — Transcendence |
| Page heading | [displayName] a complété le programme Fondamentaux de la Blockchain. |
| Sub-line | [totalMissions] missions · [totalCategories] catégories · Fondamentaux de la Blockchain |
| CTA below certificate | Apprenez la blockchain à votre tour → Commencer gratuitement |

---

## Social Sharing Copy

### Certificate Share

#### LinkedIn (EN)

**Post caption (≤300 chars):**
> I just completed the Blockchain Fundamentals curriculum on Transcendence — 69 missions across 6 categories. It's the clearest explanation of how blockchain actually works that I've come across. If you've been meaning to understand this space properly, worth a look.

**og:title:**
> [displayName] earned a Blockchain Fundamentals Certificate

**og:description:**
> Completed 69 missions across 6 categories on Transcendence — a structured, no-hype blockchain literacy program.

---

#### LinkedIn (FR)

**Post caption (≤300 chars):**
> Je viens de terminer le programme Fondamentaux de la Blockchain sur Transcendence — 69 missions, 6 catégories. C'est de loin l'approche la plus claire que j'ai trouvée pour vraiment comprendre comment la blockchain fonctionne. Si le sujet vous intéresse, ça vaut le coup.

**og:title:**
> [displayName] a obtenu son Certificat Fondamentaux de la Blockchain

**og:description:**
> 69 missions complétées sur 6 catégories — un programme de littératie blockchain structuré, sans hype.

---

#### Twitter/X (EN)

**Tweet (≤280 chars):**
> Just finished all 69 missions of the Blockchain Fundamentals curriculum on @transcendence_app. Took a while. Worth it. My certificate: [shareUrl]

**Fallback variant (if no @handle yet):**
> Just finished all 69 missions of the Blockchain Fundamentals curriculum. Took a while. Worth it. [shareUrl]

---

#### Twitter/X (FR)

**Tweet (≤280 chars):**
> Je viens de terminer les 69 missions du programme Fondamentaux de la Blockchain sur @transcendence_app. Ça m'a pris du temps. C'était mérité. Mon certificat : [shareUrl]

**Fallback variant (if no @handle yet):**
> Je viens de finir les 69 missions du programme Fondamentaux de la Blockchain. Le temps qu'il fallait. Mon certificat : [shareUrl]

---

#### Generic link preview / Open Graph (EN)

| Tag | Value |
|---|---|
| `og:title` | [displayName] completed Blockchain Fundamentals — Transcendence |
| `og:description` | 69 missions. 6 categories. A full blockchain literacy curriculum, completed. |
| `og:image alt text` | Certificate of Completion awarded to [displayName] for the Blockchain Fundamentals curriculum on Transcendence |

---

#### Generic link preview / Open Graph (FR)

| Tag | Value |
|---|---|
| `og:title` | [displayName] a complété Fondamentaux de la Blockchain — Transcendence |
| `og:description` | 69 missions. 6 catégories. Un programme complet de littératie blockchain, terminé. |
| `og:image alt text` | Certificat d'Accomplissement décerné à [displayName] pour le programme Fondamentaux de la Blockchain sur Transcendence |

---

### Achievement Share

For users who want to share a specific category completion (not the full certificate). Triggered from the category completion screen via a secondary "Share this" CTA.

#### EN

**Twitter/X (≤280 chars, per category):**

| Category | Tweet |
|---|---|
| Category 1 — Blockchain Foundations | Just finished the Blockchain Foundations section on @transcendence_app. Finally understand what problem it actually solves. [profileUrl] |
| Category 2 — Crypto & Tokens | Done with Crypto & Tokens on @transcendence_app. Coins, tokens, volatility — I can actually explain the difference now. [profileUrl] |
| Category 3 — Wallets & Gas | Finished Wallets & Gas on @transcendence_app. Self-custody, transactions, gas fees — the stuff most people skip. [profileUrl] |
| Category 4 — Smart Contracts | Wrapped up Smart Contracts on @transcendence_app. Blockchain as a computer. The concept clicked. [profileUrl] |
| Category 5 — NFTs & Digital Ownership | Done with the NFTs section on @transcendence_app. I can see through the hype now — and understand what's actually interesting about it. [profileUrl] |
| Category 6 — DeFi & Beyond | Finished all 6 categories on @transcendence_app. DeFi, the bigger picture, all of it. Certificate incoming. [shareUrl] |

**og:title (generic achievement share):**
> [displayName] completed [Category Name] on Transcendence

**og:description (generic achievement share):**
> Progressing through the Blockchain Fundamentals curriculum — [X] of 6 categories complete.

---

#### FR

**Twitter/X (≤280 chars, per category):**

| Catégorie | Tweet |
|---|---|
| Catégorie 1 — Fondements de la Blockchain | Je viens de terminer la section Fondements de la Blockchain sur @transcendence_app. Je comprends enfin quel problème ça résout vraiment. [profileUrl] |
| Catégorie 2 — Cryptos & Tokens | Catégorie Cryptos & Tokens terminée sur @transcendence_app. Coins, tokens, volatilité — je peux enfin expliquer la différence. [profileUrl] |
| Catégorie 3 — Wallets & Gas | Section Wallets & Gas terminée sur @transcendence_app. Custodie, transactions, frais de gas — les bases que la plupart ignorent. [profileUrl] |
| Catégorie 4 — Smart Contracts | Fin de la section Smart Contracts sur @transcendence_app. La blockchain comme ordinateur. Le concept a cliqué. [profileUrl] |
| Catégorie 5 — NFTs & Propriété Numérique | Section NFTs terminée sur @transcendence_app. Je vois à travers le hype — et je comprends ce qui est vraiment intéressant. [profileUrl] |
| Catégorie 6 — DeFi & Au-delà | 6 catégories complétées sur @transcendence_app. DeFi, vue d'ensemble, tout. Le certificat arrive. [shareUrl] |

---

## What the Certificate Endpoint Returns

Reference for JB — exact fields available from the API.

### Authenticated endpoint: `GET /api/v1/certificates/me`

Returns the `Certificate` type:

```typescript
type Certificate = {
  id: string;              // UUID — the certificate's unique identifier
  displayName: string | null; // User's display name at time of completion; may be null
  completionDate: string;  // ISO 8601 datetime string, e.g. "2026-03-16T14:32:00.000Z"
  curriculumTitle: string; // Always "Blockchain Fundamentals"
  shareToken: string;      // UUID used to construct the public share URL
  totalMissions: number;   // Number of missions completed (currently 69)
  totalCategories: number; // Number of categories in the curriculum (currently 6)
}
```

### Public endpoint: `GET /api/v1/certificates/:shareToken`

Returns the `PublicCertificate` type — same fields minus `id`:

```typescript
type PublicCertificate = {
  displayName: string | null;
  completionDate: string;
  curriculumTitle: string;
  shareToken: string;
  totalMissions: number;
  totalCategories: number;
}
```

### Share URL endpoint: `GET /api/v1/certificates/share-url`

Returns:
```typescript
{ shareUrl: string } // e.g. "https://transcendence.app/certificates/{shareToken}"
```

### Key implementation notes for JB

- **displayName can be null.** Always provide a fallback (e.g. "A learner" or "Anonymous") before rendering it in any public-facing copy. Do not render `null` or `undefined` on the certificate or in OG tags.
- **The certificate is idempotent.** Calling generate twice returns the same certificate — safe to call on every page load if needed.
- **Certificate is gated.** The `GET /me` endpoint throws `CERTIFICATE_NOT_AVAILABLE` (404) if not all missions are complete. Show a meaningful empty state rather than an error page.
- **Share URL construction:** `{BASE_URL}/certificates/{shareToken}` — the `shareToken` is a UUID. The `/share-url` endpoint returns the fully constructed URL as a convenience, or you can build it client-side from the `shareToken` field.
- **OG image:** The certificate share link should serve a dynamic OG image (e.g. via `/api/og/certificate/:shareToken`) that renders the certificate visually. This is a separate implementation task — placeholder static image is fine for v1.
- **Date formatting:** `completionDate` is ISO 8601. Format per locale: `"March 16, 2026"` (EN) / `"16 mars 2026"` (FR).
