import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { Money } from '@gedmma/money';
import { bouwPost, keerPostOm, debet, credit, BoekhoudFout } from '../src/index.ts';
import { eur } from './hulp.ts';

/** Voert `fn` uit en levert de BoekhoudFout op die eruit komt. */
function vangFout(fn: () => unknown): BoekhoudFout {
  try {
    fn();
  } catch (fout) {
    assert.ok(fout instanceof BoekhoudFout, `verwachtte een BoekhoudFout, kreeg ${fout}`);
    return fout;
  }
  throw new assert.AssertionError({ message: 'Er werd geen fout gegooid, maar dat hoorde wel.' });
}

const basis = {
  dagboekCode: 'MEM',
  boekdatum: '2026-03-31',
  omschrijving: 'Test',
  valuta: 'EUR',
};

describe('bouwPost: invarianten', () => {
  test('een post in balans komt erdoor', () => {
    const post = bouwPost({
      ...basis,
      regels: [debet('a', eur('100.00')), credit('b', eur('100.00'))],
    });
    assert.equal(post.totaalDebet.toString(), '100.00');
    assert.equal(post.totaalCredit.toString(), '100.00');
    assert.deepEqual(post.regels.map((r) => r.regelnummer), [1, 2]);
  });

  test('I1: uit balans wordt geweigerd, met het verschil in de melding', () => {
    const fout = vangFout(() =>
        bouwPost({
          ...basis,
          regels: [debet('a', eur('100.00')), credit('b', eur('99.99'))],
        }),
    );
    assert.equal(fout.code, 'entry_not_balanced');
    assert.match(fout.hint, /0\.01/);
  });

  test('I2: debet en credit op dezelfde regel kan niet', () => {
    const fout = vangFout(() =>
        bouwPost({
          ...basis,
          regels: [
            { rekeningId: 'a', debet: eur('100.00'), credit: eur('100.00') },
            credit('b', eur('100.00')),
          ],
        }),
    );
    assert.equal(fout.code, 'line_debit_and_credit');
  });

  test('I2: een regel zonder bedrag kan niet', () => {
    const fout = vangFout(() =>
        bouwPost({
          ...basis,
          regels: [debet('a', eur('0.00')), credit('b', eur('0.00'))],
        }),
    );
    assert.equal(fout.code, 'line_no_amount');
  });

  test('I2: negatieve bedragen kunnen niet', () => {
    const fout = vangFout(() =>
        bouwPost({
          ...basis,
          regels: [debet('a', eur('-100.00')), credit('b', eur('-100.00'))],
        }),
    );
    assert.equal(fout.code, 'line_negative_amount');
  });

  test('I3: minder dan twee regels kan niet', () => {
    const fout = vangFout(() => bouwPost({ ...basis, regels: [debet('a', eur('100.00'))] }));
    assert.equal(fout.code, 'entry_too_few_lines');
  });

  test('valuta van een regel moet die van de post zijn', () => {
    const fout = vangFout(() =>
        bouwPost({
          ...basis,
          regels: [debet('a', Money.vanTekst('100.00', 'USD')), credit('b', eur('100.00'))],
        }),
    );
    assert.equal(fout.code, 'mixed_currencies');
  });

  test('een btw-code zonder grondslag wordt geweigerd', () => {
    const fout = vangFout(() =>
        bouwPost({
          ...basis,
          regels: [debet('a', eur('100.00'), { btwCodeId: 'b-1' }), credit('b', eur('100.00'))],
        }),
    );
    assert.equal(fout.code, 'tax_base_missing');
  });

  test('een onmogelijke datum wordt geweigerd', () => {
    assert.throws(() => bouwPost({ ...basis, boekdatum: '31-03-2026', regels: [debet('a', eur('1.00')), credit('b', eur('1.00'))] }), BoekhoudFout);
  });
});

describe('tegenboeking', () => {
  test('draait elke regel om en blijft in balans', () => {
    const origineel = bouwPost({
      ...basis,
      regels: [debet('a', eur('121.00')), credit('b', eur('100.00')), credit('c', eur('21.00'))],
    });
    const tegen = keerPostOm(origineel, { boekdatum: '2026-04-01' });
    assert.equal(tegen.boekdatum, '2026-04-01');
    assert.equal(tegen.bronSoort, 'reversal');
    assert.equal(tegen.regels[0]?.credit.toString(), '121.00');
    assert.equal(tegen.regels[0]?.debet.toString(), '0.00');
    assert.equal(tegen.totaalDebet.toString(), '121.00');
    assert.match(tegen.omschrijving, /Tegenboeking/);
  });

  test('twee keer omkeren levert het origineel op', () => {
    const origineel = bouwPost({
      ...basis,
      regels: [debet('a', eur('121.00')), credit('b', eur('121.00'))],
    });
    const terug = keerPostOm(keerPostOm(origineel));
    assert.deepEqual(
      terug.regels.map((r) => [r.rekeningId, r.debet.toString(), r.credit.toString()]),
      origineel.regels.map((r) => [r.rekeningId, r.debet.toString(), r.credit.toString()]),
    );
  });
});

describe('property-based: elke post die erdoor komt is in balans', () => {
  const bedrag = fc.bigInt({ min: 1n, max: 10n ** 9n });

  test('willekeurige posten met een sluitende tegenboeking komen erdoor', () => {
    fc.assert(
      fc.property(fc.array(bedrag, { minLength: 1, maxLength: 20 }), (bedragen) => {
        const debetRegels = bedragen.map((eenheden, i) =>
          debet(`d-${i}`, Money.vanEenheden(eenheden, 'EUR')),
        );
        const totaal = Money.som(debetRegels.map((r) => r.debet), 'EUR');
        const post = bouwPost({ ...basis, regels: [...debetRegels, credit('tegen', totaal)] });
        assert.ok(post.totaalDebet.gelijkAan(post.totaalCredit));
      }),
      { numRuns: 300 },
    );
  });

  test('een willekeurige verstoring valt altijd door de mand', () => {
    fc.assert(
      fc.property(bedrag, fc.bigInt({ min: 1n, max: 10n ** 6n }), (basisBedrag, afwijking) => {
        const a = Money.vanEenheden(basisBedrag, 'EUR');
        const b = Money.vanEenheden(basisBedrag + afwijking, 'EUR');
        assert.throws(
          () => bouwPost({ ...basis, regels: [debet('a', a), credit('b', b)] }),
          (fout: unknown) => fout instanceof BoekhoudFout && fout.code === 'entry_not_balanced',
        );
      }),
      { numRuns: 300 },
    );
  });

  test('omkeren behoudt de balans voor elke geldige post', () => {
    fc.assert(
      fc.property(fc.array(bedrag, { minLength: 1, maxLength: 10 }), (bedragen) => {
        const debetRegels = bedragen.map((e, i) => debet(`d-${i}`, Money.vanEenheden(e, 'EUR')));
        const totaal = Money.som(debetRegels.map((r) => r.debet), 'EUR');
        const post = bouwPost({ ...basis, regels: [...debetRegels, credit('tegen', totaal)] });
        const tegen = keerPostOm(post);
        assert.ok(tegen.totaalDebet.gelijkAan(tegen.totaalCredit));
        assert.ok(tegen.totaalDebet.gelijkAan(post.totaalDebet));
      }),
      { numRuns: 300 },
    );
  });
});
