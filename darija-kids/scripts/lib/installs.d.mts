/**
 * De vorm van `installs.mjs`, voor de tests. Zie `plugins.d.mts` voor waarom.
 */

/** Eén dag uit het maandbestand. */
export interface Dag {
  /** `2026-10-13`, zoals Google hem schrijft. */
  datum: string
  /** Mensen die de app die dag voor het eerst installeerden. */
  nieuw: number
  /** Installaties die dag, herinstallaties meegeteld. */
  installaties: number
  /** Hoeveel toestellen hem die dag hadden -- een stand, geen stroom. */
  toestellen: number
}

/** Wat er van één maandbestand overblijft. */
export interface Maand {
  dagen: Dag[]
  /** De namen uit KOLOMMEN die niet in de kop stonden. */
  ontbreekt: string[]
  nieuw: number
  installaties: number
  toestellen: number
}

export const EERSTE_MAAND: string
export const KOLOMMEN: Record<string, string[]>
export function emmers(ontwikkelaar: string): string[]
export function pad(pakket: string, maand: string): string
export function maandNaam(d: Date): string
export function maandenSinds(eerste: string, tot: Date): string[]
export function naarTekst(bytes: Uint8Array): string
export function splitsRegel(regel: string): string[]
export function leesCsv(tekst: string): { kop: string[]; regels: string[][] }
export function kolom(kop: string[], namen: string[]): number
export function vatSamen(kop: string[], regels: string[][]): Maand
