import { describe, expect, it } from 'vitest'
import { MANIEREN, maxSeconden, raam, type Opzet } from '../src/studio/beeldkosten.js'

const opzet: Opzet = {
  videoSeconden: 900, generatieveSeconden: 30, beelden: 31,
  videosPerMaand: 4, budgetCentsPerMaand: 10000,
}

describe('raam', () => {
  it('rekent per seconde waar dat de eenheid is', () => {
    const wan = raam(opzet).find((r) => r.manier.key === 'wan-720')
    expect(wan?.centsPerVideo).toBe(300)   // 30 s x 10 cent
    expect(wan?.centsPerMaand).toBe(1200)
  })

  it('rekent per beeld waar dat de eenheid is', () => {
    const stills = raam(opzet).find((r) => r.manier.key === 'eigen-stills')
    expect(stills?.centsPerVideo).toBe(93) // 31 beelden x 3 cent
  })

  it('zet eigen tekening op nul', () => {
    const eigen = raam(opzet).find((r) => r.manier.key === 'eigen-tekening')
    expect(eigen?.centsPerMaand).toBe(0)
    expect(eigen?.past).toBe(true)
  })

  it('laat de hele video generatief niet binnen het budget passen', () => {
    const alles = raam({ ...opzet, generatieveSeconden: 900 })
    expect(alles.find((r) => r.manier.key === 'wan-480')?.past).toBe(false)
    expect(alles.find((r) => r.manier.key === 'kling-turbo')?.past).toBe(false)
  })

  it('rekent nooit meer seconden dan de video lang is', () => {
    const teveel = raam({ ...opzet, generatieveSeconden: 5000 })
    const wan = teveel.find((r) => r.manier.key === 'wan-720')
    expect(wan?.centsPerVideo).toBe(9000) // 900 s, niet 5000
  })

  it('geeft voor elke manier een raming terug', () => {
    expect(raam(opzet)).toHaveLength(MANIEREN.length)
  })
})

describe('maxSeconden', () => {
  it('zegt hoeveel seconden er in het budget passen', () => {
    expect(maxSeconden(10, 4, 10000)).toBe(250)
  })

  it('is onbegrensd bij gratis beeld', () => {
    expect(maxSeconden(0, 4, 10000)).toBe(Infinity)
  })

  it('is onbegrensd als je geen video maakt', () => {
    expect(maxSeconden(10, 0, 10000)).toBe(Infinity)
  })

  it('rondt naar beneden af, want een halve seconde koop je niet', () => {
    expect(maxSeconden(7, 4, 10000)).toBe(357)
  })
})
