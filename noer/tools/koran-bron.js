#!/usr/bin/env node
// De Arabische tekst in de app naast een bron leggen, en hem eruit overnemen.
//
//   node tools/koran-bron.js --controleer     wijkt de tekst af van de bron?
//   node tools/koran-bron.js --vernieuw       neem de brontekst over
//   node tools/koran-bron.js --controleer --bestand quran.json
//
// Zonder --bestand haalt hij de bron van internet. Met --bestand leest hij een
// bestand dat je zelf hebt gedownload — handig als je een bron wilt gebruiken
// die je zelf hebt gecontroleerd, of als je geen internet hebt.
//
// De bron moet een JSON-lijst zijn van soera's:
//   [{ id: 1, total_verses: 7, verses: [{ id: 1, text: "…" }, …] }, …]
//
// Wat dit wel en niet is: dit vergelijkt tekens. Het zegt of de app dezelfde
// tekst heeft als de bron die jij aanwijst. Of die bron zelf deugt, is een
// vraag voor een mens — kies een bron met een naam, en laat het resultaat
// nakijken door iemand met kennis van zaken.

import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { vingerafdrukVan } from './vingerafdruk.js';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));
const KORAN = join(WORTEL, 'public', 'data', 'koran.js');
const STEMPEL = join(WORTEL, 'public', 'data', 'koran-bron.json');

const STANDAARDBRON = {
  url: 'https://raw.githubusercontent.com/risan/quran-json/main/dist/quran.json',
  naam: 'quran-json (Uthmani-tekst uit The Noble Qur\'an Encyclopedia, quranenc.com)',
};

const argumenten = process.argv.slice(2);
const heeft = (v) => argumenten.includes(v);
const waarde = (v) => {
  const i = argumenten.indexOf(v);
  return i >= 0 ? argumenten[i + 1] : null;
};

if (!heeft('--controleer') && !heeft('--vernieuw')) {
  console.log(`
  node tools/koran-bron.js --controleer     wijkt de tekst af van de bron?
  node tools/koran-bron.js --vernieuw       neem de brontekst over

  Opties:
    --bestand pad.json    lees de bron uit een bestand in plaats van van internet
    --url https://…       een andere bron van internet

  Standaardbron: ${STANDAARDBRON.naam}
`);
  process.exit(0);
}

// --- De bron ophalen --------------------------------------------------------

const bestand = waarde('--bestand');
const url = waarde('--url') || STANDAARDBRON.url;
let bron;
let bronNaam;

if (bestand) {
  bron = JSON.parse(await readFile(bestand, 'utf8'));
  bronNaam = `bestand: ${bestand}`;
} else {
  process.stdout.write('  Bron ophalen… ');
  const antwoord = await fetch(url);
  if (!antwoord.ok) {
    console.error(`\n  Lukt niet: http ${antwoord.status} op ${url}`);
    console.error('  Download de bron met de hand en geef hem mee met --bestand.');
    process.exit(1);
  }
  bron = await antwoord.json();
  bronNaam = waarde('--url') ? url : STANDAARDBRON.naam;
  console.log('klaar');
}

const bronOpNr = new Map(bron.map((s) => [s.id, s]));

/** De tekst van één aya uit de bron, of null. */
function uitBron(soeraNr, ayaNr) {
  const s = bronOpNr.get(soeraNr);
  return s?.verses?.find((v) => v.id === ayaNr)?.text ?? null;
}

// --- Vergelijken ------------------------------------------------------------

const { SOERAS } = await import(new URL('../public/data/koran.js', import.meta.url));

const naamVan = (teken) => `U+${teken.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')}`;

const verschillen = [];
for (const soera of SOERAS) {
  const bronSoera = bronOpNr.get(soera.nr);
  if (!bronSoera) {
    verschillen.push({ soera, aya: null, reden: 'staat niet in de bron' });
    continue;
  }
  if (bronSoera.total_verses !== soera.aantalAyaat) {
    verschillen.push({ soera, aya: null,
      reden: `de bron telt ${bronSoera.total_verses} aya's, de app ${soera.aantalAyaat}` });
  }
  for (const aya of soera.ayaat) {
    const tekst = uitBron(soera.nr, aya.n);
    if (tekst === null) { verschillen.push({ soera, aya, reden: 'aya ontbreekt in de bron' }); continue; }
    if (tekst === aya.ar) continue;
    const mijn = aya.ar.split(/\s+/).length;
    const hun = tekst.split(/\s+/).length;
    verschillen.push({ soera, aya, tekst, mijn, hun,
      reden: mijn === hun ? 'andere spelling' : `ander aantal woorden (${mijn} tegen ${hun})` });
  }
}

const totaal = SOERAS.reduce((n, s) => n + s.ayaat.length, 0);

// --- Melden -----------------------------------------------------------------

console.log(`\n  Bron: ${bronNaam}`);
console.log(`  ${totaal - verschillen.filter((v) => v.aya).length} van de ${totaal} aya's zijn woord voor woord gelijk.\n`);

if (!verschillen.length) {
  console.log('  Geen verschillen.\n');
} else {
  const woordVerschil = verschillen.filter((v) => v.mijn !== undefined && v.mijn !== v.hun);
  const spelling = verschillen.filter((v) => v.reden === 'andere spelling');

  if (spelling.length) {
    // Welke tekens verschillen, over alles heen? Dat zegt meer dan 58 regels diff.
    const telling = new Map();
    for (const v of spelling) {
      const tel = (t) => { const m = new Map(); for (const c of t) m.set(c, (m.get(c) || 0) + 1); return m; };
      const a = tel(v.aya.ar); const b = tel(v.tekst);
      for (const c of new Set([...a.keys(), ...b.keys()])) {
        const d = (b.get(c) || 0) - (a.get(c) || 0);
        if (d) telling.set(c, (telling.get(c) || 0) + d);
      }
    }
    console.log(`  ${spelling.length} aya's verschillen alleen in spelling. Tekens die de bron`);
    console.log('  vaker (+) of minder vaak (-) gebruikt:\n');
    for (const [c, d] of [...telling].sort((x, y) => Math.abs(y[1]) - Math.abs(x[1])).slice(0, 10)) {
      const teken = `${d > 0 ? '+' : ''}${d}`.padStart(4);
      console.log(`    ${teken}   ${naamVan(c)}  ${JSON.stringify(c)}`);
    }
    console.log('');
  }

  if (woordVerschil.length) {
    console.log(`  LET OP — ${woordVerschil.length} aya's hebben een ánder aantal woorden.`);
    console.log('  Daar loopt de woord-voor-woord-uitleg niet meer gelijk:\n');
    for (const v of woordVerschil) console.log(`    ${v.soera.naam} ${v.aya.n}: ${v.reden}`);
    console.log('');
  }

  for (const v of verschillen.filter((x) => !x.aya)) {
    console.log(`  ${v.soera.naam}: ${v.reden}`);
  }
}

// --- Overnemen --------------------------------------------------------------

if (heeft('--vernieuw')) {
  let inhoud = await readFile(KORAN, 'utf8');
  let vervangen = 0;

  for (const soera of SOERAS) {
    for (const aya of soera.ayaat) {
      const tekst = uitBron(soera.nr, aya.n);
      if (tekst === null || tekst === aya.ar) continue;
      const zoek = `ar: '${aya.ar}'`;
      if (!inhoud.includes(zoek)) {
        console.error(`  Kan ${soera.naam} ${aya.n} niet terugvinden in het bestand; niets veranderd.`);
        process.exit(1);
      }
      inhoud = inhoud.replace(zoek, `ar: '${tekst}'`);
      vervangen++;
    }
  }

  await writeFile(KORAN, inhoud);

  // Vingerafdruk van de tekst die er nu staat, zodat een latere wijziging
  // opvalt zonder dat je opnieuw de bron hoeft op te halen.
  const { SOERAS: nieuw } = await import(`${new URL('../public/data/koran.js', import.meta.url)}?v=${Date.now()}`);
  const stempel = {
    bron: bronNaam,
    url: bestand ? null : url,
    overgenomen: new Date().toISOString().slice(0, 10),
    aantalAyaat: nieuw.reduce((n, s) => n + s.ayaat.length, 0),
    vingerafdruk: vingerafdrukVan(nieuw),
    let_op: 'Dit zegt dat de app dezelfde tekens heeft als de bron hierboven. Of die bron deugt, hoort een mens te beoordelen.',
  };
  await writeFile(STEMPEL, `${JSON.stringify(stempel, null, 2)}\n`);

  console.log(`  ${vervangen} aya's overgenomen uit de bron.`);
  console.log(`  Vingerafdruk vastgelegd in public/data/koran-bron.json\n`);
  console.log('  Draai nu npm test: die controleert of de woord-voor-woord-uitleg');
  console.log('  nog gelijk loopt met de nieuwe tekst.\n');
}
