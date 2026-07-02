"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronRight,
  CircleUserRound,
  Goal,
  ListPlus,
  LogOut,
  Plus,
  RefreshCw,
  Shield,
  Table2,
  Trash2,
  Trophy,
  UsersRound
} from "lucide-react";
import type { User } from "firebase/auth";
import { isFirebaseConfigured } from "@/lib/firebase";
import GroupAssignmentBoard from "@/components/GroupAssignmentBoard";
import {
  calculateStandings,
  createId,
  createTeam,
  createTournament,
  generateFixtures,
  generateGroupFixtures,
  groupAssignmentStatus,
  requiredTeamCount,
  sortScorers
} from "@/lib/league";
import {
  loginWithGoogle,
  logoutUser,
  observeAuthState
} from "@/services/authService";
import {
  deleteTournament,
  saveTournament,
  subscribeToUserTournaments,
  syncTournamentCollections
} from "@/services/tournamentService";
import type {
  FixtureType,
  Match,
  Scorer,
  Team,
  Tournament,
  TournamentFormat
} from "@/types/league";
import styles from "./page.module.css";

type TabKey = "setup" | "fixtures" | "table" | "scorers";
type AppUser = Pick<User, "uid" | "displayName" | "email">;
type ConfirmationState = {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
};
type DuplicateScorerState = {
  scorerId: string;
  goalsToAdd: number;
};

const tabs: { key: TabKey; label: string; icon: typeof Trophy }[] = [
  { key: "setup", label: "Setup", icon: UsersRound },
  { key: "fixtures", label: "Fixtures", icon: CalendarDays },
  { key: "table", label: "Table", icon: Table2 },
  { key: "scorers", label: "Scorers", icon: Goal }
];

const fixtureTypeOptions: { value: FixtureType; title: string; description: string }[] = [
  {
    value: "single",
    title: "Single match",
    description: "Each team plays every other team once."
  },
  {
    value: "homeAway",
    title: "Home and away match",
    description: "Each team plays every other team twice."
  }
];

const tournamentFormatOptions: {
  value: TournamentFormat;
  title: string;
  description: string;
}[] = [
  {
    value: "league",
    title: "League",
    description: "One table where every team plays the competition schedule."
  },
  {
    value: "groupStage",
    title: "Group Stage",
    description: "Multiple independent groups with their own fixtures and tables."
  }
];

function normalizePlayerName(name: string) {
  return name.trim().toLocaleLowerCase();
}

export default function Home() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [authReady, setAuthReady] = useState(!isFirebaseConfigured);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState("");
  const [activeTab, setActiveTab] = useState<TabKey>("setup");
  const [tournamentName, setTournamentName] = useState("");
  const [newTournamentFormat, setNewTournamentFormat] = useState<TournamentFormat>("league");
  const [groupCount, setGroupCount] = useState(2);
  const [teamsPerGroup, setTeamsPerGroup] = useState(4);
  const [teamName, setTeamName] = useState("");
  const [scorerName, setScorerName] = useState("");
  const [scorerTeamId, setScorerTeamId] = useState("");
  const [scorerGoals, setScorerGoals] = useState(1);
  const [authError, setAuthError] = useState("");
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");
  const [isCreatingTournament, setIsCreatingTournament] = useState(false);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [duplicateScorer, setDuplicateScorer] = useState<DuplicateScorerState | null>(null);
  const [scorerGuidance, setScorerGuidance] = useState("");
  const [setupGuidance, setSetupGuidance] = useState("");

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    return observeAuthState((nextUser: User | null) => {
      setUser(nextUser);
      setAuthReady(true);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setTournaments([]);
      setSelectedTournamentId("");
      return;
    }

    return subscribeToUserTournaments(user.uid, (nextTournaments: Tournament[], error?: Error) => {
      if (error) {
        setCreateError("Could not load your tournaments. Please refresh and try again.");
      }
      setTournaments(nextTournaments);
    });
  }, [user]);

  useEffect(() => {
    if (selectedTournamentId && !tournaments.some((item) => item.id === selectedTournamentId)) {
      setSelectedTournamentId("");
      setActiveTab("setup");
    }
  }, [selectedTournamentId, tournaments]);

  const selectedTournament = useMemo(
    () => tournaments.find((item) => item.id === selectedTournamentId) ?? null,
    [selectedTournamentId, tournaments]
  );

  const standings = useMemo(
    () => calculateStandings(selectedTournament?.teams ?? [], selectedTournament?.matches ?? []),
    [selectedTournament]
  );

  const scorers = useMemo(
    () => sortScorers(selectedTournament?.scorers ?? []),
    [selectedTournament]
  );

  const playedMatches = useMemo(
    () => selectedTournament?.matches.filter((match) => match.homeScore !== null && match.awayScore !== null).length ?? 0,
    [selectedTournament]
  );

  const selectedFixtureType = selectedTournament?.fixtureType ?? "single";
  const selectedTournamentFormat = selectedTournament?.format ?? "league";
  const selectedRequiredTeamCount = requiredTeamCount(selectedTournament?.groupConfiguration);
  const newTournamentRequiredTeamCount = groupCount * teamsPerGroup;
  const groupStageTeamCountIsExact =
    selectedTournamentFormat === "groupStage" &&
    selectedTournament?.teams.length === selectedRequiredTeamCount;
  const groupAssignment =
    selectedTournamentFormat === "groupStage" &&
    selectedTournament?.groupConfiguration &&
    selectedTournament.groups
      ? groupAssignmentStatus(
          selectedTournament.teams,
          selectedTournament.groups,
          selectedTournament.groupConfiguration.teamsPerGroup
        )
      : null;

  async function persistTournament(nextTournament: Tournament) {
    if (!user) return;

    await saveTournament(user.uid, nextTournament);
    await syncTournamentCollections(
      user.uid,
      nextTournament,
      calculateStandings(nextTournament.teams, nextTournament.matches)
    );
  }

  async function removeTournament(tournamentId: string) {
    if (!user) return;

    await deleteTournament(user.uid, tournamentId);
  }

  async function handleCreateTournament() {
    const trimmedName = tournamentName.trim();

    setCreateError("");
    setCreateSuccess("");

    if (!trimmedName) {
      setCreateError("Please enter a tournament name.");
      return;
    }

    setIsCreatingTournament(true);

    try {
      const nextTournament = createTournament(trimmedName, {
        format: newTournamentFormat,
        groupConfiguration:
          newTournamentFormat === "groupStage"
            ? {
                groupCount,
                teamsPerGroup
              }
            : undefined
      });
      await persistTournament(nextTournament);
      setTournaments((current) => {
        const withoutDuplicate = current.filter((item) => item.id !== nextTournament.id);
        return [nextTournament, ...withoutDuplicate];
      });
      setTournamentName("");
      setNewTournamentFormat("league");
      setGroupCount(2);
      setTeamsPerGroup(4);
      setCreateSuccess("Tournament created. Open it from the list below.");
    } catch (error) {
      console.error("Tournament creation failed:", error);
      setCreateError("Could not create the tournament. Please check Firestore rules and try again.");
    } finally {
      setIsCreatingTournament(false);
    }
  }

  function openTournament(tournamentId: string) {
    setSelectedTournamentId(tournamentId);
    setActiveTab("setup");
    setCreateError("");
    setCreateSuccess("");
  }

  function closeTournament() {
    setSelectedTournamentId("");
    setActiveTab("setup");
    setTeamName("");
    setScorerName("");
    setSetupGuidance("");
  }

  async function addTeam() {
    if (!selectedTournament || !teamName.trim()) return;

    if (
      selectedTournamentFormat === "groupStage" &&
      selectedRequiredTeamCount > 0 &&
      selectedTournament.teams.length >= selectedRequiredTeamCount
    ) {
      setSetupGuidance(`This Group Stage is configured for exactly ${selectedRequiredTeamCount} teams.`);
      return;
    }

    await persistTournament({
      ...selectedTournament,
      fixtureType: selectedFixtureType,
      fixturesGenerated: selectedTournament.fixturesGenerated ?? false,
      teams: [...selectedTournament.teams, createTeam(teamName, selectedTournament.teams.length)]
    });
    setTeamName("");
    setSetupGuidance("");
  }

  function askConfirmation(nextConfirmation: ConfirmationState) {
    setConfirmation(nextConfirmation);
  }

  async function handleConfirmedAction(action: () => Promise<void>) {
    setConfirmation(null);
    await action();
  }

  async function updateFixtureType(fixtureType: FixtureType) {
    if (!selectedTournament) return;

    await persistTournament({
      ...selectedTournament,
      fixtureType,
      fixturesGenerated: selectedTournament.fixturesGenerated ?? selectedTournament.matches.length > 0
    });
  }

  async function generateTournamentFixtures() {
    if (!selectedTournament || selectedTournament.teams.length < 2) return;

    const fixtureType = selectedTournament.fixtureType ?? "single";
    const matches =
      selectedTournamentFormat === "groupStage" && selectedTournament.groups
        ? generateGroupFixtures(selectedTournament.teams, selectedTournament.groups, fixtureType)
        : generateFixtures(selectedTournament.teams, fixtureType);

    await persistTournament({
      ...selectedTournament,
      fixtureType,
      fixturesGenerated: true,
      matches
    });
    setActiveTab("fixtures");
  }

  async function buildFixtures() {
    if (!selectedTournament || selectedTournament.teams.length < 2) return;

    if (selectedTournamentFormat === "groupStage") {
      if (!groupStageTeamCountIsExact) {
        setSetupGuidance(
          `Add exactly ${selectedRequiredTeamCount} teams before generating Group Stage fixtures.`
        );
        return;
      }

      if (!groupAssignment?.isComplete) {
        setSetupGuidance("Fill every group and assign each team exactly once before generating fixtures.");
        return;
      }

    }

    setSetupGuidance("");

    if (selectedTournament.matches.length > 0) {
      askConfirmation({
        title: "Regenerate fixtures?",
        message: "Fixtures already exist. Regenerating fixtures will remove existing fixture results and standings. Do you want to continue?",
        confirmLabel: "Continue",
        onConfirm: generateTournamentFixtures
      });
      return;
    }

    await generateTournamentFixtures();
  }

  async function removeTeam(team: Team) {
    if (!selectedTournament) return;

    const hasGeneratedFixtures = selectedTournament.fixturesGenerated ?? selectedTournament.matches.length > 0;
    const removeSelectedTeam = async () => {
      await persistTournament({
        ...selectedTournament,
        fixtureType: selectedFixtureType,
        fixturesGenerated: hasGeneratedFixtures ? false : (selectedTournament.fixturesGenerated ?? false),
        teams: selectedTournament.teams.filter((item) => item.id !== team.id),
        groups: selectedTournament.groups?.map((group) => ({
          ...group,
          teamIds: group.teamIds.filter((teamId) => teamId !== team.id)
        })),
        matches: hasGeneratedFixtures ? [] : selectedTournament.matches
      });
      setActiveTab("setup");
    };

    askConfirmation({
      title: "Remove team?",
      message: hasGeneratedFixtures
        ? "Fixtures are already generated. Removing this team will remove existing fixtures and standings. You need to generate fixtures again. Do you want to continue?"
        : "Are you sure you want to remove this team from the tournament?",
      confirmLabel: "Remove",
      onConfirm: removeSelectedTeam
    });
  }

  async function updateMatch(matchId: string, patch: Partial<Match>) {
    if (!selectedTournament) return;

    await persistTournament({
      ...selectedTournament,
      matches: selectedTournament.matches.map((match) =>
        match.id === matchId ? { ...match, ...patch } : match
      )
    });
  }

  async function addScorer() {
    const trimmedScorerName = scorerName.trim();
    if (!selectedTournament || !trimmedScorerName) return;

    const fallbackTeamId = scorerTeamId || selectedTournament.teams[0]?.id;
    if (!fallbackTeamId) return;

    const goalsToAdd = Math.max(1, scorerGoals);
    const matchingScorer = selectedTournament.scorers.find(
      (scorer) =>
        scorer.teamId === fallbackTeamId &&
        normalizePlayerName(scorer.player) === normalizePlayerName(trimmedScorerName)
    );

    if (matchingScorer) {
      setDuplicateScorer({ scorerId: matchingScorer.id, goalsToAdd });
      setScorerGuidance("");
      return;
    }

    const nextScorer: Scorer = {
      id: createId("scorer"),
      player: trimmedScorerName,
      teamId: fallbackTeamId,
      goals: goalsToAdd
    };

    await persistTournament({
      ...selectedTournament,
      scorers: [...selectedTournament.scorers, nextScorer]
    });
    setScorerName("");
    setScorerGoals(1);
    setScorerTeamId(fallbackTeamId);
    setScorerGuidance("");
  }

  async function updateScorer(scorerId: string, goals: number) {
    if (!selectedTournament) return;

    await persistTournament({
      ...selectedTournament,
      scorers: selectedTournament.scorers
        .map((scorer) => (scorer.id === scorerId ? { ...scorer, goals: Math.max(0, goals) } : scorer))
        .filter((scorer) => scorer.goals > 0)
    });
  }

  async function confirmDuplicateScorer() {
    if (!selectedTournament || !duplicateScorer) return;

    await updateScorer(
      duplicateScorer.scorerId,
      (selectedTournament.scorers.find((scorer) => scorer.id === duplicateScorer.scorerId)?.goals ?? 0) +
        duplicateScorer.goalsToAdd
    );
    setDuplicateScorer(null);
    setScorerName("");
    setScorerGoals(1);
    setScorerGuidance("");
  }

  function rejectDuplicateScorer() {
    setDuplicateScorer(null);
    setScorerGuidance(
      "Please add a slight variation to the name to differentiate the player, for example: Yamal Jr., Yamal A., or Yamal (U21)."
    );
  }

  function teamNameById(teamId: string) {
    return selectedTournament?.teams.find((team) => team.id === teamId)?.name ?? "Team";
  }

  function groupNameById(groupId?: string) {
    return selectedTournament?.groups?.find((group) => group.id === groupId)?.label;
  }

  async function handleGoogleLogin() {
    setAuthError("");

    try {
      await loginWithGoogle();
      setActiveTab("setup");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Google sign-in failed. Please try again.");
    }
  }

  if (!authReady) {
    return (
      <main className="app-wrapper">
        <section className={styles.centerStage}>
          <RefreshCw className={styles.spin} size={24} />
        </section>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="app-wrapper">
        <section className={styles.login}>
          <div className={styles.loginHero}>
            <div className={styles.brandMark}>
              <Shield size={30} />
            </div>
            <p className={styles.eyebrow}>Simple League Creator</p>
            <h1>Run the table from your phone.</h1>
            <p className={styles.loginCopy}>
              Build fixtures, post scores, track standings, and keep the golden boot race tidy.
            </p>
          </div>
          <div className={styles.loginActions}>
            {isFirebaseConfigured && (
              <button className={styles.primaryButton} onClick={() => void handleGoogleLogin()}>
                <CircleUserRound size={18} />
                Google sign in
              </button>
            )}
            {authError && <p className={styles.errorMessage}>{authError}</p>}
          </div>
        </section>
      </main>
    );
  }

  if (!selectedTournament) {
    return (
      <main className="app-wrapper">
        <header className={styles.header}>
          <div className={styles.headerCopy}>
            <p className={styles.eyebrow}>Simple League Creator</p>
            <h1>My Tournaments</h1>
            <span>{user.displayName || user.email || "League manager"}</span>
          </div>
          <button
            className={styles.iconButton}
            title="Sign out"
            onClick={() => {
              void logoutUser();
            }}
          >
            <LogOut size={18} />
          </button>
        </header>

        <section className={styles.dashboard}>
          <div className={styles.createCard}>
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>New tournament</p>
                <h2>Create Tournament</h2>
              </div>
            </div>
            <div className={styles.createFields}>
              <label className={styles.fieldLabel}>
                <span>Tournament name</span>
                <input
                  value={tournamentName}
                  onChange={(event) => setTournamentName(event.target.value)}
                  placeholder="Summer Cup"
                />
              </label>
              <fieldset className={styles.formatFieldset}>
                <legend>Tournament Format</legend>
                <div className={styles.formatOptions}>
                  {tournamentFormatOptions.map((option) => (
                    <label
                      key={option.value}
                      className={`${styles.fixtureTypeCard} ${
                        newTournamentFormat === option.value ? styles.activeFixtureType : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="tournamentFormat"
                        value={option.value}
                        checked={newTournamentFormat === option.value}
                        onChange={() => setNewTournamentFormat(option.value)}
                      />
                      <span>
                        <strong>{option.title}</strong>
                        <small>{option.description}</small>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {newTournamentFormat === "groupStage" && (
                <section className={styles.groupConfigPanel} aria-labelledby="group-config-title">
                  <div>
                    <h3 id="group-config-title">Group Configuration</h3>
                    <p>Use equal-sized groups for a predictable round-robin schedule.</p>
                  </div>
                  <div className={styles.groupConfigFields}>
                    <label className={styles.fieldLabel}>
                      <span>Number of groups</span>
                      <input
                        type="number"
                        min={2}
                        step={1}
                        value={groupCount}
                        onChange={(event) =>
                          setGroupCount(Math.max(2, Math.floor(Number(event.target.value) || 2)))
                        }
                      />
                    </label>
                    <label className={styles.fieldLabel}>
                      <span>Teams per group</span>
                      <input
                        type="number"
                        min={2}
                        step={1}
                        value={teamsPerGroup}
                        onChange={(event) =>
                          setTeamsPerGroup(Math.max(2, Math.floor(Number(event.target.value) || 2)))
                        }
                      />
                    </label>
                  </div>
                  <strong className={styles.capacitySummary}>
                    {newTournamentRequiredTeamCount} teams required · {groupCount} groups × {teamsPerGroup} teams
                  </strong>
                </section>
              )}
              <button
                className={styles.primaryButton}
                onClick={() => void handleCreateTournament()}
                disabled={isCreatingTournament}
              >
                {isCreatingTournament ? <RefreshCw className={styles.spin} size={18} /> : <Plus size={18} />}
                Create tournament
              </button>
            </div>
            {(createError || createSuccess) && (
              <div className={styles.feedbackBar}>
                {createError && <p className={styles.errorMessage}>{createError}</p>}
                {createSuccess && <p className={styles.successMessage}>{createSuccess}</p>}
              </div>
            )}
          </div>

          <section className={styles.tournamentSection} aria-label="Tournaments">
            <div className={styles.sectionHeader}>
              <div>
                <p className={styles.eyebrow}>Dashboard</p>
                <h2>Tournaments</h2>
              </div>
            </div>

            {tournaments.length > 0 ? (
              <div className={styles.tournamentList}>
                {tournaments.map((tournament) => (
                  <button
                    key={tournament.id}
                    className={styles.tournamentCard}
                    onClick={() => openTournament(tournament.id)}
                  >
                    <span>
                      <strong>{tournament.name}</strong>
                      <small>{(tournament.format ?? "league") === "groupStage" ? "Group Stage" : "League"}</small>
                    </span>
                    <ArrowRight size={18} />
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState title="No tournaments yet. Create your first league to get started." />
            )}
          </section>
        </section>
      </main>
    );
  }

  return (
    <main className="app-wrapper">
      <header className={`${styles.header} ${styles.detailHeader}`}>
        <button className={styles.iconButton} title="Back to tournaments" onClick={closeTournament}>
          <ArrowLeft size={18} />
        </button>
        <div className={styles.headerCopy}>
          <p className={styles.eyebrow}>Tournament Details</p>
          <h1>{selectedTournament.name}</h1>
          <span>{user.displayName || user.email || "League manager"}</span>
        </div>
        <button
          className={styles.iconButton}
          title="Sign out"
          onClick={() => {
            void logoutUser();
          }}
        >
          <LogOut size={18} />
        </button>
      </header>

      <section className={styles.heroPanel}>
        <div className={styles.statTile}>
          <UsersRound size={18} />
          <span>{selectedTournament.teams.length}</span>
          Teams
        </div>
        <div className={styles.statTile}>
          <CalendarDays size={18} />
          <span>{playedMatches}</span>
          Played
        </div>
        <div className={styles.statTile}>
          <Trophy size={18} />
          <span>{standings[0]?.points ?? 0}</span>
          Top points
        </div>
      </section>

      <nav className={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={activeTab === tab.key ? styles.activeTab : ""}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </nav>

      {activeTab === "setup" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Setup</p>
              <h2>Teams</h2>
            </div>
            <button
              className={styles.textButton}
              onClick={() => void buildFixtures()}
              disabled={
                selectedTournamentFormat === "groupStage"
                  ? !groupAssignment?.isComplete
                  : selectedTournament.teams.length < 2
              }
            >
              Generate <ChevronRight size={16} />
            </button>
          </div>
          {selectedTournamentFormat === "groupStage" && selectedTournament.groupConfiguration && (
            <section className={styles.groupOverview} aria-labelledby="group-overview-title">
              <div>
                <p className={styles.eyebrow}>Group Stage</p>
                <h3 id="group-overview-title">
                  {selectedTournament.groupConfiguration.groupCount} groups ·{" "}
                  {selectedTournament.groupConfiguration.teamsPerGroup} teams each
                </h3>
                <p>
                  {selectedTournament.teams.length} of {selectedRequiredTeamCount} teams added
                </p>
              </div>
              <div className={styles.groupLabelList} aria-label="Configured groups">
                {(selectedTournament.groups ?? []).map((group) => (
                  <span key={group.id}>{group.label}</span>
                ))}
              </div>
            </section>
          )}
          <section className={styles.fixtureTypeSection} aria-labelledby="fixture-type-title">
            <h3 id="fixture-type-title">Fixture Type</h3>
            <div className={styles.fixtureTypeOptions}>
              {fixtureTypeOptions.map((option) => (
                <label
                  key={option.value}
                  className={`${styles.fixtureTypeCard} ${
                    selectedFixtureType === option.value ? styles.activeFixtureType : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="fixtureType"
                    value={option.value}
                    checked={selectedFixtureType === option.value}
                    onChange={() => void updateFixtureType(option.value)}
                  />
                  <span>
                    <strong>{option.title}</strong>
                    <small>{option.description}</small>
                  </span>
                </label>
              ))}
            </div>
          </section>
          <div className={styles.formRow}>
            <input value={teamName} onChange={(event) => setTeamName(event.target.value)} placeholder="Team name" />
            <button
              className={styles.iconButton}
              title="Add team"
              onClick={() => void addTeam()}
              disabled={
                selectedTournamentFormat === "groupStage" &&
                selectedRequiredTeamCount > 0 &&
                selectedTournament.teams.length >= selectedRequiredTeamCount
              }
            >
              <ListPlus size={18} />
            </button>
          </div>
          {setupGuidance && <p className={styles.setupGuidance}>{setupGuidance}</p>}
          <div className={styles.teamGrid}>
            {selectedTournament.teams.map((team) => (
              <div className={styles.teamCard} key={team.id}>
                <strong>{team.name}</strong>
                <button
                  className={styles.removeTeamButton}
                  title={`Remove ${team.name}`}
                  onClick={() => void removeTeam(team)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
          {selectedTournament.teams.length === 0 && (
            <EmptyState title="No teams added yet. Add teams from the Setup tab." />
          )}
          {selectedTournamentFormat === "groupStage" &&
            selectedTournament.groupConfiguration &&
            selectedTournament.groups && (
              <GroupAssignmentBoard
                teams={selectedTournament.teams}
                groups={selectedTournament.groups}
                teamsPerGroup={selectedTournament.groupConfiguration.teamsPerGroup}
                onGroupsChange={async (groups) => {
                  await persistTournament({
                    ...selectedTournament,
                    groups
                  });
                }}
              />
            )}
          <button
            className={styles.dangerButton}
            onClick={() => void removeTournament(selectedTournament.id)}
          >
            <Trash2 size={17} />
            Delete tournament
          </button>
        </section>
      )}

      {activeTab === "fixtures" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Schedule</p>
              <h2>Fixtures</h2>
            </div>
            <button className={styles.iconButton} title="Regenerate fixtures" onClick={() => void buildFixtures()}>
              <RefreshCw size={17} />
            </button>
          </div>
          {selectedTournament.matches.length > 0 && (
            <div className={styles.weekCard}>
              <span>League week</span>
              <strong>{selectedTournament.matches.length} fixtures ready</strong>
            </div>
          )}
          <div className={styles.matchList}>
            {selectedTournament.matches.map((match) => (
              <article className={styles.matchCard} key={match.id}>
                <span className={styles.roundLabel}>
                  {groupNameById(match.groupId) ? `${groupNameById(match.groupId)} · ` : ""}Round {match.round}
                </span>
                <div className={styles.fixtureLine}>
                  <span className={styles.fixtureTeam}>{teamNameById(match.homeTeamId)}</span>
                  <input
                    inputMode="numeric"
                    value={match.homeScore ?? ""}
                    onChange={(event) =>
                      void updateMatch(match.id, {
                        homeScore: event.target.value === "" ? null : Number(event.target.value)
                      })
                    }
                    aria-label={`${teamNameById(match.homeTeamId)} score`}
                  />
                  <span className={styles.fixtureVs}>vs</span>
                  <input
                    inputMode="numeric"
                    value={match.awayScore ?? ""}
                    onChange={(event) =>
                      void updateMatch(match.id, {
                        awayScore: event.target.value === "" ? null : Number(event.target.value)
                      })
                    }
                    aria-label={`${teamNameById(match.awayTeamId)} score`}
                  />
                  <span className={styles.fixtureTeam}>{teamNameById(match.awayTeamId)}</span>
                </div>
              </article>
            ))}
          </div>
          {selectedTournament.matches.length === 0 && <EmptyState title="Add teams, then generate fixtures." />}
        </section>
      )}

      {activeTab === "table" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Live</p>
              <h2>Standings</h2>
            </div>
          </div>
          {standings.length > 0 ? (
            <div className={styles.tableWrap}>
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>M</th>
                    <th>W</th>
                    <th>L</th>
                    <th>GF</th>
                    <th>GA</th>
                    <th>GD</th>
                    <th>PTS</th>
                  </tr>
                </thead>
                <tbody>
                  {standings.map((row, index) => (
                    <tr
                      key={row.team.id}
                      className={
                        index === 0
                          ? styles.promotionRow
                          : index === standings.length - 1 && standings.length > 2
                            ? styles.relegationRow
                            : ""
                      }
                    >
                      <td>
                        <span>{index + 1}</span>
                        {row.team.name}
                      </td>
                      <td>{row.played}</td>
                      <td>{row.won}</td>
                      <td>{row.lost}</td>
                      <td>{row.goalsFor}</td>
                      <td>{row.goalsAgainst}</td>
                      <td>{row.goalDifference}</td>
                      <td>{row.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState title="No teams added yet. Add teams from the Setup tab." />
          )}
        </section>
      )}

      {activeTab === "scorers" && (
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.eyebrow}>Golden boot</p>
              <h2>Top scorers</h2>
            </div>
          </div>
          <div className={styles.scorerForm}>
            <input
              value={scorerName}
              onChange={(event) => {
                setScorerName(event.target.value);
                setScorerGuidance("");
              }}
              placeholder="Player"
            />
            <select
              value={scorerTeamId}
              onChange={(event) => {
                setScorerTeamId(event.target.value);
                setScorerGuidance("");
              }}
            >
              <option value="">Team</option>
              {selectedTournament.teams.map((team) => (
                <option key={team.id} value={team.id}>
                  {team.name}
                </option>
              ))}
            </select>
            <input
              inputMode="numeric"
              min={1}
              value={scorerGoals}
              onChange={(event) => setScorerGoals(Math.max(1, Number(event.target.value) || 1))}
              aria-label="Goals"
            />
            <button className={styles.iconButton} title="Add scorer" onClick={() => void addScorer()}>
              <Plus size={18} />
            </button>
          </div>
          {scorerGuidance && <p className={styles.scorerGuidance}>{scorerGuidance}</p>}
          <div className={styles.scorerList}>
            {scorers.map((scorer, index) => (
              <article
                className={`${styles.scorerCard} ${index === 0 ? styles.topScorerCard : ""}`}
                key={scorer.id}
              >
                <span className={styles.rank}>{index + 1}</span>
                <div>
                  <strong>{scorer.player}</strong>
                  <p>{teamNameById(scorer.teamId)}</p>
                </div>
                <div className={styles.goalStepper}>
                  <button onClick={() => void updateScorer(scorer.id, scorer.goals - 1)}>-</button>
                  <span>{scorer.goals}</span>
                  <button onClick={() => void updateScorer(scorer.id, scorer.goals + 1)}>+</button>
                </div>
              </article>
            ))}
          </div>
          {scorers.length === 0 && <EmptyState title="No scorers added yet." />}
        </section>
      )}

      {duplicateScorer && (
        <div className={styles.modalOverlay} role="presentation">
          <section
            className={styles.confirmDialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="duplicate-scorer-title"
          >
            <h2 id="duplicate-scorer-title">Possible duplicate player</h2>
            <p>Another player with this name already exists in this team. Is this the same player?</p>
            <div className={styles.confirmActions}>
              <button className={styles.secondaryButton} onClick={rejectDuplicateScorer}>
                No, different player
              </button>
              <button className={styles.primaryActionButton} onClick={() => void confirmDuplicateScorer()}>
                Yes, same player
              </button>
            </div>
          </section>
        </div>
      )}

      {confirmation && (
        <div className={styles.modalOverlay} role="presentation">
          <section className={styles.confirmDialog} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
            <h2 id="confirm-title">{confirmation.title}</h2>
            <p>{confirmation.message}</p>
            <div className={styles.confirmActions}>
              <button className={styles.secondaryButton} onClick={() => setConfirmation(null)}>
                Cancel
              </button>
              <button
                className={styles.dangerActionButton}
                onClick={() => void handleConfirmedAction(confirmation.onConfirm)}
              >
                {confirmation.confirmLabel}
              </button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}

function EmptyState({ title }: { title: string }) {
  return (
    <div className={styles.emptyState}>
      <Trophy size={22} />
      <span>{title}</span>
    </div>
  );
}
