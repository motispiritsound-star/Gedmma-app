/**
 * De gevallen waar het in de praktijk misgaat: creditnota's, deelbetalingen,
 * btw-verlegd, gesloten perioden, dubbele documenten, onveranderbaarheid,
 * foutieve imports en nummerreeksen.
 */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  btwCodeId,
  inDb,
  maakAdministratie,
  maakGebruiker,
  rekeningId,
  startTestomgeving,
  stopTestomgeving,
  type Administratie,
  type Gebruiker,
} from './hulp.ts';

let gebruiker: Gebruiker;
let admin: Administratie;
let klantId: string;
let leverancierId: string;
let omzetId: string;
let kostenId: string;
let btw21: string;
let btwIn21: string;
let btwVerlegd: string;
let btwICL: string;

const jaar = new Date().getUTCFullYear();

async function maakFactuur(bedrag: string, btwCode = btw21, datum = `${jaar}-05-01`) {
  const antwoord = await gebruiker.client.post(`${admin.pad}/verkoopfacturen`, {
    contactId: klantId,
    factuurdatum: datum,
    regels: [{ omschrijving: 'Werk', aantal: '1', prijs: bedrag, btwCodeId: btwCode, rekeningId: omzetId }],
  });
  assert.equal(antwoord.status, 201, JSON.stringify(antwoord.body));
  return antwoord.body.id as string;
}

before(async () => {
  await startTestomgeving();
  gebruiker = await maakGebruiker('Randgeval');
  admin = await maakAdministratie(gebruiker, { organisatie: 'Randgevallen BV', administratie: 'Randgevallen' });

  omzetId = await rekeningId(gebruiker, admin, '8000');
  kostenId = await rekeningId(gebruiker, admin, '4100');
  btw21 = await btwCodeId(gebruiker, admin, 'VK-21');
  btwIn21 = await btwCodeId(gebruiker, admin, 'IN-21');
  btwVerlegd = await btwCodeId(gebruiker, admin, 'IN-VERLEGD');
  btwICL = await btwCodeId(gebruiker, admin, 'VK-ICL');

  const klant = await gebruiker.client.post(`${admin.pad}/relaties`, {
    naam: 'Vaste Klant',
    soort: 'klant',
    email: 'vast@klant.test',
    btwNummer: 'BE0123456789',
    land: 'BE',
    adres: { adres: 'Straat 1', postcode: '1000', plaats: 'Brussel', land: 'BE' },
  });
  klantId = klant.body.id;

  const leverancier = await gebruiker.client.post(`${admin.pad}/relaties`, {
    naam: 'Vaste Leverancier',
    soort: 'leverancier',
    adres: { adres: 'Weg 9', postcode: '2000 AB', plaats: 'Stad' },
  });
  leverancierId = leverancier.body.id;
});

after(async () => {
  await stopTestomgeving();
});

describe('onveranderbaarheid van definitieve boekingen', () => {
  let factuurId: string;
  let postId: string;

  test('een definitieve factuur kan niet meer worden gewijzigd', async () => {
    factuurId = await maakFactuur('1000.00');
    const definitief = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuurId}/definitief`);
    assert.equal(definitief.status, 200, JSON.stringify(definitief.body));
    postId = definitief.body.postId;

    const wijziging = await gebruiker.client.put(`${admin.pad}/verkoopfacturen/${factuurId}`, {
      contactId: klantId,
      factuurdatum: `${jaar}-05-01`,
      regels: [{ omschrijving: 'Aangepast', aantal: '1', prijs: '1.00', btwCodeId: btw21, rekeningId: omzetId }],
    });
    assert.equal(wijziging.status, 422);
    assert.equal(wijziging.body.error.code, 'entry_immutable');
    assert.match(wijziging.body.error.hint, /creditnota/);
  });

  test('de database weigert een wijziging van een definitieve journaalpost', async () => {
    await assert.rejects(
      () =>
        inDb(admin.administratieId, admin.organisatieId, (client) =>
          client.query(`UPDATE journal_entry SET omschrijving = 'gemanipuleerd' WHERE id = $1`, [postId]),
        ),
      /definitief en kan niet worden gewijzigd/,
    );
  });

  test('de database weigert het verwijderen van een definitieve journaalpost', async () => {
    await assert.rejects(
      () =>
        inDb(admin.administratieId, admin.organisatieId, (client) =>
          client.query('DELETE FROM journal_entry WHERE id = $1', [postId]),
        ),
      /kan niet worden verwijderd/,
    );
  });

  test('de database weigert het wijzigen van een regel van een definitieve post', async () => {
    await assert.rejects(
      () =>
        inDb(admin.administratieId, admin.organisatieId, (client) =>
          client.query('UPDATE journal_line SET debet = debet + 1 WHERE entry_id = $1', [postId]),
        ),
      /regels van een definitieve boeking/,
    );
  });

  test('de database weigert een boeking die niet in balans is', async () => {
    await assert.rejects(
      () =>
        inDb(admin.administratieId, admin.organisatieId, async (client) => {
          const dagboek = await client.query<{ id: string }>(
            `SELECT id FROM journal WHERE administration_id = $1 AND code = 'MEM'`,
            [admin.administratieId],
          );
          const periode = await client.query<{ id: string }>(
            `SELECT id FROM accounting_period WHERE administration_id = $1 ORDER BY nummer LIMIT 1`,
            [admin.administratieId],
          );
          const post = await client.query<{ id: string }>(
            `INSERT INTO journal_entry (administration_id, journal_id, period_id, boekdatum, omschrijving, valuta, status)
             VALUES ($1, $2, $3, $4, 'Scheve boeking', 'EUR', 'concept') RETURNING id`,
            [admin.administratieId, dagboek.rows[0]?.id, periode.rows[0]?.id, `${jaar}-01-15`],
          );
          const postId2 = post.rows[0]?.id;
          await client.query(
            `INSERT INTO journal_line (administration_id, entry_id, regelnummer, ledger_account_id, debet, credit)
             VALUES ($1, $2, 1, $3, 100, 0), ($1, $2, 2, $4, 0, 99)`,
            [admin.administratieId, postId2, omzetId, kostenId],
          );
          await client.query(
            `UPDATE journal_entry SET status = 'definitief', totaal_debet = 100, totaal_credit = 99 WHERE id = $1`,
            [postId2],
          );
        }),
      /niet in balans/,
    );
  });

  test('een regel met debet en credit tegelijk wordt door de database geweigerd', async () => {
    await assert.rejects(
      () =>
        inDb(admin.administratieId, admin.organisatieId, (client) =>
          client.query(
            `INSERT INTO journal_line (administration_id, entry_id, regelnummer, ledger_account_id, debet, credit)
             VALUES ($1, $2, 99, $3, 10, 10)`,
            [admin.administratieId, postId, omzetId],
          ),
        ),
      /regel_een_kant|definitieve boeking/,
    );
  });

  test('corrigeren gaat via een tegenboeking en laat beide posten staan', async () => {
    const gestorneerd = await gebruiker.client.post(`${admin.pad}/journaalposten/${postId}/storneer`, {
      omschrijving: 'Correctie: verkeerd bedrag',
    });
    assert.equal(gestorneerd.status, 201);

    const origineel = await gebruiker.client.get(`${admin.pad}/journaalposten/${postId}`);
    assert.equal(origineel.body.post.status, 'gestorneerd');
    assert.equal(origineel.body.post.gestorneerd_door_id, gestorneerd.body.postId);

    const tegen = await gebruiker.client.get(`${admin.pad}/journaalposten/${gestorneerd.body.postId}`);
    assert.equal(tegen.body.post.storneert_id, postId);
    assert.equal(tegen.body.post.totaal_debet, origineel.body.post.totaal_debet);

    // Debet en credit zijn omgedraaid.
    const origineleDebiteur = origineel.body.regels.find((r: { rekening_code: string }) => r.rekening_code === '1300');
    const tegenDebiteur = tegen.body.regels.find((r: { rekening_code: string }) => r.rekening_code === '1300');
    assert.equal(origineleDebiteur.debet, tegenDebiteur.credit);
  });
});

describe('creditnota en deelbetaling', () => {
  let factuurId: string;

  test('een creditnota keert de boeking om', async () => {
    factuurId = await maakFactuur('500.00');
    await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuurId}/definitief`);

    const credit = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuurId}/crediteer`, {
      reden: 'Klant heeft geretourneerd',
    });
    assert.equal(credit.status, 201);

    const definitief = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${credit.body.id}/definitief`);
    assert.equal(definitief.status, 200);
    assert.match(definitief.body.documentnummer, /^C\d{4}-\d{4}$/, 'creditnota heeft een eigen reeks');

    const post = await gebruiker.client.get(`${admin.pad}/journaalposten/${definitief.body.postId}`);
    const debiteuren = post.body.regels.find((r: { rekening_code: string }) => r.rekening_code === '1300');
    assert.equal(debiteuren.credit, '605.00', 'bij een creditnota staat de debiteur credit');
  });

  test('een deelbetaling laat het restant openstaan', async () => {
    const deelFactuur = await maakFactuur('1000.00');
    await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${deelFactuur}/definitief`);

    const rekeningen = await gebruiker.client.get(`${admin.pad}/bankrekeningen`);
    const bankId = rekeningen.body.bankrekeningen[0].id;

    await gebruiker.client.post(`${admin.pad}/bankrekeningen/${bankId}/import`, {
      bestandsnaam: 'deel.csv',
      inhoud: `Datum;Bedrag;Omschrijving\n${jaar}-05-15;500,00;Deelbetaling`,
    });
    const transacties = await gebruiker.client.get(`${admin.pad}/banktransacties?status=nieuw`);
    const transactie = transacties.body.items.find((t: { bedrag: string }) => t.bedrag === '500.00');

    const geboekt = await gebruiker.client.post(`${admin.pad}/banktransacties/${transactie.id}/boek`, {
      afletteringen: [{ factuurSoort: 'verkoopfactuur', factuurId: deelFactuur, bedrag: '500.00' }],
    });
    assert.equal(geboekt.status, 200);

    const factuur = await gebruiker.client.get(`${admin.pad}/verkoopfacturen/${deelFactuur}`);
    assert.equal(factuur.body.factuur.status, 'deels_betaald');
    assert.equal(factuur.body.factuur.betaald_bedrag, '500.00');
    assert.equal(factuur.body.factuur.totaal_inclusief, '1210.00');
  });

  test('meer koppelen dan er openstaat wordt geweigerd', async () => {
    const factuur = await maakFactuur('100.00');
    await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuur}/definitief`);

    const rekeningen = await gebruiker.client.get(`${admin.pad}/bankrekeningen`);
    const bankId = rekeningen.body.bankrekeningen[0].id;
    await gebruiker.client.post(`${admin.pad}/bankrekeningen/${bankId}/import`, {
      bestandsnaam: 'teveel.csv',
      inhoud: `Datum;Bedrag;Omschrijving\n${jaar}-05-16;999,00;Te veel`,
    });
    const transacties = await gebruiker.client.get(`${admin.pad}/banktransacties?status=nieuw`);
    const transactie = transacties.body.items.find((t: { bedrag: string }) => t.bedrag === '999.00');

    const geboekt = await gebruiker.client.post(`${admin.pad}/banktransacties/${transactie.id}/boek`, {
      afletteringen: [{ factuurSoort: 'verkoopfactuur', factuurId: factuur, bedrag: '999.00' }],
    });
    assert.equal(geboekt.status, 400);
    assert.match(geboekt.body.error.message, /meer dan er openstaat/);
  });

  test('een betalingsverschil binnen de tolerantie gaat naar een eigen rekening', async () => {
    const factuur = await maakFactuur('100.00');
    await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuur}/definitief`);

    const rekeningen = await gebruiker.client.get(`${admin.pad}/bankrekeningen`);
    const bankId = rekeningen.body.bankrekeningen[0].id;
    await gebruiker.client.post(`${admin.pad}/bankrekeningen/${bankId}/import`, {
      bestandsnaam: 'verschil.csv',
      inhoud: `Datum;Bedrag;Omschrijving\n${jaar}-05-17;120,99;Bijna precies`,
    });
    const transacties = await gebruiker.client.get(`${admin.pad}/banktransacties?status=nieuw`);
    const transactie = transacties.body.items.find((t: { bedrag: string }) => t.bedrag === '120.99');

    const geboekt = await gebruiker.client.post(`${admin.pad}/banktransacties/${transactie.id}/boek`, {
      afletteringen: [{ factuurSoort: 'verkoopfactuur', factuurId: factuur, bedrag: '121.00' }],
    });
    assert.equal(geboekt.status, 200, JSON.stringify(geboekt.body));

    const post = await gebruiker.client.get(`${admin.pad}/journaalposten/${geboekt.body.postId}`);
    const verschil = post.body.regels.find((r: { rekening_code: string }) => r.rekening_code === '4990');
    assert.ok(verschil, 'het verschil staat op een eigen regel, niet stilzwijgend verwerkt');
    assert.equal(verschil.debet, '0.01');
  });
});

describe('btw-verlegd en intracommunautaire levering', () => {
  test('bij inkoop met verlegde btw wordt zowel gevorderd als afgedragen', async () => {
    const inkoop = await gebruiker.client.post(`${admin.pad}/inkoopfacturen`, {
      contactId: leverancierId,
      leveranciersnummer: 'VERLEGD-001',
      factuurdatum: `${jaar}-06-01`,
      regels: [{ omschrijving: 'Dienst uit Ierland', prijs: '1000.00', btwCodeId: btwVerlegd, rekeningId: kostenId }],
    });
    assert.equal(inkoop.status, 201, JSON.stringify(inkoop.body));

    const definitief = await gebruiker.client.post(`${admin.pad}/inkoopfacturen/${inkoop.body.id}/definitief`);
    assert.equal(definitief.status, 200);

    const post = await gebruiker.client.get(`${admin.pad}/journaalposten/${definitief.body.postId}`);
    const regels = post.body.regels as { rekening_code: string; debet: string; credit: string }[];
    assert.equal(regels.find((r) => r.rekening_code === '4100')?.debet, '1000.00');
    assert.equal(regels.find((r) => r.rekening_code === '1520')?.debet, '210.00', 'te vorderen');
    assert.equal(regels.find((r) => r.rekening_code === '1510')?.credit, '210.00', 'af te dragen');
    assert.equal(regels.find((r) => r.rekening_code === '1600')?.credit, '1000.00', 'leverancier krijgt 1000');
    assert.equal(post.body.post.totaal_debet, post.body.post.totaal_credit);
  });

  test('een IC-levering komt in vak 3b en in de ICP-opgave', async () => {
    const factuur = await maakFactuur('2000.00', btwICL, `${jaar}-06-15`);
    const definitief = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuur}/definitief`);
    assert.equal(definitief.status, 200, JSON.stringify(definitief.body));

    const btw = await gebruiker.client.get(`${admin.pad}/rapporten/btw?vanaf=${jaar}-06-01&tot=${jaar}-06-30`);
    const vak3b = btw.body.vakken.find((v: { vak: string }) => v.vak === '3b');
    assert.ok(vak3b, 'vak 3b bestaat');
    assert.equal(vak3b.grondslag, '2000.00');
    assert.equal(vak3b.btw, '0.00');

    const icp = await gebruiker.client.get(`${admin.pad}/rapporten/icp?vanaf=${jaar}-06-01&tot=${jaar}-06-30`);
    assert.equal(icp.body.regels.length, 1);
    assert.equal(icp.body.regels[0].btwNummer, 'BE0123456789');
    assert.equal(icp.body.totaal, '2000.00');
  });

  test('een IC-levering zonder btw-nummer wordt geblokkeerd bij het definitief maken', async () => {
    const zonderNummer = await gebruiker.client.post(`${admin.pad}/relaties`, {
      naam: 'Duitse Klant Zonder Nummer',
      soort: 'klant',
      land: 'DE',
      adres: { adres: 'Strasse 1', postcode: '10115', plaats: 'Berlin', land: 'DE' },
    });
    const factuur = await gebruiker.client.post(`${admin.pad}/verkoopfacturen`, {
      contactId: zonderNummer.body.id,
      factuurdatum: `${jaar}-06-20`,
      regels: [{ omschrijving: 'Levering', aantal: '1', prijs: '100.00', btwCodeId: btwICL, rekeningId: omzetId }],
    });
    const definitief = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuur.body.id}/definitief`);
    assert.equal(definitief.status, 422);
    assert.equal(definitief.body.error.code, 'invoice_requirements_missing');
    assert.match(definitief.body.error.hint, /btw-identificatienummer/);
  });
});

describe('gesloten perioden', () => {
  test('boeken in een gesloten periode kan niet', async () => {
    const boekjaren = await gebruiker.client.get(`${admin.pad}/boekjaren`);
    const januari = boekjaren.body.perioden.find((p: { nummer: number }) => p.nummer === 1);

    const gesloten = await gebruiker.client.post(`${admin.pad}/perioden/${januari.id}/status`, {
      status: 'gesloten',
    });
    assert.equal(gesloten.status, 200);

    const factuur = await maakFactuur('100.00', btw21, `${jaar}-01-15`);
    const definitief = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuur}/definitief`);
    assert.equal(definitief.status, 422);
    assert.equal(definitief.body.error.code, 'period_closed');
    assert.match(definitief.body.error.hint, /periode heropenen/);
  });

  test('een concept mag wel bestaan in een gesloten periode', async () => {
    const factuur = await maakFactuur('100.00', btw21, `${jaar}-01-20`);
    const gelezen = await gebruiker.client.get(`${admin.pad}/verkoopfacturen/${factuur}`);
    assert.equal(gelezen.body.factuur.status, 'concept');
  });

  test('na heropenen kan het weer, en het staat in de audit trail', async () => {
    const boekjaren = await gebruiker.client.get(`${admin.pad}/boekjaren`);
    const januari = boekjaren.body.perioden.find((p: { nummer: number }) => p.nummer === 1);

    const heropend = await gebruiker.client.post(`${admin.pad}/perioden/${januari.id}/status`, {
      status: 'open',
      reden: 'Nagekomen factuur van januari.',
    });
    assert.equal(heropend.status, 200);

    const factuur = await maakFactuur('100.00', btw21, `${jaar}-01-25`);
    const definitief = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuur}/definitief`);
    assert.equal(definitief.status, 200);

    const audit = await gebruiker.client.get(`${admin.pad}/audit?onderwerpSoort=accounting_period`);
    const regel = audit.body.regels.find((r: { actie: string }) => r.actie === 'periode.heropend');
    assert.equal(regel.gegevens.reden, 'Nagekomen factuur van januari.');
  });
});

describe('dubbele documenten en foutieve imports', () => {
  test('dezelfde leveranciersfactuur kan niet twee keer worden vastgelegd', async () => {
    const eerste = await gebruiker.client.post(`${admin.pad}/inkoopfacturen`, {
      contactId: leverancierId,
      leveranciersnummer: 'F-2026-77',
      factuurdatum: `${jaar}-07-01`,
      regels: [{ omschrijving: 'Papier', prijs: '50.00', btwCodeId: btwIn21, rekeningId: kostenId }],
    });
    assert.equal(eerste.status, 201);

    const tweede = await gebruiker.client.post(`${admin.pad}/inkoopfacturen`, {
      contactId: leverancierId,
      leveranciersnummer: 'F-2026-77',
      factuurdatum: `${jaar}-07-01`,
      regels: [{ omschrijving: 'Papier', prijs: '50.00', btwCodeId: btwIn21, rekeningId: kostenId }],
    });
    assert.equal(tweede.status, 409);
    assert.equal(tweede.body.error.code, 'duplicate_document');
    assert.match(tweede.body.error.message, /al eerder gestuurd/);
  });

  test('een onleesbaar bankbestand geeft een begrijpelijke fout', async () => {
    const rekeningen = await gebruiker.client.get(`${admin.pad}/bankrekeningen`);
    const bankId = rekeningen.body.bankrekeningen[0].id;

    const antwoord = await gebruiker.client.post(`${admin.pad}/bankrekeningen/${bankId}/import`, {
      bestandsnaam: 'onzin.csv',
      inhoud: 'dit is geen afschrift\nook deze regel niet',
    });
    assert.equal(antwoord.status, 500);
    assert.equal(antwoord.body.error.code, 'internal_error');
  });

  test('een afschrift van een andere rekening wordt geweigerd', async () => {
    const rekeningen = await gebruiker.client.get(`${admin.pad}/bankrekeningen`);
    const bankId = rekeningen.body.bankrekeningen[0].id;

    const antwoord = await gebruiker.client.post(`${admin.pad}/bankrekeningen/${bankId}/import`, {
      bestandsnaam: 'ander.csv',
      inhoud: `Datum;Bedrag;Rekening;Omschrijving\n${jaar}-08-01;10,00;NL44RABO0999999999;Test`,
    });
    assert.equal(antwoord.status, 400);
    assert.match(antwoord.body.error.message, /hoort bij NL44RABO0999999999/);
  });
});

describe('nummerreeksen', () => {
  test('factuurnummers zijn opeenvolgend zonder gaten', async () => {
    const nummers: string[] = [];
    for (let i = 0; i < 5; i++) {
      const factuur = await maakFactuur('10.00', btw21, `${jaar}-09-0${i + 1}`);
      const definitief = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuur}/definitief`);
      nummers.push(definitief.body.documentnummer);
    }
    const volgnummers = nummers.map((nummer) => Number(nummer.split('-')[1]));
    for (let i = 1; i < volgnummers.length; i++) {
      assert.equal(volgnummers[i], (volgnummers[i - 1] ?? 0) + 1, `gat in de reeks bij ${nummers[i]}`);
    }
  });

  test('gelijktijdig definitief maken levert geen dubbele nummers op', async () => {
    const facturen: string[] = [];
    for (let i = 0; i < 6; i++) {
      facturen.push(await maakFactuur('10.00', btw21, `${jaar}-10-0${i + 1}`));
    }

    const uitkomsten = await Promise.all(
      facturen.map((id) => gebruiker.client.post(`${admin.pad}/verkoopfacturen/${id}/definitief`)),
    );
    const nummers = uitkomsten.map((u) => u.body.documentnummer);
    assert.equal(uitkomsten.every((u) => u.status === 200), true, JSON.stringify(uitkomsten.map((u) => u.body)));
    assert.equal(new Set(nummers).size, nummers.length, `dubbele nummers: ${nummers.join(', ')}`);
  });

  test('een concept dat wordt weggegooid laat geen gat achter', async () => {
    const voor = await gebruiker.client.get(`${admin.pad}/verkoopfacturen?limiet=200`);
    const hoogste = voor.body.items
      .map((f: { documentnummer: string | null }) => Number(f.documentnummer?.split('-')[1] ?? 0))
      .reduce((a: number, b: number) => Math.max(a, b), 0);

    // Een concept krijgt pas bij het definitief maken een nummer.
    const concept = await maakFactuur('10.00', btw21, `${jaar}-11-01`);
    const gelezen = await gebruiker.client.get(`${admin.pad}/verkoopfacturen/${concept}`);
    assert.equal(gelezen.body.factuur.documentnummer, null);

    const volgende = await maakFactuur('10.00', btw21, `${jaar}-11-02`);
    const definitief = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${volgende}/definitief`);
    assert.equal(Number(definitief.body.documentnummer.split('-')[1]), hoogste + 1);
  });
});

describe('vreemde valuta', () => {
  test('een factuur in dollars boekt in de administratievaluta', async () => {
    const factuur = await gebruiker.client.post(`${admin.pad}/verkoopfacturen`, {
      contactId: klantId,
      factuurdatum: `${jaar}-12-01`,
      valuta: 'USD',
      regels: [{ omschrijving: 'Export', aantal: '1', prijs: '1000.00', btwCodeId: btwICL, rekeningId: omzetId }],
    });
    assert.equal(factuur.status, 201, JSON.stringify(factuur.body));

    const gelezen = await gebruiker.client.get(`${admin.pad}/verkoopfacturen/${factuur.body.id}`);
    assert.equal(gelezen.body.factuur.valuta, 'USD');
    assert.equal(gelezen.body.factuur.totaal_inclusief, '1000.00');

    const definitief = await gebruiker.client.post(`${admin.pad}/verkoopfacturen/${factuur.body.id}/definitief`);
    assert.equal(definitief.status, 200, JSON.stringify(definitief.body));

    const post = await gebruiker.client.get(`${admin.pad}/journaalposten/${definitief.body.postId}`);
    assert.equal(post.body.post.valuta, 'USD');
    assert.equal(post.body.post.totaal_debet, post.body.post.totaal_credit);
  });
});
