#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import Ajv from 'ajv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function loadSchema(name) {
  return JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'schemas', name), 'utf8'));
}

function readYaml(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return yaml.load(raw);
}

async function main() {
  const root = path.resolve(process.cwd());
  const ajv = new Ajv({ allErrors: true, strict: false });

  const ledgerSchema = loadSchema('work_ledger.schema.json');
  const registrySchema = loadSchema('user-decisions-registry.schema.json');

  const ledgerFiles = [];
  const registryFiles = [];

  // simple search for likely filenames
  const walk = (dir) => {
    for (const name of fs.readdirSync(dir)) {
      const full = path.join(dir, name);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        walk(full);
      } else if (stat.isFile()) {
        const base = path.basename(full).toLowerCase();
        if (
          base === 'work_ledger.yaml' ||
          base === 'work_ledger.yml' ||
          base === 'work_ledger.json'
        )
          ledgerFiles.push(full);
        if (
          base === 'user-decisions-registry.yaml' ||
          base === 'user-decisions-registry.yml' ||
          base === 'user-decisions-registry.json'
        )
          registryFiles.push(full);
      }
    }
  };

  walk(root);

  let ok = true;

  const validateAndReport = (schema, files, label) => {
    const v = ajv.compile(schema);
    for (const f of files) {
      try {
        const data = readYaml(f);
        const valid = v(data);
        if (!valid) {
          ok = false;
          console.error(`Validation errors in ${path.relative(root, f)}:`);
          for (const e of v.errors || []) console.error(' ', e.instancePath, e.message);
        } else {
          console.log(`OK: ${path.relative(root, f)} (${label})`);
        }
      } catch (e) {
        ok = false;
        console.error(`Failed to read/parse ${f}: ${e.message || e}`);
      }
    }
  };

  validateAndReport(ledgerSchema, ledgerFiles, 'work_ledger');
  validateAndReport(registrySchema, registryFiles, 'user-decisions-registry');

  if (!ledgerFiles.length) {
    console.log('No work_ledger files found to validate.');
  }
  if (!registryFiles.length) {
    console.log('No user-decisions-registry files found to validate.');
  }

  if (!ok) process.exit(2);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
