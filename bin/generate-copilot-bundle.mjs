#!/usr/bin/env node
import Ajv from 'ajv';
import Mustache from 'mustache';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import YAML from 'yaml';

function deepMerge(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return Array.from(new Set([...a, ...b]));
  if (typeof a === 'object' && typeof b === 'object' && a && b) {
    const out = { ...a };
    for (const k of Object.keys(b)) out[k] = k in out ? deepMerge(out[k], b[k]) : b[k];
    return out;
  }
  return b;
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function readJsonMaybe(p) {
  try {
    return JSON.parse(await fsp.readFile(p, 'utf8'));
  } catch {
    return {};
  }
}

function injectFrontMatter(meta, body) {
  if (!meta || !Object.keys(meta).length) return body;
  const lines = ['---'];
  for (const [k, v] of Object.entries(meta)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.map((x) => JSON.stringify(x)).join(', ')}]`);
    else if (typeof v === 'object') lines.push(`${k}: ${JSON.stringify(v)}`);
    else lines.push(`${k}: ${v}`);
  }
  lines.push('---');
  return `${lines.join('\n')}\n${body}`;
}

async function pickSnippet(snippetRoots, relPath) {
  for (const root of snippetRoots) {
    const p = path.resolve(root, relPath);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function renderString(str, vars) {
  return Mustache.render(String(str), vars || {});
}

async function writeGithubSection(root, cfg, options = { dryRun: false }) {
  const ghDir = path.resolve(root, cfg.targets.githubDir);
  if (!options.dryRun) await ensureDir(ghDir);
  const written = [];

  const writeItem = async (item) => {
    const src = await pickSnippet(cfg.snippetRoots, item.from);
    if (!src) throw new Error(`Snippet not found: ${item.from}`);
    let body = await fsp.readFile(src, 'utf8');
    body = renderString(body, cfg.vars);
    const metaRaw = item.meta
      ? JSON.parse(renderString(JSON.stringify(item.meta), cfg.vars))
      : null;
    if (metaRaw) body = injectFrontMatter(metaRaw, body);
    const outPath = path.resolve(ghDir, item.to);
    if (!options.dryRun) {
      await ensureDir(path.dirname(outPath));
      await fsp.writeFile(outPath, body, 'utf8');
    }
    written.push(outPath);
  };

  for (const it of cfg.github?.repowide || []) await writeItem(it);
  for (const it of cfg.github?.instructions || []) await writeItem(it);
  for (const it of cfg.github?.prompts || []) await writeItem(it);
  for (const it of cfg.github?.chatmodes || []) await writeItem(it);
  return written;
}

async function writeVscodeSettings(root, cfg, options = { dryRun: false }) {
  const vsDir = path.resolve(root, cfg.targets.vscodeDir);
  if (cfg.vscode?.createIfMissing && !options.dryRun) await ensureDir(vsDir);
  const settingsPath = path.resolve(vsDir, 'settings.json');
  const existing = fs.existsSync(settingsPath) ? await readJsonMaybe(settingsPath) : {};
  const desired = cfg.vscode?.settings || {};
  const merged = deepMerge(existing, desired);
  if (!options.dryRun)
    await fsp.writeFile(settingsPath, JSON.stringify(merged, null, 2) + '\n', 'utf8');
  return { path: settingsPath, merged };
}

async function askInteractive(baseCfg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = {};
  ans.repoRoot =
    (await rl.question(`Target repo root [${baseCfg?.targets?.repoRoot || '.'}]: `)) ||
    baseCfg?.targets?.repoRoot ||
    '.';
  ans.project_name =
    (await rl.question(`Project name [${baseCfg?.vars?.project_name || 'my-project'}]: `)) ||
    baseCfg?.vars?.project_name ||
    'my-project';
  ans.tone =
    (await rl.question(`Default tone [${baseCfg?.defaults?.tone || 'concise'}]: `)) ||
    baseCfg?.defaults?.tone ||
    'concise';
  rl.close();
  baseCfg.vars = { ...(baseCfg.vars || {}), project_name: ans.project_name, tone: ans.tone };
  baseCfg.targets = { ...(baseCfg.targets || {}), repoRoot: ans.repoRoot };
  return baseCfg;
}

async function loadConfig(configPath) {
  const raw = await fsp.readFile(configPath, 'utf8');
  // YAML parser supports anchors, comments, etc.
  const cfg = YAML.parse(raw);

  // If a schema exists in the repo, validate against it to fail fast on invalid configs.
  try {
    const schemaPath = path.resolve(process.cwd(), 'schemas/copilot-bundle.schema.json');
    if (fs.existsSync(schemaPath)) {
      const schemaRaw = await fsp.readFile(schemaPath, 'utf8');
      const schema = JSON.parse(schemaRaw);
      const ajv = new Ajv({ allErrors: true, strict: false });
      const validate = ajv.compile(schema);
      const valid = validate(cfg);
      if (!valid) {
        const errText = ajv.errorsText(validate.errors, { separator: '\n' });
        throw new Error(`copilot-bundle.yaml validation failed:\n${errText}`);
      }
    }
  } catch (err) {
    // rethrow validation errors, but don't fail if schema is malformed
    if (err.message && err.message.startsWith('copilot-bundle.yaml validation failed')) throw err;
    // If something else went wrong reading or parsing schema, warn and continue.
    console.warn('⚠️  Warning validating config schema:', err.message || err);
  }

  return cfg;
}

async function main() {
  const args = new Map(
    process.argv.slice(2).flatMap((a) => {
      const m = a.match(/^--([^=]+)(?:=(.*))?$/);
      return m ? [[m[1], m[2] ?? true]] : [];
    })
  );
  const configPath = args.get('config') || 'docs_base/registries/copilot-bundle.yaml';
  const interactive = !!args.get('interactive');
  const dryRun = !!args.get('dry-run') || !!args.get('dryrun');
  const jsonOut = !!args.get('json') || !!args.get('json-output');
  const repoRootFlag = args.get('repoRoot') || args.get('repo-root');
  const snippetRootsFlag = args.get('snippetRoots');

  let cfg = await loadConfig(configPath);
  if (interactive) cfg = await askInteractive(cfg);

  // Allow overriding repo root from CLI for CI usage
  const repoRoot = path.resolve(repoRootFlag || cfg.targets?.repoRoot || '.');

  // Normalize snippet roots relative to repo or CLI-provided value
  cfg.snippetRoots = (
    snippetRootsFlag ? String(snippetRootsFlag).split(',') : cfg.snippetRoots || []
  ).map((p) => path.resolve(repoRoot, p));

  const written = await writeGithubSection(repoRoot, cfg, { dryRun });
  const vs = await writeVscodeSettings(repoRoot, cfg, { dryRun });

  const output = {
    dryRun: !!dryRun,
    github: { files: written },
    vscode: { settingsPath: vs.path, merged: vs.merged },
  };

  if (jsonOut) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(
      `✅ Copilot bundle ${dryRun ? '(dry-run) ' : ''}generated:\n- .github/* wired from snippet roots (${written.length} files)\n- .vscode/settings.json ${dryRun ? 'previewed' : 'merged'} at ${vs.path}`
    );
  }
}

// If executed directly, run main
if (process.argv[1] && process.argv[1].endsWith('generate-copilot-bundle.mjs')) {
  main().catch((err) => {
    console.error('❌ generate-copilot-bundle failed:', err);
    process.exit(1);
  });
}

// exports for testing
export {
  deepMerge,
  injectFrontMatter,
  loadConfig,
  pickSnippet,
  renderString,
  writeGithubSection,
  writeVscodeSettings,
};
