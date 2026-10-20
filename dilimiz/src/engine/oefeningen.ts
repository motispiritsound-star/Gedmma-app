import type { Les, Woord } from '../content/types'
import { WOORDEN, woord } from '../content/woorden'
import { LETTER, LETTERS } from '../content/letters'
import { KLANKPAAR } from '../content/klankparen'
import { ZINNEN, tegelsVan, zin } from '../content/zinnen'
import { harmonieOefening, plakOefening, PLAK_OEFENINGEN } from '../content/achtervoegsels'
import { harmonieVraag } from './turks'
import { kies, mulberry32, schud, zaadjeUit } from './toeval'
import { SLEUTEL } from './srs'

/**
 * Een les omzetten in een ronde oefeningen.
 *
 * De vormen staan in een vaste volgorde per woord: eerst kennismaken, dan
 * herkennen, dan horen, dan produceren. Hetzelfde woord komt binnen één ronde
 * op twee manieren terug, en dat is wat het laat blijven zitten.
 *
 * Wat hier ANDERS is dan in de app waar de techniek van komt, en met opzet:
 *
 *   - `klankpaar`, `harmonie` en `plak` bestaan daar niet. Ze oefenen wat Turks
 *     moeilijk maakt: ı tegenover i, de klinkerharmonie, en woorden die
 *     aaneengroeien.
 *   - het natekenen van letters, de lettervormen voor begin/midden/eind en
 *     alles rond rechts-naar-links komen niet mee. Turks is Latijns schrift.
 *
 * Zie docs/decisions.md A-5: de machine erven, de les opnieuw ontwerpen.
 */

export type OefenSoort =
  | 'nieuw'            // leerkaart met audio, altijd goed
  | 'kies-betekenis'   // Turks -> betekenis
  | 'kies-turks'       // betekenis -> Turks
  | 'luister'          // audio -> geschreven Turks
  | 'tik'              // typ het, met de hulprij ç ğ ı İ ö ş ü
  | 'spreek'           // zeg het hardop; geen score, zie docs/decisions.md P-3
  | 'letter-nieuw'     // maak kennis met een letter
  | 'letter-klank'     // klankbeschrijving -> welke letter?
  | 'klankpaar'        // hoor er één -> welk van de twee was het?
  | 'harmonie'         // welk achtervoegsel past?
  | 'plak'             // bouw een woord uit stam en achtervoegsels
  | 'zin-nieuw'        // maak kennis met een zin
  | 'zin-bouw'         // leg de zin uit tegels
  | 'zin-betekenis'    // zin -> betekenis

export interface Oefening {
  id: string
  soort: OefenSoort
  /**
   * De kaart-id waarop het antwoord wordt bijgehouden.
   *
   * Een woord is zijn eigen id; een letter, zin of klankpaar krijgt een
   * voorvoegsel (`l:`, `z:`, `p:`). Zo blijft "woorden geleerd" een aantal
   * woorden. Leeg bij `harmonie` en `plak`: die oefenen een regel en geen
   * item, en horen niet in de herhaalplanner.
   */
  kaartId: string
  /** Wat er gevraagd wordt, al in de goede taal op te zoeken door de UI. */
  woordId?: string
  letterId?: string
  klankpaarId?: string
  zinId?: string
  /** De keuzes, geschud. Ids van dezelfde soort als het gevraagde. */
  keuzes?: string[]
  /** Tegels voor `zin-bouw` en `plak`, geschud. */
  tegels?: string[]
  /** Het goede antwoord bij `harmonie` en `plak`, voluit. */
  antwoord?: string
  /** De oefening-id uit achtervoegsels.ts, bij `harmonie` en `plak`. */
  regelId?: string
  /** Bij `klankpaar`: welke van de twee werd afgespeeld, 'links' of 'rechts'. */
  kant?: 'links' | 'rechts'
}

export interface RondeKeuzes {
  /** Woorden die de leerling al kent, zodat de leerkaart wordt overgeslagen. */
  bekend?: Set<string>
  /** Toetsmodus: geen leerkaarten, meer produceren, minder herkennen. */
  toets?: boolean
  /** Hoogstens zoveel oefeningen. De leeftijdsgroep bepaalt dit. */
  hoogstens?: number
  zaadje?: number
  /** Of de tikoefening mag. Staat uit in de groep `klein`. */
  typen?: boolean
  /** Of de spreekoefening mag. Staat uit in de groep `klein`. */
  spreken?: boolean
}

/* ------------------------------------------------------------- hulpjes */

/**
 * Afleiders: woorden die genoeg op het doel lijken om een keuze echt te maken.
 *
 * Eerst uit hetzelfde onderwerp, dan de rest. Een vraag met drie afleiders uit
 * een ander onderwerp is geen vraag -- `anne` tussen `bir`, `iki` en `üç` is
 * te raden zonder het woord te kennen.
 */
const afleiders = (doel: Woord, aantal: number, rnd: () => number): string[] => {
  const zelfdeSoort = (w: Woord) => !!w.uitdrukking === !!doel.uitdrukking
  const nabij = WOORDEN.filter((w) => w.onderwerp === doel.onderwerp && w.id !== doel.id && zelfdeSoort(w))
  const verder = WOORDEN.filter((w) => w.onderwerp !== doel.onderwerp && w.id !== doel.id && zelfdeSoort(w))
  // Loopt het onderwerp leeg (een onderwerp met twee woorden), dan mag alles.
  const rest = WOORDEN.filter((w) => w.id !== doel.id && !zelfdeSoort(w))
  const bak = [...schud(nabij, rnd), ...schud(verder, rnd), ...schud(rest, rnd)]
  return bak.slice(0, aantal).map((w) => w.id)
}

const keuzesVoor = (doel: Woord, rnd: () => number, aantal = 4): string[] =>
  schud([doel.id, ...afleiders(doel, aantal - 1, rnd)], rnd)

const letterKeuzes = (id: string, rnd: () => number, aantal = 4): string[] =>
  schud([id, ...schud(LETTERS.filter((l) => l.id !== id), rnd).slice(0, aantal - 1).map((l) => l.id)], rnd)

/**
 * De tegels voor een zin: de goede woorden plus ruis.
 *
 * Zonder ruis is de zin te leggen door de tegels te tellen, en dan oefent de
 * oefening tellen. De ruis komt uit andere zinnen, zodat het echte Turkse
 * woorden zijn en geen onzin.
 */
const zinTegels = (tekst: string, rnd: () => number): string[] => {
  const goed = tegelsVan(tekst)
  const anders = schud(
    WOORDEN.filter((w) => !w.uitdrukking).map((w) => w.tr).filter((t) => !goed.includes(t)),
    rnd,
  ).slice(0, goed.length > 4 ? 2 : 3)
  return schud([...goed, ...anders], rnd)
}

/* ------------------------------------------------------------ de ronde */

export function maakRonde(les: Les, keuzes: RondeKeuzes = {}): Oefening[] {
  const {
    bekend = new Set<string>(),
    toets = les.soort === 'toets',
    hoogstens = 24,
    zaadje = zaadjeUit(les.id),
    typen = true,
    spreken = true,
  } = keuzes

  const rnd = mulberry32(zaadje)
  const uit: Oefening[] = []
  let n = 0
  const bij = (o: Omit<Oefening, 'id'>) => uit.push({ ...o, id: `${les.id}-${n++}` })

  /* -- letters ---------------------------------------------------------- */
  for (const id of les.letters ?? []) {
    const letter = LETTER(id)
    if (!letter) continue
    if (!toets && !bekend.has(SLEUTEL.letter(id))) {
      bij({ soort: 'letter-nieuw', kaartId: SLEUTEL.letter(id), letterId: id })
    }
    bij({
      soort: 'letter-klank',
      kaartId: SLEUTEL.letter(id),
      letterId: id,
      keuzes: letterKeuzes(id, rnd),
    })
  }

  /* -- klankparen ------------------------------------------------------- */
  for (const id of les.klankparen ?? []) {
    const paar = KLANKPAAR(id)
    if (!paar) continue
    // Twee keer, één keer elke kant op. Eén keer zou het een gok van vijftig
    // procent maken die ook met geluk goed gaat.
    for (const kant of schud(['links', 'rechts'] as const, rnd)) {
      bij({ soort: 'klankpaar', kaartId: SLEUTEL.klankpaar(id), klankpaarId: id, kant })
    }
  }

  /* -- harmonie en plakken ---------------------------------------------- */
  for (const id of les.harmonieOefeningen ?? []) {
    const oefening = harmonieOefening(id)
    if (!oefening) continue
    const vraag = harmonieVraag(oefening.woord, oefening.soort)
    // Een vraag met één keuze is geen vraag: `anne` kan alleen `annem` worden.
    if (vraag.keuzes.length < 2) continue
    bij({
      soort: 'harmonie',
      kaartId: '',
      regelId: id,
      antwoord: vraag.goed,
      keuzes: schud(vraag.keuzes, rnd),
    })
  }

  if (les.soort === 'harmonie') {
    // De plakoefening sluit de harmonieles af: eerst de regel voelen, dan hem
    // zien werken in een woord dat echt groeit.
    const plak = kies(PLAK_OEFENINGEN, rnd)
    bij({
      soort: 'plak',
      kaartId: '',
      regelId: plak.id,
      antwoord: plak.stappen.at(-1)!.heel,
      tegels: schud([...plak.stappen.map((s) => s.deel), ...plak.ruis], rnd),
    })
  }

  /* -- woorden ---------------------------------------------------------- */
  const woorden = les.woorden.map((id) => woord(id)).filter((w): w is Woord => !!w)

  if (!toets) {
    for (const w of woorden) {
      if (!bekend.has(w.id)) bij({ soort: 'nieuw', kaartId: w.id, woordId: w.id })
    }
  }

  // Ronde één: herkennen. In de toets overgeslagen -- daar begint het bij
  // produceren, want dat is wat een toets hoort te meten.
  if (!toets) {
    for (const w of woorden) {
      bij({ soort: 'kies-betekenis', kaartId: w.id, woordId: w.id, keuzes: keuzesVoor(w, rnd) })
    }
  }

  // Ronde twee: horen. Dit is de vorm waar de audio voor is.
  for (const w of woorden) {
    bij({ soort: 'luister', kaartId: w.id, woordId: w.id, keuzes: keuzesVoor(w, rnd) })
  }

  /*
   * Ronde drie: produceren.
   *
   * Dit is waar deze app zijn geld verdient, en de reden staat in
   * docs/product-brief.md: het kernprobleem van de doelgroep is dat het kind
   * Turks begrijpt en niet spreekt. Herkenningsoefeningen trainen precies wat
   * het al kan.
   */
  for (const w of woorden) {
    const mogelijk: OefenSoort[] = ['kies-turks']
    if (typen && !w.uitdrukking) mogelijk.push('tik')
    if (spreken) mogelijk.push('spreek')
    const soort = toets && typen && !w.uitdrukking ? 'tik' : kies(mogelijk, rnd)
    bij({
      soort,
      kaartId: w.id,
      woordId: w.id,
      ...(soort === 'kies-turks' ? { keuzes: keuzesVoor(w, rnd) } : {}),
    })
  }

  /* -- zinnen ----------------------------------------------------------- */
  for (const id of les.zinnen ?? []) {
    const z = zin(id)
    if (!z) continue
    if (!toets && !bekend.has(SLEUTEL.zin(id))) {
      bij({ soort: 'zin-nieuw', kaartId: SLEUTEL.zin(id), zinId: id })
    }
    bij({ soort: 'zin-bouw', kaartId: SLEUTEL.zin(id), zinId: id, tegels: zinTegels(z.tr, rnd) })
    if (toets || rnd() > 0.5) {
      bij({ soort: 'zin-betekenis', kaartId: SLEUTEL.zin(id), zinId: id, keuzes: zinKeuzes(id, rnd) })
    }
  }

  return uit.slice(0, hoogstens)
}

/**
 * De keuzes bij `zin-betekenis`.
 *
 * Eerst zinnen uit dezelfde les als afleider, dan de rest. Een zin over
 * familie tussen drie zinnen over getallen is te raden zonder de zin te
 * begrijpen, en dan meet de oefening niets.
 */
const zinKeuzes = (id: string, rnd: () => number): string[] => {
  const doel = zin(id)
  const nabij = ZINNEN.filter((z) => z.id !== id && z.lesId === doel?.lesId)
  const verder = ZINNEN.filter((z) => z.id !== id && z.lesId !== doel?.lesId)
  const andere = [...schud(nabij, rnd), ...schud(verder, rnd)].slice(0, 3).map((z) => z.id)
  return schud([id, ...andere], rnd)
}

/**
 * Een herhaalronde uit de planner.
 *
 * Geen leerkaarten en geen vaste volgorde: dit is alles wat aan de beurt is,
 * door elkaar. Dat is met opzet anders dan een les -- herhalen hoort te
 * voelen als een quiz en niet als een les opnieuw doen.
 */
export function maakHerhaalronde(
  kaartIds: string[],
  keuzes: Omit<RondeKeuzes, 'bekend' | 'toets'> = {},
): Oefening[] {
  const { hoogstens = 20, zaadje = Date.now() & 0xffff, typen = true, spreken = true } = keuzes
  const rnd = mulberry32(zaadje)
  const uit: Oefening[] = []
  let n = 0
  const bij = (o: Omit<Oefening, 'id'>) => uit.push({ ...o, id: `herhaal-${n++}` })

  for (const kaartId of schud(kaartIds, rnd).slice(0, hoogstens)) {
    if (kaartId.startsWith('l:')) {
      const id = kaartId.slice(2)
      if (LETTER(id)) bij({ soort: 'letter-klank', kaartId, letterId: id, keuzes: letterKeuzes(id, rnd) })
      continue
    }
    if (kaartId.startsWith('p:')) {
      const id = kaartId.slice(2)
      if (KLANKPAAR(id)) {
        bij({ soort: 'klankpaar', kaartId, klankpaarId: id, kant: kies(['links', 'rechts'] as const, rnd) })
      }
      continue
    }
    if (kaartId.startsWith('z:')) {
      const id = kaartId.slice(2)
      const z = zin(id)
      if (z) {
        bij(rnd() > 0.5
          ? { soort: 'zin-bouw', kaartId, zinId: id, tegels: zinTegels(z.tr, rnd) }
          : { soort: 'zin-betekenis', kaartId, zinId: id, keuzes: zinKeuzes(id, rnd) })
      }
      continue
    }
    const w = woord(kaartId)
    if (!w) continue
    const mogelijk: OefenSoort[] = ['kies-betekenis', 'luister', 'kies-turks']
    if (typen && !w.uitdrukking) mogelijk.push('tik')
    if (spreken) mogelijk.push('spreek')
    const soort = kies(mogelijk, rnd)
    bij({
      soort,
      kaartId,
      woordId: w.id,
      ...(soort === 'tik' || soort === 'spreek' ? {} : { keuzes: keuzesVoor(w, rnd) }),
    })
  }
  return uit
}

/** Hoeveel oefeningen een ronde mag hebben, per leeftijdsgroep. */
export const RONDE_LENGTE = { klein: 10, midden: 24, groot: 32 } as const

export { plakOefening }
