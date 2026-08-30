/**
 * Kleine hulpmodule: leest de workspaces uit package.json en levert de
 * pakketten op die een bepaald npm-script hebben. Zo hoeven de root-scripts
 * niet handmatig bijgewerkt te worden als er een pakket bijkomt.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const repoRoot = fileURLToPath(new URL('..', import.meta.url));

/** Alle workspace-pakketten, op alfabetische volgorde per patroon. */
export function workspaces() {
  const root = JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8'));
  const dirs = [];
  for (const patroon of root.workspaces ?? []) {
    if (!patroon.endsWith('/*')) {
      dirs.push(patroon);
      continue;
    }
    const map = join(repoRoot, patroon.slice(0, -2));
    if (!existsSync(map)) continue;
    for (const naam of readdirSync(map).sort()) {
      if (existsSync(join(map, naam, 'package.json'))) dirs.push(`${patroon.slice(0, -2)}/${naam}`);
    }
  }
  return dirs.map((dir) => {
    const pkg = JSON.parse(readFileSync(join(repoRoot, dir, 'package.json'), 'utf8'));
    return { dir, naam: pkg.name, scripts: pkg.scripts ?? {} };
  });
}

/** Pakketten die het opgegeven script kennen. */
export function metScript(script) {
  return workspaces().filter((w) => typeof w.scripts[script] === 'string');
}
