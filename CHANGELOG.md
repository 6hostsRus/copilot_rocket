# Changelog

## [Unreleased]

### Added

- Added `package-bundle` utility (bin) to create a zip of the project excluding .gitignore patterns.

- Added `--out-root` / `-r` option to write the bundle to the project root instead of `tools/dist`.

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-09-12

### Added

- Initial stable release of `copilot-rocket`.
- Templates for Scope Card, Rooted Commands, Work Ledger, Bookends, Needs Clarification, and User Decisions.
- CLI `copilot-rocket` to copy templates into a repo.
- CI workflow and publish guidance.

### Changed

- Standardized placeholders (`<SCOPE_TITLE>`, `<OWNER>`, timestamps as UTC ISO).
- Normalized tone and terminology across all templates (Triad Rules).

### Fixed

- Ensured bin path and files array match published contents.

## [1.1.0] - 2025-09-13

### Added

- Tightened JSON Schemas for Work Ledger and User Decisions and added `scripts/validate.js` (schema validation with config + glob support).
- Validator supports `rocket.config.json|yaml`, CLI overrides, per-file `$schema` pointers, and prints a validation summary.
- CLI improvements: `copilot-rocket` `init` gained `--help`, `--force`, `--dry-run`, `--seed ledger|registry`, and `--init-readme`; `package-bundle` gained `--help` and improved path handling.
- Added node:test unit tests for key CLI behaviors (`test/cli-init.test.mjs`, `test/package-bundle.test.mjs`).
- CI: added test step (runs `node --test`) and publish workflow limited to tag pushes only.

### Changed

- Standardized project name and docs to `copilot-rocket`.

### Fixed

- Fixed package-bundle path handling for absolute out paths and ensured bundling excludes .gitignore entries correctly.
