# Publish Guide

This package follows **Keep a Changelog** and **SemVer**.

## Steps (aligns with RELEASE_CHECKLIST.md)

1. Update `CHANGELOG.md` (Unreleased → new version).
2. Ensure `package.json` version matches the release.
3. Run CI locally:
   ```sh
   npm ci
   npm run verify
   ```
4. Commit with `LEDGER:<id>` and tag:
   ```sh
   git commit -m "release: v1.0.0 (LEDGER:<id>)"
   git tag v1.0.0
   ```
5. Publish:
   ```sh
   npm publish --access public
   ```

## Post-publish

- Create GitHub Release notes using `CHANGELOG.md`.
- Update Work Ledger with the published version and npm URL.
