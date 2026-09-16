/**
 * Records the intro film: thirty seconds of the real app, with sound.
 *
 * Nothing here is a mock-up and nothing is a soundalike. The screens are
 * photographed from the running app, and the music is rendered by the app's
 * own instruments — the same marimba, darbuka and hijaz melodies a child hears
 * after finishing a lesson. `dev/intro.ts` draws and tapes it; this script
 * starts the server, takes the photographs, and saves what comes back.
 *
 * Run with:
 *   node scripts/make-intro.mjs
 *   node scripts/make-intro.mjs --lang nl --shape verhaal
 *   node scripts/make-intro.mjs --still 4.2,8.7,13    (frames, to check a layout)
 */
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { createServer } from 'vite'
import { GO_ON, GOT_IT, seeded } from './lib/profile.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome'
const PORT = 4312
const BASE = `http://127.0.0.1:${PORT}`
const OUT = path.join(ROOT, 'store', 'video')

const arg = (name, fallback) => {
  const i = process.argv.indexOf(`--${name}`)
  return i > 0 ? process.argv[i + 1] : fallback
}

/**
 * What the film shows, and what happens on each screen.
 *
 * Not five photographs: five little scenes. Each one is the real app being
 * used — a mission claimed, a letter tapped, an answer chosen, a letter traced
 * with a finger — captured as a handful of frames plus where the finger went
 * and which of the app's own sounds it made. `dev/intro.ts` replays that.
 */

const wait = (page, ms) => page.waitForTimeout(ms)

/**
 * One frame.
 *
 * Every frame of a scene has to be taken from the same scroll position, or the
 * finger — whose route was measured once — lands somewhere else on the next
 * picture. Clicking a button scrolls it into view, so the position is put back
 * before the shutter.
 */
const shot = async (page, scroll = null) => {
  if (scroll !== null) {
    await page.evaluate((y) => window.scrollTo(0, y), scroll)
    await page.waitForTimeout(120)
  }
  return `data:image/png;base64,${(await page.screenshot()).toString('base64')}`
}

const scrollNow = (page) => page.evaluate(() => window.scrollY)

/** Where an element sits on the screen, as a fraction — the film is scaled. */
const spot = async (page, locator) => {
  const box = await locator.boundingBox()
  const view = page.viewportSize()
  return { x: (box.x + box.width / 2) / view.width, y: (box.y + box.height / 2) / view.height }
}

const SCENES = [
  {
    id: 'leren',
    /** A daily mission is finished; claiming it throws gems across the card. */
    take: async (page) => {
      await page.goto(`${BASE}/leren`, { waitUntil: 'networkidle' })
      await wait(page, 800)
      const claim = page.locator('main button').filter({ hasText: /^💎/ }).first()
      if (!(await claim.count())) return { frames: [await shot(page)], acts: [] }
      const target = await spot(page, claim)
      const scroll = await scrollNow(page)
      const frames = [await shot(page)]
      await claim.click({ force: true })
      await wait(page, 320)
      frames.push(await shot(page, scroll))
      return {
        frames,
        acts: [{ at: 1.2, dur: 0.16, path: [target], frame: 1, sound: 'tap', endSound: 'badge' }],
      }
    },
  },
  {
    id: 'letters',
    /** Tapping a letter says it out loud and opens its three shapes. */
    take: async (page) => {
      await page.goto(`${BASE}/letters`, { waitUntil: 'networkidle' })
      await wait(page, 800)
      // The letter grid, not the top bar: these are the square ones.
      const tile = page.locator('main button.aspect-square').nth(5)
      const target = await spot(page, tile)
      const scroll = await scrollNow(page)
      const frames = [await shot(page)]
      await tile.click({ force: true })
      await wait(page, 500)
      frames.push(await shot(page, scroll))
      return {
        frames,
        acts: [{ at: 1.2, dur: 0.16, path: [target], frame: 1, sound: 'tap' }],
      }
    },
  },
  {
    id: 'les',
    // Only here: the camera guesses its way to a right answer, and five wrong
    // guesses in a row would end the lesson before it had filmed one. Every
    // other scene keeps the hearts in the top bar, where they belong.
    save: { hearts: false },
    /**
     * A question, answered correctly.
     *
     * Which option is right is not visible from out here, so it tries one,
     * looks at the colour of the feedback bar, and moves on to the next
     * question if it guessed wrong. A film of somebody getting it wrong is a
     * different film.
     *
     * Guessing is why the profile it films with has hearts switched off: five
     * wrong guesses in a row would end the lesson before it had filmed a right
     * answer.
     */
    take: async (page) => {
      await page.goto(`${BASE}/les/hruf-1`, { waitUntil: 'networkidle' })
      await wait(page, 700)
      // A lesson opens on a tip sheet over the first question.
      const tip = page.getByRole('button', { name: GO_ON })
      if (await tip.count()) await tip.first().click({ force: true })
      await wait(page, 500)

      /** Gets past whatever is on screen: a tap on the bar, then the next card. */
      const onward = async () => {
        const next = page.getByRole('button', { name: /^(Verder|Afronden)$/i })
        if (!(await next.count())) return false
        await next.first().click({ force: true })
        await page.locator('[data-verdict]').first().waitFor({ state: 'detached', timeout: 3000 }).catch(() => {})
        await wait(page, 200)
        return true
      }

      for (let attempt = 0; attempt < 14; attempt++) {
        const options = page.locator('main button[data-answer]:not([disabled])')
        const count = await options.count()

        if (!count) {
          // Typing, matching, speaking: real exercises, but not ones a camera
          // can be sure of. Answer them any way at all and move on — this is a
          // review round, so a wrong answer costs nothing.
          const input = page.locator('input#answer')
          const check = page.getByRole('button', { name: /^Controleer$/i })
          const snap = page.locator('button', { hasText: GOT_IT })
          if (await input.count()) {
            await input.fill('...')
            await check.first().click({ force: true })
            await wait(page, 350)
          } else if (await check.count()) {
            // A word bank: take tiles until the check button wakes up.
            const tiles = page.locator('main button:not([disabled])')
              .filter({ hasNotText: /Controleer|Stoppen|Langzamer/ })
            for (let k = 0; k < 10 && (await check.first().isDisabled()); k++) {
              if (!(await tiles.count())) break
              await tiles.first().click({ force: true })
              await wait(page, 80)
            }
            await check.first().click({ force: true })
            await wait(page, 350)
          } else if (await snap.count()) {
            await snap.first().click({ force: true })
            await wait(page, 300)
          } else if (!(await onward())) break
          await onward()
          continue
        }

        const pick = options.nth(attempt % count)
        const target = await spot(page, pick)
        const scroll = await scrollNow(page)
        const frames = [await shot(page)]
        await pick.click({ force: true })
        await wait(page, 450)

        // The reward that floats off the card is also a status; the bar
        // that says how it went is the one carrying a verdict.
        const bar = page.locator('[data-verdict]').first()
        const good = (await bar.count()) && (await bar.getAttribute('data-verdict')) === 'goed'
        if (good) {
          frames.push(await shot(page, scroll))
          return {
            frames,
            acts: [{ at: 1.3, dur: 0.16, path: [target], frame: 1, sound: 'tap', endSound: 'correct' }],
          }
        }
        if (!(await onward())) break
      }
      return { frames: [await shot(page)], acts: [] }
    },
  },
  {
    id: 'schrijven',
    /**
     * The writing bonus, drawn.
     *
     * The ghost letter is read back off the canvas and traced in three goes,
     * with a frame after each, so the film can show the letter appearing under
     * a finger instead of cutting to a finished one.
     */
    take: async (page) => {
      await page.goto(`${BASE}/bonus/schrijven`, { waitUntil: 'networkidle' })
      await wait(page, 1000)
      const canvas = page.locator('canvas').first()
      if (!(await canvas.count())) return { frames: [await shot(page)], acts: [] }

      // Right to left, the way the letter is actually written.
      const strokes = await page.evaluate(() => {
        const el = document.querySelector('canvas')
        const { width: w, height: h } = el
        const px = el.getContext('2d').getImageData(0, 0, w, h).data
        const out = []
        for (let x = w - 1; x >= 0; x -= 4) {
          let run = []
          const flush = () => { if (run.length >= 2) out.push(run.map((y) => ({ x, y }))); run = [] }
          for (let y = 0; y < h; y++) {
            if (px[(y * w + x) * 4 + 3] > 20) run.push(y)
            else flush()
          }
          flush()
        }
        return { strokes: out, w, h }
      })
      if (!strokes.strokes.length) return { frames: [await shot(page)], acts: [] }

      const box = await canvas.boundingBox()
      const view = page.viewportSize()
      const scroll = await scrollNow(page)
      /** A canvas pixel, in fractions of the whole screen. */
      const onScreen = (p) => ({
        x: (box.x + (p.x / strokes.w) * box.width) / view.width,
        y: (box.y + (p.y / strokes.h) * box.height) / view.height,
      })

      const frames = [await shot(page)]
      const chunk = Math.ceil(strokes.strokes.length / 3)
      for (let part = 0; part < 3; part++) {
        await page.evaluate(([list, from, to]) => {
          const el = document.querySelector('canvas')
          const rect = el.getBoundingClientRect()
          const fire = (type, p) => el.dispatchEvent(new PointerEvent(type, {
            bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', isPrimary: true,
            clientX: rect.left + (p.x / el.width) * rect.width,
            clientY: rect.top + (p.y / el.height) * rect.height,
          }))
          for (const stroke of list.slice(from, to)) {
            fire('pointerdown', stroke[0])
            for (const p of stroke) fire('pointermove', p)
            fire('pointerup', stroke[stroke.length - 1])
          }
        }, [strokes.strokes, part * chunk, (part + 1) * chunk])
        await wait(page, 120)
        frames.push(await shot(page, scroll))
      }

      await page.getByRole('button', { name: /^Controleer$/i }).click({ force: true })
      await wait(page, 450)
      frames.push(await shot(page, scroll))

      // The finger follows the start of every stroke: one line across the
      // letter, in the order it was drawn.
      const path = strokes.strokes
        .filter((_, i) => i % 2 === 0)
        .map((stroke) => onScreen(stroke[Math.floor(stroke.length / 2)]))

      return {
        frames,
        acts: [{
          at: 0.9,
          dur: 1.9,
          path,
          steps: [[0.2, 1], [0.5, 2], [0.82, 3]],
          frame: 4,
          sound: 'tap',
          endSound: 'correct',
        }],
      }
    },
  },
  {
    id: 'profiel',
    /** Picking another animal: the smallest possible thing a child changes. */
    take: async (page) => {
      await page.goto(`${BASE}/profiel`, { waitUntil: 'networkidle' })
      await wait(page, 800)
      // The row of animals under the profile card.
      const avatar = page.locator('main button.h-11').nth(2)
      const target = await spot(page, avatar)
      const scroll = await scrollNow(page)
      const frames = [await shot(page)]
      await avatar.click({ force: true })
      await wait(page, 420)
      frames.push(await shot(page, scroll))
      return {
        frames,
        acts: [{ at: 1.2, dur: 0.16, path: [target], frame: 1, sound: 'tap' }],
      }
    },
  },
]

/** The app, filmed at the size the film draws it. */
const photograph = async (browser, lang) => {
  const taken = {}
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate((state) => localStorage.setItem('darijakids.v1', JSON.stringify(state)), seeded(lang))

  for (const scene of SCENES) {
    // Every scene starts from the same save, so claiming a mission in the
    // first one does not empty the card in the last.
    await page.evaluate(
      (state) => localStorage.setItem('darijakids.v1', JSON.stringify(state)),
      seeded(lang, scene.save ?? {}),
    )
    taken[scene.id] = await scene.take(page)
  }
  await context.close()
  return taken
}

const server = await createServer({
  configFile: path.join(ROOT, 'vite.config.ts'),
  server: {
    port: PORT,
    strictPort: true,
    // Nothing may reload this page: a take is half a minute of real time and
    // a reload halfway through loses it. The films land in the project, and
    // somebody editing a file while it records would do the same.
    hmr: false,
    watch: { ignored: ['**/store/**', '**/dist/**', '**/dist-demo/**'] },
  },
  logLevel: 'error',
})
await server.listen()

const browser = await chromium.launch({
  executablePath: CHROME,
  args: [
    // The film starts its own AudioContext and there is nobody to tap the
    // screen, so the browser has to be told that is expected.
    '--autoplay-policy=no-user-gesture-required',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],
})

const langs = arg('lang', 'nl,fr,de,es,en').split(',')
const shapes = arg('shape', 'appstore,verhaal,vierkant,breed').split(',')
const still = arg('still', null)

const page = await (await browser.newContext({ viewport: { width: 700, height: 760 } })).newPage()
const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(`${m.text()} @ ${m.location().url}`))
page.on('pageerror', (e) => problems.push(String(e)))
page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()} ${r.url()}`))
page.on('requestfailed', (r) => problems.push(`mislukt ${r.url()}`))

for (const lang of langs) {
  console.log(`\n${lang} — de app fotograferen`)
  const taken = await photograph(browser, lang)
  await mkdir(path.join(OUT, lang), { recursive: true })
  await page.goto(`${BASE}/dev/intro.html`, { waitUntil: 'networkidle' })
  await page.evaluate(([l, shots]) => { (window.darijaShots ??= {})[l] = shots }, [lang, taken])

  for (const shape of shapes) {
    if (still !== null) {
      // A comma-separated list, so one run of the camera checks a whole film.
      for (const moment of still.split(',')) {
        const url = await page.evaluate(
          ([l, s, t]) => window.darijaIntro.still(l, s, Number(t)),
          [lang, shape, moment],
        )
        const file = path.join(OUT, lang, `beeld-${shape}-${moment}s.png`)
        await writeFile(file, Buffer.from(url.split(',')[1], 'base64'))
        console.log(`  ${path.relative(ROOT, file)}`)
      }
      continue
    }
    const started = Date.now()
    const url = await page.evaluate(
      ([l, s]) => window.darijaIntro.record(l, s),
      [lang, shape],
    )
    const kind = url.slice(5, url.indexOf(';'))
    const ext = kind.includes('mp4') ? 'mp4' : 'webm'
    const data = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')
    const file = path.join(OUT, lang, `intro-${shape}.${ext}`)
    await writeFile(file, data)
    console.log(
      `  ${path.relative(ROOT, file)} — ${(data.length / 1e6).toFixed(1)} MB, ` +
        `${((Date.now() - started) / 1000).toFixed(0)}s`,
    )
  }
}

await browser.close()
await server.close()

if (still === null) {
  await writeFile(
    path.join(OUT, 'README.md'),
    `# Video\n\nGemaakt met \`npm run intro\`.\n\n` +
      `- \`intro-appstore\` — 886×1920, de app preview van de App Store\n` +
      `- \`intro-verhaal\` — 1080×1920, voor stories, reels en TikTok\n` +
      `- \`intro-vierkant\` — 1080×1080, voor Instagram en Facebook\n` +
      `- \`intro-breed\` — 1920×1080, voor YouTube en de website\n\n` +
      `Ruim 27 seconden, met geluid. De schermen zijn de echte app en de muziek ` +
      `komt uit \`src/engine/instruments.ts\` — dezelfde marimba, darbuka en ` +
      `hijaz-melodieën als in de app zelf.\n\n` +
      `Per taal een map. De App Store wil een app preview van 15 tot 30 seconden ` +
      `in 886×1920 (vandaar \`intro-appstore\`); Google Play wil een YouTube-link, ` +
      `dus daar gaat \`intro-breed\` heen. Controleer een opname met ` +
      `\`node scripts/checkvideo.mjs <bestand>\`.\n`,
  )
}

if (problems.length) {
  console.error(`\nfouten in de pagina:\n${problems.join('\n')}`)
  process.exit(1)
}
console.log('\nklaar')
