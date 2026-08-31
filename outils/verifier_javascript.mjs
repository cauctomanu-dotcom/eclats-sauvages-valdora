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

// Régression V1.0.1 : un renderer V107D/V112 installé après le moteur PNJ doit
// rester au-dessus de lui. Le moteur PNJ ne doit ni le masquer, ni le réadopter
// comme base (ce qui recréerait une récursion drawHook -> renderer -> drawHook).
try {
  const npcEngine = join(root, 'VALDORA_TOWN_NPCS_V1_0_1.js');
  let baseDrawCalls = 0;
  let terrainDrawCalls = 0;
  const raf = [];
  const window = { drawWorld: () => { baseDrawCalls += 1; } };
  const sandbox = {
    window,
    document: { documentElement: { dataset: {} }, getElementById: () => null },
    performance: { now: () => 0 },
    requestAnimationFrame: callback => { raf.push(callback); return raf.length; },
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
  const townHook = window.drawWorld;
  if (typeof townHook !== 'function' || townHook.__v101TownNpcRewrite !== true) {
    throw new Error('le hook PNJ urbain n’est pas installé');
  }
  if (townHook.__v107dDraw === true) {
    throw new Error('le hook PNJ se fait encore passer pour le renderer V107D');
  }

  const terrainRenderer = function () {
    const result = townHook.apply(this, arguments);
    terrainDrawCalls += 1;
    return result;
  };
  terrainRenderer.__v107dDraw = true;
  window.drawWorld = terrainRenderer;

  const frame = raf.shift();
  if (typeof frame !== 'function') throw new Error('la boucle PNJ ne peut pas être simulée');
  frame(16);
  if (window.drawWorld !== terrainRenderer) {
    throw new Error('le moteur PNJ masque la couche graphique V107D/V112');
  }

  terrainRenderer();
  if (baseDrawCalls !== 1) throw new Error(`la base de rendu est appelée ${baseDrawCalls} fois au lieu d’une`);
  if (terrainDrawCalls !== 1) throw new Error(`la couche terrain est appelée ${terrainDrawCalls} fois au lieu d’une`);
} catch (error) {
  failures.push(`interopération du rendu PNJ/V107D : ${error.message}`);
}

if (failures.length) {
  console.error(`Échec syntaxique dans ${failures.length} fichier(s) :`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`${checked} fichiers JavaScript analysés : syntaxe valide.`);
