/**
 * De vier gevallen die vóór vandaag allemaal "nieuwe sleutel" opleverden.
 *
 * De kolom `ingetrokken` stond in het schema, het leespad hield er rekening
 * mee — zowel de sleutel uit de mail als de boekenlijst op het portaal — maar
 * niets zette hem ooit. Een terugbetaling was daarmee het beste wat een koper
 * kon overkomen: geld terug, boeken houden, en een tweede sleutel toe.
 */
import { describe, expect, it } from 'vitest'
import { koopStap } from './index'
import { koopbericht } from './koopbericht'

describe('wat de betaalpartner meldt', () => {
  it('herkent een terugbetaling, hoe de partner het ook noemt', () => {
    for (const veld of ['refunded', 'disputed', 'terugbetaald']) {
      expect(koopbericht({ email: 'a@b.nl', permalink: 'sleutels', [veld]: 'true' }).terugbetaald, veld).toBe(true)
    }
  })

  it('leest "false" en een leeg veld als: gewoon een verkoop', () => {
    for (const waarde of ['false', '0', '']) {
      expect(koopbericht({ email: 'a@b.nl', permalink: 'sleutels', refunded: waarde }).terugbetaald, waarde).toBe(false)
    }
    expect(koopbericht({ email: 'a@b.nl', permalink: 'sleutels' }).terugbetaald).toBe(false)
  })

  it('pakt het bestelnummer op uit sale_id én order_number', () => {
    expect(koopbericht({ email: 'a@b.nl', permalink: 'sleutels', sale_id: 'S1' }).bestelnummer).toBe('S1')
    expect(koopbericht({ email: 'a@b.nl', permalink: 'sleutels', order_number: 'O1', sale_id: 'S1' }).bestelnummer).toBe('O1')
  })
})

describe('wat wij ermee doen', () => {
  const geval = (terugbetaald: boolean, bestelnummer: string | undefined, alBekend: boolean) =>
    koopStap({ terugbetaald, bestelnummer, alBekend })

  it('trekt in bij een terugbetaling met bestelnummer', () => {
    expect(geval(true, 'S1', false)).toBe('intrekken')
    expect(geval(true, 'S1', true)).toBe('intrekken')
  })

  it('doet niets bij een terugbetaling die niet thuis te brengen is', () => {
    // Gokken zou de boeken weghalen bij iemand die netjes betaald heeft.
    expect(geval(true, undefined, false)).toBe('zonder-nummer')
    expect(geval(true, '', true)).toBe('zonder-nummer')
  })

  it('maakt van dezelfde melding geen tweede bestelling', () => {
    expect(geval(false, 'S1', true)).toBe('al-bekend')
  })

  it('laat een echte verkoop gewoon door', () => {
    expect(geval(false, 'S1', false)).toBe('nieuw')
    // Onze eigen proefposten sturen geen nummer mee en mogen dus herhaald.
    expect(geval(false, undefined, false)).toBe('nieuw')
  })

  it('kent geen vijfde uitkomst', () => {
    const uit = new Set()
    for (const t of [true, false]) {
      for (const n of ['S1', undefined]) {
        for (const a of [true, false]) uit.add(geval(t, n, a))
      }
    }
    expect([...uit].sort()).toEqual(['al-bekend', 'intrekken', 'nieuw', 'zonder-nummer'])
  })
})
