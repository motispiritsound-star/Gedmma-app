import { execFileSync } from 'node:child_process'

/**
 * Welke commit er gebouwd wordt, hardop.
 *
 * Op 2 oktober zijn er vier bundels gebouwd van code van de dag ervoor —
 * Windows stond 94 commits achter, de Mac 65. Daar is bij het bouwen niets
 * van te zien: hetzelfde aantal MB, hetzelfde "BUILD SUCCESSFUL", en het
 * versienummer dat je meegeeft klopt gewoon. Je ontdekt het pas als iemand
 * achteraf vraagt wat `git log` zegt, en dat is drie keer gebeurd voordat het
 * opviel.
 *
 * Een bundel met een nieuw versienummer en oude code is het ergste soort
 * fout: hij slaagt, hij is te uploaden, en hij haalt een beoordeling. Pas bij
 * de gebruiker merk je dat er niets in zit.
 *
 * Dus zegt het bouwscript het nu zelf, vóór het bouwt. En het kijkt na bij
 * `origin` of er iets nieuwers is — met `git fetch`, want de lokale
 * `origin/main` is net zo oud als de laatste keer dat er getrokken is, en dat
 * was in dit geval precies het probleem.
 */

/** Git, met een korte lont en zonder herrie als het misgaat. */
const git = (args, cwd, ms = 20_000) =>
  execFileSync('git', args, { cwd, encoding: 'utf8', timeout: ms, stdio: ['ignore', 'pipe', 'ignore'] }).trim()

/**
 * Dezelfde melding, maar in één regel en zonder ophalen.
 *
 * Bedoeld voor onderaan, náást het bestand dat er net uit kwam. De regel
 * bovenaan scrollt weg achter een paar honderd regels Gradle, en dan sta je
 * naar het eind te kijken zonder te weten wat erin zit — dat is precies waar
 * het vier keer op misging. Wat je het laatst leest hoort te zeggen wat je in
 * handen hebt.
 */
export function standKort(wortel) {
  try {
    return git(['log', '-1', '--format=%h  %cd  %s', '--date=format:%d-%m %H:%M'], wortel)
  } catch {
    return null
  }
}

export function toonStand(wortel, tak = 'main') {
  let hier
  try {
    hier = git(['log', '-1', '--format=%h  %cd  %s', '--date=format:%d-%m %H:%M'], wortel)
  } catch {
    // Geen git, of geen repository. Dat mag; het bouwen gaat gewoon door.
    return
  }
  console.log(`\nGebouwd uit: ${hier}`)

  let achter = null
  try {
    git(['fetch', 'origin', tak], wortel)
    achter = Number(git(['rev-list', '--count', `HEAD..origin/${tak}`], wortel))
  } catch {
    console.log(`Niet nagekeken bij origin — geen verbinding of geen toegang.`)
    return
  }

  if (!Number.isFinite(achter)) return
  if (achter === 0) {
    console.log(`Bij met origin/${tak}.\n`)
    return
  }

  /*
   * Dit stopte hier eerst niet, met het argument dat je soms met voordacht een
   * oudere stand bouwt. Twee keer bijna een winkel in:
   *
   *   20 oktober  de aab kwam uit commit 0dcfba2, 41 commits achter
   *   22 oktober  build 11 voor iOS kwam uit 0b729a7, 96 commits achter -- de
   *               app van 3 oktober, met 1.5 op het etiket
   *
   * Allebei keren stond de waarschuwing er gewoon, en allebei keren ging het
   * mis. De reden is de volgorde: hierna schrijft de beller het versie- en
   * buildnummer weg en meldt `versie -> 1.5` en `build -> 11`. Dat zijn de
   * laatste twee regels op het scherm, en die lezen als "gelukt". De
   * waarschuwing staat dan al boven de vouw.
   *
   * Dus stopt hij nu, en wel voor dat wegschrijven -- dat is het stuk dat niet
   * terug kan. Apple weigert een buildnummer dat al geupload is, dus een
   * bundel met het verkeerde nummer erop kost een echt nummer.
   *
   * Wie met opzet oud bouwt geeft `--ook-als-oud` mee.
   */
  console.error(
    `\n  !! ${achter} ${achter === 1 ? 'commit' : 'commits'} achter op origin/${tak}.\n`
    + `     Deze bundel zou een nieuw versienummer met oude code erin krijgen.\n`
    + `     Eerst trekken:              git pull origin ${tak}\n`
    + `     Lukt dat niet, dan staat er lokaal iets in de weg:\n`
    + `                                 git checkout -- android/app/build.gradle\n`,
  )

  if (process.argv.includes('--ook-als-oud')) {
    console.error(`     Toch doorgegaan: --ook-als-oud stond erbij.\n`)
    return
  }
  console.error(`     Gestopt. Met opzet oud bouwen? Zet --ook-als-oud erachter.\n`)
  process.exit(1)
}
