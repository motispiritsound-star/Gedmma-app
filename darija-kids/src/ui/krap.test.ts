/**
 * Een kleine telefoon met de grootste letters.
 *
 * Dat is geen verzonnen geval: 320px breed is een iPhone SE, en wie de
 * letters op de grootste stand zet krijgt een wortelgrootte van rond de 24px.
 * Samen is dat het krapste wat de app moet overleven, en dat deed hij niet —
 * nagemeten over dertien bladzijden in zes talen liep er op elke bladzijde
 * iets buiten beeld, tot 78px toe. Dan schuift de hele app opzij, met de
 * kopbalk en de knoppen erin.
 *
 * Vijf oorzaken, allemaal van dezelfde soort: iets wat niet mag krimpen of
 * niet mag afbreken. Ze staan hieronder stuk voor stuk vast, want geen van
 * vijf is te zien bij een normale lettergrootte — ze verdwijnen bij de eerste
 * de beste opruimbeurt zonder dat iemand het merkt.
 *
 * Gemeten na afloop: dertien bladzijden bij 390/16, 320/16, 390/24, 320/24 in
 * nl/de/fr/es/it en 768/24, alles binnen beeld.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

describe('wat er niet meer buiten beeld mag lopen', () => {
  /**
   * Het hart van de reparatie. Een Duits woord als "Nutzungsbedingungen" is
   * negentien letters, en die kop vroeg 374px in een vak van 272. Op `body`,
   * want het erft over — dan geldt het ook voor de volgende bladzijde die
   * iemand erbij maakt.
   */
  it('laat een te lang woord afbreken in plaats van uitlopen', () => {
    const css = lees('../index.css')
    expect(css).toMatch(/body \{[^}]*overflow-wrap: break-word;/s)
    // `anywhere` zou ook gewone zinnen midden in een woord breken.
    expect(css).not.toContain('overflow-wrap: anywhere')
  })

  it('laat de tellers in de kopbalk onder elkaar vallen', () => {
    const bron = lees('./TopBar.tsx')
    expect(bron).toContain('<div className="ms-auto flex flex-wrap items-center gap-2.5 text-sm font-bold">')
    // `shrink-0` hier was de fout: dan schuift het blok als geheel naar buiten.
    expect(bron).not.toContain('ms-auto flex shrink-0 items-center gap-2.5')
  })

  it('laat het niveaupilletje onder de titel van een unit vallen', () => {
    expect(lees('../pages/Learn.tsx')).toContain('<div className="flex flex-wrap items-center gap-2">')
  })

  /**
   * Een tekst naast een vinkje in een flex-rij krimpt niet onder zijn eigen
   * minimumbreedte zolang `min-w-0` ontbreekt. Dat is de standaardval van
   * flexbox en hij komt in deze app op vier plekken voor.
   */
  it('laat tekst naast een icoontje wél krimpen', () => {
    expect(lees('../pages/Unlock.tsx')).toContain('<span className="min-w-0">{line}</span>')
    expect(lees('../pages/Profile.tsx')).toContain('className="flex min-w-0 flex-1 flex-col items-center gap-1"')
    const operator = lees('./Operator.tsx')
    expect(operator).toContain('min-w-0 break-words font-bold')
    expect(operator).toContain('min-w-0 break-words')
  })

  /**
   * `max-w-56` is veertien rem. Bij een wortelgrootte van 24px is dat 336px,
   * en dat past niet op een scherm van 320. Een maat in rem die bedoeld is als
   * bovengrens moet die van het scherm erbij nemen.
   */
  it('houdt de keuzelijst in de instellingen binnen het scherm', () => {
    const bron = lees('../pages/Settings.tsx')
    expect(bron).toContain('max-w-[min(14rem,100%)]')
    expect(bron).not.toMatch(/className="max-w-56 /)
  })
})
