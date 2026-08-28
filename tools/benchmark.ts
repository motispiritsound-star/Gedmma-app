/**
 * Vult een database met een groot aantal bedrijven en meet hoe snel het
 * dashboard er nog doorheen komt. Er wordt niets opgehaald over het netwerk:
 * dit meet de opslag- en zoeklaag, niet de scanner.
 *
 *   node tools/benchmark.ts --bedrijven 25000
 */
process.removeAllListeners('warning');

import { rmSync } from 'node:fs';

const aantal = Number(process.argv[process.argv.indexOf('--bedrijven') + 1]) || 25_000;
const pad = process.argv.includes('--db')
  ? process.argv[process.argv.indexOf('--db') + 1]!
  : './data/benchmark.db';

if (!process.argv.includes('--hergebruik')) {
  for (const achtervoegsel of ['', '-wal', '-shm']) rmSync(pad + achtervoegsel, { force: true });
}
process.env.WEBSCAN_DB = pad;

const { db, upsertCompanies, saveScan, stats } = await import('../src/db/index.ts');
const { queryLeads, countLeads, kaartPunten, kaartVakjes, plaatsen } = await import('../src/report/leads.ts');
const { trechter, omzet } = await import('../src/db/pipeline.ts');
const { benaderbaarheid } = await import('../src/db/contact.ts');

const PLAATSEN = ['Amsterdam', 'Rotterdam', 'Den Haag', 'Utrecht', 'Eindhoven', 'Groningen',
  'Tilburg', 'Almere', 'Breda', 'Nijmegen', 'Enschede', 'Haarlem', 'Arnhem', 'Amersfoort',
  'Apeldoorn', 'Zwolle', 'Leiden', 'Maastricht', 'Venlo', 'Assen'];
const BRANCHES = ['loodgieter', 'schilder', 'bakkerij', 'kapper', 'autobedrijf', 'hovenier',
  'restaurant', 'fysiotherapie', 'tandarts', 'makelaar', 'drukkerij', 'aannemer'];
const VORMEN = ['eenmanszaak', 'vof', 'bv', 'maatschap', null];

/** Een rapport van vergelijkbare omvang als een echte scan (enkele kilobytes). */
function rapport(score: number, index: number) {
  const problemen = Array.from({ length: 6 + (index % 14) }, (_, nummer) => ({
    id: `probleem-${nummer}`,
    category: ['veiligheid', 'mobiel', 'snelheid', 'vindbaarheid', 'inhoud'][nummer % 5],
    severity: ['kritiek', 'hoog', 'middel', 'laag'][nummer % 4],
    points: 2 + (nummer % 8),
    title: `Bevinding ${nummer} op de gescande pagina die uitleg nodig heeft`,
    advies: 'Een zin of twee met wat eraan te doen is, zoals in het echt ook meekomt.',
  }));
  return {
    verdict: {
      score, grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F',
      label: 'Testgegevens',
      categories: ['veiligheid', 'mobiel', 'snelheid', 'vindbaarheid', 'inhoud']
        .map((naam, i) => ({ category: naam, label: naam, score: i * 3, max: 20, lost: 20 - i * 3 })),
      issues: problemen, topIssues: problemen.slice(0, 5),
    },
    contact: {
      emails: [`info@bedrijf${index}.nl`], phones: [`0${20 + (index % 79)}${1000000 + index}`],
      adres: { adres: `Dorpsstraat ${1 + (index % 200)}`, postcode: '1234 AB', plaats: PLAATSEN[index % PLAATSEN.length]! },
      kvk: String(10000000 + index), btw: null, iban: null,
      openingstijden: 'maandag t/m vrijdag 09.00 - 17.00 uur',
      whatsapp: null, socials: {}, heeftFormulier: true, bron: null, vanEerdereScan: null,
    },
    leven: { score: 20 + (index % 80), niveau: 'onduidelijk', label: 'Testgegevens', tekens: [], twijfels: [] },
    prioriteit: { score: 100 - score, uitleg: 'Testgegevens' },
    signals: null,
  };
}

console.log(`\n${aantal.toLocaleString('nl-NL')} bedrijven wegschrijven…`);
const startVullen = Date.now();
const database = db();

for (let begin = 0; begin < aantal; begin += 2000) {
  const partij = Array.from({ length: Math.min(2000, aantal - begin) }, (_, i) => {
    const index = begin + i;
    return {
      name: `Testbedrijf ${index}`,
      website: `https://bedrijf${index}.nl`,
      domain: `bedrijf${index}.nl`,
      city: PLAATSEN[index % PLAATSEN.length]!,
      branch: BRANCHES[index % BRANCHES.length]!,
      rechtsvorm: VORMEN[index % VORMEN.length],
      lat: 51.5 + ((index * 37) % 200) / 100,
      lon: 4.2 + ((index * 53) % 280) / 100,
      source: 'benchmark',
    };
  });
  upsertCompanies(partij);

  const ids = database.prepare(
    `SELECT id, domain FROM companies WHERE domain IN (${partij.map(() => '?').join(',')})`,
  ).all(...partij.map((rij) => rij.domain)) as unknown as { id: number; domain: string }[];

  database.exec('BEGIN');
  for (const rij of ids) {
    const index = Number(rij.domain.replace(/\D/g, ''));
    const score = (index * 17) % 101;
    saveScan(rij.id, {
      status: 'ok', score, grade: score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 55 ? 'C' : score >= 40 ? 'D' : 'F',
      leven: 20 + (index % 80), prioriteit: 100 - score,
      finalUrl: `https://${rij.domain}/`, httpStatus: 200, error: null, report: rapport(score, index),
    });
  }
  database.exec('COMMIT');
  process.stdout.write(`\r  ${Math.min(begin + 2000, aantal)}/${aantal}`);
}
console.log(`\n  klaar in ${((Date.now() - startVullen) / 1000).toFixed(1)} s`);

// --- meten ------------------------------------------------------------------
const meet = (naam: string, werk: () => unknown): void => {
  const start = process.hrtime.bigint();
  const uitkomst = werk();
  const ms = Number(process.hrtime.bigint() - start) / 1e6;
  const grootte = Array.isArray(uitkomst) ? ` (${uitkomst.length} rijen)` : '';
  const traag = ms > 250 ? '  ← traag' : '';
  console.log(`  ${naam.padEnd(46)} ${ms.toFixed(0).padStart(6)} ms${grootte}${traag}`);
};

console.log('\nWat het dashboard doet bij het openen:');
meet('lijst, eerste 100 op prioriteit', () => queryLeads({ limit: 100 }));
meet('aantal leads voor de teller', () => countLeads({}));
meet('aantal leads met filter op score', () => countLeads({ maxScore: 55 }));
meet('kaartpunten (max 6000)', () => kaartPunten({ limit: 6000 }));
meet('kaartpunten (alles)', () => kaartPunten({ limit: 1_000_000 }));
// Daarom vat de server de kaart samen zodra er te veel bedrijven in beeld staan.
meet('kaart samengevat in vakjes', () => kaartVakjes({}));
meet('cijfers bovenin', () => stats());
meet('trechter', () => trechter());
meet('omzet', () => omzet());
meet('benaderbaarheid', () => benaderbaarheid());
meet('plaatsenlijst voor het filter', () => plaatsen());

console.log('\nZoeken en filteren:');
meet('zoeken op naam', () => queryLeads({ search: 'Testbedrijf 12', limit: 100 }));
meet('filter op plaats', () => queryLeads({ city: 'Utrecht', limit: 100 }));
meet('filter met contactgegevens', () => queryLeads({ metContact: true, limit: 100 }));
meet('tellen met contactgegevens', () => countLeads({ metContact: true }));
meet('pagina 20 (offset 2000)', () => queryLeads({ limit: 100, offset: 2000 }));

const grootte = (database.prepare('PRAGMA page_count').get() as { page_count: number }).page_count
  * (database.prepare('PRAGMA page_size').get() as { page_size: number }).page_size;
console.log(`\nDatabase: ${(grootte / 1024 / 1024).toFixed(0)} MB voor ${stats().bedrijven.toLocaleString('nl-NL')} bedrijven\n`);
