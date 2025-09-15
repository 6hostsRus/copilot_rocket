---
id: copilot.instructions.code_conventions.comments_top_level
title: Comments Top Level
kind: instruction
category: code_conventions
summary: Guidance on top-level comments, module headers, and ai:module usage.
tags: []
weight: 20
requires: []
provides: []
vars: []
applyTo: []
version: 1.0.0
---

## Top-Level AI Comment

```
/* ai:module
id: {{module_id}}
intent: {{intent}}
scope: {{scope}}
acceptance:
  - tests: {{test_path}} passes
notes: Keep side effects at edges.
*/
```
