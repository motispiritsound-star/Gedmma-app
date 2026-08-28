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

process.env.WEBSCAN_DB = 'data/demo.db';
process.env.WEBSCAN_HOST_DELAY_MS = '1';
process.env.WEBSCAN_TIMEOUT_MS = '20000';

const { SITES, genereerSites, startDemoServers } = await import('./sites.ts');
const extra = Number(process.env.DEMO_EXTRA ?? 110);
const ALLE = [...SITES, ...genereerSites(extra)];
const servers = await startDemoServers(
  { key: readFileSync(keyPath, 'utf8'), cert: readFileSync(certPath, 'utf8') },
  ALLE,
);

const { upsertCompanies, db } = await import('../src/db/index.ts');
const { maakGebruiker, gebruikers } = await import('../src/db/team.ts');
const { wijsToe, zetFase, logActiviteit, maakKlant, bewaarTestimonial } = await import('../src/db/pipeline.ts');
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
  source: 'demo',
})));

const companies = db().prepare('SELECT * FROM companies ORDER BY id').all() as never[];
console.log(`${companies.length} nagemaakte bedrijfssites scannen…`);
await scanAll(companies, { concurrency: 5 });
servers.close();

// --- team, toewijzingen en klanten, zodat de demo een werkend platform toont ---
if (gebruikers().length === 0) {
  maakGebruiker({ naam: 'Ayoub Bekkali', email: 'ayoub@voorbeeld.nl', wachtwoord: 'demowachtwoord', rol: 'eigenaar' });
  maakGebruiker({ naam: 'Sara de Wit', email: 'sara@voorbeeld.nl', wachtwoord: 'demowachtwoord' });
  maakGebruiker({ naam: 'Tom Bakker', email: 'tom@voorbeeld.nl', wachtwoord: 'demowachtwoord' });
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

const leads = queryLeads({ maxScore: 100, limit: 500 }).map((lead) => {
  const full = getLead(lead.id)!;
  const report = full.report as { verdict?: never; signals?: never };
  const rapportInput = {
    companyName: lead.name, domain: lead.domain, city: lead.city,
    verdict: report.verdict!, signals: report.signals ?? null,
  };
  const context = {
    bedrijf: lead.name, domein: lead.domain, plaats: lead.city,
    verdict: report.verdict!, signals: report.signals ?? null,
  };
  const voorgesteld = stelSjabloonVoor(report.verdict!);
  return {
    ...lead,
    verdict: report.verdict,
    signals: report.signals ?? null,
    voorgesteldSjabloon: voorgesteld,
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
