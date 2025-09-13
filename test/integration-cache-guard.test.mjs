import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, rmSync, existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';

const BIN = path.resolve('./bin/docs-scaffold.mjs');

function run(args, opts = {}) {
  return execFileSync('node', args, { encoding: 'utf8', ...opts });
}

test('cache guard ignores cache pointing outside projectRoot', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    // write a cache in repo root that points to tmp (outside project root)
    const cache = { targetDir: path.relative(process.cwd(), path.join(tmp, 'docs', 'ai')) };
    writeFileSync(path.join(process.cwd(), '.cr_init_cache.json'), JSON.stringify(cache, null, 2));

    // run init non-interactive without specifying target (should use projectRoot default docs/ai)
    const out = execFileSync('node', [BIN, 'init', tmp, '--non-interactive', '--no-cache'], {
      encoding: 'utf8',
    });

    // The created ai_instructions.md should be written into the provided project root (tmp)
    assert.strictEqual(existsSync(path.join(tmp, 'ai_instructions.md')), true);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    try {
      rmSync(path.join(process.cwd(), '.cr_init_cache.json'), { force: true });
    } catch {}
    try {
      rmSync(path.join(process.cwd(), 'ai_instructions.md'), { force: true });
    } catch {}
  }
});

test('project-root CLI option causes outputs to be written into that root', () => {
  const tmp = mkdtempSync(path.join(os.tmpdir(), 'cr-'));
  try {
    // run init with explicit --project-root and ai-template
    const tpl = path.join(tmp, 'ai_test.md');
    writeFileSync(tpl, '# AI TEST\n');

    const out = execFileSync(
      'node',
      [
        BIN,
        'init',
        tmp,
        '--non-interactive',
        '--ai-template',
        tpl,
        '--force',
        '--project-root',
        tmp,
      ],
      { encoding: 'utf8' }
    );

    assert.strictEqual(existsSync(path.join(tmp, 'ai_instructions.md')), true);
    const read = readFileSync(path.join(tmp, 'ai_instructions.md'), 'utf8');
    assert.match(read, /AI TEST/);
  } finally {
    rmSync(tmp, { recursive: true, force: true });
    try {
      rmSync(path.join(process.cwd(), 'ai_instructions.md'), { force: true });
    } catch {}
  }
});
