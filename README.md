# copilot-rocket

![npm](https://img.shields.io/npm/v/copilot-rocket.svg)
![CI](https://img.shields.io/github/actions/workflow/status/6hostsRus/copilot_rocket/ci.yml?branch=main)

NOTE: In CI or automated scripts, prefer a deterministic workspace via `--project-root` to avoid writing into the repository root.

Example (CI-safe):

```sh
# run in CI and keep outputs inside the job workspace
node ./bin/docs-scaffold.mjs init ./ --non-interactive --project-root $GITHUB_WORKSPACE
```

The workflow also checks that `ai_instructions.md` in the repo root isn't modified by CI; if it is, CI fails with remediation hints.

Modular docs bundle for AI agent workflows. Ships opinionated templates and a tiny CLI.

## Install

```sh
npm i -D copilot-rocket
```

30-second hello

```sh
npx copilot-rocket init ./docs --init-readme --seed ledger --seed registry
```

## Use

```sh
npx copilot-rocket init
# populates ./docs/ai with baseline templates
```

Bundle the project (creates tools/dist/project_bundle.zip):

```sh
npx package-bundle project_bundle.zip
```

## Copilot bundle generator

This package includes a small CLI to render Copilot behavior snippets into a repo layout. It pulls snippet content from `docs_library/snippets/copilot/**`, renders Mustache variables, injects optional YAML front-matter, writes files under `.github/*`, and merges `.vscode/settings.json`.

Basic usage:

```sh
node bin/generate-copilot-bundle.mjs --config=docs_library/registries/runtime.yaml
```

Preview changes without writing files:

```sh
node bin/generate-copilot-bundle.mjs --config=docs_library/registries/runtime.yaml --dry-run
```

Useful flags:

- `--repo-root` or `--repoRoot` — override the target repository root (helpful in CI)
- `--snippetRoots` — comma-separated override of snippet root paths

Write bundle to project root instead of tools/dist:

```sh
npx package-bundle project_bundle.zip --out-root
```

## The Triad in Action

Every workflow in **copilot-rocket** is built around three pillars:

**1. Scope Card** (task framing)

```
**Project:** copilot-rocket
**Active module:** ./docs/ai/000_SCOPE_CARD.md
**Goal:** Add pre-share preview
**Artifacts to touch:** ./docs/permissions.md
**DoD:** 3 checks listed
```

2. Rooted Command (always from repo root)

npm run verify

# Reads: ./package.json

# Writes: ./dist/\*

3. Work Ledger (task log with What/Why/Risk)

id: T-024
title: Add pre-share preview
state: Done
changelog:
what: Added preview spec
why: Phase 4 acceptance
risk: Medium — check flags

## Triad Rules (Scope • Path • Ledger)

- **Scope Card** defines the increment and non-goals.
- **Rooted Commands** ensure reproducible, root-anchored execution.
- **Work Ledger** records all actions and references commits/PRs.

These match the templates in `./docs/ai` and the guidance in **PUBLISH_GUIDE.md**.

## Conventions

- License: MIT
- Changelog: Keep a Changelog + SemVer
- CI: eslint + prettier check + npm pack dry-run + test install

Validate example

```sh
npm run validate
```

Custom validation

If you want to point a YAML file at a custom schema, include a `$schema` key in the document that points to a local schema path (relative to the file). The validator will try the `$schema` first, then fall back to the configured/default schemas.

## Links

- Publishing guide: `./PUBLISH_GUIDE.md`
- Release checklist: `./RELEASE_CHECKLIST.md`
