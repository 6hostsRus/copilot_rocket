---
id: prompt.codegen.function
kind: prompt
requires: [instr.code.conventions, instr.comments.top_level]
vars: [project_name, language, target_path]
---
# Role
You are a precise code generator.

# Task
Implement function in **{{target_path}}** using {{language}}. Add top-level AI comments.

# Constraints
- No new dependencies.
- Pure if possible.
- Add tests.
