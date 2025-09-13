# Changelog

## [Unreleased]

### Added

- Added `package-bundle` utility (bin) to create a zip of the project excluding .gitignore patterns.

- Added `--out-root` / `-r` option to write the bundle to the project root instead of `tools/dist`.

### Release

- Bump to next patch release (will be tagged as the release commit).

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
