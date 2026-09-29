/**
 * Welke code zit er in deze bundel?
 *
 * Deze vraag lijkt overbodig — je hebt hem net gebouwd — tot de dag dat het
 * niet zo is. `npm run build` is op Windows stuk geweest sinds 25 september:
 * `sitecheck.mjs` maakte van een pad een webadres zonder de padscheiding te
 * normaliseren, dus op Windows werd `/es` een `/es\`, en dat staat nooit in de
 * sitemap. Dertig fouten, exitcode 1. En `aab` hangt aan `android` hangt aan
 * `build`, dus vanaf dat moment werd er geen nieuwe bundel meer gemaakt —
 * terwijl de vorige nog netjes op de uitvoerplek lag.
 *
 * Er is één kenmerk dat hard onderscheidt, en dat is geen datum of een
 * versienummer maar de inhoud zelf. Sinds `target: 'es2019'` in vite.config.ts
 * schrijft esbuild geen `?.` en geen `??` meer weg; daarvoor stond de bundel er
 * vol mee. Nul betekent dus: gebouwd mét die instelling. Een paar duizend
 * betekent: gebouwd zonder, en dan is dit niet de app waarvan je denkt dat je
 * hem hebt opgestuurd.
 *
 *   npm run watzitin                    de laatst gebouwde bundel
 *   npm run watzitin -- --aab <pad>     een andere
 *
 * Een AAB is een zip. Die wordt hier zelf uitgelezen en niet met `unzip`, want
 * dat programma staat niet op elke Windows-machine.
 */
import { createHash } from 'node:crypto'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { inflateRawSync } from 'node:zlib'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STANDAARD = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')

const i = process.argv.indexOf('--aab')
const AAB = i > 0 && process.argv[i + 1] ? process.argv[i + 1] : STANDAARD

if (!existsSync(AAB)) {
  console.error(`\nGeen bundel op:\n  ${AAB}\n`)
  console.error('Geef er een aan met  --aab <pad>  of bouw hem:\n')
  console.error('  npm run aab -- --versie 4 --naam 1.2\n')
  process.exit(1)
}

/* --------------------------------------------------------------------- zip */

/**
 * De inhoudsopgave van een zip staat achteraan, niet vooraan. Je vindt hem via
 * het eindblok (`PK\5\6`), en dat blok staat op een onbekende afstand van het
 * einde omdat er een commentaar achter mag staan. Vandaar het achteruit zoeken.
 */
function lees(pad) {
  const buf = readFileSync(pad)
  let eind = -1
  for (let p = buf.length - 22; p >= 0 && p > buf.length - 65558; p--) {
    if (buf.readUInt32LE(p) === 0x06054b50) { eind = p; break }
  }
  if (eind < 0) throw new Error('dit is geen zip: geen eindblok gevonden')

  const aantal = buf.readUInt16LE(eind + 10)
  let p = buf.readUInt32LE(eind + 16)
  if (p === 0xffffffff) throw new Error('zip64, en dat leest dit script niet')

  const uit = new Map()
  for (let n = 0; n < aantal; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`kapotte inhoudsopgave bij ${n}`)
    const methode = buf.readUInt16LE(p + 10)
    const dos = buf.readUInt32LE(p + 12)
    const ingepakt = buf.readUInt32LE(p + 20)
    const naamlengte = buf.readUInt16LE(p + 28)
    const extra = buf.readUInt16LE(p + 30)
    const commentaar = buf.readUInt16LE(p + 32)
    const begin = buf.readUInt32LE(p + 42)
    const naam = buf.toString('utf8', p + 46, p + 46 + naamlengte)
    uit.set(naam, { methode, ingepakt, begin, dos })
    p += 46 + naamlengte + extra + commentaar
  }

  /** Eén bestand eruit halen. De naam staat ook in de lokale kop, en die is daar even lang. */
  const pak = (naam) => {
    const e = uit.get(naam)
    if (!e) return null
    const nl = buf.readUInt16LE(e.begin + 26)
    const el = buf.readUInt16LE(e.begin + 28)
    const van = e.begin + 30 + nl + el
    const rauw = buf.subarray(van, van + e.ingepakt)
    if (e.methode === 0) return rauw
    if (e.methode === 8) return inflateRawSync(rauw)
    throw new Error(`onbekende inpakmethode ${e.methode} voor ${naam}`)
  }
  return { namen: [...uit.keys()], entries: uit, pak }
}

let zip
try {
  zip = lees(AAB)
} catch (fout) {
  console.error(`\nIk kan deze bundel niet openen: ${fout.message}\n`)
  process.exit(1)
}

/* ------------------------------------------------------------------ inhoud */

const mb = (statSync(AAB).size / 1048576).toFixed(1)
console.log(`\nBundel: ${AAB}`)
console.log(`        ${mb} MB, ${zip.namen.length} bestanden`)
console.log(`        gebouwd op ${new Date(statSync(AAB).mtimeMs).toLocaleString('nl-NL')}\n`)

const jsNamen = zip.namen.filter((n) => /^base\/assets\/public\/assets\/.*\.js$/.test(n))
if (!jsNamen.length) {
  console.error('Er zit geen javascript van de app in base/assets/public/assets/.')
  console.error('Dan is dit geen bundel van deze app, of de synchronisatie is misgegaan.\n')
  process.exit(1)
}

let bron = ''
for (const n of jsNamen) bron += `${zip.pak(n).toString('utf8')}\n`

const chain = (bron.match(/\?\.[a-zA-Z_$[(]/g) ?? []).length
const nullish = (bron.match(/\?\?/g) ?? []).length

console.log(`Javascript: ${jsNamen.length} bestanden, ${Math.round(bron.length / 1024)} kB`)
console.log(`  ?.  optional chaining   ${String(chain).padStart(5)}×`)
console.log(`  ??  nullish             ${String(nullish).padStart(5)}×\n`)

/* Hetzelfde geteld in wat er nu in dist/ staat, als dat er is. */
const DIST = path.join(ROOT, 'dist', 'assets')
if (existsSync(DIST)) {
  let nu = ''
  for (const f of readdirSync(DIST).filter((f) => f.endsWith('.js'))) {
    nu += `${readFileSync(path.join(DIST, f), 'utf8')}\n`
  }
  const nuChain = (nu.match(/\?\.[a-zA-Z_$[(]/g) ?? []).length
  console.log(`Wat er nu in dist/ staat: ${nuChain}× ?.`)
  const zelfde = (a, b) => {
    const h = (x) => createHash('sha256').update(x).digest('hex').slice(0, 12)
    return [h(a), h(b)]
  }
  const inBundel = zip.pak('base/assets/public/index.html')
  const opSchijf = path.join(ROOT, 'dist', 'index.html')
  if (inBundel && existsSync(opSchijf)) {
    const [a, b] = zelfde(inBundel, readFileSync(opSchijf))
    console.log(`index.html in de bundel  ${a}`)
    console.log(`index.html in dist/      ${b}   ${a === b ? '— gelijk' : '— VERSCHILLEND'}`)
  }
  console.log('')
}

if (chain === 0 && nullish === 0) {
  console.log('Deze bundel is gebouwd met target: es2019 uit vite.config.ts. Dat is de')
  console.log('instelling van 29 september, dus de code hierin is van die dag of later.\n')
  process.exit(0)
}

console.log('Deze bundel is NIET gebouwd met target: es2019.\n')
console.log('Dat betekent dat de code erin ouder is dan 29 september — en dus dat dit')
console.log('niet de app is waarvan je denkt dat je hem hebt opgestuurd. Op een WebView')
console.log('van voor augustus 2020 valt hij bovendien om bij het inlezen, zonder')
console.log('foutmelding: precies wat Google "installs, but doesn\'t load" noemt.\n')
console.log('Bouw hem opnieuw, met een versiecode die nog niet gebruikt is:\n')
console.log('  npm run aab -- --versie 4 --naam 1.2\n')
process.exit(1)
