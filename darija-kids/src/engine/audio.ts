import { getState } from './store'
import { letterSpeech, spokenForm } from '../content/pronunciation'
import { hasClip, playClip } from './clips'
import { ARGS, busFor, LENGTH, VOICES, type SoundName, type Stage } from './instruments'

/**
 * Playing sound, and saying words.
 *
 * The notes themselves live in instruments.ts. This file is about getting them
 * out of the device, which turns out to be the hard half: browsers keep audio
 * silent until the page has been touched, iOS hands the audio session back
 * suspended after every spoken word, and an iPhone with the side switch on
 * silent mutes Web Audio while happily reading the same word out loud through
 * the speech engine.
 *
 * So there are two ways out. Live synthesis is the fast one and the default.
 * When it cannot be heard — the switch, a context that will not resume — the
 * same notes are rendered once into little WAV files and played through
 * ordinary <audio> elements, which go out over the media channel and ignore
 * the switch entirely.
 *
 * Pronunciation is separate again: the speech synthesiser already on the
 * device, asked for a Moroccan voice and falling back through the other Arabic
 * ones; with no Arabic voice at all it reads the Latin spelling with a French
 * voice, which is a rough approximation and says so in the interface.
 */

/* -------------------------------------------------------------- the mixer */

let ctx: AudioContext | null = null
let bus: GainNode | null = null
/** The last node before the speaker, where a level means something. */
let tail: AudioNode | null = null

/** Set when building a live mixer threw — a locked-down frame, mostly. */
let liveBroken = false

/** iPhones and iPads, where the audio session has a mind of its own. */
function apple(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

/**
 * Set when the speech engine has spoken on a device that takes the audio
 * session away with it.
 *
 * On iOS the synthesiser does not share: once it has said a word, the Web
 * Audio context keeps reporting that it is running while producing nothing at
 * all, which is why the only press a learner could hear was the one before the
 * first spoken word. Resuming does not help, because as far as the context is
 * concerned nothing is wrong. A fresh context is the only way back.
 */
let sessionLost = false

function rebuildContext(): void {
  const old = ctx
  ctx = null
  bus = null
  tail = null
  meter = null
  sessionLost = false
  if (old) void old.close().catch(() => {})
}

function audio(): AudioContext | null {
  if (typeof window === 'undefined' || liveBroken) return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  if (!ctx) {
    claimPlaybackSession()
    try {
      ctx = new Ctor()
      const ends = busFor(ctx)
      bus = ends.bus
      tail = ends.out
    } catch {
      // Some embedded frames refuse to hand out a context at all. Rendering
      // the same notes offline is not blocked, so that path takes over.
      liveBroken = true
      ctx = null
      bus = null
      tail = null
      return null
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

/**
 * A tap on the signal on its way out, so "is there actually sound?" can be
 * answered with a number instead of a shrug. Costs nothing when unused.
 */
let meter: AnalyserNode | null = null

function levelMeter(): AnalyserNode | null {
  const ac = audio()
  if (!ac || !tail) return null
  if (!meter) {
    meter = ac.createAnalyser()
    meter.fftSize = 2048
    tail.connect(meter)
  }
  return meter
}

/**
 * Asks iOS to treat this page as playback rather than as an incidental beep.
 *
 * Without it, Safari routes Web Audio through the ringer channel: an iPhone
 * with the side switch on silent plays the pronunciation (that goes through
 * the speech engine) and none of the effects — which is exactly what "I hear
 * the words but no sounds" looks like. Safari 16.4 and up honour this;
 * everywhere else the property simply is not there, which is what the sample
 * path below is for.
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
  if (liveBroken) return 'geen'
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
  // Both roads are opened here, inside the first real tap, because that is
  // the only moment a browser will let either of them start.
  primePool()
  if (samplesWanted()) void warmSamples()
  // Warming up the speech engine costs an iPhone its audio session, and it is
  // the mixer that pays — so there, the first word can be a moment slower.
  if (typeof speechSynthesis !== 'undefined' && !apple()) {
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

/* ------------------------------------------------- the same notes, as files */

/**
 * The way out for a device that will not play synthesised audio.
 *
 * Each sound is rendered once, offline — which no browser blocks, because
 * nothing reaches a speaker — into a small WAV, and played back through an
 * <audio> element. Media elements are not subject to the ringer switch, so
 * this is what makes an iPhone on silent audible; it costs a few hundred
 * kilobytes of memory per sound and a little latency, which is why it is not
 * the default.
 */
const samples = new Map<string, string>()
/** Renders in flight, so a second caller waits for the first instead of losing its sound. */
const pending = new Map<string, Promise<string | null>>()

const key = (name: SoundName, arg: number) => `${name}:${arg}`

/** The rendered variant closest to the value asked for. */
function nearestArg(name: SoundName, arg: number): number {
  const options = ARGS[name]
  let best = options[0]!
  for (const option of options) {
    if (Math.abs(option - arg) < Math.abs(best - arg)) best = option
  }
  return best
}

function encodeWav(buffer: AudioBuffer): ArrayBuffer {
  const samples16 = buffer.getChannelData(0)
  const out = new ArrayBuffer(44 + samples16.length * 2)
  const view = new DataView(out)
  const text = (at: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(at + i, s.charCodeAt(i))
  }
  text(0, 'RIFF')
  view.setUint32(4, 36 + samples16.length * 2, true)
  text(8, 'WAVEfmt ')
  view.setUint32(16, 16, true)
  view.setUint16(20, 1, true)
  view.setUint16(22, 1, true)
  view.setUint32(24, buffer.sampleRate, true)
  view.setUint32(28, buffer.sampleRate * 2, true)
  view.setUint16(32, 2, true)
  view.setUint16(34, 16, true)
  text(36, 'data')
  view.setUint32(40, samples16.length * 2, true)
  for (let i = 0; i < samples16.length; i++) {
    const v = Math.max(-1, Math.min(1, samples16[i]!))
    view.setInt16(44 + i * 2, v < 0 ? v * 0x8000 : v * 0x7fff, true)
  }
  return out
}

async function render(name: SoundName, arg: number): Promise<string | null> {
  const Ctor =
    (typeof OfflineAudioContext !== 'undefined' ? OfflineAudioContext : undefined) ??
    (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext
  if (!Ctor) return null
  const rate = 44100
  const oac = new Ctor(1, Math.ceil((LENGTH[name] + 0.3) * rate), rate)
  const stage: Stage = { ac: oac, out: busFor(oac).bus }
  VOICES[name](stage, arg)
  const rendered = await oac.startRendering()
  return URL.createObjectURL(new Blob([encodeWav(rendered)], { type: 'audio/wav' }))
}

/** Renders a sound if it is not there yet, and returns it once it is. */
function sample(name: SoundName, arg: number): Promise<string | null> {
  const id = key(name, arg)
  const have = samples.get(id)
  if (have) return Promise.resolve(have)
  // A render already under way is worth waiting for. Walking away from it is
  // how the very first press of a session ended up silent: the warm-up had
  // just claimed the same sound.
  const running = pending.get(id)
  if (running) return running
  const job = render(name, arg)
    .then((url) => {
      if (url) samples.set(id, url)
      return url
    })
    .catch(() => null)
    .finally(() => {
      pending.delete(id)
    })
  pending.set(id, job)
  return job
}

/** The handful worth having ready before the first tap needs them. */
const WARM: [SoundName, number][] = [
  ['tap', 0], ['nav', 0], ['back', 0], ['confirm', 0], ['pick', 0],
  ['correct', 0], ['correct', 1], ['correct', 2], ['wrong', 0],
]

async function warmSamples(): Promise<void> {
  for (const [name, arg] of WARM) await sample(name, arg)
}

/** A small pool, so two sounds can overlap without cutting each other off. */
const POOL = 8
const pool: HTMLAudioElement[] = []

function makePool(): void {
  if (typeof Audio === 'undefined' || pool.length) return
  for (let i = 0; i < POOL; i++) {
    const made = new Audio()
    made.preload = 'auto'
    ;(made as unknown as { playsInline: boolean }).playsInline = true
    pool.push(made)
  }
}

function element(): HTMLAudioElement | null {
  makePool()
  return pool.find((a) => a.paused || a.ended) ?? pool[0] ?? null
}

/** Sixteen samples of nothing, to wake an element up with. */
const SILENCE =
  'data:audio/wav;base64,UklGRkQAAABXQVZFZm10IBAAAAABAAEAQB8AAIA+AAACABAAZGF0YSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=='

/**
 * Wakes every player in the pool, inside the gesture that called this.
 *
 * iOS will only let an <audio> element be started from code later if it has
 * already been started once by a real tap. Without this, the sounds that come
 * from a timer rather than a press — the level-up, the badge, the music under
 * the film — would be the only silent ones, which is a maddening thing to
 * debug from the other side of a screen.
 */
function primePool(): void {
  makePool()
  for (const el of pool) {
    el.src = SILENCE
    el.volume = 0
    void el
      .play()
      .then(() => {
        el.pause()
        el.currentTime = 0
        el.volume = 1
      })
      .catch(() => {
        el.volume = 1
      })
  }
}

/**
 * How many times in a row a file refused to play.
 *
 * One refusal is not a verdict — the speech engine can interrupt a player mid
 * word, and the next press is usually fine. Three in a row is a road that is
 * genuinely closed, and then the live mixer takes over.
 */
let mediaMisses = 0
const GIVE_UP = 3
let mediaBroken = false

function playSample(name: SoundName, arg: number): void {
  const wanted = nearestArg(name, arg)
  const start = (url: string) => {
    const el = element()
    if (!el) return
    if (el.src !== url) el.src = url
    el.currentTime = 0
    void el
      .play()
      .then(() => {
        mediaMisses = 0
      })
      .catch(() => {
        mediaMisses += 1
        if (mediaMisses >= GIVE_UP) mediaBroken = true
        playLive(name, arg)
      })
  }
  const ready = samples.get(key(name, wanted))
  if (ready) start(ready)
  else void sample(name, wanted).then((url) => (url ? start(url) : playLive(name, arg)))
}

/**
 * Whether to go through files rather than the live mixer: because the learner
 * asked for it — the switch that makes an iPhone on silent audible — or
 * because the mixer has been asked to start and refuses.
 */
function samplesWanted(): boolean {
  if (typeof window === 'undefined') return false
  if (liveBroken) return true
  if (mediaBroken) return false
  return getState().settings.mediaSound || audioBlocked()
}

/**
 * Plays something, once the mixer is actually awake.
 *
 * A browser that has not been touched yet keeps the context suspended, and its
 * clock stops with it — so notes scheduled against that clock land in the past
 * the moment it resumes, and are simply never heard. Waiting for the resume is
 * the difference between a silent first answer and a satisfying one.
 */
/** The live road: synthesise the notes straight onto the speakers. */
function playLive(name: SoundName, arg: number): void {
  // Something spoke, and on this device that means the mixer is playing to
  // nobody. Start a new one before the next sound rather than after it.
  if (sessionLost) rebuildContext()
  const ac = audio()
  if (!ac) return
  const now = () => {
    if (!bus || !ctx) return
    VOICES[name]({ ac: ctx, out: bus }, arg)
  }
  if (ac.state === 'running') {
    now()
    return
  }
  // The mixer is asleep. Wake it and play — but if waking does not happen
  // promptly, make the sound the other way rather than swallow it. Whichever
  // gets there first wins, so a press never sounds twice.
  let sounded = false
  const once = (make: () => void) => {
    if (sounded) return
    sounded = true
    make()
  }
  void ac.resume().then(() => once(now)).catch(() => once(() => playSample(name, arg)))
  setTimeout(() => once(() => playSample(name, arg)), 250)
}

function play(name: SoundName, arg = 0): void {
  if (!on()) return
  if (samplesWanted()) playSample(name, arg)
  else playLive(name, arg)
}

/** What the app can find out about its own sound, by trying it. */
export interface SoundProbe {
  /** What the mixer says it is doing. */
  mixer: 'speelt' | 'geblokkeerd' | 'geen'
  /** The loudest thing measured leaving the synthesiser, 0 to 1. */
  level: number
  /** True when a rendered file really started playing through the speaker. */
  media: boolean
}

const sleep = (ms: number) => new Promise((done) => setTimeout(done, ms))

/**
 * Plays a sound both ways and measures what came out.
 *
 * This is the one question a learner cannot answer for us: "I hear nothing"
 * covers a blocked browser, a muted phone, a lost Bluetooth speaker and a bug,
 * and they need different answers. A level above zero means the app is making
 * sound and something past it is swallowing it; a level of zero means the app
 * is at fault, and that is ours to fix.
 */
export async function probeSound(): Promise<SoundProbe> {
  unlockAudio()
  keepAwake()
  const scope = levelMeter()
  let level = 0

  if (scope && ctx && bus) {
    VOICES.tap({ ac: ctx, out: bus }, 0)
    const frame = new Float32Array(scope.fftSize)
    for (let i = 0; i < 24; i++) {
      scope.getFloatTimeDomainData(frame)
      for (const v of frame) level = Math.max(level, Math.abs(v))
      await sleep(20)
    }
  }

  // And the other road out, which is the one that ignores a silent switch.
  let media = false
  const url = await sample('tap', 0)
  if (url) {
    const el = element()
    if (el) {
      el.src = url
      el.currentTime = 0
      try {
        await el.play()
        await sleep(220)
        media = el.currentTime > 0
      } catch {
        media = false
      }
    }
  }

  return { mixer: mixerState(), level, media }
}

/** Renders everything up front, for the switch in the settings screen. */
export async function prepareSamples(): Promise<void> {
  for (const [name, args] of Object.entries(ARGS) as [SoundName, number[]][]) {
    for (const arg of args) await sample(name, arg)
  }
}

export const sfx = {
  /** Any button at all: short, wooden, unmistakably a press. */
  tap: () => play('tap'),
  /** Going somewhere: a tab, a link, a card that opens. */
  nav: () => play('nav'),
  /** Back, close, cancel — the same step, downward. */
  back: () => play('back'),
  /** "Snap ik!" — understood, move on. Two notes that agree with each other. */
  confirm: () => play('confirm'),
  /** A switch in the settings, and anything else with two states. */
  toggle: (state: boolean) => play('toggle', state ? 1 : 0),
  /** The moment an answer is chosen, before it is judged. */
  pick: () => play('pick'),
  correct: (combo = 0) => play('correct', Math.min(Math.max(0, combo), 9)),
  wrong: () => play('wrong'),
  finish: () => play('finish'),
  badge: () => play('badge'),
  levelUp: () => play('levelUp'),
  streak: () => play('streak'),
  match: () => play('match'),
  /** A checkpoint is about to start: drums, a run-up, and three notes. */
  quizStart: () => play('quizStart'),
  /** The pulse under a checkpoint question, tightening as it runs out. */
  quizTick: (step: number, total: number) => play('quizTick', total > 0 ? Math.min(1, step / total) : 0),
  /** A checkpoint passed: a room that claps, and a whistle from the back. */
  cheer: () => play('cheer'),
  /** The tune under the film after a lesson; one per scene. */
  film: (scene: number) => play('film', scene),

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

/**
 * What this device can actually do, decided fresh for every utterance.
 *
 * `prefer` names the languages whose mouths can make this particular sound,
 * and it is only consulted when there is no Arabic voice to borrow from.
 * Without it every letter is read by one stand-in, and a Dutch voice has no
 * way at all to say ث — "thaa" comes out as "taa", which is ت, a different
 * letter. A Castilian voice says it perfectly, because Spanish z *is* that
 * sound. Same story for ر, where the rolled r lives in Spanish and Italian,
 * and for ج, whose zh is French.
 *
 * The cost is that the alphabet may be recited in more than one accent. That
 * is a smaller price than two letters sounding identical.
 */
export function voicePlan(prefer: Phonetic[] = []): VoicePlan {
  if (!canSpeak()) return { mode: 'geen' }
  const arabic = arabicVoice()
  if (arabic) return { mode: 'arabisch', voice: arabic }
  if (!getState().settings.fallbackVoice) return { mode: 'geen' }
  const standIn = (prefer.length ? bestOf(prefer, voices()) : null)
    ?? bestOf(FALLBACK_ORDER, voices())
    ?? voices()[0]
  return standIn ? { mode: 'benadering', voice: standIn } : { mode: 'geen' }
}

export interface SayOptions {
  /** The Latin spelling, read out when the device has no Arabic voice. */
  tr?: string
  /**
   * A spelling per borrowed voice, used as written instead of running `tr`
   * through the rules below.
   *
   * The rules are built for whole words and they mangle the names of the
   * letters: "jim" came out of the Dutch ones as "ziem", which is not the
   * sound ج makes. Where a caller knows exactly how a thing should be spelled
   * for a French or a German voice, it says so and the rules stay out of it.
   */
  latin?: Partial<Record<Phonetic, string>>
  slow?: boolean
  /** Languages whose voice can make this sound, best first. */
  prefer?: Phonetic[]
  /**
   * Overrides the reading speed for this one utterance, 0…1.
   *
   * A letter is not a word. A word wants the pace of speech; a single letter
   * wants to be held long enough to hear the vowel in it, and at the speed
   * that reads a sentence a long "qāf" arrives as a short "qaf".
   */
  rate?: number
}

export function say(arabic: string, opts: SayOptions = {}): void {
  const s = getState()
  if (!s.settings.sound || !canSpeak()) return
  unlockAudio()
  const plan = voicePlan(opts.prefer)
  if (plan.mode === 'geen') return

  // An Arabic voice gets the form written for speaking, which is the same
  // word with the vowels Darija does not say left out.
  const target = plan.mode === 'arabisch' ? null : phoneticOf(plan.voice.lang)
  const text = target === null
    ? spokenForm(arabic)
    : opts.latin?.[target] ?? latinise(opts.tr ?? '', target)
  if (!text.trim()) return

  speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.voice = plan.voice
  utter.lang = plan.voice.lang
  // The approximation is easier to follow a little slower than the real thing.
  utter.rate = opts.slow
    ? 0.55
    : opts.rate ?? (plan.mode === 'benadering' ? s.settings.voiceRate * 0.9 : s.settings.voiceRate)
  utter.pitch = 1
  utter.onend = () => {
    // Speaking can hand the session back suspended, or not hand it back at all.
    keepAwake()
    if (apple()) sessionLost = true
  }
  speechSynthesis.speak(utter)
}

/* ------------------------------------------------------- telling a story */

/**
 * Reads a piece of the interface aloud, in the interface's own language.
 *
 * This is not `say`: nothing here is Darija, and nothing is transliterated.
 * It is the narrator on a history card, so it wants the learner's own
 * language and the plainest voice the device has for it.
 *
 * A device with no voice for that language says nothing at all rather than
 * reading Dutch in a Spanish accent — the text is on screen either way, and
 * `onDone` still fires so a film never waits for a voice that is not coming.
 */
export function narrate(
  text: string,
  locale: string,
  opts: { onDone?: () => void } = {},
): { spoken: boolean; stop: () => void } {
  const done = opts.onDone
  const s = getState()
  const silent = { spoken: false, stop: () => {} }
  // `onDone` means "the narrator has finished", and a narrator that never
  // started has not finished — firing it here made a card skip its own story
  // in the blink of an eye on every device without a voice. The caller reads
  // `spoken` and paces itself instead.
  if (!text.trim() || !s.settings.sound || !s.settings.voorlezen || !canSpeak()) return silent
  const want = locale.toLowerCase().split('-')[0]
  const voice = bestOf([locale.toLowerCase(), want], voices())
  if (!voice) return silent

  unlockAudio()
  speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.voice = voice
  utter.lang = voice.lang
  // A story is not a vocabulary drill: it reads at a normal, even pace.
  utter.rate = 1
  utter.pitch = 1
  let over = false
  const finish = () => {
    if (over) return
    over = true
    keepAwake()
    if (apple()) sessionLost = true
    done?.()
  }
  utter.onend = finish
  // Some engines drop an utterance silently when the tab loses focus.
  utter.onerror = finish
  speechSynthesis.speak(utter)

  return {
    spoken: true,
    stop: () => {
      over = true
      speechSynthesis.cancel()
    },
  }
}

/**
 * Roughly how long a piece of text takes to read, in milliseconds.
 *
 * The fallback when there is no voice: the film still has to move on, and it
 * should move on at about the speed somebody reads it.
 */
export const readingTime = (text: string): number =>
  Math.min(22000, Math.max(2600, (text.length / 14) * 1000))

/** Whether this device can read the interface language aloud at all. */
export const canNarrate = (locale: string): boolean => {
  if (!canSpeak()) return false
  const want = locale.toLowerCase().split('-')[0]
  return Boolean(bestOf([locale.toLowerCase(), want], voices()))
}

/**
 * Says a letter out loud — its name, not the shape.
 *
 * "ت" handed to a speech engine is a coin toss; "تاء" is the word a teacher
 * says. And a device without an Arabic voice gets a spelling written for the
 * language that voice speaks, rather than one mangled by the word rules.
 */
export const LETTER_RATE = 0.7

export function sayLetter(letter: { id: string; ar: string; name: string }, opts: { slow?: boolean } = {}): void {
  if (!getState().settings.sound) return

  // A recording beats any voice, so it goes first. It is asynchronous — the
  // file has to be decoded once — and the synthesised voice only steps in if
  // it did not play, so nothing is ever said twice.
  if (hasClip(letter.id)) {
    unlockAudio()
    void playClip(letter.id, audio(), bus, { rate: opts.slow ? 0.7 : 1 }).then((played) => {
      if (!played) speakLetter(letter, opts)
    })
    return
  }
  speakLetter(letter, opts)
}

function speakLetter(letter: { id: string; ar: string; name: string }, opts: { slow?: boolean }): void {
  const speech = letterSpeech(letter.id, letter.ar, letter.name)
  // Slower than a word on purpose: a letter name is two sounds and a long
  // vowel, and at talking speed the vowel disappears.
  say(speech.ar, {
    tr: speech.tr,
    latin: speech.latin,
    prefer: speech.prefer as Phonetic[],
    slow: opts.slow,
    rate: LETTER_RATE,
  })
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
