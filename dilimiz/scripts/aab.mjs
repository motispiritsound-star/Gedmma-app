/**
 * De Android App Bundle bouwen die naar Google Play gaat.
 *
 *   npm run aab                          -- versiecode +1, versienaam blijft
 *   npm run aab -- --versie 2 --naam 1.1 -- allebei zelf zetten
 *
 * Wat er gebeurt: de webapp bouwen, in het Android-project kopiëren, de
 * versienummers in build.gradle zetten en gradle de bundle laten maken.
 *
 * Waarom dit een script is en geen lijstje klikstappen in Android Studio: de
 * versiecode ophogen is de stap die je vergeet, en Google weigert een upload
 * met een versiecode die al bestaat -- met een melding die niets zegt over wat
 * je moet doen. Hier kan dat niet misgaan.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { geenJdk, jdkTool } from './lib/jdk.mjs'

const WORTEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const GRADLE_BESTAND = path.join(WORTEL, 'android', 'app', 'build.gradle')
const SLEUTEL = path.join(WORTEL, 'android', 'keystore.properties')
const WINDOWS = process.platform === 'win32'

const vlag = (naam) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > -1 ? process.argv[i + 1] : null
}

const stop = (...regels) => { console.error(regels.join('\n')); process.exit(1) }

/* -- kan dit hier wel? ---------------------------------------------------- */

if (!existsSync(SLEUTEL)) {
  stop(
    'Er is nog geen upload-sleutel.',
    '',
    'Zonder sleutel wordt de bundle niet ondertekend, en dan weigert Google hem',
    'met "Upload een APK of Android App Bundle die is ondertekend". Maak hem',
    'eerst:',
    '',
    '    npm run sleutel',
  )
}

if (!jdkTool('keytool')) stop(geenJdk())

const sdk = process.env.ANDROID_HOME ?? process.env.ANDROID_SDK_ROOT
const lokaleEigenschappen = path.join(WORTEL, 'android', 'local.properties')
if (!sdk && !existsSync(lokaleEigenschappen)) {
  stop(
    'Geen Android SDK gevonden.',
    '',
    'Die zit in Android Studio. Installeer dat, open het project in',
    `${path.join(WORTEL, 'android')} één keer -- dan schrijft Android Studio`,
    'zelf local.properties -- en draai deze opdracht daarna opnieuw.',
    '',
    '    https://developer.android.com/studio',
  )
}

/* -- versienummers -------------------------------------------------------- */

let gradle = readFileSync(GRADLE_BESTAND, 'utf8')

const huidigeCode = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1] ?? 0)
const huidigeNaam = /versionName\s+"([^"]+)"/.exec(gradle)?.[1] ?? '1.0'

const code = Number(vlag('versie') ?? huidigeCode + 1)
const naam = vlag('naam') ?? huidigeNaam

if (!Number.isInteger(code) || code < 1) stop(`Geen geldige versiecode: ${code}`)

/*
 * Terugschrijven met `\r?\n` in het patroon: op Windows kan dit bestand
 * CRLF-regeleinden hebben, en een zoekopdracht die op `\n` rekent vindt daar
 * niets -- en meldt dan iets heel anders dan wat er aan de hand is.
 */
gradle = gradle
  .replace(/versionCode\s+\d+/, `versionCode ${code}`)
  .replace(/versionName\s+"[^"]+"/, `versionName "${naam}"`)
writeFileSync(GRADLE_BESTAND, gradle, 'utf8')

console.log(`Versie ${naam}, versiecode ${code}.`)

/* -- bouwen --------------------------------------------------------------- */

const draai = (opdracht, argumenten, waar = WORTEL) =>
  execFileSync(opdracht, argumenten, { cwd: waar, stdio: 'inherit' })

// npm en npx heten op Windows npm.cmd en npx.cmd, en Node vindt ze dan niet
// met execFile -- "Error: spawnSync npx ENOENT", een melding waar Windows niet
// in voorkomt. Dus het javascript zelf aanroepen met process.execPath.
const nodeScript = (pakket, ...argumenten) =>
  draai(process.execPath, [path.join(WORTEL, 'node_modules', pakket), ...argumenten])

console.log('\n→ de webapp bouwen')
nodeScript(path.join('vite', 'bin', 'vite.js'), 'build')

console.log('\n→ in het Android-project kopiëren')
nodeScript(path.join('@capacitor', 'cli', 'bin', 'capacitor'), 'sync', 'android')

console.log('\n→ de bundle maken')
const gradlew = path.join(WORTEL, 'android', WINDOWS ? 'gradlew.bat' : 'gradlew')
draai(gradlew, ['bundleRelease'], path.join(WORTEL, 'android'))

const bundel = path.join(WORTEL, 'android', 'app', 'build', 'outputs', 'bundle', 'release', 'app-release.aab')
if (!existsSync(bundel)) {
  stop('', 'Gradle is klaar maar er staat geen bundle. Lees de melding hierboven.')
}

console.log('')
console.log('Klaar.')
console.log('')
console.log(`  ${bundel}`)
console.log('')
console.log('Upload dit bestand in de Play Console, onder Testen → Open testen')
console.log('(of Productie, als je meteen live wilt). Zie docs/lanceren.md.')
