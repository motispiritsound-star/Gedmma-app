import { haalStaat } from './opslag'

/**
 * Geluid.
 *
 * De bedoeling is: één opname per woord en per zin, ingesproken door
 * moedertaalsprekers, gebundeld in de app zodat het offline werkt. Die
 * opnames bestaan nog niet -- zie docs/decisions.md B-7 en
 * docs/learning-curriculum.md §Audio.
 *
 * Tot die tijd gebruikt de app de spraaksynthese van het toestel in `tr-TR`,
 * en ZEGT DAT OOK: een lintje "computerstem" bij het woord en een regel op het
 * ouderoverzicht. Een kind dat `ğ` van een synthesestem leert, leert hem
 * verkeerd, en een ouder die dat hoort moet weten waar het aan ligt in plaats
 * van te concluderen dat de app niet deugt.
 *
 * **Geen publicatie in een winkel zonder echte opnames voor units 0 tot 3.**
 */

/** Welke woorden en zinnen al een echte opname hebben. Nu: geen. */
export const OPNAMES = new Set<string>()

export const heeftEchteOpname = (id: string): boolean => OPNAMES.has(id)

/** Waar een opname komt te staan. De id is de bestandsnaam. */
export const opnamePad = (id: string): string => `audio/${id}.mp3`

type Spreker = 'vrouw' | 'kind'

export interface SpeelKeuzes {
  /** Langzamer, voor een leerkaart of een dictee. */
  traag?: boolean
  spreker?: Spreker
}

let stemmen: SpeechSynthesisVoice[] = []

/**
 * De Turkse stem van het toestel, als die er is.
 *
 * `getVoices()` is op sommige browsers leeg tot `voiceschanged` is gevuurd,
 * dus dit wordt bij het starten één keer aangeroepen en daarna nog eens bij
 * die gebeurtenis. Zonder dat zwijgt de eerste les en werkt de tweede.
 */
export function wekStemmen(): void {
  if (typeof speechSynthesis === 'undefined') return
  const lees = () => { stemmen = speechSynthesis.getVoices() }
  lees()
  speechSynthesis.addEventListener('voiceschanged', lees)
}

export function turkseStem(): SpeechSynthesisVoice | null {
  const turks = stemmen.filter((s) => s.lang.toLowerCase().startsWith('tr'))
  // Een stem op het toestel zelf klinkt beter en werkt offline; een stem die
  // de browser uit de cloud haalt doet in een Turks dorp niets.
  return turks.find((s) => s.localService) ?? turks[0] ?? null
}

/** Of er überhaupt Turks geluid mogelijk is op dit toestel. */
export const kanTurksSpreken = (): boolean => turkseStem() !== null

/**
 * Een woord of zin afspelen.
 *
 * Geeft terug wát er gespeeld is, zodat het scherm kan zeggen dat het een
 * computerstem was. `null` betekent: er kwam geen geluid, en dan hoort het
 * scherm niet te doen alsof.
 */
export function speel(id: string, tekst: string, keuzes: SpeelKeuzes = {}): 'opname' | 'synthese' | null {
  if (!haalStaat().instellingen.geluid) return null

  if (heeftEchteOpname(id)) {
    const geluid = new Audio(opnamePad(id))
    geluid.play().catch(() => { /* Een geweigerde play is geen fout om op te vallen. */ })
    return 'opname'
  }

  if (typeof speechSynthesis === 'undefined') return null
  const stem = turkseStem()
  if (!stem) return null

  // Afbreken wat er nog loopt: twee stemmen door elkaar is onverstaanbaar, en
  // een kind dat twee keer snel tikt verwacht het woord opnieuw en niet erbij.
  speechSynthesis.cancel()
  const zeg = new SpeechSynthesisUtterance(tekst)
  zeg.voice = stem
  zeg.lang = 'tr-TR'
  zeg.rate = keuzes.traag ? 0.72 : 0.92
  // Iets hoger bij de kindstem. Ruw, maar beter dan één stem voor alles --
  // een kind spreekt een kinderstem beter na.
  zeg.pitch = keuzes.spreker === 'kind' ? 1.25 : 1
  speechSynthesis.speak(zeg)
  return 'synthese'
}

export function stilte(): void {
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
}
