# Release Checklist

- [ ] CHANGELOG updated (Keep a Changelog; new version dated).
- [ ] package.json version bumped.
- [ ] CI `npm run verify` green: format, lint, pack dry-run, test install.
- [ ] Tag created `vX.Y.Z` and pushed.
- [ ] Publish to npm (`npm publish --access public`) for `copilot-rocket`.
- [ ] GitHub Release drafted; link to CHANGELOG section.
- [ ] Work Ledger updated with `LEDGER:<id>` and npm URL.
