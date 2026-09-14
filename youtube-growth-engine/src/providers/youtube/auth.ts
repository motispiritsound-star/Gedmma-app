/**
 * OAuth 2.0 tegen Google, met de kleinst mogelijke set scopes.
 *
 * `youtube.upload` en `yt-analytics.readonly`, meer niet. Daarmee bestaat er
 * geen codepad om views, likes, reacties of abonnees te beinvloeden — dat is
 * geen belofte maar een gevolg van wat het token mag.
 *
 * LET OP: `captions.insert` valt buiten `youtube.upload` en vraagt een bredere
 * scope (`youtube.force-ssl`), die ook schrijfrechten op reacties geeft. Die
 * scope staat daarom standaard uit; zie `CAPTION_SCOPE` en docs/HANDLEIDING.md.
 * [status: te verifieren tegen de officiele documentatie — deze sessie kon
 * developers.google.com niet bereiken]
 */

export const MINIMAL_SCOPES = [
  'https://www.googleapis.com/auth/youtube.upload',
  'https://www.googleapis.com/auth/yt-analytics.readonly',
] as const

/** Alleen toevoegen als je ondertiteling via de API wilt uploaden. */
export const CAPTION_SCOPE = 'https://www.googleapis.com/auth/youtube.force-ssl'

const AUTH_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'

export interface StoredTokens {
  accessToken: string
  refreshToken: string
  /** Epoch-milliseconden. */
  expiresAt: number
  scopes: string[]
}

/** Tokens staan nooit in de gewone database en nooit in logs. */
export interface TokenStore {
  read(): Promise<StoredTokens | undefined>
  write(tokens: StoredTokens): Promise<void>
  clear(): Promise<void>
}

export interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  /** Voeg CAPTION_SCOPE toe als je ondertiteling via de API wilt uploaden. */
  scopes?: string[]
}

export class OAuthRevokedError extends Error {
  constructor(detail: string) {
    super(
      `De YouTube-koppeling is niet meer geldig (${detail}). Koppel opnieuw met ` +
      `\`npm run youtube:connect\`. De pipeline publiceert tot dat moment niets.`,
    )
    this.name = 'OAuthRevokedError'
  }
}

export function buildAuthUrl(config: OAuthConfig, state: string): string {
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: 'code',
    scope: (config.scopes ?? [...MINIMAL_SCOPES]).join(' '),
    // `offline` levert de refresh token; `consent` zorgt dat hij ook bij een
    // tweede koppeling wordt afgegeven in plaats van weggelaten.
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'false',
    state,
  })
  return `${AUTH_ENDPOINT}?${params.toString()}`
}

interface TokenResponse {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope: string
  token_type: string
}

async function postForm(body: Record<string, string>): Promise<TokenResponse> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(body).toString(),
  })
  const text = await response.text()
  if (!response.ok) {
    // invalid_grant betekent vrijwel altijd: ingetrokken of verlopen.
    if (text.includes('invalid_grant')) throw new OAuthRevokedError('invalid_grant')
    throw new Error(`Tokenaanvraag mislukt (${response.status}): ${text}`)
  }
  return JSON.parse(text) as TokenResponse
}

export async function exchangeCode(
  config: OAuthConfig, code: string, store: TokenStore,
): Promise<StoredTokens> {
  const data = await postForm({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    redirect_uri: config.redirectUri,
    grant_type: 'authorization_code',
    code,
  })
  if (!data.refresh_token) {
    throw new Error(
      'Google gaf geen refresh token terug. Dat gebeurt wanneer de koppeling al ' +
      'bestond: trek hem in op https://myaccount.google.com/permissions en koppel opnieuw.',
    )
  }
  const tokens: StoredTokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    scopes: data.scope.split(' '),
  }
  await store.write(tokens)
  return tokens
}

/** Vernieuwt een minuut voor het verloopt, zodat een lange upload niet afbreekt. */
export async function getAccessToken(
  config: OAuthConfig, store: TokenStore,
): Promise<string> {
  const current = await store.read()
  if (!current) {
    throw new OAuthRevokedError('geen opgeslagen koppeling')
  }
  if (current.expiresAt - Date.now() > 60_000) return current.accessToken

  const data = await postForm({
    client_id: config.clientId,
    client_secret: config.clientSecret,
    grant_type: 'refresh_token',
    refresh_token: current.refreshToken,
  })
  const refreshed: StoredTokens = {
    ...current,
    accessToken: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
    ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
  }
  await store.write(refreshed)
  return refreshed.accessToken
}

export function missingScopes(granted: string[], required: readonly string[]): string[] {
  return required.filter((s) => !granted.includes(s))
}
