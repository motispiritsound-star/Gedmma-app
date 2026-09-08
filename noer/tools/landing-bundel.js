#!/usr/bin/env node
// Propt de landingspagina met alle schermafdrukken in één HTML-bestand, zodat
// je hem kunt mailen of ergens neerzetten zonder een map met plaatjes.
//
//   node tools/landing-bundel.js                 -> landing/noer-landing.html
//   node tools/landing-bundel.js --fragment      -> zonder <html>/<head>
//   node tools/landing-bundel.js --uit pad.html

import { readFile, writeFile } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));
const BRON = join(WORTEL, 'landing', 'index.html');

const argumenten = process.argv.slice(2);
const heeft = (v) => argumenten.includes(v);
const waarde = (v, standaard) => {
  const i = argumenten.indexOf(v);
  return i >= 0 && argumenten[i + 1] ? argumenten[i + 1] : standaard;
};

const TYPES = { '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

let html = await readFile(BRON, 'utf8');
let ingesloten = 0;

// Elke src en elke og:image die naar een bestand wijst, wordt een data-url.
const paden = [...html.matchAll(/(src|content|href)="((?!https?:|data:|#|mailto:)[^"]+\.(?:png|jpg|svg|webp))"/g)];
for (const [heel, attribuut, pad] of paden) {
  const bestand = resolve(dirname(BRON), pad);
  try {
    const bytes = await readFile(bestand);
    const type = TYPES[extname(bestand)] || 'application/octet-stream';
    html = html.replace(heel, `${attribuut}="data:${type};base64,${bytes.toString('base64')}"`);
    ingesloten++;
  } catch {
    console.warn(`  overgeslagen (niet gevonden): ${pad}`);
  }
}

if (heeft('--fragment')) {
  const kop = html.indexOf('<title>');
  const staart = html.indexOf('</body>');
  html = `${html.slice(kop, html.indexOf('</head>'))}\n${html.slice(html.indexOf('<body>') + 6, staart)}\n`;
}

const uit = waarde('--uit', join(WORTEL, 'landing', heeft('--fragment') ? 'noer-landing-fragment.html' : 'noer-landing.html'));
await writeFile(uit, html);
console.log(`\n  ${uit}`);
console.log(`  ${ingesloten} beelden ingesloten, ${(Buffer.byteLength(html) / 1048576).toFixed(1)} MB\n`);
