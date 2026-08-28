import test from 'node:test';
import assert from 'node:assert/strict';
import { naAntwoord, nieuweBeheersing, OMHOOG_NA, OMLAAG_NA, scoreProcent } from '../src/core/engine/beheersing';
import { dagSleutel, levelVoorXp, levelVoortgang, muntenVoorRonde, werkStreakBij, xpVoorAntwoord, xpVoorLevel } from '../src/core/engine/punten';
import { beantwoord, huidigeVraag, resultaat, startSessie, volgende } from '../src/core/engine/sessie';
import { nieuwProfiel, verwerkRonde, huidigNiveau, migreerProfiel } from '../src/core/engine/profiel';
import { BADGES, metBadges, nieuweBadges, verdiendeBadges } from '../src/core/engine/badges';
import { aanbevelingen, volgendeOefening } from '../src/core/engine/aanbeveling';
import { koop, kanKopen, WINKEL, kiesAvatar } from '../src/core/engine/winkel';
import { MAX_NIVEAU, MIN_NIVEAU } from '../src/core/types';

test('niveau gaat omhoog na genoeg goede antwoorden op rij', () => {
  let b = nieuweBeheersing('rekenen.tafels', 2);
  for (let i = 0; i < OMHOOG_NA; i++) b = naAntwoord(b, true);
  assert.equal(b.niveau, 3);
  assert.equal(b.reeksGoed, 0, 'de reeks start opnieuw na een niveaustap');
});

test('niveau zakt na twee fouten op rij, maar nooit onder 1', () => {
  let b = nieuweBeheersing('rekenen.tafels', 2);
  for (let i = 0; i < OMLAAG_NA; i++) b = naAntwoord(b, false);
  assert.equal(b.niveau, 1);
  for (let i = 0; i < 10; i++) b = naAntwoord(b, false);
  assert.equal(b.niveau, MIN_NIVEAU);
});

test('een goed antwoord tussendoor breekt de foutenreeks', () => {
  let b = nieuweBeheersing('rekenen.tafels', 3);
  b = naAntwoord(b, false);
  b = naAntwoord(b, true);
  b = naAntwoord(b, false);
  assert.equal(b.niveau, 3, 'niet gezakt na twee losse fouten');
});

test('niveau blijft op het maximum staan', () => {
  let b = nieuweBeheersing('rekenen.tafels', MAX_NIVEAU);
  for (let i = 0; i < 40; i++) b = naAntwoord(b, true);
  assert.equal(b.niveau, MAX_NIVEAU);
  assert.equal(b.sterren, 3, 'op het hoogste niveau met veel goed verdien je drie sterren');
});

test('sterren gaan nooit omlaag', () => {
  let b = nieuweBeheersing('rekenen.tafels', 3);
  for (let i = 0; i < 20; i++) b = naAntwoord(b, true);
  const bereikt = b.sterren;
  assert.ok(bereikt >= 1);
  for (let i = 0; i < 30; i++) b = naAntwoord(b, false);
  assert.equal(b.sterren, bereikt);
});

test('scorepercentage klopt en is 0 zonder antwoorden', () => {
  const leeg = nieuweBeheersing('x', 1);
  assert.equal(scoreProcent(leeg), 0);
  assert.equal(scoreProcent({ ...leeg, goed: 3, fout: 1 }), 75);
});

test('XP loopt op met niveau en snelheid, en is 0 bij fout', () => {
  assert.equal(xpVoorAntwoord(false, 5, 100), 0);
  assert.ok(xpVoorAntwoord(true, 5, 1000) > xpVoorAntwoord(true, 1, 1000));
  assert.ok(xpVoorAntwoord(true, 3, 1000) > xpVoorAntwoord(true, 3, 30000));
});

test('munten: één per goed antwoord, plus bonus bij een foutloze ronde', () => {
  assert.equal(muntenVoorRonde(7, 10), 7);
  assert.equal(muntenVoorRonde(10, 10), 15);
  assert.equal(muntenVoorRonde(0, 0), 0);
});

test('de levelcurve loopt netjes op', () => {
  assert.equal(levelVoorXp(0), 1);
  for (let level = 2; level < 20; level++) {
    assert.ok(xpVoorLevel(level) > xpVoorLevel(level - 1), `level ${level} kost niet meer dan het vorige`);
    assert.equal(levelVoorXp(xpVoorLevel(level)), level);
    assert.equal(levelVoorXp(xpVoorLevel(level) - 1), level - 1);
  }
  const v = levelVoortgang(xpVoorLevel(4));
  assert.equal(v.level, 4);
  assert.equal(v.fractie, 0);
});

test('streak: doortellen, respijtdag, en opnieuw beginnen', () => {
  const leeg = { dagen: 0, laatsteDag: '', langste: 0 };
  const dag1 = werkStreakBij(leeg, '2026-03-01');
  assert.equal(dag1.dagen, 1);

  const dag2 = werkStreakBij(dag1, '2026-03-02');
  assert.equal(dag2.dagen, 2);

  const zelfdeDag = werkStreakBij(dag2, '2026-03-02');
  assert.equal(zelfdeDag.dagen, 2, 'twee keer op één dag telt maar één keer');

  const naEenGemisteDag = werkStreakBij(dag2, '2026-03-04');
  assert.equal(naEenGemisteDag.dagen, 3, 'één dag missen breekt de reeks nog niet');

  const naTweeGemisteDagen = werkStreakBij(dag2, '2026-03-06');
  assert.equal(naTweeGemisteDagen.dagen, 1);
  assert.equal(naTweeGemisteDagen.langste, 2, 'de langste reeks blijft bewaard');
});

test('dagSleutel gebruikt de lokale datum', () => {
  assert.equal(dagSleutel(new Date(2026, 0, 5)), '2026-01-05');
});

test('een ronde loopt van eerste vraag tot resultaat', () => {
  let s = startSessie('rekenen.optellen', 2, { aantal: 5, seed: 7, nu: 0 });
  assert.equal(s.vragen.length, 5);

  let goed = 0;
  while (s.status === 'bezig') {
    const vraag = huidigeVraag(s);
    assert.ok(vraag);
    const gegeven = s.index % 2 === 0 ? vraag!.antwoord : 'onzin-antwoord';
    if (s.index % 2 === 0) goed += 1;
    s = beantwoord(s, gegeven, s.vraagGestartOp + 1000).sessie;
    s = volgende(s, s.vraagGestartOp + 1000);
  }

  const uit = resultaat(s, 60000);
  assert.equal(uit.aantal, 5);
  assert.equal(uit.goed, goed);
  assert.equal(uit.fout, 5 - goed);
  assert.equal(uit.procent, Math.round((goed / 5) * 100));
  assert.equal(uit.foutVragen.length, 5 - goed);
});

test('een vraag kan niet twee keer beantwoord worden', () => {
  const s = startSessie('rekenen.optellen', 1, { aantal: 3, seed: 9, nu: 0 });
  const na = beantwoord(s, 'iets', 100).sessie;
  assert.throws(() => beantwoord(na, 'nogmaals', 200), /al beantwoord/);
});

test('een afgeronde sessie accepteert geen antwoord meer', () => {
  let s = startSessie('rekenen.optellen', 1, { aantal: 1, seed: 3, nu: 0 });
  s = beantwoord(s, 'x', 100).sessie;
  s = volgende(s, 200);
  assert.equal(s.status, 'klaar');
  assert.throws(() => beantwoord(s, 'y', 300), /al afgerond/);
});

test('een nieuw profiel heeft voor elk onderwerp van de groep een startniveau', () => {
  const p = nieuwProfiel('Fenna', 5);
  assert.ok(Object.keys(p.beheersing).length >= 8);
  for (const b of Object.values(p.beheersing)) {
    assert.ok(b.niveau >= MIN_NIVEAU && b.niveau <= MAX_NIVEAU);
  }
  assert.equal(p.xp, 0);
  assert.equal(p.munten, 0);
});

test('een foutloze ronde levert XP, munten, een streak en geschiedenis op', () => {
  const p = nieuwProfiel('Sem', 4, '🦊', 1000);
  let s = startSessie('rekenen.tafels', huidigNiveau(p, 'rekenen.tafels'), { aantal: 5, seed: 11, nu: 1000 });
  while (s.status === 'bezig') {
    const vraag = huidigeVraag(s)!;
    s = beantwoord(s, vraag.antwoord, s.vraagGestartOp + 2000).sessie;
    s = volgende(s, s.vraagGestartOp + 2000);
  }
  const na = verwerkRonde(p, s, 20000);

  assert.ok(na.xp > 0, 'XP toegekend');
  assert.equal(na.munten, 5 + 5, 'vijf goed plus de bonus voor foutloos');
  assert.equal(na.streak.dagen, 1);
  assert.equal(na.geschiedenis.length, 1);
  assert.equal(na.geschiedenis[0].goed, 5);
  assert.equal(na.vandaag.vragen, 5);
  assert.ok(na.beheersing['rekenen.tafels'].niveau >= p.beheersing['rekenen.tafels'].niveau);
  assert.equal(p.xp, 0, 'het oorspronkelijke profiel blijft ongewijzigd');
});

test('een ronde op een onderwerp buiten de groep werkt ook', () => {
  const p = nieuwProfiel('Noa', 3, '🐼', 1000);
  const s0 = startSessie('rekenen.procenten', 1, { aantal: 2, seed: 5, nu: 1000 });
  let s = s0;
  while (s.status === 'bezig') {
    s = beantwoord(s, huidigeVraag(s)!.antwoord, s.vraagGestartOp + 1000).sessie;
    s = volgende(s, s.vraagGestartOp + 1000);
  }
  const na = verwerkRonde(p, s, 5000);
  assert.ok(na.beheersing['rekenen.procenten'], 'beheersing wordt aangemaakt als die nog niet bestond');
});

test('badges worden verdiend en niet dubbel toegekend', () => {
  const p = nieuwProfiel('Yara', 6);
  assert.deepEqual(verdiendeBadges(p), []);

  const gevorderd = { ...p, streak: { dagen: 8, laatsteDag: '2026-03-08', langste: 8 }, geschiedenis: [{ onderwerpId: 'x', tijd: 1, aantal: 10, goed: 10, xp: 100, niveauVoor: 1, niveauNa: 2, duurMs: 1000 }] };
  const verdiend = verdiendeBadges(gevorderd);
  assert.ok(verdiend.includes('eerste-stap'));
  assert.ok(verdiend.includes('streak-3'));
  assert.ok(verdiend.includes('streak-7'));
  assert.ok(!verdiend.includes('streak-30'));

  const metB = metBadges(gevorderd);
  assert.deepEqual(metB.badges.sort(), verdiend.sort());
  assert.deepEqual(nieuweBadges(metB), [], 'na toekennen zijn er geen nieuwe badges meer');
});

test('elke badge heeft een voortgang tussen 0 en 1', () => {
  const p = nieuwProfiel('Test', 5);
  for (const badge of BADGES) {
    const v = badge.voortgang(p);
    assert.ok(v >= 0 && v <= 1, `${badge.id} geeft ${v}`);
  }
});

test('de aanbeveling kiest eerst iets wat nog niet geoefend is', () => {
  const p = nieuwProfiel('Liam', 5);
  const tip = volgendeOefening(p);
  assert.ok(tip);
  assert.equal(tip!.reden, 'Nog niet geoefend');
  assert.equal(aanbevelingen(p, 3).length, 3);
});

test('de aanbeveling zet een zwak onderwerp boven een sterk onderwerp', () => {
  const p = nieuwProfiel('Eva', 6, '🐨', 1000);
  const nu = 2000;
  const beheersing = { ...p.beheersing };
  for (const id of Object.keys(beheersing)) {
    beheersing[id] = { ...beheersing[id], goed: 20, fout: 1, laatstGeoefend: nu, sterren: 3, niveau: 5 };
  }
  beheersing['taal.spelling'] = { ...beheersing['taal.spelling'], goed: 3, fout: 12, sterren: 0, niveau: 1 };
  const tip = volgendeOefening({ ...p, beheersing }, nu);
  assert.equal(tip!.onderwerp.id, 'taal.spelling');
});

test('kopen kost munten en levert het item op', () => {
  const p = { ...nieuwProfiel('Mees', 4), munten: 1000 };
  const item = WINKEL.find((w) => !p.bezit.includes(w.id))!;
  assert.ok(kanKopen(p, item));

  const na = koop(p, item.id);
  assert.equal(na.munten, 1000 - item.prijs);
  assert.ok(na.bezit.includes(item.id));
  assert.equal(na.avatar, item.emoji);
  assert.equal(koop(na, item.id).munten, na.munten, 'twee keer kopen kost niet nog een keer');
});

test('kopen zonder munten kan niet', () => {
  const p = nieuwProfiel('Amir', 4);
  const duur = WINKEL[WINKEL.length - 1];
  assert.equal(kanKopen(p, duur), false);
  assert.throws(() => koop(p, duur.id), /Niet genoeg munten/);
  assert.throws(() => koop(p, 'bestaat-niet'), /Onbekend item/);
});

test('je kunt alleen een avatar kiezen die je bezit', () => {
  const p = nieuwProfiel('Zoë', 4, '🦉');
  const nietBezeten = WINKEL.find((w) => !p.bezit.includes(w.id))!;
  assert.equal(kiesAvatar(p, nietBezeten.id).avatar, '🦉');
});

test('een opgeslagen profiel van een oudere vorm blijft bruikbaar', () => {
  const oud = { naam: 'Daan', groep: 5, xp: 120, munten: 30 };
  const p = migreerProfiel(oud);
  assert.ok(p);
  assert.equal(p!.naam, 'Daan');
  assert.equal(p!.xp, 120);
  assert.ok(Object.keys(p!.beheersing).length > 0, 'ontbrekende beheersing wordt aangevuld');
  assert.ok(Array.isArray(p!.badges));
  assert.equal(migreerProfiel(null), null);
  assert.equal(migreerProfiel({ naam: 'zonder groep' }), null);
});
