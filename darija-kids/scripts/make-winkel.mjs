/**
 * Zet alle boeken klaar om te verkopen.
 *
 * Eén opdracht die de twee reeksen rendert, de bestanden onder een nette naam
 * in `store/winkel/` neerzet, en ernaast opschrijft wat er per product in het
 * systeem van de betaalpartner moet komen te staan: titel, prijs, bestand en
 * de tekst op de productpagina.
 *
 * Waarom een lijst en geen koppeling: de verkoper is een *merchant of record*
 * (zie docs/BETALEN.md). Dat bedrijf is juridisch de verkoper, int de btw in
 * elk land en levert het bestand. Er is geen sleutel waarmee deze repo daar
 * producten kan aanmaken zonder dat er een account met een bankrekening
 * achter zit, en dat account hoort niet in code thuis. Dus: een lijst om af te
 * werken, één keer, en daarna hoeft alleen `src/site/shop.ts` nog gevuld.
 *
 * Run with:
 *   npm run winkel            # alles
 *   npm run winkel -- --sba   # alleen de prentenboeken
 *   npm run winkel -- --lijst # alleen de lijst, niets renderen
 */
import { execFileSync } from 'node:child_process'
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer } from 'vite'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const UIT = path.join(ROOT, 'store', 'winkel')
const ALLEEN_LIJST = process.argv.includes('--lijst')
const ALLEEN_SBA = process.argv.includes('--sba')
const ALLEEN_SLEUTELS = process.argv.includes('--sleutels')

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  root: ROOT, server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error',
})
const [{ REEKS }, { DELEN: PRENTEN }, { SHOP, PRIJS }] = await Promise.all([
  server.ssrLoadModule('/src/content/sleutels.ts'),
  server.ssrLoadModule('/src/content/prentenboek.ts'),
  server.ssrLoadModule('/src/site/shop.ts'),
])
await server.close()

const draai = (script, nummer) => {
  process.stdout.write(`  ${path.basename(script)} --deel ${nummer} … `)
  execFileSync('node', [path.join(ROOT, 'scripts', script), '--deel', String(nummer)], { stdio: 'pipe' })
  process.stdout.write('klaar\n')
}

await mkdir(UIT, { recursive: true })

/** Wat er te koop is, in de volgorde waarin je het in de winkel aanmaakt. */
const PRODUCTEN = [
  ...(ALLEEN_SLEUTELS ? [] : PRENTEN.map((deel, i) => ({
    id: `sba${i + 1}`,
    reeks: 'Sba de Atlasleeuw',
    nummer: i + 1,
    titel: deel.titel,
    onder: deel.ondertitel,
    prijs: PRIJS.sbaDeel,
    bron: path.join(ROOT, 'store', 'prentenboek', `sba-${i + 1}-nl.pdf`),
    bestand: `sba-deel-${String(i + 1).padStart(2, '0')}.pdf`,
    script: 'make-prentenboek.mjs',
    leeftijd: '2 – 8 jaar',
  }))),
  ...(ALLEEN_SBA ? [] : REEKS.map((deel) => ({
    id: `sleutels${deel.nummer}`,
    reeks: 'De sleutels van Marokko',
    nummer: deel.nummer,
    titel: deel.titel,
    onder: `${deel.jaar} · ${deel.waar}`,
    flap: deel.flap,
    prijs: PRIJS.sleutelsDeel,
    bron: path.join(ROOT, 'store', 'sleutels', `sleutels-${deel.nummer}.pdf`),
    bestand: `sleutels-deel-${String(deel.nummer).padStart(2, '0')}.pdf`,
    script: 'make-sleutels.mjs',
    leeftijd: 'vanaf 9 jaar',
  }))),
]

if (!ALLEEN_LIJST) {
  console.log(`\n${PRODUCTEN.length} boeken zetten:\n`)
  for (const p of PRODUCTEN) {
    draai(p.script, p.nummer)
    await copyFile(p.bron, path.join(UIT, p.bestand))
  }
}

/** Hoeveel bladzijden een gezet boek heeft, zonder een pdf-bibliotheek. */
const bladen = async (bestand) => {
  const pad = path.join(UIT, bestand)
  if (!existsSync(pad)) return null
  const rauw = (await readFile(pad)).toString('latin1')
  return (rauw.match(/\/Type\s*\/Page[^s]/g) ?? []).length
}

const regels = ['# De winkel inrichten', '',
  'Deze lijst is gemaakt door `npm run winkel`. Werk hem van boven naar beneden',
  'af in het systeem van je betaalpartner (zie `docs/WINKEL-INRICHTEN.md`), en',
  'zet elke link die je terugkrijgt in `src/site/shop.ts`.', '',
  'De bestanden staan in `store/winkel/`. Die map staat niet in git — het is',
  'bouwresultaat, en `npm run winkel` maakt hem zo weer.', '',
  '## De losse delen', '']

for (const p of PRODUCTEN) {
  const n = await bladen(p.bestand)
  regels.push(
    `### ${p.reeks} — deel ${p.nummer}`, '',
    `| | |`, `| --- | --- |`,
    `| **Titel in de winkel** | ${p.reeks} ${p.nummer}: ${p.titel} |`,
    `| **Prijs** | ${p.prijs} |`,
    `| **Bestand** | \`store/winkel/${p.bestand}\`${n ? ` (${n} bladzijden)` : ''} |`,
    `| **Sleutel in shop.ts** | \`${p.id}\` |`, '',
    '**Tekst op de productpagina:**', '',
    '```',
    `${p.titel}`,
    `${p.onder}`,
    '',
    p.flap ?? 'Een voorleesboek met twaalf woorden Darija. Elke bladzijde is Nederlands, met één woord Darija erin — en de ontdekking van dat woord is het verhaal. Hoe je het zegt staat erbij, in gewone letters.',
    '',
    `Voor ${p.leeftijd}. PDF, direct te downloaden en te printen.`,
    '```', '')
}

regels.push('## De twee bundels', '',
  `| | Sba, alle twaalf | De sleutels, alle vijftien |`,
  `| --- | --- | --- |`,
  `| **Prijs** | ${PRIJS.sbaReeks} | ${PRIJS.sleutelsReeks} |`,
  `| **Bestand** | alle \`sba-deel-*.pdf\` | alle \`sleutels-deel-*.pdf\` |`,
  `| **Sleutel in shop.ts** | \`sbaReeks\` | \`sleutelsReeks\` |`, '',
  'De meeste betaalpartners laten je meerdere bestanden aan één product hangen.',
  'Kan dat niet, maak er dan een zip van:', '',
  '```bash',
  'cd store/winkel && zip sba-alle-delen.zip sba-deel-*.pdf',
  'cd store/winkel && zip sleutels-alle-delen.zip sleutels-deel-*.pdf',
  '```', '',
  '## Daarna', '',
  'Zet de links in `src/site/shop.ts` — bovenin staat één blok `LINKS` waar je',
  'ze in plakt. Daarna:', '',
  '```bash',
  'npm run site',
  'git add -A && git commit -m "De winkel gaat open" && git push',
  '```', '',
  'Een deel zonder link toont "Binnenkort" en geen dode knop, dus je kunt dit',
  'per stuk doen en tussendoor uitrollen.', '')

await writeFile(path.join(UIT, 'producten.md'), regels.join('\n'))

const open = Object.entries(SHOP).filter(([, v]) => v.link).length
console.log(`\n${PRODUCTEN.length} producten → ${path.relative(ROOT, path.join(UIT, 'producten.md'))}`)
console.log(`${open} van de ${Object.keys(SHOP).length} hebben al een betaallink\n`)
