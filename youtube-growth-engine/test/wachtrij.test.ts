import { describe, expect, it } from 'vitest'
import { blokkade, telling, vastgelopen, volgende, zetStatus, type Wachtrij } from '../src/wachtrij.js'

const rij: Wachtrij = {
  kanaal: 'test',
  afleveringen: [
    { nr: 1, onderwerp: 'een', status: 'wacht-op-goedkeuring' },
    { nr: 2, onderwerp: 'twee', status: 'in-productie' },
    { nr: 3, onderwerp: 'drie', status: 'gepland' },
    { nr: 4, onderwerp: 'vier', status: 'gepland' },
  ],
}

const yaml = `kanaal: test
afleveringen:
  - nr: 1
    onderwerp: "een"
    status: wacht-op-goedkeuring
    productie: ""
    notitie: >
      status: staat hier als tekst en mag niet geraakt worden
  - nr: 2
    onderwerp: "twee"
    status: gepland
    productie: ""
`

describe('wachtrij', () => {
  it('pakt de eerste geplande, niet de eerste in het bestand', () => {
    expect(volgende(rij)?.nr).toBe(3)
  })

  it('geeft niets terug als er niets gepland staat', () => {
    expect(volgende({ afleveringen: [{ nr: 1, onderwerp: 'x', status: 'gepubliceerd' }] }))
      .toBeUndefined()
  })

  it('noemt wat is blijven hangen op in-productie', () => {
    expect(vastgelopen(rij).map((a) => a.nr)).toEqual([2])
  })

  it('telt per status', () => {
    expect(telling(rij)).toMatchObject({ gepland: 2, 'in-productie': 1, gepubliceerd: 0 })
  })
})

describe('zetStatus', () => {
  it('verandert alleen de aangewezen aflevering', () => {
    const uit = zetStatus(yaml, 2, 'in-productie')
    expect(uit).toContain('    status: in-productie')
    expect(uit.match(/status: wacht-op-goedkeuring/g)).toHaveLength(1)
  })

  it('schrijft de productie-id erbij', () => {
    const uit = zetStatus(yaml, 2, 'wacht-op-goedkeuring', 'prod-123')
    expect(uit).toContain('productie: "prod-123"')
    expect(uit).toContain('onderwerp: "twee"')
  })

  it('laat het woord status in een notitie met rust', () => {
    const uit = zetStatus(yaml, 2, 'afgeblazen')
    expect(uit).toContain('status: staat hier als tekst en mag niet geraakt worden')
  })

  it('klaagt over een aflevering die niet bestaat', () => {
    expect(() => zetStatus(yaml, 99, 'gepland')).toThrow(/99/)
  })
})

describe('blokkade', () => {
  it('weigert bij een killswitch', () => {
    expect(blokkade({ KILL_SWITCH: 'true' })).toMatch(/KILL_SWITCH/)
  })

  it('weigert wanneer de goedkeuringsstap uit staat', () => {
    expect(blokkade({ APPROVAL_MODE: 'false' })).toMatch(/APPROVAL_MODE/)
  })

  it('laat draaien wanneer niets in de weg staat', () => {
    expect(blokkade({ APPROVAL_MODE: 'true' })).toBeUndefined()
    expect(blokkade({})).toBeUndefined()
  })
})
