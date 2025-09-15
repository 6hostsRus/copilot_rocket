## Copilot agent instructions — copilot-rocket

Purpose: give an AI coding agent the minimal, concrete knowledge to be productive in this repository.

- Start from the repo root. Always echo `pwd` and `git status -sb` before making edits.
- Use rooted commands (don't run editors or write outside the repo unless told). See `README.md` and the Triad rules in `docs_library/README.md`.

Key commands

- Preview generation (dry-run, JSON):
  - `node bin/generate-copilot-bundle.mjs --config=docs_library/registries/runtime.yaml --dry-run --json`
  - Use `--repo-root` and `--snippetRoots` when running in CI.
- Generate actual `.github/*` files (writes files):
  - `node bin/generate-copilot-bundle.mjs --config=docs_library/registries/runtime.yaml`
- Validate work ledger / registries:
  - `node scripts/validate.js` (supports `--work-schema`, `--work-files`)
- Quick repo checks used by agents:
  - `npm run format` (pre-check), `npm run lint`, `npm run validate`, `npm run verify`

Important files and patterns

- Snippets source: `docs_library/snippets/copilot/**` — this is the single source of truth. Do not edit `.github/*` directly.
- Registry/config: `docs_library/registries/runtime.yaml` drives what gets written to `.github` by the bundler.
- Bundle code: `bin/generate-copilot-bundle.mjs` — reads snippet bodies, renders Mustache variables (vars come from `cfg.vars` and `docs_library/variables/defaults.yaml`), injects YAML front-matter when `item.meta` is present, and writes `.github` files.
- Front-matter required for snippets: see `docs_library/README.md` (fields: `id`, `title`, `kind`, `category`, `summary`, `tags`, `weight`, `requires`, `provides`, `vars`, `applyTo`, `version`). When adding metadata, follow dotted id conventions (e.g., `copilot.prompts.test_scaffold`).
- Work Ledger and Task Cards: `WORK_LEDGER.md` and `docs/ai` templates. Follow the Triad: Scope Card → Rooted Command → Work Ledger. See examples in `docs_library/README.md`.

How to modify snippets safely

- Edit only files under `docs_library/snippets/copilot/**`.
- When adding front-matter, include `id`, `title`, `kind`, `category`, and `summary`. Keep `tags: []`, `weight: 20`, `requires: []`, `provides: []`, `vars: []`, `applyTo: []`, `version: 1.0.0` unless the snippet requires other fields.
- Run the bundler in dry-run first and inspect `--json` output to see which `.github` paths will be updated.

Conventions specific to this repo

- Templates are Mustache; variables come from `cfg.vars` merged with `docs_library/variables/defaults.yaml`.
- Banner: generated files start with: `<!-- GENERATED from docs_library; DO NOT EDIT IN .github -->` — do not remove it.
- Rooted commands and paths: examples and scripts assume working from repo root. Use `--repo-root` in CI contexts.
- Validation: prefer `scripts/validate.js` for ledger/registry checks rather than re-implementing schema validation.

Examples (copy-paste for quick starts)

- Preview generated files (dry-run JSON):
  - `node bin/generate-copilot-bundle.mjs --dry-run --json --config=docs_library/registries/runtime.yaml`
- Add a Task Card to `WORK_LEDGER.md` and run the bundle preview to show intended `.github` changes.

Agent workflow checklist (short)

1. Read the Scope Card (if present) and the top `WORK_LEDGER.md` entry.
2. Echo `pwd` and `git status -sb`.
3. Propose a minimal plan: files to change, commands to run, acceptance criteria from the Scope Card.
4. Run `node scripts/validate.js` if you edit ledger/registry files.
5. Run bundler dry-run and show the JSON output.
6. Make focused edits to `docs_library/snippets/copilot/**`, run dry-run again, and include the delta in the session report.

If anything is unclear, ask one targeted question about which Scope Card or ledger entry the change should reference.

Relevant paths to inspect quickly

- `README.md`, `docs_library/README.md`
- `package.json` (scripts: `generate-copilot-bundle`, `validate`, `verify`)
- `bin/generate-copilot-bundle.mjs`
- `docs_library/snippets/copilot/**`
- `docs_library/registries/runtime.yaml`
- `docs_library/variables/defaults.yaml`

End.
