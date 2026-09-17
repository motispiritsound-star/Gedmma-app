/**
 * Eén doorlopende opname uitknippen in losse woorden.
 *
 * Dit is de kant van de opnamestudio die hier draait in plaats van in de
 * browser, en hij bestaat omdat dat de drempel het laagst legt: wie de lijst
 * inspreekt hoeft alleen één spraakmemo te sturen. Elk formaat mag — .m4a van
 * een iPhone, .ogg uit WhatsApp, .webm uit een browser.
 *
 * Het knippen zelf komt uit `src/engine/knip.ts`, dezelfde code als in de app,
 * via een dev-server. Twee keer hetzelfde algoritme onderhouden is één keer te
 * vaak.
 *
 * Draaien met:
 *   node scripts/knip-opname.mjs opname.m4a --voorrang
 *   node scripts/knip-opname.mjs opname.m4a --ids hna,ntuma,mama
 *   node scripts/knip-opname.mjs opname.m4a --voorrang --proef   (niets wegschrijven)
 *
 * Vlaggen:
 *   --voorrang     de woorden uit OPNAME_NODIG, in die volgorde
 *   --ids a,b,c    een eigen lijst, in de volgorde waarin ze zijn ingesproken
 *   --map <map>    letters, woorden (standaard) of zinnen
 *   --pauze <s>    hoe lang het stil moet zijn voor een grens, standaard 0,3
 *   --proef        alleen laten zien wat eruit komt, niets opslaan
 *   --plak 7,25    stuknummers die bij het vorige stuk horen: één woord met
 *                  een pauze erin, zoals "bit n3as", dat op die pauze uiteenviel
 *   --sla-over 7,24  stuknummers die niet meetellen: een woord dat opnieuw is
 *                  gezegd, een kuch, of een woord dat in twee stukken uiteen
 *                  viel. De nummers komen uit het knipblad.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { bewerk, naarWav, readWav, writeWav } from './lib/wav.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4364

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const vlag = (naam) => process.argv.includes(`--${naam}`)

const BESTAND = process.argv[2]
if (!BESTAND || BESTAND.startsWith('--')) {
  console.error('gebruik: node scripts/knip-opname.mjs <opname> --voorrang')
  process.exit(1)
}
const MAP = arg('map', 'woorden')
const PAUZE = Number(arg('pauze', 0.3))
const PROEF = vlag('proef')
/** Stuknummers (vanaf 1) die overgeslagen worden, uit het knipblad. */
const OVER = new Set((arg('sla-over', '') || '').split(',').map((n) => Number(n.trim())).filter(Boolean))
const PLAK = new Set((arg('plak', '') || '').split(',').map((n) => Number(n.trim())).filter(Boolean))

/* ------------------------------------------------ welke woorden erin zitten */

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()
const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage()
await page.goto(`http://127.0.0.1:${PORT}/`, { waitUntil: 'networkidle' })

const eigenIds = arg('ids', null)
/**
 * Woorden waarvan de opname is afgekeurd blijven buiten de telling.
 *
 * Ze staan wel op de opnamelijst — er moet nog een stem bij komen — maar het
 * stuk dat erbij hoorde deugt niet en gaat er met --sla-over uit. Bleven ze in
 * de lijst staan, dan klopt het aantal niet meer en weigert de knipper terecht.
 */
const { ids, mappen, afgekeurd } = await page.evaluate(async (eigen) => {
  const [e, lex, zin] = await Promise.all([
    import('/src/content/eigen.ts'),
    import('/src/content/lexicon.ts'),
    import('/src/content/sentences.ts'),
  ])
  // Een zin hoort in src/audio/zinnen en een woord in src/audio/woorden. Eén
  // opname kan allebei bevatten, dus bepaalt elk id zijn eigen map.
  const mapVan = new Map()
  for (const w of lex.allWords) mapVan.set(w.id, 'woorden')
  for (const z of zin.ALL_SENTENCES) if (!mapVan.has(z.id)) mapVan.set(z.id, 'zinnen')
  const weg = new Set(e.OPNIEUW)
  const lijst = eigen ? eigen.split(',').map((s) => s.trim()).filter(Boolean) : e.OPNAME_NODIG
  const ids = lijst.filter((id) => !weg.has(id))
  return {
    ids,
    mappen: ids.map((id) => mapVan.get(id) ?? 'woorden'),
    afgekeurd: lijst.filter((id) => weg.has(id)),
  }
}, eigenIds)
if (afgekeurd.length) console.log(`buiten de telling, wacht op een nieuwe opname: ${afgekeurd.join(', ')}`)

if (!ids.length) {
  console.error('geen woorden gevraagd: gebruik --voorrang of --ids')
  process.exit(1)
}

/* ------------------------------------------------------------ het knippen */

const wav = await naarWav(path.resolve(BESTAND))
const { rate, samples } = readWav(wav)
console.log(`${path.basename(BESTAND)} — ${(samples.length / rate).toFixed(1)}s, ${rate} Hz`)

const stukken = await page.evaluate(async ({ lijst, rate, pauze }) => {
  const { knip } = await import('/src/engine/knip.ts')
  return knip(Float32Array.from(lijst), rate, { pauze })
}, { lijst: Array.from(samples), rate, pauze: PAUZE })

await browser.close()
await server.close()

const gevonden = stukken.length

/**
 * Eerst plakken, dan schrappen.
 *
 * Een woord met een pauze erin valt in twee stukken uiteen; die horen aan
 * elkaar, met de pauze en al, anders mist het woord zijn tweede helft. Pas
 * daarna gaat eruit wat helemaal niet meetelt.
 */
const geplakt = []
for (const [i, s] of stukken.entries()) {
  const vorige = geplakt.at(-1)
  if (PLAK.has(i + 1) && vorige && !OVER.has(i + 1)) {
    vorige.delen.push({ van: s.van, tot: s.tot })
    vorige.tot = s.tot
  } else geplakt.push({ ...s, nr: i + 1, delen: [{ van: s.van, tot: s.tot }] })
}
const bruikbaar = geplakt.filter((s) => !OVER.has(s.nr))
if (PLAK.size) console.log(`${gevonden} stukken gevonden, ${PLAK.size} aan het vorige geplakt`)
if (OVER.size) console.log(`${OVER.size} overgeslagen`)
console.log(`${bruikbaar.length} stukken bruikbaar, ${ids.length} woorden gevraagd`)
stukken.length = 0
stukken.push(...bruikbaar)

if (stukken.length !== ids.length) {
  console.error(
    `\nDat komt niet overeen. Meestal is er een woord overgeslagen of zijn er twee`
    + `\naan elkaar geplakt — en dan staat vanaf dat punt alles onder de verkeerde`
    + `\nnaam, wat erger is dan niets.`,
  )
  console.error('\nWat er wel uitkwam, op tijd:')
  for (const [i, s] of stukken.entries()) {
    console.error(`  ${String(i + 1).padStart(2)}  ${s.van.toFixed(2)}s  ${(s.tot - s.van).toFixed(2)}s lang`)
  }
  console.error('\nProbeer een andere pauze met --pauze 0.25 of --pauze 0.4, of neem opnieuw op.')
  process.exit(1)
}

/* ------------------------------------------------------------ wegschrijven */

/**
 * De klank van één woord, uit één of meer stukken opname.
 *
 * Bij één stuk is dat een rechte snee. Bij een woord dat in tweeën viel zou
 * dat de hele denkpauze meenemen — "bit ...... n3as" — en zo zegt niemand het.
 * De helften gaan dus aan elkaar met een korte adem ertussen, net genoeg om te
 * horen dat het twee lettergrepen zijn.
 */
function knipsel(stuk) {
  const snee = (d) => samples.slice(Math.floor(d.van * rate), Math.ceil(d.tot * rate))
  if (stuk.delen.length === 1) return snee(stuk.delen[0])
  const stilte = new Float32Array(Math.round(BINNENPAUZE * rate))
  const stukjes = []
  for (const [i, d] of stuk.delen.entries()) {
    if (i) stukjes.push(stilte)
    stukjes.push(snee(d))
  }
  const totaal = stukjes.reduce((n, s) => n + s.length, 0)
  const uit = new Float32Array(totaal)
  let at = 0
  for (const s of stukjes) { uit.set(s, at); at += s.length }
  return uit
}

/** Met --map gaat alles in één map; zonder volgt elk woord of elke zin zijn eigen. */
const mapVoor = (i) => (arg('map', null) ? MAP : mappen[i])
if (!PROEF) {
  for (const map of new Set(ids.map((_, i) => mapVoor(i)))) {
    await mkdir(path.join(ROOT, 'src', 'audio', map), { recursive: true })
  }
}

/** Wat er van een pauze binnen een woord overblijft als het weer aan elkaar gaat. */
const BINNENPAUZE = 0.16

for (const [i, stuk] of stukken.entries()) {
  const id = ids[i]
  const deel = knipsel(stuk)
  const klaar = bewerk(rate, deel)
  if (!klaar) { console.error(`${id}: alleen stilte`); continue }
  const map = mapVoor(i)
  const regel = `${String(i + 1).padStart(2)}  ${`${map}/${id}`.padEnd(24)} ${stuk.van.toFixed(2)}s  ${klaar.nu.toFixed(2)}s`
  if (PROEF) { console.log(`${regel}   (proef, niets opgeslagen)`); continue }
  await writeFile(path.join(ROOT, 'src', 'audio', map, `${id}.wav`), writeWav(rate, klaar.samples))
  console.log(regel)
}

const perMap = [...new Set(ids.map((_, i) => mapVoor(i)))]
  .map((map) => `${ids.filter((_, i) => mapVoor(i) === map).length} in src/audio/${map}/`)
  .join(', ')
console.log(PROEF
  ? '\nProef: er is niets opgeslagen. Klopt de koppeling, draai dan zonder --proef.'
  : `\n${stukken.length} opnames: ${perMap}.`)
