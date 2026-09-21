/**
 * The composer for the intro film: thirty seconds of the real app, with the
 * app's own music under it.
 *
 * It lives outside `src` on purpose — it is a film set, not a screen, and
 * nothing here ends up in the bundle a child downloads. `npm run intro` starts
 * a dev server, photographs the app, hands the pictures to this page and
 * records what it draws. Two things are borrowed from the app itself and not
 * imitated: the instruments in `src/engine/instruments.ts`, so the film sounds
 * exactly like the thing it is advertising, and the screenshots, so nothing on
 * screen is a mock-up.
 */
import { busFor, VOICES, type SoundName, type Stage } from '../src/engine/instruments'
import { CLIPS } from '../src/engine/clips'

/* ------------------------------------------------------------------ the copy */

type ShotId = 'pad' | 'leren' | 'letters' | 'les' | 'geschiedenis' | 'schrijven' | 'profiel'

interface Copy {
  /** Under the title, in the opening card. */
  sub: string
  /** One line per screen, in the order of SHOTS. */
  lines: [string, string, string, string, string, string, string]
  /** The last card. */
  cta: string
  price: string
  /** One line of plain numbers, so the film ends on something checkable. */
  feiten: string
}

/**
 * The Dutch arc is one of the slogans, cut in half and hung over the whole
 * film: it opens on the children and lands, five screens later, on the parent.
 * The other four languages carry the same joke.
 */
const COPY: Record<string, Copy> = {
  nl: {
    sub: 'Voor jong — en stiekem ook voor oud',
    lines: [
      'Eén pad: van de eerste\nletter tot de souq.',
      'Laat je kinderen hun\nmoedertaal leren.',
      'Het Arabische alfabet,\nletter voor letter.',
      'Horen, kiezen, herhalen —\ntot het blijft hangen.',
      'En na elke toets\neen stukje Marokko.',
      'En schrijven, met je vinger.\nLetter voor letter.',
      'En pik zelf stiekem\nwat mee.',
    ],
    cta: 'Gratis beginnen',
    feiten: '17 units · 304 woorden · 100 zinnen',
    price: 'Vanaf € 4,99 per maand',
  },
  fr: {
    sub: 'Pour les jeunes — et pour les grands aussi',
    lines: [
      'Un parcours : de la lettre\njusqu’au souk.',
      'Laisse tes enfants apprendre\nleur langue maternelle.',
      'L’alphabet arabe,\nlettre par lettre.',
      'Écouter, choisir, répéter —\njusqu’à ce que ça reste.',
      'Et après chaque test,\nun morceau du Maroc.',
      'Et écrire, au doigt.\nLettre par lettre.',
      'Et rafraîchis la tienne\nsans rien dire.',
    ],
    cta: 'Commencer gratuitement',
    feiten: '17 unités · 304 mots · 100 phrases',
    price: 'À partir de 4,99 € par mois',
  },
  de: {
    sub: 'Für die Jungen — und heimlich für dich',
    lines: [
      'Ein Weg: vom ersten\nBuchstaben bis zum Souk.',
      'Lass deine Kinder ihre\nMuttersprache lernen.',
      'Das arabische Alphabet,\nBuchstabe für Buchstabe.',
      'Hören, wählen, wiederholen —\nbis es sitzt.',
      'Und nach jedem Test\nein Stück Marokko.',
      'Und schreiben, mit dem Finger.\nBuchstabe für Buchstabe.',
      'Und frisch deins ganz\nnebenbei auf.',
    ],
    cta: 'Kostenlos starten',
    feiten: '17 Einheiten · 304 Wörter · 100 Sätze',
    price: 'Ab 4,99 € pro Monat',
  },
  es: {
    sub: 'Para los jóvenes — y también para ti',
    lines: [
      'Un camino: de la primera\nletra hasta el zoco.',
      'Deja que tus hijos aprendan\nsu lengua materna.',
      'El alfabeto árabe,\nletra a letra.',
      'Escuchar, elegir, repetir —\nhasta que se queda.',
      'Y tras cada test,\nun trozo de Marruecos.',
      'Y escribir, con el dedo.\nLetra a letra.',
      'Y refresca la tuya\nde paso.',
    ],
    cta: 'Empezar gratis',
    feiten: '17 unidades · 304 palabras · 100 frases',
    price: 'Desde 4,99 € al mes',
  },
  it: {
    sub: 'Per i giovani — e anche per te',
    lines: [
      'Un percorso: dalla prima\nlettera fino al souk.',
      'Fai imparare ai tuoi figli\nla lingua di casa.',
      'L\u2019alfabeto arabo,\nlettera per lettera.',
      'Sentire, scegliere, ripetere —\nfinché resta.',
      'E dopo ogni test\nun pezzo di Marocco.',
      'E scrivere, con il dito.\nLettera per lettera.',
      'E tu, ripassala\nsenza dirlo a nessuno.',
    ],
    cta: 'Inizia gratis',
    price: 'Da 4,99 € al mese',
    feiten: '17 unità · 304 parole · 100 frasi',
  },
  en: {
    sub: 'For the young — and quietly for you',
    lines: [
      'One path: from the first\nletter to the souq.',
      'Let your children learn\ntheir mother tongue.',
      'The Arabic alphabet,\nletter by letter.',
      'Listen, choose, repeat —\nuntil it sticks.',
      'And after every test,\na piece of Morocco.',
      'And writing, with a finger.\nLetter by letter.',
      'And quietly pick some up\nyourself.',
    ],
    cta: 'Start free',
    feiten: '17 units · 304 words · 100 sentences',
    price: 'From € 4.99 a month',
  },
}

const SHOTS: ShotId[] = ['pad', 'leren', 'letters', 'les', 'geschiedenis', 'schrijven', 'profiel']

/* ------------------------------------------------------------- the timetable */

/**
 * Under half a minute, on purpose: the App Store rejects an app preview
 * longer than thirty seconds, and a recording always runs a little over what
 * it was asked for. Six screens rather than five now, so each one holds a
 * little less: three to open, 3.7 per screen, 3.3 to ask. Just over 28.
 */
const TITLE = 2.8
const HOLD = 3.2
const END = TITLE + SHOTS.length * HOLD
export const DURATION = END + 3.3

interface Beat { kind: 'title' | 'shot' | 'cta'; at: number; until: number; shot?: number }

const BEATS: Beat[] = [
  { kind: 'title', at: 0, until: TITLE },
  ...SHOTS.map((_, i) => ({ kind: 'shot' as const, at: TITLE + i * HOLD, until: TITLE + (i + 1) * HOLD, shot: i })),
  { kind: 'cta', at: END, until: DURATION },
]

/* ----------------------------------------------------------------- the shapes */

type ShapeId = 'verhaal' | 'vierkant' | 'breed' | 'appstore'

interface Shape {
  w: number
  h: number
  /** Where the words go, and how big. */
  text: { cx: number; cy: number; width: number; size: number }
  /** The phone: its centre and how tall it stands. */
  phone: { cx: number; cy: number; height: number }
  /** Where the opening and closing cards sit — dead centre, in every shape. */
  hero: { cx: number; cy: number }
}

const SHAPES: Record<ShapeId, Shape> = {
  // Stories, reels, TikTok: the phone fills the middle, words on top.
  verhaal: {
    w: 1080, h: 1920,
    text: { cx: 540, cy: 272, width: 900, size: 74 },
    phone: { cx: 540, cy: 1150, height: 1250 },
    hero: { cx: 540, cy: 960 },
  },
  // A feed post: words left, phone right.
  vierkant: {
    w: 1080, h: 1080,
    text: { cx: 340, cy: 540, width: 540, size: 60 },
    phone: { cx: 812, cy: 560, height: 920 },
    hero: { cx: 540, cy: 540 },
  },
  // What the App Store wants for an iPhone app preview: not 1080 wide.
  appstore: {
    w: 886, h: 1920,
    text: { cx: 443, cy: 268, width: 760, size: 64 },
    phone: { cx: 443, cy: 1160, height: 1240 },
    hero: { cx: 443, cy: 960 },
  },
  // YouTube and the website header.
  breed: {
    w: 1920, h: 1080,
    text: { cx: 660, cy: 540, width: 960, size: 72 },
    phone: { cx: 1440, cy: 545, height: 940 },
    hero: { cx: 960, cy: 540 },
  },
}

/** The app is laid out at 390×844, so every phone in the film has that shape. */
const PHONE_RATIO = 390 / 844

const ease = (p: number): number => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2)
const clamp01 = (n: number): number => Math.min(1, Math.max(0, n))

/* ------------------------------------------------------------- the gestures */

/**
 * What happens on one screen while it is on show.
 *
 * A scene is not a photograph but a handful of frames of the real app plus the
 * gesture that got it from one to the next: where the finger went, which of
 * the app's own sounds it made, and which frame it lands on. Captured by
 * scripts/make-intro.mjs by actually doing it.
 */
export interface Act {
  /** Seconds after the card appears. */
  at: number
  /** How long the gesture lasts. A tap is a moment; a traced letter is not. */
  dur: number
  /** The finger's route across the screen, in fractions of it. */
  path: { x: number; y: number }[]
  /** The frame it ends on. */
  frame: number
  /** Frames to flip to partway through, as [how far along, which frame]. */
  steps?: [number, number][]
  /** The app's own sound when the finger lands, and when the gesture is done. */
  sound?: SoundName
  endSound?: SoundName
}

export interface Scene {
  frames: HTMLImageElement[]
  acts: Act[]
}

/**
 * Which frame of a scene is on screen `u` seconds in.
 *
 * A screen only changes once the gesture that changes it is done — an answer
 * that lights up before the finger has landed reads as a cut, not a tap. The
 * steps are for gestures long enough to show their own progress, like a letter
 * appearing under a finger: each is [how far along, which frame].
 */
function frameAt(scene: Scene, u: number): HTMLImageElement {
  let index = 0
  for (const act of scene.acts) {
    if (u < act.at) break
    const through = clamp01((u - act.at) / Math.max(act.dur, 0.001))
    for (const [mark, which] of act.steps ?? []) if (through >= mark) index = which
    if (through >= 1) index = act.frame
  }
  return scene.frames[Math.min(index, scene.frames.length - 1)] ?? scene.frames[0]!
}

/** Where the finger is, and how solid, `u` seconds into a scene. */
function fingerAt(scene: Scene, u: number): { x: number; y: number; alpha: number; act: Act } | null {
  const REACH = 0.5
  const LINGER = 0.3
  for (const act of scene.acts) {
    if (!act.path.length) continue
    if (u < act.at - REACH || u > act.at + act.dur + LINGER) continue
    const first = act.path[0]!
    const last = act.path[act.path.length - 1]!

    if (u < act.at) {
      // On its way in, from below and a little to the side.
      const p = ease(clamp01((u - (act.at - REACH)) / REACH))
      return { x: first.x + (1 - p) * 0.16, y: first.y + (1 - p) * 0.34, alpha: p, act }
    }
    if (u > act.at + act.dur) {
      return { x: last.x, y: last.y, alpha: 1 - clamp01((u - act.at - act.dur) / LINGER), act }
    }
    const through = clamp01((u - act.at) / Math.max(act.dur, 0.001))
    const step = through * (act.path.length - 1)
    const a = act.path[Math.floor(step)]!
    const b = act.path[Math.min(Math.ceil(step), act.path.length - 1)]!
    const mix = step - Math.floor(step)
    return { x: a.x + (b.x - a.x) * mix, y: a.y + (b.y - a.y) * mix, alpha: 1, act }
  }
  return null
}

/* --------------------------------------------------------------- the drawings */

const INK = '#2b1d16'
const CREAM = '#fffaf3'

/** The eight-pointed khatam of Moroccan zellige, the same mark as the icon. */
const star = (cx: number, cy: number, r: number, fill: string): string => {
  const points = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i - Math.PI / 8
    const rad = i % 2 === 0 ? r : r * 0.42
    return `${(cx + Math.cos(a) * rad).toFixed(2)},${(cy + Math.sin(a) * rad).toFixed(2)}`
  })
  return `<polygon points="${points.join(' ')}" fill="${fill}" />`
}

const MARK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#ffd166"/><stop offset="55%" stop-color="#f59e0b"/><stop offset="100%" stop-color="#e2603c"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="113" fill="#131b30"/>
  ${star(256, 256, 184, 'url(#gold)')}
  ${star(256, 256, 87, '#0d9488')}
  <circle cx="256" cy="256" r="28" fill="#fffaf3"/>
</svg>`

const FNEK_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="480" height="480">
  <defs><linearGradient id="fur" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0%" stop-color="#f7c873"/><stop offset="100%" stop-color="#e2984a"/>
  </linearGradient></defs>
  <path d="M30 44C22 22 26 8 34 10c8 2 14 16 16 28z" fill="url(#fur)"/>
  <path d="M34 40c-5-14-3-22 0-21 4 1 8 11 9 20z" fill="#ffd8b1"/>
  <path d="M90 44c8-22 4-36-4-34-8 2-14 16-16 28z" fill="url(#fur)"/>
  <path d="M86 40c5-14 3-22 0-21-4 1-8 11-9 20z" fill="#ffd8b1"/>
  <ellipse cx="60" cy="62" rx="34" ry="31" fill="url(#fur)"/>
  <ellipse cx="60" cy="70" rx="23" ry="19" fill="#fff3e2"/>
  <path d="M39 54c3-5 9-5 12 0" stroke="#2b1d16" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M69 54c3-5 9-5 12 0" stroke="#2b1d16" stroke-width="3" fill="none" stroke-linecap="round"/>
  <ellipse cx="60" cy="63" rx="5" ry="3.8" fill="#2b1d16"/>
  <path d="M50 69c4 7 16 7 20 0" stroke="#2b1d16" stroke-width="3.2" fill="none" stroke-linecap="round"/>
</svg>`

const image = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error(`kan niet laden: ${src.slice(0, 40)}`))
    img.src = src
  })

const svgImage = (svg: string) => image(`data:image/svg+xml;utf8,${encodeURIComponent(svg)}`)

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

/** Warm for the screens, night for the opening and the ask. */
function background(ctx: CanvasRenderingContext2D, w: number, h: number, night: boolean): void {
  const g = ctx.createLinearGradient(0, 0, w * 0.6, h)
  if (night) {
    g.addColorStop(0, '#1b2340')
    g.addColorStop(0.6, '#131b30')
    g.addColorStop(1, '#0b1020')
  } else {
    g.addColorStop(0, '#ffd79a')
    g.addColorStop(0.55, '#f0915c')
    g.addColorStop(1, '#e2603c')
  }
  ctx.fillStyle = g
  ctx.fillRect(0, 0, w, h)
}

/** Zellige-ish stars, drifting slowly, kept faint so they never fight a word. */
function tiles(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, alpha: number): void {
  const step = Math.round(w / 6)
  const drift = (t * 9) % step
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = CREAM
  for (let y = -step + drift; y < h + step; y += step) {
    for (let x = -step - drift; x < w + step; x += step) {
      ctx.beginPath()
      for (let i = 0; i < 16; i++) {
        const a = (Math.PI / 8) * i - Math.PI / 8
        const r = (i % 2 === 0 ? 1 : 0.42) * step * 0.26
        const px = x + Math.cos(a) * r
        const py = y + Math.sin(a) * r
        if (i === 0) ctx.moveTo(px, py)
        else ctx.lineTo(px, py)
      }
      ctx.closePath()
      ctx.fill()
    }
  }
  ctx.restore()
}

/** Text, centred on a point, one line per newline. */
function lines(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  size: number,
  colour: string,
  weight = 800,
): void {
  const rows = text.split('\n')
  const lead = size * 1.16
  ctx.save()
  ctx.font = `${weight} ${size}px "Baloo 2", system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = colour
  const top = cy - ((rows.length - 1) * lead) / 2
  rows.forEach((row, i) => ctx.fillText(row, cx, top + i * lead))
  ctx.restore()
}

/** A phone: the screenshot, a cream bezel around it, and a shadow under it. */
interface Screen { x: number; y: number; w: number; h: number }

function phone(
  ctx: CanvasRenderingContext2D,
  shot: HTMLImageElement,
  cx: number,
  cy: number,
  height: number,
): Screen {
  const w = height * PHONE_RATIO
  const bezel = Math.round(w * 0.028)
  const r = w * 0.085
  const x = cx - w / 2
  const y = cy - height / 2

  ctx.save()
  ctx.shadowColor = 'rgba(43,29,22,.42)'
  ctx.shadowBlur = w * 0.16
  ctx.shadowOffsetY = w * 0.05
  ctx.fillStyle = CREAM
  roundRect(ctx, x, y, w, height, r)
  ctx.fill()
  ctx.restore()

  ctx.save()
  roundRect(ctx, x + bezel, y + bezel, w - bezel * 2, height - bezel * 2, r - bezel)
  ctx.clip()
  ctx.drawImage(shot, x + bezel, y + bezel, w - bezel * 2, height - bezel * 2)
  ctx.restore()

  return { x: x + bezel, y: y + bezel, w: w - bezel * 2, h: height - bezel * 2 }
}

/**
 * A fingertip, and the rings it leaves behind.
 *
 * The whole point of the film is that somebody is *using* this, and a
 * screenshot cannot show that. So there is a finger, it goes where a finger
 * would go, and where it lands the app answers with its own sound.
 */
function finger(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, alpha: number): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = 'rgba(13,148,136,.22)'
  ctx.beginPath()
  ctx.arc(x, y, r * 1.9, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = 'rgba(255,250,243,.92)'
  ctx.strokeStyle = 'rgba(43,29,22,.35)'
  ctx.lineWidth = Math.max(2, r * 0.12)
  ctx.beginPath()
  ctx.arc(x, y, r, 0, Math.PI * 2)
  ctx.fill()
  ctx.stroke()
  ctx.restore()
}

/** One ring going out from where the finger touched down. */
function ripple(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, p: number): void {
  if (p <= 0 || p >= 1) return
  ctx.save()
  ctx.globalAlpha = (1 - p) * 0.7
  ctx.strokeStyle = '#0d9488'
  ctx.lineWidth = Math.max(2, r * 0.18) * (1 - p)
  ctx.beginPath()
  ctx.arc(x, y, r * (0.5 + p * 3), 0, Math.PI * 2)
  ctx.stroke()
  ctx.restore()
}

/** Paper, thrown once. Deterministic, so every take of the film is the same. */
function confetti(ctx: CanvasRenderingContext2D, w: number, h: number, t: number): void {
  if (t <= 0) return
  const colours = ['#f59e0b', '#0d9488', '#e2603c', '#ffd166', '#5eead4']
  ctx.save()
  for (let i = 0; i < 70; i++) {
    const seed = (i * 9301 + 49297) % 233280 / 233280
    const other = (i * 4801 + 9973) % 233280 / 233280
    const x = seed * w
    const fall = t * (0.45 + other * 0.5)
    const y = -0.1 * h + fall * h * 1.3
    if (y > h + 40) continue
    const size = w * (0.012 + other * 0.012)
    ctx.save()
    ctx.globalAlpha = clamp01(1.8 - fall * 1.6)
    ctx.translate(x + Math.sin(t * 3 + i) * w * 0.03, y)
    ctx.rotate(t * (2 + other * 4) + i)
    ctx.fillStyle = colours[i % colours.length]!
    ctx.fillRect(-size / 2, -size / 4, size, size / 2)
    ctx.restore()
  }
  ctx.restore()
}

/** A pill, for the price and the call to act. */
function pill(
  ctx: CanvasRenderingContext2D,
  text: string,
  cx: number,
  cy: number,
  size: number,
  fill: string,
  colour: string,
): void {
  ctx.save()
  ctx.font = `800 ${size}px "Baloo 2", system-ui, sans-serif`
  const w = ctx.measureText(text).width + size * 1.8
  const h = size * 2.1
  ctx.fillStyle = fill
  roundRect(ctx, cx - w / 2, cy - h / 2, w, h, h / 2)
  ctx.fill()
  ctx.fillStyle = colour
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, cx, cy + size * 0.06)
  ctx.restore()
}

/* ------------------------------------------------------------------ the music */

/**
 * Where a cue sits in the film. `arg` is the same little number the app passes
 * — which melody, how long a run — so these are the app's own sounds and not
 * a soundalike.
 */
/** A film tune is nineteen notes at 0.3s, and then a note left ringing. */
const TUNE = 5.7

const CUES: [SoundName, number, number][] = [
  // the opening: a run-up under the title
  ['quizStart', 0, 0.2],
  // four of the five film tunes, all in hijaz on D, each handing over to the
  // next while its own last note is still ringing
  ...[1, 2, 0, 3].map((melody, i): [SoundName, number, number] => ['film', melody, TITLE - 0.3 + i * TUNE]),
  // the ask, over the tail of the last tune rather than after it
  ['cheer', 0, END],
  ['levelUp', 0, END + 0.9],
  // a turn of the page between the cards — the gestures bring their own
  ...BEATS.slice(1).map((b): [SoundName, number, number] => ['nav', 0, b.at]),
]

/** A stage that plays into the mix `at` seconds from the start. */
function stageAt(ac: BaseAudioContext, bus: AudioNode, at: number): Stage {
  const delay = ac.createDelay(60)
  delay.delayTime.value = at
  delay.connect(bus)
  return { ac, out: delay }
}

/**
 * Every sound a gesture makes, at the moment it makes it.
 *
 * The tap, the right answer, the gems landing: these are not sound effects
 * added to a film, they are what the app does when you press that button, and
 * they are here for the same reason the screens are real.
 */
function gestureCues(cast: Cast): [SoundName, number, number][] {
  const out: [SoundName, number, number][] = []
  cast.scenes.forEach((scene, i) => {
    const start = TITLE + i * HOLD
    for (const act of scene.acts) {
      if (act.sound) out.push([act.sound, 0, start + act.at])
      if (act.endSound) out.push([act.endSound, act.endSound === 'correct' ? 2 : 0, start + act.at + act.dur])
    }
  })
  return out
}

/**
 * Eén woord dat je echt hoort: الدارجة.
 *
 * De film laat schermen zien waarop woorden worden uitgesproken — een letter
 * met een luidsprekertje, een luisteroefening — maar er kwam nooit een stem
 * uit. Dat is vreemd voor een app die over uitspraak gaat: je ziet de belofte
 * en hoort hem niet.
 *
 * Dus klinkt er nu precies één woord, en dat is het woord waar alles om
 * draait. Het is de opname uit de app zelf, dezelfde die een kind hoort — geen
 * spraakengine, want die spreekt geen Darija.
 *
 * Onder het titelkaartje, waar alleen nog een aanloopje speelt: daar is ruimte
 * voor, en daar betekent het iets.
 */
const WOORD = 'darija'
const WOORD_AT = 1.05

async function hetWoord(off: OfflineAudioContext, bus: AudioNode): Promise<void> {
  const url = CLIPS[WOORD]
  if (!url) throw new Error(`geen opname voor "${WOORD}"`)
  const buffer = await off.decodeAudioData(await (await fetch(url)).arrayBuffer())

  // De opnames zijn met de hand ingesproken en verschillen dus in luidheid.
  // Op de piek zetten in plaats van op een vast getal: anders valt dit ene
  // woord weg onder de muziek of springt het er juist uit.
  let piek = 0
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const data = buffer.getChannelData(c)
    for (let i = 0; i < data.length; i++) piek = Math.max(piek, Math.abs(data[i]!))
  }

  const bron = off.createBufferSource()
  bron.buffer = buffer
  const gain = off.createGain()
  gain.gain.value = piek > 0 ? 0.8 / piek : 1
  bron.connect(gain).connect(bus)
  bron.start(WOORD_AT)
}

/** Renders the whole soundtrack up front, so nothing can glitch while taping. */
async function soundtrack(cast: Cast): Promise<AudioBuffer> {
  const rate = 48000
  const off = new OfflineAudioContext(2, Math.ceil((DURATION + 1) * rate), rate)
  const { bus } = busFor(off)
  for (const [name, arg, at] of [...CUES, ...gestureCues(cast)]) VOICES[name](stageAt(off, bus, at), arg)
  await hetWoord(off, bus)
  const rendered = await off.startRendering()

  // Four tunes, applause and a taps track can sum past the limiter's ceiling,
  // and a video encoder has no headroom to give back. Pull the whole mix down
  // once, here, rather than quieting the app's own sounds one by one.
  let peak = 0
  for (let c = 0; c < rendered.numberOfChannels; c++) {
    const data = rendered.getChannelData(c)
    for (let i = 0; i < data.length; i++) peak = Math.max(peak, Math.abs(data[i]!))
  }
  if (peak > 0.89) {
    const scale = 0.89 / peak
    for (let c = 0; c < rendered.numberOfChannels; c++) {
      const data = rendered.getChannelData(c)
      for (let i = 0; i < data.length; i++) data[i]! *= scale
    }
  }
  return rendered
}

/* ------------------------------------------------------------------ the film */

interface Cast {
  mark: HTMLImageElement
  fnek: HTMLImageElement
  scenes: Scene[]
  copy: Copy
}

/** How long one card takes to hand over to the next. */
const CUT = 0.45

/** One card — the opening, a screen, or the ask — drawn at a given strength. */
function card(
  ctx: CanvasRenderingContext2D,
  shape: Shape,
  cast: Cast,
  beat: Beat,
  t: number,
  alpha: number,
  rise: number,
): void {
  if (alpha <= 0.004) return
  const { w, h } = shape
  const ink = beat.kind === 'shot' ? INK : CREAM

  ctx.save()
  ctx.globalAlpha = alpha

  if (beat.kind === 'title' || beat.kind === 'cta') {
    // Both bookends are one stack, centred in whatever shape it is drawn in,
    // laid out from the top of the stack down so no shape has to be tuned.
    const unit = Math.min(w, h)
    const size = shape.text.size
    const mark = unit * (beat.kind === 'title' ? 0.24 : 0.19)
    const rows: { gap: number; height: number; draw: (y: number) => void }[] =
      beat.kind === 'title'
        ? [
            { gap: 0, height: mark, draw: (y) => ctx.drawImage(cast.mark, shape.hero.cx - mark / 2, y, mark, mark) },
            { gap: size * 0.5, height: size * 1.34, draw: (y) => lines(ctx, 'Darijaforkids', shape.hero.cx, y + size * 0.67, size * 1.34, ink) },
            { gap: size * 0.3, height: size * 0.62, draw: (y) => lines(ctx, cast.copy.sub, shape.hero.cx, y + size * 0.31, size * 0.55, ink, 600) },
          ]
        : [
            { gap: 0, height: mark, draw: (y) => ctx.drawImage(cast.mark, shape.hero.cx - mark / 2, y, mark, mark) },
            { gap: size * 0.34, height: size * 0.9, draw: (y) => lines(ctx, 'Darijaforkids', shape.hero.cx, y + size * 0.45, size * 0.9, ink) },
            { gap: size * 0.45, height: size * 1.3, draw: (y) => pill(ctx, cast.copy.cta, shape.hero.cx, y + size * 0.65, size * 0.62, '#f59e0b', INK) },
            { gap: size * 0.3, height: size * 0.5, draw: (y) => lines(ctx, cast.copy.price, shape.hero.cx, y + size * 0.25, size * 0.44, ink, 600) },
            { gap: size * 0.22, height: size * 0.44, draw: (y) => lines(ctx, cast.copy.feiten, shape.hero.cx, y + size * 0.22, size * 0.36, ink, 600) },
            { gap: size * 0.4, height: unit * 0.14, draw: (y) => ctx.drawImage(cast.fnek, shape.hero.cx - unit * 0.07, y, unit * 0.14, unit * 0.14) },
          ]
    const total = rows.reduce((sum, r) => sum + r.gap + r.height, 0)
    let y = shape.hero.cy - total / 2 + rise
    for (const row of rows) {
      y += row.gap
      row.draw(y)
      y += row.height
    }
  } else {
    const i = beat.shot ?? 0
    const scene = cast.scenes[i]
    lines(ctx, cast.copy.lines[i] ?? '', shape.text.cx, shape.text.cy + rise, shape.text.size, ink)
    if (!scene) { ctx.restore(); return }

    // How far into this screen we are — which is what decides everything the
    // finger does, so the gesture stays put while the card fades in and out.
    const u = t - beat.at
    // The phone slides up as it appears, and breathes a little while it stands.
    const drift = Math.sin(u * 0.7) * h * 0.004
    const screen = phone(ctx, frameAt(scene, u), shape.phone.cx, shape.phone.cy + rise * 1.6 + drift, shape.phone.height)

    const hand = fingerAt(scene, u)
    if (hand) {
      const x = screen.x + hand.x * screen.w
      const y = screen.y + hand.y * screen.h
      const r = screen.w * 0.05
      // A tap leaves one ring; a traced letter leaves one where it started.
      ripple(ctx, screen.x + hand.act.path[0]!.x * screen.w, screen.y + hand.act.path[0]!.y * screen.h,
        r, (u - hand.act.at) / 0.55)
      finger(ctx, x, y, r, hand.alpha)
    }
  }

  ctx.restore()
}

/**
 * One frame, at `t` seconds.
 *
 * Every cut is a dissolve: for the first CUT seconds of a card the one before
 * it is still on screen, fading and drifting up, while the new one fades in
 * and settles. Cutting straight from one to the other left a dark blink at
 * every turn, because both were briefly at nothing.
 */
function frame(ctx: CanvasRenderingContext2D, shape: Shape, cast: Cast, t: number): void {
  const index = Math.max(0, BEATS.findIndex((b) => t < b.until))
  const beat = BEATS[index] ?? BEATS[BEATS.length - 1]!
  const before = BEATS[index - 1]
  const { w, h } = shape
  const over = ease(clamp01((t - beat.at) / CUT))
  const lift = h * 0.03

  background(ctx, w, h, (before ?? beat).kind !== 'shot')
  if (before) {
    ctx.save()
    ctx.globalAlpha = over
    background(ctx, w, h, beat.kind !== 'shot')
    ctx.restore()
  }
  tiles(ctx, w, h, t, beat.kind === 'shot' ? 0.1 : 0.07)

  // A card only fades while the next one is arriving — never on its own, or
  // the picture dips to nothing between the two. The last half-second of the
  // film is the one exception: there is nothing left to hand over to.
  const tail = ease(clamp01((DURATION - t) / 0.5))
  if (before) card(ctx, shape, cast, before, t, (1 - over) * tail, -over * lift * 0.5)
  card(ctx, shape, cast, beat, t, over * tail, (1 - over) * lift)

  // One throw of paper over the last card, while the applause is playing.
  if (beat.kind === 'cta') confetti(ctx, w, h, (t - beat.at) / 2.6)
}

/* ------------------------------------------------------------------ the tape */

declare global {
  interface Window {
    /** The scenes, handed over by scripts/make-intro.mjs. */
    darijaShots?: Record<string, Record<string, { frames: string[]; acts: Act[] }>>
    darijaIntro: {
      duration: number
      shapes: string[]
      still: (lang: string, shape: ShapeId, t: number) => Promise<string>
      record: (lang: string, shape: ShapeId) => Promise<string>
    }
  }
}

let cast: Cast | null = null
let castLang = ''

async function load(lang: string): Promise<Cast> {
  if (cast && castLang === lang) return cast
  await document.fonts.load('800 80px "Baloo 2"')
  await document.fonts.load('600 80px "Baloo 2"')
  // The screens arrive as data URLs rather than files: writing PNGs into the
  // project while the page is open makes the dev server reload it, and a
  // reload halfway through a take loses the take.
  const taken = window.darijaShots?.[lang]
  if (!taken) throw new Error(`geen schermen voor ${lang}`)
  const [mark, fnek] = await Promise.all([svgImage(MARK_SVG), svgImage(FNEK_SVG)])
  const scenes = await Promise.all(SHOTS.map(async (id): Promise<Scene> => {
    const shot = taken[id]
    if (!shot?.frames.length) throw new Error(`geen beelden voor ${id}`)
    return { frames: await Promise.all(shot.frames.map(image)), acts: shot.acts ?? [] }
  }))
  cast = { mark, fnek, scenes, copy: COPY[lang] ?? COPY.nl! }
  castLang = lang
  return cast
}

function prepare(shape: ShapeId): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.getElementById('stage') as HTMLCanvasElement
  const s = SHAPES[shape]
  canvas.width = s.w
  canvas.height = s.h
  canvas.style.width = `${Math.round(s.w / 3)}px`
  canvas.style.height = `${Math.round(s.h / 3)}px`
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('geen 2d-context')
  return { canvas, ctx }
}

window.darijaIntro = {
  duration: DURATION,
  shapes: Object.keys(SHAPES),

  /** One frame as a PNG, for checking the layout without taping anything. */
  async still(lang, shape, t) {
    const dressed = await load(lang)
    const { canvas, ctx } = prepare(shape)
    frame(ctx, SHAPES[shape], dressed, t)
    return canvas.toDataURL('image/png')
  },

  /** The whole film, as a data URL. */
  async record(lang, shape) {
    const dressed = await load(lang)
    const { canvas, ctx } = prepare(shape)
    const music = await soundtrack(dressed)

    const ac = new AudioContext({ sampleRate: 48000 })
    await ac.resume()
    const source = ac.createBufferSource()
    source.buffer = music
    const sink = ac.createMediaStreamDestination()
    source.connect(sink)

    const stream = canvas.captureStream(30)
    for (const track of sink.stream.getAudioTracks()) stream.addTrack(track)

    const type = ['video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm']
      .find((m) => MediaRecorder.isTypeSupported(m))
    if (!type) throw new Error('deze browser kan niets opnemen')

    const chunks: Blob[] = []
    const recorder = new MediaRecorder(stream, {
      mimeType: type,
      videoBitsPerSecond: 9_000_000,
      audioBitsPerSecond: 192_000,
    })
    recorder.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }

    const done = new Promise<void>((resolve) => { recorder.onstop = () => resolve() })

    // One clock for both: the frame drawn is whatever the music has reached,
    // so picture and sound cannot drift apart however the browser is feeling.
    frame(ctx, SHAPES[shape], dressed, 0)
    recorder.start()
    const start = ac.currentTime + 0.12
    source.start(start)

    await new Promise<void>((resolve) => {
      const tick = () => {
        const t = ac.currentTime - start
        if (t >= DURATION) { resolve(); return }
        frame(ctx, SHAPES[shape], dressed, Math.max(0, t))
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    recorder.stop()
    source.stop()
    await done
    await ac.close()

    const blob = new Blob(chunks, { type })
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.readAsDataURL(blob)
    })
  },
}

// A preview while working on it: /dev/intro.html?lang=nl&shape=verhaal&t=6
const params = new URLSearchParams(location.search)
if (params.has('t')) {
  void window.darijaIntro
    .still(params.get('lang') ?? 'nl', (params.get('shape') as ShapeId) ?? 'verhaal', Number(params.get('t')))
    .catch((e: unknown) => console.error(e))
}
