/**
 * `npm run wachtrij` — de afleveringenwachtrij, en de motor eronder.
 *
 *   npm run wachtrij                    laat zien wat er staat
 *   npm run wachtrij -- --volgende      produceert de eerste geplande aflevering
 *   npm run wachtrij -- --toevoegen "onderwerp"
 *
 * Dit is het geautomatiseerde deel van het kanaal, en het houdt op waar jouw
 * eigen opdracht zegt dat het ophoudt: onderzoek, script, poorten, stem, beeld
 * en montage gaan vanzelf, publiceren nooit. `--volgende` zet de aflevering op
 * `wacht-op-goedkeuring` en laat hem daar staan. Uploaden blijft een apart
 * commando dat jij geeft, en dat zet de video privé op je kanaal.
 *
 * Bedoeld om wekelijks vanzelf te draaien; zie docs/20 voor de taakplanner.
 */
import { spawn } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { parse } from 'yaml'
import { JsonFileStore } from './store/json-file.js'

/** Per kanaal één wachtrij. --bestand kiest welke. */
const STANDAARD_BESTAND = 'content/wachtrij.yaml'

function bestandUitArgv(argv: string[]): string {
  const i = argv.indexOf('--bestand')
  return (i >= 0 ? argv[i + 1] : undefined) ?? STANDAARD_BESTAND
}

export type Status =
  | 'gepland' | 'in-productie' | 'wacht-op-goedkeuring' | 'gepubliceerd' | 'afgeblazen'

export interface Aflevering {
  nr: number
  onderwerp: string
  status: Status
  productie?: string
  notitie?: string
}

export interface Wachtrij {
  kanaal?: string
  afleveringen: Aflevering[]
}

/** De eerstvolgende die opgepakt mag worden, of niets. */
export function volgende(rij: Wachtrij): Aflevering | undefined {
  return rij.afleveringen.find((a) => a.status === 'gepland')
}

/**
 * Een aflevering die blijft hangen op `in-productie` betekent dat een eerdere
 * draai is afgebroken. Dat mag de wachtrij niet stilzetten, maar het mag ook
 * niet stil gebeuren: de wachtrij noemt hem, en jij beslist.
 */
export function vastgelopen(rij: Wachtrij): Aflevering[] {
  return rij.afleveringen.filter((a) => a.status === 'in-productie')
}

export function telling(rij: Wachtrij): Record<Status, number> {
  const leeg: Record<Status, number> = {
    'gepland': 0, 'in-productie': 0, 'wacht-op-goedkeuring': 0,
    'gepubliceerd': 0, 'afgeblazen': 0,
  }
  for (const a of rij.afleveringen) leeg[a.status] = (leeg[a.status] ?? 0) + 1
  return leeg
}

/**
 * Schrijft één statusregel terug zonder de rest van het bestand aan te raken.
 *
 * Door de YAML te herschrijven zou je commentaar, volgorde en opmaak kwijt
 * zijn, en dat bestand is ook een werkdocument van de maker. Daarom een
 * gerichte vervanging binnen het blok van die aflevering.
 */
export function zetStatus(
  tekst: string, nr: number, status: Status, productie?: string,
): string {
  const regels = tekst.split('\n')
  let start = -1
  for (let i = 0; i < regels.length; i++) {
    if (new RegExp(`^\\s*-\\s+nr:\\s*${nr}\\s*$`).test(regels[i] ?? '')) { start = i; break }
  }
  if (start === -1) throw new Error(`aflevering ${nr} staat niet in de wachtrij`)

  let eind = regels.length
  for (let i = start + 1; i < regels.length; i++) {
    if (/^\s*-\s+nr:\s*\d+\s*$/.test(regels[i] ?? '')) { eind = i; break }
  }

  let statusGezet = false
  let productieGezet = false
  for (let i = start; i < eind; i++) {
    const regel = regels[i] ?? ''
    if (/^\s*status:/.test(regel)) {
      regels[i] = regel.replace(/^(\s*status:\s*).*$/, `$1${status}`)
      statusGezet = true
    }
    if (productie !== undefined && /^\s*productie:/.test(regel)) {
      regels[i] = regel.replace(/^(\s*productie:\s*).*$/, `$1"${productie}"`)
      productieGezet = true
    }
  }
  if (!statusGezet) throw new Error(`aflevering ${nr} heeft geen status-regel`)
  if (productie !== undefined && !productieGezet) {
    throw new Error(`aflevering ${nr} heeft geen productie-regel`)
  }
  return regels.join('\n')
}

/** Waarom er niet geproduceerd mag worden, of niets. */
export function blokkade(env: NodeJS.ProcessEnv): string | undefined {
  if (env['KILL_SWITCH'] === 'true') {
    return 'KILL_SWITCH staat op true. Zet hem uit in .env als je weer wilt draaien.'
  }
  if (env['APPROVAL_MODE'] === 'false') {
    return 'APPROVAL_MODE staat op false. Deze wachtrij weigert te draaien zonder ' +
      'goedkeuringsstap: dat is precies de regel die dit project bij elkaar houdt.'
  }
  return undefined
}

const merk = { gepland: '  ', 'in-productie': '..', 'wacht-op-goedkeuring': '!!',
  gepubliceerd: 'OK', afgeblazen: 'XX' } as const

async function toon(rij: Wachtrij, bestand: string): Promise<void> {
  // De aanwijzing moet het commando zijn dat je echt moet typen, inclusief de
  // wachtrij waar je naar kijkt. Een hint die naar een ander kanaal wijst, is
  // erger dan geen hint.
  const staart = bestand === STANDAARD_BESTAND ? '' : ` --bestand ${bestand}`
  console.log(`\n=============== WACHTRIJ — ${rij.kanaal ?? 'kanaal onbekend'} ===============\n`)
  for (const a of rij.afleveringen) {
    console.log(`  [${merk[a.status]}] ${String(a.nr).padStart(2)}. ${a.onderwerp}`)
    console.log(`         ${a.status}${a.productie ? ` · ${a.productie}` : ''}`)
  }
  const t = telling(rij)
  console.log(`\n  ${t.gepland} gepland · ${t['wacht-op-goedkeuring']} wacht op jou · ` +
    `${t.gepubliceerd} online`)

  const vast = vastgelopen(rij)
  if (vast.length > 0) {
    console.log('\n  Blijven hangen op "in-productie" — een eerdere draai is afgebroken:')
    for (const a of vast) console.log(`    ${a.nr}. ${a.onderwerp}`)
    console.log('  Zet ze terug op "gepland" als je ze opnieuw wilt laten maken.')
  }

  const nu = volgende(rij)
  console.log(nu
    ? `\n  Volgende: ${nu.nr}. ${nu.onderwerp}\n` +
      `  Draai: npm run wachtrij --${staart} --volgende\n`
    : `\n  Niets meer gepland. Voeg toe met:\n` +
      `  npm run wachtrij --${staart} --toevoegen "onderwerp"\n`)
}

/** Draait `npm run produce` en geeft de uitvoer rechtstreeks door. */
function produceer(onderwerp: string): Promise<number> {
  return new Promise((klaar) => {
    const kind = spawn('npm', ['run', 'produce', '--', '--topic', onderwerp], {
      stdio: 'inherit', shell: process.platform === 'win32',
    })
    kind.on('close', (code) => klaar(code ?? 1))
    kind.on('error', () => klaar(1))
  })
}

async function main(): Promise<void> {
  const BESTAND = bestandUitArgv(process.argv)
  const tekst = await readFile(BESTAND, 'utf8')
  const rij = parse(tekst) as Wachtrij

  const toevoegenIndex = process.argv.indexOf('--toevoegen')
  if (toevoegenIndex >= 0) {
    const onderwerp = process.argv[toevoegenIndex + 1]
    if (!onderwerp) {
      console.error('\nGebruik: npm run wachtrij -- --toevoegen "je onderwerp"\n')
      process.exitCode = 1
      return
    }
    const nr = Math.max(0, ...rij.afleveringen.map((a) => a.nr)) + 1
    await writeFile(BESTAND, `${tekst.trimEnd()}\n\n  - nr: ${nr}\n` +
      `    onderwerp: ${JSON.stringify(onderwerp)}\n` +
      `    status: gepland\n    productie: ""\n`)
    console.log(`\nToegevoegd als aflevering ${nr}: ${onderwerp}\n`)
    return
  }

  if (!process.argv.includes('--volgende')) {
    await toon(rij, BESTAND)
    return
  }

  const reden = blokkade(process.env)
  if (reden) {
    console.error(`\nNiet gedraaid. ${reden}\n`)
    process.exitCode = 1
    return
  }

  const nu = volgende(rij)
  if (!nu) {
    console.log('\nNiets gepland. Er valt niets te produceren.\n')
    return
  }

  console.log(`\nAflevering ${nu.nr}: ${nu.onderwerp}\n`)
  await writeFile(BESTAND, zetStatus(tekst, nu.nr, 'in-productie'))

  const code = await produceer(nu.onderwerp)

  if (code !== 0) {
    console.error(`\nProductie is niet afgerond (afsluitcode ${code}).`)
    console.error(`Aflevering ${nu.nr} blijft op "in-productie" staan, zodat je het ziet.`)
    console.error('Zet hem terug op "gepland" om het opnieuw te proberen.\n')
    process.exitCode = code
    return
  }

  // De productie-id staat niet in de uitvoer die we kunnen uitlezen, dus hij
  // komt uit de opslag: de nieuwste die er staat, is degene die net is gemaakt.
  const store = new JsonFileStore(process.env['STORE_PATH'] ?? '.data/producties.json')
  const alle = await store.list().catch(() => [])
  const nieuwste = alle.at(-1)

  const naLezen = await readFile(BESTAND, 'utf8')
  await writeFile(BESTAND, zetStatus(
    naLezen, nu.nr, 'wacht-op-goedkeuring', nieuwste?.id ?? ''))

  console.log(`\nAflevering ${nu.nr} staat op wacht-op-goedkeuring.`)
  console.log('Er is niets gepubliceerd en er gaat niets vanzelf online.')
  console.log('\nWat er nu moet gebeuren:')
  console.log('  1. Je reviewer kijkt de bronnen na.')
  console.log(`  2. npm run approve -- --production ${nieuwste?.id ?? '<id>'} --reviewer "naam"`)
  console.log(`  3. npm run approve -- --production ${nieuwste?.id ?? '<id>'} --mine`)
  console.log(`  4. npm run upload -- --production ${nieuwste?.id ?? '<id>'}   (gaat privé)\n`)
}

main().catch((e: unknown) => { console.error(e); process.exitCode = 1 })
