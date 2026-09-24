/**
 * Zet de winkel klaar.
 *
 * Er zijn drie dingen te koop en niet zevenentwintig: de reeks van Sba, de
 * reeks van De sleutels, en het e-boek. Dat is een keuze en het is de goede.
 * Tien euro voor één prentenboek vraagt van een ouder twaalf keer achter
 * elkaar een afweging; voor vijfendertig euro krijgt hij de hele reeks en is
 * de afweging één keer. Per deel is dat ongeveer drie euro, en dat is meer
 * dan wat er binnenkomt bij twaalf losse beslissingen waarvan er negen niet
 * genomen worden.
 *
 * Elke bundel gaat in zes talen de deur uit. Een gezin dat thuis Frans praat
 * leest hetzelfde boek mee, en dat kost ons niets — de vertalingen staan er
 * al. Vandaar de mappen per taal in de zip, met de titels in die taal erop.
 *
 * Wat deze opdracht doet: de ontbrekende boeken zetten, ze onder een nette
 * naam in `store/winkel/` neerleggen, er drie zips van maken, en ernaast
 * opschrijven wat er bij de betaalpartner moet komen te staan.
 *
 * Waarom een lijst en geen koppeling: de verkoper is een *merchant of record*
 * (zie docs/BETALEN.md). Dat bedrijf is juridisch de verkoper, int de btw in
 * elk land en levert het bestand. Er is geen sleutel waarmee deze repo daar
 * producten kan aanmaken zonder dat er een account met een bankrekening
 * achter zit, en dat account hoort niet in code thuis.
 *
 * Run with:
 *   npm run winkel                # alles
 *   npm run winkel -- --sba       # alleen de prentenboeken
 *   npm run winkel -- --sleutels  # alleen de leesboeken
 *   npm run winkel -- --ebook     # alleen het e-boek
 *   npm run winkel -- --lijst     # alleen producten.md, niets zetten
 *   npm run winkel -- --opnieuw   # ook boeken die er al staan opnieuw zetten
 */
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'
import { schrijfZip } from './lib/zip.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'winkel')
const ALLEEN_LIJST = process.argv.includes('--lijst')
const OPNIEUW = process.argv.includes('--opnieuw')
const KEUZE = ['sba', 'sleutels', 'ebook'].filter((k) => process.argv.includes(`--${k}`))
const doet = (wat) => KEUZE.length === 0 || KEUZE.includes(wat)

const TALEN = [
  { code: 'nl', naam: 'Nederlands' },
  { code: 'fr', naam: 'Frans' },
  { code: 'de', naam: 'Duits' },
  { code: 'es', naam: 'Spaans' },
  { code: 'it', naam: 'Italiaans' },
  { code: 'en', naam: 'Engels' },
]

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [sleutels, sleutelTalen, prenten, prentTalen, { PRIJS, SHOP }, ...delen] = await Promise.all([
  server.ssrLoadModule('/src/content/sleutels.ts'),
  server.ssrLoadModule('/src/content/sleutels-talen.ts'),
  server.ssrLoadModule('/src/content/prentenboek.ts'),
  server.ssrLoadModule('/src/content/prentenboek-talen.ts'),
  server.ssrLoadModule('/src/site/shop.ts'),
  ...Array.from({ length: 15 }, (_, i) => server.ssrLoadModule(`/src/content/sleutels-deel${i + 1}.ts`)),
])
await server.close()

const { REEKS } = sleutels
const { SLEUTEL_VERTALINGEN } = sleutelTalen
const { DELEN: PRENTEN } = prenten
const { deelIn, TALEN_KLAAR } = prentTalen

/** Een taal doet alleen mee als álle delen erin staan; half vertaald is erger dan niet. */
const KLAAR = TALEN.filter((t) => t.code === 'nl' || TALEN_KLAAR.includes(t.code))

/** Wat Windows niet in een bestandsnaam duldt, en wat een koper niet hoeft te zien. */
const netjes = (t) => t.replace(/[\\/:*?"<>|]/g, '').replace(/\s+/g, ' ').trim()
const nr = (n) => String(n).padStart(2, '0')

/**
 * De twee reeksen, elk met waar het boek vandaan komt en hoe het in de zip
 * heet. De Nederlandse sleutel-pdf heet `sleutels-3.pdf` en de Franse
 * `sleutels-3-fr.pdf`; dat verschil zit in de zetter en niet hier.
 */
const BUNDELS = [
  {
    sleutel: 'sbaReeks',
    map: 'sba',
    reeks: 'Sba de Atlasleeuw',
    zip: 'sba-alle-delen.zip',
    prijs: PRIJS.sbaReeks,
    leeftijd: '2 tot 8 jaar',
    script: 'make-prentenboek.mjs',
    delen: PRENTEN.map((d, i) => ({ nummer: i + 1 })),
    bron: (nummer, taal) => path.join(ROOT, 'store', 'prentenboek', `sba-${nummer}-${taal}.pdf`),
    titel: (nummer, taal) => deelIn(taal, nummer).titel,
  },
  {
    sleutel: 'sleutelsReeks',
    map: 'sleutels',
    reeks: 'De sleutels van Marokko',
    zip: 'sleutels-alle-delen.zip',
    prijs: PRIJS.sleutelsReeks,
    leeftijd: 'vanaf 9 jaar',
    script: 'make-sleutels.mjs',
    delen: REEKS.map((d) => ({ nummer: d.nummer })),
    bron: (nummer, taal) =>
      path.join(ROOT, 'store', 'sleutels', taal === 'nl' ? `sleutels-${nummer}.pdf` : `sleutels-${nummer}-${taal}.pdf`),
    titel: (nummer, taal) => SLEUTEL_VERTALINGEN[taal]?.[nummer]?.titel ?? REEKS[nummer - 1].titel,
  },
]

await mkdir(UIT, { recursive: true })

/** Een boek dat er al staat, zetten we niet opnieuw — dat scheelt een kwartier. */
const zetten = (script, nummer, taal, waar) => {
  if (existsSync(waar) && !OPNIEUW) return false
  process.stdout.write(`  ${script.replace('make-', '').replace('.mjs', '')} ${nummer} ${taal} … `)
  execFileSync('node', [path.join(ROOT, 'scripts', script), '--deel', String(nummer), '--taal', taal], { stdio: 'pipe' })
  process.stdout.write('gezet\n')
  return true
}

const LEES_MIJ = (bundel) => [
  `${bundel.reeks}`,
  ''.padEnd(bundel.reeks.length, '='),
  '',
  `Alle ${bundel.delen.length} delen, in ${KLAAR.length} talen. Per taal staat er een map;`,
  'de titels op de bestanden staan in die taal.',
  '',
  'De boeken zijn pdf. Je kunt ze lezen op een telefoon, een tablet of een',
  'computer, en je kunt ze printen. Er zit geen beveiliging op en er is geen',
  'account voor nodig: het zijn jouw bestanden.',
  '',
  'Komt er een verbeterde versie, dan krijg je die gratis — je hoeft niets',
  'opnieuw te kopen.',
  '',
  'Darijaforkids · darijaforkids.eu',
  '',
].join('\n')

const bundelBestanden = async (bundel, bouwen) => {
  const lijst = []
  for (const taal of KLAAR) {
    for (const { nummer } of bundel.delen) {
      const bron = bundel.bron(nummer, taal.code)
      if (bouwen) zetten(bundel.script, nummer, taal.code, bron)
      if (!existsSync(bron)) continue
      lijst.push({
        naam: `${bundel.reeks}/${taal.naam}/${nr(nummer)} - ${netjes(bundel.titel(nummer, taal.code))}.pdf`,
        bron,
      })
    }
  }
  lijst.push({ naam: `${bundel.reeks}/LEES MIJ.txt`, inhoud: LEES_MIJ(bundel) })
  return lijst
}

const EBOOK = {
  sleutel: 'ebook',
  reeks: 'Darijaforkids — het e-boek',
  zip: 'ebook-alle-talen.zip',
  prijs: PRIJS.ebook,
  bestanden: KLAAR.map((t) => ({
    naam: `Darijaforkids - ${t.naam}.pdf`,
    bron: path.join(ROOT, 'public', 'ebook', `darijaforkids-${t.code}.pdf`),
  })).filter((b) => existsSync(b.bron)),
}

/** Hoeveel bladzijden een gezet boek heeft, zonder een pdf-bibliotheek erbij. */
const bladen = async (bestand) => {
  if (!existsSync(bestand)) return null
  const rauw = (await readFile(bestand)).toString('latin1')
  return (rauw.match(/\/Type\s*\/Page[^s]/g) ?? []).length
}

const mb = async (bestand) =>
  existsSync(bestand) ? `${((await stat(bestand)).size / 1024 / 1024).toFixed(0)} MB` : '—'

const gemaakt = []

/**
 * De lijst gaat altijd over alle drie de producten, ook als je er maar één
 * bouwt. Anders overschrijft `npm run winkel -- --ebook` de lijst met alleen
 * het e-boek erin, en zoek je de twee andere blokken terug in je geschiedenis.
 */
for (const bundel of BUNDELS) {
  const bouwen = doet(bundel.map) && !ALLEEN_LIJST
  if (bouwen) console.log(`\n${bundel.reeks} — ${bundel.delen.length} delen × ${KLAAR.length} talen:\n`)
  const bestanden = await bundelBestanden(bundel, bouwen)
  const zip = path.join(UIT, bundel.zip)
  if (bouwen) await schrijfZip(zip, bestanden)
  gemaakt.push({ ...bundel, zip, aantal: bestanden.length - 1 })
}

{
  const zip = path.join(UIT, EBOOK.zip)
  if (doet('ebook') && !ALLEEN_LIJST && EBOOK.bestanden.length) await schrijfZip(zip, EBOOK.bestanden)
  gemaakt.push({ ...EBOOK, zip, aantal: EBOOK.bestanden.length })
}

/* ------------------------------------------------------------ de lijst zelf */

const hoofdstukken = REEKS.reduce((n, d, i) => n + (delen[i][`DEEL${d.nummer}_HOOFDSTUKKEN`]?.length ?? 0), 0)
const woorden = REEKS.reduce((n, d, i) => n + (delen[i][`DEEL${d.nummer}_HOOFDSTUKKEN`] ?? [])
  .reduce((m, h) => m + h.tekst.reduce((k, p) => k + p.split(/\s+/).filter(Boolean).length, 0), 0), 0)
const getal = (n) => n.toLocaleString('nl-NL')
const talenrij = KLAAR.map((t) => t.naam).join(', ').replace(/, ([^,]*)$/, ' en $1')
/** "zes talen" leest als een zin; "6 talen" leest als een factuur. */
const WOORD = ['nul', 'één', 'twee', 'drie', 'vier', 'vijf', 'zes']
const hoeveelTalen = WOORD[KLAAR.length] ?? String(KLAAR.length)

const TEKST = {
  sbaReeks: [
    'Sba de Atlasleeuw — alle twaalf delen',
    '',
    'Een Atlasleeuw neemt je mee door Marokko: door de poorten van Fes, de souq,',
    'de bergen en de zee. Elke bladzijde is Nederlands met één woord Darija erin,',
    'en de ontdekking van dat woord is het verhaal. Hoe je het zegt staat erbij,',
    'in gewone letters, dus je kunt het voorlezen zonder de taal te kennen.',
    '',
    `Twaalf boeken van dertig bladzijden, samen ${PRENTEN.length * 12} woorden Darija.`,
    '',
    `In ${hoeveelTalen} talen: ${talenrij}.`,
    `Je krijgt ze alle ${hoeveelTalen} in één keer — een gezin dat thuis Frans praat`,
    'leest hetzelfde boek mee.',
    '',
    'Voor 2 tot 8 jaar. Pdf, om te lezen op een scherm of om te printen.',
    'Geen beveiliging, geen account. Verbeterde versies zijn gratis.',
  ],
  sleutelsReeks: [
    'De sleutels van Marokko — alle vijftien delen',
    '',
    'Vijftien leesboeken, tweeduizend jaar, één sleutel die van hand tot hand',
    'gaat: van het Romeinse Walili rond het jaar 200 tot een flat in Utrecht.',
    'Elk deel wordt verteld door een kind van rond de elf dat er zelf bij is —',
    'bij de oversteek van Tariq, bij de bouw van de al-Qarawiyyin, op de reis',
    'van Ibn Battuta.',
    '',
    'Achterin elk boek staat "Wat hiervan is echt gebeurd": wat waar is en wat',
    'verzonnen, met zoveel woorden. Dat is niet de bijlage maar het beste deel.',
    '',
    `Vijftien boeken, ${hoofdstukken} hoofdstukken, ${getal(woorden)} woorden.`,
    '',
    `In ${hoeveelTalen} talen: ${talenrij}. Je krijgt ze alle ${hoeveelTalen}.`,
    '',
    'Vanaf 9 jaar. Pdf, om te lezen op een scherm of om te printen.',
    'Geen beveiliging, geen account. Verbeterde versies zijn gratis.',
  ],
  ebook: [
    'Darijaforkids — het e-boek',
    '',
    'De hele cursus op papier: alle woorden, alle zinnen, het Arabische alfabet',
    'en de grammatica die je nodig hebt, geordend zoals de app ze leert.',
    '',
    '17 units, 304 woorden, 100 zinnen, 28 letters.',
    '',
    `In ${hoeveelTalen} talen: ${talenrij}.`,
    '',
    'Pdf. Zit gratis bij het jaarabonnement in de app; los te koop voor wie per',
    'maand betaalt of alleen het boek wil.',
  ],
}

const regels = ['# De winkel inrichten', '',
  'Deze lijst is gemaakt door `npm run winkel`. Maak elk product aan in het',
  'systeem van je betaalpartner (zie `docs/WINKEL-INRICHTEN.md`) en zet de link',
  'die je terugkrijgt in `src/site/shop.ts`.', '',
  'De bestanden staan in `store/winkel/`. Die map staat niet in git — het is',
  'bouwresultaat, en `npm run winkel` maakt hem zo weer.', '',
  'Drie producten, meer niet. Begin met één, koop hem zelf, en maak de andere',
  'twee pas aan als dat goed ging.', '']

for (const p of gemaakt) {
  const grootte = await mb(p.zip)
  regels.push(
    `## ${p.reeks}`, '',
    '| | |', '| --- | --- |',
    `| **Titel in de winkel** | ${p.reeks} |`,
    `| **Prijs** | ${p.prijs} |`,
    `| **Bestand** | \`store/winkel/${path.basename(p.zip)}\` — ${p.aantal} pdf's, ${grootte} |`,
    `| **Sleutel in shop.ts** | \`${p.sleutel}\` |`,
    `| **Link** | ${SHOP[p.sleutel]?.link || '_nog leeg_'} |`, '',
    '**Tekst op de productpagina:**', '',
    '```', ...TEKST[p.sleutel], '```', '')
}

regels.push('## Daarna', '',
  'Zet de links in `src/site/shop.ts` — bovenin staat één blok `LINKS` waar je',
  'ze in plakt. Daarna:', '',
  '```bash', 'npm run site',
  'git add -A && git commit -m "De winkel gaat open" && git push', '```', '',
  'Een product zonder link toont "Binnenkort" en geen dode knop, dus je kunt',
  'dit per stuk doen en tussendoor uitrollen.', '',
  '## Let op', '',
  '- **De prijs staat op twee plekken.** In `src/site/shop.ts` staat wat de',
  '  bezoeker leest, in de winkel staat wat hij betaalt. Wijzig je er één,',
  '  wijzig dan de ander. Wie op een knop van € 34,99 drukt en € 39,95 ziet,',
  '  komt niet terug.',
  '- **Kijk of iDEAL aanstaat** bij je betaalpartner. Voor Nederlandse ouders',
  '  is dat het verschil tussen kopen en afhaken.',
  '- **Zeg erbij dat verbeterde versies gratis zijn.** Dat staat in de tekst',
  '  hierboven en in de LEES MIJ in elke zip, en het moet waar blijven.', '')

await writeFile(path.join(UIT, 'producten.md'), regels.join('\n'))

const open = Object.entries(SHOP).filter(([, v]) => v.link).length
console.log(`\n${gemaakt.length} producten → ${path.relative(ROOT, path.join(UIT, 'producten.md'))}`)
for (const p of gemaakt) console.log(`  ${path.basename(p.zip).padEnd(24)} ${String(p.aantal).padStart(3)} pdf's  ${await mb(p.zip)}`)
console.log(`\n${open} van de ${Object.keys(SHOP).length} hebben al een betaallink\n`)
