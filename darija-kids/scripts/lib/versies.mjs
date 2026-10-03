/**
 * Welk versienummer is er al eens gebouwd?
 *
 * Play weigert een versionCode die hij al gezien heeft, ook van een upload die
 * je weer hebt ingetrokken. Het nummer moet dus omhoog, en je moet weten tot
 * waar het al staat.
 *
 * In `android/app/build.gradle` staat dat niet. `maak-aab.mjs` schrijft het
 * nummer daar bij elke bouw in, maar dat bestand wordt niet teruggezet in de
 * repository -- daar staat nog `versionCode 1`. Wie uit een verse kloon bouwt
 * leest dus 1 waar Play er al vijf heeft gehad, en krijgt na het bouwen, het
 * ondertekenen en het wachten te horen dat het nummer al gebruikt is.
 *
 * Dit is misgegaan: op 1 oktober is `--naam 1.1` geadviseerd terwijl 1.2 al
 * live stond. Daarom staat het hier, in een bestand dat wél meegaat.
 *
 * Het boek begint bij 4. De nummers daarvoor zijn niet meer na te gaan en doen
 * er ook niet toe: wat telt is het hoogste, en vanaf hier schrijft de bouw zelf
 * bij. Het veld `waar` is voor een mens -- geen enkel script leest het.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

const BOEK = (wortel) => path.join(wortel, 'docs', 'versies.json')

/** @returns {{code: number, naam: string, datum: string, waar?: string}[]} oudste eerst */
export function gebouwd(wortel) {
  const pad = BOEK(wortel)
  if (!existsSync(pad)) return []
  try {
    const uit = JSON.parse(readFileSync(pad, 'utf8'))
    return Array.isArray(uit) ? uit : []
  } catch {
    return []
  }
}

/** Het hoogste nummer dat ooit gebouwd is, of 0. */
export function hoogste(wortel) {
  return gebouwd(wortel).reduce((h, r) => Math.max(h, Number(r.code) || 0), 0)
}

/** De naam die bij het hoogste nummer hoort, of null. */
export function hoogsteNaam(wortel) {
  const boek = gebouwd(wortel)
  if (!boek.length) return null
  return boek.reduce((h, r) => ((Number(r.code) || 0) >= (Number(h.code) || 0) ? r : h)).naam ?? null
}

/**
 * De naam die bij één bepaald nummer hoort, of null.
 *
 * `hoogsteNaam` is bijna altijd hetzelfde antwoord, maar niet als er iets
 * ouders opgestuurd wordt -- en dan is "bijna altijd" precies verkeerd.
 */
export function naamVan(wortel, code) {
  const regel = gebouwd(wortel).find((r) => Number(r.code) === Number(code))
  return regel?.naam ?? null
}

/**
 * Een bouw bijschrijven. Hetzelfde nummer twee keer bouwen is geen fout -- dat
 * gebeurt als een eerdere bundel niet deugde -- dus dan wordt de regel
 * bijgewerkt in plaats van verdubbeld.
 */
export function schrijfBij(wortel, code, naam) {
  if (!code) return
  const boek = gebouwd(wortel)
  const datum = new Date().toISOString().slice(0, 10)
  const al = boek.find((r) => Number(r.code) === Number(code))
  if (al) {
    al.naam = naam ?? al.naam
    al.datum = datum
  } else {
    boek.push({ code: Number(code), naam: naam ?? '?', datum })
  }
  boek.sort((a, b) => Number(a.code) - Number(b.code))
  const pad = BOEK(wortel)
  mkdirSync(path.dirname(pad), { recursive: true })
  writeFileSync(pad, `${JSON.stringify(boek, null, 2)}\n`)
}
