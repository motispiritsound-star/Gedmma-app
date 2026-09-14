/**
 * `npm run youtube:connect` — koppelt je YouTube-kanaal, eenmalig.
 *
 * Start een klein lokaal servertje, opent de Google-toestemmingspagina, vangt
 * de redirect op en slaat de tokens op. Daarna raak je dit nooit meer aan,
 * tenzij je de toegang intrekt.
 */
import { createServer } from 'node:http'
import { randomBytes } from 'node:crypto'
import { URL } from 'node:url'
import {
  buildAuthUrl, CAPTION_SCOPE, exchangeCode, MINIMAL_SCOPES, missingScopes,
  type OAuthConfig,
} from './providers/youtube/auth.js'
import { FileTokenStore } from './providers/youtube/file-token-store.js'

function required(name: string): string {
  const value = process.env[name]
  if (!value) {
    console.error(
      `\n${name} ontbreekt.\n\n` +
      'Ga naar Google Cloud Console > APIs & Services > Credentials, maak een\n' +
      'OAuth client ID van het type "Desktop app", en zet client id en secret in .env.\n' +
      'Zet in dezelfde console YouTube Data API v3 en YouTube Analytics API aan.\n',
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

  console.log('\nOpen deze link in je browser en geef toestemming:\n')
  console.log(buildAuthUrl(config, state))
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

      if (error) { finish(`Google gaf terug: ${error}`, false); return }
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
