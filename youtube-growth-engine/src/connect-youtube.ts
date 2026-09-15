/**
 * `npm run youtube:connect` — koppelt je YouTube-kanaal, eenmalig.
 *
 * Start een klein lokaal servertje, opent de Google-toestemmingspagina, vangt
 * de redirect op en slaat de tokens op. Daarna raak je dit nooit meer aan,
 * tenzij je de toegang intrekt.
 */
import { createServer } from 'node:http'
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { URL } from 'node:url'
import {
  buildAuthUrl, CAPTION_SCOPE, exchangeCode, MINIMAL_SCOPES, missingScopes,
  type OAuthConfig,
} from './providers/youtube/auth.js'
import { FileTokenStore } from './providers/youtube/file-token-store.js'

/**
 * Opent de toestemmingspagina zelf. De link staat er ook nog, want dit kan
 * mislukken zonder dat we het merken: in een SSH-sessie, een container, of een
 * afgeschermde werkplek is er geen browser om te openen.
 *
 * De reden dat dit erin zit, is dat de link te lang is om over te typen en in
 * een terminalvenster over meerdere regels breekt. Zelf kopiëren gaat daardoor
 * net zo vaak mis als goed, en een half geplakte link geeft een foutmelding
 * die nergens op slaat.
 */
function openBrowser(url: string): void {
  const [commando, args] = process.platform === 'win32'
    // cmd /c start: het eerste argument van start is de venstertitel, dus die
    // lege string hoort erbij. En & in een URL splitst het commando, tenzij je
    // hem afschermt.
    ? ['cmd', ['/c', 'start', '', url.replace(/&/g, '^&')]]
    : process.platform === 'darwin'
      ? ['open', [url]]
      : ['xdg-open', [url]]

  try {
    const kind = spawn(commando as string, args as string[], {
      stdio: 'ignore', detached: true, windowsVerbatimArguments: process.platform === 'win32',
    })
    kind.on('error', () => { /* geen browser; de link staat er nog */ })
    kind.unref()
  } catch { /* zelfde */ }
}

/**
 * Google's foutcodes zeggen niets. Ze gaan vrijwel altijd over één van drie
 * dingen, en dit vertaalt ze naar wat je moet doen.
 */
function uitleg(error: string): string {
  if (error === 'access_denied') {
    return 'Google blokkeerde de toegang. Bijna altijd één van twee dingen:\n\n' +
      '  1. Je staat niet als testgebruiker bij het OAuth-toestemmingsscherm.\n' +
      '     Google Cloud Console > APIs & Services > OAuth consent screen >\n' +
      '     Audience > Test users > Add users > je eigen Google-adres.\n\n' +
      '  2. Je koos bij het toestemmingsscherm "Internal" terwijl je geen\n' +
      '     Workspace-organisatie hebt. Zet hem op "External".\n\n' +
      'Beide kosten een minuut. Daarna dit commando opnieuw.'
  }
  if (error === 'admin_policy_enforced') {
    return 'De beheerder van je Google Workspace blokkeert deze app. Gebruik een\n' +
      'gewoon Gmail-account in plaats van een zakelijk account, of vraag je\n' +
      'beheerder om de YouTube Data API vrij te geven.'
  }
  if (error === 'invalid_scope') {
    return 'Een van de gevraagde rechten bestaat niet of staat niet aan.\n' +
      'Controleer of YouTube Data API v3 én YouTube Analytics API aanstaan\n' +
      'onder APIs & Services > Library.'
  }
  return `Google gaf terug: ${error}`
}

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(
      `\n${name} ontbreekt. De hele route, in volgorde:\n\n` +
      '  1. console.cloud.google.com — maak een project\n' +
      '  2. APIs & Services > Library — zet AAN:\n' +
      '       - YouTube Data API v3\n' +
      '       - YouTube Analytics API\n' +
      '  3. APIs & Services > OAuth consent screen\n' +
      '       - User type: External\n' +
      '       - App name en support e-mail invullen\n' +
      '       - Audience > Test users > voeg JEZELF toe\n' +
      '         (zonder deze stap blokkeert Google je straks met access_denied)\n' +
      '  4. APIs & Services > Credentials > Create credentials\n' +
      '       > OAuth client ID > type: Desktop app\n' +
      '  5. Zet client id en secret in .env\n' +
      '  6. Dit commando opnieuw\n',
    )
    process.exit(1)
  }
  return value
}

async function main(): Promise<void> {
  const port = Number(process.env['OAUTH_PORT'] ?? 4400)
  const redirectUri = process.env['GOOGLE_OAUTH_REDIRECT_URI']
    ?? `http://localhost:${port}/oauth/callback`

  // Ondertiteling via de API vraagt een bredere scope die ook schrijfrechten op
  // reacties geeft. Standaard uit; zet YOUTUBE_API_CAPTIONS=true als je hem wilt.
  const wantsCaptions = process.env['YOUTUBE_API_CAPTIONS'] === 'true'
  const scopes = wantsCaptions ? [...MINIMAL_SCOPES, CAPTION_SCOPE] : [...MINIMAL_SCOPES]

  const config: OAuthConfig = {
    clientId: required('GOOGLE_OAUTH_CLIENT_ID'),
    clientSecret: required('GOOGLE_OAUTH_CLIENT_SECRET'),
    redirectUri,
    scopes,
  }

  const state = randomBytes(16).toString('hex')
  const store = new FileTokenStore(process.env['YOUTUBE_TOKEN_PATH'] ?? '.tokens/youtube.json')

  const authUrl = buildAuthUrl(config, state)
  openBrowser(authUrl)

  console.log('\nJe browser zou nu open moeten gaan met de toestemmingspagina.')
  console.log('Gebeurt er niets? Open deze link dan zelf:\n')
  console.log(authUrl)
  console.log('\nScopes die je geeft:')
  for (const s of scopes) console.log(`  - ${s}`)
  if (!wantsCaptions) {
    console.log('\n  (Ondertiteling via de API staat uit: dat vraagt een scope die ook')
    console.log('   schrijfrechten op reacties geeft. Het SRT-bestand upload je met de hand,')
    console.log('   dat kost twintig seconden. Wil je het toch: YOUTUBE_API_CAPTIONS=true)')
  }
  console.log('\nIk wacht hier tot je klaar bent...\n')

  await new Promise<void>((resolve) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', `http://localhost:${port}`)
      if (url.pathname !== new URL(redirectUri).pathname) {
        res.writeHead(404).end('niet gevonden')
        return
      }
      const code = url.searchParams.get('code')
      const returnedState = url.searchParams.get('state')
      const error = url.searchParams.get('error')

      const finish = (message: string, ok: boolean) => {
        res.writeHead(ok ? 200 : 400, { 'content-type': 'text/html; charset=utf-8' })
        res.end(`<!doctype html><meta charset="utf-8"><body style="font:16px/1.6 system-ui;padding:3rem;max-width:34rem">
          <h1 style="font-size:1.3rem">${ok ? 'Gelukt' : 'Niet gelukt'}</h1>
          <p>${message}</p></body>`)
        server.close(() => resolve())
      }

      if (error) {
        finish(uitleg(error), false)
        console.error(`\n${uitleg(error)}\n`)
        return
      }
      if (returnedState !== state) { finish('De state kwam niet overeen. Probeer opnieuw.', false); return }
      if (!code) { finish('Geen code ontvangen.', false); return }

      exchangeCode(config, code, store)
        .then((tokens) => {
          const missing = missingScopes(tokens.scopes, scopes)
          if (missing.length > 0) {
            finish(`Deze rechten ontbreken nog: ${missing.join(', ')}`, false)
            console.error(`\nOntbrekende scopes: ${missing.join(', ')}`)
            return
          }
          finish('Je kanaal is gekoppeld. Je kunt dit tabblad sluiten.', true)
          console.log('Gekoppeld. Tokens opgeslagen met rechten 600.')
          console.log('Controleer met: npm run doctor\n')
        })
        .catch((e: unknown) => {
          finish(String(e), false)
          console.error(e)
        })
    })
    server.listen(port)
  })
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
