process.env.WEBSCAN_HOST_DELAY_MS = '1';
process.env.WEBSCAN_DB = './data/test.db';
// Een nagemaakte KVK, zodat het verrijken getest wordt zonder er echt te bellen.
process.env.KVK_API_KEY = 'testsleutel';
process.env.KVK_API_URL = 'http://127.0.0.1:4398/api';

// Elke run begint schoon; anders struikelt een tweede run over de accounts en
// de bedrijven die een vorige (afgebroken) run heeft achtergelaten.
import { rmSync } from 'node:fs';
for (const achtervoegsel of ['', '-wal', '-shm']) {
  rmSync(`${process.env.WEBSCAN_DB}${achtervoegsel}`, { force: true });
}

import { startFixtureServer } from './fixtures.ts';
const { server, port } = await startFixtureServer();
const base = `http://127.0.0.1:${port}`;

const { upsertCompanies, db } = await import('../src/db/index.ts');
const { scanAll } = await import('../src/scan/scanner.ts');
const { maakGebruiker } = await import('../src/db/team.ts');

upsertCompanies([
  { name: 'Loodgietersbedrijf De Kraan', website: `${base}/slecht`, domain: 'dekraan.test', city: 'Utrecht', lat: 52.09, lon: 5.12, rechtsvorm: 'eenmanszaak', source: 'test' },
  { name: 'Van Dijk Installatie', website: `${base}/goed`, domain: 'vandijk.test', city: 'Utrecht', lat: 52.10, lon: 5.13, rechtsvorm: 'bv', source: 'test' },
  { name: 'Kapotte Site BV', website: `${base}/kapot`, domain: 'kapot2.test', city: 'Amersfoort', lat: 52.15, lon: 5.38, rechtsvorm: 'bv', source: 'test' },
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

console.log('\nWie mag je bellen:');
const opDomein = (domein: string) => leads.find((rij: any) => rij.domain === domein)!;
const zaak = opDomein('dekraan.test');       // eenmanszaak
const vennootschap = opDomein('vandijk.test'); // bv
const derde = opDomein('kapot2.test');

const eenmanszaak = (await een.doe(`/api/leads/${zaak.id}`)).inhoud;
check('een eenmanszaak mag niet gebeld worden', eenmanszaak.bellen.mag === false, eenmanszaak.bellen.reden);
check('mailen mag wel', eenmanszaak.mailen.mag === true);
check('er staat bij wat je dan moet doen', Boolean(eenmanszaak.bellen.route));
check('een telefoontje wordt geweigerd', (await een.doe(`/api/leads/${zaak.id}/activiteit`, {
  method: 'POST', body: JSON.stringify({ soort: 'gebeld' }),
})).status === 403);
check('een mail mag wel', (await een.doe(`/api/leads/${zaak.id}/activiteit`, {
  method: 'POST', body: JSON.stringify({ soort: 'mail' }),
})).status === 200);
check('het voorgestelde sjabloon vraagt eerst om toestemming',
  (await een.doe(`/api/leads/${zaak.id}/mail`)).inhoud.sjabloon === 'toestemming-vragen');

check('toestemming zonder bewijs wordt geweigerd', (await een.doe(`/api/leads/${zaak.id}/toestemming`, {
  method: 'POST', body: JSON.stringify({ via: 'mailreactie', bewijs: '  ' }),
})).status === 400);
check('toestemming mét bewijs wordt vastgelegd', (await een.doe(`/api/leads/${zaak.id}/toestemming`, {
  method: 'POST', body: JSON.stringify({ via: 'mailreactie', bewijs: 'Mailde terug: prima, u mag bellen' }),
})).status === 200);
check('daarna mag bellen wel', (await een.doe(`/api/leads/${zaak.id}`)).inhoud.bellen.mag === true);
check('en wordt het telefoontje vastgelegd', (await een.doe(`/api/leads/${zaak.id}/activiteit`, {
  method: 'POST', body: JSON.stringify({ soort: 'gebeld' }),
})).status === 200);

const bv = (await eigenaar.doe(`/api/leads/${vennootschap.id}`)).inhoud;
check('een bv mag zonder toestemming gebeld worden', bv.bellen.mag === true, bv.bellen.reden);

check('afmelden lukt', (await eigenaar.doe(`/api/leads/${derde.id}/blokkeren`, {
  method: 'POST', body: JSON.stringify({ reden: 'wil geen berichten meer' }),
})).status === 200);
const naAfmelden = (await eigenaar.doe('/api/leads?maxScore=100&limit=50')).inhoud.leads;
check('een afgemeld bedrijf verdwijnt uit de lijst', !naAfmelden.some((rij: any) => rij.id === derde.id));
check('en uit de kaart', !(await eigenaar.doe('/api/kaart')).inhoud.punten.some((punt: any) => punt.id === derde.id));
check('bellen en mailen mag niet meer',
  (await eigenaar.doe(`/api/leads/${derde.id}/activiteit`, { method: 'POST', body: JSON.stringify({ soort: 'mail' }) })).status === 403);
check('een agent kan een blokkade niet opheffen', (await een.doe(`/api/leads/${derde.id}/blokkeren`, {
  method: 'POST', body: JSON.stringify({ opheffen: true }),
})).status === 403);
check('de eigenaar wel', (await eigenaar.doe(`/api/leads/${derde.id}/blokkeren`, {
  method: 'POST', body: JSON.stringify({ opheffen: true }),
})).status === 200);

console.log('\nDe mijlpaal: de opdracht binnenhalen:');
check('opdracht vastleggen', (await een.doe(`/api/leads/${slechtste.id}/fase`, {
  method: 'POST', body: JSON.stringify({ fase: 'opdracht', notitie: 'mag de site herbouwen' }),
})).status === 200);
const naOpdracht = (await eigenaar.doe('/api/overzicht')).inhoud;
check('opdracht telt mee', naOpdracht.opdrachten.totaal === 1, `kreeg ${naOpdracht.opdrachten.totaal}`);
check('opdracht telt in de laatste 30 dagen', naOpdracht.opdrachten.laatste30Dagen === 1);
check('opdracht is de mijlpaal in de faselijst',
  naOpdracht.fases.find((fase: any) => fase.id === 'opdracht')?.mijlpaal === true);
check('opdracht komt terug in het teamoverzicht',
  (await eigenaar.doe('/api/team')).inhoud.team.find((regel: any) => regel.naam === 'Agent Een').opdrachten === 1);

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

console.log('\nWie is waarmee bezig:');
const alles = (await twee.doe('/api/leads?maxScore=100&limit=50')).inhoud.leads;
const bezet = alles.find((rij: any) => rij.id === slechtste.id);
check('een agent ziet wie een lead in behandeling heeft', bezet.agent_naam === 'Agent Een');
check('en sinds wanneer', Boolean(bezet.toegewezen_op));
const vanCollegas = (await twee.doe('/api/leads?maxScore=100&collegas=1&limit=50')).inhoud.leads;
check('filter op leads van collega\'s werkt',
  vanCollegas.length === 1 && vanCollegas[0].id === slechtste.id, `kreeg ${vanCollegas.length}`);
const kaartMetAgent = (await twee.doe('/api/kaart')).inhoud.punten.find((punt: any) => punt.id === slechtste.id);
check('de kaart weet ook wie ermee bezig is', kaartMetAgent.agentId !== null && kaartMetAgent.agent === 'Agent Een');

console.log('\nToewijzen door de eigenaar:');
const tweede = leads[1];
check('eigenaar wijst toe', (await eigenaar.doe(`/api/leads/${tweede.id}/toewijzen`, {
  method: 'POST', body: JSON.stringify({ agentId: (await eigenaar.doe('/api/team')).inhoud.gebruikers.find((g: any) => g.email === 'twee@test.nl').id }),
})).status === 200);
check('agent mag niet toewijzen', (await een.doe(`/api/leads/${tweede.id}/toewijzen`, {
  method: 'POST', body: JSON.stringify({ agentId: null }),
})).status === 403);
check('lead staat nu bij agent twee', (await eigenaar.doe(`/api/leads/${tweede.id}`)).inhoud.agent_naam === 'Agent Twee');

console.log('\nMailsjablonen:');
const sjablonen = (await een.doe('/api/sjablonen')).inhoud.sjablonen;
check('sjablonen komen terug', sjablonen.length >= 10, `kreeg ${sjablonen.length}`);

const voorstel = (await een.doe(`/api/leads/${slechtste.id}/mail?bedrijf=Studio`)).inhoud;
check('sjabloon wordt voorgesteld op basis van de scan', voorstel.sjabloon === voorstel.voorgesteld, voorstel.sjabloon);
check('de tekst noemt de afzender', voorstel.tekst.includes('Studio'));
check('de tekst noemt het bedrijf', voorstel.tekst.includes(slechtste.name));
check('er is een onderwerp', voorstel.onderwerp.length > 10);
check('koude mail bevat een afmeldregel', voorstel.tekst.includes('uit mijn lijst'));

const bevestiging = (await een.doe(`/api/leads/${slechtste.id}/mail?sjabloon=opdracht-bevestigd`)).inhoud;
check('ander sjabloon geeft andere tekst', bevestiging.tekst !== voorstel.tekst);
check('opdrachtbevestiging noemt de hosting', bevestiging.tekst.includes('hosting'));
check('opdrachtbevestiging noemt het domein', bevestiging.tekst.includes(slechtste.domain));
check('onbekend sjabloon wordt geweigerd',
  (await een.doe(`/api/leads/${slechtste.id}/mail?sjabloon=bestaatniet`)).status === 400);

console.log('\nContactgegevens en verandering:');
const goedeLead = (await eigenaar.doe(`/api/leads/${vennootschap.id}`)).inhoud;
check('de lead levert het volledige contactblok', Boolean(goedeLead.contact.adres && goedeLead.contact.kvk),
  JSON.stringify(goedeLead.contact.adres));
check('met openingstijden', Boolean(goedeLead.contact.openingstijden));
const csvContact = (await eigenaar.doe('/api/export.csv?maxScore=100')).inhoud as string;
check('de export bevat adres en kvk', csvContact.includes('adres') && csvContact.includes('kvk'));

const geenVerandering = (await eigenaar.doe('/api/leads?achteruit=1&maxScore=100')).inhoud.leads;
check('zonder tweede scan is er niets achteruitgegaan', geenVerandering.length === 0);

console.log('\nWat je aanbiedt:');
const standaard = (await een.doe('/api/instellingen')).inhoud;
check('standaard is het gratis aanbod', standaard.aanbod.soort === 'gratis');
check('een agent kan het aanbod niet wijzigen', (await een.doe('/api/instellingen', {
  method: 'PUT', body: JSON.stringify({ soort: 'startbedrag' }),
})).status === 403);
const gewijzigd = (await eigenaar.doe('/api/instellingen', {
  method: 'PUT', body: JSON.stringify({ soort: 'startbedrag', startbedrag: 295, maandbedrag: 59 }),
})).inhoud;
check('de eigenaar wel', gewijzigd.aanbod.startbedragCent === 29500 && gewijzigd.aanbod.maandbedragCent === 5900);
check('het voorbeeld noemt de bedragen',
  gewijzigd.voorbeeld.includes('295') && gewijzigd.voorbeeld.includes('59'));
const naWijziging = (await eigenaar.doe(`/api/leads/${zaak.id}/mail?sjabloon=eerste-contact`)).inhoud;
check('de sjablonen nemen het nieuwe aanbod over', naWijziging.tekst.includes('295'));
await eigenaar.doe('/api/instellingen', { method: 'PUT', body: JSON.stringify({ soort: 'gratis' }) });
check('terug naar gratis werkt',
  (await eigenaar.doe(`/api/leads/${zaak.id}/mail?sjabloon=eerste-contact`)).inhoud.tekst.includes('kosteloos'));

console.log('\nVerrijken bij de KVK (met een nagemaakte KVK):');
const { createServer } = await import('node:http');
let kvkBevragingen = 0;
const nepKvk = createServer((verzoek, antwoord) => {
  const pad = new URL(verzoek.url ?? '/', 'http://127.0.0.1').pathname;
  antwoord.setHeader('content-type', 'application/json');
  if (pad === '/api/v2/zoeken') {
    const naam = new URL(verzoek.url ?? '/', 'http://127.0.0.1').searchParams.get('naam') ?? '';
    antwoord.end(JSON.stringify({ resultaten: [
      { kvkNummer: '12345678', naam, adres: { binnenlandsAdres: { plaats: 'Amersfoort' } }, type: 'hoofdvestiging' },
    ] }));
    return;
  }
  if (pad.startsWith('/api/v1/basisprofielen/')) {
    kvkBevragingen++;
    antwoord.end(JSON.stringify({
      kvkNummer: '12345678', naam: 'Kapotte Site B.V.',
      _embedded: { eigenaar: { rechtsvorm: 'Besloten Vennootschap' } },
    }));
    return;
  }
  antwoord.statusCode = 404;
  antwoord.end('{}');
});
await new Promise<void>((klaar) => nepKvk.listen(4398, '127.0.0.1', () => klaar()));

const kapot = leads.find((rij: any) => rij.domain === 'kapot2.test');
await eigenaar.doe(`/api/leads/${kapot.id}/rechtsvorm`, { method: 'POST', body: JSON.stringify({ rechtsvorm: '' }) });
check('rechtsvorm eerst leeggemaakt',
  (await eigenaar.doe(`/api/leads/${kapot.id}`)).inhoud.rechtsvorm === null);

const verrijkt = await eigenaar.doe(`/api/leads/${kapot.id}/verrijken`, { method: 'POST' });
check('de KVK levert de rechtsvorm', verrijkt.status === 200 && verrijkt.inhoud.rechtsvorm === 'bv');
check('en het KVK-nummer komt mee', verrijkt.inhoud.kvkNummer === '12345678');
check('er is precies één betaalde bevraging gedaan', kvkBevragingen === 1);
check('bellen mag nu, want het is een rechtspersoon', verrijkt.inhoud.bellen.mag === true);
check('het nummer staat ook op de lead',
  (await eigenaar.doe(`/api/leads/${kapot.id}`)).inhoud.kvk_number === '12345678');
check('het dashboard weet dat verrijken aanstaat',
  (await eigenaar.doe('/api/overzicht')).inhoud.kvk.beschikbaar === true);

// De slechtste lead staat hierboven al op naam van agent één.
check('een collega kan een toegewezen lead niet verrijken',
  (await twee.doe(`/api/leads/${slechtste.id}/verrijken`, { method: 'POST' })).status === 403);
nepKvk.close();

console.log('\nDe werklijst en de prognose:');
const { db: testDb } = await import('../src/db/index.ts');

// Een lead die vijf dagen geleden een mail kreeg en niet reageerde.
const stil = leads.find((rij: any) => rij.domain === 'vandijk.test');
const alleGebruikers = (await eigenaar.doe('/api/team')).inhoud.gebruikers;
const agentEen = alleGebruikers.find((rij: any) => rij.email === 'een@test.nl');
await eigenaar.doe(`/api/leads/${stil.id}/toewijzen`, {
  method: 'POST', body: JSON.stringify({ agentId: agentEen.id }),
});
await een.doe(`/api/leads/${stil.id}/activiteit`, {
  method: 'POST', body: JSON.stringify({ soort: 'mail', notitie: 'eerste contact' }),
});
testDb().prepare("UPDATE activiteiten SET op = datetime('now','-5 days') WHERE company_id = ?").run(stil.id);

const vandaag = (await een.doe('/api/vandaag')).inhoud;
const regel = vandaag.regels.find((rij: any) => rij.id === stil.id);
check('een lead zonder reactie komt op de werklijst', Boolean(regel));
check('met een reden erbij', /geen reactie/.test(regel?.waarom ?? ''), regel?.waarom);
check('en een sjabloon om mee op te volgen', regel?.sjabloon === 'geen-gehoor', regel?.sjabloon);
check('de teller telt hem als te laat', vandaag.druk.teLaat >= 1);

await een.doe(`/api/leads/${stil.id}/reactie`, { method: 'POST', body: JSON.stringify({ notitie: 'belt terug' }) });
testDb().prepare("UPDATE activiteiten SET op = datetime('now') WHERE company_id = ? AND soort = 'reactie'").run(stil.id);
const naReactie = (await een.doe('/api/vandaag')).inhoud;
check('na een reactie stopt de herinnering',
  !naReactie.regels.some((rij: any) => rij.id === stil.id && /geen reactie/.test(rij.waarom)));

check('een agent ziet alleen zijn eigen werk',
  (await twee.doe('/api/vandaag')).inhoud.regels.every((rij: any) => rij.id !== stil.id));
check('de eigenaar kan het hele team zien',
  (await eigenaar.doe('/api/vandaag?iedereen=1')).status === 200);

await eigenaar.doe('/api/doel', { method: 'PUT', body: JSON.stringify({ doel: 500 }) });
const vooruit = (await eigenaar.doe('/api/prognose')).inhoud;
check('het doel is vastgelegd', vooruit.doelMrrCent === 50000);
const zonderVoorraad = vooruit.fases
  .filter((rij: any) => rij.fase !== 'nieuw')
  .reduce((som: number, rij: any) => som + rij.verwachteMrrCent, 0);
check('de voorraad staat er wel bij maar telt niet mee in de pijplijn',
  vooruit.fases.some((rij: any) => rij.fase === 'nieuw')
  && vooruit.verwachteMrrCent === zonderVoorraad);
check('er is uitgerekend hoeveel opdrachten er nog nodig zijn', vooruit.opdrachtenNodig > 0);
check('een agent kan het doel niet wijzigen',
  (await een.doe('/api/doel', { method: 'PUT', body: JSON.stringify({ doel: 1 }) })).status === 403);

await eigenaar.doe('/api/instellingen', {
  method: 'PUT', body: JSON.stringify({ provisiePerOpdracht: 75, provisieMrrPercentage: 12 }),
});
const teamNa = (await eigenaar.doe('/api/team')).inhoud;
check('de provisieregeling is opgeslagen',
  teamNa.provisie.perOpdrachtCent === 7500 && teamNa.provisie.mrrPercentage === 12);
check('elke agent heeft een provisiebedrag',
  teamNa.team.every((rij: any) => typeof rij.provisie?.eenmaligCent === 'number'));

console.log('\nNieuws voor het team:');
const geplaatst = await eigenaar.doe('/api/nieuws', {
  method: 'POST',
  body: JSON.stringify({ titel: 'Nieuw aanbod vanaf maandag', tekst: 'Hosting gaat naar 19,50 per maand.', soort: 'update', vastgezet: true }),
});
check('de eigenaar kan een bericht plaatsen', geplaatst.status === 200 && geplaatst.inhoud.id > 0);
check('een agent kan dat niet',
  (await een.doe('/api/nieuws', { method: 'POST', body: JSON.stringify({ titel: 'Van mij', tekst: 'nee' }) })).status === 403);
check('een bericht zonder titel wordt geweigerd',
  (await eigenaar.doe('/api/nieuws', { method: 'POST', body: JSON.stringify({ titel: '', tekst: 'iets' }) })).status === 400);

const nieuwsVoorAgent = (await een.doe('/api/nieuws')).inhoud;
check('de agent ziet het bericht', nieuwsVoorAgent.items.length === 1);
check('en het staat als ongelezen', nieuwsVoorAgent.ongelezen === 1 && nieuwsVoorAgent.items[0].gelezen === 0);
check('de schrijver heeft niets ongelezen', (await eigenaar.doe('/api/nieuws')).inhoud.ongelezen === 0);
check('het overzicht telt het ongelezen bericht mee',
  (await een.doe('/api/overzicht')).inhoud.ongelezenNieuws === 1);

await een.doe('/api/nieuws/gelezen', { method: 'POST' });
check('na lezen is de teller leeg', (await een.doe('/api/nieuws')).inhoud.ongelezen === 0);
check('een agent kan het bericht niet weghalen',
  (await een.doe(`/api/nieuws/${geplaatst.inhoud.id}`, { method: 'DELETE' })).status === 403);
check('de eigenaar wel',
  (await eigenaar.doe(`/api/nieuws/${geplaatst.inhoud.id}`, { method: 'DELETE' })).status === 200);
check('en dan is het weg', (await een.doe('/api/nieuws')).inhoud.items.length === 0);

console.log('\nOverig:');
const csv = (await eigenaar.doe('/api/export.csv?maxScore=100')).inhoud;
check('csv-export werkt', typeof csv === 'string' && csv.split('\n').length >= 3);
check('de export bevat prioriteit en levenstekenen',
  typeof csv === 'string' && csv.includes('prioriteit') && csv.includes('levenstekenen'));
const opPrioriteit = (await eigenaar.doe('/api/leads?maxScore=100&sort=prioriteit&limit=50')).inhoud.leads;
check('standaard staan de beste leads bovenaan',
  opPrioriteit.every((rij: any, i: number) => i === 0 || rij.prioriteit <= opPrioriteit[i - 1].prioriteit));
check('uitloggen wist de sessie',
  (await een.doe('/api/uitloggen', { method: 'POST' })).status === 200 &&
  (await een.doe('/api/leads')).status === 401);

server.close();
console.log(mislukt === 0 ? '\nAlle controles geslaagd.\n' : `\n${mislukt} controle(s) mislukt.\n`);
process.exit(mislukt === 0 ? 0 : 1);
