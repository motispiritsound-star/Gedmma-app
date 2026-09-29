/**
 * Draait de gebouwde app op de WebView die we beloven?
 *
 * `android/variables.gradle` zet `minSdkVersion = 24`. Daarmee zeggen we tegen
 * Google Play: deze app mag op Android 7 geïnstalleerd worden. Wat er daarna
 * gebeurt hangt niet van Android af maar van de WebView, en die wordt los
 * bijgewerkt — op een toestel waar dat nooit gebeurd is, is hij stokoud.
 *
 * Er zijn twee soorten gat, en ze vallen op verschillende momenten om.
 *
 * SYNTAXIS. Kent de WebView `?.` of `??=` niet, dan faalt het inlezen van het
 * hele bestand. Geen foutmelding, geen halve app, niets — precies wat Google's
 * beleid "apps that install, but don't load" noemt. Daar is `target` in
 * vite.config.ts voor: esbuild garandeert dan dat er niets nieuwers in staat.
 * Dit script hoeft dat dus niet na te tellen, en dat is maar goed ook: een
 * regex die naar `?.` zoekt vindt ook `cond ? .89 : 1`, en dat is geen
 * optional chaining. Zelf in getrapt.
 *
 * FUNCTIES. Die maakt esbuild niet bij. `Object.hasOwn` bestaat sinds Chrome
 * 93; komt hij ongepolyfild in de bundel, dan valt de app om op het moment dat
 * die regel draait. Dát is wat hier wordt geteld, want die kruipt er stilletjes
 * in via een afhankelijkheid die je bijwerkt.
 *
 * Dit hangt aan `npm run build` en niet aan de tests, omdat het de gebouwde
 * bundel nodig heeft. `dist/` staat in .gitignore, dus een test die eruit leest
 * faalt in CI met ENOENT — vanochtend precies zo misgegaan met `_headers`.
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const ASSETS = path.join(ROOT, 'dist', 'assets')

/**
 * Functies die er op een oudere WebView niet zijn, met de Chrome-versie erbij.
 *
 * Alleen dingen met een eigen naam: die zijn betrouwbaar te tellen, anders dan
 * syntaxis. Komt er een bij die we echt nodig hebben, zet hem dan in
 * `src/polyfill.ts` en niet in deze lijst.
 */
const TE_NIEUW = [
  // Let op de grens: zonder die `(?![A-Za-z])` matcht dit ook het begin van
  // `Object.hasOwnProperty`, en dat is een functie die er altijd al was.
  // Precies daar ben ik in getrapt: framer-motion gebruikt hasOwnProperty, en
  // ik concludeerde dat de bundel Chrome 93 eiste.
  ['Object.hasOwn', /Object\.hasOwn(?![A-Za-z])/g, 93],
  ['structuredClone', /\bstructuredClone\s*\(/g, 98],
  ['.findLast(', /\.findLast(?:Index)?\s*\(/g, 97],
  ['Array.prototype.at', /\.at\s*\(\s*-?\d/g, 92],
  ['crypto.randomUUID', /\brandomUUID\s*\(/g, 92],
  ['.replaceAll(', /\.replaceAll\s*\(/g, 85],
  ['Promise.any', /\bPromise\.any\s*\(/g, 85],
  ['String.prototype.matchAll', /\.matchAll\s*\(/g, 73],
]

if (!existsSync(ASSETS)) {
  console.error('\nGeen dist/assets. Draai eerst de bouw; dit hoort achter `vite build`.\n')
  process.exit(1)
}

const bestanden = readdirSync(ASSETS).filter((f) => f.endsWith('.js'))
if (!bestanden.length) {
  console.error('\nGeen javascript in dist/assets. Is de bouw wel gelukt?\n')
  process.exit(1)
}
const bron = bestanden.map((f) => readFileSync(path.join(ASSETS, f), 'utf8')).join('\n')

/*
 * Wat de polyfill dekt, gelezen uit de polyfill zelf.
 *
 * Eerst zocht ik in de gebouwde bundel naar `hasOwnProperty.call` en nam dat
 * als bewijs dat de polyfill erin zat. Dat werkte niet: dat patroon staat in
 * zo'n beetje elke gebundelde bibliotheek, dus de controle zei altijd ja. Bij
 * de A/B — de import in main.tsx uitgezet — viel hij dan ook niet om.
 *
 * De bron is eenduidig: staat de naam in src/polyfill.ts, dan is hij daar
 * bijgezet. Of die polyfill ook echt als eerste wordt ingeladen is een andere
 * vraag, en die wordt in src/site/bundel.test.ts gesteld.
 */
const POLYFILL = path.join(ROOT, 'src', 'polyfill.ts')
const gedekt = existsSync(POLYFILL) ? readFileSync(POLYFILL, 'utf8') : ''
const heeftPolyfill = (naam) => gedekt.includes(naam.replace(/^\./, '').replace(/\($/, ''))

const gevonden = TE_NIEUW
  .map(([naam, re, chrome]) => [naam, (bron.match(re) ?? []).length, chrome])
  .filter(([naam, n]) => n > 0 && !heeftPolyfill(naam))

const kb = Math.round(bestanden.reduce((s, f) => s + readFileSync(path.join(ASSETS, f)).length, 0) / 1024)

if (!gevonden.length) {
  console.log(`\nDe bundel (${kb} kB javascript) gebruikt geen functies die een oudere WebView mist.\n`)
  process.exit(0)
}

console.error(`\nDe bundel gebruikt ${gevonden.length === 1 ? 'een functie' : 'functies'} die een oudere WebView niet heeft:\n`)
for (const [naam, n, chrome] of gevonden) {
  console.error(`  ${naam.padEnd(28)} ${String(n).padStart(4)}×   bestaat pas vanaf Chrome ${chrome}`)
}
console.error('\nminSdkVersion is 24, dus de app mag op Android 7 geïnstalleerd worden.')
console.error('Daar kan de WebView ouder zijn dan dit, en dan valt de app om op het')
console.error('moment dat zo\'n regel draait.\n')
console.error('Gebruik iets dat er wel is, of zet hem bij: maak src/polyfill.ts aan')
console.error('en importeer die als eerste regel van src/main.tsx.\n')
process.exit(1)
