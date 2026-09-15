import { getState } from './store'
import { spokenForm } from '../content/pronunciation'

/**
 * Sound, without a single audio file.
 *
 * Two separate jobs live here. The effects are synthesised with the Web Audio
 * API — a plucked string, a hand drum, a bell — so the whole app stays a few
 * hundred kilobytes and still sounds like something. Pronunciation uses the
 * speech synthesiser already in the device, asked for a Moroccan voice and
 * falling back through the other Arabic voices; if the device has no Arabic
 * voice at all it reads the Latin spelling with a French voice instead, which
 * is a rough approximation and says so in the interface.
 */

/* -------------------------------------------------------------- the mixer */

let ctx: AudioContext | null = null
let bus: GainNode | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) {
    claimPlaybackSession()
    ctx = new Ctor()
    // One limiter on the way out, so two sounds at once cannot clip.
    const comp = ctx.createDynamicsCompressor()
    // A real ceiling rather than a suggestion: the bus below runs hot on
    // purpose, and a reward can stack five sounds inside the same 200 ms.
    comp.threshold.value = -4
    comp.knee.value = 10
    comp.ratio.value = 8
    comp.attack.value = 0.003
    comp.release.value = 0.16
    bus = ctx.createGain()
    // Phone speakers are small and children hold them at arm's length. The
    // limiter above is what keeps this from clipping.
    bus.gain.value = 1.35
    bus.connect(comp).connect(ctx.destination)
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/**
 * Asks iOS to treat this page as playback rather than as an incidental beep.
 *
 * Without it, Safari routes Web Audio through the ringer channel: an iPhone
 * with the side switch on silent plays the pronunciation (that goes through
 * the speech engine) and none of the effects — which is exactly what "I hear
 * the words but no sounds" looks like. Safari 16.4 and up honour this;
 * everywhere else the property simply is not there.
 */
function claimPlaybackSession(): void {
  const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
  if (!session) return
  try {
    session.type = 'playback'
  } catch {
    /* an older Safari that has the object but not the setter */
  }
}

/** What the mixer is doing, for the sound check in the settings screen. */
export function mixerState(): 'speelt' | 'geblokkeerd' | 'geen' {
  if (typeof window === 'undefined') return 'geen'
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return 'geen'
  if (!ctx) return 'geblokkeerd'
  return ctx.state === 'running' ? 'speelt' : 'geblokkeerd'
}

/**
 * Browsers keep audio silent until the visitor has interacted with the page,
 * and an embedded frame is stricter still. The first tap or key press wakes
 * the mixer and warms up the speech engine, so the first word a learner meets
 * is actually audible.
 */
let unlocked = false

export function unlockAudio(): void {
  if (unlocked) return
  unlocked = true
  audio()
  if (typeof speechSynthesis !== 'undefined') {
    try {
      const warm = new SpeechSynthesisUtterance(' ')
      warm.volume = 0
      speechSynthesis.speak(warm)
    } catch {
      /* nothing to warm up */
    }
  }
}

const GESTURES = ['pointerdown', 'keydown', 'touchstart'] as const

/**
 * Nudges the mixer awake. Cheap, and safe to call on every tap.
 *
 * A context does not only start out suspended — iOS suspends it again after
 * the speech engine has spoken, after a call, after the screen locks. Resuming
 * is only allowed from inside a real gesture, so the safest moment is every
 * gesture, not just the first one of the session.
 */
export function keepAwake(): void {
  const ac = ctx
  if (ac && ac.state !== 'running') void ac.resume().catch(() => {})
}

export function listenForFirstGesture(): () => void {
  if (typeof window === 'undefined') return () => {}
  const wake = () => {
    unlockAudio()
    keepAwake()
  }
  for (const event of GESTURES) window.addEventListener(event, wake, { passive: true })
  return () => {
    for (const event of GESTURES) window.removeEventListener(event, wake)
  }
}

/**
 * True when the app has been touched and the mixer still will not start.
 *
 * Before the first gesture every browser reports the mixer as blocked, which
 * is normal and not worth saying out loud; after one, it means something is
 * genuinely holding the sound back and the learner deserves to be told.
 */
export const audioBlocked = (): boolean => unlocked && mixerState() === 'geblokkeerd'

const on = () => getState().settings.sound

/**
 * Plays something, once the mixer is actually awake.
 *
 * A browser that has not been touched yet keeps the context suspended, and its
 * clock stops with it — so notes scheduled against that clock land in the past
 * the moment it resumes, and are simply never heard. Waiting for the resume is
 * the difference between a silent first answer and a satisfying one.
 */
function schedule(play: () => void): void {
  if (!on()) return
  const ac = audio()
  if (!ac) return
  if (ac.state === 'running') play()
  else void ac.resume().then(play).catch(() => {})
}

/* ------------------------------------------------------------ instruments */

/** A plucked string: four partials that die away at different speeds. */
function pluck(freq: number, at = 0, dur = 0.9, level = 0.22): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  const partials: [number, number, number][] = [[1, 1, 1], [2, 0.42, 0.6], [3, 0.2, 0.42], [4.2, 0.1, 0.3]]
  for (const [ratio, amp, life] of partials) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = ratio === 1 ? 'triangle' : 'sine'
    osc.frequency.setValueAtTime(freq * ratio, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(level * amp, t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * life)
    osc.connect(gain).connect(bus)
    osc.start(t)
    osc.stop(t + dur * life + 0.05)
  }
}

let noiseBuffer: AudioBuffer | null = null

function noise(ac: AudioContext): AudioBuffer {
  if (!noiseBuffer) {
    noiseBuffer = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
    const data = noiseBuffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noiseBuffer
}

/** A hand drum. "dum" is the deep centre stroke, "tek" the dry rim. */
function drum(kind: 'dum' | 'tek', at = 0, level = 0.3): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at

  const skin = ac.createBufferSource()
  skin.buffer = noise(ac)
  const band = ac.createBiquadFilter()
  band.type = kind === 'dum' ? 'lowpass' : 'bandpass'
  band.frequency.value = kind === 'dum' ? 320 : 2600
  band.Q.value = kind === 'dum' ? 1 : 2.5
  const skinGain = ac.createGain()
  const skinLife = kind === 'dum' ? 0.16 : 0.07
  skinGain.gain.setValueAtTime(level * (kind === 'dum' ? 0.5 : 0.34), t)
  skinGain.gain.exponentialRampToValueAtTime(0.0001, t + skinLife)
  skin.connect(band).connect(skinGain).connect(bus)
  skin.start(t)
  skin.stop(t + skinLife + 0.02)

  if (kind === 'dum') {
    const body = ac.createOscillator()
    const bodyGain = ac.createGain()
    body.type = 'sine'
    body.frequency.setValueAtTime(150, t)
    body.frequency.exponentialRampToValueAtTime(56, t + 0.18)
    bodyGain.gain.setValueAtTime(level, t)
    bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
    body.connect(bodyGain).connect(bus)
    body.start(t)
    body.stop(t + 0.24)
  }
}

/** A struck bell, by frequency modulation. */
function bell(freq: number, at = 0, dur = 1.1, level = 0.16): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  const carrier = ac.createOscillator()
  const mod = ac.createOscillator()
  const modGain = ac.createGain()
  const out = ac.createGain()
  carrier.frequency.value = freq
  mod.frequency.value = freq * 1.41
  modGain.gain.setValueAtTime(freq * 2.4, t)
  modGain.gain.exponentialRampToValueAtTime(1, t + dur * 0.6)
  out.gain.setValueAtTime(0.0001, t)
  out.gain.exponentialRampToValueAtTime(level, t + 0.01)
  out.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  mod.connect(modGain).connect(carrier.frequency)
  carrier.connect(out).connect(bus)
  mod.start(t)
  carrier.start(t)
  mod.stop(t + dur)
  carrier.stop(t + dur + 0.05)
}

function click(at = 0, level = 0.09): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  const src = ac.createBufferSource()
  src.buffer = noise(ac)
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1800
  const gain = ac.createGain()
  gain.gain.setValueAtTime(level, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035)
  src.connect(hp).connect(gain).connect(bus)
  src.start(t)
  src.stop(t + 0.05)
}

/**
 * Two scales, and they do different jobs.
 *
 * Hijaz on D is the sound of a great deal of Moroccan music, and it carries
 * the app's own moments — finishing a lesson, a drum under a tap. The bright
 * pentatonic is what rewards are built from: every note in it agrees with
 * every other, so a run can climb as long as a child keeps answering, and it
 * never lands on a sour note. That climb is the thing that makes a streak feel
 * like a streak.
 */
const HIJAZ = {
  Eb3: 155.56, D4: 293.66, Eb4: 311.13, Fs4: 369.99, A4: 440.0, D5: 587.33, D6: 1174.66,
}

/** C major pentatonic across two octaves, for the rising reward. */
const CLIMB = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0]

/** A wooden, bell-like note: the sound most games reward you with. */
function marimba(freq: number, at = 0, dur = 0.55, level = 0.22): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  for (const [ratio, amp, life] of [[1, 1, 1], [4, 0.28, 0.4], [9.2, 0.08, 0.22]] as const) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq * ratio, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(level * amp, t + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * life)
    osc.connect(gain).connect(bus)
    osc.start(t)
    osc.stop(t + dur * life + 0.05)
  }
}

/** The bubble-pop under every reward: a short blip that slides upward. */
function pop(at = 0, from = 420, to = 900, level = 0.12): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(to, t + 0.07)
  gain.gain.setValueAtTime(level, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
  osc.connect(gain).connect(bus)
  osc.start(t)
  osc.stop(t + 0.12)
}

/** Glitter: a handful of tiny high bells, scattered over a moment. */
function sparkle(at = 0, count = 5, level = 0.09): void {
  const top = CLIMB.slice(4)
  for (let i = 0; i < count; i++) {
    const freq = top[(i * 3 + 2) % top.length]! * (i % 2 ? 2 : 1)
    bell(freq, at + i * 0.045, 0.8, level)
  }
}

/** Air moving: the run-up before something good happens. */
function whoosh(at = 0, level = 0.1): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  const src = ac.createBufferSource()
  src.buffer = noise(ac)
  const band = ac.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = 1.2
  band.frequency.setValueAtTime(400, t)
  band.frequency.exponentialRampToValueAtTime(4000, t + 0.3)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(level, t + 0.12)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.34)
  src.connect(band).connect(gain).connect(bus)
  src.start(t)
  src.stop(t + 0.36)
}

/**
 * A button. Not a tick of noise but an actual little note, because a 35 ms
 * hiss is the first thing a phone speaker throws away.
 */
function blip(freq: number, at = 0, dur = 0.16, level = 0.3, glide = 1): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, t)
  if (glide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * glide, t + dur * 0.8)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(level, t + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(bus)
  osc.start(t)
  osc.stop(t + dur + 0.03)
}

/** Air rushing upward: the run-up to something about to start. */
function riser(at = 0, dur = 1.1, level = 0.16): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  const src = ac.createBufferSource()
  src.buffer = noise(ac)
  src.loop = true
  const band = ac.createBiquadFilter()
  band.type = 'bandpass'
  band.Q.value = 3
  band.frequency.setValueAtTime(220, t)
  band.frequency.exponentialRampToValueAtTime(5200, t + dur)
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(level, t + dur * 0.8)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.12)
  src.connect(band).connect(gain).connect(bus)
  src.start(t)
  src.stop(t + dur + 0.16)
}

/**
 * A room full of people clapping: noise in the range hands actually make,
 * chopped up fast enough that the ear hears claps rather than hiss.
 */
function applause(at = 0, dur = 1.9, level = 0.3): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  const src = ac.createBufferSource()
  src.buffer = noise(ac)
  src.loop = true
  const band = ac.createBiquadFilter()
  band.type = 'bandpass'
  band.frequency.value = 1900
  band.Q.value = 0.6
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 700
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(level, t + 0.18)
  gain.gain.setValueAtTime(level, t + dur * 0.5)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  // The flutter that turns hiss into hands.
  const clap = ac.createOscillator()
  const clapDepth = ac.createGain()
  clap.type = 'sawtooth'
  clap.frequency.value = 16
  clapDepth.gain.value = level * 0.5
  clap.connect(clapDepth).connect(gain.gain)
  src.connect(band).connect(hp).connect(gain).connect(bus)
  src.start(t)
  src.stop(t + dur + 0.05)
  clap.start(t)
  clap.stop(t + dur + 0.05)
}

/** Someone in the back putting two fingers in their mouth. */
function whistle(at = 0, level = 0.12): void {
  const ac = audio()
  if (!ac || !bus) return
  const t = ac.currentTime + at
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(1500, t)
  osc.frequency.exponentialRampToValueAtTime(2400, t + 0.18)
  osc.frequency.exponentialRampToValueAtTime(1900, t + 0.34)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(level, t + 0.05)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.38)
  osc.connect(gain).connect(bus)
  osc.start(t)
  osc.stop(t + 0.4)
}

export const sfx = {
  /** Any button at all: short, wooden, unmistakably a press. */
  tap: () => schedule(() => {
    click(0, 0.1)
    marimba(CLIMB[3]!, 0.005, 0.18, 0.2)
  }),

  /** Going somewhere: a tab, a link, a card that opens. */
  nav: () => schedule(() => {
    click(0, 0.08)
    blip(520, 0.005, 0.13, 0.22, 1.35)
  }),

  /** Back, close, cancel — the same step, downward. */
  back: () => schedule(() => {
    click(0, 0.07)
    blip(480, 0.005, 0.15, 0.2, 0.7)
  }),

  /** "Snap ik!" — understood, move on. Two notes that agree with each other. */
  confirm: () => schedule(() => {
    click(0, 0.08)
    marimba(HIJAZ.D4, 0.01, 0.35, 0.26)
    marimba(HIJAZ.A4, 0.1, 0.4, 0.22)
    drum('tek', 0.01, 0.16)
  }),

  /** A switch in the settings, and anything else with two states. */
  toggle: (on: boolean) => schedule(() => {
    click(0, 0.07)
    blip(on ? 460 : 620, 0.005, 0.14, 0.22, on ? 1.5 : 0.62)
  }),

  /** The moment an answer is chosen, before it is judged. */
  pick: () => schedule(() => {
    click(0, 0.09)
    pop(0.01, 300, 560, 0.13)
    blip(392, 0.01, 0.12, 0.18)
  }),

  /** A checkpoint is about to start: drums, a run-up, and three notes. */
  quizStart: () => schedule(() => {
    for (const [i, at] of [0, 0.16, 0.3, 0.42, 0.52, 0.6, 0.67, 0.73].entries()) {
      drum('dum', at, 0.14 + i * 0.03)
    }
    riser(0, 0.9, 0.16)
    marimba(HIJAZ.D4, 0.9, 0.5, 0.26)
    marimba(HIJAZ.Eb4, 1.02, 0.5, 0.26)
    marimba(HIJAZ.Fs4, 1.14, 1.1, 0.3)
    bell(HIJAZ.D5, 1.2, 1.3, 0.12)
  }),

  /**
   * The pulse under a checkpoint question: a clock that speeds up as the
   * checkpoint runs out. Quiet on purpose — it is tension, not a sound effect.
   */
  quizTick: (step: number, total: number) => schedule(() => {
    const late = total > 0 ? Math.min(1, step / total) : 0
    const gap = 0.28 - late * 0.12
    drum('dum', 0, 0.1 + late * 0.06)
    drum('tek', gap, 0.07 + late * 0.05)
    if (late > 0.6) blip(HIJAZ.Eb3 * 2, gap * 2, 0.12, 0.08)
  }),

  /** A checkpoint passed: a room that claps, and a whistle from the back. */
  cheer: () => schedule(() => {
    applause(0.12, 2.1, 0.3)
    whistle(0.45)
    whistle(0.95, 0.09)
    for (const [i, note] of [HIJAZ.D4, HIJAZ.Fs4, HIJAZ.A4, HIJAZ.D5].entries()) {
      marimba(note, i * 0.1, 0.8, 0.26)
      drum(i === 3 ? 'dum' : 'tek', i * 0.1, 0.22)
    }
    bell(HIJAZ.D6, 0.5, 1.6, 0.13)
    sparkle(0.6, 7, 0.1)
  }),

  /**
   * A right answer. The note climbs one step up the pentatonic for every
   * answer in a row, so a run sounds like it is going somewhere — and resets
   * the moment the run breaks.
   */
  correct: (combo = 0) => schedule(() => {
    const step = Math.min(combo, CLIMB.length - 1)
    pop(0, 420 + step * 40, 820 + step * 90, 0.14)
    marimba(CLIMB[step]!, 0.03, 0.6, 0.26)
    marimba(CLIMB[Math.min(step + 2, CLIMB.length - 1)]!, 0.09, 0.55, 0.2)
    bell(CLIMB[Math.min(step + 4, CLIMB.length - 1)]! * 2, 0.12, 0.7, 0.1)
    drum('tek', 0.02, 0.14)
    sparkle(0.18, combo >= 3 ? 3 : 1, 0.08)
  }),

  wrong: () => schedule(() => {
    // Low and soft rather than a buzzer: a mistake is not an alarm.
    drum('dum', 0, 0.24)
    pluck(HIJAZ.Eb3, 0.04, 0.5, 0.14)
  }),

  /** Finishing a lesson: the Moroccan phrase, then glitter over it. */
  finish: () => schedule(() => {
    const line: [number, number][] = [[HIJAZ.D4, 0], [HIJAZ.Fs4, 0.12], [HIJAZ.A4, 0.24], [HIJAZ.D5, 0.36]]
    for (const [note, at] of line) {
      marimba(note, at, 0.8, 0.24)
      drum(at === 0.36 ? 'dum' : 'tek', at, 0.2)
    }
    sparkle(0.46, 6)
    bell(HIJAZ.D6, 0.5, 1.4, 0.12)
  }),

  /** A badge: the big one, with a run-up. */
  badge: () => schedule(() => {
    whoosh(0)
    drum('dum', 0.22, 0.26)
    for (const [i, note] of [CLIMB[2]!, CLIMB[4]!, CLIMB[6]!, CLIMB[8]!].entries()) {
      marimba(note, 0.24 + i * 0.07, 0.7, 0.22)
    }
    sparkle(0.5, 7, 0.11)
  }),

  /** A new level: shorter than a badge, but unmistakably upward. */
  levelUp: () => schedule(() => {
    whoosh(0, 0.08)
    for (const [i, note] of [CLIMB[0]!, CLIMB[2]!, CLIMB[4]!, CLIMB[5]!].entries()) {
      marimba(note, 0.1 + i * 0.06, 0.6, 0.22)
    }
    bell(CLIMB[7]!, 0.36, 1.2, 0.13)
    sparkle(0.4, 4)
  }),

  /** A run worth noticing, on its own. */
  streak: () => schedule(() => {
    CLIMB.slice(0, 6).forEach((note, i) => marimba(note, i * 0.05, 0.45, 0.2))
    sparkle(0.3, 3)
  }),

  heart: () => schedule(() => drum('dum', 0, 0.2)),

  /** Two cards that match. */
  match: () => schedule(() => {
    pop(0, 500, 1100, 0.13)
    marimba(CLIMB[5]!, 0.03, 0.5, 0.24)
    bell(CLIMB[8]!, 0.08, 0.7, 0.11)
  }),

  tick: () => schedule(() => click(0, 0.05)),

  /** Used by the settings screen to show what the effects sound like. */
  demo: () => {
    sfx.tap()
    setTimeout(() => sfx.correct(0), 260)
    setTimeout(() => sfx.correct(2), 680)
    setTimeout(() => sfx.correct(5), 1100)
    setTimeout(() => sfx.wrong(), 1600)
    setTimeout(() => sfx.cheer(), 2200)
  },
}

/* -------------------------------------------------------- speech synthesis */

const ARABIC_ORDER = ['ar-ma', 'ar-dz', 'ar-tn', 'ar-eg', 'ar-sa', 'ar-jo', 'ar-lb', 'ar']

/**
 * Which European voice to borrow when the device has no Arabic one, best fit
 * first. French leads because Morocco's second language handles ch, ou and a
 * uvular r; Spanish and German follow; English is last because its vowels are
 * the furthest away.
 */
const FALLBACK_ORDER = ['fr-ma', 'fr', 'es', 'de', 'nl', 'it', 'en']

export const canSpeak = (): boolean => typeof speechSynthesis !== 'undefined'

export function voices(): SpeechSynthesisVoice[] {
  if (!canSpeak()) return []
  return speechSynthesis.getVoices()
}

const langOf = (voice: SpeechSynthesisVoice) => voice.lang.toLowerCase().replace('_', '-')

const bestOf = (order: string[], all: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null => {
  for (const wanted of order) {
    const hit = all.find((v) => langOf(v).startsWith(wanted))
    if (hit) return hit
  }
  return null
}

export const arabicVoices = (): SpeechSynthesisVoice[] => voices().filter((v) => langOf(v).startsWith('ar'))

/** The chosen voice, or the best Arabic one the device has. */
export function arabicVoice(): SpeechSynthesisVoice | null {
  const all = voices()
  const chosen = getState().settings.voiceURI
  if (chosen) {
    const picked = all.find((v) => v.voiceURI === chosen)
    if (picked) return picked
  }
  return bestOf(ARABIC_ORDER, all)
}

/** True when the device has no Arabic voice, so the interface can say so. */
export const missingArabicVoice = (): boolean => canSpeak() && voices().length > 0 && arabicVoices().length === 0

/* ------------------------------------------------- borrowing another voice */

export type Phonetic = 'fr' | 'es' | 'de' | 'nl' | 'it' | 'en'

/**
 * Darija written for a voice that does not speak it.
 *
 * Every language spells the same sound differently, so a French voice needs
 * "choukran" and a German one "schukran" to say the same word. Each list is
 * applied in order; the ayn is simply dropped, because no European language
 * has it.
 */
const RULES: Record<Phonetic, [RegExp, string][]> = {
  fr: [[/sh|ch/g, 'ch'], [/kh|gh/g, 'r'], [/7/g, 'h'], [/[9q]/g, 'k'], [/3/g, ''], [/(?<!o)u/g, 'ou'], [/w/g, 'ou']],
  de: [[/ou/g, 'u'], [/sh|ch/g, 'sch'], [/j/g, 'sch'], [/kh/g, 'ch'], [/gh/g, 'r'], [/7/g, 'h'], [/[9q]/g, 'k'], [/3/g, ''], [/z/g, 's'], [/w/g, 'u']],
  // j becomes zj before sh becomes sj, or the new j would be rewritten again.
  nl: [[/ou/g, 'oe'], [/j/g, 'zj'], [/sh|ch/g, 'sj'], [/kh/g, 'ch'], [/gh/g, 'g'], [/7/g, 'h'], [/[9q]/g, 'k'], [/3/g, ''], [/u/g, 'oe']],
  es: [[/sh|ch/g, 'sh'], [/kh|7/g, 'j'], [/gh/g, 'g'], [/[9q]/g, 'k'], [/3/g, ''], [/w/g, 'u']],
  it: [[/sh|ch/g, 'sc'], [/kh|gh/g, 'gh'], [/7/g, 'h'], [/[9q]/g, 'c'], [/3/g, '']],
  en: [[/kh|gh/g, 'kh'], [/7/g, 'h'], [/[9q]/g, 'k'], [/3/g, ''], [/(?<!o)u/g, 'oo']],
}

/** The phonetic ruleset for a voice, from its language tag. */
export function phoneticOf(lang: string): Phonetic {
  const code = lang.toLowerCase().split('-')[0] as Phonetic
  return code in RULES ? code : 'fr'
}

export function latinise(tr: string, target: Phonetic = 'fr'): string {
  let out = tr.toLowerCase()
  for (const [pattern, replacement] of RULES[target]) out = out.replace(pattern, replacement)
  return out.replace(/\s+/g, ' ').trim()
}

export type VoicePlan =
  | { mode: 'arabisch'; voice: SpeechSynthesisVoice }
  | { mode: 'benadering'; voice: SpeechSynthesisVoice }
  | { mode: 'geen' }

/** What this device can actually do, decided fresh for every utterance. */
export function voicePlan(): VoicePlan {
  if (!canSpeak()) return { mode: 'geen' }
  const arabic = arabicVoice()
  if (arabic) return { mode: 'arabisch', voice: arabic }
  if (!getState().settings.fallbackVoice) return { mode: 'geen' }
  const standIn = bestOf(FALLBACK_ORDER, voices()) ?? voices()[0]
  return standIn ? { mode: 'benadering', voice: standIn } : { mode: 'geen' }
}

export interface SayOptions {
  /** The Latin spelling, read out when the device has no Arabic voice. */
  tr?: string
  slow?: boolean
}

export function say(arabic: string, opts: SayOptions = {}): void {
  const s = getState()
  if (!s.settings.sound || !canSpeak()) return
  unlockAudio()
  const plan = voicePlan()
  if (plan.mode === 'geen') return

  // An Arabic voice gets the form written for speaking, which is the same
  // word with the vowels Darija does not say left out.
  const text = plan.mode === 'arabisch' ? spokenForm(arabic) : latinise(opts.tr ?? '', phoneticOf(plan.voice.lang))
  if (!text.trim()) return

  speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.voice = plan.voice
  utter.lang = plan.voice.lang
  // The approximation is easier to follow a little slower than the real thing.
  utter.rate = opts.slow ? 0.55 : plan.mode === 'benadering' ? s.settings.voiceRate * 0.9 : s.settings.voiceRate
  utter.pitch = 1
  // Speaking can hand the audio session back suspended on iOS; take it again.
  utter.onend = () => keepAwake()
  speechSynthesis.speak(utter)
}

/** Some browsers only fill the voice list asynchronously. */
export function onVoicesReady(cb: () => void): () => void {
  if (!canSpeak()) return () => {}
  const handler = () => cb()
  speechSynthesis.addEventListener('voiceschanged', handler)
  if (voices().length) cb()
  return () => speechSynthesis.removeEventListener('voiceschanged', handler)
}

/* ------------------------------------------------------ speech recognition */

type Recogniser = {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: ((e: unknown) => void) | null
  onend: (() => void) | null
}

const RecognitionCtor = (): (new () => Recogniser) | null => {
  if (typeof window === 'undefined') return null
  const w = window as unknown as { SpeechRecognition?: new () => Recogniser; webkitSpeechRecognition?: new () => Recogniser }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export const canListen = (): boolean => RecognitionCtor() !== null

/** Listens once and resolves with everything it thought it heard. */
export function listenOnce(timeoutMs = 6000): Promise<string> {
  const Ctor = RecognitionCtor()
  if (!Ctor) return Promise.reject(new Error('geen-spraakherkenning'))

  return new Promise((resolve, reject) => {
    const rec = new Ctor()
    rec.lang = 'ar-MA'
    rec.continuous = false
    rec.interimResults = false
    rec.maxAlternatives = 3
    let settled = false
    const done = (value: string | null, err?: unknown) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      try { rec.stop() } catch { /* already stopped */ }
      if (value === null) reject(err instanceof Error ? err : new Error('spraak-mislukt'))
      else resolve(value)
    }
    const timer = setTimeout(() => done(''), timeoutMs)

    rec.onresult = (e) => {
      const alternatives: string[] = []
      for (let i = 0; i < e.results.length; i++) {
        const result = e.results[i]!
        for (let j = 0; j < result.length; j++) alternatives.push(result[j]!.transcript)
      }
      done(alternatives.join(' '))
    }
    rec.onerror = (e) => done(null, e)
    rec.onend = () => done('')
    try { rec.start() } catch (e) { done(null, e) }
  })
}
