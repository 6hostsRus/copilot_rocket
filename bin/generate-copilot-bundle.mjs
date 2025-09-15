#!/usr/bin/env node
import Ajv from 'ajv';
import Mustache from 'mustache';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import YAML from 'yaml';

const BANNER = '<!-- GENERATED from docs_library; DO NOT EDIT IN .github -->\n';

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
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

// Deep merge src into target (mutates and returns target)
function deepMerge(target, src) {
  if (!src) return target;
  for (const k of Object.keys(src)) {
    const srcVal = src[k];
    const tgtVal = target[k];
    if (Array.isArray(srcVal)) {
      target[k] = srcVal.slice();
    } else if (srcVal && typeof srcVal === 'object') {
      target[k] = deepMerge(tgtVal && typeof tgtVal === 'object' ? { ...tgtVal } : {}, srcVal);
    } else {
      target[k] = srcVal;
    }
  }
  return target;
}

// Recursively render all string values in an object/array using Mustache and vars
function renderObject(obj, vars) {
  if (obj == null) return obj;
  if (typeof obj === 'string') return renderString(obj, vars);
  if (Array.isArray(obj)) return obj.map((v) => renderObject(v, vars));
  if (typeof obj === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(obj)) {
      out[k] = renderObject(v, vars);
    }
    return out;
  }
  return obj;
}

async function writeGithubSection(root, cfg, options = { dryRun: false }) {
  const ghDir = path.resolve(root, cfg.targets.githubDir);
  if (!options.dryRun) await ensureDir(ghDir);
  const written = [];

  const writeItem = async (item) => {
    const src = await pickSnippet(cfg.snippetRoots, item.from);
    let body = '';
    if (!src) {
      if (options.dryRun) {
        console.warn(`⚠️  snippet not found (dry-run): ${item.from}`);
        body = `<!-- MISSING SNIPPET (dry-run): ${item.from} -->\n`;
      } else {
        throw new Error(`Snippet not found: ${item.from}`);
      }
    } else {
      body = await fsp.readFile(src, 'utf8');
    }
    body = renderString(body, cfg.vars);
    const metaRaw = item.meta
      ? JSON.parse(renderString(JSON.stringify(item.meta), cfg.vars))
      : null;
    if (metaRaw) body = injectFrontMatter(metaRaw, body);
    body = BANNER + body;
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
  // Parse CLI args supporting both `--flag=value` and `--flag value` forms
  const argv = process.argv.slice(2);
  const args = new Map();
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const m = a.match(/^--([^=]+)(?:=(.*))?$/);
    if (m) {
      const key = m[1];
      if (m[2] !== undefined) {
        args.set(key, m[2]);
      } else {
        // If next arg exists and isn't a flag, consume it as the value
        const next = argv[i + 1];
        if (next && !next.startsWith('--')) {
          args.set(key, next);
          i++;
        } else {
          args.set(key, true);
        }
      }
    }
  }
  const configPath = args.get('config') || 'docs_library/registries/runtime.yaml';
  const varsFileFlag = args.get('vars-file') || args.get('varsFile');
  const varsInlineFlag = args.get('vars');
  const interactive = !!args.get('interactive');
  const dryRun = !!args.get('dry-run') || !!args.get('dryrun');
  const jsonOut = !!args.get('json') || !!args.get('json-output');
  const repoRootFlag = args.get('repoRoot') || args.get('repo-root');
  const snippetRootsFlag = args.get('snippetRoots');

  let cfg = await loadConfig(configPath);
  if (interactive) cfg = await askInteractive(cfg);

  // Allow overriding repo root from CLI for CI usage
  const repoRoot = path.resolve(repoRootFlag || cfg.targets?.repoRoot || '.');

  // Load variables from file or inline flag and merge with defaults
  let varsFromFile = null;
  let varsInline = null;
  if (varsFileFlag) {
    try {
      const varsPath = path.resolve(repoRoot, String(varsFileFlag));
      if (fs.existsSync(varsPath)) {
        const raw = await fsp.readFile(varsPath, 'utf8');
        varsFromFile = YAML.parse(raw);
      } else {
        throw new Error(`vars file not found: ${varsPath}`);
      }
    } catch (err) {
      throw new Error(`failed to load vars file: ${err.message || err}`);
    }
  }
  if (varsInlineFlag) {
    try {
      // Try JSON first, then YAML
      try {
        varsInline = JSON.parse(String(varsInlineFlag));
      } catch (_) {
        varsInline = YAML.parse(String(varsInlineFlag));
      }
    } catch (err) {
      throw new Error(`failed to parse --vars: ${err.message || err}`);
    }
  }

  // Merge precedence: defaults <- cfg.vars <- varsFromFile <- varsInline
  const mergedVars = deepMerge(
    deepMerge({ ...(cfg.defaults || {}) }, cfg.vars || {}),
    deepMerge(varsFromFile || {}, varsInline || {})
  );

  // Ensure cfg.vars is set to the merged result for downstream rendering
  cfg.vars = mergedVars;

  // Render template placeholders across the entire config using merged vars
  cfg = renderObject(cfg, mergedVars);

  // Normalize snippet roots relative to repo or CLI-provided value
  cfg.snippetRoots = (
    snippetRootsFlag ? String(snippetRootsFlag).split(',') : cfg.snippetRoots || []
  ).map((p) => path.resolve(repoRoot, p));

  const written = await writeGithubSection(repoRoot, cfg, { dryRun });

  const output = {
    dryRun: !!dryRun,
    github: { files: written },
  };

  if (jsonOut) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(
      `✅ Copilot bundle ${dryRun ? '(dry-run) ' : ''}generated:\n- .github/* wired from snippet roots (${written.length} files)`
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
export { injectFrontMatter, loadConfig, pickSnippet, renderString, writeGithubSection };
