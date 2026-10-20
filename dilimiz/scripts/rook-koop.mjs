/**
 * De koopstroom doorlopen, met de nagebootste winkel.
 *
 *   npm run rook-koop
 *
 * Gebouwd met `--mode test`, zodat `winkel()` de nagebootste uitvoering kiest.
 * Dit bewijst niet dat `cordova-plugin-purchase` werkt -- dat kan alleen op een
 * toestel -- maar wel dat alles eromheen klopt: de ouderpoort ervoor, wat het
 * scherm vóór de knop belooft, wat er in de opslag terechtkomt, en dat
 * herstellen en afbreken nergens blijven hangen.
 *
 * Dat was het enige deel van de betaalstroom dat helemaal ongetest was.
 */
import { chromium } from 'playwright'

const BASIS = process.argv[2] ?? 'http://localhost:4174'
const browser = await chromium.launch()
const pagina = await browser.newPage({ viewport: { width: 390, height: 844 } })

const fouten = []
pagina.on('pageerror', (e) => fouten.push(e.message))

const stap = async (naam, fn) => {
  try { await fn(); console.log(`  ✓ ${naam}`) }
  catch (e) { console.log(`  ✗ ${naam}\n    ${e.message.split('\n')[0]}`); throw e }
}

/** Door de ouderpoort: de som uitrekenen die op het scherm staat. */
const doorDePoort = async () => {
  const vraag = await pagina.textContent('label[for="poort"]')
  const [, a, b] = vraag.match(/(\d+)\s*×\s*(\d+)/)
  await pagina.locator('#poort').fill(String(Number(a) * Number(b)))
  await pagina.getByRole('button', { name: /^Verder$/ }).click()
}

/** Het welkomstscherm doorlopen, want zonder dat is er geen app. */
const welkom = async () => {
  await pagina.goto(BASIS, { waitUntil: 'networkidle' })
  await pagina.getByRole('button', { name: /Nederlands/ }).click()
  await pagina.getByRole('button', { name: /Begrepen/ }).click()
  await pagina.getByRole('button', { name: /Liever niets/ }).click()
  await pagina.getByRole('button', { name: /^Verder$/ }).click()
  await pagina.getByRole('button', { name: /^Verder$/ }).click()
  await pagina.getByRole('button', { name: /Beginnen/ }).click()
}

try {
  await welkom()

  await stap('het abonnementsscherm zit achter de ouderpoort', async () => {
    await pagina.goto(`${BASIS}#/abonnement`, { waitUntil: 'networkidle' })
    if (!(await pagina.locator('#poort').count())) throw new Error('geen poort')
    await doorDePoort()
    await pagina.getByRole('heading', { name: /hele cursus/ }).waitFor({ timeout: 3000 })
  })

  await stap('de prijs komt uit de winkel: € 5,99 per maand', async () => {
    const tekst = await pagina.textContent('body')
    for (const moet of ['5,99', 'per maand', 'Maandelijks opzegbaar']) {
      if (!tekst.includes(moet)) throw new Error(`"${moet}" staat er niet`)
    }
  })

  await stap('de koopknop staat aan, want er ís hier een winkel', async () => {
    const knop = pagina.getByRole('button', { name: /^Kiezen$/ })
    await knop.waitFor({ timeout: 3000 })
    if (!(await knop.isEnabled())) throw new Error('de koopknop staat uit')
  })

  await stap('herstellen zonder eerdere aankoop meldt dat er niets is', async () => {
    await pagina.getByRole('button', { name: /Al eerder gekocht/ }).click()
    await pagina.getByRole('status').waitFor({ timeout: 3000 })
    const melding = await pagina.getByRole('status').textContent()
    if (!/geen eerdere aankoop/i.test(melding)) throw new Error(`onverwachte melding: ${melding}`)
  })

  await stap('kopen legt het abonnement vast en stuurt naar het pad', async () => {
    await pagina.getByRole('button', { name: /^Kiezen$/ }).click()
    await pagina.getByRole('heading', { name: /Jouw pad/ }).waitFor({ timeout: 4000 })
  })

  await stap('het abonnement staat in de opslag, zonder proefperiode', async () => {
    const opslag = await pagina.evaluate(() => localStorage.getItem('dilimiz.v1'))
    const { abonnement } = JSON.parse(opslag)
    if (abonnement.actief !== true) throw new Error('abonnement staat niet op actief')
    if (abonnement.plan !== 'maand') throw new Error(`verkeerd plan: ${abonnement.plan}`)
    // Er staat geen proefperiode op het product, dus hoort er ook geen
    // proefperiode vastgelegd te zijn. Dat is de fout uit de vorige app.
    if (abonnement.proefGestart !== 0) throw new Error('er is een proefperiode vastgelegd die er niet was')
  })

  await stap('het scherm zegt daarna dat het abonnement loopt', async () => {
    await pagina.goto(`${BASIS}#/abonnement`, { waitUntil: 'networkidle' })
    await doorDePoort()
    const tekst = await pagina.textContent('body')
    if (!/abonnement loopt/i.test(tekst)) throw new Error('het scherm zegt niet dat het loopt')
    if (await pagina.getByRole('button', { name: /^Kiezen$/ }).count()) {
      throw new Error('de koopknop staat er nog terwijl er al betaald is')
    }
    if (!/Opzeggen kan altijd/.test(tekst)) throw new Error('opzeggen wordt niet uitgelegd')
  })

  await stap('een betaalde les is nu open', async () => {
    await pagina.goto(`${BASIS}#/`, { waitUntil: 'networkidle' })
    const tekst = await pagina.textContent('body')
    if (/Hoort bij het abonnement/.test(tekst)) {
      throw new Error('er staan nog betaalde slotjes op het pad')
    }
  })

  console.log(`\nconsolefouten: ${fouten.length}`)
  for (const f of fouten.slice(0, 5)) console.log(`  - ${f}`)
  process.exitCode = fouten.length ? 1 : 0
} catch (e) {
  console.log(`\nMISLUKT: ${e.message}`)
  process.exitCode = 1
} finally {
  await browser.close()
}
