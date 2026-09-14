/**
 * `npm run produce -- --topic "..." [--seed-title "..."] [--lang nl,de]`
 *
 * Eén productie, van onderwerp tot wachten-op-mensen. Gebruikt het echte model
 * zodra ANTHROPIC_API_KEY staat; stem en beeld blijven placeholder tot de
 * adapters uit stap 8 van de handleiding er zijn. Het zegt bij elke stap welke
 * kant het op gaat.
 */
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { Ledger } from './lib/ledger.js'
import { JsonFileStore } from './store/json-file.js'
import { runProduction } from './pipeline/run.js'
import { MockLlmProvider } from './providers/mock/llm.js'
import { ClaudeLlmProvider } from './providers/claude/llm.js'
import {
  FfmpegRenderProvider, MockImageProvider, MockMusicProvider,
  MockSearchProvider, MockTtsProvider, MockVideoClipProvider,
} from './providers/mock/media.js'
import { LocalEbookProvider } from './providers/ebook.js'
import type { LanguageCode } from './domain/types.js'
import type { LlmProvider, Providers } from './providers/contracts.js'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

function allArgs(name: string): string[] {
  const values: string[] = []
  process.argv.forEach((a, i) => {
    if (a === `--${name}` && process.argv[i + 1]) values.push(process.argv[i + 1]!)
  })
  return values
}

const cents = (n: number) => `EUR ${(n / 100).toFixed(2)}`

async function main(): Promise<void> {
  const topic = arg('topic')
  if (!topic) {
    console.error('\nGebruik: npm run produce -- --topic "je onderwerp" [--seed-title "..."]\n')
    process.exit(1)
  }
  const languages = (arg('lang') ?? 'nl').split(',') as LanguageCode[]
  const seedTitles = allArgs('seed-title')
  const targetSeconds = Number(arg('seconds') ?? 660)
  const outDir = join(process.cwd(), 'out', new Date().toISOString().slice(0, 10))
  await mkdir(outDir, { recursive: true })

  const hasKey = Boolean(process.env['ANTHROPIC_API_KEY'])
  const llm: LlmProvider = hasKey ? new ClaudeLlmProvider() : new MockLlmProvider()

  const providers: Providers = {
    llm,
    search: new MockSearchProvider(),
    tts: new MockTtsProvider(),
    image: new MockImageProvider(),
    videoClip: new MockVideoClipProvider(),
    music: new MockMusicProvider(),
    render: new FfmpegRenderProvider(),
    ebook: new LocalEbookProvider(),
  }

  const store = new JsonFileStore(process.env['STORE_PATH'] ?? '.data/producties.json')
  const ledger = new Ledger({
    perProductionCents: Number(process.env['BUDGET_PER_PRODUCTION_CENTS'] ?? 1800),
    perDayCents: Number(process.env['BUDGET_PER_DAY_CENTS'] ?? 800),
    perMonthCents: Number(process.env['BUDGET_PER_MONTH_CENTS'] ?? 10_000),
  })

  console.log('\n--- Wat er nu draait ---')
  console.log(`  redactie    ${llm.name.padEnd(16)} ${llm.simulated ? 'GESIMULEERD' : 'ECHT'}`)
  for (const [role, p] of Object.entries(providers)) {
    if (role === 'llm') continue
    console.log(`  ${role.padEnd(11)} ${p.name.padEnd(16)} ${p.simulated ? 'GESIMULEERD' : 'ECHT'}`)
  }
  if (!hasKey) {
    console.log('\n  ANTHROPIC_API_KEY staat niet; de redactie draait op het mockmodel.')
    console.log('  Zie stap 3 van docs/HANDLEIDING.md.')
  }
  console.log(`\nOnderwerp: ${topic}`)
  if (seedTitles.length > 0) {
    console.log(`Referentietitels: ${seedTitles.length} (alleen de vorm gaat naar het model)`)
  }
  console.log('')

  const result = await runProduction(providers, store, ledger, {
    topic, languages, targetSeconds, outDir, seedTitles,
    verifiedArabicAssetIds: new Set((process.env['VERIFIED_ARABIC_IDS'] ?? '').split(',').filter(Boolean)),
    vocalsAndDuffOnly: process.env['MUSIC_POLICY'] !== 'any',
  })

  for (const g of result.gateResults) {
    console.log(`  [${g.passed ? 'GEHAALD  ' : 'AFGEWEZEN'}] ${g.gate.padEnd(22)} ${g.score}/100 (drempel ${g.threshold})`)
    if (!g.passed) {
      for (const c of g.breakdown.filter((x) => x.score < x.max)) {
        console.log(`      ${c.criterion}: ${c.reasoning}`)
      }
    }
  }

  console.log(`\nProductie ${result.production.id} — ${result.production.state}`)
  console.log(`Kosten: ${cents(result.costCents)}`)

  if (result.rejected) {
    console.log(`\nAfgewezen op "${result.rejectedAt}".`)
    console.log('Dat is een goede uitkomst als de reden klopt. Klopt hij niet, dan zit')
    console.log('de fout in een prompt en niet in het onderwerp — laat het weten.\n')
    return
  }

  console.log('\nBestanden:')
  for (const a of result.artifacts) console.log(`  ${a.replace(process.cwd() + '/', '')}`)
  console.log('\nVolgende stappen:')
  console.log('  1. Laat je reviewer het script en de bronnen nakijken.')
  console.log(`  2. Keur zelf goed.`)
  console.log(`  3. npm run upload -- --production ${result.production.id}\n`)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
