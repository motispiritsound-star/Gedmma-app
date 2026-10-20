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
import { execFile } from 'node:child_process'
import { mkdir, rm, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import ffmpeg from 'ffmpeg-static'
import { startChroom } from './lib/chroom.mjs'
import { createServer } from 'vite'
import { CHECK, GO_ON, GOT_IT, NEEM_OP, ONWARD, seeded, START, STOP_OPNAME } from './lib/profile.mjs'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const PORT = 4312
const BASE = `http://127.0.0.1:${PORT}`
const OUT = path.join(ROOT, 'store', 'video')
const run = promisify(execFile)

/**
 * Wat de browser opneemt hercoderen naar H.264 met AAC.
 *
 * De recorder van Chromium levert VP9 met Opus, ook als hij er "video/mp4"
 * boven zet. Dat speelt hier prima af en struikelt overal daarbuiten:
 * Instagram en TikTok weigeren zo'n bestand, en de App Store wil voor een
 * app preview H.264. Eén keer hercoderen is goedkoper dan zes keer uitzoeken
 * waarom een upload het niet doet. `faststart` zet de index vooraan, zodat
 * een site hem kan afspelen voordat hij binnen is.
 */
/**
 * Hoe hard de film hoort te klinken.
 *
 * -14 LUFS is waar Instagram, Facebook, TikTok en YouTube naartoe rekenen: wie
 * harder aanlevert wordt zachter gezet, wie zachter aanlevert blijft zachter.
 * De film kwam uit de browser op -18,8 LUFS -- niet stil, maar bijna vijf dB
 * onder de norm, en op een telefoonspeaker in een rumoerige kamer is dat het
 * verschil tussen zacht en "er komt geen geluid uit". Precies dat is gemeld.
 *
 * Harder zetten kan niet met gewone versterking: de mix is in intro.ts al op
 * 0,89 afgetopt, dus er zit nog geen dB ruimte boven. `loudnorm` doet het wél
 * goed -- het rekent de waargenomen luidheid om en begrenst de ware piek.
 */
const LUIDHEID = { I: '-14', TP: '-1.5', LRA: '11' }

/**
 * Twee keer meten, één keer snijden.
 *
 * `loudnorm` in één doorgang moet raden hoe hard het nog gaat worden en
 * schommelt daardoor mee met de muziek. Met de gemeten waarden van een eerste
 * doorgang erbij weet hij het precies, en dan is de uitkomst bovendien elke
 * keer dezelfde. Dat laatste telt hier: twee talen naast elkaar in een kanaal
 * horen niet verschillend hard te staan.
 */
async function meetLuidheid(ruw) {
  const meting = `loudnorm=I=${LUIDHEID.I}:TP=${LUIDHEID.TP}:LRA=${LUIDHEID.LRA}:print_format=json`
  const { stderr } = await run(ffmpeg, ['-hide_banner', '-y', '-i', ruw, '-af', meting, '-f', 'null', '-'])
  // De json staat aan het eind van wat ffmpeg naar stderr schrijft.
  const json = stderr.slice(stderr.lastIndexOf('{'), stderr.lastIndexOf('}') + 1)
  try {
    return JSON.parse(json)
  } catch {
    return null // dan maar in één doorgang; zachter is beter dan niets
  }
}

async function hercodeer(ruw, naar) {
  const m = await meetLuidheid(ruw)
  const af = m
    ? `loudnorm=I=${LUIDHEID.I}:TP=${LUIDHEID.TP}:LRA=${LUIDHEID.LRA}`
      + `:measured_I=${m.input_i}:measured_TP=${m.input_tp}`
      + `:measured_LRA=${m.input_lra}:measured_thresh=${m.input_thresh}`
      + `:offset=${m.target_offset}:linear=true`
    : `loudnorm=I=${LUIDHEID.I}:TP=${LUIDHEID.TP}:LRA=${LUIDHEID.LRA}`

  await run(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', ruw,
    '-c:v', 'libx264', '-profile:v', 'high', '-level', '4.2', '-pix_fmt', 'yuv420p',
    '-crf', '20', '-preset', 'medium', '-r', '30',
    '-af', af,
    // 48 kHz er expliciet achter: `loudnorm` werkt intern op 192 kHz en laat
    // dat staan als je het niet terugzet. Een AAC-spoor van 192 kHz is geen
    // fout, maar niet elke speler wil hem.
    '-c:a', 'aac', '-b:a', '160k', '-ar', '48000',
    '-movflags', '+faststart', naar])
  await rm(ruw, { force: true })
}

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
    id: 'pad',
    /**
     * The path itself, scrolling.
     *
     * The film used to open on a reward; it opens on the route now, because
     * the route is what the app is. Seventeen units from the alphabet to
     * haggling at the souq, and a parent who sees where it ends understands
     * in one shot what "an app for Darija" actually means.
     */
    take: async (page) => {
      await page.goto(`${BASE}/leren`, { waitUntil: 'networkidle' })
      await wait(page, 900)
      // Start where the units are, not at the greeting above them: this scene
      // is about the route, and a screenshot of a welcome card is not it.
      const frames = []
      for (const y of [1150, 2330, 2780]) {
        await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y)
        await wait(page, 260)
        frames.push(await shot(page, y))
      }
      await page.evaluate(() => window.scrollTo(0, 0))
      return { frames, acts: [] }
    },
  },
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
        const next = page.getByRole('button', { name: ONWARD })
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
          const check = page.getByRole('button', { name: CHECK })
          const snap = page.locator('button', { hasText: GOT_IT })
          if (await input.count()) {
            await input.fill('...')
            await check.first().click({ force: true })
            await wait(page, 350)
          } else if (await check.count()) {
            // A word bank: take tiles until the check button wakes up.
            const tiles = page.locator('main button:not([disabled])')
              .filter({ hasNotText: CHECK })
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
    id: 'geschiedenis',
    /**
     * The fragment a checkpoint hands over.
     *
     * Filmed through the dev-only /kaart route rather than by sitting a whole
     * checkpoint first: the film wants the fragment, not the twenty questions
     * in front of it. What it photographs is the real thing either way — the
     * moving backdrop, the drawing that made itself, and the tap that turns
     * the story into its "did you know".
     */
    take: async (page) => {
      await page.goto(`${BASE}/kaart/fatima`, { waitUntil: 'networkidle' })
      // Long enough for the drawing to finish and the telling to begin.
      await wait(page, 2900)
      const card = page.locator('[data-card]')
      if (!(await card.count())) return { frames: [await shot(page)], acts: [] }

      const onward = page.locator('[data-card] button').first()
      const target = await spot(page, onward)
      const frames = [await shot(page)]
      await onward.click({ force: true })
      await wait(page, 700)
      frames.push(await shot(page))
      return {
        frames,
        acts: [{ at: 1.5, dur: 0.16, path: [target], frame: 1, sound: 'tap', endSound: 'badge' }],
      }
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

      await page.getByRole('button', { name: CHECK }).click({ force: true })
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
    id: 'woord',
    /**
     * Eén woord, en je hoort het.
     *
     * De andere zes schermen laten zien wat de app doet; dit laat horen waar
     * hij voor is. Het woord is الدارجة — de taal zelf — en de vinger drukt op
     * het luidsprekertje, zodat beeld en geluid hetzelfde zeggen. De opname
     * gaat in de geluidsband, op het moment van de tik: zie `WOORD_AT` in
     * dev/intro.ts.
     */
    take: async (page) => {
      await page.goto(`${BASE}/woorden`, { waitUntil: 'networkidle' })
      await wait(page, 800)
      // Zoeken in plaats van scrollen: dan staat er één kaartje op het scherm
      // en is er geen twijfel over welk woord je hoort.
      // In het zoekvak komt te staan wat iemand zelf zou intikken. Dat vindt
      // ook de zin "kanhder shwiya darija", dus we kiezen daarna de regel van
      // het woord zelf — die is als enige الدارجة met lidwoord.
      const zoek = page.locator('input[type="search"]').first()
      await zoek.fill('Darija')
      await wait(page, 600)
      const rij = page.locator('main ul.space-y-2 > li').filter({ hasText: 'الدارجة' }).first()
      if (!(await rij.count())) throw new Error('geen zoekresultaat voor الدارجة')
      // De lijst toont regels; het luidsprekertje zit in het kaartje dat
      // opengaat als je erop tikt. Dat openen gebeurt vóór de eerste opname,
      // zodat de film één gebaar laat zien en niet twee.
      await rij.locator('button').first().click({ force: true })
      await wait(page, 500)
      if (!(await rij.innerText()).includes('الدارجة')) {
        throw new Error('het open kaartje is niet dat van الدارجة')
      }
      const knop = rij.locator('button.h-11.w-11').first()
      if (!(await knop.count())) throw new Error('geen luidsprekerknop op de woordenpagina')
      const target = await spot(page, knop)
      const scroll = await scrollNow(page)
      const frames = [await shot(page)]
      await knop.click({ force: true })
      await wait(page, 300)
      frames.push(await shot(page, scroll))
      return {
        frames,
        acts: [{ at: 1.2, dur: 0.16, path: [target], frame: 1, sound: 'tap' }],
      }
    },
  },
  {
    id: 'spreken',
    /**
     * De spreekbonus: horen, jezelf opnemen, jezelf terughoren.
     *
     * Drie toestanden, en ze zijn alle drie het filmen waard omdat een
     * schermafdruk er niets van laat zien: de groene knop die rood wordt en
     * gaat kloppen, en de twee knoppen die daarna verschijnen.
     *
     * Er wordt niets herkend en niets goedgekeurd -- dat kan ook niet, geen
     * enkele spraakmotor kent Darija. Zie de uitleg boven `NaZeggen` in
     * exercises.tsx. De film laat dus zien wat er echt gebeurt, en niet een
     * computer die "goed" zegt.
     */
    take: async (page) => {
      await page.goto(`${BASE}/bonus/spreken`, { waitUntil: 'networkidle' })
      await wait(page, 1000)

      const mic = page.getByRole('button', { name: NEEM_OP }).first()
      if (!(await mic.count())) throw new Error('geen opnameknop op /bonus/spreken')
      const target = await spot(page, mic)
      const scroll = await scrollNow(page)

      // Stil: de knop, groen.
      const frames = [await shot(page, scroll)]

      // Opnemen: de knop wordt rood en klopt, en eronder staat "ik neem op".
      await mic.click({ force: true })
      await wait(page, 700)
      frames.push(await shot(page, scroll))
      await wait(page, 600)
      frames.push(await shot(page, scroll))

      // Stoppen: de twee knoppen eronder verschijnen.
      const stop = page.getByRole('button', { name: STOP_OPNAME }).first()
      if (!(await stop.count())) throw new Error('geen stopknop tijdens de opname')
      await stop.click({ force: true })
      await wait(page, 900)
      frames.push(await shot(page, scroll))

      return {
        frames,
        /*
         * Eén vinger die twee keer dezelfde knop raakt: starten en stoppen.
         * `steps` schakelt het beeld door, zodat de knop onder de vinger van
         * kleur wisselt in plaats van ervoor of erna.
         */
        acts: [{
          at: 0.9,
          dur: 2.2,
          path: [target, target],
          steps: [[0.08, 1], [0.45, 2], [0.86, 3]],
          frame: 3,
          sound: 'tap',
          endSound: 'correct',
        }],
      }
    },
  },
  {
    id: 'memory',
    /**
     * Het geheugenspel: twaalf kaartjes met de khatim op de rug.
     *
     * Twee kaartjes omdraaien is het hele spel, en het is precies wat een
     * schermafdruk niet laat zien. Of het paar klopt doet er voor de film
     * niet toe -- wat je ziet is dat er een woord onder een kaartje zit.
     *
     * De startknop is de tweede van twee: de kaart van het tijdspel staat
     * erboven. Zonder `force`, want met `force` klikte hij eerder dwars door
     * de onderbalk heen en kwam de film in het woordenboek terecht.
     *
     * Twee dingen zijn hier eerder misgegaan, allebei stil -- de film kwam er
     * gewoon uit, alleen met twaalf dichte kaartjes en een bijschrift dat zegt
     * dat je woorden leert.
     *
     * Het eerste is een wedloop. Klopt het paar niet, dan klapt `Memory` het
     * na 800 ms weer dicht. De scene wachtte 650 ms en `shot()` legt daar zijn
     * eigen 120 ms bovenop, dus de sluiter viel precies op dat moment. De
     * kleuren waren nog onderweg terug -- Tailwinds `transition` doet er
     * 150 ms over -- en dat is waarom het kaartje wit met een groene rand op
     * de foto staat terwijl het woord er al af is.
     *
     * Het telt nu de open kaartjes *voor* de foto en niet erna. Dat is geen
     * smaak: op driedubbele resolutie is een schermafdruk 1170 bij 2532, en
     * het coderen daarvan duurt lang genoeg om zelf over de 800 ms heen te
     * gaan. Een telling achteraf klaagde dus over een foto die prima was.
     * Vastleggen gebeurt bij de aanroep, coderen daarna -- dus wie ervoor
     * telt, weet wat er op de plaat staat. Vanaf de klik: 260 ms wachten,
     * tellen, en dan de 120 ms van `shot()`; rond de 400 ms, met de helft van
     * het raam over.
     *
     * Het tweede is de keuze van de kaartjes. `hasNotText` houdt alleen de
     * dichte kaartjes over, en zodra het eerste openklapt valt het uit de
     * lijst -- waarna `nth(5)` het zesde kaartje is. De vinger, die zijn route
     * ervoor opmeet, wees dus naar een kaartje dat nooit openging. Het bord
     * heeft altijd twaalf knoppen, open of dicht, dus daar tellen we nu op.
     */
    take: async (page) => {
      await page.goto(`${BASE}/spelen`, { waitUntil: 'networkidle' })
      await wait(page, 900)

      const starten = page.getByRole('button', { name: START, exact: true })
      if (await starten.count() < 2) throw new Error('geen twee startknoppen op /spelen')
      await starten.nth(1).click()
      await wait(page, 1100)

      const scroll = await scrollNow(page)
      const tegels = page.locator('main .grid button')
      const hoeveel = await tegels.count()
      if (hoeveel !== 12) throw new Error(`het bord heeft ${hoeveel} kaartjes in plaats van twaalf`)

      const eerste = await spot(page, tegels.nth(0))
      const tweede = await spot(page, tegels.nth(5))

      const frames = [await shot(page, scroll)]
      await tegels.nth(0).click()
      await wait(page, 420)
      frames.push(await shot(page, scroll))
      await tegels.nth(5).click()
      await wait(page, 260)
      const open = await tegels.filter({ hasText: /./ }).count()
      if (open < 2) throw new Error(`na twee klikken staan er ${open} kaartjes open; het woord komt niet op de foto`)
      frames.push(await shot(page, scroll))

      return {
        frames,
        acts: [{
          at: 0.8,
          dur: 2.1,
          path: [eerste, tweede],
          steps: [[0.3, 1], [0.78, 2]],
          frame: 2,
          sound: 'tap',
          endSound: 'correct',
        }],
      }
    },
  },
  {
    id: 'herhalen',
    /**
     * Het herhaalscherm: wat de app onthoudt terwijl jij dat niet hoeft.
     *
     * Dit is het enige scherm dat niet aan het kind maar aan de ouder
     * uitlegt waar het geld heen gaat. Drie tellers -- nu te herhalen,
     * woorden gezien, vastgezet -- en daaronder een lijst met de woorden
     * die nog het minst vastzitten, elk met het woord, de klank en de
     * vertaling erbij.
     *
     * Geen vinger: het scherm is langer dan de telefoon en er valt niets
     * te drukken dat beter vertelt dan wat er al staat. Twee standen dus,
     * net als bij `pad` -- de tellers en de lijst. De opgeslagen stand
     * heeft acht achterstallige kaarten, waardoor er echt iets te
     * herhalen is in plaats van een leeg scherm met een aanmoediging.
     */
    take: async (page) => {
      await page.goto(`${BASE}/herhalen`, { waitUntil: 'networkidle' })
      await wait(page, 1100)
      const frames = []
      for (const y of [0, 600]) {
        await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y)
        await wait(page, 300)
        frames.push(await shot(page, y))
      }
      await page.evaluate(() => window.scrollTo(0, 0))
      return { frames, acts: [{ at: 0.6, dur: 3.4, path: [], steps: [[0.5, 1]], frame: 1 }] }
    },
  },
  {
    id: 'verhaal',
    /**
     * Een verhaal, en het is met opzet dat ene: Yasmin bij haar jeddti.
     *
     * Twee mensen die elkaar begroeten in het Darija, met de vertaling
     * eronder. Dat is waar deze hele app over gaat, en het is het enige scherm
     * waarop je dat gesprek werkelijk ziet staan.
     *
     * Geen vinger hier. Er valt niets te tikken; wat je laat zien is dat het
     * doorloopt, en dat doe je door te zakken in plaats van te wijzen.
     */
    take: async (page) => {
      await page.goto(`${BASE}/verhalen`, { waitUntil: 'networkidle' })
      await wait(page, 700)

      const jedda = page.locator('a[href^="/verhalen/"]').first()
      if (!(await jedda.count())) throw new Error('geen verhalen gevonden')
      await jedda.click()
      await wait(page, 1200)

      const frames = [await shot(page)]
      for (const hoogte of [150, 300]) {
        await page.evaluate((y) => window.scrollTo({ top: y }), hoogte)
        await wait(page, 320)
        frames.push(await shot(page, hoogte))
      }

      return { frames, acts: [{ at: 1.0, dur: 2.4, path: [], steps: [[0.34, 1], [0.7, 2]], frame: 2 }] }
    },
  },
]

/** The app, filmed at the size the film draws it. */
const photograph = async (browser, lang, wil) => {
  const taken = {}
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    // De spreekoefening opent de microfoon. Zonder dit staat er een
    // toestemmingsvraag in beeld in plaats van een opname.
    permissions: ['microphone'],
  })
  const page = await context.newPage()
  await page.goto(`${BASE}/`, { waitUntil: 'networkidle' })
  await page.evaluate((state) => localStorage.setItem('darijakids.v1', JSON.stringify(state)), seeded(lang))

  for (const scene of SCENES.filter((s) => wil.includes(s.id))) {
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

const browser = await startChroom({
  args: [
    // The film starts its own AudioContext and there is nobody to tap the
    // screen, so the browser has to be told that is expected.
    '--autoplay-policy=no-user-gesture-required',
    // En een microfoon die er niet is. De spreekoefening vraagt er echt een
    // op -- `kanOpnemen()` kijkt naar `getUserMedia` en `MediaRecorder` -- en
    // zonder deze twee vlaggen staat er in de film het scherm "geen
    // microfoon" in plaats van de oefening.
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--disable-background-timer-throttling',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
  ],
})

const langs = arg('lang', 'nl,fr,de,es,it,en').split(',')
const still = arg('still', null)

/**
 * Welke film, en welke schermen die nodig heeft.
 *
 * De lijst staat hier én in FILMS in dev/intro.ts, en dat is één plek te
 * veel -- maar dit script moet weten wat het fotograferen moet vóórdat de
 * filmpagina geladen is, en die pagina kent de app niet. Blijft het uit de
 * pas lopen, dan valt dat meteen op: `load` gooit "geen beelden voor ...".
 */
const FILMS = {
  intro: {
    shots: ['pad', 'leren', 'letters', 'les', 'geschiedenis', 'schrijven', 'woord'],
    shapes: 'appstore,verhaal,vierkant,breed',
  },
  bonus: {
    shots: ['schrijven', 'spreken'],
    // Verhaal en vierkant: dat is wat een WhatsApp-kanaal en een
    // Facebookgroep tonen. Breed wordt daar aan twee kanten afgesneden.
    shapes: 'verhaal,vierkant',
  },
  spelen: {
    shots: ['memory', 'verhaal'],
    shapes: 'verhaal,vierkant',
  },
  weetje: {
    shots: ['geschiedenis', 'memory'],
    shapes: 'verhaal,vierkant',
  },
  alfabet: {
    shots: ['letters', 'woord'],
    shapes: 'verhaal,vierkant',
  },
  route: {
    shots: ['pad', 'les'],
    shapes: 'verhaal,vierkant',
  },
  onthouden: {
    shots: ['herhalen', 'leren'],
    shapes: 'verhaal,vierkant',
  },
}

const film = arg('film', 'intro')
if (!FILMS[film]) {
  console.error(`\nOnbekende film: ${film}. Er zijn er twee: intro, bonus.\n`)
  process.exit(1)
}
const shapes = arg('shape', FILMS[film].shapes).split(',')

const page = await (await browser.newContext({ viewport: { width: 700, height: 760 } })).newPage()
const problems = []
page.on('console', (m) => m.type() === 'error' && problems.push(`${m.text()} @ ${m.location().url}`))
page.on('pageerror', (e) => problems.push(String(e)))
page.on('response', (r) => r.status() >= 400 && problems.push(`HTTP ${r.status()} ${r.url()}`))
page.on('requestfailed', (r) => problems.push(`mislukt ${r.url()}`))

for (const lang of langs) {
  console.log(`\n${lang} — de app fotograferen`)
  const taken = await photograph(browser, lang, FILMS[film].shots)
  await mkdir(path.join(OUT, lang), { recursive: true })
  await page.goto(`${BASE}/dev/intro.html`, { waitUntil: 'networkidle' })
  await page.evaluate(([l, shots]) => { (window.darijaShots ??= {})[l] = shots }, [lang, taken])

  for (const shape of shapes) {
    if (still !== null) {
      // A comma-separated list, so one run of the camera checks a whole film.
      for (const moment of still.split(',')) {
        const url = await page.evaluate(
          ([l, s, t, f]) => window.darijaIntro.still(l, s, Number(t), f),
          [lang, shape, moment, film],
        )
        const file = path.join(OUT, lang, `beeld-${film}-${shape}-${moment}s.png`)
        await writeFile(file, Buffer.from(url.split(',')[1], 'base64'))
        console.log(`  ${path.relative(ROOT, file)}`)
      }
      continue
    }
    const started = Date.now()
    const url = await page.evaluate(
      ([l, s, f]) => window.darijaIntro.record(l, s, f),
      [lang, shape, film],
    )
    const kind = url.slice(5, url.indexOf(';'))
    const ext = kind.includes('mp4') ? 'mp4' : 'webm'
    const data = Buffer.from(url.slice(url.indexOf(',') + 1), 'base64')
    const ruw = path.join(OUT, lang, `${film}-${shape}.ruw.${ext}`)
    const file = path.join(OUT, lang, `${film}-${shape}.mp4`)
    await writeFile(ruw, data)
    await hercodeer(ruw, file)
    const { size } = await stat(file)
    console.log(
      `  ${path.relative(ROOT, file)} — ${(size / 1e6).toFixed(1)} MB, ` +
        `${((Date.now() - started) / 1000).toFixed(0)}s`,
    )
  }
}

await browser.close()
await server.close()

if (still === null && film === 'intro') {
  await writeFile(
    path.join(OUT, 'README.md'),
    `# Video\n\nGemaakt met \`npm run intro\`.\n\n` +
      `- \`intro-appstore\` — 886×1920, de app preview van de App Store\n` +
      `- \`intro-verhaal\` — 1080×1920, voor stories, reels en TikTok\n` +
      `- \`intro-vierkant\` — 1080×1080, voor Instagram en Facebook\n` +
      `- \`intro-breed\` — 1920×1080, voor YouTube en de website\n\n` +
      `En de korte film, met \`npm run bonusfilm\`: vijftien seconden over de twee\n` +
      `oefeningen die een schermafdruk niet kan laten zien — schrijven met je\n` +
      `vinger en jezelf opnemen. Die staat als \`bonus-verhaal\` en \`bonus-vierkant\`\n` +
      `in dezelfde mappen, en is bedoeld voor het WhatsApp-kanaal en voor\n` +
      `Facebookgroepen.\n\n` +
      `Alle vier in H.264 met AAC-geluid: dat is wat Instagram, TikTok en de \n` +
      `App Store aannemen. De opname van de browser zelf is VP9 en wordt \n` +
      `hercodeerd voordat hij hier terechtkomt.\n\n` +
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
