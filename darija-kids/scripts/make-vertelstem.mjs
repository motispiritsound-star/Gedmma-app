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
const NUMMER = Number(arg('deel', '1'))
const ALLEEN = arg('hoofdstuk', null)
/** Alleen de eerste zoveel hoofdstukken — hetzelfde getal als bij de zetter. */
const TOT = Number(arg('tot', 0)) || 0
const PROEF = vlag('proef')
const OPNIEUW = vlag('opnieuw')

if (!SLEUTEL) {
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
const [{ REEKS }, talen, { VERTELSTEMMEN, vertelstemVan }, { zinnenVan, uitspreekbaar }, deelmodule] = await Promise.all([
  server.ssrLoadModule('/src/content/sleutels.ts'),
  server.ssrLoadModule('/src/content/sleutels-talen.ts'),
  server.ssrLoadModule('/src/content/vertelstemmen.ts'),
  server.ssrLoadModule('/src/content/zinnen.ts'),
  server.ssrLoadModule(`/src/content/sleutels-deel${NUMMER}.ts`),
])
await server.close()

const STEM = vertelstemVan(arg('stem', VERTELSTEMMEN[0].naam))
const nederlands = {
  ...REEKS[NUMMER - 1],
  hoofdstukken: deelmodule[`DEEL${NUMMER}_HOOFDSTUKKEN`] ?? [],
}
const deel = talen.sleuteldeelIn(TAAL, nederlands)
const S = talen.schilVanSleutel(TAAL)

/**
 * Waar de opnames komen te staan.
 *
 * Naast de leeskopie en niet in een eigen hoek: die bladzijde is de enige die
 * ze afspeelt, en een map die je moet kopiëren voordat het werkt is een map
 * die iemand vergeet te kopiëren.
 */
const UIT = path.join(ROOT, 'store', 'lezen', 'luister', `${TAAL}-${NUMMER}-${STEM.naam.toLowerCase()}`)
await mkdir(UIT, { recursive: true })

const hoofdstukken = ALLEEN
  ? deel.hoofdstukken.filter((h) => h.nummer === Number(ALLEEN))
  : PROEF ? deel.hoofdstukken.slice(0, 1)
  : TOT ? deel.hoofdstukken.slice(0, TOT)
  : deel.hoofdstukken

console.log(`\n${deel.titel} — ${TAAL}, stem ${STEM.naam} (${STEM.toon})`)
console.log(`${hoofdstukken.length} van de ${deel.hoofdstukken.length} hoofdstukken\n`)

const stemId = await (async () => {
  const lijst = await bibliotheek()
  const gevonden = lijst.find((v) => String(v.name).toLowerCase() === STEM.naam.toLowerCase())
  if (gevonden) return gevonden.voice_id
  console.error(`\nGeen stem "${STEM.naam}" in dit account.`)
  console.error(`Wat er wél is, zie je met: node scripts/make-vertelstem.mjs --stemmen\n`)
  process.exit(1)
})()

let tekens = 0

for (const hoofdstuk of hoofdstukken) {
  const mp3 = path.join(UIT, `${String(hoofdstuk.nummer).padStart(2, '0')}.mp3`)
  const kaart = mp3.replace(/\.mp3$/, '.json')
  if (existsSync(mp3) && !OPNIEUW) {
    console.log(`  ${S.hoofdstuk(hoofdstuk.nummer)} staat er al`)
    continue
  }

  const zinnen = zinnenVan(hoofdstuk.tekst).map(uitspreekbaar)
  const tekst = zinnen.join(' ')
  process.stdout.write(`  ${S.hoofdstuk(hoofdstuk.nummer)} — ${zinnen.length} zinnen, ${tekst.length} tekens … `)

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
    deel: NUMMER, taal: TAAL, hoofdstuk: hoofdstuk.nummer, titel: hoofdstuk.titel,
    stem: STEM.naam, model: MODEL, zinnen: kaartje,
  }, null, 1))

  tekens += tekst.length
  const duur = kaartje.at(-1)?.tot ?? 0
  console.log(`${Math.round(duur / 60)} min`)
}

/**
 * Eén lijst met wat er klaarstaat.
 *
 * De leesbladzijde haalt dit ene bestand op en weet dan meteen welke
 * hoofdstukken er zijn en waar elke zin begint. Zonder deze lijst zou hij per
 * hoofdstuk moeten gokken of er een opname is, en dat is twaalf mislukte
 * verzoeken per boek.
 */
const gezet = []
for (const h of deel.hoofdstukken) {
  const kaart = path.join(UIT, `${String(h.nummer).padStart(2, '0')}.json`)
  if (!existsSync(kaart)) continue
  const { zinnen } = JSON.parse(await readFile(kaart, 'utf8'))
  gezet.push({
    nummer: h.nummer,
    geluid: `${String(h.nummer).padStart(2, '0')}.mp3`,
    zinnen: zinnen.map(({ van, tot }) => ({ van, tot })),
  })
}
await writeFile(path.join(UIT, 'boek.json'), JSON.stringify({
  deel: NUMMER, taal: TAAL, stem: STEM.naam, toon: STEM.toon,
  titel: deel.titel, hoofdstukken: gezet,
}))

console.log(`\n${path.relative(ROOT, UIT)}/  —  ${gezet.length} hoofdstukken met geluid`)
console.log(`${tekens.toLocaleString('nl-NL')} tekens gezet — ruwweg $${(tekens / 1000 * 0.15).toFixed(2)}\n`)
