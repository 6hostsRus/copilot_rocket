---
id: copilot.prompts.code_review
title: Code Review Prompt
kind: prompt
category: prompts
summary: Strict code review checklist for diffs, including security, tests, and performance.
tags: []
weight: 20
requires: []
provides: []
vars: []
applyTo: []
version: 1.0.0
mode: ask
---

Review the diff using this checklist:

- Security: input validation, secrets, auth.
- Tests: unit + e2e updated?
- Performance: avoid O(n^2) in hot paths.
  Return: summary + blocking issues + suggested patches.
