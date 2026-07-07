const assert = require("node:assert/strict");
const fs = require("node:fs");
const Module = require("node:module");
const path = require("node:path");
const test = require("node:test");
const ts = require("typescript");

const sourcePath = path.join(__dirname, "..", "src", "lib", "league.ts");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2020
  },
  fileName: sourcePath
}).outputText;

const leagueModule = new Module(sourcePath, module);
leagueModule.filename = sourcePath;
leagueModule.paths = module.paths;
leagueModule._compile(compiled, sourcePath);

const {
  createTeam,
  createTeamGradient,
  createGroups,
  createTournament,
  generateGroupFixtures,
  groupAssignmentStatus,
  moveTeamToGroup,
  randomizeGroupAssignments,
  requiredTeamCount,
  swapGroupTeams,
  tournamentFormat
} = leagueModule.exports;

test("Teams store a two-color gradient and legacy teams receive stable defaults", () => {
  const team = createTeam("Comets", 0, {
    primaryColor: "#112233",
    secondaryColor: "#aabbcc"
  });

  assert.equal(team.primaryColor, "#112233");
  assert.equal(team.secondaryColor, "#aabbcc");
  assert.equal(team.gradient, createTeamGradient("#112233", "#aabbcc"));
});

test("Group fixtures are generated independently without cross-group matches", () => {
  const teams = Array.from({ length: 8 }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `Team ${index + 1}`,
    badge: "FC"
  }));
  const groups = [
    { id: "group-a", label: "Group A", teamIds: teams.slice(0, 4).map((team) => team.id) },
    { id: "group-b", label: "Group B", teamIds: teams.slice(4).map((team) => team.id) }
  ];

  const matches = generateGroupFixtures(teams, groups, "single");

  assert.equal(matches.length, 12);
  for (const match of matches) {
    const group = groups.find((item) => item.id === match.groupId);
    assert.ok(group);
    assert.ok(group.teamIds.includes(match.homeTeamId));
    assert.ok(group.teamIds.includes(match.awayTeamId));
  }
});

test("Group fixtures preserve the selected home-and-away setting", () => {
  const teams = Array.from({ length: 4 }, (_, index) => ({
    id: `team-${index + 1}`,
    name: `Team ${index + 1}`,
    badge: "FC"
  }));
  const groups = [{ id: "group-a", label: "Group A", teamIds: teams.map((team) => team.id) }];

  const matches = generateGroupFixtures(teams, groups, "homeAway");

  assert.equal(matches.length, 12);
  assert.ok(matches.every((match) => match.groupId === "group-a"));
  assert.equal(Math.max(...matches.map((match) => match.round)), 6);
});

test("League remains the default without Group Stage fields", () => {
  const tournament = createTournament("Legacy League");

  assert.equal(tournamentFormat(tournament), "league");
  assert.equal(tournament.format, "league");
  assert.equal("groupConfiguration" in tournament, false);
  assert.equal("groups" in tournament, false);
});

test("Group Stage creation stores exact capacity and stable empty groups", () => {
  const tournament = createTournament("World Cup", {
    format: "groupStage",
    groupConfiguration: {
      groupCount: 4,
      teamsPerGroup: 4
    }
  });

  assert.equal(tournamentFormat(tournament), "groupStage");
  assert.equal(requiredTeamCount(tournament.groupConfiguration), 16);
  assert.deepEqual(
    tournament.groups.map((group) => group.label),
    ["Group A", "Group B", "Group C", "Group D"]
  );
  assert.ok(tournament.groups.every((group) => group.teamIds.length === 0));
  assert.equal(new Set(tournament.groups.map((group) => group.id)).size, 4);
});

test("Group labels remain deterministic beyond Group Z", () => {
  const groups = createGroups(28);

  assert.equal(groups[25].label, "Group Z");
  assert.equal(groups[26].label, "Group AA");
  assert.equal(groups[27].label, "Group AB");
});

test("Assignment status requires every team exactly once and every group full", () => {
  const teams = ["a", "b", "c", "d"].map((id) => ({ id, name: id, badge: id }));
  const groups = [
    { id: "g1", label: "Group A", teamIds: ["a", "b"] },
    { id: "g2", label: "Group B", teamIds: ["c", "d"] }
  ];

  assert.equal(groupAssignmentStatus(teams, groups, 2).isComplete, true);
  assert.equal(
    groupAssignmentStatus(teams, [{ ...groups[0], teamIds: ["a", "b", "c"] }, groups[1]], 2)
      .isComplete,
    false
  );
});

test("Moves enforce capacity and preserve reorder operations", () => {
  const groups = [
    { id: "g1", label: "Group A", teamIds: ["a", "b"] },
    { id: "g2", label: "Group B", teamIds: ["c"] }
  ];

  assert.match(moveTeamToGroup(groups, "c", "g1", 2, 2).error, /full/i);
  assert.deepEqual(moveTeamToGroup(groups, "b", "g1", 0, 2).groups[0].teamIds, ["b", "a"]);
});

test("Swap supports full groups and unassigned incoming teams", () => {
  const groups = [
    { id: "g1", label: "Group A", teamIds: ["a", "b"] },
    { id: "g2", label: "Group B", teamIds: ["c", "d"] }
  ];

  assert.deepEqual(swapGroupTeams(groups, "a", "c").groups, [
    { ...groups[0], teamIds: ["c", "b"] },
    { ...groups[1], teamIds: ["a", "d"] }
  ]);
  assert.deepEqual(swapGroupTeams(groups, "e", "c").groups[1].teamIds, ["e", "d"]);
});

test("Random assignment fills exact group capacity without duplicates", () => {
  const teams = ["a", "b", "c", "d"].map((id) => ({ id, name: id, badge: id }));
  const groups = [
    { id: "g1", label: "Group A", teamIds: [] },
    { id: "g2", label: "Group B", teamIds: [] }
  ];
  const result = randomizeGroupAssignments(teams, groups, 2, () => 0.5);
  const assigned = result.groups.flatMap((group) => group.teamIds);

  assert.deepEqual(result.groups.map((group) => group.teamIds.length), [2, 2]);
  assert.deepEqual([...assigned].sort(), ["a", "b", "c", "d"]);
});
