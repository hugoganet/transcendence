# Story 3.1: Curriculum Content JSON Structure & Loader

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want the curriculum structure and content defined as static JSON files with a server-side loader,
So that content is versioned in git, translatable, and decoupled from code.

## Acceptance Criteria

1. **Given** the `content/` directory at project root,
   **When** the content files are examined,
   **Then** `structure.json` defines all 6 categories, 18 chapters, 69 missions with: IDs, ordering, unlock rules (sequential), exercise types (IP/CM/ST/SI), progressive reveal trigger flags, and last-reviewed dates,
   **And** IDs follow the format `{categoryNum}.{chapterNum}.{missionNum}` (e.g., "1.1.1", "2.2.4", "6.3.4").

2. **Given** the English content directory `content/en/`,
   **When** the files are loaded,
   **Then** `missions.json` contains English mission titles, descriptions, learning objectives, and exercise content for all 69 missions,
   **And** `tooltips.json` contains jargon tooltip definitions with plain-language definitions and real-world analogies,
   **And** `ui.json` contains curriculum-specific UI strings (category names, chapter names, exercise instructions).

3. **Given** the French content directory `content/fr/`,
   **When** the files are loaded,
   **Then** it mirrors the English structure with French translations for all mission titles, descriptions, and learning objectives,
   **And** `tooltips.json` contains French tooltip definitions,
   **And** `ui.json` contains French curriculum UI strings.

4. **Given** the `packages/shared/` workspace,
   **When** curriculum Zod schemas are imported,
   **Then** schemas validate the complete JSON structure: categories, chapters, missions, exercises, tooltips,
   **And** TypeScript types are inferred from the Zod schemas for use in both frontend and backend.

5. **Given** the `apps/api/` workspace,
   **When** the server starts,
   **Then** a `contentLoader.ts` utility loads and validates all JSON files at startup,
   **And** validated content is cached in memory for the server lifetime,
   **And** the loader throws a clear error if any JSON file fails validation (server does NOT start with invalid content).

6. **Given** each mission in `structure.json`,
   **When** its metadata is examined,
   **Then** it includes a `lastReviewedDate` field in ISO 8601 format (FR52),
   **And** the loader can identify missions with `lastReviewedDate` older than 6 months.

7. **Given** investment-related chapters (2.3, 6.1, 6.2),
   **When** their chapter metadata is examined in `structure.json`,
   **Then** they include a `disclaimerRequired: true` flag (FR53),
   **And** non-investment chapters have `disclaimerRequired: false` or the flag is absent.

## Tasks / Subtasks

- [x] Task 1: Design and create `content/structure.json` (AC: #1, #6, #7)
  - [x] 1.1 Create `content/structure.json` with the complete curriculum hierarchy:
    - Top level: array of 6 categories with `id`, `order`, `name` (key for i18n lookup), `description` (key), `platformMechanic` (what's active at this stage)
    - Each category contains `chapters`: array with `id`, `order`, `name` (key), `description` (key), `disclaimerRequired` boolean
    - Each chapter contains `missions`: array with `id`, `order`, `name` (key), `description` (key), `exerciseType` (enum: IP/CM/ST/SI), `estimatedMinutes` (2-5), `lastReviewedDate` (ISO 8601), `progressiveReveal` (null or object with `mechanic` and `description`)
  - [x] 1.2 Populate all 69 missions from curriculum roadmap with correct IDs, exercise types, and ordering
  - [x] 1.3 Add progressive reveal flags to trigger missions: 2.2.4 (tokensRevealed), 3.1.4 (walletRevealed), 3.3.3 (gasRevealed), 6.3.4 (dashboardRevealed)
  - [x] 1.4 Add `disclaimerRequired: true` to chapters 2.3, 6.1, 6.2
  - [x] 1.5 Set `lastReviewedDate` to current date ("2026-03-09") for all missions

- [x] Task 2: Create `content/en/missions.json` with English content (AC: #2)
  - [x] 2.1 Create JSON with keyed entries for all 69 missions:
    - Key: mission ID (e.g., "1.1.1")
    - Value: `{ title, description, learningObjective, exerciseContent }`
  - [x] 2.2 `exerciseContent` structure varies by type:
    - **SI (Scenario-Based Interpretation):** `{ scenario: string, question: string, options: Array<{ id, text, isCorrect, explanation }> }`
    - **CM (Concept Matching):** `{ instruction: string, pairs: Array<{ id, term, definition, analogy? }> }`
    - **IP (Interactive Placement):** `{ instruction: string, items: Array<{ id, label, correctPosition }>, zones?: Array<{ id, label }> }`
    - **ST (Step-by-Step Simulation):** `{ instruction: string, steps: Array<{ id, prompt, options: Array<{ id, text, isCorrect, explanation }>, microExplanation }> }`
  - [x] 2.3 Populate exercise content for at least missions 1.1.1 through 1.1.3 (first chapter) with full, meaningful educational content
  - [x] 2.4 For remaining missions (1.2.1–6.3.4), provide placeholder exercise content with correct structure (titles and learning objectives from curriculum roadmap, exercise content marked as `"placeholder": true`)

- [x] Task 3: Create `content/en/tooltips.json` with English tooltips (AC: #2)
  - [x] 3.1 Create JSON with keyed entries:
    - Key: term slug (e.g., "blockchain", "consensus", "gas-fee")
    - Value: `{ term, definition, analogy, relatedTerms: string[] }`
  - [x] 3.2 Create tooltip entries for at least 20 core terms covering Category 1 and 2 concepts (blockchain, block, hash, consensus, distributed-ledger, cryptocurrency, token, bitcoin, ethereum, wallet, private-key, public-key, gas-fee, smart-contract, nft, defi, mining, staking, decentralization, peer-to-peer)
  - [x] 3.3 Definitions must be plain-language (no jargon in definitions), analogies must use real-world comparisons

- [x] Task 4: Create `content/en/ui.json` with English UI strings (AC: #2)
  - [x] 4.1 Create JSON with keyed sections:
    - `categories`: display names for all 6 categories
    - `chapters`: display names for all 18 chapters
    - `exerciseTypes`: labels for IP, CM, ST, SI types
    - `labels`: generic curriculum UI labels (e.g., "missions", "completed", "locked", "available")

- [x] Task 5: Create French content files (AC: #3)
  - [x] 5.1 Create `content/fr/missions.json` — French translations of all mission titles, descriptions, learning objectives. Exercise content can remain in English as placeholder (i18n polish is Epic 8)
  - [x] 5.2 Create `content/fr/tooltips.json` — French translations of the 20 core tooltip terms
  - [x] 5.3 Create `content/fr/ui.json` — French translations of all UI strings

- [x] Task 6: Create Zod schemas in `packages/shared/` (AC: #4)
  - [x] 6.1 Create `packages/shared/src/schemas/curriculum.ts` with:
    - `exerciseTypeSchema`: z.enum(["IP", "CM", "ST", "SI"])
    - `progressiveRevealSchema`: object with `mechanic` (enum: tokensRevealed, walletRevealed, gasRevealed, dashboardRevealed) and `description`
    - `missionSchema`: object validating mission structure from structure.json
    - `chapterSchema`: object validating chapter with array of missions
    - `categorySchema`: object validating category with array of chapters
    - `curriculumStructureSchema`: array of categories
  - [x] 6.2 Create `packages/shared/src/schemas/exercise.ts` with:
    - `siExerciseContentSchema`: validates scenario-based interpretation content
    - `cmExerciseContentSchema`: validates concept-matching content
    - `ipExerciseContentSchema`: validates interactive-placement content
    - `stExerciseContentSchema`: validates step-by-step simulation content
    - `exerciseContentSchema`: discriminated union by exercise type
  - [x] 6.3 Create `packages/shared/src/schemas/tooltip.ts` with:
    - `tooltipSchema`: validates individual tooltip entry
    - `tooltipCollectionSchema`: validates full tooltips.json
  - [x] 6.4 Create `packages/shared/src/types/curriculum.ts` with inferred TypeScript types:
    - `ExerciseType`, `ProgressiveReveal`, `Mission`, `Chapter`, `Category`, `CurriculumStructure`
    - `SIExerciseContent`, `CMExerciseContent`, `IPExerciseContent`, `STExerciseContent`, `ExerciseContent`
    - `Tooltip`, `TooltipCollection`
    - `MissionContent`, `MissionContentCollection` (for locale missions.json)
    - `UIStrings` (for locale ui.json)
  - [x] 6.5 Export all schemas and types from `packages/shared/src/index.ts`

- [x] Task 7: Create `contentLoader.ts` in backend (AC: #5, #6)
  - [x] 7.1 Create `apps/api/src/utils/contentLoader.ts` with:
    - `loadCurriculum()`: reads and validates `content/structure.json` against `curriculumStructureSchema`
    - `loadMissions(locale: string)`: reads and validates `content/{locale}/missions.json`
    - `loadTooltips(locale: string)`: reads and validates `content/{locale}/tooltips.json`
    - `loadUIStrings(locale: string)`: reads and validates `content/{locale}/ui.json`
    - `initializeContent(locales: string[])`: loads everything at startup, throws on validation failure
    - `getContent()`: returns cached content (throws if not initialized)
  - [x] 7.2 Content is loaded once at startup using `fs.readFileSync` (blocking, before server starts listening)
  - [x] 7.3 Validation errors must include: which file failed, which schema rule failed, at what path in the JSON
  - [x] 7.4 Add `getStaleContent(months: number)` function that returns missions with `lastReviewedDate` older than N months
  - [x] 7.5 Call `initializeContent(["en", "fr"])` in server startup (`index.ts`) before Express starts listening

- [x] Task 8: Write tests (AC: #1–#7)
  - [x] 8.1 Schema validation tests (`packages/shared/`):
    - `curriculum.test.ts`: curriculumStructureSchema validates correct structure, rejects missing fields, rejects invalid exercise types, validates progressive reveal triggers
    - `exercise.test.ts`: each exercise type schema validates correct content, rejects missing fields
    - `tooltip.test.ts`: tooltipSchema validates correct entries, rejects missing fields
  - [x] 8.2 Content validation tests (`apps/api/`):
    - `contentLoader.test.ts`: loads and validates actual content files (integration test), throws on invalid JSON, caches content correctly, `getStaleContent()` filters by date
  - [x] 8.3 Content integrity tests:
    - All 69 missions in structure.json have corresponding entries in en/missions.json
    - All mission IDs follow the {cat}.{chap}.{mission} format
    - All exercise types match between structure.json and missions.json content shape
    - All progressive reveal missions exist (2.2.4, 3.1.4, 3.3.3, 6.3.4)
    - All tooltip `relatedTerms` reference existing tooltip keys
    - French content has all keys that English content has
  - [x] 8.4 Regression: existing tests still pass (227 tests across 20 files — up from 199/17, with 28 new API tests + 47 new shared tests)

## Dev Notes

### Critical Architecture Patterns

- **Content lives in `content/` at project root** — NOT in `apps/api/` or `apps/web/`. This is a deliberate architecture decision: content is shared, git-versioned, and decoupled from both frontend and backend code. [Source: architecture.md § Starter Template Evaluation — Project Structure]
- **Route handlers are thin**: validate → service → respond. The `contentLoader.ts` is a utility, NOT a service — it's infrastructure loaded at startup. Services will call `getContent()` to access cached data. [Source: architecture.md § Implementation Patterns]
- **Zod schemas in `packages/shared/`**: These schemas serve dual purpose — validating content JSON at server startup AND providing TypeScript types for both frontend and backend. [Source: architecture.md § Core Architectural Decisions — Data Architecture]
- **camelCase everywhere**: JSON field names, TypeScript properties, API responses. No snake_case in any JSON files. [Source: architecture.md § Naming Patterns]

### Content Architecture — Key Design Decisions

**structure.json is language-independent.** It contains IDs, ordering, exercise types, unlock rules, reveal triggers, and metadata. It does NOT contain any displayable text — all text comes from locale-specific files. This means:
- Adding a new language = adding a new locale folder with JSON files, zero code changes
- Changing curriculum structure = editing structure.json, independent of translations
- IDs in structure.json are used as lookup keys into locale files

**Exercise content lives in locale missions.json, NOT in structure.json.** The structure file defines WHAT exercise type a mission uses; the locale file defines the actual exercise CONTENT (questions, answers, scenarios, etc.). This separation means exercise content can be translated independently.

**Placeholder content strategy:** Only the first chapter (3 missions: 1.1.1–1.1.3) needs full, educational exercise content for initial development/testing. All other missions get structurally valid placeholder content with a `"placeholder": true` flag. This allows the content team to fill in real content progressively without blocking development.

### Curriculum Structure Reference

```
Category 1: Blockchain Foundations (11 missions)
  Chapter 1.1 — The Trust Problem (3 missions: 1.1.1–1.1.3)
  Chapter 1.2 — Blocks, Chains & Consensus (5 missions: 1.2.1–1.2.5)
  Chapter 1.3 — Why Decentralization Matters (3 missions: 1.3.1–1.3.3)

Category 2: Crypto & Tokens (12 missions)
  Chapter 2.1 — Digital Money (4 missions: 2.1.1–2.1.4)
  Chapter 2.2 — Coins, Tokens & the Crypto Zoo (4 missions: 2.2.1–2.2.4) ← Token reveal at 2.2.4
  Chapter 2.3 — Value, Price & Volatility (4 missions: 2.3.1–2.3.4) ← disclaimerRequired

Category 3: Wallets & Gas (16 missions)
  Chapter 3.1 — Your Digital Wallet (4 missions: 3.1.1–3.1.4) ← Wallet reveal at 3.1.4
  Chapter 3.2 — Making a Transaction (4 missions: 3.2.1–3.2.4)
  Chapter 3.3 — Gas Fees (4 missions: 3.3.1–3.3.4) ← Gas reveal at 3.3.3
  Chapter 3.4 — Staying Safe (4 missions: 3.4.1–3.4.4)

Category 4: Smart Contracts (7 missions)
  Chapter 4.1 — What Are Smart Contracts? (4 missions: 4.1.1–4.1.4)
  Chapter 4.2 — Smart Contracts Everywhere (3 missions: 4.2.1–4.2.3)

Category 5: NFTs & Digital Ownership (11 missions)
  Chapter 5.1 — What is an NFT? (4 missions: 5.1.1–5.1.4)
  Chapter 5.2 — NFTs Beyond Art (3 missions: 5.2.1–5.2.3)
  Chapter 5.3 — Hype, Scams & Reality (4 missions: 5.3.1–5.3.4)

Category 6: DeFi & Beyond (12 missions)
  Chapter 6.1 — DeFi: Banking Without Banks (4 missions: 6.1.1–6.1.4) ← disclaimerRequired
  Chapter 6.2 — The Bigger Picture (4 missions: 6.2.1–6.2.4) ← disclaimerRequired
  Chapter 6.3 — Everything Connected (4 missions: 6.3.1–6.3.4) ← Dashboard reveal at 6.3.4
```

### Exercise Type Schemas — Detailed Design

Each exercise type has a distinct content shape. The Zod schema must validate the correct shape based on the `exerciseType` field from structure.json.

**SI (Scenario-Based Interpretation) — 30 missions (43%):**
```json
{
  "scenario": "You receive an email saying...",
  "question": "What should you do?",
  "options": [
    { "id": "a", "text": "Click the link", "isCorrect": false, "explanation": "This is a phishing attempt..." },
    { "id": "b", "text": "Ignore it", "isCorrect": true, "explanation": "Correct! Never click..." }
  ]
}
```

**CM (Concept Matching) — 17 missions (25%):**
```json
{
  "instruction": "Match each term with its definition",
  "pairs": [
    { "id": "1", "term": "Blockchain", "definition": "A shared digital ledger", "analogy": "Like a shared Google Doc that nobody can secretly edit" },
    { "id": "2", "term": "Consensus", "definition": "Agreement among network participants", "analogy": "Like a group vote where everyone must agree" }
  ]
}
```

**IP (Interactive Placement) — 12 missions (17%):**
```json
{
  "instruction": "Arrange the blocks in the correct order",
  "items": [
    { "id": "1", "label": "Block #1 (Genesis)", "correctPosition": 0 },
    { "id": "2", "label": "Block #2", "correctPosition": 1 }
  ],
  "zones": [
    { "id": "z1", "label": "Position 1" },
    { "id": "z2", "label": "Position 2" }
  ]
}
```

**ST (Step-by-Step Simulation) — 10 missions (15%):**
```json
{
  "instruction": "Set up your first crypto wallet",
  "steps": [
    {
      "id": "1",
      "prompt": "First, choose a wallet type:",
      "options": [
        { "id": "a", "text": "Hot wallet (app)", "isCorrect": true, "explanation": "Good choice for beginners..." },
        { "id": "b", "text": "Cold wallet (hardware)", "isCorrect": false, "explanation": "Hardware wallets are more secure but..." }
      ],
      "microExplanation": "A hot wallet is an app on your phone or computer..."
    }
  ]
}
```

### Content Loader — Implementation Details

The `contentLoader.ts` utility follows a simple pattern:

1. **Startup phase** (synchronous, before Express listens):
   - Read all JSON files with `fs.readFileSync`
   - Parse JSON
   - Validate against Zod schemas
   - If ANY validation fails → throw with detailed error → server does NOT start
   - Store validated content in module-level variables (in-memory cache)

2. **Runtime phase** (via `getContent()`):
   - Returns cached, typed content objects
   - No file I/O on requests — everything is in memory
   - Services call `getContent().curriculum`, `getContent().missions("en")`, etc.

**Why synchronous loading:** Content is required for the server to function. Loading asynchronously would mean handling a "content not loaded yet" state on every request. Synchronous loading at startup is simpler and guarantees content is available before any request is served.

**Cache structure:**
```typescript
interface ContentCache {
  curriculum: CurriculumStructure;
  missions: Map<string, MissionContentCollection>; // locale → missions
  tooltips: Map<string, TooltipCollection>;         // locale → tooltips
  uiStrings: Map<string, UIStrings>;                // locale → ui strings
}
```

### File Structure Created by This Story

```
content/                          # NEW — curriculum content root
├── structure.json                # Language-independent curriculum structure (69 missions)
├── en/                           # English content
│   ├── missions.json             # Mission titles, descriptions, exercise content
│   ├── tooltips.json             # Jargon tooltip definitions
│   └── ui.json                   # Curriculum UI strings
└── fr/                           # French content
    ├── missions.json
    ├── tooltips.json
    └── ui.json

packages/shared/src/
├── schemas/
│   ├── curriculum.ts             # NEW — curriculum structure schemas
│   ├── exercise.ts               # NEW — exercise content schemas (4 types)
│   └── tooltip.ts                # NEW — tooltip schemas
├── types/
│   └── curriculum.ts             # NEW — TypeScript types inferred from schemas
└── index.ts                      # MODIFIED — export new schemas and types

apps/api/src/
├── utils/
│   └── contentLoader.ts          # NEW — loads, validates, caches content JSON
└── index.ts                      # MODIFIED — call initializeContent() before listen
```

### Testing Patterns from Previous Stories

From Stories 2.1–2.7:
- **vi.hoisted()** for mocks in Vitest test files
- **Co-located tests** with source files: `contentLoader.test.ts` next to `contentLoader.ts`
- **Shared package tests** in `packages/shared/src/schemas/`: schema tests co-located with schema files
- **Express 5 async handling** — no try/catch in routes
- **Integration tests** use actual files (for contentLoader, test against real content/*.json files)

### Existing Shared Package Exports

Current exports from `packages/shared/src/index.ts`:
```
Types: ApiResponse, ApiError, OAuthProvider, RegisterInput, LoginInput, UserProfile, UpdateProfileInput
Schemas: registerSchema, loginSchema, passwordResetRequestSchema, passwordResetSchema, totpCodeSchema, userProfileSchema, oauthProviderSchema, updateProfileSchema, moduleIdParamSchema, apiResponseSchema, apiErrorSchema
Constants: API_VERSION, DEFAULT_PORT, SESSION_TIMEOUT_MS
```

This story adds curriculum, exercise, and tooltip schemas + types to this export list.

### Dependencies — No New Packages Needed

- **Zod** — already in `packages/shared` dependencies
- **fs** — Node.js built-in, already available in `apps/api`
- **path** — Node.js built-in
- No new npm packages required for this story

### Project Structure Notes

- `content/` at project root aligns with architecture.md § Project Structure
- Shared Zod schemas in `packages/shared/src/schemas/` follow established pattern
- Content loader in `apps/api/src/utils/` matches architecture pattern (utilities live in `utils/`)
- Tests co-located with source files per project convention

### References

- [Source: _bmad-output/planning-artifacts/epics.md — Epic 3, Story 3.1]
- [Source: _bmad-output/planning-artifacts/architecture.md § Starter Template Evaluation — Project Structure: content/ directory layout]
- [Source: _bmad-output/planning-artifacts/architecture.md § Content Architecture Decision: static JSON files, DB for user state only]
- [Source: _bmad-output/planning-artifacts/architecture.md § Core Architectural Decisions — Data Architecture: Zod schemas in packages/shared]
- [Source: _bmad-output/planning-artifacts/architecture.md § Implementation Patterns: camelCase, co-located tests, thin routes]
- [Source: _bmad-output/planning-artifacts/curriculum-roadmap.md — complete curriculum: 6 categories, 18 chapters, 69 missions]
- [Source: _bmad-output/planning-artifacts/curriculum-roadmap.md § Progressive Reveal Alignment: trigger missions]
- [Source: _bmad-output/planning-artifacts/prd.md — FR52: content freshness tags, FR53: financial disclaimer flags]
- [Source: _bmad-output/planning-artifacts/ux-design-specification.md — Progressive reveal system, exercise types]
- [Source: _bmad-output/implementation-artifacts/2-7-financial-disclaimer-and-onboarding-gate.md — disclaimerRequired chapters: 2.3, 6.1, 6.2]
- [Source: packages/shared/src/index.ts — current shared exports to extend]

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- Pre-existing TS build errors in apps/api (disclaimers.test.ts, users.test.ts, authService.ts) — not related to this story, all pre-existing from Epic 2 stories.

### Completion Notes List

- Created complete curriculum structure (69 missions, 18 chapters, 6 categories) in `content/structure.json`
- Missions 1.1.1–1.1.3 have full educational exercise content; remaining 66 have structurally valid placeholders
- 20 jargon tooltips with plain-language definitions and real-world analogies
- Full English and French content files (fr/missions.json has translated titles/descriptions/objectives, exercise content placeholder only)
- Zod schemas in packages/shared validate all content at build-time and runtime
- contentLoader.ts loads and validates all JSON at server startup, caches in memory, throws on invalid content
- 274 total tests pass (227 API + 47 shared), zero regressions
- Added vitest config and test script to packages/shared (was missing)

### File List

New files:
- content/structure.json
- content/en/missions.json
- content/en/tooltips.json
- content/en/ui.json
- content/fr/missions.json
- content/fr/tooltips.json
- content/fr/ui.json
- packages/shared/src/schemas/curriculum.ts
- packages/shared/src/schemas/curriculum.test.ts
- packages/shared/src/schemas/exercise.ts
- packages/shared/src/schemas/exercise.test.ts
- packages/shared/src/schemas/tooltip.ts
- packages/shared/src/schemas/tooltip.test.ts
- packages/shared/src/types/curriculum.ts
- packages/shared/vitest.config.ts
- apps/api/src/utils/contentLoader.ts
- apps/api/src/utils/contentLoader.test.ts
- apps/api/src/utils/contentIntegrity.test.ts

Modified files:
- packages/shared/src/index.ts (added curriculum/exercise/tooltip schema and type exports)
- packages/shared/package.json (added test script)
- apps/api/src/index.ts (added initializeContent call at startup)
- _bmad-output/implementation-artifacts/sprint-status.yaml (status update)

## Change Log

- 2026-03-09: Story 3.1 implemented — curriculum JSON content system with Zod validation and server-side loader
- 2026-03-09: Code review (AI) — Found 15 issues (4 CRITICAL, 4 HIGH, 4 MEDIUM, 3 LOW). Fixed all CRITICAL and HIGH:
  - CRITICAL: Replaced permissive `z.record(z.unknown())` with actual `exerciseContentSchema` union + placeholder fallback in contentLoader.ts
  - CRITICAL: Removed unsafe `as MissionContentCollection` type assertion
  - CRITICAL: Fixed empty "throws before initialization" test — now uses `vi.resetModules()` to properly test uninitialized state
  - CRITICAL: Added real stale content test using `vi.useFakeTimers()` to verify detection with future dates
  - HIGH: Wrapped `initializeContent()` in try-catch in index.ts with `process.exit(1)` on failure
  - HIGH: Added error context to `readJsonFile()` — catches ENOENT/SyntaxError with file path info
  - HIGH: Replaced fragile `process.cwd()` path with `import.meta.url`-based resolution
  - HIGH: Replaced shallow `toHaveProperty()` checks in contentIntegrity.test.ts with actual Zod schema validation via `.safeParse()`
