/**
 * Feedback vanuit de applicatie, en de schakelaars die een testomgeving nodig
 * heeft: registratie dicht kunnen zetten en de omgeving herkenbaar maken.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  maakAdministratie,
  maakGebruiker,
  nieuweClient,
  startTestomgeving,
  stopTestomgeving,
  wisSnelheidsbegrenzing,
  type Administratie,
  type Gebruiker,
} from './hulp.ts';
import { verzondenBerichten, wisVerzonden } from '../src/mail/index.ts';
import { config } from '../src/config.ts';

let eigenaar: Gebruiker;
let admin: Administratie;
let meekijker: Gebruiker;

/** Nodigt iemand uit met een rol en levert een aangemelde client op. */
async function nodigUit(rol: string, naam: string): Promise<Gebruiker> {
  await wisSnelheidsbegrenzing();
  const email = `fb-${rol}-${Date.now()}-${Math.floor(Math.random() * 1000)}@voorbeeld.test`;
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
  assert.equal(aanmelding.status, 200);
  client.zetToken(aanmelding.body.token);

  const ik = await client.get('/api/v1/auth/me');
  return { client, gebruikerId: ik.body.gebruiker.id, email };
}

before(async () => {
  await startTestomgeving();
  eigenaar = await maakGebruiker('Feedback Eigenaar');
  admin = await maakAdministratie(eigenaar, { organisatie: 'Testkantoor', administratie: 'Testkantoor' });
});

after(async () => {
  await stopTestomgeving();
});

describe('feedback geven', () => {
  test('een opmerking komt binnen met scherm en versie erbij', async () => {
    const antwoord = await eigenaar.client.post(`/api/v1/organisaties/${admin.organisatieId}/feedback`, {
      soort: 'fout',
      bericht: 'Op het btw-overzicht mis ik de aansluiting met vak 5b.',
      scherm: '/cijfers/btw',
      versieApp: '0.1.0',
      administratieId: admin.administratieId,
    });
    assert.equal(antwoord.status, 201, JSON.stringify(antwoord.body));
    assert.match(antwoord.body.melding, /genoteerd/i);

    const lijst = await eigenaar.client.get(`/api/v1/organisaties/${admin.organisatieId}/feedback`);
    assert.equal(lijst.status, 200);
    assert.equal(lijst.body.items.length, 1);

    const item = lijst.body.items[0];
    assert.equal(item.soort, 'fout');
    assert.equal(item.scherm, '/cijfers/btw');
    assert.equal(item.status, 'nieuw');
    assert.equal(item.gebruiker_naam, 'Feedback Eigenaar');
    assert.equal(item.administratie_naam, 'Testkantoor');
    assert.equal(lijst.body.aantalNieuw, 1);
  });

  test('een lege of te korte opmerking wordt geweigerd', async () => {
    for (const bericht of ['', '  ', 'ok']) {
      const antwoord = await eigenaar.client.post(`/api/v1/organisaties/${admin.organisatieId}/feedback`, {
        bericht,
      });
      assert.equal(antwoord.status, 400, `"${bericht}" hoort geweigerd te worden`);
    }
  });

  test('ook een meekijker mag iets opmerken', async () => {
    meekijker = await nodigUit('viewer', 'Meekijker Mieke');

    const antwoord = await meekijker.client.post(`/api/v1/organisaties/${admin.organisatieId}/feedback`, {
      soort: 'wens',
      bericht: 'Ik zou de ouderdomsanalyse graag per klant willen kunnen filteren.',
      scherm: '/cijfers/ouderdom',
    });
    assert.equal(antwoord.status, 201, JSON.stringify(antwoord.body));
  });

  test('maar hij mag de binnengekomen opmerkingen niet lezen', async () => {
    const antwoord = await meekijker.client.get(`/api/v1/organisaties/${admin.organisatieId}/feedback`);
    assert.equal(antwoord.status, 403);
  });

  test('de tekst komt er ongewijzigd uit, ook met rare tekens erin', async () => {
    const raar = 'Let op: <script>alert(1)</script> & "aanhalingstekens" — en een emoji 🙂';
    const gemeld = await eigenaar.client.post(`/api/v1/organisaties/${admin.organisatieId}/feedback`, {
      bericht: raar,
    });
    assert.equal(gemeld.status, 201);

    const lijst = await eigenaar.client.get(`/api/v1/organisaties/${admin.organisatieId}/feedback`);
    const item = lijst.body.items.find((f: { bericht: string }) => f.bericht === raar);
    assert.ok(item, 'de tekst wordt opgeslagen zoals hij is ingetypt');
  });

  test('een opmerking afhandelen legt vast wie dat deed', async () => {
    const lijst = await eigenaar.client.get(`/api/v1/organisaties/${admin.organisatieId}/feedback`);
    const eerste = lijst.body.items.at(-1);

    const behandeld = await eigenaar.client.patch(
      `/api/v1/organisaties/${admin.organisatieId}/feedback/${eerste.id}`,
      { status: 'verwerkt', antwoord: 'Toegevoegd in de volgende versie.' },
    );
    assert.equal(behandeld.status, 200, JSON.stringify(behandeld.body));
    assert.equal(behandeld.body.status, 'verwerkt');

    const opnieuw = await eigenaar.client.get(
      `/api/v1/organisaties/${admin.organisatieId}/feedback?status=verwerkt`,
    );
    assert.equal(opnieuw.body.items.length, 1);
    assert.equal(opnieuw.body.items[0].antwoord, 'Toegevoegd in de volgende versie.');
    assert.ok(opnieuw.body.items[0].behandeld_op);
  });

  test('feedback van een andere organisatie is onzichtbaar', async () => {
    const ander = await maakGebruiker('Ander Kantoor');
    const anderAdmin = await maakAdministratie(ander, { organisatie: 'Ander', administratie: 'Ander' });

    await ander.client.post(`/api/v1/organisaties/${anderAdmin.organisatieId}/feedback`, {
      bericht: 'Dit hoort alleen bij het andere kantoor.',
    });

    const bijOns = await eigenaar.client.get(`/api/v1/organisaties/${admin.organisatieId}/feedback`);
    assert.ok(
      bijOns.body.items.every((f: { bericht: string }) => !f.bericht.includes('andere kantoor')),
      'geen feedback uit een andere organisatie',
    );

    const stiekem = await eigenaar.client.get(`/api/v1/organisaties/${anderAdmin.organisatieId}/feedback`);
    assert.equal(stiekem.status, 404, 'een organisatie waar je niet bij hoort, bestaat niet voor je');
  });

  test('het auditspoor legt vast dat er feedback is gegeven, zonder de tekst', async () => {
    const audit = await eigenaar.client.get(`/api/v1/administraties/${admin.administratieId}/audit?limiet=100`);
    const regel = audit.body.regels.find((r: { actie: string }) => r.actie === 'feedback.gegeven');
    assert.ok(regel, 'feedback geven staat in het auditspoor');
    assert.ok(
      !JSON.stringify(regel).includes('vak 5b'),
      'de tekst van de opmerking staat niet in de onwijzigbare keten',
    );
  });
});

describe('omgeving', () => {
  test('het aanmeldscherm weet of dit een testomgeving is', async () => {
    const client = nieuweClient();
    const antwoord = await client.get('/api/v1/auth/me');

    assert.equal(antwoord.status, 200);
    assert.equal(antwoord.body.aangemeld, false);
    assert.ok(antwoord.body.omgeving, 'ook zonder aanmelding is de omgeving bekend');
    assert.equal(typeof antwoord.body.omgeving.registratieOpen, 'boolean');
    assert.equal(antwoord.body.omgeving.label, config.omgevingLabel);
  });

  test('met registratie dicht kan niemand zichzelf aanmelden', async () => {
    const origineel = config.registratieOpen;
    Object.defineProperty(config, 'registratieOpen', { value: false, configurable: true });
    try {
      await wisSnelheidsbegrenzing();
      const client = nieuweClient();
      const antwoord = await client.post('/api/v1/auth/register', {
        email: `dicht-${Date.now()}@voorbeeld.test`,
        naam: 'Ongenode Gast',
        wachtwoord: 'een lang wachtwoord voor de test',
      });

      assert.equal(antwoord.status, 403);
      assert.match(antwoord.body.error.hint, /uitnodiging/i);
    } finally {
      Object.defineProperty(config, 'registratieOpen', { value: origineel, configurable: true });
    }
  });

  test('uitnodigen werkt wel als registratie dicht staat', async () => {
    const origineel = config.registratieOpen;
    Object.defineProperty(config, 'registratieOpen', { value: false, configurable: true });
    try {
      const genodigde = await nodigUit('bookkeeper', 'Genodigde Gijs');
      const ik = await genodigde.client.get('/api/v1/auth/me');
      assert.equal(ik.body.aangemeld, true, 'een uitnodiging blijft de weg naar binnen');
    } finally {
      Object.defineProperty(config, 'registratieOpen', { value: origineel, configurable: true });
    }
  });
});
