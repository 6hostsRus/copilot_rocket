# Migrate to “Docs as Law → .github as Runtime” (Copilot-first, GPT-5 mini)

> Why this exists (one-liner): move your project to a **self-developing**, **IDE-agnostic** structure where the curated docs library is the _only_ editable source and `.github/` is fully generated. This unlocks predictable AI behavior, fewer token sinks, and clean session/branch loops.

---

## 0) Outcome You Should See

After this guide, you’ll be able to:

- Keep **all prompts/instructions/chat flows** in `docs_base/*` as your **single source of truth**.
- Generate and verify `.github/*` with:
  ```bash
  npm run generate   # builds .github from docs_base
  npm run verify     # regenerates + (optionally) drift check
  ```
- Run a **Copilot-first loop** with GPT-5 mini that:
  1. starts from **Task Cards**,
  2. writes code with **AI file headers**,
  3. closes by **updating the Work Ledger + Changelog**, and
  4. suggests the **next session**.

---

## 1) Migration Prereqs (5–10 min)

- Node 20+, git initialized.
- Your original project is on a branch (e.g., `feat/migrate-docs-runtime`).
- You’ve unzipped the **concept bundle** into a temp folder to copy from (it contains `docs_base/`, `/bin/generate-runtime.mjs`, etc.). Currently unzipped in `/copilot-rocket-concept-bundle`

---

## 2) Inventory Your Current Project

Make a quick inventory—this tells you what moves into `docs_base/`:

- **Prompts** (ad-hoc `.md` files, Copilot snippets)
<!-- MIGRATION INDEX -->

# Migration: Docs-as-Law → .github as Runtime (index)

This repository's long migration guide has been split into small, ordered, agent-friendly steps under `docs/migration/`.

Read these in order (each file is atomic and ends with acceptance criteria):

- `docs/migration/00-overview.md` — short outcome and quick start.
- `docs/migration/01-prereqs.md` — environment checks and agent commands.
- `docs/migration/02-inventory.md` — how to discover and convert prompts/instructions/chatmodes.
- `docs/migration/03-structure.md` — runtime registry shape and validation checks.
- `docs/migration/04-generate.md` — generator runbook and acceptance criteria.
- `docs/migration/05-ci.md` — concise CI drift-check workflow.
- `docs/migration/06-task-cards.md` — Task Card templates and session loop.
- `docs/migration/07-examples.md` — prompt examples, ai:module headers, and Task Card examples.
