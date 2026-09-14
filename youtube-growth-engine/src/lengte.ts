/**
 * `npm run lengte` — wat videolengte doet met de weg naar monetisatie.
 *
 * Bestaat omdat "maak ze vijftien minuten voor de midrolls" rondgaat als advies
 * en half waar is. Het ware deel is te berekenen; het onware deel is wat er
 * gebeurt als je vult om die lengte te halen.
 */
import { berekenLengte, formatteer, omslagpunt, MIDROLL_MINUTEN } from './studio/watchhours.js'

const SCENARIOS = [
  { minuten: 6, bekekenPercentage: 45 },
  { minuten: 8, bekekenPercentage: 42 },
  { minuten: 11, bekekenPercentage: 38 },
  { minuten: 15, bekekenPercentage: 32 },
  { minuten: 15, bekekenPercentage: 22 },
]

function main(): void {
  console.log('\n=============== LENGTE EN DE DREMPELS ===============\n')
  console.log('  Langere video\'s leveren meer kijktijd per view, en de drempels')
  console.log('  van het Partner Program staan in kijkUREN. Dat is het echte')
  console.log('  argument om langer te maken — niet de midrolls.\n')

  console.log(formatteer(berekenLengte(SCENARIOS)))

  const kort = SCENARIOS[0]!
  console.log(`\n  Midrolls mogen vanaf ${MIDROLL_MINUTEN} minuten.`)
  console.log(`  Een video van 15 minuten haalt de advertentiedrempel bij ongeveer`)
  console.log(`  de helft van de views van een video van 6 minuten — ALS het bekeken`)
  console.log(`  percentage meevalt.\n`)

  const omslag = omslagpunt(kort, 15)
  console.log(`  ${'─'.repeat(52)}`)
  console.log(`  Het omslagpunt: onder ${omslag}% bekeken levert een video van 15`)
  console.log(`  minuten MINDER kijktijd per view op dan jouw 6 minuten op 45%.`)
  console.log(`  Vullen om aan de lengte te komen verlaagt precies dat percentage,`)
  console.log(`  dus dan werkt het averechts: méér views nodig, niet minder.\n`)
  console.log('  De regel die hieruit volgt, en die in de retentiepoort staat:')
  console.log('  kies onderwerpen die de lengte dragen. Rek een onderwerp niet op.\n')
}

main()
