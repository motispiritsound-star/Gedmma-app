/**
 * Laadt .env in process.env, stil en zonder afhankelijkheden.
 *
 * Node kan dit zelf met --env-file, maar dat drukt bij een ontbrekend bestand
 * een Engelse waarschuwing af, drie keer, nog voor je eigen uitvoer begint. Dat
 * is precies het moment waarop een beginner denkt dat er iets stuk is.
 *
 * Wordt geladen via `tsx --import`, dus vóór elk CLI-bestand. Bestaande
 * omgevingsvariabelen winnen: wat je op de opdrachtregel meegeeft, gaat voor.
 */
import { readFileSync, existsSync } from 'node:fs'

export function laadEnv(pad = '.env'): number {
  if (!existsSync(pad)) return 0
  let aantal = 0
  for (const regel of readFileSync(pad, 'utf8').split('\n')) {
    const schoon = regel.trim()
    if (schoon === '' || schoon.startsWith('#')) continue
    const is = schoon.indexOf('=')
    if (is <= 0) continue
    const naam = schoon.slice(0, is).trim()
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(naam)) continue
    if (process.env[naam] !== undefined) continue

    let waarde = schoon.slice(is + 1).trim()
    // Aanhalingstekens mogen, maar hoeven niet. Zonder aanhalingstekens knippen
    // we bij een losstaande #, zodat een commentaar achter een waarde werkt.
    if ((waarde.startsWith('"') && waarde.endsWith('"') && waarde.length > 1) ||
        (waarde.startsWith("'") && waarde.endsWith("'") && waarde.length > 1)) {
      waarde = waarde.slice(1, -1)
    } else {
      const hek = waarde.search(/\s#/)
      if (hek !== -1) waarde = waarde.slice(0, hek).trim()
    }
    process.env[naam] = waarde
    aantal++
  }
  return aantal
}

laadEnv()
