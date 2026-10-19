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

/** Welke film. Zie FILMS in intro.ts. */
export type FilmId = 'intro' | 'bonus'

export interface Copy {
  /** Under the title, in the opening card. */
  sub: string
  /** One line per screen, in the order of SHOTS -- dus zeven of twee. */
  lines: string[]
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
const INTRO: Record<string, Copy> = {
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


/**
 * De korte film, voor WhatsApp en Facebook.
 *
 * Twee schermen in plaats van zeven, en ze zijn met opzet dezelfde twee die in
 * geen enkele schermafdruk goed overkomen: schrijven met je vinger en jezelf
 * opnemen. Allebei zijn het bewegingen -- een stilstaand beeld laat er niets
 * van zien.
 *
 * Alleen de ondertitel en de twee regels staan hier. De slotkaart -- de prijs,
 * de getallen, de knop -- komt ongewijzigd uit de winkelfilm, zodat er geen
 * tweede plek is waar een prijs kan verouderen. Dat is precies hoe de € 4,99
 * hierboven is blijven staan.
 */
const KORT: Record<string, Pick<Copy, 'sub' | 'lines'>> = {
  nl: {
    sub: 'Twee dingen die een boek niet kan',
    lines: ['Schrijven met je vinger.\nVan rechts naar links.', 'En jezelf terughoren,\nnaast de stem.'],
  },
  fr: {
    sub: 'Deux choses qu\u2019un livre ne peut pas faire',
    lines: ['\u00c9crire avec le doigt.\nDe droite \u00e0 gauche.', 'Et s\u2019\u00e9couter soi-m\u00eame,\n\u00e0 c\u00f4t\u00e9 de la voix.'],
  },
  de: {
    sub: 'Zwei Dinge, die ein Buch nicht kann',
    lines: ['Mit dem Finger schreiben.\nVon rechts nach links.', 'Und sich selbst h\u00f6ren,\nneben der Stimme.'],
  },
  es: {
    sub: 'Dos cosas que un libro no puede hacer',
    lines: ['Escribir con el dedo.\nDe derecha a izquierda.', 'Y escucharte a ti mismo,\njunto a la voz.'],
  },
  it: {
    sub: 'Due cose che un libro non pu\u00f2 fare',
    lines: ['Scrivere con il dito.\nDa destra a sinistra.', 'E riascoltarti,\naccanto alla voce.'],
  },
  en: {
    sub: 'Two things a book cannot do',
    lines: ['Write with your finger.\nRight to left.', 'And hear yourself back,\nnext to the voice.'],
  },
}

const BONUS: Record<string, Copy> = Object.fromEntries(
  Object.entries(INTRO).map(([taal, c]) => [taal, { ...c, ...(KORT[taal] ?? KORT.nl!) }]),
)

export const COPY: Record<FilmId, Record<string, Copy>> = { intro: INTRO, bonus: BONUS }
