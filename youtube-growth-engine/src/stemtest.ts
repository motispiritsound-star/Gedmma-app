/**
 * `npm run stemtest -- --script content/nl-001/01-script.md`
 *
 * Zet een stemtest klaar die eerlijk is.
 *
 * Elke aanbieder heeft een demotekst die is uitgekozen om goed te klinken.
 * Daarmee klinkt alles goed. Dit pakt jouw eigen script, zoekt het stuk met de
 * meeste struikelwoorden erin, en zet dat klaar om te plakken — plus waar je
 * per woord op moet letten en een scoreblad dat je invult terwijl je luistert.
 *
 * Dit synthetiseert zelf niets. Dat is geen tekortkoming maar de opzet: je
 * moet drie stemmen náást elkaar horen op dezelfde tekst, en dat gaat sneller
 * in hun eigen demo dan via drie sleutels die je nog niet hebt.
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { kiesTestpassage, type Struikelwoord } from './studio/uitspraak.js'

const OUT = 'out/stemtest'

interface Kandidaat {
  naam: string
  aanbieder: string
  stem: string
  demo: string
  kosten: string
  waarom: string
}

/**
 * Drie kandidaten, en niet meer. Bij vijf ga je vergelijken in plaats van
 * kiezen, en dan wint de stem die je het laatst hoorde.
 */
const KANDIDATEN: Kandidaat[] = [
  {
    naam: 'Google Chirp 3: HD — Nederlands',
    aanbieder: 'Google Cloud Text-to-Speech',
    stem: 'nl-NL, Chirp 3: HD',
    demo: 'https://cloud.google.com/text-to-speech',
    kosten: 'gratis tot 1 miljoen tekens per maand; daarna ongeveer $30 per miljoen',
    waarom: 'Jouw volume is ongeveer 26.000 tekens per maand. Dat past ruim veertig ' +
      'keer in de gratis laag, dus dit kost je niets. Nieuwste generatie.',
  },
  {
    naam: 'Azure — Maarten (of Fenna)',
    aanbieder: 'Microsoft Azure Speech',
    stem: 'nl-NL-MaartenNeural / nl-NL-FennaNeural / nl-NL-ColetteNeural',
    demo: 'https://speech.microsoft.com/portal/voicegallery',
    kosten: 'gratis tot 500.000 tekens per maand; daarna ongeveer $16 per miljoen',
    waarom: 'Native Nederlandse stemmen, getraind op Nederlands in plaats van ' +
      'meertalig met Nederlands erbij. Ook gratis op jouw volume.',
  },
  {
    naam: 'ElevenLabs — meertalig',
    aanbieder: 'ElevenLabs',
    stem: 'Multilingual v2 (rustiger) of v3 (expressiever)',
    demo: 'https://elevenlabs.io/text-to-speech/dutch',
    kosten: 'ongeveer $22 per maand voor het Creator-abonnement',
    waarom: 'Wordt in vergelijkingen consequent het beste genoemd voor Nederlands. ' +
      'Maar het is een vast bedrag per maand terwijl de andere twee op jouw ' +
      'volume nul kosten — dat is een vijfde van je budget.',
  },
]

const LUISTERPUNTEN = [
  ['Struikelwoorden', 'Zeg ze hardop mee. Klinkt er één anders dan jij hem zou zeggen, dan is dat geen detail: het komt in elke video terug.'],
  ['Klemtoon in samenstellingen', 'Nederlands legt de klemtoon op het eerste deel. Hoor je "polderGEMAAL" in plaats van "POLDERgemaal", dan hakt de stem het woord doormidden.'],
  ['Zinseinde', 'Gaat de toon omhoog aan het eind van een mededeling? Dan klinkt alles als een vraag en verlies je gezag.'],
  ['Volhouden', 'Luister de hele passage uit, niet de eerste tien seconden. Veel stemmen zakken na dertig seconden in en gaan dreunen.'],
  ['Adem en tempo', 'Hoor je pauzes op de plek van een punt? Een stem die doordendert, maakt jouw script sneller onbegrijpelijk dan een stem die vlak klinkt.'],
]

function arg(naam: string): string | undefined {
  const i = process.argv.indexOf(`--${naam}`)
  return i >= 0 ? process.argv[i + 1] : undefined
}

/** Haalt de gesproken regels uit een script: alles wat met `>` begint. */
function gesprokenTekst(markdown: string): string {
  return markdown.split('\n')
    .filter((r) => r.startsWith('> ') && !r.startsWith('> *['))
    .map((r) => r.slice(2).trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
}

function groepeer(woorden: Struikelwoord[]): Map<string, Struikelwoord[]> {
  const uit = new Map<string, Struikelwoord[]>()
  for (const w of woorden) {
    const lijst = uit.get(w.reden) ?? []
    lijst.push(w)
    uit.set(w.reden, lijst)
  }
  return uit
}

async function main(): Promise<void> {
  const pad = arg('script') ?? 'content/nl-001/01-script.md'
  const markdown = await readFile(pad, 'utf8').catch(() => '')
  if (!markdown) {
    console.error(`\n${pad} kon ik niet lezen.\n`)
    process.exitCode = 1
    return
  }

  const tekst = gesprokenTekst(markdown)
  const passage = kiesTestpassage(tekst, Number(arg('woorden') ?? 90))

  await mkdir(OUT, { recursive: true })
  await writeFile(join(OUT, 'passage.txt'), `${passage.tekst}\n`, 'utf8')

  console.log('\n================== STEMTEST ==================\n')
  console.log(`Script:   ${pad}`)
  console.log(`Passage:  ${passage.woorden} woorden, ` +
    `${passage.struikelwoorden.length} struikelwoorden ` +
    `(${passage.dichtheid.toFixed(1)} per 100 woorden)`)
  console.log(`\nStaat klaar om te plakken in: ${join(OUT, 'passage.txt')}\n`)
  console.log('─'.repeat(62))
  console.log(passage.tekst)
  console.log('─'.repeat(62))

  if (passage.struikelwoorden.length > 0) {
    console.log('\nLet hier op:\n')
    for (const [reden, lijst] of groepeer(passage.struikelwoorden)) {
      console.log(`  ${reden}: ${lijst.map((w) => w.woord).join(', ')}`)
      console.log(`    ${lijst[0]?.uitleg ?? ''}`)
    }
  }

  console.log('\nDrie kandidaten:\n')
  for (const [i, k] of KANDIDATEN.entries()) {
    console.log(`  ${i + 1}. ${k.naam}`)
    console.log(`     stem:    ${k.stem}`)
    console.log(`     kosten:  ${k.kosten}`)
    console.log(`     demo:    ${k.demo}`)
    console.log(`     ${k.waarom}\n`)
  }

  const blad = [
    '# Scoreblad stemtest',
    '',
    `Passage uit \`${pad}\`, ${passage.woorden} woorden.`,
    '',
    'Vul in terwijl je luistert, niet achteraf. Geef per punt 1 tot 5.',
    '',
    `| Waarop | ${KANDIDATEN.map((k) => k.naam).join(' | ')} |`,
    `|---|${KANDIDATEN.map(() => '---').join('|')}|`,
    ...LUISTERPUNTEN.map(([wat]) => `| ${wat} | ${KANDIDATEN.map(() => ' ').join(' | ')} |`),
    `| **Totaal** | ${KANDIDATEN.map(() => ' ').join(' | ')} |`,
    '',
    '## Waar je op let',
    '',
    ...LUISTERPUNTEN.map(([wat, hoe]) => `**${wat}.** ${hoe}\n`),
    '## De struikelwoorden in deze passage',
    '',
    ...(passage.struikelwoorden.length === 0
      ? ['Geen. Kies een andere passage of een ander script — dit zegt niets.']
      : passage.struikelwoorden.map((w) => `- **${w.woord}** (${w.reden}) — ${w.uitleg}`)),
    '',
    '## De laatste test, en de enige die telt',
    '',
    'Laat de winnaar horen aan iemand die niet weet dat het een computer is.',
    'Vraag: wat vond je van die verteller?',
    '',
    'Zegt diegene iets over de **inhoud**, dan is de stem goed.',
    'Zegt diegene iets over de **stem**, dan niet.',
    '',
    '## Als je gekozen hebt',
    '',
    'Zet in `.env`:',
    '',
    '```',
    'TTS_API_KEY=...',
    'TTS_VOICE_ID=...',
    '```',
    '',
  ].join('\n')

  await writeFile(join(OUT, 'scoreblad.md'), blad, 'utf8')
  console.log(`Scoreblad: ${join(OUT, 'scoreblad.md')}`)
  console.log('\nPlak dezelfde passage in alle drie de demo\'s. Niet hun eigen tekst:')
  console.log('die is uitgekozen om goed te klinken.\n')
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1 })
