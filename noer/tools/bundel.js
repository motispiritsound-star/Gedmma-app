#!/usr/bin/env node
// Bundelt de hele app tot één HTML-bestand: alle modules, alle stijlen, het
// icoon. Handig om te delen, te mailen of ergens neer te zetten zonder server.
//
//   node tools/bundel.js                 -> noer-demo.html (op zichzelf staand)
//   node tools/bundel.js --demo          -> met een ingevuld voorbeeldprofiel
//   node tools/bundel.js --fragment      -> zonder <html>/<head>, om in te bedden
//   node tools/bundel.js --uit pad.html --titel 'Noer'
//
// De modules blijven in hun eigen scope: elke module wordt een functie die zijn
// exports teruggeeft, en __laad() haalt ze lazy op. Daarom mag de importgraaf
// geen kringetje bevatten — vandaar dat route.js los staat van app.js.

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = resolve(fileURLToPath(new URL('..', import.meta.url)), 'public');
const INGANG = 'js/app.js';

const argumenten = process.argv.slice(2);
const heeft = (vlag) => argumenten.includes(vlag);
const waarde = (vlag, standaard) => {
  const i = argumenten.indexOf(vlag);
  return i >= 0 && argumenten[i + 1] ? argumenten[i + 1] : standaard;
};

// --- Modules inlezen en omschrijven --------------------------------------

const IMPORT = /^import\s+(?:(\*\s+as\s+\w+)|(\{[\s\S]*?\}))\s+from\s+'([^']+)';[ \t]*$/gm;
const EXPORT_DECLARATIE = /^export\s+((?:async\s+)?(?:const|let|var|function|class))\s+([A-Za-z_$][\w$]*)/gm;
const WEGLATEN = /^[ \t]*\/\/ #bundel-weg[\s\S]*?\/\/ #bundel-eind[ \t]*$/gm;

/** Zet `{ a, b as c }` om in een destructurering: `{ a, b: c }`. */
const naarDestructurering = (haakjes) =>
  haakjes.replace(/\s+as\s+/g, ': ').replace(/\s+/g, ' ').trim();

async function leesModule(id, modules) {
  if (modules.has(id)) return;
  modules.set(id, null); // vast zetten tegen dubbel werk

  const bron = await readFile(join(WORTEL, id), 'utf8');
  const afhankelijk = [];

  let code = bron.replace(WEGLATEN, '');

  code = code.replace(IMPORT, (heel, ster, haakjes, pad) => {
    const doel = relative(WORTEL, resolve(dirname(join(WORTEL, id)), pad)).split('\\').join('/');
    afhankelijk.push(doel);
    if (ster) return `const ${ster.replace(/\*\s+as\s+/, '')} = __laad('${doel}');`;
    return `const ${naarDestructurering(haakjes)} = __laad('${doel}');`;
  });

  const namen = [...code.matchAll(EXPORT_DECLARATIE)].map((m) => m[2]);
  code = code.replace(EXPORT_DECLARATIE, '$1 $2');

  const rest = code.match(/^\s*(import|export)\b.*$/m);
  if (rest) throw new Error(`${id}: deze regel kan de bundelaar niet aan:\n  ${rest[0].trim()}`);

  modules.set(id, { code, namen });
  for (const doel of afhankelijk) await leesModule(doel, modules);
}

// --- Bouwen ---------------------------------------------------------------

const modules = new Map();
await leesModule(INGANG, modules);

const script = [
  '// Gebundeld met tools/bundel.js — bewerk de bestanden in public/, niet dit.',
  'const __modules = {};',
  'const __gereed = {};',
  'function __laad(id) {',
  '  if (id in __gereed) return __gereed[id];',
  '  const maak = __modules[id];',
  '  if (!maak) throw new Error("Onbekende module: " + id);',
  '  return (__gereed[id] = maak());',
  '}',
  ...[...modules].map(([id, mod]) =>
    `__modules[${JSON.stringify(id)}] = function () {\n${mod.code}\nreturn { ${mod.namen.join(', ')} };\n};`),
  `__laad(${JSON.stringify(INGANG)});`,
].join('\n\n');

const html = await readFile(join(WORTEL, 'index.html'), 'utf8');
const stijlen = [...html.matchAll(/<link rel="stylesheet" href="([^"]+)">/g)].map((m) => m[1]);
const css = (await Promise.all(stijlen.map((pad) => readFile(join(WORTEL, pad), 'utf8')))).join('\n');
const icoon = await readFile(join(WORTEL, 'icoon.svg'), 'utf8');
const icoonUrl = `data:image/svg+xml,${encodeURIComponent(icoon.trim())}`;

const zaad = heeft('--demo') ? await readFile(join(WORTEL, '..', 'tools', 'demo-zaad.js'), 'utf8') : '';

const titel = waarde('--titel', 'Noer — Arabisch en Koran voor kinderen');

const romp = `<title>${titel}</title>
<style>
${css}
</style>

<header id="kopbalk" class="verborgen"></header>
<nav id="navigatie" class="verborgen" aria-label="Hoofdmenu"></nav>
<main id="inhoud">
  <noscript>
    <p style="padding:2rem;text-align:center">
      Noer heeft JavaScript nodig. Zet het aan in je browser om te beginnen.
    </p>
  </noscript>
</main>
${zaad ? `<script>\n${zaad}\n</script>\n` : ''}<script type="module">
${script}
</script>`;

const compleet = `<!doctype html>
<html lang="nl">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="description" content="Arabisch leren lezen en korte soera's uit je hoofd leren, spelenderwijs, voor kinderen van 5 tot en met 13 jaar.">
<meta name="theme-color" content="#0f7a67">
<link rel="icon" href="${icoonUrl}" type="image/svg+xml">
${romp}
</body>
</html>
`;

const uit = waarde('--uit', heeft('--fragment') ? 'noer-demo-fragment.html' : 'noer-demo.html');
const inhoud = heeft('--fragment') ? romp + '\n' : compleet;
await writeFile(uit, inhoud);

console.log(`  ${uit}`);
console.log(`  ${modules.size} modules, ${(Buffer.byteLength(inhoud) / 1024).toFixed(0)} kB${heeft('--demo') ? ', met voorbeeldprofiel' : ''}`);
