# Requirements: League Table Creator

**Defined:** 2026-06-24
**Core Value:** Tournament organizers can reliably generate fixtures, enter results, and see correct standings for the selected competition format without inconsistent tournament data.

## v1 Requirements

### Tournament Format

- [ ] **FORM-01**: User can select League or Group Stage as the tournament format during tournament creation.
- [ ] **FORM-02**: Existing League tournaments retain their current fixture, result, standings, and scorer behavior.
- [ ] **FORM-03**: User sees group configuration controls only when Group Stage is selected.
- [ ] **FORM-04**: A saved tournament retains its selected format when reloaded.

### Group Configuration

- [ ] **CONF-01**: User can configure the number of groups for a Group Stage tournament.
- [ ] **CONF-02**: User can configure the number of teams required in each group.
- [ ] **CONF-03**: User can see the exact total team requirement calculated as group count multiplied by teams per group.
- [ ] **CONF-04**: User cannot generate group fixtures unless the tournament contains exactly the configured number of teams.
- [ ] **CONF-05**: Each group has a stable identity and display label within its tournament.

### Team Assignment

- [ ] **ASGN-01**: User can manually assign every tournament team to a group.
- [ ] **ASGN-02**: User can automatically distribute all tournament teams randomly across groups.
- [ ] **ASGN-03**: Automatic distribution assigns exactly the configured number of teams to every group.
- [ ] **ASGN-04**: User can review group membership before generating fixtures.
- [ ] **ASGN-05**: User cannot generate fixtures while any team is unassigned, duplicated, or assigned beyond a group's capacity.

### Group Fixtures

- [ ] **FIXT-01**: User can generate round-robin fixtures independently within every group.
- [ ] **FIXT-02**: Group fixture generation reuses the existing league scheduling rules, including applicable fixture settings.
- [ ] **FIXT-03**: No group-stage fixture pairs teams from different groups.
- [ ] **FIXT-04**: User can view fixtures and enter match results within the selected group.
- [ ] **FIXT-05**: Generated group fixtures and entered results persist when the tournament is reloaded.

### Standings and Statistics

- [ ] **STAT-01**: User can view a standings table calculated independently for each group.
- [ ] **STAT-02**: Group standings use the existing points, goal difference, goals scored, and ordering rules.
- [ ] **STAT-03**: Entering or editing a group match result updates only the affected group's standings.
- [ ] **STAT-04**: User can record scorer statistics for group-stage matches and view one top-scorer ranking across the entire tournament.
- [ ] **STAT-05**: Group-stage scorer statistics remain associated with the correct tournament and match after reload.

### Group Navigation

- [ ] **NAV-01**: User can navigate between groups using clearly labeled tabs or cards.
- [ ] **NAV-02**: For each group, user can access its teams, fixtures/results, and standings, while tournament-wide statistics remain accessible from the tournament workspace.
- [ ] **NAV-03**: The Group Stage interface remains usable across the responsive layouts supported by the existing application.

### Locking and Reset

- [ ] **LOCK-01**: After group fixtures are generated, user cannot change group count, teams per group, team assignments, or fixture settings.
- [ ] **LOCK-02**: User can initiate a Reset Group Fixtures action to unlock structural group-stage settings.
- [ ] **LOCK-03**: Before reset, user sees a confirmation warning that fixtures, match results, standings, and related statistics will be deleted.
- [ ] **LOCK-04**: Cancelling the reset preserves all group-stage data and locked settings.
- [ ] **LOCK-05**: Confirming the reset deletes generated group fixtures, results, derived standings, and related group-stage scorer statistics.
- [ ] **LOCK-06**: After a confirmed reset, group configuration and team assignments become editable again.

### Persistence and Compatibility

- [ ] **PERS-01**: Group configuration, assignments, fixtures, results, and statistics are persisted per authenticated user through the existing Firebase data boundary.
- [ ] **PERS-02**: Existing saved League tournaments remain readable and usable without requiring manual data migration.
- [ ] **PERS-03**: Group-stage aggregate data and any synchronized Firestore projections remain consistent after create, update, reset, and delete operations.

## v2 Requirements

### Progression

- **PROG-01**: User can configure how many teams qualify from each group.
- **PROG-02**: User can advance qualified teams into knockout rounds.
- **PROG-03**: User can manage a knockout bracket following the group stage.

### Draw Management

- **DRAW-01**: User can place teams into seeded pots.
- **DRAW-02**: User can perform a constrained group draw using seeded pots.

### Flexible Groups

- **FLEX-01**: User can create groups with unequal team counts.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Knockout rounds | Deferred until standalone group-stage behavior is stable |
| Qualification rules | No post-group progression is included in v1 |
| Seeded or ranking-aware draws | Manual and unseeded random assignment cover v1 |
| Uneven groups | Exact group capacity keeps fixtures and validation deterministic |
| Cross-group combined standings | Every group is an independent league table |
| Structural edits after generation without reset | Would risk inconsistent assignments, fixtures, and standings |

## Traceability

Every v1 requirement is mapped to exactly one roadmap phase.

| Requirement | Phase | Status |
|-------------|-------|--------|
| FORM-01 | Phase 1 | Pending |
| FORM-02 | Phase 1 | Pending |
| FORM-03 | Phase 1 | Pending |
| FORM-04 | Phase 1 | Pending |
| CONF-01 | Phase 1 | Pending |
| CONF-02 | Phase 1 | Pending |
| CONF-03 | Phase 1 | Pending |
| CONF-04 | Phase 1 | Pending |
| CONF-05 | Phase 1 | Pending |
| ASGN-01 | Phase 2 | Pending |
| ASGN-02 | Phase 2 | Pending |
| ASGN-03 | Phase 2 | Pending |
| ASGN-04 | Phase 2 | Pending |
| ASGN-05 | Phase 2 | Pending |
| FIXT-01 | Phase 3 | Pending |
| FIXT-02 | Phase 3 | Pending |
| FIXT-03 | Phase 3 | Pending |
| FIXT-04 | Phase 4 | Pending |
| FIXT-05 | Phase 4 | Pending |
| STAT-01 | Phase 4 | Pending |
| STAT-02 | Phase 4 | Pending |
| STAT-03 | Phase 4 | Pending |
| STAT-04 | Phase 4 | Pending |
| STAT-05 | Phase 4 | Pending |
| NAV-01 | Phase 6 | Pending |
| NAV-02 | Phase 6 | Pending |
| NAV-03 | Phase 6 | Pending |
| LOCK-01 | Phase 5 | Pending |
| LOCK-02 | Phase 5 | Pending |
| LOCK-03 | Phase 5 | Pending |
| LOCK-04 | Phase 5 | Pending |
| LOCK-05 | Phase 5 | Pending |
| LOCK-06 | Phase 5 | Pending |
| PERS-01 | Phase 4 | Pending |
| PERS-02 | Phase 1 | Pending |
| PERS-03 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 36 total
- Mapped to phases: 36
- Unmapped: 0
- Duplicate mappings: 0
- Coverage: 100%

---
*Requirements defined: 2026-06-24*
*Last updated: 2026-06-24 after roadmap creation*
