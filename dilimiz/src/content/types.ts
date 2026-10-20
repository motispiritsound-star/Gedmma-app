/**
 * De vorm van alles wat een kind ooit ziet.
 *
 * Eén plek om te zien wat inhoud kan zijn. Alles in deze map is data: een unit
 * erbij is een object erbij, een taal erbij is een veld erbij. Geen
 * codewijziging.
 *
 * Wat hier NIET in staat: interfaceteksten. Die staan in src/i18n/ en worden
 * door vertalers gedaan die geen Turks hoeven te kennen. De Turkse cursus
 * verandert niet als er een interfacetaal bijkomt.
 */

/** De interfacetalen waarin een betekenis bestaat. Uitbreidbaar. */
export type Taal = 'nl' | 'de' | 'fr' | 'en'
export const TALEN: readonly Taal[] = ['nl', 'de', 'fr', 'en']

/** Eén betekenis per interfacetaal. */
export type Betekenis = Record<Taal, string>

export type Onderwerp =
  | 'letters' | 'groeten' | 'ik-en-jij' | 'cijfers' | 'familie'
  | 'thuis' | 'eten' | 'school' | 'gevoelens' | 'dag' | 'reizen'

/**
 * De leeftijdsvorm. Een voorstel bij de start, door een ouder te wijzigen, en
 * nooit opgeslagen als geboortedatum — zie docs/privacy-and-safety.md.
 */
export type Leeftijdsgroep = 'klein' | 'midden' | 'groot'
export const LEEFTIJDSGROEPEN: readonly Leeftijdsgroep[] = ['klein', 'midden', 'groot']

export interface Woord {
  /**
   * Vaste id, nooit hernoemd. De herhalingsplanner en de voortgang bewaren
   * hem op het toestel, dus hernoemen wist iemands voortgang. Latijns en
   * zonder diakrieten; zie engine/turks.ts `naarId`.
   */
  id: string
  /** Het Turkse woord, zoals het geschreven wordt. */
  tr: string
  betekenis: Betekenis
  onderwerp: Onderwerp
  emoji?: string
  /** Wanneer je het zegt, of wat het letterlijk betekent. Kort. */
  gebruik?: Betekenis
  /** Een hele uitdrukking in plaats van één woord: `teşekkür ederim`. */
  uitdrukking?: boolean
  /**
   * Of de eindconsonant verzacht voor een achtervoegsel dat met een klinker
   * begint: `kitap` → `kitabım`. Staat per woord omdat de regel
   * uitzonderingen heeft die niet te berekenen zijn — `at` wordt `atım` en
   * niet `adım`.
   */
  zacht?: boolean
  /** Vanaf welke leeftijdsgroep dit woord voorkomt. Standaard `klein`. */
  vanaf?: Leeftijdsgroep
  /**
   * Of een moedertaalspreker deze string gezien heeft.
   *
   * Overal `false` tot het gebeurd is. `nagekeken.test.ts` telt hoeveel.
   * Dit is het belangrijkste openstaande punt van het project; zie
   * docs/decisions.md B-1.
   */
  nagekeken: boolean
}

/**
 * Een letter van het Turkse alfabet.
 *
 * Geen vormen voor begin, midden en eind: Turks is Latijns schrift en een
 * letter ziet er overal hetzelfde uit. Dat is het grootste verschil met de
 * app waar de techniek van komt, en de reden dat deze unit kort is: zes
 * letters leren lezen in plaats van 28 letters in vier vormen.
 */
export interface Letter {
  id: string
  /** De kleine letter. */
  klein: string
  /** De hoofdletter. Let op `i` → `İ` en `I` → `ı`. */
  hoofd: string
  /** Hoe de letter in het Turkse alfabet heet: `ce`, `çe`, `yumuşak ge`. */
  naam: string
  /** Hoe hij klinkt, beschreven per interfacetaal. */
  klank: Betekenis
  /** Een woord dat met deze letter begint, als id uit `woorden.ts`. */
  voorbeeldId?: string
  /** Een los voorbeeldwoord als er nog geen cursuswoord met deze letter is. */
  voorbeeld?: string
  /**
   * Of deze letter een struikelblok is voor wie Nederlands, Duits of Frans
   * gewend is. Deze krijgen een eigen les; de rest wordt in één les
   * doorgenomen.
   */
  lastig: boolean
  nagekeken: boolean
}

/**
 * Een klankpaar: twee echte woorden die alleen in één letter verschillen.
 *
 * Dit is de oefenvorm die het verschil tussen `ı` en `i` hoorbaar maakt in
 * plaats van het uit te leggen. Het kind hoort er één en wijst aan welke het
 * was.
 *
 * `soort` staat erbij omdat een echt minimaal paar niet voor elke letter
 * bestaat met woorden die een kind van zeven mag kennen. Een contrastpaar is
 * didactisch bijna net zo goed, maar het is eerlijk om te weten welke van de
 * twee het is.
 */
export interface Klankpaar {
  id: string
  soort: 'minimaal' | 'contrast'
  /** De twee woorden, en wat ze betekenen. */
  links: { tr: string; betekenis: Betekenis }
  rechts: { tr: string; betekenis: Betekenis }
  /** Welke twee letters hier tegenover elkaar staan: `['ı','i']`. */
  letters: [string, string]
  nagekeken: boolean
}

/**
 * Een zin, opgeschreven en niet gegenereerd.
 *
 * Turkse woordvolgorde is onderwerp–voorwerp–werkwoord, en de achtervoegsels
 * plakken aan elkaar. Dat is niets om naar te gokken, dus staat elke zin hier
 * uitgeschreven.
 */
export interface Zin {
  id: string
  tr: string
  betekenis: Betekenis
  /** Bij welke les hij hoort. */
  lesId: string
  /**
   * Woorden die in de zin staan maar in deze les niet geoefend worden.
   *
   * Een natuurlijke zin heeft soms een woord nodig dat nog niet aan de beurt
   * is. Die worden op de leerkaart mét betekenis getoond en níet in de
   * herhaling opgenomen: ze zijn er om de zin te laten kloppen, niet om
   * geleerd te worden. Zo hoeft geen enkele zin krom te zijn omdat het
   * curriculum nog niet zo ver is.
   */
  hulpwoorden?: { tr: string; betekenis: Betekenis }[]
  /** Wie het zegt, als de zin deel van een gesprekje is. */
  spreker?: string
  nagekeken: boolean
}

export type LesSoort = 'letters' | 'klanken' | 'woorden' | 'harmonie' | 'toets'

export interface LesTip {
  titel: Betekenis
  tekst: Betekenis
}

export interface Les {
  id: string
  titel: Betekenis
  soort: LesSoort
  /** Woord-ids die hier geleerd worden, in leesvolgorde. */
  woorden: string[]
  /** Letter-ids. Alleen een letterles heeft deze. */
  letters?: string[]
  /** Klankpaar-ids. Alleen een klankenles heeft deze. */
  klankparen?: string[]
  /**
   * Oefening-ids uit `achtervoegsels.ts`. Alleen een harmonieles.
   *
   * Met opzet niet woord-ids uit `woorden.ts`: de harmonie wordt geoefend op
   * woorden die de klinkergroepen goed verdelen (`ev`, `okul`, `göz`,
   * `kitap`), en dat is een andere lijst dan de woordenschat van de cursus.
   * Een harmonieles die alleen cursuswoorden gebruikt, oefent per ongeluk
   * maar twee van de vier groepen.
   */
  harmonieOefeningen?: string[]
  /** Zinnen aan het eind van de ronde. Afgeleid uit `zinnen.ts` op `lesId`. */
  zinnen?: string[]
  tip?: LesTip
}

export interface Unit {
  id: string
  /** De Turkse naam van de unit. Staat op de kop, want dat is de taal. */
  tr: string
  titel: Betekenis
  ondertitel: Betekenis
  emoji: string
  niveau: 'A0' | 'A1' | 'A2'
  /** Welk accent de unitkop krijgt. Zie merk/kleuren.ts. */
  accent: 'cini' | 'kayisi' | 'fistik' | 'gul'
  lessen: Les[]
  /**
   * Eén opdracht per unit die je samen met een ouder of grootouder doet.
   *
   * Dit is het deel dat een app wél kan en een boek niet, en het antwoord op
   * de vraag waarom een gezin hiervoor zou kiezen. Nog niet in de MVP gebouwd
   * (zie docs/mvp-backlog.md #36), maar het veld staat er zodat de inhoud
   * ervoor al geschreven kan worden.
   */
  gezinsopdracht?: Betekenis
}

/**
 * De herkomst van een cultureel of historisch gegeven.
 *
 * Geen feit in de app zonder een regel hier. `bronnen.test.ts` controleert
 * dat elke verwijzing bestaat. Zie docs/learning-curriculum.md §Cultuur.
 */
export interface Bron {
  id: string
  /** Waar het over gaat, in het Nederlands, voor de redactie. */
  waarover: string
  /** De bron zelf: boek, instelling, webadres met datum. */
  herkomst: string
  /** Voor welke leeftijdsgroep de formulering geschikt is gemaakt. */
  vanaf: Leeftijdsgroep
  nagekeken: boolean
}
