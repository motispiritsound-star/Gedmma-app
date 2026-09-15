/**
 * Every sound the app can make, written without knowing where it will come out.
 *
 * Each instrument takes the context and the node it should play into, so the
 * same code can be scheduled live on the speakers or rendered ahead of time
 * into a sample. That second path is not a luxury: an iPhone with the side
 * switch on silent plays the speech engine and mutes Web Audio, and the only
 * way past it is to hand the sound to an <audio> element instead — which needs
 * a file, which needs these same notes rendered offline.
 */

/** A place to play into: the context, and the node that leads to the speaker. */
export interface Stage {
  ac: BaseAudioContext
  out: AudioNode
}

/* ------------------------------------------------------------ instruments */

/** One white-noise second per context, shared by everything that needs grit. */
const noiseFor = new WeakMap<BaseAudioContext, AudioBuffer>()

function noise(ac: BaseAudioContext): AudioBuffer {
  const cached = noiseFor.get(ac)
  if (cached) return cached
  const buffer = ac.createBuffer(1, Math.floor(ac.sampleRate), ac.sampleRate)
  const data = buffer.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  noiseFor.set(ac, buffer)
  return buffer
}

/** A plucked string: four partials that die away at different speeds. */
function pluck({ ac, out }: Stage, freq: number, at = 0, dur = 0.9, level = 0.22): void {
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
    osc.connect(gain).connect(out)
    osc.start(t)
    osc.stop(t + dur * life + 0.05)
  }
}

/** A hand drum. "dum" is the deep centre stroke, "tek" the dry rim. */
function drum({ ac, out }: Stage, kind: 'dum' | 'tek', at = 0, level = 0.3): void {
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
  skin.connect(band).connect(skinGain).connect(out)
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
    body.connect(bodyGain).connect(out)
    body.start(t)
    body.stop(t + 0.24)
  }
}

/** A struck bell, by frequency modulation. */
function bell({ ac, out }: Stage, freq: number, at = 0, dur = 1.1, level = 0.16): void {
  const t = ac.currentTime + at
  const carrier = ac.createOscillator()
  const mod = ac.createOscillator()
  const modGain = ac.createGain()
  const gain = ac.createGain()
  carrier.frequency.value = freq
  mod.frequency.value = freq * 1.41
  modGain.gain.setValueAtTime(freq * 2.4, t)
  modGain.gain.exponentialRampToValueAtTime(1, t + dur * 0.6)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(level, t + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  mod.connect(modGain).connect(carrier.frequency)
  carrier.connect(gain).connect(out)
  mod.start(t)
  carrier.start(t)
  mod.stop(t + dur)
  carrier.stop(t + dur + 0.05)
}

/** The transient of a press: the sound of something being touched. */
function click({ ac, out }: Stage, at = 0, level = 0.09): void {
  const t = ac.currentTime + at
  const src = ac.createBufferSource()
  src.buffer = noise(ac)
  const hp = ac.createBiquadFilter()
  hp.type = 'highpass'
  hp.frequency.value = 1800
  const gain = ac.createGain()
  gain.gain.setValueAtTime(level, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035)
  src.connect(hp).connect(gain).connect(out)
  src.start(t)
  src.stop(t + 0.05)
}

/** A wooden, bell-like note: the sound most games reward you with. */
function marimba({ ac, out }: Stage, freq: number, at = 0, dur = 0.55, level = 0.22): void {
  const t = ac.currentTime + at
  for (const [ratio, amp, life] of [[1, 1, 1], [4, 0.28, 0.4], [9.2, 0.08, 0.22]] as const) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq * ratio, t)
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(level * amp, t + 0.006)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur * life)
    osc.connect(gain).connect(out)
    osc.start(t)
    osc.stop(t + dur * life + 0.05)
  }
}

/** The bubble-pop under every reward: a short blip that slides upward. */
function pop({ ac, out }: Stage, at = 0, from = 420, to = 900, level = 0.12): void {
  const t = ac.currentTime + at
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(from, t)
  osc.frequency.exponentialRampToValueAtTime(to, t + 0.07)
  gain.gain.setValueAtTime(level, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.1)
  osc.connect(gain).connect(out)
  osc.start(t)
  osc.stop(t + 0.12)
}

/**
 * A button. Not a tick of noise but an actual little note, because a 35 ms
 * hiss is the first thing a phone speaker throws away.
 */
function blip(stage: Stage, freq: number, at = 0, dur = 0.16, level = 0.3, glide = 1): void {
  const { ac, out } = stage
  const t = ac.currentTime + at
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'triangle'
  osc.frequency.setValueAtTime(freq, t)
  if (glide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * glide, t + dur * 0.8)
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(level, t + 0.006)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  osc.connect(gain).connect(out)
  osc.start(t)
  osc.stop(t + dur + 0.03)
}

/** Air moving: the run-up before something good happens. */
function whoosh({ ac, out }: Stage, at = 0, level = 0.1): void {
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
  src.connect(band).connect(gain).connect(out)
  src.start(t)
  src.stop(t + 0.36)
}

/** Air rushing upward: the run-up to something about to start. */
function riser({ ac, out }: Stage, at = 0, dur = 1.1, level = 0.16): void {
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
  src.connect(band).connect(gain).connect(out)
  src.start(t)
  src.stop(t + dur + 0.16)
}

/**
 * A room full of people clapping: noise in the range hands actually make,
 * chopped up fast enough that the ear hears claps rather than hiss.
 */
function applause({ ac, out }: Stage, at = 0, dur = 1.9, level = 0.3): void {
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
  src.connect(band).connect(hp).connect(gain).connect(out)
  src.start(t)
  src.stop(t + dur + 0.05)
  clap.start(t)
  clap.stop(t + dur + 0.05)
}

/** Someone in the back putting two fingers in their mouth. */
function whistle({ ac, out }: Stage, at = 0, level = 0.12): void {
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
  osc.connect(gain).connect(out)
  osc.start(t)
  osc.stop(t + 0.4)
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
export const HIJAZ = {
  D3: 146.83, Eb3: 155.56, A3: 220.0, D4: 293.66, Eb4: 311.13, F4: 349.23,
  Fs4: 369.99, G4: 392.0, A4: 440.0, Bb4: 466.16, C5: 523.25, D5: 587.33,
  Eb5: 622.25, Fs5: 739.99, D6: 1174.66,
}

/** C major pentatonic across two octaves, for the rising reward. */
export const CLIMB = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51, 1567.98, 1760.0]

/** Glitter: a handful of tiny high bells, scattered over a moment. */
function sparkle(stage: Stage, at = 0, count = 5, level = 0.09): void {
  const top = CLIMB.slice(4)
  for (let i = 0; i < count; i++) {
    const freq = top[(i * 3 + 2) % top.length]! * (i % 2 ? 2 : 1)
    bell(stage, freq, at + i * 0.045, 0.8, level)
  }
}


/**
 * Five little tunes, one per scene of the film after a lesson.
 *
 * All five sit in hijaz on D — the scale that makes a melody sound Moroccan
 * rather than merely cheerful — over a darbuka pattern, so the film sounds
 * like the language it is teaching instead of like a generic game.
 */
const MELODIES: number[][] = [
  // the souk: busy, stepping up and back down like haggling
  [HIJAZ.D4, HIJAZ.Eb4, HIJAZ.Fs4, HIJAZ.G4, HIJAZ.A4, HIJAZ.G4, HIJAZ.Fs4, HIJAZ.Eb4,
   HIJAZ.D4, HIJAZ.Fs4, HIJAZ.A4, HIJAZ.Bb4, HIJAZ.A4, HIJAZ.G4, HIJAZ.Fs4, HIJAZ.D4,
   HIJAZ.Eb4, HIJAZ.D4, HIJAZ.D4],
  // the desert: long, wide, unhurried
  [HIJAZ.A3, HIJAZ.D4, HIJAZ.D4, HIJAZ.Eb4, HIJAZ.D4, HIJAZ.A3, HIJAZ.D4, HIJAZ.F4,
   HIJAZ.G4, HIJAZ.A4, HIJAZ.A4, HIJAZ.G4, HIJAZ.F4, HIJAZ.Eb4, HIJAZ.D4, HIJAZ.D4,
   HIJAZ.A3, HIJAZ.D4, HIJAZ.D4],
  // the blue city: light, skipping up the steps
  [HIJAZ.Fs4, HIJAZ.G4, HIJAZ.A4, HIJAZ.Bb4, HIJAZ.A4, HIJAZ.G4, HIJAZ.Fs4, HIJAZ.G4,
   HIJAZ.A4, HIJAZ.C5, HIJAZ.Bb4, HIJAZ.A4, HIJAZ.G4, HIJAZ.Fs4, HIJAZ.Eb4, HIJAZ.D4,
   HIJAZ.Fs4, HIJAZ.D4, HIJAZ.D4],
  // the coast: rolling, like the swell
  [HIJAZ.D4, HIJAZ.F4, HIJAZ.A4, HIJAZ.F4, HIJAZ.D4, HIJAZ.F4, HIJAZ.A4, HIJAZ.C5,
   HIJAZ.D5, HIJAZ.C5, HIJAZ.A4, HIJAZ.F4, HIJAZ.D4, HIJAZ.Eb4, HIJAZ.F4, HIJAZ.D4,
   HIJAZ.A3, HIJAZ.D4, HIJAZ.D4],
  // the feast: highest and fastest, all the way up
  [HIJAZ.D5, HIJAZ.C5, HIJAZ.Bb4, HIJAZ.A4, HIJAZ.Bb4, HIJAZ.C5, HIJAZ.D5, HIJAZ.Eb5,
   HIJAZ.D5, HIJAZ.C5, HIJAZ.A4, HIJAZ.Fs4, HIJAZ.G4, HIJAZ.A4, HIJAZ.Bb4, HIJAZ.D5,
   HIJAZ.Fs5, HIJAZ.D5, HIJAZ.D5],
]

/** How many tunes there are, so the film can pick one per scene. */
export const FILM_SCENES = MELODIES.length

const BEAT = 0.3

/* ----------------------------------------------------------- the sound bank */

export type SoundName =
  | 'tap' | 'nav' | 'back' | 'confirm' | 'toggle' | 'pick'
  | 'correct' | 'wrong' | 'finish' | 'badge' | 'levelUp' | 'streak'
  | 'match' | 'quizStart' | 'quizTick' | 'cheer' | 'film'

/**
 * Every sound, as a recipe. `arg` means something different per sound — the
 * length of a run for `correct`, how far into a checkpoint for `quizTick`,
 * which way a switch went for `toggle` — and is always a small number, so a
 * rendered version can be cached per value.
 */
export const VOICES: Record<SoundName, (stage: Stage, arg: number) => void> = {
  tap: (s) => {
    click(s, 0, 0.3)
    marimba(s, CLIMB[3]!, 0.005, 0.24, 0.85)
  },

  nav: (s) => {
    click(s, 0, 0.26)
    blip(s, 520, 0.005, 0.16, 0.95, 1.35)
  },

  back: (s) => {
    click(s, 0, 0.24)
    blip(s, 480, 0.005, 0.18, 0.9, 0.7)
  },

  confirm: (s) => {
    click(s, 0, 0.08)
    marimba(s, HIJAZ.D4, 0.01, 0.35, 0.26)
    marimba(s, HIJAZ.A4, 0.1, 0.4, 0.22)
    drum(s, 'tek', 0.01, 0.16)
  },

  toggle: (s, on) => {
    click(s, 0, 0.24)
    blip(s, on ? 460 : 620, 0.005, 0.17, 0.9, on ? 1.5 : 0.62)
  },

  pick: (s) => {
    click(s, 0, 0.28)
    pop(s, 0.01, 300, 560, 0.42)
    blip(s, 392, 0.01, 0.15, 0.8)
  },

  /**
   * A right answer. The note climbs one step up the pentatonic for every
   * answer in a row, so a run sounds like it is going somewhere — and resets
   * the moment the run breaks.
   */
  correct: (s, combo) => {
    const step = Math.min(Math.max(0, combo), CLIMB.length - 1)
    pop(s, 0, 420 + step * 40, 820 + step * 90, 0.14)
    marimba(s, CLIMB[step]!, 0.03, 0.6, 0.26)
    marimba(s, CLIMB[Math.min(step + 2, CLIMB.length - 1)]!, 0.09, 0.55, 0.2)
    bell(s, CLIMB[Math.min(step + 4, CLIMB.length - 1)]! * 2, 0.12, 0.7, 0.1)
    drum(s, 'tek', 0.02, 0.14)
    sparkle(s, 0.18, step >= 3 ? 3 : 1, 0.08)
  },

  wrong: (s) => {
    // Low and soft rather than a buzzer: a mistake is not an alarm.
    drum(s, 'dum', 0, 0.24)
    pluck(s, HIJAZ.Eb3, 0.04, 0.5, 0.14)
  },

  /** Finishing a lesson: the Moroccan phrase, then glitter over it. */
  finish: (s) => {
    const line: [number, number][] = [[HIJAZ.D4, 0], [HIJAZ.Fs4, 0.12], [HIJAZ.A4, 0.24], [HIJAZ.D5, 0.36]]
    for (const [note, at] of line) {
      marimba(s, note, at, 0.8, 0.24)
      drum(s, at === 0.36 ? 'dum' : 'tek', at, 0.2)
    }
    sparkle(s, 0.46, 6)
    bell(s, HIJAZ.D6, 0.5, 1.4, 0.12)
  },

  /** A badge: the big one, with a run-up. */
  badge: (s) => {
    whoosh(s, 0)
    drum(s, 'dum', 0.22, 0.26)
    for (const [i, note] of [CLIMB[2]!, CLIMB[4]!, CLIMB[6]!, CLIMB[8]!].entries()) {
      marimba(s, note, 0.24 + i * 0.07, 0.7, 0.22)
    }
    sparkle(s, 0.5, 7, 0.11)
  },

  /** A new level: shorter than a badge, but unmistakably upward. */
  levelUp: (s) => {
    whoosh(s, 0, 0.08)
    for (const [i, note] of [CLIMB[0]!, CLIMB[2]!, CLIMB[4]!, CLIMB[5]!].entries()) {
      marimba(s, note, 0.1 + i * 0.06, 0.6, 0.22)
    }
    bell(s, CLIMB[7]!, 0.36, 1.2, 0.13)
    sparkle(s, 0.4, 4)
  },

  /** A run worth noticing, on its own. */
  streak: (s) => {
    CLIMB.slice(0, 6).forEach((note, i) => marimba(s, note, i * 0.05, 0.45, 0.2))
    sparkle(s, 0.3, 3)
  },

  /** Two cards that match. */
  match: (s) => {
    pop(s, 0, 500, 1100, 0.13)
    marimba(s, CLIMB[5]!, 0.03, 0.5, 0.24)
    bell(s, CLIMB[8]!, 0.08, 0.7, 0.11)
  },

  /** A checkpoint is about to start: drums, a run-up, and three notes. */
  quizStart: (s) => {
    for (const [i, at] of [0, 0.16, 0.3, 0.42, 0.52, 0.6, 0.67, 0.73].entries()) {
      drum(s, 'dum', at, 0.14 + i * 0.03)
    }
    riser(s, 0, 0.9, 0.16)
    marimba(s, HIJAZ.D4, 0.9, 0.5, 0.26)
    marimba(s, HIJAZ.Eb4, 1.02, 0.5, 0.26)
    marimba(s, HIJAZ.Fs4, 1.14, 1.1, 0.3)
    bell(s, HIJAZ.D5, 1.2, 1.3, 0.12)
  },

  /**
   * The pulse under a checkpoint question: a clock that speeds up as the
   * checkpoint runs out. Quiet on purpose — it is tension, not a sound effect.
   */
  quizTick: (s, late) => {
    const gap = 0.28 - late * 0.12
    drum(s, 'dum', 0, 0.2 + late * 0.14)
    drum(s, 'tek', gap, 0.14 + late * 0.1)
    if (late > 0.5) blip(s, HIJAZ.Eb3 * 2, gap * 2, 0.12, 0.14)
  },

  /** The tune under the little film that plays after a finished lesson. */
  film: (s, scene) => {
    const melody = MELODIES[Math.abs(Math.round(scene)) % MELODIES.length]!
    melody.forEach((note, i) => {
      const at = i * BEAT
      // The last note of the phrase is held, so it lands rather than stops.
      const long = i === melody.length - 1
      marimba(s, note, at, long ? 1.6 : 0.5, long ? 0.3 : 0.24)
      if (i % 4 === 0) pluck(s, HIJAZ.D3, at, 1.1, 0.16)
      if (long) bell(s, note * 2, at + 0.05, 1.8, 0.1)
    })
    // The darbuka underneath: dum, tek-tek, dum, tek.
    for (let bar = 0; bar * 4 < melody.length; bar++) {
      const at = bar * BEAT * 4
      drum(s, 'dum', at, 0.26)
      drum(s, 'tek', at + BEAT * 1.5, 0.16)
      drum(s, 'tek', at + BEAT * 2, 0.14)
      drum(s, 'dum', at + BEAT * 2.5, 0.2)
      drum(s, 'tek', at + BEAT * 3.5, 0.14)
    }
    sparkle(s, melody.length * BEAT - 0.2, 5, 0.08)
  },

  /** A checkpoint passed: a room that claps, and a whistle from the back. */
  cheer: (s) => {
    applause(s, 0.12, 2.1, 0.3)
    whistle(s, 0.45)
    whistle(s, 0.95, 0.09)
    for (const [i, note] of [HIJAZ.D4, HIJAZ.Fs4, HIJAZ.A4, HIJAZ.D5].entries()) {
      marimba(s, note, i * 0.1, 0.8, 0.26)
      drum(s, i === 3 ? 'dum' : 'tek', i * 0.1, 0.22)
    }
    bell(s, HIJAZ.D6, 0.5, 1.6, 0.13)
    sparkle(s, 0.6, 7, 0.1)
  },
}

/** How long each sound runs, in seconds — what a rendered copy has to hold. */
export const LENGTH: Record<SoundName, number> = {
  tap: 0.35, nav: 0.3, back: 0.3, confirm: 0.6, toggle: 0.3, pick: 0.35,
  correct: 1.2, wrong: 0.7, finish: 2.0, badge: 1.6, levelUp: 1.7, streak: 1.2,
  match: 0.9, quizStart: 2.6, quizTick: 0.7, cheer: 2.6, film: 7.4,
}

/** The values of `arg` that are worth keeping a rendered copy of. */
export const ARGS: Record<SoundName, number[]> = {
  tap: [0], nav: [0], back: [0], confirm: [0], toggle: [0, 1], pick: [0],
  correct: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], wrong: [0], finish: [0], badge: [0],
  levelUp: [0], streak: [0], match: [0],
  quizStart: [0], quizTick: [0, 0.3, 0.6, 0.9], cheer: [0], film: [0, 1, 2, 3, 4],
}

/** The limiter every path shares, so a sample sounds like the live version. */
export function busFor(ac: BaseAudioContext): GainNode {
  const comp = ac.createDynamicsCompressor()
  comp.threshold.value = -4
  comp.knee.value = 10
  comp.ratio.value = 8
  comp.attack.value = 0.003
  comp.release.value = 0.16
  const gain = ac.createGain()
  // Phone speakers are small and children hold them at arm's length. The
  // limiter above is what keeps this from clipping.
  gain.gain.value = 1.35
  gain.connect(comp).connect(ac.destination)
  return gain
}
