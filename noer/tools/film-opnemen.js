#!/usr/bin/env node
// Neemt de promofilm op als videobestand, door een browser zichzelf te laten
// filmen. Er komt een .webm uit: die speelt in elke browser, op Android en in
// elk montageprogramma.
//
//   node tools/film-opnemen.js              liggend, 1280x720
//   node tools/film-opnemen.js --staand     staand, 720x1280 (sociale media)
//   node tools/film-opnemen.js --uit map/
//
// Playwright is hiervoor nodig (npm install, daarna npx playwright install).
// Heb je al een Chromium staan, dan wijs je die aan met CHROMIUM_PAD=/pad/naar/chromium.
// Wil je liever met de hand: open promo/promo.html?kaal=1 in volledig scherm en
// start een schermopname.

import { mkdir, readdir, rename, stat, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));
const argumenten = process.argv.slice(2);
const heeft = (v) => argumenten.includes(v);
const waarde = (v, standaard) => {
  const i = argumenten.indexOf(v);
  return i >= 0 && argumenten[i + 1] ? argumenten[i + 1] : standaard;
};

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error(`
  Playwright ontbreekt. Installeer het eerst:

      npm install

  Of neem de film met de hand op: open promo/promo.html?kaal=1 in volledig
  scherm en start een schermopname.
`);
  process.exit(1);
}

const staand = heeft('--staand');
const maat = staand ? { width: 720, height: 1280 } : { width: 1280, height: 720 };
const naam = staand ? 'noer-promo-staand.webm' : 'noer-promo.webm';
const uitMap = waarde('--uit', join(WORTEL, 'promo', 'opnames'));

await mkdir(uitMap, { recursive: true });
const tijdelijk = join(uitMap, '.bezig');
await rm(tijdelijk, { recursive: true, force: true });
await mkdir(tijdelijk, { recursive: true });

const adres = new URL(pathToFileURL(join(WORTEL, 'promo', 'promo.html')));
adres.search = `?kaal=1${staand ? '&staand=1' : ''}&start=400`;

console.log(`\n  ${staand ? 'Staand' : 'Liggend'} — ${maat.width}x${maat.height}\n  Opnemen duurt net zo lang als de film: ongeveer anderhalve minuut.\n`);

let browser;
try {
  browser = await chromium.launch(
    process.env.CHROMIUM_PAD ? { executablePath: process.env.CHROMIUM_PAD } : {});
} catch (fout) {
  await rm(tijdelijk, { recursive: true, force: true });
  console.error(`
  Geen browser om mee op te nemen: ${fout.message.split('\n')[0]}

  Haal er een op met:   npx playwright install chromium
  Of wijs er zelf een aan:   CHROMIUM_PAD=/pad/naar/chromium node tools/film-opnemen.js
`);
  process.exit(1);
}
const ctx = await browser.newContext({
  viewport: maat,
  recordVideo: { dir: tijdelijk, size: maat },
});
const pagina = await ctx.newPage();
await pagina.goto(adres.href, { waitUntil: 'networkidle' });
await pagina.waitForTimeout(1200);        // lettertypen en patroon laten staan

await pagina.waitForFunction(() => {
  const balk = document.getElementById('tijdbalk')?.querySelector('i');
  return balk && parseFloat(balk.style.width) >= 99.5;
}, null, { timeout: 180000, polling: 500 });
await pagina.waitForTimeout(1800);        // het slotbeeld even laten staan

await ctx.close();                        // hierna pas is de video geschreven
await browser.close();

const [gemaakt] = (await readdir(tijdelijk)).filter((f) => f.endsWith('.webm'));
if (!gemaakt) {
  console.error('  Er is geen video uitgekomen. Draait Playwright met een browser erbij?');
  process.exit(1);
}
const doel = join(uitMap, naam);
await rename(join(tijdelijk, gemaakt), doel);
await rm(tijdelijk, { recursive: true, force: true });

const info = await stat(doel);
console.log(`  Klaar: ${doel}`);
console.log(`  ${(info.size / 1048576).toFixed(1)} MB\n`);
