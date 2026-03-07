# Story 1.1: Monorepo Scaffold & Dev Tooling

Status: done

<!-- Note: Validation is optional. Run validate-create-story for quality check before dev-story. -->

## Story

As a developer,
I want a working monorepo with frontend, backend, and shared packages configured,
So that the team can begin development with a consistent, type-safe foundation.

## Acceptance Criteria

1. **Given** a fresh clone of the repository **When** `pnpm install` is run at the root **Then** all workspace dependencies are installed for apps/web, apps/api, and packages/shared **And** TypeScript strict mode compiles without errors across all workspaces

2. **Given** the monorepo structure **When** Turborepo tasks (`build`, `dev`, `lint`, `test`) are run **Then** all tasks execute successfully with proper workspace orchestration

3. **Given** `packages/shared` **When** its exports are imported from apps/web or apps/api **Then** imports resolve correctly and TypeScript provides full type inference

4. **Given** the code quality tools **When** ESLint and Prettier are configured **Then** they enforce project conventions (camelCase variables/functions, PascalCase components/types, UPPER_SNAKE_CASE constants) **And** `pnpm lint` passes on all workspaces

5. **Given** the test framework **When** Vitest is configured in apps/web and apps/api **Then** a passing placeholder test exists in each workspace **And** `pnpm test` runs successfully

6. **Given** the repository **When** `.gitignore` is examined **Then** it includes node_modules, dist, .env, and build artifacts

7. **Given** the repository root **When** `README.md` is examined **Then** it contains all 42-required sections: project description, setup instructions, environment variables, usage, team members

## Tasks / Subtasks

- [x] Task 1: Initialize Turborepo monorepo with pnpm workspaces (AC: #1, #2)
  - [x] 1.1: Create `pnpm-workspace.yaml` defining `apps/*` and `packages/*` workspaces
  - [x] 1.2: Create `turbo.json` with pipeline tasks: `build`, `dev`, `lint`, `test`
  - [x] 1.3: Create root `package.json` with workspace scripts
  - [x] 1.4: Create root `tsconfig.json` with shared TypeScript config (strict mode)

- [x] Task 2: Scaffold apps/web — React + Vite + Tailwind (AC: #1, #3)
  - [x] 2.1: Create `apps/web/package.json` with dependencies: react@19, react-dom@19, vite@7, @vitejs/plugin-react@5, tailwindcss@4, @tailwindcss/vite, typescript@5.8
  - [x] 2.2: Create `apps/web/vite.config.ts` with React and Tailwind plugins
  - [x] 2.3: Create `apps/web/tsconfig.json` extending root config with DOM lib and JSX
  - [x] 2.4: Create `apps/web/src/main.tsx` entry point with basic React render
  - [x] 2.5: Create `apps/web/src/App.tsx` with placeholder component
  - [x] 2.6: Create `apps/web/src/index.css` with `@import "tailwindcss";`
  - [x] 2.7: Create `apps/web/index.html` with Vite entry point

- [x] Task 3: Scaffold apps/api — Express + TypeScript (AC: #1)
  - [x] 3.1: Create `apps/api/package.json` with dependencies: express@5, typescript@5.8, tsx (dev runner)
  - [x] 3.2: Create `apps/api/tsconfig.json` extending root config with Node types
  - [x] 3.3: Create `apps/api/src/index.ts` with basic Express server (port 3000)
  - [x] 3.4: Create `apps/api/src/app.ts` with Express app setup (placeholder health route at `GET /api/v1/health`)

- [x] Task 4: Scaffold packages/shared — Zod schemas, types, constants (AC: #3)
  - [x] 4.1: Create `packages/shared/package.json` with zod dependency and proper exports config
  - [x] 4.2: Create `packages/shared/tsconfig.json` extending root config
  - [x] 4.3: Create `packages/shared/src/index.ts` barrel export
  - [x] 4.4: Create `packages/shared/src/types/api.ts` with `ApiResponse<T>` and `ApiError` types
  - [x] 4.5: Create `packages/shared/src/schemas/common.ts` with a sample Zod schema
  - [x] 4.6: Create `packages/shared/src/constants/config.ts` with placeholder constants
  - [x] 4.7: Verify imports work from apps/web and apps/api

- [x] Task 5: Configure ESLint + Prettier (AC: #4)
  - [x] 5.1: Create root `eslint.config.ts` (flat config) with TypeScript + React rules
  - [x] 5.2: Create root `.prettierrc` with project conventions
  - [x] 5.3: Install eslint, typescript-eslint, eslint-plugin-react-hooks, eslint-config-prettier, prettier at root
  - [x] 5.4: Add `lint` and `format` scripts to root `package.json`
  - [x] 5.5: Verify `pnpm lint` passes on all workspaces
  - [x] 5.6: **IMPORTANT**: If `eslint-plugin-react` has compatibility issues with ESLint v10, fall back to ESLint v9 — see Dev Notes

- [x] Task 6: Configure Vitest testing framework (AC: #5)
  - [x] 6.1: Install vitest@4 and @testing-library/react at root or per workspace
  - [x] 6.2: Create `apps/web/vitest.config.ts` with jsdom environment
  - [x] 6.3: Create `apps/api/vitest.config.ts` with node environment
  - [x] 6.4: Create `apps/web/src/App.test.tsx` — placeholder test that renders App component
  - [x] 6.5: Create `apps/api/src/app.test.ts` — placeholder test that checks health endpoint
  - [x] 6.6: Verify `pnpm test` runs both workspaces successfully

- [x] Task 7: Repository configuration (AC: #6, #7)
  - [x] 7.1: Create/update `.gitignore` with: node_modules, dist, .env, coverage, .turbo, *.tsbuildinfo
  - [x] 7.2: Create `.env.example` with placeholder variables (PORT, DATABASE_URL, REDIS_URL, SESSION_SECRET)
  - [x] 7.3: Update `README.md` with 42-required sections: project description, setup instructions, environment variables, usage, team members

## Dev Notes

### Critical Architecture Constraints

- **Monorepo tool**: Turborepo 2.8.x + pnpm 10.x workspaces — NOT Nx, NOT Lerna
- **No template**: Scaffold from scratch (DIY monorepo). The `create-turbo` starter defaults to Next.js which is wrong for this stack
- **TypeScript strict mode**: Required across all workspaces — no `any`, no `@ts-ignore`
- **Node.js requirement**: Minimum Node 20.19+ (Vite 7 requirement)

### Technology Versions (verified March 2026)

| Technology | Target Version | Notes |
|---|---|---|
| Turborepo | 2.8.x | Use `turbo` package, not `create-turbo` template |
| pnpm | 10.x | Enable via `corepack enable` |
| TypeScript | 5.8.x | GA released Feb 28, 2026 |
| React | 19.x (19.2.4) | Stable since Dec 2024 |
| Vite | 7.x (7.3.1) | Do NOT install v8 beta or `@vitejs/plugin-react@beta` |
| @vitejs/plugin-react | 5.x | Version 6.x targets Vite 8 — avoid |
| Tailwind CSS | 4.x (4.2.1) | Uses `@tailwindcss/vite` plugin, NO `tailwind.config.js` needed |
| Express | 5.x (5.2.1) | Now default on npm, async errors auto-caught |
| Vitest | 4.x (4.0.18) | Compatible with Vite 7 |
| ESLint | 10.x or 9.x | v10 is very new — see ESLint note below |
| Prettier | 3.8.x | No breaking changes |
| Zod | latest | Shared validation schemas |

### ESLint v10 Compatibility Warning

ESLint v10 was released February 6, 2026. `eslint-plugin-react` has an open compatibility issue ([#3977](https://github.com/jsx-eslint/eslint-plugin-react/issues/3977)). **If `eslint-plugin-react` fails with ESLint v10, fall back to ESLint v9.x.** The flat config format (`eslint.config.ts`) works in both v9 and v10.

Key v10 changes:
- `.eslintrc.*` files are completely ignored (not a warning — silent)
- Config lookup starts from the linted file's directory (relevant for monorepos)
- Node.js < 20.19 dropped

### Tailwind CSS v4 Setup — No Config File

Tailwind v4 does NOT use `tailwind.config.js`. Configuration is done in CSS:

```css
/* apps/web/src/index.css */
@import "tailwindcss";

@theme {
  --color-primary: #2B9E9E;      /* Teal primary */
  --color-secondary: #D4A843;     /* Amber secondary */
  --font-heading: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Source Sans 3', sans-serif;
}
```

Use the `@tailwindcss/vite` plugin (not PostCSS):

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [tailwindcss(), react()],
})
```

### Express 5 Key Differences from v4

- Async middleware errors are caught automatically (rejected promises forwarded to error handler)
- Path route matching is stricter
- `req.query` uses a stricter parser by default

### Naming Conventions (from Architecture)

| Element | Convention | Example |
|---|---|---|
| Files — React components | PascalCase.tsx | `Button.tsx` |
| Files — utilities, hooks, services | camelCase.ts | `useAuth.ts` |
| Files — tests | `*.test.ts` / `*.test.tsx` | `App.test.tsx` |
| Variables & functions | camelCase | `getUserProgress` |
| Types & interfaces | PascalCase, no `I` prefix | `ApiResponse` |
| Constants | UPPER_SNAKE_CASE | `SESSION_TIMEOUT_MS` |
| React components | PascalCase | `function App()` |

### Expected Project Structure After This Story

```
transcendence/
├── apps/
│   ├── web/                          # React + Vite + Tailwind
│   │   ├── public/
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── App.test.tsx
│   │   │   └── index.css
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── vitest.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   └── api/                          # Express + TypeScript
│       ├── src/
│       │   ├── index.ts
│       │   ├── app.ts
│       │   └── app.test.ts
│       ├── vitest.config.ts
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/                       # Zod schemas, types, constants
│       ├── src/
│       │   ├── index.ts
│       │   ├── types/
│       │   │   └── api.ts
│       │   ├── schemas/
│       │   │   └── common.ts
│       │   └── constants/
│       │       └── config.ts
│       ├── tsconfig.json
│       └── package.json
├── turbo.json
├── pnpm-workspace.yaml
├── package.json
├── tsconfig.json
├── eslint.config.ts
├── .prettierrc
├── .gitignore
├── .env.example
└── README.md
```

### What This Story Does NOT Include

- No Prisma/database setup (Story 1.2)
- No Express security middleware (Story 1.3)
- No Redis/session infrastructure (Story 1.4)
- No Docker/Nginx/HTTPS (Story 1.5)
- No page components or routing (Epic 2+)
- No Playwright E2E tests (deferred to Story 8.5)
- No `content/` directory (Story 3.1)

### Project Structure Notes

- Structure aligns with architecture spec section "Complete Project Directory Structure" [Source: architecture.md#Project Structure & Boundaries]
- `packages/shared` must use proper `exports` field in package.json for workspace resolution
- Turborepo `turbo.json` pipeline must define task dependencies: `build` depends on `^build` (topological)
- Test co-location pattern: tests sit next to source files, not in a separate `__tests__` directory

### References

- [Source: architecture.md#Starter Template Evaluation] — Turborepo + pnpm selected over T3/existing templates
- [Source: architecture.md#Testing Strategy] — Vitest + React Testing Library + Supertest + Playwright
- [Source: architecture.md#Implementation Patterns & Consistency Rules] — All naming conventions
- [Source: architecture.md#Complete Project Directory Structure] — Full directory structure
- [Source: epics.md#Story 1.1] — Acceptance criteria and user story
- [Source: prd.md#MVP Modules] — Module 1: FE + BE Frameworks (Major, 2pts)
- [Source: prd.md#Mandatory Requirements] — README sections, .env.example, .gitignore

## Dev Agent Record

### Agent Model Used

Claude Opus 4.6

### Debug Log References

- ESLint v10 had peer dependency conflicts with eslint-plugin-react-hooks v7 — fell back to ESLint v9 per Dev Notes guidance
- Express `app` variable needed explicit `Express` type annotation to avoid TS2742 (non-portable inferred type with @types/express-serve-static-core)
- Added `@types/node` to apps/api devDependencies for Node types resolution
- Added `onlyBuiltDependencies: [esbuild]` to pnpm-workspace.yaml for esbuild postinstall script approval

### Completion Notes List

- All 7 tasks completed, all 7 acceptance criteria satisfied
- Turborepo 2.8.14 + pnpm 10.22.0 monorepo with 3 workspaces (apps/web, apps/api, packages/shared)
- TypeScript 5.9.3 strict mode compiles without errors across all workspaces (note: spec targeted 5.8.x but 5.9.3 resolved via semver — forward compatible)
- All Turborepo pipelines (build, lint, test) run successfully
- ESLint v9 (flat config .ts) + Prettier configured at root
- Vitest 4.0.18 with placeholder tests passing in both apps
- README updated with all 42-required sections
- Tailwind CSS v4 configured with @tailwindcss/vite plugin and design system theme tokens

### Implementation Plan

Red-green-refactor cycle followed per task sequence. Scaffolded all workspace files first (Tasks 1-4), then configured tooling (Tasks 5-6), then repository config (Task 7). Each phase validated with TypeScript compilation, ESLint, and test runs.

### Change Log

- 2026-03-07: Story 1.1 implemented — full monorepo scaffold with all 7 tasks complete
- 2026-03-07: Code review — fixed 7 issues (3 HIGH, 4 MEDIUM): added .prettierignore, added *.tmp to .gitignore, wired up @testing-library/jest-dom with vitest setup file, fixed weak test assertion, removed dead outDir from web tsconfig, updated File List for pnpm-lock.yaml and sprint-status.yaml, noted TypeScript version drift

### File List

- pnpm-workspace.yaml (new)
- pnpm-lock.yaml (new — lockfile)
- turbo.json (new)
- package.json (new)
- tsconfig.json (new)
- eslint.config.ts (new)
- .prettierrc (new)
- .prettierignore (new — added during code review)
- .env.example (new)
- .gitignore (modified, updated during code review)
- README.md (modified, formatted during code review)
- _bmad-output/implementation-artifacts/sprint-status.yaml (modified)
- apps/web/package.json (new)
- apps/web/vite.config.ts (new)
- apps/web/vitest.config.ts (new, updated during code review)
- apps/web/tsconfig.json (new)
- apps/web/index.html (new)
- apps/web/src/main.tsx (new)
- apps/web/src/App.tsx (new)
- apps/web/src/App.test.tsx (new, updated during code review)
- apps/web/src/test-setup.ts (new — added during code review)
- apps/web/src/index.css (new)
- apps/api/package.json (new)
- apps/api/vitest.config.ts (new)
- apps/api/tsconfig.json (new)
- apps/api/src/index.ts (new)
- apps/api/src/app.ts (new)
- apps/api/src/app.test.ts (new)
- packages/shared/package.json (new)
- packages/shared/tsconfig.json (new)
- packages/shared/src/index.ts (new)
- packages/shared/src/types/api.ts (new)
- packages/shared/src/schemas/common.ts (new)
- packages/shared/src/constants/config.ts (new)
