# Codebase Concerns

**Analysis Date:** 2026-06-24

## Tech Debt

**Monolithic client component:**
- Issue: The `Home` component owns authentication, subscriptions, tournament selection, all mutation workflows, modal state, fixture editing, standings rendering, scorer management, and nearly the entire UI. The component spans about 780 lines inside an 871-line file.
- Files: `src/app/page.tsx`
- Impact: Changes to one workflow can affect unrelated screens and state. The graph reports `Home` as the largest hub, with 108 relationships and no tests, making regressions difficult to isolate.
- Fix approach: Split authentication/dashboard, tournament setup, fixtures, standings, scorers, and confirmation dialogs into focused components. Move tournament mutation orchestration into a custom hook that exposes explicit loading and error states.

**Unchecked JavaScript service boundary:**
- Issue: Firebase services are JavaScript while domain models and the consuming UI are TypeScript. `allowJs` is enabled, but JavaScript files are not included for type checking and `checkJs` is not enabled.
- Files: `tsconfig.json`, `src/lib/firebase.js`, `src/services/authService.js`, `src/services/tournamentService.js`, `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, `src/services/topScorerService.js`, `src/types/league.ts`
- Impact: Firestore snapshots and service parameters are effectively `any`, so malformed documents, timestamp/number mismatches, and incorrect callback signatures reach strict TypeScript code without compile-time detection.
- Fix approach: Convert service files to `.ts`, add Firestore converter types, validate snapshot data at the boundary, and remove `allowJs` after migration. As an interim step, enable `checkJs` and add JSDoc types.

**Duplicate and unused persistence APIs:**
- Issue: The active UI persists complete tournaments through `src/services/tournamentService.js`, while separate entity-level services expose overlapping subscriptions and CRUD functions that have no active callers. Graph dead-code analysis identifies the exports in the team, fixture, standing, and top-scorer services as unreferenced.
- Files: `src/services/tournamentService.js`, `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, `src/services/topScorerService.js`
- Impact: There are multiple possible write paths with different field shapes and timestamp behavior. Future code can select the wrong API and create inconsistent documents.
- Fix approach: Choose one persistence model. Remove unused entity services if the aggregate tournament model remains authoritative, or make entity services authoritative and stop duplicating full child collections during every tournament update.

**Repository documentation does not describe the current application:**
- Issue: The main README contains only a title and one sentence, while setup, Firebase configuration, architecture, commands, and deployment details exist only as claims in publication-audit documents.
- Files: `README.md`, `PUBLICATION_AUDIT.md`, `RELEASE_CHECKLIST.md`
- Impact: A new contributor cannot reliably install, configure, test, or deploy the project from the canonical documentation. The audit states the README was expanded, but the checked-in README does not contain that material.
- Fix approach: Make `README.md` the source of truth for prerequisites, environment variable names, Firebase setup, Firestore rules, commands, and deployment. Keep audit documents focused on audit results rather than serving as substitute setup documentation.

## Known Bugs

**Removing a team leaves orphaned scorers:**
- Symptoms: After a team is removed, scorers assigned to that team remain in the tournament. The scorer UI displays the fallback name `Team`, and the orphan records continue to be written to `topScorers`.
- Files: `src/app/page.tsx`, `src/services/tournamentService.js`
- Trigger: Add a team, add a scorer for that team, then remove the team from the Setup tab.
- Workaround: Remove all scorers for the team before removing the team.
- Fix approach: Filter `selectedTournament.scorers` by `teamId` in the same `removeTeam` mutation. Include the scorer deletion in the confirmation message and add a regression test.

**Score fields accept invalid numeric state:**
- Symptoms: Score inputs use `inputMode="numeric"` but remain text inputs and convert arbitrary text with `Number(...)`. Values such as negative numbers, decimals, or non-numeric input can produce invalid scores or `NaN`; `calculateStandings` then propagates invalid totals and may treat incomparable values as a draw.
- Files: `src/app/page.tsx`, `src/lib/league.ts`, `src/types/league.ts`
- Trigger: Enter a negative, decimal, or non-numeric value into a fixture score field on an input method that permits it.
- Workaround: Enter only non-negative integers.
- Fix approach: Parse through a shared validator, accept only finite non-negative integers, reject invalid updates before persistence, and defensively validate scores in `calculateStandings`.

**Unconfigured Firebase state has no usable path:**
- Symptoms: When required Firebase variables are absent, `authReady` starts as true, the Google sign-in button is hidden, and `user` remains null. The app renders marketing copy but offers no action to enter the tournament UI.
- Files: `src/app/page.tsx`, `src/lib/firebase.js`, `.env.example`
- Trigger: Run the application without the required `NEXT_PUBLIC_FIREBASE_*` values.
- Workaround: Configure Firebase before running the app.
- Fix approach: Either fail fast with a clear configuration error and setup instructions or implement a real local/demo storage adapter. Do not present the unconfigured state as an operational mode.

**Partial tournament persistence can leave derived collections stale:**
- Symptoms: `persistTournament` first writes the aggregate tournament document and then performs a separate child-collection synchronization. If the second operation fails, the tournament snapshot contains new data while `teams`, `fixtures`, `standings`, or `topScorers` retain old data.
- Files: `src/app/page.tsx`, `src/services/tournamentService.js`
- Trigger: A network interruption, permission failure, or batch-limit error after `saveTournament` succeeds but before `syncTournamentCollections` commits.
- Workaround: Retry the same mutation after connectivity or rule issues are resolved.
- Fix approach: Eliminate redundant derived collections where possible. If they are required, perform all writes through one atomic server-side operation or a bounded batch strategy with reconciliation/version markers.

**Rapid mutations can overwrite newer state:**
- Symptoms: Score edits and scorer stepper clicks build complete tournament payloads from the current render snapshot. Multiple unresolved writes can finish out of order, causing a later user action to be overwritten by an older request or subscription snapshot.
- Files: `src/app/page.tsx`, `src/services/tournamentService.js`
- Trigger: Type scores quickly, click scorer increment/decrement repeatedly, or edit from multiple clients while network latency is present.
- Workaround: Wait for each remote update to appear before making the next change.
- Fix approach: Serialize mutations per tournament, debounce score editing, use field-level transactional updates or version checks, and disable or reconcile controls while a mutation is pending.

## Security Considerations

**Firestore authorization policy is not versioned:**
- Risk: All application data access occurs directly from the browser. No Firestore rules file or rules test suite is present, so repository review cannot verify that users can read and write only documents whose `userId` matches `request.auth.uid`.
- Files: `src/lib/firebase.js`, `src/services/authService.js`, `src/services/tournamentService.js`, `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, `src/services/topScorerService.js`, `RELEASE_CHECKLIST.md`
- Current mitigation: Google authentication is required by the UI, queries include `userId`, and release documentation instructs maintainers to review rules. Query filters and UI authentication are not authorization controls.
- Recommendations: Add a committed `firestore.rules` file and emulator-based rules tests. Validate ownership on create/update/delete, prevent `userId` changes, and validate expected document fields and numeric ranges.

**Delete helpers rely entirely on external rules:**
- Risk: Entity delete functions accept `userId` but do not use it when selecting the document to delete. Anyone able to call these client functions with a known document ID can attempt deletion across tenants.
- Files: `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/topScorerService.js`, `src/services/tournamentService.js`
- Current mitigation: The entity-level helpers are currently unreferenced, and correct Firestore rules can reject unauthorized operations.
- Recommendations: Remove unused helpers or verify document ownership in the persistence design. Treat Firestore rules as mandatory and test denial cases; do not rely on unused function parameters as protection.

**Local Firebase configuration requires publication discipline:**
- Risk: A real `.env.local` exists locally. Firebase browser configuration is client-visible, but accidental publication can expose project identifiers and increases risk when API key restrictions, authorized domains, or Firestore rules are weak.
- Files: `.env.local`, `.env.example`, `.gitignore`, `PUBLICATION_AUDIT.md`, `RELEASE_CHECKLIST.md`
- Current mitigation: `.env.local` is not tracked and publication documents warn against committing it.
- Recommendations: Keep `.env.local` untracked, run secret/history scanning before publication, restrict the Firebase API key, configure authorized domains, and verify production rules independently of configuration secrecy.

## Performance Bottlenecks

**Every score keystroke rewrites the full tournament projection:**
- Problem: Each score `onChange` persists the complete tournament document, runs four sequential collection queries, deletes every existing derived document, and recreates all teams, fixtures, standings, and scorers.
- Files: `src/app/page.tsx`, `src/services/tournamentService.js`
- Cause: `updateMatch` calls aggregate-level `persistTournament`, and `syncTournamentCollections` implements synchronization as delete-all/reinsert-all.
- Improvement path: Keep score editing local until blur/save or debounce it. Update only the changed fixture and affected standings, or derive standings on read. Avoid collection-wide queries and rewrites for a single-field change.

**Synchronization reads are sequential:**
- Problem: `syncTournamentCollections` and `deleteTournament` wait for four independent `getDocs` queries one after another before committing.
- Files: `src/services/tournamentService.js`
- Cause: `await getDocs(...)` is inside a `for...of` loop.
- Improvement path: Run independent queries concurrently with `Promise.all`, then build the batch. Prefer a subcollection layout or server-side cascading operation that avoids cross-collection scans.

**Large client bundle and always-client architecture:**
- Problem: The production build reports a 232 kB first-load JavaScript payload for `/`, with the route itself contributing about 130 kB.
- Files: `src/app/page.tsx`, `src/lib/firebase.js`, `package.json`
- Cause: The full application, Firebase clients, all workflow code, and all icons load in one client component.
- Improvement path: Split feature panels with dynamic imports, isolate authentication and data adapters, import only required Firebase modules, and move static shell content to server components where practical.

## Fragile Areas

**Tournament persistence and synchronization:**
- Files: `src/app/page.tsx`, `src/services/tournamentService.js`
- Why fragile: One UI helper coordinates two separate persistence phases, complete aggregate replacement, four collection scans, mass deletion, and mass recreation. It has no retry, reconciliation, conflict detection, or centralized error reporting.
- Safe modification: Preserve ownership filters, calculate the exact write count, test partial failures, and verify aggregate and derived documents after every persistence change. Prefer a migration toward one authoritative representation.
- Test coverage: No unit, integration, emulator, or end-to-end tests are present.

**Fixture generation and standings calculation:**
- Files: `src/lib/league.ts`, `src/types/league.ts`
- Why fragile: These functions encode core competition behavior, including odd-team byes, home/away reversal, incomplete matches, tie-breaking, and malformed team references. Small changes alter all league results.
- Safe modification: Add table-driven tests before changing algorithms. Cover odd/even team counts, single/home-away formats, duplicate IDs, invalid scores, missing teams, draws, and deterministic tie-breaking.
- Test coverage: The graph marks `calculateStandings` and `generateFixtures` as untested hotspots; no test files or test framework are configured.

**Authentication and configuration bootstrap:**
- Files: `src/lib/firebase.js`, `src/services/authService.js`, `src/app/page.tsx`
- Why fragile: Firebase is initialized at module load even when configuration is incomplete, while the UI separately checks `isFirebaseConfigured`. This creates two sources of truth for whether Firebase-dependent code is safe to use.
- Safe modification: Centralize bootstrap behind an explicit configured/unconfigured adapter, expose typed initialization errors, and test both configured and missing-configuration paths.
- Test coverage: No tests cover configuration absence, popup errors, auth-state transitions, or profile write failure.

## Scaling Limits

**Firestore batch operation ceiling:**
- Current capacity: A sync batch contains deletes for every existing team, fixture, standing, and scorer plus writes for every current item. For a 16-team home-and-away league, 240 fixtures plus 16 teams and 16 standings produce 272 documents; a subsequent full sync attempts roughly 544 delete/write operations before scorers are counted.
- Limit: Firestore write batches have a finite per-batch operation limit, so moderately sized home-and-away tournaments can exceed it. Score editing reaches the same limit because every edit performs a full resynchronization.
- Files: `src/lib/league.ts`, `src/services/tournamentService.js`, `src/app/page.tsx`
- Scaling path: Stop delete/reinsert synchronization, apply incremental writes, split unavoidable bulk work into bounded batches, or move aggregate processing to a backend that can reconcile safely.

**Quadratic fixture growth:**
- Current capacity: Single-round-robin fixtures grow as `n(n-1)/2`; home-and-away fixtures grow as `n(n-1)`. All fixtures are rendered in one list and stored inside the tournament document as well as a separate collection.
- Limit: Larger leagues increase document size, initial snapshot payload, render work, synchronization reads, and synchronization writes quadratically.
- Files: `src/lib/league.ts`, `src/app/page.tsx`, `src/services/tournamentService.js`
- Scaling path: Paginate or virtualize fixtures, store fixtures outside the aggregate tournament document, query by round, and update only changed records.

**Unbounded real-time tournament subscription:**
- Current capacity: The dashboard subscribes to every tournament document owned by the user and each document includes embedded teams, matches, and scorers.
- Limit: Users with many or large tournaments receive the full aggregate dataset on every subscription refresh; there is no limit, pagination, archival policy, or summary projection.
- Files: `src/services/tournamentService.js`, `src/app/page.tsx`
- Scaling path: Store lightweight tournament summaries, order and limit dashboard queries, load tournament details on demand, and paginate archived tournaments.

## Dependencies at Risk

**Broad dependency ranges without an automated upgrade gate:**
- Risk: Core dependencies use caret ranges and the project has no CI configuration or dependency-update automation. Fresh installs can resolve newer minor/patch versions than those originally validated, while `package-lock.json` is the only reproducibility control.
- Impact: Framework, Firebase, lint, and React upgrades can introduce behavior or build changes without automated regression detection.
- Files: `package.json`, `package-lock.json`
- Migration plan: Keep the lockfile committed, add CI for `npm ci`, lint, build, and tests, and use a controlled dependency-update tool with reviewed pull requests.

## Missing Critical Features

**Automated test infrastructure:**
- Problem: There is no test runner, test script, test configuration, or test file despite core domain logic and persistence workflows.
- Blocks: Safe refactoring of `src/app/page.tsx`, validation of standings/fixture correctness, reliable Firebase rule changes, and regression detection for destructive workflows.
- Files: `package.json`, `src/app/page.tsx`, `src/lib/league.ts`, `src/services/tournamentService.js`

**Versioned Firestore deployment assets:**
- Problem: Firestore rules, indexes, emulator configuration, and deployment configuration are not present.
- Blocks: Reproducible environment setup and evidence that browser-side data access is tenant-safe.
- Files: `src/lib/firebase.js`, `src/services/tournamentService.js`, `.env.example`, `RELEASE_CHECKLIST.md`

**Consistent mutation feedback:**
- Problem: Tournament creation handles loading and errors, but team, fixture, score, scorer, deletion, and confirmation mutations mostly discard returned promises with `void` and expose no pending/error state.
- Blocks: Users cannot distinguish successful persistence from failed writes, and repeated interaction during pending writes increases race risk.
- Files: `src/app/page.tsx`

## Test Coverage Gaps

**League algorithms:**
- What's not tested: Fixture counts and pairings, odd-team byes, home/away reversal, score validation, standings totals, incomplete fixtures, missing teams, and tie-break ordering.
- Files: `src/lib/league.ts`, `src/types/league.ts`
- Risk: Incorrect schedules or tables can be published without detection.
- Priority: High

**Aggregate persistence and synchronization:**
- What's not tested: Partial failures between aggregate and derived writes, batch-size boundaries, concurrent updates, stale snapshots, deletes, timestamp conversion, and permission errors.
- Files: `src/services/tournamentService.js`, `src/app/page.tsx`
- Risk: Silent data loss, stale derived collections, failed score updates, or cross-client overwrite.
- Priority: High

**Firestore security rules:**
- What's not tested: Unauthenticated access, cross-user reads/writes/deletes, ownership-field changes, malformed documents, and numeric validation.
- Files: `src/services/authService.js`, `src/services/tournamentService.js`, `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, `src/services/topScorerService.js`
- Risk: Tenant data exposure or unauthorized modification if deployed rules are permissive or incomplete.
- Priority: High

**Destructive and relational UI workflows:**
- What's not tested: Tournament deletion, team removal with fixtures, orphan-scorer cleanup, fixture regeneration, duplicate scorer confirmation, and rapid score/scorer updates.
- Files: `src/app/page.tsx`
- Risk: Destructive actions can remove or corrupt related data, and interaction races can regress unnoticed.
- Priority: High

**Authentication and configuration states:**
- What's not tested: Missing Firebase configuration, successful login, popup cancellation, disabled provider, profile-write failure, logout, and auth subscription cleanup.
- Files: `src/lib/firebase.js`, `src/services/authService.js`, `src/app/page.tsx`
- Risk: Users can be stranded on a non-functional screen or receive misleading authentication errors.
- Priority: Medium

---

*Concerns audit: 2026-06-24*
