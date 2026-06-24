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
  createGroups,
  createTournament,
  requiredTeamCount,
  tournamentFormat
} = leagueModule.exports;

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
