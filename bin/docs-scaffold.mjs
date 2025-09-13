#!/usr/bin/env node
/**
 * copilot-rocket
 * docs-scaffold.mjs
 *
 * Interactive-first CLI to scaffold docs from /docs_base into a target project.
 * Also:
 *  - Copies AI instructions template to repo root as ./ai_instructions.md
 *  - Seeds Work Ledger and an initial Scope Card against the Project Overview
 *
 * Usage:
 *   npx copilot-rocket init [--target-dir <path>] [--non-interactive]
 *                            [--overview <path|none>]
 *                            [--on-collision overwrite|skip|new]
 *                            [--dry-run]
 */
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PKG_ROOT = path.resolve(__dirname, '..');
const DEFAULT_TEMPLATES_DIR =
  process.env.COPILOT_ROCKET_TEMPLATES || path.resolve(PKG_ROOT, 'docs_base');

async function exists(p) {
  try {
    await fsp.access(p, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
async function mkdirp(dir) {
  await fsp.mkdir(dir, { recursive: true });
}
function normalize(p) {
  return path.resolve(process.cwd(), p);
}
function rel(from, to) {
  return path.relative(from, to) || '.';
}

async function writeFile(dst, data, dryRun = false) {
  if (dryRun) return;
  await mkdirp(path.dirname(dst));
  await fsp.writeFile(dst, data);
}
async function readJson(p, fallback = null) {
  try {
    return JSON.parse(await fsp.readFile(p, 'utf8'));
  } catch {
    return fallback;
  }
}
async function readText(p, fallback = '') {
  try {
    return await fsp.readFile(p, 'utf8');
  } catch {
    return fallback;
  }
}

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('-')) {
      args._.push(a);
      continue;
    }
    const next = argv[i + 1];
    switch (a) {
      case '--target-dir':
      case '--docs-dir':
        args.targetDir = next;
        i++;
        break;
      case '--non-interactive':
        args.nonInteractive = true;
        break;
      case '--overview':
        args.overview = next;
        i++;
        break;
      case '--templates':
        args.templates = next;
        i++;
        break;
      case '--seed-to':
        args.seedTo = next;
        i++;
        break;
      case '--ai-template':
        args.aiTemplate = next;
        i++;
        break;
      case '--seed':
        (args.seed ||= []).push(next);
        i++;
        break;
      case '--no-cache':
        args.noCache = true;
        break;
      case '--list':
        args.list = true;
        break;
      case '--force':
        args.force = true;
        break;
      case '--include':
        (args.include ||= []).push(next);
        i++;
        break;
      case '--on-collision':
        args.onCollision = next;
        i++;
        break;
      case '--dry-run':
        args.dryRun = true;
        break;
      case '--help':
      case '-h':
        args.help = true;
        break;
      default:
        if (a.includes('=')) {
          const [k, v] = a.split('=');
          const key = k.replace(/^--?/, '').replace(/-([a-z])/g, (_, c) => c.toUpperCase());
          args[key] = v;
        } else {
          args[a.replace(/^--?/, '')] = true;
        }
    }
  }
  return args;
}

function help() {
  console.log(`
copilot-rocket - scaffold docs/ai templates into a target repo

Usage:
  npx copilot-rocket init [--target-dir <path>] [--non-interactive]
                          [--overview <path|none>]
                          [--templates default|subset] [--include <name> ...]
                          [--on-collision overwrite|skip|new]
                         [--ai-template <path>] [--no-cache] [--list] [--force]
                          [--dry-run]
`);
}

async function promptFlow(args) {
  const cachePath = path.resolve(process.cwd(), '.cr_init_cache.json');
  const cache = await readJson(cachePath, {});

  // default non-interactive when stdin is not a TTY
  args.nonInteractive = !!args.nonInteractive || !process.stdin.isTTY;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const ask = async (q, def = '') => {
    const suffix = def ? ` [${def}]` : '';
    const ans = await rl.question(`${q}${suffix}: `);
    return ans?.trim() || def;
  };
  const yesNo = async (q, def = true) => {
    const defStr = def ? 'Y/n' : 'y/N';
    const ans = (await rl.question(`${q} (${defStr}): `)).trim().toLowerCase();
    if (!ans) return def;
    return ['y', 'yes'].includes(ans);
  };

  // 1) Target Docs Directory
  // If a positional arg is supplied (project root), prefer creating docs/ai inside it
  let targetDir = args.targetDir || cache.targetDir || 'docs/ai';
  if (!args.targetDir && args._ && args._[1]) {
    const pos = args._[1];
    // if pos doesn't already look like a docs path, treat it as project root
    if (!/\bdocs(\/|\\|$)/.test(pos)) {
      targetDir = path.join(normalize(pos), 'docs', 'ai');
    } else {
      targetDir = normalize(pos);
    }
  }
  if (!args.nonInteractive && !args.targetDir) {
    targetDir = await ask('Where should the docs scaffold be created?', targetDir);
  }
  targetDir = normalize(targetDir);

  // 2) Project Overview Location
  let overview = typeof args.overview === 'string' ? args.overview : (cache.overview ?? '');
  if (!args.nonInteractive && !args.overview) {
    overview = await ask(
      'Where is your project overview file? (path or "none")',
      overview || 'none'
    );
  }
  if (!overview) overview = 'none';
  let overviewPath = null;
  if (overview.toLowerCase() !== 'none') {
    overviewPath = normalize(overview);
    if (!(await exists(overviewPath))) {
      console.log(`⚠️  Overview not found at: ${overviewPath}. It will be treated as "none".`);
      overviewPath = null;
      overview = 'none';
    }
  }

  // 3) Empty Overview Scaffold (if none)
  let createEmptyOverview = false;
  if (overview === 'none' && !args.nonInteractive) {
    createEmptyOverview = await yesNo('Create an empty overview scaffold now?', true);
  } else if (overview === 'none' && args.nonInteractive) {
    createEmptyOverview = true;
  }

  // 4) Template Set Confirmation
  let templateMode = args.templates || 'default'; // default | subset
  const defaultIncludes = ['scope', 'bookends', 'registry'];
  let includes = args.include || cache.includes || defaultIncludes;
  if (!args.nonInteractive) {
    const useDefault = await yesNo('Use the default docs template set from /docs_base?', true);
    if (!useDefault) {
      templateMode = 'subset';
      const raw = await ask(
        'Enter template folders to include (comma-separated)',
        includes.join(',')
      );
      includes = raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    } else {
      templateMode = 'default';
      includes = defaultIncludes;
    }
  } else {
    if (templateMode !== 'subset') includes = defaultIncludes;
  }

  // 5) Placeholder Values
  let populate = false;
  let placeholders = cache.placeholders || {};
  if (!args.nonInteractive) {
    populate = await yesNo('Populate placeholders now? (project name, repo, owner)', false);
  }
  if (populate) {
    placeholders.projectName = await ask(
      'Project Name',
      placeholders.projectName || path.basename(process.cwd())
    );
    placeholders.repoUrl = await ask('Repository URL', placeholders.repoUrl || '');
    placeholders.owner = await ask('Owner/Org', placeholders.owner || '');
    placeholders.description = await ask(
      'Short Description (one-liner)',
      placeholders.description || ''
    );
  }

  // 6) Collision Handling
  const collisionDefault = cache.onCollision || 'skip';
  let onCollision = args.onCollision || collisionDefault;
  if (!args.nonInteractive && !args.onCollision) {
    const choice = await ask('Files exist: choose overwrite | skip | new', onCollision);
    onCollision = ['overwrite', 'skip', 'new'].includes(choice) ? choice : 'skip';
  }

  // 7) Run Mode
  const proceed = args.nonInteractive ? true : await yesNo('Proceed with generation?', true);
  const dryRun = !!args.dryRun || !proceed;

  rl.close();

  const newCache = {
    targetDir: rel(process.cwd(), targetDir),
    overview,
    includes,
    onCollision,
    placeholders,
  };
  if (!args.noCache) {
    try {
      await writeFile(cachePath, JSON.stringify(newCache, null, 2), false);
    } catch (err) {
      console.error('Warning: failed to write cache:', err.message);
    }
  }

  return {
    targetDir,
    overview,
    overviewPath,
    createEmptyOverview,
    templateMode,
    includes,
    placeholders,
    onCollision,
    dryRun,
    list: args.list || false,
    force: args.force || false,
    aiTemplate: args.aiTemplate || null,
    noCache: args.noCache || false,
    seedTo: args.seedTo || 'registry',
    seeds: args.seed || [],
  };
}

// Locate AI instructions template (search common names in /docs_base)
async function findAiTemplate(baseDir) {
  const candidates = [
    '000_ai_instructions.template.md',
    '01-ai_instructions.template.md',
    'ai_instructions.template.md',
  ];
  for (const name of candidates) {
    const p = path.join(baseDir, name);
    if (await exists(p)) return p;
  }
  // fallback scan
  try {
    const entries = await fsp.readdir(baseDir, { withFileTypes: true });
    for (const e of entries) {
      if (!e.isFile()) continue;
      if (
        e.name.toLowerCase().includes('ai') &&
        e.name.toLowerCase().includes('instruction') &&
        e.name.endsWith('.md')
      ) {
        return path.join(baseDir, e.name);
      }
    }
  } catch (err) {
    console.error('Error scanning templates dir:', err.message);
  }
  return null;
}

function applyPlaceholders(text, placeholders) {
  if (!placeholders || Object.keys(placeholders).length === 0) return text;
  return text
    .replaceAll('{{PROJECT_NAME}}', placeholders.projectName ?? '{{PROJECT_NAME}}')
    .replaceAll('{{REPO_URL}}', placeholders.repoUrl ?? '{{REPO_URL}}')
    .replaceAll('{{OWNER}}', placeholders.owner ?? '{{OWNER}}')
    .replaceAll('{{DESCRIPTION}}', placeholders.description ?? '{{DESCRIPTION}}');
}

async function generateIndex({ targetDir, overviewPath, placeholders, dryRun }) {
  const indexPath = path.join(targetDir, 'INDEX.md');
  const overviewLink = overviewPath
    ? rel(path.dirname(indexPath), overviewPath)
    : './PROJECT_OVERVIEW.md';
  const content = `# AI Docs Index

- **Project Overview:** ${overviewPath ? `[Open](${overviewLink})` : '[Open](./PROJECT_OVERVIEW.md)'}
- **Scope Cards:** ./scope/
- **Bookends:** ./bookends/
- **Registry:**
  - Work Ledger: ./registry/work_ledger.yaml
  - Needs Clarification: ./registry/needs_clarification.md
  - Decisions: ./registry/decisions.md

_This index is generated by \`copilot-rocket\`._
`;
  await writeFile(indexPath, applyPlaceholders(content, placeholders), dryRun);
  return indexPath;
}

async function ensureOverview({
  targetDir,
  overviewPath,
  createEmptyOverview,
  placeholders,
  dryRun,
}) {
  if (overviewPath) return overviewPath;
  if (!createEmptyOverview) return null;
  const p = path.join(targetDir, 'PROJECT_OVERVIEW.md');
  const content = `# {{PROJECT_NAME}} — Project Overview

> TODO: Fill in a concise description so your AI copilot has immediate context.

- **Owner/Org:** {{OWNER}}
- **Repository:** {{REPO_URL}}
- **One-liner:** {{DESCRIPTION}}

## Goals
- ...

## Current Status
- ...

`;
  await writeFile(p, applyPlaceholders(content, placeholders), dryRun);
  return p;
}

async function collectFiles(dir, prefix = '') {
  const out = [];
  let entries = [];
  try {
    entries = await fsp.readdir(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === 'samples') continue;
    const p = path.join(dir, e.name);
    const relp = path.join(prefix, e.name);
    if (e.isDirectory()) out.push(...(await collectFiles(p, relp)));
    else out.push({ src: p, rel: relp });
  }
  return out;
}

async function copyTemplates({ targetDir, includes, onCollision, placeholders, dryRun }) {
  const copied = [];
  for (const folder of includes) {
    const srcDir = path.join(DEFAULT_TEMPLATES_DIR, folder);
    if (!(await exists(srcDir))) {
      console.log(`⚠️  Template folder not found: ${rel(process.cwd(), srcDir)} (skipping)`);
      continue;
    }
    const files = await collectFiles(srcDir);
    for (const f of files) {
      const dst = path.join(targetDir, f.rel);
      if (await exists(dst)) {
        if (onCollision === 'skip') {
          console.log(`Skipping existing: ${rel(process.cwd(), dst)}`);
          continue;
        }
        if (onCollision === 'new') {
          const alt = dst + '.new';
          const text = await readText(f.src, '');
          await writeFile(alt, applyPlaceholders(text, placeholders), dryRun);
          copied.push(alt);
          continue;
        }
      }
      const text = await readText(f.src, '');
      await writeFile(dst, applyPlaceholders(text, placeholders), dryRun);
      copied.push(dst);
    }
  }
  return copied;
}

// Copy AI instructions template to repo root as ./ai_instructions.md
async function installAiInstructions({ placeholders, dryRun, aiTemplate, force }) {
  const tpl = aiTemplate ? path.resolve(aiTemplate) : await findAiTemplate(DEFAULT_TEMPLATES_DIR);
  if (!tpl) {
    console.log('⚠️  AI instructions template not found in templates dir. Skipping.');
    return null;
  }
  const text = await readText(tpl, '');
  const outPath = path.resolve(process.cwd(), 'ai_instructions.md');
  const existsAi = await exists(outPath);
  if (existsAi && !force) {
    console.log(
      'AI instructions already exist at',
      outPath,
      '- skipping (use --force to override)'
    );
    return outPath;
  }
  await writeFile(outPath, applyPlaceholders(text, placeholders), dryRun);
  return outPath;
}

// Seed Work Ledger YAML and initial Scope Card
async function seedFromOverview({
  targetDir,
  overviewPath,
  placeholders,
  dryRun,
  seedTo,
  seeds = [],
  force = false,
}) {
  // sanitize placeholders for YAML embedding
  const ph = Object.fromEntries(
    Object.entries(placeholders || {}).map(([k, v]) => [k, String(v).replace(/\"/g, '"')])
  );
  const registryDir = path.join(targetDir, 'registry');
  const ledgerPath = path.join(registryDir, 'work_ledger.yaml');
  const decisionsPath = path.join(registryDir, 'decisions.md');
  const needsPath = path.join(registryDir, 'needs_clarification.md');

  if (!(await exists(ledgerPath))) {
    const yaml = `# Work Ledger
# Append entries at the end. Validate with your repo's schema.
entries:
  - id: init-0001
    when: "${new Date().toISOString()}"
    who: "{{OWNER}}"
    what: "Initialize docs scaffold and AI instructions"
    why: "Bootstrap documentation-driven workflow for copilot usage"
    risk: "Low"
    state: "Done"
    artifacts:
      - "./ai_instructions.md"
      - "${rel(process.cwd(), overviewPath || path.join(targetDir, 'PROJECT_OVERVIEW.md'))}"
      - "./${rel(process.cwd(), path.join(targetDir, 'INDEX.md'))}"
`;
    await writeFile(ledgerPath, applyPlaceholders(yaml, ph), dryRun);
  }

  if (!(await exists(decisionsPath))) {
    const content = `# Decisions
- _No decisions recorded yet. Add entries as decisions are made._
`;
    await writeFile(decisionsPath, content, dryRun);
  }

  if (!(await exists(needsPath))) {
    const content = `# Needs Clarification
- _Log blocking questions here with owners and due dates._
`;
    await writeFile(needsPath, content, dryRun);
  }

  // handle seed sample files (from docs_base/samples)
  try {
    const samplesDir = path.join(DEFAULT_TEMPLATES_DIR, 'samples');
    for (const s of seeds || []) {
      const sampleFile = s === 'ledger' ? 'work_ledger.yaml' : 'user-decisions-registry.yaml';
      const src = path.join(samplesDir, sampleFile);
      if (!(await exists(src))) continue;
      const dst =
        seedTo === 'registry'
          ? path.join(registryDir, sampleFile)
          : path.join(targetDir, sampleFile);
      if ((await exists(dst)) && !force) {
        console.log('Skipping seed, exists:', rel(process.cwd(), dst));
        continue;
      }
      const text = await readText(src, '');
      await writeFile(dst, applyPlaceholders(text, placeholders), dryRun);
      console.log(`Seeded ${s} -> ${rel(process.cwd(), dst)}`);
    }
  } catch (err) {
    console.error('Warning: seeding failed:', err.message);
  }

  const scopeDir = path.join(targetDir, 'scope');
  await mkdirp(scopeDir);
  const scopePath = path.join(scopeDir, 'SCOPE_INIT.md');
  const scope = `# Scope Card — Initialize Docs

## Goal
Scaffold docs from /docs_base, install AI instructions, and seed ledger.

## Artifacts (rooted)
- ./ai_instructions.md
- ./${rel(process.cwd(), path.join(targetDir, 'INDEX.md'))}
- ./${rel(process.cwd(), overviewPath || path.join(targetDir, 'PROJECT_OVERVIEW.md'))}

## Definition of Done
- Files generated and linked in INDEX
- Work ledger seeded with init entry
- Scope card committed
- Validation passes (if configured)

## Out-of-Scope
- Code changes beyond docs scaffolding
`;
  await writeFile(scopePath, scope, dryRun);

  return { ledgerPath, scopePath };
}

async function writeReceipt({ targetDir, overviewPath, includes, onCollision, aiPath, dryRun }) {
  const metaDir = path.join(targetDir, '_meta');
  const receiptPath = path.join(metaDir, 'init_receipt.json');
  const payload = {
    version: 2,
    createdAt: new Date().toISOString(),
    targetDir,
    overviewPath,
    includes,
    onCollision,
    aiInstructions: aiPath || null,
  };
  await writeFile(receiptPath, JSON.stringify(payload, null, 2), dryRun);
  return receiptPath;
}

async function initCmd(args) {
  const plan = await promptFlow(args);

  console.log('\nPlan Summary');
  console.log('------------');
  console.log('Templates dir :', rel(process.cwd(), DEFAULT_TEMPLATES_DIR));
  console.log('Target dir    :', rel(process.cwd(), plan.targetDir));
  console.log(
    'Overview      :',
    plan.overviewPath ? rel(process.cwd(), plan.overviewPath) : '(none)'
  );
  console.log('Create empty  :', plan.createEmptyOverview);
  console.log('Includes      :', plan.includes.join(', '));
  console.log('On collision  :', plan.onCollision);
  console.log('Dry run       :', plan.dryRun);
  console.log('');

  if (!plan.dryRun) await mkdirp(plan.targetDir);

  const finalOverview = await ensureOverview(plan);

  if (plan.list) {
    const planned = [];
    for (const folder of plan.includes) {
      const srcDir = path.join(DEFAULT_TEMPLATES_DIR, folder);
      const files = await collectFiles(srcDir);
      for (const f of files) planned.push(path.join(plan.targetDir, f.rel));
    }
    console.log('Planned files:');
    for (const p of planned) console.log(' -', rel(process.cwd(), p));
    return;
  }

  const written = await copyTemplates(plan);

  const indexPath = await generateIndex({
    targetDir: plan.targetDir,
    overviewPath: finalOverview,
    placeholders: plan.placeholders,
    dryRun: plan.dryRun,
  });

  const aiPath = await installAiInstructions({
    placeholders: plan.placeholders,
    dryRun: plan.dryRun,
    aiTemplate: plan.aiTemplate,
    force: plan.force,
  });

  const seeded = await seedFromOverview({
    targetDir: plan.targetDir,
    overviewPath: finalOverview,
    placeholders: plan.placeholders,
    dryRun: plan.dryRun,
    seedTo: plan.seedTo,
  });

  const receiptPath = await writeReceipt({
    targetDir: plan.targetDir,
    overviewPath: finalOverview,
    includes: plan.includes,
    onCollision: plan.onCollision,
    aiPath,
    dryRun: plan.dryRun,
  });

  console.log('Completed.\n');
  console.log('Index   :', rel(process.cwd(), indexPath));
  if (finalOverview) console.log('Overview:', rel(process.cwd(), finalOverview));
  if (aiPath) console.log('AI Instr:', rel(process.cwd(), aiPath));
  if (seeded?.ledgerPath) console.log('Ledger  :', rel(process.cwd(), seeded.ledgerPath));
  if (seeded?.scopePath) console.log('Scope   :', rel(process.cwd(), seeded.scopePath));
  console.log('Receipt :', rel(process.cwd(), receiptPath));
  if (written.length)
    console.log(`Files ${plan.dryRun ? 'to be written' : 'written'}: ${written.length}`);
}

async function main() {
  const args = parseArgs(process.argv);
  const cmd = args._[0];
  if (args.help || !cmd) {
    help();
    if (!cmd) return;
  }
  switch (cmd) {
    case 'init':
      await initCmd(args);
      break;
    default:
      help();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
