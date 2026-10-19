/**
 * Een getekend tafereel: twee ouders die Darija praten, en een kind ernaast.
 *
 * De grap van het kanaal in één beeld. Vader en moeder praten over iets wat de
 * kinderen niet hoeven te volgen, dus ze doen het in het Darija -- en het kind
 * staat erbij met een vraagteken. Dat is de hele post, zonder dat er een regel
 * gelezen hoeft te worden.
 *
 * Getekend en niet gefotografeerd, en in hetzelfde palet als `lib/tekenen.mjs`:
 * dit hoort bij dezelfde reeks als Sba en de prentenboeken. Een plaat in een
 * vreemde stijl is reclame voor iets anders.
 *
 * Wat er met opzet NIET in staat: woorden in de tekstballonnen van de ouders.
 * Er staan krullen. Zet je daar echte Darija neer, dan moet die kloppen, en
 * een zin die net verkeerd staat valt juist op bij het publiek dat je wilt
 * bereiken. Krullen lezen als "ze praten een taal die jij niet volgt", en dat
 * is precies wat het kind ziet.
 *
 * Draaien:
 *   node scripts/make-tafereel.mjs
 *   node scripts/make-tafereel.mjs --kop "Nog even, dan verstaat hij je wel" --naam geheimtaal
 */
import { mkdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { startChroom } from './lib/chroom.mjs'
import { K } from './lib/tekenen.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'weetjes')

const args = process.argv.slice(2)
const arg = (naam, terug = '') => {
  const i = args.indexOf(`--${naam}`)
  return i >= 0 && args[i + 1] ? args[i + 1] : terug
}

const kop = arg('kop')
const voet = arg('voet')
const naam = arg('naam', 'tafereel')

/* Huidtinten en haar staan hier en niet in tekenen.mjs: die bibliotheek tekent
   een leeuw, en een leeuw heeft geen huid. Komt er een tweede tafereel, dan
   verhuizen ze. */
const H = {
  huid: '#e3ab7e', huidDonker: '#c98f63', haar: '#2b1d16',
  hoofddoek: '#c75b3e', hoofddoekDonker: '#a8452c',
  hemd: '#2f5fb3', jurk: '#0d9488', trui: '#e8b93f',
}

/** Eén doorgaande lijn, geen vulling. Zie Khatim.tsx: een zegel, geen sticker. */
const STER = 'M50 2 L78.5 89.7 L3.8 35.5 L96.2 35.5 L21.5 89.7 Z'

/**
 * Een tekstballon met een punt naar beneden.
 *
 * `kant` zegt waar de punt zit: -1 links, 1 rechts. Zo wijst de ballon naar de
 * persoon die praat in plaats van ergens tussenin te zweven.
 */
const ballon = (x, y, w, h, kant, inhoud) => {
  const px = x + (kant < 0 ? w * 0.26 : w * 0.74)
  return `<g>
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h * 0.34}" fill="${K.creme}" stroke="${K.inkt}" stroke-width="5"/>
    <path d="M${px - 18} ${y + h - 3} L${px + 4} ${y + h + 34} L${px + 20} ${y + h - 3} Z" fill="${K.creme}" stroke="${K.inkt}" stroke-width="5" stroke-linejoin="round"/>
    <path d="M${px - 14} ${y + h - 4} L${px + 18} ${y + h - 4}" stroke="${K.creme}" stroke-width="7"/>
    ${inhoud}
  </g>`
}

/** Krullen die lezen als schrift van rechts naar links, zonder woorden te zijn. */
const krullen = (x, y, breedte, regels = 2) =>
  Array.from({ length: regels }, (_, r) => {
    const yy = y + r * 34
    const w = r === regels - 1 ? breedte * 0.62 : breedte
    return `<path d="M${x + w} ${yy} q-${w * 0.16} 16 -${w * 0.3} 0 q-${w * 0.14} -16 -${w * 0.28} 0 q-${w * 0.12} 15 -${w * 0.24} 2"
      fill="none" stroke="${K.inkt}" stroke-width="6" stroke-linecap="round"/>
    <circle cx="${x + w - breedte * 0.2}" cy="${yy - 18}" r="3.4" fill="${K.inkt}"/>
    <circle cx="${x + w - breedte * 0.52}" cy="${yy - 18}" r="3.4" fill="${K.inkt}"/>`
  }).join('')

/** Vader: hoofd, kort haar, baard, overhemd. Kijkt naar rechts. */
const vader = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-108 200 q0 -112 108 -112 q108 0 108 112 Z" fill="${H.hemd}"/>
  <path d="M-34 90 l34 40 l34 -40 l-16 -8 l-18 22 l-18 -22 Z" fill="${K.creme}"/>
  <path d="M-30 86 q30 34 60 0 l0 -34 l-60 0 Z" fill="${H.huidDonker}"/>
  <circle cx="0" cy="0" r="78" fill="${H.huid}"/>
  <path d="M-78 4 q6 -84 78 -84 q72 0 78 84 q-10 -46 -78 -46 q-68 0 -78 46 Z" fill="${H.haar}"/>
  <path d="M-58 30 q10 60 58 60 q48 0 58 -60 q-16 26 -58 26 q-42 0 -58 -26 Z" fill="${H.haar}" opacity=".92"/>
  <circle cx="-26" cy="6" r="7" fill="${K.inkt}"/>
  <circle cx="30" cy="6" r="7" fill="${K.inkt}"/>
  <circle cx="-23.5" cy="3.5" r="2.4" fill="#fff"/>
  <circle cx="32.5" cy="3.5" r="2.4" fill="#fff"/>
  <path d="M-40 -14 q13 -9 25 -3 M18 -17 q13 -6 25 3" stroke="${K.inkt}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
  <path d="M-8 44 q16 12 30 -2" stroke="${K.inkt}" stroke-width="5" fill="none" stroke-linecap="round"/>
</g>`

/**
 * Moeder met hoofddoek.
 *
 * De doek is één vorm die hoofd, hals en schouders in één keer dekt, en het
 * gezicht is een ovaal dat er bovenop ligt. De eerste versie tekende hem als
 * haar met twee lappen ernaast; dat leest niet als een hoofddoek maar als
 * oranje haar met flappen. Zo hoort het: geen haar te zien, de doek loopt
 * door tot over de schouders, en de rand om het gezicht is één ronde lijn.
 */
const moeder = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-116 200 q-10 -118 48 -150 q-18 -46 14 -78 q22 -24 54 -24 q32 0 54 24 q32 32 14 78 q58 32 48 150 Z" fill="${H.hoofddoek}"/>
  <path d="M-116 200 q-6 -74 20 -116 q-2 70 16 116 Z" fill="${H.hoofddoekDonker}"/>
  <path d="M116 200 q6 -74 -20 -116 q2 70 -16 116 Z" fill="${H.hoofddoekDonker}"/>
  <path d="M-52 150 q52 40 104 0 l10 50 l-124 0 Z" fill="${H.jurk}"/>
  <ellipse cx="0" cy="10" rx="58" ry="64" fill="${H.huid}"/>
  <!-- De rand van de doek over het voorhoofd, ná het gezicht getekend. Zonder
       deze band loopt het voorhoofd door tot boven in de doek en leest ze als
       kaal met een doek eromheen in plaats van met een doek óp. -->
  <path d="M-58 12 Q-58 -56 0 -56 Q58 -56 58 12 Q48 -26 0 -26 Q-48 -26 -58 12 Z" fill="${H.hoofddoek}"/>
  <path d="M-58 12 Q-58 -56 0 -56 Q58 -56 58 12" fill="none" stroke="${H.hoofddoekDonker}" stroke-width="4" opacity=".5"/>
  <circle cx="-24" cy="12" r="7" fill="${K.inkt}"/>
  <circle cx="24" cy="12" r="7" fill="${K.inkt}"/>
  <circle cx="-21.5" cy="9.5" r="2.4" fill="#fff"/>
  <circle cx="26.5" cy="9.5" r="2.4" fill="#fff"/>
  <path d="M-38 -10 q12 -9 24 -3 M14 -13 q12 -6 24 3" stroke="${K.inkt}" stroke-width="5.5" fill="none" stroke-linecap="round"/>
  <circle cx="-40" cy="34" r="10" fill="${K.terra}" opacity=".26"/>
  <circle cx="40" cy="34" r="10" fill="${K.terra}" opacity=".26"/>
  <path d="M-15 48 q15 13 30 -2" stroke="${K.inkt}" stroke-width="5" fill="none" stroke-linecap="round"/>
</g>`

/** Het kind: kleiner, kijkt omhoog, en snapt er niets van. */
const kind = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})">
  <path d="M-80 160 q0 -88 80 -88 q80 0 80 88 Z" fill="${H.trui}"/>
  <circle cx="0" cy="0" r="68" fill="${H.huid}"/>
  <path d="M-68 -6 q4 -74 68 -74 q64 0 68 74 q-14 -40 -68 -40 q-54 0 -68 40 Z" fill="${H.haar}"/>
  <circle cx="-24" cy="4" r="7.5" fill="${K.inkt}"/>
  <circle cx="24" cy="4" r="7.5" fill="${K.inkt}"/>
  <circle cx="-21.5" cy="1" r="2.6" fill="#fff"/>
  <circle cx="26.5" cy="1" r="2.6" fill="#fff"/>
  <path d="M-38 -18 q12 -10 24 -2 M14 -20 q12 -8 24 2" stroke="${K.inkt}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M-12 40 q12 -8 24 0" stroke="${K.inkt}" stroke-width="5" fill="none" stroke-linecap="round"/>
</g>`

const html = async () => {
  /* Waar de ballonnen van de ouders beginnen. Laag genoeg dat hun punt bijna
     het hoofd raakt -- anders zweven er twee wolkjes los boven de plaat. */
  const BAL = kop ? 296 : 212
  const baloo = `data:font/woff2;base64,${(await readFile(path.join(ROOT, 'public', 'fonts', 'baloo2-800.woff2'))).toString('base64')}`
  const naskh = `data:font/woff2;base64,${(await readFile(path.join(ROOT, 'public', 'fonts', 'noto-naskh-arabic-700.woff2'))).toString('base64')}`
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

  return `<!doctype html>
<meta charset="utf-8">
<style>
  @font-face { font-family: Baloo; src: url(${baloo}) format('woff2'); font-weight: 800 }
  @font-face { font-family: Naskh; src: url(${naskh}) format('woff2'); font-weight: 700 }
  * { margin: 0; padding: 0 }
  body { width: 1080px; height: 1350px; overflow: hidden; font-family: Baloo, sans-serif }
</style>
<svg width="1080" height="1350" viewBox="0 0 1080 1350" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <pattern id="sterren" width="190" height="190" patternUnits="userSpaceOnUse">
      <path d="${STER}" fill="none" stroke="${K.saffraan}" stroke-width="5" stroke-linejoin="round" transform="translate(45 45)"/>
    </pattern>
    <linearGradient id="lucht" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${K.zand}"/><stop offset="1" stop-color="${K.creme}"/>
    </linearGradient>
  </defs>

  <rect width="1080" height="1350" fill="url(#lucht)"/>
  <rect width="1080" height="1350" fill="url(#sterren)" opacity=".13"/>

  ${kop ? `<text x="540" y="100" text-anchor="middle" font-size="52" font-weight="800" fill="${K.inkt}">${esc(kop)}</text>` : ''}

  <!-- de twee ballonnen van de ouders, met krullen in plaats van woorden -->
  ${ballon(54, BAL, 404, 146, 1, krullen(96, BAL + 60, 316))}
  ${ballon(622, BAL, 404, 146, -1, krullen(664, BAL + 60, 316))}

  ${vader(306, 572, 1.04)}
  ${moeder(774, 572, 1.04)}

  <!-- en het kind, dat er niets van volgt -->
  ${ballon(690, 862, 226, 146, -1, `<text x="803" y="970" text-anchor="middle" font-size="94" font-weight="800" fill="${K.terra}" font-family="Naskh">؟؟</text>`)}
  ${kind(452, 982, 1.02)}

  <g transform="translate(540 1272)">
    <path d="${STER}" fill="none" stroke="${K.saffraan}" stroke-width="8" stroke-linejoin="round" transform="translate(-232 -34) scale(.62)"/>
    <text x="-168" y="12" font-size="52" font-weight="800" fill="${K.inkt}">Darijaforkids</text>
  </g>
  ${voet ? `<text x="540" y="1332" text-anchor="middle" font-size="30" font-weight="800" fill="${K.inkt}" opacity=".6">${esc(voet)}</text>` : ''}
</svg>`
}

const browser = await startChroom()
const page = await browser.newPage()
await page.setViewportSize({ width: 1080, height: 1350 })
await page.setContent(await html(), { waitUntil: 'load' })
await page.evaluate(() => document.fonts.ready)
await mkdir(UIT, { recursive: true })
const uit = path.join(UIT, `${naam}.png`)
await page.screenshot({ path: uit })
await browser.close()

console.log(`\n${path.relative(ROOT, uit)}\n`)
