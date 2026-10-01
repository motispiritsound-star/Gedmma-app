import { useCallback, useEffect, useRef, useState } from 'react'
import {
  countTrace, MASK, penWidth, scoreTrace, slack, type TraceScore,
} from '../engine/scribe'
import { sfx } from '../engine/audio'
import { Button } from './kit'
import { useT } from '../i18n'

/**
 * Writing a letter by drawing over it.
 *
 * The glyph is painted underneath in grey and the child draws on top of it —
 * tracing, not copying, because a five-year-old who has never held a pen in
 * this direction needs the line to follow before they need a blank page. What
 * is measured is where the ink went: how much of the letter it covered, and
 * how much of it landed somewhere else. Both of those are counted against the
 * letter as the font draws it, so a word in three joined shapes is graded the
 * same way a single letter is.
 *
 * Deliberately not a handwriting recogniser. There is no model here, nothing
 * is uploaded, and a child who traces the shape gets it right — which is the
 * skill this is teaching.
 */

/** How big the drawing square is, in CSS pixels, before it is capped by width. */
const BOARD = 320

/** Paints the glyph into a square context, centred and scaled to fit. */
function paintGlyph(
  ctx: CanvasRenderingContext2D, n: number, glyph: string, fill: string, outline = 0,
): void {
  ctx.clearRect(0, 0, n, n)
  const base = Math.round(n * 0.6)
  ctx.font = `700 ${base}px "Noto Naskh Arabic", serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  const measured = ctx.measureText(glyph)
  const width = Math.max(measured.width, 1)
  const height = Math.max(
    (measured.actualBoundingBoxAscent ?? base * 0.8) + (measured.actualBoundingBoxDescent ?? base * 0.25),
    1,
  )
  const room = n * 0.78
  const scale = Math.min(room / width, room / height, 1.6)

  ctx.save()
  ctx.translate(n / 2, n / 2)
  ctx.scale(scale, scale)
  ctx.fillStyle = fill
  if (outline > 0) {
    // The margin that still counts as "on the letter": the same shape, drawn
    // once with a fat pen around it.
    ctx.strokeStyle = fill
    ctx.lineJoin = 'round'
    ctx.lineWidth = (outline * 2) / scale
    ctx.strokeText(glyph, 0, 0)
  }
  ctx.fillText(glyph, 0, 0)
  ctx.restore()
}

const square = (n: number): CanvasRenderingContext2D => {
  const canvas = document.createElement('canvas')
  canvas.width = n
  canvas.height = n
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('geen 2d-context')
  return ctx
}

export function Scribe({
  glyph, hint, locked, onDone,
}: {
  /** The Arabic to trace: one letter in one of its shapes, or a whole word. */
  glyph: string
  /** The line above the board. */
  hint: string
  locked: boolean
  onDone: (score: TraceScore) => void
}) {
  const t = useT()
  const board = useRef<HTMLCanvasElement>(null)
  /** Where the child's ink lives, at mask resolution, for the counting. */
  const ink = useRef<CanvasRenderingContext2D | null>(null)
  const drawing = useRef(false)
  /**
   * De kleur van de haal, uit `--inkt-tekenen`.
   *
   * Hij stond hier met de hand ingetypt, op de oude waarde van
   * `--color-zellige-600`, en bleef achter toen die donkerder werd voor het
   * contrast. Op het witte vak haalde die inkt 2,99 op 1 -- net onder de drie
   * die je nodig hebt om je eigen haal te zien. Nagemeten na de reparatie:
   * 4,11 licht en 8,00 donker, want in de donkere stand is een donkere inkt
   * juist verkeerd.
   *
   * Eén keer uitgelezen bij het schoonvegen en niet bij elke haal: `stroke`
   * draait per muisbeweging, en `getComputedStyle` is daar te duur voor.
   */
  const inkt = useRef('#0f766e')
  /** Where the pen starts, and where it goes next. Redrawn over the ink. */
  const last = useRef<{ x: number; y: number } | null>(null)
  const [drawn, setDrawn] = useState(false)
  const [ready, setReady] = useState(false)
  const [size, setSize] = useState(BOARD)

  /** Clears the board back to the ghost, and the ink with it. */
  const wipe = useCallback(() => {
    const canvas = board.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 3)
    canvas.width = size * dpr
    canvas.height = size * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.clearRect(0, 0, size, size)
    inkt.current = getComputedStyle(canvas).getPropertyValue('--inkt-tekenen').trim() || inkt.current
    paintGlyph(ctx, size, glyph, 'rgba(120,113,108,.26)')

    ink.current?.clearRect(0, 0, MASK, MASK)
    setDrawn(false)
  }, [glyph, size])

  // Both fonts have to be there before anything is measured: a glyph drawn in
  // the fallback serif would be graded against the wrong shape.
  useEffect(() => {
    let alive = true
    const load = async () => {
      try {
        await document.fonts.load('700 200px "Noto Naskh Arabic"')
        await document.fonts.ready
      } catch {
        /* an old browser: the fallback font still draws something */
      }
      if (alive) setReady(true)
    }
    void load()
    return () => { alive = false }
  }, [])

  // The board is square and never wider than the screen.
  useEffect(() => {
    const fit = () => setSize(Math.min(BOARD, Math.max(220, window.innerWidth - 72)))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])

  useEffect(() => {
    if (!ready) return
    ink.current ??= square(MASK)
    wipe()
  }, [ready, wipe])

  const at = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return { x: (e.clientX - rect.left) / rect.width, y: (e.clientY - rect.top) / rect.height }
  }

  const stroke = (from: { x: number; y: number }, to: { x: number; y: number }) => {
    const ctx = board.current?.getContext('2d')
    if (ctx) {
      // `save`/`restore` eromheen, want `globalAlpha` blijft anders staan en
      // de voorbeeldletter wordt bij de volgende schoonveeg op 0,85 van zijn
      // eigen 0,26 getekend. De 85% zelf blijft: een haal die iets doorlaat
      // laat de letter eronder zien, en dat is precies waar je op mikt.
      ctx.save()
      ctx.globalAlpha = 0.85
      ctx.strokeStyle = inkt.current
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = penWidth(size)
      ctx.beginPath()
      ctx.moveTo(from.x * size, from.y * size)
      ctx.lineTo(to.x * size, to.y * size)
      ctx.stroke()
      ctx.restore()
    }
    const mask = ink.current
    if (mask) {
      mask.strokeStyle = '#000'
      mask.lineCap = 'round'
      mask.lineJoin = 'round'
      mask.lineWidth = penWidth(MASK)
      mask.beginPath()
      mask.moveTo(from.x * MASK, from.y * MASK)
      mask.lineTo(to.x * MASK, to.y * MASK)
      mask.stroke()
    }
  }

  const down = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (locked || !ready) return
    // Keeps the line going when a finger slides off the square. Not every
    // pointer can be captured, and one that cannot still draws.
    try { e.currentTarget.setPointerCapture(e.pointerId) } catch { /* nothing to capture */ }
    drawing.current = true
    const point = at(e)
    last.current = point
    // A tap is a dot, not nothing.
    stroke(point, point)
    setDrawn(true)
  }

  const move = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing.current || locked) return
    const point = at(e)
    if (last.current) stroke(last.current, point)
    last.current = point
  }

  const up = () => {
    drawing.current = false
    last.current = null
  }

  const check = () => {
    const mask = ink.current
    if (!mask || !drawn || locked) return
    sfx.pick()
    const target = square(MASK)
    paintGlyph(target, MASK, glyph, '#000')
    const allowed = square(MASK)
    paintGlyph(allowed, MASK, glyph, '#000', slack(MASK))

    const score = scoreTrace(countTrace(
      mask.getImageData(0, 0, MASK, MASK).data,
      target.getImageData(0, 0, MASK, MASK).data,
      allowed.getImageData(0, 0, MASK, MASK).data,
    ))
    onDone(score)
  }

  return (
    <div>
      <p className="mb-3 font-display text-lg font-extrabold text-[var(--ink-soft)]">{hint}</p>

      <div className="flex justify-center">
        <canvas
          ref={board}
          role="img"
          aria-label={t.bonus.schrijfLabel(glyph)}
          onPointerDown={down}
          onPointerMove={move}
          onPointerUp={up}
          onPointerCancel={up}
          onPointerLeave={up}
          style={{ width: size, height: size, touchAction: 'none' }}
          className="rounded-3xl border-2 border-dashed border-[var(--line)] bg-[var(--surface-raised)]"
        />
      </div>

      <p className="mt-3 text-center text-xs text-[var(--ink-soft)]">
        {t.bonus.volgorde} · {t.bonus.schrijfHint}
      </p>

      <div className="mt-4 flex gap-3">
        <Button variant="secondary" className="flex-1" sound="back" disabled={locked || !drawn} onClick={wipe}>
          {t.bonus.wissen}
        </Button>
        <Button className="flex-1" disabled={locked || !drawn} onClick={check}>{t.lesson.controleer}</Button>
      </div>
    </div>
  )
}
