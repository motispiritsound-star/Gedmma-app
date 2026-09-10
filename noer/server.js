#!/usr/bin/env node
// Noer: de site op /, de app op /app/, de API op /api/. Geen afhankelijkheden.
//
//   node server.js                 zoals hij live draait
//   NOER_PROEF=1 node server.js    met een nep-Mollie, om droog te oefenen
//
// Wat er ingesteld moet worden staat in server/instellingen.js, en waarom in
// BETALEN.md.

import { networkInterfaces } from 'node:os';

import { instellingen, isLive, watOntbreekt } from './server/instellingen.js';
import { maakServer } from './server/maak.js';

const { server } = await maakServer({ instellingen });

server.listen(instellingen.poort, () => {
  const p = instellingen.poort;
  console.log(`\n  De site   http://localhost:${p}`);
  console.log(`  De app    http://localhost:${p}/app/`);
  // De server luistert op alle netwerkkaarten, zodat je de app op de tablet
  // van je kind kunt openen. Handig, en goed om te weten: iedereen op
  // hetzelfde wifi-netwerk kan er dan bij.
  for (const adres of lokaleAdressen()) {
    console.log(`  Op je tablet of telefoon: http://${adres}:${p}/app/`);
  }

  if (instellingen.proef) {
    console.log('\n  PROEFSTAND — Mollie is nep, er verschuift geen geld.');
  } else if (isLive()) {
    console.log('\n  LIVE — dit is een echte Mollie-sleutel. Er wordt echt afgerekend.');
  }

  const gemist = watOntbreekt();
  if (gemist.length) {
    console.log('\n  Nog niet ingesteld, dus betalen werkt niet:');
    for (const naam of gemist) console.log(`    - ${naam}`);
    console.log('  Zie BETALEN.md.');
  }
  console.log('');
});

/** IPv4-adressen van dit apparaat op het lokale netwerk. */
function lokaleAdressen() {
  return Object.values(networkInterfaces()).flat()
    .filter((n) => n && n.family === 'IPv4' && !n.internal)
    .map((n) => n.address);
}
