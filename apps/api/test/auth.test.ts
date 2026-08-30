/** Aanmelden, tweefactorauthenticatie, sessies en wachtwoordbeleid. */
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { maakGebruiker, nieuweClient, startTestomgeving, stopTestomgeving, wisSnelheidsbegrenzing } from './hulp.ts';
import { berekenCode, controleerCode, nieuwGeheim, nieuweHerstelcodes, otpauthUri, vanBase32, naarBase32 } from '../src/auth/totp.ts';
import { beoordeelWachtwoord, scryptHasher } from '../src/auth/wachtwoord.ts';

before(async () => {
  await startTestomgeving();
});
after(async () => {
  await stopTestomgeving();
});

describe('registreren en aanmelden', () => {
  test('een gebruiker kan zich registreren en aanmelden', async () => {
    const gebruiker = await maakGebruiker('Nieuwe Gebruiker');
    const ik = await gebruiker.client.get('/api/v1/auth/me');
    assert.equal(ik.status, 200);
    assert.equal(ik.body.aangemeld, true);
    assert.equal(ik.body.gebruiker.naam, 'Nieuwe Gebruiker');
    assert.equal(ik.body.gebruiker.mfaIngeschakeld, false);
  });

  test('een zwak wachtwoord wordt geweigerd met uitleg', async () => {
    const client = nieuweClient();
    const antwoord = await client.post('/api/v1/auth/register', {
      email: `zwak-${Date.now()}@voorbeeld.test`,
      naam: 'Zwak',
      wachtwoord: 'kort',
    });
    assert.equal(antwoord.status, 400);
    assert.equal(antwoord.body.error.code, 'validation_failed');
    assert.match(antwoord.body.error.hint, /12 tekens/);
  });

  test('een bestaand e-mailadres geeft hetzelfde antwoord als een nieuw adres', async () => {
    await wisSnelheidsbegrenzing();
    const email = `dubbel-${Date.now()}@voorbeeld.test`;
    const client = nieuweClient();
    const eerste = await client.post('/api/v1/auth/register', { email, naam: 'Een', wachtwoord: 'een lang wachtwoord' });
    const tweede = await client.post('/api/v1/auth/register', { email, naam: 'Twee', wachtwoord: 'een ander lang wachtwoord' });
    assert.equal(eerste.status, tweede.status, 'het bestaan van een account mag niet afleidbaar zijn');
    assert.deepEqual(eerste.body, tweede.body);
  });

  test('een verkeerd wachtwoord geeft geen aanwijzing over wat er fout was', async () => {
    const gebruiker = await maakGebruiker();
    await wisSnelheidsbegrenzing();
    const client = nieuweClient();
    const bestaand = await client.post('/api/v1/auth/login', { email: gebruiker.email, wachtwoord: 'fout wachtwoord dat lang genoeg is' });
    const onbestaand = await client.post('/api/v1/auth/login', { email: 'bestaatniet@voorbeeld.test', wachtwoord: 'fout wachtwoord dat lang genoeg is' });
    assert.equal(bestaand.status, 401);
    assert.equal(onbestaand.status, 401);
    assert.equal(bestaand.body.error.message, onbestaand.body.error.message);
  });

  test('afmelden maakt het token ongeldig', async () => {
    const gebruiker = await maakGebruiker();
    const afgemeld = await gebruiker.client.post('/api/v1/auth/logout');
    assert.equal(afgemeld.status, 200);
    const daarna = await gebruiker.client.get('/api/v1/auth/me');
    assert.equal(daarna.body.aangemeld, false);
  });

  test('sessies zijn zichtbaar en intrekbaar', async () => {
    const gebruiker = await maakGebruiker();
    const sessies = await gebruiker.client.get('/api/v1/auth/sessions');
    assert.equal(sessies.status, 200);
    assert.equal(sessies.body.sessies.length, 1);
    assert.equal(sessies.body.sessies[0].huidige, true);

    const ingetrokken = await gebruiker.client.delete('/api/v1/auth/sessions');
    assert.equal(ingetrokken.status, 200);
    const nog = await gebruiker.client.get('/api/v1/auth/me');
    assert.equal(nog.body.aangemeld, true, 'de huidige sessie blijft geldig');
  });
});

describe('tweefactorauthenticatie', () => {
  test('MFA instellen, bevestigen en gebruiken', async () => {
    const gebruiker = await maakGebruiker('MFA Gebruiker');

    const opzet = await gebruiker.client.post('/api/v1/auth/mfa/setup');
    assert.equal(opzet.status, 200);
    assert.match(opzet.body.uri, /^otpauth:\/\/totp\//);
    assert.ok(opzet.body.geheim.length >= 16);

    const verkeerd = await gebruiker.client.post('/api/v1/auth/mfa/confirm', { code: '000000' });
    assert.equal(verkeerd.status, 400);
    assert.match(verkeerd.body.error.hint, /tijd op je telefoon/);

    const bevestigd = await gebruiker.client.post('/api/v1/auth/mfa/confirm', {
      code: berekenCode(opzet.body.geheim),
    });
    assert.equal(bevestigd.status, 200);
    assert.equal(bevestigd.body.herstelcodes.length, 10);

    // Opnieuw aanmelden vereist nu de tweede stap.
    const client = nieuweClient();
    const aanmelding = await client.post('/api/v1/auth/login', {
      email: gebruiker.email,
      wachtwoord: 'een lang testwachtwoord',
    });
    assert.equal(aanmelding.body.mfaNodig, true);
    client.zetToken(aanmelding.body.token);

    const zonderTweedeStap = await client.get('/api/v1/organisaties');
    assert.equal(zonderTweedeStap.status, 401);
    assert.equal(zonderTweedeStap.body.error.code, 'mfa_required');

    const tweedeStap = await client.post('/api/v1/auth/mfa/verify', { code: berekenCode(opzet.body.geheim) });
    assert.equal(tweedeStap.status, 200);

    const daarna = await client.get('/api/v1/organisaties');
    assert.equal(daarna.status, 200);
  });

  test('een herstelcode werkt precies een keer', async () => {
    const gebruiker = await maakGebruiker('Herstel Gebruiker');
    const opzet = await gebruiker.client.post('/api/v1/auth/mfa/setup');
    const bevestigd = await gebruiker.client.post('/api/v1/auth/mfa/confirm', {
      code: berekenCode(opzet.body.geheim),
    });
    const herstelcode = bevestigd.body.herstelcodes[0];

    const client = nieuweClient();
    const aanmelding = await client.post('/api/v1/auth/login', {
      email: gebruiker.email,
      wachtwoord: 'een lang testwachtwoord',
    });
    client.zetToken(aanmelding.body.token);

    const eerste = await client.post('/api/v1/auth/mfa/verify', { code: herstelcode });
    assert.equal(eerste.status, 200);

    const tweedeClient = nieuweClient();
    const tweedeAanmelding = await tweedeClient.post('/api/v1/auth/login', {
      email: gebruiker.email,
      wachtwoord: 'een lang testwachtwoord',
    });
    tweedeClient.zetToken(tweedeAanmelding.body.token);
    const tweede = await tweedeClient.post('/api/v1/auth/mfa/verify', { code: herstelcode });
    assert.equal(tweede.status, 400, 'een herstelcode is eenmalig');
  });

  test('MFA uitzetten vereist het wachtwoord', async () => {
    const gebruiker = await maakGebruiker('Uitzet Gebruiker');
    const opzet = await gebruiker.client.post('/api/v1/auth/mfa/setup');
    await gebruiker.client.post('/api/v1/auth/mfa/confirm', { code: berekenCode(opzet.body.geheim) });

    const zonder = await gebruiker.client.post('/api/v1/auth/mfa/disable', { wachtwoord: 'verkeerd wachtwoord' });
    assert.equal(zonder.status, 403);

    const met = await gebruiker.client.post('/api/v1/auth/mfa/disable', { wachtwoord: 'een lang testwachtwoord' });
    assert.equal(met.status, 200);
  });
});

describe('wachtwoord wijzigen', () => {
  test('wijzigen lukt en meldt andere apparaten af', async () => {
    const gebruiker = await maakGebruiker('Wijzig Gebruiker');
    const tweede = nieuweClient();
    const tweedeAanmelding = await tweede.post('/api/v1/auth/login', {
      email: gebruiker.email,
      wachtwoord: 'een lang testwachtwoord',
    });
    tweede.zetToken(tweedeAanmelding.body.token);
    assert.equal((await tweede.get('/api/v1/auth/me')).body.aangemeld, true);

    const gewijzigd = await gebruiker.client.post('/api/v1/auth/password', {
      huidig: 'een lang testwachtwoord',
      nieuw: 'een nog langer nieuw wachtwoord',
    });
    assert.equal(gewijzigd.status, 200);

    assert.equal((await tweede.get('/api/v1/auth/me')).body.aangemeld, false, 'andere sessies zijn ingetrokken');
    assert.equal((await gebruiker.client.get('/api/v1/auth/me')).body.aangemeld, true, 'de eigen sessie blijft');
  });
});

describe('TOTP-implementatie', () => {
  test('base32 heen en terug', () => {
    const geheim = nieuwGeheim();
    assert.equal(naarBase32(vanBase32(geheim)), geheim);
  });

  test('codes uit RFC 6238 met een vast geheim', () => {
    // De testvectoren uit RFC 6238 gebruiken het geheim "12345678901234567890"
    // (20 bytes); in base32 is dat GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ.
    const geheim = naarBase32(Buffer.from('12345678901234567890', 'utf8'));
    assert.equal(geheim, 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
    assert.equal(berekenCode(geheim, 59_000), '287082');
    assert.equal(berekenCode(geheim, 1_111_111_109_000), '081804');
    assert.equal(berekenCode(geheim, 1_234_567_890_000), '005924');
  });

  test('het venster laat een halve minuut speling toe, maar niet meer', () => {
    const geheim = nieuwGeheim();
    const nu = Date.now();
    assert.ok(controleerCode(geheim, berekenCode(geheim, nu - 30_000), nu));
    assert.ok(controleerCode(geheim, berekenCode(geheim, nu + 30_000), nu));
    assert.ok(!controleerCode(geheim, berekenCode(geheim, nu + 120_000), nu));
  });

  test('herstelcodes zijn uniek en leesbaar', () => {
    const codes = nieuweHerstelcodes(50);
    assert.equal(new Set(codes).size, 50);
    for (const code of codes) assert.match(code, /^[A-Z2-9]{4}-[A-Z2-9]{4}$/);
  });

  test('de otpauth-URI bevat de uitgever en het adres', () => {
    const uri = otpauthUri('ABCDEFGHIJKLMNOP', 'test@voorbeeld.nl');
    assert.match(uri, /issuer=Gedmma/);
    assert.match(uri, /Gedmma%3Atest%40voorbeeld\.nl/);
  });
});

describe('wachtwoorden', () => {
  test('hashen en controleren', async () => {
    const hash = await scryptHasher.hash('een lang testwachtwoord');
    assert.match(hash, /^scrypt\$/);
    assert.ok(await scryptHasher.controleer('een lang testwachtwoord', hash));
    assert.ok(!(await scryptHasher.controleer('een ander wachtwoord', hash)));
  });

  test('twee keer hashen levert verschillende hashes op', async () => {
    const a = await scryptHasher.hash('zelfde wachtwoord hier');
    const b = await scryptHasher.hash('zelfde wachtwoord hier');
    assert.notEqual(a, b, 'elke hash heeft een eigen salt');
  });

  test('het beleid wijst voorspelbare wachtwoorden af', () => {
    assert.equal(beoordeelWachtwoord('kort').goed, false);
    assert.equal(beoordeelWachtwoord('wachtwoord123').goed, false);
    assert.equal(beoordeelWachtwoord('aaaaaaaaaaaaaa').goed, false);
    assert.equal(beoordeelWachtwoord('jan janssen wonen', ['Jan Janssen']).goed, false);
    assert.equal(beoordeelWachtwoord('een prima lange zin om te onthouden').goed, true);
  });

  test('een oudere hash wordt herkend als te licht', () => {
    assert.equal(scryptHasher.moetHerhashen('scrypt$1024$8$1$abc$def'), true);
    assert.equal(scryptHasher.moetHerhashen('argon2id$...'), true);
  });
});

describe('snelheidsbegrenzing', () => {
  test('te vaak registreren vanaf hetzelfde adres wordt geblokkeerd', async () => {
    await wisSnelheidsbegrenzing();
    const client = nieuweClient();
    let laatste = 0;
    for (let poging = 0; poging < 7; poging++) {
      const antwoord = await client.post('/api/v1/auth/register', {
        email: `spam${poging}-${Date.now()}@voorbeeld.test`,
        naam: 'Spam',
        wachtwoord: 'een lang genoeg wachtwoord',
      });
      laatste = antwoord.status;
      if (laatste === 429) break;
    }
    assert.equal(laatste, 429, 'na een aantal pogingen hoort de limiet te grijpen');
  });

  test('te vaak een verkeerd wachtwoord blokkeert het account tijdelijk', async () => {
    const gebruiker = await maakGebruiker('Brute Force');
    await wisSnelheidsbegrenzing();
    const client = nieuweClient();
    const antwoorden: number[] = [];
    for (let poging = 0; poging < 8; poging++) {
      const antwoord = await client.post('/api/v1/auth/login', {
        email: gebruiker.email,
        wachtwoord: 'dit is niet het wachtwoord',
      });
      antwoorden.push(antwoord.status);
      if (antwoord.status === 429) break;
    }
    assert.ok(antwoorden.includes(429), `verwachtte een 429, kreeg ${antwoorden.join(', ')}`);
  });
});
