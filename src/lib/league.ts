import type {
  FixtureType,
  Group,
  GroupConfiguration,
  Match,
  Scorer,
  StandingRow,
  Team,
  Tournament,
  TournamentFormat
} from "@/types/league";

const badges = ["AFC", "CITY", "UTD", "FC", "SC", "XI", "ATH", "ROV"];

export const teamColorPresets = [
  { name: "Electric", primaryColor: "#7c3aed", secondaryColor: "#06b6d4" },
  { name: "Blaze", primaryColor: "#ef4444", secondaryColor: "#f59e0b" },
  { name: "Emerald", primaryColor: "#059669", secondaryColor: "#22c55e" },
  { name: "Royal", primaryColor: "#1d4ed8", secondaryColor: "#7c3aed" },
  { name: "Sunset", primaryColor: "#db2777", secondaryColor: "#f97316" },
  { name: "Midnight", primaryColor: "#334155", secondaryColor: "#0f172a" }
] as const;

export function createTeamGradient(primaryColor: string, secondaryColor: string) {
  return `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`;
}

export function normalizeTeamColors(team: Team, index = 0): Team {
  const preset = teamColorPresets[index % teamColorPresets.length];
  const primaryColor = team.primaryColor ?? preset.primaryColor;
  const secondaryColor = team.secondaryColor ?? preset.secondaryColor;

  return {
    ...team,
    primaryColor,
    secondaryColor,
    gradient: createTeamGradient(primaryColor, secondaryColor)
  };
}

export function teamGradient(team: Team, index = 0) {
  return normalizeTeamColors(team, index).gradient as string;
}

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

type CreateTournamentOptions = {
  format?: TournamentFormat;
  groupConfiguration?: GroupConfiguration;
};

function groupLabel(index: number) {
  let value = index + 1;
  let suffix = "";

  while (value > 0) {
    value -= 1;
    suffix = String.fromCharCode(65 + (value % 26)) + suffix;
    value = Math.floor(value / 26);
  }

  return `Group ${suffix}`;
}

export function createGroups(groupCount: number): Group[] {
  return Array.from({ length: groupCount }, (_, index) => ({
    id: createId("group"),
    label: groupLabel(index),
    teamIds: []
  }));
}

export function requiredTeamCount(configuration?: GroupConfiguration) {
  if (!configuration) return 0;
  return configuration.groupCount * configuration.teamsPerGroup;
}

export type AssignmentStatus = {
  assignedCount: number;
  unassignedTeamIds: string[];
  duplicateTeamIds: string[];
  unknownTeamIds: string[];
  overCapacityGroupIds: string[];
  incompleteGroupIds: string[];
  isComplete: boolean;
};

export function groupAssignmentStatus(
  teams: Team[],
  groups: Group[],
  teamsPerGroup: number
): AssignmentStatus {
  const knownTeamIds = new Set(teams.map((team) => team.id));
  const occurrences = new Map<string, number>();
  const unknownTeamIds = new Set<string>();

  groups.forEach((group) => {
    group.teamIds.forEach((teamId) => {
      occurrences.set(teamId, (occurrences.get(teamId) ?? 0) + 1);
      if (!knownTeamIds.has(teamId)) unknownTeamIds.add(teamId);
    });
  });

  const duplicateTeamIds = [...occurrences.entries()]
    .filter(([, count]) => count > 1)
    .map(([teamId]) => teamId);
  const assignedKnownTeamIds = new Set(
    [...occurrences.keys()].filter((teamId) => knownTeamIds.has(teamId))
  );
  const unassignedTeamIds = teams
    .filter((team) => !assignedKnownTeamIds.has(team.id))
    .map((team) => team.id);
  const overCapacityGroupIds = groups
    .filter((group) => group.teamIds.length > teamsPerGroup)
    .map((group) => group.id);
  const incompleteGroupIds = groups
    .filter((group) => group.teamIds.length !== teamsPerGroup)
    .map((group) => group.id);

  return {
    assignedCount: assignedKnownTeamIds.size,
    unassignedTeamIds,
    duplicateTeamIds,
    unknownTeamIds: [...unknownTeamIds],
    overCapacityGroupIds,
    incompleteGroupIds,
    isComplete:
      unassignedTeamIds.length === 0 &&
      duplicateTeamIds.length === 0 &&
      unknownTeamIds.size === 0 &&
      overCapacityGroupIds.length === 0 &&
      incompleteGroupIds.length === 0
  };
}

export function moveTeamToGroup(
  groups: Group[],
  teamId: string,
  destinationGroupId: string | null,
  destinationIndex: number,
  teamsPerGroup: number
) {
  const sourceGroup = groups.find((group) => group.teamIds.includes(teamId));
  const destinationGroup = groups.find((group) => group.id === destinationGroupId);

  if (destinationGroupId && !destinationGroup) {
    return { groups, error: "Group not found." };
  }

  if (
    destinationGroup &&
    destinationGroup.id !== sourceGroup?.id &&
    destinationGroup.teamIds.length >= teamsPerGroup
  ) {
    return { groups, error: `${destinationGroup.label} is full.` };
  }

  const nextGroups = groups.map((group) => ({
    ...group,
    teamIds: group.teamIds.filter((id) => id !== teamId)
  }));

  if (!destinationGroupId) {
    return { groups: nextGroups };
  }

  return {
    groups: nextGroups.map((group) => {
      if (group.id !== destinationGroupId) return group;
      const nextTeamIds = [...group.teamIds];
      nextTeamIds.splice(Math.max(0, Math.min(destinationIndex, nextTeamIds.length)), 0, teamId);
      return { ...group, teamIds: nextTeamIds };
    })
  };
}

export function swapGroupTeams(groups: Group[], firstTeamId: string, secondTeamId: string) {
  const firstGroup = groups.find((group) => group.teamIds.includes(firstTeamId));
  const secondGroup = groups.find((group) => group.teamIds.includes(secondTeamId));

  if (!secondGroup || firstGroup?.id === secondGroup.id) {
    return { groups, error: "Select a team from a different group to swap." };
  }

  return {
    groups: groups.map((group) => ({
      ...group,
      teamIds: group.teamIds.map((teamId) => {
        if (firstGroup && teamId === firstTeamId) return secondTeamId;
        if (teamId === secondTeamId) return firstTeamId;
        return teamId;
      })
    }))
  };
}

export function randomizeGroupAssignments(
  teams: Team[],
  groups: Group[],
  teamsPerGroup: number,
  random: () => number = Math.random
) {
  if (teams.length !== groups.length * teamsPerGroup) {
    return {
      groups,
      error: `Exactly ${groups.length * teamsPerGroup} teams are required for random assignment.`
    };
  }

  const shuffledTeamIds = teams.map((team) => team.id);
  for (let index = shuffledTeamIds.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffledTeamIds[index], shuffledTeamIds[swapIndex]] = [
      shuffledTeamIds[swapIndex],
      shuffledTeamIds[index]
    ];
  }

  return {
    groups: groups.map((group, index) => ({
      ...group,
      teamIds: shuffledTeamIds.slice(index * teamsPerGroup, (index + 1) * teamsPerGroup)
    }))
  };
}

export function tournamentFormat(tournament: Tournament): TournamentFormat {
  return tournament.format ?? "league";
}

export function createTournament(name: string, options: CreateTournamentOptions = {}): Tournament {
  const format = options.format ?? "league";
  const groupConfiguration =
    format === "groupStage"
      ? {
          groupCount: Math.max(2, Math.floor(options.groupConfiguration?.groupCount ?? 2)),
          teamsPerGroup: Math.max(2, Math.floor(options.groupConfiguration?.teamsPerGroup ?? 4))
        }
      : undefined;

  return {
    id: createId("tournament"),
    name: name.trim() || "Weekend League",
    createdAt: Date.now(),
    format,
    ...(groupConfiguration
      ? {
          groupConfiguration,
          groups: createGroups(groupConfiguration.groupCount)
        }
      : {}),
    fixtureType: "single",
    fixturesGenerated: false,
    teams: [],
    matches: [],
    scorers: []
  };
}

export function createTeam(
  name: string,
  index: number,
  colors?: { primaryColor: string; secondaryColor: string }
): Team {
  return normalizeTeamColors({
    id: createId("team"),
    name: name.trim(),
    badge: badges[index % badges.length],
    ...colors
  }, index);
}

export function generateFixtures(teams: Team[], fixtureType: FixtureType = "single"): Match[] {
  const entrants = teams.length % 2 === 0 ? [...teams] : [...teams, { id: "bye", name: "Bye", badge: "" }];
  const rounds = entrants.length - 1;
  const half = entrants.length / 2;
  const rotation = [...entrants];
  const matches: Match[] = [];

  for (let round = 1; round <= rounds; round += 1) {
    for (let index = 0; index < half; index += 1) {
      const home = rotation[index];
      const away = rotation[rotation.length - 1 - index];

      if (home.id !== "bye" && away.id !== "bye") {
        const shouldFlip = round % 2 === 0;
        matches.push({
          id: createId("match"),
          round,
          homeTeamId: shouldFlip ? away.id : home.id,
          awayTeamId: shouldFlip ? home.id : away.id,
          homeScore: null,
          awayScore: null
        });
      }
    }

    rotation.splice(1, 0, rotation.pop() as Team);
  }

  if (fixtureType === "homeAway") {
    const secondLeg = matches.map((match) => ({
      ...match,
      id: createId("match"),
      round: match.round + rounds,
      homeTeamId: match.awayTeamId,
      awayTeamId: match.homeTeamId,
      homeScore: null,
      awayScore: null
    }));

    return [...matches, ...secondLeg];
  }

  return matches;
}

export function generateGroupFixtures(
  teams: Team[],
  groups: Group[],
  fixtureType: FixtureType = "single"
): Match[] {
  const teamsById = new Map(teams.map((team) => [team.id, team]));

  return groups.flatMap((group) => {
    const groupTeams = group.teamIds
      .map((teamId) => teamsById.get(teamId))
      .filter((team): team is Team => Boolean(team));

    return generateFixtures(groupTeams, fixtureType).map((match) => ({
      ...match,
      groupId: group.id
    }));
  });
}

export function calculateStandings(teams: Team[], matches: Match[]): StandingRow[] {
  const table = new Map<string, StandingRow>();

  teams.forEach((team) => {
    table.set(team.id, {
      team,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0
    });
  });

  matches.forEach((match) => {
    if (match.homeScore === null || match.awayScore === null) {
      return;
    }

    const home = table.get(match.homeTeamId);
    const away = table.get(match.awayTeamId);

    if (!home || !away) {
      return;
    }

    home.played += 1;
    away.played += 1;
    home.goalsFor += match.homeScore;
    home.goalsAgainst += match.awayScore;
    away.goalsFor += match.awayScore;
    away.goalsAgainst += match.homeScore;

    if (match.homeScore > match.awayScore) {
      home.won += 1;
      away.lost += 1;
      home.points += 3;
    } else if (match.homeScore < match.awayScore) {
      away.won += 1;
      home.lost += 1;
      away.points += 3;
    } else {
      home.drawn += 1;
      away.drawn += 1;
      home.points += 1;
      away.points += 1;
    }

    home.goalDifference = home.goalsFor - home.goalsAgainst;
    away.goalDifference = away.goalsFor - away.goalsAgainst;
  });

  return [...table.values()].sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.won !== a.won) return b.won - a.won;
    return a.team.name.localeCompare(b.team.name);
  });
}

export function sortScorers(scorers: Scorer[]) {
  return [...scorers].sort((a, b) => {
    if (b.goals !== a.goals) return b.goals - a.goals;
    return a.player.localeCompare(b.player);
  });
}
