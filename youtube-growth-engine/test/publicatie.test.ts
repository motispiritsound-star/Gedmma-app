import { describe, expect, it } from 'vitest'
import {
  besluit, leesStand, leesUren, MINIMUM_UITSTEL_UREN, STANDAARD_UITSTEL_UREN,
} from '../src/domain/publicatie.js'

const nu = new Date('2026-09-15T12:00:00.000Z')

describe('leesStand', () => {
  it('kent de drie standen', () => {
    expect(leesStand('uitgesteld')).toBe('uitgesteld')
    expect(leesStand('direct')).toBe('direct')
    expect(leesStand('handmatig')).toBe('handmatig')
  })

  it('valt terug op handmatig bij onzin, leeg of niets', () => {
    for (const w of ['', '  ', 'ja', 'auto', undefined]) {
      expect(leesStand(w)).toBe('handmatig')
    }
  })

  it('trekt zich niets aan van hoofdletters en spaties', () => {
    expect(leesStand('  Uitgesteld ')).toBe('uitgesteld')
  })
})

describe('leesUren', () => {
  it('neemt de standaard bij onleesbare waarden', () => {
    expect(leesUren('later')).toBe(STANDAARD_UITSTEL_UREN)
    expect(leesUren(undefined)).toBe(STANDAARD_UITSTEL_UREN)
  })

  it('houdt een bodem aan, zodat nul uur geen stil direct-publiceren wordt', () => {
    expect(leesUren('0')).toBe(MINIMUM_UITSTEL_UREN)
    expect(leesUren('-5')).toBe(MINIMUM_UITSTEL_UREN)
  })

  it('accepteert een echte waarde', () => {
    expect(leesUren('48')).toBe(48)
  })
})

describe('besluit', () => {
  it('houdt handmatig privé', () => {
    const b = besluit({ stand: 'handmatig', profiel: 'controleerbaar', nu })
    expect(b.privacyStatus).toBe('private')
    expect(b.publishAt).toBeUndefined()
  })

  it('plant uitgesteld in op nu plus de uren', () => {
    const b = besluit({ stand: 'uitgesteld', profiel: 'controleerbaar', urenUitstel: 24, nu })
    expect(b.privacyStatus).toBe('private')
    expect(b.publishAt).toBe('2026-09-16T12:00:00.000Z')
    expect(b.teruggezet).toBe(false)
  })

  it('zet direct meteen openbaar', () => {
    expect(besluit({ stand: 'direct', profiel: 'controleerbaar', nu }).privacyStatus).toBe('public')
  })

  it('weigert uitstellen bij een kanaal met oordeelclaims', () => {
    const b = besluit({ stand: 'uitgesteld', profiel: 'oordeel', urenUitstel: 24, nu })
    expect(b.stand).toBe('handmatig')
    expect(b.privacyStatus).toBe('private')
    expect(b.publishAt).toBeUndefined()
    expect(b.teruggezet).toBe(true)
  })

  it('weigert ook direct bij oordeelclaims, hoe hard je het ook vraagt', () => {
    const b = besluit({ stand: 'direct', profiel: 'oordeel', nu })
    expect(b.stand).toBe('handmatig')
    expect(b.privacyStatus).toBe('private')
    expect(b.teruggezet).toBe(true)
  })

  it('legt bij elke uitkomst uit wat er gebeurt', () => {
    for (const stand of ['handmatig', 'uitgesteld', 'direct'] as const) {
      for (const profiel of ['controleerbaar', 'oordeel'] as const) {
        expect(besluit({ stand, profiel, nu }).uitleg.length).toBeGreaterThan(20)
      }
    }
  })
})
