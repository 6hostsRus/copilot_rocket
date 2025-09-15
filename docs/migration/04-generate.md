# Generate & Verify Runtime (.github)

Purpose: exact steps an agent should run to produce `.github` from `docs_base` and verify the results.

Preconditions:

- `docs_base/registries/runtime.yaml` is populated.
- `bin/generate-runtime.mjs` exists and is executable (or `npm run generate` is defined).

Agent-run steps (atomic):

1. Run generator locally and capture output.

```bash
npm run generate
```

2. Inspect the top-level of generated files. Confirm banner exists in each file:

```
<!-- GENERATED from docs_base; DO NOT EDIT IN .github -->
```

3. Verify `.github/registry.json` exists and contains entries for each `target`.

4. Optional drift check (safe guard):

```bash
# regenerate into tmp and compare
npm run generate -- --out tmp_generated
diff -ru .github tmp_generated || true
```

5. If satisfied, stage generated `.github` files in a single commit: `git add .github && git commit -m "chore: generate runtime from docs_base"`.

Agent acceptance criteria:

- All targets from `runtime.yaml` are present in `.github`.
- Each generated file starts with the GENERATED banner.
- `.github/registry.json` is complete and parsable.

If any acceptance step fails, record the exact failing files and add a short remediation (example: missing source file -> add to `WORK_LEDGER.md`).
