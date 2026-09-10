import { getState } from './store'

/**
 * Sound, without a single audio file.
 *
 * Pronunciation uses the speech synthesiser already in the device, asked for a
 * Moroccan Arabic voice and falling back through the other Arabic voices. The
 * effects are synthesised with the Web Audio API, so the whole app stays a few
 * hundred kilobytes and works offline.
 */

let ctx: AudioContext | null = null

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!Ctor) return null
  ctx ??= new Ctor()
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

type Tone = { f: number; t: number; d: number; type?: OscillatorType; gain?: number }

function play(tones: Tone[]): void {
  if (!getState().settings.sound) return
  const ac = audio()
  if (!ac) return
  const now = ac.currentTime
  for (const tone of tones) {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = tone.type ?? 'sine'
    osc.frequency.setValueAtTime(tone.f, now + tone.t)
    gain.gain.setValueAtTime(0.0001, now + tone.t)
    gain.gain.exponentialRampToValueAtTime(tone.gain ?? 0.16, now + tone.t + 0.015)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + tone.t + tone.d)
    osc.connect(gain).connect(ac.destination)
    osc.start(now + tone.t)
    osc.stop(now + tone.t + tone.d + 0.02)
  }
}

export const sfx = {
  correct: () => play([
    { f: 660, t: 0, d: 0.12 },
    { f: 880, t: 0.09, d: 0.16 },
  ]),
  wrong: () => play([
    { f: 200, t: 0, d: 0.18, type: 'triangle' },
    { f: 150, t: 0.1, d: 0.2, type: 'triangle' },
  ]),
  finish: () => play([
    { f: 523, t: 0, d: 0.16 },
    { f: 659, t: 0.12, d: 0.16 },
    { f: 784, t: 0.24, d: 0.18 },
    { f: 1046, t: 0.36, d: 0.32 },
  ]),
  tap: () => play([{ f: 420, t: 0, d: 0.05, gain: 0.07 }]),
  heart: () => play([{ f: 320, t: 0, d: 0.14, type: 'sawtooth', gain: 0.08 }]),
  badge: () => play([
    { f: 784, t: 0, d: 0.14 },
    { f: 988, t: 0.1, d: 0.14 },
    { f: 1319, t: 0.22, d: 0.3 },
  ]),
}

/* -------------------------------------------------------- speech synthesis */

const ARABIC_PREFERENCE = ['ar-ma', 'ar-dz', 'ar-tn', 'ar-eg', 'ar-sa', 'ar']

export function voices(): SpeechSynthesisVoice[] {
  if (typeof speechSynthesis === 'undefined') return []
  return speechSynthesis.getVoices()
}

export function arabicVoice(): SpeechSynthesisVoice | null {
  const all = voices()
  for (const wanted of ARABIC_PREFERENCE) {
    const hit = all.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith(wanted))
    if (hit) return hit
  }
  return null
}

export const canSpeak = (): boolean => typeof speechSynthesis !== 'undefined'

/** True when the device has no Arabic voice, so the UI can say so once. */
export const missingArabicVoice = (): boolean => canSpeak() && voices().length > 0 && !arabicVoice()

export function say(text: string, opts: { slow?: boolean } = {}): void {
  const s = getState()
  if (!s.settings.sound || !canSpeak()) return
  speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  const voice = arabicVoice()
  if (voice) utter.voice = voice
  utter.lang = voice?.lang ?? 'ar-MA'
  utter.rate = (opts.slow ? 0.55 : s.settings.voiceRate) as number
  utter.pitch = 1
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

/** Nudges the browser into asking for microphone permission up front. */
export async function primeMicrophone(): Promise<boolean> {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    stream.getTracks().forEach((t) => t.stop())
    return true
  } catch {
    return false
  }
}
