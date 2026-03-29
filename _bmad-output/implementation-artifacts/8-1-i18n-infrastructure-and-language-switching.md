# Story 8.1: i18n Infrastructure & Language Switching

Status: done

## Story

As a user,
I want to switch the platform language between French, English, and one additional language,
So that I can learn in my preferred language.

## Acceptance Criteria

1. **AC #1 — react-i18next configured:**
   Given the frontend application,
   When i18next is configured,
   Then react-i18next is installed with browser language detection,
   And fallback language is English,
   And interpolation escaping is disabled (React handles XSS).

2. **AC #2 — Translation files generated:**
   Given the content files `content/{locale}/ui.json`,
   When translation files are generated,
   Then `public/locales/en/translation.json` and `public/locales/fr/translation.json` exist,
   And they contain all 15 platform UI sections from the source content,
   And key structure matches between EN and FR.

3. **AC #3 — useLocale hook:**
   Given an authenticated user,
   When they use the language switcher,
   Then `useLocale()` hook returns the current locale and a `changeLocale()` function,
   And language switching happens within <500ms without page reload (NFR21).

4. **AC #4 — Backend locale support:**
   Given the API,
   When `GET /api/v1/ui-copy/:locale` is called,
   Then the UI copy JSON for the requested locale is returned,
   And invalid locales return 400 with `INVALID_LOCALE` error,
   And `Cache-Control: public, max-age=3600` is set.

5. **AC #5 — Shared locale schema:**
   Given the shared package,
   When locale validation is needed,
   Then `localeParamSchema` (Zod enum: 'en' | 'fr') is available from `@transcendence/shared`.

## Tasks / Subtasks

### Task 1: Install i18n dependencies
- [x] Add `react-i18next`, `i18next`, `i18next-browser-languagedetector` to `apps/web/package.json`

### Task 2: Configure i18next
- [x] Create `apps/web/src/i18n.ts` with browser language detection, EN/FR resources, fallback to 'en'
- [x] Import `./i18n` in `apps/web/src/main.tsx`

### Task 3: Generate translation files
- [x] Transform `content/en/ui.json` → `apps/web/public/locales/en/translation.json`
- [x] Transform `content/fr/ui.json` → `apps/web/public/locales/fr/translation.json`
- [x] Verify key parity between EN and FR (403 lines each)

### Task 4: Create useLocale hook
- [x] Create `apps/web/src/hooks/useLocale.ts` — returns `locale` and `changeLocale()`
- [x] Wraps `useTranslation` from react-i18next

### Task 5: Add locale Zod schema to shared package
- [x] Create `packages/shared/src/schemas/locale.ts` with `localeParamSchema`
- [x] Export `localeParamSchema` and `LocaleParam` type from shared index

### Task 6: Add UI copy API endpoint
- [x] Create `apps/api/src/routes/uiCopy.ts` — `GET /api/v1/ui-copy/:locale`
- [x] Zod validation, Cache-Control headers, public (no auth required)
- [x] Register in `apps/api/src/app.ts`
- [x] 5 unit tests in `uiCopy.test.ts`

## Dev Notes

- Translation files are generated once from content JSON, not dynamically loaded. If `content/{locale}/ui.json` changes, translation files must be regenerated.
- The i18n infrastructure is plumbing only — no existing components were modified to use `useTranslation()`. JB will wire translations into components as he builds them.
- A 3rd language (FR2 requirement) can be added by creating `content/{locale}/` files and adding the locale to the Zod enum — no code changes needed.
- The `GET /api/v1/ui-copy/:locale` endpoint resolves open question #2 from `docs/TEAM_STATUS.md`. JB can use either build-time imports or this endpoint.

## Testing

- 5 route tests: EN 200, FR 200, invalid locale 400, Cache-Control header, EN/FR key parity
- Content validation script (`pnpm validate:content`) verifies EN/FR UI copy key parity as check #8

## FRs Delivered

- FR39 (partial): i18n infrastructure for FR/EN language switching. Frontend component wiring deferred to JB.
- NFR21 (foundation): Framework supports <500ms language switching without reload.
