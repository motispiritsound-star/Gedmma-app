import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildAuthUrl, CAPTION_SCOPE, MINIMAL_SCOPES, missingScopes,
} from '../src/providers/youtube/auth.js'
import { FileTokenStore } from '../src/providers/youtube/file-token-store.js'
import { idempotencyKey } from '../src/providers/youtube/upload.js'

const config = {
  clientId: 'client-123',
  clientSecret: 'secret',
  redirectUri: 'http://localhost:4400/oauth/callback',
}

describe('OAuth-scopes', () => {
  it('vraagt standaard alleen uploaden en analytics lezen', () => {
    expect([...MINIMAL_SCOPES]).toEqual([
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/yt-analytics.readonly',
    ])
    // Geen scope met schrijfrechten op reacties: automatische engagement is
    // daarmee technisch onmogelijk, niet alleen verboden.
    expect([...MINIMAL_SCOPES]).not.toContain(CAPTION_SCOPE)
  })

  it('vraagt offline toegang en dwingt een toestemmingsscherm af', () => {
    const url = new URL(buildAuthUrl(config, 'state-abc'))
    expect(url.searchParams.get('access_type')).toBe('offline')
    expect(url.searchParams.get('prompt')).toBe('consent')
    expect(url.searchParams.get('state')).toBe('state-abc')
    expect(url.searchParams.get('scope')).toBe(MINIMAL_SCOPES.join(' '))
  })

  it('meldt welke rechten Google niet heeft gegeven', () => {
    expect(missingScopes([MINIMAL_SCOPES[0]], MINIMAL_SCOPES))
      .toEqual([MINIMAL_SCOPES[1]])
    expect(missingScopes([...MINIMAL_SCOPES], MINIMAL_SCOPES)).toEqual([])
  })
})

describe('tokenopslag', () => {
  it('schrijft en leest terug, en geeft undefined als er niets staat', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'yge-'))
    const store = new FileTokenStore(join(dir, 'youtube.json'))
    expect(await store.read()).toBeUndefined()

    const tokens = {
      accessToken: 'a', refreshToken: 'r', expiresAt: 1,
      scopes: [...MINIMAL_SCOPES],
    }
    await store.write(tokens)
    expect(await store.read()).toEqual(tokens)

    await store.clear()
    expect(await store.read()).toBeUndefined()
  })
})

describe('idempotency-sleutel', () => {
  const base = {
    productionId: 'p1', language: 'nl', title: 't', description: 'd', tags: [],
    categoryId: '27', privacyStatus: 'private' as const,
    containsSyntheticMedia: false, madeForKids: false,
  }

  it('is gelijk voor dezelfde inhoud en verschilt bij andere inhoud', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'yge-'))
    const a = join(dir, 'a.mp4')
    const b = join(dir, 'b.mp4')
    await writeFile(a, 'dezelfde bytes')
    await writeFile(b, 'andere bytes')

    const keyA = await idempotencyKey({ ...base, videoPath: a })
    const keyA2 = await idempotencyKey({ ...base, videoPath: a })
    const keyB = await idempotencyKey({ ...base, videoPath: b })

    expect(keyA).toBe(keyA2)
    expect(keyA).not.toBe(keyB)
  })

  it('scheidt taalvarianten van dezelfde productie', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'yge-'))
    const path = join(dir, 'v.mp4')
    await writeFile(path, 'bytes')
    const nl = await idempotencyKey({ ...base, videoPath: path, language: 'nl' })
    const de = await idempotencyKey({ ...base, videoPath: path, language: 'de' })
    expect(nl).not.toBe(de)
  })
})
