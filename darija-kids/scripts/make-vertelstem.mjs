/**
 * Zet een deel van De sleutels van Marokko om in een luisterboek.
 *
 * Eén opname per hoofdstuk, plus de tijdstippen van elke zin. Die tijdstippen
 * zijn het hele punt: daarmee licht op de leesbladzijde precies de zin op die
 * klinkt, en dat is het verschil tussen een luisterboek en een meeleesboek.
 *
 * Waarom per hoofdstuk en niet per zin: een verteller haalt adem over een
 * zinsgrens heen. Vraag je zin voor zin, dan krijg je zin voor zin terug —
 * vijftig losse stukjes die achter elkaar geplakt klinken als vijftig losse
 * stukjes. Eén hoofdstuk in één keer loopt door.
 *
 * De tijdstippen komen uit ElevenLabs zelf. Hun `with-timestamps` geeft per
 * teken een begin en een eind, en daaruit valt de grens van elke zin af te
 * lezen zonder dat er iets geraden hoeft te worden.
 *
 * Wat dit kost: ruwweg één cent per honderd tekens, dus een deel van
 * vijfduizend woorden komt op een paar euro. Begin daarom met `--proef`: dan
 * gaat alleen hoofdstuk 1 eruit, en kun je luisteren voordat je vijftien
 * delen betaalt.
 *
 * Run with:
 *   ELEVEN_SLEUTEL=... node scripts/make-vertelstem.mjs --deel 1 --proef
 *   ELEVEN_SLEUTEL=... node scripts/make-vertelstem.mjs --deel 1 --stem Brian
 *   ELEVEN_SLEUTEL=... node scripts/make-vertelstem.mjs --deel 1 --taal fr
 *   node scripts/make-vertelstem.mjs --stemmen        # wat het account heeft
 */
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const arg = (naam, terugval = null) => {
  const gelijk = process.argv.find((a) => a.startsWith(`--${naam}=`))
  if (gelijk) return gelijk.slice(naam.length + 3)
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}
const vlag = (naam) => process.argv.includes(`--${naam}`)

const SLEUTEL = process.env.ELEVEN_SLEUTEL
const MODEL = process.env.ELEVEN_MODEL ?? 'eleven_multilingual_v2'
const FORMAAT = 'mp3_44100_128'
const TAAL = arg('taal', 'nl')
const REEKS = arg('reeks', 'sleutels')
const NUMMER = Number(arg('deel', '1'))
/** Alles: elke reeks, elk deel, elke taal. Kijk eerst met --raming wat dat kost. */
const ALLES = vlag('alles')
/** Tellen zonder te betalen: hoeveel tekens, en wat dat ongeveer kost. */
const RAMING = vlag('raming')
const ALLEEN = arg('hoofdstuk', null)
/** Alleen de eerste zoveel hoofdstukken — hetzelfde getal als bij de zetter. */
const TOT = Number(arg('tot', 0)) || 0
const PROEF = vlag('proef')
const OPNIEUW = vlag('opnieuw')

if (!SLEUTEL && !RAMING) {
  console.error(`
Zet eerst je sleutel:

  $env:ELEVEN_SLEUTEL = "..."      (PowerShell)
  export ELEVEN_SLEUTEL=...        (Mac)

Let op twee dingen voordat je dit in de winkel legt: het abonnement moet
commercieel gebruik toestaan, en een stem uit de bibliotheek heeft eigen
voorwaarden van degene die hem deelde.
`)
  process.exit(1)
}

const bij = async (pad, opties = {}) => {
  const antwoord = await fetch(`https://api.elevenlabs.io/v1/${pad}`, {
    ...opties,
    headers: { 'xi-api-key': SLEUTEL, ...(opties.headers ?? {}) },
  })
  if (!antwoord.ok) throw new Error(`elevenlabs ${antwoord.status}: ${(await antwoord.text()).slice(0, 200)}`)
  return antwoord
}

/** Wat het account heeft, op naam. Een id verzinnen kan niet; opzoeken wel. */
const bibliotheek = async () => {
  const { voices } = await (await bij('voices')).json()
  return voices ?? []
}

if (vlag('stemmen')) {
  const lijst = await bibliotheek()
  console.log(`\n${lijst.length} stemmen in dit account:\n`)
  for (const v of lijst) console.log(`  ${String(v.name).padEnd(22)} ${v.voice_id}  ${v.labels?.gender ?? ''} ${v.labels?.description ?? ''}`)
  console.log()
  process.exit(0)
}

/* ------------------------------------------------------------- het boek */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [sleutels, sleutelTalen, { VERTELSTEMMEN, vertelstemVan }, { zinnenVan, uitspreekbaar },
       prenten, prentTalen] = await Promise.all([
  server.ssrLoadModule('/src/content/sleutels.ts'),
  server.ssrLoadModule('/src/content/sleutels-talen.ts'),
  server.ssrLoadModule('/src/content/vertelstemmen.ts'),
  server.ssrLoadModule('/src/content/zinnen.ts'),
  server.ssrLoadModule('/src/content/prentenboek.ts'),
  server.ssrLoadModule('/src/content/prentenboek-talen.ts'),
])

/**
 * Een deel uit een van de twee reeksen, in dezelfde vorm.
 *
 * De sleutels heeft hoofdstukken, Sba heeft bladzijden. Voor een opname is
 * dat hetzelfde ding: een stuk tekst met een nummer erbij. Door ze hier
 * gelijk te maken hoeft de rest van dit bestand het verschil niet te kennen.
 */
const boekVan = async (reeks, nummer, taal) => {
  if (reeks === 'sba') {
    const deel = prentTalen.deelIn(taal, nummer)
    return {
      titel: deel.titel,
      stukken: deel.bladen.map((blad, i) => ({ nummer: i + 1, titel: blad.woord?.nl ?? '', tekst: blad.tekst })),
      kop: (n) => `Bladzijde ${n}`,
    }
  }
  const module = await server.ssrLoadModule(`/src/content/sleutels-deel${nummer}.ts`)
  const basis = { ...sleutels.REEKS[nummer - 1], hoofdstukken: module[`DEEL${nummer}_HOOFDSTUKKEN`] ?? [] }
  const deel = sleutelTalen.sleuteldeelIn(taal, basis)
  const S = sleutelTalen.schilVanSleutel(taal)
  return {
    titel: deel.titel,
    stukken: deel.hoofdstukken.map((h) => ({ nummer: h.nummer, titel: h.titel, tekst: h.tekst })),
    kop: S.hoofdstuk,
  }
}

const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en']
const DELEN = { sleutels: sleutels.REEKS.length, sba: prenten.DELEN.length }

const STEM = vertelstemVan(arg('stem', VERTELSTEMMEN[0].naam))

/** Elk klusje: één reeks, één deel, één taal. `--alles` maakt er negentig. */
const klussen = ALLES
  ? TALEN.flatMap((taal) => ['sleutels', 'sba'].flatMap((reeks) =>
      Array.from({ length: DELEN[reeks] }, (_, i) => ({ reeks, nummer: i + 1, taal }))))
  : [{ reeks: REEKS, nummer: NUMMER, taal: TAAL }]

/** Welke stukken van een boek: alles, één, de eerste zoveel, of alleen het eerste. */
const kiesStukken = (stukken) =>
  ALLEEN ? stukken.filter((h) => h.nummer === Number(ALLEEN))
  : PROEF ? stukken.slice(0, 1)
  : TOT ? stukken.slice(0, TOT)
  : stukken

/* -------------------------------------------------------------- de raming */

if (RAMING) {
  let tekens = 0
  let stukken = 0
  const perReeks = {}
  for (const klus of klussen) {
    const boek = await boekVan(klus.reeks, klus.nummer, klus.taal)
    for (const stuk of kiesStukken(boek.stukken)) {
      const lengte = zinnenVan(stuk.tekst).map(uitspreekbaar).join(' ').length
      tekens += lengte
      stukken += 1
      perReeks[klus.reeks] = (perReeks[klus.reeks] ?? 0) + lengte
    }
  }
  await server.close()
  const geld = (n) => `$${(n / 1000 * 0.15).toFixed(0)}`
  console.log(`\n${klussen.length} boeken, ${stukken} stukken, ${tekens.toLocaleString('nl-NL')} tekens\n`)
  for (const [reeks, n] of Object.entries(perReeks)) {
    console.log(`  ${reeks.padEnd(10)} ${n.toLocaleString('nl-NL').padStart(9)} tekens   ${geld(n).padStart(6)} per stem`)
  }
  console.log(`\n  samen      ${tekens.toLocaleString('nl-NL').padStart(9)} tekens   ${geld(tekens).padStart(6)} per stem`)
  console.log(`                                       ${geld(tekens * 2).padStart(6)} voor twee stemmen\n`)
  console.log('Dit is een schatting bij ongeveer $0,15 per duizend tekens; op een')
  console.log('groter abonnement ligt de prijs per teken lager. Kijk in je eigen')
  console.log('afrekening voordat je dit voor alle talen tegelijk draait.\n')
  process.exit(0)
}

/* ------------------------------------------------------------- de opnames */

const stemId = await (async () => {
  const lijst = await bibliotheek()
  const gevonden = lijst.find((v) => String(v.name).toLowerCase() === STEM.naam.toLowerCase())
  if (gevonden) return gevonden.voice_id
  console.error(`\nGeen stem "${STEM.naam}" in dit account.`)
  console.error(`Wat er wél is, zie je met: node scripts/make-vertelstem.mjs --stemmen\n`)
  process.exit(1)
})()

console.log(`\nStem ${STEM.naam} (${STEM.toon}) — ${klussen.length} ${klussen.length === 1 ? 'boek' : 'boeken'}\n`)

let tekens = 0

for (const klus of klussen) {
  const boek = await boekVan(klus.reeks, klus.nummer, klus.taal)
  const stukken = kiesStukken(boek.stukken)
  if (!stukken.length) continue

  const UIT = path.join(ROOT, 'store', 'lezen', 'luister',
    `${klus.reeks === 'sba' ? 'sba-' : ''}${klus.taal}-${klus.nummer}-${STEM.naam.toLowerCase()}`)
  await mkdir(UIT, { recursive: true })
  console.log(`${boek.titel} — ${klus.taal}`)

  for (const stuk of stukken) {
    const mp3 = path.join(UIT, `${String(stuk.nummer).padStart(2, '0')}.mp3`)
    const kaart = mp3.replace(/\.mp3$/, '.json')
    if (existsSync(mp3) && !OPNIEUW) {
      console.log(`  ${boek.kop(stuk.nummer)} staat er al`)
      continue
    }

    const zinnen = zinnenVan(stuk.tekst).map(uitspreekbaar)
    const tekst = zinnen.join(' ')
    if (!tekst.trim()) continue
    process.stdout.write(`  ${boek.kop(stuk.nummer)} — ${zinnen.length} zinnen, ${tekst.length} tekens … `)

    const antwoord = await bij(`text-to-speech/${stemId}/with-timestamps?output_format=${FORMAAT}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        text: tekst,
        model_id: MODEL,
        voice_settings: { stability: STEM.vast, similarity_boost: STEM.gelijkend, speed: STEM.tempo },
      }),
    })
    const { audio_base64: geluid, alignment } = await antwoord.json()
    await writeFile(mp3, Buffer.from(geluid, 'base64'))

    /**
     * Van tekens naar zinnen.
     *
     * ElevenLabs geeft per teken een begin en een eind. De zinnen staan achter
     * elkaar in dezelfde tekst, dus een lopende teller over de lengtes wijst
     * precies aan waar elke zin begint en ophoudt.
     */
    const begin = alignment?.character_start_times_seconds ?? []
    const eind = alignment?.character_end_times_seconds ?? []
    let plek = 0
    const kaartje = zinnen.map((zin) => {
      const van = plek
      const tot = plek + zin.length
      plek = tot + 1 // de spatie tussen twee zinnen
      return {
        tekst: zin,
        van: Number((begin[van] ?? 0).toFixed(3)),
        tot: Number((eind[Math.min(tot - 1, eind.length - 1)] ?? 0).toFixed(3)),
      }
    })
    await writeFile(kaart, JSON.stringify({
      reeks: klus.reeks, deel: klus.nummer, taal: klus.taal, stuk: stuk.nummer, titel: stuk.titel,
      stem: STEM.naam, model: MODEL, zinnen: kaartje,
    }, null, 1))

    tekens += tekst.length
    console.log(`${Math.round((kaartje.at(-1)?.tot ?? 0) / 60)} min`)
  }

  /**
   * Eén lijst met wat er klaarstaat.
   *
   * De leesbladzijde haalt dit ene bestand op en weet dan meteen welke stukken
   * er zijn en waar elke zin begint. Zonder deze lijst zou hij per hoofdstuk
   * moeten gokken of er een opname is, en dat is twaalf mislukte verzoeken
   * per boek.
   */
  const gezet = []
  for (const stuk of boek.stukken) {
    const kaart = path.join(UIT, `${String(stuk.nummer).padStart(2, '0')}.json`)
    if (!existsSync(kaart)) continue
    const { zinnen } = JSON.parse(await readFile(kaart, 'utf8'))
    gezet.push({
      nummer: stuk.nummer,
      geluid: `${String(stuk.nummer).padStart(2, '0')}.mp3`,
      zinnen: zinnen.map(({ van, tot }) => ({ van, tot })),
    })
  }
  await writeFile(path.join(UIT, 'boek.json'), JSON.stringify({
    reeks: klus.reeks, deel: klus.nummer, taal: klus.taal, stem: STEM.naam, toon: STEM.toon,
    titel: boek.titel, hoofdstukken: gezet,
  }))
}

await server.close()
console.log(`\n${tekens.toLocaleString('nl-NL')} tekens gezet — ruwweg $${(tekens / 1000 * 0.15).toFixed(2)}\n`)
