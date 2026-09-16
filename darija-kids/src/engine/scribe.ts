import type { Verdict } from './exercises'

/**
 * Grading a traced letter.
 *
 * Two numbers decide it, and they pull in opposite directions on purpose.
 * *Coverage* is how much of the letter the child's line actually went over —
 * scribbling half of it is not writing it. *Spill* is how much of what they
 * drew landed nowhere near the letter — filling the whole square would cover
 * every letter perfectly and teach nothing. A stroke has to be both.
 *
 * The thresholds are set for a finger on a phone, not for a calligrapher: the
 * letter is a wide ghost underneath, the line is thick, and there is a margin
 * around the shape that still counts as on it.
 */

/** What one traced glyph came out as, counted in pixels. */
export interface Trace {
  /** Pixels of the letter that the line went over. */
  covered: number
  /** Pixels the letter itself is made of. */
  target: number
  /** Pixels drawn outside the letter and its margin. */
  spilled: number
  /** Pixels drawn in total. */
  drawn: number
}

export interface TraceScore {
  /** How much of the letter was covered, 0…1. */
  coverage: number
  /** How much of the drawing landed nowhere near it, 0…1. */
  spill: number
  verdict: Verdict
}

/*
 * Where "good enough" sits.
 *
 * These were set for a careful hand and they were too tight for the one this
 * is actually for: a five-year-old's finger, on glass, holding a phone with
 * the other hand. A letter that is recognisably the letter should pass, and
 * being told "bijna" for a good try is how a child stops trying.
 */
export const COVER_GOOD = 0.58
export const COVER_CLOSE = 0.34
export const SPILL_GOOD = 0.5
export const SPILL_CLOSE = 0.72

export function scoreTrace(trace: Trace): TraceScore {
  if (trace.drawn <= 0 || trace.target <= 0) return { coverage: 0, spill: 1, verdict: 'fout' }
  const coverage = Math.min(1, trace.covered / trace.target)
  const spill = Math.min(1, trace.spilled / trace.drawn)
  if (coverage >= COVER_GOOD && spill <= SPILL_GOOD) return { coverage, spill, verdict: 'goed' }
  if (coverage >= COVER_CLOSE && spill <= SPILL_CLOSE) return { coverage, spill, verdict: 'bijna' }
  return { coverage, spill, verdict: 'fout' }
}

/** A line thick enough for a finger, scaled to the square it is drawn in. */
export const penWidth = (size: number): number => Math.max(9, Math.round(size * 0.052))

/**
 * How far outside the letter still counts as on it.
 *
 * Wide on purpose. A finger covers the very spot it is drawing on, so a child
 * aims by feel; a millimetre of overshoot is not a mistake, it is a finger.
 */
export const slack = (size: number): number => Math.max(9, Math.round(size * 0.066))

/** The square the masks are compared in — small enough to count in one frame. */
export const MASK = 256

/** True where a pixel of a mask is set. Alpha only: the colour does not matter. */
export const inked = (data: Uint8ClampedArray, i: number): boolean => data[i + 3]! > 60

/** Counts one traced glyph: the learner's ink against the letter and its margin. */
export function countTrace(ink: Uint8ClampedArray, glyph: Uint8ClampedArray, allowed: Uint8ClampedArray): Trace {
  let covered = 0
  let target = 0
  let spilled = 0
  let drawn = 0
  for (let i = 0; i < ink.length; i += 4) {
    const wet = inked(ink, i)
    if (inked(glyph, i)) {
      target++
      if (wet) covered++
    }
    if (wet) {
      drawn++
      if (!inked(allowed, i)) spilled++
    }
  }
  return { covered, target, spilled, drawn }
}
