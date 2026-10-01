/**
 * Drie manieren om het e-boek (nog) niet te hebben, en ze zeiden alle drie
 * hetzelfde.
 *
 * Op `/boek` stond één tak met `t.unlock.slotTitel` erin: "Deze unit hoort bij
 * de volledige toegang". Dat is de tekst van een lés achter het slot, en voor
 * wie het jaarabonnement net heeft afgesloten is hij ronduit verkeerd — die
 * krijgt te lezen dat hij moet kopen wat hij een uur geleden gekocht heeft.
 * Het boek gaat namelijk pas open ná de gratis dagen, want een pdf houd je
 * zodra je hem één keer opent.
 *
 * Nagemeten in de browser, met drie staten:
 *
 *   niets gekocht    → "Bij een jaarabonnement zit het e-boek erbij"  · knop: Bekijken
 *   proef loopt nog  → "Het staat vanaf 4 oktober voor je klaar"      · knop: Terug
 *   het is van jou   → de pdf                                        · knop: Terug
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { ebookWachtTot, TRIAL_DAYS } from '../engine/billing'
import { getState, setState } from '../engine/store'

const bron = readFileSync(new URL('../pages/Boek.tsx', import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('wat de boekbladzijde zegt', () => {
  it('kent de staat "wachten" apart van "niet gekocht"', () => {
    expect(bron).toContain('const wachtTot = useStore((s) => ebookWachtTot(s))')
    expect(bron).toContain('const wacht = wachtTot !== null')
  })

  /**
   * De tekst van het wachten bestond al en stond op `/volledig`. Dezelfde
   * tekst én dezelfde datumopmaak, zodat de twee schermen niet uit elkaar
   * lopen over hetzelfde boek.
   */
  it('gebruikt de wachttekst die al bestond, met dezelfde datumopmaak', () => {
    expect(bron).toContain('t.unlock.boek.wacht(')
    expect(bron).toContain("new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long' })")
    const unlock = readFileSync(new URL('../pages/Unlock.tsx', import.meta.url), 'utf8')
    expect(unlock).toContain("new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long' })")
  })

  /**
   * En de lestekst hoort hier niet meer te staan. Dat is de regel die het
   * verkeerde zei tegen iemand die net betaald had.
   */
  it('zegt niet meer dat een "unit" bij de volledige toegang hoort', () => {
    // Zonder het commentaar erbij: daar staat hij nog in, als uitleg waarom.
    const zonderUitleg = bron.replace(/\/\*[\s\S]*?\*\//g, '')
    expect(zonderUitleg).not.toContain('t.unlock.slotTitel')
    // De koopknop mag wel dezelfde blijven heten: die doet hetzelfde.
    expect(zonderUitleg).toContain('t.unlock.slotKnop')
  })

  /** Eén kop op de bladzijde, zodat een schermlezer ergens op landt. */
  it('heeft een kop in elke staat', () => {
    expect((bron.match(/<h1 /g) ?? []).length).toBeGreaterThanOrEqual(2)
  })
})

describe('de staat waar het om draait', () => {
  it('meldt wachten zolang de gratis dagen lopen, en daarna niet meer', () => {
    const nu = 1_760_000_000_000
    setState({ unlocked: true, unlockedAt: nu, ebook: false, ebookVanaf: nu + TRIAL_DAYS * 864e5 })
    expect(ebookWachtTot(getState(), nu)).toBe(nu + TRIAL_DAYS * 864e5)

    // Na de proef is er niets meer te wachten: dan is het boek er, of het
    // abonnement is opgezegd en dan is het een koopvraag.
    expect(ebookWachtTot(getState(), nu + TRIAL_DAYS * 864e5 + 1)).toBeNull()
  })

  it('meldt niets te wachten voor wie niets heeft gekocht', () => {
    setState({ unlocked: false, unlockedAt: null, ebook: false, ebookVanaf: null })
    expect(ebookWachtTot(getState())).toBeNull()
  })
})

describe('de hoogte van de lezer', () => {
  /**
   * Hier stond een vaste hoogte: `100vh - 10rem`. Op een staande telefoon
   * klopt dat, maar leg hem plat en het venster is nog 390 pixels hoog.
   * Nagemeten in de browser hield de pdf er dan **48 pixels** van over — en
   * omdat de hoogte vastzat kon de bladzijde ook niet scrollen. Een boek van
   * € 14,99 als strook van achtenveertig pixels, zonder weg eruit.
   *
   * Niets lockt de stand van het scherm: Android draait vrij mee, en een
   * iPad staat standaard liggend.
   *
   * Na afloop gemeten: 390×844 onveranderd (462px pdf), 844×390 van 48 naar
   * 410, 320×568 naar 350, 1024×768 naar 426.
   */
  it('zakt niet onder wat een lezer nodig heeft', () => {
    expect(bron).toContain('h-[max(37rem,calc(100vh-10rem))]')
    expect(bron).not.toContain('h-[calc(100vh-10rem)]')
  })

  /**
   * En de pdf mag binnen die kolom wél krimpen: zonder `min-h-0` weigert een
   * flex-kind kleiner te worden dan zijn inhoud, en dan groeit de kolom nog
   * verder door dan de ondergrens al doet.
   */
  it('laat de pdf binnen de kolom meebewegen', () => {
    expect(bron).toContain('className="min-h-0 flex-1 rounded-2xl')
  })
})
