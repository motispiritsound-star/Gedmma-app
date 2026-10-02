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
 * versienummer maar de inhoud zelf. Het bouwdoel in vite.config.ts bepaalt wat
 * esbuild wegschrijft, en elke stap omlaag laat een spoor na dat je kunt
 * tellen. Staan er `?.` en `??` in, dan is het de code van voor 29 september —
 * en dan is dit niet de app waarvan je denkt dat je hem hebt opgestuurd.
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
import { kwijtInDex, pluginstand, verwachteKlassen } from './lib/plugins.mjs'
import { hoogste, hoogsteNaam } from './lib/versies.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const STANDAARD = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')

/**
 * De opdracht die hierna gedraaid moet worden, met echte nummers erin.
 *
 * Niet `--versie <volgende>`: punthaken belanden letterlijk in de terminal, en
 * dat is hier al een paar keer gebeurd. Play weigert bovendien een versionCode
 * die al eens geüpload is, dus het nummer uit build.gradle plus één is het
 * enige antwoord dat klopt.
 */
function volgendeBouw() {
  const gradle = path.join(ROOT, 'android', 'app', 'build.gradle')
  const bron = existsSync(gradle) ? readFileSync(gradle, 'utf8') : ''
  // Het hoogste van de twee. In build.gradle staat wat deze machine het laatst
  // gebouwd heeft; in docs/versies.json staat wat welke machine dan ook ooit
  // gebouwd heeft. Een verse kloon kent alleen die tweede.
  const code = Math.max(Number(bron.match(/versionCode (\d+)/)?.[1]) || 0, hoogste(ROOT))
  const naam = hoogsteNaam(ROOT) ?? bron.match(/versionName "([^"]*)"/)?.[1]
  if (!code || !naam) return 'npm run aab'
  return `npm run aab -- --versie ${code + 1} --naam ${naam}`
}

const i = process.argv.indexOf('--aab')
const AAB = i > 0 && process.argv[i + 1] ? process.argv[i + 1] : STANDAARD

if (!existsSync(AAB)) {
  console.error(`\nGeen bundel op:\n  ${AAB}\n`)
  console.error('Zet --aab en een pad erachter om een andere te bekijken, of bouw hem:\n')
  console.error(`  ${volgendeBouw()}\n`)
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

/* ------------------------------------------------------------------ native */

/*
 * Zit de app zelf er wel in?
 *
 * Hierboven wordt het javascript gewogen, en dat is de helft. De andere helft
 * is de java: `MainActivity` opent het venster waar dat javascript in draait.
 * Zonder die klasse start Android de app, vindt hem niet, en sluit af voordat
 * er een letter op het scherm staat -- `ClassNotFoundException`, logo even in
 * beeld en weg.
 *
 * Dat is hier gebeurd, twee keer achter elkaar afgewezen door Google. De
 * oorzaak was niet een fout in de code maar een regel in `.gitignore`: de map
 * `android/` was uitgesloten met een uitzondering op de oude projectnaam, dus
 * `MainActivity.java` is nooit in de repository beland. Op de machine waar het
 * bestand ooit is gemaakt werkte alles; elke bundel uit een verse kloon was
 * leeg. Gradle klaagt daar niet over -- een android-project zonder activity is
 * een geldig android-project -- en Play keurt hem goed.
 *
 * Een klassenaam staat in een dex als `Lapp/darijaforkids/learn/MainActivity;`.
 * Daar hoeft niets voor ontleed te worden; de tekst staat er letterlijk in.
 */
const dexNamen = zip.namen.filter((n) => /(^|\/)classes\d*\.dex$/.test(n))
if (!dexNamen.length) {
  console.error('Er zit geen enkele classes.dex in deze bundel.')
  console.error('Dan is er geen java in gecompileerd en start de app niet.\n')
  process.exit(1)
}

const dex = Buffer.concat(dexNamen.map((n) => zip.pak(n)))
console.log(`Java: ${dexNamen.length} dex-bestand${dexNamen.length === 1 ? '' : 'en'}, ${Math.round(dex.length / 1024)} kB`)

const verwacht = verwachteKlassen(ROOT)
const kwijt = kwijtInDex(dex, verwacht)
for (const v of verwacht) {
  console.log(`  ${kwijt.includes(v) ? '✗' : '✓'} ${v.wat.padEnd(30)} ${v.klasse}`)
}

// En wat `cap sync` stil heeft overgeslagen staat hier niet eens in de lijst.
const { ontbreekt, nietGeinstalleerd } = pluginstand(ROOT, 'android')
for (const n of [...ontbreekt, ...nietGeinstalleerd]) {
  kwijt.push({ wat: n, klasse: 'niet ingeschreven door cap sync' })
  console.log(`  ✗ ${n.padEnd(30)} niet ingeschreven door cap sync`)
}
console.log('')

if (kwijt.length) {
  console.error('Deze bundel mist native code.\n')
  for (const { wat, klasse } of kwijt) console.error(`  ${wat}: ${klasse}`)
  console.error('')
  console.error('Ontbreekt de app zelf, dan start hij niet: het logo komt even in beeld')
  console.error('en Android sluit af met ClassNotFoundException. Ontbreekt een plugin,')
  console.error('dan start hij wel maar doet dat stuk niets -- geen trilling, geen')
  console.error('herinnering -- en dat merk je pas aan een recensie.\n')
  console.error('Controleer eerst of alles in de repository staat en geïnstalleerd is:\n')
  console.error('  git status')
  console.error('  npm install')
  console.error(`  ${volgendeBouw()}\n`)
  process.exit(1)
}

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

/*
 * Drie toestanden, en ze zijn aan de inhoud te zien.
 *
 * Het bouwdoel in vite.config.ts bepaalt wat esbuild wegschrijft, en elke stap
 * omlaag laat een spoor na dat je kunt tellen:
 *
 *   te oud   `?.` en `??` staan erin. Dat is Chrome 80, februari 2020.
 *   es2019   geen `?.`, maar `async` staat er nog. Chrome 69.
 *   es2015   geen `async` meer, wel `function*`: esbuild heeft async naar
 *            generators omgezet. Chrome 51 — en dat is de WebView waarmee
 *            Android 7 is uitgekomen, de versie die minSdkVersion 24 belooft.
 *
 * Gemeten op deze code: es2019 gaf 21 keer `async` en nul `function*`, es2015
 * precies omgekeerd, nul en dertig.
 */
const asyncKw = (bron.match(/\basync\s/g) ?? []).length
const generator = (bron.match(/function\s*\*/g) ?? []).length

console.log(`Javascript: ${jsNamen.length} bestanden, ${Math.round(bron.length / 1024)} kB`)
console.log(`  ?.  optional chaining   ${String(chain).padStart(5)}x   Chrome 80`)
console.log(`  ??  nullish             ${String(nullish).padStart(5)}x   Chrome 80`)
console.log(`  async                   ${String(asyncKw).padStart(5)}x`)
console.log(`  function*               ${String(generator).padStart(5)}x`)
console.log('')

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

if (chain > 0 || nullish > 0) {
  console.log('Deze bundel is gebouwd zonder bouwdoel, of met een doel vanaf es2020.\n')
  console.log('Er staat syntaxis in die pas vanaf Chrome 80 bestaat — februari 2020.')
  console.log('Op een oudere WebView wordt dit bestand niet ingelezen: geen foutmelding,')
  console.log('geen halve app, een wit scherm. Google noemt dat "installs, but doesn\'t')
  console.log('load", en daar is deze app op afgewezen.\n')
  console.log('Dit is dus niet de app waarvan je denkt dat je hem hebt opgestuurd.')
  console.log('Bouw hem opnieuw, met een versiecode die nog niet gebruikt is:\n')
  console.log(`  ${volgendeBouw()}\n`)
  process.exit(1)
}

if (asyncKw > 0 && generator === 0) {
  console.log('Deze bundel is gebouwd op es2019. Geen `?.` en geen `??`, dus hij wordt')
  console.log('ingelezen vanaf Chrome 69 — september 2018.\n')
  console.log('Dat is beter dan wat er is afgewezen, maar het is niet de drempel die we')
  console.log('beloven. minSdkVersion 24 is Android 7, en die is uitgekomen met WebView')
  console.log('Chrome 51. Het bouwdoel staat inmiddels op es2015 en dat kost zeven')
  console.log('kilobyte. Bouw hem opnieuw zodat je die drempel ook echt haalt:\n')
  console.log(`  ${volgendeBouw()}\n`)
  process.exit(1)
}

console.log('Deze bundel is gebouwd op es2015: geen `?.`, geen `??`, en async is omgezet')
console.log(`naar generators (${generator}× \`function*\`). Daarmee wordt hij ingelezen vanaf`)
console.log('Chrome 51 — de WebView waarmee Android 7 is uitgekomen, en dat is precies')
console.log('wat minSdkVersion 24 belooft.\n')
process.exit(0)
