# Public GitHub Publication Audit

Audit date: 2026-06-18

## Scope

This audit reviewed the local project for public GitHub readiness, including secrets, environment configuration, ignore rules, repository hygiene, documentation, license status, code quality, and git history availability.

## Security Review

### Findings

1. Local Firebase configuration exists in `.env.local`.
   - Status: Not safe to publish.
   - Exposure risk: Contains Firebase web app configuration values, including a browser API key and project identifiers.
   - Current mitigation: `.env.local` is ignored by `.gitignore`.
   - Recommended fix: Do not commit or upload `.env.local`. Before publishing, review Firebase API key restrictions, authorized domains, Authentication providers, and Firestore rules. Rotate the Firebase web API key if this local file has ever been committed, uploaded, shared, or pasted elsewhere.

2. Machine-specific MCP/editor/AI tool configuration exists in local dotfolders.
   - Affected examples: `.mcp.json`, `.opencode.json`, `.cursor/`, `.vscode/`, `.claude/settings.json`, `.gemini/settings.json`, `.gemini/hooks/`, `.qoder/`.
   - Status: Not suitable for a public repository as-is.
   - Exposure risk: Absolute local paths and machine-specific commands reveal local workspace and runtime details.
   - Current mitigation: Added ignore rules for machine-specific config.
   - Recommended fix: Keep shared instructions such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `.github/code-review-graph.instruction.md` only if they are intentionally part of the public developer workflow. Do not publish local settings files.

3. No private keys, certificates, server-side passwords, database connection strings, GitHub tokens, Slack tokens, or OpenAI keys were found in source files during pattern scanning.
   - Status: No source-code secret found.
   - Caveat: Pattern scanning cannot prove absence of every possible secret. Review files manually before the first public push.

4. Firebase web app config is client-visible by design.
   - Status: Acceptable if Firebase is properly secured.
   - Recommended fix: Use Firebase rules and domain/key restrictions. Treat security rules, not config obscurity, as the protection boundary.

## Git Ignore Validation

Updated `.gitignore` to cover:

- Dependencies: `node_modules/`
- Next.js/build output: `.next/`, `out/`, `dist/`, `build/`
- Coverage and TypeScript cache: `coverage/`, `*.tsbuildinfo`
- Environment files: `.env`, `.env.*`, with `.env.example` explicitly allowed
- Logs: `logs/`, `*.log`, package-manager debug logs
- OS/editor noise: `.DS_Store`, `Thumbs.db`, `Desktop.ini`, `.vscode/`, `.idea/`, swap files
- Local AI/MCP state: `.code-review-graph/`, `.mcp.json`, `.opencode.json`, local `.cursor/`, `.qoder/`, and machine-specific Claude/Gemini settings/hooks
- Local databases and temp folders: `*.sqlite`, `*.sqlite3`, `*.db`, `tmp/`, `temp/`

If any ignored files were already tracked in a future git repository, remove them from the index with `git rm --cached <path>` after confirming they are not needed publicly.

## Environment Configuration

Updated `.env.example` to include every Firebase environment variable used by the app:

- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`
- `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

Application configuration is currently environment-driven through `src/lib/firebase.js`.

## Repository Cleanup Review

### Keep

- `package-lock.json`: Commit this for reproducible npm installs.
- Shared project instructions: `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, `QODER.md`, `.cursorrules`, `.windsurfrules`, `.github/code-review-graph.instruction.md` can be kept if you want public AI-agent guidance.

### Ignore or do not publish

- `.env.local`: Contains local Firebase values.
- `.next/`: Generated Next.js build output.
- `node_modules/`: Dependency install folder.
- `.code-review-graph/`: Generated graph cache.
- `.mcp.json`, `.opencode.json`, `.cursor/`, `.vscode/`, `.claude/settings.json`, `.gemini/settings.json`, `.gemini/hooks/`, `.qoder/`: Local machine/tool configuration.
- `.gemini/settings.json.bak`: Backup file; delete locally or keep ignored.

### Large files

No unexpectedly large application files were found outside standard dependencies/build output. The largest publishable file is `package-lock.json`, which is expected.

## Documentation

README was expanded to include:

- Project overview
- Feature list
- Prerequisites
- Installation
- Environment setup
- Firebase setup
- Local development
- Quality checks
- Deployment guidance
- Technology stack
- License information

## License

No license file existed. An MIT license was added and `package.json` now declares `"license": "MIT"`.

MIT is a good default for a small public app when you want permissive reuse with attribution and warranty disclaimers.

## Git History Review

Git history could not be reviewed because this local directory currently has no `.git` directory.

Recommended action before making a public repository:

1. If this project previously lived in a git repository, run a history scan before pushing:

   ```bash
   git log --all -- .env.local
   git log --all -S "NEXT_PUBLIC_FIREBASE_API_KEY"
   git log --all -S "<known Firebase API key prefix or value>"
   ```

2. Use a dedicated secret scanner such as Gitleaks or TruffleHog before publishing.
3. If secrets were ever committed, rotate affected credentials and rewrite history before making the repository public.

## Code Quality Review

### Findings

- `src/app/page.tsx` contains a large `Home` component. The graph reports it as the largest hotspot and it owns many workflows.
- No test suite is present. Critical logic such as fixture generation, standings calculation, scorer updates, and Firebase sync would benefit from automated tests.
- Several service modules appear unused by the current UI according to graph analysis:
  - `src/services/fixtureService.js`
  - `src/services/standingService.js`
  - `src/services/teamService.js`
  - `src/services/topScorerService.js`
- Intentional `console.error` calls exist in error paths. These are acceptable for development but may be replaced by structured reporting in production.
- No `TODO`, `FIXME`, `debugger`, or broad debug statements were found in app source.

### Recommended improvements

1. Add unit tests for `src/lib/league.ts`.
2. Add focused component or integration tests for top scorer duplicate handling.
3. Split `src/app/page.tsx` into smaller components once public release basics are complete.
4. Decide whether unused service modules are future API surfaces or obsolete code. Remove only after confirming they are not needed.
5. Add Firestore security rules documentation or a sample rules file before deploying publicly.

## Verification Performed

- `npm.cmd run lint`: Passed.
- `npm.cmd run build`: Passed.
- Secret/pattern scan: Completed with findings listed above.
- Large file scan: Completed.
- Graph quality scan: Completed.

## Final Readiness Assessment

Readiness score: 8/10.

The codebase is close to public-repository ready after the documentation, ignore, environment template, and license updates. Remaining blockers are manual: confirm no historical secret exposure, keep `.env.local` and local MCP/editor files out of the first commit, and verify Firebase production security settings.

## Files Modified

- `.gitignore`
- `.env.example`
- `README.md`
- `package.json`

## Files Created

- `LICENSE`
- `PUBLICATION_AUDIT.md`
- `RELEASE_CHECKLIST.md`

## Remaining Manual Actions

- Do not include `.env.local` in the public repository.
- Rotate/restrict Firebase credentials if they were ever shared or committed.
- Review Firebase Authentication providers, authorized domains, and Firestore security rules.
- Run git history secret scanning once a `.git` repository is available.
- Decide whether public AI-agent instruction files should remain in the repository.
