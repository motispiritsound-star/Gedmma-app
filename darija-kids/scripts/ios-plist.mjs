import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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
  const build = arg('build')
  const versie = arg('versie')
  if (!build && !versie) return
  const draai = (args) =>
    execFileSync('xcrun', ['agvtool', ...args], { cwd: PROJECT, encoding: 'utf8', stdio: 'pipe' })
  try {
    if (versie) {
      draai(['new-marketing-version', versie])
      console.log(`versie → ${versie}`)
    }
    if (build) {
      draai(['new-version', '-all', build])
      console.log(`build → ${build}`)
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
