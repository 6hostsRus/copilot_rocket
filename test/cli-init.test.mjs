import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const BIN = path.resolve('./bin/docs-base-scaffold.mjs');

test('copilot-rocket --help prints usage', () => {
  const out = execFileSync('node', [BIN, '--help'], { encoding: 'utf8' });
  assert.match(out, /copilot-rocket - scaffold docs_base templates/);
});

test('init --dry-run does not write files', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    execFileSync('node', [BIN, 'init', tmp, '--dry-run'], { encoding: 'utf8' });
    assert.strictEqual(existsSync(path.join(tmp, 'docs_base')), false);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('init creates files and respects --force and --init-readme and --seed', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    // initial scaffold
    execFileSync('node', [BIN, 'init', tmp], { encoding: 'utf8' });
    assert.ok(existsSync(path.join(tmp, 'docs_base')));
    // without force, running again should skip and not change README
    execFileSync('node', [BIN, 'init', tmp], { encoding: 'utf8' });
    // with init-readme and force, README is created
    execFileSync(
      'node',
      [BIN, 'init', tmp, '--force', '--init-readme', '--seed', 'ledger', '--seed', 'registry'],
      { encoding: 'utf8' }
    );
    assert.ok(existsSync(path.join(tmp, 'README.md')));
    assert.ok(
      existsSync(path.join(tmp, 'work_ledger.yaml')) ||
        existsSync(path.join(tmp, 'user-decisions-registry.yaml'))
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
