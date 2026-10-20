/**
 * De beelden voor Google Play en voor het toestel.
 *
 *   npm run beeld
 *
 * Capacitor zet zijn eigen logo neer als app-pictogram. Dat is prima om mee te
 * beginnen en onmogelijk om mee te publiceren, dus maakt dit script alles
 * opnieuw uit het merkteken in src/merk/Merkteken.tsx:
 *
 *   - het pictogram van de app, in alle vijf de dichtheden, plus de adaptieve
 *     voorgrond die Android vanaf versie 8 gebruikt;
 *   - het startscherm;
 *   - het pictogram van 512x512 en de uitgelichte afbeelding van 1024x500 die
 *     de Play Console eist;
 *
 * Getekend met een headless browser in plaats van met een beeldbibliotheek:
 * het merkteken is al een SVG en de browser is de enige die hem precies zo
 * tekent als in de app. Geen tweede tekening die uit de pas gaat lopen.
 *
 * De schermafdrukken voor de winkelvermelding maakt `npm run schermen`.
 */
import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const WORTEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const RES = path.join(WORTEL, 'android', 'app', 'src', 'main', 'res')
const WINKEL = path.join(WORTEL, 'winkel')

/* De merkkleuren. Gelijk aan src/merk/kleuren.ts en src/stijl.css. */
const CINI = '#2f4fa8'
const PAPIER = '#f6f8fd'

/** De tulp uit Merkteken.tsx. Eén vorm, hier en daar. */
const TULP = 'M24 4c3.4 4.2 5.2 8.1 5.2 12.3 0 2.3-.6 4.4-1.7 6.2 2.6-1.1 4.6-3.2 6-6.3 1.6 3.6 2.1 6.9 1.4 9.9-1.4 6.3-6.3 11-10.9 15.9-4.6-4.9-9.5-9.6-10.9-15.9-.7-3-.2-6.3 1.4-9.9 1.4 3.1 3.4 5.2 6 6.3a12.4 12.4 0 0 1-1.7-6.2C18.8 12.1 20.6 8.2 24 4Z'

/**
 * Het merkteken als losse svg.
 *
 * `rand` is de lege ruimte eromheen in procenten. Een adaptief pictogram op
 * Android wordt bijgesneden tot een cirkel, en wat te dicht op de rand staat
 * valt eraf -- vandaar dat de voorgrond veel meer lucht krijgt dan het platte
 * pictogram.
 */
const merkteken = ({ grootte, rand = 0, achtergrond = 'none', letter = true }) => {
  const binnen = 48 / (1 - rand * 2)
  const verschuiving = (binnen - 48) / 2
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${grootte}" height="${grootte}" viewBox="${-verschuiving} ${-verschuiving} ${binnen} ${binnen}">
  ${achtergrond === 'none' ? '' : `<rect x="${-verschuiving}" y="${-verschuiving}" width="${binnen}" height="${binnen}" fill="${achtergrond}"/>`}
  <path d="${TULP}" fill="${CINI}" opacity="0.16"/>
  <path d="${TULP}" fill="none" stroke="${CINI}" stroke-width="2.2" stroke-linejoin="round"/>
  ${letter ? `<text x="24" y="30" text-anchor="middle" font-size="15" font-weight="800" fill="${CINI}" font-family="Nunito, Trebuchet MS, system-ui, sans-serif">D</text>` : ''}
</svg>`
}

const browser = await chromium.launch()
const pagina = await browser.newPage()

/** Een svg naar een png van een vaste maat. */
async function teken(svg, breedte, hoogte, naar) {
  mkdirSync(path.dirname(naar), { recursive: true })
  await pagina.setViewportSize({ width: breedte, height: hoogte })
  await pagina.setContent(
    `<body style="margin:0;width:${breedte}px;height:${hoogte}px;overflow:hidden">${svg}</body>`,
    { waitUntil: 'load' },
  )
  await pagina.screenshot({ path: naar, omitBackground: true })
}

/* -- het pictogram van de app --------------------------------------------- */

const DICHTHEDEN = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }

for (const [naam, maat] of Object.entries(DICHTHEDEN)) {
  const map = path.join(RES, `mipmap-${naam}`)
  // Het platte pictogram, voor Android 7 en ouder: achtergrond erin gebakken.
  await teken(merkteken({ grootte: maat, rand: 0.08, achtergrond: PAPIER }), maat, maat,
    path.join(map, 'ic_launcher.png'))
  await teken(merkteken({ grootte: maat, rand: 0.08, achtergrond: PAPIER }), maat, maat,
    path.join(map, 'ic_launcher_round.png'))
  /*
   * De adaptieve voorgrond is anderhalf keer zo groot en doorzichtig: Android
   * legt er zelf een achtergrond onder en snijdt hem bij tot de vorm die het
   * toestel gebruikt. Zonder die extra lucht valt de tulp eraf op een toestel
   * dat ronde pictogrammen tekent.
   */
  const voorgrond = Math.round(maat * 1.5)
  await teken(merkteken({ grootte: voorgrond, rand: 0.26 }), voorgrond, voorgrond,
    path.join(map, 'ic_launcher_foreground.png'))
}

// De achtergrond van het adaptieve pictogram: effen papier.
writeFileSync(path.join(RES, 'values', 'ic_launcher_background.xml'),
  `<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">${PAPIER}</color>\n</resources>\n`, 'utf8')

/*
 * Capacitor schrijft de voorgrond als een vector die naar zijn eigen logo
 * wijst. Die moet weg, anders wint hij van de png's hierboven.
 */
for (const naam of ['ic_launcher.xml', 'ic_launcher_round.xml']) {
  writeFileSync(path.join(RES, 'mipmap-anydpi-v26', naam),
    [
      '<?xml version="1.0" encoding="utf-8"?>',
      '<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">',
      '    <background android:drawable="@color/ic_launcher_background"/>',
      '    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>',
      '</adaptive-icon>',
      '',
    ].join('\n'), 'utf8')
}

/* -- het startscherm ------------------------------------------------------ */

const splash = (b, h) => `<svg xmlns="http://www.w3.org/2000/svg" width="${b}" height="${h}" viewBox="0 0 ${b} ${h}">
  <rect width="${b}" height="${h}" fill="${PAPIER}"/>
  <g transform="translate(${b / 2 - Math.min(b, h) * 0.14}, ${h / 2 - Math.min(b, h) * 0.14}) scale(${Math.min(b, h) * 0.28 / 48})">
    <path d="${TULP}" fill="${CINI}" opacity="0.16"/>
    <path d="${TULP}" fill="none" stroke="${CINI}" stroke-width="2.2" stroke-linejoin="round"/>
    <text x="24" y="30" text-anchor="middle" font-size="15" font-weight="800" fill="${CINI}" font-family="Nunito, Trebuchet MS, system-ui, sans-serif">D</text>
  </g>
</svg>`

const SPLASH = { mdpi: [320, 480], hdpi: [480, 800], xhdpi: [720, 1280], xxhdpi: [960, 1600], xxxhdpi: [1280, 1920] }
for (const [naam, [b, h]] of Object.entries(SPLASH)) {
  await teken(splash(b, h), b, h, path.join(RES, `drawable-port-${naam}`, 'splash.png'))
  await teken(splash(h, b), h, b, path.join(RES, `drawable-land-${naam}`, 'splash.png'))
}
await teken(splash(480, 800), 480, 800, path.join(RES, 'drawable', 'splash.png'))

/* -- wat de Play Console eist --------------------------------------------- */

// Het pictogram in de winkel: 512x512, geen doorzichtigheid.
await teken(merkteken({ grootte: 512, rand: 0.1, achtergrond: PAPIER }), 512, 512,
  path.join(WINKEL, 'pictogram-512.png'))

/*
 * De uitgelichte afbeelding: 1024x500, en hij wordt op een telefoon flink
 * verkleind. Dus groot teken, weinig woorden -- een regel die je op een
 * duimnagel nog kunt lezen.
 */
const uitgelicht = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="500" viewBox="0 0 1024 500">
  <rect width="1024" height="500" fill="${PAPIER}"/>
  <g transform="translate(96, 140) scale(4.6)">
    <path d="${TULP}" fill="${CINI}" opacity="0.16"/>
    <path d="${TULP}" fill="none" stroke="${CINI}" stroke-width="2.2" stroke-linejoin="round"/>
    <text x="24" y="30" text-anchor="middle" font-size="15" font-weight="800" fill="${CINI}" font-family="Nunito, Trebuchet MS, system-ui, sans-serif">D</text>
  </g>
  <text x="360" y="232" font-size="86" font-weight="800" fill="#16213e" font-family="Nunito, Trebuchet MS, system-ui, sans-serif">Dilimiz</text>
  <text x="362" y="300" font-size="38" fill="#5a6283" font-family="system-ui, sans-serif">Türkisch für Kinder</text>
</svg>`
await teken(uitgelicht, 1024, 500, path.join(WINKEL, 'uitgelicht-1024x500.png'))

await browser.close()

console.log('Beelden gemaakt.')
console.log('')
console.log('  App-pictogram en startscherm:  android/app/src/main/res/')
console.log(`  Voor de Play Console:          ${path.relative(WORTEL, WINKEL)}/`)
console.log('')
console.log('Schermafdrukken voor de vermelding: npm run schermen')
