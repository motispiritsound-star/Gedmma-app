import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SITE } from './copy'
import { APP_ID, PATHS, SITE_URL, STORE, appleStoreUrl, playStoreUrl } from './links'
import { LANG_CODES } from '../i18n/languages'
import { ZINSGRENS } from '../content/zinnen'
import { CLIPS } from '../engine/clips'
import { allWords } from '../content/lexicon'
import { ALL_SENTENCES } from '../content/sentences'
import { LETTERS } from '../content/alphabet'
import { UNITS } from '../content/curriculum'

/**
 * The website makes claims with numbers in them. A claim is a promise, and a
 * promise that drifts from the course is the kind of thing a reviewer at
 * Apple counts as a misleading listing — so the numbers are checked against
 * the content rather than trusted.
 */
describe('de getallen op de website', () => {
  const counts = {
    opnames: Object.keys(CLIPS).length,
    woorden: allWords.length,
    zinnen: ALL_SENTENCES.length,
    letters: LETTERS.length,
    units: UNITS.length,
  }

  /**
   * De woorden die nog op een opname wachten — nu geen.
   *
   * Aan het eind van een verschoven stuk viel er een woord zonder klank: zijn
   * opname was bij het knippen nooit weggeschreven. Dat waren er drie, en die
   * zijn opnieuw ingesproken. De lijst blijft staan omdat hij de vraag stelt
   * die ertoe doet: welk woord heeft geen stem? Een leeg antwoord is het enige
   * goede.
   */
  const WACHT_OP_OPNAME: string[] = []

  it('kloppen met de cursus zelf', () => {
    expect(counts).toEqual({
      opnames: 432 - WACHT_OP_OPNAME.length,
      woorden: 304, zinnen: 100, letters: 28, units: 17,
    })
  })

  it('noemt precies de woorden die nog op een stem wachten', () => {
    const zonder = allWords.filter((w) => !(w.id in CLIPS)).map((w) => w.id).sort()
    expect(zonder).toEqual(WACHT_OP_OPNAME)
  })

  for (const lang of LANG_CODES) {
    it(`staan in ${lang} allemaal in de bewijsregel`, () => {
      const line = SITE[lang].heroBewijs
      for (const n of Object.values(counts)) expect(line, lang).toContain(String(n))
    })

    it(`staan in ${lang} allemaal bij de stem`, () => {
      const numbers = SITE[lang].stemPunten.map(([n]) => Number(n))
      expect(numbers, lang).toEqual([counts.opnames, counts.woorden, counts.zinnen, counts.letters])
    })
  }
})

describe('de teksten van de website', () => {
  /** Every leaf of the copy, so an empty string cannot slip through. */
  const leaves = (value: unknown, trail: string[] = []): [string, unknown][] => {
    if (typeof value === 'function') return []
    if (Array.isArray(value)) return value.flatMap((v, i) => leaves(v, [...trail, String(i)]))
    if (value && typeof value === 'object') {
      return Object.entries(value).flatMap(([k, v]) => leaves(v, [...trail, k]))
    }
    return [[trail.join('.'), value]]
  }

  for (const lang of LANG_CODES) {
    it(`zijn er voor ${lang} en nergens leeg`, () => {
      const empty = leaves(SITE[lang]).filter(([, v]) => typeof v !== 'string' || v.trim() === '')
      expect(empty, lang).toEqual([])
    })
  }

  it('hebben in elke taal dezelfde sleutels', () => {
    const keys = (lang: (typeof LANG_CODES)[number]) => leaves(SITE[lang]).map(([k]) => k).sort()
    for (const lang of LANG_CODES) expect(keys(lang), lang).toEqual(keys('nl'))
  })

  it('noemen de app nergens bij zijn oude naam', () => {
    for (const lang of LANG_CODES) {
      const all = leaves(SITE[lang]).map(([, v]) => String(v)).join(' ')
      expect(all, lang).not.toMatch(/Darija Kids|Gedmma|Bladi/)
    }
  })
})

describe('de adressen van de website', () => {
  it('beginnen allemaal met een streep', () => {
    for (const lang of LANG_CODES) {
      for (const path of Object.values(PATHS[lang])) expect(path, `${lang} ${path}`).toMatch(/^\//)
    }
  })

  it('komen geen twee keer voor', () => {
    const all = LANG_CODES.flatMap((lang) => Object.values(PATHS[lang]))
    expect(new Set(all).size).toBe(all.length)
  })

  it('houden de winkelpagina’s van de app op hun plek', () => {
    // Deze drie staan in App Store Connect en in de Play Console. Verhuizen
    // betekent daar handmatig aanpassen, dus dat gebeurt niet per ongeluk.
    expect(PATHS.nl.privacy).toBe('/privacy')
    expect(PATHS.nl.terms).toBe('/voorwaarden')
    expect(PATHS.nl.parents).toBe('/ouders')
  })

  it('wijzen naar het echte domein', () => {
    expect(SITE_URL).toBe('https://darijaforkids.eu')
  })

  it('zijn een echte winkel-link of leeg', () => {
    for (const [winkel, url] of Object.entries(STORE)) {
      if (url) expect(url, winkel).toMatch(/^https:\/\//)
    }
  })
})

/**
 * De twee adressen die op de dag van de lancering in `STORE` komen.
 *
 * `npm run live` zet ze erin, en die dag is de drukste van het project: er
 * staat een goedkeuring binnen, er moet gepost worden, en er kijkt iemand mee.
 * Dat is precies wanneer je een adres verkeerd overtypt, dus wordt het niet
 * overgetypt maar afgeleid.
 */
/**
 * De voorleesknop leeft in een gewoon .js-bestand, want de browser krijgt hem
 * zo. Daardoor kan hij niet importeren uit `src/content/zinnen.ts`, en staat
 * dezelfde zinsgrens er twee keer. Twee kopieën is er één te veel — vandaar
 * deze test, die ze naast elkaar legt.
 */
describe('de lezer op de website', () => {
  const lezer = readFileSync('src/site/lezer.js', 'utf8')

  it('knipt zinnen op dezelfde plek als de rest van het project', () => {
    expect(lezer).toContain(String(ZINSGRENS))
  })

  it('valt niet om zonder spraakmotor', () => {
    // Een browser zonder speechSynthesis moet het boek nog gewoon tonen; alleen
    // de knop hoort weg te zijn. Anders is een oude tablet een lege bladzijde.
    expect(lezer).toContain('if (!spraak) speelknop.hidden = true')
  })

  it('stopt met praten als je de bladzijde verlaat', () => {
    // De spraakmotor van de browser leest anders door in een gesloten tabblad.
    expect(lezer).toContain("addEventListener('pagehide', stop")
  })

  it('geeft de stemmen onze eigen namen', () => {
    // Een toestel noemt zijn stem "Microsoft Maarten Online (Natural) - Dutch
    // (Netherlands)". Dat is een productnummer, en het staat in een keuzelijst
    // onder een verhaal dat een kind meeleest.
    for (const naam of ['Amir', 'Adam', 'Sarah', 'Yousra', 'Lina']) {
      expect(lezer, naam).toContain(`'${naam}'`)
    }
  })

  it('plakt geen vrouwennaam op een mannenstem', () => {
    // De namen worden per groep uitgedeeld en de lijst wordt niet volgemaakt
    // met wat er toevallig over is.
    expect(lezer).toContain('VERTELLERS.man[i]')
    expect(lezer).toContain('VERTELLERS.vrouw[i]')
    expect(lezer).not.toContain('VERTELLERS.man.slice(mannen.length)')
  })

  it('maakt zijn luisteraars ook weer los', () => {
    // Een prentenboek zet bij elke bladzijde een nieuwe balk neer. Blijven de
    // oude luisteraars hangen, dan bouwt na dertig keer bladeren elke
    // verandering van stemmen dertig keuzelijsten opnieuw op.
    expect(lezer).toContain("removeEventListener('voiceschanged', opnieuwVullen)")
    expect(lezer).toContain("removeEventListener('pagehide', stop)")
  })
})

describe('de winkeladressen', () => {
  it('halen het Apple ID uit alles wat App Store Connect geeft', () => {
    const goed = 'https://apps.apple.com/app/id6751234567'
    expect(appleStoreUrl('6751234567')).toBe(goed)
    expect(appleStoreUrl('id6751234567')).toBe(goed)
    expect(appleStoreUrl('https://apps.apple.com/nl/app/darijaforkids/id6751234567')).toBe(goed)
    expect(appleStoreUrl('https://apps.apple.com/nl/app/darijaforkids/id6751234567?l=nl')).toBe(goed)
  })

  it('weigeren iets wat geen Apple ID is', () => {
    // Een Play-adres in het Apple-veld is de fout die je op de dag zelf maakt.
    expect(() => appleStoreUrl(playStoreUrl())).toThrow()
    expect(() => appleStoreUrl('')).toThrow()
  })

  it('bouwen het Play-adres uit het application id', () => {
    expect(playStoreUrl()).toBe(`https://play.google.com/store/apps/details?id=${APP_ID}`)
  })

  it('gebruiken hetzelfde application id als Android', () => {
    // Loopt dit uiteen, dan wijst de knop op de website naar een app die niet
    // bestaat — en dat merk je pas als de eerste bezoeker klaagt.
    const gradle = readFileSync('android/app/build.gradle', 'utf8')
    expect(gradle).toContain(`applicationId "${APP_ID}"`)
  })
})

/**
 * De winkelteksten, tegen de limieten van de winkels zelf.
 *
 * Apple kapt een beschrijving niet af maar weigert hem: het veld neemt er
 * vierduizend en geen teken meer. Dat merk je pas als je staat te plakken in
 * een console, met de app al aangemaakt — en dan in zes talen achter elkaar.
 * Vandaar hier, waar het een seconde kost.
 */
describe('de winkelteksten', () => {
  const EULA = 'https://www.apple.com/legal/internet-services/itunes/dev/stdeula/'

  const LIMIET: Record<string, number> = {
    Naam: 30, Name: 30, Titel: 30, Title: 30, Titre: 30, Título: 30, Titolo: 30,
    Ondertitel: 30, Subtitle: 30, Untertitel: 30, Subtítulo: 30, Sottotitolo: 30,
    Trefwoorden: 100, Keywords: 100, Schlüsselwörter: 100, 'Mots-clés': 100,
    'Palabras clave': 100, 'Parole chiave': 100,
  }

  for (const lang of LANG_CODES) {
    const tekst = readFileSync(new URL(`../../store/listing.${lang}.md`, import.meta.url), 'utf8')

    it(`blijft in ${lang} onder de vierduizend tekens`, () => {
      const blokken = [...tekst.matchAll(/```\n([\s\S]*?)\n```/g)].map((m) => m[1]!)
      expect(blokken.length, 'geen beschrijving gevonden').toBeGreaterThan(0)
      const langste = blokken.reduce((a, b) => (a.length > b.length ? a : b))
      expect(langste.length, `beschrijving in ${lang}`).toBeLessThanOrEqual(4000)
    })

    /**
     * Apple wees versie 1.0 af op richtlijn 3.1.2 omdat deze regel er niet
     * stond: een app met een doorlopend abonnement moet in de winkeltekst
     * zelf naar de gebruiksvoorwaarden wijzen, en niet alleen in de app.
     * Het is Apple's eigen standaardtekst, dus die kunnen ze niet afkeuren.
     */
    it(`wijst in ${lang} naar de gebruiksvoorwaarden`, () => {
      const blokken = [...tekst.matchAll(/```\n([\s\S]*?)\n```/g)].map((m) => m[1]!)
      const langste = blokken.reduce((a, b) => (a.length > b.length ? a : b))
      expect(langste, `EULA-link ontbreekt in ${lang}`).toContain(EULA)
    })

    it(`houdt zich in ${lang} aan de korte velden`, () => {
      const velden = [...tekst.matchAll(/\*\*([^*(]+?)\s*\(m[aá]x\.?\s*(\d+)[^)]*\)\*\*\n`([^`]*)`/g)]
      expect(velden.length, `geen velden gevonden in ${lang}`).toBeGreaterThan(0)
      for (const m of velden) {
        const naam = m[1]!.trim()
        const max = LIMIET[naam] ?? Number(m[2])
        expect(m[3]!.length, `${lang} · ${naam}`).toBeLessThanOrEqual(max)
      }
    })
  }
})
