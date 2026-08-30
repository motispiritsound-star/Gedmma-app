/**
 * Projecten en urenregistratie, van geschreven uur tot factuurregel.
 *
 * De belangrijkste vragen die deze test beantwoordt:
 *   - kloppen de minuten, en blijven ze kloppen als ze een bedrag worden?
 *   - kunnen dezelfde uren twee keer op een factuur belanden? (nee)
 *   - kan iemand zijn eigen uren goedkeuren? (nee)
 *   - ziet een medewerker de uren van zijn collega's? (nee)
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  btwCodeId,
  maakAdministratie,
  maakGebruiker,
  nieuweClient,
  rekeningId,
  startTestomgeving,
  stopTestomgeving,
  wisSnelheidsbegrenzing,
  type Administratie,
  type Gebruiker,
} from './hulp.ts';
import { verzondenBerichten, wisVerzonden } from '../src/mail/index.ts';
import { minutenAlsTekst, minutenAlsUren } from '../src/modules/uren/factureren.ts';

let eigenaar: Gebruiker;
let medewerker: Gebruiker;
let admin: Administratie;
let klantId: string;
let projectId: string;
let omzetId: string;
let btw21: string;

const jaar = new Date().getUTCFullYear();
const d = (maand: number, dag: number) =>
  `${jaar}-${String(maand).padStart(2, '0')}-${String(dag).padStart(2, '0')}`;

/** Nodigt iemand uit met een rol en levert een aangemelde client op. */
async function nodigUit(rol: string, naam: string): Promise<Gebruiker> {
  await wisSnelheidsbegrenzing();
  const email = `uren-${rol}-${Date.now()}-${Math.floor(Math.random() * 1000)}@voorbeeld.test`;
  wisVerzonden();

  const uitnodiging = await eigenaar.client.post(`/api/v1/organisaties/${admin.organisatieId}/leden`, {
    email,
    rol,
  });
  assert.equal(uitnodiging.status, 201, JSON.stringify(uitnodiging.body));

  const token = /token=([\w-]+)/.exec(verzondenBerichten().at(-1)?.tekst ?? '')?.[1];
  assert.ok(token, 'de uitnodigingsmail bevat een token');

  const client = nieuweClient();
  const wachtwoord = 'een lang wachtwoord voor de genodigde';
  const geaccepteerd = await client.post('/api/v1/auth/invitations/accept', { token, naam, wachtwoord });
  assert.equal(geaccepteerd.status, 200, JSON.stringify(geaccepteerd.body));

  await wisSnelheidsbegrenzing();
  const aanmelding = await client.post('/api/v1/auth/login', { email, wachtwoord });
  assert.equal(aanmelding.status, 200, JSON.stringify(aanmelding.body));
  client.zetToken(aanmelding.body.token);

  const ik = await client.get('/api/v1/auth/me');
  return { client, gebruikerId: ik.body.gebruiker.id, email };
}

before(async () => {
  await startTestomgeving();
  eigenaar = await maakGebruiker('Uren Eigenaar');
  admin = await maakAdministratie(eigenaar, { organisatie: 'Urenbureau', administratie: 'Urenbureau' });

  omzetId = await rekeningId(eigenaar, admin, '8000');
  btw21 = await btwCodeId(eigenaar, admin, 'VK-21');

  const klant = await eigenaar.client.post(`${admin.pad}/relaties`, {
    naam: 'Opdrachtgever Noord',
    soort: 'klant',
    email: 'facturen@noord.test',
    betalingstermijnDagen: 30,
  });
  assert.equal(klant.status, 201);
  klantId = klant.body.id;
});

after(async () => {
  await stopTestomgeving();
});

describe('minuten omrekenen', () => {
  test('een half uur is 0,5 en honderd minuten is 1,666667', () => {
    assert.equal(minutenAlsUren(30).toString(), '0.500000');
    assert.equal(minutenAlsUren(90).toString(), '1.500000');
    assert.equal(minutenAlsUren(100).toString(), '1.666666');
    assert.equal(minutenAlsUren(480).toString(), '8.000000');
  });

  test('de tekst is leesbaar voor een mens', () => {
    assert.equal(minutenAlsTekst(30), '30 minuten');
    assert.equal(minutenAlsTekst(60), '1 uur');
    assert.equal(minutenAlsTekst(100), '1 uur 40 minuten');
  });
});

describe('projecten', () => {
  test('een project op uurtarief kan niet zonder tarief', async () => {
    const antwoord = await eigenaar.client.post(`${admin.pad}/projecten`, {
      naam: 'Project zonder tarief',
      facturatie: 'uurtarief',
    });
    assert.equal(antwoord.status, 400);
    assert.match(antwoord.body.error.message, /tarief/i);
  });

  test('een project aanmaken levert een code op', async () => {
    const antwoord = await eigenaar.client.post(`${admin.pad}/projecten`, {
      naam: 'Herinrichting website',
      contactId: klantId,
      facturatie: 'uurtarief',
      uurtarief: '95.00',
      budgetMinuten: 6000,
      btwCodeId: btw21,
      rekeningId: omzetId,
    });
    assert.equal(antwoord.status, 201, JSON.stringify(antwoord.body));
    assert.match(antwoord.body.code, /^P\d{4}$/);
    projectId = antwoord.body.id;
  });

  test('een activiteit erft het projecttarief tenzij hij zijn eigen tarief heeft', async () => {
    const overleg = await eigenaar.client.post(`${admin.pad}/projecten/${projectId}/activiteiten`, {
      naam: 'Overleg',
    });
    assert.equal(overleg.status, 201);

    const reistijd = await eigenaar.client.post(`${admin.pad}/projecten/${projectId}/activiteiten`, {
      naam: 'Reistijd',
      uurtarief: '45.00',
    });
    assert.equal(reistijd.status, 201);

    const project = await eigenaar.client.get(`${admin.pad}/projecten/${projectId}`);
    assert.equal(project.body.activiteiten.length, 2);
  });
});

describe('uren schrijven', () => {
  test('uren komen binnen met het tarief van het project', async () => {
    const antwoord = await eigenaar.client.post(`${admin.pad}/uren`, {
      projectId,
      datum: d(3, 2),
      minuten: 480,
      omschrijving: 'Ontwerpsessie en uitwerking',
    });
    assert.equal(antwoord.status, 201, JSON.stringify(antwoord.body));

    const gelezen = await eigenaar.client.get(`${admin.pad}/uren/${antwoord.body.id}`);
    assert.equal(gelezen.body.uur.uurtarief, '95.00');
    assert.equal(gelezen.body.uur.status, 'concept');
    assert.equal(gelezen.body.uur.factureerbaar, true);
  });

  test('een activiteit met een eigen tarief overschrijft dat van het project', async () => {
    const project = await eigenaar.client.get(`${admin.pad}/projecten/${projectId}`);
    const reistijd = project.body.activiteiten.find((a: { naam: string }) => a.naam === 'Reistijd');

    const antwoord = await eigenaar.client.post(`${admin.pad}/uren`, {
      projectId,
      activiteitId: reistijd.id,
      datum: d(3, 2),
      minuten: 90,
      omschrijving: 'Naar de klant en terug',
    });
    assert.equal(antwoord.status, 201);

    const gelezen = await eigenaar.client.get(`${admin.pad}/uren/${antwoord.body.id}`);
    assert.equal(gelezen.body.uur.uurtarief, '45.00');
  });

  test('nul minuten of meer dan een etmaal wordt geweigerd', async () => {
    for (const minuten of [0, -30, 1441]) {
      const antwoord = await eigenaar.client.post(`${admin.pad}/uren`, {
        projectId,
        datum: d(3, 3),
        minuten,
        omschrijving: 'Onmogelijk',
      });
      assert.equal(antwoord.status, 400, `${minuten} minuten hoort geweigerd te worden`);
    }
  });

  test('op een afgerond project kan niet meer worden geschreven', async () => {
    const project = await eigenaar.client.post(`${admin.pad}/projecten`, {
      naam: 'Afgerond project',
      facturatie: 'niet',
    });
    await eigenaar.client.patch(`${admin.pad}/projecten/${project.body.id}`, {
      naam: 'Afgerond project',
      facturatie: 'niet',
      status: 'afgerond',
    });

    const antwoord = await eigenaar.client.post(`${admin.pad}/uren`, {
      projectId: project.body.id,
      datum: d(3, 4),
      minuten: 60,
      omschrijving: 'Nog even iets',
    });
    assert.equal(antwoord.status, 400);
    assert.match(antwoord.body.error.message, /niet meer worden geschreven/i);
  });

  test('het projectoverzicht telt de minuten op tegen het budget', async () => {
    const overzicht = await eigenaar.client.get(`${admin.pad}/projecten-overzicht`);
    const rij = overzicht.body.projecten.find((p: { project_id: string }) => p.project_id === projectId);

    assert.equal(rij.geschreven_minuten, 570, '480 + 90 minuten');
    assert.equal(rij.factureerbare_minuten, 570);
    assert.equal(rij.ongefactureerde_minuten, 570);
    assert.equal(rij.factureerbaar_nu_minuten, 0, 'nog niets goedgekeurd, dus nog niets te factureren');
    assert.equal(rij.gefactureerde_minuten, 0);
    assert.equal(rij.budget_minuten, 6000);
  });
});

describe('goedkeuren', () => {
  test('je eigen uren keur je niet zelf goed', async () => {
    const uren = await eigenaar.client.get(`${admin.pad}/uren?projectId=${projectId}`);
    const ids = uren.body.items.map((u: { id: string }) => u.id);

    const ingediend = await eigenaar.client.post(`${admin.pad}/uren/indienen`, { ids });
    assert.equal(ingediend.status, 200);
    assert.equal(ingediend.body.ingediend, ids.length);

    const beoordeeld = await eigenaar.client.post(`${admin.pad}/uren/beoordelen`, {
      ids,
      goedgekeurd: true,
    });
    assert.equal(beoordeeld.status, 400);
    assert.match(beoordeeld.body.error.message, /eigen uren/i);
  });

  test('een collega met het recht mag ze wel goedkeuren', async () => {
    const boekhouder = await nodigUit('bookkeeper', 'Boekhouder Bea');

    const uren = await eigenaar.client.get(`${admin.pad}/uren?projectId=${projectId}`);
    const ids = uren.body.items.map((u: { id: string }) => u.id);

    const beoordeeld = await boekhouder.client.post(`${admin.pad}/uren/beoordelen`, {
      ids,
      goedgekeurd: true,
    });
    assert.equal(beoordeeld.status, 200, JSON.stringify(beoordeeld.body));
    assert.equal(beoordeeld.body.verwerkt, ids.length);

    const opnieuw = await eigenaar.client.get(`${admin.pad}/uren?projectId=${projectId}`);
    assert.ok(opnieuw.body.items.every((u: { status: string }) => u.status === 'goedgekeurd'));
  });

  test('een gewijzigd uur verliest zijn goedkeuring', async () => {
    const uren = await eigenaar.client.get(`${admin.pad}/uren?projectId=${projectId}&status=goedgekeurd`);
    const uur = uren.body.items.find((u: { minuten: number }) => u.minuten === 90);

    const gewijzigd = await eigenaar.client.put(`${admin.pad}/uren/${uur.id}`, {
      projectId,
      activiteitId: uur.activity_id,
      datum: uur.datum,
      minuten: 120,
      omschrijving: 'Naar de klant en terug, met file',
    });
    assert.equal(gewijzigd.status, 200, JSON.stringify(gewijzigd.body));

    const opnieuw = await eigenaar.client.get(`${admin.pad}/uren/${uur.id}`);
    assert.equal(opnieuw.body.uur.status, 'concept', 'goedkeuring ging over andere gegevens');
    assert.equal(opnieuw.body.uur.minuten, 120);
  });
});

describe('uren factureren', () => {
  test('goedgekeurde uren worden een conceptfactuur met een regel per tarief', async () => {
    // Het gewijzigde uur opnieuw laten goedkeuren.
    const boekhouder = await nodigUit('bookkeeper', 'Boekhouder Bram');
    const alle = await eigenaar.client.get(`${admin.pad}/uren?projectId=${projectId}`);
    await eigenaar.client.post(`${admin.pad}/uren/indienen`, {
      ids: alle.body.items.map((u: { id: string }) => u.id),
    });
    await boekhouder.client.post(`${admin.pad}/uren/beoordelen`, {
      ids: alle.body.items.map((u: { id: string }) => u.id),
      goedgekeurd: true,
    });

    const gefactureerd = await eigenaar.client.post(`${admin.pad}/uren/factureren`, {
      projectId,
      factuurdatum: d(3, 31),
    });
    assert.equal(gefactureerd.status, 201, JSON.stringify(gefactureerd.body));
    assert.equal(gefactureerd.body.uren, 2);
    assert.equal(gefactureerd.body.minuten, 600, '480 + 120 minuten');
    assert.equal(gefactureerd.body.regels, 2, 'twee tarieven, dus twee regels');

    const factuur = await eigenaar.client.get(`${admin.pad}/verkoopfacturen/${gefactureerd.body.factuurId}`);
    assert.equal(factuur.body.factuur.status, 'concept', 'factureren boekt nog niets');

    const regels = factuur.body.regels as { omschrijving: string; aantal: string; prijs: string; bedrag_exclusief: string }[];
    const werk = regels.find((r) => r.prijs === '95.00');
    const reis = regels.find((r) => r.prijs === '45.00');

    assert.equal(werk?.aantal, '8.000000');
    assert.equal(werk?.bedrag_exclusief, '760.00', '8 uur maal 95,00');
    assert.equal(reis?.aantal, '2.000000');
    assert.equal(reis?.bedrag_exclusief, '90.00', '2 uur maal 45,00');
    assert.equal(factuur.body.factuur.totaal_exclusief, '850.00');
    assert.equal(factuur.body.factuur.totaal_btw, '178.50');

    assert.match(werk?.omschrijving ?? '', /8 uur/);
    assert.match(reis?.omschrijving ?? '', /Reistijd/);
  });

  test('dezelfde uren komen niet nog een keer op een factuur', async () => {
    const nogmaals = await eigenaar.client.post(`${admin.pad}/uren/factureren`, {
      projectId,
      factuurdatum: d(3, 31),
    });
    assert.equal(nogmaals.status, 400);
    assert.match(nogmaals.body.error.message, /geen goedgekeurde/i);
  });

  test('een gefactureerd uur is niet meer te wijzigen of te verwijderen', async () => {
    const uren = await eigenaar.client.get(`${admin.pad}/uren?projectId=${projectId}&status=gefactureerd`);
    const uur = uren.body.items[0];
    assert.ok(uur, 'er staat een gefactureerd uur');
    assert.ok(uur.factuurnummer === null || typeof uur.factuurnummer === 'string');

    const gewijzigd = await eigenaar.client.put(`${admin.pad}/uren/${uur.id}`, {
      projectId,
      datum: uur.datum,
      minuten: 999,
      omschrijving: 'Stiekem aanpassen',
    });
    assert.equal(gewijzigd.status, 400);
    assert.match(gewijzigd.body.error.message, /gefactureerd/i);

    const verwijderd = await eigenaar.client.delete(`${admin.pad}/uren/${uur.id}`);
    assert.equal(verwijderd.status, 400);
  });

  test('het projectoverzicht laat zien wat er is gefactureerd', async () => {
    const overzicht = await eigenaar.client.get(`${admin.pad}/projecten-overzicht`);
    const rij = overzicht.body.projecten.find((p: { project_id: string }) => p.project_id === projectId);

    assert.equal(rij.gefactureerde_minuten, 600);
    assert.equal(rij.ongefactureerde_minuten, 0);
  });

  test('een project zonder klant kan niet worden gefactureerd', async () => {
    const project = await eigenaar.client.post(`${admin.pad}/projecten`, {
      naam: 'Project zonder klant',
      facturatie: 'uurtarief',
      uurtarief: '80.00',
    });
    const antwoord = await eigenaar.client.post(`${admin.pad}/uren/factureren`, {
      projectId: project.body.id,
    });
    assert.equal(antwoord.status, 400);
    assert.match(antwoord.body.error.message, /klant/i);
  });
});

describe('wie ziet welke uren', () => {
  test('een medewerker ziet alleen zijn eigen uren', async () => {
    medewerker = await nodigUit('employee', 'Medewerker Mo');

    const project = await eigenaar.client.post(`${admin.pad}/projecten`, {
      naam: 'Gedeeld project',
      contactId: klantId,
      facturatie: 'uurtarief',
      uurtarief: '70.00',
      btwCodeId: btw21,
      rekeningId: omzetId,
    });

    const eigen = await medewerker.client.post(`${admin.pad}/uren`, {
      projectId: project.body.id,
      datum: d(4, 1),
      minuten: 240,
      omschrijving: 'Uitwerking',
    });
    assert.equal(eigen.status, 201, JSON.stringify(eigen.body));

    const vanDeBaas = await eigenaar.client.post(`${admin.pad}/uren`, {
      projectId: project.body.id,
      datum: d(4, 1),
      minuten: 60,
      omschrijving: 'Nakijken',
    });
    assert.equal(vanDeBaas.status, 201);

    const lijst = await medewerker.client.get(`${admin.pad}/uren?projectId=${project.body.id}`);
    assert.equal(lijst.body.alleenEigenUren, true);
    assert.equal(lijst.body.items.length, 1, 'alleen het eigen uur');
    assert.equal(lijst.body.totaalMinuten, 240);

    const stiekem = await medewerker.client.get(`${admin.pad}/uren/${vanDeBaas.body.id}`);
    assert.equal(stiekem.status, 404, 'het uur van een collega bestaat niet voor hem');

    const wijzigen = await medewerker.client.put(`${admin.pad}/uren/${vanDeBaas.body.id}`, {
      projectId: project.body.id,
      datum: d(4, 1),
      minuten: 30,
      omschrijving: 'Aangepast',
    });
    assert.equal(wijzigen.status, 403);
  });

  test('een medewerker mag geen uren goedkeuren en geen project aanmaken', async () => {
    const goedkeuren = await medewerker.client.post(`${admin.pad}/uren/beoordelen`, {
      ids: ['00000000-0000-0000-0000-000000000001'],
      goedgekeurd: true,
    });
    assert.equal(goedkeuren.status, 403);

    const project = await medewerker.client.post(`${admin.pad}/projecten`, {
      naam: 'Eigen project',
      facturatie: 'niet',
    });
    assert.equal(project.status, 403);
  });

  test('de eigenaar ziet de uren van iedereen', async () => {
    const lijst = await eigenaar.client.get(`${admin.pad}/uren?vanaf=${d(4, 1)}&tot=${d(4, 1)}`);
    assert.equal(lijst.body.alleenEigenUren, false);
    assert.equal(lijst.body.items.length, 2);
    assert.equal(lijst.body.totaalMinuten, 300);
  });
});
