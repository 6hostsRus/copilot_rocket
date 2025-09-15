# Inventory Your Project (what to move to `docs_base`)

Purpose: give an agent a checklist and heuristics to find prompt-like artifacts and convert them into `docs_base/snippets/*` files with required front-matter.

Search heuristics (agent-friendly):

- Look for `.md` files in `docs/`, `.github/`, `docs_base/`, `templates/`, and `scripts/` that contain words: `prompt`, `copilot`, `agent`, `instructions`, `chatmode`, `snippet`.
- Search code comments that start with `AI:` or `ai:` or contain `ai:module` headers.

Categories and where they map:

- Prompts → `docs_base/snippets/prompts/` (examples: codegen, review.diff)
- Instructions → `docs_base/snippets/instructions/` (code conventions, commenting guidance)
- Chatmodes → `docs_base/snippets/chatmodes/` (multi-step flows: plan→scaffold→review)

Required front-matter for every snippet (YAML at file top):

```yaml
---
id: <stable-id> # kebab or dotted id, unique
kind: prompt|instruction|chatmode
requires: [] # optional ids this relies on
vars: [] # optional template vars
scope: [] # optional glob patterns
---
```

Agent convert steps (atomic):

1. For each discovered artifact, create a file under the appropriate `docs_base/snippets/<kind>/` with the required front-matter.
2. Normalize a short description in the first paragraph (one-line intent).
3. Add `id:` with a stable, discoverable name (e.g., `prompt.codegen.function`).
4. Stage the new files but do not commit until `.github` is generated and inspected.

Edge cases:

- If a file mixes prompts and instructions, split into two files.
- If a prompt references repository-specific secrets or tokens, redact and record in `WORK_LEDGER.md` as manual to-check.
