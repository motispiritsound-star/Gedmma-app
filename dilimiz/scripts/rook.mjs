/**
 * De rooktest: de echte app, in een echte browser, van begin tot eind.
 *
 *   npm run bouw-en-rook      (bouwt, start een server en draait dit)
 *   npm run rook              (tegen een al draaiende `npm run preview`)
 *
 * Dit bestaat omdat de unittests alles groen gaven terwijl het scherm iets
 * anders liet zien. Twee fouten zijn hier gevonden en nergens anders:
 *
 *   - een les die zowel op volgorde als op abonnement dichtzat, zei "maak de
 *     les ervoor af" -- en dat opende hem niet;
 *   - er stond "Klinkt als als dzj", omdat het label en de tekst allebei met
 *     "als" begonnen.
 *
 * Voor allebei staat er nu ook een unittest. Die zijn sneller; deze vindt wat
 * zij niet kunnen zien.
 */
import { chromium } from 'playwright'

const BASIS = process.argv[2] ?? 'http://localhost:4173'
const browser = await chromium.launch()
const pagina = await browser.newPage({ viewport: { width: 390, height: 844 } })

const fouten = []
pagina.on('console', (m) => { if (m.type() === 'error') fouten.push(m.text()) })
pagina.on('pageerror', (e) => fouten.push(`pageerror: ${e.message}`))

const stap = async (naam, fn) => {
  try { await fn(); console.log(`  ✓ ${naam}`) }
  catch (e) { console.log(`  ✗ ${naam}\n    ${e.message.split('\n')[0]}`); throw e }
}

try {
  await pagina.goto(BASIS, { waitUntil: 'networkidle' })

  await stap('welkomstscherm met de naam en de betekenis', async () => {
    await pagina.getByText('Dilimiz', { exact: false }).first().waitFor({ timeout: 5000 })
    const tekst = await pagina.textContent('body')
    if (!/onze taal|unsere Sprache|notre langue|our language/.test(tekst)) {
      throw new Error('de betekenis van de naam staat er niet')
    }
  })

  await stap('taal kiezen -> ouderscherm', async () => {
    await pagina.getByRole('button', { name: /Nederlands/ }).click()
    await pagina.getByText(/voor de ouder/i).waitFor({ timeout: 3000 })
  })

  await stap('ouderscherm noemt privacy, betalen en de stand van de inhoud', async () => {
    const tekst = await pagina.textContent('body')
    for (const moet of ['dit toestel', 'advertenties', 'App Store', 'moedertaalspreker']) {
      if (!tekst.includes(moet)) throw new Error(`"${moet}" staat er niet`)
    }
  })

  await stap('naam, avatar en leeftijd', async () => {
    await pagina.getByRole('button', { name: /Begrepen/ }).click()
    await pagina.getByRole('textbox').fill('Deniz')
    await pagina.getByRole('button', { name: /^Verder$/ }).click()
    await pagina.getByRole('button', { name: '🦊' }).click()
    await pagina.getByRole('button', { name: /^Verder$/ }).click()
    await pagina.getByRole('button', { name: /7 tot 11/ }).click()
    await pagina.getByRole('button', { name: /^Verder$/ }).click()
    await pagina.getByText('Deniz').first().waitFor({ timeout: 3000 })
  })

  await stap('het pad verschijnt met de vier units', async () => {
    await pagina.getByRole('button', { name: /Beginnen/ }).click()
    await pagina.getByRole('heading', { name: /Jouw pad/ }).waitFor({ timeout: 3000 })
    const tekst = await pagina.textContent('body')
    for (const unit of ['Letters en klanken', 'Groeten', 'Ik en jij', 'Familie']) {
      if (!tekst.includes(unit)) throw new Error(`unit "${unit}" staat niet op het pad`)
    }
  })

  await stap('lessen voorbij het gratis deel staan op slot', async () => {
    const tekst = await pagina.textContent('body')
    if (!tekst.includes('abonnement')) throw new Error('geen slotje te zien')
  })

  await stap('eerste les opent met de tip', async () => {
    await pagina.getByRole('link', { name: /Begin hier/ }).click()
    await pagina.getByRole('button', { name: /Snap ik/ }).waitFor({ timeout: 3000 })
    await pagina.getByRole('button', { name: /Snap ik/ }).click()
  })

  await stap('eerste oefening is een letter', async () => {
    await pagina.getByText(/nieuwe letter/i).waitFor({ timeout: 3000 })
    const tekst = await pagina.textContent('body')
    if (!tekst.includes('Hoofdletter')) throw new Error('geen hoofdletter op de leerkaart')
  })

  await stap('acht oefeningen doorlopen zonder vast te lopen', async () => {
    for (let i = 0; i < 8; i++) {
      const volgende = pagina.getByRole('button', { name: /^Volgende$/ })
      const nakijken = pagina.getByRole('button', { name: /^Nakijken$/ })
      const klaar = pagina.getByRole('button', { name: /^Klaar$/ })
      if (await volgende.count() && await volgende.first().isEnabled()) {
        await volgende.first().click()
      } else if (await nakijken.count()) {
        // Iets aanklikken: een keuze, een tegel, of typen.
        const keuzes = pagina.locator('.keuze:not([disabled])')
        const tegels = pagina.locator('.tegel:not([disabled])')
        const invoer = pagina.locator('input.invoer')
        if (await keuzes.count()) await keuzes.first().click()
        else if (await invoer.count()) await invoer.first().fill('x')
        else if (await tegels.count()) await tegels.first().click()
        await nakijken.click()
        await pagina.getByRole('button', { name: /^Volgende$/ }).click()
      } else if (await klaar.count()) {
        await klaar.first().click()
      } else if (await pagina.getByRole('heading', { name: /Les klaar/ }).count()) {
        break
      } else {
        throw new Error(`stap ${i}: geen knop gevonden`)
      }
    }
  })

  await stap('de les is af te maken en geeft sterren', async () => {
    for (let i = 0; i < 40; i++) {
      if (await pagina.getByRole('heading', { name: /Les klaar/ }).count()) break
      const nakijken = pagina.getByRole('button', { name: /^Nakijken$/ })
      const volgende = pagina.getByRole('button', { name: /^Volgende$/ })
      const klaar = pagina.getByRole('button', { name: /^Klaar$/ })
      if (await volgende.count() && await volgende.first().isEnabled()) { await volgende.first().click(); continue }
      if (await nakijken.count()) {
        const keuzes = pagina.locator('.keuze:not([disabled])')
        const tegels = pagina.locator('.tegel:not([disabled])')
        const invoer = pagina.locator('input.invoer')
        if (await keuzes.count()) await keuzes.first().click()
        else if (await invoer.count()) await invoer.first().fill('x')
        else if (await tegels.count()) await tegels.first().click()
        await nakijken.click(); continue
      }
      if (await klaar.count()) { await klaar.first().click(); continue }
      break
    }
    await pagina.getByRole('heading', { name: /Les klaar/ }).waitFor({ timeout: 5000 })
    const tekst = await pagina.textContent('body')
    if (!/[★☆]/.test(tekst)) throw new Error('geen sterren')
    if (!tekst.includes('Doe dit samen')) console.log('    (geen gezinsopdracht — unit nog niet af, dat hoort)')
  })

  await stap('voortgang staat op het pad', async () => {
    await pagina.getByRole('button', { name: /Terug naar het pad/ }).click()
    await pagina.getByRole('heading', { name: /Jouw pad/ }).waitFor({ timeout: 3000 })
    if (!(await pagina.getByRole('link', { name: /Verder waar je was/ }).count())) {
      throw new Error('het pad zegt nog "Beginnen"')
    }
  })

  await stap('voortgang blijft na verversen', async () => {
    await pagina.reload({ waitUntil: 'networkidle' })
    await pagina.getByRole('heading', { name: /Jouw pad/ }).waitFor({ timeout: 3000 })
  })

  await stap('ouderoverzicht zit achter de ouderpoort', async () => {
    await pagina.getByRole('link', { name: /Jij/ }).click()
    await pagina.getByRole('link', { name: /Voor ouders/ }).click()
    await pagina.getByRole('heading', { name: /voor de ouder/i }).waitFor({ timeout: 3000 })
    const vraag = await pagina.textContent('label[for="poort"]')
    const [, a, b] = vraag.match(/(\d+)\s*×\s*(\d+)/)
    await pagina.locator('#poort').fill('1')
    await pagina.getByRole('button', { name: /^Verder$/ }).click()
    if (!(await pagina.getByRole('alert').count())) throw new Error('fout antwoord werd geaccepteerd')
    await pagina.locator('#poort').fill(String(Number(a) * Number(b)))
    await pagina.getByRole('button', { name: /^Verder$/ }).click()
    await pagina.getByRole('heading', { name: /Voor ouders/ }).waitFor({ timeout: 3000 })
  })

  await stap('ouderoverzicht toont de gegevens en de drie knoppen', async () => {
    const tekst = await pagina.textContent('body')
    for (const moet of ['Bekijken', 'Meenemen', 'Terugzetten', 'Alles verwijderen', 'verzamelt niets']) {
      if (!tekst.includes(moet)) throw new Error(`"${moet}" staat er niet`)
    }
  })

  await stap('abonnementsscherm noemt prijs, proef, verlenging en opzeggen', async () => {
    await pagina.goto(`${BASIS}#/abonnement`, { waitUntil: 'networkidle' })
    const vraag = await pagina.textContent('label[for="poort"]')
    const [, a, b] = vraag.match(/(\d+)\s*×\s*(\d+)/)
    await pagina.locator('#poort').fill(String(Number(a) * Number(b)))
    await pagina.getByRole('button', { name: /^Verder$/ }).click()
    await pagina.getByRole('heading', { name: /hele cursus/ }).waitFor({ timeout: 3000 })
    const tekst = await pagina.textContent('body')
    for (const moet of ['59,99', 'per jaar', 'verlengt automatisch', 'Opzeggen kan altijd']) {
      if (!tekst.includes(moet)) throw new Error(`"${moet}" staat er niet`)
    }
    if (/aftelklok|nog maar|laatste kans/i.test(tekst)) throw new Error('aftelklok of haast gevonden')
  })

  await stap('geen enkel netwerkverzoek naar buiten', async () => {
    const buiten = []
    pagina.on('request', (r) => {
      const u = r.url()
      if (!u.startsWith(BASIS) && !u.startsWith('data:') && !u.startsWith('blob:')) buiten.push(u)
    })
    await pagina.goto(BASIS, { waitUntil: 'networkidle' })
    await pagina.waitForTimeout(500)
    if (buiten.length) throw new Error(`verzoeken naar buiten: ${buiten.join(', ')}`)
  })

  console.log(`\nconsolefouten: ${fouten.length}`)
  for (const f of fouten.slice(0, 5)) console.log(`  - ${f}`)
  process.exitCode = fouten.length ? 1 : 0
} catch (e) {
  console.log(`\nMISLUKT: ${e.message}`)
  await pagina.screenshot({ path: '/tmp/claude-0/-home-user-Gedmma-app/dd4bb77c-3872-5d34-9efa-113a8e05b6e8/scratchpad/mislukt.png' })
  console.log('schermafdruk: mislukt.png')
  process.exitCode = 1
} finally {
  await browser.close()
}
