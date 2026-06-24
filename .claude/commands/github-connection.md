# Skill: madcrow-commit-and-push

Full Git flow for the **madcrow-backend** project — feature branch → pre-commit hooks → commit → pre-push hooks → push → PR into main.

> **PRODUCTION PROJECT** — Every commit and push goes to live infrastructure.
> Be deliberate. Fix issues before they reach main. Never break working flows.

---

## Repository details

- Remote: https://github.com/sayone-tech/madcrow-backend
- Default branch: `main` (protected — never commit directly)
- Auth: SSH key or HTTPS via `gh` CLI — run `gh auth login` if not authenticated
- PR tool: `gh` CLI
- Package manager: **`uv`** — `pyproject.toml` + `uv.lock` are the source of truth
- Runtime: Python 3.12, FastAPI, SQLModel, PostgreSQL, Redis, Qdrant, Celery

---

## Environment setup (one-time, or after a fresh clone)

All dev tooling — pre-commit, bandit, pip-audit, ruff, mypy, pytest — lives in the `dev` dependency group. This group is **not** in `default-groups`, so a plain `uv sync` will NOT install it.

```bash
# Install ALL groups including dev (required to run pre-commit hooks and tests)
uv sync --dev

# Install only production + api/ai/db groups (skip dev tools — CI build, production image)
uv sync

# Install and wire git hooks into .git/hooks/
uv run pre-commit install
uv run pre-commit install --hook-type pre-push
```

The difference matters:

| Command         | Installs dev group? | Pre-commit works? | Tests work? |
| --------------- | ------------------- | ----------------- | ----------- |
| `uv sync`       | No                  | No                | No          |
| `uv sync --dev` | Yes                 | Yes               | Yes         |

If pre-commit reports `` `pre-commit` not found ``, the fix is always `uv sync --dev`.

---

## Hook architecture — two separate stages

### Pre-commit (runs automatically on every `git commit`)

Fast, largely auto-fixable checks. Most failures self-heal by re-staging and retrying the commit.

| Hook                       | What it does                                                   | Auto-fixes?             |
| -------------------------- | -------------------------------------------------------------- | ----------------------- |
| `check-ast`                | Catches Python syntax errors                                   | No — fix source         |
| `check-merge-conflict`     | Rejects files with `<<<<<<<` markers                           | No — resolve conflict   |
| `check-added-large-files`  | Blocks large file commits                                      | No — remove the file    |
| `check-json/toml/yaml/xml` | Validates config syntax                                        | No — fix the file       |
| `check-case-conflict`      | Detects filename case collisions                               | No                      |
| `check-symlinks`           | Detects broken symlinks                                        | No                      |
| `trailing-whitespace`      | Strips trailing spaces                                         | **Yes**                 |
| `end-of-file-fixer`        | Ensures single newline at EOF                                  | **Yes**                 |
| `mixed-line-ending`        | Normalises CRLF/LF                                             | **Yes**                 |
| `fix-byte-order-marker`    | Removes BOM                                                    | **Yes**                 |
| `autoflake`                | Removes unused imports in-place                                | **Yes**                 |
| `pyupgrade`                | Upgrades syntax to Python 3.10+ style                          | **Yes**                 |
| `ruff`                     | Lints and auto-fixes style issues                              | **Yes**                 |
| `ruff-format`              | Formats code (Black-compatible)                                | **Yes**                 |
| `isort`                    | Sorts imports (Black-compatible profile)                       | **Yes**                 |
| `detect-secrets`           | Blocks secrets/credentials from being committed                | No — remove the secret  |
| `hadolint-docker`          | Lints Dockerfile                                               | No — fix the Dockerfile |
| `prettier`                 | Formats YAML, Markdown, JSON (excludes `.vscode/`, `.github/`) | **Yes**                 |

When an auto-fix hook changes a file, the commit is aborted with an exit code. The correct response:

```bash
# Re-stage the auto-fixed files (exactly what you staged before)
git add <same files>
# Retry the commit — it will pass this time
git commit -m "..."
```

### Pre-push (runs automatically on every `git push`)

Heavier security and quality gates. These run **against `src/` only** (excluding `tests/`, `alembic/`).
A failure here means the push is blocked until the underlying code is fixed — never use `--no-verify`.

| Hook        | Scope    | What it does                                                                  |
| ----------- | -------- | ----------------------------------------------------------------------------- |
| `bandit`    | `src/`   | Static security analysis; skips B101 (assert), B601 (paramiko)                |
| `flake8`    | `src/`   | Style + anti-pattern checks (bugbear, comprehensions, simplify); max-line 100 |
| `pip-audit` | all deps | Scans every installed package for known CVEs                                  |

### Manual-only — mypy

```bash
# Run type checking manually (never triggered automatically)
uv run pre-commit run mypy --hook-stage manual
```

Run when you've added or changed type annotations, introduced new classes under `src/`, or after a dependency upgrade that affects stubs.

---

## Available scripts

These wrap the hooks for ad-hoc use — run them when you want a check outside of the commit/push cycle:

```bash
# Ruff format + lint + pip-audit (dev workflow check)
make lint

# Bandit only (security scan on src/)
make bandit

# Install hooks + run all pre-commit hooks on every file in the repo
bash scripts/pre-commit.sh

# Start dev server (uvicorn on port 8000, hot-reload)
make run
```

---

## Running tests

Tests require `uv sync --dev`. The project has layered test suites:

```bash
# Run all unit tests (fast, SQLite in-memory, no external services needed)
uv run pytest tests/unit/ -v

# Run API tests
uv run pytest tests/api/ -v

# Run integration tests (requires live DB + Redis — see docker-compose)
uv run pytest tests/integration/ -v

# Run the full suite with coverage
uv run pytest --cov=src --cov-report=term-missing

# Run security-specific tests
uv run pytest tests/security/ -v

# Run core test selection (project helper script)
uv run python tests/run_core_tests.py
```

Start local services (DB, Redis, Qdrant) before running integration or API tests:

```bash
docker compose up db redis qdrant -d
```

For full local dev with hot-reload:

```bash
docker compose up        # or: docker compose watch
```

---

## Pre-commit impact review (use code-review-graph before committing)

Before committing, use the knowledge graph to understand what you're touching. This tells you what to flag for manual testing.

In Claude Code (via MCP tools):

```
detect_changes          → risk-scored list of every changed node
get_impact_radius       → which modules/endpoints are downstream
get_affected_flows      → which execution paths are touched
query_graph callers_of  → who calls the function you changed
```

Or from the shell:

```bash
code-review-graph detect-changes --brief
```

**If any of these critical paths are in the impact radius, flag them to the user for manual verification before pushing:**

| Affected area                     | What to verify manually                                      |
| --------------------------------- | ------------------------------------------------------------ |
| `src/routes/v1/auth.py`           | Login, token refresh, registration end-to-end                |
| `src/routes/v1/payments.py`       | Razorpay payment initiation and response handling            |
| `src/routes/v1/webhooks.py`       | Webhook signature validation, replay protection              |
| `src/routes/v1/subscriptions.py`  | Plan creation, upgrade, cancellation                         |
| `src/tasks/subscription_tasks.py` | Celery task enqueues and completes without error             |
| `src/routes/v1/shopify.py`        | Shopify store connect/disconnect                             |
| `src/routes/v1/whatsapp.py`       | WhatsApp config save and message routing                     |
| `src/routes/v1/rag_routes.py`     | Crawl → index → query roundtrip                              |
| `src/entities/` (any model)       | Verify dependent services and routes still behave correctly  |
| `src/services/` (shared service)  | All callers still behave correctly                           |
| `src/middleware/`                 | Requests still pass through; no broken headers or auth loops |

If breaking changes are found: **stop and tell the user** which flows to test manually before the push goes to production.

---

## Package management — uv

Never use `pip install` directly. All dependency changes go through `uv`.

### Adding a dependency

```bash
# Production dependency (goes into [project].dependencies)
uv add <package-name>

# With version constraint
uv add "<package-name>>=1.2.0,<2.0"

# Dev-only (goes into [dependency-groups.dev])
uv add --group dev <package-name>

# Specific named group
uv add --group api <package-name>
```

`pyproject.toml` and `uv.lock` are updated automatically. **Both must be committed together.**

### Fixing a vulnerable dependency

```bash
# Upgrade to a known-safe version
uv add "<package-name>>=<safe-version>"

# Stage both files
git add pyproject.toml uv.lock
```

If no fixed version exists yet, add the CVE to the `pip-audit` ignore list in `.pre-commit-config.yaml` with a TODO comment explaining why:

```yaml
"--ignore-vuln",
"CVE-XXXX-XXXXX", # <package> - TODO: upgrade to X.X.X once released
```

### Syncing after pulling main

```bash
uv sync --dev    # always use --dev so hook tools stay installed
```

Never manually edit `uv.lock`. Let `uv` regenerate it.

---

## Branch naming convention

Format: `<type>/<short-description>`

| Type        | When to use                                  |
| ----------- | -------------------------------------------- |
| `feat/`     | New feature or capability                    |
| `fix/`      | Bug fix                                      |
| `chore/`    | Setup, config, scaffolding, dependency bumps |
| `docs/`     | Documentation changes                        |
| `refactor/` | Code restructure with no behaviour change    |
| `test/`     | Tests only                                   |
| `security/` | Vulnerability fixes, CVE dependency upgrades |

Rules:

- Lowercase and hyphens only — no spaces, underscores, or CamelCase
- 3–5 words max
- One feature per branch — never mix unrelated changes
- Each feature gets its own PR — **no squash**; each PR merges as a merge commit

---

## Full workflow — step by step

### Step 0 — Orient: check current state before doing anything

**Always run this first.** Never assume which branch you're on or whether a referenced PR is still open.

```bash
git branch          # what branch am I on?
git status          # is the working tree clean or dirty?
```

**If the user referenced an existing PR number** (e.g. "push to PR #151"), resolve it immediately:

```bash
gh pr view <PR-number> --json state,headRefName
```

Then follow this decision tree:

| Situation                                    | Action                                                |
| -------------------------------------------- | ----------------------------------------------------- |
| On a feature branch + PR is still **open**   | Skip Steps 1 & 2 — continue committing on this branch |
| On a feature branch + PR is **merged**       | Treat as starting fresh — go to Step 1                |
| On `main` + no PR referenced                 | Go to Step 1 → Step 2 as normal                       |
| On `main` + PR referenced and still **open** | `git checkout <branch-name>` then skip to Step 3      |
| On `main` + PR referenced and **merged**     | Go to Step 1 → Step 2 (new branch, new PR)            |

**If working tree is dirty** (uncommitted changes present):

- Changes carry over when switching branches as long as there are no conflicts — verify with `git status` after switching
- Never stash or discard changes without asking the user first

---

### Step 1 — Pull latest main before branching

> Skip this step if Step 0 determined you're already on the correct open feature branch.

```bash
git checkout main
git pull origin main
git log --oneline -10    # confirm you have the latest
```

### Step 2 — Create the feature branch

> Skip this step if Step 0 determined you're already on the correct open feature branch.

```bash
git checkout -b feat/your-branch-name
```

### Step 3 — Do the work, then stage specific files

Never `git add -A` or `git add .` — always name the files:

```bash
git add src/path/to/file1 src/path/to/file2
git status
git diff --staged
```

If you changed `pyproject.toml`, always include `uv.lock`:

```bash
git add pyproject.toml uv.lock
```

### Step 4 — Run impact analysis (before committing)

```bash
code-review-graph detect-changes --brief
```

Or use MCP tools in Claude Code: `detect_changes`, `get_impact_radius`, `get_affected_flows`.

If any critical-path area is affected (auth, billing, webhooks, middleware), list it explicitly and ask the user to verify it manually after the push, before considering the feature complete.

### Step 5 — Commit (pre-commit hooks run automatically)

```bash
git commit -m "$(cat <<'EOF'
<type>(<scope>): <short summary — max 50 chars, imperative mood>

- What changed and why (one bullet per concern)
- Keep each line under 72 chars

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>
EOF
)"
```

**If auto-fix hooks changed files:**

```bash
git add <same files as before>
git commit -m "..."    # retry with same message
```

**If a hook errors (detect-secrets, bandit, hadolint, syntax check):**

1. Read the error — do not skip with `--no-verify`
2. Fix the source file
3. Re-stage and re-commit
4. If the fix would be a breaking change, stop and tell the user before continuing

Commit message examples:

```
feat(rag): add web scraping source with Celery task
fix(razorpay): handle recurring billing edge case on webhook retry
security(deps): upgrade cryptography to 46.0.7 for CVE-2025-XXXXX
chore(pre-commit): update ruff to v0.12.2
```

### Step 6 — Push (pre-push hooks run automatically)

```bash
git push origin feat/your-branch-name
```

Hooks run `bandit`, `flake8`, and `pip-audit` before the push is sent.

**If bandit fails:**

- Fix the flagged security issue in source
- Do not add `# nosec` unless it is a genuine false positive
- If it is a false positive, document why inline: `# nosec B<id>: <reason>`

**If flake8 fails:**

- Fix the flagged line; common genuine false-positive suppression: `# noqa: <code>`

**If pip-audit fails:**

- Upgrade with `uv add "<package>>=<safe-version>"`
- Commit `pyproject.toml` + `uv.lock`, then push again
- If no fix version exists, add the CVE to the ignore list in `.pre-commit-config.yaml` with a TODO comment

**If you rebased and need to force-update the remote feature branch:**

```bash
git push --force-with-lease origin feat/your-branch-name
# Never --force on main
```

### Step 7 — Check for divergence with main before creating PR

```bash
git fetch origin main
git log --oneline origin/main..HEAD    # commits you're adding
git log --oneline HEAD..origin/main    # commits on main you don't have
```

If main has moved ahead:

```bash
git rebase origin/main
# Resolve any conflicts (see conflict section below)
git push --force-with-lease origin feat/your-branch-name
```

### Step 8 — Create the Pull Request

```bash
gh pr create \
  --title "<type>(<scope>): <same as commit summary>" \
  --body "$(cat <<'EOF'
## What does this PR do?
Brief description of the feature or fix.

## Why?
Context and motivation — what problem does this solve?

## Changes
- `path/to/file1`: what changed and why
- `path/to/file2`: what changed and why

## Impact
- Affected flows: list API endpoints, Celery tasks, or critical paths touched
- Manual testing needed: yes/no — if yes, list exactly what to verify

## How to test
Step-by-step instructions to verify the change works.

## Checklist
- [ ] Pre-commit hooks passed
- [ ] Pre-push hooks passed (bandit, flake8, pip-audit)
- [ ] `pyproject.toml` + `uv.lock` committed together (if deps changed)
- [ ] No secrets or `.env` files included
- [ ] No direct commits to main
- [ ] Critical-path impacts flagged and manually tested

🤖 Generated with [Claude Code](https://claude.ai/code)
EOF
)" \
  --base main \
  --head feat/your-branch-name
```

### Step 9 — PR is ready — user merges manually

**Do NOT attempt to merge via `gh pr merge`.** The repository does not allow
programmatic merges — even without explicit branch protection rules, the GitHub
repository settings require a human approval/merge through the UI.

After creating the PR:

1. Return the PR URL to the user
2. Ask them to review and merge it themselves via GitHub
3. Remind them to use **merge commit** (not squash) when merging through the UI

### Step 10 — Sync local main (after user confirms merge)

```bash
git checkout main
git pull origin main
git branch -d feat/your-branch-name    # remove local branch if still present
```

---

## Conflict resolution

### Source code conflicts (during rebase)

```bash
# Open conflicted file — look for <<<<<<, =======, >>>>>>>
# Keep the correct version, remove all conflict markers
git add <resolved-file>
git rebase --continue

# Verify the resolved file passes pre-commit checks
uv run pre-commit run --files <resolved-file>
```

### uv.lock conflicts

Never try to merge `uv.lock` manually. Regenerate it:

```bash
uv sync --dev
git add uv.lock
git rebase --continue
```

---

## Rules — never break these

| Rule                                                       | Why                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------- |
| Never commit directly to `main`                            | main is live production — all changes go through PRs  |
| Never `git push --force` on `main`                         | Destroys shared history for the whole team            |
| Never `git add -A` or `git add .`                          | Risks committing `.env`, secrets, or unintended files |
| Never skip hooks with `--no-verify`                        | Hooks catch security issues before they hit prod      |
| Never squash-merge into main                               | Each feature branch preserves full history — required |
| Always `uv sync --dev` after cloning or rebasing           | Without it, pre-commit tools and tests don't exist    |
| Always commit `pyproject.toml` + `uv.lock` together        | Lock file must stay in sync with declared deps        |
| Always run impact analysis before committing               | Flag critical paths for manual testing before push    |
| Use `--force-with-lease` not `--force` on feature branches | Fails safely if remote changed since last fetch       |
| Always delete branch after merge                           | Keeps the branch list clean                           |

---

## Quick reference — full flow in one block

```bash
# Environment (once per clone, or after pulling major dep changes)
uv sync --dev
uv run pre-commit install && uv run pre-commit install --hook-type pre-push

# Step 0 — orient FIRST (always)
git branch && git status
# If user gave a PR number → gh pr view <num> --json state,headRefName
# → already on open branch? skip the two steps below
# → PR merged or on main? do the two steps below

# Step 1 — pull latest main (skip if already on open feature branch)
git checkout main && git pull origin main

# Step 2 — branch (skip if already on open feature branch)
git checkout -b feat/your-feature-name

# Work, stage specific files (never git add -A)
git add src/path/to/file [pyproject.toml uv.lock]
git diff --staged

# Impact check (before committing)
code-review-graph detect-changes --brief
# → flag critical paths to user for manual testing

# Commit (pre-commit hooks run automatically; re-stage + retry if auto-fixed)
git commit -m "feat(scope): summary"

# Push (pre-push hooks: bandit, flake8, pip-audit)
git push origin feat/your-feature-name
# If hooks fail: fix source, commit fix, push again

# Rebase if main moved ahead
git fetch origin main && git rebase origin/main
git push --force-with-lease origin feat/your-feature-name

# PR (merge commit — no squash)
gh pr create --title "feat(scope): summary" --body "..." --base main
# → Return the PR URL. User merges manually via GitHub UI (do NOT run gh pr merge)

# After user confirms merge — sync main + clean local branch
git checkout main && git pull origin main
git branch -d feat/your-feature-name
```

---

## Manual testing checklist (flag these to user before push goes live)

| Change area                        | What to ask the user to verify                         |
| ---------------------------------- | ------------------------------------------------------ |
| `auth.py`                          | Login, registration, token refresh, session expiry     |
| `payments.py`                      | Razorpay payment initiation, response parsing          |
| `webhooks.py`                      | Webhook signature check, idempotency/replay protection |
| `subscriptions.py`                 | Plan create/upgrade/cancel, billing cycle              |
| `subscription_tasks.py`            | Celery task queues and completes without exception     |
| `shopify.py`                       | Store connect, activity sync                           |
| `whatsapp.py`                      | Config save, inbound message routing                   |
| `rag_routes.py`                    | Crawl URL → index → query returns relevant result      |
| Any `src/entities/`                | Dependent routes and services still respond correctly  |
| Any `src/middleware/`              | Requests still authenticated; no 401/403 regressions   |
| Any `src/services/` (high callers) | All dependent routes still respond correctly           |
