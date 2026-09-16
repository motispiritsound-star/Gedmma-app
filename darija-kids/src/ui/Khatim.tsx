/**
 * The khatim: the interlaced five-pointed star from the Moroccan flag.
 *
 * It is not a solid star. The flag draws one unbroken line that crosses
 * itself five times — a seal, not a sticker — and that single stroke is what
 * makes it read as Moroccan rather than as any star on any sticker chart. So
 * it is drawn the same way here: one path, no fill, round joins.
 *
 * It replaces the star everywhere the app rates a lesson, which means a child
 * collects the shape from their own flag instead of a shape from nowhere.
 */

/** Outer points at -90°, -18°, 54°, 126°, 198°, joined every second one. */
const STAR = 'M50 2 L78.5 89.7 L3.8 35.5 L96.2 35.5 L21.5 89.7 Z'

export function Khatim({
  size = 24, filled = true, className = '', title,
}: {
  size?: number
  /** An earned star is drawn in full; an empty one is the same line, faded. */
  filled?: boolean
  className?: string
  title?: string
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role={title ? 'img' : 'presentation'}
      aria-hidden={title ? undefined : true}
      aria-label={title}
    >
      {title && <title>{title}</title>}
      <path
        d={STAR}
        fill="none"
        stroke="currentColor"
        strokeWidth={filled ? 9 : 6}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={filled ? 1 : 0.28}
      />
    </svg>
  )
}

/**
 * Three of them in a row: how well a lesson went.
 *
 * The label carries the number, because five shapes in a line is a picture
 * and a screen reader should be told the score instead of the drawing.
 */
export function Khatims({
  stars, total = 3, size = 28, className = '', label,
}: {
  stars: number
  total?: number
  size?: number
  className?: string
  label: string
}) {
  return (
    <span className={`inline-flex items-center gap-1 text-saffron-500 ${className}`} role="img" aria-label={label}>
      {Array.from({ length: total }, (_, i) => (
        <Khatim key={i} size={size} filled={i < stars} />
      ))}
    </span>
  )
}

/**
 * The flag itself, on a pole, waving.
 *
 * Used where the app wants to say *Morocco* in one small mark: the history
 * cards, the language row, the end of the path. Green on red, and the star
 * drawn by the same single line as everywhere else.
 */
export function Vlag({ size = 40, className = '' }: { size?: number; className?: string }) {
  return (
    <svg viewBox="0 0 60 40" width={size} height={(size / 60) * 40} className={className} aria-hidden="true">
      <rect width="60" height="40" rx="4" fill="#c1272d" />
      <g transform="translate(30 20) scale(0.3) translate(-50 -50)">
        <path d={STAR} fill="none" stroke="#006233" strokeWidth="9" strokeLinejoin="round" strokeLinecap="round" />
      </g>
    </svg>
  )
}
