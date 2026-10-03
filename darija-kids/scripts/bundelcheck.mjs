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

import { TE_NIEUW } from './lib/tenieuw.mjs'


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

/*
 * En de syntaxis toch, voor één geval.
 *
 * Hierboven staat dat dit script geen syntaxis telt, omdat een regex die naar
 * `?.` zoekt ook `cond ? .89 : 1` vindt. Dat klopt nog steeds voor een losse
 * `\?\.`, maar niet voor deze: na de punt moet een letter, `_`, `$`, `[` of
 * `(` komen, en in `? .89` staat daar een cijfer met een spatie ervoor.
 *
 * Waarom dit er alsnog bij staat terwijl `target` in vite.config.ts de
 * garantie al geeft: die garantie geldt voor code die de bundelaar ontleedt.
 * Een afhankelijkheid die voorgebouwd javascript meelevert dat ongemoeid
 * doorgelaten wordt, valt erbuiten. Dat is precies het gat waar je niet in
 * kijkt, want de instelling stáát goed.
 *
 * En dit is niet theoretisch. De bundel die als versiecode 3 werd geüpload had
 * 223 keer `?.` en 167 keer `??` — syntaxis van Chrome 80 — terwijl er op
 * Android 7 een WebView kan staan van Chrome 51. Zo'n bestand wordt niet
 * ingelezen: geen foutmelding, geen halve app, een wit scherm. Google noemt
 * dat "installs, but doesn't load", en de app is erop afgewezen.
 */
const SYNTAXIS = [
  ['?.  optional chaining', /\?\.[a-zA-Z_$[(]/g, 80],
  ['??  nullish', /\?\?/g, 80],
  ['??= ||= &&=', /(?:\?\?|\|\||&&)=/g, 85],
]
const syntaxis = SYNTAXIS
  .map(([naam, re, chrome]) => [naam, (bron.match(re) ?? []).length, chrome])
  .filter(([, n]) => n > 0)

const kb = Math.round(bestanden.reduce((s, f) => s + readFileSync(path.join(ASSETS, f)).length, 0) / 1024)

if (syntaxis.length) {
  console.error(`\nDe bundel bevat syntaxis die een oudere WebView niet kan inlezen:\n`)
  for (const [naam, n, chrome] of syntaxis) {
    console.error(`  ${naam.padEnd(28)} ${String(n).padStart(4)}x   bestaat pas vanaf Chrome ${chrome}`)
  }
  console.error('\nDit is geen fout die bij het uitvoeren opvalt: het hele bestand wordt')
  console.error('niet ingelezen. Wit scherm, geen melding. Kijk of `target` in')
  console.error('vite.config.ts nog op es2015 staat, en of er een afhankelijkheid bij is')
  console.error('gekomen die voorgebouwd javascript meelevert.\n')
  process.exit(1)
}

if (!gevonden.length) {
  console.log(`\nDe bundel (${kb} kB javascript) gebruikt geen syntaxis en geen functies die een oudere WebView mist.\n`)
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
