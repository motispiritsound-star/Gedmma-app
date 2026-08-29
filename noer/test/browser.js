// Doorloop van de hele app in een echte browser: profiel aanmaken, elk scherm
// openen, elk spel spelen, licht en donker. Dit vangt wat de datatests niet
// zien: stukgelopen selectors, fouten in de console, lege of kapotte schermen.
//
//   npm start                (in een ander venster)
//   npm run test:browser
//
// Playwright staat als devDependency; de app zelf heeft geen afhankelijkheden.
// NOER_URL zet een ander adres, NOER_SCHERMAFDRUKKEN een map voor plaatjes.

import { chromium } from 'playwright';

const BASIS = process.env.NOER_URL || 'http://localhost:5173';
const SCHERMEN = process.env.NOER_SCHERMAFDRUKKEN || null;

const fouten = [];
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.on('console', (m) => { if (m.type() === 'error') fouten.push(`console: ${m.text()}`); });
page.on('pageerror', (e) => fouten.push(`pageerror: ${e.message}`));

const stap = async (naam, fn) => {
  try { await fn(); console.log(`  ok  ${naam}`); }
  catch (e) { console.log(`FOUT  ${naam}: ${e.message}`); fouten.push(`${naam}: ${e.message}`); }
};

await page.goto(`${BASIS}/`, { waitUntil: 'networkidle' });

await stap('profiel aanmaken', async () => {
  await page.fill('#naam', 'Yasmina');
  await page.selectOption('#leeftijd', '9');
  await page.click('button[type=submit]');
  await page.waitForSelector('.groet h1');
  if (!(await page.textContent('.groet h1')).includes('Yasmina')) throw new Error('naam niet in groet');
});
if (SCHERMEN) await page.screenshot({ path: `${SCHERMEN}/noer-thuis.png` });

await stap('alfabet openen', async () => {
  await page.click('a[href="#/letters"]');
  await page.waitForSelector('.lettertegel');
  const n = await page.locator('.lettertegel').count();
  if (n !== 28) throw new Error(`${n} lettertegels in plaats van 28`);
});

await stap('letterdetail', async () => {
  await page.click('.lettertegel >> nth=1');
  await page.waitForSelector('.letter-groot');
  const vormen = await page.locator('.vorm').count();
  if (vormen !== 4) throw new Error(`${vormen} vormen`);
});
if (SCHERMEN) await page.screenshot({ path: `${SCHERMEN}/noer-letter.png` });

await stap('klankjacht spelen', async () => {
  await page.goto(`${BASIS}/#/letters`);
  await page.click('button:has-text("Klankjacht")');
  await page.waitForSelector('.keuze');
  let zagFoutmelding = false;
  for (let i = 0; i < 12; i++) {
    const keuzes = page.locator('.keuze');
    if (!(await keuzes.count())) break;
    await keuzes.first().click();
    const doorgaan = page.locator('.feedback .doorgaan');
    await doorgaan.waitFor({ timeout: 3000 });
    const tekst = await page.textContent('.feedback-tekst');
    if (tekst.includes('Het goede antwoord is:')) zagFoutmelding = true;
    await doorgaan.click();
    await page.waitForTimeout(150);
  }
  await page.waitForSelector('.eind', { timeout: 6000 });
  if (!zagFoutmelding) console.log('      (geen fout antwoord gehad — feedbacktekst niet gezien)');
});
if (SCHERMEN) await page.screenshot({ path: `${SCHERMEN}/noer-eind.png` });

await stap('qaida les 1', async () => {
  await page.goto(`${BASIS}/#/qaida`);
  await page.waitForSelector('.padstap');
  const stappen = await page.locator('.padstap').count();
  if (stappen !== 10) throw new Error(`${stappen} stappen op het leerpad`);
  const opSlot = await page.locator('.padstap.slot').count();
  if (opSlot !== 9) throw new Error(`${opSlot} lessen op slot, verwacht 9`);
  if (!(await page.locator('.padstap.huidig .padwijzer').count())) throw new Error('geen startwijzer');
  await page.click('.padstap.open >> nth=0');
  await page.waitForSelector('.bladvak');
  const vakken = await page.locator('.bladvak').count();
  if (vakken !== 28) throw new Error(`${vakken} vakken op het oefenblad`);
});
if (SCHERMEN) await page.screenshot({ path: `${SCHERMEN}/noer-qaida.png` });

await stap('koran: lezen, betekenis, uit je hoofd', async () => {
  await page.goto(`${BASIS}/#/koran`);
  await page.waitForSelector('.soerakaart');
  await page.click('.soerakaart:has-text("An-Naas")');
  await page.waitForSelector('.aya');
  if ((await page.locator('.ayakaart').count()) !== 6) throw new Error('geen 6 aya-kaarten');
  await page.click('button:has-text("Betekenis")');
  await page.waitForSelector('.wvw');
  await page.click('button:has-text("Uit je hoofd")');
  await page.waitForSelector('.uithoofd');
  await page.click('button:has-text("Deze ken ik uit mijn hoofd") >> nth=0');
  await page.waitForTimeout(400);
  if (!(await page.locator('.ayakaart.geleerd').count())) throw new Error('aya niet als geleerd gemarkeerd');
});
if (SCHERMEN) await page.screenshot({ path: `${SCHERMEN}/noer-koran.png` });

await stap('woordpuzzel', async () => {
  await page.click('button:has-text("Woordpuzzel")');
  await page.waitForSelector('.woordtegel');
  for (let ronde = 0; ronde < 3; ronde++) {
    const tegels = page.locator('.voorraad .tegel:not(.goed)');
    const n = await tegels.count();
    if (!n) break;
    for (let i = 0; i < n * 3; i++) {
      const over = page.locator('.voorraad .tegel:not(.goed)');
      const m = await over.count();
      if (!m) break;
      await over.nth(Math.floor(Math.random() * m)).click();
      await page.waitForTimeout(80);
    }
    await page.waitForTimeout(1400);
  }
});

await stap('woorden en geheugenspel', async () => {
  await page.goto(`${BASIS}/#/woorden`);
  await page.waitForSelector('.tegel');
  await page.click('.tegel >> nth=0');
  await page.waitForSelector('.woordkaart');
  await page.click('.woordkaart >> nth=0');
  await page.click('button:has-text("Geheugenspel")');
  await page.waitForSelector('.memokaart');
  const n = await page.locator('.memokaart').count();
  if (n !== 12) throw new Error(`${n} memokaarten`);
  await page.click('.memokaart >> nth=0');
  await page.click('.memokaart >> nth=1');
  await page.waitForTimeout(1000);
});
if (SCHERMEN) await page.screenshot({ path: `${SCHERMEN}/noer-geheugen.png` });

await stap('voortgang', async () => {
  await page.goto(`${BASIS}/#/voortgang`);
  await page.waitForSelector('.badgerooster');
  const badges = await page.locator('.badgerooster .badge').count();
  if (badges !== 13) throw new Error(`${badges} badges getoond`);
  const xp = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('noer.v1'));
    return Object.values(s.voortgang)[0].xp;
  });
  if (!(xp > 0)) throw new Error('geen punten opgeslagen');
});
if (SCHERMEN) await page.screenshot({ path: `${SCHERMEN}/noer-voortgang.png` });

await stap('ouderscherm met pincode', async () => {
  await page.goto(`${BASIS}/#/ouders`);
  await page.waitForSelector('.kindkaart');
  await page.waitForSelector('.weekstrip .staaf');
  await page.fill('#nieuwe-pin', '1234');
  await page.click('form.instelrij button[type=submit]');
  await page.waitForTimeout(300);
  await page.reload({ waitUntil: 'networkidle' });
  await page.goto(`${BASIS}/#/ouders`);
  await page.waitForSelector('#pin');
  await page.fill('#pin', '9999');
  await page.click('button:has-text("Openen")');
  if (!(await page.textContent('.fout-melding')).includes('klopt niet')) throw new Error('verkeerde pin werd geaccepteerd');
  await page.fill('#pin', '1234');
  await page.click('button:has-text("Openen")');
  await page.waitForSelector('.kindkaart');
});
if (SCHERMEN) await page.screenshot({ path: `${SCHERMEN}/noer-ouders.png`, fullPage: true });

// Regressie: `node.append(null)` zet letterlijk "null" in beeld. Elk scherm
// wordt daarop nagelopen.
await stap('geen losse null of undefined in beeld', async () => {
  const routes = ['/thuis', '/letters', '/letters/ba', '/qaida', '/qaida/losse-letters',
    '/koran', '/koran/an-nas', '/woorden', '/woorden/kleuren', '/voortgang', '/ouders', '/start'];
  const vies = [];
  for (const route of routes) {
    await page.goto(`${BASIS}/#${route}`);
    await page.waitForTimeout(180);
    const tekst = await page.evaluate(() => document.body.innerText);
    if (/(^|\s)(null|undefined|NaN)(\s|$)/.test(tekst)) vies.push(route);
  }
  if (vies.length) throw new Error(`losse null/undefined op: ${vies.join(', ')}`);
});

await stap('donkere modus', async () => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(`${BASIS}/#/thuis`);
  await page.waitForSelector('.groet');
});
if (SCHERMEN) await page.screenshot({ path: `${SCHERMEN}/noer-donker.png` });

await browser.close();
console.log(fouten.length ? `\nFOUTEN (${fouten.length}):\n` + fouten.join('\n') : '\nGeen fouten.');
process.exit(fouten.length ? 1 : 0);
