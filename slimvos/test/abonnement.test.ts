import test from 'node:test';
import assert from 'node:assert/strict';
import {
  euro,
  jaarKortingProcent,
  perMaand,
  PLANNEN,
  STANDAARD_PLAN,
  verlengingsregel,
  vindPlan,
} from '../src/core/abonnement/plannen';
import {
  activeer,
  dagenResterend,
  datumInWoorden,
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
  volgendeAfschrijving,
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

test('de proefperiode duurt precies een week', () => {
  assert.equal(vindPlan('maand').proefDagen, 7);
  assert.equal(vindPlan('jaar').proefDagen, 7);
  assert.equal(vindPlan('gratis').proefDagen, 0);
});

test('na de proefweek gaat het maandabonnement vanzelf in', () => {
  const proef = startProef(gratisAbonnement(), 'maand', 0);
  assert.equal(proef.status, 'proef');
  assert.equal(dagenResterend(proef, 0), 7);

  // Dag 6: nog proef, nog niets betaald.
  const halverwege = huidigeStatus(proef, 6 * DAG);
  assert.equal(halverwege.status, 'proef');

  // Dag 8: de week is om, het abonnement loopt.
  const na = huidigeStatus(proef, 8 * DAG);
  assert.equal(na.status, 'actief');
  assert.equal(na.plan, 'maand');
  assert.equal(heeftToegang(na, 8 * DAG), true);
});

test('opzeggen tijdens de proefweek kost niets', () => {
  const proef = startProef(gratisAbonnement(), 'maand', 0);
  const opgezegd = zegOp(proef);
  assert.equal(heeftToegang(opgezegd, 3 * DAG), true, 'de week loopt gewoon af');
  assert.equal(volgendeAfschrijving(opgezegd, 3 * DAG), null, 'er komt geen afschrijving meer');
  const na = huidigeStatus(opgezegd, 9 * DAG);
  assert.equal(na.status, 'verlopen');
  assert.equal(heeftToegang(na, 9 * DAG), false);
});

test('de eerste afschrijving valt op het einde van de proefweek', () => {
  const proef = startProef(gratisAbonnement(), 'maand', 0);
  const eerste = volgendeAfschrijving(proef, 0);
  assert.ok(eerste);
  assert.equal(eerste!.isEersteKeer, true);
  assert.equal(eerste!.plan, 'maand');
  assert.equal(eerste!.op, 7 * DAG);

  // Daarna is het gewoon de volgende maandtermijn.
  const actief = huidigeStatus(proef, 8 * DAG);
  const tweede = volgendeAfschrijving(actief, 8 * DAG);
  assert.equal(tweede!.isEersteKeer, false);
  assert.ok(tweede!.op > 8 * DAG);
});

test('een app die weken dichtstond komt op de juiste periode uit', () => {
  const abo = activeer(gratisAbonnement(), 'maand', 0);
  const na = huidigeStatus(abo, 95 * DAG);
  assert.equal(na.status, 'actief');
  assert.ok(na.looptTot !== null && na.looptTot > 95 * DAG, 'de periode loopt in de toekomst');
  assert.ok(na.looptTot !== null && na.looptTot <= 125 * DAG, 'en niet verder dan één termijn vooruit');
});

test('een gratis abonnement heeft geen afschrijving', () => {
  assert.equal(volgendeAfschrijving(gratisAbonnement()), null);
});

test('datums worden in gewone woorden getoond', () => {
  assert.equal(datumInWoorden(new Date(2026, 8, 4).getTime()), '4 september 2026');
  assert.equal(datumInWoorden(new Date(2027, 0, 31).getTime()), '31 januari 2027');
});

test('de verlengingsregel zegt prijs, periode en dat het doorloopt', () => {
  const regel = verlengingsregel(vindPlan('maand'));
  assert.ok(regel.includes('7 dagen gratis'), regel);
  assert.ok(regel.includes('€4,99'), regel);
  assert.ok(regel.includes('per maand'), regel);
  assert.ok(/automatisch door/i.test(regel), regel);
  assert.ok(!verlengingsregel(vindPlan('gratis')).includes('€'), 'gratis heeft geen bedrag');
});

test('het standaardplan is het maandplan: de laagste drempel', () => {
  assert.equal(STANDAARD_PLAN, 'maand');
});
