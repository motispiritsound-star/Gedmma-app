/**
 * De upload-sleutel voor Google Play aanmaken.
 *
 *   npm run sleutel
 *
 * Android Studio heeft hier een wizard voor met acht velden, en die velden zijn
 * precies waar het misgaat: een wachtwoord dat nergens is opgeschreven, een
 * alias die anders heet dan verwacht, een .jks die in de projectmap belandt en
 * meegaat in een commit.
 *
 * Wat dit doet:
 *   1. de sleutel komt in een eigen map BUITEN het project, zodat git er nooit
 *      bij kan -- en .gitignore vangt hem daarnaast ook nog op;
 *   2. het wachtwoord wordt hier verzonnen, dertig tekens, en opgeschreven
 *      naast de sleutel. Niet te onthouden, en dat hoeft ook niet;
 *   3. `android/keystore.properties` wijst naar allebei, zodat `npm run aab`
 *      verder niets vraagt.
 *
 * ÉÉN DING BLIJFT HANDWERK, en het is het belangrijkste: zet die map óók
 * ergens anders neer. Twee plekken, niet dezelfde computer. Een verloren
 * upload-sleutel betekent dat je de app nooit meer kunt bijwerken -- Google
 * kan hem opnieuw instellen, maar dat duurt dagen en kost een supportzaak.
 */
import { randomInt } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { geenJdk, jdkTool } from './lib/jdk.mjs'

const WORTEL = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EIGENSCHAPPEN = path.join(WORTEL, 'android', 'keystore.properties')
const ALIAS = 'upload'
const MAPNAAM = 'Dilimiz-sleutel'

/** Zonder aanhalingstekens en backslash: die overleven geen commandoregel. */
const TEKENS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_+=#%'

const wachtwoord = (lengte = 30) =>
  Array.from({ length: lengte }, () => TEKENS[randomInt(TEKENS.length)]).join('')

function sleutelmap() {
  const thuis = os.homedir()
  const documenten = path.join(thuis, 'Documents')
  return path.join(existsSync(documenten) ? documenten : thuis, MAPNAAM)
}

const keytool = jdkTool('keytool')
if (!keytool) {
  console.error(geenJdk())
  process.exit(1)
}

const map = sleutelmap()
const sleutel = path.join(map, 'dilimiz-upload.jks')

if (existsSync(sleutel)) {
  console.log(`Er staat al een sleutel: ${sleutel}`)
  console.log('')
  console.log('Die niet overschrijven. Een nieuwe sleutel betekent dat Google de app')
  console.log('niet meer als dezelfde app herkent, en dan kun je geen bijwerking meer')
  console.log('uploaden. Is hij kwijt, dan is dat een supportzaak bij Google en geen')
  console.log('opdracht hier.')
  process.exit(1)
}

mkdirSync(map, { recursive: true })
const ww = wachtwoord()

// -storepass en -keypass gelijk: Gradle verwacht dat, en twee verschillende
// wachtwoorden levert een foutmelding op over "Cannot recover key" die nergens
// over gaat.
execFileSync(keytool, [
  '-genkeypair',
  '-v',
  '-keystore', sleutel,
  '-alias', ALIAS,
  '-keyalg', 'RSA',
  '-keysize', '2048',
  // 10000 dagen: Google eist een geldigheid tot ver voorbij 2033, en een
  // sleutel die verloopt is een app die je niet meer kunt bijwerken.
  '-validity', '10000',
  '-storepass', ww,
  '-keypass', ww,
  '-dname', 'CN=Dilimiz, OU=Dilimiz, O=Dilimiz, C=NL',
], { stdio: ['ignore', 'ignore', 'inherit'] })

writeFileSync(
  path.join(map, 'WACHTWOORD.txt'),
  [
    'Dilimiz — de upload-sleutel voor Google Play',
    '',
    `Bestand:     ${sleutel}`,
    `Alias:       ${ALIAS}`,
    `Wachtwoord:  ${ww}`,
    '',
    'Bewaar deze map op TWEE plekken, en niet allebei op deze computer.',
    'Zonder deze sleutel kun je de app in Google Play nooit meer bijwerken.',
    '',
    'Deze map hoort niet in git, niet in een gedeelde map die automatisch',
    'synchroniseert naar een werkaccount, en niet in een e-mail.',
  ].join('\n'),
  'utf8',
)

writeFileSync(
  EIGENSCHAPPEN,
  [
    '# Geschreven door `npm run sleutel`. Staat in .gitignore en hoort daar.',
    `storeFile=${sleutel.replace(/\\/g, '\\\\')}`,
    `storePassword=${ww}`,
    `keyAlias=${ALIAS}`,
    `keyPassword=${ww}`,
    '',
  ].join('\n'),
  'utf8',
)

console.log('Sleutel gemaakt.')
console.log('')
console.log(`  Sleutel:     ${sleutel}`)
console.log(`  Wachtwoord:  ${path.join(map, 'WACHTWOORD.txt')}`)
console.log(`  Gradle leest hem via ${EIGENSCHAPPEN}`)
console.log('')
console.log('DOE DIT NU: kopieer de hele map naar een tweede plek — een usb-stick,')
console.log('een wachtwoordkluis, een andere computer. Raak je hem kwijt, dan kun je')
console.log('de app in Google Play nooit meer bijwerken.')
console.log('')
console.log('Daarna: npm run aab')
