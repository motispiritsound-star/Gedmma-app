/**
 * Who is allowed to see the sign-ups.
 *
 * Cloudflare Access sits in front of /beheer and lets nobody through without
 * signing in, so in practice an unauthenticated request never reaches this
 * Worker at all. This checks anyway, for one reason: if Access is *not*
 * configured — never switched on, deleted, the route changed — then without a
 * check of our own the page would simply be public, and the failure would look
 * exactly like success. So the rule is the other way round: no valid Access
 * token, no page. An unconfigured Worker serves nobody rather than everybody.
 *
 * The token is a JWT signed by the team's own key. Verifying it means fetching
 * the team's public keys and checking the signature, the audience, the issuer
 * and the clock -- skipping any one of those turns the check into decoration.
 */

export interface AccessConfig {
  /** e.g. "buurklus" for buurklus.cloudflareaccess.com. */
  teamDomain: string;
  /** The Application Audience tag from the Access application. */
  aud: string;
}

export interface AccessIdentity {
  email: string;
}

export class AccessError extends Error {}

interface Jwk {
  kid: string;
  kty: string;
  alg?: string;
  n: string;
  e: string;
}

const CERTS_TTL_MS = 60 * 60 * 1000;
let cache: { url: string; keys: Jwk[]; fetchedAt: number } | null = null;

function base64UrlToBytes(value: string): Uint8Array {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(padded + '='.repeat((4 - (padded.length % 4)) % 4));
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  return bytes;
}

function decodeSegment(segment: string): unknown {
  return JSON.parse(new TextDecoder().decode(base64UrlToBytes(segment)));
}

function issuerFor(teamDomain: string): string {
  return `https://${teamDomain}.cloudflareaccess.com`;
}

async function publicKeys(config: AccessConfig, fetchImpl: typeof fetch, now: number): Promise<Jwk[]> {
  const url = `${issuerFor(config.teamDomain)}/cdn-cgi/access/certs`;
  if (cache && cache.url === url && now - cache.fetchedAt < CERTS_TTL_MS) return cache.keys;

  const response = await fetchImpl(url);
  if (!response.ok) throw new AccessError(`certs_unavailable_${response.status}`);
  const body = (await response.json()) as { keys?: Jwk[] };
  const keys = body.keys ?? [];
  if (keys.length === 0) throw new AccessError('certs_empty');

  cache = { url, keys, fetchedAt: now };
  return keys;
}

/** Only for tests: the module-level cache would otherwise leak between them. */
export function forgetKeys(): void {
  cache = null;
}

/**
 * Returns who is signed in, or throws. Never returns a partial answer: a
 * caller that forgets to check a boolean should get an exception, not a page.
 */
export async function verifyAccessJwt(
  token: string,
  config: AccessConfig,
  options: { now?: number; fetchImpl?: typeof fetch } = {},
): Promise<AccessIdentity> {
  const now = options.now ?? Date.now();
  const fetchImpl = options.fetchImpl ?? fetch;

  const parts = token.split('.');
  if (parts.length !== 3) throw new AccessError('malformed');
  const [rawHeader, rawPayload, rawSignature] = parts as [string, string, string];

  const header = decodeSegment(rawHeader) as { alg?: string; kid?: string };
  // Only RS256. Accepting the token's own word for the algorithm is how "alg:
  // none" and HMAC-with-the-public-key both work.
  if (header.alg !== 'RS256') throw new AccessError('unexpected_algorithm');
  if (!header.kid) throw new AccessError('missing_kid');

  const keys = await publicKeys(config, fetchImpl, now);
  const jwk = keys.find((key) => key.kid === header.kid);
  if (!jwk) throw new AccessError('unknown_key');

  const key = await crypto.subtle.importKey(
    'jwk',
    { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true },
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  );

  const signed = new TextEncoder().encode(`${rawHeader}.${rawPayload}`);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    base64UrlToBytes(rawSignature),
    signed,
  );
  if (!valid) throw new AccessError('bad_signature');

  const payload = decodeSegment(rawPayload) as {
    aud?: string | string[];
    iss?: string;
    exp?: number;
    nbf?: number;
    email?: string;
  };

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(config.aud)) throw new AccessError('wrong_audience');
  if (payload.iss !== issuerFor(config.teamDomain)) throw new AccessError('wrong_issuer');

  // A minute of slack, because two clocks are never quite the same.
  const skew = 60_000;
  if (typeof payload.exp !== 'number' || payload.exp * 1000 + skew < now) {
    throw new AccessError('expired');
  }
  if (typeof payload.nbf === 'number' && payload.nbf * 1000 - skew > now) {
    throw new AccessError('not_yet_valid');
  }
  if (!payload.email) throw new AccessError('no_identity');

  return { email: payload.email };
}

/** Where Access puts the token: a header on every request, or a cookie. */
export function accessTokenFrom(request: Request): string | null {
  const header = request.headers.get('Cf-Access-Jwt-Assertion');
  if (header) return header;
  const cookie = request.headers.get('Cookie') ?? '';
  const match = /(?:^|;\s*)CF_Authorization=([^;]+)/.exec(cookie);
  return match?.[1] ?? null;
}
