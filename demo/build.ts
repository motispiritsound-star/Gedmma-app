/**
 * Bouwt de demo: start een set nagemaakte Nederlandse bedrijfssites, laat de
 * echte scanner erover lopen en schrijft het resultaat weg als demo-data.json.
 * Zo is de demo geen verzonnen plaatje maar echte uitvoer van de tool.
 *
 *   node demo/build.ts
 */
process.removeAllListeners('warning');

import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Node leest NODE_EXTRA_CA_CERTS alleen bij het opstarten. We maken daarom eerst
// het certificaat aan en starten onszelf daarna opnieuw met dat certificaat in
// de omgeving, zodat de scanner de nagemaakte https-sites vertrouwt.
if (!process.env.WEBSCAN_DEMO_TLS) {
  const setup = mkdtempSync(join(tmpdir(), 'webscan-demo-tls-'));
  const key = join(setup, 'key.pem');
  const cert = join(setup, 'cert.pem');
  execFileSync('openssl', [
    'req', '-x509', '-newkey', 'rsa:2048', '-nodes', '-days', '2',
    '-keyout', key, '-out', cert,
    '-subj', '/CN=localhost', '-addext', 'subjectAltName=DNS:localhost,IP:127.0.0.1',
  ], { stdio: 'ignore' });

  const child = spawnSync(process.execPath, [fileURLToPath(import.meta.url)], {
    stdio: 'inherit',
    env: {
      ...process.env,
      WEBSCAN_DEMO_TLS: setup,
      NODE_EXTRA_CA_CERTS: cert,
      NODE_NO_WARNINGS: '1',
    },
  });
  rmSync(setup, { recursive: true, force: true });
  process.exit(child.status ?? 1);
}

const work = process.env.WEBSCAN_DEMO_TLS;
const keyPath = join(work, 'key.pem');
const certPath = join(work, 'cert.pem');

const demoDb = process.env.WEBSCAN_DB ?? 'data/demo.db';

// De demo begint elke keer met een schone database, zodat opnieuw bouwen
// hetzelfde oplevert en er geen bedrijven van een vorige ronde blijven staan.
if (process.env.DEMO_BEHOUD_DB !== '1') {
  for (const achtervoegsel of ['', '-wal', '-shm']) {
    rmSync(`${demoDb}${achtervoegsel}`, { force: true });
  }
}

process.env.WEBSCAN_DB = demoDb;
process.env.WEBSCAN_HOST_DELAY_MS = '1';
process.env.WEBSCAN_TIMEOUT_MS = '20000';

const { SITES, genereerSites, startDemoServers } = await import('./sites.ts');
const extra = Number(process.env.DEMO_EXTRA ?? 2985);
// Hoeveel bedrijven de losse demopagina met volledige analyse meeneemt. De rest
// staat er wel in — op de kaart, in de lijst, met contactgegevens — maar zonder
// het uitgeschreven rapport, anders wordt het ene HTML-bestand onwerkbaar groot.
const detail = Number(process.env.DEMO_DETAIL ?? 600);

/** De vijftien uitgewerkte sites krijgen dezelfde contactpagina als de rest. */
const metContact = SITES.map((site, index) => ({
  ...site,
  contact: site.contact ?? {
    telefoon: `0${30 + (index % 40)}-${1000000 + index * 37913}`,
    email: `info@${site.domein}`,
    straat: `${['Dorpsstraat', 'Kerkstraat', 'Industrieweg', 'Molenweg', 'Havenstraat'][index % 5]} ${3 + index * 7}`,
    postcode: `${3500 + index * 13} ${String.fromCharCode(65 + (index % 26))}${String.fromCharCode(70 + (index % 20))}`,
    kvk: String(30000000 + index * 111317),
  },
}));

const ALLE = [...metContact, ...genereerSites(extra)];
const servers = await startDemoServers(
  { key: readFileSync(keyPath, 'utf8'), cert: readFileSync(certPath, 'utf8') },
  ALLE,
);

const { upsertCompanies, db } = await import('../src/db/index.ts');
const { maakGebruiker, gebruikers } = await import('../src/db/team.ts');
const { wijsToe, zetFase, logActiviteit, maakKlant, bewaarTestimonial } = await import('../src/db/pipeline.ts');
const { legToestemmingVast, blokkeer, magBellen } = await import('../src/db/contact.ts');
const { scanAll } = await import('../src/scan/scanner.ts');
const { queryLeads, getLead } = await import('../src/report/leads.ts');
const { buildReport } = await import('../src/report/pitch.ts');
const { renderSjabloon, stelSjabloonVoor } = await import('../src/report/templates.ts');

upsertCompanies(ALLE.map((site) => ({
  name: site.bedrijf,
  website: servers.urlFor(site),
  domain: site.domein,
  city: site.plaats,
  branch: site.branche,
  lat: site.lat ?? null,
  lon: site.lon ?? null,
  rechtsvorm: site.rechtsvorm ?? null,
  source: 'demo',
})));

const companies = db().prepare('SELECT * FROM companies ORDER BY id').all() as never[];
console.log(`${companies.length} nagemaakte bedrijfssites scannen…`);
await scanAll(companies, { concurrency: Number(process.env.DEMO_CONCURRENCY ?? 64) });
servers.close();

// --- een tweede scanronde, zodat de demo ook verandering laat zien -----------
// In het echt draai je "webscan actualiseren" elke maand. Hier laten we een
// paar sites onderuit gaan en scannen we die opnieuw, zodat het dashboard echte
// voor-en-na-cijfers heeft in plaats van een verzonnen verschil.
const teVerslechteren = ALLE.filter((site) => site.path.startsWith('/g/')).slice(0, 14);
for (const [index, site] of teVerslechteren.entries()) {
  if (index % 2 === 0) {
    site.status = 503; // hosting eruit
  } else {
    // Iemand heeft er zelf iets van gemaakt: terug naar een tabel-site.
    site.html = site.html.replace(/<meta name="viewport"[^>]*>/i, '')
      .replace(/<title>[^<]*<\/title>/i, '<title></title>');
  }
}

const opnieuw = db().prepare(
  `SELECT * FROM companies WHERE domain IN (${teVerslechteren.map(() => '?').join(',')})`,
).all(...teVerslechteren.map((site) => site.domein)) as never[];
console.log(`\n${opnieuw.length} sites opnieuw scannen na een maand (sommige zijn achteruitgegaan)…`);
await scanAll(opnieuw, { concurrency: 8 });

// --- team, toewijzingen en klanten, zodat de demo een werkend platform toont ---
if (gebruikers().length === 0) {
  maakGebruiker({ naam: 'Ayoub Bekkali', email: 'eigenaar@proefrit.nl', wachtwoord: 'proefrit2026', rol: 'eigenaar' });
  maakGebruiker({ naam: 'Sara de Wit', email: 'sara@proefrit.nl', wachtwoord: 'proefrit2026' });
  maakGebruiker({ naam: 'Tom Bakker', email: 'tom@proefrit.nl', wachtwoord: 'proefrit2026' });
}
const [eigenaar, sara, tom] = gebruikers().sort((a, b) => a.id - b.id);

const opDomein = (domein: string): number =>
  (db().prepare('SELECT id FROM companies WHERE domain = ?').get(domein) as { id: number }).id;

const verhaal: { domein: string; agent: number; fase: string; gebeld?: number; klant?: number; testimonial?: string }[] = [
  { domein: 'loodgieter-dekraan.nl',     agent: sara!.id, fase: 'afspraak',   gebeld: 2 },
  { domein: 'schildersbedrijfvermeer.nl', agent: sara!.id, fase: 'gebeld',     gebeld: 1 },
  { domein: 'hoveniergroenrijk.nl',      agent: sara!.id, fase: 'geen_gehoor', gebeld: 3 },
  { domein: 'drukkerijvandenberg.nl',    agent: tom!.id,  fase: 'opdracht',    gebeld: 2 },
  { domein: 'autobedrijfjansen.nl',      agent: tom!.id,  fase: 'in_aanbouw', gebeld: 2 },
  { domein: 'bakkerijhetmolentje.nl',    agent: tom!.id,  fase: 'klant',      gebeld: 3, klant: 2450,
    testimonial: 'Binnen twee weken stond er een nieuwe site. We krijgen nu bestellingen via de website binnen, dat hadden we eerst nooit.' },
  { domein: 'kapsalonlisa.nl',           agent: sara!.id, fase: 'klant',      gebeld: 2, klant: 1950,
    testimonial: 'Eerlijk advies en niets vooraf betaald. De agenda zit voller sinds mensen online kunnen boeken.' },
  { domein: 'dierenartsdepoot.nl',       agent: tom!.id,  fase: 'afgewezen',  gebeld: 1 },
];

for (const stap of verhaal) {
  const id = opDomein(stap.domein);
  wijsToe(id, stap.agent, eigenaar!.id);
  // Bedrijven die verder komen dan een eerste mail hebben toestemming gegeven;
  // zonder die stap zou bellen bij een eenmanszaak niet mogen.
  if (['afspraak', 'opdracht', 'in_aanbouw', 'klant'].includes(stap.fase)) {
    legToestemmingVast(id, { via: 'mailreactie', bewijs: 'Antwoord per mail: "prima, u mag bellen"', door: stap.agent });
  }
  for (let keer = 0; keer < (stap.gebeld ?? 0); keer++) {
    logActiviteit({ companyId: id, gebruikerId: stap.agent, soort: keer === 0 ? 'gebeld' : 'voicemail',
      notitie: keer === 0 ? 'Eigenaar gesproken, wil eerst zien wat er mis is.' : 'Voicemail ingesproken.' });
  }
  zetFase(id, stap.fase as never, stap.agent);
  if (stap.klant) maakKlant(id, { door: stap.agent, maandbedragCent: stap.klant });
  if (stap.testimonial) {
    bewaarTestimonial(id, { tekst: stap.testimonial, sterren: 5, publiceerbaar: true, gebruikerId: stap.agent });
  }
}

// Een paar berichten op het prikbord, zodat de proefrit laat zien hoe je het
// team op de hoogte houdt.
const { plaatsNieuws } = await import('../src/db/nieuws.ts');
plaatsNieuws({
  titel: 'Vanaf maandag bellen we alleen na toestemming',
  soort: 'let-op', vastgezet: true, doorId: eigenaar!.id,
  tekst: 'Sinds 1 juli geldt de opt-in voor eenmanszaken, vof\'s en maatschappen. '
    + 'Staat er "alleen mailen" bij een bedrijf, mail dan eerst en vraag in die mail om '
    + 'toestemming om te bellen. Leg het antwoord vast bij de lead — dan kleurt de belknop groen.',
});
plaatsNieuws({
  titel: 'Bakkerij Het Molentje staat live',
  soort: 'resultaat', doorId: eigenaar!.id,
  tekst: 'Binnen twee weken van eerste mail naar een nieuwe site op onze hosting. '
    + 'Ze hebben meteen een testimonial gegeven; die staat in het paneel bij de lead.',
});
plaatsNieuws({
  titel: 'Nieuwe scanronde gedraaid',
  soort: 'update', doorId: eigenaar!.id,
  tekst: 'Veertien sites zijn achteruitgegaan sinds de vorige ronde. Filter op '
    + '"achteruit" in de lijst: dat is de beste aanleiding voor een gesprek.',
});

// Een bedrijf dat zich heeft afgemeld, zodat de demo ook die kant laat zien.
blokkeer(opDomein('dierenartsdepoot.nl'), 'gaf aan geen berichten meer te willen', tom!.id);

const alle = queryLeads({ maxScore: 100, limit: ALLE.length + 100, toonGeblokkeerd: true });

// Bij duizenden bedrijven past niet elk volledig rapport in één HTML-bestand.
// De volledige uitwerking gaat naar de bedrijven waar een agent ook echt mee
// begint: de hoogste prioriteiten, de vijftien uitgewerkte voorbeelden en alles
// wat al in behandeling is. De rest houdt zijn plek op de kaart en in de lijst.
const volledig = new Set<number>(
  [...alle].sort((a, b) => (b.prioriteit ?? 0) - (a.prioriteit ?? 0)).slice(0, detail).map((lead) => lead.id),
);
for (const lead of alle) {
  if (SITES.some((site) => site.domein === lead.domain) || lead.fase !== 'nieuw' || lead.geblokkeerd) {
    volledig.add(lead.id);
  }
}

const leads = alle.map((lead) => {
  if (!volledig.has(lead.id)) {
    return { ...lead, uitgewerkt: false as const };
  }
  const full = getLead(lead.id)!;
  const report = full.report as {
    verdict?: never; signals?: never; leven?: never; prioriteit?: { uitleg: string };
  };
  const rapportInput = {
    companyName: lead.name, domain: lead.domain, city: lead.city,
    verdict: report.verdict!, signals: report.signals ?? null,
  };
  const context = {
    bedrijf: lead.name, domein: lead.domain, plaats: lead.city,
    verdict: report.verdict!, signals: report.signals ?? null,
  };
  // Mag je niet bellen, dan is toestemming vragen de eerste stap — precies
  // zoals het dashboard het voorstelt.
  const voorgesteld = stelSjabloonVoor(report.verdict!, magBellen(lead).mag);
  return {
    ...lead,
    uitgewerkt: true as const,
    verdict: report.verdict,
    signals: report.signals ?? null,
    voorgesteldSjabloon: voorgesteld,
    levenRapport: report.leven ?? null,
    prioriteitUitleg: report.prioriteit?.uitleg ?? null,
    pitch: {
      subject: renderSjabloon(voorgesteld, context).onderwerp,
      body: renderSjabloon(voorgesteld, context).tekst,
      markdown: buildReport(rapportInput),
    },
  };
});

const samenvatting = {
  bedrijven: leads.length,
  slecht: leads.filter((lead) => (lead.score ?? 0) < 50).length,
  matig: leads.filter((lead) => (lead.score ?? 0) >= 50 && (lead.score ?? 0) < 70).length,
  goed: leads.filter((lead) => (lead.score ?? 0) >= 70).length,
  onbereikbaar: leads.filter((lead) => lead.scan_status !== 'ok').length,
  gemiddelde: Math.round(leads.reduce((sum, lead) => sum + (lead.score ?? 0), 0) / leads.length),
};

mkdirSync('demo/out', { recursive: true });
writeFileSync('demo/out/demo-data.json',
  JSON.stringify({ gegenereerdOp: new Date().toISOString(), samenvatting, leads }, null, 2));

console.log('\nDe vijftien uitgewerkte voorbeelden:');
for (const lead of leads.filter((lead) => SITES.some((site) => site.domein === lead.domain))
  .sort((a, b) => (a.score ?? 0) - (b.score ?? 0))) {
  console.log(`  ${String(lead.score).padStart(3)}  ${lead.grade}  ${lead.name.padEnd(34)} ${(lead.topIssues[0]?.title ?? '').slice(0, 52)}`);
}
console.log('\n', samenvatting);
console.log('\nGeschreven naar demo/out/demo-data.json');
