/**
 * `npm run google:env` — zet het gedownloade Google-bestand om in .env-regels.
 *
 * Google geeft je na het aanmaken van een OAuth client een JSON-bestand mee.
 * Daar staan de twee waarden in die dit project nodig heeft, onder namen die
 * niet overeenkomen met de onze. Dit haalt ze eruit en schrijft ze weg, zodat
 * je niets hoeft over te typen — overtypen is precies waar een client secret
 * stukgaat op een weggevallen teken.
 *
 *   npm run google:env                       zoekt zelf in je Downloads-map
 *   npm run google:env -- pad/naar/bestand.json
 *
 * De secret komt nooit in beeld en nooit in de terminalgeschiedenis.
 */
import { readFile, writeFile, readdir, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

interface Credentials { client_id?: string; client_secret?: string }

/** Google schrijft `installed` voor desktop-clients en `web` voor de rest. */
function pluk(json: unknown): Credentials | null {
  if (typeof json !== 'object' || json === null) return null
  const root = json as Record<string, unknown>
  for (const sleutel of ['installed', 'web']) {
    const blok = root[sleutel]
    if (typeof blok === 'object' && blok !== null) {
      const { client_id, client_secret } = blok as Credentials
      if (client_id && client_secret) return { client_id, client_secret }
    }
  }
  // Sommige mensen plakken het binnenste blok los op. Dat mag ook.
  const { client_id, client_secret } = root as Credentials
  if (client_id && client_secret) return { client_id, client_secret }
  return null
}

/**
 * Zoekt het nieuwste bestand dat op een Google-clientbestand lijkt. Google
 * noemt ze `client_secret_<id>.apps.googleusercontent.com.json`, maar browsers
 * plakken er nummers achter bij een tweede download, dus we kijken breed.
 */
async function zoekDownload(): Promise<string | null> {
  const mappen = [
    join(homedir(), 'Downloads'), join(homedir(), 'Downloads', 'Downloads'),
    join(homedir(), 'Bureaublad'), join(homedir(), 'Desktop'), process.cwd(),
  ].filter((m) => existsSync(m))

  const kandidaten: { pad: string; tijd: number }[] = []
  for (const map of mappen) {
    for (const naam of await readdir(map).catch(() => [])) {
      if (!naam.toLowerCase().endsWith('.json')) continue
      if (!/client_secret|googleusercontent/i.test(naam)) continue
      const pad = join(map, naam)
      const info = await stat(pad).catch(() => null)
      if (info?.isFile()) kandidaten.push({ pad, tijd: info.mtimeMs })
    }
  }
  kandidaten.sort((a, b) => b.tijd - a.tijd)
  return kandidaten[0]?.pad ?? null
}

/**
 * Vervangt een regel of voegt hem toe. Alle andere regels, commentaar en
 * volgorde blijven zoals ze waren: je .env is ook jouw bestand.
 */
function zetRegel(inhoud: string, naam: string, waarde: string): string {
  const regel = `${naam}=${waarde}`
  const patroon = new RegExp(`^${naam}=.*$`, 'm')
  if (patroon.test(inhoud)) return inhoud.replace(patroon, regel)
  return `${inhoud.trimEnd()}\n${regel}\n`
}

function masker(waarde: string): string {
  return waarde.length <= 10 ? '*'.repeat(waarde.length)
    : `${waarde.slice(0, 6)}${'*'.repeat(12)}${waarde.slice(-4)}`
}

async function main(): Promise<void> {
  const opgegeven = process.argv[2]
  const pad = opgegeven ?? await zoekDownload()

  if (!pad) {
    console.error(
      '\nGeen Google-bestand gevonden.\n\n' +
      'Ik heb gekeken in je Downloads-map en in deze projectmap, naar een\n' +
      'JSON-bestand met "client_secret" of "googleusercontent" in de naam.\n\n' +
      'Weet je waar het staat, geef het pad dan mee:\n' +
      '  npm run google:env -- /pad/naar/client_secret_....json\n\n' +
      'Kwijt? Google Cloud Console > APIs & Services > Credentials, klik op je\n' +
      'OAuth client, en download hem opnieuw.\n')
    process.exitCode = 1
    return
  }

  if (!existsSync(pad)) {
    console.error(`\nDit bestand bestaat niet: ${pad}\n`)
    process.exitCode = 1
    return
  }

  let json: unknown
  try {
    json = JSON.parse(await readFile(pad, 'utf8'))
  } catch {
    console.error(
      `\n${pad} is geen leesbare JSON.\n\n` +
      'Dit gebeurt als je per ongeluk de pagina hebt opgeslagen in plaats van\n' +
      'het bestand. Download hem opnieuw via Credentials > je client > het\n' +
      'download-icoon rechts.\n')
    process.exitCode = 1
    return
  }

  const cred = pluk(json)
  if (!cred?.client_id || !cred.client_secret) {
    console.error(
      `\nIn ${pad} staan geen client id en secret.\n\n` +
      'Verwacht wordt een bestand met een blok "installed" of "web" erin. Heb\n' +
      'je een API-sleutel gedownload in plaats van een OAuth client? Die is\n' +
      'iets anders. Je hebt Credentials > Create credentials > OAuth client ID\n' +
      'nodig, type Desktop app.\n')
    process.exitCode = 1
    return
  }

  if (!existsSync('.env')) {
    if (!existsSync('.env.example')) {
      console.error('\n.env.example ontbreekt. Sta je wel in de map youtube-growth-engine?\n')
      process.exitCode = 1
      return
    }
    await writeFile('.env', await readFile('.env.example', 'utf8'))
    console.log('\n.env aangemaakt vanaf .env.example.')
  }

  let inhoud = await readFile('.env', 'utf8')
  const had = /^GOOGLE_OAUTH_CLIENT_ID=.+$/m.test(inhoud)
  inhoud = zetRegel(inhoud, 'GOOGLE_OAUTH_CLIENT_ID', cred.client_id)
  inhoud = zetRegel(inhoud, 'GOOGLE_OAUTH_CLIENT_SECRET', cred.client_secret)
  await writeFile('.env', inhoud)

  console.log(`\nGelezen uit: ${pad}`)
  console.log(`${had ? 'Vervangen' : 'Weggeschreven'} in .env:\n`)
  console.log(`  GOOGLE_OAUTH_CLIENT_ID      ${cred.client_id}`)
  console.log(`  GOOGLE_OAUTH_CLIENT_SECRET  ${masker(cred.client_secret)}`)
  console.log('\n.env staat in .gitignore, dus dit komt niet in GitHub terecht.')
  console.log('\nVolgende stap:  npm run youtube:connect\n')
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1 })
