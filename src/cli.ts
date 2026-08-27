#!/usr/bin/env node
// De ingebouwde SQLite van Node is nog "experimental"; die waarschuwing hoeft de gebruiker niet te zien.
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name !== 'ExperimentalWarning') console.warn(warning);
});

import { Command } from 'commander';
import { log } from './util/log.ts';
import { config } from './config.ts';
import { getSource, sources } from './sources/index.ts';
import { upsertCompanies, companiesToScan, setOutreach, stats, db } from './db/index.ts';
import { scanAll } from './scan/scanner.ts';
import { queryLeads, getLead } from './report/leads.ts';
import { exportLeads } from './report/export.ts';
import { buildEmail, buildReport } from './report/pitch.ts';

const program = new Command();

program
  .name('webscan')
  .description('Scan websites van Nederlandse bedrijven en vind wie een betere site nodig heeft.')
  .version('0.1.0');

// --------------------------------------------------------------------------
program
  .command('bronnen')
  .description('Toon de beschikbare bedrijfsbronnen')
  .action(() => {
    for (const source of Object.values(sources)) {
      log.info(`  ${source.name.padEnd(6)} ${source.description}`);
    }
  });

// --------------------------------------------------------------------------
program
  .command('import')
  .description('Haal bedrijven met een website op en zet ze in de database')
  .requiredOption('-s, --source <naam>', 'bron: osm, csv of kvk')
  .option('-a, --area <plaats>', 'gemeente of provincie (leeg = heel Nederland)')
  .option('-c, --category <categorie>', 'osm-categorie: shop, horeca, office, craft, zorg, toerisme, all', 'all')
  .option('-f, --file <pad>', 'pad naar het CSV-bestand (bron: csv)')
  .option('-l, --limit <aantal>', 'maximum aantal bedrijven', Number, 1000)
  .action(async (options) => {
    const source = getSource(options.source);
    log.step(`Bedrijven ophalen via "${source.name}"${options.area ? ` voor ${options.area}` : ' (heel Nederland)'}…`);

    const found = await source.fetch({
      area: options.area, category: options.category, file: options.file, limit: options.limit,
    });
    const usable = found.filter((company) => company.domain !== '');
    const skipped = found.length - usable.length;

    const result = upsertCompanies(usable);
    log.ok(`${result.inserted} nieuw, ${result.updated} bijgewerkt${skipped > 0 ? `, ${skipped} zonder website overgeslagen` : ''}.`);
    log.dim(`Totaal in database: ${stats().bedrijven} bedrijven.`);
  });

// --------------------------------------------------------------------------
program
  .command('scan')
  .description('Scan de websites die nog geen (recente) beoordeling hebben')
  .option('-l, --limit <aantal>', 'maximum aantal sites deze ronde', Number, 200)
  .option('-c, --concurrency <aantal>', 'aantal gelijktijdige scans', Number, config.concurrency)
  .option('--rescan-after <dagen>', 'scan opnieuw als de vorige scan ouder is dan dit', Number, 30)
  .option('--all', 'scan ook sites die al recent gescand zijn')
  .option('--deep', 'meet ook LCP/CLS met een echte browser (vereist playwright)')
  .option('--screenshots <map>', 'maak screenshots en sla ze op in deze map')
  .action(async (options) => {
    const companies = companiesToScan({
      limit: options.limit, rescanAfterDays: options.rescanAfter, all: options.all,
    });
    if (companies.length === 0) {
      log.ok('Alles is al gescand. Gebruik --all of --rescan-after om opnieuw te scannen.');
      return;
    }

    log.step(`${companies.length} websites scannen met ${options.concurrency} tegelijk…`);
    log.dim(`robots.txt wordt gerespecteerd; minimaal ${config.perHostDelayMs} ms tussen requests per host.`);

    const outcomes = await scanAll(companies, {
      deep: options.deep, screenshotDir: options.screenshots, concurrency: options.concurrency,
    });

    const slecht = outcomes.filter((outcome) => (outcome.score ?? 100) < 50).length;
    const blocked = outcomes.filter((outcome) => outcome.status === 'blocked').length;
    log.ok(`Klaar. ${slecht} van de ${outcomes.length} sites scoort onder de 50 — dat zijn je leads.`);
    if (blocked > 0) log.dim(`${blocked} site(s) overgeslagen op verzoek van hun robots.txt.`);
  });

// --------------------------------------------------------------------------
const filterOptions = (command: Command): Command => command
  .option('--max-score <score>', 'alleen sites met een score t/m dit getal', Number)
  .option('--min-score <score>', 'alleen sites met een score vanaf dit getal', Number)
  .option('-g, --grade <letter>', 'filter op beoordeling A t/m F')
  .option('--city <plaats>', 'filter op plaats')
  .option('--branch <branche>', 'filter op branche')
  .option('--source <bron>', 'filter op bron')
  .option('--status <status>', 'filter op opvolgstatus (nieuw, benaderd, gereageerd, klant, afgewezen)')
  .option('--met-contact', 'alleen leads met telefoon of e-mail')
  .option('--zoek <tekst>', 'zoek in bedrijfsnaam of domein');

const toFilter = (options: Record<string, unknown>) => ({
  maxScore: options.maxScore as number | undefined,
  minScore: options.minScore as number | undefined,
  grade: options.grade as string | undefined,
  city: options.city as string | undefined,
  branch: options.branch as string | undefined,
  source: options.source as string | undefined,
  outreachStatus: options.status as string | undefined,
  metContact: options.metContact as boolean | undefined,
  search: options.zoek as string | undefined,
  limit: options.limit as number | undefined,
});

filterOptions(
  program
    .command('leads')
    .description('Toon de slechtst scorende websites — je belijst')
    .option('-l, --limit <aantal>', 'aantal regels', Number, 25),
).action((options) => {
  const leads = queryLeads({ ...toFilter(options), maxScore: options.maxScore ?? 55 });
  if (leads.length === 0) { log.warn('Geen leads gevonden met deze filters.'); return; }

  log.info('');
  log.info('  #     Score  Bedrijf                        Plaats           Contact               Grootste probleem');
  log.info('  ' + '─'.repeat(120));
  for (const lead of leads) {
    const contact = lead.contact.phones[0] ?? lead.contact.emails[0] ?? '—';
    log.info(
      '  ' +
      String(lead.id).padEnd(5) +
      String(lead.score).padStart(4) + '  ' + String(lead.grade).padEnd(4) +
      lead.name.slice(0, 29).padEnd(31) +
      (lead.city ?? '—').slice(0, 15).padEnd(17) +
      contact.slice(0, 20).padEnd(22) +
      (lead.topIssues[0]?.title ?? '').slice(0, 45),
    );
  }
  log.info('');
  log.dim(`  ${leads.length} leads. Gebruik "webscan pitch <#>" voor een concept-mail.`);
});

// --------------------------------------------------------------------------
filterOptions(
  program
    .command('export <bestand>')
    .description('Exporteer de leads naar CSV of JSON')
    .option('--format <formaat>', 'csv of json', 'csv')
    .option('-l, --limit <aantal>', 'maximum aantal regels', Number, 100000),
).action(async (file, options) => {
  const count = await exportLeads(file, { ...toFilter(options), maxScore: options.maxScore ?? 55 }, options.format);
  log.ok(`${count} leads geëxporteerd naar ${file}`);
});

// --------------------------------------------------------------------------
program
  .command('pitch <id>')
  .description('Genereer een concept-mail (en optioneel een rapport) voor één lead')
  .option('--naam <naam>', 'jouw naam')
  .option('--bedrijf <naam>', 'jouw bedrijfsnaam')
  .option('--telefoon <nummer>', 'jouw telefoonnummer')
  .option('--email <adres>', 'jouw e-mailadres')
  .option('--rapport', 'toon ook het uitgebreide rapport in Markdown')
  .action((id, options) => {
    const lead = getLead(Number(id));
    if (!lead) { log.error(`Geen lead met id ${id}.`); process.exitCode = 1; return; }

    const report = lead.report as { verdict?: Parameters<typeof buildEmail>[0]['verdict']; signals?: Parameters<typeof buildEmail>[0]['signals'] };
    if (!report.verdict) { log.error('Deze lead heeft nog geen scanresultaat.'); process.exitCode = 1; return; }

    const input = {
      companyName: lead.name,
      domain: lead.domain,
      city: lead.city,
      verdict: report.verdict,
      signals: report.signals ?? null,
      sender: { name: options.naam, company: options.bedrijf, phone: options.telefoon, email: options.email },
    };

    const { subject, body } = buildEmail(input);
    log.info('');
    log.info(`Aan:      ${lead.contact.emails[0] ?? '(geen e-mailadres gevonden — bel of gebruik het contactformulier)'}`);
    log.info(`Onderwerp: ${subject}`);
    log.info('');
    log.info(body);
    log.info('');
    if (options.rapport) {
      log.info('─'.repeat(70));
      log.info(buildReport(input));
    }
  });

// --------------------------------------------------------------------------
program
  .command('status <id> <status>')
  .description('Leg vast waar je staat met een lead (nieuw, benaderd, gereageerd, klant, afgewezen)')
  .option('-n, --note <tekst>', 'notitie')
  .action((id, status, options) => {
    setOutreach(Number(id), status, options.note);
    log.ok(`Lead ${id} staat nu op "${status}".`);
  });

// --------------------------------------------------------------------------
program
  .command('stats')
  .description('Toon de stand van zaken')
  .action(() => {
    const numbers = stats();
    log.info('');
    for (const [label, value] of Object.entries(numbers)) {
      log.info(`  ${label.padEnd(14)} ${String(value).padStart(7)}`);
    }
    const topCities = db().prepare(`
      SELECT city, COUNT(*) n, ROUND(AVG(score)) gem FROM leads
      WHERE score IS NOT NULL AND city IS NOT NULL GROUP BY city ORDER BY n DESC LIMIT 5
    `).all() as unknown as { city: string; n: number; gem: number }[];
    if (topCities.length > 0) {
      log.info('\n  Meeste gescande bedrijven per plaats:');
      for (const row of topCities) log.info(`  ${row.city.padEnd(20)} ${String(row.n).padStart(5)} sites, gemiddeld ${row.gem}/100`);
    }
    log.info('');
  });

// --------------------------------------------------------------------------
program
  .command('serve')
  .description('Start het dashboard in de browser')
  .option('-p, --port <poort>', 'poort', Number, config.serverPort)
  .action(async (options) => {
    const { startServer } = await import('./server/index.ts');
    await startServer(options.port);
  });

program.parseAsync(process.argv).catch((error: unknown) => {
  log.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
