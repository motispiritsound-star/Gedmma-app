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

process.env.WEBSCAN_DB = join(work, 'demo.db');
process.env.WEBSCAN_HOST_DELAY_MS = '1';
process.env.WEBSCAN_TIMEOUT_MS = '20000';

const { SITES, startDemoServers } = await import('./sites.ts');
const servers = await startDemoServers({
  key: readFileSync(keyPath, 'utf8'),
  cert: readFileSync(certPath, 'utf8'),
});

const { upsertCompanies, db } = await import('../src/db/index.ts');
const { scanAll } = await import('../src/scan/scanner.ts');
const { queryLeads, getLead } = await import('../src/report/leads.ts');
const { buildEmail, buildReport } = await import('../src/report/pitch.ts');

upsertCompanies(SITES.map((site) => ({
  name: site.bedrijf,
  website: servers.urlFor(site),
  domain: site.domein,
  city: site.plaats,
  branch: site.branche,
  source: 'demo',
})));

const companies = db().prepare('SELECT * FROM companies ORDER BY id').all() as never[];
console.log(`${companies.length} nagemaakte bedrijfssites scannen…`);
await scanAll(companies, { concurrency: 5 });
servers.close();

const leads = queryLeads({ maxScore: 100, limit: 500 }).map((lead) => {
  const full = getLead(lead.id)!;
  const report = full.report as { verdict?: never; signals?: never };
  const pitchInput = {
    companyName: lead.name, domain: lead.domain, city: lead.city,
    verdict: report.verdict!, signals: report.signals ?? null,
  };
  const { subject, body } = buildEmail(pitchInput);
  return {
    ...lead,
    verdict: report.verdict,
    signals: report.signals ?? null,
    pitch: { subject, body, markdown: buildReport(pitchInput) },
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

console.log('\nResultaat:');
for (const lead of [...leads].sort((a, b) => (a.score ?? 0) - (b.score ?? 0))) {
  console.log(`  ${String(lead.score).padStart(3)}  ${lead.grade}  ${lead.name.padEnd(34)} ${(lead.topIssues[0]?.title ?? '').slice(0, 52)}`);
}
console.log('\n', samenvatting);
console.log('\nGeschreven naar demo/out/demo-data.json');
