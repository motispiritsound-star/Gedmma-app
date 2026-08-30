/**
 * De bankbestandslezers, los getest zonder database: tekst erin, genormaliseerde
 * transacties eruit.
 */
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import {
  dedupeHash,
  ImportFout,
  leesBankbestand,
  leesBedrag,
  leesCamt053,
  leesCsv,
  leesDatum,
  leesMt940,
  ontleedMt940Toelichting,
  splitsCsvRegel,
} from '../src/import/banktransacties.ts';

describe('bedragen en datums lezen zoals banken ze schrijven', () => {
  test('bedragen', () => {
    assert.equal(leesBedrag('1234,56'), '1234.56');
    assert.equal(leesBedrag('1.234,56'), '1234.56');
    assert.equal(leesBedrag('1,234.56'), '1234.56');
    assert.equal(leesBedrag('-1234.56'), '-1234.56');
    assert.equal(leesBedrag('1234'), '1234.00');
    assert.equal(leesBedrag('(1234,56)'), '-1234.56');
    assert.equal(leesBedrag(' 1 234,56 '.replace(/ /g, ' ')), '1234.56');
  });

  test('onleesbare bedragen worden geweigerd met uitleg', () => {
    assert.throws(() => leesBedrag('abc'), ImportFout);
    assert.throws(() => leesBedrag(''), ImportFout);
  });

  test('datums', () => {
    assert.equal(leesDatum('2026-03-31'), '2026-03-31');
    assert.equal(leesDatum('20260331'), '2026-03-31');
    assert.equal(leesDatum('31-03-2026'), '2026-03-31');
    assert.equal(leesDatum('31/03/2026'), '2026-03-31');
    assert.throws(() => leesDatum('maart 2026'), ImportFout);
  });
});

describe('CSV', () => {
  test('velden met aanhalingstekens en scheidingstekens erin', () => {
    assert.deepEqual(splitsCsvRegel('a;"b;c";d', ';'), ['a', 'b;c', 'd']);
    assert.deepEqual(splitsCsvRegel('a;"zeg ""hallo""";c', ';'), ['a', 'zeg "hallo"', 'c']);
  });

  test('een afschrift met een af/bij-kolom', () => {
    const afschrift = leesCsv(
      [
        '"Datum";"Naam tegenpartij";"Rekening";"Tegenrekening";"Bedrag (EUR)";"Af Bij";"Omschrijving"',
        '"20260405";"Bakkerij Jansen";"NL91ABNA0417164300";"NL02ABNA0123456789";"1265,06";"Bij";"Factuur 2026-0001"',
        '"20260406";"Kantoorzaak";"NL91ABNA0417164300";"NL44RABO0123456789";"121,00";"Af";"Bureaustoel"',
      ].join('\n'),
    );
    assert.equal(afschrift.transacties.length, 2);
    assert.equal(afschrift.iban, 'NL91ABNA0417164300');
    assert.equal(afschrift.transacties[0]?.bedrag, '1265.06');
    assert.equal(afschrift.transacties[1]?.bedrag, '-121.00');
    assert.equal(afschrift.transacties[0]?.tegenpartij, 'Bakkerij Jansen');
    assert.equal(afschrift.vanDatum, '2026-04-05');
    assert.equal(afschrift.totDatum, '2026-04-06');
  });

  test('een afschrift met een komma als scheidingsteken en negatieve bedragen', () => {
    const afschrift = leesCsv(
      ['date,amount,description,counterparty', '2026-04-05,-45.50,Lunch,Restaurant'].join('\n'),
    );
    assert.equal(afschrift.transacties[0]?.bedrag, '-45.50');
    assert.equal(afschrift.transacties[0]?.omschrijving, 'Lunch');
  });

  test('een bestand zonder datum- of bedragkolom geeft een bruikbare fout', () => {
    let fout: ImportFout | null = null;
    try {
      leesCsv('naam;plaats\nJan;Utrecht');
    } catch (e) {
      fout = e as ImportFout;
    }
    assert.ok(fout);
    assert.match(fout.hint, /Gevonden kolommen: naam, plaats/);
  });
});

describe('MT940', () => {
  const bestand = [
    ':20:STARTDISK',
    ':25:NL91ABNA0417164300EUR',
    ':28C:24/1',
    ':60F:C260401EUR1000,00',
    ':61:2604050405C1265,06N654NONREF//B7GTSA2E',
    ':86:/EREF/2026-0001/IBAN/NL02ABNA0123456789/NAME/Bakkerij Jansen/REMI/Factuur 2026-0001',
    ':61:2604060406D121,00N123NONREF//B7GTSA2F',
    ':86:/IBAN/NL44RABO0123456789/NAME/Kantoorzaak/REMI/Bureaustoel',
    ':62F:C260430EUR2144,06',
    '-',
  ].join('\n');

  test('kop, saldi en transacties', () => {
    const afschrift = leesMt940(bestand);
    assert.equal(afschrift.iban, 'NL91ABNA0417164300');
    assert.equal(afschrift.afschriftnummer, '24/1');
    assert.equal(afschrift.beginsaldo, '1000.00');
    assert.equal(afschrift.eindsaldo, '2144.06');
    assert.equal(afschrift.transacties.length, 2);
  });

  test('bedragen, tekens en datums', () => {
    const afschrift = leesMt940(bestand);
    assert.equal(afschrift.transacties[0]?.boekdatum, '2026-04-05');
    assert.equal(afschrift.transacties[0]?.bedrag, '1265.06');
    assert.equal(afschrift.transacties[1]?.bedrag, '-121.00');
  });

  test('de toelichting levert tegenpartij, IBAN en kenmerk', () => {
    const afschrift = leesMt940(bestand);
    assert.equal(afschrift.transacties[0]?.tegenpartij, 'Bakkerij Jansen');
    assert.equal(afschrift.transacties[0]?.tegenrekening, 'NL02ABNA0123456789');
    assert.equal(afschrift.transacties[0]?.kenmerk, '2026-0001');
    assert.match(afschrift.transacties[0]?.omschrijving ?? '', /Factuur 2026-0001/);
  });

  test('ook de genummerde variant van de toelichting wordt gelezen', () => {
    const details = ontleedMt940Toelichting('?20Factuur 2026?21-0001?31NL02ABNA0123456789?32Bakkerij Jansen');
    assert.equal(details.iban, 'NL02ABNA0123456789');
    assert.equal(details.naam, 'Bakkerij Jansen');
    assert.match(details.omschrijving, /Factuur 2026/);
  });

  test('een bestand zonder transacties geeft een bruikbare fout', () => {
    assert.throws(() => leesMt940(':20:LEEG\n:25:NL91ABNA0417164300\n-'), ImportFout);
  });
});

describe('CAMT.053', () => {
  const bestand = `<?xml version="1.0" encoding="UTF-8"?>
<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.02">
  <BkToCstmrStmt>
    <Stmt>
      <ElctrncSeqNb>24</ElctrncSeqNb>
      <FrToDt><FrDtTm>2026-04-01T00:00:00</FrDtTm><ToDtTm>2026-04-30T23:59:59</ToDtTm></FrToDt>
      <Acct><Id><IBAN>NL91ABNA0417164300</IBAN></Id><Ccy>EUR</Ccy></Acct>
      <Bal>
        <Tp><CdOrPrtry><Cd>OPBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="EUR">1000.00</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      </Bal>
      <Bal>
        <Tp><CdOrPrtry><Cd>CLBD</Cd></CdOrPrtry></Tp>
        <Amt Ccy="EUR">2144.06</Amt><CdtDbtInd>CRDT</CdtDbtInd>
      </Bal>
      <Ntry>
        <Amt Ccy="EUR">1265.06</Amt>
        <CdtDbtInd>CRDT</CdtDbtInd>
        <BookgDt><Dt>2026-04-05</Dt></BookgDt>
        <ValDt><Dt>2026-04-05</Dt></ValDt>
        <NtryDtls><TxDtls>
          <Refs><EndToEndId>2026-0001</EndToEndId></Refs>
          <RltdPties>
            <Dbtr><Nm>Bakkerij Jansen</Nm></Dbtr>
            <DbtrAcct><Id><IBAN>NL02ABNA0123456789</IBAN></Id></DbtrAcct>
          </RltdPties>
          <RmtInf><Ustrd>Factuur 2026-0001</Ustrd></RmtInf>
        </TxDtls></NtryDtls>
      </Ntry>
      <Ntry>
        <Amt Ccy="EUR">121.00</Amt>
        <CdtDbtInd>DBIT</CdtDbtInd>
        <BookgDt><Dt>2026-04-06</Dt></BookgDt>
        <NtryDtls><TxDtls>
          <RltdPties>
            <Cdtr><Nm>Kantoorzaak</Nm></Cdtr>
            <CdtrAcct><Id><IBAN>NL44RABO0123456789</IBAN></Id></CdtrAcct>
          </RltdPties>
          <RmtInf><Ustrd>Bureaustoel</Ustrd></RmtInf>
        </TxDtls></NtryDtls>
      </Ntry>
    </Stmt>
  </BkToCstmrStmt>
</Document>`;

  test('kop, saldi en transacties', () => {
    const afschrift = leesCamt053(bestand);
    assert.equal(afschrift.iban, 'NL91ABNA0417164300');
    assert.equal(afschrift.beginsaldo, '1000.00');
    assert.equal(afschrift.eindsaldo, '2144.06');
    assert.equal(afschrift.transacties.length, 2);
    assert.equal(afschrift.vanDatum, '2026-04-01');
  });

  test('credit en debet krijgen het juiste teken', () => {
    const afschrift = leesCamt053(bestand);
    assert.equal(afschrift.transacties[0]?.bedrag, '1265.06');
    assert.equal(afschrift.transacties[1]?.bedrag, '-121.00');
  });

  test('tegenpartij en tegenrekening komen van de juiste kant', () => {
    const afschrift = leesCamt053(bestand);
    assert.equal(afschrift.transacties[0]?.tegenpartij, 'Bakkerij Jansen');
    assert.equal(afschrift.transacties[0]?.tegenrekening, 'NL02ABNA0123456789');
    assert.equal(afschrift.transacties[1]?.tegenpartij, 'Kantoorzaak');
    assert.equal(afschrift.transacties[1]?.tegenrekening, 'NL44RABO0123456789');
  });

  test('kenmerk en omschrijving', () => {
    const afschrift = leesCamt053(bestand);
    assert.equal(afschrift.transacties[0]?.kenmerk, '2026-0001');
    assert.equal(afschrift.transacties[0]?.omschrijving, 'Factuur 2026-0001');
  });

  test('een XML die geen CAMT is wordt herkend', () => {
    assert.throws(() => leesCamt053('<?xml version="1.0"?><iets/>'), ImportFout);
  });
});

describe('formaatherkenning en deduplicatie', () => {
  test('het juiste formaat wordt gekozen', () => {
    assert.equal(leesBankbestand('<?xml version="1.0"?><Document><BkToCstmrStmt><Stmt><Ntry><Amt>1.00</Amt><CdtDbtInd>CRDT</CdtDbtInd><BookgDt><Dt>2026-01-01</Dt></BookgDt></Ntry></Stmt></BkToCstmrStmt></Document>').bron, 'camt053');
    assert.equal(leesBankbestand(':20:X\n:25:NL91ABNA0417164300\n:61:2601010101C1,00N654NONREF\n:86:test').bron, 'mt940');
    assert.equal(leesBankbestand('datum;bedrag\n2026-01-01;1,00').bron, 'csv');
  });

  test('dezelfde transactie geeft dezelfde hash, een andere niet', () => {
    const basis = {
      boekdatum: '2026-04-05',
      valutadatum: null,
      bedrag: '100.00',
      valuta: 'EUR',
      tegenrekening: 'NL02ABNA0123456789',
      tegenpartij: 'Jan',
      omschrijving: 'Factuur 1',
      kenmerk: null,
      externeId: null,
    };
    assert.equal(dedupeHash(basis, 'NL91ABNA0417164300'), dedupeHash({ ...basis }, 'NL91ABNA0417164300'));
    assert.notEqual(dedupeHash(basis, 'NL91ABNA0417164300'), dedupeHash({ ...basis, bedrag: '100.01' }, 'NL91ABNA0417164300'));
    assert.notEqual(
      dedupeHash(basis, 'NL91ABNA0417164300'),
      dedupeHash(basis, 'NL44RABO0123456789'),
      'dezelfde regel op een andere rekening is een andere transactie',
    );
  });

  test('een verschil in spaties in de omschrijving telt niet als een andere transactie', () => {
    const a = { boekdatum: '2026-04-05', valutadatum: null, bedrag: '1.00', valuta: 'EUR', tegenrekening: null, tegenpartij: null, omschrijving: 'Factuur  1', kenmerk: null, externeId: null };
    const b = { ...a, omschrijving: 'Factuur 1 ' };
    assert.equal(dedupeHash(a, null), dedupeHash(b, null));
  });
});
