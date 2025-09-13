# AI Instructions (project root)

> Path: `./ai_instructions.md` — first document any assistant should read in this repo.

This project uses **copilot-rocket** to keep docs and agent workflows consistent and drift‑resistant.

---

## Objective

Transform plain-language materials into a structured doc library under `./docs/` (specifically `./docs/ai`) using the templates and rules provided in `./docs_base/**`.

---

## Golden Rules

- **Read → Produce → Stop**; follow the referenced docs exactly.
- **Rooted paths only** (`./…` from repo root).
- **Scope Cards** gate changes; if scope expands, pause and request a Scope update.
- **Validate** schemas after touching ledger/registry.
- **Log work** via **What/Why/Risk** in `./work_ledger.yaml`.
- **Use Needs‑Clarification** when information is missing or conflicting.

---

## Where to read first (actual paths in this repo)

- `./docs_base/000_SCOPE_CARD.md`
- `./docs_base/010_ROOTED_COMMANDS.md`
- `./docs_base/020_WORK_LEDGER.md`
- `./docs_base/030_BOOKENDS.md`
- `./docs_base/040_NEEDS_CLARIFICATION.md`
- `./docs_base/050_USER_DECISIONS.md`
- `./docs_base/README.md`
- Schemas: `./schemas/work_ledger.schema.json`, `./schemas/user-decisions-registry.schema.json`
- Validator: `./scripts/validate.js`
- Optional config: `./rocket.config.json`

Optional inputs (if present):

- `./project_overview/*.md` — source content to transform into `./docs/**`

---

## Standard Task Brief

**Project:** <name>  
**Active module:** <docs file §section>  
**Goal:** <one sentence>  
**Out-of-scope:** <2–3 bullets>  
**Artifacts to touch:** `./…` (explicit list)  
**DoD:** <3–5 checks>  
**Sub-steps:** 1) … 2) … 3) …  
**State (one):** `Todo`, `In-Progress`, `Review`, `Done`, `Blocked`, `Needs-Clarification`, `Waiting`

---

## Primary flow: overview → docs

1. Read `./project_overview/` files (if provided) and extract key signals.
2. Create/update `./docs/ai/**` by filling templates from `./docs_base/**`.
3. Update `./work_ledger.yaml` with What/Why/Risk + artifacts touched.
4. Propose/record user decisions in `./user-decisions-registry.yaml` when patterns change.
5. Run `npm run validate`.
6. Stop when DoD is met; list questions if gaps remain.

---

## Commands (from repo root)

```bash
# Scaffold (if not already present in a consumer repo)
npx copilot-rocket init ./docs --init-readme --seed ledger --seed registry

# Validate schemas
npm run validate

# Full verification suite
npm run verify
```

---

## Session Bookends

**OPEN:** Scope Card, rooted commands, next 3 steps, clarification check.  
**CLOSE:** Ledger updates, blockers + owner, ≤6‑line summary.

---

## When to stop for Needs‑Clarification

- Conflicting terms or requirements
- Missing acceptance criteria
- Requests beyond templates/policies in `./docs_base/**`

---

## Output preferences

- Markdown for docs; JSON/YAML for configs; paths rooted at `./`
- Voice: factual + brief context
