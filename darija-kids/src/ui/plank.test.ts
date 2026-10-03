/**
 * Wat er op de plank níét mag staan.
 *
 * Deze bladzijde heeft zeventien vakken en de meeste zijn in het begin leeg.
 * De eerste versie zette er een slotje in met het percentage van de unit
 * eronder, zoals het leerpad dat doet, en daarmee werd de plank een lijstje met
 * werk: zestien keer "0%" en een hangslot, voor een kind dat net zijn eerste
 * diploma had. Precies wat de app nergens anders doet.
 *
 * Wat hieronder vastligt is dus vooral de afwezigheid van dingen — en dat is
 * het soort regel dat bij een opruimbeurt terugkomt omdat "het pad het ook zo
 * doet". Daarnaast staan hier de drie grenzen die het idee overeind houden: de
 * rekensom voor een handtekening, geen melding, en niets dat het toestel
 * verlaat.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STRINGS, LANG_CODES } from '../i18n'
import { UNITS } from '../content/curriculum'

const lees = (pad: string): string =>
  readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')

/** Zonder commentaar, anders toetst een test zijn eigen toelichting. */
const kaal = (bron: string): string =>
  bron.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '')

const plank = lees('../pages/Diplomas.tsx')
const diploma = lees('./Diploma.tsx')
const engine = lees('../engine/diploma.ts')

describe('een leeg vak zeurt niet', () => {
  it('heeft geen slotje', () => {
    expect(kaal(plank)).not.toContain('🔒')
  })

  /**
   * Het balkje komt er pas bij zodra er in die unit werkelijk iets gebeurd is.
   * Dan is het geen achterstand maar voortgang.
   */
  it('zet het voortgangsbalkje alleen bij een unit waarin iets gebeurd is', () => {
    expect(kaal(plank)).toContain('{pct > 0 && <Progress')
  })

  /** Geen knop die niets doet: er is in een leeg vak niets om aan te tikken. */
  it('is geen knop', () => {
    const vak = plank.slice(plank.indexOf('if (!diploma) {'), plank.indexOf('return (\n              <li key={unit.id} className="min-w-0">\n                <Card\n'))
    expect(vak).not.toContain('<button')
    expect(vak).not.toContain('onClick')
  })

  /** De stippellijn is de vorm van wat er komt; de volle rand is wat er is. */
  it('staat er met een stippellijn', () => {
    expect(plank).toContain('border-2 border-dashed')
  })
})

describe('een handtekening komt van een volwassene', () => {
  /**
   * Zonder de rekensom tikt een kind van acht zelf "mama" in het veld, en dan
   * is de hele plank een stickervel. Dit is de enige reden dat die poort hier
   * staat — niet omdat een winkel hem vraagt.
   */
  it('het paneel opent via de ouderpoort, met zijn eigen vraag', () => {
    expect(diploma).toContain('reden="diploma"')
    expect(diploma).toContain('if (poortAl()) setVraag(true)')
    expect(diploma).toContain('else setPoort(true)')
  })

  it('en de poort heeft voor dit geval een eigen zin in alle zes de talen', () => {
    for (const taal of LANG_CODES) {
      const zin = STRINGS[taal].unlock.poortBodyDiploma('3 × 4')
      expect(zin, taal).toContain('3 × 4')
      expect(zin.length, taal).toBeGreaterThan(20)
    }
  })

  /**
   * `onderteken` zelf kijkt niet of er een volwassene bij was — dat kan het
   * niet. Het staat daarom op één plek achter de poort, en nergens anders.
   * Een tweede aanroep elders is een achterdeur.
   */
  it('wordt nergens anders aangeroepen dan in het paneel', () => {
    for (const pad of ['../pages/Diplomas.tsx', '../pages/Parents.tsx', '../pages/Profile.tsx', '../pages/LessonPlayer.tsx']) {
      expect(kaal(lees(pad)), pad).not.toContain('onderteken(')
    }
    expect(kaal(diploma)).toContain('onderteken(unit.id, naam, woord)')
  })
})

describe('er gaat niets naar buiten en niemand krijgt een melding', () => {
  /**
   * De naam die een ouder eronder zet is een voornaam in localStorage, en gaat
   * net zo weinig de deur uit als de naam van het kind. Geen server, geen
   * deelknop, geen e-mail: dat is wat deze app in de kindercategorie houdt.
   */
  it('geen netwerk en geen deelknop in het hele onderdeel', () => {
    for (const [naam, bron] of [['plank', plank], ['paneel', diploma], ['engine', engine]] as const) {
      for (const verboden of ['fetch(', 'XMLHttpRequest', 'navigator.share', 'navigator.clipboard', 'mailto:']) {
        expect(kaal(bron), `${naam}: ${verboden}`).not.toContain(verboden)
      }
    }
  })

  /**
   * Een melding naar een kind die iets aanprijst is verboden, en een melding
   * voor een ouder mag alleen als hij er zelf om gevraagd heeft. Hier vraagt
   * niemand erom, dus er is er geen — ook niet voor een nieuwe handtekening.
   */
  it('raakt de wekker niet aan', () => {
    for (const bron of [plank, diploma, engine]) {
      expect(bron).not.toContain('herinnering')
      expect(bron).not.toContain('LocalNotifications')
      expect(bron).not.toContain('zetHerinnering')
    }
  })

  /** Afdrukken gaat met de browser zelf en niet met een bibliotheek erbij. */
  it('drukt af met window.print en zonder nieuwe afhankelijkheid', () => {
    expect(plank).toContain('window.print()')
    // In een WebView zonder afdruklaag bestaat hij niet, en dan hoort de knop
    // er ook niet te staan in plaats van niets te doen.
    expect(plank).toContain("typeof window.print === 'function'")
    const pakket = JSON.parse(lees('../../package.json')) as { dependencies: Record<string, string> }
    for (const naam of Object.keys(pakket.dependencies)) {
      expect(naam, 'hier is een pdf- of deelbibliotheek bij gekomen').not.toMatch(
        /pdf|html2canvas|print|share/i,
      )
    }
  })
})

describe('waar de plank te vinden is', () => {
  it('heeft een eigen adres', () => {
    expect(lees('../App.tsx')).toContain('<Route path="/diplomas" element={<Diplomas />} />')
  })

  /**
   * Vijf tabs zijn er al en een zesde haalt ruimte weg van het pad, dus de
   * plank hangt aan /profiel en /ouders — net als de geschiedeniskaarten.
   */
  it('staat op het profiel en op de ouderbladzijde', () => {
    expect(lees('../pages/Profile.tsx')).toContain('<Link to="/diplomas"')
    expect(lees('../pages/Parents.tsx')).toContain('<Link to="/diplomas" className="inline-block">')
  })

  /**
   * De fout die bij het bouwen écht gemaakt is: het uitreiken hing alleen aan
   * het eind van een les. Dan begint de plank van iemand die de app al een jaar
   * heeft bij de unit die hij hierna doet — zestien lege vakken voor een kind
   * dat alles al had gehaald.
   */
  it('reikt uit bij het opstarten én na een les', () => {
    expect(kaal(lees('../App.tsx'))).toContain('useEffect(() => { reikDiplomasUit() }, [])')
    expect(kaal(lees('../pages/LessonPlayer.tsx'))).toContain('setDiplomas(reikDiplomasUit())')
  })
})

describe('de teksten van de plank', () => {
  it('staan in alle zes de talen en zijn nergens leeg', () => {
    for (const taal of LANG_CODES) {
      const d = STRINGS[taal].diploma
      expect(d.titel, taal).toBeTruthy()
      expect(d.handtekening, taal).toBeTruthy()
      expect(d.tekenKnop, taal).toBeTruthy()
      expect(d.plank(4, UNITS.length), taal).toContain(String(UNITS.length))
      expect(d.wachtAantal(1), taal).not.toBe(d.wachtAantal(3))
      expect(STRINGS[taal].parents.samenStil.length, taal).toBeGreaterThan(40)
      expect(STRINGS[taal].lesson.diplomaTitel, taal).toBeTruthy()
    }
  })

  /**
   * Vier voorstellen, in elke taal vier. Drie zou in één taal een rij van drie
   * geven en in de rest van vier, en dan is het paneel per taal een ander
   * paneel.
   */
  it('hebben in elke taal vier voorstellen voor een compliment', () => {
    for (const taal of LANG_CODES) {
      expect(STRINGS[taal].diploma.voorstellen, taal).toHaveLength(4)
      for (const v of STRINGS[taal].diploma.voorstellen) expect(v.length, taal).toBeGreaterThan(8)
    }
  })

  /**
   * Er stond "1 lessen afgerond · 1 dagen geoefend" in het paneel waarin een
   * ouder ondertekent — precies de regel die hij leest op het moment dat hij
   * een compliment gaat geven. Enkelvoud hoort er dus in alle zes in.
   */
  it('tellen in enkelvoud als het er één is', () => {
    for (const taal of LANG_CODES) {
      const een = STRINGS[taal].diploma.sindsRegel(1, 1, 7)
      expect(een, taal).not.toBe(STRINGS[taal].diploma.sindsRegel(2, 2, 7))
      expect(een, `${taal}: "1 lessen"`).not.toMatch(/\b1 \w+(s|en|i|e)\b.*\b1 \w+(s|en|i|e)\b/)
    }
  })

  /**
   * In de lijst "wacht op een handtekening" staan de knoppen drie keer onder
   * elkaar. Met de hele zin erop liep de knop op 320 pixels in het Duits over
   * drie regels; op een diploma dat je openklapt staat hij alleen en mag hij
   * wél de hele zin zijn.
   */
  it('hebben een korte knop voor de lijst en een lange voor het diploma', () => {
    for (const taal of LANG_CODES) {
      const d = STRINGS[taal].diploma
      expect(d.laatZienKort.length, taal).toBeLessThan(d.laatZien.length)
      expect(d.tekenKort.length, taal).toBeLessThanOrEqual(d.tekenKnop.length)
    }
    expect(plank).toContain('{t.diploma.laatZienKort}')
    expect(lees('../pages/Parents.tsx')).toContain('{t.diploma.tekenKort}')
  })

  /**
   * Niet zeuren is ook een eigenschap van de tekst. "Nog niet", "mist" en
   * "moet" horen hier niet te staan: een leeg vak zegt wat er komt.
   */
  it('zeuren niet', () => {
    const nl = STRINGS.nl.diploma
    const alles = [nl.plankLeeg, nl.plankBezig, nl.uitleg, nl.wacht, nl.wachtAantal(3)].join(' ').toLowerCase()
    for (const woord of ['nog niet', 'mist', 'je moet', 'vergeet']) {
      expect(alles, woord).not.toContain(woord)
    }
  })
})

describe('wat een vinger moet kunnen raken', () => {
  /**
   * De vier voorstellen staan op een telefoon onder elkaar. Apple en Google
   * houden allebei 44 pixels aan, en `py-1` zou er 28 van maken.
   */
  it('de voorstellen voor een compliment zijn 44 hoog', () => {
    const chip = /aria-pressed=\{woord === v\}[\s\S]{0,220}?className=\{`([^`]*)`/.exec(diploma)?.[1] ?? ''
    expect(chip, 'de knop met een voorstel is niet gevonden').not.toBe('')
    expect(chip, 'zonder py-2.5 is het raakvlak 28 pixels').toContain('py-2.5')
  })

  /** Het naamveld is het enige veld dat verplicht is; `py-2.5` maakt hem 44. */
  it('het naamveld is 44 hoog', () => {
    const veld = /id="teken-naam"[\s\S]*?className="([^"]*)"/.exec(diploma)?.[1] ?? ''
    expect(veld).toContain('py-2.5')
  })
})

describe('de oorkonde zelf', () => {
  /**
   * De rand is `--accent-600` en niet `--accent-500`: een rand is iets grafisch
   * en moet 3 op 1 halen. Nagerekend haalt op wit de lichtste van de vier
   * (saffraan) 3,19 en op de donkere kaart de donkerste (terra) 3,66.
   * `--accent-500` als tekst haalt 2,2 en staat er daarom niet op.
   */
  it('gebruikt de gekozen kleur alleen voor de rand', () => {
    expect(diploma).toContain('border-[var(--accent-600)]')
    expect(diploma).not.toContain('text-[var(--accent-500)]')
    expect(diploma).not.toContain('text-[var(--accent-400)]')
  })

  /**
   * Eén component voor het scherm en voor het papier. Twee versies lopen uit
   * elkaar bij de eerste wijziging, en dan staat er op het vel iets anders dan
   * wat het kind heeft zien ontstaan.
   */
  it('is op papier dezelfde component als op het scherm', () => {
    const papier = plank.slice(plank.indexOf('<div className="op-papier">'))
    expect(papier).toContain('<Oorkonde unit={unit} diploma={state.diplomas[unit.id]!} />')
    expect(diploma).not.toContain('AfdrukOorkonde')
  })

  /**
   * Naar beneden afgerond. Met `Math.round` kreeg een unit met 83% er al drie
   * khatims, en dan zegt het plaatje iets anders dan de regel eronder.
   */
  it('rondt de drie khatims naar beneden af', () => {
    expect(diploma).toContain('Math.floor((gehaald / max) * 3)')
    expect(diploma).not.toContain('Math.round((gehaald / max)')
  })
})
