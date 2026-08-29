#!/usr/bin/env node
// Haalt recitatie op voor de soera's die in de app zitten, en zet ze neer als
// public/audio/koran/<soera>/<aya>.mp3 — precies waar de app ze zoekt.
//
//   node tools/haal-recitatie.js --lijst              welke reciteurs er zijn
//   node tools/haal-recitatie.js --bron alafasy --proef   werkt het adres?
//   node tools/haal-recitatie.js --bron alafasy       alles ophalen
//   node tools/haal-recitatie.js --bron 'https://.../{soera}{aya}.mp3'
//
// Over toestemming: een recitatie is een opname van een mens. Of je die mag
// downloaden, meeleveren of streamen hangt af van de reciteur en de uitgever,
// niet van hoe bekend de opname is. Dit script haalt op wat jij aanwijst; de
// afweging of dat mag is die van degene die de app uitgeeft. Vermeld altijd
// wie er reciteert — dat doet de app zelf ook, zodra je een reciteur instelt.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));
const { SOERAS } = await import(new URL('../public/data/koran.js', import.meta.url));
const { RECITEURS, vulIn } = await import(new URL('../public/data/bronnen.js', import.meta.url));

const argumenten = process.argv.slice(2);
const heeft = (vlag) => argumenten.includes(vlag);
const waarde = (vlag) => {
  const i = argumenten.indexOf(vlag);
  return i >= 0 ? argumenten[i + 1] : null;
};

const breedte = Math.max(...Object.keys(RECITEURS).map((k) => k.length));
const lijst = () => Object.entries(RECITEURS)
  .map(([sleutel, r]) => `    ${sleutel.padEnd(breedte)}  ${r.naam}\n    ${' '.repeat(breedte)}  ${r.stijl}`)
  .join('\n\n');

if (heeft('--lijst') || argumenten.length === 0) {
  console.log(`
  Reciteurs die klaarstaan:

${lijst()}

  Gebruik:

    node tools/haal-recitatie.js --bron alafasy --proef    één aya proberen
    node tools/haal-recitatie.js --bron alafasy            alles ophalen

  Of geef zelf een adres op, met {soera} {aya} (drie cijfers) of
  {soera2} {aya2} (kaal):

    node tools/haal-recitatie.js --bron 'https://voorbeeld.nl/{soera}{aya}.mp3'

  De adressen hierboven zijn niet gecontroleerd toen ze werden opgeschreven.
  Draai eerst --proef; dat kost één seconde en zegt meteen of het klopt.

  En: dit script haalt op wat jij aanwijst. Of je een recitatie mag
  meeleveren, hangt af van de reciteur en de uitgever — niet van hoe bekend
  de opname is. Zoek dat uit voordat je de app uitgeeft.
`);
  process.exit(0);
}

const opgegeven = waarde('--bron');
const preset = RECITEURS[opgegeven];
const sjabloon = preset ? preset.sjabloon : opgegeven;
const naam = preset ? preset.naam : opgegeven;
const wachten = Number(waarde('--pauze') || 250);

if (!sjabloon || !sjabloon.includes('{')) {
  console.error(`\n  Onbekende bron: ${opgegeven}\n  Draai --lijst om te zien wat er is.\n`);
  process.exit(1);
}

const drie = (n) => String(n).padStart(3, '0');
const bestaat = (pad) => access(pad).then(() => true, () => false);
const pauze = (ms) => new Promise((k) => setTimeout(k, ms));

async function probeer(url) {
  const antwoord = await fetch(url);
  if (!antwoord.ok) throw new Error(`http ${antwoord.status}`);
  const bytes = Buffer.from(await antwoord.arrayBuffer());
  if (bytes.length < 1024) throw new Error(`maar ${bytes.length} bytes — dit is geen audio`);
  return bytes;
}

// --- Proefrit: één aya, geen schrijven --------------------------------------

if (heeft('--proef')) {
  const url = vulIn(sjabloon, 114, 1);
  console.log(`\n  ${naam}\n  ${url}\n`);
  try {
    const bytes = await probeer(url);
    console.log(`  Werkt. ${(bytes.length / 1024).toFixed(0)} kB opgehaald.`);
    console.log(`  Alles ophalen: node tools/haal-recitatie.js --bron ${opgegeven}\n`);
  } catch (fout) {
    console.log(`  Werkt niet: ${fout.message}`);
    console.log('  Open het adres eens in je browser. Klopt de mapnaam van de reciteur?\n');
    process.exit(1);
  }
  process.exit(0);
}

// --- Alles ophalen ----------------------------------------------------------

const totaal = SOERAS.reduce((n, s) => n + s.aantalAyaat, 0);
console.log(`\n  ${naam} — ${totaal} aya's\n`);

let gehaald = 0;
let overgeslagen = 0;
const mislukt = [];

for (const soera of SOERAS) {
  const map = join(WORTEL, 'public', 'audio', 'koran', String(soera.nr));
  await mkdir(map, { recursive: true });

  for (const aya of soera.ayaat) {
    const doel = join(map, `${aya.n}.mp3`);
    if (await bestaat(doel)) { overgeslagen++; continue; }

    const url = vulIn(sjabloon, soera.nr, aya.n);
    try {
      await writeFile(doel, await probeer(url));
      gehaald++;
      process.stdout.write(`\r  ${soera.naam} ${aya.n}/${soera.aantalAyaat} — ${gehaald} van de ${totaal}   `);
    } catch (fout) {
      mislukt.push({ soera: soera.naam, aya: aya.n, url, reden: fout.message });
    }
    await pauze(wachten);
  }
}

console.log(`\n\n  ${gehaald} opgehaald, ${overgeslagen} stonden er al, ${mislukt.length} mislukt`);

if (mislukt.length) {
  console.log('\n  Mislukt:');
  for (const m of mislukt.slice(0, 8)) console.log(`    ${m.soera} ${m.aya}: ${m.reden}`);
  if (mislukt.length > 8) console.log(`    … en nog ${mislukt.length - 8}`);
  console.log(`\n  Probeer één adres met de hand:\n    ${mislukt[0].url}`);
}

if (gehaald) {
  console.log(`
  De bestanden staan in public/audio/koran/. De app pakt ze vanzelf op.

  Zet de naam van de reciteur in de app, zodat die er netjes bij staat.
  In public/data/bronnen.js:

      reciteur: { aan: false, keuze: '${preset ? opgegeven : 'alafasy'}' },

  ('aan' mag uit blijven: de gedownloade bestanden gaan toch vóór op streamen.
  De naam wordt wel getoond.)

  En controleer of je deze opnames mag verspreiden voordat je de app uitgeeft.`);
}
console.log('');
