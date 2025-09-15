# Migration: Docs as Law → .github as Runtime — Overview

Purpose: concise orientation for an agent or developer to migrate a repository so that `docs_base/` is the single source of truth and `.github/` is generated.

Outcome (agent-friendly):

- All prompts/instructions/chat flows live under `docs_base/`.
- A runtime registry (`docs_base/registries/runtime.yaml`) maps sources → `.github` targets.
- Generator scripts write `.github/*` with a machine banner and `.github/registry.json`.
- CI verifies no drift between generated runtime and committed `.github/`.

When to use: run this when you want predictable AI editing, smaller prompts, and a single place to update agent behavior.

Quick start (agent-friendly steps):

1. Ensure Node 20+ and git are available.
2. Copy the concept bundle's `docs_base/` and `bin/` into repo root.
3. Populate `docs_base/snippets/*` with prompts/instructions/chatmodes (each file must include front-matter with `id` and `kind`).
4. Add mappings in `docs_base/registries/runtime.yaml`.
5. Run `npm run generate` and inspect `.github/`.
6. Commit generated `.github/` and add a CI verify workflow.

Files created by this migration (examples):

- `docs_base/snippets/prompts/*.md`
- `docs_base/snippets/instructions/*.md`
- `docs_base/registries/runtime.yaml`
- `bin/generate-runtime.mjs` (generator)
- `.github/registry.json` (generated index)

Notes for agents: prefer short outputs; use explicit paths; echo `pwd` and `git status -sb` before edits.
