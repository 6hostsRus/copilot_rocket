#!/usr/bin/env node
/**
 * copilot-rocket
 * Minimal CLI to scaffold docs_base templates into a target repo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function scaffold(targetDir, opts = {}) {
  const tplDir = path.join(__dirname, '..', 'docs_base');
  const files = fs.readdirSync(tplDir);
  for (const name of files) {
    const src = path.join(tplDir, name);
    const dst = path.join(targetDir, 'docs_base', name);
    // skip samples directory
    if (name === 'samples') continue;
    if (fs.existsSync(dst) && !opts.force) {
      console.log('Skipping existing:', dst);
      continue;
    }
    copy(src, dst);
  }
  if (opts.initReadme) {
    const readmePath = path.join(targetDir, 'README.md');
    if (!fs.existsSync(readmePath) || opts.force) {
      fs.writeFileSync(
        readmePath,
        `# ${path.basename(targetDir)}\n\nScaffolded by copilot-rocket\n`
      );
      console.log('Created README.md at', readmePath);
    }
  }
  console.log(`Scaffolded docs_base into ${path.join(targetDir, 'docs_base')}`);
}

function usage() {
  console.log(`Usage:
  copilot-rocket init [targetDir=.]
  `);
}
function help() {
  console.log(`copilot-rocket - scaffold docs_base templates into a target repo

Usage:
  copilot-rocket init [targetDir=.] [--force] [--dry-run] [--seed ledger|registry] [--init-readme]
  copilot-rocket --help

Examples:
  copilot-rocket init . --force --seed ledger

Flags:
  --force       Overwrite existing files
  --dry-run     Show what would be written without writing
  --seed ledger Seed with a sample work_ledger.yaml
  --seed registry Seed with a sample user-decisions-registry.yaml
  --init-readme Create a README.md alongside the scaffold
`);
}

const argv = process.argv.slice(2);
if (argv.includes('--help') || argv.includes('-h')) {
  help();
  process.exit(0);
}

if (argv.includes('--version') || argv.includes('-v')) {
  // read package.json version
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
    console.log(pkg.version);
    process.exit(0);
  } catch (e) {
    // fall through
  }
}

const cmd = argv[0];
const maybeDir = argv.find((a) => !a.startsWith('-') && a !== 'init');
const target = path.resolve(process.cwd(), maybeDir || '.');

const force = argv.includes('--force');
const dryRun = argv.includes('--dry-run');
const initReadme = argv.includes('--init-readme');
let seed = null;
const seedIndex = argv.indexOf('--seed');
if (seedIndex !== -1 && argv[seedIndex + 1]) seed = argv[seedIndex + 1];

switch (cmd) {
  case 'init': {
    if (dryRun) console.log('[dry-run] would scaffold into', target);
    else scaffold(target, { force, initReadme, seed });
    if (seed && (seed === 'ledger' || seed === 'registry')) {
      const sampleDir = path.join(__dirname, '..', 'docs_base', 'samples');
      // non-fatal: copy sample if exists
      try {
        const sampleFile = seed === 'ledger' ? 'work_ledger.yaml' : 'user-decisions-registry.yaml';
        const src = path.join(sampleDir, sampleFile);
        const dst = path.join(target, sampleFile);
        if (fs.existsSync(src)) {
          if (!dryRun) copy(src, dst);
          console.log(`${seed} seeded -> ${dst}`);
        }
      } catch (e) {
        // ignore
      }
    }
    break;
  }
  default:
    help();
    process.exit(cmd ? 1 : 0);
}
