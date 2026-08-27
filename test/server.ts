process.env.WEBSCAN_HOST_DELAY_MS = '1';
process.env.WEBSCAN_DB = './data/test.db';

import { startFixtureServer } from './fixtures.ts';
const { server, port } = await startFixtureServer();
const base = `http://127.0.0.1:${port}`;

const { upsertCompanies, db } = await import('../src/db/index.ts');
const { scanAll } = await import('../src/scan/scanner.ts');

upsertCompanies([
  { name: 'Loodgietersbedrijf De Kraan', website: `${base}/slecht`, domain: 'dekraan.test', city: 'Utrecht', source: 'test' },
  { name: 'Van Dijk Installatie', website: `${base}/goed`, domain: 'vandijk.test', city: 'Utrecht', source: 'test' },
  { name: 'Kapotte Site BV', website: `${base}/kapot`, domain: 'kapot2.test', city: 'Amersfoort', source: 'test' },
]);
const rows = db().prepare("SELECT * FROM companies WHERE source = 'test'").all() as any[];
await scanAll(rows as any, { concurrency: 3 });

const { startServer } = await import('../src/server/index.ts');
const apiPort = 4399;
await startServer(apiPort);

const get = async (path: string) => {
  const response = await fetch(`http://127.0.0.1:${apiPort}${path}`);
  return { status: response.status, body: await response.text() };
};

let failures = 0;
const check = (label: string, condition: boolean, extra = '') => {
  if (condition) console.log(`  ✓ ${label}`);
  else { failures++; console.error(`  ✗ ${label} ${extra}`); }
};

console.log('\nDashboard-API:');
const home = await get('/');
check('index.html wordt geserveerd', home.status === 200 && home.body.includes('Webscan NL'));

const stats = await get('/api/stats');
check('/api/stats geeft cijfers', stats.status === 200 && JSON.parse(stats.body).bedrijven >= 3);

const leads = await get('/api/leads?maxScore=55&limit=50');
const leadList = JSON.parse(leads.body).leads;
check('/api/leads geeft de slechte sites', leadList.length >= 2, `kreeg ${leadList.length}`);
check('leads staan op score gesorteerd', leadList[0].score <= leadList[leadList.length - 1].score);

const worst = leadList[0];
const detail = await get(`/api/leads/${worst.id}`);
check('/api/leads/:id geeft het volledige rapport', detail.status === 200 && JSON.parse(detail.body).report.verdict);

const pitch = await get(`/api/leads/${worst.id}/pitch?naam=Ayoub&bedrijf=Studio&telefoon=0612345678&email=a@b.nl`);
const pitchBody = JSON.parse(pitch.body);
check('/pitch geeft onderwerp en tekst', Boolean(pitchBody.subject && pitchBody.body));
check('pitch bevat de afzender', pitchBody.body.includes('Ayoub') && pitchBody.body.includes('Studio'));
check('pitch noemt een concreet probleem', pitchBody.body.includes('•'));
check('pitch bevat een rapport', pitchBody.report.includes('Scores per onderdeel'));

const statusUpdate = await fetch(`http://127.0.0.1:${apiPort}/api/leads/${worst.id}/status`, {
  method: 'POST', headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ status: 'benaderd', note: 'gebeld op maandag' }),
});
check('status bijwerken werkt', statusUpdate.status === 200);
const after = await get(`/api/leads?status=benaderd&maxScore=100`);
check('status is opgeslagen', JSON.parse(after.body).leads.some((lead: any) => lead.id === worst.id));

const csv = await get('/api/export.csv?maxScore=55');
check('CSV-export werkt', csv.status === 200 && csv.body.split('\n').length >= 3, csv.body.slice(0, 60));

console.log('\nVoorbeeld-mail voor de slechtste site:\n');
console.log(pitchBody.body.split('\n').slice(0, 12).map((line: string) => '  ' + line).join('\n'));

server.close();
console.log(failures === 0 ? '\nAlle controles geslaagd.\n' : `\n${failures} controle(s) mislukt.\n`);
process.exit(failures === 0 ? 0 : 1);
