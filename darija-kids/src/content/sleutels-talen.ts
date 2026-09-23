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
    disclaimer: [
      'Ce livre est inventé, mais pas n’importe comment.',
      'Les événements qu’il raconte ont vraiment eu lieu : les villes, les batailles, les voyages, les livres et les gens qui ont fait l’histoire. Ce que l’on en sait a été vérifié, et n’a pas été rendu plus beau qu’il ne l’était.',
      'Les garçons et les filles qui racontent l’histoire sont inventés. Ils n’ont pas existé, et la clé qui passe de main en main n’a jamais existé non plus. Il le fallait : des enfants ordinaires de ces époques, on ne sait presque rien — et ce sont justement eux à côté de qui on a envie d’être assis quand il se passe quelque chose de grand.',
      'Chaque fois que l’histoire comble un trou avec de l’imagination, c’est écrit à la fin, dans « Ce qui s’est vraiment passé ». Lis cette partie. C’est ce qu’il y a de plus passionnant dans le livre, parce qu’on y voit à quel point l’histoire vraie est souvent plus étrange encore.',
    ],
  },
}

export const schilVanSleutel = (taal: string): SleutelSchil =>
  SLEUTEL_SCHIL[taal] ?? SLEUTEL_SCHIL.nl

import { FR_SLEUTELS } from './sleutels-fr'

export const SLEUTEL_VERTALINGEN: Record<string, SleutelVertaling> = { fr: FR_SLEUTELS }

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
