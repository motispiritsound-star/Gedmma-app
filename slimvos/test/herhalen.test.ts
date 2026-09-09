import test from 'node:test';
import assert from 'node:assert/strict';
import {
  aantalTeHerhalen,
  herhalingenPerOnderwerp,
  INTERVALLEN,
  MAX_BAK,
  naHerhaling,
  sleutel,
  teHerhalen,
  voegToe,
  type Herhaalitem,
} from '../src/core/engine/herhalen';
import { maakVraag } from '../src/core/content';
import { maakRng } from '../src/core/rng';
import type { Vraag } from '../src/core/types';

const DAG = 86400000;

function vraag(stam: string, antwoord = '1', onderwerpId = 'rekenen.tafels'): Vraag {
  return { id: `x${Math.random()}`, onderwerpId, niveau: 2, type: 'invul', stam, antwoord, uitleg: 'omdat het zo is' };
}

test('de sleutel is stabiel ook al verschilt de id per keer', () => {
  const a = vraag('7 × 8 = ?', '56');
  const b = { ...vraag('7 × 8 = ?', '56'), id: 'heel-andere-id' };
  assert.equal(sleutel(a), sleutel(b));
  assert.notEqual(sleutel(a), sleutel(vraag('7 × 9 = ?', '63')));
});

test('een gegenereerde vraag houdt dezelfde sleutel', () => {
  const eerste = maakVraag('rekenen.tafels', 2, maakRng(5));
  const tweede = maakVraag('rekenen.tafels', 2, maakRng(5));
  assert.notEqual(eerste.id, tweede.id, 'de ids verschillen wel');
  assert.equal(sleutel(eerste), sleutel(tweede), 'maar de sleutel niet');
});

test('een fout antwoord komt na een dag terug', () => {
  const bak = voegToe([], vraag('7 × 8 = ?', '56'), 0);
  assert.equal(bak.length, 1);
  assert.equal(bak[0].fouten, 1);
  assert.equal(bak[0].volgendeKeer, INTERVALLEN[0]);
  assert.equal(aantalTeHerhalen(bak, 0), 0, 'nu nog niet');
  assert.equal(aantalTeHerhalen(bak, DAG + 1), 1, 'morgen wel');
});

test('goed beantwoorde herhalingen komen steeds later terug en verdwijnen daarna', () => {
  const v = vraag('7 × 8 = ?', '56');
  let bak = voegToe([], v, 0);

  bak = naHerhaling(bak, v, true, DAG);
  assert.equal(bak[0].volgendeKeer, DAG + INTERVALLEN[1], 'na drie dagen');

  bak = naHerhaling(bak, v, true, 4 * DAG);
  assert.equal(bak[0].volgendeKeer, 4 * DAG + INTERVALLEN[2], 'na een week');

  bak = naHerhaling(bak, v, true, 11 * DAG);
  assert.equal(bak[0].volgendeKeer, 11 * DAG + INTERVALLEN[3], 'na drie weken');

  bak = naHerhaling(bak, v, true, 40 * DAG);
  assert.equal(bak.length, 0, 'uitgeleerd, hij gaat uit de bak');
});

test('nog een keer fout zet de reeks terug naar het begin', () => {
  const v = vraag('7 × 8 = ?', '56');
  let bak = voegToe([], v, 0);
  bak = naHerhaling(bak, v, true, DAG);
  assert.equal(bak[0].goedOpRij, 1);

  bak = naHerhaling(bak, v, false, 5 * DAG);
  assert.equal(bak[0].goedOpRij, 0);
  assert.equal(bak[0].fouten, 2);
  assert.equal(bak[0].volgendeKeer, 5 * DAG + INTERVALLEN[0]);
});

test('dezelfde vraag komt niet twee keer in de bak', () => {
  const v = vraag('7 × 8 = ?', '56');
  const bak = voegToe(voegToe([], v, 0), { ...v, id: 'anders' }, DAG);
  assert.equal(bak.length, 1);
  assert.equal(bak[0].fouten, 2);
});

test('alleen vragen die aan de beurt zijn worden opgehaald', () => {
  let bak = voegToe([], vraag('a', '1'), 0);
  bak = voegToe(bak, vraag('b', '2'), 0);
  bak = voegToe(bak, vraag('c', '3'), 10 * DAG);

  assert.equal(teHerhalen(bak, { nu: 2 * DAG }).length, 2, 'de derde is nog niet aan de beurt');
  assert.equal(teHerhalen(bak, { nu: 12 * DAG }).length, 3);
});

test('er komen er nooit meer dan het maximum in één ronde', () => {
  let bak: Herhaalitem[] = [];
  for (let i = 0; i < 20; i++) bak = voegToe(bak, vraag(`som ${i}`, String(i)), 0);
  assert.equal(teHerhalen(bak, { nu: 2 * DAG }).length, 3);
  assert.equal(teHerhalen(bak, { nu: 2 * DAG, max: 5 }).length, 5);
});

test('herhalingen kunnen per onderwerp opgehaald worden', () => {
  let bak = voegToe([], vraag('a', '1', 'rekenen.tafels'), 0);
  bak = voegToe(bak, vraag('b', '2', 'taal.spelling'), 0);
  const alleen = teHerhalen(bak, { onderwerpId: 'taal.spelling', nu: 2 * DAG });
  assert.equal(alleen.length, 1);
  assert.equal(alleen[0].onderwerpId, 'taal.spelling');

  const perOnderwerp = herhalingenPerOnderwerp(bak, 2 * DAG);
  assert.equal(perOnderwerp.get('rekenen.tafels'), 1);
  assert.equal(perOnderwerp.get('taal.spelling'), 1);
  assert.equal(perOnderwerp.get('bestaat.niet'), undefined);
});

test('vaakst foute vragen gaan voor', () => {
  const lastig = vraag('lastig', '1');
  let bak = voegToe([], vraag('makkelijk', '2'), 0);
  bak = voegToe(bak, lastig, 0);
  bak = voegToe(bak, lastig, DAG);
  bak = voegToe(bak, lastig, 2 * DAG);

  const eerste = teHerhalen(bak, { nu: 10 * DAG, max: 1 })[0];
  assert.equal(eerste.vraag.stam, 'lastig');
});

test('de bak loopt niet onbeperkt vol', () => {
  let bak: Herhaalitem[] = [];
  for (let i = 0; i < MAX_BAK + 25; i++) bak = voegToe(bak, vraag(`som ${i}`, String(i)), i);
  assert.equal(bak.length, MAX_BAK);
  assert.equal(bak[bak.length - 1].vraag.stam, `som ${MAX_BAK + 24}`, 'de nieuwste staat er nog in');
  assert.ok(!bak.some((i) => i.vraag.stam === 'som 0'), 'de oudste is eruit gevallen');
});

test('een vraag die niet in de bak zit verandert er niets aan', () => {
  const bak = voegToe([], vraag('a', '1'), 0);
  assert.deepEqual(naHerhaling(bak, vraag('onbekend', '9'), true, DAG), bak);
});
