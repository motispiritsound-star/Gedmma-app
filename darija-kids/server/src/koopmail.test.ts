import { describe, expect, it } from 'vitest'
import { koopMail } from './index'
import { MAILS, TALEN } from './mails'

/**
 * De mail na het afrekenen, in de taal van de koper.
 *
 * Dit is de eerste mail die iemand krijgt die echt geld heeft betaald, en hij
 * was in alle gevallen Nederlands — ook voor de Franse koper die Franse boeken
 * had gekocht. De taal werd al geraden uit het land en al opgeslagen; alleen
 * deze mail deed er niets mee.
 */
const env = { LEZER: 'https://darijaforkids.eu/lezen' }
const SLEUTEL = 'a'.repeat(32)

describe('de mail na het afrekenen', () => {
  it.each(TALEN)('is in het %s geschreven', (taal) => {
    const m = koopMail(env, SLEUTEL, ['sleutels'], taal)
    const p = MAILS[taal]
    expect(m.kop).toBe(p.koopKop)
    expect(m.knop.tekst).toBe(p.koopKnop)
    expect(m.staart).toBe(p.koopStaart)
    // De titel op het boek dat hij net heeft gekregen, niet de Nederlandse.
    expect(m.onderwerp).toContain(p.reeks.sleutels)
    expect(m.body).toContain(p.reeks.sleutels)
  })

  it.each(TALEN)('noemt in het %s beide reeksen als je ze allebei koopt', (taal) => {
    const m = koopMail(env, SLEUTEL, ['sba', 'sleutels'], taal)
    const p = MAILS[taal]
    expect(m.onderwerp).toContain(p.reeks.sba)
    expect(m.onderwerp).toContain(p.reeks.sleutels)
    expect(m.onderwerp).toContain(` ${p.koopEn} `)
  })

  it('zet de sleutel achter het hekje en niet in het pad', () => {
    // Een pad komt in logboeken terecht, alles achter # niet — dat blijft in
    // de browser. Daar hangt de hele toegang tot de boeken aan.
    const m = koopMail(env, SLEUTEL, ['sba'], 'nl')
    expect(m.knop.url).toBe(`https://darijaforkids.eu/lezen#${SLEUTEL}`)
  })

  it('gebruikt het adres uit de omgeving als dat er staat', () => {
    const m = koopMail({ LEZER: 'https://test.example/lezen' }, SLEUTEL, ['sba'], 'nl')
    expect(m.knop.url).toBe(`https://test.example/lezen#${SLEUTEL}`)
  })

  /**
   * Eén reeks of twee is een ander werkwoord.
   *
   * "Les clés du Maroc vous attend" en "Sba et Les clés vous attendent" —
   * in alle zes de talen staat daar een vervoeging op, en een mail die daar
   * naast zit leest als een automaat.
   */
  it.each(TALEN)('vervoegt in het %s met het aantal mee', (taal) => {
    const eersteRegel = (r: string[]): string => r[0] ?? ''
    const een = eersteRegel(koopMail(env, SLEUTEL, ['sba'], taal).body.split('\n'))
    const twee = eersteRegel(koopMail(env, SLEUTEL, ['sba', 'sleutels'], taal).body.split('\n'))
    expect(een).not.toBe(twee)
    expect(een.replace(MAILS[taal].reeks.sba, '')).not.toBe(
      twee.replace(`${MAILS[taal].reeks.sba} ${MAILS[taal].koopEn} ${MAILS[taal].reeks.sleutels}`, ''),
    )
  })

  it('zegt in geen enkele taal iets in het Nederlands tegen een vreemde', () => {
    // De vangnetregel: een taal die we niet kennen wordt Engels, niet
    // Nederlands. Dat staat in `taalVan`, en dit legt vast waarom.
    for (const taal of TALEN.filter((t) => t !== 'nl')) {
      const m = koopMail(env, SLEUTEL, ['sba', 'sleutels'], taal)
      expect(m.body, taal).not.toContain('De sleutels van Marokko')
      expect(m.body, taal).not.toContain('Sba de Atlasleeuw')
      expect(m.onderwerp, taal).not.toContain('staan klaar')
    }
  })
})
