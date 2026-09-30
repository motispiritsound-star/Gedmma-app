import { afterEach, describe, expect, it, vi } from 'vitest'
import { STRINGS } from '.'
import { LANGS } from './languages'
import type { Lang } from './languages'
import { privacyVan } from './privacy'
import { termsVan } from './terms'
import { winkelnamen } from './winkels'
import type { Winkel } from '../engine/platform'

/**
 * Apple wees versie 1.0 (build 5) af op richtlijn 2.3.10:
 *
 *   "don't include names, icons, or imagery of other mobile platforms or
 *    alternative app marketplaces in your app or metadata"
 *
 * "in your app" is de helft die over het hoofd gezien werd. De afwijzing ging
 * over de winkelbeschrijving, maar dezelfde namen stonden op vier schermen in
 * de app: het koopscherm, het ouderscherm, de privacyverklaring en de
 * voorwaarden. Deze test loopt ze alle vier na, in zes talen en op drie
 * platforms, zodat er geen vijfde plek kan bijkomen zonder dat het opvalt.
 */

// `platform()` leest `window` bij elke aanroep, dus een stub is genoeg.
const opPlatform = (winkel: Winkel) => {
  if (winkel === 'beide') vi.stubGlobal('window', undefined)
  else vi.stubGlobal('window', { Capacitor: { getPlatform: () => winkel } })
}
afterEach(() => { vi.unstubAllGlobals() })

/** Alles wat een mens op die vier schermen te lezen krijgt, als platte tekst. */
const alleTeksten = (lang: Lang): string[] => {
  const n = winkelnamen(lang)
  const t = STRINGS[lang]
  const uit: string[] = [
    // het koopscherm
    t.unlock.voorwaardenJaar(3, '€ 59,99', t.unlock.winkelnaam[winkelSleutel()]),
    t.unlock.voorwaarden(3, '€ 6,99', t.unlock.winkelnaam[winkelSleutel()]),
    t.unlock.beheerHint(t.unlock.winkelnaam[winkelSleutel()]),
    // De terugvaltekst als de winkel niet opstart. Die stond eerst alleen op
    // het web, maar rendert ook op een toestel zodra de aankoop-plugin niet
    // meldt dat hij klaar is — nagemeten met een iOS-stub zonder plugin.
    t.unlock.alleenInApp('€ 59,99', true, t.unlock.winkelnaam[winkelSleutel()]),
    t.unlock.boek.alleenInApp('€ 9,99', t.unlock.winkelnaam[winkelSleutel()]),
    t.unlock.winkelWeg,
    // het ouderscherm
    ...t.parents.privacy(n),
    t.parents.winkel.uitleg(n),
    // De FAQ op de startpagina. Die stond hier eerst niet in, en een meting
    // met innerText zag hem ook niet: hij zit in een <details>, en de inhoud
    // van een dichtgeklapt blok komt niet in innerText. Twee blinde vlekken
    // over hetzelfde stuk tekst, waarin Google Play stond terwijl de app op
    // iOS al in review lag. Bereikbaar via het logo in de balk.
    ...t.landing.faq(n).flat(),
  ]
  for (const doc of [privacyVan(lang), termsVan(lang)]) {
    uit.push(doc.title, doc.intro, doc.contact)
    for (const s of doc.sections) uit.push(s.title, ...s.body)
  }
  return uit
}

// De sleutel die `winkelVan()` op dit moment zou teruggeven.
const winkelSleutel = (): Winkel => {
  const w = (globalThis as { window?: { Capacitor?: { getPlatform?: () => string } } }).window
  const p = w?.Capacitor?.getPlatform?.()
  return p === 'ios' || p === 'android' ? p : 'beide'
}

const codes = LANGS.map((l) => l.code) as Lang[]

describe('geen andere winkel dan die van dit platform', () => {
  it.each(codes)('%s noemt op iOS nergens Google of Android', (lang) => {
    opPlatform('ios')
    for (const tekst of alleTeksten(lang)) {
      expect(tekst, `${lang}: "${tekst.slice(0, 120)}"`)
        .not.toMatch(/Google Play|Play Store|\bGoogle\b|\bAndroid\b|Samsung|Huawei/i)
    }
  })

  it.each(codes)('%s noemt op Android nergens de App Store', (lang) => {
    opPlatform('android')
    for (const tekst of alleTeksten(lang)) {
      expect(tekst, `${lang}: "${tekst.slice(0, 120)}"`)
        .not.toMatch(/App ?Store|\biOS\b|\biPhone\b|\biPad\b/i)
    }
  })

  it.each(codes)('%s noemt op het web beide winkels', (lang) => {
    // Op de website is niet te weten waar iemand koopt. Eén winkel noemen is
    // daar onvolledig, niet veilig.
    opPlatform('beide')
    const alles = alleTeksten(lang).join(' ')
    expect(alles, `${lang}: de App Store komt er niet in voor`).toMatch(/App Store/i)
    expect(alles, `${lang}: Google Play komt er niet in voor`).toMatch(/Google Play/i)
  })

  it.each(codes)('%s houdt de clausule die Apple eist, en alleen waar Apple verkoopt', (lang) => {
    // Schedule 2 van de Apple Developer Program License Agreement eist dat de
    // voorwaarden zeggen dat Apple geen partij is maar ze wel mag inroepen.
    opPlatform('ios')
    const opIos = termsVan(lang).sections.flatMap((s) => [s.title, ...s.body]).join(' ')
    expect(opIos, `${lang}: de Apple-clausule staat niet in de voorwaarden`).toMatch(/Apple/)

    opPlatform('android')
    const opAndroid = termsVan(lang).sections.flatMap((s) => [s.title, ...s.body]).join(' ')
    expect(opAndroid, `${lang}: Apple staat in de Android-voorwaarden`).not.toMatch(/Apple/)
  })

  it.each(codes)('%s belooft niets meer over spraakherkenning', (lang) => {
    // De spraakherkenning van de browser is uit de code gehaald: er bestaat
    // geen herkenner die Darija kent. De privacyverklaring beloofde daarna nog
    // jaren dat de opname "naar de maker van de browser" ging — een onjuiste
    // mededeling over de stem van een kind. Zie engine/microfoon.ts.
    opPlatform('beide')
    for (const tekst of alleTeksten(lang)) {
      expect(tekst, `${lang}: "${tekst.slice(0, 120)}"`).not.toMatch(/Chrome/i)
    }
  })
})
