#!/usr/bin/env node
import path from 'node:path';
import { loadConfig, writeGithubSection } from './generate-copilot-bundle.mjs';

async function main() {
  const cfg = await loadConfig('docs_library/registries/runtime.yaml');
  const repoRoot = path.resolve(cfg.targets?.repoRoot || '.');
  const written = await writeGithubSection(repoRoot, cfg, { dryRun: true });
  const out = { dryRun: true, github: { files: written } };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error('preview failed', err);
  process.exit(1);
});
