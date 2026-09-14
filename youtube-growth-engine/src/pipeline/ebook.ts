import { join } from 'node:path'
import type { EbookProvider, LlmProvider } from '../providers/contracts.js'
import type { LanguageCode, Production } from '../domain/types.js'
import type { Ledger } from '../lib/ledger.js'
import type { Store } from '../store/memory.js'

export interface WorkbookOptions {
  title: string
  subtitle: string
  language: LanguageCode
  outDir: string
  questionsPerChapter?: number
  /** Verkoopprijs, voor de break-evenberekening. Jij bepaalt hem, niet ik. */
  priceEur?: number
}

export interface WorkbookResult {
  htmlPath: string
  pdfPath?: string
  chapterCount: number
  /** Producties die niet mee mochten, met de reden. */
  skipped: string[]
  /** Extra kosten bovenop wat de video's al kostten. */
  marginalCostCents: number
  /** Wat je moet verkopen om de productie van dit werkboek terug te verdienen. */
  breakEvenCopies: number
}

/**
 * Bouwt een werkboek uit afgeronde producties.
 *
 * Dit is de goedkoopste inkomstenbron in het systeem en de reden is saai: het
 * onderzoek, het script, de bronnen en de illustraties zijn al betaald toen de
 * video's werden gemaakt. Wat er bij komt zijn de gespreksvragen en de opmaak.
 *
 * Het werkboek hergebruikt alleen materiaal van eigen producties die door alle
 * poorten zijn gekomen — inclusief de religieuze integriteitspoort. Een claim
 * die de video niet in mocht, komt het werkboek dus ook niet in.
 */
export async function deriveWorkbook(
  llm: LlmProvider,
  ebook: EbookProvider,
  store: Store,
  ledger: Ledger,
  productionIds: string[],
  opts: WorkbookOptions,
): Promise<WorkbookResult> {
  const before = productionIds.reduce((sum, id) => sum + ledger.spentOn(id), 0)
  const chapters: Parameters<EbookProvider['compile']>[0]['chapters'] = []
  const skipped: string[] = []

  for (const id of productionIds) {
    const production = await store.get(id)
    if (!production) continue

    // Alleen materiaal dat de reviewer én jou is gepasseerd. Een werkboek wordt
    // verkocht: religieuze inhoud daarin ongecontroleerd laten is erger dan een
    // video publiceren, want een gekocht boek blijft staan en gaat rond.
    const cleared: typeof production.state[] = [
      'approved', 'uploaded_private', 'scheduled', 'published', 'measured',
    ]
    if (!cleared.includes(production.state)) {
      skipped.push(`${id} staat op "${production.state}" en is nog niet goedgekeurd`)
      continue
    }

    const variant = production.variants.find((v) => v.language === opts.language)
    const script = variant?.script
    if (!script) continue

    const questions = await llm.writeWorkbookQuestions({
      script, language: opts.language, count: opts.questionsPerChapter ?? 3,
    })
    ledger.record({
      productionId: id, step: 'workbook:questions', provider: llm.name,
      costCents: questions.costCents, latencyMs: questions.latencyMs,
      providerRef: questions.providerRef,
    })

    const assets = await store.getAssets(production.assetIds)
    const illustration = assets.find((a) => a.kind === 'image')

    chapters.push({
      heading: variant.metadata?.titleOptions[0] ?? production.topic,
      body: [script.promise, script.conclusion].join(' '),
      ...(illustration ? { imagePath: illustration.uri } : {}),
      questions: questions.value,
      sources: production.sources.map((s) => ({ work: s.work, locator: s.locator })),
    })
  }

  const compiled = await ebook.compile({
    title: opts.title, subtitle: opts.subtitle, language: opts.language,
    chapters, outDir: join(opts.outDir, 'werkboek'),
  })

  const after = productionIds.reduce((sum, id) => sum + ledger.spentOn(id), 0)

  const marginalCostCents = after - before + compiled.costCents
  const priceCents = (opts.priceEur ?? 7.5) * 100

  return {
    htmlPath: compiled.value.htmlPath,
    ...(compiled.value.pdfPath ? { pdfPath: compiled.value.pdfPath } : {}),
    chapterCount: chapters.length,
    skipped,
    marginalCostCents,
    breakEvenCopies: Math.max(1, Math.ceil(marginalCostCents / priceCents)),
  }
}
