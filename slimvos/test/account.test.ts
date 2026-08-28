import test from 'node:test';
import assert from 'node:assert/strict';
import {
  controleerEmail,
  controleerNaam,
  controleerPincode,
  controleerWachtwoord,
  MIN_WACHTWOORD,
  normaliseerEmail,
  wachtwoordSterkte,
} from '../src/core/account/validatie';
import { maakOuderslotVraag } from '../src/core/account/ouderslot';
import { maakRng } from '../src/core/rng';

test('e-mailadressen worden gecontroleerd', () => {
  assert.equal(controleerEmail('sanne@voorbeeld.nl'), null);
  assert.equal(controleerEmail('a.b-c@sub.voorbeeld.co.uk'), null);
  assert.ok(controleerEmail(''));
  assert.ok(controleerEmail('geen adres'));
  assert.ok(controleerEmail('mist@punt'));
  assert.ok(controleerEmail('@voorbeeld.nl'));
});

test('e-mailadressen worden genormaliseerd', () => {
  assert.equal(normaliseerEmail('  Sanne@Voorbeeld.NL '), 'sanne@voorbeeld.nl');
});

test('zwakke wachtwoorden worden geweigerd', () => {
  assert.ok(controleerWachtwoord('kort'));
  assert.ok(controleerWachtwoord('12345678'), 'alleen cijfers mag niet');
  assert.ok(controleerWachtwoord('aaaaaaaa'), 'steeds hetzelfde teken mag niet');
  assert.equal(controleerWachtwoord('zonnebloem'), null);
  assert.ok('x'.repeat(MIN_WACHTWOORD - 1).length < MIN_WACHTWOORD);
});

test('wachtwoordsterkte loopt op', () => {
  assert.equal(wachtwoordSterkte('kort'), 0);
  assert.ok(wachtwoordSterkte('zonnebloem') >= 1);
  assert.ok(wachtwoordSterkte('Zonnebloem1!') > wachtwoordSterkte('zonnebloem'));
  assert.ok(wachtwoordSterkte('Zonnebloem1!extra') <= 3);
});

test('namen worden gecontroleerd', () => {
  assert.ok(controleerNaam(' '));
  assert.ok(controleerNaam('A'));
  assert.equal(controleerNaam('Sanne'), null);
});

test('een pincode moet vier verschillende, niet-opeenvolgende cijfers zijn', () => {
  assert.equal(controleerPincode('2748'), null);
  assert.ok(controleerPincode('123'), 'te kort');
  assert.ok(controleerPincode('12a4'), 'geen cijfers');
  assert.ok(controleerPincode('1111'), 'vier dezelfde');
  assert.ok(controleerPincode('1234'), 'opeenvolgend');
  assert.ok(controleerPincode('4321'), 'omgekeerd opeenvolgend');
});

test('het ouderslot stelt een som die een jong kind niet zomaar maakt', () => {
  for (let seed = 1; seed < 40; seed++) {
    const vraag = maakOuderslotVraag(maakRng(seed));
    assert.ok(vraag.opties.includes(vraag.antwoord), 'het goede antwoord staat er niet bij');
    assert.equal(new Set(vraag.opties).size, vraag.opties.length, 'dubbele opties');
    assert.equal(vraag.opties.length, 4);
    assert.ok(vraag.antwoord > 100, `te makkelijk: ${vraag.stam} = ${vraag.antwoord}`);
    assert.ok(vraag.opties.every((o) => o > 0));
  }
});
