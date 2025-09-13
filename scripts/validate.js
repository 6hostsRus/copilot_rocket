#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import Ajv from 'ajv';
import fg from 'fast-glob';

function parseArgs() {
  const result = {};
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--config' && argv[i + 1]) {
      result.config = argv[++i];
    } else if (a === '--work-schema' && argv[i + 1]) {
      result.workSchema = argv[++i];
    } else if (a === '--decisions-schema' && argv[i + 1]) {
      result.decisionsSchema = argv[++i];
    } else if (a === '--work-files' && argv[i + 1]) {
      result.workFiles = argv[++i];
    } else if (a === '--decisions-files' && argv[i + 1]) {
      result.decisionsFiles = argv[++i];
    }
  }
  return result;
}

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

  const args = parseArgs();

  // load config if available
  let config = {};
  const cfgPaths = [
    path.join(root, 'rocket.config.json'),
    path.join(root, 'rocket.config.yaml'),
    path.join(root, 'rocket.config.yml')
  ];
  if (args.config) cfgPaths.unshift(path.resolve(root, args.config));
  for (const p of cfgPaths) {
    if (fs.existsSync(p)) {
      try {
        const raw = fs.readFileSync(p, 'utf8');
        config = p.endsWith('.json') ? JSON.parse(raw) : yaml.load(raw);
        console.log('Loaded config from', path.relative(root, p));
        break;
      } catch (e) {
        console.error('Failed to parse config', p, e.message || e);
      }
    }
  }

  // precedence: CLI args > config file > defaults
  const workSchemaPath = args.workSchema || (config.schemas && config.schemas.work_ledger) || path.join(__dirname, '..', 'schemas', 'work_ledger.schema.json');
  const decisionsSchemaPath = args.decisionsSchema || (config.schemas && config.schemas.user_decisions) || path.join(__dirname, '..', 'schemas', 'user-decisions-registry.schema.json');

  const workGlobs = (args.workFiles && [args.workFiles]) || (config.files && config.files.work_ledger) || ['**/work_ledger.{yml,yaml,json}'];
  const decisionsGlobs = (args.decisionsFiles && [args.decisionsFiles]) || (config.files && config.files.user_decisions) || ['**/user-decisions-registry.{yml,yaml,json}'];

  const ledgerSchema = JSON.parse(fs.readFileSync(path.resolve(root, workSchemaPath), 'utf8'));
  const registrySchema = JSON.parse(fs.readFileSync(path.resolve(root, decisionsSchemaPath), 'utf8'));

  // expand globs
  const ledgerFiles = await fg(workGlobs, { cwd: root, absolute: true, dot: true });
  const registryFiles = await fg(decisionsGlobs, { cwd: root, absolute: true, dot: true });

  let ok = true;
  let ledgerCount = 0;
  let registryCount = 0;

  const validateAndReport = (schema, files, label) => {
    const v = ajv.compile(schema);
    for (const f of files) {
      try {
        const raw = fs.readFileSync(f, 'utf8');
        const data = yaml.load(raw);
        // if YAML contains $schema pointer, try to load that schema instead
        if (data && typeof data === 'object' && data.$schema) {
          try {
            const custom = JSON.parse(fs.readFileSync(path.resolve(path.dirname(f), data.$schema), 'utf8'));
            console.log('Using custom $schema for', path.relative(root, f));
            const vc = ajv.compile(custom);
            const validc = vc(data);
            if (!validc) {
              ok = false;
              console.error(`Validation errors in ${path.relative(root, f)}:`);
              for (const e of vc.errors || []) console.error(' ', e.instancePath, e.message);
              continue;
            }
          } catch (e) {
            ok = false;
            console.error(`Failed to load custom $schema for ${f}: ${e.message || e}`);
            continue;
          }
        }
        const valid = v(data);
        if (!valid) {
          ok = false;
          console.error(`Validation errors in ${path.relative(root, f)}:`);
          for (const e of v.errors || []) console.error(' ', e.instancePath, e.message);
        } else {
          console.log(`OK: ${path.relative(root, f)} (${label})`);
          if (label === 'work_ledger') ledgerCount++;
          if (label === 'user-decisions-registry') registryCount++;
        }
      } catch (e) {
        ok = false;
        console.error(`Failed to read/parse ${f}: ${e.message || e}`);
      }
    }
  };

  validateAndReport(ledgerSchema, ledgerFiles, 'work_ledger');
  validateAndReport(registrySchema, registryFiles, 'user-decisions-registry');

  console.log(`Summary: work_ledger files validated: ${ledgerCount}, user_decisions files validated: ${registryCount}`);

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
