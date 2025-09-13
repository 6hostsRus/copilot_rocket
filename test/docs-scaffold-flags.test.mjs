import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, existsSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const BIN_LOCAL = path.resolve('./bin/docs-scaffold-local.mjs');
const BIN = path.resolve('./bin/docs-scaffold.mjs');

function run(args, opts = {}) {
  return execFileSync('node', args, { encoding: 'utf8', ...opts });
}

test('list mode prints planned files and exits without writes', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    const out = execFileSync('node', [BIN, 'init', tmp, '--list'], { encoding: 'utf8' });
    assert.match(out, /Planned files:/);
    assert.strictEqual(existsSync(path.join(tmp, 'docs', 'ai')), false);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    // ensure no local cache file is left behind
    try {
      rmSync(path.join(process.cwd(), '.cr_init_cache.json'), { force: true });
    } catch {}
  }
});

test('no-cache avoids writing .cr_init_cache.json', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    // remove any existing cache file to make this test deterministic
    try {
      rmSync(path.join(process.cwd(), '.cr_init_cache.json'), { force: true });
    } catch {}
    execFileSync('node', [BIN, 'init', tmp, '--non-interactive', '--no-cache'], {
      encoding: 'utf8',
    });
    assert.strictEqual(existsSync(path.join(process.cwd(), '.cr_init_cache.json')), false);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
});

test('ai-template override and force overwrite ai_instructions.md', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    // create a temporary ai template
    const tpl = path.join(tmp, 'ai_test.md');
    const content = '# AI TEST\n';
    writeFileSync(tpl, content);

    // run install with ai-template and force via env
    const out = execFileSync(
      'node',
      [BIN, 'init', tmp, '--non-interactive', '--ai-template', tpl, '--force', '--init-readme'],
      { encoding: 'utf8' }
    );
    // expect ai_instructions.md was created in the project root (tmp)
    assert.strictEqual(existsSync(path.join(tmp, 'ai_instructions.md')), true);
    const read = readFileSync(path.join(tmp, 'ai_instructions.md'), 'utf8');
    assert.match(read, /AI TEST/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    // cleanup ai_instructions.md in repo root and tmp (safety)
    try {
      rmSync(path.join(process.cwd(), 'ai_instructions.md'), { force: true });
    } catch {}
    try {
      rmSync(path.join(tmp, 'ai_instructions.md'), { force: true });
    } catch {}
    // ensure no local cache file is left behind
    try {
      rmSync(path.join(process.cwd(), '.cr_init_cache.json'), { force: true });
    } catch {}
  }
});

test('seed and seed-to write sample files', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    execFileSync(
      'node',
      [
        BIN_LOCAL,
        'init',
        tmp,
        '--non-interactive',
        '--seed',
        'ledger',
        '--seed',
        'registry',
        '--seed-to',
        'root',
        '--force',
      ],
      { encoding: 'utf8' }
    );
    assert.ok(
      existsSync(path.join(tmp, 'docs', 'ai', 'work_ledger.yaml')) ||
        existsSync(path.join(tmp, 'docs', 'ai', 'user-decisions-registry.yaml'))
    );
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    // ensure no local cache file is left behind
    try {
      rmSync(path.join(process.cwd(), '.cr_init_cache.json'), { force: true });
    } catch {}
  }
});

test('init-readme creates README at project root when requested', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    execFileSync(
      'node',
      [BIN_LOCAL, 'init', tmp, '--non-interactive', '--init-readme', '--force'],
      { encoding: 'utf8' }
    );
    assert.strictEqual(existsSync(path.join(tmp, 'README.md')), true);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    // ensure no local cache file is left behind
    try {
      rmSync(path.join(process.cwd(), '.cr_init_cache.json'), { force: true });
    } catch {}
  }
});
