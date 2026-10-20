/**
 * Turkse tekst, en de dingen die daarbij stil fout gaan.
 *
 * Deze module bestaat omdat JavaScript twee dingen met Turks doet die niemand
 * ziet tot een kind ze op het scherm heeft:
 *
 *   'i'.toUpperCase()        → 'I'      en niet 'İ'
 *   'İ'.toLowerCase()        → 'i̇'      — een i met een lósse punt erachter
 *
 * Dat is precies de letter die deze app onderwijst. Daarom gaat elke
 * hoofdletterbewerking op Turkse tekst hier langs, en staat er in de CSS
 * nergens `text-transform` op een element dat Turks bevat.
 *
 * De tweede helft van dit bestand is klinkerharmonie. Die staat hier en niet
 * in de inhoud, omdat het een regel is en geen gegeven: `ev` wordt `evde` en
 * `okul` wordt `okulda` volgens dezelfde twee regels, en die regels één keer
 * opschrijven is beter dan ze bij elk woord herhalen.
 *
 * Wat er níet in staat: de verzachting van een eindconsonant (`kitap` →
 * `kitabım`). Die heeft te veel uitzonderingen om te raden — `at` wordt `atı`
 * en niet `adı` — dus staat die per woord in de inhoud. Zie `Woord.zacht`.
 */

/* ------------------------------------------------------------- hoofdletters */

/** Hoofdletters, met de İ waar een i stond. */
export const naarHoofd = (tekst: string): string => tekst.toLocaleUpperCase('tr')

/** Kleine letters, met de i waar een İ stond en de ı waar een I stond. */
export const naarKlein = (tekst: string): string => tekst.toLocaleLowerCase('tr')

/** Eerste letter groot, de rest zoals hij was. Voor een naam of een zinbegin. */
export const metHoofdletter = (tekst: string): string =>
  tekst ? naarHoofd(tekst.slice(0, 1)) + tekst.slice(1) : tekst

/* ------------------------------------------------------------- vergelijken */

/** Wat niet meedoet bij het vergelijken van een getypt antwoord. */
const RUIS = /[.,!?;:"'’“”()­]/g

const opgeschoond = (tekst: string): string =>
  tekst.replace(RUIS, '').replace(/\s+/g, ' ').trim()

/**
 * Of een getypt antwoord goed is.
 *
 * Streng waar het de les raakt en mild waar het het toetsenbord raakt. Het
 * verschil tussen `ı` en `i` is juist het leerpunt, dus dat telt — `kil` is
 * niet `kıl`. Maar een hoofdletter `I` op een Nederlands of Duits
 * toetsenbord kán geen `İ` zijn: die toets bestaat daar niet. Dus wordt een
 * hoofdletter aan het begin van een woord beide kanten op gelezen, en een
 * kleine letter nooit.
 *
 * Leestekens, dubbele spaties en voor- en achterloop doen niet mee: een kind
 * dat `merhaba!` typt waar `merhaba` staat, heeft het goed.
 */
export function gelijk(getypt: string, antwoord: string): boolean {
  const a = opgeschoond(getypt)
  const b = opgeschoond(antwoord)
  if (a === b) return true

  // De Turkse lezing: I → ı, İ → i.
  if (naarKlein(a) === naarKlein(b)) return true

  // De lezing van een toetsenbord zonder İ: elke hoofdletter I mag een i zijn.
  const alsEuropees = (s: string) => naarKlein(s.replaceAll('I', 'İ'))
  return alsEuropees(a) === alsEuropees(b)
}

/**
 * De letters die een Nederlands, Duits of Frans toetsenbord niet of moeilijk
 * geeft. Ze staan als hulprij onder het invoerveld van de tikoefening.
 *
 * Alle zeven, ook de ö en de ü die een Duits toetsenbord wel heeft: één rij
 * die overal hetzelfde is, is te onthouden, en een rij die per toestel
 * verschilt niet.
 */
export const HULPTOETSEN = ['ç', 'ğ', 'ı', 'İ', 'ö', 'ş', 'ü'] as const

/* -------------------------------------------------------------------- ids */

const OMZETTING: Record<string, string> = {
  ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u',
  Ç: 'c', Ğ: 'g', I: 'i', Ö: 'o', Ş: 's', Ü: 'u',
}

/**
 * Een id uit een Turks woord: kleine letters, geen diakrieten, streepjes.
 *
 * `teşekkür ederim` wordt `tesekkur-ederim`.
 *
 * Ids zijn voor altijd. De herhalingsplanner en de voortgang bewaren ze op het
 * toestel, dus een id hernoemen wist iemands voortgang. Daarom zijn ze Latijns
 * en zonder diakrieten: dan kan er ook geen codering tussen komen.
 */
export const naarId = (tekst: string): string =>
  [...tekst]
    .map((c) => OMZETTING[c] ?? c)
    .join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

/**
 * Turks sorteren. Het Turkse alfabet zet ç ná c, ğ ná g, ı vóór i, ö ná o,
 * ş ná s en ü ná u — en dat is niet wat een gewone sortering doet.
 */
export const turksSorteren = (a: string, b: string): number =>
  a.localeCompare(b, 'tr')

/* ---------------------------------------------------------- klinkerharmonie */

export const KLINKERS = 'aeıioöuü'
/** Achterklinkers (kalın): wat erachteraan komt is ook achter. */
export const ACHTER = 'aıou'
/** Voorklinkers (ince). */
export const VOOR = 'eiöü'
/** Geronde klinkers. Bepalen bij de viervoudige harmonie of het u/ü wordt. */
export const GEROND = 'oöuü'

/** De laatste klinker van een woord, of null als er geen in staat. */
export function laatsteKlinker(woord: string): string | null {
  const klein = naarKlein(woord)
  for (let i = klein.length - 1; i >= 0; i--) {
    const c = klein[i]!
    if (KLINKERS.includes(c)) return c
  }
  return null
}

export const isAchter = (klinker: string): boolean => ACHTER.includes(klinker)
export const isGerond = (klinker: string): boolean => GEROND.includes(klinker)

/**
 * Tweevoudige harmonie: wordt het achtervoegsel een a of een e?
 *
 * Achter `a ı o u` komt a. Achter `e i ö ü` komt e. Dit is wat `-ler/-lar`,
 * `-de/-da` en `-e/-a` volgen.
 */
export function harmonie2(woord: string): 'a' | 'e' {
  const k = laatsteKlinker(woord)
  // Geen klinker (een afkorting, een losse consonant): e is de veiligere gok,
  // en dit geval komt in de inhoud niet voor.
  if (!k) return 'e'
  return isAchter(k) ? 'a' : 'e'
}

/**
 * Viervoudige harmonie: ı, i, u of ü?
 *
 * Achter `a ı` komt ı. Achter `e i` komt i. Achter `o u` komt u. Achter `ö ü`
 * komt ü. Dit is wat het bezittelijk achtervoegsel volgt: `evim`, `okulum`,
 * `gözüm`, `kitabım`.
 */
export function harmonie4(woord: string): 'ı' | 'i' | 'u' | 'ü' {
  const k = laatsteKlinker(woord)
  if (!k) return 'i'
  if (isAchter(k)) return isGerond(k) ? 'u' : 'ı'
  return isGerond(k) ? 'ü' : 'i'
}

/**
 * De stemloze consonanten, die een `d` in een `t` veranderen.
 *
 * Turkse kinderen leren dit rijtje als een naam: *fıstıkçı şahap* — "Şahap de
 * pistacheverkoper". Alle acht letters zitten erin, en dat is een trucje dat
 * in deze app thuishoort omdat het in Turkije zelf zo onderwezen wordt.
 */
export const STEMLOOS = 'fstkçşhp'
export const FISTIKCI_SAHAP = 'fıstıkçı şahap'

/** Of een woord eindigt op een stemloze consonant. */
export function eindigtStemloos(woord: string): boolean {
  const klein = naarKlein(woord).replace(/[^a-zçğıöşü]/g, '')
  const laatste = klein.at(-1)
  return laatste ? STEMLOOS.includes(laatste) : false
}

const eindigtOpKlinker = (woord: string): boolean => {
  const klein = naarKlein(woord).trim()
  const laatste = klein.at(-1)
  return laatste ? KLINKERS.includes(laatste) : false
}

/* ------------------------------------------------------- de achtervoegsels */

/** Meervoud: `-ler` of `-lar`. `ev` → `evler`, `okul` → `okullar`. */
export const meervoud = (woord: string): string =>
  woord + (harmonie2(woord) === 'a' ? 'lar' : 'ler')

/**
 * "in/op/bij": `-de`, `-da`, `-te` of `-ta`.
 *
 * Twee regels tegelijk: de klinker volgt de harmonie, en de d wordt een t na
 * een stemloze consonant. `ev` → `evde`, `okul` → `okulda`, `kitap` →
 * `kitapta`, `sepet` → `sepette`.
 */
export function locatief(woord: string): string {
  const d = eindigtStemloos(woord) ? 't' : 'd'
  return woord + d + harmonie2(woord)
}

/**
 * "mijn": `-m` na een klinker, `-ım/-im/-um/-üm` na een consonant.
 *
 * `anne` → `annem`, `ev` → `evim`, `okul` → `okulum`, `göz` → `gözüm`.
 *
 * `zacht` is voor woorden waarvan de eindconsonant verzacht: `kitap` →
 * `kitabım`, niet `kitapım`. Dat staat per woord in de inhoud en niet hier,
 * omdat de regel uitzonderingen heeft die niet te berekenen zijn — `at`
 * wordt `atım` en niet `adım`, en `adım` betekent iets anders.
 */
export function bezitMijn(woord: string, zacht = false): string {
  if (eindigtOpKlinker(woord)) return woord + 'm'
  const stam = zacht ? verzacht(woord) : woord
  return stam + harmonie4(woord) + 'm'
}

const VERZACHTING: Record<string, string> = { p: 'b', ç: 'c', t: 'd', k: 'ğ' }

/**
 * De eindconsonant verzachten voor een achtervoegsel dat met een klinker
 * begint: `kitap` → `kitab-`, `ağaç` → `ağac-`, `dört` → `dörd-`,
 * `köpek` → `köpeğ-`.
 *
 * Alleen aanroepen als de inhoud zegt dat het woord verzacht. Zie `bezitMijn`.
 */
export function verzacht(woord: string): string {
  const laatste = naarKlein(woord).at(-1)
  if (!laatste) return woord
  const zacht = VERZACHTING[laatste]
  return zacht ? woord.slice(0, -1) + zacht : woord
}

/**
 * De harmonie-oefening: welke vormen zijn er, en welke is de goede?
 *
 * Geeft de keuzes in een vaste volgorde, zodat het scherm ze kan shuffelen met
 * zijn eigen zaadje en een test de uitkomst kan nameten.
 */
export interface HarmonieVraag {
  woord: string
  /** Hoe het achtervoegsel heet, voor de uitleg: 'meervoud' | 'in' | 'mijn'. */
  soort: 'meervoud' | 'in' | 'mijn'
  /** Het goede antwoord, volledig uitgeschreven. */
  goed: string
  /** Alle vormen die aangeboden worden, inclusief het goede antwoord. */
  keuzes: string[]
}

export function harmonieVraag(woord: string, soort: HarmonieVraag['soort']): HarmonieVraag {
  if (soort === 'meervoud') {
    const keuzes = [woord + 'ler', woord + 'lar']
    return { woord, soort, goed: meervoud(woord), keuzes }
  }
  if (soort === 'in') {
    const keuzes = ['de', 'da', 'te', 'ta'].map((s) => woord + s)
    return { woord, soort, goed: locatief(woord), keuzes }
  }
  const keuzes = eindigtOpKlinker(woord)
    ? [woord + 'm']
    : ['ım', 'im', 'um', 'üm'].map((s) => woord + s)
  return { woord, soort, goed: bezitMijn(woord), keuzes }
}
