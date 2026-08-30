/**
 * Een proefrit: zet in één commando een werkende omgeving neer met nagemaakte
 * bedrijven, drie accounts en het dashboard erbij. Bedoeld om het echte ding te
 * kunnen uitproberen zonder eerst bedrijven te hoeven verzamelen.
 *
 *   npm run proefrit
 */
process.removeAllListeners('warning');
process.on('warning', (waarschuwing) => {
  if (waarschuwing.name !== 'ExperimentalWarning') console.warn(waarschuwing);
});

import { existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const hier = dirname(fileURLToPath(import.meta.url));
const wortel = join(hier, '..');
const database = process.env.WEBSCAN_DB ?? join(wortel, 'data', 'demo.db');
process.env.WEBSCAN_DB = database;

const WACHTWOORD = 'proefrit2026';

const poort = Number(process.env.WEBSCAN_PORT ?? 4321);

// --- 1. Gegevens klaarzetten ------------------------------------------------
if (!existsSync(database)) {
  console.log('\nEerst even drieduizend nagemaakte bedrijfssites opzetten en scannen.');
  console.log('Dat duurt ongeveer anderhalve minuut; daarna gaat het meteen.');
  console.log('Wil je sneller beginnen: DEMO_EXTRA=300 npm run proefrit\n');
  const bouw = spawnSync(process.execPath, [join(hier, 'build.ts')], {
    stdio: 'inherit',
    env: { ...process.env, WEBSCAN_DB: database, NODE_NO_WARNINGS: '1' },
    cwd: wortel,
  });
  if (bouw.status !== 0) {
    console.error('\nHet opzetten van de proefgegevens is misgegaan.\n');
    process.exit(1);
  }
} else {
  console.log(`\nBestaande proefgegevens gevonden in ${database}.`);
  console.log('Verwijder dat bestand als je opnieuw wilt beginnen.');
}

// --- 2. Accounts klaarzetten ------------------------------------------------
// De demo maakt de drie accounts al aan, inclusief de leads die op naam van
// Sara en Tom staan. Hier zetten we alleen het wachtwoord op iets bekends, ook
// als je een database hergebruikt waarvan je het wachtwoord kwijt bent.
const { gebruikers, maakGebruiker, wijzigWachtwoord } = await import('../src/db/team.ts');
const { stats } = await import('../src/db/index.ts');

if (gebruikers().length === 0) {
  maakGebruiker({ naam: 'Eigenaar', email: 'eigenaar@proefrit.nl', wachtwoord: WACHTWOORD, rol: 'eigenaar' });
}
const accounts = gebruikers()
  .filter((account) => account.actief)
  .sort((a, b) => (a.rol === 'eigenaar' ? -1 : 1) - (b.rol === 'eigenaar' ? -1 : 1));
for (const account of accounts) wijzigWachtwoord(account.id, WACHTWOORD);

// --- 3. Dashboard starten ---------------------------------------------------
const cijfers = stats();
const { startServer } = await import('../src/server/index.ts');
await startServer(poort);

const streep = '─'.repeat(62);
console.log(`\n${streep}`);
console.log(`  Open http://localhost:${poort} in je browser`);
console.log(streep);
console.log('\n  Log in met een van deze accounts:\n');
for (const account of accounts) {
  console.log(`    ${account.rol.padEnd(9)} ${account.email.padEnd(24)} ${WACHTWOORD}`);
}
console.log(`
  Als eigenaar zie je alles: de kaart, het teamoverzicht, de omzet en
  de instelling voor wat je aanbiedt. Als agent (Sara of Tom) zie je
  hoe het werken met een eigen lijst voelt — en dat je niet aan de
  leads van een collega kunt komen.

  Er staan ${cijfers.bedrijven} nagemaakte bedrijven klaar, ${cijfers.gescand} gescand.
  Alles wat je aanklikt wordt echt opgeslagen in ${database}.

  Stoppen: Ctrl+C. Opnieuw beginnen: verwijder data/demo.db.
`);
