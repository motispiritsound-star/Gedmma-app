#!/usr/bin/env node
// Maakt de beelden die de app nodig heeft zodra hij online staat:
//
//   public/icoon-192.png        Android, appwinkel-achtige weergaven
//   public/icoon-512.png        splash en installatie
//   public/icoon-masker.png     Android maskable: vult het hele vlak
//   public/apple-touch-icon.png iPhone en iPad — die lezen geen SVG-icoon,
//                               en tonen zonder dit bestand niets
//   public/deelbeeld.png        de voorvertoning bij een gedeelde link
//
//   node tools/beelden-maken.js
//
// De beelden worden getekend uit dezelfde vormen als de app zelf, zodat ze
// niet uit elkaar kunnen lopen. Playwright doet het tekenwerk (npm install).

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const WORTEL = fileURLToPath(new URL('..', import.meta.url));
const PUBLIC = join(WORTEL, 'public');

let chromium;
try {
  ({ chromium } = await import('playwright'));
} catch {
  console.error('\n  Playwright ontbreekt. Draai eerst: npm install && npx playwright install chromium\n');
  process.exit(1);
}

const GROEN = '#0f7a67';
const GROEN_LICHT = '#2fa48c';
const GROEN_DIEP = '#0a5748';
const PAPIER = '#faf5ec';
const GOUD = '#f2d493';

/** Het merk: نُور in wit op groen, in de boogvorm van de app. */
const merk = (maat, vulling) => `
  <div style="width:${maat}px;height:${maat}px;display:grid;place-items:center;
              background:linear-gradient(155deg, ${GROEN_LICHT}, ${GROEN} 55%, ${GROEN_DIEP});
              border-radius:${vulling ? 0 : maat * 0.22}px;overflow:hidden;position:relative">
    <div style="position:absolute;inset:0;background:#fff;opacity:.18;
                -webkit-mask-image:${PATROON};-webkit-mask-size:${maat / 5}px ${maat / 5}px"></div>
    <span style="position:relative;font-family:'Amiri Quran','Scheherazade New','Noto Naskh Arabic',serif;
                 direction:rtl;color:#fff;font-size:${maat * (vulling ? 0.34 : 0.42)}px;line-height:1">نُور</span>
  </div>`;

// Hetzelfde stermotief als in de app.
const PATROON = (() => {
  let g = "<svg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'>"
    + "<g fill='none' stroke='#000' stroke-width='1.5'>";
  for (const [cx, cy] of [[40, 40], [0, 0], [80, 0], [0, 80], [80, 80]]) {
    const x = cx - 16; const y = cy - 16;
    g += `<rect x='${x}' y='${y}' width='32' height='32' rx='2'/>`
      + `<rect x='${x}' y='${y}' width='32' height='32' rx='2' transform='rotate(45 ${cx} ${cy})'/>`;
  }
  return `url("data:image/svg+xml,${encodeURIComponent(`${g}</g></svg>`)}")`;
})();

const browser = await chromium.launch(
  process.env.CHROMIUM_PAD ? { executablePath: process.env.CHROMIUM_PAD } : {});

async function teken(html, maat, naam) {
  const pagina = await browser.newPage({
    viewport: { width: maat.width, height: maat.height },
    deviceScaleFactor: 1,
  });
  await pagina.setContent(`<body style="margin:0">${html}</body>`);
  await pagina.waitForTimeout(250);          // even de lettertypen laten landen
  const beeld = await pagina.screenshot({ omitBackground: false });
  await writeFile(join(PUBLIC, naam), beeld);
  await pagina.close();
  console.log(`  ${naam.padEnd(24)} ${maat.width}x${maat.height}`);
}

console.log('\n  Beelden tekenen…\n');

for (const n of [192, 512]) {
  await teken(merk(n, false), { width: n, height: n }, `icoon-${n}.png`);
}

// Maskable: Android knipt er een vorm uit, dus het merk moet tot de rand lopen
// en het beeldmerk binnen de veilige binnenste 80% blijven.
await teken(merk(512, true), { width: 512, height: 512 }, 'icoon-masker.png');

// iOS zet het icoon zelf in een afgeronde vierkant; wij leveren het gevuld aan.
await teken(merk(180, true), { width: 180, height: 180 }, 'apple-touch-icon.png');

// De voorvertoning bij een gedeelde link.
await teken(`
  <div style="width:1200px;height:630px;display:flex;align-items:center;gap:64px;
              padding:0 96px;background:${PAPIER};position:relative;overflow:hidden;
              font-family:'Segoe UI',system-ui,sans-serif">
    <div style="position:absolute;inset:0;background:${GROEN};opacity:.055;
                -webkit-mask-image:${PATROON};-webkit-mask-size:110px 110px"></div>
    <div style="position:relative;flex:none">${merk(240, false)}</div>
    <div style="position:relative">
      <div style="font-size:88px;font-weight:800;color:#2b2419;letter-spacing:-.02em">Noer</div>
      <div style="font-size:38px;color:#6b5f4e;margin-top:12px;line-height:1.35">
        Arabisch lezen en de Koran,<br>spelenderwijs
      </div>
      <div style="font-size:30px;color:${GROEN};margin-top:28px;font-weight:700">
        Voor kinderen van 5 tot en met 13
      </div>
    </div>
    <div style="position:absolute;left:96px;right:96px;bottom:52px;text-align:start;
                font-family:'Amiri Quran','Scheherazade New',serif;direction:rtl;
                white-space:nowrap;font-size:60px;color:${GOUD}">نُورٌ عَلَىٰ نُورٍ</div>
  </div>`, { width: 1200, height: 630 }, 'deelbeeld.png');

await browser.close();
console.log('\n  Klaar. Vergeet niet het manifest en index.html bij te werken als je\n  namen of maten verandert.\n');
