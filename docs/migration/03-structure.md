# Mapping: docs_base → .github (runtime registry)

Goal: define how sources in `docs_base/` map to `.github/` targets using `docs_base/registries/runtime.yaml`.

Minimal `runtime.yaml` schema (agent-readable):

```yaml
version: 1
prompts:
  - source: snippets/prompts/codegen.function.md
    target: prompts/codegen.function.md

instructions:
  - source: snippets/instructions/comments.top_level.md
    target: instructions/comments.top_level.md

chatmodes:
  - source: snippets/chatmodes/plan-scaffold-review.md
    target: chatmodes/plan-scaffold-review.md
```

Agent tasks to validate mapping:

1. Read `docs_base/registries/runtime.yaml`.
2. For every `source:` ensure the file exists under `docs_base/`.
3. Ensure `target:` paths are unique and do not escape the `.github` directory (no `..`).
4. If a `source:` is missing, list it in `WORK_LEDGER.md` for manual curation.

Generator expectations:

- Generator reads `runtime.yaml` and writes `.github/<target>` files preserving front-matter content and adding a generated banner.
- A `.github/registry.json` should summarize the mapping with timestamps and source checksums.

Acceptance criteria (automated):

- All `source:` entries exist.
- No duplicate `target:` paths.
- `.github/registry.json` can be parsed and lists all generated files.
