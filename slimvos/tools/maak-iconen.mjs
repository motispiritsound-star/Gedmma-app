// Rendert de app-iconen uit één SVG-bron, zodat het icoon en de mascotte in de
// app altijd hetzelfde zijn. Draaien met:  node tools/maak-iconen.mjs
import { chromium } from 'playwright';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const wortel = join(dirname(fileURLToPath(import.meta.url)), '..');
const uit = join(wortel, 'assets');
mkdirSync(uit, { recursive: true });

const VACHT_LICHT = '#FB8A4C';
const VACHT_DONKER = '#E2601F';
const OOR_BINNEN = '#C4410F';
const CREME = '#FFF3E4';
const DONKER = '#3A2415';
const GROND = '#FFF4EC';

/** De kop van Vos, in een 100x100 vlak. `plat` maakt hem eenkleurig. */
function vos(plat = false) {
  const vacht = plat ? '#000000' : 'url(#vacht)';
  const oor = plat ? '#000000' : OOR_BINNEN;
  const creme = plat ? '#FFFFFF' : CREME;
  const donker = plat ? '#000000' : DONKER;
  return `
    <path d="M20 40 L11 9 L41 22 Z" fill="${vacht}"/>
    <path d="M80 40 L89 9 L59 22 Z" fill="${vacht}"/>
    <path d="M22 34 L17 17 L34 24 Z" fill="${oor}"/>
    <path d="M78 34 L83 17 L66 24 Z" fill="${oor}"/>
    <path d="M14 47 C14 28 31 19 50 19 C69 19 86 28 86 47 C86 62 76 72 63 78 C58 83 54 88 50 88 C46 88 42 83 37 78 C24 72 14 62 14 47 Z" fill="${vacht}"/>
    <path d="M50 46 C62 46 68 53 68 61 C68 71 60 80 50 88 C40 80 32 71 32 61 C32 53 38 46 50 46 Z" fill="${creme}"/>
    <path d="M20 40 C25 36 30 35 34 36 C33 43 30 48 25 50 C21 48 19 44 20 40 Z" fill="${creme}" opacity="${plat ? 1 : 0.75}"/>
    <path d="M80 40 C75 36 70 35 66 36 C67 43 70 48 75 50 C79 48 81 44 80 40 Z" fill="${creme}" opacity="${plat ? 1 : 0.75}"/>
    <g stroke="${donker}" stroke-width="3.4" stroke-linecap="round" fill="none">
      <path d="M31 45 Q37 38.5 43 45"/>
      <path d="M57 45 Q63 38.5 69 45"/>
    </g>
    <path d="M50 56 C53.6 56 56 58 56 60.2 C56 62.6 53.4 64.4 50 64.4 C46.6 64.4 44 62.6 44 60.2 C44 58 46.4 56 50 56 Z" fill="${donker}"/>
    <path d="M42 69 Q50 79.5 58 69 Q50 72.5 42 69 Z" fill="${donker}"/>
    <g stroke="${donker}" stroke-width="1.6" stroke-linecap="round" opacity="${plat ? 1 : 0.5}">
      <path d="M32 58 L22 56"/><path d="M32 62 L22 63"/>
      <path d="M68 58 L78 56"/><path d="M68 62 L78 63"/>
    </g>`;
}

const verloop = `
  <defs>
    <linearGradient id="vacht" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${VACHT_LICHT}"/>
      <stop offset="1" stop-color="${VACHT_DONKER}"/>
    </linearGradient>
    <linearGradient id="grond" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/>
      <stop offset="1" stop-color="${GROND}"/>
    </linearGradient>
  </defs>`;

/** Vierkant icoon met achtergrond: voor iOS en de web-favicon. */
const gevuld = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  ${verloop}
  <rect width="100" height="100" fill="url(#grond)"/>
  <g transform="translate(50 52) scale(0.82) translate(-50 -50)">${vos()}</g>
</svg>`;

/** Alleen de vos, zonder achtergrond: voor het Android-voorgrondvlak en de splash. */
const losseVos = (schaal) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  ${verloop}
  <g transform="translate(50 52) scale(${schaal}) translate(-50 -50)">${vos()}</g>
</svg>`;

const effenGrond = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="${GROND}"/>
</svg>`;

/** Eenkleurig silhouet voor het thema-icoon van Android. */
const monochroom = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <g transform="translate(50 52) scale(0.6) translate(-50 -50)">${vos(true)}</g>
</svg>`;

const werk = [
  { naam: 'icon.png', svg: gevuld, formaat: 1024, doorzichtig: false },
  { naam: 'favicon.png', svg: gevuld, formaat: 96, doorzichtig: false },
  // Android snijdt het voorgrondvlak rond af; daarom staat de vos kleiner.
  { naam: 'android-icon-foreground.png', svg: losseVos(0.55), formaat: 1024, doorzichtig: true },
  { naam: 'android-icon-background.png', svg: effenGrond, formaat: 1024, doorzichtig: false },
  { naam: 'android-icon-monochrome.png', svg: monochroom, formaat: 1024, doorzichtig: true },
  { naam: 'splash-icon.png', svg: losseVos(0.9), formaat: 1024, doorzichtig: true },
];

const browser = await chromium.launch({
  executablePath: process.env.CHROMIUM ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage();

for (const { naam, svg, formaat, doorzichtig } of werk) {
  await page.setViewportSize({ width: formaat, height: formaat });
  await page.setContent(
    `<style>html,body{margin:0;padding:0;background:transparent}svg{display:block;width:${formaat}px;height:${formaat}px}</style>${svg}`,
  );
  const beeld = await page.screenshot({ omitBackground: doorzichtig, type: 'png' });
  writeFileSync(join(uit, naam), beeld);
  console.log(`${naam.padEnd(32)} ${formaat}×${formaat}`);
}

await browser.close();
