/**
 * De sleutels van Marokko in de andere talen.
 *
 * Anders dan bij de prentenboeken is hier niets te "onderleggen": een deel
 * bestaat volledig uit tekst, dus een vertaling levert het hele deel opnieuw
 * aan — titel, flap, de hoofdstukken, en de bladzijden achterin waar staat wat
 * er echt gebeurd is. Wat blijft staan is het nummer, de volgorde en het jaar
 * waarin het speelt.
 *
 * Een deel dat nog niet vertaald is, valt terug op het Nederlands. Dat is een
 * bewuste keuze: een half vertaald boek is erger dan een boek dat er nog niet
 * is, en de winkel hoort te melden welke talen klaar zijn.
 */
import type { Sleuteldeel } from './sleutels'

export interface VertaaldSleuteldeel {
  titel: string
  jaar: string
  waar: string
  verteller: string
  flap: string
  sleutel: string
  echt: string[]
  verzonnen: string[]
  /** Evenveel hoofdstukken als het Nederlands, in dezelfde volgorde. */
  hoofdstukken: { titel: string; tekst: string[] }[]
}

export type SleutelVertaling = Record<number, VertaaldSleuteldeel>

/**
 * De rand van het boek: de kopjes, de kaders, de bandtekst.
 *
 * Dit is geen verhaal en het staat daarom niet bij de vertaalde delen. Het
 * moet wel mee: een Frans boek met een Nederlands kopje "Wat hiervan is echt
 * gebeurd" is geen Frans boek.
 */
export interface SleutelSchil {
  reeksnaam: string
  deelVan: (n: number) => string
  merk: string
  waarSpeelt: string
  kaartNoot: string
  inDeTijd: string
  balkNoot: string
  wistJeDit: string
  achterinKop: string
  echtKop: string
  verzonnenKop: string
  sleutelKop: string
  hoofdstuk: (n: number) => string
  leesVerder: (n: number) => string
  laatsteDeel: string
  prent: string
  prentNoot: string
  beeldenKop: string
  beeldenNoot: string
  /** Het slotblad van een proefversie: waar het ophoudt en waar de rest staat. */
  proefKop: string
  proefTekst: string
  proefWaar: string
  disclaimer: string[]
}

const DISCLAIMER_NL = [
  'Dit boek is verzonnen, maar niet zomaar.',
  'De gebeurtenissen erin zijn echt gebeurd: de steden, de veldslagen, de reizen, de boeken en de mensen die geschiedenis hebben gemaakt. Wat daarover bekend is, is nagekeken en niet mooier gemaakt dan het was.',
  'De jongens en meisjes die het verhaal vertellen zijn verzonnen. Zij liepen er niet echt rond, en de sleutel die van hand tot hand gaat heeft nooit bestaan. Dat moest, want van gewone kinderen uit die tijd weten we bijna niets — en juist zij zijn de mensen bij wie je wilt zitten als er iets groots gebeurt.',
  'Waar het verhaal een gat in de geschiedenis opvult met fantasie, staat dat achterin bij "Wat hiervan is echt gebeurd". Lees dat stuk. Het is het spannendste van het boek, want daar zie je hoe vreemd het echte verhaal vaak nog is.',
]

export const SLEUTEL_SCHIL: Record<string, SleutelSchil> = {
  nl: {
    reeksnaam: 'De sleutels van Marokko',
    deelVan: (n) => `Deel ${n} van vijftien`,
    merk: 'Darija for Kids · vanaf 9 jaar',
    waarSpeelt: 'Waar dit deel speelt',
    kaartNoot: 'De kaart is vereenvoudigd getekend.',
    inDeTijd: 'Waar dit deel staat in de tijd',
    balkNoot: 'Vijftien delen, van de Romeinse tijd tot nu. De jaren staan op gelijke afstand, niet op schaal.',
    wistJeDit: 'Wist je dit?',
    achterinKop: 'Wat hiervan is echt gebeurd',
    echtKop: 'Dit is echt gebeurd',
    verzonnenKop: 'Dit is verzonnen',
    sleutelKop: 'De sleutel',
    hoofdstuk: (n) => `Hoofdstuk ${n}`,
    leesVerder: (n) => `Lees verder in deel ${n}`,
    laatsteDeel: 'Het laatste deel',
    prent: 'Prent',
    prentNoot: 'Prent. Zodra er een opname van deze plek is, staat die hier.',
    beeldenKop: 'De beelden',
    beeldenNoot: 'De foto’s en afbeeldingen in dit boek komen van de plekken waar dit verhaal speelt. Hieronder staat waar ze vandaan komen.',
    proefKop: 'Dit was het begin',
    proefTekst:
      'Je hebt het begin gelezen. Hoe het afloopt staat in het hele boek — en daarna nog veertien delen, tot de sleutel in Utrecht op tafel ligt.',
    proefWaar: 'Het hele boek en de hele reeks: darijaforkids.eu',
    disclaimer: DISCLAIMER_NL,
  },
  fr: {
    reeksnaam: 'Les clés du Maroc',
    deelVan: (n) => `Tome ${n} sur quinze`,
    merk: 'Darija for Kids · à partir de 9 ans',
    waarSpeelt: 'Où se passe ce tome',
    kaartNoot: 'La carte est dessinée de façon simplifiée.',
    inDeTijd: 'Où se place ce tome dans le temps',
    balkNoot: 'Quinze tomes, de l’époque romaine à aujourd’hui. Les années sont espacées régulièrement, pas à l’échelle.',
    wistJeDit: 'Le savais-tu ?',
    achterinKop: 'Ce qui s’est vraiment passé',
    echtKop: 'Ceci est vrai',
    verzonnenKop: 'Ceci est inventé',
    sleutelKop: 'La clé',
    hoofdstuk: (n) => `Chapitre ${n}`,
    leesVerder: (n) => `À lire ensuite : tome ${n}`,
    laatsteDeel: 'Le dernier tome',
    prent: 'Dessin',
    prentNoot: 'Dessin. Dès qu’il y aura une photo de ce lieu, elle sera ici.',
    beeldenKop: 'Les images',
    beeldenNoot: 'Les photos et les images de ce livre viennent des lieux où se passe cette histoire. Ci-dessous, d’où elles proviennent.',
    proefKop: 'Ce n’était que le début',
    proefTekst:
      'Vous avez lu le début. La suite est dans le livre entier — et après lui quatorze tomes encore, jusqu’à ce que la clé se retrouve sur une table à Utrecht.',
    proefWaar: 'Le livre entier et toute la série : darijaforkids.eu',
    disclaimer: [
      'Ce livre est inventé, mais pas n’importe comment.',
      'Les événements qu’il raconte ont vraiment eu lieu : les villes, les batailles, les voyages, les livres et les gens qui ont fait l’histoire. Ce que l’on en sait a été vérifié, et n’a pas été rendu plus beau qu’il ne l’était.',
      'Les garçons et les filles qui racontent l’histoire sont inventés. Ils n’ont pas existé, et la clé qui passe de main en main n’a jamais existé non plus. Il le fallait : des enfants ordinaires de ces époques, on ne sait presque rien — et ce sont justement eux à côté de qui on a envie d’être assis quand il se passe quelque chose de grand.',
      'Chaque fois que l’histoire comble un trou avec de l’imagination, c’est écrit à la fin, dans « Ce qui s’est vraiment passé ». Lis cette partie. C’est ce qu’il y a de plus passionnant dans le livre, parce qu’on y voit à quel point l’histoire vraie est souvent plus étrange encore.',
    ],
  },
  es: {
    reeksnaam: 'Las llaves de Marruecos',
    deelVan: (n) => `Libro ${n} de quince`,
    merk: 'Darija for Kids · a partir de 9 años',
    waarSpeelt: 'Dónde transcurre este libro',
    kaartNoot: 'El mapa está dibujado de forma simplificada.',
    inDeTijd: 'Dónde se sitúa este libro en el tiempo',
    balkNoot: 'Quince libros, desde la época romana hasta hoy. Los años están a la misma distancia, no a escala.',
    wistJeDit: '¿Sabías esto?',
    achterinKop: 'Qué hay de verdad en todo esto',
    echtKop: 'Esto ocurrió de verdad',
    verzonnenKop: 'Esto es inventado',
    sleutelKop: 'La llave',
    hoofdstuk: (n) => `Capítulo ${n}`,
    leesVerder: (n) => `Sigue leyendo en el libro ${n}`,
    laatsteDeel: 'El último libro',
    prent: 'Dibujo',
    prentNoot: 'Dibujo. En cuanto haya una fotografía de este lugar, estará aquí.',
    beeldenKop: 'Las imágenes',
    beeldenNoot: 'Las fotografías e ilustraciones de este libro vienen de los lugares donde transcurre esta historia. Abajo está de dónde proceden.',
    proefKop: 'Das war der Anfang',
    proefTekst:
      'Du hast den Anfang gelesen. Wie es weitergeht, steht im ganzen Buch — und danach noch vierzehn Bände, bis der Schlüssel in Utrecht auf dem Tisch liegt.',
    proefWaar: 'Das ganze Buch und die ganze Reihe: darijaforkids.eu',
    disclaimer: [
      'Este libro es inventado, pero no de cualquier manera.',
      'Lo que ocurre en él ocurrió de verdad: las ciudades, las batallas, los viajes, los libros y las personas que hicieron historia. Lo que se sabe de todo eso se ha comprobado y no se ha adornado más de lo que fue.',
      'Los niños y las niñas que cuentan la historia son inventados. No existieron, y la llave que va de mano en mano tampoco existió nunca. Tenía que ser así: de los niños corrientes de aquellos tiempos no se sabe casi nada — y es justo al lado de ellos donde uno quiere sentarse cuando pasa algo grande.',
      'Donde la historia llena un hueco con imaginación, se dice al final del libro, en «Qué hay de verdad en todo esto». Lee esa parte. Es lo más apasionante del libro, porque allí se ve cuánto más extraña suele ser la historia de verdad.',
    ],
  },
  de: {
    reeksnaam: 'Die Schlüssel Marokkos',
    deelVan: (n) => `Band ${n} von fünfzehn`,
    merk: 'Darija for Kids · ab 9 Jahren',
    waarSpeelt: 'Wo dieser Band spielt',
    kaartNoot: 'Die Karte ist vereinfacht gezeichnet.',
    inDeTijd: 'Wo dieser Band in der Zeit steht',
    balkNoot: 'Fünfzehn Bände, von der Römerzeit bis heute. Die Jahre stehen in gleichem Abstand, nicht maßstabsgetreu.',
    wistJeDit: 'Wusstest du das?',
    achterinKop: 'Was hiervon wirklich geschehen ist',
    echtKop: 'Das ist wirklich geschehen',
    verzonnenKop: 'Das ist erfunden',
    sleutelKop: 'Der Schlüssel',
    hoofdstuk: (n) => `Kapitel ${n}`,
    leesVerder: (n) => `Weiterlesen in Band ${n}`,
    laatsteDeel: 'Der letzte Band',
    prent: 'Zeichnung',
    prentNoot: 'Zeichnung. Sobald es eine Aufnahme dieses Ortes gibt, steht sie hier.',
    beeldenKop: 'Die Bilder',
    beeldenNoot: 'Die Fotos und Abbildungen in diesem Buch stammen von den Orten, an denen diese Geschichte spielt. Unten steht, woher sie kommen.',
    proefKop: 'Esto era solo el principio',
    proefTekst:
      'Has leído el principio. Cómo acaba está en el libro entero, y después catorce libros más, hasta que la llave acaba sobre una mesa en Utrecht.',
    proefWaar: 'El libro entero y la serie completa: darijaforkids.eu',
    disclaimer: [
      'Dieses Buch ist erfunden, aber nicht irgendwie.',
      'Was darin geschieht, ist wirklich geschehen: die Städte, die Schlachten, die Reisen, die Bücher und die Menschen, die Geschichte gemacht haben. Was davon bekannt ist, wurde nachgeprüft und nicht schöner gemacht, als es war.',
      'Die Jungen und Mädchen, die erzählen, sind erfunden. Es hat sie nicht gegeben, und den Schlüssel, der von Hand zu Hand geht, hat es auch nie gegeben. Das musste so sein: von gewöhnlichen Kindern jener Zeiten weiß man fast nichts — und genau neben ihnen möchte man sitzen, wenn etwas Großes passiert.',
      'Wo die Geschichte ein Loch mit Fantasie füllt, steht das hinten im Buch, unter „Was hiervon wirklich geschehen ist“. Lies diesen Teil. Er ist das Spannendste am Buch, weil man dort sieht, wie viel seltsamer die wirkliche Geschichte oft ist.',
    ],
  },
  it: {
    reeksnaam: 'Le chiavi del Marocco',
    deelVan: (n) => `Libro ${n} di quindici`,
    merk: 'Darija for Kids · dai 9 anni',
    waarSpeelt: 'Dove si svolge questo libro',
    kaartNoot: 'La mappa è disegnata in modo semplificato.',
    inDeTijd: 'Dove si colloca questo libro nel tempo',
    balkNoot: 'Quindici libri, dall’epoca romana a oggi. Gli anni sono a distanze uguali, non in scala.',
    wistJeDit: 'Lo sapevi?',
    achterinKop: 'Che cosa è successo davvero',
    echtKop: 'Questo è successo davvero',
    verzonnenKop: 'Questo è inventato',
    sleutelKop: 'La chiave',
    hoofdstuk: (n) => `Capitolo ${n}`,
    leesVerder: (n) => `Continua nel libro ${n}`,
    laatsteDeel: 'L’ultimo libro',
    prent: 'Disegno',
    prentNoot: 'Disegno. Appena ci sarà una fotografia di questo luogo, sarà qui.',
    beeldenKop: 'Le immagini',
    beeldenNoot: 'Le fotografie e le illustrazioni di questo libro vengono dai luoghi in cui si svolge questa storia. Qui sotto c’è da dove provengono.',
    proefKop: 'Questo era l’inizio',
    proefTekst:
      'Hai letto l’inizio. Come va a finire è nel libro intero — e poi altri quattordici libri, finché la chiave non finisce su un tavolo a Utrecht.',
    proefWaar: 'Il libro intero e tutta la serie: darijaforkids.eu',
    disclaimer: [
      'Questo libro è inventato, ma non a caso.',
      'Quello che ci succede dentro è successo davvero: le città, le battaglie, i viaggi, i libri e le persone che hanno fatto la storia. Quel che se ne sa è stato verificato e non è stato reso più bello di com’era.',
      'I ragazzi e le ragazze che raccontano la storia sono inventati. Non sono esistiti, e nemmeno la chiave che passa di mano in mano è mai esistita. Doveva essere così: dei bambini comuni di quei tempi non sappiamo quasi nulla — e sono proprio loro quelli accanto a cui si vuole stare quando succede qualcosa di grande.',
      'Dove la storia riempie un vuoto con la fantasia, lo si dice in fondo al libro, in «Che cosa è successo davvero». Leggi quella parte. È la cosa più appassionante del libro, perché lì si vede quanto più strana sia spesso la storia vera.',
    ],
  },
  en: {
    reeksnaam: 'The Keys of Morocco',
    deelVan: (n) => `Book ${n} of fifteen`,
    merk: 'Darija for Kids · ages 9 and up',
    waarSpeelt: 'Where this book takes place',
    kaartNoot: 'The map is drawn in simplified form.',
    inDeTijd: 'Where this book sits in time',
    balkNoot: 'Fifteen books, from Roman times to today. The years are spaced evenly, not to scale.',
    wistJeDit: 'Did you know?',
    achterinKop: 'What really happened',
    echtKop: 'This really happened',
    verzonnenKop: 'This is made up',
    sleutelKop: 'The key',
    hoofdstuk: (n) => `Chapter ${n}`,
    leesVerder: (n) => `Read on in book ${n}`,
    laatsteDeel: 'The last book',
    prent: 'Drawing',
    prentNoot: 'Drawing. As soon as there is a photograph of this place, it will be here.',
    beeldenKop: 'The images',
    beeldenNoot: 'The photographs and illustrations in this book come from the places where this story happens. Below is where they come from.',
    proefKop: 'That was the beginning',
    proefTekst:
      'You have read the beginning. How it ends is in the whole book — and after that another fourteen books, until the key ends up on a table in Utrecht.',
    proefWaar: 'The whole book and the whole series: darijaforkids.eu',
    disclaimer: [
      'This book is made up, but not carelessly.',
      'The things that happen in it really happened: the cities, the battles, the journeys, the books and the people who made history. What is known about all that has been checked, and has not been made prettier than it was.',
      'The boys and girls who tell the story are made up. They did not exist, and the key that passes from hand to hand never existed either. It had to be that way: about ordinary children from those times we know almost nothing — and they are exactly the people you want to be sitting next to when something big happens.',
      'Wherever the story fills a gap with imagination, it says so at the back of the book, under «What really happened». Read that part. It is the most gripping thing in the book, because that is where you see how much stranger the real story often is.',
    ],
  },
}

export const schilVanSleutel = (taal: string): SleutelSchil =>
  SLEUTEL_SCHIL[taal] ?? SLEUTEL_SCHIL.nl

import { DE_SLEUTELS } from './sleutels-de'
import { ES_SLEUTELS } from './sleutels-es'
import { FR_SLEUTELS } from './sleutels-fr'
import { EN_SLEUTELS } from './sleutels-en'
import { IT_SLEUTELS } from './sleutels-it'

export const SLEUTEL_VERTALINGEN: Record<string, SleutelVertaling> =
  { de: DE_SLEUTELS, en: EN_SLEUTELS, es: ES_SLEUTELS, fr: FR_SLEUTELS, it: IT_SLEUTELS }

/**
 * Een deel in een taal, over het Nederlandse deel heen gelegd.
 *
 * De zetter heeft het Nederlandse deel al geladen — dat is het enige wat
 * zeker bestaat — en krijgt hier hetzelfde deel terug in de gevraagde taal.
 * Een verschil in het aantal hoofdstukken is geen vertaling maar een fout, en
 * dan stopt het hier in plaats van halverwege een boek.
 */
export const sleuteldeelIn = (taal: string, basis: Sleuteldeel): Sleuteldeel => {
  const vertaald = SLEUTEL_VERTALINGEN[taal]?.[basis.nummer]
  if (!vertaald) return basis

  if (vertaald.hoofdstukken.length !== basis.hoofdstukken.length) {
    throw new Error(
      `sleutels: deel ${basis.nummer} heeft in het Nederlands ${basis.hoofdstukken.length} hoofdstukken ` +
      `en in het ${taal} ${vertaald.hoofdstukken.length}. Die moeten gelijk zijn.`,
    )
  }

  return {
    ...basis,
    titel: vertaald.titel,
    jaar: vertaald.jaar,
    waar: vertaald.waar,
    verteller: vertaald.verteller,
    flap: vertaald.flap,
    sleutel: vertaald.sleutel,
    echt: vertaald.echt,
    verzonnen: vertaald.verzonnen,
    hoofdstukken: basis.hoofdstukken.map((h, i) => ({
      nummer: h.nummer,
      titel: vertaald.hoofdstukken[i].titel,
      tekst: vertaald.hoofdstukken[i].tekst,
    })),
  }
}

/** Hoe ver elke taal is, voor de winkel en voor de test. */
export const SLEUTEL_VORDERING: Record<string, number> =
  Object.fromEntries(Object.entries(SLEUTEL_VERTALINGEN).map(([taal, v]) => [taal, Object.keys(v).length]))
