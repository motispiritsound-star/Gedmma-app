/**
 * Een afgebroken betaling is geen storing.
 *
 * Hier zat een fout die je niet ziet door naar de app te kijken, alleen door
 * de plugin te lezen. `offer.order()` wijst niet af als het misgaat — de
 * belofte lost op, met een foutvoorwerp erin in plaats van niets. In
 * `store.d.ts` staat het letterlijk: `Promise<IError | undefined>`.
 *
 * De `try/catch` eromheen ving dus niets. Elke afgebroken of mislukte
 * betaling gold als gelukt, `busy` bleef aan, en de knop waarmee je het
 * opnieuw probeert bleef "Bezig…" tot de app opnieuw startte. Dat is de enige
 * knop in de app waar geld achter zit.
 *
 * En andersom: wie de betaalkaart wegveegt hoort geen rode regel te zien die
 * zegt dat er iets misging. Hij heeft niets fout gedaan, hij bedacht zich.
 */
import { describe, expect, it } from 'vitest'
import { foutVan } from './billing'

/** `ErrorCode.PAYMENT_CANCELLED`: 6777000 + 6, uit de plugin zelf. */
const AFGEBROKEN = 6777006

describe('wat een bestelling teruggaf', () => {
  it('zegt niets als de aankoop lukte', () => {
    expect(foutVan(undefined)).toBeNull()
  })

  it('zegt niets als de koper zich bedacht', () => {
    expect(foutVan({ isError: true, code: AFGEBROKEN, message: 'The user cancelled the order.' })).toBeNull()
  })

  it('meldt wél wat de winkel zei toen het echt misging', () => {
    expect(foutVan({ isError: true, code: 6777010, message: 'Purchase failed' })).toBe('Purchase failed')
  })

  it('meldt iets, ook als de winkel zweeg over het waarom', () => {
    expect(foutVan({ isError: true, code: 6777010 })).toBe('onbekend')
  })

  /**
   * Een voorwerp zonder `isError` is geen fout. Dat lijkt een slag in de
   * lucht, maar het is het verschil tussen "geen fout" en "een fout waar niets
   * in staat" — en alleen de tweede hoort op het scherm.
   */
  it('houdt iets dat geen fout is ook buiten het scherm', () => {
    expect(foutVan({ code: AFGEBROKEN })).toBeNull()
    expect(foutVan({})).toBeNull()
  })
})

describe('de code voor afbreken', () => {
  /**
   * Dit getal staat op twee plekken: hier en in `billing.ts`. Het komt uit de
   * plugin en mag niet stilletjes verschuiven, want dan wordt afbreken weer
   * een rode regel.
   */
  it('staat in billing.ts op de waarde die de plugin gebruikt', async () => {
    const { readFileSync } = await import('node:fs')
    const bron = readFileSync(new URL('./billing.ts', import.meta.url), 'utf8')
    expect(bron).toContain(`const AFGEBROKEN = ${AFGEBROKEN}`)

    const plugin = readFileSync(
      new URL('../../node_modules/cordova-plugin-purchase/www/store.js', import.meta.url), 'utf8')
    expect(plugin).toContain('const ERROR_CODES_BASE = 6777000')
    expect(plugin).toContain('ErrorCode["PAYMENT_CANCELLED"] = ERROR_CODES_BASE + 6')
  })
})
