export type Team = {
  id: string;
  name: string;
  badge: string;
};

export type Match = {
  id: string;
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

export type Tournament = {
  id: string;
  name: string;
  createdAt: number;
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
