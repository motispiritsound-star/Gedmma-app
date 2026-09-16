/**
 * Walks the bonus rounds in a real browser.
 *
 * The writing exercise cannot be tested any other way: it is a canvas, a
 * pointer and a font, and none of those exist in a unit test. So this opens
 * every bonus round, checks the tab bar gets out of the way, and then plays
 * the tracing round properly — it reads the ghost letter back off the canvas
 * and draws over it column by column, the way a child following the shape
 * would, and expects the app to accept that as writing.
 *
 * Run with: node scripts/bonuscheck.mjs
 */
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { seeded } from './lib/profile.mjs'

const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4313
const BASE = `http://127.0.0.1:${PORT}`

const server = await createServer({
  configFile: 'vite.config.ts',
  server: { port: PORT, strictPort: true, hmr: false },
  logLevel: 'error',
})
await server.listen()

const browser = await chromium.launch({ executablePath: CHROME })
const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(m.text()))
page.on('pageerror', (e) => problems.push(String(e)))

/** A profile with letters and sentences behind it, so every bonus is open. */
const card = (id) => ({ id, ease: 2.4, interval: 1, due: Date.now() + 8.64e7, reps: 2, lapses: 0, strength: 0.5 })
await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
const state = seeded('nl')
state.extraCards = {}
for (const id of ['alif', 'ba', 'ta', 'jim', 'ha', 'kha', 'dal', 'ra', 'sin', 'shin', 'mim', 'nun']) {
  state.extraCards[`l:${id}`] = card(`l:${id}`)
}
for (const id of ['groeten-1-a', 'groeten-1-b', 'groeten-2-a', 'groeten-2-b', 'groeten-3-a', 'groeten-3-b']) {
  state.extraCards[`z:${id}`] = card(`z:${id}`)
}
await page.evaluate((s) => localStorage.setItem('darijakids.v1', JSON.stringify(s)), state)

/** Draws over the ghost letter: one short stroke per column of it. */
const traceGhost = () => page.evaluate(() => {
  const canvas = document.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  const { width: w, height: h } = canvas
  const px = ctx.getImageData(0, 0, w, h).data
  const rect = canvas.getBoundingClientRect()

  const fire = (type, x, y) => canvas.dispatchEvent(new PointerEvent(type, {
    bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', isPrimary: true,
    clientX: rect.left + (x / w) * rect.width,
    clientY: rect.top + (y / h) * rect.height,
  }))

  let strokes = 0
  for (let x = 0; x < w; x += 4) {
    // Contiguous runs only: a column crossing a bowl has ink at the top and
    // at the bottom with nothing between, and joining those would be a line
    // straight through the middle of the letter.
    let run = []
    const flush = () => {
      if (run.length >= 2) {
        fire('pointerdown', x, run[0])
        for (const y of run) fire('pointermove', x, y)
        fire('pointerup', x, run[run.length - 1])
        strokes++
      }
      run = []
    }
    for (let y = 0; y < h; y++) {
      if (px[(y * w + x) * 4 + 3] > 20) run.push(y)
      else flush()
    }
    flush()
  }
  return strokes
})

const fails = []

/** Plays a tracing round to the end, one trace and one tap per question. */
const traceRound = async (max = 40) => {
  for (let i = 0; i < max; i++) {
    if (page.url().endsWith('/bonus')) return true
    const onward = page.getByRole('button', { name: /^(Verder|Afronden)$/i })
    if (await onward.count()) {
      await onward.first().click({ force: true })
      // One tap is one tap: the bar slides out, and a second tap on a button
      // that is leaving must not skip the next question.
      await page.locator('[role="status"]').first().waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
      await page.waitForTimeout(100)
      continue
    }
    if (await page.locator('canvas').count()) {
      if (!(await traceGhost())) { fails.push('geen spookletter op het canvas'); return false }
      await page.waitForTimeout(100)
      await page.getByRole('button', { name: /^Controleer$/i }).click({ force: true })
      await page.waitForTimeout(200)
      continue
    }
    fails.push(`onverwacht scherm: ${(await page.locator('main').innerText()).replace(/\n+/g, ' / ').slice(0, 120)}`)
    return false
  }
  return page.url().endsWith('/bonus')
}

for (const [path, label] of [['/leren', 'pad'], ['/spelen', 'spelen']]) {
  await page.goto(`${BASE}${path}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const seen = await page.getByText('De bonus van vandaag').count()
  if (!seen) fails.push(`bonuskaart ontbreekt op ${path}`)
  console.log(`${label}: bonuskaart ${seen ? 'zichtbaar' : 'ONTBREEKT'}`)
}

for (const id of ['dictee', 'marathon', 'zinnen', 'spreken']) {
  await page.goto(`${BASE}/bonus/${id}`, { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  const running = page.url().endsWith(id)
  const tabs = await page.getByRole('navigation', { name: 'Hoofdmenu' }).count()
  if (!running) fails.push(`${id} start niet`)
  if (tabs) fails.push(`${id} laat de tabbalk staan`)
  console.log(`${id}: ${running ? 'draait' : 'DOORGESTUURD'} · tabbalk ${tabs ? 'NOG ZICHTBAAR' : 'weg'}`)
}

await page.goto(`${BASE}/bonus/schrijven`, { waitUntil: 'networkidle' })
await page.waitForTimeout(900)
const finished = await traceRound()
if (!finished) fails.push('de schrijfronde liep niet af')
console.log(`schrijven: ${finished ? 'afgerond' : 'NIET AFGEROND'}`)

await page.waitForTimeout(400)
const screen = (await page.locator('main').innerText()).replace(/\n+/g, ' / ')
const score = screen.match(/Bonus klaar — (\d+)% goed/)
if (!score) fails.push('geen uitslag na de ronde')
else if (Number(score[1]) < 100) fails.push(`een net getrokken letter haalde maar ${score[1]}%`)
console.log(`uitslag: ${score ? score[0] : 'ONTBREEKT'}`)

const store = await page.evaluate(() => JSON.parse(localStorage.getItem('darijakids.v1')))
if (store.bonus.total !== 1) fails.push('de bonusteller liep niet op')
if (store.bonus.getekend !== 6) fails.push(`getekend telde ${store.bonus.getekend} in plaats van 6`)
if (store.quests.bonus !== 1) fails.push('de bonusmissie telde niet mee')
console.log(`tellers: ${JSON.stringify(store.bonus)} · missie ${store.quests.bonus}`)

await browser.close()
await server.close()

if (problems.length) fails.push(...problems)
if (fails.length) {
  console.error(`\nniet in orde:\n- ${fails.join('\n- ')}`)
  process.exit(1)
}
console.log('\nalles in orde')
