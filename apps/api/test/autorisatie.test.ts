/**
 * Rollen en rechten. Wie mag wat, en - net zo belangrijk - wie mag wat niet.
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

let eigenaar: Gebruiker;
let admin: Administratie;
let factuurId: string;

/** Nodigt iemand uit met een rol en levert een aangemelde client op. */
async function nodigUit(rol: string, naam: string): Promise<Gebruiker> {
  await wisSnelheidsbegrenzing();
  const email = `${rol}-${Date.now()}-${Math.floor(Math.random() * 1000)}@voorbeeld.test`;
  wisVerzonden();

  const uitnodiging = await eigenaar.client.post(`/api/v1/organisaties/${admin.organisatieId}/leden`, {
    email,
    rol,
  });
  assert.equal(uitnodiging.status, 201, JSON.stringify(uitnodiging.body));

  const bericht = verzondenBerichten().at(-1);
  const token = /token=([\w-]+)/.exec(bericht?.tekst ?? '')?.[1];
  assert.ok(token, 'de uitnodigingsmail bevat een token');

  const client = nieuweClient();
  const geaccepteerd = await client.post('/api/v1/auth/invitations/accept', {
    token,
    naam,
    wachtwoord: 'een lang wachtwoord voor de genodigde',
  });
  assert.equal(geaccepteerd.status, 200, JSON.stringify(geaccepteerd.body));

  await wisSnelheidsbegrenzing();
  const aanmelding = await client.post('/api/v1/auth/login', {
    email,
    wachtwoord: 'een lang wachtwoord voor de genodigde',
  });
  assert.equal(aanmelding.status, 200, JSON.stringify(aanmelding.body));
  client.zetToken(aanmelding.body.token);

  const ik = await client.get('/api/v1/auth/me');
  return { client, gebruikerId: ik.body.gebruiker.id, email };
}

before(async () => {
  await startTestomgeving();
  eigenaar = await maakGebruiker('Eigenaar');
  admin = await maakAdministratie(eigenaar, { organisatie: 'Rollen BV', administratie: 'Rollen BV' });

  const klant = await eigenaar.client.post(`${admin.pad}/relaties`, {
    naam: 'Testklant',
    soort: 'klant',
    email: 'klant@test.test',
    adres: { adres: 'Weg 1', postcode: '1000 AA', plaats: 'Stad' },
  });
  const factuur = await eigenaar.client.post(`${admin.pad}/verkoopfacturen`, {
    contactId: klant.body.id,
    factuurdatum: `${new Date().getUTCFullYear()}-02-01`,
    regels: [
      {
        omschrijving: 'Werk',
        aantal: '1',
        prijs: '100.00',
        btwCodeId: await btwCodeId(eigenaar, admin, 'VK-21'),
        rekeningId: await rekeningId(eigenaar, admin, '8000'),
      },
    ],
  });
  factuurId = factuur.body.id;
});

after(async () => {
  await stopTestomgeving();
});

describe('rol: meekijker', () => {
  let viewer: Gebruiker;

  test('kan lezen', async () => {
    viewer = await nodigUit('viewer', 'Vera Viewer');
    const facturen = await viewer.client.get(`${admin.pad}/verkoopfacturen`);
    assert.equal(facturen.status, 200);
    assert.equal(facturen.body.items.length, 1);
  });

  test('kan niets aanmaken', async () => {
    const antwoord = await viewer.client.post(`${admin.pad}/relaties`, { naam: 'Nieuw', soort: 'klant' });
    assert.equal(antwoord.status, 403);
    assert.equal(antwoord.body.error.code, 'forbidden');
    assert.match(antwoord.body.error.hint, /relatie\.schrijven/);
  });

  test('kan niets definitief maken', async () => {
    const antwoord = await viewer.client.post(`${admin.pad}/verkoopfacturen/${factuurId}/definitief`);
    assert.equal(antwoord.status, 403);
    assert.match(antwoord.body.error.hint, /journaal\.definitief/);
  });

  test('kan de audit trail niet inzien', async () => {
    const antwoord = await viewer.client.get(`${admin.pad}/audit`);
    assert.equal(antwoord.status, 403);
  });

  test('kan niet exporteren', async () => {
    const antwoord = await viewer.client.get(`${admin.pad}/verkoopfacturen/${factuurId}/ubl`);
    assert.equal(antwoord.status, 200, 'lezen van een factuur mag');
    // Exporteren van rapporten vereist een apart recht; controleren via de
    // rechtenlijst is duidelijker dan via een specifieke route.
    const administratie = await viewer.client.get(`${admin.pad}`);
    assert.ok(!administratie.body.rechten.includes('rapport.exporteren'));
  });
});

describe('rol: medewerker', () => {
  let medewerker: Gebruiker;

  test('mag bonnen vastleggen maar niet in het grootboek', async () => {
    medewerker = await nodigUit('employee', 'Mo Medewerker');

    const inkoop = await medewerker.client.get(`${admin.pad}/inkoopfacturen`);
    assert.equal(inkoop.status, 200);

    const rapport = await medewerker.client.get(
      `${admin.pad}/rapporten/balans?peildatum=${new Date().getUTCFullYear()}-12-31`,
    );
    assert.equal(rapport.status, 403, 'een medewerker ziet de cijfers van het bedrijf niet');

    const bank = await medewerker.client.get(`${admin.pad}/banktransacties`);
    assert.equal(bank.status, 403);
  });
});

describe('rol: boekhouder', () => {
  let boekhouder: Gebruiker;

  test('mag boeken en rapporteren', async () => {
    boekhouder = await nodigUit('bookkeeper', 'Bea Boekhouder');

    const rapport = await boekhouder.client.get(
      `${admin.pad}/rapporten/balans?peildatum=${new Date().getUTCFullYear()}-12-31`,
    );
    assert.equal(rapport.status, 200);

    const definitief = await boekhouder.client.post(`${admin.pad}/verkoopfacturen/${factuurId}/definitief`);
    assert.equal(definitief.status, 200);
  });

  test('mag geen gebruikers beheren en geen periode heropenen', async () => {
    const boekjaren = await boekhouder.client.get(`${admin.pad}/boekjaren`);
    const periodeId = boekjaren.body.perioden[0].id;

    const geblokkeerd = await boekhouder.client.post(`${admin.pad}/perioden/${periodeId}/status`, {
      status: 'geblokkeerd',
    });
    assert.equal(geblokkeerd.status, 200, 'blokkeren mag wel');

    const heropend = await boekhouder.client.post(`${admin.pad}/perioden/${periodeId}/status`, {
      status: 'open',
      reden: 'correctie',
    });
    assert.equal(heropend.status, 403, 'heropenen vereist een apart recht');
    assert.match(heropend.body.error.hint, /periode\.heropenen/);

    const leden = await boekhouder.client.get(`/api/v1/organisaties/${admin.organisatieId}/leden`);
    assert.equal(leden.status, 403);
  });
});

describe('rol: accountant', () => {
  let accountant: Gebruiker;

  test('mag wel een periode heropenen, met motivatie', async () => {
    accountant = await nodigUit('accountant', 'Ab Accountant');
    const boekjaren = await accountant.client.get(`${admin.pad}/boekjaren`);
    const periode = boekjaren.body.perioden.find((p: { status: string }) => p.status === 'geblokkeerd');
    assert.ok(periode, 'de boekhouder had een periode geblokkeerd');

    const zonderReden = await accountant.client.post(`${admin.pad}/perioden/${periode.id}/status`, {
      status: 'open',
    });
    assert.equal(zonderReden.status, 400, 'heropenen zonder motivatie kan niet');

    const metReden = await accountant.client.post(`${admin.pad}/perioden/${periode.id}/status`, {
      status: 'open',
      reden: 'Correctie op verzoek van de ondernemer.',
    });
    assert.equal(metReden.status, 200);

    const audit = await eigenaar.client.get(`${admin.pad}/audit?onderwerpSoort=accounting_period`);
    const heropend = audit.body.regels.find((r: { actie: string }) => r.actie === 'periode.heropend');
    assert.ok(heropend, 'het heropenen staat in de audit trail');
    assert.equal(heropend.gegevens.reden, 'Correctie op verzoek van de ondernemer.');
  });
});

describe('beheer van gebruikers', () => {
  test('de eigenaar kan de rol van een lid wijzigen', async () => {
    const leden = await eigenaar.client.get(`/api/v1/organisaties/${admin.organisatieId}/leden`);
    const viewer = leden.body.leden.find((l: { rol: string }) => l.rol === 'viewer');
    assert.ok(viewer);

    const gewijzigd = await eigenaar.client.patch(
      `/api/v1/organisaties/${admin.organisatieId}/leden/${viewer.membership_id}`,
      { rol: 'bookkeeper' },
    );
    assert.equal(gewijzigd.status, 200);
  });

  test('niemand kan zijn eigen rol wijzigen', async () => {
    const leden = await eigenaar.client.get(`/api/v1/organisaties/${admin.organisatieId}/leden`);
    const eigen = leden.body.leden.find((l: { rol: string }) => l.rol === 'owner');
    const antwoord = await eigenaar.client.patch(
      `/api/v1/organisaties/${admin.organisatieId}/leden/${eigen.membership_id}`,
      { rol: 'admin' },
    );
    assert.equal(antwoord.status, 403);
  });

  test('een rolwijziging trekt de sessies van die gebruiker in', async () => {
    const nieuweViewer = await nodigUit('viewer', 'Tijdelijke Meekijker');
    const leden = await eigenaar.client.get(`/api/v1/organisaties/${admin.organisatieId}/leden`);
    const lid = leden.body.leden.find((l: { user_id: string }) => l.user_id === nieuweViewer.gebruikerId);

    await eigenaar.client.patch(`/api/v1/organisaties/${admin.organisatieId}/leden/${lid.membership_id}`, {
      rol: 'employee',
    });

    const daarna = await nieuweViewer.client.get('/api/v1/auth/me');
    assert.equal(daarna.body.aangemeld, false, 'de oude sessie draagt oude rechten en wordt ingetrokken');
  });

  test('toegang intrekken werkt meteen', async () => {
    const tijdelijk = await nodigUit('viewer', 'Weg Zo Meteen');
    const leden = await eigenaar.client.get(`/api/v1/organisaties/${admin.organisatieId}/leden`);
    const lid = leden.body.leden.find((l: { user_id: string }) => l.user_id === tijdelijk.gebruikerId);

    const ingetrokken = await eigenaar.client.delete(
      `/api/v1/organisaties/${admin.organisatieId}/leden/${lid.membership_id}`,
    );
    assert.equal(ingetrokken.status, 200);

    const daarna = await tijdelijk.client.get(`${admin.pad}/verkoopfacturen`);
    assert.equal(daarna.status, 401, 'de sessie is ingetrokken');
  });

  test('de eigenaar kan niet worden verwijderd', async () => {
    const leden = await eigenaar.client.get(`/api/v1/organisaties/${admin.organisatieId}/leden`);
    const eigen = leden.body.leden.find((l: { rol: string }) => l.rol === 'owner');
    const antwoord = await eigenaar.client.delete(
      `/api/v1/organisaties/${admin.organisatieId}/leden/${eigen.membership_id}`,
    );
    assert.equal(antwoord.status, 403);
  });
});
