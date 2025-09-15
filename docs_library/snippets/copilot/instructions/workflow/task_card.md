---
id: copilot.instructions.workflow.task_card
title: Task Card
kind: instruction
category: workflow
summary: Template for task cards used to request work from agents.
tags: []
weight: 20
requires: []
provides: []
vars: []
applyTo: []
version: 1.0.0
---

# Task Cards: runbook and templates

---

id: copilot.instructions.workflow.task_card
title: Task Card
kind: instruction
category: workflow
summary: Template for task cards used to request work from agents.
tags: []
weight: 20
requires: []
provides: []
vars: []
applyTo: []
version: 1.0.0

---

Task Card minimal structure (YAML block to paste into `WORK_LEDGER.md`):

```yaml
- id: TASK-001
  title: Implement login handler (passwordless)
  status: proposed # proposed|in-progress|done
  intent: Implement passwordless login handlers and handlers tests
  scope: src/auth/**
  acceptance:
    - unit: auth/handlers.test.ts passes
    - e2e: login flow completes locally (manual)
  notes: Keep side effects at edges; no new deps.
  session_branch: feat/TASK-001-login
```

Agent session loop (atomic steps):

1. Read the top-most `proposed` Task Card from `WORK_LEDGER.md`. Echo `pwd` and `git status -sb`.
2. Create an ordered plan: smallest slice that satisfies one acceptance item (tests first).
3. Create a feature branch: `git checkout -b <session_branch>`.
4. Implement tests for the slice. Commit with message `test: TASK-<id> add failing tests`.
5. Implement code to satisfy tests. Commit with `feat: TASK-<id> implement <short>`.
6. Run tests locally. If all pass, update Task Card `status: done` and add a short session note.
7. Update `CHANGELOG.md` with one-line summary and add files changed list.
8. Push branch and open PR with title: `TASK-<id>: <title>`.

Agent prompt templates (copyable)

- Start session prompt (short):

```
Read the top 'proposed' Task Card in WORK_LEDGER.md. Echo `pwd` and `git status -sb`.
Propose the smallest test-first slice to satisfy one acceptance criterion. List files you will change.
Do not modify files yet; wait for confirmation.
```

- Implement slice prompt (after plan confirmed):

```
On branch <session_branch>. Create failing tests first, then implement code to pass them.
Rules:
- Only touch files listed in the plan.
- No new dependencies unless approved.
Return:
1) Diffs for tests and code (unified diff per file).
2) Commands you ran (tests, lint).
3) Updated Task Card YAML to set status=in-progress or done.
```

Ledger close ritual (agent-friendly steps to write to `WORK_LEDGER.md` and `CHANGELOG.md`):

1. Append a short session note under the Task Card: timestamp, files changed, tests passing (Y/N), follow-ups.
2. Add a one-line CHANGELOG entry under `Unreleased` or top section.

Example session (happy path):

- TASK-001: propose → agent creates branch `feat/TASK-001-login`.
- Agent adds tests `auth/handlers.test.ts` (failing), commits.
- Agent implements `src/auth/handlers.ts`, runs tests, all pass.
- Agent updates Task Card status to `done`, appends session note and CHANGELOG entry, opens PR.

Edge cases and safety rules:

- If tests are flaky locally, record the flake and stop; add manual follow-up in `WORK_LEDGER.md`.
- If the change touches >5 files, refuse and ask to split into smaller Task Cards.
- Always request human approval before adding new dependencies.

Acceptance for Task Cards doc:

- Agents can read a Task Card, propose a test-first plan, implement tests+code, update ledger and changelog, and open a PR with the session artifacts.
