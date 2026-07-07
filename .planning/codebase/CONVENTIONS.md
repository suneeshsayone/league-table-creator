# Coding Conventions

**Analysis Date:** 2026-06-24

## Naming Patterns

**Files:**
- Use lowercase camelCase for utility, service, and library modules, as in `src/lib/league.ts`, `src/lib/firebase.js`, and `src/services/tournamentService.js`.
- Use Next.js App Router reserved names for route files: `src/app/page.tsx`, `src/app/layout.tsx`, and `src/app/not-found.tsx`.
- Keep shared domain types in the singular domain module `src/types/league.ts`.
- Use CSS Modules beside the component that consumes them, as in `src/app/page.module.css` imported by `src/app/page.tsx`.

**Functions:**
- Use camelCase verb phrases for functions: `createTournament`, `generateFixtures`, and `calculateStandings` in `src/lib/league.ts`; `saveTournament` and `deleteTournament` in `src/services/tournamentService.js`.
- Prefix React event workflows with `handle` when they coordinate UI state and asynchronous work, as in `handleCreateTournament` and `handleGoogleLogin` in `src/app/page.tsx`.
- Name subscription functions with `subscribeTo...` or `observe...`, as in `subscribeToUserTournaments` in `src/services/tournamentService.js` and `observeAuthState` in `src/services/authService.js`.
- Use `save...` and `delete...` for direct persistence operations in `src/services/teamService.js`, `src/services/fixtureService.js`, and `src/services/topScorerService.js`.
- Name React components in PascalCase and export route components as defaults, as in `Home` in `src/app/page.tsx`, `RootLayout` in `src/app/layout.tsx`, and `NotFound` in `src/app/not-found.tsx`.

**Variables:**
- Use camelCase for local values and state: `selectedTournamentId`, `scorerGoals`, and `isCreatingTournament` in `src/app/page.tsx`.
- Prefix booleans with `is`, `has`, or a state adjective: `isFirebaseConfigured` in `src/lib/firebase.js`, `hasGeneratedFixtures` and `authReady` in `src/app/page.tsx`.
- Use `next...` for newly derived immutable values and `current` for functional state callback inputs, as in `nextTournament` and `current` in `src/app/page.tsx`.
- Use plural nouns for arrays and collections: `teams`, `matches`, and `scorers` in `src/types/league.ts`; `syncedCollectionNames` in `src/services/tournamentService.js`.

**Types:**
- Use PascalCase type aliases with domain nouns: `Team`, `Match`, `Tournament`, and `StandingRow` in `src/types/league.ts`.
- Use PascalCase UI-local state types and suffix them with `State` where appropriate: `ConfirmationState` and `DuplicateScorerState` in `src/app/page.tsx`.
- Use narrow unions for finite options, as in `FixtureType` in `src/types/league.ts` and `TabKey` in `src/app/page.tsx`.
- Prefer `type` aliases rather than `interface`; all current domain and component types use `type` in `src/types/league.ts` and `src/app/page.tsx`.

## Code Style

**Formatting:**
- No formatter configuration is present. Preserve the established style in `src/app/page.tsx`, `src/lib/league.ts`, and `src/services/tournamentService.js`.
- Use two-space indentation, semicolons, double-quoted strings, trailing commas only where the surrounding multiline syntax already uses them, and braces on the same line as declarations. These patterns are consistent across `src/app/layout.tsx`, `src/lib/league.ts`, and `src/services/authService.js`.
- Break long imports, function calls, object literals, and JSX props across lines, as demonstrated by Firebase imports in `src/services/tournamentService.js` and service imports in `src/app/page.tsx`.
- Prefer immutable array transformations and object spreads over in-place mutation. Examples include scorer updates and tournament persistence in `src/app/page.tsx`; the round-robin rotation algorithm is the intentional local mutation exception in `src/lib/league.ts`.
- Keep JSX readable through semantic line breaks and CSS Module class references, following `src/app/page.tsx` and `src/app/not-found.tsx`.

**Linting:**
- Run `npm run lint`, which executes `eslint .` from `package.json`.
- Follow Next.js Core Web Vitals and recommended rules configured in `eslint.config.mjs`.
- Keep generated and dependency paths excluded according to `eslint.config.mjs`: `.next/**`, `node_modules/**`, and `next-env.d.ts`.
- TypeScript is strict and non-emitting through `tsconfig.json`; new `.ts` and `.tsx` code must pass strict checking.
- JavaScript remains allowed by `allowJs` in `tsconfig.json`. Match the existing split: typed domain/UI logic in `src/lib/league.ts`, `src/types/league.ts`, and `src/app/*.tsx`; Firebase service adapters currently use JavaScript under `src/services/*.js` and `src/lib/firebase.js`.

## Import Organization

**Order:**
1. Put framework and third-party runtime imports first, as React and Lucide imports appear in `src/app/page.tsx`.
2. Put third-party type-only imports after related runtime packages, using `import type`, as with `User` from Firebase in `src/app/page.tsx`.
3. Put absolute internal imports using `@/` next, grouped by library, services, then types, as in `src/app/page.tsx`.
4. Put relative stylesheet imports last, as in `src/app/page.tsx`, `src/app/layout.tsx`, and `src/app/not-found.tsx`.

**Path Aliases:**
- Use `@/*` for imports rooted at `src/`; the alias is configured in `tsconfig.json`.
- Prefer `@/lib/...`, `@/services/...`, and `@/types/...` over parent-directory traversal, as demonstrated in `src/app/page.tsx` and `src/services/authService.js`.
- Use relative imports only for colocated route styles such as `./page.module.css` in `src/app/page.tsx` and `./globals.css` in `src/app/layout.tsx`.
- Mark type-only dependencies explicitly with `import type`, as in `src/lib/league.ts`, `src/app/layout.tsx`, and `src/app/page.tsx`.

## Error Handling

**Patterns:**
- Validate preconditions with early returns before performing state changes or persistence. Examples include `persistTournament`, `addTeam`, `buildFixtures`, and `addScorer` in `src/app/page.tsx`.
- Wrap user-triggered asynchronous boundaries in `try`/`catch` and translate failures into user-facing state, as in `handleCreateTournament` and `handleGoogleLogin` in `src/app/page.tsx`.
- Log operational context with `console.error` at the boundary where the failure is handled, as in `src/app/page.tsx`, `src/services/authService.js`, and `src/services/tournamentService.js`.
- Convert provider-specific errors into stable application messages before rethrowing, as `loginWithGoogle` does in `src/services/authService.js`.
- Use `finally` for state that must be restored after asynchronous work, as with `setIsCreatingTournament(false)` in `src/app/page.tsx`.
- For realtime subscriptions, return the Firebase unsubscribe function and report subscription errors through the callback, following `subscribeToUserTournaments` in `src/services/tournamentService.js`.

## Logging

**Framework:** `console`

**Patterns:**
- Use `console.error` only on failure paths and include a concise operation-specific prefix, as in `src/services/authService.js`, `src/services/tournamentService.js`, and `src/app/page.tsx`.
- Do not add routine `console.log` debugging; no general debug logging exists in `src/`.
- Keep user-visible messages separate from logged implementation details, as `handleCreateTournament` does in `src/app/page.tsx`.

## Comments

**When to Comment:**
- Prefer expressive names and small domain helpers over explanatory inline comments; `src/lib/league.ts` and `src/app/page.tsx` contain no routine narration comments.
- Add comments only for non-obvious constraints or external behavior that cannot be expressed through naming. Preserve the low-comment style established throughout `src/`.
- Keep configuration annotations focused and tool-specific, as with the Next.js config type annotation in `next.config.mjs`.

**JSDoc/TSDoc:**
- JSDoc/TSDoc is not used for application functions in `src/`.
- Express contracts through TypeScript signatures and named types in `src/lib/league.ts` and `src/types/league.ts`.
- For JavaScript services under `src/services/*.js`, follow the current self-documenting API style unless a public contract becomes too complex to understand from names and usage.

## Function Design

**Size:** Keep pure domain operations focused, following `createTournament`, `createTeam`, and `sortScorers` in `src/lib/league.ts`. Extract reusable domain logic from the large route component `Home` in `src/app/page.tsx` rather than adding more unrelated responsibility there.

**Parameters:** Use explicit typed parameters in TypeScript modules such as `generateFixtures(teams, fixtureType)` in `src/lib/league.ts`. In service modules, pass identifiers before the entity or callback, following `(userId, tournamentId, entity)` in `src/services/teamService.js` and related service files.

**Return Values:** Return new arrays and objects from domain helpers in `src/lib/league.ts`; return Firebase promises or unsubscribe functions directly from service adapters in `src/services/*.js`; use early `return` for invalid UI preconditions in `src/app/page.tsx`.

## Module Design

**Exports:** Use named exports for reusable domain functions, types, Firebase instances, and service operations in `src/lib/league.ts`, `src/types/league.ts`, `src/lib/firebase.js`, and `src/services/*.js`. Use default exports only for Next.js route components and configuration modules in `src/app/*.tsx`, `eslint.config.mjs`, and `next.config.mjs`.

**Barrel Files:** Barrel files are not used. Import directly from concrete modules such as `@/lib/league`, `@/services/authService`, and `@/types/league`, following `src/app/page.tsx`.

---

*Convention analysis: 2026-06-24*
