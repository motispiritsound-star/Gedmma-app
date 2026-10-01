/**
 * De profielfoto voor het WhatsApp-kanaal, in twee smaken, met een proef.
 *
 * `make-brand.mjs` maakt er al een, en die is goed — maar de vlagbadge staat
 * daar op 760,760, en dat is buiten de cirkel waar WhatsApp op uitsnijdt. Een
 * vierkant beeld wordt rond getoond, en wat in de hoek staat is het eerste wat
 * verdwijnt.
 *
 * Twee versies, want de vraag "ook de naam en het adres erop" heeft geen
 * algemeen juist antwoord:
 *
 * - **logo** — alleen het merk. Leesbaar tot 48 pixels, en dat is de maat
 *   waarop een kanaal in de lijst staat.
 * - **naam** — met het woordmerk en het adres eronder. Leesbaar vanaf een
 *   pixel of 150, dus op de kanaalpagina zelf.
 *
 * En een **proef**: allebei naast elkaar op 48, 96 en 192 pixels, in een echte
 * cirkel. Dat beslist de keuze sneller dan welk betoog ook.
 *
 * Draaien met:
 *   node scripts/make-kanaalfoto.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'brand', 'kanaal')

const NACHT = '#131b30'
const CREME = '#fffaf3'

const letter = async (gewicht) => {
  const bytes = await readFile(path.join(ROOT, 'public', 'fonts', `baloo2-${gewicht}.woff2`))
  return `@font-face { font-family: 'Baloo 2'; font-weight: ${gewicht}; src: url(data:font/woff2;base64,${bytes.toString('base64')}) format('woff2') }`
}
const LETTERS = (await Promise.all([600, 800].map(letter))).join('\n  ')

/** De achtpuntige khatam, dezelfde als in het app-icoon. */
const ster = (cx, cy, r, vul) => {
  const punten = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const straal = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * straal).toFixed(2)},${(cy + Math.sin(a) * straal).toFixed(2)}`
  })
  return `<polygon points="${punten.join(' ')}" fill="${vul}" />`
}

/** De Marokkaanse vlag als rond insigne. */
const PENTAGRAM = '<path d="M50 2 L78.5 89.7 L3.8 35.5 L96.2 35.5 L21.5 89.7 Z" fill="none" stroke="#006233" stroke-linejoin="round" stroke-linecap="round"/>'
const vlag = (cx, cy, r) => `
  <circle cx="${cx}" cy="${cy}" r="${(r * 1.09).toFixed(1)}" fill="#f59e0b"/>
  <circle cx="${cx}" cy="${cy}" r="${r}" fill="#c1272d"/>
  <g transform="translate(${cx} ${cy}) scale(${(r / 75).toFixed(4)}) translate(-50 -45.9)" stroke-width="9">${PENTAGRAM}</g>`

const GOUD = `<linearGradient id="goud" x1="0" y1="0" x2="1" y2="1">
  <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
</linearGradient>`

/**
 * Alleen het merk, en alles binnen de cirkel.
 *
 * De veilige straal is 46 procent van de zijde: wat daarbuiten ligt kan
 * wegvallen. De vlag staat daarom niet in de hoek maar rechtsonder *tegen de
 * ster aan*, waar hij hoe dan ook meekomt.
 */
const logoSvg = (z = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${z} ${z}" width="${z}" height="${z}">
  <defs>${GOUD}</defs>
  <rect width="${z}" height="${z}" fill="${NACHT}"/>
  ${ster(z / 2, z / 2, z * 0.325, 'url(#goud)')}
  ${ster(z / 2, z / 2, z * 0.153, '#0d9488')}
  <circle cx="${z / 2}" cy="${z / 2}" r="${z * 0.049}" fill="${CREME}"/>
  ${vlag(z * 0.695, z * 0.700, z * 0.088)}
</svg>`

/** Met het woordmerk en het adres, voor waar de foto groot staat. */
const naamSvg = (z = 1024) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${z} ${z}" width="${z}" height="${z}">
  <defs>${GOUD}</defs>
  <rect width="${z}" height="${z}" fill="${NACHT}"/>
  ${ster(z / 2, z * 0.395, z * 0.235, 'url(#goud)')}
  ${ster(z / 2, z * 0.395, z * 0.111, '#0d9488')}
  <circle cx="${z / 2}" cy="${z * 0.395}" r="${z * 0.035}" fill="${CREME}"/>
  ${vlag(z * 0.655, z * 0.525, z * 0.062)}
  <text x="${z / 2}" y="${z * 0.690}" text-anchor="middle" fill="${CREME}"
    font-family="'Baloo 2',system-ui,sans-serif" font-weight="800"
    font-size="${z * 0.088}" letter-spacing="${z * -0.001}">Darijaforkids</text>
  <text x="${z / 2}" y="${z * 0.760}" text-anchor="middle" fill="#f59e0b"
    font-family="'Baloo 2',system-ui,sans-serif" font-weight="800"
    font-size="${z * 0.042}" letter-spacing="${z * 0.002}">darijaforkids.eu</text>
</svg>`

/**
 * De proef: allebei in een echte cirkel, op de maten die WhatsApp gebruikt.
 *
 * 48 pixels is de lijst, 96 een gesprek, 192 de kanaalpagina. Wie dit ziet
 * hoeft niet te geloven dat tekst op een avatar niet werkt; hij ziet het.
 */
const proef = () => {
  const MATEN = [48, 96, 192]
  const rij = (naam, svg) => `
    <div class="rij">
      <div class="naam">${naam}</div>
      ${MATEN.map((m) => `<div class="vak">
        <div class="cirkel" style="width:${m}px;height:${m}px">${svg(m)}</div>
        <div class="maat">${m} px</div>
      </div>`).join('')}
    </div>`

  return `<!doctype html><meta charset="utf-8"><style>
  ${LETTERS}
  * { margin: 0; box-sizing: border-box }
  body {
    width: 1080px; height: 720px; background: #f4ead7; color: #2b1d16;
    font-family: 'Baloo 2', system-ui, sans-serif;
    padding: 56px; display: flex; flex-direction: column; gap: 44px; justify-content: center;
  }
  h1 { font-size: 40px; font-weight: 800 }
  .uitleg { font-size: 22px; font-weight: 600; opacity: .8; margin-top: -28px; line-height: 1.4 }
  .rij { display: flex; align-items: flex-end; gap: 56px }
  .naam { width: 130px; font-size: 26px; font-weight: 800; color: #7a2d13 }
  .vak { display: flex; flex-direction: column; align-items: center; gap: 10px }
  .cirkel { border-radius: 999px; overflow: hidden; box-shadow: 0 4px 14px rgba(43,29,22,.25) }
  .cirkel svg { display: block }
  .maat { font-size: 17px; font-weight: 600; opacity: .6 }
</style>
<h1>Hoe de kanaalfoto er echt uitziet</h1>
<div class="uitleg">WhatsApp snijdt elke profielfoto rond uit. In de kanaallijst is hij 48 pixels.</div>
${rij('Alleen logo', logoSvg)}
${rij('Met naam', naamSvg)}`
}

/* --------------------------------------------------------------- zetten */

await mkdir(UIT, { recursive: true })
const browser = await startChroom()
const pagina = await (await browser.newContext({ deviceScaleFactor: 1 })).newPage()

const zet = async (naam, html, w, h) => {
  await pagina.setViewportSize({ width: w, height: h })
  await pagina.setContent(html)
  await pagina.evaluate(() => document.fonts.ready)
  await pagina.waitForTimeout(150)
  const bestand = path.join(UIT, naam)
  await pagina.screenshot({ path: bestand })
  console.log(path.relative(ROOT, bestand))
}

const kaal = (svg) =>
  `<!doctype html><meta charset="utf-8"><style>${LETTERS}
   *{margin:0}body{width:1024px;height:1024px;overflow:hidden}svg{display:block}</style>${svg(1024)}`

await zet('kanaal-logo.png', kaal(logoSvg), 1024, 1024)
await zet('kanaal-naam.png', kaal(naamSvg), 1024, 1024)
await zet('proef.png', proef(), 1080, 720)

await browser.close()

await writeFile(
  path.join(UIT, 'README.md'),
  `# De kanaalfoto\n\nGemaakt met \`npm run kanaalfoto\`. Deze map staat in \`.gitignore\`.\n\n` +
    `| Bestand | Waarvoor |\n|---|---|\n` +
    `| \`kanaal-logo.png\` | alleen het merk — leesbaar tot 48 pixels |\n` +
    `| \`kanaal-naam.png\` | met woordmerk en adres — vanaf een pixel of 150 |\n` +
    `| \`proef.png\` | allebei in een cirkel, op 48, 96 en 192 |\n\n` +
    `WhatsApp snijdt een profielfoto rond uit, en in de kanaallijst is hij 48\n` +
    `pixels. Daarom staat de vlag hier niet in de hoek zoals in\n` +
    `\`brand/social/profielfoto.png\`, maar tegen de ster aan: wat in de hoek van\n` +
    `het vierkant staat, valt als eerste buiten de cirkel.\n\n` +
    `Het adres hoort eigenlijk in de **kanaalbeschrijving**, niet op de foto —\n` +
    `daar is het aanklikbaar en altijd leesbaar. De versie met naam is er voor\n` +
    `wie hem toch op het beeld wil.\n`,
)
console.log('\nklaar')
