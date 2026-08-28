process.env.WEBSCAN_HOST_DELAY_MS = '1';
process.env.WEBSCAN_DB = './data/test.db';

import assert from 'node:assert/strict';
import { rmSync } from 'node:fs';
import { startFixtureServer } from './fixtures.ts';

rmSync('./data/test.db', { force: true });
rmSync('./data/test.db-wal', { force: true });
rmSync('./data/test.db-shm', { force: true });

const { server, port } = await startFixtureServer();
const base = `http://127.0.0.1:${port}`;

const { scanCompany } = await import('../src/scan/scanner.ts');
const { upsertCompanies, db } = await import('../src/db/index.ts');

const company = (name: string, path: string) => {
  upsertCompanies([{ name, website: `${base}${path}`, domain: `${name}.test`, source: 'test' }]);
  return db().prepare('SELECT * FROM companies WHERE domain = ?').get(`${name}.test`) as any;
};

let failures = 0;
const check = (label: string, fn: () => void) => {
  try { fn(); console.log(`  ✓ ${label}`); }
  catch (error) { failures++; console.error(`  ✗ ${label}\n    ${(error as Error).message}`); }
};

console.log('\nSlechte website:');
const bad = await scanCompany(company('slecht', '/slecht'));
const badReport = bad.report as any;
check('status ok', () => assert.equal(bad.status, 'ok'));
check('score onder de 45', () => assert.ok(bad.score! < 45, `score was ${bad.score}`));
check('grade D of F', () => assert.match(bad.grade!, /[DF]/));
check('geen viewport gevonden', () => assert.ok(badReport.verdict.issues.some((i: any) => i.id === 'geen-viewport')));
check('verouderde tech gevonden', () => assert.ok(badReport.verdict.issues.some((i: any) => i.id === 'verouderde-tech')));
check('verouderde opmaak gevonden', () => assert.ok(badReport.verdict.issues.some((i: any) => i.id === 'verouderde-opmaak')));
check('geen titel gevonden', () => assert.ok(badReport.verdict.issues.some((i: any) => i.id === 'geen-titel')));
check('oud copyright gevonden', () => assert.ok(badReport.verdict.issues.some((i: any) => i.id === 'verouderde-inhoud')));
check('PHP 5.6 gedetecteerd', () => assert.ok(badReport.signals.tech.some((t: any) => t.name === 'PHP' && t.version === '5.6.40')));
check('jQuery 1.7.2 gedetecteerd', () => assert.ok(badReport.signals.tech.some((t: any) => t.name === 'jQuery' && t.version === '1.7.2')));
console.log(`  score=${bad.score} grade=${bad.grade} problemen=${badReport.verdict.issues.length}`);
console.log('  top:', badReport.verdict.topIssues.map((i: any) => i.id).join(', '));

console.log('\nGoede website:');
const good = await scanCompany(company('goed', '/goed'));
const goodReport = good.report as any;
check('score boven de 65', () => assert.ok(good.score! > 65, `score was ${good.score}`));
// De fixture draait op plain http op localhost, dus geen-https/geen-compressie horen erbij.
const LOCALHOST_ONLY = new Set(['geen-https', 'geen-compressie', 'geen-hsts']);
check('geen kritieke problemen', () => assert.deepEqual(
  goodReport.verdict.issues.filter((i: any) => i.severity === 'kritiek' && !LOCALHOST_ONLY.has(i.id)).map((i: any) => i.id), []));
check('telefoonnummer gevonden', () => assert.ok(goodReport.signals.contact.phones.length > 0));
check('e-mailadres gevonden', () => assert.ok(goodReport.signals.contact.emails.includes('info@goed.test')));
check('structured data gevonden', () => assert.ok(goodReport.signals.seo.jsonLdTypes.includes('LocalBusiness')));
check('linkedin gevonden', () => assert.ok(goodReport.signals.links.socials.includes('linkedin')));
console.log(`  score=${good.score} grade=${good.grade} problemen=${goodReport.verdict.issues.length}`);
console.log('  gevonden:', goodReport.verdict.issues.map((i: any) => i.id).join(', ') || '(geen)');

console.log('\nKapotte website:');
const broken = await scanCompany(company('kapot', '/kapot'));
check('status error', () => assert.equal(broken.status, 'error'));
check('score 0', () => assert.equal(broken.score, 0));

console.log('\nDraait het bedrijf nog?');
const levend = await scanCompany(company('levend', '/levend'));
const stil = await scanCompany(company('stil', '/stil'));
const levendRapport = levend.report as any;
const stilRapport = stil.report as any;

check('beide sites zijn even beroerd', () =>
  assert.ok(Math.abs(levend.score! - stil.score!) <= 12, `${levend.score} tegen ${stil.score}`));
check('het levende bedrijf scoort hoger op levenstekenen', () =>
  assert.ok(levend.leven! > stil.leven! + 25, `${levend.leven} tegen ${stil.leven}`));
check('en krijgt dus voorrang als lead', () =>
  assert.ok(levend.prioriteit! > stil.prioriteit!, `${levend.prioriteit} tegen ${stil.prioriteit}`));
check('de vacature telt mee', () =>
  assert.ok(levendRapport.leven.tekens.some((teken: any) => /personeel/i.test(teken.tekst))));
check('de online afspraak telt mee', () =>
  assert.ok(levendRapport.leven.tekens.some((teken: any) => /online/i.test(teken.tekst))));
check('het oude copyright telt tegen', () =>
  assert.ok(stilRapport.leven.twijfels.some((teken: any) => /copyright/i.test(teken.tekst))));
check('elk oordeel heeft een uitleg', () =>
  assert.equal(typeof levendRapport.prioriteit.uitleg, 'string'));
console.log(`  levend: site ${levend.score}, leven ${levend.leven}, prioriteit ${levend.prioriteit}`);
console.log(`  stil:   site ${stil.score}, leven ${stil.leven}, prioriteit ${stil.prioriteit}`);

console.log('\nGoede site scoort hoger dan slechte:');
check('rangorde klopt', () => assert.ok(good.score! > bad.score! + 25));

server.close();
console.log(failures === 0 ? '\nAlle controles geslaagd.\n' : `\n${failures} controle(s) mislukt.\n`);
process.exit(failures === 0 ? 0 : 1);
