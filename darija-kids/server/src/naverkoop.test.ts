/**
 * Wat er ná de verkoop gebeurt, mag de verkoop niet omgooien.
 *
 * Zodra de bestelling in de database staat, is de koop rond. Daarna volgen
 * twee losse stappen: de koper lid maken, en de mail met de sleutel sturen.
 *
 * `schrijfIn` stond zonder vangnet tussen die twee. Viel hij om, dan gaf het
 * verzoek een 500, probeerde de betaalpartner het opnieuw, zag de rem dat
 * deze bestelling al bestond, en antwoordde met "al bekend" — waarna de mail
 * met de sleutel nooit meer werd verstuurd. Betaald, besteld, en geen
 * sleutel, zonder dat er ergens iets opviel.
 */
import { describe, expect, it, vi } from 'vitest'
import { naDeVerkoop } from './index'

describe('na de verkoop', () => {
  it('stuurt de mail ook als het lidmaatschap omvalt', async () => {
    const mail = vi.fn(async () => 'verstuurd')
    const mislukt = await naDeVerkoop([
      { naam: 'lid', doe: async () => { throw new Error('database weg') } },
      { naam: 'mail', doe: mail },
    ])
    // Dit is de hele reden dat dit bestaat.
    expect(mail).toHaveBeenCalledOnce()
    expect(mislukt.map((m) => m.naam)).toEqual(['lid'])
    // De reden gaat mee, anders zegt "viel om" niets.
    expect(mislukt[0]!.waarom).toContain('database weg')
  })

  it('gooit nooit, wat er ook misgaat', async () => {
    await expect(naDeVerkoop([
      { naam: 'lid', doe: async () => { throw new Error('een') } },
      { naam: 'mail', doe: async () => { throw new Error('twee') } },
    ])).resolves.toEqual([
      { naam: 'lid', waarom: 'een' },
      { naam: 'mail', waarom: 'twee' },
    ])
  })

  it('zwijgt als alles lukt', async () => {
    await expect(naDeVerkoop([
      { naam: 'lid', doe: async () => 1 },
      { naam: 'mail', doe: async () => 2 },
    ])).resolves.toEqual([])
  })

  it('doet de stappen op volgorde', async () => {
    const volgorde: string[] = []
    await naDeVerkoop([
      { naam: 'lid', doe: async () => { volgorde.push('lid') } },
      { naam: 'mail', doe: async () => { volgorde.push('mail') } },
    ])
    expect(volgorde).toEqual(['lid', 'mail'])
  })
})
