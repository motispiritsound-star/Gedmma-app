/**
 * Wrangler aanroepen, op elk besturingssysteem.
 *
 * Niet via `npx`. Dat lijkt de gewone weg en gaat op Windows stuk: daar heet
 * hij `npx.cmd`, en een programma dat Node rechtstreeks start — buiten een
 * shell om — vindt hem dan niet. `Error: spawnSync npx ENOENT`, en die
 * foutmelding zegt niet dat je op Windows zit.
 *
 * Dus roepen we het bestand aan dat npx uiteindelijk ook zou draaien: het
 * javascript van wrangler zelf, met de Node die dit script draait. Geen shell,
 * geen PATH, geen aanhalingstekens om paden met spaties.
 */
import { execFile, execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const SERVER = path.join(ROOT, 'server')
const BIN = path.join(SERVER, 'node_modules', 'wrangler', 'bin', 'wrangler.js')

/**
 * Draait `wrangler <argumenten>` vanuit de servermap.
 *
 * Die map is met opzet vast: daar staat `wrangler.toml`, en wrangler zoekt dat
 * bestand vanaf de map waarin hij draait. Ergens anders vandaan gestart weet
 * hij niet welke worker je bedoelt.
 */
export const wrangler = (argumenten, opties = {}) => {
  if (!existsSync(BIN)) {
    console.error('\nWrangler staat er niet. Installeer hem eerst:\n')
    console.error('  cd server')
    console.error('  npm install\n')
    process.exit(1)
  }
  try {
    return execFileSync(process.execPath, [BIN, ...argumenten], {
      cwd: SERVER, stdio: 'pipe', encoding: 'utf8', ...opties,
    })
  } catch (fout) {
    /*
     * `execFileSync` zet de hele aanroep in `.message`: het pad naar node, het
     * pad naar wrangler, en bij een d1-opdracht het complete SQL-statement.
     * Dat is een blok van tien regels waarin de eigenlijke reden ergens
     * onderaan staat, als hij er al in staat.
     *
     * De reden staat in `stderr`. Die wordt de melding, en `status`, `stderr`
     * en `stdout` blijven staan omdat deploy.mjs de exitcode doorgeeft en de
     * andere scripts de tekst zelf opmaken.
     */
    const stderr = String(fout.stderr ?? '')
    const stdout = String(fout.stdout ?? '')
    const netjes = new Error((stderr || stdout || String(fout.message ?? '')).trim())
    netjes.status = fout.status
    netjes.stderr = stderr
    netjes.stdout = stdout
    throw netjes
  }
}

/**
 * Gaat deze fout over inloggen, of over iets anders?
 *
 * Het verschil is belangrijk. Een controle die "weg" zegt terwijl hij "ik kon
 * het niet vragen" bedoelt, zet je aan het werk aan iets dat niet stuk is.
 */
export const isInlogfout = (fout) => {
  const tekst = typeof fout === 'string'
    ? fout
    : `${fout?.stderr ?? ''}${fout?.stdout ?? ''}${fout?.message ?? ''}`
  return /CLOUDFLARE_API_TOKEN|not logged in|authenticat|Unauthorized/i.test(tekst)
}

/**
 * Ophouden vóór de opdracht, als er niemand is ingelogd.
 *
 * Nodig omdat `wrangler whoami` slaagt met exitcode 0 en in de tekst "You are
 * not authenticated" zet. Achteraf kijken helpt ook niet altijd: wie
 * `stdio: 'inherit'` gebruikt -- en dat doet de uitrol, zodat je de voortgang
 * ziet -- krijgt niets in `stderr` terug om op te toetsen.
 *
 * De prijs is de vier seconden die wrangler nodig heeft om op te starten. Dat
 * is te doen vóór een uitrol, en het scheelt een Engelse melding over een
 * CLOUDFLARE_API_TOKEN waarin het woord `npm run inloggen` niet voorkomt.
 */
export const eisInlog = (wat = 'dit doen') => {
  let uit = ''
  try {
    uit = String(wrangler(['whoami']) ?? '')
  } catch (fout) {
    uit = `${fout?.stderr ?? ''}${fout?.stdout ?? ''}${fout?.message ?? ''}`
  }
  if (!isInlogfout(uit)) return
  console.error(`\nWrangler weet niet wie je bent, dus het lukt niet om ${wat}.\n`)
  console.error('Log één keer in:\n')
  console.error('  npm run inloggen\n')
  process.exit(1)
}

/**
 * Wrangler aanroepen en er bij een fout mee ophouden, leesbaar.
 *
 * Voor scripts die niets beters kunnen doen dan stoppen. Zonder dit geeft een
 * mislukte aanroep een stacktrace van Node waarin het woord "wrangler" één
 * keer voorkomt en het woord "inloggen" nul keer -- `npm run bestellingen`
 * deed dat, en dan zoek je in de verkeerde hoek.
 */
export const wranglerOfStop = (argumenten, wat = 'dit op te vragen') => {
  try {
    return wrangler(argumenten)
  } catch (fout) {
    if (isInlogfout(fout)) {
      console.error(`\nWrangler weet niet wie je bent, dus het lukt niet om ${wat}.\n`)
      console.error('Log één keer in:\n')
      console.error('  npm run inloggen\n')
      process.exit(1)
    }
    console.error(`\nHet is niet gelukt om ${wat}.\n`)
    const tekst = String(fout.message || fout).replace(/\u001b\[[0-9;]*m/g, '')
    console.error(tekst.split('\n').filter(Boolean).slice(-4).map((r) => `  ${r}`).join('\n'))
    console.error('')
    process.exit(typeof fout.status === 'number' ? fout.status : 1)
  }
}

/**
 * Dezelfde aanroep, maar zonder te wachten — en met een pool erbij.
 *
 * Wrangler heeft ruim vier seconden nodig om op te starten, vóór hij ook maar
 * iets doet. Dat is onbelangrijk bij één aanroep en beslissend bij
 * tweeduizend: de prentenboeken zijn tweeduizenddriehonderd bestanden, en één
 * wrangler per bestand achter elkaar is bijna drie uur waarvan het meeste
 * opstarten is.
 *
 * Ze staan het grootste deel van die tijd te wachten op het netwerk, dus ze
 * kunnen prima naast elkaar. Zes is een rustig getal: het scheelt een factor
 * zes, en het blijft ruim onder wat Cloudflare per token toestaat.
 */
export const wranglerLos = (argumenten, opties = {}) => new Promise((klaar, mis) => {
  execFile(process.execPath, [BIN, ...argumenten],
    { cwd: SERVER, encoding: 'utf8', ...opties },
    (fout, uit, fouttekst) => (fout ? mis(new Error(fouttekst || fout.message)) : klaar(uit)))
})

/**
 * Draai een rij taken, hoogstens `tegelijk` tegelijk.
 *
 * `maak` krijgt één ding uit de rij en geeft een belofte terug. Gaat er één
 * mis, dan valt het geheel — dat is hier de bedoeling: een boek waarvan de
 * helft van de bladzijden in de bak staat is erger dan een boek dat er niet
 * is, want de lezer opent hem dan wel.
 */
export const pool = async (rij, maak, tegelijk = 6, na = null) => {
  const wacht = new Set()
  for (const ding of rij) {
    const taak = maak(ding).then(() => { wacht.delete(taak); if (na) na() })
    wacht.add(taak)
    if (wacht.size >= tegelijk) await Promise.race(wacht)
  }
  await Promise.all(wacht)
}
