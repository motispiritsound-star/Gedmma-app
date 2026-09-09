#!/usr/bin/env node
// Maakt de beelden om te delen: de voorvertoning van een link, twee vierkante
// kaarten en een verhaal. Ze komen in landing/marketing/.
//
//   node tools/marketing-beelden.js
//
// Playwright is nodig (npm install). Er hoeft geen server te draaien; het
// sjabloon wordt als bestand geopend.
//
// De maten zijn wat de platforms verwachten:
//   1200x630   de voorvertoning van een link (WhatsApp, Facebook, LinkedIn)
//   1080x1080  een bericht op Instagram of in een groepsapp
//   1080x1920  een verhaal
//
// Wil je de tekst veranderen, dan doe je dat in tools/marketing-sjabloon.html.
// Dat is gewone HTML; er is niets om te compileren.

import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdir } from 'node:fs/promises';
import { chromium } from 'playwright';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));
const SJABLOON = join(WORTEL, 'tools', 'marketing-sjabloon.html');
const UIT = join(WORTEL, 'landing', 'marketing');

const KAARTEN = [
  { id: 'deel', naam: 'deelbeeld-1200x630', waarvoor: 'de voorvertoning van een link' },
  { id: 'vierkant', naam: 'bericht-1080x1080', waarvoor: 'een bericht met de prijs erin' },
  { id: 'overlevering', naam: 'overlevering-1080x1080', waarvoor: 'de overlevering, licht' },
  { id: 'verhaal', naam: 'verhaal-1080x1920', waarvoor: 'een verhaal' },
];

await mkdir(UIT, { recursive: true });

const browser = await chromium.launch({ executablePath: process.env.NOER_BROWSER || undefined });
const context = await browser.newContext({ viewport: { width: 1400, height: 1000 } });
const pagina = await context.newPage();
pagina.on('pageerror', (e) => console.log('  fout op de pagina:', e.message));

await pagina.goto(pathToFileURL(SJABLOON).href, { waitUntil: 'networkidle' });
// Lettertypen moeten geladen zijn voordat er iets gefotografeerd wordt, anders
// staat er op het ene beeld een andere letter dan op het andere.
await pagina.evaluate(() => document.fonts.ready);

console.log('');
for (const kaart of KAARTEN) {
  const doel = join(UIT, `${kaart.naam}.png`);
  await pagina.locator(`#${kaart.id}`).screenshot({ path: doel });
  console.log(`   ${kaart.naam}.png — ${kaart.waarvoor}`);
}
console.log('');

await context.close();
await browser.close();
