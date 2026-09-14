/**
 * `npm run knowledge:check` — laat zien wat er uit `knowledge/` is aangekomen
 * en waar elk onderdeel in de pipeline terechtkomt.
 */
import { loadKnowledge, seedTitles, verifiedArabicIds } from './knowledge/load.js'
import { audienceBrief, boundariesBrief, trustedSourcesBrief, visualBrief } from './knowledge/prompt.js'

async function main(): Promise<void> {
  const { pack, filesRead, warnings } = await loadKnowledge()

  console.log('\n=========== KENNISBANK ===========\n')
  console.log(`Gelezen: ${filesRead.length > 0 ? filesRead.join(', ') : '(niets)'}`)
  for (const w of warnings) console.log(`LET OP: ${w}`)

  const rows: [string, number | string, string][] = [
    ['makersprofiel — vakkennis', pack.creator.expertise.length, 'stelling, script'],
    ['makersprofiel — eigen voorsprong', pack.creator.unfairAdvantage.length, 'nichescore categorie 2 (15 punten)'],
    ['publiek — beschrijving', pack.audience.description ? 'ja' : 'nee', 'stelling, script, kwaliteitspoort'],
    ['publiek — vragen', pack.audience.questions.length, 'publieksvraag onder elke video'],
    ['publiek — afknappers', pack.audience.turnoffs.length, 'script, trust-poort'],
    ['onderwerpen', pack.topics.filter((t) => t.status === 'open').length, 'wachtrij voor npm run produce'],
    ['referenties', pack.references.length, 'titelvorm + afstandsmeting'],
    ['vertrouwde bronnen', pack.trustedSources.length, 'onderzoeksstap'],
    ['grenzen', pack.boundaries.length, 'policy-poort'],
    ['huisstijl — trefwoorden', pack.houseStyle.visualKeywords.length, 'elke beeldprompt'],
    ['arabische assets (gecontroleerd)', verifiedArabicIds(pack).size, 'religieuze poort'],
    ['eigen inbreng', pack.ownInput ? `${pack.ownInput.length} tekens` : 'leeg', 'originaliteitsscore'],
  ]

  console.log('\nOnderdeel                              waarde   gaat naar')
  console.log('-'.repeat(78))
  for (const [label, value, target] of rows) {
    console.log(`${label.padEnd(38)} ${String(value).padStart(6)}   ${target}`)
  }

  const seeds = seedTitles(pack)
  if (seeds.length > 0) {
    console.log(`\n${seeds.length} referentietitel(s) in quarantaine. Het model ziet hiervan`)
    console.log('alleen de vorm, nooit de tekst.')
  }

  const briefs: [string, string][] = [
    ['publiek + profiel', audienceBrief(pack)],
    ['grenzen', boundariesBrief(pack)],
    ['bronnen', trustedSourcesBrief(pack)],
    ['huisstijl', visualBrief(pack)],
  ]
  console.log('\nPromptfragmenten die hieruit worden gebouwd:')
  for (const [label, text] of briefs) {
    console.log(`  ${label.padEnd(20)} ${text ? `${text.length} tekens` : '(leeg)'}`)
  }
  console.log('\nAlles hieruit gaat als DATA naar het model, nooit als opdracht:')
  console.log('instructies die erin staan worden genegeerd, en de poorten lezen')
  console.log('deze tekst sowieso niet — die kijken naar de data.\n')
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1 })
