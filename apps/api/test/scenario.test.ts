/**
 * Het volledige scenario uit de opdracht, van een lege onderneming tot een
 * gecontroleerde audit trail. Dit is de belangrijkste test van het project:
 * hij bewijst dat de losse onderdelen samen kloppen.
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
  type Administratie,
  type Gebruiker,
} from './hulp.ts';
import { verzondenBerichten, wisVerzonden } from '../src/mail/index.ts';

let ondernemer: Gebruiker;
let admin: Administratie;
let klantId: string;
let factuurId: string;
let documentnummer: string;
let bankRekeningId: string;
let transactieId: string;

const jaar = new Date().getUTCFullYear();
const factuurdatum = `${jaar}-03-31`;
const betaaldatum = `${jaar}-04-05`;

before(async () => {
  await startTestomgeving();
});

after(async () => {
  await stopTestomgeving();
});

describe('Scenario: van nieuwe onderneming tot audit trail', () => {
  test('1. een nieuwe onderneming aanmaken', async () => {
    ondernemer = await maakGebruiker('Sanne de Vries');
    admin = await maakAdministratie(ondernemer, {
      organisatie: 'De Vries Advies',
      administratie: 'De Vries Advies',
      sjabloon: 'zzp',
    });

    const antwoord = await ondernemer.client.get(`${admin.pad}`);
    assert.equal(antwoord.status, 200);
    assert.equal(antwoord.body.administratie.naam, 'De Vries Advies');
    assert.equal(antwoord.body.rol, 'owner');

    const rekeningen = await ondernemer.client.get(`${admin.pad}/rekeningen`);
    assert.ok(rekeningen.body.rekeningen.length > 30, 'er staat een Nederlands rekeningschema klaar');
    assert.ok(
      rekeningen.body.rekeningen.some((r: { code: string; rol: string | null }) => r.code === '1300' && r.rol === 'debiteuren'),
      'de rekening Debiteuren heeft de systeemrol',
    );

    const btwcodes = await ondernemer.client.get(`${admin.pad}/btwcodes`);
    assert.ok(btwcodes.body.btwcodes.some((c: { code: string }) => c.code === 'VK-21'));
    assert.ok(
      btwcodes.body.btwcodes.every((c: { uitleg: string | null }) => c.uitleg === null || c.uitleg.length > 10),
      'elke btw-code heeft uitleg in gewone taal',
    );

    const boekjaren = await ondernemer.client.get(`${admin.pad}/boekjaren`);
    assert.equal(boekjaren.body.boekjaren.length, 1);
    assert.equal(boekjaren.body.perioden.length, 12, 'twaalf maandperioden');
  });

  test('2. een klant toevoegen', async () => {
    const antwoord = await ondernemer.client.post(`${admin.pad}/relaties`, {
      naam: 'Bakkerij Jansen',
      soort: 'klant',
      email: 'administratie@bakkerijjansen.test',
      btwNummer: 'NL987654321B01',
      iban: 'NL02ABNA0123456789',
      betalingstermijnDagen: 14,
      adres: { adres: 'Marktplein 2', postcode: '4321 BA', plaats: 'Elders' },
    });
    assert.equal(antwoord.status, 201);
    klantId = antwoord.body.id;
    assert.match(antwoord.body.nummer, /^K\d{5}$/);
  });

  test('2b. een tweede relatie met bijna dezelfde naam wordt gesignaleerd', async () => {
    const antwoord = await ondernemer.client.post(`${admin.pad}/relaties`, {
      naam: 'Bakkerij Jansen B.V.',
      soort: 'klant',
    });
    assert.equal(antwoord.status, 409);
    assert.equal(antwoord.body.error.code, 'conflict');
    assert.match(antwoord.body.error.message, /Bakkerij Jansen/);

    // Met een expliciete bevestiging mag het wel.
    const nogmaals = await ondernemer.client.post(`${admin.pad}/relaties`, {
      naam: 'Bakkerij Jansen B.V.',
      soort: 'klant',
      negeerDubbel: true,
    });
    assert.equal(nogmaals.status, 201);
  });

  test('3. een factuur met btw maken en versturen', async () => {
    const omzet = await rekeningId(ondernemer, admin, '8000');
    const btw21 = await btwCodeId(ondernemer, admin, 'VK-21');

    const concept = await ondernemer.client.post(`${admin.pad}/verkoopfacturen`, {
      contactId: klantId,
      factuurdatum,
      regels: [
        { omschrijving: 'Advieswerk maart', aantal: '10', prijs: '100.00', btwCodeId: btw21, rekeningId: omzet },
        { omschrijving: 'Reiskosten', aantal: '1', prijs: '45.50', btwCodeId: btw21, rekeningId: omzet },
      ],
    });
    assert.equal(concept.status, 201);
    factuurId = concept.body.id;

    const gelezen = await ondernemer.client.get(`${admin.pad}/verkoopfacturen/${factuurId}`);
    assert.equal(gelezen.body.factuur.status, 'concept');
    assert.equal(gelezen.body.factuur.totaal_exclusief, '1045.50');
    assert.equal(gelezen.body.factuur.totaal_btw, '219.56', '21% van 1045,50 = 219,555 -> 219,56');
    assert.equal(gelezen.body.factuur.totaal_inclusief, '1265.06');
    assert.equal(gelezen.body.factuur.vervaldatum, `${jaar}-04-14`, 'betalingstermijn van 14 dagen');

    const definitief = await ondernemer.client.post(`${admin.pad}/verkoopfacturen/${factuurId}/definitief`, {}, {
      'Idempotency-Key': 'test-definitief-1',
    });
    assert.equal(definitief.status, 200);
    documentnummer = definitief.body.documentnummer;
    assert.equal(documentnummer, `${jaar}-0001`);

    // Nog een keer versturen met dezelfde sleutel levert hetzelfde antwoord op.
    const nogmaals = await ondernemer.client.post(`${admin.pad}/verkoopfacturen/${factuurId}/definitief`, {}, {
      'Idempotency-Key': 'test-definitief-1',
    });
    assert.equal(nogmaals.status, 200);
    assert.deepEqual(nogmaals.body, definitief.body, 'idempotent: geen tweede boeking');

    wisVerzonden();
    const verzonden = await ondernemer.client.post(`${admin.pad}/verkoopfacturen/${factuurId}/verstuur`);
    assert.equal(verzonden.status, 200);
    assert.equal(verzonden.body.verzondenNaar, 'administratie@bakkerijjansen.test');

    const berichten = verzondenBerichten();
    assert.equal(berichten.length, 1);
    assert.match(berichten[0]!.onderwerp, new RegExp(documentnummer));
    assert.equal(berichten[0]!.bijlagen?.length, 2, 'pdf en UBL als bijlage');
    assert.ok(berichten[0]!.bijlagen?.[0]?.inhoud.subarray(0, 4).toString('latin1') === '%PDF', 'de bijlage is een echte pdf');
    assert.match(berichten[0]!.bijlagen?.[1]?.inhoud.toString('utf8') ?? '', /<cbc:ID>2\d{3}-0001<\/cbc:ID>/);

    const naVerzenden = await ondernemer.client.get(`${admin.pad}/verkoopfacturen/${factuurId}`);
    assert.equal(naVerzenden.body.factuur.status, 'verzonden');
  });

  test('4. een bankbetaling importeren', async () => {
    const rekeningen = await ondernemer.client.get(`${admin.pad}/bankrekeningen`);
    assert.equal(rekeningen.body.bankrekeningen.length, 1, 'bij het aanmaken is er al een bankrekening');
    bankRekeningId = rekeningen.body.bankrekeningen[0].id;

    const csv = [
      'Datum;Bedrag;Af Bij;Tegenrekening;Naam tegenpartij;Omschrijving',
      `${betaaldatum};1265,06;Bij;NL02ABNA0123456789;Bakkerij Jansen;Betaling factuur ${documentnummer}`,
      `${betaaldatum};121,00;Af;NL44RABO0123456789;Kantoorzaak;Bureaustoel`,
    ].join('\n');

    const importResultaat = await ondernemer.client.post(`${admin.pad}/bankrekeningen/${bankRekeningId}/import`, {
      bestandsnaam: 'afschrift.csv',
      inhoud: csv,
    });
    assert.equal(importResultaat.status, 201);
    assert.equal(importResultaat.body.bron, 'csv');
    assert.equal(importResultaat.body.gelezen, 2);
    assert.equal(importResultaat.body.toegevoegd, 2);

    // Hetzelfde bestand nog eens: niets dubbel.
    const nogmaals = await ondernemer.client.post(`${admin.pad}/bankrekeningen/${bankRekeningId}/import`, {
      bestandsnaam: 'afschrift.csv',
      inhoud: csv,
    });
    assert.equal(nogmaals.body.toegevoegd, 0);
    assert.equal(nogmaals.body.overgeslagen, 2, 'dubbele regels worden herkend');

    const transacties = await ondernemer.client.get(`${admin.pad}/banktransacties?status=nieuw`);
    assert.equal(transacties.body.items.length, 2);
    transactieId = transacties.body.items.find((t: { bedrag: string }) => t.bedrag === '1265.06').id;
  });

  test('5. de betaling wordt automatisch voorgesteld', async () => {
    const voorstellen = await ondernemer.client.get(`${admin.pad}/banktransacties/${transactieId}/voorstellen`);
    assert.equal(voorstellen.status, 200);
    assert.ok(voorstellen.body.matches.length >= 1, 'er is minstens een voorstel');

    const beste = voorstellen.body.matches[0];
    assert.equal(beste.soort, 'verkoopfactuur');
    assert.equal(beste.factuurId, factuurId);
    assert.equal(beste.bedrag, '1265.06');
    assert.ok(beste.zekerheid >= 0.9, `zekerheid was ${beste.zekerheid}`);
    assert.match(beste.motivatie, /factuurnummer/, 'het voorstel legt uit waarom');
  });

  test('6. de betaling koppelen maakt de factuur betaald', async () => {
    const geboekt = await ondernemer.client.post(`${admin.pad}/banktransacties/${transactieId}/boek`, {
      afletteringen: [{ factuurSoort: 'verkoopfactuur', factuurId, bedrag: '1265.06' }],
    });
    assert.equal(geboekt.status, 200);

    const factuur = await ondernemer.client.get(`${admin.pad}/verkoopfacturen/${factuurId}`);
    assert.equal(factuur.body.factuur.status, 'betaald');
    assert.equal(factuur.body.factuur.betaald_bedrag, '1265.06');
  });

  test('7. de grootboek- en btw-boekingen kloppen', async () => {
    const factuur = await ondernemer.client.get(`${admin.pad}/verkoopfacturen/${factuurId}`);
    const postId = factuur.body.factuur.journal_entry_id;

    const post = await ondernemer.client.get(`${admin.pad}/journaalposten/${postId}`);
    assert.equal(post.status, 200);
    assert.equal(post.body.post.status, 'definitief');
    assert.equal(post.body.post.totaal_debet, '1265.06');
    assert.equal(post.body.post.totaal_credit, '1265.06');

    const regels = post.body.regels as {
      rekening_code: string;
      debet: string;
      credit: string;
      btw_grondslag: string | null;
    }[];
    const somCredit = (code: string) =>
      regels
        .filter((r) => r.rekening_code === code)
        .reduce((totaal, r) => totaal + Math.round(Number(r.credit) * 100), 0);

    const debiteuren = regels.find((r) => r.rekening_code === '1300');
    const btw = regels.find((r) => r.rekening_code === '1500');

    assert.equal(debiteuren?.debet, '1265.06');
    assert.equal(somCredit('8000'), 104_550, 'twee omzetregels samen 1045,50');
    assert.equal(btw?.credit, '219.56');
    assert.equal(btw?.btw_grondslag, '1045.50', 'de btw-regel draagt zijn grondslag mee');

    // De bankboeking
    const bankTransactie = await ondernemer.client.get(`${admin.pad}/banktransacties?status=geboekt`);
    const bankPostId = bankTransactie.body.items[0].journal_entry_id;
    const bankPost = await ondernemer.client.get(`${admin.pad}/journaalposten/${bankPostId}`);
    const bankRegels = bankPost.body.regels as { rekening_code: string; debet: string; credit: string }[];
    assert.equal(bankRegels.find((r) => r.rekening_code === '1100')?.debet, '1265.06');
    assert.equal(bankRegels.find((r) => r.rekening_code === '1300')?.credit, '1265.06');
  });

  test('8. het btw-overzicht klopt en sluit aan op het grootboek', async () => {
    const btw = await ondernemer.client.get(
      `${admin.pad}/rapporten/btw?vanaf=${jaar}-01-01&tot=${jaar}-12-31`,
    );
    assert.equal(btw.status, 200);

    const vak1a = btw.body.vakken.find((v: { vak: string }) => v.vak === '1a');
    assert.ok(vak1a, 'vak 1a bestaat');
    assert.equal(vak1a.grondslag, '1045.50');
    assert.equal(vak1a.btw, '219.56');
    assert.equal(btw.body.aansluiting.sluitAan, true, 'het overzicht sluit aan op de btw-rekeningen');
    assert.match(btw.body.voorbehoud, /geen belastingadvies/);
  });

  test('9. de winst-en-verliesrekening en de balans kloppen', async () => {
    const wv = await ondernemer.client.get(
      `${admin.pad}/rapporten/winst-en-verlies?vanaf=${jaar}-01-01&tot=${jaar}-12-31`,
    );
    assert.equal(wv.status, 200);
    assert.equal(wv.body.totaalOpbrengsten, '1045.50');
    assert.equal(wv.body.totaalKosten, '0.00');
    assert.equal(wv.body.resultaat, '1045.50');

    const balans = await ondernemer.client.get(`${admin.pad}/rapporten/balans?peildatum=${jaar}-12-31`);
    assert.equal(balans.status, 200);
    assert.equal(balans.body.inBalans, true, 'de balans sluit');
    assert.equal(balans.body.totaalActiva, balans.body.totaalPassiva);
    assert.equal(balans.body.resultaatBoekjaar, '1045.50');

    const bank = balans.body.activa.find((r: { code: string }) => r.code === '1100');
    assert.equal(bank.saldo, '1265.06');

    const saldibalans = await ondernemer.client.get(
      `${admin.pad}/rapporten/saldibalans?vanaf=${jaar}-01-01&tot=${jaar}-12-31`,
    );
    assert.equal(saldibalans.body.sluit, true, 'debet en credit zijn gelijk in de saldibalans');
  });

  test('9b. elk rapportbedrag is doorklikbaar tot de boeking', async () => {
    const wv = await ondernemer.client.get(
      `${admin.pad}/rapporten/winst-en-verlies?vanaf=${jaar}-01-01&tot=${jaar}-12-31`,
    );
    const omzetRegel = wv.body.opbrengsten.find((r: { code: string }) => r.code === '8000');
    assert.ok(omzetRegel.drilldown, 'de rapportregel draagt een drilldown mee');

    const kaart = await ondernemer.client.get(
      `${admin.pad}/rapporten/grootboekkaart/${omzetRegel.drilldown.rekeningId}` +
        `?vanaf=${omzetRegel.drilldown.vanaf}&tot=${omzetRegel.drilldown.tot}`,
    );
    assert.equal(kaart.status, 200);
    assert.equal(kaart.body.mutaties.length, 2, 'de factuur had twee omzetregels');
    assert.equal(kaart.body.eindsaldo, '-1045.50', 'omzet staat credit, dus negatief als debet-min-credit');
    for (const mutatie of kaart.body.mutaties) {
      assert.equal(mutatie.bronSoort, 'sales_invoice');
      assert.equal(mutatie.bronId, factuurId, 'van rapport naar de onderliggende factuur');
    }
  });

  test('10. de audit trail bevat alles wat telt en is ongeschonden', async () => {
    const audit = await ondernemer.client.get(`${admin.pad}/audit?limiet=100`);
    assert.equal(audit.status, 200);

    const acties = new Set(audit.body.regels.map((r: { actie: string }) => r.actie));
    for (const verwacht of [
      'administratie.aangemaakt',
      'relatie.aangemaakt',
      'verkoopfactuur.aangemaakt',
      'verkoopfactuur.definitief',
      'verkoopfactuur.verzonden',
      'journaal.aangemaakt',
      'journaal.definitief',
      'bank.import',
      'bank.transactie_geboekt',
      'document.geupload',
    ]) {
      assert.ok(acties.has(verwacht), `de audit trail mist "${verwacht}"`);
    }

    const controle = await ondernemer.client.get(`${admin.pad}/audit/controle`);
    assert.equal(
      controle.body.ongeschonden,
      true,
      JSON.stringify(controle.body.probleem ?? {}),
    );
  });

  test('dashboard vat het geheel samen', async () => {
    const dashboard = await ondernemer.client.get(
      `${admin.pad}/dashboard?vanaf=${jaar}-01-01&tot=${jaar}-12-31`,
    );
    assert.equal(dashboard.status, 200);
    assert.equal(dashboard.body.omzet, '1045.50');
    assert.equal(dashboard.body.winst, '1045.50');
    assert.equal(dashboard.body.banksaldo, '1265.06');
    assert.equal(dashboard.body.openstaandeDebiteuren, '0.00');
    assert.equal(dashboard.body.teBoekenTransacties, 1, 'de inkooptransactie staat nog open');
  });
});
