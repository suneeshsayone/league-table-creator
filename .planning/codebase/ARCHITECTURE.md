<!-- refreshed: 2026-06-24 -->
# Architecture

**Analysis Date:** 2026-06-24

## System Overview

```text
┌─────────────────────────────────────────────────────────────┐
│                Next.js App Router / Browser UI               │
├──────────────────┬──────────────────┬───────────────────────┤
│ Authentication   │ Tournament CRUD  │ League workspace      │
│ `src/app/page.tsx`│`src/app/page.tsx`│ `src/app/page.tsx`    │
└────────┬─────────┴────────┬─────────┴──────────┬────────────┘
         │                  │                     │
         ▼                  ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Application and Domain Logic               │
│ `src/services/*.js` · `src/lib/league.ts` · `src/types/`    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│ Firebase Authentication, Firestore, and Analytics           │
│ `src/lib/firebase.js`                                       │
└─────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root layout | Supplies global metadata, HTML shell, and global styles | `src/app/layout.tsx` |
| Home client page | Owns authentication gating, screen selection, React state, user actions, persistence orchestration, and all primary UI sections | `src/app/page.tsx` |
| Not-found page | Provides the App Router fallback for unknown routes | `src/app/not-found.tsx` |
| League domain module | Creates IDs and domain objects, generates round-robin fixtures, calculates standings, and sorts scorers | `src/lib/league.ts` |
| Firebase adapter | Initializes Firebase singletons and exports Auth, Firestore, Google provider, analytics, and configuration status | `src/lib/firebase.js` |
| Authentication service | Observes auth state, performs Google popup login, persists user profiles, and signs users out | `src/services/authService.js` |
| Tournament service | Subscribes to the user's aggregate tournaments and synchronizes aggregate and denormalized Firestore collections | `src/services/tournamentService.js` |
| Entity services | Provide direct subscriptions and writes for teams, fixtures, standings, and scorers | `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, `src/services/topScorerService.js` |
| Domain types | Defines the TypeScript shapes shared by page and league logic | `src/types/league.ts` |
| Page styling | Implements the complete responsive visual system for the primary route | `src/app/page.module.css`, `src/app/globals.css` |

## Pattern Overview

**Overall:** Client-side monolith with functional domain utilities and a Firebase service layer.

**Key Characteristics:**
- Use the Next.js App Router shell in `src/app/layout.tsx`, but run the product workflow in the `"use client"` page at `src/app/page.tsx`.
- Keep deterministic league calculations in pure functions under `src/lib/league.ts`.
- Route external Firebase calls through `src/services/*.js`; initialize shared SDK objects once in `src/lib/firebase.js`.
- Treat the `tournaments` Firestore document as the UI's aggregate source of truth while also rebuilding `teams`, `fixtures`, `standings`, and `topScorers` collections for queryable projections.
- Use React local state and Firestore snapshot subscriptions rather than a separate state-management framework.

## Layers

**Presentation and Orchestration:**
- Purpose: Render all user states and coordinate domain and persistence operations.
- Location: `src/app/page.tsx`, `src/app/layout.tsx`, `src/app/not-found.tsx`
- Contains: Client component state, effects, event handlers, conditional screens, forms, dialogs, navigation, and route shell metadata.
- Depends on: `src/lib/league.ts`, `src/lib/firebase.js`, `src/services/authService.js`, `src/services/tournamentService.js`, `src/types/league.ts`, Firebase `User`, React, and CSS modules.
- Used by: Next.js App Router.

**Domain Logic:**
- Purpose: Express league rules independently of React and Firebase.
- Location: `src/lib/league.ts`
- Contains: Tournament/team factories, ID generation, fixture generation, standings calculation, and scorer sorting.
- Depends on: Type declarations in `src/types/league.ts`.
- Used by: `src/app/page.tsx`.

**Application Services:**
- Purpose: Translate application operations into Firebase Auth and Firestore calls.
- Location: `src/services/`
- Contains: Authentication flows, real-time subscriptions, document writes, deletes, and batch synchronization.
- Depends on: Firebase SDK modules and singleton exports from `src/lib/firebase.js`.
- Used by: `src/app/page.tsx`; the current page directly imports only `src/services/authService.js` and `src/services/tournamentService.js`.

**Infrastructure Adapter:**
- Purpose: Configure and expose Firebase runtime clients.
- Location: `src/lib/firebase.js`
- Contains: Environment-backed Firebase configuration, singleton initialization, Google provider setup, Firestore/Auth clients, and optional browser analytics.
- Depends on: Firebase SDK and `NEXT_PUBLIC_FIREBASE_*` environment variables.
- Used by: Every file in `src/services/` and directly by `src/app/page.tsx` for `isFirebaseConfigured`.

**Type Model:**
- Purpose: Define the in-memory aggregate used by domain and UI code.
- Location: `src/types/league.ts`
- Contains: `Team`, `Match`, `Scorer`, `FixtureType`, `Tournament`, and `StandingRow`.
- Depends on: No runtime modules.
- Used by: `src/lib/league.ts` and `src/app/page.tsx`.

## Data Flow

### Primary Request Path

1. Next.js renders the root shell from `RootLayout` and mounts the client page (`src/app/layout.tsx:9`, `src/app/page.tsx:82`).
2. `Home` checks Firebase readiness and subscribes to authentication changes through `observeAuthState` (`src/app/page.tsx:104`, `src/services/authService.js:26`).
3. After login, `Home` subscribes to the authenticated user's tournament documents through `subscribeToUserTournaments` (`src/app/page.tsx:115`, `src/services/tournamentService.js:18`).
4. Firestore snapshots replace the page's `tournaments` state; `selectedTournamentId` derives the active aggregate (`src/app/page.tsx:128`).
5. React renders either login, tournament dashboard, or the selected tournament workspace from that state (`src/app/page.tsx`).

### Tournament Mutation and Projection Sync

1. A UI handler creates or updates a `Tournament` aggregate in `src/app/page.tsx`, using factories/calculators from `src/lib/league.ts`.
2. `persistTournament` writes the aggregate through `saveTournament` (`src/app/page.tsx:156`, `src/services/tournamentService.js:40`).
3. `persistTournament` recalculates standings and calls `syncTournamentCollections` (`src/app/page.tsx:160`, `src/services/tournamentService.js:56`).
4. `syncTournamentCollections` queries and deletes prior projection documents, then batch-writes teams, fixtures, standings, and scorers before committing (`src/services/tournamentService.js:56`).
5. The tournament snapshot subscription updates React state after Firestore accepts the aggregate write (`src/services/tournamentService.js:18`).

### Authentication

1. The login button invokes `handleGoogleLogin` (`src/app/page.tsx:387`).
2. `loginWithGoogle` opens a Firebase Google popup (`src/services/authService.js:30`).
3. A successful credential is followed by a merged user profile write to `users/{uid}` (`src/services/authService.js:9`).
4. Firebase Auth emits the new user to `observeAuthState`, enabling the tournament subscription (`src/services/authService.js:26`).

**State Management:**
- Use component-local `useState` for authentication, selected tournament, form fields, active tab, feedback, and dialog state in `src/app/page.tsx`.
- Use `useMemo` for selected tournament, computed standings, sorted scorers, and played-match count in `src/app/page.tsx`.
- Use Firestore `onSnapshot` subscriptions as remote-state synchronization in `src/services/authService.js` and `src/services/tournamentService.js`.
- Keep `Tournament` as the page's aggregate state; do not combine the separate entity subscriptions with the aggregate subscription unless the source-of-truth model is deliberately redesigned.

## Key Abstractions

**Tournament Aggregate:**
- Purpose: Represent all editable league data required by the single-page workspace.
- Examples: `src/types/league.ts`, `src/lib/league.ts`, `src/app/page.tsx`
- Pattern: Aggregate object containing teams, matches, scorers, fixture settings, and creation metadata.

**Derived Standings:**
- Purpose: Compute table rows from teams and completed matches instead of editing table state directly.
- Examples: `src/lib/league.ts`, `src/app/page.tsx`
- Pattern: Pure derived-data function (`calculateStandings`) memoized by the UI and persisted as a Firestore projection.

**Firebase Service Functions:**
- Purpose: Hide SDK query/write mechanics behind operation-oriented functions.
- Examples: `src/services/authService.js`, `src/services/tournamentService.js`
- Pattern: Stateless module functions using shared `auth` and `db` singletons from `src/lib/firebase.js`.

**Snapshot Subscription:**
- Purpose: Keep browser state synchronized with remote data and provide an unsubscribe function to React effects.
- Examples: `src/services/tournamentService.js`, `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, `src/services/topScorerService.js`
- Pattern: Construct a filtered Firestore query, call `onSnapshot`, normalize/sort documents, then invoke a callback.

## Entry Points

**Root App Layout:**
- Location: `src/app/layout.tsx`
- Triggers: Every Next.js route render.
- Responsibilities: Set metadata, emit `<html>`/`<body>`, and load `src/app/globals.css`.

**Home Route:**
- Location: `src/app/page.tsx`
- Triggers: Browser navigation to `/`.
- Responsibilities: Run the entire authenticated league-management workflow.

**Not Found Route:**
- Location: `src/app/not-found.tsx`
- Triggers: App Router cannot resolve a requested route.
- Responsibilities: Render a fallback and link back to `/`.

**Firebase Module Initialization:**
- Location: `src/lib/firebase.js`
- Triggers: First import by the page or a service module.
- Responsibilities: Read public Firebase configuration, initialize/reuse the app, and export shared SDK clients.

## Architectural Constraints

- **Threading:** Browser code runs on the JavaScript event loop. Firestore/Auth work is asynchronous; there are no workers or server-side background jobs in `src/`.
- **Rendering boundary:** `src/app/page.tsx` is explicitly client-only. Firebase Auth popup behavior, React state, and browser analytics require a browser runtime.
- **Global state:** Firebase SDK singletons (`app`, `auth`, `db`, `googleProvider`, `analyticsPromise`) are module-level exports in `src/lib/firebase.js`.
- **Remote consistency:** `saveTournament` and `syncTournamentCollections` are separate writes in `src/app/page.tsx`; the aggregate write can succeed before projection synchronization fails.
- **Data ownership:** User-scoped Firestore queries depend on each document carrying `userId`; tournament projections also require `tournamentId`.
- **Type boundary:** TypeScript strict mode is enabled in `tsconfig.json`, but `allowJs` permits untyped service and Firebase modules in `src/services/*.js` and `src/lib/firebase.js`.
- **Circular imports:** None detected. Dependencies flow from `src/app/` to `src/lib/`, `src/services/`, and `src/types/`; services depend on `src/lib/firebase.js`.
- **Routing:** The application exposes one implemented product route, `/`, plus the framework not-found boundary under `src/app/`.

## Anti-Patterns

### Adding More Workflow Logic to the Home Component

**What happens:** `Home` already spans authentication, subscriptions, aggregate mutations, domain coordination, dialogs, and four feature views in `src/app/page.tsx`.
**Why it's wrong:** New behavior increases coupling and makes render, state, and persistence changes difficult to isolate.
**Do this instead:** Put deterministic rules in `src/lib/league.ts`, Firebase operations in `src/services/`, and extract self-contained UI sections into new files under `src/app/` or a new `src/components/` directory before extending the page.

### Mixing Aggregate and Entity Persistence Paths

**What happens:** `src/app/page.tsx` uses `src/services/tournamentService.js` to rewrite both the aggregate and projections, while `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, and `src/services/topScorerService.js` expose independent writes and subscriptions.
**Why it's wrong:** Using both paths for one feature can produce divergent state, duplicate snapshot ownership, or updates that are later overwritten by `syncTournamentCollections`.
**Do this instead:** Continue routing current page mutations through `persistTournament` in `src/app/page.tsx`; adopt direct entity services only as part of an explicit source-of-truth migration.

### Calling Firebase SDKs Directly from New UI Code

**What happens:** Direct SDK calls would bypass the service boundary established in `src/services/`.
**Why it's wrong:** Query filters, ownership fields, timestamp handling, error normalization, and batch semantics would become inconsistent across components.
**Do this instead:** Add an operation-oriented function to the relevant file in `src/services/`, using clients exported by `src/lib/firebase.js`.

## Error Handling

**Strategy:** Catch expected user-facing failures at the UI or service boundary, log technical context, and expose short actionable messages.

**Patterns:**
- Translate known Firebase Auth error codes into stable `Error` messages in `src/services/authService.js`.
- Report tournament subscription failure through the callback's optional error argument in `src/services/tournamentService.js`.
- Wrap tournament creation and Google login in `try/catch` inside `src/app/page.tsx`; store feedback in React state.
- Allow most mutation promises to reject to the event handler call site; there is no global error boundary or centralized retry policy in `src/`.

## Cross-Cutting Concerns

**Logging:** Use `console.error` for Firebase authentication, subscription, and tournament-creation failures in `src/services/authService.js`, `src/services/tournamentService.js`, and `src/app/page.tsx`.
**Validation:** Perform lightweight browser-side checks and normalization in `src/app/page.tsx`; enforce domain defaults in `src/lib/league.ts`. No schema-validation library is present.
**Authentication:** Use Firebase Google popup authentication and `onAuthStateChanged`; scope Firestore queries and writes with the authenticated `user.uid` in `src/services/`.
**Styling:** Use global shell styles from `src/app/globals.css` and route-scoped CSS Module classes from `src/app/page.module.css`.
**Accessibility:** Use semantic controls, labels, dialog roles, and `aria-*` attributes directly in `src/app/page.tsx`; preserve these patterns when extracting components.

---

*Architecture analysis: 2026-06-24*
