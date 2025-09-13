#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import archiver from 'archiver';
import ignore from 'ignore';

function readGitignore(root) {
  const gitignorePath = path.join(root, '.gitignore');
  if (!fs.existsSync(gitignorePath)) return null;
  const content = fs.readFileSync(gitignorePath, 'utf8');
  return ignore().add(content);
}

function listFiles(root, ig) {
  const out = [];
  function walk(dir) {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const rel = path.relative(root, full);
      if (rel === '') continue;
      if (ig && ig.ignores(rel)) continue;
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        if (rel.startsWith('tools/dist')) continue;
        walk(full);
      } else if (stat.isFile()) {
        out.push(rel);
      }
    }
  }
  walk(root);
  return out;
}

async function createZip(root, files, outPath) {
  await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
  const output = fs.createWriteStream(outPath);
  const archive = archiver('zip', { zlib: { level: 9 } });

  return new Promise((resolve, reject) => {
    output.on('close', () => resolve(archive.pointer()));
    archive.on('error', reject);
    archive.pipe(output);
    for (const f of files) {
      archive.file(path.join(root, f), { name: f });
    }
    archive.finalize();
  });
}

async function main() {
  const root = path.resolve(process.cwd());
  // parse a simple flag --out-root or -r to write the bundle to project root
  const args = process.argv.slice(2);
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`package-bundle - create a zip of the project excluding .gitignore patterns

Usage:
  package-bundle [outZip=project_bundle.zip] [--out-root|-r]
  package-bundle --help

Flags:
  --out-root, -r   Write the bundle to the repo root instead of tools/dist
  --help, -h       Show this help
`);
    return;
  }

  const outZip = args.find((a) => !a.startsWith('-')) || 'project_bundle.zip';
  const outRoot = args.includes('--out-root') || args.includes('-r');
  const distDir = outRoot ? '.' : path.join('tools', 'dist');
  const outPath = path.join(distDir, outZip);

  const ig = readGitignore(root);
  const files = listFiles(root, ig);

  // ensure some always-included files
  if (!files.includes('tools/package_bundle.sh')) files.push('tools/package_bundle.sh');
  if (!files.includes('tools/README.md')) files.push('tools/README.md');

  console.log('Creating bundle:', outPath);
  await createZip(root, files, outPath);
  console.log('Bundle created:', outPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
