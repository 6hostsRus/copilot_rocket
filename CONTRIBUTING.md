# Contributing to copilot-rocket

Thanks for contributing! A few lightweight rules help keep the project useful and consistent.

Scope-Card-first rule

- When proposing a change or PR, start with a Scope Card (a short description of the increment, non-goals, and DoD).
- The Scope Card should be included in the PR description or linked to an artifact in `./docs` or `./docs_library`.

Commit message style

- Use a short conventional-style header. Examples:
  - `feat: add seed samples`
  - `fix: correct bundler path handling`
  - `chore(release): bump version to 1.1.0`
- Keep the subject line under ~72 characters and use the imperative mood.

How to run verification locally

- Format and lint:

```bash
npm run format
npm run lint
```

- Full verification (format, lint, validate, pack dry-run, test install):

```bash
npm run verify
```

Thank you for helping improve copilot-rocket!
