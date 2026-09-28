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
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { wrangler } from './lib/wrangler.mjs'

const SERVER = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'server')
const MIGRATIES = path.join(SERVER, 'migrations')
const HIER = process.argv.includes('--hier')

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
  const bestaand = fs.readdirSync(MIGRATIES).filter((f) => f.endsWith('.sql'))
  const hoogste = bestaand.reduce((h, f) => Math.max(h, Number(f.slice(0, 4)) || 0), 0)
  const nummer = String(hoogste + 1).padStart(4, '0')
  const pad = path.join(MIGRATIES, `${nummer}_${kort}.sql`)

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
`, 'utf8')

  console.log(`\nKlaar: server/migrations/${nummer}_${kort}.sql\n`)
  console.log('Schrijf erin wat er moet gebeuren, probeer hem dan eerst hier:\n')
  console.log('  npm run schema -- --hier\n')
  console.log('En als dat goed gaat, op de echte database:\n')
  console.log('  npm run schema\n')
}

const i = process.argv.indexOf('--nieuw')
if (i !== -1) {
  nieuw(process.argv[i + 1])
} else {
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
    }
    console.error(`${tekst.split('\n').filter(Boolean).slice(-4).map((r) => `  ${r}`).join('\n')}\n`)
    process.exit(1)
  }
}
