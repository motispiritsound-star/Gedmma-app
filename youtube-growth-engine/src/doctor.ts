/**
 * `npm run doctor` — vertelt precies wat er nog ontbreekt en wat je ervoor
 * moet doen. Bedoeld om open te laten staan tijdens de installatie: draai hem
 * opnieuw na elke stap tot alles groen is.
 */
import { access, readFile } from 'node:fs/promises'
import { constants } from 'node:fs'
import { execFile as rawExecFile } from 'node:child_process'
import { promisify } from 'node:util'

const run = promisify(rawExecFile)

type Status = 'ok' | 'ontbreekt' | 'optioneel'

interface Check {
  label: string
  status: Status
  detail: string
  /** Wat de gebruiker moet doen. Leeg wanneer er niets te doen is. */
  action?: string
}

async function binary(name: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout, stderr } = await run(name, args)
    return (stdout || stderr).split('\n')[0]
  } catch { return undefined }
}

async function fileExists(path: string): Promise<boolean> {
  try { await access(path, constants.R_OK); return true } catch { return false }
}

function envCheck(
  name: string, label: string, action: string, optional = false,
): Check {
  const value = process.env[name]
  if (value && value.length > 0) {
    return { label, status: 'ok', detail: `${name} is gezet (${value.length} tekens)` }
  }
  return {
    label, status: optional ? 'optioneel' : 'ontbreekt',
    detail: `${name} is niet gezet`, action,
  }
}

async function main(): Promise<void> {
  const checks: Check[] = []

  // --- Wat er op de machine moet staan ------------------------------------
  const node = process.versions.node
  checks.push({
    label: 'Node 20 of hoger',
    status: Number(node.split('.')[0]) >= 20 ? 'ok' : 'ontbreekt',
    detail: `Node ${node}`,
    ...(Number(node.split('.')[0]) >= 20 ? {} : { action: 'Installeer Node 20+ via nodejs.org' }),
  })

  const ffmpeg = await binary('ffmpeg', ['-version'])
  checks.push({
    label: 'FFmpeg (montage, ondertiteling, technische controle)',
    status: ffmpeg ? 'ok' : 'ontbreekt',
    detail: ffmpeg ?? 'niet gevonden',
    ...(ffmpeg ? {} : {
      action: 'macOS: brew install ffmpeg — Ubuntu: sudo apt install ffmpeg — ' +
        'Windows: winget install Gyan.FFmpeg',
    }),
  })

  const chrome = await Promise.all([
    process.env['CHROME_PATH'],
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/usr/bin/chromium', '/usr/bin/google-chrome',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter((p): p is string => !!p).map(async (p) => (await fileExists(p)) ? p : undefined))
    .then((r) => r.find(Boolean))
  checks.push({
    label: 'Chrome of Chromium (werkboek naar PDF)',
    status: chrome ? 'ok' : 'optioneel',
    detail: chrome ?? 'niet gevonden — het werkboek blijft dan HTML, dat is ook drukklaar',
    ...(chrome ? {} : { action: 'Optioneel: installeer Chrome, of zet CHROME_PATH' }),
  })

  // --- Wat jij moet aanleveren --------------------------------------------
  checks.push(envCheck(
    'ANTHROPIC_API_KEY', 'Claude API (onderzoek, script, poorten)',
    'Maak een sleutel op console.anthropic.com en zet hem in .env',
  ))
  checks.push(envCheck(
    'GOOGLE_OAUTH_CLIENT_ID', 'Google OAuth client id (uploaden)',
    'Google Cloud Console > APIs & Services > Credentials > OAuth client ID ' +
    '(type: Desktop app). Zet YouTube Data API v3 en YouTube Analytics API aan.',
  ))
  checks.push(envCheck(
    'GOOGLE_OAUTH_CLIENT_SECRET', 'Google OAuth client secret',
    'Staat naast het client id in dezelfde schermen.',
  ))
  checks.push(envCheck(
    'TTS_API_KEY', 'Spraak (voice-over)',
    'Kies een aanbieder met commerciele licentie en zet de sleutel in .env. ' +
    'Doe eerst de stemtest uit stap 5 van de handleiding.',
  ))
  checks.push(envCheck(
    'IMAGE_API_KEY', 'Beeldgeneratie',
    'Kies een aanbieder waarvan de voorwaarden commercieel gebruik toestaan.',
  ))
  checks.push(envCheck(
    'MUSIC_API_KEY', 'Muziek', 'Optioneel tot je nasheeds of achtergrond wilt.', true,
  ))

  // --- Koppelingen ---------------------------------------------------------
  const tokenPath = process.env['YOUTUBE_TOKEN_PATH'] ?? '.tokens/youtube.json'
  const connected = await fileExists(tokenPath)
  checks.push({
    label: 'YouTube-kanaal gekoppeld',
    status: connected ? 'ok' : 'ontbreekt',
    detail: connected ? `koppeling gevonden in ${tokenPath}` : 'nog niet gekoppeld',
    ...(connected ? {} : { action: 'Draai: npm run youtube:connect' }),
  })

  // --- Menselijke stappen die geen software kan overnemen ------------------
  const reviewer = process.env['RELIGIOUS_REVIEWER_NAME']
  checks.push({
    label: 'Religieuze reviewer vastgelegd',
    status: reviewer ? 'ok' : 'ontbreekt',
    detail: reviewer ?? 'geen naam ingevuld',
    ...(reviewer ? {} : {
      action: 'Zet RELIGIOUS_REVIEWER_NAME in .env. Dit is geen formaliteit: ' +
        'zonder reviewer produceert het systeem materiaal dat niemand kan vrijgeven.',
    }),
  })

  let translation = ''
  try {
    const cfg = await readFile('config/defaults.yaml', 'utf8')
    translation = /quran_translation:\s*"?([^"\n]+)"?/.exec(cfg)?.[1]?.trim() ?? ''
  } catch { /* config nog niet aangepast */ }
  checks.push({
    label: 'Koranvertaling gekozen en gelicentieerd',
    status: translation && !translation.startsWith('NOG') ? 'ok' : 'ontbreekt',
    detail: translation || 'nog niet gekozen',
    ...(translation && !translation.startsWith('NOG') ? {} : {
      action: 'Kies een vertaling waarvan het gebruik aantoonbaar is toegestaan en ' +
        'zet hem bij `quran_translation` in config/defaults.yaml. De meeste ' +
        'Nederlandse vertalingen zijn auteursrechtelijk beschermd.',
    }),
  })

  // --- Rapport -------------------------------------------------------------
  const mark = { ok: '  OK      ', ontbreekt: '  ONTBREEKT', optioneel: '  OPTIONEEL' }
  console.log('\n=========== YOUTUBE GROWTH ENGINE — CONTROLE ===========\n')
  for (const c of checks) {
    console.log(`${mark[c.status]}  ${c.label}`)
    console.log(`              ${c.detail}`)
    if (c.action) console.log(`              -> ${c.action}`)
  }

  const blocking = checks.filter((c) => c.status === 'ontbreekt')
  console.log(`\n${'-'.repeat(56)}`)
  if (blocking.length === 0) {
    console.log('Alles staat klaar. Volgende stap: npm run produce')
  } else {
    console.log(`Nog ${blocking.length} ding(en) te doen voordat je een echte video kunt maken:`)
    for (const c of blocking) console.log(`  - ${c.label}`)
    console.log('\nZolang deze openstaan werkt `npm run demo` wel: die draait volledig')
    console.log('op mockproviders en kost niets.')
  }
  console.log()
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
