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
