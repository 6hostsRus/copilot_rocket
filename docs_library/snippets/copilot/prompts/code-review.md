---
mode: ask
description: Strict code review checklist
---
Review the diff using this checklist:
- Security: input validation, secrets, auth.
- Tests: unit + e2e updated?
- Performance: avoid O(n^2) in hot paths.
Return: summary + blocking issues + suggested patches.
