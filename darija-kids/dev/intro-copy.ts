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
export type FilmId = 'intro' | 'bonus' | 'spelen' | 'weetje'
  | 'alfabet' | 'route' | 'onthouden' | 'verzamelen'

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


/**
 * De derde film: wat er te doen is als de les klaar is.
 *
 * Het geheugenspel en de verhalen. Allebei zijn ze oefenen zonder dat het
 * oefenen heet, en allebei laten ze iets zien wat een schermafdruk niet kan:
 * een kaartje dat omdraait, en een gesprek dat doorloopt.
 *
 * Net als bij de korte film erft de slotkaart -- prijs, getallen, knop --
 * ongewijzigd van de winkelfilm. Eén plek waar een prijs staat.
 */
const SPELEN: Record<string, Pick<Copy, 'sub' | 'lines'>> = {
  nl: {
    sub: 'Oefenen zonder dat het oefenen heet',
    lines: ['Twaalf kaartjes, zes paren.\nEn ondertussen leer je woorden.', 'En verhalen waarin je\nmeeluistert bij jedda.'],
  },
  fr: {
    sub: 'S\u2019entra\u00eener sans que \u00e7a en ait l\u2019air',
    lines: ['Douze cartes, six paires.\nEt des mots en chemin.', 'Et des histoires o\u00f9 l\u2019on\n\u00e9coute chez jedda.'],
  },
  de: {
    sub: '\u00dcben, ohne dass es nach \u00dcben aussieht',
    lines: ['Zw\u00f6lf Karten, sechs Paare.\nUnd nebenbei W\u00f6rter.', 'Und Geschichten, in denen du\nbei Jedda mith\u00f6rst.'],
  },
  es: {
    sub: 'Practicar sin que lo parezca',
    lines: ['Doce cartas, seis parejas.\nY palabras por el camino.', 'E historias donde escuchas\nen casa de jedda.'],
  },
  it: {
    sub: 'Allenarsi senza che sembri un esercizio',
    lines: ['Dodici carte, sei coppie.\nE parole lungo la strada.', 'E storie in cui ascolti\na casa di jedda.'],
  },
  en: {
    sub: 'Practice that does not feel like practice',
    lines: ['Twelve cards, six pairs.\nAnd words along the way.', 'And stories where you listen\nin at jedda\u2019s.'],
  },
}

const SPEL: Record<string, Copy> = Object.fromEntries(
  Object.entries(INTRO).map(([taal, c]) => [taal, { ...c, ...(SPELEN[taal] ?? SPELEN.nl!) }]),
)


/**
 * De vierde: een weetje en een spel.
 *
 * De geschiedeniskaart die na elke toets komt -- een tekening die zichzelf
 * tekent, en op de achterkant een wist-je-dat -- naast het geheugenspel. Samen
 * zeggen ze wat de andere films niet zeggen: dat er geleerd wordt op plekken
 * die niet naar een les ruiken.
 *
 * Het geheugenspel staat ook in `spelen`. Dat mag: het zijn twee posts die
 * weken uit elkaar liggen, en het spel is daar de hoofdzaak en hier het
 * tweede beeld.
 */
const WEETJE: Record<string, Pick<Copy, 'sub' | 'lines'>> = {
  nl: {
    sub: 'Leren zit niet alleen in de lessen',
    lines: ['Na elke toets een stukje\nMarokko, met een wist-je-dat.', 'En een spel waarin je leert\nzonder dat je het merkt.'],
  },
  fr: {
    sub: 'Apprendre ne se passe pas que dans les le\u00e7ons',
    lines: ['Apr\u00e8s chaque test, un bout\nde Maroc, et un le-saviez-vous.', 'Et un jeu o\u00f9 l\u2019on apprend\nsans s\u2019en rendre compte.'],
  },
  de: {
    sub: 'Lernen steckt nicht nur in den Lektionen',
    lines: ['Nach jedem Test ein St\u00fcck\nMarokko, mit einem Wusstest-du.', 'Und ein Spiel, in dem du lernst,\nohne es zu merken.'],
  },
  es: {
    sub: 'Aprender no ocurre solo en las lecciones',
    lines: ['Tras cada prueba, un trozo\nde Marruecos, con un sab\u00edas-que.', 'Y un juego donde aprendes\nsin darte cuenta.'],
  },
  it: {
    sub: 'Imparare non succede solo nelle lezioni',
    lines: ['Dopo ogni test un pezzo\ndi Marocco, con un lo-sapevi.', 'E un gioco in cui impari\nsenza accorgertene.'],
  },
  en: {
    sub: 'Learning does not only happen in the lessons',
    lines: ['After every checkpoint a piece\nof Morocco, with a did-you-know.', 'And a game where you learn\nwithout noticing.'],
  },
}

const WEET: Record<string, Copy> = Object.fromEntries(
  Object.entries(INTRO).map(([taal, c]) => [taal, { ...c, ...(WEETJE[taal] ?? WEETJE.nl!) }]),
)

/**
 * Deel vier: het schrift.
 *
 * De drempel die ouders noemen is niet de taal maar het alfabet -- dat
 * ziet eruit als iets waar je jaren voor nodig hebt. Achtentwintig is
 * een getal dat je kunt overzien, en `src/content/alphabet.ts` heeft er
 * precies zoveel.
 */
const ALFABET_T: Record<string, Pick<Copy, 'sub' | 'lines'>> = {
  nl: {
    sub: 'Het schrift is niet het moeilijke deel',
    lines: ['Achtentwintig letters,\néén voor één.', 'En dan lees je je\neerste woord zelf.'],
  },
  fr: {
    sub: 'L’écriture n’est pas le plus dur',
    lines: ['Vingt-huit lettres,\nune par une.', 'Et tu lis ton premier\nmot toi-même.'],
  },
  de: {
    sub: 'Die Schrift ist nicht das Schwere',
    lines: ['Achtundzwanzig Buchstaben,\neiner nach dem anderen.', 'Und dann liest du dein\nerstes Wort selbst.'],
  },
  es: {
    sub: 'La escritura no es lo difícil',
    lines: ['Veintiocho letras,\nuna por una.', 'Y entonces lees tu\nprimera palabra solo.'],
  },
  it: {
    sub: 'La scrittura non è la parte difficile',
    lines: ['Ventotto lettere,\nuna alla volta.', 'E poi leggi la tua\nprima parola da solo.'],
  },
  en: {
    sub: 'The script is not the hard part',
    lines: ['Twenty-eight letters,\none at a time.', 'And then you read your\nfirst word yourself.'],
  },
}

const ALFA: Record<string, Copy> = Object.fromEntries(
  Object.entries(INTRO).map(([taal, c]) => [taal, { ...c, ...(ALFABET_T[taal] ?? ALFABET_T.nl!) }]),
)

/**
 * Deel vijf: de route.
 *
 * Wat een app voor Darija eigenlijk is, in één beeld: zeventien units die
 * ergens heen gaan. Het getal staat ook in `feiten` en wordt daar tegen
 * de echte inhoud gelegd.
 */
const ROUTE_T: Record<string, Pick<Copy, 'sub' | 'lines'>> = {
  nl: {
    sub: 'Je ziet meteen waar het eindigt',
    lines: ['Zeventien units, van de\neerste letter tot de souq.', 'Horen, kiezen, herhalen —\ntot het blijft hangen.'],
  },
  fr: {
    sub: 'On voit tout de suite où ça mène',
    lines: ['Dix-sept unités, de la\npremière lettre au souk.', 'Écouter, choisir, répéter —\njusqu’à ce que ça reste.'],
  },
  de: {
    sub: 'Man sieht sofort, wo es endet',
    lines: ['Siebzehn Einheiten, vom\nersten Buchstaben zum Souk.', 'Hören, wählen, wiederholen —\nbis es sitzt.'],
  },
  es: {
    sub: 'Se ve enseguida adónde lleva',
    lines: ['Diecisiete unidades, de la\nprimera letra al zoco.', 'Escuchar, elegir, repetir —\nhasta que se queda.'],
  },
  it: {
    sub: 'Si vede subito dove si arriva',
    lines: ['Diciassette unità, dalla\nprima lettera al souk.', 'Ascoltare, scegliere, ripetere —\nfinché non resta.'],
  },
  en: {
    sub: 'You can see where it ends',
    lines: ['Seventeen units, from the\nfirst letter to the souk.', 'Listen, choose, repeat —\nuntil it sticks.'],
  },
}

const ROUTE: Record<string, Copy> = Object.fromEntries(
  Object.entries(INTRO).map(([taal, c]) => [taal, { ...c, ...(ROUTE_T[taal] ?? ROUTE_T.nl!) }]),
)

/**
 * Deel zes: wat de app onthoudt.
 *
 * Het enige deel dat aan de ouder uitlegt waar het geld heen gaat. Niet
 * met een belofte maar met een scherm: drie tellers en een lijst met de
 * woorden die nog het minst vastzitten.
 */
const ONTHOUD_T: Record<string, Pick<Copy, 'sub' | 'lines'>> = {
  nl: {
    sub: 'Jij hoeft niet bij te houden wat je vergeet',
    lines: ['De app ziet welke woorden\nlos beginnen te zitten.', 'En elke dag een opdracht\ndie af kan.'],
  },
  fr: {
    sub: 'Tu n’as pas à suivre ce que tu oublies',
    lines: ['L’appli voit quels mots\ncommencent à se défaire.', 'Et chaque jour une mission\nqu’on peut finir.'],
  },
  de: {
    sub: 'Du musst nicht nachhalten, was du vergisst',
    lines: ['Die App sieht, welche Wörter\nsich zu lösen beginnen.', 'Und jeden Tag eine Aufgabe,\ndie zu schaffen ist.'],
  },
  es: {
    sub: 'No tienes que llevar la cuenta de lo que olvidas',
    lines: ['La app ve qué palabras\nempiezan a aflojarse.', 'Y cada día una misión\nque se puede terminar.'],
  },
  it: {
    sub: 'Non devi tenere il conto di ciò che dimentichi',
    lines: ['L’app vede quali parole\niniziano ad allentarsi.', 'E ogni giorno una missione\nche si può finire.'],
  },
  en: {
    sub: 'You do not have to track what you forget',
    lines: ['The app sees which words\nare starting to slip.', 'And a daily mission small\nenough to finish.'],
  },
}

const ONTHOUD: Record<string, Copy> = Object.fromEntries(
  Object.entries(INTRO).map(([taal, c]) => [taal, { ...c, ...(ONTHOUD_T[taal] ?? ONTHOUD_T.nl!) }]),
)

/**
 * Deel zeven: wat je verzamelt en wat je wint.
 *
 * De losse geschiedeniskaart staat in deel een; dit is de plank eronder,
 * met de twaalf die nog op slot staan en alleen hun jaartal laten zien.
 * Daarnaast het tijdspel, want een plank alleen is stil.
 *
 * Veertien is nageteld in `src/content/history.ts`, zestig seconden staat
 * zo in `TimeRace`.
 */
const VERZAMEL_T: Record<string, Pick<Copy, 'sub' | 'lines'>> = {
  nl: {
    sub: 'Er valt iets te verzamelen',
    lines: ['Veertien kaarten. Elke toets\ndie je haalt levert er een.', 'En zestig seconden om\nzoveel mogelijk te raden.'],
  },
  fr: {
    sub: 'Il y a de quoi collectionner',
    lines: ['Quatorze cartes. Chaque test\nréussi en donne une.', 'Et soixante secondes pour\nen deviner un maximum.'],
  },
  de: {
    sub: 'Es gibt etwas zu sammeln',
    lines: ['Vierzehn Karten. Jeder Test,\nden du schaffst, bringt eine.', 'Und sechzig Sekunden, um\nso viel wie möglich zu raten.'],
  },
  es: {
    sub: 'Hay algo que coleccionar',
    lines: ['Catorce cartas. Cada prueba\nque apruebas da una.', 'Y sesenta segundos para\nacertar todo lo que puedas.'],
  },
  it: {
    sub: 'C’è qualcosa da collezionare',
    lines: ['Quattordici carte. Ogni test\nsuperato ne dà una.', 'E sessanta secondi per\nindovinarne il più possibile.'],
  },
  en: {
    sub: 'There is something to collect',
    lines: ['Fourteen cards. Every checkpoint\nyou pass hands you one.', 'And sixty seconds to guess\nas many as you can.'],
  },
}

const VERZAMEL: Record<string, Copy> = Object.fromEntries(
  Object.entries(INTRO).map(([taal, c]) => [taal, { ...c, ...(VERZAMEL_T[taal] ?? VERZAMEL_T.nl!) }]),
)

export const COPY: Record<FilmId, Record<string, Copy>> = {
  intro: INTRO, bonus: BONUS, spelen: SPEL, weetje: WEET,
  alfabet: ALFA, route: ROUTE, onthouden: ONTHOUD, verzamelen: VERZAMEL,
}
