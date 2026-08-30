import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TALEN,
  kiesTaal,
  localeVan,
  maakVertaler,
  toonBedrag,
  toonDatum,
  toonGetal,
  toonRelatief,
  vertaal,
  nl,
  en,
  de,
  fr,
} from '../src/index.ts';

describe('vertalen', () => {
  test('elke taal levert een tekst voor elke sleutel', () => {
    for (const { code } of TALEN) {
      for (const sleutel of Object.keys(nl) as (keyof typeof nl)[]) {
        const tekst = vertaal(code, sleutel);
        assert.ok(tekst.length > 0, `${code}/${String(sleutel)} is leeg`);
        assert.notEqual(tekst, String(sleutel), `${code}/${String(sleutel)} valt terug op de sleutel`);
      }
    }
  });

  test('de vertalingen zijn compleet: geen enkele taal mist een sleutel', () => {
    const sleutels = Object.keys(nl);
    for (const [naam, woordenboek] of [['en', en], ['de', de], ['fr', fr]] as const) {
      const ontbreekt = sleutels.filter((sleutel) => !(sleutel in woordenboek));
      assert.deepEqual(ontbreekt, [], `${naam} mist: ${ontbreekt.join(', ')}`);
    }
  });

  test('geen enkele vertaling bevat nog de Nederlandse brontekst waar dat niet hoort', () => {
    // Steekproef op woorden die in geen enkele vertaling thuishoren.
    for (const [naam, woordenboek] of [['en', en], ['de', de], ['fr', fr]] as const) {
      const verdacht = Object.entries(woordenboek).filter(([sleutel, tekst]) =>
        sleutel !== 'app.naam' && typeof tekst === 'string' && /\b(bedrijf|boekhouding|factuur van)\b/i.test(tekst),
      );
      assert.deepEqual(verdacht.map(([s]) => s), [], `${naam} lijkt Nederlandse tekst te bevatten`);
    }
  });

  test('variabelen worden ingevuld', () => {
    const tekst = vertaal('nl', 'bank.geimporteerd', { toegevoegd: 12, overgeslagen: 3 });
    assert.equal(tekst, '12 nieuwe transacties toegevoegd, 3 stonden er al in.');
  });

  test('een ontbrekende variabele blijft zichtbaar in plaats van stil te verdwijnen', () => {
    const tekst = vertaal('nl', 'bank.geimporteerd', { toegevoegd: 1 });
    assert.match(tekst, /\{overgeslagen\}/);
  });

  test('maakVertaler bindt de taal', () => {
    const t = maakVertaler('de');
    assert.equal(t('nav.dashboard'), 'Übersicht');
  });
});

describe('taalkeuze', () => {
  test('kiest de eerste bekende taal uit de voorkeuren', () => {
    assert.equal(kiesTaal(['fr-BE', 'nl']), 'fr');
    assert.equal(kiesTaal(['es-ES', 'de-AT']), 'de');
    assert.equal(kiesTaal(['es-ES']), 'nl', 'valt terug op Nederlands');
  });

  test('elke taal heeft een locale', () => {
    assert.equal(localeVan('nl'), 'nl-NL');
    assert.equal(localeVan('fr'), 'fr-FR');
  });
});

describe('opmaak per taal', () => {
  test('bedragen', () => {
    assert.match(toonBedrag('1234.50', 'EUR', 'nl'), /1\.234,50/);
    assert.match(toonBedrag('1234.50', 'EUR', 'en'), /1,234\.50/);
    assert.match(toonBedrag('1234.50', 'EUR', 'de'), /1\.234,50/);
  });

  test('getallen zonder valutateken', () => {
    assert.equal(toonGetal('1234.5', 'nl'), '1.234,50');
    assert.equal(toonGetal('1234.5', 'en'), '1,234.50');
  });

  test('datums', () => {
    assert.equal(toonDatum('2026-03-31', 'nl'), '31-03-2026');
    assert.match(toonDatum('2026-03-31', 'en', 'lang'), /31 March 2026/);
    assert.match(toonDatum('2026-03-31', 'de', 'lang'), /31\. März 2026/);
  });

  test('relatieve tijd', () => {
    const vandaag = new Date('2026-03-31T12:00:00Z');
    assert.match(toonRelatief('2026-04-01', 'nl', vandaag), /morgen/i);
    assert.match(toonRelatief('2026-03-30', 'nl', vandaag), /gisteren/i);
    assert.match(toonRelatief('2026-01-31', 'nl', vandaag), /maand/i);
  });
});
