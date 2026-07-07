# Testing Patterns

**Analysis Date:** 2026-06-24

## Test Framework

**Runner:**
- Not detected. `package.json` contains no test dependency or `test` script.
- Config: Not detected; there is no Jest, Vitest, Playwright, or Cypress configuration in the repository.

**Assertion Library:**
- Not detected in `package.json` or application files under `src/`.

**Run Commands:**
```bash
npm run lint           # Run ESLint across the repository (`package.json`)
npm run build          # Run the production Next.js build and TypeScript checks (`package.json`)
# No automated test, watch, or coverage command is currently defined in `package.json`.
```

## Test File Organization

**Location:**
- No automated test files are present beside `src/app/page.tsx`, `src/lib/league.ts`, `src/services/*.js`, or elsewhere in the repository.
- When tests are introduced, colocate focused unit tests with pure logic, starting with `src/lib/league.test.ts` beside `src/lib/league.ts`.
- Place route/component tests beside the route as `src/app/page.test.tsx` when covering behavior in `src/app/page.tsx`.
- Place Firebase adapter tests beside each service, for example `src/services/tournamentService.test.js` beside `src/services/tournamentService.js`.

**Naming:**
- No existing naming pattern is established.
- Use `*.test.ts` for TypeScript domain tests, `*.test.tsx` for React component tests, and `*.test.js` while service implementations remain JavaScript. This aligns test names with `src/lib/league.ts`, `src/app/page.tsx`, and `src/services/*.js`.

**Structure:**
```text
src/
├── app/
│   ├── page.tsx
│   └── page.test.tsx
├── lib/
│   ├── league.ts
│   └── league.test.ts
└── services/
    ├── tournamentService.js
    └── tournamentService.test.js
```

## Test Structure

**Suite Organization:**
```typescript
// Recommended first suite for the pure functions in `src/lib/league.ts`.
describe("calculateStandings", () => {
  it("sorts equal-point teams by goal difference, wins, then name", () => {
    const result = calculateStandings(teams, matches);

    expect(result.map((row) => row.team.name)).toEqual(expectedOrder);
  });
});
```

**Patterns:**
- No repository test implementation currently establishes setup, teardown, or assertion conventions.
- Organize suites around one exported function or user behavior from `src/lib/league.ts` or `src/app/page.tsx`.
- Use small inline fixtures typed from `src/types/league.ts`; avoid sharing mutable arrays because `calculateStandings` and `generateFixtures` consume domain collections.
- Assert externally visible results rather than implementation details: fixture pairings and rounds from `generateFixtures`, table rows from `calculateStandings`, and rendered messages/actions from `src/app/page.tsx`.
- Keep each test deterministic by replacing or abstracting `createId` behavior from `src/lib/league.ts` when exact IDs matter.

## Mocking

**Framework:** Not detected. Select the mocking API provided by the test runner when one is added to `package.json`.

**Patterns:**
```typescript
// Recommended boundary mock for component tests of `src/app/page.tsx`.
vi.mock("@/services/tournamentService", () => ({
  subscribeToUserTournaments: vi.fn(() => () => undefined),
  saveTournament: vi.fn(),
  syncTournamentCollections: vi.fn(),
  deleteTournament: vi.fn()
}));
```

**What to Mock:**
- Mock Firebase Auth and Firestore boundaries exported by `src/services/authService.js`, `src/services/tournamentService.js`, and the focused service files under `src/services/`.
- Mock realtime callbacks and unsubscribe functions when testing subscription consumers in `src/app/page.tsx`.
- Mock `Date.now` and `Math.random` only when asserting `createId` output from `src/lib/league.ts`.
- Mock `isFirebaseConfigured` from `src/lib/firebase.js` in route tests to exercise configured and unconfigured UI branches in `src/app/page.tsx`.

**What NOT to Mock:**
- Do not mock pure league calculations in unit tests for `src/lib/league.ts`; pass real `Team`, `Match`, and `Scorer` values from `src/types/league.ts`.
- Do not mock array sorting or object spread behavior used by `calculateStandings`, `sortScorers`, and `generateFixtures` in `src/lib/league.ts`.
- In component integration tests for `src/app/page.tsx`, use real domain helpers from `src/lib/league.ts` unless the test specifically isolates a service failure.

## Fixtures and Factories

**Test Data:**
```typescript
import type { Match, Team } from "@/types/league";

const teams: Team[] = [
  { id: "team-a", name: "Alpha", badge: "AFC" },
  { id: "team-b", name: "Beta", badge: "CITY" }
];

const completedMatch: Match = {
  id: "match-1",
  round: 1,
  homeTeamId: "team-a",
  awayTeamId: "team-b",
  homeScore: 2,
  awayScore: 1
};
```

**Location:**
- No fixture directory exists.
- Keep data local to `src/lib/league.test.ts` until multiple suites reuse it.
- If reuse emerges, add typed builders under `src/test/fixtures/` and import domain contracts from `src/types/league.ts`.

## Coverage

**Requirements:** None enforced. `package.json` has no coverage script or threshold, and no coverage configuration is present.

**View Coverage:**
```bash
# Not available until a test runner and coverage provider are added to `package.json`.
```

## Test Types

**Unit Tests:**
- Not currently used.
- Highest-priority unit target: `src/lib/league.ts`, covering `createTournament`, `createTeam`, `generateFixtures`, `calculateStandings`, and `sortScorers`.
- Cover odd and even team counts, single and home/away fixtures, incomplete matches, missing team IDs, win/draw/loss scoring, all standings tie-breakers, and scorer name tie-breaks in `src/lib/league.ts`.

**Integration Tests:**
- Not currently used.
- Add focused React integration coverage for `src/app/page.tsx`: authentication branches, tournament creation validation, fixture regeneration confirmation, score editing, duplicate scorer handling, and persistence failure messages.
- Add Firebase adapter tests for payload construction and query constraints in `src/services/tournamentService.js`, `src/services/authService.js`, `src/services/teamService.js`, `src/services/fixtureService.js`, `src/services/standingService.js`, and `src/services/topScorerService.js`.

**E2E Tests:**
- Not used; no browser test framework or configuration is present in `package.json`.
- If introduced, cover the primary flow implemented by `src/app/page.tsx`: sign in, create a tournament, add teams, generate fixtures, enter scores, verify standings, and add scorers.

## Common Patterns

**Async Testing:**
```typescript
// Recommended for failure handling in `src/app/page.tsx`.
saveTournament.mockRejectedValueOnce(new Error("write failed"));

await user.click(screen.getByRole("button", { name: /create tournament/i }));

expect(
  await screen.findByText(/could not create the tournament/i)
).toBeInTheDocument();
```

**Error Testing:**
```typescript
// Recommended for provider error translation in `src/services/authService.js`.
signInWithPopup.mockRejectedValueOnce({
  code: "auth/popup-closed-by-user"
});

await expect(loginWithGoogle()).rejects.toThrow(
  "Google sign-in was closed before it finished."
);
```

---

*Testing analysis: 2026-06-24*
