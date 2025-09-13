# Release v1.1.0 (draft)

Tag: v1.1.0

Highlights
- Tightened JSON Schemas for Work Ledger and User Decisions and added a schema validator (`scripts/validate.js`) that supports a `rocket.config.json|yaml` and CLI overrides.
- Improved CLI UX: `copilot-rocket init` supports `--help`, `--force`, `--dry-run`, `--seed ledger|registry`, and `--init-readme`. `package-bundle` supports `--help` and improved out-path handling.
- Added unit tests (Node 20 `node:test`) for the CLI and bundling behavior.
- CI now runs `node --test` and `verify` includes validation.

Full changelog entry is in CHANGELOG.md under [1.1.0].

Notes for publishing
- Verify CI passes on the release branch and the tag build uses the `NPM_TOKEN` secret.
- After publishing, attach a release tarball or notes as needed.

Suggested GitHub release body below (copy into the Release UI):

---

## What's new

- Validator + schemas
- CLI help & init flags
- Unit tests and CI test step

## Notable changes

See CHANGELOG.md for full details.

---

(End of draft)
