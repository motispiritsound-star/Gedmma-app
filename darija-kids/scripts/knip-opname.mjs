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
const ids = await page.evaluate(async (eigen) => {
  if (eigen) return eigen.split(',').map((s) => s.trim()).filter(Boolean)
  const e = await import('/src/content/eigen.ts')
  return e.OPNAME_NODIG
}, eigenIds)

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
const bruikbaar = stukken.filter((_, i) => !OVER.has(i + 1))
if (OVER.size) console.log(`${gevonden} stukken gevonden, ${OVER.size} overgeslagen`)
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

const uit = path.join(ROOT, 'src', 'audio', MAP)
if (!PROEF) await mkdir(uit, { recursive: true })

for (const [i, stuk] of stukken.entries()) {
  const id = ids[i]
  const deel = samples.slice(Math.floor(stuk.van * rate), Math.ceil(stuk.tot * rate))
  const klaar = bewerk(rate, deel)
  if (!klaar) { console.error(`${id}: alleen stilte`); continue }
  const regel = `${String(i + 1).padStart(2)}  ${id.padEnd(10)} ${stuk.van.toFixed(2)}s  ${klaar.nu.toFixed(2)}s`
  if (PROEF) { console.log(`${regel}   (proef, niets opgeslagen)`); continue }
  await writeFile(path.join(uit, `${id}.wav`), writeWav(rate, klaar.samples))
  console.log(regel)
}

console.log(PROEF
  ? '\nProef: er is niets opgeslagen. Klopt de koppeling, draai dan zonder --proef.'
  : `\n${stukken.length} opnames staan in src/audio/${MAP}/.`)
