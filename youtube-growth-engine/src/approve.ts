/**
 * `npm run approve -- --production <id>`
 *
 * Toont het dossier en neemt de twee goedkeuringen aan die de pipeline nodig
 * heeft: eerst de gekwalificeerde reviewer, dan jij. In die volgorde, want een
 * fout die de reviewer eruit haalt, hoef jij niet te zien.
 *
 *   npm run approve -- --production <id>                     # dossier lezen
 *   npm run approve -- --production <id> --reviewer "naam" [--notes "..."]
 *   npm run approve -- --production <id> --mine              # jouw goedkeuring
 *   npm run approve -- --production <id> --reject "reden"
 */
import { JsonFileStore } from './store/json-file.js'
import { Ledger } from './lib/ledger.js'
import type { Production } from './domain/types.js'

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}
const has = (name: string) => process.argv.includes(`--${name}`)

function dossier(p: Production): void {
  const variant = p.variants[0]
  const script = variant?.script

  console.log(`\n${'='.repeat(64)}`)
  console.log(`  ${p.topic}   [${p.state}]`)
  console.log('='.repeat(64))

  if (script) {
    console.log(`\nSTELLING\n  ${script.thesis}`)
    console.log(`\nHOOK\n  ${script.hook}`)
    console.log(`\nBELOFTE\n  ${script.promise}`)
  }

  // De claims met hun bron ernaast. Dit is waar de reviewer voor komt: niet
  // 1.400 woorden zonder verwijzingen, maar per bewering de vindplaats.
  console.log('\nCLAIMS EN BRONNEN')
  for (const claim of p.claims) {
    const sources = claim.sourceIds
      .map((id) => p.sources.find((s) => s.id === id))
      .filter((s): s is NonNullable<typeof s> => s !== undefined)
    console.log(`\n  [${claim.claimClass}] ${claim.text}`)
    for (const s of sources) {
      const grading = s.grading ? ` — ${s.grading}, volgens ${s.gradedBy}` : ''
      const translation = s.translation ? ` [vertaling: ${s.translation}]` : ''
      console.log(`      ${s.kind}: ${s.work}, ${s.locator}${grading}${translation}`)
    }
    if (claim.attributedTo) console.log(`      toegeschreven aan: ${claim.attributedTo}`)
    if (claim.notesScholarlyDifference) console.log('      verschil tussen geleerden wordt benoemd')
  }

  console.log('\nPOORTEN')
  for (const g of p.gateResults) {
    console.log(`  ${g.passed ? 'GEHAALD  ' : 'AFGEWEZEN'} ${g.gate.padEnd(22)} ${g.score}/100`)
  }

  console.log('\nTITELOPTIES')
  for (const v of p.variants) {
    for (const t of v.metadata?.titleOptions ?? []) console.log(`  [${v.language}] ${t}`)
  }

  console.log('\nBESTANDEN')
  for (const v of p.variants) {
    if (v.videoPath) console.log(`  ${v.videoPath}`)
    if (v.srtPath) console.log(`  ${v.srtPath}`)
  }
}

async function main(): Promise<void> {
  const id = arg('production')
  if (!id) {
    console.error('\nGebruik: npm run approve -- --production <id>\n')
    process.exit(1)
  }

  const store = new JsonFileStore(process.env['STORE_PATH'] ?? '.data/producties.json')
  const ledger = new Ledger({ perProductionCents: 1e9, perDayCents: 1e9, perMonthCents: 1e9 })
  const production = await store.get(id)
  if (!production) { console.error(`\nProductie ${id} bestaat niet.\n`); process.exit(1) }

  const reject = arg('reject')
  if (reject) {
    await store.transition(id, 'rejected', reject)
    ledger.audit('production.rejected_by_human', id, { reason: reject })
    console.log(`\nAfgewezen: ${reject}\n`)
    return
  }

  const reviewer = arg('reviewer')
  if (reviewer) {
    if (production.state !== 'awaiting_reviewer') {
      console.error(`\nProductie staat op "${production.state}", niet op "awaiting_reviewer".\n`)
      process.exit(1)
    }
    await store.transition(id, 'awaiting_approval')
    ledger.audit('review.religious', id, { reviewer, notes: arg('notes') ?? '' })
    console.log(`\nReviewer "${reviewer}" heeft getekend.`)
    if (arg('notes')) console.log(`Opmerkingen: ${arg('notes')}`)
    console.log(`\nNu jij:  npm run approve -- --production ${id} --mine\n`)
    return
  }

  if (has('mine')) {
    if (production.state !== 'awaiting_approval') {
      console.error(
        `\nProductie staat op "${production.state}".\n\n` +
        'Eerst de reviewer:\n' +
        `  npm run approve -- --production ${id} --reviewer "naam"\n`,
      )
      process.exit(1)
    }
    await store.transition(id, 'approved')
    ledger.audit('approval.owner', id, {})
    console.log('\nGoedgekeurd.')
    console.log(`\n  npm run upload -- --production ${id}`)
    console.log('  npm run workbook            # deze video mag nu in een werkboek\n')
    return
  }

  dossier(production)
  console.log('\nWat nu:')
  if (production.state === 'awaiting_reviewer') {
    console.log(`  npm run approve -- --production ${id} --reviewer "naam" --notes "..."`)
  } else if (production.state === 'awaiting_approval') {
    console.log(`  npm run approve -- --production ${id} --mine`)
  }
  console.log(`  npm run approve -- --production ${id} --reject "reden"\n`)
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1 })
