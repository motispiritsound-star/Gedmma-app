process.env.WEBSCAN_HOST_DELAY_MS = '1';
process.env.WEBSCAN_DB = './data/test.db';

import { startFixtureServer } from './fixtures.ts';
const { server, port } = await startFixtureServer();
const base = `http://127.0.0.1:${port}`;

const { upsertCompanies, db } = await import('../src/db/index.ts');
const { scanAll } = await import('../src/scan/scanner.ts');
const { maakGebruiker } = await import('../src/db/team.ts');

upsertCompanies([
  { name: 'Loodgietersbedrijf De Kraan', website: `${base}/slecht`, domain: 'dekraan.test', city: 'Utrecht', lat: 52.09, lon: 5.12, source: 'test' },
  { name: 'Van Dijk Installatie', website: `${base}/goed`, domain: 'vandijk.test', city: 'Utrecht', lat: 52.10, lon: 5.13, source: 'test' },
  { name: 'Kapotte Site BV', website: `${base}/kapot`, domain: 'kapot2.test', city: 'Amersfoort', lat: 52.15, lon: 5.38, source: 'test' },
]);
await scanAll(db().prepare("SELECT * FROM companies WHERE source = 'test'").all() as never[], { concurrency: 3 });

maakGebruiker({ naam: 'Eigenaar', email: 'eigenaar@test.nl', wachtwoord: 'testwachtwoord', rol: 'eigenaar' });
maakGebruiker({ naam: 'Agent Een', email: 'een@test.nl', wachtwoord: 'testwachtwoord' });
maakGebruiker({ naam: 'Agent Twee', email: 'twee@test.nl', wachtwoord: 'testwachtwoord' });

const { startServer } = await import('../src/server/index.ts');
const apiPoort = 4399;
await startServer(apiPoort);
const url = (pad: string) => `http://127.0.0.1:${apiPoort}${pad}`;

let mislukt = 0;
const check = (label: string, goed: boolean, extra = '') => {
  if (goed) console.log(`  ✓ ${label}`);
  else { mislukt++; console.error(`  ✗ ${label} ${extra}`); }
};

/** Houdt de sessiecookie per gebruiker vast, zoals een browser dat doet. */
function maakClient() {
  let cookie = '';
  return {
    async doe(pad: string, opties: RequestInit = {}) {
      const antwoord = await fetch(url(pad), {
        ...opties,
        headers: { ...(opties.body ? { 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}) },
      });
      const gezet = antwoord.headers.get('set-cookie');
      if (gezet) cookie = gezet.split(';')[0]!;
      const tekst = await antwoord.text();
      let inhoud: any = {};
      try { inhoud = JSON.parse(tekst); } catch { inhoud = tekst; }
      return { status: antwoord.status, inhoud };
    },
    async login(email: string, wachtwoord: string) {
      return this.doe('/api/login', { method: 'POST', body: JSON.stringify({ email, wachtwoord }) });
    },
  };
}

console.log('\nToegang:');
const gast = maakClient();
check('zonder login geen leads', (await gast.doe('/api/leads')).status === 401);
check('verkeerd wachtwoord wordt geweigerd', (await gast.login('eigenaar@test.nl', 'fout')).status === 401);

const eigenaar = maakClient();
check('eigenaar kan inloggen', (await eigenaar.login('eigenaar@test.nl', 'testwachtwoord')).status === 200);
check('sessie blijft staan', (await eigenaar.doe('/api/mij')).inhoud.ingelogd === true);

const een = maakClient();
const twee = maakClient();
await een.login('een@test.nl', 'testwachtwoord');
await twee.login('twee@test.nl', 'testwachtwoord');
check('agent mag niet bij het teamoverzicht', (await een.doe('/api/team')).status === 403);
check('eigenaar mag wel bij het teamoverzicht', (await eigenaar.doe('/api/team')).status === 200);

console.log('\nLeads en kaart:');
const leads = (await eigenaar.doe('/api/leads?maxScore=100&limit=50')).inhoud.leads;
check('leads komen terug', leads.length === 3, `kreeg ${leads.length}`);
check('gesorteerd op score', leads[0].score <= leads[2].score);
const kaart = (await eigenaar.doe('/api/kaart')).inhoud.punten;
check('kaartpunten hebben coördinaten', kaart.length === 3 && kaart.every((punt: any) => punt.lat && punt.lon));
check('kaartpunten zijn licht (geen rapport)', !('report' in kaart[0]));

const slechtste = leads[0];

console.log('\nSamenwerken aan een lead:');
check('agent één claimt de lead', (await een.doe(`/api/leads/${slechtste.id}/claim`, { method: 'POST' })).status === 200);
check('agent twee kan hem niet meer claimen', (await twee.doe(`/api/leads/${slechtste.id}/claim`, { method: 'POST' })).status === 409);
check('agent twee mag er niet in werken',
  (await twee.doe(`/api/leads/${slechtste.id}/fase`, { method: 'POST', body: JSON.stringify({ fase: 'gebeld' }) })).status === 403);
check('agent één mag dat wel',
  (await een.doe(`/api/leads/${slechtste.id}/fase`, { method: 'POST', body: JSON.stringify({ fase: 'gebeld', notitie: 'eigenaar gesproken' }) })).status === 200);

await een.doe(`/api/leads/${slechtste.id}/activiteit`, { method: 'POST', body: JSON.stringify({ soort: 'gebeld', notitie: 'wil offerte zien' }) });
const detail = (await een.doe(`/api/leads/${slechtste.id}`)).inhoud;
check('fase is bijgewerkt', detail.fase === 'gebeld', detail.fase);
check('geschiedenis is bijgehouden', detail.geschiedenis.length >= 2, `${detail.geschiedenis.length} regels`);
check('lead staat op naam van agent één', detail.agent_naam === 'Agent Een');

check('onbekende fase wordt geweigerd',
  (await een.doe(`/api/leads/${slechtste.id}/fase`, { method: 'POST', body: JSON.stringify({ fase: 'onzin' }) })).status === 400);

console.log('\nKlant en testimonial:');
check('klant vastleggen',
  (await een.doe(`/api/leads/${slechtste.id}/klant`, { method: 'POST', body: JSON.stringify({ maandbedrag: 24.5 }) })).status === 200);
const naKlant = (await eigenaar.doe('/api/team')).inhoud;
check('maandomzet klopt', naKlant.omzet.mrrCent === 2450, `kreeg ${naKlant.omzet.mrrCent}`);
check('omzet telt door naar de agent', naKlant.team.find((regel: any) => regel.naam === 'Agent Een').mrr_cent === 2450);
check('fase staat automatisch op klant', (await een.doe(`/api/leads/${slechtste.id}`)).inhoud.fase === 'klant');

check('testimonial opslaan', (await een.doe(`/api/leads/${slechtste.id}/testimonial`, {
  method: 'POST', body: JSON.stringify({ tekst: 'Prima geregeld', sterren: 5, publiceerbaar: true }),
})).status === 200);
check('lege testimonial wordt geweigerd', (await een.doe(`/api/leads/${slechtste.id}/testimonial`, {
  method: 'POST', body: JSON.stringify({ tekst: '  ' }),
})).status === 400);

console.log('\nToewijzen door de eigenaar:');
const tweede = leads[1];
check('eigenaar wijst toe', (await eigenaar.doe(`/api/leads/${tweede.id}/toewijzen`, {
  method: 'POST', body: JSON.stringify({ agentId: (await eigenaar.doe('/api/team')).inhoud.gebruikers.find((g: any) => g.email === 'twee@test.nl').id }),
})).status === 200);
check('agent mag niet toewijzen', (await een.doe(`/api/leads/${tweede.id}/toewijzen`, {
  method: 'POST', body: JSON.stringify({ agentId: null }),
})).status === 403);
check('lead staat nu bij agent twee', (await eigenaar.doe(`/api/leads/${tweede.id}`)).inhoud.agent_naam === 'Agent Twee');

console.log('\nOverig:');
const pitch = (await een.doe(`/api/leads/${slechtste.id}/pitch?bedrijf=Studio`)).inhoud;
check('concept-mail wordt gemaakt', Boolean(pitch.subject && pitch.body.includes('Studio')));
const csv = (await eigenaar.doe('/api/export.csv?maxScore=100')).inhoud;
check('csv-export werkt', typeof csv === 'string' && csv.split('\n').length >= 4);
check('uitloggen wist de sessie',
  (await een.doe('/api/uitloggen', { method: 'POST' })).status === 200 &&
  (await een.doe('/api/leads')).status === 401);

server.close();
console.log(mislukt === 0 ? '\nAlle controles geslaagd.\n' : `\n${mislukt} controle(s) mislukt.\n`);
process.exit(mislukt === 0 ? 0 : 1);
