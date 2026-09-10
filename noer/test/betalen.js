// De betaalkant: accounts, sessies en het abonnement van begin tot eind.
//
// Alles draait tegen een nep-Mollie die dezelfde volgorde aanhoudt als de
// echte: eerst een betaling die openstaat, dan pas een mandaat, en pas dan een
// abonnement. Zo loopt hier hetzelfde pad als in het echt, zonder internet en
// zonder geld.
//
//   node --test test/betalen.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { maakServer } from '../server/maak.js';
import { NepMollie } from '../server/mollie.js';
import { plusPeriode, plusDagen } from '../server/abonnement.js';
import { PROEF, PLANNEN } from '../server/instellingen.js';
import { keurWachtwoord, maakSessie, leesSessie, hashWachtwoord, klopWachtwoord } from '../server/accounts.js';

/** Een server met een eigen map en een eigen nep-Mollie, per test. */
async function opstelling() {
  const map = await mkdtemp(join(tmpdir(), 'noer-betalen-'));
  const mollie = new NepMollie({ basisUrl: 'https://noer.test' });
  const { server, opslag } = await maakServer({
    instellingen: {
      poort: 0,
      basisUrl: 'https://noer.test',
      mollieSleutel: '',
      geheim: 'geheim-voor-de-test-lang-genoeg',
      gegevensMap: map,
      proef: true,
      wortel: new URL('..', import.meta.url).pathname,
    },
    mollie,
    log: () => {},
  });
  await new Promise((klaar) => server.listen(0, '127.0.0.1', klaar));
  const basis = `http://127.0.0.1:${server.address().port}`;

  // Een klantje met een koekjestrommel, zoals een browser dat doet.
  const maakKlant = () => {
    let koekje = null;
    return async (pad, { methode = 'GET', json, rauw, type } = {}) => {
      const antwoord = await fetch(`${basis}${pad}`, {
        method: methode,
        headers: {
          ...(json !== undefined || rauw !== undefined
            ? { 'content-type': type || (json !== undefined ? 'application/json' : 'application/x-www-form-urlencoded') }
            : {}),
          ...(koekje ? { cookie: koekje } : {}),
        },
        body: json !== undefined ? JSON.stringify(json) : rauw,
        redirect: 'manual',
      });
      const gezet = antwoord.headers.getSetCookie?.() || [];
      for (const regel of gezet) koekje = regel.split(';')[0];
      const tekst = await antwoord.text();
      let uit = null;
      try { uit = JSON.parse(tekst); } catch { uit = tekst; }
      return { status: antwoord.status, lichaam: uit };
    };
  };

  return {
    basis, mollie, opslag, maakKlant,
    async sluit() {
      await new Promise((klaar) => server.close(klaar));
      await rm(map, { recursive: true, force: true });
    },
  };
}

/** Registreren, betalen, en klaar zijn: het pad dat iedereen loopt. */
async function abonneer(klant, mollie, { email = 'ouder@voorbeeld.nl', plan = 'maand' } = {}) {
  await klant('/api/account/registreren', { methode: 'POST', json: { email, wachtwoord: 'eenlangwachtwoord' } });
  const start = await klant('/api/abonnement/starten', { methode: 'POST', json: { plan } });
  const betaling = [...mollie.betalingen.values()].at(-1);
  mollie.betaal(betaling.id);
  await klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${betaling.id}` });
  return { start, betaling };
}

test('een nieuw account kan inloggen, en niet met het verkeerde wachtwoord', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    const aan = await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'Ouder@Voorbeeld.NL', wachtwoord: 'eenlangwachtwoord' },
    });
    assert.equal(aan.status, 201);
    assert.equal(aan.lichaam.account.email, 'Ouder@Voorbeeld.NL');

    const ik = await klant('/api/account');
    assert.equal(ik.status, 200, 'na registreren hoor je ingelogd te zijn');

    // Hetzelfde adres, andere schrijfwijze: dat is hetzelfde account.
    const nogmaals = await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'ouder@voorbeeld.nl', wachtwoord: 'eenlangwachtwoord' },
    });
    assert.equal(nogmaals.status, 409);

    const tweede = o.maakKlant();
    const mis = await tweede('/api/account/inloggen', {
      methode: 'POST', json: { email: 'ouder@voorbeeld.nl', wachtwoord: 'ietsandersanders' },
    });
    assert.equal(mis.status, 401);
    assert.ok(!/wachtwoord klopt niet|onbekend adres/i.test(mis.lichaam.fout),
      'de foutmelding mag niet verklappen welke helft er fout was');

    const goed = await tweede('/api/account/inloggen', {
      methode: 'POST', json: { email: 'OUDER@voorbeeld.nl', wachtwoord: 'eenlangwachtwoord' },
    });
    assert.equal(goed.status, 200);
  } finally { await o.sluit(); }
});

test('een kort wachtwoord komt er niet in', async () => {
  assert.ok(keurWachtwoord('kort'));
  assert.equal(keurWachtwoord('tien tekens'), null);
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    const uit = await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'a@b.nl', wachtwoord: 'kort' },
    });
    assert.equal(uit.status, 400);
  } finally { await o.sluit(); }
});

test('het wachtwoord staat er niet leesbaar in, en niet twee keer hetzelfde', async () => {
  const een = await hashWachtwoord('eenlangwachtwoord');
  const twee = await hashWachtwoord('eenlangwachtwoord');
  assert.notEqual(een, twee, 'zonder zout is een gestolen bestand een lijstje');
  assert.ok(!een.includes('eenlangwachtwoord'));
  assert.equal(await klopWachtwoord('eenlangwachtwoord', een), true);
  assert.equal(await klopWachtwoord('eenlangwachtwoorx', een), false);
});

test('een sessiekoekje dat is bijgeschaafd telt niet meer', () => {
  const geheim = 'geheim-voor-de-test-lang-genoeg';
  const koekje = maakSessie('a123', geheim);
  assert.equal(leesSessie(koekje, geheim), 'a123');
  assert.equal(leesSessie(koekje, 'een ander geheim'), null);
  assert.equal(leesSessie(koekje.replace('a123', 'a999'), geheim), null,
    'iemand anders zijn account overnemen door het koekje te wijzigen');
  // Ouder dan dertig dagen: verlopen.
  const oud = maakSessie('a123', geheim, Date.now() - 31 * 24 * 3600 * 1000);
  assert.equal(leesSessie(oud, geheim), null);
});

test('zonder abonnement is er geen toegang tot het betaalde deel', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    const zonder = await klant('/api/toegang');
    assert.equal(zonder.status, 200);
    assert.equal(zonder.lichaam.actief, false);
    assert.equal(zonder.lichaam.ingelogd, false);
    assert.ok(zonder.lichaam.gratis.soeras.includes('an-nas'),
      'de app moet weten wat er gratis is, ook zonder account');

    await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'a@b.nl', wachtwoord: 'eenlangwachtwoord' },
    });
    const na = await klant('/api/toegang');
    assert.equal(na.lichaam.ingelogd, true);
    assert.equal(na.lichaam.actief, false, 'een account is nog geen abonnement');
  } finally { await o.sluit(); }
});

test('de eerste betaling is de verificatie, en start de proefweek', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'a@b.nl', wachtwoord: 'eenlangwachtwoord' },
    });

    const start = await klant('/api/abonnement/starten', { methode: 'POST', json: { plan: 'maand' } });
    assert.equal(start.status, 200);
    assert.match(start.lichaam.betaalUrl, /^https:\/\//);

    const betaling = [...o.mollie.betalingen.values()].at(-1);
    assert.equal(betaling.amount.value, PROEF.verificatiebedrag,
      'de eerste week is gratis; de eerste betaling is alleen de controle van de rekening');
    assert.equal(betaling.sequenceType, 'first', 'zonder eerste betaling komt er geen machtiging');

    // Zolang er niet betaald is, gebeurt er niets — ook niet als de webhook
    // wordt aangeroepen. De stand komt van Mollie, niet uit het verzoek.
    await klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${betaling.id}` });
    assert.equal((await klant('/api/toegang')).lichaam.actief, false);

    o.mollie.betaal(betaling.id);
    await klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${betaling.id}` });

    const toegang = (await klant('/api/toegang')).lichaam;
    assert.equal(toegang.actief, true);
    assert.equal(toegang.staat, 'proef');
    assert.equal(toegang.proef, true);
    const dagen = (Date.parse(toegang.tot) - Date.now()) / 86400000;
    assert.ok(dagen > 6.5 && dagen < 7.5, `de proefweek hoort zeven dagen te duren, niet ${dagen}`);

    const abonnementen = [...o.mollie.abonnementen.values()];
    assert.equal(abonnementen.length, 1, 'na de verificatie hoort het abonnement klaar te staan');
    assert.equal(abonnementen[0].interval, '1 month');
    assert.equal(abonnementen[0].amount.value, '7.99', 'het maandbedrag klopt niet');
    assert.equal(abonnementen[0].startDate, toegang.tot.slice(0, 10),
      'de eerste incasso hoort op de dag te vallen dat de proefweek afloopt, niet eerder');
  } finally { await o.sluit(); }
});

test('dezelfde webhook twee keer geeft geen maand cadeau', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    const { betaling } = await abonneer(klant, o.mollie);
    const eerst = (await klant('/api/toegang')).lichaam.tot;

    await klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${betaling.id}` });
    await klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${betaling.id}` });

    assert.equal((await klant('/api/toegang')).lichaam.tot, eerst);
    assert.equal([...o.mollie.abonnementen.values()].length, 1);
  } finally { await o.sluit(); }
});

test('de eerste incasso na de proefweek maakt er een gewoon abonnement van', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await abonneer(klant, o.mollie);
    const proefEind = (await klant('/api/toegang')).lichaam.tot;

    const abonnement = [...o.mollie.abonnementen.values()][0];
    const incasso = o.mollie.maandelijkseIncasso(abonnement.id);
    assert.equal(incasso.amount.value, '7.99', 'er wordt niet het maandbedrag geïncasseerd');
    await klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${incasso.id}` });

    const na = (await klant('/api/toegang')).lichaam;
    assert.equal(na.staat, 'actief', 'na de eerste incasso is het geen proef meer');
    assert.equal(na.proef, false);
    const dagen = (Date.parse(na.tot) - Date.parse(proefEind)) / 86400000;
    assert.ok(dagen > 27 && dagen < 32, `precies één maand erbij, niet ${dagen} dagen`);
  } finally { await o.sluit(); }
});

test('opzeggen tijdens de proefweek kost niets', async () => {
  // Dit is het moment waarop het misgaat bij de meeste diensten: je zegt op
  // binnen de gratis week en er wordt tóch geïncasseerd. Hier hoort het
  // abonnement bij Mollie meteen te stoppen, vóór de eerste incasso valt.
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await abonneer(klant, o.mollie);
    const proef = (await klant('/api/toegang')).lichaam;
    assert.equal(proef.staat, 'proef');

    await klant('/api/abonnement/opzeggen', { methode: 'POST', json: {} });

    const abonnement = [...o.mollie.abonnementen.values()][0];
    assert.equal(abonnement.status, 'canceled', 'de incasso van dag acht loopt gewoon door');

    const na = (await klant('/api/toegang')).lichaam;
    assert.equal(na.actief, true, 'de proefweek maak je af');
    assert.equal(na.tot, proef.tot, 'de proefweek hoort niet korter te worden door op te zeggen');
  } finally { await o.sluit(); }
});

test('opzeggen stopt de incasso maar niet de lopende maand', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await abonneer(klant, o.mollie);
    const tot = (await klant('/api/toegang')).lichaam.tot;

    const op = await klant('/api/abonnement/opzeggen', { methode: 'POST', json: {} });
    assert.equal(op.status, 200);

    const na = (await klant('/api/toegang')).lichaam;
    assert.equal(na.staat, 'opgezegd');
    assert.equal(na.actief, true, 'je hebt de maand betaald, dus je maakt de maand af');
    assert.equal(na.tot, tot);

    const abonnement = [...o.mollie.abonnementen.values()][0];
    assert.equal(abonnement.status, 'canceled', 'bij Mollie hoort de incasso meteen te stoppen');

    // En daarna weer aanzetten binnen dezelfde maand kost niets.
    const terug = await klant('/api/abonnement/hervatten', { methode: 'POST', json: {} });
    assert.equal(terug.status, 200);
    assert.equal(terug.lichaam.hervat, true);
    assert.equal((await klant('/api/toegang')).lichaam.staat, 'actief');
  } finally { await o.sluit(); }
});

test('een mislukte eerste betaling geeft geen toegang', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'a@b.nl', wachtwoord: 'eenlangwachtwoord' },
    });
    await klant('/api/abonnement/starten', { methode: 'POST', json: { plan: 'maand' } });
    const betaling = [...o.mollie.betalingen.values()].at(-1);
    o.mollie.mislukt(betaling.id, 'failed');
    await klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${betaling.id}` });

    const toegang = (await klant('/api/toegang')).lichaam;
    assert.equal(toegang.actief, false);
    assert.equal(toegang.staat, 'mislukt');
    assert.equal([...o.mollie.abonnementen.values()].length, 0);
  } finally { await o.sluit(); }
});

test('het jaarabonnement kost 79 euro en begint ook na de proefweek', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await abonneer(klant, o.mollie, { plan: 'jaar' });
    const toegang = (await klant('/api/toegang')).lichaam;
    assert.equal(toegang.plan, 'jaar');
    const dagen = (Date.parse(toegang.tot) - Date.now()) / 86400000;
    assert.ok(dagen > 6.5 && dagen < 7.5, `ook bij een jaarabonnement is de proefweek zeven dagen, niet ${dagen}`);
    assert.equal([...o.mollie.betalingen.values()][0].amount.value, PROEF.verificatiebedrag);
    const abonnement = [...o.mollie.abonnementen.values()][0];
    assert.equal(abonnement.interval, '12 months');
    assert.equal(abonnement.amount.value, '79.00');
  } finally { await o.sluit(); }
});

test('de prijzen staan op één plek, en dat is niet in een sjabloon', () => {
  // Als de prijs op de site en de prijs die Mollie int uit elkaar lopen,
  // incasseer je iets anders dan je hebt afgesproken.
  assert.equal(PLANNEN.maand.bedrag, '7.99');
  assert.equal(PLANNEN.jaar.bedrag, '79.00');
  assert.equal(PROEF.dagen, 7);
  assert.equal(plusDagen('2026-03-01T12:00:00Z', 7).toISOString().slice(0, 10), '2026-03-08');
});

test('een webhook voor een onbekende betaling laat de server niet omvallen', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    const uit = await klant('/api/mollie/webhook', { methode: 'POST', rauw: 'id=tr_bestaatniet' });
    // Altijd 200: een foutcode laat Mollie het uren blijven proberen.
    assert.equal(uit.status, 200);
    const leeg = await klant('/api/mollie/webhook', { methode: 'POST', rauw: '' });
    assert.equal(leeg.status, 200);
  } finally { await o.sluit(); }
});

test('zonder inloggen kun je geen abonnement starten of opzeggen', async () => {
  const o = await opstelling();
  try {
    const vreemde = o.maakKlant();
    for (const pad of ['/api/abonnement/starten', '/api/abonnement/opzeggen', '/api/account/wachtwoord']) {
      const uit = await vreemde(pad, { methode: 'POST', json: { plan: 'maand' } });
      assert.equal(uit.status, 401, `${pad} hoort dicht te zitten zonder sessie`);
    }
    assert.equal((await vreemde('/api/account')).status, 401);
  } finally { await o.sluit(); }
});

test('een formulier van een andere site komt er niet doorheen', async () => {
  // Een vreemde site kan een POST met een formulier laten versturen; JSON kan
  // hij niet sturen zonder dat de browser eerst toestemming vraagt. Daarom
  // accepteert de server alleen JSON voor alles wat iets verandert.
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'a@b.nl', wachtwoord: 'eenlangwachtwoord' },
    });
    const uit = await klant('/api/abonnement/starten', {
      methode: 'POST', rauw: 'plan=maand', type: 'application/x-www-form-urlencoded',
    });
    assert.equal(uit.status, 400);
  } finally { await o.sluit(); }
});

test('het wachtwoord wijzigen kan alleen met het oude erbij', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'a@b.nl', wachtwoord: 'eenlangwachtwoord' },
    });
    const mis = await klant('/api/account/wachtwoord', {
      methode: 'POST', json: { oud: 'ietsanders123', nieuw: 'nogeenlangwachtwoord' },
    });
    assert.equal(mis.status, 401);

    const goed = await klant('/api/account/wachtwoord', {
      methode: 'POST', json: { oud: 'eenlangwachtwoord', nieuw: 'nogeenlangwachtwoord' },
    });
    assert.equal(goed.status, 200);

    const opnieuw = o.maakKlant();
    assert.equal((await opnieuw('/api/account/inloggen', {
      methode: 'POST', json: { email: 'a@b.nl', wachtwoord: 'nogeenlangwachtwoord' },
    })).status, 200);
  } finally { await o.sluit(); }
});

test('te veel keer het verkeerde wachtwoord en de deur gaat op slot', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'a@b.nl', wachtwoord: 'eenlangwachtwoord' },
    });
    const dief = o.maakKlant();
    let laatste = null;
    for (let i = 0; i < 12; i++) {
      laatste = await dief('/api/account/inloggen', {
        methode: 'POST', json: { email: 'a@b.nl', wachtwoord: `gokje${i}` },
      });
    }
    assert.equal(laatste.status, 429, 'wachtwoorden gokken hoort ergens te stoppen');
  } finally { await o.sluit(); }
});

test('een periode optellen slaat geen maand over aan het eind van de maand', () => {
  // 31 januari plus een maand is 28 februari. Rekent iemand met 30 dagen, dan
  // schuift de incassodatum elk jaar op.
  assert.equal(plusPeriode(new Date('2026-01-31T10:00:00Z'), '1 month').toISOString().slice(0, 10), '2026-02-28');
  assert.equal(plusPeriode(new Date('2028-01-31T10:00:00Z'), '1 month').toISOString().slice(0, 10), '2028-02-29');
  assert.equal(plusPeriode(new Date('2026-03-15T10:00:00Z'), '1 month').toISOString().slice(0, 10), '2026-04-15');
  assert.equal(plusPeriode(new Date('2026-12-15T10:00:00Z'), '1 month').toISOString().slice(0, 10), '2027-01-15');
  assert.equal(plusPeriode(new Date('2028-02-29T10:00:00Z'), '12 months').toISOString().slice(0, 10), '2029-02-28');
});

test('het account van een ander is niet te lezen', async () => {
  const o = await opstelling();
  try {
    const een = o.maakKlant();
    await abonneer(een, o.mollie, { email: 'een@voorbeeld.nl' });
    const twee = o.maakKlant();
    await twee('/api/account/registreren', {
      methode: 'POST', json: { email: 'twee@voorbeeld.nl', wachtwoord: 'eenlangwachtwoord' },
    });
    const ik = await twee('/api/account');
    assert.equal(ik.lichaam.account.email, 'twee@voorbeeld.nl');
    assert.equal((await twee('/api/toegang')).lichaam.actief, false,
      'het abonnement van de een hoort niet bij de ander te horen');
  } finally { await o.sluit(); }
});

test('de opslag overleeft twee webhooks tegelijk', async () => {
  const o = await opstelling();
  try {
    const klant = o.maakKlant();
    await klant('/api/account/registreren', {
      methode: 'POST', json: { email: 'a@b.nl', wachtwoord: 'eenlangwachtwoord' },
    });
    await klant('/api/abonnement/starten', { methode: 'POST', json: { plan: 'maand' } });
    const betaling = [...o.mollie.betalingen.values()].at(-1);
    o.mollie.betaal(betaling.id);

    await Promise.all([
      klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${betaling.id}` }),
      klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${betaling.id}` }),
      klant('/api/mollie/webhook', { methode: 'POST', rauw: `id=${betaling.id}` }),
    ]);

    const toegang = (await klant('/api/toegang')).lichaam;
    assert.equal(toegang.actief, true);
    const dagen = (Date.parse(toegang.tot) - Date.now()) / 86400000;
    assert.ok(dagen < 32, 'drie webhooks tegelijk mogen geen drie maanden opleveren');
  } finally { await o.sluit(); }
});

test('de proefingang om te betalen bestaat alleen in de proefstand', async () => {
  // In de proefstand is dit hoe je de betaling afrondt zonder bank; staat de
  // stand uit, dan hoort dit eindpunt niet te bestaan. Zonder deze controle
  // sluipt er een deurtje mee naar de live server.
  const map = await mkdtemp(join(tmpdir(), 'noer-echt-'));
  const mollie = new NepMollie({ basisUrl: 'https://noer.test' });
  const { server } = await maakServer({
    instellingen: {
      poort: 0, basisUrl: 'https://noer.test', mollieSleutel: 'test_nep',
      geheim: 'geheim-voor-de-test-lang-genoeg', gegevensMap: map, proef: false,
      wortel: new URL('..', import.meta.url).pathname,
    },
    mollie,
    log: () => {},
  });
  await new Promise((klaar) => server.listen(0, '127.0.0.1', klaar));
  const basis = `http://127.0.0.1:${server.address().port}`;
  try {
    const uit = await fetch(`${basis}/api/proef/betaal`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://noer.test' },
      body: '{}',
    });
    assert.equal(uit.status, 404, 'zonder de proefstand hoort dit eindpunt niet te bestaan');

    // Ook niet met een geldige sessie erbij.
    const aan = await fetch(`${basis}/api/account/registreren`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://noer.test' },
      body: JSON.stringify({ email: 'a@b.nl', wachtwoord: 'eenlangwachtwoord' }),
    });
    const koekje = (aan.headers.getSetCookie?.() || [])[0].split(';')[0];
    const nogmaals = await fetch(`${basis}/api/proef/betaal`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: 'https://noer.test', cookie: koekje },
      body: '{}',
    });
    assert.equal(nogmaals.status, 404, 'de proefingang hoort er niet te zijn zonder NOER_PROEF');
  } finally {
    await new Promise((klaar) => server.close(klaar));
    await rm(map, { recursive: true, force: true });
  }
});

test('na een geslaagde eerste betaling gaat er een bevestiging de deur uit', async () => {
  // Wie online een abonnement afsluit, hoort een bevestiging te krijgen die hij
  // kan bewaren. Dat is geen service maar artikel 6:230v BW.
  const map = await mkdtemp(join(tmpdir(), 'noer-mail-'));
  const mollie = new NepMollie({ basisUrl: 'https://noer.test' });
  const verstuurd = [];
  const { server } = await maakServer({
    instellingen: {
      poort: 0, basisUrl: 'https://noer.test', mollieSleutel: '',
      geheim: 'geheim-voor-de-test-lang-genoeg', gegevensMap: map, proef: true,
      wortel: new URL('..', import.meta.url).pathname,
    },
    mollie,
    post: async (bericht) => { verstuurd.push(bericht); return { verstuurd: true }; },
    log: () => {},
  });
  await new Promise((klaar) => server.listen(0, '127.0.0.1', klaar));
  const basis = `http://127.0.0.1:${server.address().port}`;

  let koekje = null;
  const post = async (pad, lichaam) => {
    const a = await fetch(`${basis}${pad}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...(koekje ? { cookie: koekje } : {}) },
      body: JSON.stringify(lichaam || {}),
    });
    for (const regel of a.headers.getSetCookie?.() || []) koekje = regel.split(';')[0];
    return { status: a.status, ...(await a.json().catch(() => ({}))) };
  };

  try {
    await post('/api/account/registreren', { email: 'ouder@voorbeeld.nl', wachtwoord: 'eenlangwachtwoord' });
    assert.equal(verstuurd.length, 0, 'een account aanmaken is nog geen aankoop');

    await post('/api/abonnement/starten', { plan: 'maand' });
    const betaling = [...mollie.betalingen.values()].at(-1);
    mollie.betaal(betaling.id);
    await fetch(`${basis}/api/mollie/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `id=${betaling.id}`,
    });

    assert.equal(verstuurd.length, 1, 'geen bevestiging verstuurd');
    const [mail] = verstuurd;
    assert.equal(mail.aan, 'ouder@voorbeeld.nl');
    assert.match(mail.tekst, /7,99/, 'de bevestiging noemt het bedrag niet');
    assert.match(mail.tekst, /per maand/, 'de bevestiging noemt de termijn niet');
    assert.match(mail.tekst, /0,01/, 'de bevestiging verzwijgt de afschrijving van één cent');
    assert.match(mail.tekst, /gratis/, 'de bevestiging noemt de proefweek niet');
    assert.match(mail.tekst, /voorwaarden/, 'de bevestiging verwijst niet naar de voorwaarden');
    assert.match(mail.tekst, /[Oo]pzeggen/, 'de bevestiging zegt niet hoe je eraf komt');

    // De incasso van de volgende maand levert géén nieuwe mail op: post die
    // niemand wil.
    const abonnement = [...mollie.abonnementen.values()][0];
    const incasso = mollie.maandelijkseIncasso(abonnement.id);
    await fetch(`${basis}/api/mollie/webhook`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: `id=${incasso.id}`,
    });
    assert.equal(verstuurd.length, 1, 'elke maand een mail sturen is spam');

    // Opzeggen bevestigt wel weer, met de datum tot wanneer het nog werkt.
    await post('/api/abonnement/opzeggen', {});
    assert.equal(verstuurd.length, 2);
    assert.match(verstuurd[1].onderwerp, /opgezegd/i);
    assert.match(verstuurd[1].tekst, /niets meer afgeschreven/);
  } finally {
    await new Promise((klaar) => server.close(klaar));
    await rm(map, { recursive: true, force: true });
  }
});

test('een maildienst die eruit ligt houdt geen betaling tegen', async () => {
  const { maakPost } = await import('../server/mail.js');
  const regels = [];
  const stuur = maakPost({
    dienst: 'resend', sleutel: 'nep', van: 'Noer <noer@test.nl>',
    log: (r) => regels.push(r),
    haal: async () => { throw new Error('netwerk weg'); },
  });
  const uit = await stuur({ aan: 'a@b.nl', onderwerp: 'Test', tekst: 'Hallo' });
  assert.equal(uit.verstuurd, false);
  assert.match(regels.join(' '), /mail mislukt/);

  // En zonder ingestelde dienst schrijft hij het op in plaats van te klappen.
  const zonder = maakPost({ dienst: '', sleutel: '', van: '', log: (r) => regels.push(r) });
  assert.equal((await zonder({ aan: 'a@b.nl', onderwerp: 'Test', tekst: '' })).verstuurd, false);
  assert.match(regels.join(' '), /niet verstuurd/);
});
