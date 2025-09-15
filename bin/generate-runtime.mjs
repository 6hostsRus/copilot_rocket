#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const DOCS_BASE = path.join(ROOT, 'docs_base');
const REGISTRY = path.join(DOCS_BASE, 'registries', 'runtime.yaml');
const OUT = path.join(ROOT, '.github');
const BANNER = '<!-- GENERATED from docs_base; DO NOT EDIT IN .github -->\n';

function ensureDir(p){ fs.mkdirSync(p, { recursive: true }); }
function read(p){ return fs.readFileSync(p, 'utf8'); }
function write(p,c){ ensureDir(path.dirname(p)); fs.writeFileSync(p,c); }

function main(){
  if (!fs.existsSync(REGISTRY)){ console.error('No registry found'); process.exit(1); }
  const text = read(REGISTRY);
  const items = text.split(/\n/).filter(l => l.includes('source:'));
  for (const line of items){
    const parts = line.trim().split(/\s+/);
    const src = parts[1]; const tgt = parts[3];
    const srcPath = path.join(DOCS_BASE, src);
    const dstPath = path.join(OUT, tgt);
    const content = BANNER + read(srcPath);
    write(dstPath, content);
    console.log('Generated', dstPath);
  }
  write(path.join(OUT,'registry.json'), JSON.stringify({ok:true},null,2));
}
main();
