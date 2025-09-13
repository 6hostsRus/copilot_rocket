#!/usr/bin/env node
/**
 * docs-base-scaffold
 * Minimal CLI to scaffold docs_base templates into a target repo.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function copy(src, dst) {
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

function scaffold(targetDir) {
  const tplDir = path.join(__dirname, "..", "docs_base");
  const files = fs.readdirSync(tplDir);
  for (const name of files) {
    const src = path.join(tplDir, name);
    const dst = path.join(targetDir, "docs_base", name);
    copy(src, dst);
  }
  console.log(`Scaffolded docs_base into ${path.join(targetDir, "docs_base")}`);
}

function usage() {
  console.log(`Usage:
  docs-base-scaffold init [targetDir=.]
  `);
}

const [, , cmd, maybeDir] = process.argv;
const target = path.resolve(process.cwd(), maybeDir || ".");

switch (cmd) {
  case "init":
    scaffold(target);
    break;
  default:
    usage();
    process.exit(cmd ? 1 : 0);
}
