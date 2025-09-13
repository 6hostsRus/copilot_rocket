# Work Ledger

> Single source of truth for work performed. Each entry links scope, change, and evidence.

| id     | when (UTC)             | who          | what     | why (scope/triad) | refs              |
| ------ | ---------------------- | ------------ | -------- | ----------------- | ----------------- |
| <auto> | <YYYY-MM-DDThh:mm:ssZ> | <you or bot> | <action> | <SCOPE_TITLE>     | <issue/PR/commit> |

Rules:

- Append-only.
- Every commit references a `LEDGER:<id>`.
- Close the loop in release notes.
