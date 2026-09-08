#!/usr/bin/env node
// Maakt de schermafdrukken die op de landingspagina staan. Draait de app in een
// echte browser met het voorbeeldprofiel erin, zodat de app niet leeg oogt.
//
//   npm start                        # in een ander venster
//   node tools/landing-beelden.js
//   node tools/landing-beelden.js --adres http://localhost:5173
//
// Playwright is nodig (npm install). De beelden komen in landing/beelden/ en
// zijn 390x844 op tweevoudige schaal — het formaat van een telefoon.

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));
const UIT = join(WORTEL, 'landing', 'beelden');

const argumenten = process.argv.slice(2);
const waarde = (v, standaard) => {
  const i = argumenten.indexOf(v);
  return i >= 0 && argumenten[i + 1] ? argumenten[i + 1] : standaard;
};
const ADRES = waarde('--adres', 'http://localhost:5173').replace(/\/$/, '');

const zaad = await readFile(join(WORTEL, 'tools', 'demo-zaad.js'), 'utf8');

// Staat de browser ergens anders dan waar Playwright hem zelf neerzet, geef
// dat pad dan mee in NOER_BROWSER.
const browser = await chromium.launch({
  executablePath: process.env.NOER_BROWSER || undefined,
  args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  permissions: ['microphone'],
});
const pagina = await context.newPage();
pagina.on('pageerror', (e) => console.log('  fout op de pagina:', e.message));

await pagina.goto(`${ADRES}/`, { waitUntil: 'networkidle' });
await pagina.evaluate(zaad);
await pagina.evaluate(() => {
  const staat = JSON.parse(localStorage.getItem('noer.v1'));
  staat.actief = 'demo';
  localStorage.setItem('noer.v1', JSON.stringify(staat));
});
// De app leest localStorage één keer bij het laden, dus opnieuw laden.
await pagina.reload({ waitUntil: 'networkidle' });

const schot = async (route, naam, klaar) => {
  await pagina.goto(`${ADRES}/#${route}`);
  if (klaar) await klaar();
  await pagina.waitForTimeout(700);
  await pagina.screenshot({ path: join(UIT, `${naam}.png`) });
  console.log('  ', naam);
};

console.log('');
await schot('/thuis', 'thuis', () => pagina.waitForSelector('.groet'));
await schot('/qaida', 'leerpad', () => pagina.waitForSelector('.padstap'));
await schot('/letters/ba', 'letter', () => pagina.waitForSelector('.letterheld'));
await schot('/koran/an-nas', 'koran', () => pagina.waitForSelector('.aya'));
await schot('/studio/letter-klank', 'studio', () => pagina.waitForSelector('.opnameregel'));
await schot('/ouders', 'ouders', () => pagina.waitForSelector('.kindkaart'));

// De oefening met de feedbackstrook eronder: die moet je uitlokken.
await pagina.goto(`${ADRES}/#/qaida/madd`);
await pagina.waitForSelector('.knop.groot');
await pagina.click('button:has-text("Start de oefening")');
await pagina.waitForSelector('.keuze');
await pagina.click('.keuze >> nth=0');
await pagina.waitForSelector('.feedback .doorgaan');
await pagina.waitForTimeout(500);
await pagina.screenshot({ path: join(UIT, 'oefening.png') });
console.log('   oefening\n');

await context.close();
await browser.close();
