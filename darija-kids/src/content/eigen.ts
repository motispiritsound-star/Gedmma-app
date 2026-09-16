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
  // Voornaamwoorden en familie: het Standaardarabisch schuift er klinkers in
  // die Darija juist weglaat.
  nta: 'geleend', nti: 'geleend', ntuma: 'geleend', hna: 'geleend',
  khoya: 'geleend', khti: 'geleend', jedda: 'geleend',
  ammti: 'geleend', khalti: 'geleend',
  weld: 'geleend', drari: 'geleend', sahbi: 'geleend', sahbti: 'geleend',

  // De kleine woorden die een zin bij elkaar houden.
  afak: 'geleend', bslama: 'geleend', thalla: 'geleend', iyeh: 'geleend',
  wakha: 'geleend', yallah: 'geleend', bezzaf: 'geleend',

  // Tellen: de Marokkaanse vormen zijn niet de Standaardarabische.
  tlata: 'geleend', tmnya: 'geleend', tnach: 'geleend', tltach: 'geleend',
  khmstach: 'geleend', mya: 'geleend',

  // Kleuren. `hmer` is teruggezet: "hmer" begint met h + m, en daar maakt een
  // Franse stem niets van — dan is de Arabische stem alsnog beter.
  hmer: 'arabisch', khder: 'geleend', sfer: 'geleend',

  // Plaatsen, eten en cultuur.
  bhar: 'geleend', sahra: 'geleend', tomobil: 'geleend', tamazight: 'geleend',
  henna: 'geleend', gnawa: 'geleend', rabat: 'geleend', tanja: 'geleend',
  msemmen: 'geleend',
}

/** Elk woord waarover een keuze is vastgelegd, welke dan ook. */
export const GETEST_IDS: string[] = Object.keys(UITSPRAAK)

/** De woorden die naar een geleende stem gaan. */
export const EIGEN_IDS: string[] = GETEST_IDS.filter((id) => UITSPRAAK[id] === 'geleend')

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

/** Elk id in de lijst dat geen woord meer is, zodat de test het opmerkt. */
export const zwevendeIds = (): string[] => {
  const bekend = new Set<string>([...allWords.map((w) => w.id), ...ALL_SENTENCES.map((z) => z.id)])
  return GETEST_IDS.filter((id) => !bekend.has(id))
}
