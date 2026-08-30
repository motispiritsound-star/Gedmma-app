import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import { Money, Rate } from '@gedmma/money';
import {
  berekenFactuur,
  boekVerkoopfactuur,
  boekInkoopfactuur,
  boekBanktransactie,
  boekKoersverschil,
  BoekhoudFout,
  type GeldigePost,
} from '../src/index.ts';
import { register, rekeningen, eur, VK21, VK9, VKICL, IN21, INVERLEGD, INGEEN } from './hulp.ts';

/** Levert een overzicht van rekening -> [debet, credit] om makkelijk te vergelijken. */
function saldi(post: GeldigePost): Record<string, [string, string]> {
  const uitkomst: Record<string, [string, string]> = {};
  for (const regel of post.regels) {
    const [d, c] = uitkomst[regel.rekeningId] ?? ['0.00', '0.00'];
    uitkomst[regel.rekeningId] = [
      Money.vanTekst(d, 'EUR').plus(regel.debet).toString(),
      Money.vanTekst(c, 'EUR').plus(regel.credit).toString(),
    ];
  }
  return uitkomst;
}

const basis = { dagboekCode: 'VRK', boekdatum: '2026-03-31', omschrijving: 'Factuur 2026-0001', valuta: 'EUR' };

describe('verkoopfactuur boeken', () => {
  const totalen = berekenFactuur(
    [{ omschrijving: 'Advies maart', bedrag: eur('1000.00'), btwCode: VK21, rekeningId: 'r-8000' }],
    'EUR',
  );

  test('debiteuren debet, omzet en btw credit', () => {
    const post = boekVerkoopfactuur(
      { ...basis, relatieId: 'k-1', regels: totalen.regels, totaalInclusief: totalen.totaalInclusief, factuurId: 'f-1' },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s[rekeningen.debiteuren.id], ['1210.00', '0.00']);
    assert.deepEqual(s['r-8000'], ['0.00', '1000.00']);
    assert.deepEqual(s[rekeningen.btw_af_te_dragen_hoog.id], ['0.00', '210.00']);
    assert.ok(post.totaalDebet.gelijkAan(post.totaalCredit));
    assert.equal(post.bronSoort, 'sales_invoice');
  });

  test('creditnota draait alle kanten om', () => {
    const post = boekVerkoopfactuur(
      { ...basis, relatieId: 'k-1', regels: totalen.regels, totaalInclusief: totalen.totaalInclusief, factuurId: 'f-2', creditnota: true },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s[rekeningen.debiteuren.id], ['0.00', '1210.00']);
    assert.deepEqual(s['r-8000'], ['1000.00', '0.00']);
  });

  test('twee tarieven landen op twee btw-rekeningen', () => {
    const gemengd = berekenFactuur(
      [
        { omschrijving: 'Advies', bedrag: eur('1000.00'), btwCode: VK21, rekeningId: 'r-8000' },
        { omschrijving: 'Boek', bedrag: eur('100.00'), btwCode: VK9, rekeningId: 'r-8010' },
      ],
      'EUR',
    );
    const post = boekVerkoopfactuur(
      { ...basis, relatieId: 'k-1', regels: gemengd.regels, totaalInclusief: gemengd.totaalInclusief, factuurId: 'f-3' },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s[rekeningen.btw_af_te_dragen_hoog.id], ['0.00', '210.00']);
    assert.deepEqual(s[rekeningen.btw_af_te_dragen_laag.id], ['0.00', '9.00']);
    assert.deepEqual(s[rekeningen.debiteuren.id], ['1319.00', '0.00']);
  });

  test('IC-levering: geen btw-regel, wel omzet en debiteuren', () => {
    const ic = berekenFactuur(
      [{ omschrijving: 'Levering Duitsland', bedrag: eur('1000.00'), btwCode: VKICL, rekeningId: 'r-8040' }],
      'EUR',
    );
    const post = boekVerkoopfactuur(
      { ...basis, relatieId: 'k-2', regels: ic.regels, totaalInclusief: ic.totaalInclusief, factuurId: 'f-4' },
      register,
    );
    assert.equal(post.regels.length, 2);
    assert.equal(post.totaalDebet.toString(), '1000.00');
    assert.equal(post.regels.find((r) => r.rekeningId === 'r-8040')?.btwCodeId, VKICL.id);
  });
});

describe('inkoopfactuur boeken', () => {
  test('kosten en voorbelasting debet, crediteuren credit', () => {
    const totalen = berekenFactuur(
      [{ omschrijving: 'Laptop', bedrag: eur('1000.00'), btwCode: IN21, rekeningId: 'r-4100' }],
      'EUR',
    );
    const post = boekInkoopfactuur(
      { ...basis, dagboekCode: 'INK', relatieId: 'l-1', regels: totalen.regels, totaalInclusief: totalen.totaalInclusief, factuurId: 'i-1' },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s['r-4100'], ['1000.00', '0.00']);
    assert.deepEqual(s[rekeningen.btw_te_vorderen.id], ['210.00', '0.00']);
    assert.deepEqual(s[rekeningen.crediteuren.id], ['0.00', '1210.00']);
  });

  test('btw verlegd: netto nul, maar beide kanten worden geboekt', () => {
    const totalen = berekenFactuur(
      [{ omschrijving: 'Dienst uit Ierland', bedrag: eur('1000.00'), btwCode: INVERLEGD, rekeningId: 'r-4120' }],
      'EUR',
    );
    // De leverancier brengt geen btw in rekening: het factuurtotaal is 1000.
    assert.equal(totalen.totaalInclusief.toString(), '1000.00');

    const post = boekInkoopfactuur(
      { ...basis, dagboekCode: 'INK', relatieId: 'l-2', regels: totalen.regels, totaalInclusief: totalen.totaalInclusief, factuurId: 'i-2' },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s['r-4120'], ['1000.00', '0.00'], 'kosten exclusief');
    assert.deepEqual(s[rekeningen.btw_te_vorderen.id], ['210.00', '0.00'], 'terug te vragen');
    assert.deepEqual(s[rekeningen.btw_verlegd_af_te_dragen.id], ['0.00', '210.00'], 'af te dragen');
    assert.deepEqual(s[rekeningen.crediteuren.id], ['0.00', '1000.00'], 'leverancier krijgt 1000');
    assert.ok(post.totaalDebet.gelijkAan(post.totaalCredit));
  });

  test('inkoop zonder btw levert geen btw-regel op', () => {
    const totalen = berekenFactuur(
      [{ omschrijving: 'Verzekering', bedrag: eur('500.00'), btwCode: INGEEN, rekeningId: 'r-4320' }],
      'EUR',
    );
    const post = boekInkoopfactuur(
      { ...basis, dagboekCode: 'INK', relatieId: 'l-3', regels: totalen.regels, totaalInclusief: totalen.totaalInclusief, factuurId: 'i-3' },
      register,
    );
    assert.equal(post.regels.length, 2);
  });
});

describe('banktransactie boeken', () => {
  const bankBasis = { dagboekCode: 'BNK', boekdatum: '2026-04-05', valuta: 'EUR', bankRekeningId: rekeningen.bank.id };

  test('volledige ontvangst letter de debiteur af', () => {
    const post = boekBanktransactie(
      {
        ...bankBasis,
        omschrijving: 'Betaling factuur 2026-0001',
        bedrag: eur('1210.00'),
        transactieId: 't-1',
        afletteringen: [{ rol: 'debiteuren', bedrag: eur('1210.00'), relatieId: 'k-1', omschrijving: 'Factuur 2026-0001' }],
      },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s[rekeningen.bank.id], ['1210.00', '0.00']);
    assert.deepEqual(s[rekeningen.debiteuren.id], ['0.00', '1210.00']);
  });

  test('deelbetaling boekt alleen het betaalde deel', () => {
    const post = boekBanktransactie(
      {
        ...bankBasis,
        omschrijving: 'Deelbetaling',
        bedrag: eur('500.00'),
        transactieId: 't-2',
        afletteringen: [{ rol: 'debiteuren', bedrag: eur('500.00'), relatieId: 'k-1', omschrijving: 'Deel van 2026-0001' }],
      },
      register,
    );
    assert.equal(post.totaalDebet.toString(), '500.00');
  });

  test('betaling aan een leverancier haalt de crediteur van de balans', () => {
    const post = boekBanktransactie(
      {
        ...bankBasis,
        omschrijving: 'Betaling leverancier',
        bedrag: eur('-1210.00'),
        transactieId: 't-3',
        afletteringen: [{ rol: 'crediteuren', bedrag: eur('1210.00'), relatieId: 'l-1', omschrijving: 'Inkoopfactuur' }],
      },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s[rekeningen.bank.id], ['0.00', '1210.00']);
    assert.deepEqual(s[rekeningen.crediteuren.id], ['1210.00', '0.00']);
  });

  test('rechtstreeks op een kostenrekening, met btw uit het inclusiefbedrag', () => {
    const post = boekBanktransactie(
      {
        ...bankBasis,
        omschrijving: 'Tankbeurt',
        bedrag: eur('-121.00'),
        transactieId: 't-4',
        directeBoekingen: [{ rekeningId: 'r-4220', bedrag: eur('121.00'), omschrijving: 'Brandstof', btwCode: IN21 }],
      },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s['r-4220'], ['100.00', '0.00']);
    assert.deepEqual(s[rekeningen.btw_te_vorderen.id], ['21.00', '0.00']);
    assert.deepEqual(s[rekeningen.bank.id], ['0.00', '121.00']);
  });

  test('een klein verschil gaat expliciet naar betalingsverschillen', () => {
    const post = boekBanktransactie(
      {
        ...bankBasis,
        omschrijving: 'Betaling met een cent te weinig',
        bedrag: eur('1209.99'),
        transactieId: 't-5',
        afletteringen: [{ rol: 'debiteuren', bedrag: eur('1210.00'), relatieId: 'k-1', omschrijving: 'Factuur' }],
      },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s[rekeningen.betalingsverschillen.id], ['0.01', '0.00']);
    assert.ok(post.totaalDebet.gelijkAan(post.totaalCredit));
  });

  test('een groot verschil wordt geweigerd met uitleg', () => {
    let fout: BoekhoudFout | null = null;
    try {
      boekBanktransactie(
        {
          ...bankBasis,
          omschrijving: 'Te weinig gekoppeld',
          bedrag: eur('1000.00'),
          transactieId: 't-6',
          afletteringen: [{ rol: 'debiteuren', bedrag: eur('500.00'), relatieId: 'k-1', omschrijving: 'Factuur' }],
        },
        register,
      );
    } catch (e) {
      fout = e as BoekhoudFout;
    }
    assert.ok(fout);
    assert.equal(fout.code, 'entry_not_balanced');
    assert.match(fout.hint, /500\.00/);
  });

  test('splitsen over meerdere facturen en een kostenrekening', () => {
    const post = boekBanktransactie(
      {
        ...bankBasis,
        omschrijving: 'Verzamelbetaling',
        bedrag: eur('1500.00'),
        transactieId: 't-7',
        afletteringen: [
          { rol: 'debiteuren', bedrag: eur('1000.00'), relatieId: 'k-1', omschrijving: 'Factuur A' },
          { rol: 'debiteuren', bedrag: eur('400.00'), relatieId: 'k-2', omschrijving: 'Factuur B' },
        ],
        directeBoekingen: [{ rekeningId: 'r-9000', bedrag: eur('100.00'), omschrijving: 'Rente' }],
      },
      register,
    );
    assert.equal(post.totaalDebet.toString(), '1500.00');
    assert.ok(post.totaalDebet.gelijkAan(post.totaalCredit));
  });
});

describe('koersverschil', () => {
  test('koerswinst op een debiteur', () => {
    const post = boekKoersverschil(
      {
        dagboekCode: 'MEM',
        boekdatum: '2026-04-30',
        omschrijving: 'Koersverschil factuur USD',
        valuta: 'EUR',
        verschil: eur('12.34'),
        tegenrekeningRol: 'debiteuren',
        relatieId: 'k-9',
        bronId: 'f-9',
      },
      register,
    );
    const s = saldi(post);
    assert.deepEqual(s[rekeningen.debiteuren.id], ['12.34', '0.00']);
    assert.deepEqual(s[rekeningen.koersverschillen.id], ['0.00', '12.34']);
  });

  test('omrekenen met een koers', () => {
    const usd = Money.vanTekst('1000.00', 'USD');
    const koers = Rate.koers('0.92000000');
    assert.equal(koers.reken(usd, 'EUR').toString(), '920.00');
  });
});

describe('property-based: elk patroon levert een sluitende post', () => {
  const bedragEenheden = fc.bigInt({ min: 1n, max: 10n ** 8n });

  test('verkoopfacturen met willekeurige regels blijven in balans', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(bedragEenheden, fc.constantFrom(VK21, VK9, VKICL)), { minLength: 1, maxLength: 12 }),
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
          const post = boekVerkoopfactuur(
            { ...basis, relatieId: 'k', regels: totalen.regels, totaalInclusief: totalen.totaalInclusief, factuurId: 'f' },
            register,
          );
          assert.ok(post.totaalDebet.gelijkAan(post.totaalCredit));
          assert.ok(post.totaalDebet.gelijkAan(totalen.totaalInclusief));
        },
      ),
      { numRuns: 250 },
    );
  });

  test('inkoopfacturen met verlegde btw blijven in balans', () => {
    fc.assert(
      fc.property(
        fc.array(fc.tuple(bedragEenheden, fc.constantFrom(IN21, INVERLEGD, INGEEN)), { minLength: 1, maxLength: 12 }),
        (regels) => {
          const totalen = berekenFactuur(
            regels.map(([e, code]) => ({
              omschrijving: 'r',
              bedrag: Money.vanEenheden(e, 'EUR'),
              btwCode: code,
              rekeningId: 'r-4300',
            })),
            'EUR',
          );
          const post = boekInkoopfactuur(
            { ...basis, dagboekCode: 'INK', relatieId: 'l', regels: totalen.regels, totaalInclusief: totalen.totaalInclusief, factuurId: 'i' },
            register,
          );
          assert.ok(post.totaalDebet.gelijkAan(post.totaalCredit));
        },
      ),
      { numRuns: 250 },
    );
  });

  test('banktransacties met willekeurige splitsingen blijven in balans', () => {
    fc.assert(
      fc.property(
        fc.array(bedragEenheden, { minLength: 1, maxLength: 8 }),
        fc.boolean(),
        (delen, ontvangst) => {
          const bedragen = delen.map((e) => Money.vanEenheden(e, 'EUR'));
          const totaal = Money.som(bedragen, 'EUR');
          const post = boekBanktransactie(
            {
              dagboekCode: 'BNK',
              boekdatum: '2026-04-05',
              omschrijving: 'Test',
              valuta: 'EUR',
              bankRekeningId: rekeningen.bank.id,
              bedrag: ontvangst ? totaal : totaal.negatie(),
              transactieId: 't',
              afletteringen: bedragen.map((bedrag, i) => ({
                rol: ontvangst ? ('debiteuren' as const) : ('crediteuren' as const),
                bedrag,
                relatieId: `r-${i}`,
                omschrijving: 'x',
              })),
            },
            register,
          );
          assert.ok(post.totaalDebet.gelijkAan(post.totaalCredit));
          assert.ok(post.totaalDebet.gelijkAan(totaal));
        },
      ),
      { numRuns: 250 },
    );
  });
});
