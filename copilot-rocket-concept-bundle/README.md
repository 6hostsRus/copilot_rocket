# copilot-rocket • Self-Developing Concept Bundle

Minimal, working concept showing how **docs_base** is the source of truth and **.github** is generated runtime.

## Includes
- docs/intent.md and docs/mapping-spec.md
- docs_base snippets (prompts + instructions)
- registry.yaml for mapping
- bin scripts to generate and verify .github
- WORK_LEDGER.md and CHANGELOG.md
- package.json with npm scripts

## Quickstart
```bash
npm run generate   # builds .github from docs_base
npm run verify     # regenerates and checks drift
```
