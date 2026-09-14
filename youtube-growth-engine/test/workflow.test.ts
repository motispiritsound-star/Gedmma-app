import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { splitOnSentences } from '../src/providers/elevenlabs/tts.js'
import { canTransition } from '../src/domain/states.js'
import { JsonFileStore } from '../src/store/json-file.js'
import type { Production } from '../src/domain/types.js'

describe('spraak in stukken knippen', () => {
  it('knipt op zinsgrenzen en niet midden in een zin', () => {
    const text = 'Eerste zin. Tweede zin! Derde zin? Vierde zin.'
    const chunks = splitOnSentences(text, 25)
    expect(chunks.length).toBeGreaterThan(1)
    for (const chunk of chunks) expect(chunk).toMatch(/[.!?]$/)
    expect(chunks.join(' ').replace(/\s+/g, ' ')).toBe(text)
  })

  it('laat korte tekst met rust', () => {
    expect(splitOnSentences('Eén zin maar.', 5000)).toEqual(['Eén zin maar.'])
  })

  it('breekt een zin zonder leesteken niet stuk', () => {
    const long = 'woord '.repeat(50).trim()
    expect(splitOnSentences(long, 20)).toEqual([long])
  })
})

describe('de twee goedkeuringen, in volgorde', () => {
  it('kan niet naar goedgekeurd zonder eerst langs de reviewer', () => {
    expect(canTransition('awaiting_reviewer', 'approved')).toBe(false)
    expect(canTransition('awaiting_reviewer', 'awaiting_approval')).toBe(true)
    expect(canTransition('awaiting_approval', 'approved')).toBe(true)
  })

  it('kan niet uploaden zonder goedkeuring', () => {
    expect(canTransition('awaiting_approval', 'uploaded_private')).toBe(false)
    expect(canTransition('approved', 'uploaded_private')).toBe(true)
  })

  it('kan op elk moment worden afgewezen', () => {
    expect(canTransition('awaiting_reviewer', 'rejected')).toBe(true)
    expect(canTransition('awaiting_approval', 'rejected')).toBe(true)
  })
})

describe('opslag tussen commando\'s', () => {
  const production = (id: string, state: Production['state']): Production => ({
    id, state, createdAt: 'now', topic: 't', seedTitles: [],
    claims: [], sources: [], shots: [], assetIds: [], variants: [], gateResults: [],
  })

  it('bewaart een productie zodat een tweede commando hem terugvindt', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'yge-'))
    const path = join(dir, 'p.json')

    const schrijver = new JsonFileStore(path)
    await schrijver.save(production('abc', 'awaiting_reviewer'))

    // Een nieuw proces, een nieuwe store, hetzelfde bestand.
    const lezer = new JsonFileStore(path)
    expect((await lezer.get('abc'))?.state).toBe('awaiting_reviewer')

    await lezer.transition('abc', 'awaiting_approval')
    const derde = new JsonFileStore(path)
    expect((await derde.get('abc'))?.state).toBe('awaiting_approval')
  })

  it('weigert een overgang die de volgorde overslaat', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'yge-'))
    const store = new JsonFileStore(join(dir, 'p.json'))
    await store.save(production('abc', 'awaiting_reviewer'))
    await expect(store.transition('abc', 'approved')).rejects.toThrow(/niet toegestaan/)
  })

  it('houdt de reden vast bij een afwijzing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'yge-'))
    const store = new JsonFileStore(join(dir, 'p.json'))
    await store.save(production('abc', 'awaiting_approval'))
    await store.transition('abc', 'rejected', 'toon klopt niet')
    expect((await store.get('abc'))?.rejectedReason).toBe('toon klopt niet')
  })
})
