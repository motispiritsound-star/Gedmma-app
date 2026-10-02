/**
 * De vorm van `nieuws.mjs`, voor de tests. Zie `plugins.d.mts` voor waarom.
 */
export interface Notitie {
  /** Een taalcode zoals Play hem wil: `nl-NL`, `en-US`. */
  language: string
  /** De tekst zelf, hoogstens MAX tekens. */
  text: string
}

export const MAX: number
export function nieuwsVoor(wortel: string, versienaam: string): Notitie[]
export function lees(tekst: string): Notitie[]
export function teLang(notities: Notitie[]): Notitie[]
