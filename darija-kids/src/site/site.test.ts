import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { SITE } from './copy'
import { APP_ID, PATHS, SITE_URL, STORE, appleStoreUrl, playStoreUrl } from './links'
import { LANG_CODES } from '../i18n/languages'
import { ZINSGRENS } from '../content/zinnen'
import { OPERATOR, traderKnown } from '../content/operator'
import { CLIPS } from '../engine/clips'
import { allWords } from '../content/lexicon'
import { ALL_SENTENCES } from '../content/sentences'
import { LETTERS } from '../content/alphabet'
import { UNITS } from '../content/curriculum'
import { VERTALINGEN } from '../content/prentenboek-talen'
import { SLEUTEL_VERTALINGEN } from '../content/sleutels-talen'
import { DELEN } from './delen'

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
/**
 * Wie er achter de website zit, moet op de website staan.
 *
 * Dat is geen nettigheid: artikel 3:15d BW wil naam, adres en een manier om
 * contact op te nemen. Ze stonden alleen in de app, waar Apple en Google ze
 * afdwingen, en op de website stond alleen een KvK-nummer — een nummer is
 * geen antwoord op de vraag wie je voor je hebt.
 */
describe('de handelsgegevens', () => {
  const zetter = readFileSync('scripts/make-site.mjs', 'utf8')

  it('staan compleet in de tabel op de website', () => {
    for (const veld of ['OPERATOR.address', 'OPERATOR.bedrijf', 'OPERATOR.registration']) {
      expect(zetter, veld).toContain(veld)
    }
  })

  /**
   * Het telefoonnummer staat er niet meer, en dat hoort zo.
   *
   * Een 06-nummer naast een bedrijfsnaam leest als een eenmanszaak die je op
   * zijn fiets kunt bellen. De mailbox op het eigen domein doet hetzelfde
   * werk. Het veld bestaat nog — Apple en Google willen het in hun console
   * voor de handelaarsverificatie — maar het is leeg, en de zetter laat een
   * lege rij weg in plaats van er een streepje neer te zetten.
   */
  it('tonen geen telefoonnummer, maar wel de weg om er een te tonen', () => {
    expect(OPERATOR.phone).toBe('')
    expect(zetter, 'de zetter moet een nummer nog steeds kunnen tonen').toContain('OPERATOR.phone ?')
  })

  it('zijn ook echt ingevuld', () => {
    expect(traderKnown()).toBe(true)
  })
})

/**
 * De titels in de winkel zijn de titels op de boeken.
 *
 * Ze stonden los van elkaar: de verhalen hadden hun eigen vertaling en de
 * boekenpagina had er nog een. Achtenvijftig van de honderdvijfendertig
 * liepen uit elkaar, en niet alleen in een woordje — op de Spaanse pagina
 * stond "Sba y el médico de la medina" terwijl het boek "la doctora" heet.
 *
 * `delen.ts` leest nu uit de inhoud, dus dat kan niet meer verschillen. Wat
 * wél nog kan, is dat een deel in een taal helemaal geen vertaling heeft: dan
 * valt de titel terug op het Nederlands en staat er ineens één Nederlandse
 * regel in een Franse lijst. Dat is wat hier wordt bewaakt.
 */
/**
 * De getallen waarmee de website een belofte doet.
 *
 * "432 opnames · 17 units · 304 woorden · 100 zinnen · 28 letters" staat op de
 * startpagina in zes talen, en dezelfde getallen staan in de winkelteksten en
 * in de beschrijving van het abonnement. Ze zijn met de hand overgeschreven
 * uit de inhoud, en dat houdt op te kloppen zodra er één woord bij komt.
 *
 * Er zat al een kleine scheur in: de omschrijving die Google onder een
 * zoekresultaat zet, zei "432 woorden en zinnen". Dat zijn er 404 — de
 * overige achtentwintig zijn de letters van het alfabet. 432 is het aantal
 * opnames, en zo staat het er nu.
 */
describe('de getallen op de website', () => {
  const ECHT = {
    units: UNITS.length,
    woorden: allWords.length,
    zinnen: ALL_SENTENCES.length,
    letters: LETTERS.length,
  }
  /** Elk woord, elke zin en elke letter is één opname. */
  const OPNAMES = ECHT.woorden + ECHT.zinnen + ECHT.letters

  it('kloppen met wat er in de app zit', () => {
    expect(ECHT).toEqual({ units: 17, woorden: 304, zinnen: 100, letters: 28 })
    expect(OPNAMES).toBe(432)
  })

  const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en'] as const

  it.each(TALEN)('staan in het %s goed op de startpagina', (taal) => {
    const regel = SITE[taal].heroBewijs
    const getallen = (regel.match(/\d+/g) ?? []).map(Number)
    expect(getallen, regel).toEqual([OPNAMES, ECHT.units, ECHT.woorden, ECHT.zinnen, ECHT.letters])
  })

  it.each(TALEN)('en de omschrijving in het %s telt opnames, geen woorden', (taal) => {
    // 432 is het aantal opnames. Wie dat "woorden en zinnen" noemt, telt de
    // letters mee als woorden.
    const tekst = SITE[taal].metaDescription
    expect(tekst).toContain(String(OPNAMES))
    for (const fout of ['woorden en zinnen', 'mots et phrases', 'Wörter und Sätze',
      'palabras y frases', 'parole e frasi', 'words and sentences']) {
      expect(tekst, taal).not.toContain(`${OPNAMES} ${fout}`)
    }
  })
})

describe('de titels van de delen', () => {
  const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en']

  it('zijn er voor elk deel van beide reeksen', () => {
    for (const taal of TALEN) {
      expect(DELEN[taal]?.sba, taal).toHaveLength(12)
      expect(DELEN[taal]?.sleutels, taal).toHaveLength(15)
    }
  })

  it('zijn in elke taal ook echt vertaald', () => {
    const nl = DELEN.nl
    for (const taal of TALEN.filter((t) => t !== 'nl')) {
      for (const reeks of ['sba', 'sleutels'] as const) {
        DELEN[taal]?.[reeks].forEach((titel, i) => {
          expect(titel, `${taal} ${reeks} deel ${i + 1} is niet vertaald`).not.toBe(nl?.[reeks][i])
        })
      }
    }
  })

  it('komen uit het boek en niet uit een tweede lijst', () => {
    // Steekproef op de drie die het ergst uit elkaar liepen.
    expect(DELEN.fr?.sleutels[0]).toBe(SLEUTEL_VERTALINGEN.fr?.[1]?.titel)
    expect(DELEN.es?.sba[8]).toBe(VERTALINGEN.es?.[9]?.titel)
    expect(DELEN.en?.sleutels[6]).toBe(SLEUTEL_VERTALINGEN.en?.[7]?.titel)
  })
})

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
    for (const naam of ['Amir', 'Yassine', 'Yousra', 'Sarah']) {
      expect(lezer, naam).toContain(`'${naam}'`)
    }
    // Twee om twee. Een toestel heeft zelden meer dan vier bruikbare stemmen
    // in één taal, en een langere lijst vult zichzelf met de mindere.
    expect(lezer).toContain("man: ['Amir', 'Yassine'], vrouw: ['Yousra', 'Sarah']")
  })

  it('zet de nieuwere stemmen vooraan', () => {
    // Een toestel draagt oude compacte stemmen en nieuwe mee, door elkaar in
    // dezelfde lijst. Welke je krijgt bepaalt of een hoofdstuk om aan te horen
    // is, en de gebruiker kan dat verschil niet aan de naam zien.
    expect(lezer).toContain('natural|neural|enhanced|premium|online|siri')
    expect(lezer).toContain('v.localService === false')
  })

  it('plakt geen vrouwennaam op een mannenstem', () => {
    // De namen worden per groep uitgedeeld en de lijst wordt niet volgemaakt
    // met wat er toevallig over is.
    expect(lezer).toContain('VERTELLERS.man[i]')
    expect(lezer).toContain('VERTELLERS.vrouw[i]')
    expect(lezer).not.toContain('VERTELLERS.man.slice(mannen.length)')
  })

  /**
   * Elke stemnaam die op een echt toestel voorkomt, door de gok heen.
   *
   * Het geslacht van een stem staat nergens in de Web Speech API, dus het
   * wordt uit de naam geraden. Die gok ging twee keer mis op dezelfde manier —
   * een stukje tekst dat toevallig in een langer woord zit. `man` zit in
   * "German (Germany)", waardoor in het Duits élke stem een man was; `male`
   * zit in "female"; `paul` zit in "Paulina".
   *
   * Zulke fouten zie je niet door de site in één taal te openen. Daarom deze
   * lijst: de namen zoals Windows, macOS, iOS en Android ze schrijven, met
   * erachter wat het hoort te zijn.
   *
   * De code wordt uit `lezer.js` geknipt en hier uitgevoerd. Dat bestand is
   * een IIFE voor de browser en heeft geen exports; verschuift er een naam,
   * dan valt deze test op het knippen en niet op een verkeerde uitkomst.
   */
  describe('raadt het geslacht van een stem', () => {
    const pak = (naam: string, eind: string): string => {
      const i = lezer.indexOf(`const ${naam} =`)
      expect(i, `${naam} staat niet meer in lezer.js`).toBeGreaterThan(-1)
      const j = lezer.indexOf(eind, i)
      expect(j, `het einde van ${naam} is niet gevonden`).toBeGreaterThan(-1)
      return lezer.slice(i, j + eind.length)
    }
    const code = [
      pak('kalenaam', "' ')"), pak('heleNamen', "'i')"),
      pak('MANNEN', '  ])'), pak('VROUWEN', '  ])'),
    ].join('\n')
    const { kalenaam, MANNEN, VROUWEN } = new Function(
      `${code}; return { kalenaam, MANNEN, VROUWEN }`,
    )() as { kalenaam: (n: string) => string, MANNEN: RegExp, VROUWEN: RegExp }
    const raad = (n: string): string => {
      const k = kalenaam(n)
      return VROUWEN.test(k) ? 'v' : MANNEN.test(k) ? 'm' : '?'
    }

    const MAN = [
      // Windows
      'Microsoft Frank - Dutch (Netherlands)',
      'Microsoft Maarten Online (Natural) - Dutch (Netherlands)',
      'Microsoft Arnaud Online (Natural) - Dutch (Belgium)',
      'Microsoft Conrad Online (Natural) - German (Germany)',
      'Microsoft Stefan - German (Germany)',
      'Microsoft Killian Online (Natural) - German (Germany)',
      'Microsoft Florian Online (Natural) - German (Germany)',
      'Microsoft Paul - French (France)',
      'Microsoft Henri Online (Natural) - French (France)',
      'Microsoft Remy Online (Natural) - French (France)',
      'Microsoft Alain Online (Natural) - French (France)',
      'Microsoft Jerome Online (Natural) - French (France)',
      'Microsoft Yves Online (Natural) - French (France)',
      'Microsoft Pablo - Spanish (Spain)',
      'Microsoft Alvaro Online (Natural) - Spanish (Spain)',
      'Microsoft Dario Online (Natural) - Spanish (Spain)',
      'Microsoft Elias Online (Natural) - Spanish (Spain)',
      'Microsoft Cosimo - Italian (Italy)',
      'Microsoft Diego Online (Natural) - Italian (Italy)',
      'Microsoft Benigno Online (Natural) - Italian (Italy)',
      'Microsoft Gianni Online (Natural) - Italian (Italy)',
      'Microsoft Giuseppe Online (Natural) - Italian (Italy)',
      'Microsoft Rinaldo Online (Natural) - Italian (Italy)',
      'Microsoft David - English (United States)',
      'Microsoft Mark - English (United States)',
      'Microsoft Guy Online (Natural) - English (United States)',
      'Microsoft Andrew Online (Natural) - English (United States)',
      'Microsoft Brian Online (Natural) - English (United States)',
      'Microsoft Christopher Online (Natural) - English (United States)',
      'Microsoft Eric Online (Natural) - English (United States)',
      'Microsoft Roger Online (Natural) - English (United States)',
      'Microsoft Steffan Online (Natural) - English (United States)',
      'Microsoft George - English (United Kingdom)',
      'Microsoft Ryan Online (Natural) - English (United Kingdom)',
      'Microsoft Thomas Online (Natural) - English (United Kingdom)',
      'Microsoft Oliver Online (Natural) - English (United Kingdom)',
      // macOS en iOS
      'Xander', 'Markus', 'Viktor', 'Martin', 'Thomas', 'Jorge', 'Juan',
      'Diego', 'Luca', 'Alex', 'Daniel', 'Fred', 'Arthur', 'Gordon', 'Aaron',
      // Android en Chrome
      'nl-nl-x-dma#male_1-local', 'de-de-x-deb#male_1-local',
      'fr-fr-x-frc#male_1-local', 'es-es-x-eef#male_1-local',
      'it-it-x-itc#male_1-local', 'en-us-x-tpc#male_1-local',
      'Google UK English Male',
    ]

    const VROUW = [
      // Windows
      'Microsoft Fenna Online (Natural) - Dutch (Netherlands)',
      'Microsoft Colette Online (Natural) - Dutch (Netherlands)',
      'Microsoft Dena Online (Natural) - Dutch (Belgium)',
      'Microsoft Hedda - German (Germany)',
      'Microsoft Katja Online (Natural) - German (Germany)',
      'Microsoft Amala Online (Natural) - German (Germany)',
      'Microsoft Seraphina Online (Natural) - German (Germany)',
      'Microsoft Louisa Online (Natural) - German (Austria)',
      'Microsoft Hortense - French (France)',
      'Microsoft Julie - French (France)',
      'Microsoft Denise Online (Natural) - French (France)',
      'Microsoft Eloise Online (Natural) - French (France)',
      'Microsoft Vivienne Online (Natural) - French (France)',
      'Microsoft Brigitte Online (Natural) - French (France)',
      'Microsoft Yvette Online (Natural) - French (France)',
      'Microsoft Helena - Spanish (Spain)',
      'Microsoft Laura - Spanish (Spain)',
      'Microsoft Elvira Online (Natural) - Spanish (Spain)',
      'Microsoft Estrella Online (Natural) - Spanish (Spain)',
      'Microsoft Irene Online (Natural) - Spanish (Spain)',
      'Microsoft Triana Online (Natural) - Spanish (Spain)',
      'Microsoft Vera Online (Natural) - Spanish (Spain)',
      'Microsoft Ximena Online (Natural) - Spanish (Mexico)',
      'Microsoft Elsa - Italian (Italy)',
      'Microsoft Isabella Online (Natural) - Italian (Italy)',
      'Microsoft Fabiola Online (Natural) - Italian (Italy)',
      'Microsoft Fiamma Online (Natural) - Italian (Italy)',
      'Microsoft Imelda Online (Natural) - Italian (Italy)',
      'Microsoft Irma Online (Natural) - Italian (Italy)',
      'Microsoft Palmira Online (Natural) - Italian (Italy)',
      'Microsoft Pierina Online (Natural) - Italian (Italy)',
      'Microsoft Zira - English (United States)',
      'Microsoft Aria Online (Natural) - English (United States)',
      'Microsoft Jenny Online (Natural) - English (United States)',
      'Microsoft Emma Online (Natural) - English (United States)',
      'Microsoft Ava Online (Natural) - English (United States)',
      'Microsoft Michelle Online (Natural) - English (United States)',
      'Microsoft Hazel - English (United Kingdom)',
      'Microsoft Susan - English (United Kingdom)',
      'Microsoft Sonia Online (Natural) - English (United Kingdom)',
      'Microsoft Libby Online (Natural) - English (United Kingdom)',
      'Microsoft Olivia Online (Natural) - English (Australia)',
      // macOS en iOS
      'Ellen', 'Claire', 'Anna', 'Petra', 'Helena', 'Amelie', 'Amélie',
      'Aurelie', 'Marie', 'Chantal', 'Monica', 'Mónica', 'Paulina', 'Marisol',
      'Alice', 'Federica', 'Paola', 'Samantha', 'Karen', 'Moira', 'Tessa',
      'Fiona', 'Victoria', 'Serena', 'Martha', 'Nicky',
      // Android en Chrome
      'nl-nl-x-dma#female_1-local', 'de-de-x-deb#female_1-local',
      'fr-fr-x-frc#female_1-local', 'es-es-x-eef#female_1-local',
      'it-it-x-itc#female_1-local', 'en-gb-x-gba#female_1-local',
      'Google UK English Female',
    ]

    it.each(MAN)('%s is een man', (naam) => { expect(raad(naam)).toBe('m') })
    it.each(VROUW)('%s is een vrouw', (naam) => { expect(raad(naam)).toBe('v') })

    it('zegt eerlijk onbekend als er geen naam in staat', () => {
      // "Google Deutsch" is een stem zonder naam en zonder geslacht. Die hoort
      // niet zomaar een verteller te worden; hij vult pas aan als er na de
      // herkende stemmen nog een naam over is.
      for (const naam of ['Google Nederlands', 'Google Deutsch', 'Google français',
        'Google español', 'Google italiano', 'Google US English']) {
        expect(raad(naam), naam).toBe('?')
      }
    })

    it('trapt niet in een naam die in een langer woord zit', () => {
      // Dit zijn de drie die het écht mis lieten gaan.
      expect(raad('Microsoft Katja Online (Natural) - German (Germany)')).toBe('v')
      expect(raad('de-de-x-deb#female_1-local')).toBe('v')
      expect(raad('Paulina')).toBe('v')
    })
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
