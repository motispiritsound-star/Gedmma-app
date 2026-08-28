#!/usr/bin/env node
// De ingebouwde SQLite van Node is nog "experimental"; die waarschuwing hoeft de gebruiker niet te zien.
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name !== 'ExperimentalWarning') console.warn(warning);
});

import { Command } from 'commander';
import { createInterface } from 'node:readline/promises';
import { log } from './util/log.ts';
import { config } from './config.ts';
import { getSource, sources } from './sources/index.ts';
import { upsertCompanies, companiesToScan, stats, db } from './db/index.ts';
import { maakGebruiker, gebruikers, wijzigWachtwoord, zetActief, gebruikerOpEmail } from './db/team.ts';
import { FASES, teamOverzicht, omzet, opdrachten, trechter, zetFase, wijsToe, testimonials, type Fase } from './db/pipeline.ts';
import { scanAll } from './scan/scanner.ts';
import { geocodeBedrijven } from './scan/geocode.ts';
import { queryLeads, getLead } from './report/leads.ts';
import { exportLeads } from './report/export.ts';
import { buildReport } from './report/pitch.ts';
import { SJABLONEN, renderSjabloon, stelSjabloonVoor } from './report/templates.ts';

const program = new Command();
const euro = (cent: number): string => `€ ${(cent / 100).toFixed(2).replace('.', ',')}`;

async function vraagVerborgen(vraag: string): Promise<string> {
  const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
  // De echo uitzetten zodat het wachtwoord niet in de terminal blijft staan.
  const output = rl as unknown as { output?: { write(chunk: string): void } };
  const origineel = output.output?.write.bind(output.output);
  if (origineel) output.output!.write = (chunk: string) => { if (!chunk.includes('\n')) return; origineel(chunk); };
  process.stdout.write(vraag);
  const antwoord = await rl.question('');
  if (origineel) output.output!.write = origineel;
  process.stdout.write('\n');
  rl.close();
  return antwoord;
}

program
  .name('webscan')
  .description('Scan websites van Nederlandse bedrijven en werk de leads uit met je team.')
  .version('0.2.0');

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

    const gevonden = await source.fetch({
      area: options.area, category: options.category, file: options.file, limit: options.limit,
    });
    const bruikbaar = gevonden.filter((bedrijf) => bedrijf.domain !== '');
    const overgeslagen = gevonden.length - bruikbaar.length;
    const metPositie = bruikbaar.filter((bedrijf) => bedrijf.lat != null).length;

    const resultaat = upsertCompanies(bruikbaar);
    log.ok(`${resultaat.inserted} nieuw, ${resultaat.updated} bijgewerkt${overgeslagen > 0 ? `, ${overgeslagen} zonder website overgeslagen` : ''}.`);
    log.dim(`${metPositie} daarvan hebben meteen een positie op de kaart. Totaal: ${stats().bedrijven} bedrijven.`);
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
    const bedrijven = companiesToScan({
      limit: options.limit, rescanAfterDays: options.rescanAfter, all: options.all,
    });
    if (bedrijven.length === 0) {
      log.ok('Alles is al gescand. Gebruik --all of --rescan-after om opnieuw te scannen.');
      return;
    }

    log.step(`${bedrijven.length} websites scannen met ${options.concurrency} tegelijk…`);
    log.dim(`robots.txt wordt gerespecteerd; minimaal ${config.perHostDelayMs} ms tussen requests per host.`);

    const uitkomsten = await scanAll(bedrijven, {
      deep: options.deep, screenshotDir: options.screenshots, concurrency: options.concurrency,
    });

    const slecht = uitkomsten.filter((uitkomst) => (uitkomst.score ?? 100) < 50).length;
    const geblokkeerd = uitkomsten.filter((uitkomst) => uitkomst.status === 'blocked').length;
    log.ok(`Klaar. ${slecht} van de ${uitkomsten.length} sites scoort onder de 50 — dat zijn je leads.`);
    if (geblokkeerd > 0) log.dim(`${geblokkeerd} site(s) overgeslagen op verzoek van hun robots.txt.`);
  });

// --------------------------------------------------------------------------
program
  .command('geocode')
  .description('Zet bedrijven zonder positie op de kaart aan de hand van hun plaatsnaam')
  .option('-l, --limit <aantal>', 'maximum aantal bedrijven deze ronde', Number, 500)
  .action(async (options) => {
    const resultaat = await geocodeBedrijven(options.limit);
    log.ok(`${resultaat.gelukt} bedrijven op de kaart gezet${resultaat.mislukt > 0 ? `, ${resultaat.mislukt} plaatsnamen niet gevonden` : ''}.`);
  });

// --------------------------------------------------------------------------
const filterOpties = (command: Command): Command => command
  .option('--max-score <score>', 'alleen sites met een score t/m dit getal', Number)
  .option('--min-score <score>', 'alleen sites met een score vanaf dit getal', Number)
  .option('-g, --grade <letter>', 'filter op beoordeling A t/m F')
  .option('--city <plaats>', 'filter op plaats')
  .option('--branch <branche>', 'filter op branche')
  .option('--source <bron>', 'filter op bron')
  .option('--fase <fase>', `filter op fase (${FASES.map((f) => f.id).join(', ')})`)
  .option('--agent <email>', 'alleen leads van deze agent')
  .option('--vrij', 'alleen leads die nog van niemand zijn')
  .option('--met-contact', 'alleen leads met telefoon of e-mail')
  .option('--zoek <tekst>', 'zoek in bedrijfsnaam, domein of plaats');

const naarFilter = (options: Record<string, unknown>) => {
  const agentEmail = options.agent as string | undefined;
  const agent = agentEmail ? gebruikerOpEmail(agentEmail) : null;
  if (agentEmail && !agent) throw new Error(`Geen gebruiker met e-mailadres ${agentEmail}.`);
  return {
    maxScore: options.maxScore as number | undefined,
    minScore: options.minScore as number | undefined,
    grade: options.grade as string | undefined,
    city: options.city as string | undefined,
    branch: options.branch as string | undefined,
    source: options.source as string | undefined,
    fase: options.fase as string | undefined,
    agentId: agent?.id,
    alleenVrij: options.vrij as boolean | undefined,
    metContact: options.metContact as boolean | undefined,
    search: options.zoek as string | undefined,
    limit: options.limit as number | undefined,
  };
};

filterOpties(
  program
    .command('leads')
    .description('Toon de slechtst scorende websites — je belijst')
    .option('-l, --limit <aantal>', 'aantal regels', Number, 25),
).action((options) => {
  const leads = queryLeads({ ...naarFilter(options), maxScore: options.maxScore ?? 55 });
  if (leads.length === 0) { log.warn('Geen leads gevonden met deze filters.'); return; }

  log.info('');
  log.info('  #    Score  Bedrijf                       Plaats          Contact              Fase        Agent');
  log.info('  ' + '─'.repeat(125));
  for (const lead of leads) {
    const contact = lead.contact.phones[0] ?? lead.contact.emails[0] ?? '—';
    log.info(
      '  ' +
      String(lead.id).padEnd(5) +
      String(lead.score).padStart(4) + '  ' + String(lead.grade).padEnd(4) +
      lead.name.slice(0, 28).padEnd(30) +
      (lead.city ?? '—').slice(0, 14).padEnd(16) +
      contact.slice(0, 19).padEnd(21) +
      lead.fase.padEnd(12) +
      (lead.agent_naam ?? '—').slice(0, 14),
    );
  }
  log.info('');
  log.dim(`  ${leads.length} leads. "webscan mail <#>" voor een concept-mail, "webscan fase <#> <fase>" om bij te werken.`);
});

// --------------------------------------------------------------------------
filterOpties(
  program
    .command('export <bestand>')
    .description('Exporteer de leads naar CSV of JSON')
    .option('--format <formaat>', 'csv of json', 'csv')
    .option('-l, --limit <aantal>', 'maximum aantal regels', Number, 100000),
).action(async (file, options) => {
  const aantal = await exportLeads(file, { ...naarFilter(options), maxScore: options.maxScore ?? 55 }, options.format);
  log.ok(`${aantal} leads geëxporteerd naar ${file}`);
});

// --------------------------------------------------------------------------
program
  .command('sjablonen')
  .description('Toon de beschikbare mailsjablonen')
  .action(() => {
    log.info('');
    for (const sjabloon of SJABLONEN) {
      log.info(`  ${sjabloon.id.padEnd(22)} ${sjabloon.naam}`);
      log.dim(`  ${' '.repeat(22)} ${sjabloon.wanneer}`);
    }
    log.info('');
  });

// --------------------------------------------------------------------------
program
  .command('mail <id>')
  .description('Schrijf een mail aan een lead met een van de sjablonen')
  .option('-s, --sjabloon <naam>', 'welk sjabloon (leeg = het sjabloon dat bij de bevindingen past)')
  .option('--naam <naam>', 'jouw naam')
  .option('--bedrijf <naam>', 'jouw bedrijfsnaam')
  .option('--telefoon <nummer>', 'jouw telefoonnummer')
  .option('--email <adres>', 'jouw e-mailadres')
  .option('--rapport', 'toon ook het uitgebreide rapport in Markdown')
  .action((id, options) => {
    const lead = getLead(Number(id));
    if (!lead) { log.error(`Geen lead met id ${id}.`); process.exitCode = 1; return; }

    const rapport = lead.report as { verdict?: never; signals?: never };
    if (!rapport.verdict) { log.error('Deze lead heeft nog geen scanresultaat.'); process.exitCode = 1; return; }

    const context = {
      bedrijf: lead.name, domein: lead.domain, plaats: lead.city,
      verdict: rapport.verdict, signals: rapport.signals ?? null,
      afzender: { naam: options.naam, bedrijf: options.bedrijf, telefoon: options.telefoon, email: options.email },
    };

    try {
      const gekozen = options.sjabloon ?? stelSjabloonVoor(rapport.verdict);
      const mail = renderSjabloon(gekozen, context, lead.contact.emails[0] ?? null);
      log.info('');
      log.info(`Sjabloon:  ${mail.naam}${options.sjabloon ? '' : ' (voorgesteld op basis van de scan)'}`);
      log.info(`Aan:       ${lead.contact.emails[0] ?? '(geen e-mailadres gevonden — bel of gebruik het contactformulier)'}`);
      log.info(`Onderwerp: ${mail.onderwerp}`);
      log.info('');
      log.info(mail.tekst);
      log.info('');
      if (options.rapport) {
        log.info('─'.repeat(70));
        log.info(buildReport({
          companyName: lead.name, domain: lead.domain, city: lead.city,
          verdict: rapport.verdict, signals: rapport.signals ?? null,
        }));
      }
    } catch (fout) { log.error((fout as Error).message); process.exitCode = 1; }
  });

// --------------------------------------------------------------------------
program
  .command('fase <id> <fase>')
  .description(`Verzet een lead naar een volgende fase (${FASES.map((f) => f.id).join(', ')})`)
  .option('-n, --notitie <tekst>', 'notitie bij deze stap')
  .option('--agent <email>', 'wijs de lead meteen toe aan deze agent')
  .action((id, fase, options) => {
    const agent = options.agent ? gebruikerOpEmail(options.agent) : null;
    if (options.agent && !agent) { log.error(`Geen gebruiker met e-mailadres ${options.agent}.`); process.exitCode = 1; return; }
    try {
      if (agent) wijsToe(Number(id), agent.id, agent.id);
      zetFase(Number(id), fase as Fase, agent?.id ?? null, options.notitie);
      log.ok(`Lead ${id} staat nu op "${fase}"${agent ? ` bij ${agent.naam}` : ''}.`);
    } catch (fout) { log.error((fout as Error).message); process.exitCode = 1; }
  });

// --------------------------------------------------------------------------
const gebruiker = program.command('gebruiker').description('Beheer de mensen die met het platform werken');

gebruiker
  .command('toevoegen')
  .description('Maak een account aan voor jezelf of een agent')
  .requiredOption('-n, --naam <naam>', 'volledige naam')
  .requiredOption('-e, --email <adres>', 'e-mailadres, dit is de inlognaam')
  .option('-r, --rol <rol>', 'eigenaar of agent', 'agent')
  .option('-w, --wachtwoord <wachtwoord>', 'wachtwoord (vraagt erom als je het weglaat)')
  .action(async (options) => {
    const wachtwoord = options.wachtwoord ?? await vraagVerborgen('Wachtwoord (minstens 10 tekens): ');
    try {
      const nieuw = maakGebruiker({ naam: options.naam, email: options.email, wachtwoord, rol: options.rol });
      log.ok(`${nieuw.naam} (${nieuw.rol}) kan nu inloggen met ${nieuw.email}.`);
    } catch (fout) { log.error((fout as Error).message); process.exitCode = 1; }
  });

gebruiker
  .command('lijst')
  .description('Toon alle accounts')
  .action(() => {
    const rijen = gebruikers();
    if (rijen.length === 0) { log.warn('Nog geen accounts. Maak er een aan met "webscan gebruiker toevoegen".'); return; }
    log.info('');
    for (const rij of rijen) {
      log.info(`  ${String(rij.id).padEnd(4)} ${rij.naam.padEnd(24)} ${rij.email.padEnd(30)} ${rij.rol.padEnd(10)} ${rij.actief ? 'actief' : 'geblokkeerd'}`);
    }
    log.info('');
  });

gebruiker
  .command('wachtwoord <email>')
  .description('Stel een nieuw wachtwoord in (logt dat account overal uit)')
  .action(async (email) => {
    const account = gebruikerOpEmail(email);
    if (!account) { log.error(`Geen gebruiker met e-mailadres ${email}.`); process.exitCode = 1; return; }
    const wachtwoord = await vraagVerborgen('Nieuw wachtwoord: ');
    try {
      wijzigWachtwoord(account.id, wachtwoord);
      log.ok(`Wachtwoord van ${account.naam} is gewijzigd.`);
    } catch (fout) { log.error((fout as Error).message); process.exitCode = 1; }
  });

gebruiker
  .command('blokkeren <email>')
  .description('Zet een account op inactief en log het overal uit')
  .option('--herstel', 'juist weer activeren')
  .action((email, options) => {
    const account = gebruikerOpEmail(email);
    if (!account) { log.error(`Geen gebruiker met e-mailadres ${email}.`); process.exitCode = 1; return; }
    zetActief(account.id, Boolean(options.herstel));
    log.ok(`${account.naam} is nu ${options.herstel ? 'weer actief' : 'geblokkeerd'}.`);
  });

// --------------------------------------------------------------------------
program
  .command('team')
  .description('Toon wat je team doet en oplevert')
  .action(() => {
    const rijen = teamOverzicht();
    if (rijen.length === 0) { log.warn('Nog geen actieve accounts.'); return; }
    log.info('');
    log.info('  Naam                     Rol        Open  Gebeld 7d  Afspraken  Opdrachten  Klanten  Maandomzet');
    log.info('  ' + '─'.repeat(102));
    for (const rij of rijen) {
      log.info(
        '  ' + rij.naam.slice(0, 23).padEnd(25) + rij.rol.padEnd(11) +
        String(rij.open).padStart(4) + String(rij.gebeld_7d).padStart(11) +
        String(rij.afspraken).padStart(11) + String(rij.opdrachten).padStart(12) +
        String(rij.klanten).padStart(9) + euro(rij.mrr_cent).padStart(13),
      );
    }
    const totaal = omzet();
    const werk = opdrachten();
    log.info('');
    log.info(`  ${werk.totaal} opdrachten binnen (${werk.laatste30Dagen} in de laatste 30 dagen), ${werk.omgezet} daarvan betaalt inmiddels`);
    log.info(`  ${totaal.actieveKlanten} actieve klanten · ${euro(totaal.mrrCent)} per maand · ${euro(totaal.jaaromzetCent)} per jaar`);
    log.info('');
  });

// --------------------------------------------------------------------------
program
  .command('trechter')
  .description('Toon hoeveel bedrijven in welke fase zitten')
  .action(() => {
    log.info('');
    const rijen = trechter();
    const breedste = Math.max(...rijen.map((rij) => rij.aantal), 1);
    for (const rij of rijen) {
      const balk = '█'.repeat(Math.round((rij.aantal / breedste) * 34));
      log.info(`  ${rij.label.padEnd(14)} ${String(rij.aantal).padStart(6)}  ${balk}`);
    }
    log.info('');
  });

// --------------------------------------------------------------------------
program
  .command('stats')
  .description('Toon de stand van zaken')
  .action(() => {
    const cijfers = stats();
    log.info('');
    for (const [label, waarde] of Object.entries(cijfers)) {
      log.info(`  ${label.padEnd(14)} ${String(waarde).padStart(7)}`);
    }
    const geld = omzet();
    if (geld.actieveKlanten > 0) {
      log.info(`\n  ${geld.actieveKlanten} klanten · ${euro(geld.mrrCent)} per maand · gemiddeld ${euro(geld.gemiddeldeKlantCent)} per klant`);
    }
    const beste = db().prepare(`
      SELECT city, COUNT(*) n, ROUND(AVG(score)) gem FROM leads
      WHERE score IS NOT NULL AND city IS NOT NULL GROUP BY city ORDER BY n DESC LIMIT 5
    `).all() as unknown as { city: string; n: number; gem: number }[];
    if (beste.length > 0) {
      log.info('\n  Meeste gescande bedrijven per plaats:');
      for (const rij of beste) log.info(`  ${rij.city.padEnd(20)} ${String(rij.n).padStart(5)} sites, gemiddeld ${rij.gem}/100`);
    }
    log.info('');
  });

// --------------------------------------------------------------------------
program
  .command('testimonials')
  .description('Toon de verzamelde testimonials')
  .option('--publiceerbaar', 'alleen de testimonials die je mag publiceren')
  .action((options) => {
    const rijen = testimonials(Boolean(options.publiceerbaar)) as unknown as
      { bedrijf: string; city: string; sterren: number | null; tekst: string; ontvangen_op: string }[];
    if (rijen.length === 0) { log.warn('Nog geen testimonials verzameld.'); return; }
    for (const rij of rijen) {
      log.info('');
      log.info(`  ${'★'.repeat(rij.sterren ?? 0).padEnd(5)} ${rij.bedrijf}${rij.city ? `, ${rij.city}` : ''} — ${rij.ontvangen_op}`);
      log.info(`  "${rij.tekst}"`);
    }
    log.info('');
  });

// --------------------------------------------------------------------------
program
  .command('serve')
  .description('Start het dashboard in de browser')
  .option('-p, --port <poort>', 'poort', Number, config.serverPort)
  .action(async (options) => {
    if (gebruikers().length === 0) {
      log.warn('Er is nog geen account. Maak er eerst een aan:');
      log.dim('  node src/cli.ts gebruiker toevoegen --naam "Jouw naam" --email jij@voorbeeld.nl --rol eigenaar');
      process.exitCode = 1;
      return;
    }
    const { startServer } = await import('./server/index.ts');
    await startServer(options.port);
  });

program.parseAsync(process.argv).catch((fout: unknown) => {
  log.error(fout instanceof Error ? fout.message : String(fout));
  process.exit(1);
});
