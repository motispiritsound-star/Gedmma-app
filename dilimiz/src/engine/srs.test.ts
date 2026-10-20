import { describe, expect, it } from 'vitest'
import {
  aanDeBeurt, DAG, herzie, isWoordKaart, MINUUT, nieuweKaart, SLEUTEL, sterkteNaam,
} from './srs'

const NU = 1_700_000_000_000

describe('een nieuwe kaart', () => {
  it('is meteen aan de beurt en heeft nog geen sterkte', () => {
    const k = nieuweKaart('merhaba', NU)
    expect(k.beurt).toBe(NU)
    expect(k.sterkte).toBe(0)
    expect(sterkteNaam(k.sterkte)).toBe('nieuw')
  })
})

describe('herzien', () => {
  it('schuift een goed antwoord naar later', () => {
    const k = herzie(nieuweKaart('ev', NU), 'goed', NU)
    expect(k.beurt).toBeGreaterThan(NU)
    expect(k.sterkte).toBeGreaterThan(0)
  })

  it('zet een fout antwoord binnen de sessie terug', () => {
    const k = herzie(nieuweKaart('ev', NU), 'fout', NU)
    expect(k.beurt).toBe(NU + 8 * MINUUT)
    expect(k.missers).toBe(1)
  })

  it('gooit bij één fout niet alles weg wat er al stond', () => {
    // Wie een woord acht keer goed had, is het niet kwijt na één vergissing.
    let k = nieuweKaart('anne', NU)
    for (let i = 0; i < 8; i++) k = herzie(k, 'goed', k.beurt)
    const voor = k.sterkte
    const na = herzie(k, 'fout', k.beurt)
    expect(voor).toBeGreaterThan(0.8)
    expect(na.sterkte).toBeGreaterThan(0.3)
    expect(na.sterkte).toBeLessThan(voor)
  })

  it('laat een woord dat goed blijft gaan uitgroeien tot weken', () => {
    let k = nieuweKaart('baba', NU)
    for (let i = 0; i < 6; i++) k = herzie(k, 'goed', k.beurt)
    expect(k.tussentijd).toBeGreaterThan(7)
  })

  it('houdt gemak tussen 1.3 en 3', () => {
    let k = nieuweKaart('kiz', NU)
    for (let i = 0; i < 30; i++) k = herzie(k, 'fout', k.beurt)
    expect(k.gemak).toBeGreaterThanOrEqual(1.3)
    let m = nieuweKaart('on', NU)
    for (let i = 0; i < 30; i++) m = herzie(m, 'makkelijk', m.beurt)
    expect(m.gemak).toBeLessThanOrEqual(3)
  })

  it('houdt sterkte tussen 0 en 1', () => {
    let k = nieuweKaart('bir', NU)
    for (let i = 0; i < 20; i++) k = herzie(k, 'makkelijk', k.beurt)
    expect(k.sterkte).toBeLessThanOrEqual(1)
    for (let i = 0; i < 20; i++) k = herzie(k, 'fout', k.beurt)
    expect(k.sterkte).toBeGreaterThanOrEqual(0)
  })
})

describe('de rij', () => {
  it('geeft het zwakste eerst', () => {
    const sterk = { ...nieuweKaart('a', NU), sterkte: 0.9 }
    const zwak = { ...nieuweKaart('b', NU), sterkte: 0.1 }
    expect(aanDeBeurt([sterk, zwak], NU).map((k) => k.id)).toEqual(['b', 'a'])
  })

  it('laat wat nog niet aan de beurt is staan', () => {
    const later = { ...nieuweKaart('later', NU), beurt: NU + DAG }
    expect(aanDeBeurt([later], NU)).toEqual([])
  })

  it('houdt zich aan de bovengrens', () => {
    const veel = Array.from({ length: 50 }, (_, i) => nieuweKaart(`w${i}`, NU))
    expect(aanDeBeurt(veel, NU, 12)).toHaveLength(12)
  })
})

describe('sleutels', () => {
  it('houdt letters, zinnen en klankparen apart van woorden', () => {
    // "Woorden geleerd" moet een aantal woorden blijven en niet stil
    // meegroeien met het alfabet.
    expect(isWoordKaart('merhaba')).toBe(true)
    expect(isWoordKaart(SLEUTEL.letter('i-dotless'))).toBe(false)
    expect(isWoordKaart(SLEUTEL.zin('merhaba-1'))).toBe(false)
    expect(isWoordKaart(SLEUTEL.klankpaar('kil-kil'))).toBe(false)
  })
})

describe('sterktenamen', () => {
  it('loopt van nieuw naar vast', () => {
    expect(sterkteNaam(0)).toBe('nieuw')
    expect(sterkteNaam(0.2)).toBe('wankel')
    expect(sterkteNaam(0.4)).toBe('bijna')
    expect(sterkteNaam(0.7)).toBe('sterk')
    expect(sterkteNaam(0.95)).toBe('vast')
  })
})
