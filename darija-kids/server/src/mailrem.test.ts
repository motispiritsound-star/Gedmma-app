import { beforeEach, describe, expect, it } from 'vitest'
import { mailBijAanmelding, mailBijInloggen } from './index'
import { MAILS_PER_UUR, magMailen, ruimOp, telMail } from './portaal'

/**
 * De rem op het versturen van mail.
 *
 * Het portaal stuurt een inloglink naar elk adres dat je invult. De rem
 * daarop stond per lid — zestig seconden tussen twee links — en die stapt een
 * vreemde zo voorbij: vul elke keer een ander adres in, dan is het elke keer
 * een nieuw lid en mag het meteen weer.
 *
 * Wat dat kost is niet de mail zelf maar de afzender. De ontvangers melden
 * hem aan als spam, post@darijaforkids.eu raakt geblokkeerd, en daarna komt
 * de inloglink van iemand die wél betaald heeft ook niet meer aan. De koper
 * is de dupe, niet de spammer.
 */

/** Een D1 van niks: genoeg voor een teller met één tafel erin. */
const nepDb = () => {
  const rijen = new Map<string, number>()
  const db = {
    prepare(sql: string) {
      let args: unknown[] = []
      const api = {
        bind(...a: unknown[]) { args = a; return api },
        async first<T>(): Promise<T | null> {
          if (!/SELECT aantal FROM mailteller/.test(sql)) return null
          const n = rijen.get(`${args[0]}|${args[1]}`)
          return (n === undefined ? null : { aantal: n }) as T
        },
        async run() {
          if (/INSERT INTO mailteller/.test(sql)) {
            const sleutel = `${args[0]}|${args[1]}`
            rijen.set(sleutel, (rijen.get(sleutel) ?? 0) + 1)
          }
          if (/DELETE FROM mailteller/.test(sql)) {
            for (const k of [...rijen.keys()]) if (k.split('|')[1]! < String(args[0])) rijen.delete(k)
          }
          return { meta: { changes: 0 } }
        },
      }
      return api
    },
  }
  return { db: db as unknown as D1Database, rijen }
}

describe('de rem op het versturen van mail', () => {
  let nep: ReturnType<typeof nepDb>
  beforeEach(() => { nep = nepDb() })

  it('laat een gewone bezoeker met rust', async () => {
    expect(await magMailen(nep.db, 'plekA')).toBe(true)
    await telMail(nep.db, 'plekA')
    expect(await magMailen(nep.db, 'plekA')).toBe(true)
  })

  it('houdt op na twaalf mails vanaf dezelfde plek', async () => {
    for (let i = 0; i < MAILS_PER_UUR; i += 1) {
      expect(await magMailen(nep.db, 'spammer'), `mail ${i + 1}`).toBe(true)
      await telMail(nep.db, 'spammer')
    }
    expect(await magMailen(nep.db, 'spammer')).toBe(false)
  })

  it('telt per plek, dus de buurman heeft er geen last van', async () => {
    for (let i = 0; i < MAILS_PER_UUR; i += 1) await telMail(nep.db, 'spammer')
    expect(await magMailen(nep.db, 'spammer')).toBe(false)
    expect(await magMailen(nep.db, 'iemand anders')).toBe(true)
  })

  it('telt per uur, dus morgen mag het weer', async () => {
    for (let i = 0; i < MAILS_PER_UUR; i += 1) await telMail(nep.db, 'plekA')
    expect(await magMailen(nep.db, 'plekA')).toBe(false)
    // Een teller uit een ander uur staat de huidige niet in de weg.
    nep.rijen.set('plekA|2020-01-01T00', 99)
    expect(await magMailen(nep.db, 'plekA')).toBe(false)
    nep.rijen.clear()
    expect(await magMailen(nep.db, 'plekA')).toBe(true)
  })

  it('ruimt de tellers van gisteren op', async () => {
    nep.rijen.set('oud|2020-01-01T00', 5)
    await telMail(nep.db, 'vandaag')
    await ruimOp(nep.db)
    expect([...nep.rijen.keys()].some((k) => k.startsWith('oud|'))).toBe(false)
    expect([...nep.rijen.keys()].some((k) => k.startsWith('vandaag|'))).toBe(true)
  })
})

/**
 * En wanneer er werkelijk iets de deur uit gaat.
 *
 * `/aanmelden` heeft twee paden: een adres dat er al staat en een dat nieuw
 * is. Het eerste stuurde mail met alleen een rem van zestig seconden per rij,
 * en die is te omzeilen met honderd rijen die je om beurten langsloopt. De
 * rem per plek staat nu vóór allebei.
 */
describe('wanneer er een mail uit mag', () => {
  it('bij een aanmelding: alleen als alle drie de remmen meewerken', () => {
    expect(mailBijAanmelding({ magPost: true, bevestigd: false, teSnel: false })).toBe(true)
    // Al bevestigd: er valt niets te bevestigen.
    expect(mailBijAanmelding({ magPost: true, bevestigd: true, teSnel: false })).toBe(false)
    // Twee keer tikken is niet twee mails.
    expect(mailBijAanmelding({ magPost: true, bevestigd: false, teSnel: true })).toBe(false)
    // En de plek is vol — dit is het pad dat eerst geen rem had.
    expect(mailBijAanmelding({ magPost: false, bevestigd: false, teSnel: false })).toBe(false)
  })

  it('bij het inloggen: de plek telt even zwaar als het adres', () => {
    expect(mailBijInloggen({ magPost: true, magOpnieuw: true })).toBe(true)
    expect(mailBijInloggen({ magPost: false, magOpnieuw: true })).toBe(false)
    expect(mailBijInloggen({ magPost: true, magOpnieuw: false })).toBe(false)
  })
})
