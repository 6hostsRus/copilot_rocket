# Publish runbook

This document describes how to publish `copilot-rocket` to npm, both manually and via CI.

## Local manual publish

1. Ensure you're logged in to npm:

```bash
npm login
```

2. Bump the version (this creates a git tag):

```bash
npm version patch   # or minor/major
git push && git push --tags
```

3. Run the verification steps locally:

```bash
npm run verify
```

4. Publish:

```bash
npm publish --access public
```

## CI publish (GitHub Actions)

- The repository includes `.github/workflows/publish.yml` which will:
  - run `npm run verify` on PRs and pushes to `main`.
  - when a tag `vX.Y.Z` is pushed, it will run verify and then publish.

- To enable publish from CI, add an `NPM_TOKEN` secret in GitHub (Repository > Settings > Secrets) with a token created via `npm token create` or your npm account.

## Notes

- The package requires Node 20+. Make sure your CI uses Node 20.
- If you want scoped packages, adjust `npm publish` flags and package name accordingly.
- Replace author and LICENSE placeholders with real values before publishing.
