import { beforeEach, describe, expect, it } from 'vitest';
import { accessTokenFrom, forgetKeys, verifyAccessJwt } from './access.js';

/**
 * Signs real tokens with a real key and puts them through the real check.
 * A test that stubs the verification proves only that the stub works.
 */
const config = { teamDomain: 'buurklus', aud: 'aud-tag-123' };
const NOW = Date.parse('2026-09-10T12:00:00.000Z');

const pair = (await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
)) as CryptoKeyPair;
const other = (await crypto.subtle.generateKey(
  { name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' },
  true,
  ['sign', 'verify'],
)) as CryptoKeyPair;

const jwk = await crypto.subtle.exportKey('jwk', pair.publicKey);
const certs = { keys: [{ ...jwk, kid: 'kid-1' }] };

function fetchCerts(): Promise<Response> {
  return Promise.resolve(new Response(JSON.stringify(certs), { status: 200 }));
}

function b64url(bytes: Uint8Array | string): string {
  const binary =
    typeof bytes === 'string' ? bytes : String.fromCharCode(...bytes);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function sign(
  payload: Record<string, unknown>,
  over: { kid?: string; alg?: string; key?: CryptoKey } = {},
): Promise<string> {
  const header = b64url(JSON.stringify({ alg: over.alg ?? 'RS256', kid: over.kid ?? 'kid-1' }));
  const body = b64url(JSON.stringify(payload));
  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    over.key ?? pair.privateKey,
    new TextEncoder().encode(`${header}.${body}`),
  );
  return `${header}.${body}.${b64url(new Uint8Array(signature))}`;
}

const valid = {
  aud: [config.aud],
  iss: 'https://buurklus.cloudflareaccess.com',
  email: 'abekkali@live.nl',
  exp: Math.floor(NOW / 1000) + 3600,
  nbf: Math.floor(NOW / 1000) - 10,
};

const verify = (token: string) =>
  verifyAccessJwt(token, config, { now: NOW, fetchImpl: fetchCerts as unknown as typeof fetch });

describe('the Access token on the way in', () => {
  beforeEach(forgetKeys);

  it('lets a properly signed token through and says who it is', async () => {
    await expect(verify(await sign(valid))).resolves.toEqual({ email: 'abekkali@live.nl' });
  });

  it('refuses a token signed with somebody else’s key', async () => {
    await expect(verify(await sign(valid, { key: other.privateKey }))).rejects.toThrow('bad_signature');
  });

  it('refuses a token that claims it needs no signature', async () => {
    // "alg": "none" is the oldest trick against a JWT check that believes the
    // token about how to check the token.
    const header = b64url(JSON.stringify({ alg: 'none', kid: 'kid-1' }));
    const body = b64url(JSON.stringify(valid));
    await expect(verify(`${header}.${body}.`)).rejects.toThrow('unexpected_algorithm');
  });

  it('refuses an expired token', async () => {
    const expired = { ...valid, exp: Math.floor(NOW / 1000) - 3600 };
    await expect(verify(await sign(expired))).rejects.toThrow('expired');
  });

  it('refuses a token minted for another application', async () => {
    // Every Access application in the account is signed by the same team key.
    // Without this check, a token for any other app would open this one.
    await expect(verify(await sign({ ...valid, aud: ['someone-else'] }))).rejects.toThrow(
      'wrong_audience',
    );
  });

  it('refuses a token from another team', async () => {
    await expect(
      verify(await sign({ ...valid, iss: 'https://attacker.cloudflareaccess.com' })),
    ).rejects.toThrow('wrong_issuer');
  });

  it('refuses a token signed with a key the team does not publish', async () => {
    await expect(verify(await sign(valid, { kid: 'kid-onbekend' }))).rejects.toThrow('unknown_key');
  });

  it('refuses anything that is not a token at all', async () => {
    await expect(verify('nonsense')).rejects.toThrow('malformed');
  });

  it('refuses a valid signature that carries no identity', async () => {
    const anonymous = { ...valid, email: undefined };
    await expect(verify(await sign(anonymous))).rejects.toThrow('no_identity');
  });
});

describe('finding the token on the request', () => {
  it('reads the header Access adds', () => {
    const request = new Request('https://buurklus.nl/beheer', {
      headers: { 'Cf-Access-Jwt-Assertion': 'abc' },
    });
    expect(accessTokenFrom(request)).toBe('abc');
  });

  it('falls back to the cookie a browser carries', () => {
    const request = new Request('https://buurklus.nl/beheer', {
      headers: { Cookie: 'other=1; CF_Authorization=xyz; more=2' },
    });
    expect(accessTokenFrom(request)).toBe('xyz');
  });

  it('finds nothing when there is nothing', () => {
    expect(accessTokenFrom(new Request('https://buurklus.nl/beheer'))).toBeNull();
  });
});
