/**
 * Tenantisolatie. Twee onafhankelijke organisaties, en de vraag: kan de een bij
 * de gegevens van de ander? Zowel via de API als rechtstreeks op de database.
 *
 * De metatest onderaan is de belangrijkste: hij faalt zodra iemand een tabel
 * met een administratie-scope toevoegt zonder row-level security-policy.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  btwCodeId,
  maakAdministratie,
  maakGebruiker,
  rekeningId,
  startTestomgeving,
  stopTestomgeving,
  zonderContext,
  type Administratie,
  type Gebruiker,
} from './hulp.ts';
import { inTransactie } from '../src/db/pool.ts';

let anna: Gebruiker;
let bram: Gebruiker;
let adminA: Administratie;
let adminB: Administratie;
let factuurA: string;
let klantA: string;

before(async () => {
  await startTestomgeving();

  anna = await maakGebruiker('Anna');
  bram = await maakGebruiker('Bram');
  adminA = await maakAdministratie(anna, { organisatie: 'Organisatie A', administratie: 'Admin A' });
  adminB = await maakAdministratie(bram, { organisatie: 'Organisatie B', administratie: 'Admin B' });

  const klant = await anna.client.post(`${adminA.pad}/relaties`, {
    naam: 'Klant van Anna',
    soort: 'klant',
    email: 'klant@anna.test',
    adres: { adres: 'Weg 1', postcode: '1000 AA', plaats: 'Stad' },
  });
  klantA = klant.body.id;

  const factuur = await anna.client.post(`${adminA.pad}/verkoopfacturen`, {
    contactId: klantA,
    factuurdatum: `${new Date().getUTCFullYear()}-02-01`,
    regels: [
      {
        omschrijving: 'Geheim werk',
        aantal: '1',
        prijs: '1000.00',
        btwCodeId: await btwCodeId(anna, adminA, 'VK-21'),
        rekeningId: await rekeningId(anna, adminA, '8000'),
      },
    ],
  });
  factuurA = factuur.body.id;
  await anna.client.post(`${adminA.pad}/verkoopfacturen/${factuurA}/definitief`);
});

after(async () => {
  await stopTestomgeving();
});

describe('via de API', () => {
  test('Bram ziet de administratie van Anna niet in zijn overzicht', async () => {
    const ik = await bram.client.get('/api/v1/auth/me');
    const administraties = ik.body.organisaties.flatMap((o: { administraties: { id: string }[] }) => o.administraties);
    assert.ok(!administraties.some((a: { id: string }) => a.id === adminA.administratieId));
  });

  test('Bram krijgt 404 op de administratie van Anna, niet 403', async () => {
    const antwoord = await bram.client.get(adminA.pad);
    assert.equal(antwoord.status, 404, 'het bestaan van een andere tenant mag niet afleidbaar zijn');
  });

  for (const [naam, pad] of [
    ['relaties', '/relaties'],
    ['verkoopfacturen', '/verkoopfacturen'],
    ['inkoopfacturen', '/inkoopfacturen'],
    ['banktransacties', '/banktransacties'],
    ['bankrekeningen', '/bankrekeningen'],
    ['documenten', '/documenten'],
    ['audit', '/audit'],
    ['dashboard', '/dashboard'],
  ] as const) {
    test(`Bram kan ${naam} van Anna niet opvragen`, async () => {
      const antwoord = await bram.client.get(`${adminA.pad}${pad}`);
      assert.equal(antwoord.status, 404, `${pad} lekte met status ${antwoord.status}`);
    });
  }

  test('Bram kan de factuur van Anna niet lezen', async () => {
    const antwoord = await bram.client.get(`${adminA.pad}/verkoopfacturen/${factuurA}`);
    assert.equal(antwoord.status, 404);
  });

  test('Bram kan niets aanmaken in de administratie van Anna', async () => {
    const antwoord = await bram.client.post(`${adminA.pad}/relaties`, { naam: 'Insluiper', soort: 'klant' });
    assert.equal(antwoord.status, 404);
  });

  test('Bram kan de relatie van Anna niet opvragen via zijn eigen administratie', async () => {
    const antwoord = await bram.client.get(`${adminB.pad}/relaties/${klantA}`);
    assert.equal(antwoord.status, 404, 'een id uit een andere tenant hoort niet te bestaan');
  });

  test('Bram kan de factuur van Anna niet crediteren via zijn eigen administratie', async () => {
    const antwoord = await bram.client.post(`${adminB.pad}/verkoopfacturen/${factuurA}/crediteer`, {});
    assert.equal(antwoord.status, 404);
  });

  test('zonder aanmelding komt er niets naar buiten', async () => {
    const { nieuweClient } = await import('./hulp.ts');
    const anoniem = nieuweClient();
    for (const pad of ['', '/relaties', '/verkoopfacturen', '/audit']) {
      const antwoord = await anoniem.get(`${adminA.pad}${pad}`);
      assert.equal(antwoord.status, 401, `${pad} gaf ${antwoord.status}`);
    }
  });
});

describe('rechtstreeks op de database (row-level security)', () => {
  test('zonder tenantcontext levert elke tenantgebonden tabel nul rijen', async () => {
    for (const tabel of [
      'contact',
      'sales_invoice',
      'sales_invoice_line',
      'journal_entry',
      'journal_line',
      'ledger_account',
      'bank_transaction',
      'document',
      'audit_event',
    ]) {
      const rijen = await zonderContext(`SELECT * FROM ${tabel} WHERE administration_id IS NOT NULL LIMIT 5`);
      assert.equal(rijen.length, 0, `${tabel} gaf ${rijen.length} rijen zonder tenantcontext`);
    }
  });

  test('met de context van B zijn de rijen van A onzichtbaar', async () => {
    await inTransactie(
      { organisatieId: adminB.organisatieId, administratieId: adminB.administratieId, gebruikerId: null, actorSoort: 'systeem' },
      async (client) => {
        const facturen = await client.query('SELECT id FROM sales_invoice');
        assert.equal(facturen.rows.length, 0, 'B ziet facturen van A');

        const gericht = await client.query('SELECT id FROM sales_invoice WHERE id = $1', [factuurA]);
        assert.equal(gericht.rows.length, 0, 'B ziet de factuur van A op id');

        const regels = await client.query('SELECT id FROM journal_line');
        assert.equal(regels.rows.length, 0, 'B ziet journaalregels van A');
      },
    );
  });

  test('met de context van B kan een rij van A niet worden gewijzigd of verwijderd', async () => {
    await inTransactie(
      { organisatieId: adminB.organisatieId, administratieId: adminB.administratieId, gebruikerId: null, actorSoort: 'systeem' },
      async (client) => {
        const gewijzigd = await client.query(`UPDATE contact SET naam = 'gekaapt' WHERE id = $1`, [klantA]);
        assert.equal(gewijzigd.rowCount, 0);

        const verwijderd = await client.query('DELETE FROM contact WHERE id = $1', [klantA]);
        assert.equal(verwijderd.rowCount, 0);
      },
    );

    await inTransactie(
      { organisatieId: adminA.organisatieId, administratieId: adminA.administratieId, gebruikerId: null, actorSoort: 'systeem' },
      async (client) => {
        const { rows } = await client.query<{ naam: string }>('SELECT naam FROM contact WHERE id = $1', [klantA]);
        assert.equal(rows[0]?.naam, 'Klant van Anna', 'de relatie van A is ongewijzigd');
      },
    );
  });

  test('met de context van B kan er niets in de administratie van A worden geschreven', async () => {
    await inTransactie(
      { organisatieId: adminB.organisatieId, administratieId: adminB.administratieId, gebruikerId: null, actorSoort: 'systeem' },
      async (client) => {
        await assert.rejects(
          () =>
            client.query(
              `INSERT INTO contact (administration_id, naam, soort, dedupe_sleutel) VALUES ($1, 'Insluiper', 'klant', 'insluiper')`,
              [adminA.administratieId],
            ),
          /row-level security|new row violates/i,
        );
      },
    );
  });
});

describe('metatest: elke tabel met een administratie-scope is beveiligd', () => {
  test('geen enkele tabel met administration_id mist een policy', async () => {
    const rijen = await zonderContext<{ tabel: string; rls: boolean; forced: boolean; policies: string }>(
      `SELECT c.relname AS tabel, c.relrowsecurity AS rls, c.relforcerowsecurity AS forced,
              (SELECT count(*)::text FROM pg_policy p WHERE p.polrelid = c.oid) AS policies
         FROM pg_class c
         JOIN pg_namespace n ON n.oid = c.relnamespace
         JOIN pg_attribute a ON a.attrelid = c.oid AND a.attname = 'administration_id' AND NOT a.attisdropped
        WHERE n.nspname = 'public' AND c.relkind = 'r'
        ORDER BY c.relname`,
    );

    assert.ok(rijen.length > 15, `verwachtte veel tenantgebonden tabellen, vond er ${rijen.length}`);
    for (const rij of rijen) {
      assert.equal(rij.rls, true, `${rij.tabel} heeft row-level security niet aan`);
      assert.equal(rij.forced, true, `${rij.tabel} heeft FORCE ROW LEVEL SECURITY niet aan`);
      assert.ok(Number(rij.policies) >= 1, `${rij.tabel} heeft geen policy`);
    }
  });

  test('de applicatierol mag row-level security niet omzeilen', async () => {
    const rijen = await zonderContext<{ rolbypassrls: boolean; rolsuper: boolean }>(
      `SELECT rolbypassrls, rolsuper FROM pg_roles WHERE rolname = current_user`,
    );
    assert.equal(rijen[0]?.rolbypassrls, false, 'de applicatierol heeft BYPASSRLS');
    assert.equal(rijen[0]?.rolsuper, false, 'de applicatierol is superuser');
  });

  test('de applicatierol mag auditregels niet wijzigen of verwijderen', async () => {
    const rechten = await zonderContext<{ update: boolean; delete: boolean }>(
      `SELECT has_table_privilege(current_user, 'audit_event', 'UPDATE') AS update,
              has_table_privilege(current_user, 'audit_event', 'DELETE') AS delete`,
    );
    assert.equal(rechten[0]?.update, false, 'de applicatierol mag audit_event wijzigen');
    assert.equal(rechten[0]?.delete, false, 'de applicatierol mag audit_event verwijderen');
  });
});
