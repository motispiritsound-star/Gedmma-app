/**
 * De titels van beide reeksen, per taal.
 *
 * Ze komen uit de boeken zelf en staan hier niet meer los overgeschreven.
 *
 * Dat was wel zo, en dan krijg je twee vertalingen van dezelfde titel. Op de
 * Spaanse boekenpagina stond "Sba y el médico de la medina" terwijl het boek
 * "Sba y la doctora de la medina" heet — niet alleen een ander woord maar een
 * ander personage. In totaal liepen achtenvijftig titels uit elkaar: de winkel
 * beloofde boeken die onder die naam niet bestaan.
 *
 * Het boek wint, altijd. Dat is wat de koper in handen krijgt, en het staat op
 * de omslag die ernaast op dezelfde pagina staat. Een deel dat in een taal nog
 * niet vertaald is valt terug op het Nederlands — zichtbaar onvertaald is
 * beter dan onzichtbaar verkeerd.
 *
 * Wat hier wel met de hand staat is winkelinrichting en geen inhoud: het woord
 * voor "nu" bij deel vijftien, en hoeveel woorden Darija er in een
 * prentenboek zitten.
 */
import { DELEN as PRENTENBOEKEN } from '../content/prentenboek'
import { VERTALINGEN } from '../content/prentenboek-talen'
import { REEKS } from '../content/sleutels'
import { SLEUTEL_VERTALINGEN } from '../content/sleutels-talen'

export interface Reeks {
  /** Twaalf prentenboeken, 2 – 8 jaar. */
  sba: string[]
  /** Vijftien leesboeken, vanaf 9 jaar. */
  sleutels: string[]
  /** Het jaar van deel 15 — het enige jaartal dat een woord is. */
  nu: string
  /** Hoeveel woorden Darija er in een prentenboek zitten. */
  woorden: (n: number) => string
}

/** De titels van een reeks in een taal, met het Nederlands als terugval. */
const titels = (
  bron: { nummer: number, titel: string }[],
  vertaald: Record<number, { titel: string }> | undefined,
): string[] => bron.map((d) => vertaald?.[d.nummer]?.titel ?? d.titel)

const nl: Reeks = {
  sba: titels(PRENTENBOEKEN, VERTALINGEN['nl']),
  sleutels: titels(REEKS, SLEUTEL_VERTALINGEN['nl']),
  nu: 'Nu',
  woorden: (n) => `${n} woorden Darija`,
}

const fr: Reeks = {
  sba: titels(PRENTENBOEKEN, VERTALINGEN['fr']),
  sleutels: titels(REEKS, SLEUTEL_VERTALINGEN['fr']),
  nu: 'Aujourd’hui',
  woorden: (n) => `${n} mots de darija`,
}

const de: Reeks = {
  sba: titels(PRENTENBOEKEN, VERTALINGEN['de']),
  sleutels: titels(REEKS, SLEUTEL_VERTALINGEN['de']),
  nu: 'Heute',
  woorden: (n) => `${n} Wörter Darija`,
}

const es: Reeks = {
  sba: titels(PRENTENBOEKEN, VERTALINGEN['es']),
  sleutels: titels(REEKS, SLEUTEL_VERTALINGEN['es']),
  nu: 'Hoy',
  woorden: (n) => `${n} palabras en dariya`,
}

const it: Reeks = {
  sba: titels(PRENTENBOEKEN, VERTALINGEN['it']),
  sleutels: titels(REEKS, SLEUTEL_VERTALINGEN['it']),
  nu: 'Oggi',
  woorden: (n) => `${n} parole in darija`,
}

const en: Reeks = {
  sba: titels(PRENTENBOEKEN, VERTALINGEN['en']),
  sleutels: titels(REEKS, SLEUTEL_VERTALINGEN['en']),
  nu: 'Today',
  woorden: (n) => `${n} Darija words`,
}

export const DELEN: Record<string, Reeks> = { nl, fr, de, es, it, en }
