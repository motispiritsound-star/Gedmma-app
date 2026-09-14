/**
 * `npm run workbook` — bouwt een verkoopbaar werkboek uit goedgekeurde
 * producties.
 *
 * Dit is de inkomstenbron die vanaf video één werkt: geen abonneedrempel, geen
 * wachttijd, en het onderzoek is al betaald toen de video's werden gemaakt.
 * Zie docs/13 §3.
 */
import { Ledger } from './lib/ledger.js'
import { JsonFileStore } from './store/json-file.js'
import { LocalEbookProvider } from './providers/ebook.js'
import { MockLlmProvider } from './providers/mock/llm.js'
import { ClaudeLlmProvider } from './providers/claude/llm.js'
import { deriveWorkbook } from './pipeline/ebook.js'
import type { LanguageCode } from './domain/types.js'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const eur = (cents: number) => `EUR ${(cents / 100).toFixed(2)}`

async function main(): Promise<void> {
  const store = new JsonFileStore(process.env['STORE_PATH'] ?? '.data/producties.json')
  const all = await store.list()

  const ids = (arg('productions') ?? '').split(',').map((s) => s.trim()).filter(Boolean)
  const chosen = ids.length > 0 ? ids : all.map((p) => p.id)

  if (chosen.length === 0) {
    console.error('\nGeen producties gevonden. Maak eerst video\'s met `npm run produce`.\n')
    process.exit(1)
  }

  const llm = process.env['ANTHROPIC_API_KEY'] ? new ClaudeLlmProvider() : new MockLlmProvider()
  const ledger = new Ledger({
    perProductionCents: Number(process.env['BUDGET_PER_PRODUCTION_CENTS'] ?? 1800),
    perDayCents: Number(process.env['BUDGET_PER_DAY_CENTS'] ?? 800),
    perMonthCents: Number(process.env['BUDGET_PER_MONTH_CENTS'] ?? 10_000),
  })

  const price = Number(arg('price') ?? 7.5)
  const result = await deriveWorkbook(llm, new LocalEbookProvider(), store, ledger, chosen, {
    title: arg('title') ?? 'Werkboek bij de serie',
    subtitle: arg('subtitle') ?? 'Om samen thuis door te nemen',
    language: (arg('lang') ?? 'nl') as LanguageCode,
    outDir: arg('out') ?? 'out',
    priceEur: price,
  })

  console.log('\n--- Werkboek ---')
  console.log(`  hoofdstukken:      ${result.chapterCount}`)
  console.log(`  extra kosten:      ${eur(result.marginalCostCents)}`)
  console.log(`  voorgestelde prijs: EUR ${price.toFixed(2)}`)
  console.log(`  break-even:        ${result.breakEvenCopies} exempla(a)r(en)`)
  console.log(`  ${result.htmlPath}`)
  if (result.pdfPath) console.log(`  ${result.pdfPath}`)

  if (result.skipped.length > 0) {
    console.log('\n  Niet meegenomen:')
    for (const s of result.skipped) console.log(`    - ${s}`)
    console.log('  Een werkboek wordt verkocht en blijft staan. Alleen materiaal dat')
    console.log('  de reviewer én jij hebben goedgekeurd mag erin.')
  }

  if (result.chapterCount === 0) {
    console.log('\n  Nog geen enkele productie is goedgekeurd, dus het werkboek is leeg.')
    console.log('  Keur eerst een video goed; daarna staat dit er binnen een minuut.\n')
    return
  }

  console.log('\n  Verkopen kan via Gumroad of Payhip: die nemen betaling, btw en')
  console.log('  levering over voor een percentage, zonder eigen webshop. Ik maak')
  console.log('  geen account voor je aan — dat vraagt jouw identiteit.\n')
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1 })
