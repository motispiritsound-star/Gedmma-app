import { allWords } from './lexicon'
import { ALL_SENTENCES } from './sentences'
import type { Target } from './pronunciation'

/**
 * Welke stem welk woord zegt.
 *
 * Er zijn drie wegen, en per woord is er maar één goed:
 *
 *   opname     — een mens die het zegt. Altijd het beste, en het enige dat
 *                gegarandeerd klopt. Staat in `src/audio/`, en wint overal.
 *   arabisch   — de Arabische stem van het toestel, die het Arabische schrift
 *                leest. Goed voor alles wat Darija met het Standaardarabisch
 *                deelt: شكرا is "shukran" in Rabat en in Caïro.
 *   geleend    — een Franse, Nederlandse of Spaanse stem die de Latijnse
 *                schrijfwijze leest. Soms beter voor Darija's eigen woorden,
 *                waar een Arabische stem er "anta" of "jaddatī" van maakt.
 *
 * Wat hier níét staat is een mening. Dit is een lijst van wat **getest** is:
 * een woord staat er pas in als iemand die Darija spreekt beide kanten heeft
 * gehoord en gekozen. Wat er niet in staat gaat naar de Arabische stem — de
 * oorspronkelijke weg, en voor het merendeel van de woordenschat de juiste.
 *
 * Want de geleende weg is geen wondermiddel. Hij werkt alleen als de Latijnse
 * schrijfwijze uitspreekbaar is in de taal die hem leest, en dat is precies
 * waar Darija lastig doet: "hmer" begint met twee medeklinkers waar het Frans
 * geen raad mee weet, dus dan is de Arabische stem alsnog dichterbij.
 *
 * De lijst groeit door te luisteren, niet door te redeneren. `npm run sheet`
 * zet elk woord naast elkaar met een knop per stem; wat daar gekozen wordt
 * hoort hier terecht te komen.
 */
export type Weg = 'arabisch' | 'geleend'

export const UITSPRAAK: Record<string, Weg> = {
  // Getest en goed met de Arabische stem.
  afak: 'arabisch',

  // Getest en beter met een geleende stem, die de Latijnse schrijfwijze leest.
  nta: 'geleend',
  nti: 'geleend',
  khoya: 'geleend',
  jedda: 'geleend',
  weld: 'geleend',
  tlata: 'geleend',
  mya: 'geleend',
  tomobil: 'geleend',
  henna: 'geleend',
  gnawa: 'geleend',
  msemmen: 'geleend',
}

/** Elk woord waarover een keuze is vastgelegd, welke dan ook. */
export const GETEST_IDS: string[] = Object.keys(UITSPRAAK)

/** De woorden die naar een geleende stem gaan. */
export const EIGEN_IDS: string[] = GETEST_IDS.filter((id) => UITSPRAAK[id] === 'geleend')

/**
 * De woorden waarvoor geen enkele stem deugt.
 *
 * Voor deze is beide wegen geprobeerd en afgeluisterd, en geen van de zeven
 * stemmen zegt ze goed. Dat is geen falen van de code maar de grens ervan: een
 * synthesizer die op Standaardarabisch is getraind kan "bzaf" niet zeggen, en
 * een Franse stem kan "hmer" niet beginnen. Er is maar één uitweg, en dat is
 * iemand die het inspreekt.
 *
 * Deze lijst is dus geen instelling maar een werkbriefje: het is wat er nog
 * opgenomen moet worden, in de volgorde waarin het gemeld is. De opnamestudio
 * op `/opname` zet ze bovenaan, en zodra er een bestand in `src/audio/woorden/`
 * staat verdwijnt dat woord er vanzelf uit — de map is de waarheid, niet deze
 * lijst.
 *
 * Tot die tijd hoort een woord hier de best beschikbare benadering te krijgen
 * en niets te beloven. Het alfabet is het bewijs dat het werkt: dat stond hier
 * ook, en staat er nu niet meer.
 */
export const OPNAME_NODIG: string[] = [
  // Groeten en gevoel.
  'mzyan', '3etshan', '3eyyan', 'bshwiya',
  // Het huis.
  'dar', 'bit-n3as', 'sherjem', 'lfrash', 'sarut', 'zerbiya', 'mraya',
  'stah',
  // School.
  'qism', 'ostad', 'ostada', 'kunash', 'sebbura',
  // Dieren.
  'kaydar', 'hmar', 'bgra', 'm3za', 'dzaza', 'twiar', 'fil', 'hensh', 'fertetto',
  'hut',
  // Tijd.
  'ghedda', '3shiya', 'lil', 'shher', '3am', 'lethnin', 'ttlat', 'larb3',
  'lekhmis',
  // Weer.
  'shta', 'rih', 'skhun', 'telj',
  // Het lichaam.
  'ras', 'sh3ar', '3in', 'nif', 'fomm', 'rjel',
  // Werkwoorden.
  'kanakol', 'kanshreb', 'kansme3', 'kanktab', 'bghit', 'ma3endish', 'ndir',
  'sir',
  // Vragen.
  'shkun', 'fuqash', '3lash', 'kifash', 'wesh',
  // Winkelen.
  'souq', 'flus', 'derhem', 'ghali', 'rkhis', '3tini', 'kbir', 'jdid',
  'qdim',
  // De weg.
  'limen', 'mor', 'fuq', 'teht', 'hda', 'hnaya', 'temma', 'zenqa',
  // Marokko.
  'bhar', 'sahra', 'jame3', 'bshklit', 'mghrib', 'bladi', 'darija',
  'tamazight', 'babouche', 'rabat', 'tanja',
  // Cijfers.
  'reb3a',
]

/**
 * Woorden waarvan de opname is afgekeurd.
 *
 * Ze blijven op OPNAME_NODIG staan, want er moet nog altijd een opname komen.
 * Maar het stuk dat er in de doorlopende opname bij hoort deugt niet — een
 * verspreking, een woord dat toch anders bleek te heten — dus dat stuk gaat
 * eruit en het woord wacht op een losse opname.
 */
export const OPNIEUW: string[] = [
  // De opname zei nog djaja; het woord heet dzaza.
  'dzaza',
]



/**
 * Which borrowed voice suits a word, read off its own Latin spelling.
 *
 * Not a judgement per word — a rule. Every language spells these sounds in its
 * own way and only some of them can make them at all:
 *
 *   kh (خ)  Dutch and German have it outright; French turns it into an r.
 *   7  (ح)  Spanish's j is the nearest thing any of them has.
 *   gh (غ)  French and German r, which is where that sound lives.
 *
 * Anything without one of those goes to French first, because Morocco's second
 * language already handles ch, ou and a uvular r, and its vowels sit closest.
 */
const STANDAARD: Target[] = ['fr', 'es', 'nl', 'de', 'it', 'en']

export function voorkeurVoor(tr: string): Target[] {
  const t = tr.toLowerCase()
  if (t.includes('kh')) return ['nl', 'de', 'es', 'fr', 'it', 'en']
  if (t.includes('7') || t.includes('h')) return ['es', 'nl', 'de', 'fr', 'it', 'en']
  if (t.includes('gh')) return ['fr', 'de', 'nl', 'es', 'it', 'en']
  return STANDAARD
}

/**
 * Arabic text → the voices that may say it, or nothing when an Arabic voice is
 * the right one after all.
 *
 * Keyed by the script rather than the id for the same reason the recordings
 * are: every caller already has the Arabic text in its hand, and none of them
 * had to change.
 */
const OP_SCRIPT: Map<string, Target[]> = (() => {
  const wanted = new Set(EIGEN_IDS)
  const map = new Map<string, Target[]>()
  for (const w of allWords) if (wanted.has(w.id)) map.set(w.ar, voorkeurVoor(w.tr))
  for (const z of ALL_SENTENCES) if (wanted.has(z.id)) map.set(z.ar, voorkeurVoor(z.tr))
  return map
})()

export const eigenVoorkeur = (arabic: string): Target[] | undefined => OP_SCRIPT.get(arabic)

/** Elk id in een van de lijsten dat geen woord meer is, zodat de test het opmerkt. */
export const zwevendeIds = (): string[] => {
  const bekend = new Set<string>([...allWords.map((w) => w.id), ...ALL_SENTENCES.map((z) => z.id)])
  return [...GETEST_IDS, ...OPNAME_NODIG].filter((id) => !bekend.has(id))
}
