#!/usr/bin/env node
// Haalt recitatie op voor de soera's die in de app zitten, en zet ze neer als
// public/audio/koran/<soera>/<aya>.mp3 — precies waar de app ze zoekt.
//
//   node tools/haal-recitatie.js --bron 'https://voorbeeld.nl/{reciteur}/{soera}{aya}.mp3' \
//                               --reciteur Alafasy_128kbps
//
// In {soera} en {aya} vult het script drie cijfers in (114 -> 114, 1 -> 001),
// {soera2} en {aya2} geven het kale nummer.
//
// Er zit met opzet geen bron ingebakken. Recitaties zijn opnames van een mens,
// en of je die mag kopiëren hangt af van de reciteur en de uitgever. Kies zelf
// een bron waarvan je weet dat het mag, en lees de voorwaarden. Wat je hier
// neerzet, deel je later mee met iedereen die de app krijgt.
//
// Werkt het downloaden niet, dan kun je in public/data/bronnen.js ook een
// reciteur aanzetten die de app tijdens het spelen streamt. Dat vraagt wel
// internet, en dan werkt de Koran offline niet.

import { mkdir, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));
const { SOERAS } = await import(new URL('../public/data/koran.js', import.meta.url));

const argumenten = process.argv.slice(2);
const waarde = (vlag) => {
  const i = argumenten.indexOf(vlag);
  return i >= 0 ? argumenten[i + 1] : null;
};

const bron = waarde('--bron');
const reciteur = waarde('--reciteur') || '';
const wachten = Number(waarde('--pauze') || 250);

if (!bron) {
  console.error(`
  Geef met --bron op waar de bestanden vandaan komen. Bijvoorbeeld:

    node tools/haal-recitatie.js \\
      --bron 'https://voorbeeld.nl/{reciteur}/{soera}{aya}.mp3' \\
      --reciteur naam-van-de-map

  Plaatshouders: {soera} {aya} (drie cijfers), {soera2} {aya2} (kaal),
                 {reciteur}

  Er zit geen bron ingebakken: kies er zelf een waarvan je weet dat je hem
  mag gebruiken, en lees de voorwaarden.
`);
  process.exit(1);
}

const drie = (n) => String(n).padStart(3, '0');
const vulIn = (sjabloon, soera, aya) => sjabloon
  .replaceAll('{reciteur}', reciteur)
  .replaceAll('{soera}', drie(soera)).replaceAll('{aya}', drie(aya))
  .replaceAll('{soera2}', String(soera)).replaceAll('{aya2}', String(aya));

const bestaat = (pad) => access(pad).then(() => true, () => false);
const pauze = (ms) => new Promise((k) => setTimeout(k, ms));

let gehaald = 0;
let overgeslagen = 0;
const mislukt = [];

for (const soera of SOERAS) {
  const map = join(WORTEL, 'public', 'audio', 'koran', String(soera.nr));
  await mkdir(map, { recursive: true });

  for (const aya of soera.ayaat) {
    const doel = join(map, `${aya.n}.mp3`);
    if (await bestaat(doel)) { overgeslagen++; continue; }

    const url = vulIn(bron, soera.nr, aya.n);
    try {
      const antwoord = await fetch(url);
      if (!antwoord.ok) throw new Error(`http ${antwoord.status}`);
      const bytes = Buffer.from(await antwoord.arrayBuffer());
      if (bytes.length < 1024) throw new Error(`maar ${bytes.length} bytes`);
      await writeFile(doel, bytes);
      gehaald++;
      process.stdout.write(`\r  ${soera.naam} ${aya.n}/${soera.aantalAyaat} — ${gehaald} opgehaald   `);
    } catch (fout) {
      mislukt.push({ soera: soera.naam, aya: aya.n, url, reden: fout.message });
    }
    await pauze(wachten);
  }
}

console.log(`\n\n  ${gehaald} opgehaald, ${overgeslagen} stonden er al, ${mislukt.length} mislukt`);
if (mislukt.length) {
  console.log('\n  Mislukt:');
  for (const m of mislukt.slice(0, 10)) console.log(`    ${m.soera} ${m.aya}: ${m.reden}`);
  if (mislukt.length > 10) console.log(`    … en nog ${mislukt.length - 10}`);
  console.log('\n  Klopt de vorm van --bron? Probeer één url met de hand in je browser.');
}
console.log(`
  De bestanden staan in public/audio/koran/. De app pakt ze vanzelf op.
  Controleer of je deze opnames mag verspreiden voordat je ze met de app meegeeft.
`);
