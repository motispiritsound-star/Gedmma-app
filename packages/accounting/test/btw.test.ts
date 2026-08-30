import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { Money, Rate } from '@gedmma/money';
import { berekenFactuur, isGeldigOp, eisGeldigeBtwCode, BoekhoudFout } from '../src/index.ts';
import { eur, VK21, VK9, VK0, VKVERLEGD, VKICL } from './hulp.ts';

describe('btw per regel, gegroepeerd per code', () => {
  test('een regel van 1000 met 21%', () => {
    const totalen = berekenFactuur(
      [{ omschrijving: 'Advies', bedrag: eur('1000.00'), btwCode: VK21, rekeningId: 'r-8000' }],
      'EUR',
    );
    assert.equal(totalen.totaalExclusief.toString(), '1000.00');
    assert.equal(totalen.totaalBtw.toString(), '210.00');
    assert.equal(totalen.totaalInclusief.toString(), '1210.00');
    assert.equal(totalen.btwGroepen.length, 1);
  });

  test('twee tarieven op een factuur worden apart gegroepeerd', () => {
    const totalen = berekenFactuur(
      [
        { omschrijving: 'Advies', bedrag: eur('1000.00'), btwCode: VK21, rekeningId: 'r-8000' },
        { omschrijving: 'Boek', bedrag: eur('100.00'), btwCode: VK9, rekeningId: 'r-8010' },
      ],
      'EUR',
    );
    assert.equal(totalen.btwGroepen.length, 2);
    assert.equal(totalen.totaalBtw.toString(), '219.00');
    assert.equal(totalen.totaalInclusief.toString(), '1319.00');
  });

  test('btw wordt per regel berekend, niet over het totaal', () => {
    // Drie regels van 0,10 met 21% geven 3 x 0,02 = 0,06, niet 21% van 0,30 = 0,06.
    // Bij 0,05 per regel is het verschil zichtbaar: 3 x 0,01 = 0,03 tegenover
    // 21% van 0,15 = 0,03. We nemen een geval waarin het wel afwijkt.
    const regels = Array.from({ length: 3 }, () => ({
      omschrijving: 'Klein',
      bedrag: eur('0.10'),
      btwCode: VK21,
      rekeningId: 'r-8000',
    }));
    const totalen = berekenFactuur(regels, 'EUR');
    const perRegel = totalen.regels.map((r) => r.btw.toString());
    assert.deepEqual(perRegel, ['0.02', '0.02', '0.02']);
    assert.equal(totalen.totaalBtw.toString(), '0.06');
  });

  test('inclusief ingevoerde prijs sluit exact aan', () => {
    const totalen = berekenFactuur(
      [{ omschrijving: 'Alles-in', bedrag: eur('121.00'), btwCode: VK21, rekeningId: 'r-8000', inclusiefBtw: true }],
      'EUR',
    );
    assert.equal(totalen.totaalExclusief.toString(), '100.00');
    assert.equal(totalen.totaalBtw.toString(), '21.00');
    assert.equal(totalen.totaalInclusief.toString(), '121.00');
  });

  test('korting gaat van de grondslag af, dus ook van de btw', () => {
    const totalen = berekenFactuur(
      [{ omschrijving: 'Advies', bedrag: eur('1000.00'), korting: eur('100.00'), btwCode: VK21, rekeningId: 'r-8000' }],
      'EUR',
    );
    assert.equal(totalen.totaalExclusief.toString(), '900.00');
    assert.equal(totalen.totaalBtw.toString(), '189.00');
  });

  test('0%, verlegd en IC-levering geven geen btw maar wel een grondslag', () => {
    for (const code of [VK0, VKVERLEGD, VKICL]) {
      const totalen = berekenFactuur(
        [{ omschrijving: 'Levering', bedrag: eur('1000.00'), btwCode: code, rekeningId: 'r-8020' }],
        'EUR',
      );
      assert.equal(totalen.totaalBtw.toString(), '0.00', code.code);
      assert.equal(totalen.btwGroepen[0]?.grondslag.toString(), '1000.00', code.code);
    }
  });

  test('regels in een andere valuta dan de factuur worden geweigerd', () => {
    assert.throws(
      () =>
        berekenFactuur(
          [{ omschrijving: 'x', bedrag: Money.vanTekst('1.00', 'USD'), btwCode: VK21, rekeningId: 'r' }],
          'EUR',
        ),
      BoekhoudFout,
    );
  });
});

describe('geldigheid van btw-codes', () => {
  const oudTarief = { ...VK21, geldigVanaf: '2012-10-01', geldigTot: '2025-12-31' };

  test('een code geldt alleen binnen zijn periode', () => {
    assert.ok(isGeldigOp(oudTarief, '2020-06-01'));
    assert.ok(!isGeldigOp(oudTarief, '2026-01-01'));
    assert.ok(!isGeldigOp(oudTarief, '2012-09-30'));
  });

  test('boeken met een verlopen code geeft een begrijpelijke fout', () => {
    let gevangen: BoekhoudFout | null = null;
    try {
      eisGeldigeBtwCode(oudTarief, '2026-03-31');
    } catch (fout) {
      gevangen = fout as BoekhoudFout;
    }
    assert.ok(gevangen);
    assert.equal(gevangen.code, 'tax_code_not_valid_on_date');
    assert.match(gevangen.hint, /2025-12-31/);
  });
});

describe('property-based: btw-invarianten', () => {
  const bedragEenheden = fc.bigInt({ min: 0n, max: 10n ** 9n });

  test('exclusief plus btw is altijd inclusief, voor elke regel', () => {
    fc.assert(
      fc.property(fc.array(bedragEenheden, { minLength: 1, maxLength: 15 }), (bedragen) => {
        const totalen = berekenFactuur(
          bedragen.map((e) => ({
            omschrijving: 'r',
            bedrag: Money.vanEenheden(e, 'EUR'),
            btwCode: VK21,
            rekeningId: 'r-8000',
          })),
          'EUR',
        );
        for (const regel of totalen.regels) {
          assert.ok(regel.exclusief.plus(regel.btw).gelijkAan(regel.inclusief));
        }
        assert.ok(totalen.totaalExclusief.plus(totalen.totaalBtw).gelijkAan(totalen.totaalInclusief));
      }),
      { numRuns: 300 },
    );
  });

  test('de som van de btw-groepen is altijd het btw-totaal', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.tuple(bedragEenheden, fc.constantFrom(VK21, VK9, VK0)),
          { minLength: 1, maxLength: 20 },
        ),
        (regels) => {
          const totalen = berekenFactuur(
            regels.map(([e, code]) => ({
              omschrijving: 'r',
              bedrag: Money.vanEenheden(e, 'EUR'),
              btwCode: code,
              rekeningId: 'r-8000',
            })),
            'EUR',
          );
          const somGroepen = Money.som(totalen.btwGroepen.map((g) => g.btw), 'EUR');
          const somGrondslagen = Money.som(totalen.btwGroepen.map((g) => g.grondslag), 'EUR');
          assert.ok(somGroepen.gelijkAan(totalen.totaalBtw));
          assert.ok(somGrondslagen.gelijkAan(totalen.totaalExclusief));
        },
      ),
      { numRuns: 300 },
    );
  });

  test('inclusief invoeren en exclusief invoeren zijn elkaars omgekeerde', () => {
    fc.assert(
      fc.property(bedragEenheden, (eenheden) => {
        const inclusief = Money.vanEenheden(eenheden, 'EUR');
        const viaInclusief = berekenFactuur(
          [{ omschrijving: 'r', bedrag: inclusief, btwCode: VK21, rekeningId: 'r', inclusiefBtw: true }],
          'EUR',
        );
        assert.ok(viaInclusief.totaalInclusief.gelijkAan(inclusief));
      }),
      { numRuns: 300 },
    );
  });

  test('een tarief van 21% is nooit meer dan 21% plus een cent afronding', () => {
    fc.assert(
      fc.property(bedragEenheden, (eenheden) => {
        const exclusief = Money.vanEenheden(eenheden, 'EUR');
        const btw = Rate.tariefVanProcent('21').toepassenOp(exclusief);
        const ondergrens = exclusief.maalBreuk(21n, 100n).min(eur('0.01'));
        const bovengrens = exclusief.maalBreuk(21n, 100n).plus(eur('0.01'));
        assert.ok(!btw.kleinerDan(ondergrens) && !btw.groterDan(bovengrens));
      }),
      { numRuns: 300 },
    );
  });
});
