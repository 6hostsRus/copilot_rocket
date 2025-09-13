# docs-base-bundle

Modular docs bundle for AI agent workflows. Ships opinionated templates and a tiny CLI.

## Install

```sh
npm i -D docs-base-bundle
```

## Use

```sh
npx copilot-rocket init
# creates ./docs_base with baseline templates
```

Bundle the project (creates tools/dist/project_bundle.zip):

```sh
npx package-bundle project_bundle.zip
```

Write bundle to project root instead of tools/dist:

```sh
npx package-bundle project_bundle.zip --out-root
```

## Triad Rules (Scope • Path • Ledger)

- **Scope Card** defines the increment and non-goals.
- **Rooted Commands** ensure reproducible, root-anchored execution.
- **Work Ledger** records all actions and references commits/PRs.

These match the templates in `./docs_base` and the guidance in **PUBLISH_GUIDE.md**.

## Conventions

- License: MIT
- Changelog: Keep a Changelog + SemVer
- CI: eslint + prettier check + npm pack dry-run + test install

## Links

- Publishing guide: `./PUBLISH_GUIDE.md`
- Release checklist: `./RELEASE_CHECKLIST.md`
