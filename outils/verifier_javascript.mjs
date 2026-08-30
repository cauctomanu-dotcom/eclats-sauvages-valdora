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

if (failures.length) {
  console.error(`Échec syntaxique dans ${failures.length} fichier(s) :`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`${checked} fichiers JavaScript analysés : syntaxe valide.`);
