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
import { mkdir, readFile, writeFile } from 'node:fs/promises'
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
const PLAK_AUTO = process.argv.includes('--plak-auto')

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
const { ids, mappen, mapVan, tekstVan, metClip, klaar } = await page.evaluate(async (eigen) => {
  const [e, abc, lex, zin, clips] = await Promise.all([
    import('/src/content/eigen.ts'),
    import('/src/content/alphabet.ts'),
    import('/src/content/lexicon.ts'),
    import('/src/content/sentences.ts'),
    import('/src/engine/clips.ts'),
  ])
  // Een letter hoort in src/audio/letters, een zin in zinnen en een woord in
  // woorden. Eén opname kan ze alle drie bevatten — de lijst begint met een
  // letter en gaat verder met woorden — dus bepaalt elk id zijn eigen map.
  const mapVan = new Map()
  for (const l of abc.LETTERS) mapVan.set(l.id, 'letters')
  for (const w of lex.allWords) if (!mapVan.has(w.id)) mapVan.set(w.id, 'woorden')
  for (const z of zin.ALL_SENTENCES) if (!mapVan.has(z.id)) mapVan.set(z.id, 'zinnen')
  const lijst = eigen ? eigen.split(',').map((s) => s.trim()).filter(Boolean) : e.OPNAME_NODIG
  // Precies de volgorde van de opnamelijst: wat al een stem heeft valt eruit,
  // de rest staat er in dezelfde rij. Alleen zo slaat een bloknummer nergens
  // een regel over en wijst het naar wat er is voorgelezen.
  //
  // Een lijst die met --ids is opgegeven blijft heel. Die is met opzet zo
  // opgeschreven, en soms staat er juist iets op dat al een opname heeft —
  // een regel die opnieuw is voorgelezen hoort de oude te vervangen.
  const ids = eigen ? lijst : lijst.filter((id) => !clips.hasClip(id))
  return {
    ids,
    mappen: ids.map((id) => mapVan.get(id) ?? 'woorden'),
    mapVan: Object.fromEntries(mapVan),
    tekstVan: Object.fromEntries([
      ...abc.LETTERS.map((l) => [l.id, l.tr]),
      ...lex.allWords.map((w) => [w.id, w.tr]),
      ...zin.ALL_SENTENCES.map((z) => [z.id, z.tr]),
    ]),
    // Wat een stem heeft, ongeacht op welke lijst het staat. Een blok moet dat
    // aan de opnames zelf kunnen zien en niet aan een lijst waar het misschien
    // niet op voorkomt.
    metClip: [...mapVan.keys()].filter((id) => clips.hasClip(id)),
    klaar: lijst.length - ids.length,
  }
}, eigenIds)
if (klaar) console.log(`${klaar} van de lijst hebben al een opname en tellen niet mee`)

/**
 * Eén blok van de opnamelijst, zoals die de blokken telt.
 *
 * Honderdvijftig regels in één keer inspreken gaat een keer mis, en dan
 * schuift alles daarna een plaats op. Dus leest wie inspreekt per twintig, en
 * knipt wie knipt per twintig: --blok 2 is regel 21 tot en met 40.
 */
const BLOK = Number(arg('blok', 0))
if (BLOK) {
  /*
   * Uit de vastgelegde volgorde, niet uit de lijst van nu.
   *
   * De lijst laat weg wat al een stem heeft, dus hij wordt korter met elk blok
   * dat binnenkomt. Zou de knipper daarin tellen, dan wees blok 2 na het
   * knippen van blok 1 naar de regels van blok 3 — en dan staat alles onder de
   * verkeerde naam. De lijst die is voorgelezen is de enige die telt.
   */
  const pad = path.join(ROOT, 'store', 'opnamelijst.json')
  let vast
  try { vast = JSON.parse(await readFile(pad, 'utf8')) } catch {
    console.error(`\nGeen vastgelegde volgorde in ${path.relative(ROOT, pad)}.`
      + `\nDraai eerst npm run opnamelijst, want zonder die volgorde weet ik niet`
      + `\nwelke regels blok ${BLOK} waren toen ze werden voorgelezen.`)
    process.exit(1)
  }
  const grootte = Number(arg('blokgrootte', vast.blok || 20))
  const eerste = (BLOK - 1) * grootte
  const heel = vast.ids.slice(eerste, eerste + grootte)
  if (!heel.length) {
    console.error(`\nBlok ${BLOK} bestaat niet: de lijst telt ${vast.ids.length} regels.`)
    process.exit(1)
  }
  /*
   * Wat al een stem heeft telt niet mee, want het staat ook niet meer op de
   * lijst die is voorgelezen. Een blok kan daardoor korter zijn dan twintig —
   * zoals wanneer er de vorige keer twee regels zijn doorgelezen. Met
   * --opnieuw doe je het hele blok toch over.
   */
  const klaarIn = new Set(metClip)
  const deel = process.argv.includes('--opnieuw') ? heel : heel.filter((id) => !klaarIn.has(id))
  ids.length = 0; ids.push(...deel)
  mappen.length = 0; mappen.push(...deel.map((id) => mapVan[id] ?? 'woorden'))
  const over = heel.length - deel.length
  console.log(`blok ${BLOK} uit de lijst van ${vast.gemaakt}:`
    + ` regel ${eerste + 1} tot en met ${eerste + heel.length}`
    + (over ? `, waarvan ${over} al ingesproken — ${deel.length} regels verwacht` : ''))
}

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
 * Zoekt zelf uit welke stukken bij elkaar horen, aan de hand van de stiltes.
 *
 * Een zin met een komma erin valt uiteen, want die komma is een pauze. Maar
 * hij is korter dan de pauze tussen twee regels van de lijst: binnen een zin
 * haal je adem, tussen twee regels zoek je de volgende regel op. Staan er vier
 * stukken te veel, dan zijn dat dus de vier kortste stiltes.
 *
 * Alleen als dat ook echt zo uitkomt. Ligt de kortste stilte die overblijft
 * vlak naast de langste die wordt weggeplakt, dan is er geen grens en zegt de
 * opname het niet; dan is raden erger dan vragen.
 */
if (PLAK_AUTO) {
  const teveel = gevonden - ids.length - OVER.size
  if (teveel <= 0) {
    console.log('niets te plakken: er zijn niet meer stukken dan woorden')
  } else {
    const gaten = stukken.slice(1).map((s, i) => ({ nr: i + 2, gat: s.van - stukken[i].tot }))
    const oplopend = [...gaten].sort((a, b) => a.gat - b.gat)
    const plakken = oplopend.slice(0, teveel)
    const blijft = oplopend[teveel]
    const grootste = plakken.at(-1).gat
    if (blijft && blijft.gat < grootste * 1.4) {
      console.error(
        `\nDe stiltes zeggen het niet. De ${teveel} kortste lopen tot ${grootste.toFixed(2)}s`
        + ` en de eerstvolgende is ${blijft.gat.toFixed(2)}s — te dicht bij elkaar om`
        + `\nerop te vertrouwen. Maak een knipblad en luister waar het misgaat.`)
      process.exit(1)
    }
    for (const g of plakken) PLAK.add(g.nr)
    console.log(`zelf geplakt op de ${teveel} kortste stiltes`
      + ` (tot ${grootste.toFixed(2)}s, daarna ${blijft ? blijft.gat.toFixed(2) : '—'}s):`
      + ` --plak ${[...PLAK].sort((a, b) => a - b).join(',')}`)
  }
}

/**
 * Eerst plakken, dan schrappen.
 *
 * Een woord met een pauze erin valt in twee stukken uiteen; die horen aan
 * elkaar, met de pauze en al, anders mist het woord zijn tweede helft. Pas
 * daarna gaat eruit wat helemaal niet meetelt.
 */
const geplakt = []
for (const [i, s] of stukken.entries()) {
  // Plakken gaat naar het laatste stuk dat blíjft. Een stuk dat is geschrapt
  // telt niet meer mee, dus wie eraan vastplakt verdwijnt met het geschrapte
  // stuk mee — en dan klopt de telling nog wel, maar ontbreekt de helft van
  // wat er gezegd is. Precies wat het knipblad ook laat zien.
  const vorige = [...geplakt].reverse().find((g) => !OVER.has(g.nr))
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

/**
 * Een stuk dat veel te lang duurt voor wat er staat.
 *
 * Zegt iemand twee regels achter elkaar met nauwelijks adem ertussen, dan ziet
 * de knipper er één woord in. De telling klopt dan nog steeds — er kan
 * tegelijk een regel te veel in de opname zitten — en dan schuift alles daarna
 * een plaats op zonder dat iets dat laat merken. Behalve de lengte: een woord
 * van vier letters dat twee seconden duurt is geen woord meer.
 *
 * Het model komt uit de opnames die er al staan; ruw, maar ruim genoeg om
 * alleen aan te slaan op wat echt niet kan.
 */
const verdacht = []
for (const [i, stuk] of stukken.entries()) {
  // Letters slaan we over: hun transcriptie is één teken maar je zegt hun
  // naam, dus het model rekent ze structureel te kort.
  if (mapVoor(i) === 'letters') continue
  const verwacht = 0.09 * (tekstVan[ids[i]] ?? '').length + 0.31
  const duur = stuk.tot - stuk.van
  if (duur > verwacht * 1.8 + 0.25) verdacht.push(`${ids[i]} (${duur.toFixed(2)}s, verwacht ~${verwacht.toFixed(2)}s)`)
}
if (verdacht.length) {
  console.warn(`\nLet op: ${verdacht.length} ${verdacht.length === 1 ? 'stuk duurt' : 'stukken duren'}`
    + ` veel langer dan het woord ervoor staat.\nMogelijk zijn er twee regels aan elkaar gezegd:`
    + `\n  ${verdacht.join('\n  ')}\nProbeer --pauze 0.2 en kijk of er een stuk bij komt.`)
}

const perMap = [...new Set(ids.map((_, i) => mapVoor(i)))]
  .map((map) => `${ids.filter((_, i) => mapVoor(i) === map).length} in src/audio/${map}/`)
  .join(', ')
console.log(PROEF
  ? '\nProef: er is niets opgeslagen. Klopt de koppeling, draai dan zonder --proef.'
  : `\n${stukken.length} opnames: ${perMap}.`)
