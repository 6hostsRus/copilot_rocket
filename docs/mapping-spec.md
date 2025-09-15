# Mapping Specification

Snippets library is the source of truth; `.github/` is generated. No manual edits in `.github`.

| Source (docs_base)       | Target (.github)        |
| ------------------------ | ----------------------- |
| snippets/prompts/\*      | .github/prompts/\*      |
| snippets/instructions/\* | .github/instructions/\* |
| registries/runtime.yaml  | .github/registry.json   |

Generated files start with banner:

```
<!-- GENERATED from docs_base; DO NOT EDIT IN .github -->
```
