/**
 * Het e-boek en de proefperiode.
 *
 * Het boek is een pdf, en een pdf houd je zodra je hem één keer opent. Bij het
 * jaarabonnement zitten de eerste drie dagen gratis, dus zonder grens kon
 * iemand het jaar afsluiten, het boek opslaan en op dag twee opzeggen: nul
 * betaald, een product van € 14,99 mee.
 *
 * Dat is geen bedacht scenario maar het eerste wat iemand probeert die er één
 * keer over nadenkt, en het kost precies zoveel als het boek waard is.
 */
import { beforeEach, describe, expect, it } from 'vitest'
import { ebookKlaar, ebookWachtTot, hasEbook, TRIAL_DAYS } from './billing'
import { getState, setState } from './store'

const DAG = 864e5
const NU = 1_760_000_000_000

beforeEach(() => setState({ ebook: false, ebookVanaf: null, unlocked: false }))

describe('het e-boek tijdens de proefperiode', () => {
  it('blijft dicht zolang de gratis dagen lopen', () => {
    setState({ ebook: true, ebookVanaf: NU + TRIAL_DAYS * DAG })
    expect(ebookKlaar(getState(), NU)).toBe(false)
    expect(ebookKlaar(getState(), NU + (TRIAL_DAYS - 0.01) * DAG)).toBe(false)
  })

  it('gaat open zodra de proefperiode voorbij is', () => {
    setState({ ebook: true, ebookVanaf: NU + TRIAL_DAYS * DAG })
    expect(ebookKlaar(getState(), NU + TRIAL_DAYS * DAG)).toBe(true)
    expect(ebookKlaar(getState(), NU + 400 * DAG)).toBe(true)
  })

  /**
   * Wie het boek los koopt, wacht nergens op: daar zit geen proefperiode bij.
   */
  it('is meteen open als het los gekocht is', () => {
    setState({ ebook: true, ebookVanaf: NU })
    expect(ebookKlaar(getState(), NU)).toBe(true)
    expect(ebookWachtTot(getState(), NU)).toBe(null)
  })

  /**
   * Het recht en het openen zijn twee dingen, en het recht vervalt nooit.
   *
   * Dat onderscheid is de hele reden dat er twee velden staan. Wie het
   * samenvoegt, neemt een betaald boek af van iemand die stopt met het
   * abonnement — en dat is precies wat `boek.vanJou` belooft dat niet gebeurt.
   */
  it('houdt het recht ook als het nog niet open mag', () => {
    setState({ ebook: true, ebookVanaf: NU + TRIAL_DAYS * DAG })
    expect(hasEbook()).toBe(true)
    expect(ebookWachtTot(getState(), NU)).toBe(NU + TRIAL_DAYS * DAG)
  })

  it('zegt nee tegen wie er helemaal geen recht op heeft', () => {
    expect(ebookKlaar(getState(), NU)).toBe(false)
    expect(ebookWachtTot(getState(), NU)).toBe(null)
    setState({ ebook: true, ebookVanaf: null })
    expect(ebookKlaar(getState(), NU)).toBe(false)
  })
})
