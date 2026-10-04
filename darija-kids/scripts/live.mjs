/**
 * Zet de app op de website live, of haalt hem er weer af.
 *
 * Twee adressen in `src/site/links.ts` bepalen of darijaforkids.eu de app
 * aanbiedt of aankondigt. Zijn ze leeg, dan staat er "binnenkort" en een
 * knop die nergens heen gaat. Staat er een adres in, dan verdwijnt dat blok,
 * wordt de balk onderaan een downloadknop, en zijn de winkelknoppen echt.
 *
 * Dat is één bewerking in één bestand, en juist daarom hoort er een commando
 * bij. Op de dag van de lancering staan er twee goedkeuringen binnen, moet er
 * gepost worden en kijkt er iemand mee — dat is precies het moment waarop je
 * een cijfer verkeerd overtypt, en een verkeerd cijfer leidt de eerste
 * bezoekers naar een lege pagina in de App Store.
 *
 * Draaien met:
 *   node scripts/live.mjs                        — laat zien hoe het nu staat
 *   node scripts/live.mjs --apple 6751234567     — Apple erbij
 *   node scripts/live.mjs --apple <id> --google  — allebei, de lancering zelf
 *   node scripts/live.mjs --google uit           — één winkel weer uit
 *   node scripts/live.mjs --uit                  — weer terug naar binnenkort
 *
 * Voor hij iets wegschrijft kijkt hij na of de winkeladressen echt opengaan.
 * Gaat er één niet open, dan schrijft hij niets. Zie `kijkNa` hieronder.
 *
 * Bij `--apple` mag alles wat App Store Connect je geeft: het kale nummer,
 * `id6751234567`, of de lange deellink met een land en een naam erin.
 */
import { execFileSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const LINKS = path.join(ROOT, 'src', 'site', 'links.ts')

const vlag = (naam) => process.argv.includes(`--${naam}`)
const arg = (naam) => {
  const i = process.argv.indexOf(`--${naam}`)
  if (i < 0) return undefined
  const volgend = process.argv[i + 1]
  return volgend && !volgend.startsWith('--') ? volgend : ''
}

/* ------------------------------------------------------------------ lezen */

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const { STORE, appleStoreUrl, playStoreUrl } = await server.ssrLoadModule('/src/site/links.ts')
await server.close()

const nu = { apple: STORE.apple, google: STORE.google }

/* ---------------------------------------------------------------- bepalen */

const uit = vlag('uit')
let appleIn = arg('apple')
const googleIn = arg('google')

/**
 * Het Apple ID vragen in plaats van het in de handleiding open te laten.
 *
 * In `GO-LIVE.md` stond `npm run live -- --apple <het Apple ID> --google`, en
 * dat soort regels wordt letterlijk geplakt — punthaken en al. Bij Gumroad is
 * dat precies gebeurd met het ping-adres. Hier zou het erger uitpakken: op de
 * dag van de lancering, met de app al in de winkel, en met een foutmelding van
 * PowerShell over een `<` die hij als omleiding leest.
 *
 * Het nummer staat in App Store Connect en nergens anders, dus het kan niet
 * uit een bestand komen. Wat wel kan, is dat de opdracht erom vraagt op het
 * moment dat je hem geeft. Dan is er niets in te vullen vooraf.
 *
 * Alleen als er een scherm is om het op te vragen: draait dit in een script of
 * in een bouwmachine, dan gebeurt er niets bijzonders.
 */
if (!uit && appleIn === undefined && googleIn !== undefined && !nu.apple && process.stdin.isTTY) {
  const { createInterface } = await import('node:readline/promises')
  const lezer = createInterface({ input: process.stdin, output: process.stdout })
  console.log('\nHet Apple ID staat in App Store Connect, onder de app bij')
  console.log('App Information → Apple ID. Een getal van negen of tien cijfers.')
  console.log('De hele deellink plakken mag ook.\n')
  const gegeven = (await lezer.question('Apple ID (enter = Apple overslaan): ')).trim()
  lezer.close()
  if (gegeven) appleIn = gegeven
}

if (!uit && appleIn === undefined && googleIn === undefined) {
  const toon = (naam, url) => console.log(`  ${naam.padEnd(7)} ${url || '— leeg, de website zegt "binnenkort"'}`)
  console.log('\nZo staan de winkeladressen nu:\n')
  toon('Apple', nu.apple)
  toon('Google', nu.google)
  console.log(`\nDe website is ${nu.apple || nu.google ? 'live' : 'nog niet live'}.`)
  console.log('\nZetten doe je zo:')
  console.log('  npm run live -- --google        (hij vraagt het Apple ID)')
  console.log('  npm run live -- --uit\n')
  process.exit(0)
}

/** `--google uit` haalt één winkel weg zonder de andere mee te nemen. */
const isUit = (waarde) => ['uit', 'off', 'leeg', 'weg'].includes(waarde)

let doel
try {
  doel = uit
    ? { apple: '', google: '' }
    : {
        apple: appleIn === undefined ? nu.apple : !appleIn || isUit(appleIn) ? '' : appleStoreUrl(appleIn),
        google:
          googleIn === undefined ? nu.google : isUit(googleIn) ? '' : googleIn === '' ? playStoreUrl() : playStoreUrl(googleIn),
      }
} catch (fout) {
  console.error(`\n${fout.message}`)
  console.error('\nEen Apple ID is een getal van negen of tien cijfers. Je vindt het in')
  console.error('App Store Connect onder de app, bij App Information → Apple ID.\n')
  process.exit(1)
}

if (doel.apple === nu.apple && doel.google === nu.google) {
  console.log('\nEr verandert niets; dit staat er al.\n')
  process.exit(0)
}

/* -------------------------------------------------------------- nakijken */

/**
 * Kijken of een winkeladres echt opengaat, vóór het op de site komt.
 *
 * Op 4 oktober is `npm run live -- --google` gedraaid terwijl de Play-pagina
 * nog niet bestond: *managed publishing* stond aan en versiecode 8 stond nog
 * onder *Changes in review*, dus het adres gaf 404. Dit script schreef dat
 * adres zonder één vraag in `links.ts` en zette er 78 pagina's mee.
 *
 * Dat het niet naar buiten is gegaan, kwam doordat er toevallig iemand vroeg
 * of die pagina al openging — niet doordat hier iets op lette. En de dag
 * waarop dit misgaat is per definitie een drukke dag: er staan twee
 * goedkeuringen binnen, er moet gepost worden, en dan is dit precies het
 * soort controle dat je overslaat.
 *
 * Het script drukte onderaan al af dat een bericht met een dode link maar één
 * keer voorbijkomt. Dan hoort het dat zelf ook na te gaan.
 */
const kijkNa = async (naam, adres) => {
  if (!adres) return { naam, adres, stand: 'leeg' }
  try {
    const antwoord = await fetch(adres, { redirect: 'follow', signal: AbortSignal.timeout(15000) })
    if (antwoord.ok) return { naam, adres, stand: 'open', code: antwoord.status }
    /**
     * Alleen 404 betekent "deze pagina bestaat niet". Allebei de winkels
     * antwoorden zo op een app die niet openbaar is.
     *
     * Al het andere is "ik kon het niet nakijken", en dat moet het ook
     * blijven heten. Bij het testen van deze controle gaf een proxy hier 403,
     * en de eerste versie las dat als "bestaat niet" — dus die zou op een
     * bedrijfsnetwerk, achter een hotspot-portaal of bij een snelheidslimiet
     * een adres afkeuren dat prima opengaat. Twee keer vals alarm en je plakt
     * er `--toch` achter, en dan is er geen controle meer.
     */
    if (antwoord.status === 404 || antwoord.status === 410) {
      return { naam, adres, stand: 'dicht', code: antwoord.status }
    }
    return { naam, adres, stand: 'onbekend', waarom: `antwoordde ${antwoord.status}` }
  } catch (fout) {
    return { naam, adres, stand: 'onbekend', waarom: fout.message }
  }
}

if (!uit && !vlag('geen-controle')) {
  console.log('\nDe winkeladressen nakijken…')
  const uitslag = await Promise.all([kijkNa('Apple', doel.apple), kijkNa('Google', doel.google)])
  for (const r of uitslag) {
    if (r.stand === 'open') console.log(`  ${r.naam.padEnd(7)} gaat open`)
    if (r.stand === 'dicht') console.log(`  ${r.naam.padEnd(7)} ${r.code} — bestaat niet`)
    if (r.stand === 'onbekend') console.log(`  ${r.naam.padEnd(7)} niet na te kijken`)
  }

  const dicht = uitslag.filter((r) => r.stand === 'dicht')
  if (dicht.length && !vlag('toch')) {
    console.error('\nEr is niets geschreven.\n')
    for (const r of dicht) {
      console.error(`  ${r.adres}`)
      console.error(`  geeft ${r.code}, dus die winkelpagina is nog niet openbaar.\n`)
    }
    console.error('Bij Play is dat meestal *managed publishing*: een release blijft daar')
    console.error('staan tot je zelf publiceert, en zolang hij onder "Changes in review"')
    console.error('staat is er nog niets om te publiceren. Bij Apple is het *Pending')
    console.error('Developer Release*.')
    console.error('\nEen knop naar een winkelpagina die niet bestaat is erger dan geen knop.')
    console.error('Wacht tot hij opengaat, of zet die ene winkel uit:')
    console.error('\n  npm run live -- --google uit')
    console.error('\nWeet je zeker dat het adres straks klopt, dan kan het met --toch.\n')
    process.exit(1)
  }

  const onbekend = uitslag.filter((r) => r.stand === 'onbekend')
  if (onbekend.length) {
    console.error('\nLet op: deze adressen zijn niet nagekeken, want er kon niet worden')
    console.error('verbonden. Dat zegt niets over of ze opengaan.\n')
    for (const r of onbekend) console.error(`  ${r.naam.padEnd(7)} ${r.waarom}`)
    if (process.stdin.isTTY) {
      const { createInterface } = await import('node:readline/promises')
      const lezer = createInterface({ input: process.stdin, output: process.stdout })
      const door = (await lezer.question('\nToch doorgaan? (j/n): ')).trim().toLowerCase()
      lezer.close()
      if (door !== 'j' && door !== 'ja') {
        console.log('\nEr is niets geschreven.\n')
        process.exit(0)
      }
    } else {
      console.error('\nEr is geen scherm om het te vragen, dus hij gaat door. Kijk de twee')
      console.error('adressen zelf na voordat je iets post.\n')
    }
  }
}

/* --------------------------------------------------------------- schrijven */

const blok = (s) => `export const STORE = {\n  apple: '${s.apple}',\n  google: '${s.google}',\n}`

const bron = await readFile(LINKS, 'utf8')
const oud = bron.match(/export const STORE = \{[^}]*\}/)
if (!oud) {
  console.error(`\nKan het STORE-blok niet vinden in ${path.relative(ROOT, LINKS)}.`)
  console.error('Is het met de hand aangepast? Zet het terug in zijn oude vorm.\n')
  process.exit(1)
}
await writeFile(LINKS, bron.replace(oud[0], blok(doel)), 'utf8')

const regel = (naam, van, naar) =>
  van === naar ? `  ${naam.padEnd(7)} blijft ${naar || 'leeg'}` : `  ${naam.padEnd(7)} ${naar || '— leeg'}`
console.log('\nGeschreven in src/site/links.ts:\n')
console.log(regel('Apple', nu.apple, doel.apple))
console.log(regel('Google', nu.google, doel.google))

/* ---------------------------------------------------------- site opnieuw */

if (vlag('geen-site')) {
  console.log('\nDe site is niet opnieuw gezet (--geen-site).\n')
  process.exit(0)
}

console.log('\nDe site opnieuw zetten…')
try {
  execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'make-site.mjs')], { cwd: ROOT, stdio: 'inherit' })
} catch {
  console.error('\nDe site is niet gezet. Draai `npm run site` en kijk wat hij zegt.\n')
  process.exit(1)
}

const live = Boolean(doel.apple || doel.google)

/**
 * Elke opdracht op zijn eigen regel.
 *
 * Deze regels worden op de dag zelf geplakt, in Windows PowerShell 5.1, en die
 * leest `&&` niet als scheiding: hij zegt dat het geen geldige scheiding is en
 * doet niets. Dat is op elke andere dag een ongemak; op deze dag staat de app
 * al in de winkel en is de website nog niet om.
 */
console.log(`\nDe website staat nu op ${live ? 'live' : 'binnenkort'}. Wat er nog moet:\n`)
console.log('  git add -A')
console.log(`  git commit -m "${live ? 'De app staat in de winkel' : 'De website weer op binnenkort'}"`)
console.log('  git push')
console.log('\nDe productiebranch bouwt en publiceert zichzelf, dus met die push staat')
console.log('darijaforkids.eu binnen een paar minuten goed. Kijk daarna zelf even:\n')
if (live) {
  console.log('  https://darijaforkids.eu — de twee knoppen moeten klikbaar zijn')
  console.log('\nEn dan pas posten. Niet andersom: een bericht met een dode link')
  console.log('komt maar één keer voorbij.\n')
} else {
  console.log('  https://darijaforkids.eu — er hoort weer "binnenkort" te staan')
  console.log('\nStond er een bericht met een winkellink al buiten, haal dat dan ook weg:')
  console.log('een knop die "binnenkort" zegt onder een bericht dat zegt dat hij er is,')
  console.log('is erger dan geen bericht.\n')
}
