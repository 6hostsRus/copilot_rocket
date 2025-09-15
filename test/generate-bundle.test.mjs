import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import {
  injectFrontMatter,
  loadConfig,
  renderString,
  writeGithubSection,
} from '../bin/generate-copilot-bundle.mjs';

import { execFileSync } from 'node:child_process';

test('injectFrontMatter adds YAML front matter when meta present', () => {
  const meta = { applyTo: ['*.md', '*.ts'], model: 'gpt-4' };
  const body = 'Hello world';
  const out = injectFrontMatter(meta, body);
  assert.ok(out.startsWith('---'));
  assert.ok(out.includes('applyTo:'));
  assert.ok(out.includes('model:'));
  assert.ok(out.endsWith('\n' + body));
});

test('renderString replaces mustache variables', () => {
  const tpl = 'Project: {{project}}';
  const out = renderString(tpl, { project: 'x' });
  assert.strictEqual(out, 'Project: x');
});

test('writeGithubSection dry-run returns list of planned files', async () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    const cfg = await loadConfig(path.resolve('./docs_library/registries/copilot-bundle.yaml'));
    cfg.targets = { ...(cfg.targets || {}), githubDir: '.github-test' };
    cfg.snippetRoots = cfg.snippetRoots || ['docs_library/snippets/copilot'];
    const written = await writeGithubSection(tmp, cfg, { dryRun: true });
    assert.ok(Array.isArray(written));
    assert.ok(written.length > 0);
    // no files should actually exist in dry-run
    for (const p of written) assert.strictEqual(existsSync(p), false);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

// vscode settings functionality removed; related tests removed

test('CLI --dry-run --json outputs valid JSON with github.files', async () => {
  const out = execFileSync('node', ['bin/generate-copilot-bundle.mjs', '--dry-run', '--json'], {
    encoding: 'utf8',
  });
  const obj = JSON.parse(out);
  if (!obj || !obj.github || !Array.isArray(obj.github.files))
    throw new Error('Invalid JSON output');
});
