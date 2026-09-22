/**
 * De prentenboeken in de andere talen.
 *
 * `DELEN` in `prentenboek.ts` is het Nederlandse origineel én het geraamte:
 * daar staat welke tekening bij welke bladzijde hoort, welk Darija-woord erop
 * staat en hoe je het uitspreekt. Dat is in elke taal hetzelfde.
 *
 * Wat hier per taal bij komt, is alleen de voorleestekst en de betekenis van
 * het woord. `deelIn()` legt die twee over elkaar heen en levert een `Deel` op
 * dat de zetter niet van een Nederlands deel kan onderscheiden.
 *
 * Een taal die nog niet vertaald is, valt terug op het Nederlands. Dat is
 * beter dan een half boek: wie een Italiaanse versie koopt die er nog niet is,
 * hoort dat op de winkelpagina te lezen en niet te ontdekken op bladzijde
 * zeven.
 */
import { DELEN, type Deel, type Vertaling } from './prentenboek'
import { FR } from './prentenboek-fr'
import { DE } from './prentenboek-de'
import { ES } from './prentenboek-es'
import { IT } from './prentenboek-it'
import { EN } from './prentenboek-en'

export const VERTALINGEN: Record<string, Vertaling> = { fr: FR, de: DE, es: ES, it: IT, en: EN }

/**
 * Welke talen compleet zijn.
 *
 * Compleet is: alle twaalf de delen, elk met evenveel bladzijden als het
 * Nederlands. Half vertaald telt niet mee — dan zou de winkel een Franse
 * versie aanbieden die halverwege in het Nederlands verdergaat, en dat is
 * erger dan hem nog niet aanbieden.
 */
const compleet = (vertaling: Vertaling): boolean =>
  DELEN.every((deel) => vertaling[deel.nummer]?.bladen.length === deel.bladen.length)

export const TALEN_KLAAR: string[] = [
  'nl',
  ...Object.entries(VERTALINGEN).filter(([, v]) => compleet(v)).map(([taal]) => taal),
]

/** Hoe ver elke taal is, voor `npm run winkel` en voor de test. */
export const VORDERING: Record<string, { klaar: number; totaal: number }> =
  Object.fromEntries(Object.entries(VERTALINGEN).map(([taal, v]) => [taal, {
    klaar: DELEN.filter((d) => v[d.nummer]?.bladen.length === d.bladen.length).length,
    totaal: DELEN.length,
  }]))

export const deelIn = (taal: string, nummer: number): Deel => {
  const basis = DELEN.find((d) => d.nummer === nummer)
  if (!basis) throw new Error(`prentenboek: deel ${nummer} bestaat niet`)
  const vertaald = VERTALINGEN[taal]?.[nummer]
  if (!vertaald) return basis

  if (vertaald.bladen.length !== basis.bladen.length) {
    throw new Error(
      `prentenboek: deel ${nummer} heeft in het Nederlands ${basis.bladen.length} bladzijden ` +
      `en in het ${taal} ${vertaald.bladen.length}. Die moeten gelijk zijn, want de tekeningen liggen vast.`,
    )
  }

  return {
    ...basis,
    waar: vertaald.waar,
    hierna: vertaald.hierna,
    titel: vertaald.titel,
    ondertitel: vertaald.ondertitel,
    leeftijd: vertaald.leeftijd,
    opdracht: vertaald.opdracht,
    bladen: basis.bladen.map((blad, i) => ({
      ...blad,
      tekst: vertaald.bladen[i].tekst,
      woord: { ...blad.woord, nl: vertaald.bladen[i].woord },
    })),
  }
}

/**
 * De rand van het boek: de pillen, de knop, de kopjes achterin.
 *
 * Dit is geen verhaal en het hoort daarom niet bij de vertalingen van de
 * delen. Het staat hier omdat het wel mee moet: een Frans boek met een
 * Nederlandse knop "Zeg het hardop!" is geen Frans boek.
 *
 * Een taal die hier ontbreekt, valt terug op het Nederlands — maar dan is de
 * taal sowieso niet af, en dat meldt de zetter al.
 */
export interface Schil {
  woord: (n: number) => string
  hardop: string
  voet: string
  waarSpeelt: string
  wieMee: string
  jaar: string
  deWoorden: string
  uitleg: string
  hierna: string
  deel: (n: number) => string
}

export const SCHIL: Record<string, Schil> = {
  nl: {
    woord: (n) => `Woord ${n}`,
    hardop: 'Zeg het hardop!',
    voet: 'Darija for Kids · samen leren met Sba',
    waarSpeelt: 'Waar dit boek speelt',
    wieMee: 'Wie er meegaan',
    jaar: 'jaar',
    deWoorden: 'De twaalf woorden van dit boek',
    uitleg: 'Onder elk woord staat hoe je het zegt, in gewone letters. Lees het voor zoals het er staat — dan klopt het. Wil je het horen, dan staan alle twaalf ook in de app.',
    hierna: 'Hierna',
    deel: (n) => `darijaforkids.eu · Sba deel ${n}`,
  },
  fr: {
    woord: (n) => `Mot ${n}`,
    hardop: 'Dis-le à voix haute !',
    voet: 'Darija for Kids · apprendre avec Sba',
    waarSpeelt: 'Où se passe ce livre',
    wieMee: 'Qui vient avec',
    jaar: 'ans',
    deWoorden: 'Les douze mots de ce livre',
    uitleg: 'Sous chaque mot, la prononciation est écrite en lettres normales. Lis-la comme elle est écrite — ça marche. Et si tu veux l’entendre, les douze sont aussi dans l’application.',
    hierna: 'La suite',
    deel: (n) => `darijaforkids.eu · Sba tome ${n}`,
  },
  de: {
    woord: (n) => `Wort ${n}`,
    hardop: 'Sag es laut!',
    voet: 'Darija for Kids · zusammen lernen mit Sba',
    waarSpeelt: 'Wo dieses Buch spielt',
    wieMee: 'Wer mitkommt',
    jaar: 'Jahre',
    deWoorden: 'Die zwölf Wörter dieses Buches',
    uitleg: 'Unter jedem Wort steht, wie man es sagt, in ganz normalen Buchstaben. Lies es genau so vor, wie es dasteht — dann stimmt es. Und wer es hören möchte: alle zwölf gibt es auch in der App.',
    hierna: 'Weiter geht es',
    deel: (n) => `darijaforkids.eu · Sba Band ${n}`,
  },
  es: {
    woord: (n) => `Palabra ${n}`,
    hardop: '¡Dilo en voz alta!',
    voet: 'Darija for Kids · aprender juntos con Sba',
    waarSpeelt: 'Dónde pasa este libro',
    wieMee: 'Quiénes van',
    jaar: 'años',
    deWoorden: 'Las doce palabras de este libro',
    uitleg: 'Debajo de cada palabra está cómo se dice, en letras normales. Léela tal como está escrita — así sale bien. Y si la quieres oír, las doce están también en la aplicación.',
    hierna: 'Y después',
    deel: (n) => `darijaforkids.eu · Sba tomo ${n}`,
  },
  it: {
    woord: (n) => `Parola ${n}`,
    hardop: 'Dillo ad alta voce!',
    voet: 'Darija for Kids · imparare insieme a Sba',
    waarSpeelt: 'Dove si svolge questo libro',
    wieMee: 'Chi viene',
    jaar: 'anni',
    deWoorden: 'Le dodici parole di questo libro',
    uitleg: 'Sotto ogni parola c’è scritto come si dice, in lettere normali. Leggila proprio come sta scritta — così viene giusta. E se la vuoi sentire, tutte e dodici sono anche nell’applicazione.',
    hierna: 'E poi',
    deel: (n) => `darijaforkids.eu · Sba volume ${n}`,
  },
  en: {
    woord: (n) => `Word ${n}`,
    hardop: 'Say it out loud!',
    voet: 'Darija for Kids · learning together with Sba',
    waarSpeelt: 'Where this book takes place',
    wieMee: 'Who comes along',
    jaar: 'years',
    deWoorden: 'The twelve words of this book',
    uitleg: 'Under every word you can see how to say it, in ordinary letters. Read it just as it is written — that works. And if you want to hear it, all twelve are in the app as well.',
    hierna: 'Next',
    deel: (n) => `darijaforkids.eu · Sba book ${n}`,
  },
}

export const schilVan = (taal: string): Schil => SCHIL[taal] ?? SCHIL.nl
