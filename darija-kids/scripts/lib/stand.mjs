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
   * Met opzet alleen een waarschuwing en geen afbreking: soms bouw je met
   * voordacht een oudere stand, bijvoorbeeld om een foutmelding na te doen.
   * Maar dan heb je het zelf gekozen, en staat het er zwart op wit.
   */
  console.log(
    `\n  !! ${achter} ${achter === 1 ? 'commit' : 'commits'} achter op origin/${tak}.\n`
    + `     Deze bundel krijgt een nieuw versienummer met oude code erin.\n`
    + `     Afbreken en eerst trekken:  git pull origin ${tak}\n`
    + `     Op Windows gaat dat pas na: git checkout -- android/app/build.gradle\n`,
  )
}
