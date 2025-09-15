---
id: copilot.instructions.workflow.user_decisions
title: User Decisions Registry
kind: instruction
category: workflow
summary: Recording irreversible or high-impact user decisions with schema guidance.
tags: []
weight: 20
requires: []
provides: []
vars: []
applyTo: []
version: 1.0.0
---

# User Decisions Registry

> Record irreversible or high-impact choices with context; each decision is a named object keyed by an id.

Per-decision fields:

- decision: required non-empty string describing the choice
- owner: person or team owning the decision (optional but recommended)
- date: ISO date-time when the decision was made
- area: one of `naming`, `style`, `data`, `UX`, `tooling`, `architecture`
- applies_to: optional array of root-relative paths (must start with `./`)
- conflicts_with: optional array of other decision keys

Notes:

- Keys at the top-level identify the decision (e.g., `D-001` or a descriptive slug).
- Values must not contain unknown properties (additionalProperties: false) to keep the registry tidy.
