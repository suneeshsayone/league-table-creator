import type { FixtureType, Match, Scorer, StandingRow, Team, Tournament } from "@/types/league";

const badges = ["AFC", "CITY", "UTD", "FC", "SC", "XI", "ATH", "ROV"];

export function createId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createTournament(name: string): Tournament {
  return {
    id: createId("tournament"),
    name: name.trim() || "Weekend League",
    createdAt: Date.now(),
    fixtureType: "single",
    fixturesGenerated: false,
    teams: [],
    matches: [],
    scorers: []
  };
}

export function createTeam(name: string, index: number): Team {
  return {
    id: createId("team"),
    name: name.trim(),
    badge: badges[index % badges.length]
  };
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
