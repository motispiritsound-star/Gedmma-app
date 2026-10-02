/**
 * Waar een koper uitkomt nadat hij betaald heeft.
 *
 * Nergens. Het slot ging open, het slotscherm wisselde zijn kaartje om voor
 * "volledige toegang", en daar bleef je staan. Voor wie net zestig euro heeft
 * uitgegeven is dat te weinig — en wat een mens op dat moment wil is niet
 * meteen een les maar zichzelf: een naam en een dier op de kaart.
 *
 * Dat kon ook niet op één plek. De naam stond in Instellingen, de avatar in
 * Profiel, dus wie zichzelf wilde invullen moest twee schermen langs en op het
 * ene zoeken wat op het andere te zien is.
 *
 * Nu: na een verse aankoop door naar `/profiel?welkom=1`, waar naam én avatar
 * bij elkaar staan, met een regel die zegt waarom je daar bent.
 */
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../i18n'
import { LANG_CODES } from '../i18n/languages'

const lees = (pad: string) => readFileSync(new URL(pad, import.meta.url), 'utf8').replace(/\r\n/g, '\n')
const unlock = lees('./Unlock.tsx')
const profiel = lees('./Profile.tsx')
const instellingen = lees('./Settings.tsx')

describe('de sprong na het betalen', () => {
  it('gaat naar het profiel, met het welkom erbij', () => {
    expect(unlock).toContain("navigate('/profiel?welkom=1')")
  })

  /**
   * De overgang, niet de waarde. Wie al betaalt en dit scherm opent om zijn
   * abonnement te beheren hoort te blijven staan waar hij is; alleen de sprong
   * van nee naar ja is een verse aankoop.
   */
  it('alleen bij de sprong van nee naar ja', () => {
    expect(unlock).toContain('const wasAbonnee = useRef(subscribed)')
    expect(unlock).toContain('const vers = subscribed && !wasAbonnee.current')
    expect(unlock).toContain('if (vers) navigate')
  })

  /**
   * Op iOS komt het antwoord van de winkel ná het venster van Apple, soms een
   * paar tellen later. Een effect op `subscribed` vangt dat; navigeren direct
   * na `subscribe()` zou te vroeg zijn.
   */
  it('en hangt aan wat de winkel zegt, niet aan de knop', () => {
    expect(unlock).toMatch(/\}, \[subscribed, navigate\]\)/)
  })
})

describe('het profiel als eerste scherm', () => {
  it('draagt het naamveld', () => {
    expect(profiel).toContain('id="profielnaam"')
    expect(profiel).toContain('setState({ name: e.target.value.slice(0, 24) })')
  })

  /** Hetzelfde stukje staat, dus de twee schermen lopen niet uit elkaar. */
  it('en Instellingen houdt het zijne', () => {
    expect(instellingen).toContain('setState({ name: e.target.value.slice(0, 24) })')
  })

  it('en de avatars staan er nu naast, niet op een andere bladzijde', () => {
    const kaart = profiel.slice(profiel.indexOf('id="profielnaam"'), profiel.indexOf('AVATARS.map') + 200)
    expect(kaart).toContain('AVATARS.map')
  })

  /**
   * Een `label` en geen plaatshouder. Die verdwijnt zodra er iets staat, en
   * precies dán wil een schermlezer horen wat er ingevuld wordt — dezelfde
   * reden waarom het veld in Instellingen een `aria-label` kreeg.
   */
  it('en het veld heeft een naam voor wie het niet ziet', () => {
    expect(profiel).toContain('htmlFor="profielnaam"')
  })

  /** Het welkom hoort één keer. Een zoekparameter is weg zodra je terugkomt. */
  it('het welkom hangt aan de zoekparameter en nergens anders', () => {
    expect(profiel).toContain("params.get('welkom') === '1'")
    expect(profiel).toContain('{welkom && (')
  })

  /** De cursus klaarzetten, maar het toetsenbord niet opengooien. */
  it('en zet de cursor op het veld waar je voor kwam', () => {
    expect(profiel).toContain('naamVeld.current?.focus({ preventScroll: true })')
  })
})

describe('de twee regels', () => {
  it('staan in alle zes de talen', () => {
    for (const code of LANG_CODES) {
      const p = STRINGS[code].profile
      expect(p.welkomTitel, code).toBeTruthy()
      expect(p.welkomUitleg, code).toBeTruthy()
    }
  })

  /** Zes keer dezelfde zin is geen vertaling. */
  it('en zijn echt vertaald, niet gekopieerd', () => {
    const titels = LANG_CODES.map((c) => STRINGS[c].profile.welkomTitel)
    expect(new Set(titels).size).toBe(LANG_CODES.length)
  })

  /** Kort genoeg om op een telefoon van 320 pixels niet over vier regels te gaan. */
  it('en blijven kort', () => {
    for (const code of LANG_CODES) {
      expect(STRINGS[code].profile.welkomTitel.length, code).toBeLessThanOrEqual(40)
      expect(STRINGS[code].profile.welkomUitleg.length, code).toBeLessThanOrEqual(110)
    }
  })
})
