const fs = require('fs');
const path = require('path');

// Candidate extension directories to scan for package.json contributions
const home = process.env.HOME || process.env.USERPROFILE;
const candidateDirs = [
  path.join(home, '.vscode', 'extensions'),
  path.join(home, '.vscode-insiders', 'extensions'),
  '/Applications/Visual Studio Code.app/Contents/Resources/app/extensions',
  '/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/extensions',
];

async function exists(p) {
  try {
    await fs.promises.access(p);
    return true;
  } catch {
    return false;
  }
}

async function* walk(dir) {
  try {
    for (const name of await fs.promises.readdir(dir)) {
      const full = path.join(dir, name);
      const stat = await fs.promises.stat(full);
      if (stat.isDirectory()) {
        yield* walk(full);
      } else {
        yield full;
      }
    }
  } catch {}
}

// Build a nested metadata tree for dotted keys like github.copilot.chat.searchScope
function setMetaNested(root, keyPath, meta) {
  const parts = keyPath.split('.');
  let cur = root;
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    cur[p] = cur[p] || { __children: {}, __meta: null };
    if (i === parts.length - 1) {
      cur[p].__meta = Object.assign({}, cur[p].__meta || {}, meta || {});
    }
    cur = cur[p].__children;
  }
}

function placeholderForMeta(meta) {
  if (!meta) return null;
  if (meta.hasOwnProperty('default')) return meta.default;
  const t = meta.type || (meta.schema && meta.schema.type);
  if (Array.isArray(t)) return [];
  switch (t) {
    case 'boolean':
      return false;
    case 'number':
    case 'integer':
      return 0;
    case 'array':
      return [];
    case 'object':
      return {};
    default:
      return '';
  }
}

function quoteString(val) {
  return JSON.stringify(val);
}

function generateJsonCFromTree(tree) {
  const lines = [];
  lines.push('// Generated sample Copilot settings (JSON with comments).');
  lines.push('// Copy the keys you want into your settings.json and edit the values.');
  lines.push('');

  function writeObject(node, indent) {
    const keys = Object.keys(node).sort();
    lines.push(indent + '{');
    keys.forEach((key, idx) => {
      const item = node[key];
      const meta = item && item.__meta;
      const children = item && item.__children ? item.__children : {};

      // Comments from metadata
      if (meta) {
        const desc = (meta.description || meta.title || '').trim();
        if (desc) {
          for (const l of desc.split('\n')) lines.push(indent + '  // ' + l.trim());
        }
        const typeInfo = [];
        if (meta.type)
          typeInfo.push(`type: ${Array.isArray(meta.type) ? meta.type.join('|') : meta.type}`);
        if (meta.default !== undefined) typeInfo.push(`default: ${JSON.stringify(meta.default)}`);
        if (typeInfo.length) lines.push(indent + '  // ' + typeInfo.join(', '));
      }

      const isLeaf = Object.keys(children).length === 0 && !!meta;
      const comma = idx === keys.length - 1 ? '' : ',';

      if (isLeaf) {
        const val = placeholderForMeta(meta);
        let printed;
        if (val === undefined) {
          printed = 'null';
        } else if (typeof val === 'string') {
          printed = quoteString(val);
        } else {
          const json = JSON.stringify(val, null, 2) || 'null';
          printed = json.replace(/\n/g, '\n' + indent + '  ');
        }
        lines.push(indent + '  ' + quoteString(key) + ': ' + printed + comma);
      } else {
        lines.push(indent + '  ' + quoteString(key) + ': ');
        writeObject(children, indent + '  ');
        // append comma to the last line of the nested object if needed
        if (comma) {
          lines[lines.length - 1] = lines[lines.length - 1] + comma;
        }
      }
    });
    lines.push(indent + '}');
  }

  writeObject(tree, '');
  return lines.join('\n');
}

(async () => {
  try {
    // Simple CLI: --out <path> or --stdout
    const argv = process.argv.slice(2);
    let outPath = null;
    let toStdout = false;
    let flat = false;
    let prefixOnly = false;
    let prefixDepth = 2;
    let prefixRoot = null;
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--out' && argv[i + 1]) {
        outPath = argv[i + 1];
        i++;
      } else if (argv[i] === '--stdout') {
        toStdout = true;
      } else if (argv[i] === '--flat') {
        flat = true;
      } else if (argv[i] === '--prefix-only') {
        prefixOnly = true;
      } else if (argv[i] === '--prefix-depth' && argv[i + 1]) {
        prefixDepth = parseInt(argv[i + 1], 10) || 2;
        i++;
      } else if (argv[i] === '--prefix-root' && argv[i + 1]) {
        prefixRoot = argv[i + 1];
        i++;
      }
    }

    outPath = outPath || path.join('.vscode', 'copilot-settings.sample.jsonc');

    const foundTree = {};
    for (const dir of candidateDirs) {
      if (!(await exists(dir))) continue;
      for await (const file of walk(dir)) {
        if (path.basename(file) !== 'package.json') continue;
        try {
          const pkg = JSON.parse(await fs.promises.readFile(file, 'utf8'));
          const config = pkg.contributes && pkg.contributes.configuration;
          let props = null;
          if (config) {
            if (Array.isArray(config)) {
              props = config.reduce(
                (acc, c) => Object.assign(acc, c && c.properties ? c.properties : {}),
                {}
              );
            } else if (config.properties) {
              props = config.properties;
            }
          }
          if (!props) continue;
          for (const [k, schema] of Object.entries(props)) {
            if (!k.startsWith('github.copilot')) continue;
            const meta = {
              title: schema && (schema.title || schema.markdownDescription),
              description: schema && (schema.description || schema.markdownDescription),
              type: schema && schema.type,
              default: schema && schema.default,
              schema: schema,
            };
            setMetaNested(foundTree, k, meta);
          }
        } catch (err) {
          // ignore invalid package.json
        }
      }
    }

    // If nothing found in extension directories, try scanning the current workspace
    function hasAnyKeys(obj) {
      return Object.keys(obj).length > 0;
    }

    // walk workspace package.json files (skip node_modules, .git)
    async function* walkWorkspace(dir) {
      const ignore = ['node_modules', '.git', '.vscode', 'dist', 'build'];
      try {
        for (const name of await fs.promises.readdir(dir)) {
          if (ignore.includes(name)) continue;
          const full = path.join(dir, name);
          let stat;
          try {
            stat = await fs.promises.stat(full);
          } catch (e) {
            continue;
          }
          if (stat.isDirectory()) {
            yield* walkWorkspace(full);
          } else if (name === 'package.json') {
            yield full;
          }
        }
      } catch (e) {}
    }

    // option: --scan-file <path> to include a specific package.json
    for (let i = 0; i < argv.length; i++) {
      if (argv[i] === '--scan-file' && argv[i + 1]) {
        try {
          const p = argv[i + 1];
          const pkg = JSON.parse(await fs.promises.readFile(p, 'utf8'));
          const config = pkg.contributes && pkg.contributes.configuration;
          let props = null;
          if (config) {
            if (Array.isArray(config)) {
              props = config.reduce(
                (acc, c) => Object.assign(acc, c && c.properties ? c.properties : {}),
                {}
              );
            } else if (config.properties) {
              props = config.properties;
            }
          }
          if (props) {
            for (const [k, schema] of Object.entries(props)) {
              if (!k.startsWith('github.copilot')) continue;
              const meta = {
                title: schema && schema.title,
                description: schema && schema.description,
                type: schema && schema.type,
                default: schema && schema.default,
                schema: schema,
              };
              setMetaNested(foundTree, k, meta);
            }
          }
        } catch (e) {}
        i++;
      }
    }

    if (!hasAnyKeys(foundTree)) {
      // scan workspace
      for await (const file of walkWorkspace(process.cwd())) {
        try {
          const pkg = JSON.parse(await fs.promises.readFile(file, 'utf8'));
          const config = pkg.contributes && pkg.contributes.configuration;
          let props = null;
          if (config) {
            if (Array.isArray(config)) {
              props = config.reduce(
                (acc, c) => Object.assign(acc, c && c.properties ? c.properties : {}),
                {}
              );
            } else if (config.properties) {
              props = config.properties;
            }
          }
          if (!props) continue;
          for (const [k, schema] of Object.entries(props)) {
            if (!k.startsWith('github.copilot')) continue;
            const meta = {
              title: schema && schema.title,
              description: schema && schema.description,
              type: schema && schema.type,
              default: schema && schema.default,
              schema: schema,
            };
            setMetaNested(foundTree, k, meta);
          }
        } catch (err) {
          // ignore bad package.json
        }
      }
    }

    if (!hasAnyKeys(foundTree)) {
      const msg = [
        '// No github.copilot settings found in scanned manifests.',
        '// If you have the Copilot extension installed, pass its package.json with --scan-file /path/to/package.json',
        '',
      ].join('\n');
      if (toStdout) console.log(msg);
      else {
        await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
        await fs.promises.writeFile(outPath, msg, 'utf8');
        console.log('Wrote sample settings to', outPath);
      }
      return;
    }

    if (flat) {
      // produce dotted keys, one per line
      function collectKeys(node, prefix = []) {
        const keys = Object.keys(node).sort();
        let out = [];
        for (const k of keys) {
          const item = node[k];
          const meta = item && item.__meta;
          const children = item && item.__children ? item.__children : {};
          const nextPrefix = prefix.concat(k);
          if (Object.keys(children).length === 0) {
            out.push(nextPrefix.join('.'));
          } else {
            // also include node itself if it's a leaf with meta
            if (meta) out.push(nextPrefix.join('.'));
            out = out.concat(collectKeys(children, nextPrefix));
          }
        }
        return out;
      }

      const keys = collectKeys(foundTree).sort();
      const text = keys.join('\n') + '\n';
      if (toStdout) {
        console.log(text);
      } else {
        await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
        await fs.promises.writeFile(outPath, text, 'utf8');
        console.log('Wrote flat key list to', outPath);
      }
      return;
    }

    if (prefixOnly) {
      // Determine root node and its meta (so we can print the prefix key with a nested object)
      const rootPath = prefixRoot || 'github.copilot';
      const parts = rootPath.split('.');

      // navigate foundTree to node and capture root meta
      let node = foundTree;
      let rootMeta = null;
      for (const p of parts) {
        if (!node[p]) {
          node = null;
          break;
        }
        rootMeta = node[p].__meta || null;
        node = node[p].__children || null;
      }

      const header = [];
      header.push('// Generated Copilot prefix sample');
      header.push(`// Showing settings under prefix: ${rootPath}`);
      header.push('');

      if (!node) {
        header.push(`// No settings found under prefix ${rootPath}`);
        const outText = header.join('\n') + '\n';
        if (toStdout) console.log(outText);
        else {
          await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
          await fs.promises.writeFile(outPath, outText, 'utf8');
          console.log('Wrote prefix-only sample to', outPath);
        }
        return;
      }

      // Prune subtree to requested depth (depth counts levels under the prefix root)
      function pruneChildren(children, depth) {
        if (!children || depth <= 0) return {};
        const out = {};
        const keys = Object.keys(children).sort();
        for (const k of keys) {
          const item = children[k];
          out[k] = {
            __meta: item && item.__meta ? Object.assign({}, item.__meta) : null,
            __children: pruneChildren(item && item.__children ? item.__children : {}, depth - 1),
          };
        }
        return out;
      }

      const pruned = pruneChildren(node, prefixDepth);

      // Build a temporary tree where the top-level key is the prefix's last segment
      const tempTree = {};
      // Use the full dotted prefix as the top-level key so the JSONC shows e.g. "github.copilot": { ... }
      tempTree[rootPath] = { __meta: rootMeta, __children: pruned };

      const content = header.join('\n') + '\n' + '\n' + generateJsonCFromTree(tempTree) + '\n';
      if (toStdout) {
        console.log(content);
      } else {
        await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
        await fs.promises.writeFile(outPath, content, 'utf8');
        console.log('Wrote prefix-only sample to', outPath);
      }
      return;
    }

    const content = generateJsonCFromTree(foundTree);
    if (toStdout) {
      console.log(content);
    } else {
      await fs.promises.mkdir(path.dirname(outPath), { recursive: true });
      await fs.promises.writeFile(outPath, content, 'utf8');
      console.log('Wrote sample settings to', outPath);
    }
  } catch (err) {
    console.error('Error generating sample settings:', err);
    process.exitCode = 2;
  }
})();
