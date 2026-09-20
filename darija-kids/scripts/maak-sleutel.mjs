/**
 * De upload-sleutel voor Google Play aanmaken.
 *
 * Android Studio heeft hier een wizard voor met acht velden, en die velden zijn
 * precies de plek waar het misgaat: een wachtwoord dat nergens is opgeschreven,
 * een alias die anders heet dan verwacht, een .jks die in de projectmap belandt
 * en meegaat in een commit. Dit script doet het in één keer goed.
 *
 *   node scripts/maak-sleutel.mjs
 *
 * Wat er gebeurt:
 *   1. de sleutel komt in een eigen map BUITEN het project, zodat git er nooit
 *      bij kan (en .gitignore vangt hem daarnaast ook nog op);
 *   2. het wachtwoord wordt hier verzonnen — 30 tekens, niet te onthouden en
 *      dat hoeft ook niet, het staat naast de sleutel;
 *   3. `android/keystore.properties` wijst het Gradle-bestand naar beide, zodat
 *      `npm run aab` verder niets hoeft te vragen.
 *
 * Eén ding blijft handwerk: die map ergens anders neerzetten ook. Twee plekken,
 * niet dezelfde computer.
 */
import { randomInt } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { geenJdk, haalJdk, jdkTool, vindJdk } from './lib/jdk.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const EIGENSCHAPPEN = path.join(ROOT, 'android', 'keystore.properties')
const ALIAS = 'upload'

/** Tekens zonder aanhalingstekens en backslash: die overleven geen commandoregel. */
const TEKENS = 'abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789-_+=#%'

function wachtwoord(lengte = 30) {
  let uit = ''
  for (let i = 0; i < lengte; i++) uit += TEKENS[randomInt(TEKENS.length)]
  return uit
}

function sleutelmap() {
  const thuis = os.homedir()
  const documenten = path.join(thuis, 'Documents')
  const basis = existsSync(documenten) ? documenten : thuis
  return path.join(basis, 'Darijaforkids-sleutel')
}

let jdk = vindJdk()
if (!jdk) jdk = haalJdk()
if (!jdk) geenJdk()

const map = sleutelmap()
const jks = path.join(map, 'upload.jks')

if (existsSync(jks)) {
  console.log(`\nEr is al een sleutel: ${jks}`)
  console.log('Die blijft staan. Google Play accepteert maar één upload-sleutel per app,')
  console.log('dus een nieuwe zou de verkeerde zijn.\n')
  if (!existsSync(EIGENSCHAPPEN)) {
    console.log('Alleen android/keystore.properties ontbreekt nog. Maak hem zelf aan met:')
    console.log(`  storeFile=${jks.replace(/\\/g, '\\\\')}`)
    console.log('  storePassword=<het wachtwoord uit wachtwoord.txt naast de sleutel>')
    console.log(`  keyAlias=${ALIAS}`)
    console.log('  keyPassword=<hetzelfde wachtwoord>\n')
  }
  process.exit(0)
}

mkdirSync(map, { recursive: true })
const geheim = wachtwoord()

execFileSync(
  jdkTool(jdk, 'keytool'),
  [
    '-genkeypair',
    '-keystore', jks,
    '-alias', ALIAS,
    '-keyalg', 'RSA',
    '-keysize', '2048',
    '-validity', '10000',
    '-storepass', geheim,
    '-keypass', geheim,
    '-dname', 'CN=Darijaforkids, O=Darijaforkids, L=Amsterdam, C=NL',
  ],
  { stdio: ['ignore', 'ignore', 'inherit'] },
)

// Gradle leest .properties als Java-tekst: een backslash is daar een
// ontsnappingsteken, dus Windows-paden moeten verdubbeld.
const pad = jks.replace(/\\/g, '\\\\')
writeFileSync(
  EIGENSCHAPPEN,
  [
    '# Aangemaakt door `npm run sleutel`. Staat in .gitignore en hoort daar te blijven.',
    `storeFile=${pad}`,
    `storePassword=${geheim}`,
    `keyAlias=${ALIAS}`,
    `keyPassword=${geheim}`,
    '',
  ].join('\n'),
)

writeFileSync(
  path.join(map, 'wachtwoord.txt'),
  [
    'Upload-sleutel Darijaforkids (app.darijaforkids.learn)',
    '',
    `Bestand:     ${jks}`,
    `Alias:       ${ALIAS}`,
    `Wachtwoord:  ${geheim}`,
    '             (hetzelfde voor de sleutelbos en voor de sleutel zelf)',
    '',
    'Bewaar deze map op twee plekken die niet dezelfde computer zijn.',
    'Kwijt is niet fataal — Google bewaart via Play App Signing de echte',
    'handtekening en je kunt een nieuwe upload-sleutel aanvragen — maar het',
    'kost een week wachten.',
    '',
  ].join('\n'),
)

console.log('\nSleutel aangemaakt.\n')
console.log(`  ${jks}`)
console.log(`  ${path.join(map, 'wachtwoord.txt')}   <- wachtwoord staat hierin`)
console.log(`  android/keystore.properties          <- Gradle vindt hem nu zelf`)
console.log('\nZet die map ook ergens anders neer: een USB-stick, een kluis, een')
console.log('andere computer. Daarna: npm run aab\n')
