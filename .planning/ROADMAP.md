# Roadmap: League Table Creator

## Overview

This roadmap extends the existing League workflow with a complete Group Stage format through six sequential vertical slices. Each phase leaves the application in a working state, reuses the existing fixture, standings, scorer, and Firebase boundaries where practical, and preserves existing saved League tournaments throughout.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions added after planning

- [ ] **Phase 1: Group Stage Configuration** - Users can create and reload valid League or Group Stage tournaments with explicit group capacity.
- [ ] **Phase 2: Team Assignment** - Users can fill configured groups manually or through an exact-capacity random distribution.
- [ ] **Phase 3: Group Fixture Generation** - Users can generate isolated round-robin schedules for every configured group.
- [ ] **Phase 4: Group Results and Standings** - Users can record group results, view independent tables, and maintain tournament-wide scorers.
- [ ] **Phase 5: Configuration Locking and Reset** - Generated group stages are protected from structural edits and can be safely reset.
- [ ] **Phase 6: Group Stage UI and Mobile Polish** - Users can navigate a compact, responsive Group Stage workspace consistent with the League workflow.

## Phase Details

### Phase 1: Group Stage Configuration
**Goal:** Users can create a valid tournament in either League or Group Stage format and retain that configuration across reloads.
**Mode:** mvp
**Depends on:** Nothing (first phase)
**Requirements:** FORM-01, FORM-02, FORM-03, FORM-04, CONF-01, CONF-02, CONF-03, CONF-04, CONF-05, PERS-02
**Success Criteria** (what must be TRUE):
  1. User can choose League or Group Stage during tournament creation, and group configuration controls appear only for Group Stage.
  2. User can set group count and teams per group, see the calculated exact team requirement, and see stable group labels.
  3. User is prevented from generating Group Stage fixtures when the tournament team count does not exactly match configured capacity.
  4. A saved Group Stage tournament reloads with its format and configuration intact.
  5. Existing saved League tournaments reload and retain their current fixture, result, standings, and scorer behavior without manual migration.
**Plans:** 1 plan
**UI hint:** yes

### Phase 2: Team Assignment
**Goal:** Users can produce a complete, valid, reviewable team allocation for every configured group.
**Mode:** mvp
**Depends on:** Phase 1
**Requirements:** ASGN-01, ASGN-02, ASGN-03, ASGN-04, ASGN-05
**Success Criteria** (what must be TRUE):
  1. User can manually assign each tournament team to a group without exceeding that group's configured capacity.
  2. User can randomly distribute all teams and receive exactly the configured number of teams in every group.
  3. User can review the complete membership of each group before fixture generation.
  4. User cannot generate fixtures while a team is unassigned, duplicated, or assigned to an over-capacity group.
**Plans:** TBD
**UI hint:** yes

### Phase 3: Group Fixture Generation
**Goal:** Users can generate valid round-robin fixtures independently for every assigned group.
**Mode:** mvp
**Depends on:** Phase 2
**Requirements:** FIXT-01, FIXT-02, FIXT-03
**Success Criteria** (what must be TRUE):
  1. User can generate and view a complete round-robin schedule for every configured group from the reviewed assignments.
  2. Each group's schedule follows the existing League fixture rules and selected fixture settings.
  3. Every generated match contains two teams from the same group; no cross-group fixture is created.
**Plans:** TBD
**UI hint:** yes

### Phase 4: Group Results and Standings
**Goal:** Users can manage results and statistics per group while retaining one tournament-wide scorer ranking.
**Mode:** mvp
**Depends on:** Phase 3
**Requirements:** FIXT-04, FIXT-05, STAT-01, STAT-02, STAT-03, STAT-04, STAT-05, PERS-01
**Success Criteria** (what must be TRUE):
  1. User can view a selected group's fixtures, enter or edit match results, and see those results after reloading the tournament.
  2. User can view an independently calculated standings table for each group using the existing points and ordering rules.
  3. Editing a match result changes only the affected group's standings.
  4. User can record scorers for group matches and view one top-scorer ranking across the entire tournament.
  5. Group configuration, assignments, fixtures, results, standings, and scorer associations persist through the existing authenticated Firebase boundary.
**Plans:** TBD
**UI hint:** yes

### Phase 5: Configuration Locking and Reset
**Goal:** Users are protected from inconsistent Group Stage data after generation and can deliberately return to an editable setup state.
**Mode:** mvp
**Depends on:** Phase 4
**Requirements:** LOCK-01, LOCK-02, LOCK-03, LOCK-04, LOCK-05, LOCK-06, PERS-03
**Success Criteria** (what must be TRUE):
  1. After group fixtures are generated, user cannot change group count, group size, team assignments, or fixture settings.
  2. User can initiate Reset Group Fixtures and sees a destructive confirmation that identifies fixtures, results, standings, and related scorer statistics as data that will be deleted.
  3. Cancelling reset preserves all Group Stage data and keeps structural settings locked.
  4. Confirming reset removes generated Group Stage fixtures, results, derived standings, and related Group Stage scorer statistics, then makes configuration and assignments editable.
  5. Aggregate tournament data and synchronized Firestore projections remain consistent after Group Stage create, update, reset, and tournament delete operations.
**Plans:** TBD
**UI hint:** yes

### Phase 6: Group Stage UI and Mobile Polish
**Goal:** Users can efficiently navigate and understand the complete Group Stage workflow on desktop and mobile.
**Mode:** mvp
**Depends on:** Phase 5
**Requirements:** NAV-01, NAV-02, NAV-03
**Success Criteria** (what must be TRUE):
  1. User can move between clearly labeled groups through compact tabs or cards with an unambiguous active-group header.
  2. Within each group, user can clearly distinguish and access teams, fixtures/results, and a dense familiar football standings table while tournament-wide statistics remain accessible.
  3. Group navigation supports horizontal scrolling on narrow screens without hiding or breaking the active group's content.
  4. The Group Stage workspace remains consistent with the existing League workflow and is usable across the application's supported responsive layouts.
**Plans:** TBD
**UI hint:** yes

## Progress

**Execution Order:** Sequential: Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Group Stage Configuration | 1/1 | Awaiting acceptance | - |
| 2. Team Assignment | 0/TBD | Not started | - |
| 3. Group Fixture Generation | 0/TBD | Not started | - |
| 4. Group Results and Standings | 0/TBD | Not started | - |
| 5. Configuration Locking and Reset | 0/TBD | Not started | - |
| 6. Group Stage UI and Mobile Polish | 0/TBD | Not started | - |
