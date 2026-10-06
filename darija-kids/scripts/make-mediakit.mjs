/**
 * Pakt al het beeld in één zip, geordend zoals je het in een videobewerker
 * nodig hebt.
 *
 * De bestanden staan verspreid over `brand/` en `store/`, in mappen die
 * ingedeeld zijn naar hoe ze gemaakt worden en niet naar hoe ze gebruikt
 * worden: logo's bij logo's, schermafdrukken per toestelmaat, campagneplaten
 * per taal. Dat klopt voor de winkels en het klopt niet voor iemand die een
 * filmpje zit te maken en gewoon alles bij elkaar wil hebben.
 *
 * Dus pakt dit één taal bij elkaar, in mappen met een naam die zegt wat erin
 * zit, met een LEES MIJ ernaast die vertelt welke maat waarvoor is.
 *
 * Alleen beeld. De introfilms zitten er niet in: die zijn samen groter dan al
 * het beeld bij elkaar, en wie ze nodig heeft weet waar ze staan. Dat staat in
 * de LEES MIJ.
 *
 * Draaien:
 *   npm run mediakit                 — de tien winkelplaten en het logo
 *   npm run mediakit -- --ruim       — ook boeken, citaten en campagneplaten
 *   npm run mediakit -- --taal fr    — een andere taal
 *   npm run mediakit -- --alles      — alle zes de talen
 */
import { existsSync, readdirSync, statSync } from 'node:fs'
import { mkdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { schrijfZip } from './lib/zip.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'mediakit')
const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en']

const arg = (naam, terugval) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : terugval
}

/** Elk bestand onder een map, zonder submappen van andere talen. */
const beeld = (map, { diep = false } = {}) => {
  if (!existsSync(map)) return []
  const uit = []
  for (const naam of readdirSync(map)) {
    const pad = path.join(map, naam)
    if (statSync(pad).isDirectory()) {
      if (diep) uit.push(...beeld(pad, { diep }))
      continue
    }
    if (/\.(png|svg|jpe?g)$/i.test(naam)) uit.push(pad)
  }
  return uit
}

const LEES_MIJ = (taal) => [
  `Darijaforkids — beeldmateriaal (${taal})`,
  ''.padEnd(34, '='),
  '',
  'Alles hierin komt uit de app, de boeken en het merk zelf. Geen van deze',
  'bestanden is gegenereerd beeld.',
  '',
  'WAT WAAR VOOR IS',
  '',
  '  logo/           Het logo in alle varianten, als png en als svg.',
  '                  Gebruik de svg als je bewerker hem aankan: die blijft',
  '                  scherp op elk formaat. Laat een beeldgenerator het logo',
  '                  nooit natekenen — bijna goed is erger dan niet.',
  '',
  '  app-schermen/   De tien platen die ook in de App Store en bij Google',
  '                  Play staan: de app in bedrijf, 1284x2778, met de kop er',
  '                  al op. Geen mock-ups — het is de draaiende app.',
  '                  1-pad tot en met 10-aanbod.',
  '',
  '  winkel/         De bredere platen uit de winkels: de feature graphic',
  '                  voor Google Play en de vierkante en staande versies.',
  '',
  'MEER NODIG?',
  '',
  '  npm run mediakit -- --ruim',
  '',
  '  Daar zitten ook de vijf campagneplaten met de kop erop, de omslagen',
  '  van de boeken, negen citaatplaten en de figuren uit de',
  '  geschiedenisfilmpjes bij.',
  '',
  'WAT ER NIET IN ZIT',
  '',
  '  De introfilms. Die zijn samen groter dan al dit beeld bij elkaar en',
  '  staan in store/video/<taal>/ — intro-verhaal.mp4 (9:16),',
  '  intro-vierkant.mp4 (1:1) en intro-breed.mp4 (16:9).',
  '',
  '  De 432 opnames. Die staan in src/audio/ — letters, woorden en zinnen,',
  '  met de Latijnse schrijfwijze als bestandsnaam.',
  '',
  'Darijaforkids · darijaforkids.eu',
  '',
].join('\n')

/**
 * Klein, tenzij je erom vraagt.
 *
 * De eerste versie pakte alles in: vijfenzeventig afbeeldingen, vijfendertig
 * megabyte. Dat is een archief en geen pakket — wie een filmpje maakt opent
 * dat, ziet zes mappen, en is verder van huis dan daarvoor.
 *
 * Wat je werkelijk nodig hebt zijn de tien platen die ook in de App Store en
 * bij Google Play staan: de app in bedrijf, met de kop er al op. Die zijn
 * gemaakt om in vier seconden duidelijk te maken wat de app doet, en dat is
 * precies wat een advertentie ook moet.
 *
 * De rest zit achter `--ruim`, voor wie er echt naar op zoek is.
 */
const RUIM = process.argv.includes('--ruim')

const pakIn = async (taal) => {
  const mappen = [
    ['logo', beeld(path.join(ROOT, 'brand', 'logo'))],
    ['app-schermen', beeld(path.join(ROOT, 'store', 'screenshots', taal, 'iphone-65'))],
    ['winkel', beeld(path.join(ROOT, 'store', 'marketing', taal))],
    ...(RUIM ? [
      ['platen-met-tekst', beeld(path.join(ROOT, 'brand', 'social', 'posts', taal))],
      ['boeken', beeld(path.join(ROOT, 'brand', 'reeksplaten', taal)).concat(beeld(path.join(ROOT, 'brand', 'reeksplaten')))],
      ['citaten', beeld(path.join(ROOT, 'brand', 'citaten', taal))],
      ['geschiedenis', beeld(path.join(ROOT, 'brand', 'helden', taal)).concat(beeld(path.join(ROOT, 'brand', 'helden')))],
    ] : []),
  ]

  const bestanden = [{ naam: 'LEES MIJ.txt', inhoud: LEES_MIJ(taal) }]
  for (const [map, lijst] of mappen) {
    for (const bron of lijst) bestanden.push({ naam: `${map}/${path.basename(bron)}`, bron })
  }

  const zip = path.join(UIT, `darijaforkids-beeld-${taal}${RUIM ? '-ruim' : ''}.zip`)
  await schrijfZip(zip, bestanden)
  const mb = ((await stat(zip)).size / 1024 / 1024).toFixed(0)
  console.log(`  ${path.relative(ROOT, zip).padEnd(44)} ${String(bestanden.length - 1).padStart(3)} afbeeldingen  ${mb} MB`)
  for (const [map, lijst] of mappen) {
    if (!lijst.length) console.log(`    let op: ${map} is leeg — draai de opdracht die hem maakt`)
  }
}

await mkdir(UIT, { recursive: true })
console.log('')
for (const taal of process.argv.includes('--alles') ? TALEN : [arg('taal', 'nl')]) await pakIn(taal)
console.log('')
