import { useSyncExternalStore } from 'react'
import type { Kaart, Cijfer } from './srs'
import { herzie, isWoordKaart, nieuweKaart } from './srs'
import type { Leeftijdsgroep } from '../content/types'
import type { Accent } from '../merk/kleuren'
import { ACCENTEN } from '../merk/kleuren'
import { MERK } from '../merk/merk'
import type { Taal } from '../i18n/talen'
import { TAALCODES, vindTaal } from '../i18n/talen'

/**
 * Alle voortgang staat in de browser. Niets wordt verstuurd, er is geen
 * account, en een kind kan de app gebruiken zonder dat iemand iets verzamelt.
 *
 * Zie docs/privacy-and-safety.md. De korte versie: de goedkoopste manier om
 * geen gegevens te lekken, is ze niet hebben.
 */

const SLEUTEL = MERK.opslagSleutel

export interface Instellingen {
  taal: Taal
  accent: Accent
  thema: 'systeem' | 'licht' | 'donker'
  geluid: boolean
  /** De spreekoefening. Standaard uit in de groep `klein`. */
  spreken: boolean
  /** De tikoefening. Standaard uit in de groep `klein`. */
  typen: boolean
  beweging: 'vol' | 'rustig'
  lezen: 'gewoon' | 'dyslexie'
  /**
   * Eén melding per dag, op een tijd die de ouder kiest.
   *
   * Uit tot iemand er zelf om vraagt, achter de ouderpoort. Een app die bij de
   * eerste start ongevraagd om meldingstoestemming vraagt, krijgt van de helft
   * van de ouders nee -- en die nee is daarna moeilijk terug te draaien.
   */
  herinnering: boolean
  herinneringTijd: string
}

export interface LesStand {
  /** 0…3. Hoeveel er goed was, in drie stappen. */
  sterren: number
  keren: number
  besteScore: number
  laatstGedaan: number
}

export interface Profiel {
  /**
   * Voornaam of bijnaam. Mag leeg blijven, en het veld zegt dat ook.
   *
   * Een app die om een echte naam vraagt, krijgt er een. Zie
   * docs/privacy-and-safety.md.
   */
  naam: string
  avatar: string
  /** Een voorstel, door een ouder te wijzigen. Nooit een geboortedatum. */
  groep: Leeftijdsgroep
  gemaaktOp: number
}

export interface Abonnement {
  /** Of de volledige cursus open staat. */
  actief: boolean
  sinds: number | null
  /**
   * Wanneer een proefperiode begon, of 0.
   *
   * Vastgelegd op het moment van bestellen en niet later uit de winkel
   * afgeleid: zodra de koop rond is, laat de winkel de aanbieding bij dat
   * product weg. Zonder dit zou het welkomstscherm ná het betalen tegen
   * iedereen zeggen dat de eerste dagen gratis waren -- ook tegen wie meteen
   * is afgeschreven. Dat is precies wat er bij de vorige app misging.
   */
  proefGestart: number
  plan: 'jaar' | 'maand' | null
}

export interface Staat {
  versie: 1
  profiel: Profiel
  /** Of het welkomstscherm doorlopen is. */
  welkomGedaan: boolean
  /** Of het ouderscherm bij de eerste start gezien is. */
  ouderGezien: boolean
  instellingen: Instellingen
  xp: number
  reeks: number
  besteReeks: number
  /** De laatste dag waarop iets gedaan is, als `2026-10-20`. */
  laatsteDag: string | null
  lessen: Record<string, LesStand>
  /** De planner voor woorden. */
  kaarten: Record<string, Kaart>
  /** De planner voor letters, zinnen en klankparen. Zie srs.ts `SLEUTEL`. */
  extraKaarten: Record<string, Kaart>
  abonnement: Abonnement
  /** Welke tips al gezien zijn, zodat ze niet elke les terugkomen. */
  tipsGezien: string[]
}

export const vandaag = (nu = new Date()): string =>
  `${nu.getFullYear()}-${String(nu.getMonth() + 1).padStart(2, '0')}-${String(nu.getDate()).padStart(2, '0')}`

export const XP_PER_GOED = 2

const leegProfiel = (): Profiel => ({ naam: '', avatar: '🦢', groep: 'midden', gemaaktOp: Date.now() })

export const legeStaat = (): Staat => ({
  versie: 1,
  profiel: leegProfiel(),
  welkomGedaan: false,
  ouderGezien: false,
  instellingen: {
    taal: vindTaal(),
    accent: 'cini',
    thema: 'systeem',
    geluid: true,
    spreken: true,
    typen: true,
    beweging: 'vol',
    lezen: 'gewoon',
    herinnering: false,
    herinneringTijd: '18:30',
  },
  xp: 0,
  reeks: 0,
  besteReeks: 0,
  laatsteDag: null,
  lessen: {},
  kaarten: {},
  extraKaarten: {},
  abonnement: { actief: false, sinds: null, proefGestart: 0, plan: null },
  tipsGezien: [],
})

/**
 * Een opgeslagen staat bijwerken naar de huidige vorm.
 *
 * Dit bestaat omdat het bij de vorige app op de harde manier geleerd is: een
 * veld dat later bijkwam was `undefined` bij iedereen die de app al had, en
 * het eerste `Object.keys` erop liet het scherm omvallen. Een gebruiker ziet
 * dan een wit scherm en verliest zijn voortgang -- en dat is niet terug te
 * halen, want er is geen server.
 *
 * Dus: elk veld wordt hier samengevoegd met de lege staat, en onbekende
 * waarden worden teruggezet op iets geldigs. Nooit `JSON.parse` en er direct
 * op vertrouwen.
 */
export function migreer(ruw: unknown): Staat {
  const leeg = legeStaat()
  if (!ruw || typeof ruw !== 'object') return leeg
  const o = ruw as Record<string, unknown>

  const i = (o.instellingen ?? {}) as Record<string, unknown>
  const p = (o.profiel ?? {}) as Record<string, unknown>
  const a = (o.abonnement ?? {}) as Record<string, unknown>

  const kies = <T,>(waarde: unknown, toegestaan: readonly T[], terugval: T): T =>
    (toegestaan as readonly unknown[]).includes(waarde) ? (waarde as T) : terugval

  const getal = (waarde: unknown, terugval = 0): number =>
    typeof waarde === 'number' && Number.isFinite(waarde) ? waarde : terugval

  return {
    versie: 1,
    profiel: {
      naam: typeof p.naam === 'string' ? p.naam.slice(0, 24) : '',
      avatar: typeof p.avatar === 'string' && p.avatar ? p.avatar : leeg.profiel.avatar,
      groep: kies<Leeftijdsgroep>(p.groep, ['klein', 'midden', 'groot'], 'midden'),
      gemaaktOp: getal(p.gemaaktOp, leeg.profiel.gemaaktOp),
    },
    welkomGedaan: o.welkomGedaan === true,
    ouderGezien: o.ouderGezien === true,
    instellingen: {
      taal: kies<Taal>(i.taal, TAALCODES, leeg.instellingen.taal),
      accent: kies<Accent>(i.accent, ACCENTEN, 'cini'),
      thema: kies(i.thema, ['systeem', 'licht', 'donker'] as const, 'systeem'),
      geluid: i.geluid !== false,
      spreken: i.spreken !== false,
      typen: i.typen !== false,
      beweging: kies(i.beweging, ['vol', 'rustig'] as const, 'vol'),
      lezen: kies(i.lezen, ['gewoon', 'dyslexie'] as const, 'gewoon'),
      herinnering: i.herinnering === true,
      herinneringTijd: typeof i.herinneringTijd === 'string' ? i.herinneringTijd : '18:30',
    },
    xp: getal(o.xp),
    reeks: getal(o.reeks),
    besteReeks: getal(o.besteReeks),
    laatsteDag: typeof o.laatsteDag === 'string' ? o.laatsteDag : null,
    lessen: schoonLessen(o.lessen),
    kaarten: schoonKaarten(o.kaarten),
    extraKaarten: schoonKaarten(o.extraKaarten),
    abonnement: {
      actief: a.actief === true,
      sinds: typeof a.sinds === 'number' ? a.sinds : null,
      proefGestart: getal(a.proefGestart),
      plan: kies(a.plan, ['jaar', 'maand'] as const, null as 'jaar' | 'maand' | null),
    },
    tipsGezien: Array.isArray(o.tipsGezien) ? o.tipsGezien.filter((x) => typeof x === 'string') : [],
  }
}

const schoonLessen = (ruw: unknown): Record<string, LesStand> => {
  const uit: Record<string, LesStand> = {}
  if (!ruw || typeof ruw !== 'object') return uit
  for (const [id, waarde] of Object.entries(ruw as Record<string, unknown>)) {
    const l = (waarde ?? {}) as Record<string, unknown>
    uit[id] = {
      sterren: typeof l.sterren === 'number' ? Math.max(0, Math.min(3, l.sterren)) : 0,
      keren: typeof l.keren === 'number' ? l.keren : 0,
      besteScore: typeof l.besteScore === 'number' ? l.besteScore : 0,
      laatstGedaan: typeof l.laatstGedaan === 'number' ? l.laatstGedaan : 0,
    }
  }
  return uit
}

const schoonKaarten = (ruw: unknown): Record<string, Kaart> => {
  const uit: Record<string, Kaart> = {}
  if (!ruw || typeof ruw !== 'object') return uit
  for (const [id, waarde] of Object.entries(ruw as Record<string, unknown>)) {
    const k = (waarde ?? {}) as Record<string, unknown>
    const leeg = nieuweKaart(id)
    uit[id] = {
      id,
      gemak: typeof k.gemak === 'number' ? k.gemak : leeg.gemak,
      tussentijd: typeof k.tussentijd === 'number' ? k.tussentijd : 0,
      beurt: typeof k.beurt === 'number' ? k.beurt : leeg.beurt,
      keren: typeof k.keren === 'number' ? k.keren : 0,
      missers: typeof k.missers === 'number' ? k.missers : 0,
      sterkte: typeof k.sterkte === 'number' ? Math.max(0, Math.min(1, k.sterkte)) : 0,
    }
  }
  return uit
}

/* ------------------------------------------------------------- de winkel */

let staat: Staat = legeStaat()
const luisteraars = new Set<() => void>()

const bewaar = () => {
  try {
    localStorage.setItem(SLEUTEL, JSON.stringify(staat))
  } catch {
    // Privémodus, volle schijf, of een browser die opslag weigert. De app
    // werkt dan verder, alleen onthoudt hij niets -- en dat is beter dan een
    // scherm dat omvalt bij het opslaan.
  }
}

/** Eén keer bij het starten, vóór de eerste render. */
export function laad(): void {
  try {
    const ruw = localStorage.getItem(SLEUTEL)
    staat = ruw ? migreer(JSON.parse(ruw)) : legeStaat()
  } catch {
    staat = legeStaat()
  }
}

export const haalStaat = (): Staat => staat

export function zetStaat(aanpassing: Partial<Staat> | ((s: Staat) => Partial<Staat>)): void {
  const deel = typeof aanpassing === 'function' ? aanpassing(staat) : aanpassing
  staat = { ...staat, ...deel }
  bewaar()
  for (const fn of luisteraars) fn()
}

const abonneer = (fn: () => void) => {
  luisteraars.add(fn)
  return () => luisteraars.delete(fn)
}

export function useStaat<T>(kies: (s: Staat) => T): T {
  return useSyncExternalStore(abonneer, () => kies(staat), () => kies(staat))
}

/** Alleen voor tests: zet de winkel terug zonder de browser aan te raken. */
export function _zetTerugVoorTest(nieuw: Staat = legeStaat()): void {
  staat = nieuw
  for (const fn of luisteraars) fn()
}

/* ------------------------------------------------------------- bewerkingen */

export function zetInstelling<K extends keyof Instellingen>(sleutel: K, waarde: Instellingen[K]): void {
  zetStaat((s) => ({ instellingen: { ...s.instellingen, [sleutel]: waarde } }))
}

export function zetProfiel(deel: Partial<Profiel>): void {
  zetStaat((s) => ({ profiel: { ...s.profiel, ...deel } }))
}

/**
 * Eén antwoord verwerken.
 *
 * XP wordt meteen uitbetaald en niet aan het eind van de les. Dat is een
 * ontwerpkeuze: een kind dat het getal ziet oplopen terwijl het antwoordt,
 * voelt iets anders dan een kind dat aan het eind een totaal krijgt.
 */
export function antwoord(kaartId: string, cijfer: Cijfer, nu = Date.now()): void {
  const woordKaart = isWoordKaart(kaartId)
  zetStaat((s) => {
    const bak = woordKaart ? s.kaarten : s.extraKaarten
    const bestaand = bak[kaartId] ?? nieuweKaart(kaartId, nu)
    const bijgewerkt = herzie(bestaand, cijfer, nu)
    const nieuweBak = { ...bak, [kaartId]: bijgewerkt }
    return {
      ...(woordKaart ? { kaarten: nieuweBak } : { extraKaarten: nieuweBak }),
      xp: cijfer === 'fout' ? s.xp : s.xp + XP_PER_GOED,
    }
  })
}

/** Een les afronden: sterren, de reeks en de dag bijwerken. */
export function rondLesAf(lesId: string, score: number, nu = Date.now()): void {
  const sterren = score >= 0.95 ? 3 : score >= 0.8 ? 2 : score >= 0.6 ? 1 : 0
  const dag = vandaag(new Date(nu))
  zetStaat((s) => {
    const oud = s.lessen[lesId]
    const reeks = nieuweReeks(s, dag)
    return {
      lessen: {
        ...s.lessen,
        [lesId]: {
          sterren: Math.max(sterren, oud?.sterren ?? 0),
          keren: (oud?.keren ?? 0) + 1,
          besteScore: Math.max(score, oud?.besteScore ?? 0),
          laatstGedaan: nu,
        },
      },
      reeks,
      besteReeks: Math.max(reeks, s.besteReeks),
      laatsteDag: dag,
    }
  })
}

/**
 * De reeks: hoeveel dagen op rij er iets gedaan is.
 *
 * Een reeks die afbreekt zegt "morgen weer" en niets meer. Geen schuldgevoel,
 * geen "je bent je reeks kwijt!" -- zie docs/privacy-and-safety.md §Geen druk.
 */
export function nieuweReeks(s: Staat, dag: string): number {
  if (s.laatsteDag === dag) return s.reeks || 1
  if (!s.laatsteDag) return 1
  const gisteren = new Date(`${dag}T12:00:00`)
  gisteren.setDate(gisteren.getDate() - 1)
  return s.laatsteDag === vandaag(gisteren) ? s.reeks + 1 : 1
}

export const tipGezien = (id: string): void =>
  zetStaat((s) => (s.tipsGezien.includes(id) ? {} : { tipsGezien: [...s.tipsGezien, id] }))

/* ------------------------------------------------- inzien en verwijderen */

/**
 * Alles wat is opgeslagen, als leesbare tekst.
 *
 * Voor de knop "Bekijken" op het ouderoverzicht. Geen samenvatting maar de
 * hele inhoud: een ouder die wil weten wat de app bewaart, hoort het te zien
 * en niet te moeten vertrouwen.
 */
export const alsTekst = (): string => JSON.stringify(staat, null, 2)

/** Hetzelfde, als bestand om mee te nemen naar een nieuw toestel. */
export const alsBestand = (): Blob =>
  new Blob([alsTekst()], { type: 'application/json' })

/**
 * Alles wissen. Echt alles, inclusief de instellingen.
 *
 * Wat niet gewist wordt is de aankoop: die staat bij Apple of Google en niet
 * hier. Het scherm dat deze knop aanbiedt zegt dat ook.
 */
export function wisAlles(): void {
  try {
    localStorage.removeItem(SLEUTEL)
  } catch { /* zie `bewaar` */ }
  staat = legeStaat()
  for (const fn of luisteraars) fn()
}

/** Een meegenomen bestand terugzetten. Geeft false als het niet te lezen was. */
export function zetTerug(tekst: string): boolean {
  try {
    staat = migreer(JSON.parse(tekst))
    bewaar()
    for (const fn of luisteraars) fn()
    return true
  } catch {
    return false
  }
}
