/**
 * De trechter, uitgelezen en op een rij gezet.
 *
 * Dit is de andere helft van `src/engine/tellen.ts`: daar gaan de tellers de
 * deur uit, hier komen ze terug. Geen dashboard, geen dienst van buiten —
 * één query op de eigen D1 en een tabel in de terminal.
 *
 *     npm run cijfers                 de laatste 14 dagen
 *     npm run cijfers -- --dagen 30   een ander venster
 *     npm run cijfers -- --hier       de lokale kopie in plaats van de echte
 *     npm run cijfers -- --per-dag    per dag in plaats van opgeteld
 *
 * **Lees de verhoudingen, niet de aantallen.** De redenen staan in
 * `engine/tellen.ts`: wat offline gebeurt gaat verloren, het eindpunt is open,
 * en twee tellers overdrijven van zichzelf. Daarom drukt dit script de stappen
 * in de volgorde van de trechter af met het percentage van de stap ervóór —
 * dat getal is bruikbaar, een absoluut aantal niet.
 */
import { wranglerOfStop } from './lib/wrangler.mjs'

const HIER = process.argv.includes('--hier')
const PER_DAG = process.argv.includes('--per-dag')
const vlag = process.argv.indexOf('--dagen')
const DAGEN = vlag === -1 ? 14 : Math.max(1, Math.min(365, Number(process.argv[vlag + 1]) || 14))

/**
 * De trechter in de volgorde waarin iemand hem doorloopt, met wat elke stap
 * betekent. De treden staan er los onder: dat is een curve, geen stap.
 */
const TRECHTER = [
  ['start', 'de app is opengegaan (max. 1 per dag per toestel)'],
  ['welkom_af', 'het welkomstscherm is doorlopen'],
  ['aanbod_zien', 'het abonnementsaanbod is getoond'],
  ['aanbod_later', '— daarvan koos "later"'],
  ['gratis_op', 'het slot bereikt: de laatste gratis les af'],
  ['paywall_zien', 'het abonnementsscherm geopend'],
  ['koop_start', 'een aankoop gestart bij de winkel'],
]
const LOSSE = [
  ['deel_zien', 'de deelkaart getoond'],
  ['beoord_zien', 'om een beoordeling gevraagd'],
]
const TREDEN = [1, 2, 3, 4, 5, 10, 20, 40, 74]

const grens = new Date(Date.now() - DAGEN * 864e5).toISOString().slice(0, 10)

const sql = PER_DAG
  ? `SELECT dag, naam, sum(aantal) AS n FROM teller WHERE dag >= '${grens}' GROUP BY dag, naam ORDER BY dag DESC, naam`
  : `SELECT naam, sum(aantal) AS n, count(DISTINCT dag) AS dagen FROM teller WHERE dag >= '${grens}' GROUP BY naam`

const uit = wranglerOfStop(
  ['d1', 'execute', 'darijaforkids', HIER ? '--local' : '--remote', '--command', sql, '--json'],
  'de cijfers op te vragen',
)

let rijen = []
try {
  const gevonden = JSON.parse(uit).find((blok) => Array.isArray(blok?.results))
  rijen = gevonden?.results ?? []
} catch {
  console.error('\n  Kon het antwoord van wrangler niet lezen.\n')
  process.exit(1)
}

const waar = HIER ? 'de lokale kopie' : 'de echte database'
console.log(`\n  ${waar}, vanaf ${grens} (${DAGEN} dagen)\n`)

if (!rijen.length) {
  console.log('  Nog niets geteld.\n')
  console.log('  Dat kan twee dingen betekenen. Staat `TELLEN` in')
  console.log('  src/engine/tellen.ts nog op `false`, dan telt de app met opzet')
  console.log('  niet — zie de toelichting daar: eerst de twee winkelverklaringen.')
  console.log('  Staat hij op `true`, dan is er nog geen versie met de meting erin')
  console.log('  in de winkels, of er is nog niemand langsgekomen.\n')
  process.exit(0)
}

if (PER_DAG) {
  const perDag = new Map()
  for (const r of rijen) {
    if (!perDag.has(r.dag)) perDag.set(r.dag, new Map())
    perDag.get(r.dag).set(r.naam, r.n)
  }
  const namen = [...TRECHTER, ...LOSSE].map(([n]) => n)
  console.log(`  dag          ${namen.map((n) => n.slice(0, 7).padStart(8)).join('')}`)
  for (const [dag, tellers] of perDag) {
    console.log(`  ${dag}  ${namen.map((n) => String(tellers.get(n) ?? 0).padStart(8)).join('')}`)
  }
  console.log('')
  process.exit(0)
}

const n = new Map(rijen.map((r) => [r.naam, r.n]))
const deel = (a, b) => (b > 0 ? `${((a / b) * 100).toFixed(1)}%` : '—')

console.log('  stap                          aantal   van de vorige')
console.log('  ' + '─'.repeat(58))
let vorige = null
for (const [naam, wat] of TRECHTER) {
  const aantal = n.get(naam) ?? 0
  /* "Later" is geen stap vooruit maar een afsplitsing van het aanbod, dus
     vergelijk hem daarmee en niet met zichzelf als nieuwe noemer. */
  const tegen = naam === 'aanbod_later' ? (n.get('aanbod_zien') ?? 0) : vorige
  console.log(`  ${naam.padEnd(16)} ${String(aantal).padStart(10)}   ${(tegen === null ? '' : deel(aantal, tegen)).padStart(8)}   ${wat}`)
  if (naam !== 'aanbod_later') vorige = aantal
}

console.log('')
console.log('  hoe diep in het pad')
console.log('  ' + '─'.repeat(58))
for (const t of TREDEN) {
  const aantal = n.get(`les_af:${t}`) ?? 0
  if (!aantal) continue
  console.log(`  ${String(t).padStart(3)} lessen af  ${String(aantal).padStart(10)}   ${deel(aantal, n.get('les_af:1') ?? 0).padStart(8)}  van wie er één deed`)
}

console.log('')
console.log('  de twee groeilussen')
console.log('  ' + '─'.repeat(58))
for (const [naam, wat] of LOSSE) {
  console.log(`  ${naam.padEnd(16)} ${String(n.get(naam) ?? 0).padStart(10)}            ${wat}`)
}

console.log('')
console.log('  Lees de percentages, niet de aantallen: wat offline gebeurt gaat')
console.log('  verloren, het eindpunt is open, en `aanbod_zien` en `beoord_zien`')
console.log('  tellen getoonde kaarten en geen mensen. Zie engine/tellen.ts.\n')
