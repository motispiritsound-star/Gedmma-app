/**
 * Zitten alle plugins er wel in?
 *
 * Capacitor bindt javascript aan native code via plugins: `@capacitor/haptics`
 * laat de telefoon trillen, `@capacitor/local-notifications` zet een herinnering
 * klaar. Elke plugin staat in package.json en wordt door `cap sync` ingeschreven
 * in `android/app/src/main/assets/capacitor.plugins.json`. Gradle leest daarna
 * alléén dat bestand.
 *
 * Staat een plugin wel in package.json maar niet in node_modules -- bijvoorbeeld
 * omdat `npm install` na een `git pull` niet gedraaid is -- dan slaat `cap sync`
 * hem stil over. Geen waarschuwing, geen fout, een kleinere bundel. De app start
 * wel, maar de trilling blijft uit en de herinnering komt nooit. Dat merk je niet
 * bij het bouwen en meestal ook niet bij het testen; je merkt het aan een
 * recensie.
 *
 * Dit is gebeurd: op 2 oktober vond `cap sync android` op Windows één plugin
 * waar de Mac er drie vond.
 *
 * De scheidslijn tussen "plugin" en "gewoon pakket" is niet een naam maar het
 * veld `capacitor` in de package.json van het pakket zelf -- hetzelfde veld
 * waar `cap sync` op afgaat. `@capacitor/core` heeft het niet en is dus geen
 * plugin; `@capacitor/app` heeft het wel.
 */
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

/**
 * @param {string} wortel  de map met package.json erin
 * @param {'android'|'ios'} platform
 * @returns {{verwacht: string[], ingeschreven: string[], ontbreekt: string[], nietGeinstalleerd: string[]}}
 */
export function pluginstand(wortel, platform = 'android') {
  const pkg = JSON.parse(readFileSync(path.join(wortel, 'package.json'), 'utf8'))
  const namen = Object.keys(pkg.dependencies ?? {})

  const verwacht = []
  const nietGeinstalleerd = []
  for (const naam of namen) {
    const eigen = path.join(wortel, 'node_modules', naam, 'package.json')
    if (!existsSync(eigen)) {
      // Alleen pakketten die een plugin kúnnen zijn. Dat een willekeurige
      // afhankelijkheid ontbreekt is een zorg voor npm, niet voor deze bundel.
      if (naam.startsWith('@capacitor/') || naam.includes('capacitor-')) nietGeinstalleerd.push(naam)
      continue
    }
    let eigenPkg
    try {
      eigenPkg = JSON.parse(readFileSync(eigen, 'utf8'))
    } catch {
      continue
    }
    if (eigenPkg?.capacitor?.[platform]) verwacht.push(naam)
  }

  const lijst = path.join(wortel, platform, 'app', 'src', 'main', 'assets', 'capacitor.plugins.json')
  let ingeschreven = []
  if (platform === 'android' && existsSync(lijst)) {
    try {
      ingeschreven = JSON.parse(readFileSync(lijst, 'utf8')).map((p) => p.pkg)
    } catch {
      ingeschreven = []
    }
  }

  const ontbreekt = verwacht.filter((n) => !ingeschreven.includes(n))
  return { verwacht, ingeschreven, ontbreekt, nietGeinstalleerd }
}

/**
 * Hetzelfde, maar dan als een melding die je op het scherm kunt zetten.
 * Geeft `null` als er niets aan de hand is.
 */
export function pluginklacht(wortel, platform = 'android') {
  const { ingeschreven, ontbreekt, nietGeinstalleerd } = pluginstand(wortel, platform)
  if (!ontbreekt.length && !nietGeinstalleerd.length) return null

  const regels = ['']
  if (nietGeinstalleerd.length) {
    regels.push('Deze plugins staan in package.json maar niet in node_modules:')
    regels.push('')
    for (const n of nietGeinstalleerd) regels.push(`  ${n}`)
    regels.push('')
    regels.push('`cap sync` slaat ze dan stil over en de bundel mist hun functies.')
  }
  if (ontbreekt.length) {
    regels.push('Deze plugins zijn geïnstalleerd maar niet ingeschreven in de bundel:')
    regels.push('')
    for (const n of ontbreekt) regels.push(`  ${n}`)
    regels.push('')
    regels.push(`Ingeschreven staan er ${ingeschreven.length}: ${ingeschreven.join(', ') || 'geen'}.`)
  }
  regels.push('')
  regels.push('Draai eerst:')
  regels.push('')
  regels.push('  npm install')
  regels.push('  npm run android')
  regels.push('')
  return regels.join('\n')
}

/**
 * Welke java-klassen horen er in de bundel te zitten?
 *
 * De app zelf (de activity uit het manifest, in de naamruimte uit build.gradle)
 * plus elke ingeschreven plugin. Dit is de lijst waar `npm run watzitin` de dex
 * tegen afzet.
 *
 * @returns {{wat: string, klasse: string}[]}
 */
export function verwachteKlassen(wortel) {
  const uit = []

  const gradle = path.join(wortel, 'android', 'app', 'build.gradle')
  const manifest = path.join(wortel, 'android', 'app', 'src', 'main', 'AndroidManifest.xml')
  if (existsSync(gradle) && existsSync(manifest)) {
    const ruimte = readFileSync(gradle, 'utf8').match(/namespace\s*=?\s*"([^"]+)"/)?.[1]
    const activity = readFileSync(manifest, 'utf8').match(/android:name="(\.[^"]+)"/)?.[1]
    if (ruimte && activity) uit.push({ wat: 'de app zelf', klasse: ruimte + activity })
  }

  const lijst = path.join(wortel, 'android', 'app', 'src', 'main', 'assets', 'capacitor.plugins.json')
  if (existsSync(lijst)) {
    try {
      for (const p of JSON.parse(readFileSync(lijst, 'utf8'))) uit.push({ wat: p.pkg, klasse: p.classpath })
    } catch {
      /* geen lijst is geen klassen; de aanroeper merkt dat vanzelf */
    }
  }

  return uit
}

/**
 * Een klassenaam zoals hij in een dex staat: `app.x.Y` wordt `Lapp/x/Y;`.
 * Daar hoeft niets voor ontleed te worden, de tekst staat er letterlijk in.
 */
export const dexNaam = (klasse) => `L${klasse.replace(/\./g, '/')};`

/** Welke van deze klassen staan níet in de dex? */
export function kwijtInDex(dex, verwacht) {
  return verwacht.filter(({ klasse }) => !dex.includes(dexNaam(klasse)))
}
