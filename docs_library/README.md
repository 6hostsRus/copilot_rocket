# docs_library templates

These templates define the core artifacts for `copilot-rocket`.

## Intent: By AI, For AI

The goal is to keep **snippets** as the single editable source, and `.github/` as the generated runtime surface.

- IDE-agnostic consumption
- Natural-language planning → structured docs
- Task loop closes with ledger + changelog updates

## Mapping Specification

Snippets library is the source of truth; `.github/` is generated. No manual edits in `.github`.

| Source (docs_library)    | Target (.github)        |
| ------------------------ | ----------------------- |
| snippets/prompts/\*      | .github/prompts/\*      |
| snippets/instructions/\* | .github/instructions/\* |
| registries/runtime.yaml  | .github/registry.json   |

Generated files start with banner:

```
<!-- GENERATED from docs_library; DO NOT EDIT IN .github -->
```

**front-matter**
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

**Triad Rules** (Scope • Path • Ledger)

- **Scope Card** drives intent and non-goals.
- **Rooted Commands** execute work from the project root with explicit paths.
- **Work Ledger** logs every action (who/what/when/why) and references commit SHAs.

Update these files in your consuming repo, not here in the package.

# Examples and Templates

This section contains concrete examples agents can copy-paste: prompt snippets, `ai:module` headers, Task Card examples, and a note about `scripts/validate.js` so agents don't duplicate validation logic.

1. Example ai:module header (drop into source files you want agents to edit)

```text
/* ai:module
id: module.user.auth
intent: Passwordless auth handlers
scope: src/auth/**
contracts: [docs/contracts/auth-flow.md]
acceptance:
  - unit: auth/handlers.test.ts passes
  - perf: login < 50ms local
notes: Keep side effects at edges.
*/
```

2. Example prompt (constrained codegen)

```
Use .github/instructions/code.conventions.md and .github/instructions/comments_top_level.md.
Implement ONE function in {{target_path}} (VS Code: ${relativeFile}).
Rules:
- No new deps. Keep pure if possible.
- Add/extend tests near the file.
- Use the ai:module header if missing.

Return:
1) Function implementation
2) Updated or new tests
3) Brief diffs of files touched
```

3. Task Card YAML example (to paste into `WORK_LEDGER.md`)

```yaml
- id: TASK-002
  title: Add unit tests for utils/normalize
  status: proposed
  intent: Add unit tests to cover edge cases in normalize function
  scope: src/utils/**
  acceptance:
    - unit: utils/normalize.test.ts covers null/empty/long inputs
  session_branch: feat/TASK-002-normalize-tests
```

4. Example agent session exchange (short)

Agent: "I will create a failing test `src/utils/normalize.test.ts` that asserts behavior A,B,C. Files to change: `src/utils/normalize.test.ts` and `src/utils/normalize.ts` (if needed). Proceed?"

Human: "Proceed."

Agent: returns diffs + test run output + updated Task Card YAML with `status: in-progress` or `done`.

5. Validation note — `scripts/validate.js`

- This repository includes `scripts/validate.js` which validates `work_ledger` and `user-decisions` files using JSON schemas under `schemas/`.
- Agents should call this script rather than reimplement validation logic. Example:

```bash
node scripts/validate.js
```

- The script supports CLI overrides for schema paths and file globs (`--work-schema`, `--work-files`, etc.). See the script header for details.

6. Small checklist for agent authors

- Always echo `pwd` and `git status -sb` before edits.
- Propose a minimal plan before modifying files.
- Run `node scripts/validate.js` when modifying `WORK_LEDGER.md` or decision registries to ensure schema compliance.
