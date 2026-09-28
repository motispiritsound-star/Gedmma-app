/**
 * De database bijwerken, vanuit de projectmap.
 *
 * Dit draaide `server/schema.sql` in zijn geheel opnieuw. Dat kon, want daar
 * stond niets anders in dan `CREATE TABLE IF NOT EXISTS`: toepassen op een
 * database die de tafels al heeft verandert niets.
 *
 * En precies daarom kon er ook niets bij. Een kolom toevoegen aan een tafel
 * die al bestaat doet met `IF NOT EXISTS` helemaal niets — het mislukt niet,
 * het gebeurt gewoon niet, en de worker verwacht daarna een kolom die er niet
 * is. Zolang de database leeg was, gooide je hem weg en begon je opnieuw.
 * Vanaf de eerste echte bestelling kan dat niet meer, en dan is de goedkope
 * oplossing weg.
 *
 * Dus nu genummerde migraties. Wrangler houdt in de tafel `d1_migrations` bij
 * welke er al gedraaid hebben; een tweede keer toepassen doet niets.
 *
 *   npm run schema                  — alles wat nog niet gedraaid heeft
 *   npm run schema -- --hier        — op de lokale kopie, om te proberen
 *   npm run schema -- --nieuw naam  — een volgende migratie beginnen
 *   npm run schema -- --ja          — zonder de vraag, voor een script
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { wrangler } from './lib/wrangler.mjs'

const SERVER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'server')
const MIGRATIES = path.join(SERVER, 'migrations')
const HIER = process.argv.includes('--hier')
const JA = process.argv.includes('--ja')

/**
 * Het nummer vooraan, gelezen zoals wrangler hem leest.
 *
 * Hier stond `Number(naam.slice(0, 4))` — de eerste vier tekens. Wrangler doet
 * `parseInt(naam.split('_')[0], 10)`. Bij `0002_iets.sql` komt dat op hetzelfde
 * neer, maar bij een bestand dat ooit met de hand is gemaakt of hernoemd —
 * `002_land.sql`, `9_fix.sql` — leest de ene 2 of 9 en de andere NaN → 0. Dan
 * deelt `--nieuw` een nummer uit dat wrangler al kent, en werd het bestaande
 * bestand overschreven zonder een woord.
 */
const nummerVan = (naam) => parseInt(naam.split('_')[0], 10)

const migratiebestanden = () =>
  fs.readdirSync(MIGRATIES).filter((f) => f.endsWith('.sql')).sort()

/**
 * De opdrachten in een migratie, zonder het commentaar.
 *
 * Grof maar de goede kant op: een `--` binnen een tekst tussen aanhalingstekens
 * wordt hier ook als commentaar gelezen, en dan blijft er van die opdracht een
 * stuk over. Dat is precies de fout die we kunnen hebben — wat telt is dat een
 * bestand met écht iets erin nooit als leeg wordt gezien.
 */
function opdrachtenIn(sql) {
  return sql
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .split('\n').map((r) => r.replace(/--.*$/, '')).join('\n')
    .split(';').map((o) => o.trim()).filter(Boolean)
}

/**
 * Een migratie die niets doet, is een migratie die je kwijt bent.
 *
 * `--nieuw` schrijft een bestand dat alleen uit commentaar bestaat. Wrangler
 * strijkt commentaar weg, plakt er `INSERT INTO d1_migrations` achter, en tekent
 * hem af als gedraaid. Nagebouwd op een echte lokale database:
 *
 *   toepassen met alleen commentaar  → d1_migrations kreeg rij 0002
 *   daarna de ALTER TABLE erin gezet → "No migrations to apply!", geen kolom
 *
 * Het nummer is dan op de productiedatabase verbrand terwijl er niets gebeurd
 * is, en de migratie is onbereikbaar: elke `npm run schema` meldt voortaan dat
 * de database bij is. Rolt de worker daarna uit die de nieuwe kolom verwacht,
 * dan valt elke bestelling om met "no such column", en niets wijst naar de
 * oorzaak.
 *
 * Eén regel is genoeg om dat af te vangen, en hij kost niets: een migratie
 * zonder uitvoerbare opdracht bestaat niet.
 */
function controleerLeeg() {
  const leeg = migratiebestanden()
    .filter((f) => opdrachtenIn(fs.readFileSync(path.join(MIGRATIES, f), 'utf8')).length === 0)
  if (!leeg.length) return

  console.error('\nDeze migratie staat er wel, maar er staat niets in wat draait:\n')
  for (const f of leeg) console.error(`  server/migrations/${f}`)
  console.error('\nToepassen zou hem aftekenen als gedraaid, en dan is dat nummer op')
  console.error('terwijl er niets gebeurd is — ook de SQL die je er later in zet draait')
  console.error('dan nooit meer. Schrijf er eerst in wat er moet gebeuren.\n')
  console.error('Wil je hem toch niet? Verwijder het bestand.\n')
  process.exit(1)
}

/**
 * Wat er staat te gebeuren, vóórdat het gebeurt.
 *
 * `wrangler()` draait met `stdio: 'pipe'`, dus de tabel "Migrations to be
 * applied" kwam hier pas op het scherm nadat alles al gedraaid had. En de vraag
 * die wrangler zelf stelt — "Your database may not be available to serve
 * requests during the migration, continue?" — wordt in een niet-interactieve
 * aanroep automatisch met ja beantwoord. Er stond dus niets tussen het intypen
 * en onomkeerbare DDL op de database met de echte bestellingen.
 */
function wachtenden() {
  try {
    const uit = wrangler(['d1', 'migrations', 'list', 'darijaforkids', HIER ? '--local' : '--remote'])
    const schoon = uit.replace(/\u001b\[[0-9;]*m/g, '')
    if (/No migrations to apply/i.test(schoon)) return []
    return migratiebestanden().filter((f) => schoon.includes(f))
  } catch {
    // Kan de lijst niet opgehaald worden — geen inlog, netwerk eruit — dan
    // laten we de uitrol niet hierop stuklopen: de apply hieronder geeft
    // dezelfde fout, met een betere melding. `null` is hier "ik weet het niet",
    // en dat is iets anders dan "er wacht niets".
    return null
  }
}

/**
 * Is dit spannend genoeg om naar te vragen?
 *
 * `CREATE TABLE IF NOT EXISTS` en `CREATE INDEX IF NOT EXISTS` doen op een
 * bestaande database niets en zijn veilig om nog eens te draaien. Alles
 * daarbuiten — een ALTER, een INSERT, een DROP — verandert wél iets, en dan
 * hoort er een stop te zitten.
 *
 * Dat onderscheid staat hier omdat het de gewone dag niet in de weg mag zitten.
 * De eerste migratie bestaat volledig uit die twee vormen, dus `npm run schema`
 * blijft één opdracht zonder vragen. De vraag komt op het moment dat hij
 * ergens over gaat.
 */
const spannend = (bestand) =>
  opdrachtenIn(fs.readFileSync(path.join(MIGRATIES, bestand), 'utf8'))
    .some((o) => !/^CREATE (TABLE|INDEX) IF NOT EXISTS/i.test(o))

/** `--nieuw <naam>`: het volgende nummer erbij, met een leeg bestand. */
function nieuw(naam) {
  if (!naam || naam.startsWith('--')) {
    console.error('\nGeef de migratie een naam, bijvoorbeeld:\n')
    console.error('  npm run schema -- --nieuw bestelling-land\n')
    process.exit(1)
  }
  // Alleen letters, cijfers en streepjes: dit wordt een bestandsnaam, en
  // wrangler sorteert ze op nummer.
  const kort = naam.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  if (!kort) {
    console.error(`\n"${naam}" levert een lege naam op. Gebruik letters en cijfers:\n`)
    console.error('  npm run schema -- --nieuw bestelling-land\n')
    process.exit(1)
  }
  const hoogste = migratiebestanden().reduce((h, f) => Math.max(h, nummerVan(f) || 0), 0)
  const nummer = String(hoogste + 1).padStart(4, '0')
  const pad = path.join(MIGRATIES, `${nummer}_${kort}.sql`)

  // Nooit over een bestaand bestand heen. Stond er al iets, en had dat op de
  // echte database gedraaid, dan is het verschil tussen bestand en database
  // daarna blijvend en onzichtbaar.
  if (fs.existsSync(pad)) {
    console.error(`\nserver/migrations/${nummer}_${kort}.sql bestaat al.`)
    console.error('Ik schrijf er niet overheen. Kies een andere naam.\n')
    process.exit(1)
  }

  fs.writeFileSync(pad, `-- ${nummer} — ${naam}
--
-- Schrijf hier wat er verandert, en waarom. Dit bestand draait één keer en
-- wordt daarna nooit meer aangeraakt: wie hem achteraf bewerkt, verandert
-- niets aan een database waar hij al gedraaid heeft.
--
-- Een kolom erbij ziet er zo uit:
--
--   ALTER TABLE bestelling ADD COLUMN land TEXT;
--
-- Sqlite kan geen kolom weghalen of van type veranderen. Moet dat toch, maak
-- dan een nieuwe tafel, kopieer de rijen erheen en hernoem hem.
--
-- SCHRIJF HEM ZO DAT HIJ TWEE KEER MAG DRAAIEN.
--
-- Wrangler zet de aantekening in d1_migrations áchter jouw opdrachten. Valt
-- opdracht twee van drie om, dan is de migratie niet aangetekend en begint de
-- volgende poging weer bij opdracht één — over een tafel die al half verbouwd
-- is. En anders dan het oude \`d1 execute --file\` gaat dit niet langs de
-- import-tak van D1, de enige die belooft dat de database bij een mislukking
-- teruggaat naar zijn oude toestand.
--
-- Praktisch: kijk eerst of het al gebeurd is.
--
--   SELECT count(*) FROM pragma_table_info('bestelling') WHERE name = 'land';
--
-- of bouw om via een nieuwe tafel met een naam die je aan het eind hernoemt,
-- zodat een halve poging niets achterlaat wat de volgende in de weg zit.
`, 'utf8')

  console.log(`\nKlaar: server/migrations/${nummer}_${kort}.sql\n`)
  console.log('Schrijf erin wat er moet gebeuren, probeer hem dan eerst hier:\n')
  console.log('  npm run schema -- --hier\n')
  console.log('En als dat goed gaat, op de echte database:\n')
  console.log('  npm run schema\n')
}

async function toepassen() {
  controleerLeeg()

  const lijst = wachtenden()
  if (lijst?.length === 0) {
    console.log(`\nDe ${HIER ? 'lokale kopie' : 'database'} is bij; er staat niets te wachten.\n`)
    return
  }

  if (lijst === null) {
    console.log('\nIk kon niet opvragen wat er nog wacht. De uitvoering hieronder')
    console.log('zegt het alsnog, en met een duidelijkere fout als er iets mis is.\n')
  } else {
    console.log(`\nDit staat te wachten op de ${HIER ? 'lokale kopie' : 'ECHTE database'}:\n`)
    for (const f of lijst) console.log(`  ${f}${spannend(f) ? '   — verandert bestaande gegevens' : ''}`)
    console.log('')
  }

  {
    // Weten we niet wát er wacht, dan houden we alle bestanden aan: is er
    // ergens een opdracht die bestaande gegevens raakt, dan wordt er gevraagd.
    // Vandaag is dat niemand — 0001 is volledig CREATE ... IF NOT EXISTS — dus
    // de gewone dag verandert hier niet door.
    const wegen = lijst ?? migratiebestanden()

    // Alleen vragen als het ergens over gaat, en nooit op de lokale kopie.
    if (!HIER && !JA && wegen.some(spannend)) {
      if (!process.stdin.isTTY) {
        console.error('Hier verandert iets aan gegevens die er al staan, en ik kan het je')
        console.error(lijst === null
          ? 'nu niet vragen. Kijk na wat er in de migraties staat en draai dan:\n'
          : 'nu niet vragen. Lees het lijstje hierboven na en draai dan:\n')
        console.error('  npm run schema -- --ja\n')
        process.exit(1)
      }
      const lezer = createInterface({ input: process.stdin, output: process.stdout })
      const antwoord = await lezer.question('Doorgaan? Typ ja: ')
      lezer.close()
      if (antwoord.trim().toLowerCase() !== 'ja') {
        console.log('\nNiets gedaan.\n')
        process.exit(1)
      }
    }
  }

  try {
    const uit = wrangler(['d1', 'migrations', 'apply', 'darijaforkids',
      HIER ? '--local' : '--remote'])
    console.log(uit)
    console.log(`\nDe ${HIER ? 'lokale kopie' : 'database'} is bij.\n`)
  } catch (fout) {
    const tekst = String(fout.message || fout).replace(/\u001b\[[0-9;]*m/g, '')
    console.error('\nDat is niet gelukt.\n')
    if (/CLOUDFLARE_API_TOKEN|not logged in|authenticat/i.test(tekst)) {
      console.error('Wrangler weet niet wie je bent. Log één keer in:\n')
      console.error('  npm run inloggen\n')
    } else if (!HIER) {
      // Dit is het geval waar de kop van --nieuw voor waarschuwt.
      console.error('Let op: de aantekening in d1_migrations staat áchter de opdrachten,')
      console.error('dus als dit halverwege omviel is de migratie niet afgetekend en')
      console.error('begint een volgende poging weer bij de eerste opdracht. Kijk eerst')
      console.error('na wat er al wél gebeurd is voordat je het opnieuw probeert:\n')
      console.error('  npm run bestellingen\n')
    }
    console.error(`${tekst.split('\n').filter(Boolean).slice(-4).map((r) => `  ${r}`).join('\n')}\n`)
    process.exit(1)
  }
}

const i = process.argv.indexOf('--nieuw')
if (i !== -1) nieuw(process.argv[i + 1])
else await toepassen()
