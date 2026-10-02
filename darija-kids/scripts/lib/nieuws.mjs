/**
 * "Wat is er nieuw" bij een release, per taal.
 *
 * Play vraagt die tekst per winkelvermelding en staat 500 tekens toe. Zes
 * talen, zes velden, met de hand overgetikt uit een bestand dat er al is --
 * dat is zes kansen om een regel te vergeten of een taal over te slaan, en
 * niemand die het nakijkt.
 *
 * De teksten staan in `store/wat-is-nieuw-<versienaam>.md`, met een kop per
 * taalcode. Dit leest dat bestand en geeft het in de vorm die de Play-API wil.
 *
 * Staat er geen bestand voor deze versie, dan is dat geen fout: dan gaat de
 * release eruit zonder notities, net als voorheen. Maar de aanroeper hoort het
 * wel te zeggen, want een release zonder notities is een gemiste kans en geen
 * bedoeling.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

/** Play weigert een langere tekst. Nagemeten: het veld kapt niet af, het weigert. */
export const MAX = 500

/**
 * @returns {{language: string, text: string}[]} leeg als er geen bestand is
 */
export function nieuwsVoor(wortel, versienaam) {
  const pad = path.join(wortel, 'store', `wat-is-nieuw-${versienaam}.md`)
  if (!existsSync(pad)) return []
  return lees(readFileSync(pad, 'utf8'))
}

/** Hetzelfde, maar op tekst in plaats van een pad -- zodat een test het kan voeren. */
export function lees(tekst) {
  const uit = []
  // De koppen zijn `## nl-NL`. Alles tot de volgende kop hoort erbij; de
  // inleiding boven de eerste kop is voor een mens en gaat niet mee.
  for (const blok of tekst.replace(/\r\n/g, '\n').split(/^## /m).slice(1)) {
    const eersteRegel = blok.slice(0, blok.indexOf('\n')).trim()
    if (!/^[a-z]{2}-[A-Z]{2}$/.test(eersteRegel)) continue
    const lijf = blok.slice(blok.indexOf('\n') + 1).trim()
    if (lijf) uit.push({ language: eersteRegel, text: lijf })
  }
  return uit
}

/** Welke talen te lang zijn. Leeg is goed. */
export const teLang = (notities) => notities.filter((n) => n.text.length > MAX)
