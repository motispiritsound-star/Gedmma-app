import type { Betekenis, LesTip } from './types'
import { NAKIJKSTAND } from './nakijken'

/**
 * Klinkerharmonie en agglutinatie, als oefenstof.
 *
 * De regels zelf staan in engine/turks.ts -- dat is rekenwerk en hoort niet in
 * de inhoud. Hier staat alleen welke woorden geoefend worden en welke uitleg
 * eromheen hoort.
 *
 * Dit is de tweede oefenvorm die de app waar de techniek van komt niet heeft,
 * en de reden is eenvoudig: die taal plakt zo niet. Een Turks woord dat met
 * acht achtervoegsels aan elkaar groeit vraagt een oefenvorm die daar niet
 * bestaat.
 *
 * De uitleg komt NÁ het oefenen en niet ervoor. Een kind dat vier keer het
 * goede achtervoegsel heeft gekozen, hoort de regel als bevestiging van iets
 * wat het al voelde. Omgekeerd is het een grammaticales.
 */

const nagekeken = NAKIJKSTAND['achtervoegsels.ts']!.klaar

export interface HarmonieOefening {
  /** `<woord>-<soort>`, bijvoorbeeld `ev-in`. Vast, zoals elke id hier. */
  id: string
  /** Het woord waarop geoefend wordt. Hoeft geen cursuswoord te zijn. */
  woord: string
  soort: 'meervoud' | 'in' | 'mijn'
  betekenis: Betekenis
}

type Vier = [string, string, string, string]
const b = ([nl, de, fr, en]: Vier): Betekenis => ({ nl, de, fr, en })

/**
 * De oefenwoorden, met opzet gemengd over de vier klinkergroepen.
 *
 * Als alle oefenwoorden `e` of `i` hadden, zou een kind leren dat het
 * achtervoegsel altijd `-ler` is -- en dat is precies de fout die de oefening
 * hoort te voorkomen. Dus: minstens één woord per groep, elke ronde.
 */
export const HARMONIE_OEFENINGEN: HarmonieOefening[] = [
  // a, ı -> a / ı
  { id: 'anne-meervoud', woord: 'anne', soort: 'meervoud', betekenis: b(['moeder', 'Mutter', 'mère', 'mother']) },
  { id: 'baba-mijn', woord: 'baba', soort: 'mijn', betekenis: b(['vader', 'Vater', 'père', 'father']) },
  { id: 'kiz-meervoud', woord: 'kız', soort: 'meervoud', betekenis: b(['meisje, dochter', 'Mädchen, Tochter', 'fille', 'girl, daughter']) },
  { id: 'kiz-mijn', woord: 'kız', soort: 'mijn', betekenis: b(['meisje, dochter', 'Mädchen, Tochter', 'fille', 'girl, daughter']) },
  // e, i -> e / i
  { id: 'ev-meervoud', woord: 'ev', soort: 'meervoud', betekenis: b(['huis', 'Haus', 'maison', 'house']) },
  { id: 'ev-in', woord: 'ev', soort: 'in', betekenis: b(['huis', 'Haus', 'maison', 'house']) },
  { id: 'ev-mijn', woord: 'ev', soort: 'mijn', betekenis: b(['huis', 'Haus', 'maison', 'house']) },
  { id: 'kardes-mijn', woord: 'kardeş', soort: 'mijn', betekenis: b(['broer of zus', 'Geschwister', 'frère ou sœur', 'sibling']) },
  { id: 'dede-mijn', woord: 'dede', soort: 'mijn', betekenis: b(['opa', 'Opa', 'grand-père', 'grandpa']) },
  // o, u -> a / u
  { id: 'okul-meervoud', woord: 'okul', soort: 'meervoud', betekenis: b(['school', 'Schule', 'école', 'school']) },
  { id: 'okul-in', woord: 'okul', soort: 'in', betekenis: b(['school', 'Schule', 'école', 'school']) },
  { id: 'okul-mijn', woord: 'okul', soort: 'mijn', betekenis: b(['school', 'Schule', 'école', 'school']) },
  { id: 'yol-in', woord: 'yol', soort: 'in', betekenis: b(['weg', 'Weg', 'route', 'road']) },
  // ö, ü -> e / ü
  { id: 'goz-meervoud', woord: 'göz', soort: 'meervoud', betekenis: b(['oog', 'Auge', 'œil', 'eye']) },
  { id: 'goz-mijn', woord: 'göz', soort: 'mijn', betekenis: b(['oog', 'Auge', 'œil', 'eye']) },
  { id: 'gun-meervoud', woord: 'gün', soort: 'meervoud', betekenis: b(['dag', 'Tag', 'jour', 'day']) },
  // stemloos: de d wordt een t
  { id: 'kitap-in', woord: 'kitap', soort: 'in', betekenis: b(['boek', 'Buch', 'livre', 'book']) },
  { id: 'sepet-in', woord: 'sepet', soort: 'in', betekenis: b(['mandje', 'Korb', 'panier', 'basket']) },
]

/**
 * De plak-oefening: een woord dat met achtervoegsels aan elkaar groeit.
 *
 * `ev` wordt `evlerimizde`. De stam staat links, de achtervoegsels liggen als
 * tegels klaar, en het kind ziet het woord groeien. Voor een Nederlandstalig
 * kind is dat eerst onleesbaar en daarna het leukste deel van de taal.
 *
 * `stappen` is de opbouw, en elke stap heeft een betekenis -- juist dat maakt
 * het begrijpelijk in plaats van een truc.
 */
export interface PlakOefening {
  id: string
  stam: string
  stappen: { deel: string; heel: string; betekenis: Betekenis }[]
  /** Tegels die níet in het antwoord horen, zodat tellen niet helpt. */
  ruis: string[]
}

export const PLAK_OEFENINGEN: PlakOefening[] = [
  {
    id: 'ev',
    stam: 'ev',
    stappen: [
      { deel: 'ler', heel: 'evler', betekenis: b(['huizen', 'Häuser', 'maisons', 'houses']) },
      { deel: 'imiz', heel: 'evlerimiz', betekenis: b(['onze huizen', 'unsere Häuser', 'nos maisons', 'our houses']) },
      { deel: 'de', heel: 'evlerimizde', betekenis: b(['in onze huizen', 'in unseren Häusern', 'dans nos maisons', 'in our houses']) },
    ],
    ruis: ['lar', 'ımız', 'da'],
  },
  {
    id: 'okul',
    stam: 'okul',
    stappen: [
      { deel: 'lar', heel: 'okullar', betekenis: b(['scholen', 'Schulen', 'écoles', 'schools']) },
      { deel: 'ımız', heel: 'okullarımız', betekenis: b(['onze scholen', 'unsere Schulen', 'nos écoles', 'our schools']) },
      { deel: 'da', heel: 'okullarımızda', betekenis: b(['in onze scholen', 'in unseren Schulen', 'dans nos écoles', 'in our schools']) },
    ],
    ruis: ['ler', 'imiz', 'de'],
  },
  {
    id: 'kardes',
    stam: 'kardeş',
    stappen: [
      { deel: 'ler', heel: 'kardeşler', betekenis: b(['broers en zussen', 'Geschwister', 'frères et sœurs', 'siblings']) },
      { deel: 'im', heel: 'kardeşlerim', betekenis: b(['mijn broers en zussen', 'meine Geschwister', 'mes frères et sœurs', 'my siblings']) },
    ],
    ruis: ['lar', 'ım', 'de'],
  },
]

/**
 * De uitleg, zoals hij ná de oefening verschijnt.
 *
 * `fıstıkçı şahap` staat erin omdat Turkse kinderen het zo leren: acht
 * stemloze consonanten in de naam van een pistacheverkoper. Een trucje uit
 * Turkije hoort in een app over Turks.
 */
export const HARMONIE_TIPS: Record<'twee' | 'vier' | 'stemloos' | 'plak', LesTip> = {
  twee: {
    titel: { nl: 'a of e?', de: 'a oder e?', fr: 'a ou e ?', en: 'a or e?' },
    tekst: {
      nl: 'Kijk naar de láátste klinker van het woord. Staat daar a, ı, o of u, dan komt er a achteraan. Staat er e, i, ö of ü, dan komt er e. Dus: ev wordt evler, maar okul wordt okullar. Altijd. Geen uitzonderingen.',
      de: 'Schau auf den létzten Vokal des Wortes. Steht dort a, ı, o oder u, kommt a; steht dort e, i, ö oder ü, kommt e. Also: ev wird evler, aber okul wird okullar. Immer, ohne Ausnahme.',
      fr: 'Regarde la dernière voyelle du mot. Si c’est a, ı, o ou u, le suffixe prend a ; si c’est e, i, ö ou ü, il prend e. Donc ev devient evler, mais okul devient okullar. Toujours, sans exception.',
      en: 'Look at the last vowel of the word. If it is a, ı, o or u, the suffix takes a; if it is e, i, ö or ü, it takes e. So ev becomes evler, but okul becomes okullar. Always. No exceptions.',
    },
  },
  vier: {
    titel: { nl: 'ı, i, u of ü?', de: 'ı, i, u oder ü?', fr: 'ı, i, u ou ü ?', en: 'ı, i, u or ü?' },
    tekst: {
      nl: 'Weer de laatste klinker, maar nu in vier groepen. Na a of ı komt ı. Na e of i komt i. Na o of u komt u. Na ö of ü komt ü. Dus: evim, okulum, gözüm, kızım.',
      de: 'Wieder der letzte Vokal, aber in vier Gruppen. Nach a oder ı kommt ı. Nach e oder i kommt i. Nach o oder u kommt u. Nach ö oder ü kommt ü. Also: evim, okulum, gözüm, kızım.',
      fr: 'Encore la dernière voyelle, mais en quatre groupes. Après a ou ı : ı. Après e ou i : i. Après o ou u : u. Après ö ou ü : ü. Donc : evim, okulum, gözüm, kızım.',
      en: 'The last vowel again, now in four groups. After a or ı comes ı. After e or i comes i. After o or u comes u. After ö or ü comes ü. So: evim, okulum, gözüm, kızım.',
    },
  },
  stemloos: {
    titel: { nl: 'fıstıkçı şahap', de: 'fıstıkçı şahap', fr: 'fıstıkçı şahap', en: 'fıstıkçı şahap' },
    tekst: {
      nl: 'Dit is hoe kinderen in Turkije het leren: fıstıkçı şahap, "Şahap de pistacheverkoper". In die naam zitten precies de acht letters f, s, t, k, ç, ş, h, p. Eindigt een woord op een van die acht, dan wordt -de een -te. Dus: evde, maar kitapta.',
      de: 'So lernen es Kinder in der Türkei: fıstıkçı şahap, „Şahap der Pistazienverkäufer“. In diesem Namen stecken genau die acht Buchstaben f, s, t, k, ç, ş, h, p. Endet ein Wort auf einen davon, wird -de zu -te. Also: evde, aber kitapta.',
      fr: 'C’est ainsi que les enfants l’apprennent en Turquie : fıstıkçı şahap, « Şahap le vendeur de pistaches ». Ce nom contient exactement les huit lettres f, s, t, k, ç, ş, h, p. Si un mot finit par l’une d’elles, -de devient -te. Donc : evde, mais kitapta.',
      en: 'This is how children in Türkiye learn it: fıstıkçı şahap, “Şahap the pistachio seller”. That name holds exactly the eight letters f, s, t, k, ç, ş, h, p. If a word ends in one of them, -de becomes -te. So: evde, but kitapta.',
    },
  },
  plak: {
    titel: { nl: 'Woorden van lego', de: 'Wörter aus Lego', fr: 'Des mots en lego', en: 'Words made of lego' },
    tekst: {
      nl: 'Turks zet geen woorden vóór een woord, maar plakt stukjes erachter. ev is huis. evler is huizen. evlerimiz is onze huizen. evlerimizde is in onze huizen. Eén woord, waar het Nederlands er vier nodig heeft — en je kunt het van achteren naar voren weer uit elkaar halen.',
      de: 'Türkisch setzt keine Wörter vór ein Wort, sondern klebt Teile dahinter. ev ist Haus. evler sind Häuser. evlerimiz ist unsere Häuser. evlerimizde ist in unseren Häusern. Ein Wort, wo Deutsch vier braucht — und von hinten nach vorne wieder auseinanderzunehmen.',
      fr: 'Le turc ne met pas de mots devant un mot : il colle des morceaux derrière. ev, c’est maison. evler, des maisons. evlerimiz, nos maisons. evlerimizde, dans nos maisons. Un seul mot là où le français en demande quatre — et on peut le démonter de la fin vers le début.',
      en: 'Turkish does not put words in front of a word; it glues pieces behind it. ev is house. evler is houses. evlerimiz is our houses. evlerimizde is in our houses. One word where English needs four — and you can take it apart from the back to the front.',
    },
  },
}

export { nagekeken as achtervoegselsNagekeken }

const OEFENING_OP_ID = new Map(HARMONIE_OEFENINGEN.map((o) => [o.id, o]))

export const harmonieOefening = (id: string): HarmonieOefening | undefined =>
  OEFENING_OP_ID.get(id)

export const plakOefening = (id: string): PlakOefening | undefined =>
  PLAK_OEFENINGEN.find((o) => o.id === id)
