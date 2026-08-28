import test from 'node:test';
import assert from 'node:assert/strict';
import { euro, jaarKortingProcent, perMaand, PLANNEN, vindPlan } from '../src/core/abonnement/plannen';
import {
  activeer,
  dagenResterend,
  gratisAbonnement,
  GRATIS_VAK,
  GRATIS_VRAGEN_PER_DAG,
  heeftToegang,
  hervat,
  huidigeStatus,
  magFilmpje,
  magOefenen,
  maxProfielen,
  startProef,
  zegOp,
} from '../src/core/abonnement/toegang';

const DAG = 86400000;

test('het jaarplan is echt goedkoper dan twaalf maanden los', () => {
  const maand = vindPlan('maand');
  const jaar = vindPlan('jaar');
  assert.ok(jaar.centen < maand.centen * 12, 'anders heeft het jaarplan geen zin');
  assert.ok(jaarKortingProcent() >= 25, `korting is maar ${jaarKortingProcent()}%`);
  assert.equal(perMaand(jaar), Math.round(jaar.centen / 12));
  assert.equal(perMaand(maand), maand.centen);
});

test('elk plan heeft een product-id, behalve het gratis plan', () => {
  for (const plan of PLANNEN) {
    if (plan.id === 'gratis') {
      assert.equal(plan.productId, null);
      assert.equal(plan.centen, 0);
    } else {
      assert.ok(plan.productId, `${plan.id} mist een product-id voor de stores`);
      assert.ok(plan.centen > 0);
    }
  }
});

test('bedragen worden als Nederlandse euro getoond', () => {
  assert.equal(euro(499), '€4,99');
  assert.equal(euro(3999), '€39,99');
  assert.equal(euro(0), '€0,00');
});

test('zonder abonnement is rekenen onbeperkt', () => {
  const abo = gratisAbonnement();
  assert.equal(heeftToegang(abo), false);
  for (const gedaan of [0, 50, 500]) {
    assert.equal(magOefenen(abo, 'rekenen.tafels', gedaan).mag, true, `rekenen moet vrij blijven na ${gedaan} vragen`);
  }
});

test('buiten het gratis vak geldt een dagelijkse limiet', () => {
  const abo = gratisAbonnement();
  const bijna = magOefenen(abo, 'taal.spelling', GRATIS_VRAGEN_PER_DAG - 3);
  assert.equal(bijna.mag, true);
  assert.equal(bijna.restVandaag, 3);

  const op = magOefenen(abo, 'taal.spelling', GRATIS_VRAGEN_PER_DAG);
  assert.equal(op.mag, false);
  assert.ok(op.reden && op.reden.length > 10, 'er hoort een uitleg bij die je aan een ouder kunt tonen');
});

test('het gratis vak bestaat echt in het curriculum', () => {
  assert.equal(magOefenen(gratisAbonnement(), `${GRATIS_VAK}.tafels`, 999).mag, true);
});

test('met een abonnement vervalt elke limiet', () => {
  const abo = activeer(gratisAbonnement(), 'jaar');
  assert.equal(heeftToegang(abo), true);
  assert.equal(magOefenen(abo, 'taal.spelling', 9999).mag, true);
  assert.equal(magFilmpje(abo, 99), true);
  assert.equal(maxProfielen(abo), 5);
});

test('de gratis versie geeft één profiel en drie filmpjes', () => {
  const abo = gratisAbonnement();
  assert.equal(maxProfielen(abo), 1);
  assert.equal(magFilmpje(abo, 0), true);
  assert.equal(magFilmpje(abo, 2), true);
  assert.equal(magFilmpje(abo, 3), false);
});

test('de proefperiode kan maar één keer', () => {
  const abo = startProef(gratisAbonnement(), 'jaar', 0);
  assert.equal(abo.status, 'proef');
  assert.equal(heeftToegang(abo, 0), true);
  assert.equal(abo.proefGebruikt, true);
  assert.throws(() => startProef(abo, 'maand', 0), /al een keer gebruikt/);
});

test('een proefperiode loopt af en valt terug op gratis als je niet verlengt', () => {
  const proef = { ...startProef(gratisAbonnement(), 'jaar', 0), automatischVerlengen: false };
  const na = huidigeStatus(proef, 15 * DAG);
  assert.equal(na.status, 'verlopen');
  assert.equal(na.plan, 'gratis');
  assert.equal(heeftToegang(na, 15 * DAG), false);
});

test('met automatisch verlengen loopt het abonnement door', () => {
  const abo = activeer(gratisAbonnement(), 'maand', 0);
  const na = huidigeStatus(abo, 40 * DAG);
  assert.equal(na.status, 'actief');
  assert.equal(heeftToegang(na, 40 * DAG), true);
});

test('opzeggen laat de lopende periode uitlopen, zonder opzegtermijn', () => {
  const abo = activeer(gratisAbonnement(), 'maand', 0);
  const opgezegd = zegOp(abo);
  assert.equal(opgezegd.status, 'opgezegd');
  assert.equal(opgezegd.automatischVerlengen, false);
  assert.equal(heeftToegang(opgezegd, 10 * DAG), true, 'je houdt toegang tot het einde van de periode');
  assert.equal(heeftToegang(huidigeStatus(opgezegd, 40 * DAG), 40 * DAG), false, 'daarna stopt het vanzelf');
});

test('een opgezegd abonnement kun je hervatten', () => {
  const abo = zegOp(activeer(gratisAbonnement(), 'jaar', 0));
  const weer = hervat(abo);
  assert.equal(weer.status, 'actief');
  assert.equal(weer.automatischVerlengen, true);
});

test('resterende dagen kloppen', () => {
  const abo = activeer(gratisAbonnement(), 'maand', 0);
  assert.equal(dagenResterend(abo, 0), 30);
  assert.equal(dagenResterend(abo, 29 * DAG), 1);
  assert.equal(dagenResterend(gratisAbonnement()), null);
});
