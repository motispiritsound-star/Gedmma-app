/**
 * Wat er in de promofilm geschreven staat, per taal.
 *
 * Apart van `intro.ts` omdat dat bestand bij het inladen meteen aan `window`
 * zit: wie alleen de teksten wil nalezen, start dan de hele filmmachine op.
 * En nalezen moet, want hier stond een prijs die niet meer bestond --
 * € 4,99 per maand, lang nadat het jaar op € 59,99 was gezet en de
 * maandprijs dus € 5,00 werd. Een film met een verkeerd bedrag erin gaat
 * naar de App Store, naar Google Play en naar TikTok.
 *
 * `src/site/intro.test.ts` legt de prijs en de getallen hier naast
 * `billing.ts` en de echte inhoud.
 */

export interface Copy {
  /** Under the title, in the opening card. */
  sub: string
  /** One line per screen, in the order of SHOTS. */
  lines: [string, string, string, string, string, string, string]
  /** The last card. */
  cta: string
  price: string
  /** One line of plain numbers, so the film ends on something checkable. */
  feiten: string
}

/**
 * The Dutch arc is one of the slogans, cut in half and hung over the whole
 * film: it opens on the children and lands, five screens later, on the parent.
 * The other four languages carry the same joke.
 */
/**
 * Uitgevoerd omdat `src/site/intro.test.ts` de prijs en de getallen hier
 * naast de echte inhoud legt. Dat is niet overdreven: de prijs hieronder
 * stond op € 4,99 lang nadat die prijs was losgelaten, en een film met een
 * verkeerd bedrag erin gaat naar de App Store, Google Play en TikTok.
 */
export const COPY: Record<string, Copy> = {
  nl: {
    sub: 'Voor jong — en stiekem ook voor oud',
    lines: [
      'Eén pad: van de eerste\nletter tot de souq.',
      'Laat je kinderen hun\nmoedertaal leren.',
      'Het Arabische alfabet,\nletter voor letter.',
      'Horen, kiezen, herhalen —\ntot het blijft hangen.',
      'En na elke toets\neen stukje Marokko.',
      'En schrijven, met je vinger.\nLetter voor letter.',
      'En pik zelf stiekem\nwat mee.',
    ],
    cta: 'Gratis beginnen',
    feiten: '17 units · 304 woorden · 100 zinnen',
    price: 'Vanaf € 5,00 per maand',
  },
  fr: {
    sub: 'Pour les jeunes — et pour les grands aussi',
    lines: [
      'Un parcours : de la lettre\njusqu’au souk.',
      'Laisse tes enfants apprendre\nleur langue maternelle.',
      'L’alphabet arabe,\nlettre par lettre.',
      'Écouter, choisir, répéter —\njusqu’à ce que ça reste.',
      'Et après chaque test,\nun morceau du Maroc.',
      'Et écrire, au doigt.\nLettre par lettre.',
      'Et rafraîchis la tienne\nsans rien dire.',
    ],
    cta: 'Commencer gratuitement',
    feiten: '17 unités · 304 mots · 100 phrases',
    price: 'À partir de 5,00 € par mois',
  },
  de: {
    sub: 'Für die Jungen — und heimlich für dich',
    lines: [
      'Ein Weg: vom ersten\nBuchstaben bis zum Souk.',
      'Lass deine Kinder ihre\nMuttersprache lernen.',
      'Das arabische Alphabet,\nBuchstabe für Buchstabe.',
      'Hören, wählen, wiederholen —\nbis es sitzt.',
      'Und nach jedem Test\nein Stück Marokko.',
      'Und schreiben, mit dem Finger.\nBuchstabe für Buchstabe.',
      'Und frisch deins ganz\nnebenbei auf.',
    ],
    cta: 'Kostenlos starten',
    feiten: '17 Einheiten · 304 Wörter · 100 Sätze',
    price: 'Ab 5,00 € pro Monat',
  },
  es: {
    sub: 'Para los jóvenes — y también para ti',
    lines: [
      'Un camino: de la primera\nletra hasta el zoco.',
      'Deja que tus hijos aprendan\nsu lengua materna.',
      'El alfabeto árabe,\nletra a letra.',
      'Escuchar, elegir, repetir —\nhasta que se queda.',
      'Y tras cada test,\nun trozo de Marruecos.',
      'Y escribir, con el dedo.\nLetra a letra.',
      'Y refresca la tuya\nde paso.',
    ],
    cta: 'Empezar gratis',
    feiten: '17 unidades · 304 palabras · 100 frases',
    price: 'Desde 5,00 € al mes',
  },
  it: {
    sub: 'Per i giovani — e anche per te',
    lines: [
      'Un percorso: dalla prima\nlettera fino al souk.',
      'Fai imparare ai tuoi figli\nla lingua di casa.',
      'L\u2019alfabeto arabo,\nlettera per lettera.',
      'Sentire, scegliere, ripetere —\nfinché resta.',
      'E dopo ogni test\nun pezzo di Marocco.',
      'E scrivere, con il dito.\nLettera per lettera.',
      'E tu, ripassala\nsenza dirlo a nessuno.',
    ],
    cta: 'Inizia gratis',
    price: 'Da 5,00 € al mese',
    feiten: '17 unità · 304 parole · 100 frasi',
  },
  en: {
    sub: 'For the young — and quietly for you',
    lines: [
      'One path: from the first\nletter to the souq.',
      'Let your children learn\ntheir mother tongue.',
      'The Arabic alphabet,\nletter by letter.',
      'Listen, choose, repeat —\nuntil it sticks.',
      'And after every test,\na piece of Morocco.',
      'And writing, with a finger.\nLetter by letter.',
      'And quietly pick some up\nyourself.',
    ],
    cta: 'Start free',
    feiten: '17 units · 304 words · 100 sentences',
    price: 'From € 5.00 a month',
  },
}
