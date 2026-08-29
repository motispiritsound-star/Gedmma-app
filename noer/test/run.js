// Controles op de leerinhoud. Draaien met: npm test
// Dit bewaakt de structuur van de data — het is géén controle op de
// juistheid van de Koran-tekst. Die hoort door een mens gedaan te worden.

import { test, after } from 'node:test';
import assert from 'node:assert/strict';

import { LETTERS, LETTER_OP_ID, afleiders, MAKHRAJ } from '../public/data/letters.js';
import { HARAKAT, TANWEEN, metHaraka, uitspraak } from '../public/data/harakat.js';
import { LESSEN, itemsVan } from '../public/data/qaida.js';
import { SOERAS, woordenVan, soerasVoorLeeftijd } from '../public/data/koran.js';
import { THEMAS, themasVoorLeeftijd } from '../public/data/woorden.js';
import { BADGES } from '../public/data/badges.js';
import { ayaUrls, RECITEURS, vulIn, AUDIO, reciteurNu } from '../public/data/bronnen.js';
import server, { veiligPad } from '../server.js';

test('het alfabet heeft 28 letters, allemaal uniek', () => {
  assert.equal(LETTERS.length, 28);
  assert.equal(new Set(LETTERS.map((l) => l.id)).size, 28);
  assert.equal(new Set(LETTERS.map((l) => l.letter)).size, 28);
});

test('elke letter heeft vier vormen, een klank, een tip en een voorbeeld', () => {
  for (const l of LETTERS) {
    for (const vorm of ['los', 'begin', 'midden', 'eind']) {
      assert.ok(l.vormen[vorm], `${l.id} mist de vorm ${vorm}`);
    }
    assert.ok(l.klank && l.tip, `${l.id} mist klank of tip`);
    assert.ok(l.voorbeeld.woord && l.voorbeeld.betekenis, `${l.id} mist een voorbeeldwoord`);
    assert.ok(MAKHRAJ[l.makhraj], `${l.id} heeft een onbekende uitspraakplaats`);
  }
});

test('precies zes letters verbinden niet naar links', () => {
  const los = LETTERS.filter((l) => !l.verbindt).map((l) => l.letter);
  assert.deepEqual(los, ['ا', 'د', 'ذ', 'ر', 'ز', 'و']);
  // Bij die letters is de beginvorm gelijk aan de losse vorm.
  for (const l of LETTERS.filter((x) => !x.verbindt)) {
    assert.equal(l.vormen.begin, l.vormen.los, `${l.id}: beginvorm hoort gelijk te zijn aan los`);
  }
});

test('afleiders geven het gevraagde aantal, zonder de letter zelf', () => {
  for (const l of LETTERS) {
    const uit = afleiders(l.id, 3);
    assert.equal(uit.length, 3, `${l.id} kreeg te weinig afleiders`);
    assert.equal(new Set(uit).size, 3, `${l.id} kreeg dubbele afleiders`);
    assert.ok(!uit.includes(l.id), `${l.id} zat bij zijn eigen afleiders`);
    for (const id of uit) assert.ok(LETTER_OP_ID[id], `onbekende afleider ${id}`);
  }
});

test('harakat plakken op de goede plek en klinken zoals verwacht', () => {
  assert.equal(metHaraka('ب', 'fatha'), 'بَ');
  assert.equal(uitspraak('b', 'fatha'), 'ba');
  assert.equal(uitspraak('b', 'kasra'), 'bi');
  assert.equal(uitspraak('b', 'damma'), 'boe');
  assert.equal(uitspraak('b', 'fatha', { sjadda: true }), 'bba');
  assert.equal(uitspraak('b', 'fatha', { madd: true }), 'baa');
  assert.equal(HARAKAT.length, 3);
  assert.equal(TANWEEN.length, 3);
  assert.throws(() => metHaraka('ب', 'bestaat-niet'));
});

test('de tien qaida-lessen lopen op en hebben allemaal oefenstof', () => {
  assert.equal(LESSEN.length, 10);
  LESSEN.forEach((les, i) => {
    assert.equal(les.nr, i + 1, `les ${les.id} staat op de verkeerde plek`);
    assert.ok(les.titel && les.uitleg, `les ${les.id} mist titel of uitleg`);
    const items = itemsVan(les);
    assert.ok(items.length >= 8, `les ${les.id} heeft te weinig items (${items.length})`);
    for (const item of items) {
      assert.ok(item.ar?.length, `les ${les.id} heeft een item zonder Arabisch`);
      assert.ok(item.tr?.length, `les ${les.id} heeft een item zonder uitspraak: ${item.ar}`);
    }
  });
});

test('elke les heeft minstens vier verschillende antwoorden om uit te kiezen', () => {
  for (const les of LESSEN) {
    const uniek = new Set(itemsVan(les).map((i) => i.tr));
    assert.ok(uniek.size >= 4, `les ${les.id} heeft te weinig verschillende antwoorden`);
  }
});

test('elke soera heeft het aantal aya\'s dat erbij staat', () => {
  for (const s of SOERAS) {
    assert.equal(s.ayaat.length, s.aantalAyaat, `${s.naam}: aantal aya's klopt niet`);
    s.ayaat.forEach((a, i) => {
      assert.equal(a.n, i + 1, `${s.naam}: aya ${a.n} staat op de verkeerde plek`);
      assert.ok(a.ar.trim(), `${s.naam} aya ${a.n} heeft geen Arabische tekst`);
      assert.ok(a.tr.trim(), `${s.naam} aya ${a.n} heeft geen uitspraak`);
      assert.ok(a.nl.trim(), `${s.naam} aya ${a.n} heeft geen betekenis`);
    });
  }
});

test('woord-voor-woord loopt precies gelijk met de aya', () => {
  for (const s of SOERAS) {
    for (const a of s.ayaat) {
      if (!a.glossen) continue;
      const woorden = woordenVan(a);
      assert.equal(a.glossen.length, woorden.length,
        `${s.naam} aya ${a.n}: ${a.glossen.length} betekenissen bij ${woorden.length} woorden`);
      for (const w of woorden) assert.ok(w.nl, `${s.naam} aya ${a.n}: woord zonder betekenis`);
    }
  }
});

test('soera-nummers en id\'s zijn uniek', () => {
  assert.equal(new Set(SOERAS.map((s) => s.nr)).size, SOERAS.length);
  assert.equal(new Set(SOERAS.map((s) => s.id)).size, SOERAS.length);
});

test('een kind van vijf krijgt alleen korte soera\'s, een van dertien alles', () => {
  const jong = soerasVoorLeeftijd(5);
  assert.ok(jong.length > 0);
  assert.ok(jong.every((s) => s.aantalAyaat <= 6));
  assert.equal(soerasVoorLeeftijd(13).length, SOERAS.length);
});

test('woordthema\'s zijn compleet en lopen op met de leeftijd', () => {
  for (const t of THEMAS) {
    assert.ok(t.woorden.length >= 6, `thema ${t.id} heeft te weinig woorden`);
    for (const w of t.woorden) {
      assert.ok(w.ar && w.tr && w.nl && w.emoji, `thema ${t.id}: woord ${w.ar} is niet compleet`);
    }
    const nl = t.woorden.map((w) => w.nl);
    assert.equal(new Set(nl).size, nl.length, `thema ${t.id} heeft dubbele betekenissen`);
  }
  assert.ok(themasVoorLeeftijd(5).length < themasVoorLeeftijd(13).length);
});

test('badges zijn uniek en hun test werkt op een leeg beginpunt', () => {
  assert.equal(new Set(BADGES.map((b) => b.id)).size, BADGES.length);
  const leeg = {
    totaalGoed: 0, lettersGoed: 0, lessenAf: [], soerasAf: [],
    woordenGoed: 0, langsteReeks: 0, foutlozeLessen: 0,
  };
  for (const b of BADGES) {
    assert.equal(b.test(leeg), false, `badge ${b.id} wordt meteen al verdiend`);
  }
});

test('zonder externe reciteur wijst een aya alleen naar een eigen opname', () => {
  assert.deepEqual(ayaUrls(114, 1), ['audio/koran/114/1.mp3']);
});

test('elke reciteur heeft een naam en een bruikbaar adres', () => {
  const sleutels = Object.keys(RECITEURS);
  assert.ok(sleutels.length >= 2, 'er staan te weinig reciteurs klaar');
  for (const [sleutel, r] of Object.entries(RECITEURS)) {
    assert.ok(r.naam?.trim(), `${sleutel} heeft geen naam om te vermelden`);
    assert.ok(r.stijl?.trim(), `${sleutel} heeft geen omschrijving`);
    assert.match(r.sjabloon, /^https:\/\//, `${sleutel} gebruikt geen https`);
    assert.ok(r.sjabloon.includes('{soera'), `${sleutel} mist {soera} in het adres`);
    assert.ok(r.sjabloon.includes('{aya'), `${sleutel} mist {aya} in het adres`);
    // Na invullen mag er geen plaatshouder meer overblijven.
    const ingevuld = vulIn(r.sjabloon, 114, 1);
    assert.ok(!ingevuld.includes('{'), `${sleutel} houdt een plaatshouder over: ${ingevuld}`);
  }
});

test('drie cijfers waar dat hoort, kaal waar dat hoort', () => {
  assert.equal(vulIn('x/{soera}{aya}.mp3', 114, 1), 'x/114001.mp3');
  assert.equal(vulIn('x/{soera}{aya}.mp3', 1, 7), 'x/001007.mp3');
  assert.equal(vulIn('x/{soera2}/{aya2}.mp3', 114, 1), 'x/114/1.mp3');
});

test('streamen staat uit, dus de app kijkt alleen naar eigen bestanden', () => {
  assert.equal(AUDIO.reciteur.aan, false);
  assert.equal(reciteurNu(), null);
  assert.deepEqual(ayaUrls(114, 1), ['audio/koran/114/1.mp3']);
});

test('met streamen aan komt de reciteur er als tweede bij, nooit als eerste', () => {
  AUDIO.reciteur.aan = true;
  try {
    const urls = ayaUrls(114, 1);
    assert.equal(urls.length, 2);
    assert.equal(urls[0], 'audio/koran/114/1.mp3', 'een eigen bestand hoort voor te gaan');
    assert.ok(urls[1].startsWith('https://'));
    assert.equal(reciteurNu().naam, RECITEURS[AUDIO.reciteur.keuze].naam);
  } finally {
    AUDIO.reciteur.aan = false;
  }
});

test('een ontbrekend bestand is een 404, geen index.html met een 200', async (t) => {
  // Zonder dit onderscheid krijgt een ontbrekende mp3 een 200 met de app erin,
  // en denkt de app dat er geluid is waar niets is.
  await new Promise((klaar) => server.listen(0, '127.0.0.1', klaar));
  const poort = server.address().port;
  const haal = (pad) => fetch(`http://127.0.0.1:${poort}${pad}`);
  try {
    const weg = await haal('/audio/koran/114/1.mp3');
    assert.equal(weg.status, 404, 'een ontbrekende mp3 hoort 404 te geven');

    const pagina = await haal('/thuis');
    assert.equal(pagina.status, 200);
    assert.match(pagina.headers.get('content-type'), /text\/html/,
      'een route zonder extensie hoort de app terug te geven');

    const echt = await haal('/data/koran.js');
    assert.equal(echt.status, 200);
    assert.match(echt.headers.get('content-type'), /javascript/);
  } finally {
    await new Promise((klaar) => server.close(klaar));
  }
});

test('de server laat niets buiten public/ zien', () => {
  assert.ok(veiligPad('/index.html').endsWith('public/index.html'));
  assert.ok(veiligPad('/').endsWith('public/index.html'));
  assert.equal(veiligPad('/../server.js'), null);
  assert.equal(veiligPad('/..%2f..%2fetc/passwd'), null);
  assert.equal(veiligPad('/%00'), null);
});
