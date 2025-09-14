#!/usr/bin/env node
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import Mustache from "mustache";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function deepMerge(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) return Array.from(new Set([...a, ...b]));
  if (typeof a === "object" && typeof b === "object" && a && b) {
    const out = { ...a };
    for (const k of Object.keys(b)) out[k] = k in out ? deepMerge(out[k], b[k]) : b[k];
    return out;
  }
  return b;
}

async function ensureDir(p){ await fsp.mkdir(p, { recursive: true }); }

async function readJsonMaybe(p){
  try { return JSON.parse(await fsp.readFile(p, "utf8")); } catch { return {}; }
}

function injectFrontMatter(meta, body) {
  if (!meta || !Object.keys(meta).length) return body;
  const lines = ["---"];
  for (const [k,v] of Object.entries(meta)) {
    if (Array.isArray(v)) lines.push(`${k}: [${v.map(x=>JSON.stringify(x)).join(", ")}]`);
    else if (typeof v === "object") lines.push(`${k}: ${JSON.stringify(v)}`);
    else lines.push(`${k}: ${v}`);
  }
  lines.push("---");
  return `${lines.join("\n")}\n${body}`;
}

async function pickSnippet(snippetRoots, relPath) {
  for (const root of snippetRoots) {
    const p = path.resolve(root, relPath);
    if (fs.existsSync(p)) return p;
  }
  return null;
}

async function renderString(str, vars) {
  return Mustache.render(String(str), vars || {});
}

async function writeGithubSection(root, cfg) {
  const ghDir = path.resolve(root, cfg.targets.githubDir);
  await ensureDir(ghDir);

  const writeItem = async (item) => {
    const src = await pickSnippet(cfg.snippetRoots, item.from);
    if (!src) throw new Error(`Snippet not found: ${item.from}`);
    let body = await fsp.readFile(src, "utf8");
    body = await renderString(body, cfg.vars);
    const metaRaw = item.meta ? JSON.parse(await renderString(JSON.stringify(item.meta), cfg.vars)) : null;
    if (metaRaw) body = injectFrontMatter(metaRaw, body);
    const outPath = path.resolve(ghDir, item.to);
    await ensureDir(path.dirname(outPath));
    await fsp.writeFile(outPath, body, "utf8");
  };

  for (const it of (cfg.github?.repowide || [])) await writeItem(it);
  for (const it of (cfg.github?.instructions || [])) await writeItem(it);
  for (const it of (cfg.github?.prompts || [])) await writeItem(it);
  for (const it of (cfg.github?.chatmodes || [])) await writeItem(it);
}

async function writeVscodeSettings(root, cfg) {
  const vsDir = path.resolve(root, cfg.targets.vscodeDir);
  if (cfg.vscode?.createIfMissing) await ensureDir(vsDir);
  const settingsPath = path.resolve(vsDir, "settings.json");
  const existing = fs.existsSync(settingsPath) ? await readJsonMaybe(settingsPath) : {};
  const desired = cfg.vscode?.settings || {};
  const merged = deepMerge(existing, desired);
  await fsp.writeFile(settingsPath, JSON.stringify(merged, null, 2) + "\n", "utf8");
}

async function askInteractive(baseCfg) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ans = {};
  ans.repoRoot = (await rl.question(`Target repo root [${baseCfg?.targets?.repoRoot || "."}]: `)) || baseCfg?.targets?.repoRoot || ".";
  ans.project_name = (await rl.question(`Project name [${baseCfg?.vars?.project_name || "my-project"}]: `)) || baseCfg?.vars?.project_name || "my-project";
  ans.tone = (await rl.question(`Default tone [${baseCfg?.defaults?.tone || "concise"}]: `)) || baseCfg?.defaults?.tone || "concise";
  rl.close();
  baseCfg.vars = { ...(baseCfg.vars||{}), project_name: ans.project_name, tone: ans.tone };
  baseCfg.targets = { ...(baseCfg.targets||{}), repoRoot: ans.repoRoot };
  return baseCfg;
}

async function loadConfig(configPath) {
  const raw = await fsp.readFile(configPath, "utf8");
  // YAML parser supports anchors, comments, etc.
  return YAML.parse(raw);
}

async function main() {
  const args = new Map(process.argv.slice(2).flatMap(a => {
    const m = a.match(/^--([^=]+)(?:=(.*))?$/); return m ? [[m[1], m[2] ?? true]] : [];
  }));
  const configPath = args.get("config") || "docs_base/registries/copilot-bundle.yaml";
  const interactive = !!args.get("interactive");
  let cfg = await loadConfig(configPath);
  if (interactive) cfg = await askInteractive(cfg);

  // Normalize snippet roots relative to repo
  const repoRoot = path.resolve(cfg.targets?.repoRoot || ".");
  cfg.snippetRoots = (cfg.snippetRoots || []).map(p => path.resolve(repoRoot, p));

  await writeGithubSection(repoRoot, cfg);
  await writeVscodeSettings(repoRoot, cfg);

  console.log(`✅ Copilot bundle generated:
- .github/* wired from snippet roots
- .vscode/settings.json merged`);
}

main().catch(err => {
  console.error("❌ generate-copilot-bundle failed:", err);
  process.exit(1);
});
