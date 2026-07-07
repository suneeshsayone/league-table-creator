export type Team = {
  id: string;
  name: string;
  badge: string;
  primaryColor?: string;
  secondaryColor?: string;
  gradient?: string;
};

export type Match = {
  id: string;
  groupId?: string;
  round: number;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
};

export type Scorer = {
  id: string;
  player: string;
  teamId: string;
  goals: number;
};

export type FixtureType = "single" | "homeAway";

export type TournamentFormat = "league" | "groupStage";

export type Group = {
  id: string;
  label: string;
  teamIds: string[];
};

export type GroupConfiguration = {
  groupCount: number;
  teamsPerGroup: number;
};

export type Tournament = {
  id: string;
  name: string;
  createdAt: number;
  format?: TournamentFormat;
  groupConfiguration?: GroupConfiguration;
  groups?: Group[];
  fixtureType?: FixtureType;
  fixturesGenerated?: boolean;
  teams: Team[];
  matches: Match[];
  scorers: Scorer[];
};

export type StandingRow = {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};
