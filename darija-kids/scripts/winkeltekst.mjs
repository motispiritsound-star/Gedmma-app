/**
 * Drukt één veld van de winkeltekst af, zodat het geplakt kan worden.
 *
 * Zonder dit moet je `store/listing.<taal>.md` openen, het juiste kopje zoeken
 * en oppassen dat je de Google Play-helft niet in App Store Connect plakt. Dat
 * laatste is precies waar Apple versie 1.0 (build 5) op afwees, richtlijn
 * 2.3.10: de App Store-beschrijving noemde Google Play. De twee helften staan
 * in één bestand omdat ze bij elkaar horen, en juist daarom is het handig als
 * een opdracht er één uitknipt in plaats van jij.
 *
 *   npm run winkeltekst
 *   npm run winkeltekst -- --taal de
 *   npm run winkeltekst -- --taal de --veld beschrijving
 *   npm run winkeltekst -- --winkel play --veld "volledige beschrijving"
 */
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en']

const arg = (naam, terugval) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : terugval
}

const taal = arg('taal', 'nl').toLowerCase()
const winkel = arg('winkel', 'appstore').toLowerCase()
const veld = arg('veld', '')

if (!TALEN.includes(taal)) {
  console.error(`\nOnbekende taal: ${taal}. Er zijn er zes: ${TALEN.join(', ')}\n`)
  process.exit(1)
}
const bestand = path.join(ROOT, 'store', `listing.${taal}.md`)
if (!existsSync(bestand)) {
  console.error(`\n${path.relative(ROOT, bestand)} bestaat niet.\n`)
  process.exit(1)
}

// Het bestand heeft twee helften. Die van Apple loopt tot het Play-kopje.
const heel = readFileSync(bestand, 'utf8').replace(/\r\n/g, '\n')
const grens = heel.search(/^## Google Play\s*$/m)
if (grens < 0) {
  console.error(`\n${path.relative(ROOT, bestand)} heeft geen "## Google Play"-kopje.\n`)
  process.exit(1)
}
const apple = heel.slice(heel.search(/^## App Store\s*$/m), grens)
const play = heel.slice(grens)
const helft = winkel.startsWith('play') ? play : apple
const waar = winkel.startsWith('play') ? 'Google Play Console' : 'App Store Connect'

/**
 * De velden zoals ze in het bestand staan: een vetgedrukt kopje, en daaronder
 * de tekst tussen backticks of in een blok.
 */
const velden = []
const regex = /^\*\*(.+?)\*\*\s*\n+(?:```\n([\s\S]*?)\n```|`([\s\S]*?)`)/gm
for (let m = regex.exec(helft); m; m = regex.exec(helft)) {
  velden.push({ kop: m[1].trim(), tekst: (m[2] ?? m[3] ?? '').trim() })
}

if (!veld) {
  console.log(`\n${waar} · ${taal} — ${velden.length} velden:\n`)
  for (const v of velden) {
    const eerste = v.tekst.split('\n')[0] ?? ''
    console.log(`  ${v.kop}`)
    console.log(`      ${eerste.slice(0, 70)}${eerste.length > 70 ? '…' : ''}  (${v.tekst.length} tekens)`)
  }
  console.log(`\nEén ervan afdrukken om te plakken:\n`)
  console.log(`  npm run winkeltekst -- --taal ${taal} --veld ${JSON.stringify(velden[0]?.kop.split(' ')[0]?.toLowerCase() ?? 'naam')}\n`)
  process.exit(0)
}

/**
 * De kopjes staan in de taal van het bestand zelf: "Beschrijving" in het
 * Nederlands, "Beschreibung" in het Duits. Wie `--veld beschrijving` typt
 * bedoelt in elke taal hetzelfde veld, dus vertaalt deze tabel dat.
 */
const ZELFDE = {
  naam: ['naam', 'nom', 'name', 'nombre', 'nome', 'titel', 'titre', 'título', 'titolo', 'title'],
  ondertitel: ['ondertitel', 'sous-titre', 'untertitel', 'subtítulo', 'sottotitolo', 'subtitle'],
  trefwoorden: ['trefwoorden', 'mots-clés', 'schlüsselwörter', 'palabras', 'parole', 'keywords'],
  promotietekst: ['promotietekst', 'texte promotionnel', 'werbetext', 'texto promocional',
    'testo promozionale', 'promotional'],
  beschrijving: ['beschrijving', 'description', 'beschreibung', 'descripción', 'descrizione',
    'descripcion'],
  kort: ['korte beschrijving', 'description courte', 'kurzbeschreibung', 'descripción corta',
    'descrizione breve', 'short description'],
  nieuw: ['wat is er nieuw', 'nouveautés', 'neuheiten', 'novedades', 'novità', "what's new",
    'wat is nieuw'],
}

const gezocht = veld.toLowerCase()
const vormen = ZELFDE[gezocht] ?? [gezocht]
// De langste vorm eerst, anders pakt "beschrijving" ook "korte beschrijving".
const past = (kop) => vormen.some((v) => kop.toLowerCase().startsWith(v))
let treffers = velden.filter((v) => past(v.kop))
if (treffers.length > 1 && ZELFDE[gezocht]) {
  const kortst = Math.min(...treffers.map((v) => v.kop.length))
  treffers = treffers.filter((v) => v.kop.length === kortst)
}
if (treffers.length === 0) {
  console.error(`\nGeen veld dat begint met "${veld}". Wat er wel is:\n`)
  for (const v of velden) console.error(`  ${v.kop}`)
  console.error(`\nOf een van deze, die in elke taal werken:\n  ${Object.keys(ZELFDE).join(', ')}\n`)
  process.exit(1)
}
if (treffers.length > 1) {
  console.error(`\n"${veld}" past op meer dan één veld:\n`)
  for (const v of treffers) console.error(`  ${v.kop}`)
  console.error('\nSchrijf er genoeg van uit om er één over te houden.\n')
  process.exit(1)
}

// Alleen de tekst naar stdout, zodat hij te plakken en door te sluizen is.
process.stdout.write(`${treffers[0].tekst}\n`)
process.stderr.write(`\n↑ ${treffers[0].kop} · ${waar} · ${taal} · ${treffers[0].tekst.length} tekens\n`)
