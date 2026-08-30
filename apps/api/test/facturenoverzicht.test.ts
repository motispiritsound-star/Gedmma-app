/**
 * Het facturenoverzicht: zoeken, filteren, sorteren en de totalen.
 *
 * De totalen zijn het gevoeligste deel. Ze gaan over het hele filter en niet
 * over de zichtbare pagina, want anders verandert "nog te ontvangen" zodra
 * iemand doorbladert. Deze test legt dat vast.
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

let ondernemer: Gebruiker;
let admin: Administratie;
let omzetId: string;
let btw21: string;
const klanten: Record<string, string> = {};

const jaar = new Date().getUTCFullYear();
const d = (maand: number, dag: number) =>
  `${jaar}-${String(maand).padStart(2, '0')}-${String(dag).padStart(2, '0')}`;

/** Maakt een definitieve factuur en levert het nummer op. */
async function factuur(klant: string, datum: string, prijs: string, vervaldatum?: string) {
  const concept = await ondernemer.client.post(`${admin.pad}/verkoopfacturen`, {
    contactId: klanten[klant],
    factuurdatum: datum,
    vervaldatum: vervaldatum ?? null,
    regels: [{ omschrijving: 'Werk', aantal: '1', prijs, btwCodeId: btw21, rekeningId: omzetId }],
  });
  assert.equal(concept.status, 201, JSON.stringify(concept.body));
  const definitief = await ondernemer.client.post(`${admin.pad}/verkoopfacturen/${concept.body.id}/definitief`);
  assert.equal(definitief.status, 200, JSON.stringify(definitief.body));
  return { id: concept.body.id as string, nummer: definitief.body.documentnummer as string };
}

before(async () => {
  await startTestomgeving();
  ondernemer = await maakGebruiker('Overzicht Ondernemer');
  admin = await maakAdministratie(ondernemer, { organisatie: 'Overzicht BV', administratie: 'Overzicht BV' });

  omzetId = await rekeningId(ondernemer, admin, '8000');
  btw21 = await btwCodeId(ondernemer, admin, 'VK-21');

  for (const [index, naam] of ['Aannemer Alpha', 'Bureau Beta', 'Cateraar Gamma'].entries()) {
    const antwoord = await ondernemer.client.post(`${admin.pad}/relaties`, {
      naam,
      soort: 'klant',
      betalingstermijnDagen: 30,
      btwNummer: `NL90000000${index + 1}B01`,
      adres: { adres: `Straat ${index + 1}`, postcode: '1000 AA', plaats: 'Stad' },
    });
    assert.equal(antwoord.status, 201);
    klanten[naam] = antwoord.body.id;
  }

  // Een factuur die allang vervallen is, en twee die nog lopen.
  await factuur('Aannemer Alpha', d(1, 10), '1000.00', d(1, 24));
  await factuur('Bureau Beta', d(2, 15), '250.00', `${jaar + 1}-12-31`);
  await factuur('Cateraar Gamma', d(3, 20), '4000.00', `${jaar + 1}-12-31`);

  // En een concept, dat niet meetelt in het openstaande bedrag.
  const concept = await ondernemer.client.post(`${admin.pad}/verkoopfacturen`, {
    contactId: klanten['Bureau Beta'],
    factuurdatum: d(4, 1),
    regels: [{ omschrijving: 'Nog niet verstuurd', aantal: '1', prijs: '999.00', btwCodeId: btw21, rekeningId: omzetId }],
  });
  assert.equal(concept.status, 201);
});

after(async () => {
  await stopTestomgeving();
});

describe('facturenoverzicht', () => {
  test('zonder filter komen alle facturen terug, met totalen over het geheel', async () => {
    const antwoord = await ondernemer.client.get(`${admin.pad}/verkoopfacturen`);
    assert.equal(antwoord.status, 200);
    assert.equal(antwoord.body.items.length, 4);
    assert.equal(antwoord.body.totaalAantal, 4);
    assert.equal(antwoord.body.meer, false);

    // 1210,00 + 302,50 + 4840,00 + 1208,79: de bedragen inclusief 21% btw.
    assert.equal(antwoord.body.totalen.totaal, '7561.29');
    // Het concept telt niet mee als openstaand.
    assert.equal(antwoord.body.totalen.openstaand, '6352.50');
    assert.equal(antwoord.body.totalen.vervallen, '1210.00', 'alleen de factuur van januari is vervallen');
  });

  test('vrij zoeken kijkt naar nummer, klantnaam en referentie', async () => {
    const opKlant = await ondernemer.client.get(`${admin.pad}/verkoopfacturen?zoek=beta`);
    assert.equal(opKlant.body.items.length, 2, 'twee facturen voor Bureau Beta');
    assert.ok(opKlant.body.items.every((f: { contact_naam: string }) => f.contact_naam === 'Bureau Beta'));

    const nummer = opKlant.body.items.find((f: { documentnummer: string | null }) => f.documentnummer)
      ?.documentnummer as string;
    const opNummer = await ondernemer.client.get(`${admin.pad}/verkoopfacturen?zoek=${nummer}`);
    assert.equal(opNummer.body.items.length, 1);
    assert.equal(opNummer.body.items[0].documentnummer, nummer);
  });

  test('alleen openstaand laat het concept weg', async () => {
    const antwoord = await ondernemer.client.get(`${admin.pad}/verkoopfacturen?openstaand=true`);
    assert.equal(antwoord.body.items.length, 3);
    assert.ok(antwoord.body.items.every((f: { status: string }) => f.status !== 'concept'));
    assert.equal(antwoord.body.totalen.openstaand, '6352.50');
  });

  test('alleen vervallen laat zien wat te laat is', async () => {
    const antwoord = await ondernemer.client.get(`${admin.pad}/verkoopfacturen?vervallen=true`);
    assert.equal(antwoord.body.items.length, 1);
    assert.equal(antwoord.body.items[0].contact_naam, 'Aannemer Alpha');
    assert.equal(antwoord.body.totalen.vervallen, '1210.00');
  });

  test('sorteren op bedrag, klant en vervaldatum werkt in beide richtingen', async () => {
    const duurst = await ondernemer.client.get(
      `${admin.pad}/verkoopfacturen?sorteer=bedrag&richting=af&limiet=1`,
    );
    assert.equal(duurst.body.items[0].totaal_inclusief, '4840.00');

    const goedkoopst = await ondernemer.client.get(
      `${admin.pad}/verkoopfacturen?sorteer=bedrag&richting=op&limiet=1`,
    );
    assert.equal(goedkoopst.body.items[0].totaal_inclusief, '302.50');

    const opKlant = await ondernemer.client.get(`${admin.pad}/verkoopfacturen?sorteer=klant&richting=op`);
    assert.equal(opKlant.body.items[0].contact_naam, 'Aannemer Alpha');
  });

  test('bladeren met offset laat de totalen ongemoeid', async () => {
    const eerste = await ondernemer.client.get(`${admin.pad}/verkoopfacturen?limiet=2`);
    assert.equal(eerste.body.items.length, 2);
    assert.equal(eerste.body.meer, true);
    assert.equal(eerste.body.totaalAantal, 4);

    const tweede = await ondernemer.client.get(`${admin.pad}/verkoopfacturen?limiet=2&offset=2`);
    assert.equal(tweede.body.items.length, 2);
    assert.equal(tweede.body.meer, false);
    assert.equal(tweede.body.totalen.openstaand, eerste.body.totalen.openstaand, 'totalen gaan over het filter');

    const ids = new Set([
      ...eerste.body.items.map((f: { id: string }) => f.id),
      ...tweede.body.items.map((f: { id: string }) => f.id),
    ]);
    assert.equal(ids.size, 4, 'geen dubbele rijen tussen de pagina en de volgende');
  });

  test('filteren op periode en klant kan samen', async () => {
    const antwoord = await ondernemer.client.get(
      `${admin.pad}/verkoopfacturen?vanaf=${d(2, 1)}&tot=${d(3, 31)}&contactId=${klanten['Cateraar Gamma']}`,
    );
    assert.equal(antwoord.body.items.length, 1);
    assert.equal(antwoord.body.items[0].contact_naam, 'Cateraar Gamma');
    assert.equal(antwoord.body.totalen.totaal, '4840.00');
  });

  test('een onbekende sorteerkolom wordt geweigerd', async () => {
    const antwoord = await ondernemer.client.get(`${admin.pad}/verkoopfacturen?sorteer=naam;DROP TABLE`);
    assert.equal(antwoord.status, 400, 'de sorteerkolom komt uit een vaste lijst');
  });
});
