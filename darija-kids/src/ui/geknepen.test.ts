/**
 * Een tekstkolom naast een knop mag niet tot niets krimpen.
 *
 * `flex-1` is `flex: 1 1 0%`: de kolom vraagt nul breedte en mag groeien.
 * Samen met `flex-wrap` gaat dat mis op een telefoon — alles "past" naast
 * elkaar, dus de rij breekt nooit af, en de tekst krijgt wat er overblijft
 * naast een knop die niet krimpt.
 *
 * Nagemeten op 390px: de kaart "De bonus van vandaag" gaf de tekst 91 pixels,
 * vier woorden over drie regels. De slotkaart op /woorden gaf er 158, twintig
 * woorden over vijf regels. Het ergst was de afsluiter van /profiel, met een
 * mascotte én een knop ernaast: 64 pixels, veertien woorden over elf regels. Geen van beide loopt buiten beeld, dus het
 * krapte-harnas zag er niets van: het is geen overloop maar een kolom die zo
 * smal wordt dat er één woord per regel in past.
 *
 * Met een basis vraagt de tekst eerst zijn ruimte, en gaat de knop naar de
 * volgende regel zodra die er niet meer naast kan. Na afloop gemeten: 275 tot
 * 287 pixels, de kop weer op één regel.
 */
import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

/** De vier rijen die een knop naast tekst zetten en kunnen afbreken. */
const RIJEN: Array<[string, string]> = [
  ['de bonuskaart', '../pages/Bonus.tsx'],
  ['het slot op /verhalen', '../pages/Stories.tsx'],
  ['het slot op /woorden', '../pages/Words.tsx'],
  ['de kaart "geluid staat uit"', '../ui/GeluidUit.tsx'],
  ['de afsluiter van /profiel', '../pages/Profile.tsx'],
]

describe('tekst naast een knop', () => {
  it.each(RIJEN)('%s vraagt eerst zijn eigen breedte', (_naam, pad) => {
    expect(lees(pad)).toMatch(/min-w-0 grow basis-48/)
  })

  /**
   * En wel op de goede regel. In Words.tsx staat nog een `min-w-0 flex-1`, op
   * de woordkaart zelf — daar staat geen knop naast maar een klein
   * sterktelabel dat wel mag krimpen, dus daar klopt het.
   */
  it.each([
    ['../pages/Bonus.tsx', '<div className="min-w-0 grow basis-48">'],
    ['../pages/Stories.tsx', '<p className="min-w-0 grow basis-48 text-sm">{t.stories.slotUitleg}</p>'],
    ['../pages/Words.tsx', '<p className="min-w-0 grow basis-48 text-sm">{t.words.slotUitleg}</p>'],
    ['../ui/GeluidUit.tsx', '<div className="min-w-0 grow basis-48">'],
    ['../pages/Profile.tsx', '<p className="min-w-0 grow basis-48 text-sm text-[var(--ink-soft)]">'],
  ])('%s zet het op de rij met de knop', (pad, regel) => {
    expect(lees(pad)).toContain(regel)
  })
})
