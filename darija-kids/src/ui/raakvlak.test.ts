/**
 * Wat een vinger moet kunnen raken.
 *
 * Apple en Google houden allebei 44 pixels aan als ondergrens voor een
 * bedieningselement. Dit is een app voor kinderen van vier tot tien, en die
 * mikken slechter dan de volwassene die het ontwerpt en met een muis test.
 *
 * Gemeten in een echte browser op 390 pixels, over twaalf schermen. Drie
 * dingen waren te klein, en het waren geen randgevallen:
 *
 * - de weg terug naar het begin in de kopbalk: 32 pixels, op élk scherm
 * - de acht schakelaars in de instellingen: 32 pixels, acht onder elkaar
 * - de taalkeuze en het dagdoel in de instellingen: 41 en 32
 *
 * Alle drie zijn opgelost zonder dat er iets verschuift: de kopbalk bleef
 * 77 pixels hoog en de rijen in de instellingen 77, 77 en 97 — gemeten met en
 * zonder de wijziging.
 *
 * Wat bewust klein blijft: de filterstrook op `/woorden` (36, een strook die
 * zijwaarts schuift en waar vier regels tekst naast elkaar moeten passen) en
 * de voetlinks op de landingsbladzijde (20, onderaan een bladzijde voor
 * volwassenen). Die staan hier met opzet niet in.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const bron = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8')

describe('de weg terug in de kopbalk', () => {
  it('heeft een raakvlak van 44, zonder de balk hoger te maken', () => {
    const top = bron('./TopBar.tsx')
    const link = /<Link to="\/" onClick=\{\(\) => sfx\.nav\(\)\} className="([^"]*)"/.exec(top)?.[1] ?? ''
    expect(link, 'de merklink is niet gevonden').not.toBe('')
    // De opvulling maakt het raakvlak hoog, de negatieve marge houdt de balk gelijk.
    expect(link, 'zonder py- is het raakvlak weer 32 pixels').toContain('py-1.5')
    expect(link, 'zonder -my- groeit de balk mee').toContain('-my-1.5')
  })
})

describe('de ontgrendelknop in de kopbalk', () => {
  const top = bron('./TopBar.tsx')

  /**
   * Dezelfde truc als bij de merklink: de opvulling zit op de link en de pil
   * blijft klein, zodat het raakvlak 44 is zonder dat de balk meegroeit.
   * Nagemeten in Chromium op 360, 390 en 820 pixels: 44 pixels hoog, en de
   * balk schuift op geen van de drie zijwaarts.
   */
  it('heeft een raakvlak van 44, zonder de balk hoger te maken', () => {
    const link = /<Link\s+to="\/volledig"[\s\S]*?className="([^"]*)"/.exec(top)?.[1] ?? ''
    expect(link, 'de ontgrendelknop is niet gevonden').not.toBe('')
    expect(link, 'zonder py- is het raakvlak de hoogte van de pil').toContain('py-2.5')
    expect(link, 'zonder -my- groeit de balk mee').toContain('-my-2.5')
  })

  /**
   * Weg zodra er betaald is.
   *
   * Een knop die "koop" zegt tegen iemand die gekocht heeft, is het eerste
   * wat een beoordelaar aanwijst en het eerste waar een klant over mailt.
   * Nagemeten in Chromium: bij `unlocked` staat er geen enkele link naar
   * `/volledig` in de balk.
   */
  it('staat er alleen voor wie nog niet betaald heeft', () => {
    expect(top).toContain('{!state.unlocked && (')
  })

  /**
   * Het woord valt nergens weg, en het slot is getekend en geen emoji.
   *
   * Eerst stond er 🔓 met het woord pas vanaf 400 pixels. Op een telefoon van
   * 390 — de maat waar de meeste mensen op kijken — bleef er een gouden vlek
   * over waar niets aan te zien was. Een lijntekening houdt zijn vorm op elke
   * maat, en het woord hoort er altijd bij te staan.
   */
  it('toont het woord op elke breedte, met een getekend slot', () => {
    expect(top).toContain('<Hangslot />')
    expect(top).not.toContain('🔓')
    expect(top).not.toMatch(/min-\[\d+px\]:inline/)
  })
})

describe('de instellingen', () => {
  const set = bron('../pages/Settings.tsx')

  it('geeft de schakelaars een knop van 44 om een baantje van 32', () => {
    // Het baantje hoort 32 te blijven: een schakelaar van 44 hoog is log.
    // Wat groeit is de knop eromheen, en die zie je niet.
    expect(set).toContain('className="flex h-11 w-14 shrink-0 items-center"')
    expect(set).toMatch(/block h-8 w-14 rounded-full border-2/)
  })

  it('geeft de taalkeuze en het dagdoel dezelfde ondergrens', () => {
    const knoppen = set.match(/className=\{`min-h-11 [^`]*`\}/g) ?? []
    expect(knoppen.length, 'hier hoorden er twee te staan').toBeGreaterThanOrEqual(2)
  })
})

/**
 * Een tweede ronde, over dertien schermen in plaats van twaalf.
 *
 * De veelgestelde vragen zijn sinds de eerste ronde van de landingsbladzijde
 * naar de ouderpagina verhuisd, en daar stonden zeven uitklappers van 24 hoog
 * onder elkaar. De stemkeuze in de instellingen kwam uit op 41 — drie te
 * weinig, en net genoeg om het niet te zien.
 *
 * Wat na afloop nog onder de 44 staat, staat daar met reden:
 *
 * - het pijltje op `/woorden` (36): de strook eronder is zelf 36 hoog, dus een
 *   grotere pijl verbergt precies de knop die je wilde zien. Hij is bovendien
 *   een snelkoppeling — de strook schuift ook met een veeg.
 * - twee links middenin een zin (16 en 36 hoog): dat is de uitzondering die
 *   WCAG 2.2 zelf maakt in 2.5.8, voor een doel waarvan de hoogte bepaald
 *   wordt door de regelafstand van de tekst eromheen.
 */
describe('de tweede ronde langs de raakvlakken', () => {
  it('maakt van een uitklapper een knop van 44, zonder de kaart te verschuiven', () => {
    const src = bron('../pages/Parents.tsx')
    expect(src).toContain('-my-2.5 cursor-pointer list-none py-2.5')
    // Gemeten: de knop is 44 hoog, de kaart 66, en de tekst staat waar hij stond.
  })

  it('houdt de stemkeuze op 44', () => {
    const src = bron('../pages/Settings.tsx')
    expect(src).toContain('max-w-[min(14rem,100%)] rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2.5')
    expect(src).not.toContain('max-w-[min(14rem,100%)] rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 ')
  })

  /**
   * Het naamveld ernaast staat wél op `py-2` en dat is goed: een `input` met
   * acht pixels opvulling, een regel van vierentwintig en twee keer twee
   * randpixels komt precies op vierenveertig uit. Een `select` niet, want die
   * heeft geen regelafstand van zichzelf.
   */
  it('laat het naamveld staan, want dat haalt de 44 al', () => {
    expect(bron('../pages/Settings.tsx')).toContain('className="w-40 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 ')
  })

  /**
   * Het pijltje blijft net onder de 44, en waaróm staat erbij. Zonder die
   * reden wordt het bij de volgende ronde "even rechtgezet" en verbergt het
   * de strook.
   *
   * De strook zelf stond eerst op zesendertig en haalde de 44 dus niet. Dat
   * is nu rechtgezet -- achttien knoppen die een kind met zijn duim moet
   * raken horen niet de enige plek in de app te zijn waar dat niet kan -- en
   * het pijltje schoof mee naar veertig.
   */
  it('de onderwerpknoppen halen de 44', () => {
    const src = bron('../pages/Words.tsx')
    expect(src.match(/inline-flex h-11 items-center whitespace-nowrap rounded-full/g)).toHaveLength(2)
  })

  it('legt bij het pijltje uit waarom het kleiner mag', () => {
    const src = bron('../pages/Words.tsx')
    expect(src).toContain('veertig bij veertig')
    expect(src).toContain('de strook eronder is zelf vierenveertig hoog')
    expect(src).toContain('grid h-10 w-10')
  })
})
