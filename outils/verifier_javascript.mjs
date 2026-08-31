import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../game/', import.meta.url));
const failures = [];
let checked = 0;

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.isFile() && entry.name.endsWith('.js')) await check(path);
  }
}

async function check(path) {
  checked += 1;
  try {
    new vm.Script(await readFile(path, 'utf8'), { filename: path });
  } catch (error) {
    failures.push(`${relative(root, path)}: ${error.message}`);
  }
}

await walk(root);

// Régression V1.0.1 : l'ancien installateur V107D ne doit jamais pouvoir
// réenvelopper le hook de rendu des PNJ et créer une récursion infinie.
try {
  const npcEngine = join(root, 'VALDORA_TOWN_NPCS_V1_0_1.js');
  let baseDrawCalls = 0;
  const window = { drawWorld: () => { baseDrawCalls += 1; } };
  const sandbox = {
    window,
    performance: { now: () => 0 },
    requestAnimationFrame: () => 0,
    setTimeout: callback => { callback(); return 0; },
    setInterval: () => 0,
    console,
    Map,
    Set,
    Math,
    Number,
    String,
    Array,
    Object
  };
  new vm.Script(await readFile(npcEngine, 'utf8'), { filename: npcEngine }).runInNewContext(sandbox);
  const hook = window.drawWorld;
  if (typeof hook !== 'function' || hook.__v107dDraw !== true || hook.__v101TownNpcRewrite !== true) {
    throw new Error('le hook PNJ ne bloque pas le réenveloppement V107D');
  }
  hook();
  if (baseDrawCalls !== 1) throw new Error(`la base de rendu est appelée ${baseDrawCalls} fois au lieu d’une`);
} catch (error) {
  failures.push(`interopération du rendu PNJ/V107D : ${error.message}`);
}

if (failures.length) {
  console.error(`Échec syntaxique dans ${failures.length} fichier(s) :`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`${checked} fichiers JavaScript analysés : syntaxe valide.`);
