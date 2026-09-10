// De weg die een ouder aflegt, in een echte browser: van de startpagina naar
// een account, langs de bank, terug naar de bedanktpagina, de app in, en weer
// opzeggen. Dit is de test die zegt of er geld verdiend kan worden.
//
//   NOER_PROEF=1 NOER_GEHEIM=iets-langs npm start   (in een ander venster)
//   node test/koopweg.js
//
// De server moet in de proefstand draaien: het afrekenen gebeurt dan op een
// nepbank op de site zelf, in plaats van bij Mollie.

import { chromium } from 'playwright';

const BASIS = (process.env.NOER_URL || 'http://localhost:5173').replace(/\/$/, '');
const fouten = [];

const browser = await chromium.launch({ executablePath: process.env.NOER_BROWSER || undefined });
const context = await browser.newContext({ viewport: { width: 420, height: 900 } });
const page = await context.newPage();
page.on('pageerror', (e) => fouten.push(`pageerror: ${e.message}`));

const stap = async (naam, fn) => {
  try { await fn(); console.log(`  ok  ${naam}`); }
  catch (e) { console.log(`FOUT  ${naam}: ${e.message}`); fouten.push(`${naam}: ${e.message}`); }
};

const email = `koopweg${Date.now()}@voorbeeld.nl`;
const wachtwoord = 'eenlangwachtwoord';

await stap('de startpagina noemt de prijs, de gratis week en het downloaden', async () => {
  await page.goto(`${BASIS}/`, { waitUntil: 'networkidle' });
  const tekst = await page.textContent('body');
  if (!tekst.includes('7,99')) throw new Error('de prijs staat er niet');
  if (!/[Ee]erste week gratis/.test(tekst)) throw new Error('de gratis week staat er niet');
  if (!(await page.locator('a[href="downloaden.html"]').count())) {
    throw new Error('geen knop om te downloaden');
  }
});

await stap('de downloadpagina legt Android en iPhone allebei uit', async () => {
  await page.goto(`${BASIS}/downloaden.html`, { waitUntil: 'networkidle' });
  for (const naam of ['android', 'ios', 'laptop']) {
    await page.click(`#tab-${naam}`);
    const zichtbaar = await page.locator(`#${naam}`).isVisible();
    if (!zichtbaar) throw new Error(`het tabblad ${naam} gaat niet open`);
  }
  await page.click('#tab-ios');
  const ios = await page.textContent('#ios');
  if (!ios.includes('Zet op beginscherm')) throw new Error('de iPhone-stappen kloppen niet');
  if (!(await page.locator('#installeerpaneel').count())) {
    throw new Error('er is geen plek voor de installeerknop van Chrome');
  }
});

await stap('zonder abonnement kun je meteen beginnen', async () => {
  await page.goto(`${BASIS}/app/`, { waitUntil: 'networkidle' });
  await page.fill('#naam', 'Yasmina');
  await page.selectOption('#leeftijd', '9');
  await page.click('button[type=submit]');
  await page.waitForSelector('.groet h1');
  await page.goto(`${BASIS}/app/#/qaida`);
  await page.waitForSelector('.padstap');
  if (!(await page.locator('.padstap.betaald').count())) throw new Error('er zit niets op slot');
});

await stap('het slot wijst naar de site', async () => {
  await page.goto(`${BASIS}/app/#/qaida/madd`);
  await page.waitForSelector('.slotkaart');
  const href = await page.getAttribute('.slotkaart a.knop', 'href');
  if (!href.includes('aanmelden.html')) throw new Error(`het slot wijst naar ${href}`);
});

await stap('een account aanmaken en de gratis week starten', async () => {
  await page.goto(`${BASIS}/aanmelden.html`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#wachtwoord', wachtwoord);
  await page.check('input[name=plan][value=maand]');
  await page.click('button[type=submit]');
  await page.waitForURL(/proef-betalen/, { timeout: 10000 });
});

await stap('afbreken bij de bank geeft geen toegang', async () => {
  await page.click('#afbreken');
  await page.waitForURL(/bedankt/, { timeout: 10000 });
  await page.waitForSelector('h1');
  const kop = await page.textContent('h1');
  if (!kop.includes('niet gelukt')) throw new Error(`de bedanktpagina zegt: ${kop}`);
  const toegang = await page.evaluate(() =>
    fetch('/api/toegang', { credentials: 'same-origin' }).then((r) => r.json()));
  if (toegang.actief) throw new Error('een afgebroken betaling gaf toch toegang');
});

await stap('opnieuw proberen en nu wel doorgaan', async () => {
  await page.goto(`${BASIS}/aanmelden.html`, { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#wachtwoord', wachtwoord);
  await page.click('button[type=submit]');
  await page.waitForURL(/proef-betalen/, { timeout: 10000 });
  await page.click('#betalen');
  await page.waitForURL(/bedankt/, { timeout: 10000 });
  await page.waitForSelector('h1:has-text("Je week is begonnen")', { timeout: 20000 });
  const tekst = await page.textContent('#tekst');
  if (!/opzeggen kan tot die dag/i.test(tekst)) {
    throw new Error(`de bedanktpagina legt de gratis week niet uit: ${tekst}`);
  }
});

await stap('in de app is alles nu open', async () => {
  await page.goto(`${BASIS}/app/`, { waitUntil: 'networkidle' });
  await page.goto(`${BASIS}/app/#/qaida`);
  await page.waitForSelector('.padstap');
  await page.waitForFunction(() => !document.querySelector('.padstap.betaald'), null, { timeout: 10000 });
  await page.goto(`${BASIS}/app/#/koran`);
  await page.waitForSelector('.soerakaart');
  if (await page.locator('.soerakaart.opslot').count()) throw new Error('er zit nog een soera op slot');
  await page.goto(`${BASIS}/app/#/studio`);
  await page.waitForSelector('.groepregel');
});

await stap('het accountscherm toont de stand en de betaling', async () => {
  await page.goto(`${BASIS}/account.html`, { waitUntil: 'networkidle' });
  await page.waitForSelector('#paneel:not([hidden])');
  const tekst = await page.textContent('#paneel');
  if (!tekst.includes(email)) throw new Error('het e-mailadres staat er niet');
  if (!tekst.includes('Gratis week')) throw new Error('de stand zegt niet dat de gratis week loopt');
  if (!tekst.includes('Eerste incasso')) throw new Error('er staat niet wanneer er geïncasseerd wordt');
  if (!tekst.includes('7,99')) throw new Error('het maandbedrag staat er niet bij');
  const betalingen = await page.textContent('#betalingen');
  if (!betalingen.includes('0,01')) throw new Error('de verificatiebetaling staat niet in de lijst');
});

await stap('opzeggen tijdens de gratis week kost niets', async () => {
  page.once('dialog', (d) => d.accept());
  await page.click('button:has-text("Abonnement opzeggen")');
  await page.waitForSelector('.melding.goed');
  const melding = await page.textContent('.melding.goed');
  if (!melding.includes('niets geïncasseerd')) throw new Error(melding);
  await page.waitForSelector('button:has-text("Toch doorgaan")');
  const toegang = await page.evaluate(() =>
    fetch('/api/toegang', { credentials: 'same-origin' }).then((r) => r.json()));
  if (!toegang.actief) throw new Error('de toegang stopte meteen bij het opzeggen');
  if (toegang.staat !== 'opgezegd') throw new Error(`de stand is ${toegang.staat}`);
});

await stap('hervatten zet het weer aan', async () => {
  await page.click('button:has-text("Toch doorgaan")');
  await page.waitForSelector('button:has-text("Abonnement opzeggen")', { timeout: 10000 });
});

await stap('uitloggen sluit de deur', async () => {
  await page.click('#uitloggen');
  await page.waitForURL(/index\.html|\/$/, { timeout: 10000 });
  const toegang = await page.evaluate(() =>
    fetch('/api/toegang', { credentials: 'same-origin' }).then((r) => r.json()));
  if (toegang.ingelogd) throw new Error('na uitloggen is de sessie er nog');
});

await stap('en dan zit de app weer op slot', async () => {
  await page.goto(`${BASIS}/app/#/qaida`, { waitUntil: 'networkidle' });
  await page.waitForSelector('.padstap');
  await page.waitForFunction(() => document.querySelectorAll('.padstap.betaald').length === 8,
    null, { timeout: 10000 });
});

await stap('de flyer past op één A4', async () => {
  // Eén pagina is het hele punt van een flyer. Groeit de tekst, dan valt er
  // stilletjes een tweede vel uit de printer met een halve alinea erop.
  // Op een smal scherm herschikt de flyer zich om leesbaar te zijn; die versie
  // gaat nooit naar de printer. Meten doen we dus op de breedte waarop het
  // A4-blad zelf te zien is.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto(`${BASIS}/flyer.html`, { waitUntil: 'networkidle' });
  const hoogte = await page.evaluate(() =>
    document.querySelector('.blad').getBoundingClientRect().height);
  // A4 is 297 mm; een browser rekent met 96 punten per inch.
  const bladzijde = (297 / 25.4) * 96;
  if (hoogte > bladzijde + 1) {
    throw new Error(`de flyer is ${Math.round(hoogte)} hoog, een A4 is ${Math.round(bladzijde)}`);
  }
  const kapot = await page.evaluate(() =>
    [...document.images].filter((i) => !i.complete || !i.naturalWidth).length);
  if (kapot) throw new Error(`${kapot} beelden op de flyer laden niet`);

  // En op een telefoon hoort hij te herschikken in plaats van over de rand te
  // lopen: een flyer die je niet kunt doorsturen is een halve flyer.
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(200);
  const overloop = await page.evaluate(() =>
    document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overloop > 1) throw new Error(`de flyer loopt ${overloop}px over de rand op een telefoon`);
});

await context.close();
await browser.close();

console.log(fouten.length ? `\nFOUTEN (${fouten.length}):\n${fouten.join('\n')}` : '\nGeen fouten.');
process.exit(fouten.length ? 1 : 0);
