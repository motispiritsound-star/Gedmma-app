/**
 * Sbaa de Atlasleeuw — deel 1: De poorten van Fes.
 *
 * Een prentenboek voor twee tot acht jaar. De ouder leest het in het
 * Nederlands voor en struikelt één keer per bladzijde over een woord Darija —
 * en dat struikelen ís het verhaal. Alle twaalf woorden staan in de app en
 * zijn ingesproken, dus de QR-code achterin kost niets.
 *
 * Vaste bezetting: Sbaa en zes kinderen. Ze zijn er niet alle zes op elke
 * bladzijde, want zes kinderen op één plaat is voor een kleuter een menigte.
 * Per deel reizen er twee of drie mee; Rayan is er altijd bij, want hij is de
 * motor van het voorlezen — hij zegt elk woord twee keer na, en daar doet een
 * kind van drie vanzelf aan mee.
 */

export interface Figuur {
  id: string
  naam: string
  leeftijd: number
  /** Eén zin die zegt wie hij is; de tekenaar en de schrijver houden zich eraan. */
  wie: string
  /** Waaraan je hem herkent, op elke plaat weer. */
  kenmerk: string
  kleur: string
}

export const CAST: Figuur[] = [
  { id: 'sbaa', naam: 'Sbaa', leeftijd: 0,
    wie: 'De Atlasleeuw. Groot, zacht, en een beetje verlegen. Hij kent elk woord en zegt het altijd één keer langzaam.',
    kenmerk: 'Manen als een zonnestraal, en een blauwe reistas over zijn schouder.', kleur: '#e2984a' },
  { id: 'adil', naam: 'Adil', leeftijd: 9,
    wie: 'De oudste. Heeft de kaart, wil alles weten, en leest de borden hardop voor.',
    kenmerk: 'Een groene rugzak en een opgevouwen kaart in zijn hand.', kleur: '#0d9488' },
  { id: 'yousra', naam: 'Yousra', leeftijd: 8,
    wie: 'Tekent alles wat ze ziet. Kijkt langer naar dingen dan de anderen.',
    kenmerk: 'Een schetsboek onder haar arm en een potlood achter haar oor.', kleur: '#c1272d' },
  { id: 'amir', naam: 'Amir', leeftijd: 7,
    wie: 'Rent vooruit en vergeet te kijken. Komt altijd als eerste aan en als laatste terug.',
    kenmerk: 'Rode schoenen en een streepjesshirt.', kleur: '#e2603c' },
  { id: 'yassine', naam: 'Yassine', leeftijd: 6,
    wie: 'Verzamelt. Stenen, schelpen, dopjes — zijn zakken zitten altijd vol.',
    kenmerk: 'Uitpuilende zakken en een blauwe pet.', kleur: '#2f6fb3' },
  { id: 'adam', naam: 'Adam', leeftijd: 5,
    wie: 'Heeft honger. Altijd. Vindt overal iets te eten.',
    kenmerk: 'Een geel shirt met kruimels erop.', kleur: '#f59e0b' },
  { id: 'rayan', naam: 'Rayan', leeftijd: 3,
    wie: 'De jongste. Zegt alles na, twee keer, en lacht er dan om.',
    kenmerk: 'Kleine paarse jas, en hij houdt altijd iemands hand vast.', kleur: '#7c5cbf' },
]

export interface Blad {
  /** Welke tekening; `scripts/make-prentenboek.mjs` kent ze bij naam. */
  scene: string
  /** De voorleestekst, regel voor regel. Kort houden: dit wordt hardop gelezen. */
  tekst: string[]
  /** Het woord van deze bladzijde. Alle twaalf zijn ingesproken. */
  woord: { id: string; ar: string; tr: string; nl: string }
  /** Wat Rayan eronder roept. Altijd twee keer; daar doet een kind aan mee. */
  echo: string
}

export const DEEL1 = {
  nummer: 1,
  titel: 'Sbaa en de poorten van Fes',
  ondertitel: 'Twaalf woorden Darija, voor wie nog niet kan lezen',
  leeftijd: '2 – 8 jaar',
  opdracht: 'Voor ieder kind dat zijn oma wél verstaat, maar haar nog niet kan antwoorden.',
  bladen: [
    {
      scene: 'atlas',
      tekst: [
        'Hoog in de bergen woont een leeuw.',
        'Hij heet Sbaa.',
        'Vandaag komen er kinderen op bezoek.',
        '“Salam!” roept Sbaa naar beneden.',
        'Dat is hallo.',
      ],
      woord: { id: 'salam', ar: 'السلام', tr: 'salam', nl: 'hallo' },
      echo: 'Salam! Salam!',
    },
    {
      scene: 'poort',
      tekst: [
        'Ze lopen de hele ochtend.',
        'Dan staan ze stil.',
        'Voor hen is een deur, zo hoog als drie ezels op elkaar.',
        '“Dat is een bab,” zegt Sbaa.',
      ],
      woord: { id: 'bab', ar: 'باب', tr: 'bab', nl: 'deur' },
      echo: 'Bab! Bab!',
    },
    {
      scene: 'welkom',
      tekst: [
        'Achter de poort staat een vrouw met muntthee.',
        'Ze lacht naar de kinderen.',
        '“Merhba,” zegt ze.',
        'Dat betekent: kom binnen, je hoort erbij.',
      ],
      woord: { id: 'merhba', ar: 'مرحبا', tr: 'merhba', nl: 'welkom' },
      echo: 'Merhba! Merhba!',
    },
    {
      scene: 'medina',
      tekst: [
        'Binnen zijn de straatjes zo smal',
        'dat Sbaa zijn schouders moet intrekken.',
        '“Waar zijn we?” vraagt Adil.',
        '“In de medina,” zegt Sbaa. “De oudste stad van het land.”',
      ],
      woord: { id: 'medina', ar: 'مدينة', tr: 'medina', nl: 'oude stad' },
      echo: 'Medina! Medina!',
    },
    {
      scene: 'ezel',
      tekst: [
        'Er komt iets aan.',
        'Iets met lange oren en zeven manden op zijn rug.',
        '“Balak! Balak!” roept de man ernaast.',
        '“Aan de kant,” zegt Sbaa. “Daar komt een hmar.”',
      ],
      woord: { id: 'hmar', ar: 'حمار', tr: 'hmar', nl: 'ezel' },
      echo: 'Hmar! Hmar!',
    },
    {
      scene: 'brood',
      tekst: [
        'Adam ruikt iets.',
        'Adam ruikt altijd iets.',
        'Uit een gat in de muur komt warm, rond brood.',
        '“Khobz,” zegt de bakker, en hij geeft Adam het kleinste.',
      ],
      woord: { id: 'khobz', ar: 'خبز', tr: 'khobz', nl: 'brood' },
      echo: 'Khobz! Khobz!',
    },
    {
      scene: 'babouches',
      tekst: [
        'Yassine blijft staan bij een muur van schoenen.',
        'Geel, rood, wit, en helemaal boven één paar goud.',
        'Ze hebben geen veters en geen hak.',
        '“Belgha,” zegt de schoenmaker.',
      ],
      woord: { id: 'babouche', ar: 'بلغة', tr: 'belgha', nl: 'babouches' },
      echo: 'Belgha! Belgha!',
    },
    {
      scene: 'souq',
      tekst: [
        'Dan wordt het druk. Heel druk.',
        'Olijven, munt, potten, tapijten, kippen.',
        'Iedereen roept, en niemand is boos.',
        '“Dit is de souq,” zegt Sbaa. “De markt.”',
      ],
      woord: { id: 'souq', ar: 'السوق', tr: 'ssouq', nl: 'de markt' },
      echo: 'Souq! Souq!',
    },
    {
      scene: 'thee',
      tekst: [
        'Ze zitten op een kleedje.',
        'De man giet van heel hoog, en er komt schuim op.',
        'Het ruikt naar munt en het is zoet.',
        '“Atay,” zegt hij. “Voorzichtig, hij is heet.”',
      ],
      woord: { id: 'atay', ar: 'أتاي', tr: 'atay', nl: 'muntthee' },
      echo: 'Atay! Atay!',
    },
    {
      scene: 'zon',
      tekst: [
        'De muren worden oranje.',
        'Dan roze.',
        'Yousra tekent het na, maar haar potlood heeft die kleur niet.',
        '“De shems gaat slapen,” zegt Sbaa.',
      ],
      woord: { id: 'shems', ar: 'شمس', tr: 'shems', nl: 'zon' },
      echo: 'Shems! Shems!',
    },
    {
      scene: 'jedda',
      tekst: [
        'Aan het eind van een straatje staat een deur open.',
        'Er staat een oude vrouw in, met meel op haar handen.',
        'Ze kijkt naar de kinderen alsof ze hen al kent.',
        '“Jeddti,” fluistert Rayan. Mijn oma.',
      ],
      woord: { id: 'jedda', ar: 'جدتي', tr: 'jeddti', nl: 'mijn oma' },
      echo: 'Jeddti! Jeddti!',
    },
    {
      scene: 'afscheid',
      tekst: [
        'Het is laat. De sterren staan boven de medina.',
        'Sbaa gaat terug naar de bergen.',
        '“Kom je nog een keer?” vraagt Rayan.',
        '“Bslama,” zegt Sbaa. “Dat is: tot ziens.”',
        'En dat is geen afscheid voor altijd.',
      ],
      woord: { id: 'bslama', ar: 'بسلامة', tr: 'bslama', nl: 'tot ziens' },
      echo: 'Bslama! Bslama!',
    },
  ] as Blad[],
}
