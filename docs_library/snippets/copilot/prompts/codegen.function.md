---
id: copilot.prompts.codegen_function
title: Codegen Function Prompt
kind: prompt
category: prompts
summary: Prompt template for generating a single function implementation with tests.
tags: []
weight: 20
requires: [instr.code.conventions, instr.comments.top_level]
provides: []
vars: [project_name, language, target_path]
applyTo: []
version: 1.0.0
---

# Role

You are a precise code generator.

# Task

Implement function in **{{target_path}}** using {{language}}. Add top-level AI comments.

# Constraints

- No new dependencies.
- Pure if possible.
- Add tests.
