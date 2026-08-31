import test from 'node:test';
import assert from 'node:assert/strict';
import { GENERATOREN, maakRonde, maakVraag } from '../src/core/content/index';
import { ONDERWERPEN, onderwerpenVoorGroep, startNiveau, vakkenVoorGroep } from '../src/core/content/curriculum';
import { isGoed, normaliseer } from '../src/core/content/helpers';
import { maakRng } from '../src/core/rng';
import { GROEPEN, MAX_NIVEAU } from '../src/core/types';

test('elk onderwerp in het curriculum heeft vragen', () => {
  for (const onderwerp of ONDERWERPEN) {
    assert.ok(GENERATOREN[onderwerp.id], `geen generator voor ${onderwerp.id}`);
  }
});

test('elke groep krijgt onderwerpen in meerdere vakken', () => {
  for (const groep of GROEPEN) {
    const onderwerpen = onderwerpenVoorGroep(groep);
    assert.ok(onderwerpen.length >= 8, `groep ${groep} heeft te weinig onderwerpen`);
    assert.ok(vakkenVoorGroep(groep).length >= 3, `groep ${groep} heeft te weinig vakken`);
  }
});

test('startniveau blijft binnen 1 en 5 voor elke groep', () => {
  for (const onderwerp of ONDERWERPEN) {
    for (const groep of onderwerp.groepen) {
      const niveau = startNiveau(onderwerp, groep);
      assert.ok(niveau >= 1 && niveau <= MAX_NIVEAU, `${onderwerp.id} groep ${groep} -> ${niveau}`);
    }
  }
});

test('gegenereerde vragen zijn geldig op elk niveau', () => {
  for (const onderwerp of ONDERWERPEN) {
    for (let niveau = 1; niveau <= MAX_NIVEAU; niveau++) {
      const rng = maakRng(niveau * 7919 + onderwerp.id.length);
      for (let i = 0; i < 60; i++) {
        const vraag = maakVraag(onderwerp.id, niveau, rng);
        const waar = `${onderwerp.id} niveau ${niveau} vraag ${i}`;

        assert.ok(vraag.stam.trim().length > 0, `lege vraag: ${waar}`);
        assert.ok(vraag.antwoord.trim().length > 0, `leeg antwoord: ${waar}`);
        assert.ok(vraag.uitleg.trim().length > 10, `te korte uitleg: ${waar}`);
        assert.ok(!vraag.stam.includes('undefined') && !vraag.uitleg.includes('undefined'), `undefined in tekst: ${waar}`);
        assert.ok(!vraag.stam.includes('NaN') && !vraag.antwoord.includes('NaN'), `NaN in vraag: ${waar}`);
        assert.equal(vraag.onderwerpId, onderwerp.id, waar);

        if (vraag.type === 'keuze') {
          const opties = vraag.opties ?? [];
          assert.ok(opties.length >= 3, `te weinig opties (${opties.length}): ${waar}`);
          assert.equal(new Set(opties).size, opties.length, `dubbele opties: ${waar} -> ${opties.join(' | ')}`);
          assert.ok(opties.includes(vraag.antwoord), `antwoord ontbreekt in opties: ${waar}`);
          assert.ok(isGoed(vraag, vraag.antwoord), `eigen antwoord wordt fout gerekend: ${waar}`);
        } else {
          assert.equal(vraag.opties, undefined, `invulvraag met opties: ${waar}`);
        }
      }
    }
  }
});

test('een ronde levert het gevraagde aantal vragen rond het juiste niveau', () => {
  const vragen = maakRonde('rekenen.tafels', 3, 10, 42);
  assert.equal(vragen.length, 10);
  for (const v of vragen) {
    assert.ok(v.niveau >= 2 && v.niveau <= 4, `niveau ${v.niveau} ligt te ver van 3`);
  }
});

test('dezelfde seed geeft dezelfde ronde', () => {
  const a = maakRonde('taal.spelling', 2, 8, 123).map((v) => v.stam + v.antwoord);
  const b = maakRonde('taal.spelling', 2, 8, 123).map((v) => v.stam + v.antwoord);
  assert.deepEqual(a, b);
});

test('een niveau buiten 1..5 wordt teruggebracht naar het bereik', () => {
  const rng = maakRng(1);
  assert.equal(maakVraag('rekenen.optellen', 0, rng).niveau, 1);
  assert.equal(maakVraag('rekenen.optellen', 99, rng).niveau, MAX_NIVEAU);
});

test('antwoorden worden soepel vergeleken', () => {
  assert.equal(normaliseer(' 3,50 '), normaliseer('3.5'));
  assert.equal(normaliseer('Blij'), 'blij');
  assert.notEqual(normaliseer('12'), normaliseer('21'));
});

test('een onbekend onderwerp geeft een duidelijke fout', () => {
  assert.throws(() => maakVraag('bestaat.niet', 1, maakRng(1)), /Geen vragen beschikbaar/);
});
