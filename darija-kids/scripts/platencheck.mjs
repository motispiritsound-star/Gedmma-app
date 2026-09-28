/**
 * Staan de prentenboeken écht in de bak?
 *
 * `npm run boeken -- --platen` meldt per deel "staat er al, overgeslagen". Dat
 * komt uit `store/bladen/gedaan.json`, een notitiebestand op je eigen schijf.
 * Het zegt dus: *mijn aantekeningen zeggen dat ik dit al heb gedaan*. Het zegt
 * niet dat de bladzijden in R2 staan.
 *
 * Meestal is dat hetzelfde. Maar niet als een upload halverwege omviel, als de
 * bak opnieuw is aangemaakt, of als de aantekeningen van een andere machine
 * komen. En de prijs van dat verschil is hoog: dan koopt iemand Sba, logt in,
 * en ziet "nog niet" waar een prentenboek hoort te staan.
 *
 * Dus vraagt dit het aan R2 zelf. Wrangler kan een bak niet opsommen — alleen
 * `get`, `put` en `delete` — dus het gaat met gerichte vragen.
 *
 *   npm run platencheck            — een steekproef, een halve minuut
 *   npm run platencheck -- --alles — elk deel in elke taal, een paar minuten
 */
import { execFileSync } from 'node:child_process'
import path from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const SERVER = path.join(ROOT, 'server')
const BIN = path.join(SERVER, 'node_modules', 'wrangler', 'bin', 'wrangler.js')
const BAK = 'darijaforkids-boeken'
const ALLES = process.argv.includes('--alles')

const TALEN = ['nl', 'fr', 'de', 'es', 'it', 'en']
const DELEN = Array.from({ length: 12 }, (_, i) => i + 1)

/**
 * Eerst: weet wrangler wie je bent?
 *
 * Dit staat er omdat het mis ging. Zonder inlog antwoordde `r2 object get`
 * doodleuk "The specified key does not exist" — geen foutmelding over
 * inloggen, gewoon "bestaat niet". Wie dat gelooft, concludeert dat de hele
 * bak leeg is en dat geen enkele koper zijn boek krijgt.
 *
 * Een controle die "weg" zegt als hij "ik kon het niet vragen" bedoelt, is
 * erger dan geen controle: hij maakt je aan het werk aan iets dat niet stuk
 * is, en de volgende keer geloof je hem niet meer.
 *
 * `d1 execute --remote` is hier de scherpste toets: die weigert hardop.
 */
const ingelogd = () => {
  try {
    execFileSync(process.execPath,
      [BIN, 'd1', 'execute', 'darijaforkids', '--remote', '--yes', '--command', 'SELECT 1'],
      { cwd: SERVER, stdio: 'pipe' })
    return true
  } catch (fout) {
    const tekst = String(fout.stderr ?? '') + String(fout.stdout ?? '') + String(fout.message ?? '')
    // Alleen een inlogprobleem telt hier. Een database die even niet antwoordt
    // is iets anders, en dan mag de controle gewoon doorgaan.
    return !/CLOUDFLARE_API_TOKEN|not logged in|authenticat|Unauthorized/i.test(tekst)
  }
}

/**
 * Eén sleutel opvragen.
 *
 * `get` schrijft naar een bestand, dus het gaat naar de prullenmap van het
 * stelsel — we willen alleen weten of hij er is.
 */
const bestaat = (sleutel) => {
  const heen = path.join(tmpdir(), '.platencheck')
  try {
    execFileSync(process.execPath, [BIN, 'r2', 'object', 'get', `${BAK}/${sleutel}`, '--file', heen],
      { cwd: SERVER, stdio: 'pipe' })
    return true
  } catch {
    return false
  }
}

/* Welke sleutels we nakijken. Zonder `--alles` een steekproef die de randen
 * raakt: het eerste deel, het laatste, en een taal die niet het Nederlands is.
 * Staat dat er alle drie, dan is de kans klein dat er iets tussenuit valt. */
const paren = ALLES
  ? DELEN.flatMap((d) => TALEN.map((t) => [d, t]))
  : [[1, 'nl'], [1, 'en'], [6, 'fr'], [12, 'nl'], [12, 'it']]

if (!ingelogd()) {
  console.error('\nWrangler weet niet wie je bent, dus hij kan de bak niet lezen.')
  console.error('Zonder inlog antwoordt R2 "bestaat niet" op alles, en dan zou deze')
  console.error('controle melden dat al je boeken weg zijn terwijl er niets aan de hand is.\n')
  console.error('Log één keer in:\n')
  console.error('  npm run inloggen\n')
  process.exit(1)
}

console.log(`\nIk vraag het aan de bak zelf, niet aan store/bladen/gedaan.json.`)
console.log(`${paren.length} ${paren.length === 1 ? 'deel' : 'delen'} nakijken${ALLES ? '' : ' (steekproef)'} ...\n`)

/* De andere reeks hoort er ook bij. Zonder die controle weet je wel dat de
 * prenten ontbreken, maar niet of de leesboeken er zijn — en dan draai je een
 * uur aan platen terwijl er nog iets anders stuk is. */
console.log('  De sleutels van Marokko (tekstboeken)')
let tekstMist = 0
for (const [deel, taal] of [[1, 'nl'], [8, 'fr'], [15, 'nl']]) {
  const er = bestaat(`sleutels/${deel}/${taal}/boek.json`)
  if (!er) tekstMist += 1
  console.log(`    ${taal}  deel ${String(deel).padStart(2)}  ${er ? 'staat er' : 'ONTBREEKT'}`)
}

console.log('\n  Sba de Atlasleeuw (prentenboeken)')
let mist = 0
for (const [deel, taal] of paren) {
  const boek = bestaat(`sba/${deel}/${taal}/boek.json`)
  // Bladzijde 1 is de eerste plaat. Staat de tekst er wel en de plaat niet,
  // dan is de upload halverwege gestopt — en dat is het ergste geval, want
  // dan lijkt het boek te bestaan.
  const plaat = boek ? bestaat(`sba/${deel}/${taal}/1.webp`) : false

  const staat = boek && plaat ? 'compleet'
    : boek ? 'TEKST WEL, PLATEN NIET'
    : 'ONTBREEKT'
  if (!(boek && plaat)) mist += 1
  console.log(`    ${taal}  deel ${String(deel).padStart(2)}  ${staat}`)
}

console.log('')
if (tekstMist) {
  console.log(`De leesboeken ontbreken ook (${tekstMist} van de 3 nagekeken).`)
  console.log('Die komen er niet met --platen bij. Draai daarvoor:\n')
  console.log('  npm --prefix (Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName run lezen -- --r2\n')
}

if (!mist) {
  console.log(ALLES
    ? 'Alles staat er. Een Sba-koper krijgt zijn prentenboek.\n'
    : 'De steekproef is compleet. Wil je het zeker weten:\n\n  npm run platencheck -- --alles\n')
} else {
  console.log(`${mist} van de ${paren.length} ${mist === 1 ? 'staat' : 'staan'} er niet goed in.`)
  console.log('\nDat betekent dat een koper "nog niet" te zien krijgt. De aantekeningen')
  console.log('kloppen dan niet meer met de bak; gooi ze weg en maak ze opnieuw:\n')
  const zoek = '(Get-ChildItem $HOME -Recurse -Depth 5 -Filter darija-kids -Directory -ErrorAction SilentlyContinue | Select-Object -First 1).FullName'
  console.log(`  Remove-Item (Join-Path ${zoek} "store\\bladen\\gedaan.json")`)
  console.log(`  npm --prefix ${zoek} run boeken -- --platen\n`)
  process.exit(1)
}
