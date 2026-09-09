// Browsertest: doorloopt de app zoals een kind dat doet.
// Gebruik:  npx expo export --platform web --output-dir dist
//           npx serve dist -l 8099 --single
//           SP=. node test/browsertest.mjs
import { chromium } from 'playwright';

const fouten = [];
const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  args: ['--no-sandbox'],
});
const page = await browser.newPage({ viewport: { width: 420, height: 900 } });
page.on('pageerror', (e) => fouten.push(`pageerror: ${e.message}`));
page.on('console', (m) => { if (m.type() === 'error') fouten.push(`console: ${m.text()}`); });

let mislukt = 0;
const stap = async (naam, fn) => {
  try { await fn(); console.log(`OK   ${naam}`); }
  catch (e) { console.log(`FOUT ${naam}: ${e.message.split('\n')[0]}`); mislukt++; }
};
const SP = process.env.SP ?? '.';

await page.goto('http://localhost:8099/', { waitUntil: 'load' });

await stap('onboarding verschijnt', async () => {
  await page.getByText('Hoi, ik ben Vos!').first().waitFor({ timeout: 20000 });
});

await stap('naam, groep en maatje kiezen en beginnen', async () => {
  await page.getByPlaceholder('Bijvoorbeeld: Fenna').first().fill('Testkind');
  await page.getByText('groep 5', { exact: true }).first().click();
  await page.getByRole('button', { name: /Kies avatar/ }).nth(1).click();
  await page.getByRole('button', { name: 'Beginnen' }).first().click();
  await page.getByText('Ga verder met').first().waitFor({ timeout: 20000 });
});
await page.screenshot({ path: `${SP ?? '.'}/01-home.png` });

await stap('ronde starten', async () => {
  await page.getByRole('button', { name: /Start ronde/ }).first().click();
  await page.getByText(/^1\/10$/).first().waitFor({ timeout: 20000 });
});
await page.screenshot({ path: `${SP ?? '.'}/02-vraag.png` });

let beantwoord = 0;
let goedGeteld = 0;
await stap('tien vragen beantwoorden', async () => {
  for (let i = 0; i < 10; i++) {
    const invul = page.getByTestId('antwoord-invoer');
    if (await invul.count() > 0) {
      await invul.fill('42');
      await page.getByTestId('controleer').first().click();
    } else {
      // klik de eerste antwoordoptie; opties staan onder de vraagtekst
      await page.getByTestId('optie-0').first().click({ timeout: 10000 });
    }
    const uitleg = page.getByText(/Goed!|Het goede antwoord is/);
    await uitleg.first().waitFor({ timeout: 10000 });
    if ((await page.getByText(/✅ Goed!/).count()) > 0) goedGeteld++;
    if (i === 0) await page.screenshot({ path: `${SP ?? '.'}/03-feedback.png` });
    await page.getByTestId('volgende').first().click();
    beantwoord++;
    await page.waitForTimeout(200);
  }
});

await stap('eindscherm toont de score', async () => {
  await page.getByText(/van de 10 goed/).first().waitFor({ timeout: 20000 });
});
await page.screenshot({ path: `${SP ?? '.'}/04-resultaat.png`, fullPage: true });

await stap('terug naar het overzicht', async () => {
  await page.getByTestId('terug').first().click();
  await page.getByText('Ga verder met').first().waitFor({ timeout: 20000 });
});

const tab = async (naam) => page.locator('[role="tab"]').filter({ hasText: naam }).first().click();

await stap('voortgang is bijgewerkt', async () => {
  await tab('Voortgang');
  await page.getByText('Jouw voortgang').first().waitFor({ timeout: 15000 });
  const body = await page.textContent('body');
  if (!/goed beantwoord/.test(body)) throw new Error('statistieken ontbreken');
});
await page.screenshot({ path: `${SP ?? '.'}/05-voortgang.png`, fullPage: true });

await stap('ouderdashboard laadt', async () => {
  await tab('Ouders');
  await page.getByText('Afgelopen week').first().waitFor({ timeout: 15000 });
});
await page.screenshot({ path: `${SP ?? '.'}/06-ouders.png`, fullPage: true });

await stap('beloningen laden', async () => {
  await tab('Beloningen');
  await page.getByText(/Badges \(/).first().waitFor({ timeout: 15000 });
});
await page.screenshot({ path: `${SP ?? '.'}/07-beloningen.png`, fullPage: true });

await stap('voortgang blijft bewaard na herladen', async () => {
  await page.goto('http://localhost:8099/', { waitUntil: 'load' });
  await page.getByText('Ga verder met').first().waitFor({ timeout: 20000 });
  const body = await page.textContent('body');
  if (!/Testkind/.test(body)) throw new Error('profiel niet teruggeladen');
});

console.log(`\nBeantwoord: ${beantwoord}/10, waarvan goed gerekend: ${goedGeteld}`);
console.log(fouten.length ? `Browserfouten:\n - ${[...new Set(fouten)].slice(0, 10).join('\n - ')}` : 'Geen browserfouten.');
console.log(mislukt === 0 ? '\nALLE STAPPEN GESLAAGD' : `\n${mislukt} STAP(PEN) MISLUKT`);
await browser.close();
process.exit(mislukt === 0 ? 0 : 1);
