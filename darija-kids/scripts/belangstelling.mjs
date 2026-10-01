/**
 * Hoeveel mensen hebben op "hou me op de hoogte" gedrukt?
 *
 * Dat is het enige getal over belangstelling dat van jou is. Een bezoeker die
 * Cloudflare telt, is een IP-adres dat langskwam; iemand in deze tabel heeft
 * zijn adres gegeven en de link in zijn mail aangeklikt. Op de dag van de
 * lancering is dit de lijst die je in één keer kunt bereiken, zonder algoritme
 * ertussen.
 *
 * **Zonder de adressen zelf.** Die staan in de database en horen daar; in een
 * terminalvenster voegen ze niets toe en ze kunnen er per ongeluk uit
 * gekopieerd worden — naar een schermafdruk, een gesprek, een bugmelding. Wat
 * je hier ziet zijn aantallen.
 *
 * Twee aantallen die niet hetzelfde zijn:
 *
 * - **bevestigd** — adres aangeklikt in de mail. Deze mensen mag je mailen.
 * - **wacht** — formulier ingevuld, mail nog niet aangeklikt. Deze niet.
 *
 * Dat onderscheid is geen formaliteit maar de wet: zonder die tweede klik heb
 * je geen aantoonbare toestemming. Een lijst van honderd waarvan er dertig
 * bevestigd zijn, is een lijst van dertig.
 *
 *   npm run belangstelling             — de laatste veertien dagen
 *   npm run belangstelling -- --alles  — elke dag sinds het begin
 *   npm run belangstelling -- --hier   — op de lokale kopie
 */
import { wranglerOfStop } from './lib/wrangler.mjs'

const HIER = process.argv.includes('--hier')
const ALLES = process.argv.includes('--alles')
const DAGEN = 14

const vraag = (sql) => {
  const uit = wranglerOfStop(
    ['d1', 'execute', 'darijaforkids', HIER ? '--local' : '--remote', '--yes', '--json', '--command', sql],
    'de aanmeldingen op te vragen',
  )
  /* Wrangler zet er soms een regel tekst boven; het json begint bij de haak. */
  return JSON.parse(uit.slice(uit.indexOf('[')))[0]?.results ?? []
}

/* ---------------------------------------------------------------- tellen */

const totaal = vraag(`
SELECT
  COUNT(*)                                                    AS alles,
  SUM(CASE WHEN status = 'bevestigd' THEN 1 ELSE 0 END)       AS bevestigd,
  SUM(CASE WHEN status = 'wacht'     THEN 1 ELSE 0 END)       AS wacht,
  SUM(CASE WHEN uitgeschreven_op IS NOT NULL THEN 1 ELSE 0 END) AS weg,
  SUM(CASE WHEN nieuws = 1 THEN 1 ELSE 0 END)                 AS nieuws,
  MIN(aangemeld_op)                                           AS eerste
FROM aanmelding`)[0] ?? {}

if (!Number(totaal.alles)) {
  console.log('\nNog niemand aangemeld.\n')
  console.log('Dat is geen storing: de knop staat op elke pagina onder')
  console.log('"Hou me op de hoogte". Kijk met --hier of je de lokale kopie bedoelde.\n')
  process.exit(0)
}

const talen = vraag(`
SELECT taal, COUNT(*) AS n,
       SUM(CASE WHEN status = 'bevestigd' THEN 1 ELSE 0 END) AS bevestigd
  FROM aanmelding GROUP BY taal ORDER BY n DESC`)

const perDag = vraag(`
SELECT date(aangemeld_op, 'unixepoch') AS dag,
       COUNT(*) AS n,
       SUM(CASE WHEN status = 'bevestigd' THEN 1 ELSE 0 END) AS bevestigd
  FROM aanmelding
 GROUP BY dag ORDER BY dag DESC
 ${ALLES ? '' : `LIMIT ${DAGEN}`}`)

/* --------------------------------------------------------------- tonen */

const n = (v) => Number(v ?? 0)
const vul = (s, b) => String(s ?? '').padEnd(b)
const rechts = (s, b) => String(s ?? '').padStart(b)

console.log('')
console.log(`Belangstelling${HIER ? ' (lokale kopie)' : ''}`)
console.log('─'.repeat(52))
console.log(`${rechts(n(totaal.alles), 6)}  aanmeldingen in totaal`)
console.log(`${rechts(n(totaal.bevestigd), 6)}  bevestigd — deze mag je mailen`)
console.log(`${rechts(n(totaal.wacht), 6)}  wachten nog op hun bevestigingsklik`)
if (n(totaal.weg)) console.log(`${rechts(n(totaal.weg), 6)}  weer uitgeschreven`)
console.log(`${rechts(n(totaal.nieuws), 6)}  wil bericht als er iets nieuws is`)

/**
 * Hoeveel er blijft hangen bij de bevestigingsmail.
 *
 * Onder de zestig procent is er iets mis met de mail zelf: hij komt in de
 * ongewenste post, of de knop erin is niet te vinden. Dat is te repareren en
 * het kost je anders de helft van je lijst.
 */
const deel = n(totaal.bevestigd) / n(totaal.alles)
console.log('')
console.log(`Van de aanmeldingen bevestigt ${Math.round(deel * 100)}%.`)
if (n(totaal.wacht) >= 5 && deel < 0.6) {
  console.log('')
  console.log('Dat is laag. Kijk of de bevestigingsmail wel aankomt en of de knop')
  console.log('erin te vinden is — met `npm run logboek` zie je wat de mailpartner')
  console.log('terugzegt. Een lijst van honderd met dertig bevestigingen is een')
  console.log('lijst van dertig.')
}

console.log('')
console.log('Per taal')
console.log('─'.repeat(52))
for (const t of talen) {
  console.log(`  ${vul(t.taal, 8)} ${rechts(n(t.n), 5)}   waarvan ${n(t.bevestigd)} bevestigd`)
}

console.log('')
console.log(ALLES ? 'Per dag, sinds het begin' : `Per dag, de laatste ${DAGEN}`)
console.log('─'.repeat(52))
const piek = Math.max(...perDag.map((d) => n(d.n)), 1)
for (const d of perDag) {
  const balk = '█'.repeat(Math.max(1, Math.round((n(d.n) / piek) * 24)))
  console.log(`  ${vul(d.dag, 12)} ${rechts(n(d.n), 4)}  ${balk}`)
}

if (!ALLES && perDag.length === DAGEN) {
  console.log('')
  console.log('Verder terug kijken:  npm run belangstelling -- --alles')
}
console.log('')
