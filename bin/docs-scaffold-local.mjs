#!/usr/bin/env node
/**
 * Local wrapper to run docs-scaffold against this repo's docs_library during tests
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const BIN = path.resolve(process.cwd(), 'bin', 'docs-scaffold.mjs');
const env = {
  ...process.env,
  COPILOT_ROCKET_TEMPLATES: path.resolve(process.cwd(), 'docs_library'),
};
const args = process.argv.slice(2);
const res = spawnSync('node', [BIN, ...args], { stdio: 'inherit', env });
process.exit(res.status === null ? 1 : res.status);
