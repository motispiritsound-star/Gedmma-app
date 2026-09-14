import { describe, expect, it } from 'vitest'
import { assertTransition, canTransition, hasExpensiveWorkStarted, IllegalTransitionError } from '../src/domain/states.js'
import { BudgetExceededError, Ledger } from '../src/lib/ledger.js'
import { MemoryStore } from '../src/store/memory.js'
import { buildSrt } from '../src/lib/srt.js'
import { stepHash } from '../src/pipeline/run.js'
import type { Asset } from '../src/domain/types.js'

describe('state machine', () => {
  it('staat de normale weg toe', () => {
    expect(canTransition('draft', 'angle_set')).toBe(true)
    expect(canTransition('scripted', 'religion_checked')).toBe(true)
  })

  it('staat afwijzen toe vanaf elke werkende toestand', () => {
    expect(canTransition('researched', 'rejected')).toBe(true)
  })

  it('weigert overslaan van poorten', () => {
    expect(() => assertTransition('draft', 'approved')).toThrow(IllegalTransitionError)
    expect(() => assertTransition('scripted', 'published')).toThrow(IllegalTransitionError)
  })

  it('weigert publiceren zonder goedkeuring', () => {
    expect(canTransition('trust_checked', 'published')).toBe(false)
    expect(canTransition('awaiting_approval', 'uploaded_private')).toBe(false)
  })

  it('weet vanaf waar afwijzen geld kost', () => {
    expect(hasExpensiveWorkStarted('scripted')).toBe(false)
    expect(hasExpensiveWorkStarted('voiced')).toBe(true)
  })
})

describe('kostenregistratie', () => {
  const caps = { perProductionCents: 100, perDayCents: 500, perMonthCents: 1000 }
  const entry = (productionId: string, costCents: number) => ({
    productionId, step: 's', provider: 'p', costCents, latencyMs: 1, providerRef: 'r',
  })

  it('telt per productie en per stap', () => {
    const l = new Ledger(caps)
    l.record(entry('a', 30))
    l.record(entry('a', 20))
    l.record(entry('b', 10))
    expect(l.spentOn('a')).toBe(50)
    expect(l.totalCents()).toBe(60)
  })

  it('pauzeert bij het plafond per productie', () => {
    const l = new Ledger(caps)
    l.record(entry('a', 90))
    expect(() => l.record(entry('a', 20))).toThrow(BudgetExceededError)
  })

  it('pauzeert bij het maandplafond', () => {
    const l = new Ledger({ ...caps, perProductionCents: 10_000, perDayCents: 10_000 })
    l.record(entry('a', 900))
    expect(() => l.record(entry('b', 200))).toThrow(BudgetExceededError)
  })

  it('rekent break-even views uit inclusief het deel van de vaste kosten', () => {
    const l = new Ledger({ perProductionCents: 5000, perDayCents: 5000, perMonthCents: 50_000 })
    l.record(entry('a', 1000)) // EUR 10 variabel
    // (10 + 45/5) / 4,50 * 1000 = 4222,2 -> naar boven afgerond 4223
    expect(l.breakEvenViews('a', { rpmEur: 4.5, monthlyFixedEur: 45, videosThisMonth: 5 }))
      .toBe(4223)
  })
})

describe('opslag', () => {
  const asset = (over: Partial<Asset> = {}): Asset => ({
    id: 'a1', kind: 'image', uri: '/x.png', sha256: 'h', origin: 'generated',
    provider: 'p', licenseProofId: 'lic', ...over,
  })

  it('weigert een asset zonder licentiebewijs', async () => {
    const s = new MemoryStore()
    await expect(s.putAsset(asset({ licenseProofId: '' }))).rejects.toThrow(/licentiebewijs/)
  })

  it('weigert een asset die naar een onbekend licentiebewijs wijst', async () => {
    const s = new MemoryStore()
    await expect(s.putAsset(asset())).rejects.toThrow(/onbekend licentiebewijs/)
  })

  it('accepteert een asset met een geregistreerd licentiebewijs', async () => {
    const s = new MemoryStore()
    await s.putLicense({ id: 'lic', holder: 'h', terms: 't', commercialUse: true, evidenceUri: 'u' })
    await expect(s.putAsset(asset())).resolves.toBeUndefined()
  })

  it('voorkomt een dubbele upload met dezelfde sleutel', async () => {
    const s = new MemoryStore()
    const first = await s.claimUpload('k', 'video-1')
    const second = await s.claimUpload('k', 'video-2')
    expect(first).toEqual({ videoId: 'video-1', created: true })
    expect(second).toEqual({ videoId: 'video-1', created: false })
  })
})

describe('idempotentie', () => {
  it('levert dezelfde sleutel bij dezelfde invoer', () => {
    expect(stepHash('p', 'script', { a: 1 })).toBe(stepHash('p', 'script', { a: 1 }))
  })

  it('levert een andere sleutel bij andere invoer', () => {
    expect(stepHash('p', 'script', { a: 1 })).not.toBe(stepHash('p', 'script', { a: 2 }))
  })
})

describe('ondertiteling', () => {
  it('knipt op zinseinden en houdt de tijdcodes oplopend', () => {
    const text = 'Eerste zin. Tweede zin.'
    const timings = [...text].map((char, i) => ({ char, atMs: i * 100 }))
    const srt = buildSrt(timings, text.length * 100)
    expect(srt).toMatch(/^1\n00:00:00,000 --> /)
    expect(srt).toContain('Eerste zin.')
    expect(srt).toContain('Tweede zin.')
    expect(srt.split('\n\n').filter(Boolean).length).toBe(2)
  })
})
