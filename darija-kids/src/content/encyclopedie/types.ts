/**
 * Marokko 360° — het model onder de encyclopedie.
 *
 * Dit is geen gewone contentmap. De reeks belooft iets wat de bestaande
 * geschiedeniskaarten in `src/content/history.ts` niet beloven: dat elke
 * feitelijke bewering aan een bron hangt die iemand werkelijk gelezen heeft.
 * Een belofte die niet afgedwongen wordt, wordt niet nagekomen — zeker niet
 * als er vijftien delen in zes talen achter aan komen.
 *
 * Daarom staat de vorm hier vast en bewaakt `encyclopedie.test.ts` hem:
 *
 *   1. Een hoofdstuk bestaat uit blokken. Een blok dat een feit beweert draagt
 *      bron-ids. Vrije tekst kan dat niet, en wat niet gecontroleerd kan
 *      worden, kan niet gepubliceerd worden.
 *   2. Een bron heeft een *stand*: gevonden, gelezen of betwist. "Ik heb een
 *      URL" is iets anders dan "ik heb het nagelezen", en dat verschil is
 *      precies waar een encyclopedie op staat of valt.
 *   3. Een hoofdstuk heeft een *stand*: concept, in controle, of gepubliceerd.
 *      Alleen een gepubliceerd hoofdstuk komt op de openbare site. Een
 *      concepthoofdstuk staat op een bladzijde die zichzelf als concept
 *      aankondigt en `noindex` draagt.
 *
 * De derde regel is er omdat de verleiding anders te groot is. Een reeks van
 * vijftien delen schrijf je niet in één keer af; er staat altijd iets half.
 * Als half werk vanzelf op de site belandt, is de encyclopedie precies zo
 * betrouwbaar als haar slordigste dag.
 */

import type { Lang } from '../../i18n/languages'

/* ------------------------------------------------------------------ bronnen */

/**
 * Wat voor soort bron dit is.
 *
 * De volgorde is de rangorde uit de redactionele opzet: een inscriptie weegt
 * zwaarder dan een handboek, en een handboek zwaarder dan een museumpagina.
 * `naslag` is nadrukkelijk de laagste trede — bruikbaar om een bron te vínden,
 * niet om een bewering op te bouwen.
 */
export type Bronsoort =
  /** Inscriptie, document, kaart, kroniek, opgravingsverslag. */
  | 'primair'
  /** Peer-reviewed artikel of wetenschappelijke monografie. */
  | 'academisch'
  /** Universiteit, archief, museum, erfgoedinstelling, UNESCO-dossier. */
  | 'erfgoed'
  /** Encyclopedie, handboek, overzichtswerk. Laagste trede. */
  | 'naslag'

/**
 * Hoe ver de controle van deze bron is.
 *
 * Dit is het veld waar alles om draait, en het is met opzet geen vlaggetje
 * `gecontroleerd: boolean`. Er zijn drie standen en ze betekenen echt iets
 * anders:
 *
 * - `gevonden` — we weten dat deze bron bestaat en waar hij staat. Niemand
 *   heeft hem geopend. Een bewering mag hier niet op leunen.
 * - `gelezen` — iemand heeft de bron geopend en de bewering ernaast gelegd.
 *   `gelezenOp` zegt wanneer, `gelezenDoor` zegt wie.
 * - `betwist` — de bron is gelezen en spreekt andere bronnen tegen, of staat
 *   zelf ter discussie. Dat is geen reden hem weg te gooien: juist dit is wat
 *   in "Wat weten we zeker en waarover bestaat discussie?" thuishoort.
 */
export type Bronstand = 'gevonden' | 'gelezen' | 'betwist'

export interface Bron {
  /** Korte sleutel waarmee een bewering naar deze bron wijst, bijv. `unesco-836`. */
  id: string
  soort: Bronsoort
  stand: Bronstand
  /** Auteur of instelling. Bij een dossier de instelling, bij een boek de auteur. */
  wie: string
  titel: string
  /** Het jaar van publicatie, als dat vaststaat. */
  jaar?: number
  /** Uitgever, tijdschrift of reeks. */
  waar?: string
  url?: string
  /** Bladzijde, sectie of dossiernummer — waar in de bron het precies staat. */
  plek?: string
  /** De taal van de bron. Zes talen in het register is het doel, niet één. */
  taal: 'ar' | 'ber' | 'fr' | 'en' | 'es' | 'nl' | 'de' | 'it' | 'la'
  /** Wanneer de bron gelezen is, als dat gebeurd is. YYYY-MM-DD. */
  gelezenOp?: string
  /** Wie hem gelezen heeft. Een rol, geen naam van een echt persoon. */
  gelezenDoor?: string
  /**
   * Waarom deze bron hier staat, en wat zijn beperking is.
   *
   * Verplicht, en dat is geen formaliteit: een bron zonder beperking bestaat
   * niet. Een opgravingsverslag uit 1960 is iets anders dan een synthese uit
   * 2008, en een erfgoeddossier beschrijft wat beschermd is — niet wat
   * historisch vaststaat.
   */
  noot: string
}

/* --------------------------------------------------------------- beweringen */

/**
 * Hoe zeker een bewering is.
 *
 * Hier staat de opdracht hard in: onderscheid vastgestelde feiten,
 * interpretaties en onzekerheden. Een encyclopedie die alles in dezelfde toon
 * opschrijft, liegt over wat ze weet.
 */
export type Zekerheid =
  /** Breed gedragen, meerdere onafhankelijke bronnen. */
  | 'vast'
  /** Eén goede bron, of bronnen die elkaar niet tegenspreken maar wel dun zijn. */
  | 'waarschijnlijk'
  /** Historici verschillen van mening, of het bewijs laat meerdere lezingen toe. */
  | 'betwist'

/**
 * Eén blok van een hoofdstuk.
 *
 * `soort: 'feit'` draagt bron-ids en een zekerheid. `soort: 'verhaal'` is de
 * verbindende tekst: geen nieuwe beweringen, alleen wat de feiten eromheen al
 * zeggen. Dat onderscheid is de reden dat dit model bestaat — zonder dat is
 * "schrijf spannend en verhalend" een vrijbrief om er iets bij te verzinnen.
 */
export type Blok =
  | {
    soort: 'feit'
    tekst: string
    /** Minstens één. Zie `beweringenKloppen()` voor wat er nog meer moet. */
    bronnen: string[]
    zekerheid: Zekerheid
    /** Bij `betwist`: welke lezingen er zijn, en wie welke aanhangt. */
    discussie?: string
  }
  | {
    soort: 'verhaal'
    tekst: string
  }
  | {
    soort: 'kop'
    tekst: string
  }

/* ------------------------------------------------ plaatsen, mensen, momenten */

export interface Plaats {
  id: string
  /** De naam die de reeks aanhoudt. */
  naam: string
  /**
   * Hoe de plaats in andere talen en perioden heet.
   *
   * Niet versiering: de zoekfunctie moet Walili, Volubilis en وليلي alle drie
   * vinden, en een lezer die de Latijnse naam kent hoort de Arabische te
   * zien staan.
   */
  ook: string[]
  /** Breedte- en lengtegraad, als die vaststaan. */
  coord?: { lat: number; lon: number }
  bronnen: string[]
}

export interface Persoon {
  id: string
  naam: string
  ook: string[]
  /** Leefperiode, als die vaststaat. Tekst, want een marge is geen getal. */
  leefde?: string
  bronnen: string[]
}

export interface Moment {
  id: string
  /** Wat er gebeurde, in één regel. */
  wat: string
  /** Het jaar waarop de tijdlijn sorteert. Negatief is v.Chr. */
  jaar: number
  /**
   * Hoe het jaar op het scherm komt: "± 40 n.Chr.", "3e eeuw v.Chr.".
   *
   * Apart van `jaar`, want een tijdlijn die "40" afdrukt waar de bronnen "ergens
   * in de eerste eeuw" zeggen, is misleidend precies — en dat verbiedt de
   * opdracht met zoveel woorden.
   */
  wanneer: string
  zekerheid: Zekerheid
  bronnen: string[]
  plaats?: string
}

/* ------------------------------------------------------ hoofdstukken en delen */

/**
 * Hoe ver een hoofdstuk is.
 *
 * - `concept` — geschreven, niet gecontroleerd. Komt alleen op een
 *   conceptbladzijde met `noindex` en een duidelijke rand eromheen.
 * - `controle` — de beweringen staan, de bronnen zijn aangewezen, iemand is
 *   ze aan het nalezen.
 * - `gepubliceerd` — elke bewering hangt aan minstens één bron die gelezen is.
 *   Pas dan komt het hoofdstuk op de gewone site.
 */
export type Hoofdstukstand = 'concept' | 'controle' | 'gepubliceerd'

export interface Hoofdstuk {
  id: string
  /** Het deel waar dit hoofdstuk in staat. */
  deel: string
  titel: string
  /** Eén regel die zegt waar dit over gaat. Verschijnt in overzichten. */
  kort: string
  stand: Hoofdstukstand
  /** Waar en wanneer dit speelt, voor de kop van de bladzijde. */
  plaatsTijd: string
  blokken: Blok[]
  tijdlijn: Moment[]
  plaatsen: string[]
  personen: string[]
  /** "Wat weten we zeker en waarover bestaat discussie?" */
  zekerEnOnzeker: string[]
  /** Verwante hoofdstukken, met hun id. */
  verder: string[]
  /**
   * In welke talen dit hoofdstuk bestaat.
   *
   * De site publiceert een hoofdstuk alleen in een taal die hier staat. Een
   * half vertaalde encyclopedie die in vijf talen op het Nederlands terugvalt,
   * is een encyclopedie die doet alsof.
   */
  talen: Lang[]
}

export interface Deel {
  /** `m1` tot `m15` voor Marokko, `a1` en `a2` voor al-Andalus. */
  id: string
  reeks: 'marokko' | 'andalus'
  nummer: number
  titel: string
  /** Wat dit deel bestrijkt, en waarom het hier afgebakend is. */
  omvat: string
  /** De periode in woorden. Leeg bij een thematisch deel. */
  periode?: string
}
