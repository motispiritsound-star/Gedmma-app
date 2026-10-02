import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { toonStand } from './lib/stand.mjs'

/**
 * De twee regels die met de hand in Xcode moesten.
 *
 * `Info.plist` hoort bij het iOS-project, en dat project staat niet in het
 * repository: het wordt op de Mac gemaakt met `npx cap add ios`. Daardoor
 * moesten deze twee regels er elke keer met de muis in, en één ervan is er
 * eentje die je niet mág vergeten — zonder de microfoonregel sluit iOS de app
 * af zodra een kind op de opnameknop drukt. Geen foutmelding, weg.
 *
 * Dit script zet ze allebei. Het hangt aan `npm run ios`, dus wie de gewone
 * weg volgt krijgt ze vanzelf, en wie het twee keer draait krijgt niet twee
 * keer dezelfde regel.
 *
 * Draait het ergens anders dan op een Mac, of is het iOS-project er nog niet,
 * dan zegt het dat en gaat het door. Dit hoort de build niet te breken.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PROJECT = path.join(ROOT, 'ios', 'App')
const PLIST = path.join(PROJECT, 'App', 'Info.plist')
const BUDDY = '/usr/libexec/PlistBuddy'

toonStand(ROOT)

/** `npm run ios -- --build 5 --versie 1.0` */
const arg = (naam) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > -1 ? process.argv[i + 1] : undefined
}

/**
 * Wat de ouder te zien krijgt als iOS om de microfoon vraagt.
 *
 * Het moet waar zijn, en het ís waar: de opname wordt afgespeeld en daarna
 * weggegooid, en er is geen server om hem heen te sturen.
 */
const MICROFOON = 'Om je uitspraak op te nemen en meteen terug te luisteren. '
  + 'De opname blijft op dit toestel en wordt nergens heen gestuurd.'

const REGELS = [
  // Zonder deze blijft elke upload op "Missing Compliance" staan en gaat hij
  // niet naar je testers. De app heeft geen eigen cryptografie; de gewone
  // HTTPS van het besturingssysteem telt voor deze vraag niet mee.
  { sleutel: 'ITSAppUsesNonExemptEncryption', soort: 'bool', waarde: 'false' },
  { sleutel: 'NSMicrophoneUsageDescription', soort: 'string', waarde: MICROFOON },
]

const BUILD = arg('build')
const VERSIE = arg('versie')

/*
  Hieronder wordt twee keer stilletjes gestopt met afsluitcode 0. Dat klopt
  voor de twee regels in `Info.plist`: die horen bij het iOS-project, en waar
  dat er niet is valt er niets te zetten. `npm run build` op de pc hoeft daar
  niet op te vallen.

  Maar niet voor het buildnummer. Wie `--build 6` meegeeft vraagt om iets dat
  moet gebeuren, en een opdracht die dat overslaat en tóch 0 teruggeeft, zegt
  dat het gelukt is. Dan archiveer je met het oude nummer en weigert Apple de
  upload — of erger, hij komt binnen en staat nergens in de lijst.

  Dus: is er een nummer gevraagd en kan het hier niet, dan is dat een fout.
*/
if (BUILD || VERSIE) {
  if (process.platform !== 'darwin') {
    const mee = `${VERSIE ? `--versie ${VERSIE} ` : ''}${BUILD ? `--build ${BUILD}` : ''}`.trim()
    console.error(`\nDit is een Mac-opdracht, en deze machine draait ${process.platform}.\n`)
    console.error('Het buildnummer zit in het Xcode-project, en dat kan alleen met')
    console.error('`xcrun agvtool` op macOS. Op de Mac, twee regels:\n')
    console.error('  git -C ~/Gedmma-app pull')
    console.error(`  npm --prefix ~/Gedmma-app/darija-kids run ios -- ${mee}\n`)
    console.error('Zie docs/MAC.md. Op Windows bouw je Android: npm run aab\n')
    process.exit(1)
  }
  if (!existsSync(PROJECT)) {
    console.error(`\nHet iOS-project staat er nog niet: ${PROJECT}\n`)
    console.error('Dat wordt op de Mac gemaakt en staat niet in het repository:\n')
    console.error('  npx cap add ios\n')
    process.exit(1)
  }
}

if (!existsSync(PLIST)) {
  console.log('geen ios/App/App/Info.plist — overgeslagen')
  process.exit(0)
}
if (!existsSync(BUDDY)) {
  console.log('geen PlistBuddy (dit is geen Mac) — overgeslagen')
  process.exit(0)
}

const buddy = (opdracht) =>
  execFileSync(BUDDY, ['-c', opdracht, PLIST], { encoding: 'utf8' })

/**
 * Het buildnummer en het versienummer.
 *
 * Twee getallen die in Xcode achter een tabblad zitten, en allebei zijn ze
 * eerder misgegaan. Het buildnummer moet bij élke upload omhoog, anders
 * weigert Apple hem. En het versienummer moet letterlijk gelijk zijn aan wat
 * er in App Store Connect staat: "1.0.0" is daar niet hetzelfde als "1.0", en
 * een build met het verkeerde nummer verschijnt nergens in de lijst — hij is
 * geüpload, hij is verwerkt, en je kunt hem niet kiezen.
 *
 * `agvtool` zet ze allebei in het Xcode-project zelf, dus je hoeft het niet te
 * openen om ze te wijzigen.
 */
const nummers = () => {
  if (!BUILD && !VERSIE) return

  const draai = (args) =>
    execFileSync('xcrun', ['agvtool', ...args], { cwd: PROJECT, encoding: 'utf8', stdio: 'pipe' })
  try {
    if (VERSIE) {
      draai(['new-marketing-version', VERSIE])
      console.log(`versie → ${VERSIE}`)
    }
    if (BUILD) {
      draai(['new-version', '-all', BUILD])
      console.log(`build → ${BUILD}`)
    }
  } catch (e) {
    console.error('agvtool kwam er niet uit:', e.message)
    process.exit(1)
  }
}

nummers()

for (const { sleutel, soort, waarde } of REGELS) {
  try {
    // Bestaat hij al, dan alleen de waarde bijwerken.
    buddy(`Print :${sleutel}`)
    buddy(`Set :${sleutel} ${waarde}`)
    console.log(`${sleutel} bijgewerkt`)
  } catch {
    buddy(`Add :${sleutel} ${soort} ${waarde}`)
    console.log(`${sleutel} toegevoegd`)
  }
}
