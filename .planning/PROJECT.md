# League Table Creator

## What This Is

League Table Creator is a browser-based football tournament manager for organizers who need to create competitions, manage teams, generate fixtures, record results, and follow standings and scorer statistics. It currently supports a single league table and is being extended with a group-stage format that contains multiple independent round-robin groups within one tournament.

## Core Value

Tournament organizers can reliably generate fixtures, enter results, and see correct standings for the selected competition format without inconsistent tournament data.

## Requirements

### Validated

- ✓ Users can authenticate with Google — existing
- ✓ Users can create, select, and delete tournaments — existing
- ✓ Users can add and manage tournament teams — existing
- ✓ Users can generate league-format round-robin fixtures — existing
- ✓ Users can enter match results and derive a league standings table — existing
- ✓ Users can record and view top-scorer statistics — existing
- ✓ Tournament data is persisted per authenticated user in Firebase — existing

### Active

- [ ] Users can select League or Group Stage during tournament creation.
- [ ] Users can configure the number of groups and teams per group for a Group Stage tournament.
- [ ] Group Stage tournaments require exactly `number of groups × teams per group` teams before fixture generation.
- [ ] Users can assign teams to groups manually.
- [ ] Users can distribute teams randomly across groups automatically.
- [ ] Each group independently exposes its teams, round-robin fixtures, results, and standings.
- [ ] Top-scorer statistics continue to span the entire tournament across all groups.
- [ ] Existing league fixture generation, result handling, standings, and scorer logic is reused where practical.
- [ ] Group configuration, assignments, and fixture settings become locked after group fixtures are generated.
- [ ] Users can reset group fixtures after confirming a destructive warning, clearing generated fixtures, results, standings, and related group-stage statistics.
- [ ] Group stages are presented through modern, clearly navigable group tabs or cards.

### Out of Scope

- Knockout rounds and automatic qualification — deferred to v2 after standalone group stages are stable.
- Seeded pots or ranking-aware draws — random and manual assignment are sufficient for v1.
- Uneven groups — v1 requires the exact configured team count to keep generation and validation deterministic.
- Cross-group standings — each group is calculated independently.
- Changing group configuration after fixture generation without resetting — prohibited to prevent inconsistent fixtures and standings.

## Context

- The existing product is a Next.js App Router application whose primary workflow currently lives in `src/app/page.tsx`.
- Firebase Authentication and Cloud Firestore provide authentication, persistence, and real-time synchronization.
- `src/lib/league.ts` contains deterministic round-robin fixture generation and standings calculations that should form the basis of group-level behavior.
- The current `Tournament` aggregate stores teams, matches, scorers, fixture settings, and metadata. Group Stage support should introduce a Group abstraction while preserving the existing League format.
- Tournament persistence currently writes the aggregate and synchronizes denormalized team, fixture, standings, and scorer projections.
- The desired interaction pattern resembles the group navigation and compact standings views used by FIFA, UEFA, SofaScore, Flashscore, and FotMob.
- The intended flow is: create tournament → choose Group Stage → configure groups → add and assign teams → generate fixtures → enter results → view per-group standings and statistics.

## Constraints

- **Compatibility**: Existing League tournaments and workflows must continue to function — Group Stage is an additional format, not a replacement.
- **Domain integrity**: Total teams must exactly equal the configured group count multiplied by teams per group before generation.
- **Mutation safety**: Group count, group size, assignments, and fixture settings are immutable after generation until an explicit reset.
- **Reset safety**: Reset requires confirmation that fixtures, results, standings, and related group-stage statistics will be deleted.
- **Scope**: v1 ends at final group standings — no knockout progression or qualification logic.
- **Distribution**: v1 supports manual assignment and unseeded random distribution only.
- **Architecture**: Reuse existing pure league calculations and Firebase service boundaries rather than duplicating format-specific implementations.
- **Runtime**: Preserve the existing Next.js, React, TypeScript/JavaScript, and Firebase stack.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Add Group Stage alongside League format | Preserve current behavior while expanding tournament formats | — Pending |
| Model groups as independent league competitions inside a tournament | Reuses proven round-robin and standings behavior | — Pending |
| End v1 at group standings | Keeps the first release focused and testable | — Pending |
| Require an exact team count | Avoids uneven schedules and ambiguous assignment rules | — Pending |
| Support manual and random assignment | Covers deliberate and quick setup without seeded-draw complexity | — Pending |
| Lock structural settings after generation | Prevents fixtures, assignments, and standings from diverging | — Pending |
| Require destructive reset before structural edits | Makes data loss explicit and restores a clean configuration state | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition**:
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone**:
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-06-24 after initialization*
