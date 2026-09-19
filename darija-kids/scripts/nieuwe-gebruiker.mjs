/**
 * Speelt de app door als iemand die hem net heeft geïnstalleerd.
 *
 * De unit-tests zeggen of de regels kloppen en `sweep.mjs` of elk scherm
 * opkomt. Wat geen van beide doet is de app gebruiken: taal kiezen, de eerste
 * les uitspelen, punten zien binnenkomen, bij de toets een geschiedeniskaart
 * krijgen en tegen het abonnement aanlopen. Dat is wat een recensent doet, en
 * het is de enige test waarin de app iets kan zijn dat werkt maar niet deugt.
 *
 * Alles begint met een lege opslag. Antwoorden worden goed gegeven door de
 * oefening uit de app zelf te lezen — de knop met de sleutel van het juiste
 * antwoord — zodat dit meet of de app werkt en niet of raden lukt.
 *
 * Draaien met: node scripts/nieuwe-gebruiker.mjs [--taal nl] [--beelden]
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'
import { createServer } from 'vite'

const PORT = 4397
const BASE = `http://127.0.0.1:${PORT}`
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'

const arg = (naam, terug) => {
  const i = process.argv.indexOf(`--${naam}`)
  return i > 0 ? process.argv[i + 1] : terug
}
const TAAL = arg('taal', 'nl')
/** Elke taal staat op het welkomscherm in zijn eigen naam, niet in het Nederlands. */
const EIGEN_NAAM = {
  nl: 'Nederlands', fr: 'Français', de: 'Deutsch', es: 'Español', it: 'Italiano', en: 'English',
}
const BEELDEN = process.argv.includes('--beelden')
const UIT = arg('uit', path.join('shots', 'nieuwe-gebruiker'))

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()

/** De prijzen uit de app zelf, zodat deze proef ze niet nog een keer opschrijft. */
const { planOf } = await server.ssrLoadModule('/src/engine/billing.ts')

const browser = await chromium.launch({ executablePath: CHROME })
const ctx = await browser.newContext({ viewport: { width: 430, height: 932 }, reducedMotion: 'reduce' })
const page = await ctx.newPage()

const fouten = []
page.on('pageerror', (e) => fouten.push(String(e)))
page.on('console', (m) => { if (m.type() === 'error' && !/favicon/.test(m.text())) fouten.push(m.text()) })

if (BEELDEN) await mkdir(UIT, { recursive: true })
let beeld = 0
const kiek = async (naam) => {
  if (!BEELDEN) return
  await page.screenshot({ path: path.join(UIT, `${String(++beeld).padStart(2, '0')}-${naam}.png`) })
}

const klachten = []
const stap = (tekst, goed = true, extra = '') => {
  console.log(`${goed ? ' ok ' : 'FOUT'}  ${tekst}${extra ? ' — ' + extra : ''}`)
  if (!goed) klachten.push(`${tekst}${extra ? ' — ' + extra : ''}`)
}

/** Wat de app op dit moment in localStorage heeft staan. */
const staat = () => page.evaluate(() => {
  try { return JSON.parse(localStorage.getItem('darijakids.v1') || '{}') } catch { return {} }
})

/* --------------------------------------------------- de oefening en de knop */

/**
 * De oefening waar de speler nu voor staat, uit React gelezen.
 *
 * Niet uit de DOM: op het scherm staat alleen wat een kind ziet, en daar is
 * het juiste antwoord met opzet niet uit af te leiden.
 */
const oefening = () => page.evaluate(() => {
  const uit = (el) => {
    const k = Object.keys(el).find((x) => x.startsWith('__reactFiber$'))
    let f = el[k]
    while (f) { if (f.memoizedProps?.exercise) return f.memoizedProps.exercise; f = f.return }
    return null
  }
  for (const el of document.querySelectorAll('main *')) { const e = uit(el); if (e) return e }
  return null
})

/**
 * Klikt de knop die bij een sleutel hoort.
 *
 * Elke rij keuzes wordt met een `key` gerenderd, en dat is precies het id van
 * het antwoord. Zo is de goede knop te vinden zonder naar de tekst te kijken —
 * die verschilt per taal en per soort oefening.
 */
const klikSleutel = (sleutel) => page.evaluate((s) => {
  for (const knop of document.querySelectorAll('main button, main [role="button"]')) {
    const k = Object.keys(knop).find((x) => x.startsWith('__reactFiber$'))
    let f = knop[k]
    let diep = 0
    while (f && diep++ < 6) {
      if (f.key !== null && f.key !== undefined && String(f.key) === s) { knop.click(); return true }
      f = f.return
    }
  }
  return false
}, sleutel)

/** Tekent de spookletter na, zodat een schrijfoefening goed wordt gerekend. */
const tekenNa = () => page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  if (!canvas) return 0
  const ctx = canvas.getContext('2d')
  const { width: w, height: h } = canvas
  const px = ctx.getImageData(0, 0, w, h).data
  const rect = canvas.getBoundingClientRect()
  const vuur = (type, x, y) => canvas.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', isPrimary: true,
    clientX: rect.left + (x / w) * rect.width,
    clientY: rect.top + (y / h) * rect.height,
  }))
  let halen = 0
  for (let x = 0; x < w; x += 4) {
    let rij = []
    const leeg = () => {
      if (rij.length >= 2) {
        vuur('pointerdown', x, rij[0])
        for (const y of rij) vuur('pointermove', x, y)
        vuur('pointerup', x, rij[rij.length - 1])
        halen++
      }
      rij = []
    }
    for (let y = 0; y < h; y++) {
      if (px[(y * w + x) * 4 + 3] > 20) rij.push(y)
      else leeg()
    }
    leeg()
  }
  return halen
})

/**
 * Tikt door tot de volgende vraag in beeld staat.
 *
 * Een les vraagt niet overal evenveel tikken: een uitlegkaart heeft er één,
 * een keuze soms twee — nakijken en dan verder — en bovenop de eerste vraag
 * ligt ook nog de tip van de les. In plaats van die gevallen na te bouwen
 * tikt dit op de knop tot de vraag verandert, net als een kind.
 */
async function doorTikken(vorig, max = 4) {
  for (let i = 0; i < max; i++) {
    if (!page.url().includes('/les/')) return true
    const knop = page.locator('main button').last()
    if (!(await knop.count())) return false
    await knop.click({ force: true }).catch(() => {})
    await page.waitForTimeout(260)
    const nu = await oefening()
    if (!nu || nu.id !== vorig) return true
  }
  return false
}

/** Eén oefening beantwoorden. Geeft terug wat er gedaan is, of null. */
async function beantwoord() {
  const e = await oefening()
  if (!e) return null

  if (e.kind === 'nieuw' || e.kind === 'letter-nieuw' || e.kind === 'zin-nieuw') {
    await doorTikken(e.id)
    return e.kind
  }

  if (e.kind === 'schrijf' || e.kind === 'letter-schrijf') {
    if (!(await tekenNa())) return `${e.kind}:GEEN-CANVAS`
    await page.waitForTimeout(80)
    await doorTikken(e.id)
    return e.kind
  }

  if (e.kind === 'bouw' || e.kind === 'zin-bouw') {
    // De juiste volgorde staat niet in de oefening; de app zet de tokens
    // geschud klaar. Hier telt dat de oefening te doorlopen is, niet dat een
    // robot hem foutloos maakt: alles aantikken en nakijken.
    const tokens = await page.locator('main button').all()
    for (const t of tokens.slice(0, Math.max(0, tokens.length - 1))) {
      await t.click({ force: true }).catch(() => {})
    }
    await doorTikken(e.id)
    return e.kind
  }

  if (e.kind === 'tik' || e.kind === 'dictee' || e.kind === 'spreek') {
    const veld = page.locator('main input[type="text"], main input:not([type])').first()
    if (await veld.count()) {
      const juist = await page.evaluate(async (id) => {
        const lex = await import('/src/content/lexicon.ts')
        return lex.word(id)?.tr ?? ''
      }, e.wordId)
      await veld.fill(juist)
    }
    await doorTikken(e.id)
    return e.kind
  }

  // Alles wat overblijft is kiezen, en het juiste id staat in de oefening.
  const juist = e.letterId ?? e.sentenceId ?? e.wordId
  if (juist && (await klikSleutel(juist))) {
    await page.waitForTimeout(140)
    await doorTikken(e.id)
    return e.kind
  }
  return `${e.kind}:NIET-TE-BEANTWOORDEN`
}

/** Speelt een les uit tot het scherm van de les weg is. */
async function speelLes(naam, max = 60) {
  const gedaan = []
  const gezien = []
  const lesId = page.url().split('/les/')[1]?.split(/[?#]/)[0]
  for (let i = 0; i < max; i++) {
    if (!page.url().includes('/les/')) break
    // Het uitslagscherm blijft onder /les/ staan en de knop eronder speelt de
    // les opnieuw. Zodra de les in de opslag staat, is hij af — anders speelt
    // een robot hem drie keer en klopt alles erna niet meer.
    if (lesId && Object.keys((await staat()).lessons || {}).includes(lesId)) break
    const nu = await oefening()
    if (nu) gezien.push(nu.id)
    const wat = await beantwoord()
    if (wat === null) {
      // Geen oefening meer: de uitslag, of een tussenscherm met één knop.
      const knop = page.locator('main button').last()
      if (await knop.count()) { await knop.click({ force: true }); await page.waitForTimeout(250); continue }
      break
    }
    if (String(wat).includes(':')) { gedaan.push(wat); break }
    gedaan.push(wat)
    await page.waitForTimeout(220)
  }
  const soorten = [...new Set(gedaan)]
  const stuk = gedaan.filter((g) => String(g).includes(':'))
  const uniek = new Set(gezien)
  stap(`${naam}: ${uniek.size} oefeningen`, stuk.length === 0 && gedaan.length > 0, soorten.join(', '))
  // Dezelfde vraag twee keer is een robot die niet doorklikt, of een app die
  // blijft hangen. Allebei het weten waard, want het vertekent alles erna.
  if (gezien.length !== uniek.size) {
    stap(`${naam}: elke vraag komt één keer`, false, `${gezien.length} beurten voor ${uniek.size} vragen`)
  }
  return uniek.size
}

/* ------------------------------------------------------------ de doorloop */

if (!EIGEN_NAAM[TAAL]) {
  console.error(`--taal moet een van ${Object.keys(EIGEN_NAAM).join(', ')} zijn`)
  process.exit(1)
}
console.log(`Een nieuwe gebruiker, taal ${TAAL}\n`)

// 1. Een lege telefoon.
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await kiek('welkom')
const welkomZichtbaar = await page.getByText('Ahlan', { exact: false }).count()
stap('welkomscherm verschijnt bij een lege opslag', welkomZichtbaar > 0)

// 2. Taal kiezen.
const talen = await page.locator('[role="dialog"] button[aria-pressed]').count()
stap('alle talen staan op het welkomscherm', talen === 6, `${talen} zichtbaar`)
// Het welkomscherm is een venster óver de app heen, dus alles hier moet
// binnen dat venster gezocht worden — daarbuiten klikt niets.
const venster = page.locator('[role="dialog"]')
await venster.locator(`button:has-text("${EIGEN_NAAM[TAAL]}")`).first().click()
await page.waitForTimeout(200)
await venster.getByRole('button', { name: /Yallah/i }).click()
await page.waitForTimeout(900)
await kiek('pad')
stap('na de taalkeuze staat de gebruiker op het pad', page.url().includes('/leren') || (await page.locator('main').innerText()).length > 50)

const na = await staat()
stap('de taalkeuze is bewaard', na.settings?.lang === TAAL && na.langPicked === true, `lang=${na.settings?.lang}`)

// 3. De eerste les.
await page.goto(`${BASE}/leren`, { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await kiek('leren')
const padTekst = await page.locator('main').innerText()
// Wie net begint heeft niets herhaald en gaat nergens mee verder.
const EERSTE_ZIN = {
  nl: /allereerste les/i, fr: /toute première/i, de: /allererste/i,
  es: /primera lecci/i, it: /primissima/i, en: /very first/i,
}
stap('het pad spreekt een nieuwe gebruiker goed aan', EERSTE_ZIN[TAAL].test(padTekst),
  padTekst.split('\n').slice(0, 4).join(' / ').slice(0, 90))
const ga = page.getByRole('button', { name: /Beginnen|Commencer|Anfangen|Empezar|Comincia|^Start$/i }).first()
stap('er staat één duidelijke eerste stap op het pad', await ga.count() > 0)
await ga.click()
await page.waitForTimeout(900)
await kiek('eerste-les')
stap('de eerste les opent', page.url().includes('/les/'), page.url().replace(BASE, ''))

const voor = await staat()
await speelLes('eerste les')
await page.waitForTimeout(700)
await kiek('na-les')
const naLes = await staat()

stap('de les is afgerond en bewaard', Object.keys(naLes.lessons || {}).length > Object.keys(voor.lessons || {}).length,
  `${Object.keys(naLes.lessons || {}).length} lessen`)
stap('er zijn punten bijgekomen', (naLes.xp || 0) > (voor.xp || 0), `${voor.xp || 0} → ${naLes.xp || 0} xp`)
stap('de reeks staat op 1', (naLes.streak || 0) >= 1, `reeks ${naLes.streak || 0}`)

// 4. Het slot: wat een nieuwe gebruiker níét mag.
await page.goto(`${BASE}/volledig`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await kiek('abonnement')
// Op de prijzen zoeken in plaats van op de woorden: die zijn in elke taal
// hetzelfde, de teksten eromheen niet. De bedragen komen uit `PLANS`, zodat
// deze proef niet omvalt zodra een winkel een ander prijspunt afdwingt.
const abo = await page.locator('main').innerText()
const bedrag = (p) => new RegExp(planOf(p).list.replace(/[^\d]/g, '').replace(/^(\d+)(\d\d)$/, '$1[.,]$2'))
stap('het abonnementsscherm toont beide prijzen', bedrag('jaar').test(abo) && bedrag('maand').test(abo))
stap('het e-boek staat erop met zijn prijs', /14[.,]99/.test(abo))

// 5. De ouderpoort.
await page.goto(`${BASE}/ouders`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await kiek('ouders')
const ouderTekst = await page.locator('main').innerText()
stap('het ouderscherm toont een rapport', ouderTekst.length > 200, `${ouderTekst.length} tekens`)

// 6. Wat een nieuwe gebruiker nog niet heeft.
await page.goto(`${BASE}/geschiedenis`, { waitUntil: 'networkidle' })
await page.waitForTimeout(600)
await kiek('geschiedenis')
// Het hangslot is een emoji en die is in elke taal hetzelfde.
const slotjes = ((await page.locator('main').innerText()).match(/🔒/g) || []).length
stap('de geschiedeniskaarten staan op slot tot de eerste toets', slotjes >= 14, `${slotjes} op slot`)

// 7. Het alfabet, waar alle opnames zitten.
await page.goto(`${BASE}/letters`, { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await kiek('letters')
const opnames = await page.evaluate(async () => {
  const c = await import('/src/engine/clips.ts')
  return c.clipCounts()
})
stap('elke letter heeft een opname', opnames.letters === opnames.lettersTotal,
  `${opnames.letters}/${opnames.lettersTotal} letters, ${opnames.woorden}/${opnames.woordenTotal} woorden, ${opnames.zinnen}/${opnames.zinnenTotal} zinnen`)

/* ------------------------------------------------------------------ uitslag */

console.log('')
if (fouten.length) {
  console.log(`${fouten.length} fouten in de console:`)
  for (const f of [...new Set(fouten)].slice(0, 6)) console.log('   ' + f.slice(0, 160))
}
const eind = await staat()
if (BEELDEN) {
  await writeFile(
    path.join(UIT, 'nieuwe-gebruiker.json'),
    JSON.stringify({
      xp: eind.xp, streak: eind.streak,
      lessons: Object.keys(eind.lessons || {}), cards: Object.keys(eind.cards || {}).length,
    }, null, 2) + '\n',
  ).catch(() => {})
}

await browser.close()
await server.close()

if (!klachten.length && !fouten.length) {
  console.log('alles in orde')
  process.exit(0)
}
console.log(`${klachten.length} klachten, ${fouten.length} consolefouten`)
process.exit(1)
