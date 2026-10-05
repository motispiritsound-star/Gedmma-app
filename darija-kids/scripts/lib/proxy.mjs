/**
 * Zorgen dat `fetch` de proxy van de omgeving gebruikt.
 *
 * In een omgeving die het uitgaande verkeer door een proxy stuurt — een
 * bouwmachine, een bedrijfsnetwerk, de cloudcontainer waarin deze repo soms
 * draait — staat het adres van die proxy in `HTTPS_PROXY`. `curl` leest die
 * variabele vanzelf. Node's `fetch` niet: die gaat er rechtstreeks langs, en
 * wat er dan terugkomt is geen nette foutmelding maar een gewone HTTP 403.
 *
 * Dat is een vervelende fout, want hij liegt. Vier bronnen die alle vier 403
 * geven lezen als "die site laat ons niet binnen" of "het netwerk staat
 * dicht", en in werkelijkheid was het netwerk open en keek Node de verkeerde
 * kant op. Hier is daar een halve dag in gaan zitten, en de conclusie stond al
 * in `docs/STAND.md` voordat hij klopte.
 *
 * Node kan het wel, achter een vlag die alleen bij het starten gezet kan
 * worden. Vandaar dat dit het proces opnieuw start in plaats van iets aan te
 * zetten: op het moment dat een script draait, is het te laat.
 *
 * Doet niets als er geen proxy is — dus op een gewone laptop merk je er niets
 * van — en niets als deze Node de vlag niet kent.
 */
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const VLAG = '--use-env-proxy'
const GEDAAN = 'PROXY_HERSTART'

export function viaProxy(metaUrl) {
  const proxy = process.env.HTTPS_PROXY || process.env.https_proxy
  if (!proxy) return
  if (process.env[GEDAAN]) return
  if (process.execArgv.includes(VLAG)) return
  if (!process.allowedNodeEnvironmentFlags.has(VLAG)) return

  const uit = spawnSync(
    process.execPath,
    [VLAG, fileURLToPath(metaUrl), ...process.argv.slice(2)],
    { stdio: 'inherit', env: { ...process.env, [GEDAAN]: '1' } },
  )
  process.exit(uit.status ?? 1)
}
