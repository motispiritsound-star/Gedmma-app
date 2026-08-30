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
import { aanbodTekst, bewaarAanbod, leesAanbod } from './db/instellingen.ts';
import { plaatsNieuws, nieuwsLijst, verwijderNieuws, SOORTEN } from './db/nieuws.ts';
import { verrijkBedrijf, zonderRechtsvorm, CENT_PER_BEVRAGING } from './sources/kvk-verrijken.ts';
import { werklijst, werkdruk } from './db/opvolging.ts';
import { prognose, bewaarDoel, leesDoel, tempo } from './db/prognose.ts';
import { leesProvisie, bewaarProvisie, provisieVan } from './db/instellingen.ts';
import { RECHTSVORMEN, benaderbaarheid, blokkeer, deblokkeer, herkenRechtsvorm,
         legToestemmingVast, magBellen, zetRechtsvorm, type RechtsvormId } from './db/contact.ts';

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
  .command('actualiseren')
  .description('Scan bedrijven opnieuw en laat zien wat er sinds de vorige keer veranderd is')
  .option('-d, --dagen <dagen>', 'alleen scans ouder dan zoveel dagen', Number, 30)
  .option('-l, --limit <aantal>', 'maximum aantal bedrijven deze ronde', Number, 200)
  .option('-c, --concurrency <aantal>', 'aantal gelijktijdige scans', Number, config.concurrency)
  .action(async (options) => {
    const bedrijven = companiesToScan({ limit: options.limit, rescanAfterDays: options.dagen });
    if (bedrijven.length === 0) {
      log.ok(`Alles is korter dan ${options.dagen} dagen geleden gescand.`);
      return;
    }

    const ervoor = new Map(queryLeads({ limit: 100000 }).map((lead) => [lead.id, lead.score]));
    log.step(`${bedrijven.length} bedrijven opnieuw scannen…`);
    await scanAll(bedrijven, { concurrency: options.concurrency });

    const erna = queryLeads({ limit: 100000, toonGeblokkeerd: true })
      .filter((lead) => bedrijven.some((bedrijf) => bedrijf.id === lead.id));

    const veranderd = erna
      .map((lead) => ({ lead, oud: ervoor.get(lead.id) ?? null }))
      .filter((rij) => rij.oud !== null && rij.lead.score !== null && Math.abs(rij.lead.score - rij.oud!) >= 3)
      .sort((a, b) => (a.lead.score! - a.oud!) - (b.lead.score! - b.oud!));

    if (veranderd.length === 0) {
      log.ok(`${erna.length} bedrijven opnieuw gescand; er is niets noemenswaardigs veranderd.`);
      return;
    }

    log.info('');
    log.info('  Verandering  Bedrijf                            Wat er gebeurd is');
    log.info('  ' + '─'.repeat(100));
    for (const { lead, oud } of veranderd) {
      const verschil = lead.score! - oud!;
      const pijl = verschil < 0 ? '▼' : '▲';
      const uitleg = lead.scan_status !== 'ok'
        ? `site is nu onbereikbaar (${lead.error ?? 'onbekend'})`
        : verschil < 0 ? (lead.topIssues[0]?.title ?? 'meer problemen gevonden')
        : 'de site is verbeterd — mogelijk heeft iemand anders hem al opgepakt';
      log.info(
        `  ${pijl} ${String(oud).padStart(3)} → ${String(lead.score).padEnd(4)} ` +
        lead.name.slice(0, 33).padEnd(35) + uitleg.slice(0, 58),
      );
    }
    const slechter = veranderd.filter((rij) => rij.lead.score! < rij.oud!).length;
    log.info('');
    log.ok(`${erna.length} opnieuw gescand · ${slechter} achteruit · ${veranderd.length - slechter} vooruit`);
    log.dim('  Achteruitgegaan is een goede belreden: er is iets kapot of verwaarloosd sinds je vorige contact.');
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

    const aanbod = leesAanbod();
    const context = {
      bedrijf: lead.name, domein: lead.domain, plaats: lead.city,
      verdict: rapport.verdict, signals: rapport.signals ?? null,
      aanbod: aanbodTekst(aanbod),
      afzender: {
        naam: options.naam, bedrijf: options.bedrijf ?? aanbod.bedrijfsnaam,
        telefoon: options.telefoon ?? aanbod.telefoon, email: options.email,
      },
    };

    try {
      const gekozen = options.sjabloon ?? stelSjabloonVoor(rapport.verdict, magBellen(lead).mag);
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
program
  .command('aanbod')
  .description('Toon of wijzig wat je aanbiedt; dit komt in alle mailsjablonen terecht')
  .option('--soort <soort>', 'gratis of startbedrag')
  .option('--startbedrag <euro>', 'eenmalig bedrag voor de bouw', Number)
  .option('--maandbedrag <euro>', 'bedrag per maand', Number)
  .option('--inbegrepen <tekst>', 'wat er in het maandbedrag zit')
  .option('--bedrijfsnaam <naam>', 'jouw bedrijfsnaam in de ondertekening')
  .option('--telefoon <nummer>', 'jouw telefoonnummer in de ondertekening')
  .action((options) => {
    const wijzigingen = ['soort', 'startbedrag', 'maandbedrag', 'inbegrepen', 'bedrijfsnaam', 'telefoon']
      .some((sleutel) => options[sleutel] !== undefined);
    const aanbod = wijzigingen
      ? bewaarAanbod({
          soort: options.soort,
          startbedragCent: options.startbedrag !== undefined ? Math.round(options.startbedrag * 100) : undefined,
          maandbedragCent: options.maandbedrag !== undefined ? Math.round(options.maandbedrag * 100) : undefined,
          inbegrepen: options.inbegrepen,
          bedrijfsnaam: options.bedrijfsnaam,
          telefoon: options.telefoon,
        })
      : leesAanbod();

    log.info('');
    log.info(`  soort         ${aanbod.soort}`);
    log.info(`  startbedrag   ${euro(aanbod.startbedragCent)}`);
    log.info(`  maandbedrag   ${euro(aanbod.maandbedragCent)}`);
    log.info(`  inbegrepen    ${aanbod.inbegrepen}`);
    log.info('');
    log.info('  Zo staat het in de mail:');
    log.info(`  "${aanbodTekst(aanbod)}"`);
    log.info('');
    if (aanbod.soort === 'gratis') {
      log.dim('  Reken door wat een herbouw je aan uren kost. Bij een gratis bouw verdien je die');
      log.dim(`  pas terug na ongeveer ${Math.max(1, Math.round(24000 / Math.max(aanbod.maandbedragCent, 1)))} maanden hosting — en dan nog zonder provisie.`);
    }
  });

// --------------------------------------------------------------------------
program
  .command('mag-bellen <id>')
  .description('Vertelt of je dit bedrijf mag bellen, en zo nee waarom niet')
  .action((id) => {
    const lead = getLead(Number(id));
    if (!lead) { log.error(`Geen lead met id ${id}.`); process.exitCode = 1; return; }
    const oordeel = magBellen(lead);
    log.info('');
    log.info(`  ${lead.name} (${lead.rechtsvorm ?? 'rechtsvorm onbekend'})`);
    if (oordeel.mag) log.ok(oordeel.reden);
    else {
      log.error(oordeel.reden);
      if (oordeel.route) log.dim(`  ${oordeel.route}`);
    }
    log.info('');
  });

// --------------------------------------------------------------------------
program
  .command('rechtsvorm <id> <vorm>')
  .description(`Leg de rechtsvorm vast (${RECHTSVORMEN.map((vorm) => vorm.id).join(', ')})`)
  .action((id, vorm) => {
    const herkend = RECHTSVORMEN.some((rij) => rij.id === vorm) ? (vorm as RechtsvormId) : herkenRechtsvorm(vorm);
    if (!herkend) { log.error(`Onbekende rechtsvorm "${vorm}".`); process.exitCode = 1; return; }
    zetRechtsvorm(Number(id), herkend);
    log.ok(`Lead ${id} staat nu als ${herkend} geregistreerd.`);
  });

// --------------------------------------------------------------------------
program
  .command('toestemming <id>')
  .description('Leg vast dat dit bedrijf toestemming gaf om gebeld te worden')
  .requiredOption('--via <hoe>', 'bijvoorbeeld: mailreactie, formulier, schriftelijk')
  .requiredOption('--bewijs <tekst>', 'waar blijkt het uit — dit moet je kunnen aantonen')
  .action((id, options) => {
    try {
      legToestemmingVast(Number(id), { via: options.via, bewijs: options.bewijs });
      log.ok(`Toestemming vastgelegd voor lead ${id}.`);
    } catch (fout) { log.error((fout as Error).message); process.exitCode = 1; }
  });

// --------------------------------------------------------------------------
program
  .command('niet-benaderen <id>')
  .description('Zet een bedrijf voorgoed op de niet-benaderen-lijst')
  .option('-r, --reden <tekst>', 'waarom', 'op eigen verzoek')
  .option('--opheffen', 'de blokkade juist opheffen')
  .action((id, options) => {
    if (options.opheffen) { deblokkeer(Number(id)); log.ok(`Lead ${id} mag weer benaderd worden.`); return; }
    blokkeer(Number(id), options.reden);
    log.ok(`Lead ${id} wordt door niemand meer benaderd.`);
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
  .command('verrijken')
  .description('Haal KVK-nummer en rechtsvorm op bij de KVK voor bedrijven zonder rechtsvorm')
  .option('-l, --limit <aantal>', 'hoeveel bedrijven', '25')
  .option('-p, --plaats <plaats>', 'alleen deze plaats')
  .option('--ja', 'niet eerst om bevestiging vragen')
  .action(async (options) => {
    const limit = Number(options.limit);
    const rijen = zonderRechtsvorm(limit, options.plaats ?? null);
    if (rijen.length === 0) { log.ok('Alle bedrijven hebben al een rechtsvorm.'); return; }

    const kosten = (rijen.length * CENT_PER_BEVRAGING) / 100;
    log.info(`${rijen.length} bedrijven zonder rechtsvorm. Zoeken is gratis; het profiel `
      + `kost € ${CENT_PER_BEVRAGING / 100} per bedrijf, dus maximaal € ${kosten.toFixed(2)}.`);
    if (!options.ja) {
      const rl = createInterface({ input: process.stdin, output: process.stdout });
      const antwoord = (await rl.question('Doorgaan? [j/N] ')).trim().toLowerCase();
      rl.close();
      if (antwoord !== 'j' && antwoord !== 'ja') { log.warn('Afgebroken.'); return; }
    }

    let gevonden = 0;
    let bevragingen = 0;
    for (const rij of rijen) {
      try {
        const uitkomst = await verrijkBedrijf(rij);
        bevragingen += uitkomst.bevragingen;
        if (uitkomst.rechtsvorm) {
          gevonden++;
          log.info(`  ${rij.name.padEnd(34).slice(0, 34)} ${uitkomst.kvkNummer} · ${uitkomst.rechtsvormTekst}`);
        } else {
          log.warn(`  ${rij.name.padEnd(34).slice(0, 34)} ${uitkomst.reden}`);
        }
      } catch (fout) {
        log.error(`  ${rij.name}: ${(fout as Error).message}`);
        break;
      }
    }
    log.ok(`${gevonden} van de ${rijen.length} bedrijven hebben nu een rechtsvorm. `
      + `${bevragingen} betaalde bevragingen, ongeveer € ${((bevragingen * CENT_PER_BEVRAGING) / 100).toFixed(2)}.`);
  });

// --------------------------------------------------------------------------
program
  .command('vandaag')
  .description('Wat er vandaag opgevolgd moet worden — het langst wachtende bovenaan')
  .option('-a, --agent <email>', 'alleen het werk van deze agent')
  .option('-l, --limit <aantal>', 'hoeveel regels', '25')
  .action((options) => {
    let agentId: number | null = null;
    if (options.agent) {
      const account = gebruikerOpEmail(options.agent);
      if (!account) { log.error(`Geen gebruiker met e-mailadres ${options.agent}.`); process.exitCode = 1; return; }
      agentId = account.id;
    }

    const druk = werkdruk(agentId);
    const regels = werklijst(agentId, Number(options.limit));
    if (regels.length === 0) {
      log.ok('Niets openstaand. Pak er nieuwe leads bij met "webscan leads".');
      return;
    }

    log.info(`\n${druk.teLaat} te laat · ${druk.vandaag} vandaag · ${druk.totaal} openstaand\n`);
    for (const regel of regels) {
      const wanneer = regel.urgentie === 'te-laat' ? `${regel.dagenTeLaat}d te laat` : 'vandaag';
      log.info(`  ${String(regel.id).padStart(5)}  ${wanneer.padEnd(11)} ${regel.name.padEnd(30).slice(0, 30)} ${regel.wat}`);
      log.info(`         ${regel.waarom}${regel.telefoon ? ` · ${regel.telefoon}` : ''}${regel.agent_naam ? ` · ${regel.agent_naam}` : ''}`);
    }
    log.info('');
  });

// --------------------------------------------------------------------------
program
  .command('prognose')
  .description('Wat de pijplijn waard is en wat er nodig is voor je doel')
  .option('--doel <bedrag>', 'zet het doel voor de maandomzet, in euro')
  .action((options) => {
    if (options.doel !== undefined) {
      bewaarDoel(Math.round(Number(options.doel) * 100));
      log.ok(`Doel gezet op ${euro(leesDoel())} per maand.`);
    }

    const cijfers = prognose();
    log.info('');
    log.info(`  Nu binnen            ${euro(cijfers.huidigeMrrCent).padStart(12)} per maand`);
    log.info(`  Verwacht uit pijplijn${euro(cijfers.verwachteMrrCent).padStart(12)} per maand (${cijfers.verwachteKlanten.toFixed(1)} klanten)`);
    log.info(`  Over een jaar        ${euro(cijfers.pijplijnJaarCent).padStart(12)}`);
    if (cijfers.doelMrrCent > 0) {
      const gehaald = Math.round((cijfers.huidigeMrrCent / cijfers.doelMrrCent) * 100);
      log.info(`  Doel                 ${euro(cijfers.doelMrrCent).padStart(12)} per maand — ${gehaald}% gehaald, `
        + `nog ${cijfers.opdrachtenNodig} opdrachten nodig`);
    }
    log.info(`\n  Nog onaangeraakt: ${cijfers.voorraad.aantal} bedrijven\n`);

    for (const fase of cijfers.fases.filter((rij) => rij.aantal > 0)) {
      log.info(`  ${fase.label.padEnd(18)} ${String(fase.aantal).padStart(6)} leads  `
        + `${String(Math.round(fase.kans * 100)).padStart(3)}% ${fase.bron === 'gemeten' ? 'gemeten   ' : 'startwaarde'}  `
        + `${euro(fase.verwachteMrrCent).padStart(11)}`);
    }

    const maanden = tempo().filter((rij) => rij.opdrachten > 0 || rij.klanten > 0);
    if (maanden.length > 0) {
      log.info('\n  Per maand binnengehaald:');
      for (const rij of maanden) log.info(`    ${rij.maand}  ${rij.opdrachten} opdrachten, ${rij.klanten} klanten`);
    }
    log.info('');
  });

// --------------------------------------------------------------------------
program
  .command('provisie')
  .description('Wat een agent verdient, en wat er tot nu toe is opgebouwd')
  .option('--per-opdracht <bedrag>', 'eenmalig bedrag per binnengehaalde opdracht, in euro')
  .option('--percentage <getal>', 'percentage van de maandomzet van eigen klanten')
  .action((options) => {
    if (options.perOpdracht !== undefined || options.percentage !== undefined) {
      bewaarProvisie({
        perOpdrachtCent: options.perOpdracht !== undefined ? Math.round(Number(options.perOpdracht) * 100) : undefined,
        mrrPercentage: options.percentage !== undefined ? Number(options.percentage) : undefined,
      });
    }
    const regeling = leesProvisie();
    log.info(`\n  ${euro(regeling.perOpdrachtCent)} per opdracht en ${regeling.mrrPercentage}% van de hosting, elke maand.\n`);
    for (const regel of teamOverzicht()) {
      const verdiend = provisieVan(regel, regeling);
      log.info(`  ${regel.naam.padEnd(24)} ${String(regel.opdrachten).padStart(3)} opdrachten  `
        + `${euro(verdiend.eenmaligCent).padStart(11)} eenmalig  ${euro(verdiend.perMaandCent).padStart(10)} per maand`);
    }
    log.info('');
  });

// --------------------------------------------------------------------------
const nieuws = program.command('nieuws').description('Het prikbord voor je team');

nieuws
  .command('plaatsen')
  .description('Plaats een bericht dat iedereen in het dashboard ziet')
  .requiredOption('-t, --titel <titel>', 'korte titel')
  .requiredOption('-b, --bericht <tekst>', 'de tekst zelf')
  .option('-s, --soort <soort>', `een van: ${SOORTEN.join(', ')}`, 'bericht')
  .option('--vast', 'bovenaan vastzetten')
  .option('--door <email>', 'namens welk account (standaard de eerste eigenaar)')
  .action((options) => {
    const account = options.door
      ? gebruikerOpEmail(options.door)
      : gebruikers().find((rij) => rij.rol === 'eigenaar' && rij.actief);
    if (!account) {
      log.error('Geen eigenaar gevonden om het bericht op naam te zetten. Gebruik --door <email>.');
      process.exitCode = 1;
      return;
    }
    try {
      const item = plaatsNieuws({
        titel: options.titel, tekst: options.bericht, soort: options.soort,
        vastgezet: Boolean(options.vast), doorId: account.id,
      });
      log.ok(`Geplaatst als #${item.id} namens ${account.naam}.`);
    } catch (fout) { log.error((fout as Error).message); process.exitCode = 1; }
  });

nieuws
  .command('lijst')
  .description('Toon de geplaatste berichten')
  .action(() => {
    const eigenaar = gebruikers().find((rij) => rij.rol === 'eigenaar') ?? gebruikers()[0];
    if (!eigenaar) { log.warn('Nog geen accounts.'); return; }
    const items = nieuwsLijst(eigenaar.id);
    if (items.length === 0) { log.warn('Nog geen nieuws geplaatst.'); return; }
    log.info('');
    for (const item of items) {
      log.info(`  ${String(item.id).padEnd(4)} ${item.gemaakt_op.slice(0, 10)}  ${item.vastgezet ? '📌 ' : '   '}${item.titel}`);
      log.info(`       ${item.soort} · ${item.door_naam ?? 'onbekend'}`);
    }
    log.info('');
  });

nieuws
  .command('weghalen <id>')
  .description('Haal een bericht weg (het blijft bewaard, maar niemand ziet het nog)')
  .action((id) => {
    if (!verwijderNieuws(Number(id))) { log.error(`Geen bericht met nummer ${id}.`); process.exitCode = 1; return; }
    log.ok(`Bericht ${id} is weggehaald.`);
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
    const benaderen = benaderbaarheid();
    log.info('');
    log.info(`  mag gebeld worden      ${String(benaderen.magBellen).padStart(7)}`);
    log.info(`  alleen mailen          ${String(benaderen.alleenMailen).padStart(7)}  (eenmanszaak, vof, maatschap of cv zonder toestemming)`);
    log.info(`  rechtsvorm onbekend    ${String(benaderen.onbekend).padStart(7)}  (bellen pas na controle bij de KVK)`);
    log.info(`  afgemeld               ${String(benaderen.geblokkeerd).padStart(7)}`);
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
