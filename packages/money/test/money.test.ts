import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { Money, Rate, Quantity, deelEnRondAf, leesDecimaal, schrijfDecimaal } from '../src/index.ts';

describe('decimaal lezen en schrijven', () => {
  test('leest en schrijft exact terug', () => {
    assert.equal(Money.vanTekst('1210.00', 'EUR').toString(), '1210.00');
    assert.equal(Money.vanTekst('-0.01', 'EUR').toString(), '-0.01');
    assert.equal(Money.vanTekst('0', 'EUR').toString(), '0.00');
    assert.equal(Money.vanTekst('1210,50', 'EUR').toString(), '1210.50', 'komma mag ook');
  });

  test('weigert meer decimalen dan de valuta kent', () => {
    assert.throws(() => Money.vanTekst('1.005', 'EUR'), /decimalen/);
    assert.equal(Money.vanTekst('1', 'JPY').toString(), '1', 'yen heeft geen decimalen');
    assert.throws(() => Money.vanTekst('1.5', 'JPY'), /decimalen/);
  });

  test('weigert onzin', () => {
    for (const onzin of ['', 'abc', '1.2.3', 'NaN', 'Infinity', '1e5', '1 000']) {
      assert.throws(() => Money.vanTekst(onzin, 'EUR'), TypeError, `"${onzin}" hoort te falen`);
    }
  });

  test('weigert onbekende valuta in plaats van te gokken', () => {
    assert.throws(() => Money.vanTekst('1.00', 'XYZ'), /Onbekende valuta/);
  });
});

describe('afronden', () => {
  test('rondt half naar boven af, van nul af', () => {
    assert.equal(deelEnRondAf(5n, 10n), 1n);
    assert.equal(deelEnRondAf(4n, 10n), 0n);
    assert.equal(deelEnRondAf(-5n, 10n), -1n);
    assert.equal(deelEnRondAf(15n, 10n), 2n);
    assert.equal(deelEnRondAf(25n, 10n), 3n, 'geen bankers rounding');
  });
});

describe('rekenen', () => {
  test('optellen en aftrekken', () => {
    const a = Money.vanTekst('121.00', 'EUR');
    const b = Money.vanTekst('21.00', 'EUR');
    assert.equal(a.min(b).toString(), '100.00');
    assert.equal(a.plus(b).toString(), '142.00');
  });

  test('valutas mengen kan niet', () => {
    const eur = Money.vanTekst('1.00', 'EUR');
    const usd = Money.vanTekst('1.00', 'USD');
    assert.throws(() => eur.plus(usd), /niet met elkaar verrekenen/);
  });

  test('btw over een regel', () => {
    const regel = Money.vanTekst('1000.00', 'EUR');
    assert.equal(Rate.tariefVanProcent('21').toepassenOp(regel).toString(), '210.00');
    assert.equal(Rate.tariefVanProcent('9').toepassenOp(regel).toString(), '90.00');
    assert.equal(Rate.tariefVanProcent('0').toepassenOp(regel).toString(), '0.00');
  });

  test('terugrekenen uit een inclusief bedrag sluit exact aan', () => {
    const tarief = Rate.tariefVanProcent('21');
    const inclusief = Money.vanTekst('121.00', 'EUR');
    const exclusief = tarief.exclusiefUitInclusief(inclusief);
    assert.equal(exclusief.toString(), '100.00');
    assert.equal(inclusief.min(exclusief).toString(), '21.00');
  });

  test('aantal maal prijs', () => {
    assert.equal(Quantity.vanTekst('10').maalPrijs(Money.vanTekst('99.95', 'EUR')).toString(), '999.50');
    assert.equal(Quantity.vanTekst('0.5').maalPrijs(Money.vanTekst('99.95', 'EUR')).toString(), '49.98');
    assert.equal(Quantity.vanTekst('1.333333').maalPrijs(Money.vanTekst('3.00', 'EUR')).toString(), '4.00');
  });

  test('wisselkoers omrekenen', () => {
    const koers = Rate.koers('1.08450000');
    assert.equal(koers.reken(Money.vanTekst('100.00', 'EUR'), 'USD').toString(), '108.45');
  });
});

describe('verdelen zonder centverlies', () => {
  test('drie gelijke delen van een tientje', () => {
    const delen = Money.vanTekst('10.00', 'EUR').verdeel([1, 1, 1]);
    assert.deepEqual(delen.map(String), ['3.34', '3.33', '3.33']);
    assert.equal(Money.som(delen).toString(), '10.00');
  });

  test('naar verhouding', () => {
    const delen = Money.vanTekst('100.00', 'EUR').verdeel([1, 2, 3]);
    assert.deepEqual(delen.map(String), ['16.67', '33.33', '50.00']);
    assert.equal(Money.som(delen).toString(), '100.00');
  });

  test('negatieve bedragen (creditnota) verdelen net zo', () => {
    const delen = Money.vanTekst('-10.00', 'EUR').verdeel([1, 1, 1]);
    assert.equal(Money.som(delen).toString(), '-10.00');
  });
});

// --- Property-based tests: invarianten die voor elke invoer moeten gelden ---

const bedragEUR = fc
  .bigInt({ min: -(10n ** 12n), max: 10n ** 12n })
  .map((eenheden) => Money.vanEenheden(eenheden, 'EUR'));

describe('invarianten (property-based)', () => {
  test('optellen en aftrekken is elkaars omgekeerde', () => {
    fc.assert(
      fc.property(bedragEUR, bedragEUR, (a, b) => {
        assert.ok(a.plus(b).min(b).gelijkAan(a));
      }),
      { numRuns: 500 },
    );
  });

  test('tekst heen en terug verandert niets', () => {
    fc.assert(
      fc.property(bedragEUR, (a) => {
        assert.ok(Money.vanTekst(a.toString(), 'EUR').gelijkAan(a));
      }),
      { numRuns: 500 },
    );
  });

  test('verdelen verliest nooit een cent', () => {
    fc.assert(
      fc.property(
        bedragEUR,
        fc.array(fc.integer({ min: 1, max: 50 }), { minLength: 1, maxLength: 12 }),
        (bedrag, verhoudingen) => {
          const delen = bedrag.verdeel(verhoudingen);
          assert.equal(delen.length, verhoudingen.length);
          assert.ok(Money.som(delen, 'EUR').gelijkAan(bedrag));
        },
      ),
      { numRuns: 500 },
    );
  });

  test('optellen is associatief en commutatief', () => {
    fc.assert(
      fc.property(bedragEUR, bedragEUR, bedragEUR, (a, b, c) => {
        assert.ok(a.plus(b).gelijkAan(b.plus(a)));
        assert.ok(a.plus(b).plus(c).gelijkAan(a.plus(b.plus(c))));
      }),
      { numRuns: 500 },
    );
  });

  test('btw exclusief plus btw is altijd het inclusiefbedrag', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: 0n, max: 10n ** 10n }),
        fc.constantFrom('0', '9', '21'),
        (eenheden, procent) => {
          const exclusief = Money.vanEenheden(eenheden, 'EUR');
          const tarief = Rate.tariefVanProcent(procent);
          const btw = tarief.toepassenOp(exclusief);
          const inclusief = exclusief.plus(btw);
          assert.ok(inclusief.min(btw).gelijkAan(exclusief));
        },
      ),
      { numRuns: 500 },
    );
  });

  test('geen enkele bewerking levert een number op', () => {
    fc.assert(
      fc.property(bedragEUR, (a) => {
        assert.equal(typeof a.eenheden, 'bigint');
        assert.equal(typeof a.toJSON(), 'string');
        assert.ok(!Number.isNaN(Number(a.toString())), 'blijft leesbaar als decimale tekst');
      }),
      { numRuns: 200 },
    );
  });

  test('schrijven en lezen van willekeurige schalen is verliesvrij', () => {
    fc.assert(
      fc.property(
        fc.bigInt({ min: -(10n ** 15n), max: 10n ** 15n }),
        fc.integer({ min: 0, max: 8 }),
        (eenheden, schaal) => {
          const tekst = schrijfDecimaal(eenheden, schaal);
          assert.equal(leesDecimaal(tekst, schaal), eenheden);
        },
      ),
      { numRuns: 500 },
    );
  });
});

describe('weergave', () => {
  test('formatteert per taal', () => {
    const bedrag = Money.vanTekst('1234.50', 'EUR');
    const nl = bedrag.formatteer('nl-NL');
    assert.match(nl, /1\.234,50/);
    const en = bedrag.formatteer('en-US');
    assert.match(en, /1,234\.50/);
  });

  test('tarief als percentage', () => {
    assert.equal(Rate.tariefVanProcent('21').alsProcent('nl-NL'), '21%');
    assert.equal(Rate.tariefVanProcent('9.5').alsProcent('nl-NL'), '9,5%');
  });
});
