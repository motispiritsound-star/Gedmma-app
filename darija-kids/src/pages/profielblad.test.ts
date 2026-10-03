/**
 * De profielbladzijde: van gegevensblad naar iets om trots op te zijn.
 *
 * En één echte bouwfout onderweg: de weekgrafiek tekende nooit iets. De rij
 * stond op `items-end`, dus elke kolom was zo hoog als zijn inhoud — het
 * dagletterje, twintig pixels — en een staaf met een hoogte in procenten
 * binnen een vak zonder eigen hoogte is nul pixels hoog. Alle zeven staafjes
 * waren altijd onzichtbaar; je zag zeven letters en een stippellijn. Niemand
 * had het gemeld, want een grafiek die niets toont ziet eruit als een grafiek
 * waarin niets gebeurd is.
 *
 * Wat hier verder vastligt zijn de vier dingen die een criticus eruit haalde
 * nadat het ontwerp al klaar was. Alle vier zijn het metingen en geen smaak,
 * en alle vier zijn ze het soort dat terugkomt bij de volgende verbouwing.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const profiel = lees('./Profile.tsx')
const motief = lees('../ui/Motief.tsx')
const khatim = lees('../ui/Khatim.tsx')
const kit = lees('../ui/kit.tsx')

describe('de weekgrafiek', () => {
  it('geeft de kolommen een eigen hoogte, anders is elke staaf nul', () => {
    expect(profiel).toContain('items-stretch')
    expect(profiel).not.toContain('h-44 items-end')
  })

  /**
   * Het getal boven de staaf van vandaag kan niet meer boven het vak uit.
   *
   * Zonder bovengrens ging het mis zodra vandaag de hoogste dag van de week
   * is — de gewone toestand voor een kind dat net gespeeld heeft, want de piek
   * is het hoogste van het dagdoel en de beste dag. Gemeten op 390 begon het
   * getal 2,5 pixel binnen de ondertitel; op 320 in het Duits met vier cijfers
   * brak het af tot "123" en "4" en overlapte het 19 pixels.
   */
  it('en houdt het getal van vandaag binnen de grafiek', () => {
    expect(profiel).toContain('Math.min(hoog, 86)')
    expect(profiel).toContain('whitespace-nowrap')
    // `min()` in CSS zou korter zijn, maar dat kent een WebView van Android 7
    // niet, en de bouw mikt op es2015 juist voor dat toestel.
    expect(profiel).not.toContain('calc(min(')
  })

  /**
   * De pil van vandaag haalde tegen de witte kaart 2,15 op 1 bij saffraan — de
   * kleur die een kind krijgt als het niets kiest — waar 3 de norm is. De app
   * heeft hier al een afspraak voor: `Button` zet accent-500 nooit zonder
   * accent-600 eromheen.
   */
  it('en de pil van vandaag heeft een rand, zoals elke knop in die kleur', () => {
    expect(profiel).toContain('ring-1 ring-[var(--accent-600)] dark:ring-[var(--accent-400)]')
  })
})

describe('een gesloten insigne', () => {
  /** Het is een knop, dus zijn staat valt onder de 3 op 1 van richtlijn 1.4.11. */
  it('heeft een omtrek die je ziet', () => {
    expect(motief).toContain('opacity={dekking ?? (vol ? 0.2 : 0.8)}')
  })

  /**
   * En het zegel erin. `Khatim` had `opacity={filled ? 1 : 0.28}` hard in zich,
   * en dat getal hoort bij een rij van drie sterren naast elkaar — daar is
   * bleek goed. Middenin een knop is het 1,51 op 1, en dan draagt het een
   * staat die niemand ziet.
   */
  it('en een zegel dat je ziet, zonder de lessterren te raken', () => {
    expect(khatim).toContain('leegDekking = 0.28')
    expect(khatim).toContain('opacity={filled ? 1 : leegDekking}')
    expect(profiel).toContain('leegDekking={0.85}')
  })

  /**
   * Een `aria-label` vervangt de inhoud van een knop. Met alleen de naam erin
   * werd een behaald insigne voorgelezen als "Eerste stap" en was de regel die
   * eronder staat — "Rond je eerste les af" — weg. Vóór de verbouwing was het
   * geen knop en werden beide regels gewoon gelezen.
   */
  it('en wordt voorgelezen met zijn hint erbij, behaald of niet', () => {
    expect(profiel).toContain('aria-label={behaald ? `${naam} — ${hint}` : `${naam} — ${hint} (${nietBehaald})`}')
  })

  /**
   * Achttien insignes zijn achttien knoppen, en `sfx.badge()` is de fanfare
   * plus een zware trilling zonder rem, met een poel van acht
   * geluidselementen. Eroverheen roffelen liet acht fanfares over elkaar lopen
   * terwijl het toestel achttien keer trilde.
   */
  it('en de fanfare komt hoogstens één keer per 600 milliseconde', () => {
    expect(profiel).toContain('nu - laatsteJuich.current < 600')
    expect(profiel).toContain('if (behaald && !snel) sfx.badge()')
  })
})

describe('de rij van vier getallen', () => {
  /**
   * Die stond op /profiel als een eigen `Tegel` naast de `Stat` uit kit.tsx,
   * met een plaat onder de emoji die de andere drie bladzijden niet hadden.
   * Dan is /profiel de vreemde bladzijde terwijl het dezelfde rij is.
   */
  it('komt op alle vier de bladzijden uit dezelfde Stat', () => {
    expect(profiel).not.toContain('function Tegel')
    expect(profiel).toContain('<Stat index={0}')
    expect(kit).toContain('<Plaat vol />')
  })

  /** En de plaat staat op één plek, naast het medaillon waar hij familie van is. */
  it('en de plaat eronder staat in Motief.tsx', () => {
    expect(motief).toContain('export function Plaat')
    expect(profiel).not.toContain('function Rozet')
  })
})

describe('de richel onder een kaart die indrukt', () => {
  /**
   * `--shadow-press` werd vervángen door het hoogtetoken, en dan is de harde
   * lijn van vier pixels weg — juist de lijn waar `.btn3d:active` zijn
   * `translateY(4px)` op landt. Deze kaarten zakten in het niets terwijl elke
   * `Button` op zijn eigen rand zakt: twee gedragingen onder dezelfde klasse.
   */
  it('blijft staan als er een hoogte bij komt', () => {
    expect(profiel).toContain("'--shadow-press': `0 4px 0 0 var(--richel), var(${token})`")
    const css = lees('../index.css')
    expect(css).toContain('--richel: rgb(0 0 0 / 0.16)')
    expect(css).toContain('--shadow-press: 0 4px 0 0 var(--richel)')
  })
})
