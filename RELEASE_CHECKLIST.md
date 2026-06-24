# Public Release Checklist

Use this checklist before making the GitHub repository public.

## Security

- [ ] Confirm `.env.local` is not staged or uploaded.
- [ ] Confirm no real secrets exist in source, docs, issues, screenshots, or commit messages.
- [ ] Run a git history secret scan after initializing or reconnecting the repository.
- [ ] Rotate Firebase credentials if any environment file was ever committed, shared, or uploaded.
- [ ] Restrict Firebase API key usage where possible.
- [ ] Configure Firebase Authentication authorized domains.
- [ ] Review Firestore security rules for least-privilege access.

## Repository Contents

- [ ] Confirm `node_modules/`, `.next/`, `.code-review-graph/`, and local tool configs are not committed.
- [ ] Confirm local MCP/editor files are ignored unless intentionally sanitized for public use.
- [ ] Decide whether to publish AI-agent instruction files such as `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`, and `QODER.md`.
- [ ] Remove or keep ignored backup files such as `.gemini/settings.json.bak` locally.
- [ ] Confirm `package-lock.json` is committed for reproducible installs.

## Environment and Firebase

- [ ] Copy `.env.example` to `.env.local` and verify local setup instructions work.
- [ ] Confirm all deployment environment variables are configured in the hosting provider.
- [ ] Verify the app behaves correctly with Firebase configured.
- [ ] Verify the app behaves correctly in local demo mode when Firebase variables are absent.

## Quality

- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Add tests for `src/lib/league.ts`.
- [ ] Add a test or manual QA note for duplicate top-scorer handling.
- [ ] Review unused service modules and decide whether to keep or remove them.

## Documentation and Legal

- [ ] Review `README.md` for project-specific deployment details.
- [ ] Confirm MIT is the intended license.
- [ ] Update copyright owner in `LICENSE` if a specific person or organization should be listed.
- [ ] Add contribution or security policy docs if accepting outside contributions.

## Publish

- [ ] Initialize or reconnect git.
- [ ] Review `git status --ignored` before the first commit.
- [ ] Commit only publishable files.
- [ ] Push to a private GitHub repository first.
- [ ] Re-run secret scanning in GitHub or CI.
- [ ] Make the repository public only after all blockers are resolved.
