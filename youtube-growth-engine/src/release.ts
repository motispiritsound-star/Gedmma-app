/**
 * `npm run release -- --video video-001`
 *
 * Loopt de hele weg naar publicatie af en zegt wat er nog tussen staat, wie
 * het moet doen en hoe lang het duurt. Draai hem opnieuw na elke stap.
 *
 * Dit is bewust géén poort: de poorten in `domain/gates.ts` beoordelen de
 * inhoud. Dit telt op wat er nog ontbreekt, inclusief de dingen die geen
 * software kan afvinken.
 */
import { access, readFile, readdir } from 'node:fs/promises'
import { constants } from 'node:fs'
import { join } from 'node:path'
import { parse } from 'yaml'

type Wie = 'jij' | 'reviewer' | 'systeem'

interface Stap {
  wat: string
  klaar: boolean
  wie: Wie
  /** Wat je moet doen als het niet klaar is. */
  doen?: string
  blokkerend: boolean
  minuten?: number
}

interface Punt {
  nr: number; claim: string; blokkerend: boolean
  status: 'open' | 'rond' | 'vervallen'; bron?: string; opmerking?: string
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

const bestaat = async (p: string) => {
  try { await access(p, constants.R_OK); return true } catch { return false }
}

const gezet = (naam: string) => Boolean(process.env[naam])

async function main(): Promise<void> {
  const video = arg('video') ?? 'video-001'
  const dir = join('content', video)
  if (!(await bestaat(dir))) {
    console.error(`\n${dir} bestaat niet.\n`)
    process.exit(1)
  }

  const stappen: Stap[] = []
  const add = (s: Stap) => stappen.push(s)

  // --- 1. Redactie ---------------------------------------------------------
  for (const [bestand, wat] of [
    ['00-brief.md', 'Brief met stelling en publiek'],
    ['01-script.md', 'Script'],
    ['02-shotlist.md', 'Shotlist'],
    ['03-titels-en-thumbnails.md', 'Titels en thumbnailconcepten'],
    ['video.json', 'Script als data, voor de animatic en de productie'],
  ] as const) {
    add({
      wat, klaar: await bestaat(join(dir, bestand)), wie: 'systeem',
      blokkerend: true, doen: `ontbreekt: ${bestand}`,
    })
  }

  // --- 2. Bronnencheck -----------------------------------------------------
  const checkPad = join(dir, 'bronnencheck.yaml')
  let punten: Punt[] = []
  let reviewer = ''
  if (await bestaat(checkPad)) {
    const data = parse(await readFile(checkPad, 'utf8')) as {
      punten: Punt[]; reviewer?: string
    }
    punten = data.punten ?? []
    reviewer = data.reviewer ?? ''
  }

  const open = punten.filter((p) => p.status === 'open')
  const openBlokkerend = open.filter((p) => p.blokkerend)
  const vervallen = punten.filter((p) => p.status === 'vervallen')

  add({
    wat: `Bronnencheck — ${punten.length - open.length} van ${punten.length} nagekeken`,
    klaar: open.length === 0, wie: 'reviewer', blokkerend: openBlokkerend.length > 0,
    minuten: open.length * 4,
    ...(open.length === 0 ? {} : {
      doen: `nog open: ${open.map((p) => `#${p.nr}`).join(', ')}` +
        (openBlokkerend.length > 0
          ? ` — waarvan blokkerend: ${openBlokkerend.map((p) => `#${p.nr}`).join(', ')}`
          : ''),
    }),
  })

  add({
    wat: 'Reviewer vastgelegd met naam',
    klaar: Boolean(reviewer) || gezet('RELIGIOUS_REVIEWER_NAME'),
    wie: 'jij', blokkerend: true, minuten: 1,
    doen: 'vul `reviewer:` in bronnencheck.yaml, of zet RELIGIOUS_REVIEWER_NAME in .env',
  })

  if (vervallen.length > 0) {
    add({
      wat: `${vervallen.length} claim(s) vervallen — script moet worden aangepast`,
      klaar: false, wie: 'systeem', blokkerend: true, minuten: 20,
      doen: `haal uit het script: ${vervallen.map((p) => `#${p.nr} ${p.claim.slice(0, 40)}…`).join('; ')}`,
    })
  }

  // --- 3. Productiemiddelen ------------------------------------------------
  add({
    wat: 'Koranvertaling gekozen en gelicentieerd',
    klaar: await (async () => {
      try {
        const cfg = await readFile('config/defaults.yaml', 'utf8')
        const m = /quran_translation:\s*"?([^"\n]+)"?/.exec(cfg)?.[1]?.trim()
        return Boolean(m) && !m!.startsWith('NOG')
      } catch { return false }
    })(),
    wie: 'jij', blokkerend: true, minuten: 15,
    doen: 'kies een vertaling waarvan het gebruik aantoonbaar mag, en zet hem in config/defaults.yaml',
  })

  add({
    wat: 'Claude API — onderzoek, script, poorten',
    klaar: gezet('ANTHROPIC_API_KEY'), wie: 'jij', blokkerend: false, minuten: 5,
    doen: 'ANTHROPIC_API_KEY in .env. Zonder dit draait de redactie op het mockmodel',
  })
  add({
    wat: 'Stem — sleutel én gekozen stem',
    klaar: gezet('TTS_API_KEY') && gezet('TTS_VOICE_ID'),
    wie: 'jij', blokkerend: true, minuten: 20,
    doen: gezet('TTS_API_KEY')
      ? 'TTS_VOICE_ID ontbreekt — kies de stem pas ná de stemtest'
      : 'doe de stemtest, kies een aanbieder, zet TTS_API_KEY en TTS_VOICE_ID',
  })
  add({
    wat: 'Beeld',
    klaar: gezet('FAL_KEY') || gezet('GEMINI_API_KEY'),
    wie: 'jij', blokkerend: true, minuten: 5,
    doen: 'FAL_KEY voor stills, GEMINI_API_KEY voor thumbnails met leesbare tekst',
  })

  // --- 4. Kanaal -----------------------------------------------------------
  add({
    wat: 'Google OAuth ingesteld',
    klaar: gezet('GOOGLE_OAUTH_CLIENT_ID') && gezet('GOOGLE_OAUTH_CLIENT_SECRET'),
    wie: 'jij', blokkerend: true, minuten: 20,
    doen: 'Google Cloud Console → OAuth client (Desktop app), YouTube Data + Analytics API aan',
  })
  add({
    wat: 'Kanaal gekoppeld',
    klaar: await bestaat(process.env['YOUTUBE_TOKEN_PATH'] ?? '.tokens/youtube.json'),
    wie: 'jij', blokkerend: true, minuten: 3,
    doen: 'npm run youtube:connect',
  })
  add({
    wat: 'Kanaal geverifieerd (telefoonnummer)',
    klaar: false, wie: 'jij', blokkerend: true, minuten: 5,
    doen: 'zonder verificatie geen eigen thumbnail en geen video langer dan 15 minuten — ' +
      'controleer dit zelf in YouTube Studio; software kan het niet zien',
  })

  // --- 5. Bestanden --------------------------------------------------------
  const out = await (async () => {
    try { return await readdir('out', { recursive: true }) as string[] } catch { return [] }
  })()
  add({
    wat: 'Gerenderde video',
    klaar: out.some((f) => f.endsWith('-16x9.mp4') && !f.includes('animatic')),
    wie: 'systeem', blokkerend: true, minuten: 25,
    doen: `npm run produce -- --topic "de eerste moskee in Medina"`,
  })
  add({
    wat: 'Thumbnails',
    klaar: out.some((f) => f.includes('thumb') && f.endsWith('.png')),
    wie: 'systeem', blokkerend: false,
    doen: 'komt uit dezelfde productieronde',
  })

  // --- Rapport -------------------------------------------------------------
  const mark = (s: Stap) => s.klaar ? ' OK ' : s.blokkerend ? 'STOP' : ' -- '
  const wieKleur: Record<Wie, string> = { jij: 'JIJ', reviewer: 'REVIEWER', systeem: 'SYSTEEM' }

  console.log(`\n${'='.repeat(68)}`)
  console.log(`  WEG NAAR PUBLICATIE — ${video}`)
  console.log('='.repeat(68))

  for (const s of stappen) {
    console.log(`\n  [${mark(s)}] ${s.wat}`)
    if (!s.klaar) {
      console.log(`         ${wieKleur[s.wie]}${s.minuten ? ` · ~${s.minuten} min` : ''}`)
      if (s.doen) console.log(`         ${s.doen}`)
    }
  }

  const openStappen = stappen.filter((s) => !s.klaar)
  const blokkerend = openStappen.filter((s) => s.blokkerend)
  const jouwMinuten = openStappen.filter((s) => s.wie === 'jij')
    .reduce((n, s) => n + (s.minuten ?? 0), 0)
  const reviewerMinuten = openStappen.filter((s) => s.wie === 'reviewer')
    .reduce((n, s) => n + (s.minuten ?? 0), 0)

  console.log(`\n${'─'.repeat(68)}`)
  if (blokkerend.length === 0) {
    console.log('  Niets houdt de publicatie meer tegen.')
    console.log('\n    npm run approve -- --production <id> --reviewer "naam"')
    console.log('    npm run approve -- --production <id> --mine')
    console.log('    npm run upload  -- --production <id>\n')
    return
  }

  console.log(`  ${blokkerend.length} ding(en) houden publicatie tegen.`)
  console.log(`  Jouw werk: ~${jouwMinuten} minuten. Je reviewer: ~${reviewerMinuten} minuten.`)
  console.log('\n  In deze volgorde, want ze blokkeren elkaar:')
  const volgorde: Wie[] = ['reviewer', 'jij', 'systeem']
  let n = 1
  for (const wie of volgorde) {
    for (const s of blokkerend.filter((x) => x.wie === wie)) {
      console.log(`    ${n}. [${wieKleur[wie]}] ${s.wat}`)
      n += 1
    }
  }
  console.log()
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1 })
