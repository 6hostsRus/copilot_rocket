# Copilot Behavior Bundle

Drop this bundle at the root of your repo (or into your docs package). Then:

```bash
pnpm i
node bin/generate-copilot-bundle.mjs --config=docs_base/registries/copilot-bundle.yaml
# dry-run to preview changes without writing files
node bin/generate-copilot-bundle.mjs --config=docs_base/registries/copilot-bundle.yaml --dry-run
# or run interactively
node bin/generate-copilot-bundle.mjs --interactive

# CLI overrides
# - --repo-root or --repoRoot to override the target repository root
# - --snippetRoots="path1,path2" to override snippet roots (comma-separated)
```

## File layout

```
/ (bundle root)
├─ package.json
├─ README_BUNDLE.md  # this file
├─ schemas/
│  └─ copilot-bundle.schema.json
├─ bin/
│  └─ generate-copilot-bundle.mjs
├─ templates/
│  └─ vscode/
│     └─ settings.json.hbs
└─ docs_base/
   ├─ registries/
   │  └─ copilot-bundle.yaml
   └─ snippets/
      └─ copilot/
         ├─ repowide/
         │  └─ copilot-instructions.md
         ├─ agents/
         │  └─ AGENTS.md
         ├─ instructions/
         │  ├─ backend.md
         │  ├─ frontend.md
         │  ├─ docs.md
         │  ├─ tests.md
         │  └─ security.md
         ├─ prompts/
         │  ├─ code-review.md
         │  ├─ pr-description.md
         │  ├─ generate-component.md
         │  ├─ test-scaffold.md
         │  ├─ refactor.md
         │  ├─ docs-rewrite.md
         │  └─ security-scan.md
         └─ chatmodes/
            ├─ planner.md
            ├─ strict-reviewer.md
            ├─ rapid-editor.md
            └─ research.md
```

> The CLI reads **copilot-bundle.yaml**, pulls snippet content from `docs_base/snippets/copilot/**`, renders Mustache variables, injects front-matter (where applicable), writes `.github/*` files, and **merges** `.vscode/settings.json`.

### Notes

- Uses **Mustache** for templating.
- Uses **yaml** for proper YAML parsing.
- Validates `copilot-bundle.yaml` against the included **JSON Schema** (if you wire validation; example code stub included).
- Script is idempotent: re-running updates outputs and merges VS Code settings.
