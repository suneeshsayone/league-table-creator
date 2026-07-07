# Phase 1: Group Stage Configuration - Context

**Gathered:** 2026-06-24
**Status:** Ready for planning
**Source:** Approved project scope and roadmap

<domain>
## Phase Boundary

Users can create and reload either a League or Group Stage tournament. Group Stage creation captures group count and teams per group, displays the exact required team capacity, creates stable empty groups, and never falls through to League-wide fixture generation.

</domain>

<decisions>
## Implementation Decisions

### Tournament format
- League remains the default for backward compatibility.
- Group Stage is a separate format selected during tournament creation.
- Existing saved tournaments without a format field are treated as League tournaments.

### Group configuration
- Group count and teams per group are positive whole-number creation inputs.
- Total required teams is always `groupCount × teamsPerGroup`.
- Groups receive stable IDs and football-style labels (`Group A`, `Group B`, and so on).

### Phase boundary
- Phase 1 persists empty group structures but does not assign teams or generate group fixtures.
- Group Stage must never call the existing tournament-wide League fixture generator.
- The setup screen communicates capacity and readiness without pretending later-phase behavior exists.

### UI
- League and Group Stage are presented as clear selectable format cards.
- Group-only fields appear conditionally.
- The existing visual language, controls, responsive behavior, and accessibility patterns are reused.

### the agent's Discretion
- Reasonable numeric bounds and helper copy.
- Exact internal naming for format and group fields.
- Whether compatibility normalization occurs at subscription time or UI/domain boundaries.

</decisions>

<canonical_refs>
## Canonical References

- `.planning/PROJECT.md` — product boundaries and architectural constraints.
- `.planning/REQUIREMENTS.md` — Phase 1 requirement contract.
- `.planning/ROADMAP.md` — Phase 1 goal and acceptance criteria.
- `.planning/codebase/ARCHITECTURE.md` — current aggregate, UI, service, and Firebase boundaries.

</canonical_refs>

<deferred>
## Deferred Ideas

- Team assignment belongs to Phase 2.
- Group fixture generation belongs to Phase 3.
- Group results and standings belong to Phase 4.
- Lock/reset behavior belongs to Phase 5.
- Full group navigation polish belongs to Phase 6.

</deferred>

---
*Phase: 01-group-stage-configuration*
*Context gathered: 2026-06-24*
