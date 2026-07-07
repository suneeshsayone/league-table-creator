# Codebase Structure

**Analysis Date:** 2026-06-24

## Directory Layout

```text
LeagueTableCreator/
├── .agents/
│   └── skills/                 # Repository-specific graph-first agent workflows
├── .github/
│   └── code-review-graph.instruction.md
├── .planning/
│   └── codebase/               # Generated codebase reference documents
├── src/
│   ├── app/                    # Next.js App Router routes, styles, and page UI
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── not-found.tsx
│   │   ├── page.module.css
│   │   └── page.tsx
│   ├── lib/                    # Firebase bootstrap and pure league logic
│   │   ├── firebase.js
│   │   └── league.ts
│   ├── services/               # Firebase Auth/Firestore operation modules
│   │   ├── authService.js
│   │   ├── fixtureService.js
│   │   ├── standingService.js
│   │   ├── teamService.js
│   │   ├── topScorerService.js
│   │   └── tournamentService.js
│   └── types/
│       └── league.ts           # Shared league-domain TypeScript types
├── eslint.config.mjs           # ESLint flat configuration
├── next.config.mjs             # Next.js configuration
├── next-env.d.ts               # Next.js-generated TypeScript declarations
├── package.json                # Scripts and dependency declarations
├── package-lock.json           # npm dependency lockfile
└── tsconfig.json               # TypeScript and `@/*` alias configuration
```

## Directory Purposes

**`src/app/`:**
- Purpose: Define routes and render the browser application through the Next.js App Router.
- Contains: Route components, root metadata/layout, not-found UI, global CSS, and route-scoped CSS modules.
- Key files: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/page.module.css`, `src/app/globals.css`

**`src/lib/`:**
- Purpose: Hold shared implementation modules that are not React components.
- Contains: Pure league-domain operations and Firebase runtime initialization.
- Key files: `src/lib/league.ts`, `src/lib/firebase.js`

**`src/services/`:**
- Purpose: Encapsulate Firebase Auth and Firestore access behind application-oriented functions.
- Contains: Snapshot subscriptions, writes, deletes, profile persistence, and aggregate projection synchronization.
- Key files: `src/services/authService.js`, `src/services/tournamentService.js`, `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, `src/services/topScorerService.js`

**`src/types/`:**
- Purpose: Centralize domain types shared across TypeScript modules.
- Contains: League aggregate and derived-row type declarations.
- Key files: `src/types/league.ts`

**`.agents/skills/`:**
- Purpose: Define repository-specific workflows for graph-first exploration, debugging, review, and refactoring.
- Contains: One `SKILL.md` per workflow.
- Key files: `.agents/skills/explore-codebase/SKILL.md`, `.agents/skills/debug-issue/SKILL.md`, `.agents/skills/review-changes/SKILL.md`, `.agents/skills/refactor-safely/SKILL.md`

**`.planning/codebase/`:**
- Purpose: Store generated architecture and codebase maps consumed by planning and execution workflows.
- Contains: Markdown reference documents.
- Key files: `.planning/codebase/ARCHITECTURE.md`, `.planning/codebase/STRUCTURE.md`

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root App Router shell and metadata.
- `src/app/page.tsx`: `/` route and complete product workflow.
- `src/app/not-found.tsx`: Unknown-route fallback.
- `src/lib/firebase.js`: Firebase module initialization entry point.

**Configuration:**
- `package.json`: npm scripts and runtime/development dependencies.
- `package-lock.json`: Exact npm dependency graph.
- `tsconfig.json`: Strict TypeScript checks, JavaScript allowance, bundler resolution, and `@/*` path alias.
- `eslint.config.mjs`: Next.js core-web-vitals lint rules and generated-file ignores.
- `next.config.mjs`: Next.js configuration; currently uses framework defaults.
- `.env.example`: Example environment-variable names; use as a schema only and never place secret values in committed source.
- `.gitignore`: Excludes environment files, build output, dependencies, local databases, logs, editor state, and graph/tool state.

**Core Logic:**
- `src/lib/league.ts`: Tournament creation, team creation, round-robin fixture generation, standings calculation, and scorer ordering.
- `src/types/league.ts`: Domain model for `Tournament`, `Team`, `Match`, `Scorer`, `FixtureType`, and `StandingRow`.
- `src/services/tournamentService.js`: Aggregate tournament subscription and denormalized projection synchronization.
- `src/services/authService.js`: Authentication and user-profile persistence.
- `src/lib/firebase.js`: Shared Firebase clients and configuration check.

**Presentation:**
- `src/app/page.tsx`: Authentication, dashboard, tournament setup, fixtures, standings, scorers, and confirmation dialogs.
- `src/app/page.module.css`: Route-scoped component styling.
- `src/app/globals.css`: Global reset, root tokens, body styling, and application wrapper behavior.

**Testing:**
- Not detected. There are no `*.test.*`, `*.spec.*`, Jest, Vitest, or Playwright source/config files in the mapped repository.

## Naming Conventions

**Files:**
- Use App Router reserved lowercase names for route files: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/not-found.tsx`.
- Use `camelCase` domain module names: `src/lib/league.ts`, `src/lib/firebase.js`.
- Use singular entity plus `Service` for Firebase modules: `src/services/teamService.js`, `src/services/tournamentService.js`.
- Use lowercase domain names for type modules: `src/types/league.ts`.
- Use `*.module.css` for route-scoped styles and `globals.css` for application-wide styles.

**Directories:**
- Use lowercase functional directories under `src/`: `src/app/`, `src/lib/`, `src/services/`, `src/types/`.
- Keep App Router route segments beneath `src/app/`.
- Keep external-system operations beneath `src/services/`; keep shared SDK initialization beneath `src/lib/`.

## Where to Add New Code

**New Product Route:**
- Primary code: `src/app/<route>/page.tsx`
- Route layout when required: `src/app/<route>/layout.tsx`
- Route-local styling: `src/app/<route>/<route>.module.css` or a co-located `page.module.css`
- Tests: Co-locate as `src/app/<route>/page.test.tsx` if a test runner is introduced.

**New Tournament UI Feature:**
- Primary orchestration: Integrate from `src/app/page.tsx`.
- Reusable or substantial component: Create `src/components/<ComponentName>.tsx` and import it into `src/app/page.tsx`; no `src/components/` directory exists yet.
- Styling: Add a matching CSS Module beside the extracted component, or retain route-owned styles in `src/app/page.module.css` when the component remains route-specific.
- Domain types: Extend `src/types/league.ts`.
- Deterministic calculations: Add functions to `src/lib/league.ts`.

**New Firebase Operation:**
- Authentication/profile operation: `src/services/authService.js`
- Tournament aggregate or projection operation: `src/services/tournamentService.js`
- Entity-specific operation: the matching file in `src/services/`, such as `src/services/fixtureService.js`
- Shared client/configuration change: `src/lib/firebase.js`
- Do not initialize a second Firebase app or call Firestore directly from a new component.

**New Domain Entity:**
- Type definition: `src/types/league.ts`
- Creation, calculation, or normalization logic: `src/lib/league.ts`
- Persistence adapter: `src/services/<entity>Service.js`
- Aggregate synchronization, when stored as a tournament projection: `src/services/tournamentService.js`
- UI integration: `src/app/page.tsx` or an extracted component under a new `src/components/` directory.

**Utilities:**
- League-specific pure helpers: `src/lib/league.ts`
- A distinct reusable concern: create `src/lib/<concern>.ts`
- UI-only helper: keep it beside the owning component unless reused across routes.

**Tests:**
- No established test directory exists.
- Prefer co-located `*.test.ts` and `*.test.tsx` files beside the implementation when introducing the first unit/component tests.
- Put shared fixtures under a new `src/test/fixtures/` only when multiple suites require them.
- Add the runner configuration at the repository root beside `eslint.config.mjs` and `next.config.mjs`.

## Special Directories

**`.next/`:**
- Purpose: Next.js build output, route metadata, and development cache.
- Generated: Yes.
- Committed: No; excluded by `.gitignore`.

**`node_modules/`:**
- Purpose: Installed npm dependencies.
- Generated: Yes.
- Committed: No; excluded by `.gitignore`.

**`.code-review-graph/`:**
- Purpose: Local knowledge-graph database and analysis state used for architecture, impact, and review queries.
- Generated: Yes.
- Committed: No; excluded by `.gitignore`.

**`.agents/`:**
- Purpose: Repository-specific agent skills and workflow instructions.
- Generated: No.
- Committed: Repository policy-dependent; currently present as workspace content.

**`.planning/`:**
- Purpose: GSD planning and codebase-analysis artifacts.
- Generated: Yes, by planning workflows.
- Committed: Repository workflow-dependent; current codebase documents live in `.planning/codebase/`.

**`.github/`:**
- Purpose: Repository-hosted automation and contributor/agent instructions.
- Generated: No.
- Committed: Yes.

**`src/app/`:**
- Purpose: Next.js App Router route tree.
- Generated: No.
- Committed: Yes.

---

*Structure analysis: 2026-06-24*
