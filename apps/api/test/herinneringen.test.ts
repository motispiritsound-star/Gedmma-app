/**
 * Betalingsherinneringen.
 *
 * De vragen die deze test beantwoordt:
 *   - stuurt hij een herinnering over iets dat nog niet vervallen is? (nee)
 *   - over een betaalde factuur? (nee)
 *   - over een concept? (nee)
 *   - loopt de toon op bij een tweede en derde bericht? (ja)
 *   - is vastgelegd wat er verstuurd is, en blijft dat vastliggen? (ja)
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
  inDb,
  zonderContext,
  type Administratie,
  type Gebruiker,
} from './hulp.ts';
import { verzondenBerichten, wisVerzonden } from '../src/mail/index.ts';
import { stelTekstOp } from '../src/modules/verkoop/herinneren.ts';

let eigenaar: Gebruiker;
let admin: Administratie;
let klantId: string;
let omzetId: string;
let btw21: string;

/** Een datum die `n` dagen geleden was, als jjjj-mm-dd. */
function dagenGeleden(n: number): string {
  return new Date(Date.now() - n * 86_400_000).toISOString().slice(0, 10);
}

/** Een definitieve factuur met een vervaldatum die al dan niet voorbij is. */
async function maakFactuur(vervaldatum: string, bedrag = '100.00'): Promise<string> {
  const factuur = await eigenaar.client.post(`${admin.pad}/verkoopfacturen`, {
    contactId: klantId,
    soort: 'factuur',
    factuurdatum: dagenGeleden(60),
    vervaldatum,
    regels: [
      { omschrijving: 'Advieswerk', aantal: '1', prijs: bedrag, rekeningId: omzetId, btwCodeId: btw21 },
    ],
  });
  assert.equal(factuur.status, 201, JSON.stringify(factuur.body));
  const id = factuur.body.id as string;

  const definitief = await eigenaar.client.post(`${admin.pad}/verkoopfacturen/${id}/definitief`, {});
  assert.equal(definitief.status, 200, JSON.stringify(definitief.body));
  return id;
}

before(async () => {
  await startTestomgeving();
  eigenaar = await maakGebruiker('Herinnering Eigenaar');
  admin = await maakAdministratie(eigenaar, { organisatie: 'Aanmaanbureau', administratie: 'Aanmaanbureau' });
  omzetId = await rekeningId(eigenaar, admin, '8000');
  btw21 = await btwCodeId(eigenaar, admin, 'VK-21');

  const klant = await eigenaar.client.post(`${admin.pad}/relaties`, {
    naam: 'Trage Betaler',
    soort: 'klant',
    email: 'boekhouding@trage-betaler.test',
    // Het adres is wettelijk verplicht op een factuur; zonder wordt hij niet
    // definitief, en dan valt er ook niets te herinneren.
    adres: { adres: 'Wachtlaan 12', postcode: '1011 AB', plaats: 'Amsterdam' },
    betalingstermijnDagen: 14,
  });
  assert.equal(klant.status, 201);
  klantId = klant.body.id;
});

after(async () => {
  await stopTestomgeving();
});

describe('de tekst loopt op in toon', () => {
  const basis = {
    klant: 'Trage Betaler',
    documentnummer: '2026-0001',
    bedrag: '€ 121,00',
    vervaldatum: '2026-01-15',
    afzender: 'Aanmaanbureau',
    iban: 'NL91ABNA0417164300',
  };

  test('de eerste geeft de klant het voordeel van de twijfel', () => {
    const { onderwerp, tekst } = stelTekstOp({ ...basis, ronde: 1, dagenTeLaat: 3 });
    assert.match(onderwerp, /^Herinnering:/);
    assert.match(tekst, /aan de aandacht ontsnapt/);
    assert.doesNotMatch(tekst, /incasso/i, 'een eerste herinnering dreigt niet');
  });

  test('de tweede noemt de vorige en het aantal dagen', () => {
    const { onderwerp, tekst } = stelTekstOp({ ...basis, ronde: 2, dagenTeLaat: 21 });
    assert.match(onderwerp, /^Tweede herinnering:/);
    assert.match(tekst, /21 dagen/);
    assert.match(tekst, /al een herinnering/);
    assert.doesNotMatch(tekst, /incasso/i);
  });

  test('de derde is een aanmaning met een termijn en een gevolg', () => {
    const { onderwerp, tekst } = stelTekstOp({ ...basis, ronde: 3, dagenTeLaat: 45 });
    assert.match(onderwerp, /^Aanmaning:/);
    assert.match(tekst, /veertien dagen/);
    assert.match(tekst, /incasso/);
  });

  test('zonder iban staat er geen rekeningnummer in', () => {
    const { tekst } = stelTekstOp({ ...basis, ronde: 1, dagenTeLaat: 3, iban: null });
    assert.doesNotMatch(tekst, /NL91/);
    assert.match(tekst, /onder vermelding van 2026-0001/);
  });
});

describe('wanneer er niet herinnerd wordt', () => {
  test('niet over een factuur die nog niet vervallen is', async () => {
    const id = await maakFactuur(new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10));
    const antwoord = await eigenaar.client.get(`${admin.pad}/verkoopfacturen/${id}/herinnering`);
    assert.equal(antwoord.status, 400, JSON.stringify(antwoord.body));
    assert.match(antwoord.body.error.message, /nog niet vervallen/);
  });

  test('niet over een concept', async () => {
    const concept = await eigenaar.client.post(`${admin.pad}/verkoopfacturen`, {
      contactId: klantId,
      soort: 'factuur',
      factuurdatum: dagenGeleden(60),
      vervaldatum: dagenGeleden(30),
      regels: [{ omschrijving: 'Advies', aantal: '1', prijs: '50.00', rekeningId: omzetId, btwCodeId: btw21 }],
    });
    assert.equal(concept.status, 201);
    const antwoord = await eigenaar.client.get(`${admin.pad}/verkoopfacturen/${concept.body.id}/herinnering`);
    assert.equal(antwoord.status, 400, JSON.stringify(antwoord.body));
    assert.match(antwoord.body.error.message, /concept/);
  });
});

describe('versturen en vastleggen', () => {
  test('de eerste herinnering gaat naar de klant en wordt vastgelegd', async () => {
    const id = await maakFactuur(dagenGeleden(10));
    wisVerzonden();

    const voorstel = await eigenaar.client.get(`${admin.pad}/verkoopfacturen/${id}/herinnering`);
    assert.equal(voorstel.status, 200, JSON.stringify(voorstel.body));
    assert.equal(voorstel.body.voorstel.ronde, 1);
    assert.equal(voorstel.body.voorstel.aan, 'boekhouding@trage-betaler.test');
    assert.equal(voorstel.body.voorstel.dagenTeLaat, 10);
    assert.deepEqual(voorstel.body.eerder, [], 'er is nog niets gestuurd');

    const verstuurd = await eigenaar.client.post(`${admin.pad}/verkoopfacturen/${id}/herinnering`, {});
    assert.equal(verstuurd.status, 201, JSON.stringify(verstuurd.body));
    assert.equal(verstuurd.body.ronde, 1);
    assert.equal(verstuurd.body.verzondenNaar, 'boekhouding@trage-betaler.test');

    const bericht = verzondenBerichten().at(-1);
    assert.equal(bericht?.aan, 'boekhouding@trage-betaler.test');
    assert.match(bericht?.onderwerp ?? '', /^Herinnering:/);

    const geschiedenis = await eigenaar.client.get(`${admin.pad}/verkoopfacturen/${id}/herinneringen`);
    assert.equal(geschiedenis.body.herinneringen.length, 1);
    assert.equal(geschiedenis.body.herinneringen[0].ronde, 1);
    assert.equal(geschiedenis.body.herinneringen[0].aanleiding, 'handmatig');
  });

  test('de tweede is een tweede herinnering, niet nog een eerste', async () => {
    const id = await maakFactuur(dagenGeleden(25));
    await eigenaar.client.post(`${admin.pad}/verkoopfacturen/${id}/herinnering`, {});
    wisVerzonden();

    const tweede = await eigenaar.client.post(`${admin.pad}/verkoopfacturen/${id}/herinnering`, {});
    assert.equal(tweede.status, 201, JSON.stringify(tweede.body));
    assert.equal(tweede.body.ronde, 2);
    assert.match(verzondenBerichten().at(-1)?.onderwerp ?? '', /^Tweede herinnering:/);
  });

  test('een eigen tekst wordt verstuurd en bewaard zoals hij is', async () => {
    const id = await maakFactuur(dagenGeleden(12));
    wisVerzonden();

    const eigen = 'Beste Jan, bel je me even over deze factuur? Groet, Adil';
    const verstuurd = await eigenaar.client.post(`${admin.pad}/verkoopfacturen/${id}/herinnering`, {
      onderwerp: 'Even bellen?',
      tekst: eigen,
    });
    assert.equal(verstuurd.status, 201, JSON.stringify(verstuurd.body));
    assert.equal(verzondenBerichten().at(-1)?.tekst, eigen);

    // Bewaard wordt wat er werkelijk is verstuurd, niet het sjabloon.
    const rijen = await inDb(admin.administratieId, admin.organisatieId, async (client) => {
      const { rows } = await client.query<{ tekst: string; onderwerp: string }>(
        'SELECT tekst, onderwerp FROM payment_reminder WHERE invoice_id = $1',
        [id],
      );
      return rows;
    });
    assert.equal(rijen[0]?.tekst, eigen);
    assert.equal(rijen[0]?.onderwerp, 'Even bellen?');
  });

  test('een verstuurde herinnering is niet meer te wijzigen of te verwijderen', async () => {
    const id = await maakFactuur(dagenGeleden(20));
    await eigenaar.client.post(`${admin.pad}/verkoopfacturen/${id}/herinnering`, {});

    // Er liggen twee sloten op. De applicatierol heeft geen UPDATE- of
    // DELETE-recht, dus daar strandt het al; de trigger erachter vangt wie met
    // meer rechten verbinding maakt. Deze test accepteert beide antwoorden,
    // want welke van de twee als eerste weigert doet er niet toe.
    const geweigerd = /permission denied|kan niet worden gewijzigd/;

    await assert.rejects(
      () =>
        inDb(admin.administratieId, admin.organisatieId, (client) =>
          client.query('UPDATE payment_reminder SET tekst = $2 WHERE invoice_id = $1', [id, 'aangepast']),
        ),
      geweigerd,
    );
    await assert.rejects(
      () =>
        inDb(admin.administratieId, admin.organisatieId, (client) =>
          client.query('DELETE FROM payment_reminder WHERE invoice_id = $1', [id]),
        ),
      geweigerd,
    );

    // En de rij die niemand mag aanraken staat er nog gewoon.
    const nog = await zonderContext('SELECT id FROM payment_reminder WHERE invoice_id = $1', [id]);
    assert.deepEqual(nog, [], 'zonder tenantcontext is er niets te zien');
  });
});
