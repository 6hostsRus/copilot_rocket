#!/usr/bin/env node
import path from 'node:path';
import { loadConfig, writeGithubSection, writeVscodeSettings } from './generate-copilot-bundle.mjs';

async function main() {
  const cfg = await loadConfig('docs_base/registries/copilot-bundle.yaml');
  const repoRoot = path.resolve(cfg.targets?.repoRoot || '.');
  const written = await writeGithubSection(repoRoot, cfg, { dryRun: true });
  const vs = await writeVscodeSettings(repoRoot, cfg, { dryRun: true });
  const out = {
    dryRun: true,
    github: { files: written },
    vscode: { settingsPath: vs.path, merged: vs.merged },
  };
  console.log(JSON.stringify(out, null, 2));
}

main().catch((err) => {
  console.error('preview failed', err);
  process.exit(1);
});
