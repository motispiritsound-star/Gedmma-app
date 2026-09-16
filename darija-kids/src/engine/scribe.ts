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

export const COVER_GOOD = 0.7
export const COVER_CLOSE = 0.46
export const SPILL_GOOD = 0.4
export const SPILL_CLOSE = 0.62

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

/** How far outside the letter still counts as on it. */
export const slack = (size: number): number => Math.max(7, Math.round(size * 0.048))

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

/* --------------------------------------------------------- stroke order */

export interface StrokePoint {
  /** Where the marker sits, as a fraction of the square. */
  x: number
  y: number
}

/**
 * Where to start, and in what order.
 *
 * Arabic is written right to left, and the single thing a child new to it
 * gets wrong is starting on the left like a Latin letter. So the board gets
 * numbers on it: 1 where the body of the letter begins, then one for each dot.
 *
 * The numbers are read off the ghost rather than stored per letter, which
 * means they are right for whatever the font actually draws — a single
 * letter, one of its joined shapes, or a whole word. The rules are the ones
 * a teacher uses:
 *
 *   · the body first, and the body is the biggest piece of ink;
 *   · a tall narrow body (ا, ل) starts at the top, everything else at its
 *     right-hand end, because that is where the pen lands;
 *   · the dots last, top before bottom and right before left.
 *
 * Specks smaller than half a percent of the ink are noise from the rasteriser
 * and are left out.
 */
export function strokeOrder(glyph: Uint8ClampedArray, n: number): StrokePoint[] {
  const seen = new Uint8Array(n * n)
  const parts: { area: number; minX: number; maxX: number; minY: number; maxY: number; rightY: number; topX: number }[] = []
  let total = 0

  const set = (x: number, y: number) => glyph[(y * n + x) * 4 + 3]! > 60

  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const at = y * n + x
      if (seen[at] || !set(x, y)) continue
      // One blob, walked without recursion: a letter can be a few thousand
      // pixels and a call stack that deep is a crash on a phone.
      const stack = [at]
      seen[at] = 1
      let area = 0
      let minX = n; let maxX = 0; let minY = n; let maxY = 0
      let rightY = 0; let topX = 0
      while (stack.length) {
        const here = stack.pop()!
        const hx = here % n
        const hy = (here - hx) / n
        area++
        if (hx > maxX) { maxX = hx; rightY = hy }
        if (hy < minY) { minY = hy; topX = hx }
        if (hx < minX) minX = hx
        if (hy > maxY) maxY = hy
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const nx = hx + dx
            const ny = hy + dy
            if (nx < 0 || ny < 0 || nx >= n || ny >= n) continue
            const next = ny * n + nx
            if (seen[next] || !set(nx, ny)) continue
            seen[next] = 1
            stack.push(next)
          }
        }
      }
      total += area
      parts.push({ area, minX, maxX, minY, maxY, rightY, topX })
    }
  }

  if (!parts.length) return []
  const big = [...parts].sort((a, b) => b.area - a.area)
  const body = big[0]!
  const tall = (body.maxY - body.minY) > (body.maxX - body.minX) * 1.3

  const points: StrokePoint[] = [
    tall
      ? { x: (body.topX + 0.5) / n, y: (body.minY + 2) / n }
      : { x: (body.maxX - 1) / n, y: (body.rightY + 0.5) / n },
  ]

  const dots = parts
    .filter((part) => part !== body && part.area >= total * 0.005)
    // Right to left, the way the hand travels back over the word to dot it;
    // only two dots at the same place on the line are ordered top to bottom.
    .sort((a, b) => (Math.abs(a.maxX - b.maxX) > n * 0.06 ? b.maxX - a.maxX : a.minY - b.minY))
  // A number parked exactly on a dot hides the dot, and the dot is the thing
  // being pointed at. So each one sits just clear of it, on the far side from
  // the body.
  const bodyMidY = (body.minY + body.maxY) / 2
  const nudge = n * 0.06
  for (const dot of dots.slice(0, 4)) {
    const midY = (dot.minY + dot.maxY) / 2
    const away = midY < bodyMidY ? -nudge : nudge
    points.push({
      x: (dot.minX + dot.maxX) / 2 / n,
      y: Math.min(n - nudge, Math.max(nudge, midY + away)) / n,
    })
  }
  return points
}
