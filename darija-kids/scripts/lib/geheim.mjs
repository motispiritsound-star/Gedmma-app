/**
 * Het koopgeheim, lokaal bewaard zodat je het niet elke keer hoeft op te zoeken.
 *
 * Het staat in `server/.dev.vars` — de plek waar dit project zijn lokale
 * geheimen al bewaarde, en die staat in `.gitignore`. Bij Cloudflare staat
 * dezelfde waarde als echt geheim; dit is een kopie om mee te kunnen testen,
 * geen tweede bron van waarheid.
 *
 * Waarom niet elke keer vragen: `npm run proefkoop` is bedoeld om vaak te
 * draaien, en een opdracht die telkens om een sleutel van achtenveertig tekens
 * vraagt, wordt niet gedraaid. Dan gaat iemand hem ergens plakken waar hij
 * makkelijker terug te vinden is, en dat is precies wat je niet wilt.
 *
 * Windows schrijft `\r\n`. Vandaar dat er hier per regel wordt gezocht en dat
 * het regeleinde wordt teruggeschreven zoals het bestand het al had.
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
export const BESTAND = path.join(ROOT, 'server', '.dev.vars')

const SLEUTEL = 'KOOP_GEHEIM'

/** Het geheim, of niets als het er niet staat. */
export function leesGeheim() {
  if (!existsSync(BESTAND)) return null
  for (const regel of readFileSync(BESTAND, 'utf8').split(/\r?\n/)) {
    const m = regel.match(new RegExp(`^\\s*${SLEUTEL}\\s*=\\s*(.+?)\\s*$`))
    if (m) return m[1].replace(/^["']|["']$/g, '')
  }
  return null
}

/** Het geheim erin zetten of bijwerken, zonder de rest aan te raken. */
export function schrijfGeheim(waarde) {
  const eind = existsSync(BESTAND) && readFileSync(BESTAND, 'utf8').includes('\r\n') ? '\r\n' : '\n'
  const regels = existsSync(BESTAND)
    ? readFileSync(BESTAND, 'utf8').split(/\r?\n/)
    : []
  const uit = regels.filter((r) => !new RegExp(`^\\s*${SLEUTEL}\\s*=`).test(r))
  while (uit.length && uit[uit.length - 1] === '') uit.pop()
  uit.push(`${SLEUTEL}=${waarde}`, '')
  writeFileSync(BESTAND, uit.join(eind), 'utf8')
  return BESTAND
}

/** Het hele ping-adres, of niets. */
export const pingAdres = () => {
  const g = leesGeheim()
  return g ? `https://post.darijaforkids.eu/koop?s=${g}` : null
}
