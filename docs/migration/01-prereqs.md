# Migration Prereqs (quick checks)

Goal: ensure the environment and repo are ready for a migration that generators and agents can run.

Checklist (agent actionable):

- Node 20+ installed. Verify with `node -v` (expect v20.x or newer).
- Git initialized and on a feature branch. Verify with `git status --porcelain` and `git rev-parse --abbrev-ref HEAD`.
- You have a concept bundle available locally (e.g., `copilot-rocket-concept-bundle/`) containing `docs_base/` and `bin/generate-runtime.mjs`.
- Project has a `package.json` with `generate` and `verify` npm scripts (if not, generator scripts can be added).

Agent commands to run (copyable):

```bash
# check node
node -v
# check branch
git status -sb
git rev-parse --abbrev-ref HEAD
```

Acceptance criteria (automated):

- `node -v` reports 20.x or higher.
- Current branch is not `main` or `master`.
- `copilot-rocket-concept-bundle/docs_base` exists relative to workspace or concept bundle copied into place.

If a check fails: report the failing check and the exact command(s) to remedy (example: `git checkout -b feat/migrate-docs-runtime`).
