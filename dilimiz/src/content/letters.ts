import type { Letter } from './types'
import { NAKIJKSTAND } from './nakijken'

/**
 * Het Turkse alfabet: 29 letters, geen q, w of x.
 *
 * Dit is de unit die vooraan staat, net als het alfabet bij de app waar de
 * techniek van komt — maar om een andere reden. Daar moest een kind een nieuw
 * schrift leren voor het één woord kon lezen. Hier kán het de letters al
 * lezen; wat het moet leren is er zes ánders lezen.
 *
 * Dat maakt deze unit kort, en het maakt hem belangrijker dan hij lijkt: een
 * kind dat `cam` als "kam" leest, leest de hele cursus verkeerd.
 *
 * Wat Turks hier cadeau doet en wat in les één gezegd hoort te worden: de
 * spelling is fonetisch. Wat je ziet, zeg je. Eén keer het alfabet door en je
 * kunt elk Turks woord voorlezen.
 */

const nagekeken = NAKIJKSTAND['letters.ts']!.klaar

/**
 * De id staat erbij en wordt niet uit de letter berekend.
 *
 * Dat moet, want `naarId` haalt diakrieten weg: `c` en `ç` zouden allebei
 * `c` worden, en `ı` en `i` allebei `i`. Dan botsen precies de letters
 * waar deze app over gaat, en botsende ids betekenen voortgang die bij het
 * verkeerde ding wordt opgeteld.
 *
 * Dus: `c-cedilla`, `i-dotless`, `g-soft`. Lelijker om te lezen, en voor
 * altijd uniek.
 */
const l = (
  id: string,
  klein: string,
  hoofd: string,
  naam: string,
  klank: { nl: string; de: string; fr: string; en: string },
  extra: Partial<Letter> = {},
): Letter => ({ id, klein, hoofd, naam, klank, lastig: false, nagekeken, ...extra })

export const LETTERS: Letter[] = [
  l('a', 'a', 'A', 'a', { nl: 'als de a in `kat`', de: 'wie das a in `Katze`', fr: 'comme le a de `chat`', en: 'like the a in `cat`' }, { voorbeeld: 'anne' }),
  l('b', 'b', 'B', 'be', { nl: 'als de b in `bal`', de: 'wie das b in `Ball`', fr: 'comme le b de `balle`', en: 'like the b in `ball`' }, { voorbeeld: 'baba' }),
  l('c', 'c', 'C', 'ce', {
    nl: 'als dzj — de j in het Engelse `jam`. Niet als een k of een s',
    de: 'wie dsch — das j im englischen `jam`. Nicht wie k oder z',
    fr: 'comme dj — le j anglais de `jam`. Jamais comme un k',
    en: 'like the j in `jam`. Never a k or an s',
  }, { lastig: true, voorbeeld: 'cam' }),
  l('c-cedilla', 'ç', 'Ç', 'çe', {
    nl: 'als tsj in `tsjilpen`',
    de: 'wie tsch in `Tschüss`',
    fr: 'comme tch dans `tchèque`',
    en: 'like ch in `chair`',
  }, { lastig: true, voorbeeld: 'çay' }),
  l('d', 'd', 'D', 'de', { nl: 'als de d in `dag`', de: 'wie das d in `Dach`', fr: 'comme le d de `dos`', en: 'like the d in `day`' }, { voorbeeld: 'dede' }),
  l('e', 'e', 'E', 'e', { nl: 'als de e in `pet`, altijd kort', de: 'wie das e in `Bett`, immer kurz', fr: 'comme le è de `père`', en: 'like the e in `pet`, always short' }, { voorbeeld: 'ev' }),
  l('f', 'f', 'F', 'fe', { nl: 'als de f in `fiets`', de: 'wie das f in `Fisch`', fr: 'comme le f de `fil`', en: 'like the f in `fish`' }, { voorbeeld: 'fil' }),
  l('g', 'g', 'G', 'ge', { nl: 'als de g in het Engelse `go`, hard', de: 'wie das g in `gut`', fr: 'comme le g de `gare`', en: 'like the g in `go`' }, { voorbeeld: 'gün' }),
  l('g-soft', 'ğ', 'Ğ', 'yumuşak ge', {
    nl: 'als een zachte g die je bijna niet hoort: hij rekt de klinker ervóór uit. `dağ` klinkt als `daa`',
    de: 'wie ein weiches g, das man kaum hört: es dehnt den Vokal davor. `dağ` klingt wie `daa`',
    fr: 'comme un g doux presque inaudible : il allonge la voyelle d’avant. `dağ` sonne comme `daa`',
    en: 'like a soft g you barely hear: it stretches the vowel before it. `dağ` sounds like `daa`',
  }, { lastig: true, voorbeeld: 'dağ' }),
  l('h', 'h', 'H', 'he', {
    nl: 'als de h in `hand` — en altijd uitgesproken',
    de: 'wie das h in `Hand` — und immer gesprochen',
    fr: 'comme le h anglais de `hand` — toujours prononcé, jamais muet',
    en: 'like the h in `hand`, and always pronounced',
  }, { voorbeeld: 'hala' }),
  l('i-dotless', 'ı', 'I', 'ı', {
    nl: 'als een klank achterin de mond, zonder je lippen te ronden — géén i, eerder de tweede e in `vader`, maar dieper',
    de: 'wie ein Laut hinten im Mund, ohne gerundete Lippen — kein i, eher wie das e in `Vater`, aber tiefer',
    fr: 'comme un son au fond de la bouche, lèvres non arrondies — surtout pas un i',
    en: 'like a sound at the back of the mouth, lips unrounded — not an i, closer to the e in `roses`',
  }, { lastig: true, voorbeeld: 'ışık' }),
  l('i-dotted', 'i', 'İ', 'i', {
    nl: 'als de i in `pit`. De hoofdletter houdt zijn punt: İ',
    de: 'wie das i in `Tisch`. Der Großbuchstabe behält den Punkt: İ',
    fr: 'comme le i de `lit`. La majuscule garde son point : İ',
    en: 'like the i in `pit`. The capital keeps its dot: İ',
  }, { lastig: true, voorbeeld: 'iyi' }),
  l('j', 'j', 'J', 'je', { nl: 'als de j in `journaal`', de: 'wie das j in `Journal`', fr: 'comme le j de `jour`', en: 'like the s in `measure`' }, { voorbeeld: 'jeton' }),
  l('k', 'k', 'K', 'ke', { nl: 'als de k in `kat`', de: 'wie das k in `Katze`', fr: 'comme le k de `kilo`', en: 'like the k in `cat`' }, { voorbeeld: 'kedi' }),
  l('l', 'l', 'L', 'le', { nl: 'als de l in `lamp`', de: 'wie das l in `Lampe`', fr: 'comme le l de `lampe`', en: 'like the l in `lamp`' }, { voorbeeld: 'lütfen' }),
  l('m', 'm', 'M', 'me', { nl: 'als de m in `maan`', de: 'wie das m in `Mond`', fr: 'comme le m de `main`', en: 'like the m in `moon`' }, { voorbeeld: 'merhaba' }),
  l('n', 'n', 'N', 'ne', { nl: 'als de n in `neus`', de: 'wie das n in `Nase`', fr: 'comme le n de `nez`', en: 'like the n in `nose`' }, { voorbeeld: 'nasıl' }),
  l('o', 'o', 'O', 'o', { nl: 'als de o in `pot`', de: 'wie das o in `Sonne`', fr: 'comme le o de `porte`', en: 'like the o in `pot`' }, { voorbeeld: 'okul' }),
  l('o-umlaut', 'ö', 'Ö', 'ö', {
    nl: 'als de eu in `deur`',
    de: 'wie das ö in `schön`',
    fr: 'comme le eu de `peur`',
    en: 'like the ir in `bird`, with rounded lips',
  }, { lastig: true, voorbeeld: 'göz' }),
  l('p', 'p', 'P', 'pe', { nl: 'als de p in `pen`', de: 'wie das p in `Papier`', fr: 'comme le p de `papier`', en: 'like the p in `pen`' }, { voorbeeld: 'peynir' }),
  l('r', 'r', 'R', 're', { nl: 'als een r die je met de tong tikt, nooit in de keel', de: 'wie ein r, das mit der Zunge gerollt wird, nie im Rachen', fr: 'comme un r roulé avec la langue, jamais dans la gorge', en: 'like an r tapped with the tongue, never in the throat' }, { voorbeeld: 'rica' }),
  l('s', 's', 'S', 'se', { nl: 'als de s in `sok`, altijd scherp', de: 'wie das s in `Tasse`, immer scharf', fr: 'comme le ss de `tasse`, jamais un z', en: 'like the s in `sock`, never a z' }, { voorbeeld: 'su' }),
  l('s-cedilla', 'ş', 'Ş', 'şe', {
    nl: 'als sj in `sjaal`',
    de: 'wie sch in `Schule`',
    fr: 'comme ch dans `chat`',
    en: 'like sh in `shoe`',
  }, { lastig: true, voorbeeld: 'şeker' }),
  l('t', 't', 'T', 'te', { nl: 'als de t in `tas`', de: 'wie das t in `Tasche`', fr: 'comme le t de `table`', en: 'like the t in `table`' }, { voorbeeld: 'teyze' }),
  l('u', 'u', 'U', 'u', { nl: 'als de oe in `boek`', de: 'wie das u in `Buch`', fr: 'comme le ou de `bouche`', en: 'like the oo in `book`' }, { voorbeeld: 'un' }),
  l('u-umlaut', 'ü', 'Ü', 'ü', {
    nl: 'als de uu in `duur`',
    de: 'wie das ü in `über`',
    fr: 'comme le u de `tu`',
    en: 'like the u in French `tu` — no English equivalent',
  }, { lastig: true, voorbeeld: 'gün' }),
  l('v', 'v', 'V', 've', { nl: 'als de w in `water`', de: 'wie das w in `Wasser`', fr: 'comme le v de `vase`', en: 'like the v in `van`' }, { voorbeeld: 've' }),
  l('y', 'y', 'Y', 'ye', {
    nl: 'als de j in `jas`. Nooit een klinker',
    de: 'wie das j in `Jahr`. Niemals ein Vokal',
    fr: 'comme le y de `yeux`',
    en: 'like the y in `yes`. Never a vowel',
  }, { voorbeeld: 'yol' }),
  l('z', 'z', 'Z', 'ze', { nl: 'als de z in `zon`', de: 'wie das s in `Rose`', fr: 'comme le z de `zéro`', en: 'like the z in `zoo`' }, { voorbeeld: 'zeytin' }),
]

export const LETTER = (id: string): Letter | undefined => LETTERS.find((x) => x.id === id)

/** De zes die een Nederlandse, Duitse of Franse lezer verkeerd leest. */
export const LASTIGE_LETTERS = LETTERS.filter((x) => x.lastig)

/** De klinkers, in de twee groepen die de klinkerharmonie bepalen. */
export const KLINKERLETTERS = {
  /** Kalın: wat erachteraan komt is ook achter. */
  achter: ['a', 'ı', 'o', 'u'],
  /** İnce. */
  voor: ['e', 'i', 'ö', 'ü'],
} as const

/**
 * De lesgroepen van unit 0.
 *
 * Niet 29 letters in zeven groepjes van vier, zoals een Arabisch alfabet dat
 * nodig heeft. Drie korte lessen over wat fout gaat, en één les die de rest
 * in één keer doorneemt — want die rest is al bekend.
 */
export const LETTERGROEPEN: { letters: string[]; klankparen: string[] }[] = [
  { letters: ['c', 'c-cedilla', 's-cedilla'], klankparen: ['cam-cam', 'kas-kas'] },
  { letters: ['i-dotless', 'i-dotted'], klankparen: ['kil-kil', 'kir-kir'] },
  { letters: ['o-umlaut', 'u-umlaut'], klankparen: ['koy-koy', 'tur-tur', 'un-un'] },
  { letters: ['g-soft', 'y', 'h', 'r', 'j', 'v'], klankparen: ['dag-da'] },
]
