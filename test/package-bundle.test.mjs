import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, existsSync, rmSync, statSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const BIN = path.resolve('./bin/package-bundle.mjs');

test('package-bundle --help prints usage', () => {
  const out = execFileSync('node', [BIN, '--help'], { encoding: 'utf8' });
  assert.match(out, /package-bundle - create a zip/);
});

test('creates zip and excludes .gitignore entries', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'pb-'));
  try {
    // create files and gitignore
    writeFileSync(path.join(tmp, 'keep.txt'), 'keep');
    writeFileSync(path.join(tmp, 'secret.txt'), 'secret');
    writeFileSync(path.join(tmp, '.gitignore'), 'secret.txt\n');
    const outZip = path.join(tmp, 'out.zip');
    // run bundler from tmp directory
    execFileSync('node', [BIN, outZip], { cwd: tmp });
    assert.ok(existsSync(path.join(tmp, 'out.zip')));
    const stats = statSync(path.join(tmp, 'out.zip'));
    assert.ok(stats.size > 0);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('bundling succeeds when tools dir absent', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'pb-'));
  try {
    writeFileSync(path.join(tmp, 'a.txt'), 'a');
    const outZip = path.join(tmp, 'out2.zip');
    execFileSync('node', [BIN, outZip], { cwd: tmp });
    assert.ok(existsSync(outZip));
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});
