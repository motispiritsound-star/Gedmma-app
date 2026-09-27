/**
 * Een sleutel intrekken, en hem weer teruggeven.
 *
 * De kolom `ingetrokken` stond al in het schema en het leespad hield er al
 * rekening mee — op beide manieren: de sleutel uit de mail én de boekenlijst
 * op het portaal. Alleen zette niemand hem ooit. Een terugbetaling, een
 * terugvordering bij de bank, een sleutel die op een forum belandt: er was
 * geen knop.
 *
 * Een terugbetaling via de betaalpartner gaat nu vanzelf — zie `koop()` in
 * `server/src/index.ts`. Dit is voor de rest: alles waar geen melding van
 * komt, en het terugdraaien van een vergissing.
 *
 *   npm run intrekken              — vraagt om het bestelnummer
 *   npm run intrekken -- --terug   — juist wéér geldig maken
 *   npm run intrekken -- --hier    — op de lokale kopie
 */
import { wrangler } from './lib/wrangler.mjs'

const HIER = process.argv.includes('--hier')
const TERUG = process.argv.includes('--terug')

const d1 = (vraag) => {
  const uit = wrangler(['d1', 'execute', 'darijaforkids',
    HIER ? '--local' : '--remote', '--yes', '--json', '--command', vraag])
  return JSON.parse(uit.slice(uit.indexOf('[')))[0] ?? {}
}

/**
 * Aanhalingstekens in een waarde die in de vraag terechtkomt.
 *
 * Een bestelnummer van de betaalpartner is een reeks letters en cijfers, dus
 * dit gebeurt in de praktijk niet. Maar het staat hier één regel van de
 * database af, en dan is "gebeurt in de praktijk niet" geen reden.
 */
const veilig = (tekst) => String(tekst).replace(/'/g, "''")

if (!process.stdin.isTTY) {
  console.error('\nDeze opdracht vraagt om een bestelnummer en heeft dus een scherm nodig.\n')
  process.exit(1)
}

const { createInterface } = await import('node:readline/promises')
const lezer = createInterface({ input: process.stdin, output: process.stdout })

/**
 * Vragen, en netjes ophouden als er niet meer geantwoord wordt.
 *
 * Ctrl+C of Ctrl+D halverwege gaf een stacktrace van tien regels uit de
 * binnenkant van Node. Dat is voor deze opdracht extra verkeerd: je bent op
 * dat moment bezig iemands boeken af te pakken, en dan wil je zeker weten of
 * er iets is gebeurd. Er gebeurt niets — dat hoort er gewoon te staan.
 */
const vraag = async (tekst) => {
  try {
    return await lezer.question(tekst)
  } catch {
    lezer.close()
    console.log('\n\nAfgebroken. Er is niets veranderd.\n')
    process.exit(0)
  }
}

console.log(`\nWelke bestelling ${TERUG ? 'wordt weer geldig' : 'trek je in'}?`)
console.log('Het bestelnummer staat in de kolom `bestelnummer` van:\n')
console.log('  npm run bestellingen\n')

const nummer = (await vraag('Bestelnummer: ')).trim()
if (!nummer) {
  lezer.close()
  console.log('\nNiets ingevuld, dus niets gedaan.\n')
  process.exit(0)
}

// Eerst laten zien wát je raakt. Een bestelnummer is een reeks tekens zonder
// betekenis, en dat is precies het soort ding waarin je je vergist.
const gevonden = d1(`SELECT email, reeksen, ingetrokken, reden FROM bestelling
                     WHERE bestelnummer = '${veilig(nummer)}'`).results ?? []

if (!gevonden.length) {
  lezer.close()
  console.log(`\nGeen bestelling met nummer ${nummer}.\n`)
  process.exit(1)
}

for (const r of gevonden) {
  console.log(`\n  ${r.email} — ${r.reeksen}`)
  console.log(`  nu: ${r.ingetrokken ? `ingetrokken (${r.reden ?? 'geen reden'})` : 'geldig'}`)
}

let reden = ''
if (!TERUG) {
  console.log('\nDe reden komt in de database te staan, voor als je er later op terugkijkt.')
  reden = (await vraag('Reden (enter = "met de hand"): ')).trim() || 'met de hand'
}

const ja = (await vraag(`\n${TERUG ? 'Weer geldig maken' : 'Intrekken'}? (j/n): `)).trim().toLowerCase()
lezer.close()

if (ja !== 'j' && ja !== 'ja') {
  console.log('\nNiets gedaan.\n')
  process.exit(0)
}

if (TERUG) {
  d1(`UPDATE bestelling SET ingetrokken = NULL, reden = NULL
      WHERE bestelnummer = '${veilig(nummer)}'`)
} else {
  // Seconden, net als `nu()` in de worker. De kolom wordt door beide gevuld.
  d1(`UPDATE bestelling SET ingetrokken = ${Math.floor(Date.now() / 1000)}, reden = '${veilig(reden)}'
      WHERE bestelnummer = '${veilig(nummer)}' AND ingetrokken IS NULL`)
}

/**
 * Kijken wat er stáát, niet wat de opdracht zegt dat hij deed.
 *
 * Wrangler geeft bij een UPDATE geen `changes` terug — alleen een duur. Op
 * dat getal afgaan leverde "Die stond al ingetrokken" op een sleutel die
 * zojuist was ingetrokken. Dat is de verkeerde melding op het verkeerde
 * moment: dan probeer je het nog eens, of je denkt dat het mislukt is terwijl
 * iemand zijn boeken kwijt is.
 */
const na = (d1(`SELECT ingetrokken, reden FROM bestelling
                WHERE bestelnummer = '${veilig(nummer)}'`).results ?? [])[0]

console.log('')
if (!na) {
  console.log('De bestelling is ondertussen verdwenen. Er is niets veranderd.\n')
} else if (TERUG) {
  console.log(na.ingetrokken
    ? 'Dat is niet gelukt: hij staat nog steeds ingetrokken.\n'
    : 'Weer geldig. De sleutel en het portaal geven de boeken weer vrij.\n')
} else if (na.ingetrokken) {
  console.log('Ingetrokken. De sleutel uit de mail werkt niet meer, en op het')
  console.log(`portaal staan deze boeken niet meer in de lijst.`)
  console.log(`\nReden: ${na.reden ?? 'geen'}\n`)
} else {
  console.log('Dat is niet gelukt: hij staat nog steeds geldig.\n')
}
