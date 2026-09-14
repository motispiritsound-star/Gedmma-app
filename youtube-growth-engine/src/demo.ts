/**
 * M1 — de volledige pipeline op mockproviders.
 *
 * Draait drie producties die samen de belangrijkste eigenschap van het systeem
 * laten zien: het weigert vaker dan het publiceert, en het weigert vroeg.
 *
 *   1. Een concept zonder invulbare stelling      -> valt op de goedkoopste poort
 *   2. Een script met een hadith zonder gradering -> valt op de religieuze poort
 *   3. Een volledig onderbouwde productie          -> echte MP4, wacht op mensen
 *
 * Geen enkele API-credential nodig. Geen enkele cent werkelijke kosten.
 */
import { mkdir, rm } from 'node:fs/promises'
import { statSync } from 'node:fs'
import { join } from 'node:path'
import { Ledger } from './lib/ledger.js'
import { MemoryStore } from './store/memory.js'
import { runProduction, type RunResult } from './pipeline/run.js'
import { MockLlmProvider, MockLlmProviderWithUngradedHadith } from './providers/mock/llm.js'
import {
  FfmpegRenderProvider, MockImageProvider, MockMusicProvider,
  MockSearchProvider, MockTtsProvider, MockVideoClipProvider,
} from './providers/mock/media.js'
import { LocalEbookProvider } from './providers/ebook.js'
import { deriveWorkbook } from './pipeline/ebook.js'
import type { Providers } from './providers/contracts.js'

const OUT = join(process.cwd(), 'out')
const eur = (cents: number) => `EUR ${(cents / 100).toFixed(2)}`

function makeProviders(llm: MockLlmProvider): Providers {
  return {
    llm,
    search: new MockSearchProvider(),
    tts: new MockTtsProvider(),
    image: new MockImageProvider(),
    videoClip: new MockVideoClipProvider(),
    music: new MockMusicProvider(),
    render: new FfmpegRenderProvider(),
    ebook: new LocalEbookProvider(),
  }
}

function reportGates(result: RunResult): void {
  for (const g of result.gateResults) {
    const mark = g.passed ? 'GEHAALD ' : 'AFGEWEZEN'
    console.log(`    [${mark}] ${g.gate.padEnd(22)} ${String(g.score).padStart(3)}/100  (drempel ${g.threshold})`)
    for (const c of g.breakdown) {
      // Bij een gehaalde poort is een criterium dat net niet vol scoort geen
      // bevinding. Alleen wat de poort deed vallen, of wat echt laag staat.
      const weak = c.score < c.max * 0.8
      if (!g.passed ? c.score < c.max : weak) {
        console.log(`               ! ${c.criterion}: ${c.reasoning}`)
      }
    }
  }
}

async function main(): Promise<void> {
  await rm(OUT, { recursive: true, force: true })
  await mkdir(OUT, { recursive: true })

  const store = new MemoryStore()
  const ledger = new Ledger({
    perProductionCents: 1800,   // EUR 18 per productie
    perDayCents: 800,           // EUR 8 per dag
    perMonthCents: 10_000,      // EUR 100 per maand, uit config/defaults.yaml
  })

  console.log('\n================ YOUTUBE GROWTH ENGINE — M1 ================\n')

  // --- 1. Geen stelling ----------------------------------------------------
  console.log('[1/4] Concept zonder invulbare stelling')
  const noThesis = await runProduction(
    makeProviders(new MockLlmProvider()), store, ledger,
    {
      topic: 'geen-stelling', languages: ['nl'], targetSeconds: 120, outDir: OUT,
      verifiedArabicAssetIds: new Set(['ar-2-144']), vocalsAndDuffOnly: true,
    },
  )
  reportGates(noThesis)
  console.log(`    -> afgewezen op "${noThesis.rejectedAt}", kosten ${eur(noThesis.costCents)}\n`)

  // --- 2. Hadith zonder gradering ------------------------------------------
  console.log('[2/4] Script met een hadith zonder gradering')
  const badHadith = await runProduction(
    makeProviders(new MockLlmProviderWithUngradedHadith()), store, ledger,
    {
      topic: 'losse-hadith', languages: ['nl'], targetSeconds: 120, outDir: OUT,
      verifiedArabicAssetIds: new Set(['ar-2-144']), vocalsAndDuffOnly: true,
    },
  )
  reportGates(badHadith)
  console.log(`    -> afgewezen op "${badHadith.rejectedAt}", kosten ${eur(badHadith.costCents)}\n`)

  // --- 3. Titel te dicht bij de referentie ---------------------------------
  // De titels van de referentievideo's mogen het proces in als invoer. Ze mogen
  // er niet uit komen: de gepubliceerde titel moet aantoonbaar afwijken.
  console.log('[3/4] Titelopties te dicht bij een referentietitel')
  const copiedTitle = await runProduction(
    makeProviders(new MockLlmProvider()), store, ledger,
    {
      topic: 'medina', languages: ['nl'], targetSeconds: 120, outDir: OUT,
      seedTitles: [
        'De eerste moskee had geen koepel. Dat was geen toeval.',
        'Wat er als eerste stond, en wat er pas later bij kwam',
        'Waarom een moskee eruitziet zoals hij eruitziet',
      ],
      verifiedArabicAssetIds: new Set(['ar-2-144']), vocalsAndDuffOnly: true,
    },
  )
  reportGates(copiedTitle)
  console.log(`    -> afgewezen op "${copiedTitle.rejectedAt}", kosten ${eur(copiedTitle.costCents)}\n`)

  // --- 4. Volledige productie, Nederlands en Duits -------------------------
  console.log('[4/4] Volledig onderbouwde productie, NL + DE')
  const good = await runProduction(
    makeProviders(new MockLlmProvider()), store, ledger,
    {
      topic: 'medina', languages: ['nl', 'de'], targetSeconds: 120, outDir: OUT,
      seedTitles: [
        'Ik bouwde een moskee in 24 uur',
        'De grootste moskeeen ter wereld, op volgorde',
      ],
      verifiedArabicAssetIds: new Set(['ar-2-144']), vocalsAndDuffOnly: true,
    },
  )
  reportGates(good)
  console.log(`    -> toestand: ${good.production.state}`)

  // --- Kosten ---------------------------------------------------------------
  console.log('\n--- Kosten per stap (productie 3) ---')
  for (const row of ledger.byStep(good.production.id).sort((a, b) => b.cents - a.cents)) {
    console.log(`    ${row.step.padEnd(20)} ${row.provider.padEnd(16)} ${eur(row.cents).padStart(10)}`)
  }
  console.log(`    ${'TOTAAL'.padEnd(37)} ${eur(good.costCents).padStart(10)}`)

  const rejectedCost = noThesis.costCents + badHadith.costCents + copiedTitle.costCents
  console.log(`\n    Kosten van afgewezen producties: ${eur(rejectedCost)}`)
  console.log('    Dat is de prijs van kwaliteit, en die hoor je te kennen.')

  const breakEven = ledger.breakEvenViews(good.production.id, {
    rpmEur: 4.5, monthlyFixedEur: 45, videosThisMonth: 5,
  })
  console.log(`\n    Break-even bij RPM EUR 4,50: ${breakEven.toLocaleString('nl-NL')} views`)

  // --- Werkboek: dezelfde inhoud, tweede inkomstenbron ---------------------
  const providers = makeProviders(new MockLlmProvider())
  const workbook = await deriveWorkbook(
    providers.llm, providers.ebook, store, ledger,
    [good.production.id],
    {
      title: 'Wat er als eerste stond',
      subtitle: 'Een werkboek voor thuis, bij de video-serie over de vroege moskee',
      language: 'nl', outDir: OUT,
    },
  )
  console.log('\n--- Werkboek uit dezelfde productie ---')
  console.log(`    ${workbook.chapterCount} hoofdstuk(ken)`)
  console.log(`    Extra kosten bovenop de video: ${eur(workbook.marginalCostCents)}`)
  console.log(`    ${workbook.htmlPath.replace(process.cwd() + '/', '')}`)
  if (workbook.pdfPath) console.log(`    ${workbook.pdfPath.replace(process.cwd() + '/', '')}`)
  else console.log('    (geen headless browser gevonden; HTML is drukklaar)')

  console.log('\n--- Titelopties die de poort haalden ---')
  for (const v of good.production.variants) {
    for (const t of v.metadata?.titleOptions ?? []) console.log(`    [${v.language}] ${t}`)
  }

  // --- Idempotentie ---------------------------------------------------------
  const key = `upload:${good.production.id}:v1`
  const first = await store.claimUpload(key, 'yt-DEMO-0001')
  const second = await store.claimUpload(key, 'yt-DEMO-0002')
  console.log(`\n--- Idempotentie ---`)
  console.log(`    Eerste claim : ${first.videoId} (nieuw: ${first.created})`)
  console.log(`    Tweede claim : ${second.videoId} (nieuw: ${second.created})  <- geen dubbele upload`)

  // --- Opgeleverde bestanden ------------------------------------------------
  console.log('\n--- Opgeleverde bestanden ---')
  for (const a of good.artifacts) {
    const kb = Math.round(statSync(a).size / 1024)
    console.log(`    ${a.replace(process.cwd() + '/', '')}  (${kb} kB)`)
  }

  // --- Eerlijkheid over wat er draait --------------------------------------
  console.log('\n--- Wat hier echt draait, en wat niet ---')
  const p = makeProviders(new MockLlmProvider())
  for (const [role, prov] of Object.entries(p)) {
    console.log(`    ${role.padEnd(12)} ${prov.name.padEnd(22)} ${prov.simulated ? 'GESIMULEERD' : 'ECHT'}`)
  }
  console.log('\n    Echt: de state machine, de poorten, de kostenregistratie, de')
  console.log('    idempotentie, de ondertiteling, de technische QC en de montage.')
  console.log('    Gesimuleerd: taalmodel, zoeken, stem, beeld, videoclips, muziek.')
  console.log('\n    Ontbrekende credentials: Anthropic, Google OAuth (YouTube Data +')
  console.log('    Analytics), TTS, beeldgenerator, videogenerator, muzieklicentie, opslag.')
  console.log('\n    Nog menselijk nodig: kanaal aanmaken, OAuth geven, stemtest, de')
  console.log('    gekwalificeerde religieuze reviewer, en jouw eindgoedkeuring.\n')
}

main().catch((err: unknown) => {
  console.error(err)
  process.exitCode = 1
})
