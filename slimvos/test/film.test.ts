import test from 'node:test';
import assert from 'node:assert/strict';
import { FILMS, filmsVoorOnderwerp, motivatieFilms, vindFilm } from '../src/core/film/films';
import { beeldOpTijd, duurVan } from '../src/core/film/types';
import { vindOnderwerp } from '../src/core/content/curriculum';

test('elk filmpje heeft inhoud en een redelijke lengte', () => {
  assert.ok(FILMS.length >= 8, 'te weinig filmpjes');
  for (const film of FILMS) {
    assert.ok(film.beelden.length >= 3, `${film.id} heeft te weinig beelden`);
    assert.ok(film.titel.length > 3 && film.pitch.length > 10, `${film.id} mist tekst`);
    const seconden = duurVan(film) / 1000;
    assert.ok(seconden >= 12 && seconden <= 45, `${film.id} duurt ${seconden}s; te lang of te kort voor een kind`);
    for (const beeld of film.beelden) {
      assert.ok(beeld.kop.length > 0 && beeld.tekst.length > 10, `${film.id} heeft een leeg beeld`);
      assert.ok(beeld.duurMs >= 2500, `${film.id}: beeld te kort om te lezen`);
    }
  }
});

test('filmpje-ids zijn uniek', () => {
  const ids = FILMS.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
});

test('een uitlegfilmpje verwijst naar een bestaand onderwerp', () => {
  for (const film of FILMS) {
    if (film.onderwerpId) {
      assert.ok(vindOnderwerp(film.onderwerpId), `${film.id} verwijst naar onbekend onderwerp ${film.onderwerpId}`);
    }
  }
});

test('er zijn motiverende filmpjes zonder onderwerp', () => {
  const motivatie = motivatieFilms();
  assert.ok(motivatie.length >= 3);
  for (const film of motivatie) assert.equal(film.onderwerpId, undefined);
});

test('bij een onderwerp met filmpje wordt die gevonden', () => {
  assert.ok(filmsVoorOnderwerp('rekenen.tafels').length >= 1);
  assert.equal(filmsVoorOnderwerp('bestaat.niet').length, 0);
  assert.ok(vindFilm('welkom'));
  assert.equal(vindFilm('bestaat-niet'), undefined);
});

test('de speler kiest het juiste beeld bij een tijdstip', () => {
  const film = FILMS[0];
  assert.equal(beeldOpTijd(film, 0).index, 0);
  assert.equal(beeldOpTijd(film, film.beelden[0].duurMs).index, 1);
  assert.equal(beeldOpTijd(film, film.beelden[0].duurMs - 1).index, 0);
  // Voorbij het einde blijft hij op het laatste beeld staan.
  assert.equal(beeldOpTijd(film, duurVan(film) + 9999).index, film.beelden.length - 1);
});
