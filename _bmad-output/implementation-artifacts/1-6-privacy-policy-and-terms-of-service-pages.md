# Story 1.6: Privacy Policy & Terms of Service Pages

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a user,
I want to view the Privacy Policy and Terms of Service,
So that I understand how my data is handled before signing up.

## Acceptance Criteria

1. **Given** the user navigates to `/privacy-policy` **When** the page loads **Then** the Privacy Policy content is displayed in a readable format **And** the page is accessible without authentication (public route)

2. **Given** the user navigates to `/terms-of-service` **When** the page loads **Then** the Terms of Service content is displayed in a readable format **And** the page is accessible without authentication (public route)

3. **Given** both pages **When** viewed on any viewport (mobile 320px+, tablet 768px+, desktop 1024px+) **Then** content is properly formatted and readable **And** a navigation link exists to return to the landing/login page

4. **Given** the SPA routing **When** the user directly visits `/privacy-policy` or `/terms-of-service` via URL (deep link) **Then** the correct page is rendered (SPA routing handles it, no 404)

5. **Given** the React app **When** routes are defined **Then** React Router v7 is installed and configured with `BrowserRouter` wrapping the app **And** a `Routes`/`Route` structure is set up that other stories can extend

## Tasks / Subtasks

- [x] Task 1: Install React Router and set up basic routing (AC: #4, #5)
  - [x] 1.1: Install `react-router-dom` (v7.x) in `apps/web`
  - [x] 1.2: Update `main.tsx` to wrap `<App />` with `<BrowserRouter>`
  - [x] 1.3: Update `App.tsx` to use `<Routes>` and `<Route>` for page routing
  - [x] 1.4: Define routes: `/` (placeholder landing), `/privacy-policy`, `/terms-of-service`
  - [x] 1.5: Add a catch-all route for 404 (simple "Page not found" with link to `/`)

- [x] Task 2: Create PrivacyPolicy page component (AC: #1, #3)
  - [x] 2.1: Create `apps/web/src/pages/PrivacyPolicy.tsx`
  - [x] 2.2: Add Privacy Policy content covering: data collection, usage, storage, third-party sharing, cookies/sessions, user rights (GDPR: export, deletion), contact information, data retention
  - [x] 2.3: Style with Tailwind for readable typography (max-width container, proper heading hierarchy, paragraph spacing, responsive padding)
  - [x] 2.4: Add "Back to home" navigation link at top (using React Router `<Link>`)

- [x] Task 3: Create TermsOfService page component (AC: #2, #3)
  - [x] 3.1: Create `apps/web/src/pages/TermsOfService.tsx`
  - [x] 3.2: Add Terms of Service content covering: acceptance of terms, description of service, user accounts (age 16+), acceptable use, intellectual property, limitation of liability, termination, governing law, changes to terms
  - [x] 3.3: Style identically to PrivacyPolicy for visual consistency
  - [x] 3.4: Add "Back to home" navigation link at top (using React Router `<Link>`)

- [x] Task 4: Update landing placeholder to link to legal pages (AC: #3)
  - [x] 4.1: Update the existing App landing placeholder (or create a simple `Landing.tsx` page) with links to `/privacy-policy` and `/terms-of-service`

- [x] Task 5: Write tests (AC: #1, #2, #3, #4)
  - [x] 5.1: Install `@testing-library/react` and `@testing-library/jest-dom` as devDependencies if not present
  - [x] 5.2: Create `apps/web/src/pages/PrivacyPolicy.test.tsx` — test rendering, content sections present, back link works
  - [x] 5.3: Create `apps/web/src/pages/TermsOfService.test.tsx` — test rendering, content sections present, back link works
  - [x] 5.4: Update/create `apps/web/src/App.test.tsx` — test routing: each path renders correct page

- [x] Task 6: Verify Nginx SPA fallback for deep links (AC: #4)
  - [x] 6.1: Verify `docker/nginx/nginx.conf` already has `try_files $uri $uri/ /index.html` (should exist from Story 1.5)
  - [x] 6.2: If running in Docker, test that direct navigation to `https://localhost/privacy-policy` works (no Nginx 404)

## Dev Notes

### Critical: This is the FIRST Frontend Story

This story establishes the **foundational frontend patterns** that all subsequent FE stories will follow. Decisions made here set precedents for:
- Page component structure and location (`pages/` directory)
- Routing setup and patterns
- Component naming conventions (PascalCase.tsx files)
- Test file co-location and patterns
- Responsive design approach with Tailwind

**Be deliberate and consistent — every FE story after this one will reference these patterns.**

### React Router v7 Setup

React Router v7 (latest: 7.13.x) is fully compatible with React 19 and Vite 7. Use the **simple BrowserRouter approach** (not data routers with `createBrowserRouter`) since:
- This project uses TanStack Query for data fetching (per architecture), not React Router loaders
- BrowserRouter is simpler and matches the architecture's separation of concerns

**Setup pattern:**

```tsx
// main.tsx
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// App.tsx
import { Routes, Route } from "react-router-dom";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-of-service" element={<TermsOfService />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
```

[Source: React Router v7 docs — https://reactrouter.com/]

### Page Component Structure

Per architecture, pages go in `apps/web/src/pages/`:

```
apps/web/src/
  pages/
    PrivacyPolicy.tsx
    PrivacyPolicy.test.tsx
    TermsOfService.tsx
    TermsOfService.test.tsx
```

- File naming: **PascalCase.tsx** for React components [Source: architecture.md#Naming Patterns]
- Tests: **co-located** with source files [Source: architecture.md#Structure Patterns]
- No subdirectory per page needed for simple pages (subdirectories are for components with multiple files)

### Content Approach

Privacy Policy and Terms of Service content should be **hardcoded in the components** as JSX. Rationale:
- These are static legal pages, not user-generated or CMS-driven content
- i18n translation will be handled later (Story 8.1) — for now, English only
- Content should cover GDPR requirements since the project has GDPR features (FR43-FR44): data export, data deletion, session management
- Include the platform name "Transcendence" in the content
- Include reference to age eligibility (16+) per FR51

**Do NOT:**
- Fetch content from an API (these are static pages)
- Use markdown rendering libraries (plain JSX with Tailwind is sufficient)
- Create a shared layout component yet (premature abstraction — wait until more pages exist)

### Responsive Design with Tailwind 4

The project uses Tailwind CSS 4 (installed, configured via `@tailwindcss/vite` plugin). No custom design tokens are configured yet (that's Story 8.4).

For these pages, use **standard Tailwind utilities**:

```tsx
<div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
  <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
  <section className="mb-8">
    <h2 className="text-xl font-semibold mb-3">...</h2>
    <p className="text-base leading-relaxed text-gray-700 mb-4">...</p>
  </section>
</div>
```

**Key responsive considerations:**
- `max-w-3xl` container for readable line length (~65ch)
- Horizontal padding scales: `px-4` mobile → `sm:px-6` tablet → `lg:px-8` desktop
- Typography uses Tailwind defaults for now (custom fonts in Story 8.4)
- No bottom navigation yet (Story 8.4 — design system)

[Source: architecture.md#Frontend Architecture — Tailwind utility classes]
[Source: UX design spec — mobile-primary, 320px floor]

### Architecture Compliance

| Requirement | How This Story Addresses It |
|---|---|
| FR46 (Privacy Policy page) | `/privacy-policy` route with content |
| FR47 (Terms of Service page) | `/terms-of-service` route with content |
| NFR17 (Responsive design) | Tailwind responsive utilities for mobile/tablet/desktop |
| NFR5 (Zero console errors) | TypeScript strict, no `any`, clean React component rendering |
| Public routes per architecture | No auth checks on these routes [Source: architecture.md#Frontend Architecture — public routes] |

### What This Story Does NOT Include

- No authentication/route guards (Story 2.8)
- No custom design tokens/fonts (Story 8.4 — design system)
- No i18n/translation (Story 8.1)
- No bottom/top navigation components (Story 8.4)
- No shared page layout wrapper (premature — let patterns emerge)
- No API calls (static content pages)
- No Zustand stores or TanStack Query setup
- No Socket.IO client setup

### Project Structure Notes

- This story creates the `apps/web/src/pages/` directory — aligns with architecture spec [Source: architecture.md#Complete Project Directory Structure]
- Landing page placeholder should be minimal — Epic 2 Story 2.8 will build the real landing page
- The 404 catch-all route can be a simple inline component for now (no dedicated NotFound.tsx file needed)

### Testing Standards

Per architecture: **Vitest + React Testing Library** for component tests.

```tsx
// Example test pattern
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { PrivacyPolicy } from "./PrivacyPolicy";

describe("PrivacyPolicy", () => {
  it("renders the privacy policy heading", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicy />
      </MemoryRouter>
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/privacy policy/i);
  });

  it("has a link back to home", () => {
    render(
      <MemoryRouter>
        <PrivacyPolicy />
      </MemoryRouter>
    );
    expect(screen.getByRole("link", { name: /back|home/i })).toHaveAttribute("href", "/");
  });
});
```

**Note:** Use `MemoryRouter` in tests (not `BrowserRouter`) — standard React Router testing pattern. [Source: React Router testing docs]

**Existing tests:** The `App.test.tsx` from Story 1.1 exists and must be updated (not deleted) to work with the new routing setup.

[Source: architecture.md#Testing Strategy — Vitest + React Testing Library]

### Previous Story Intelligence (from 1-5)

**Relevant learnings from Story 1.5:**
- Nginx `try_files $uri $uri/ /index.html` is already configured for SPA routing — deep links to `/privacy-policy` will work in Docker
- The Vite build output goes to `apps/web/dist/` and is served by Nginx
- Frontend URL is `https://localhost` in Docker (configurable via `VITE_API_URL`)
- `.dockerignore` excludes `node_modules` — new dependencies (react-router-dom) don't affect Docker image layers (they're installed during build)

**Git patterns from recent commits:**
- Commit style: `feat(web): ...` for frontend changes
- All 5 previous stories are backend/infrastructure — this is the first frontend code story
- 54 tests exist (all in `apps/api` and `apps/web`) — must not regress

### Library & Framework Requirements

| Technology | Version | Purpose | Notes |
|---|---|---|---|
| react-router-dom | ^7.13.0 | Client-side routing | SPA routing with BrowserRouter. Install in apps/web. |
| @testing-library/react | latest | Component testing | May need to install if not already present. Check apps/web devDependencies. |
| @testing-library/jest-dom | latest | DOM matchers for tests | Provides `toHaveTextContent`, `toBeInTheDocument`, etc. |

### File Structure Requirements

**Files to CREATE:**
- `apps/web/src/pages/PrivacyPolicy.tsx` — Privacy Policy page component
- `apps/web/src/pages/PrivacyPolicy.test.tsx` — Privacy Policy tests
- `apps/web/src/pages/TermsOfService.tsx` — Terms of Service page component
- `apps/web/src/pages/TermsOfService.test.tsx` — Terms of Service tests

**Files to MODIFY:**
- `apps/web/package.json` — Add `react-router-dom` dependency (and testing libs if missing)
- `apps/web/src/main.tsx` — Wrap App with `BrowserRouter`
- `apps/web/src/App.tsx` — Add `Routes`/`Route` setup with all routes
- `apps/web/src/App.test.tsx` — Update to test routing

**Files NOT to touch:**
- `apps/web/vite.config.ts` — No changes needed
- `apps/web/src/index.css` — No changes needed (Tailwind directives already there)
- `apps/web/src/test-setup.ts` — No changes needed unless testing libs require it
- `apps/api/**` — No backend changes for this story
- `packages/shared/**` — No shared package changes
- `docker/**` — No Docker changes needed
- `docker-compose.yml` — No changes needed

### References

- [Source: architecture.md#Frontend Architecture] — React Router for public/protected routes, pages/ directory structure
- [Source: architecture.md#Complete Project Directory Structure] — PrivacyPolicy.tsx and TermsOfService.tsx listed in pages/
- [Source: architecture.md#Naming Patterns] — PascalCase.tsx for components, co-located tests
- [Source: architecture.md#Implementation Patterns] — ESM, TypeScript strict, camelCase throughout
- [Source: epics.md#Story 1.6] — Acceptance criteria, user story, [FE] tag
- [Source: 1-5-docker-compose-and-https-deployment.md] — Nginx SPA routing already configured
- [React Router v7 docs](https://reactrouter.com/) — BrowserRouter setup, Routes/Route API
- [React Router testing patterns](https://reactrouter.com/en/main/guides/testing) — MemoryRouter for tests

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

No debug issues encountered.

### Completion Notes List

- Installed react-router-dom v7.13.1 in apps/web
- Set up BrowserRouter in main.tsx wrapping App component
- Configured Routes/Route structure in App.tsx with 4 routes: /, /privacy-policy, /terms-of-service, and * (404)
- Created PrivacyPolicy page with 9 sections covering: introduction, data collection, data usage, storage & security, cookies & sessions, third-party sharing, GDPR rights (access, export, rectification, deletion, restriction, objection), data retention, and contact info
- Created TermsOfService page with 10 sections covering: acceptance of terms, description of service (educational disclaimer about simulated tokens), user accounts (16+ age requirement), acceptable use, educational content disclaimer, intellectual property, limitation of liability, termination, governing law, changes to terms
- Both pages use identical Tailwind styling: max-w-3xl container, responsive padding (px-4/sm:px-6/lg:px-8), proper heading hierarchy, readable typography
- Landing page updated with links to both legal pages
- 404 catch-all route with "Back to home" link
- Testing libraries already available at root level (not re-installed)
- 20 web tests added: 7 PrivacyPolicy, 8 TermsOfService, 5 App routing
- All 73 tests pass (53 API + 20 web), zero regressions
- Web linting passes cleanly (pre-existing API lint issues not related to this story)
- Nginx try_files SPA fallback confirmed present from Story 1.5

### Change Log

- 2026-03-07: Implemented Story 1.6 — Privacy Policy & Terms of Service pages with React Router v7 routing, responsive Tailwind styling, and comprehensive test coverage
- 2026-03-07: Code review fixes — added test deps to web package.json, replaced text-teal-600 with text-primary for design consistency, changed div→main for WCAG 1.3.1 landmarks, added document.title per page for WCAG 2.4.2, added 8 missing section tests (28 total web tests)

### File List

- `apps/web/package.json` — Modified: added react-router-dom ^7.13.1 dependency
- `apps/web/src/main.tsx` — Modified: wrapped App with BrowserRouter
- `apps/web/src/App.tsx` — Modified: added Routes/Route structure with Landing, PrivacyPolicy, TermsOfService, and NotFound routes
- `apps/web/src/App.test.tsx` — Modified: updated to test routing with MemoryRouter (5 tests)
- `apps/web/src/pages/PrivacyPolicy.tsx` — Created: Privacy Policy page component (9 sections)
- `apps/web/src/pages/PrivacyPolicy.test.tsx` — Created: Privacy Policy tests (7 tests)
- `apps/web/src/pages/TermsOfService.tsx` — Created: Terms of Service page component (10 sections)
- `apps/web/src/pages/TermsOfService.test.tsx` — Created: Terms of Service tests (8 tests)
- `pnpm-lock.yaml` — Modified: updated with react-router-dom dependency
