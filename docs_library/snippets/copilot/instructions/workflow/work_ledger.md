---
id: copilot.instructions.workflow.work_ledger
title: Work Ledger
kind: instruction
category: workflow
summary: The work ledger template and rules for logging agent activity and changes.
tags: []
weight: 20
requires: []
provides: []
vars: []
applyTo: []
version: 1.0.0
---

# Work Ledger

> Single source of truth for work performed. Each entry is a ledger entry linking Scope Card intent, change, and evidence.

Fields (per entry):

- id: (required) string matching `T-###+` (e.g., `T-024`)
- title: (required) short non-empty title
- state: one of: `Todo`, `In-Progress`, `Review`, `Done`, `Blocked`, `Needs-Clarification`, `Waiting`
- when: ISO date-time (optional but recommended)
- who: person or actor who performed the work (optional)
- substeps: optional array of objects { title: string, done: boolean }
- artifacts: optional array of root-relative paths (must start with `./`)
- refs: optional array of strings (URLs, commit/PR ids)
- changelog: object with required non-empty strings `what`, `why`, `risk`

Rules:

- Each entry should include `id`, `title` and a `changelog` with `what`, `why`, and `risk`.
- Prefer root-relative `./` paths in `artifacts` so tools can locate referenced files.
- Use `state` values from the enum above to normalize status across projects.
- Append-only is recommended in practice; if you amend an entry, record the rationale in `changelog`.
