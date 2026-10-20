import type { Klankpaar } from './types'
import { NAKIJKSTAND } from './nakijken'

/**
 * Klankparen: twee echte woorden die in één letter verschillen.
 *
 * Dit is de oefenvorm die in de app waar de techniek van komt niet bestaat, en
 * de belangrijkste van unit 0. Het verschil tussen `ı` en `i` is niet uit te
 * leggen — je moet het horen, en dan merken dat het twee woorden zijn.
 *
 * `soort` is eerlijk bijgehouden. Een echt minimaal paar bestaat niet voor
 * elke letter met woorden die een kind van zeven mag kennen; waar dat zo is
 * staat `contrast` en is het twee verschillende woorden met dezelfde
 * klankpositie. Didactisch bijna net zo goed, maar het is geen minimaal paar
 * en dan hoort dat er te staan.
 *
 * Alle paren moeten nog nagekeken worden. Zie nakijken.ts en
 * docs/decisions.md B-1.
 */

const nagekeken = NAKIJKSTAND['klankparen.ts']!.klaar

const paar = (
  id: string,
  letters: [string, string],
  links: [string, string, string, string, string],
  rechts: [string, string, string, string, string],
  soort: Klankpaar['soort'] = 'minimaal',
): Klankpaar => ({
  id,
  soort,
  letters,
  links: { tr: links[0], betekenis: { nl: links[1], de: links[2], fr: links[3], en: links[4] } },
  rechts: { tr: rechts[0], betekenis: { nl: rechts[1], de: rechts[2], fr: rechts[3], en: rechts[4] } },
  nagekeken,
})

export const KLANKPAREN: Klankpaar[] = [
  // c / ç -- de letter die een Nederlandse lezer als k leest.
  paar('cam-cam', ['c', 'ç'],
    ['cam', 'glas', 'Glas', 'verre', 'glass'],
    ['çam', 'pijnboom', 'Kiefer', 'pin', 'pine tree']),

  // s / ş
  paar('kas-kas', ['s', 'ş'],
    ['kas', 'spier', 'Muskel', 'muscle', 'muscle'],
    ['kaş', 'wenkbrauw', 'Augenbraue', 'sourcil', 'eyebrow']),

  // ı / i -- het grootste struikelblok van allemaal.
  paar('kil-kil', ['ı', 'i'],
    ['kıl', 'haartje', 'Härchen', 'poil', 'hair (single)'],
    ['kil', 'klei', 'Ton', 'argile', 'clay']),
  paar('kir-kir', ['ı', 'i'],
    ['kır', 'platteland', 'Land', 'campagne', 'countryside'],
    ['kir', 'vuil', 'Schmutz', 'saleté', 'dirt']),

  // o / ö
  paar('koy-koy', ['o', 'ö'],
    ['koy', 'baai', 'Bucht', 'baie', 'bay'],
    ['köy', 'dorp', 'Dorf', 'village', 'village']),

  // u / ü
  paar('tur-tur', ['u', 'ü'],
    ['tur', 'rondje', 'Runde', 'tour', 'round'],
    ['tür', 'soort', 'Art', 'sorte', 'kind']),
  paar('un-un', ['u', 'ü'],
    ['un', 'meel', 'Mehl', 'farine', 'flour'],
    ['ün', 'roem', 'Ruhm', 'renommée', 'fame']),

  // ğ -- geen minimaal paar maar een contrast dat de zachte g hoorbaar maakt:
  // `dağ` klinkt als een gerekte `daa`, `da` is kort.
  paar('dag-da', ['ğ', '-'],
    ['dağ', 'berg', 'Berg', 'montagne', 'mountain'],
    ['da', 'ook', 'auch', 'aussi', 'too'],
    'contrast'),
]

export const KLANKPAAR = (id: string): Klankpaar | undefined =>
  KLANKPAREN.find((p) => p.id === id)
