---
id: copilot.repowide.ai_instructions_template
title: AI Instructions Template
kind: repowide
category: repowide
summary: Template for repository-wide AI instructions and agent configuration.
tags: []
weight: 20
requires: []
provides: []
vars: []
applyTo: []
version: 1.0.0
---

# AI Instructions — Template (package copy)

> Path in package: `./docs_library/01-ai_instructions.template.md`  
> When a project is scaffolded with **copilot-rocket**, copy this to the project root as `./ai_instructions.md`.

---

## Objective

Assist on **copilot-rocket** using the **copilot-rocket** workflow. Convert natural-language materials into a consistent doc library under `./docs/`, prevent drift, and keep work traceable.

**Scope:** documentation scaffolding and edits only, unless a Scope Card explicitly authorizes code changes.

---

## Golden Rules

1. **Read → Produce → Stop.** Follow the referenced docs exactly; do not invent outside them.
2. **Rooted paths only.** All paths start at repo root with `./` (never `../`).
3. **Scope Cards gate work.** If a change touches files not listed in the card, stop and request a Scope update.
4. **Validate after edits.** Run schema validation after touching ledger/registry.
5. **Ledger-first.** Every task logs **What/Why/Risk** in `./work_ledger.yaml`.
6. **Needs‑Clarification beats guessing.** Pause and ask when info conflicts or is missing.

---

## Inputs in this package

- **Templates & policies (flat numbering):**
  - `000_ai_instructions.template.md`
  - `./docs_library/000_SCOPE_CARD.md`
  - `./docs_library/010_ROOTED_COMMANDS.md`
  - `./docs_library/020_WORK_LEDGER.md`
  - `./docs_library/030_BOOKENDS.md`
  - `./docs_library/040_NEEDS_CLARIFICATION.md`
  - `./docs_library/050_USER_DECISIONS.md`
  - `./docs_library/README.md` (overview)
- **Samples:**
  - `./docs_library/samples/work_ledger.yaml`
  - `./docs_library/samples/user-decisions-registry.yaml`
- **Schemas:**
  - `./schemas/work_ledger.schema.json`
  - `./schemas/user-decisions-registry.schema.json`
- **Validator:** `./scripts/validate.js` (run via `npm run validate`)
- **Optional config:** `./rocket.config.json` (overrides schema paths & file globs)

Optional source material (if present in a consuming project):

- `./project_overview/*.md`

---

## Standard Task Brief (paste when asking for work)

**Project:** <PROJECT_NAME>  
**Active module:** <docs file §section>  
**Goal (one sentence):** <exact outcome>  
**Out-of-scope (2–3 bullets):**

- <...>  
  **Artifacts to touch (rooted paths):**
- ./path/from/root/...  
  **Definition of Done (3–5 checks):**
- <...>  
  **Sub-steps (ordered):**

1. <mini step>
2. <mini step>
3. <mini step>

**Valid states:** `Todo`, `In-Progress`, `Review`, `Done`, `Blocked`, `Needs-Clarification`, `Waiting`

---

## Primary flow: overview → docs

1. Read inputs (if any) from `./project_overview/`.
2. Populate **project docs** under `./docs/**` using templates from `./docs_library/**`. Keep numbering convention.
3. Update `./work_ledger.yaml` (include **What/Why/Risk**, state, artifacts).
4. If the user made a decision that affects patterns, propose an entry in `./user-decisions-registry.yaml`.
5. Run validation: `npm run validate`.
6. Stop when DoD is met; list any questions (use Needs‑Clarification if blocking).

---

## Session Bookends

**OPEN** — Scope Card, confirm rooted commands, next 3 steps, clarification check.  
**CLOSE** — Update Work Ledger (state, sub-steps, triad, artifacts), blockers + owner + re-check time, ≤6‑line summary.

---

## Commands (from repo root)

- Scaffold (for consumers):
  ```bash
  npx copilot-rocket init ./docs --init-readme --seed ledger --seed registry
  ```
- Validate locally:
  ```bash
  npm run validate
  ```
- Full verification:
  ```bash
  npm run verify
  ```

---

## Output preferences

- **Docs:** Markdown (`.md`) under `./docs/`
- **Configs:** JSON (`.json`) / YAML (`.yaml`/`.yml`) as specified
- **Paths:** rooted at `./`, explicitly listed in the Work Ledger
- **Tone:** factual + brief context; avoid stigmatizing language
