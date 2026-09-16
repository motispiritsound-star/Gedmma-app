import { describe, expect, it } from 'vitest'
import { drempelVan, energieVan, knip } from './knip'

/** Een opname in elkaar zetten: stukjes ruis en stukjes "spraak". */
function maak(rate: number, delen: { luid: boolean; duur: number }[]): Float32Array {
  const n = delen.reduce((a, d) => a + Math.round(d.duur * rate), 0)
  const uit = new Float32Array(n)
  let i = 0
  for (const d of delen) {
    const eind = i + Math.round(d.duur * rate)
    for (; i < eind; i++) {
      // Ruis blijft altijd staan: een echte opname is nooit digitaal stil.
      uit[i] = (Math.random() - 0.5) * (d.luid ? 0.6 : 0.004)
    }
  }
  return uit
}

describe('een doorlopende opname in woorden knippen', () => {
  const rate = 16000

  it('vindt drie woorden met een adempauze ertussen', () => {
    const geluid = maak(rate, [
      { luid: false, duur: 0.4 },
      { luid: true, duur: 0.5 }, { luid: false, duur: 0.5 },
      { luid: true, duur: 0.6 }, { luid: false, duur: 0.5 },
      { luid: true, duur: 0.4 }, { luid: false, duur: 0.4 },
    ])
    expect(knip(geluid, rate)).toHaveLength(3)
  })

  // De sluiting van een b of een t is een paar honderdste stil. Daar mag geen
  // woord in tweeën vallen, anders levert één woord twee bestanden op.
  it('knipt niet op de stilte binnen een woord', () => {
    const geluid = maak(rate, [
      { luid: false, duur: 0.3 },
      { luid: true, duur: 0.3 }, { luid: false, duur: 0.04 }, { luid: true, duur: 0.3 },
      { luid: false, duur: 0.4 },
    ])
    expect(knip(geluid, rate)).toHaveLength(1)
  })

  it('gooit een kuch weg en houdt het woord over', () => {
    const geluid = maak(rate, [
      { luid: false, duur: 0.3 },
      { luid: true, duur: 0.04 }, { luid: false, duur: 0.5 },
      { luid: true, duur: 0.5 }, { luid: false, duur: 0.3 },
    ])
    const stukken = knip(geluid, rate)
    expect(stukken).toHaveLength(1)
    expect(stukken[0]!.tot - stukken[0]!.van).toBeGreaterThan(0.4)
  })

  it('laat wat lucht om elk woord staan', () => {
    const geluid = maak(rate, [
      { luid: false, duur: 0.5 }, { luid: true, duur: 0.5 }, { luid: false, duur: 0.5 },
    ])
    const [stuk] = knip(geluid, rate, { marge: 0.05 })
    expect(stuk!.van).toBeLessThan(0.5)
    expect(stuk!.tot).toBeGreaterThan(1.0)
  })

  it('geeft niets terug voor een opname waarin niets gezegd is', () => {
    expect(knip(maak(rate, [{ luid: false, duur: 2 }]), rate)).toEqual([])
    expect(knip(new Float32Array(0), rate)).toEqual([])
  })

  // Een stille kamer en een keuken hebben niet dezelfde ruisbodem, dus de
  // grens komt uit de opname en staat niet in de code.
  it('legt de grens boven de ruis, hoe hard die ook is', () => {
    const stil = energieVan(maak(rate, [{ luid: false, duur: 1 }, { luid: true, duur: 1 }]), rate)
    const luid = energieVan(maak(rate, [{ luid: false, duur: 1 }, { luid: true, duur: 1 }]), rate)
    expect(drempelVan(stil)).toBeGreaterThan(0)
    expect(drempelVan(luid)).toBeGreaterThan(0)
  })
})
