import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  controleerFactuurvereisten,
  eisFactuurvereisten,
  sjabloonVoor,
  SCHEMA_SJABLONEN,
  BoekhoudFout,
  type FactuurGegevens,
} from '../src/index.ts';
import { VK21, VKICL, VKVERLEGD } from './hulp.ts';

const compleet: FactuurGegevens = {
  factuurdatum: '2026-03-31',
  factuurnummer: '2026-0001',
  leverdatum: '2026-03-31',
  verkoper: {
    naam: 'Voorbeeld Advies',
    adres: 'Dorpsstraat 1',
    postcodePlaats: '1234 AB Ergens',
    btwNummer: 'NL123456789B01',
    kvkNummer: '12345678',
  },
  afnemer: {
    naam: 'Klant BV',
    adres: 'Marktplein 2',
    postcodePlaats: '4321 BA Elders',
    btwNummer: 'NL987654321B01',
    land: 'NL',
  },
  regels: [{ omschrijving: 'Advies maart', aantal: '10', btwCode: VK21 }],
};

describe('wettelijke factuurvereisten', () => {
  test('een complete factuur heeft geen problemen', () => {
    assert.deepEqual(controleerFactuurvereisten(compleet), []);
  });

  test('een ontbrekend eigen btw-nummer blokkeert', () => {
    const problemen = controleerFactuurvereisten({
      ...compleet,
      verkoper: { ...compleet.verkoper, btwNummer: null },
    });
    assert.equal(problemen.length, 1);
    assert.equal(problemen[0]?.veld, 'verkoper.btwNummer');
    assert.equal(problemen[0]?.ernst, 'blokkerend');
  });

  test('een ontbrekend KVK-nummer is een waarschuwing, geen blokkade', () => {
    const problemen = controleerFactuurvereisten({
      ...compleet,
      verkoper: { ...compleet.verkoper, kvkNummer: null },
    });
    assert.equal(problemen[0]?.ernst, 'waarschuwing');
    assert.doesNotThrow(() =>
      eisFactuurvereisten({ ...compleet, verkoper: { ...compleet.verkoper, kvkNummer: null } }),
    );
  });

  test('btw verlegd zonder btw-nummer van de klant blokkeert', () => {
    const problemen = controleerFactuurvereisten({
      ...compleet,
      afnemer: { ...compleet.afnemer, btwNummer: null },
      regels: [{ omschrijving: 'Onderaanneming', aantal: '1', btwCode: VKVERLEGD }],
    });
    assert.ok(problemen.some((p) => p.veld === 'afnemer.btwNummer' && p.ernst === 'blokkerend'));
  });

  test('IC-levering naar een Nederlandse klant wordt gesignaleerd', () => {
    const problemen = controleerFactuurvereisten({
      ...compleet,
      regels: [{ omschrijving: 'Levering', aantal: '1', btwCode: VKICL }],
    });
    assert.ok(problemen.some((p) => p.veld === 'afnemer.land'));
  });

  test('eisFactuurvereisten gooit met een leesbare uitleg', () => {
    let fout: BoekhoudFout | null = null;
    try {
      eisFactuurvereisten({ ...compleet, factuurnummer: null, afnemer: { ...compleet.afnemer, naam: null } });
    } catch (e) {
      fout = e as BoekhoudFout;
    }
    assert.ok(fout);
    assert.equal(fout.code, 'invoice_requirements_missing');
    assert.match(fout.hint, /factuurnummer/i);
  });
});

describe('rekeningschema-sjablonen', () => {
  test('elk sjabloon heeft unieke codes', () => {
    for (const sjabloon of SCHEMA_SJABLONEN) {
      const codes = sjabloon.rekeningen.map((r) => r.code);
      assert.equal(new Set(codes).size, codes.length, `dubbele code in ${sjabloon.sleutel}`);
    }
  });

  test('elk sjabloon heeft alle systeemrollen die de patronen nodig hebben', () => {
    const nodig = [
      'debiteuren',
      'crediteuren',
      'bank',
      'btw_af_te_dragen_hoog',
      'btw_af_te_dragen_laag',
      'btw_af_te_dragen_overig',
      'btw_verlegd_af_te_dragen',
      'btw_te_vorderen',
      'betalingsverschillen',
      'koersverschillen',
      'onverdeeld_resultaat',
      'kapitaal',
    ];
    for (const sjabloon of SCHEMA_SJABLONEN) {
      const rollen = new Set(sjabloon.rekeningen.map((r) => r.rol).filter(Boolean));
      for (const rol of nodig) {
        assert.ok(rollen.has(rol as never), `${sjabloon.sleutel} mist de rol ${rol}`);
      }
    }
  });

  test('elke systeemrol komt hooguit een keer voor per sjabloon', () => {
    for (const sjabloon of SCHEMA_SJABLONEN) {
      const rollen = sjabloon.rekeningen.map((r) => r.rol).filter(Boolean);
      assert.equal(new Set(rollen).size, rollen.length, `dubbele rol in ${sjabloon.sleutel}`);
    }
  });

  test('een onbekend sjabloon geeft een bruikbare foutmelding', () => {
    assert.throws(() => sjabloonVoor('maatschap'), /Beschikbaar: zzp, bv, stichting, vereniging/);
  });

  test('het zzp-sjabloon kent prive-opnamen, het bv-sjabloon aandelenkapitaal', () => {
    assert.ok(sjabloonVoor('zzp').rekeningen.some((r) => r.rol === 'prive_opnamen'));
    assert.ok(sjabloonVoor('bv').rekeningen.some((r) => r.naam.includes('aandelenkapitaal')));
    assert.ok(sjabloonVoor('stichting').rekeningen.some((r) => r.naam === 'Subsidiebaten'));
    assert.ok(sjabloonVoor('vereniging').rekeningen.some((r) => r.naam === 'Contributies'));
  });
});
