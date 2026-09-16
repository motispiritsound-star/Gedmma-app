import type { Motief as Key } from '../content/history'

/**
 * One drawing per history card, inside a zellige medallion.
 *
 * Fourteen little pictures rather than fourteen photographs: a photograph of
 * the Qarawiyyin would need a licence, a download and a connection, and none
 * of those survive a plane. These are a handful of paths each, they scale to
 * any size, and they sit in the same drawn world as the film and the mascot.
 *
 * Everything is drawn in a 100×100 box in `currentColor`, so the card decides
 * the colour and the motif only decides the shape.
 */

const line = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 4,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

function Zuilen() {
  return (
    <g {...line}>
      <path d="M14 34h72" />
      <path d="M20 34l30-14 30 14" />
      <path d="M24 42v40M50 42v40M76 42v40" />
      <path d="M18 42h12M44 42h12M70 42h12" />
      <path d="M12 86h76" />
    </g>
  )
}

function Rots() {
  return (
    <g {...line}>
      <path d="M16 74L44 20l14 22 10-8 14 40z" />
      <path d="M8 80c6-4 10-4 16 0s10 4 16 0 10-4 16 0 10 4 16 0 10-4 16 0" />
      <path d="M8 90c6-4 10-4 16 0s10 4 16 0 10-4 16 0 10 4 16 0 10-4 16 0" />
    </g>
  )
}

function Poort() {
  return (
    <g {...line}>
      <path d="M18 88V34a32 32 0 0 1 64 0v54" />
      <path d="M36 88V56a14 14 0 0 1 28 0v32" />
      <path d="M50 42v-8M30 50h-16v38M70 50h16v38" />
      <path d="M14 50l8-8 8 8M70 50l8-8 8 8" />
    </g>
  )
}

function Boek() {
  return (
    <g {...line}>
      <path d="M50 34v46" />
      <path d="M50 34C40 26 24 26 14 30v44c10-4 26-4 36 4" />
      <path d="M50 34c10-8 26-8 36-4v44c-10-4-26-4-36 4" />
      <path d="M22 42h18M22 52h18M60 42h18M60 52h18" strokeWidth="3" opacity=".6" />
      <path d="M50 26V14M44 18l6-6 6 6" />
    </g>
  )
}

function Minaret() {
  return (
    <g {...line}>
      <path d="M36 88V28h28v60" />
      <path d="M32 28l18-14 18 14" />
      <path d="M50 14V4" />
      <circle cx="50" cy="2" r="2" fill="currentColor" />
      <path d="M44 40h12M44 54h12" strokeWidth="3" opacity=".6" />
      <path d="M78 88V62M78 62c-8 0-12-6-12-10 6 0 12 4 12 10zM78 62c8 0 12-6 12-10-6 0-12 4-12 10z" />
      <path d="M10 88h80" />
    </g>
  )
}

function Khamsa() {
  return (
    <g {...line}>
      <path d="M30 52V34a6 6 0 0 1 12 0v14" />
      <path d="M42 48V22a6 6 0 0 1 12 0v26" />
      <path d="M54 48V26a6 6 0 0 1 12 0v26" />
      <path d="M66 52V38a6 6 0 0 1 12 0v26c0 16-10 26-26 26S30 80 30 64V52" />
      <ellipse cx="54" cy="64" rx="9" ry="6" />
      <circle cx="54" cy="64" r="2.5" fill="currentColor" />
    </g>
  )
}

function Kaart() {
  return (
    <g {...line}>
      <circle cx="50" cy="50" r="38" />
      <ellipse cx="50" cy="50" rx="16" ry="38" />
      <path d="M12 50h76M20 30h60M20 70h60" strokeWidth="3" opacity=".7" />
      <path d="M50 26l6 18 18 6-18 6-6 18-6-18-18-6 18-6z" fill="currentColor" stroke="none" opacity=".85" />
    </g>
  )
}

/**
 * Two footprints walking away from you.
 *
 * Filled rather than outlined, unlike everything else here: an outlined foot
 * at this size read as a pair of spectacles, and a journey is the one thing
 * this card cannot afford to be vague about.
 */
function Voetstappen() {
  const foot = (x: number, y: number) => (
    <g transform={`translate(${x} ${y}) rotate(-18)`} fill="currentColor" stroke="none">
      <ellipse cx="0" cy="-17" rx="9.5" ry="17" />
      <circle cx="-7.5" cy="-36" r="3.6" />
      <circle cx="0" cy="-39" r="3.8" />
      <circle cx="7.5" cy="-36" r="3.2" />
    </g>
  )
  return (
    <g {...line}>
      <path d="M6 94c16-6 20-20 34-28s28-18 40-34" strokeWidth="3.5" strokeDasharray="3 9" opacity=".5" />
      {foot(28, 92)}
      {foot(68, 58)}
    </g>
  )
}

function Veer() {
  return (
    <g {...line}>
      <path d="M20 84C34 60 52 34 84 16c4 30-10 52-30 62-10 5-22 6-34 6z" />
      <path d="M34 78C46 56 62 38 78 26" strokeWidth="3" opacity=".7" />
      <path d="M14 90l14-10" />
    </g>
  )
}

function Fontein() {
  return (
    <g {...line}>
      <path d="M50 16v22" />
      <path d="M50 16c-8 4-12 10-12 16M50 16c8 4 12 10 12 16" strokeWidth="3" opacity=".7" />
      <path d="M30 44h40l-4 16H34z" />
      <path d="M14 70h72l-6 18H20z" />
      <path d="M26 70c0-10 10-16 24-16s24 6 24 16" strokeWidth="3" opacity=".6" />
    </g>
  )
}

function Schip() {
  return (
    <g {...line}>
      <path d="M50 16v50" />
      <path d="M50 20c-16 6-22 16-24 26h24zM50 26c14 6 18 14 20 20H50z" />
      <path d="M16 66h68l-10 18H26z" />
      <path d="M8 90c6-4 10-4 16 0s10 4 16 0 10-4 16 0 10 4 16 0 10-4 16 0" strokeWidth="3" opacity=".7" />
    </g>
  )
}

/**
 * A lion, and unmistakably one.
 *
 * The first attempt was a circle inside a circle with four whiskers, which
 * read as a smiley face. The mane is what makes a lion a lion, so it is drawn
 * as a ring of points — inner radius, outer radius, all the way round.
 */
function Leeuw() {
  const points = 16
  const mane = Array.from({ length: points * 2 }, (_, i) => {
    const angle = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2
    const r = i % 2 === 0 ? 45 : 32
    return `${(50 + r * Math.cos(angle)).toFixed(1)} ${(50 + r * Math.sin(angle)).toFixed(1)}`
  }).join('L')

  return (
    <g {...line}>
      <path d={`M${mane}Z`} strokeWidth="3" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="27" />
      {/* ears, peeking over the mane */}
      <path d="M32 33a7 7 0 0 1 9-3M68 33a7 7 0 0 0-9-3" strokeWidth="3" />
      <circle cx="41" cy="46" r="2.8" fill="currentColor" stroke="none" />
      <circle cx="59" cy="46" r="2.8" fill="currentColor" stroke="none" />
      <path d="M45 57h10l-5 5z" fill="currentColor" stroke="none" />
      <path d="M50 62v4M50 66c-3 4-9 3-10-1M50 66c3 4 9 3 10-1" strokeWidth="2.6" />
      <path d="M38 58H26M38 63l-11 3M62 58h12M62 63l11 3" strokeWidth="2.4" opacity=".75" />
    </g>
  )
}

function VlagMotief() {
  return (
    <g {...line}>
      <path d="M26 92V10" />
      <path d="M26 14h56v40H26z" />
      <g transform="translate(54 34) scale(0.16) translate(-50 -50)">
        <path d="M50 2 L78.5 89.7 L3.8 35.5 L96.2 35.5 L21.5 89.7 Z" strokeWidth="9" />
      </g>
      <path d="M14 92h28" />
    </g>
  )
}

function Steen() {
  return (
    <g {...line}>
      <path d="M18 84c-4-16-2-34 8-46s30-16 44-8 18 28 12 44l-6 16H22z" />
      <path d="M40 34v30M34 40l6-6 6 6M34 58l6 6 6-6" strokeWidth="3" />
      <path d="M62 36v28M56 50h12" strokeWidth="3" />
      <path d="M14 92h72" />
    </g>
  )
}

const MOTIEVEN: Record<Key, () => React.JSX.Element> = {
  zuilen: Zuilen,
  rots: Rots,
  poort: Poort,
  boek: Boek,
  minaret: Minaret,
  khamsa: Khamsa,
  kaart: Kaart,
  voetstappen: Voetstappen,
  veer: Veer,
  fontein: Fontein,
  schip: Schip,
  leeuw: Leeuw,
  vlag: VlagMotief,
  steen: Steen,
}

/** The drawing on its own, in whatever colour the caller is using. */
export function Motief({ motief, size = 96, className = '' }: { motief: Key; size?: number; className?: string }) {
  const Drawing = MOTIEVEN[motief]
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={className} aria-hidden="true">
      <Drawing />
    </svg>
  )
}

/**
 * The drawing in its medallion: a khatim-green disc with the eight-pointed
 * zellige rosette behind it, the way a tile panel frames its centre.
 */
export function Medaillon({ motief, size = 132, className = '' }: { motief: Key; size?: number; className?: string }) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" width={size} height={size} className="absolute inset-0" aria-hidden="true">
        {/* two squares at 45° to each other: the simplest zellige rosette */}
        <g fill="currentColor" opacity=".14">
          <rect x="12" y="12" width="76" height="76" rx="10" />
          <rect x="12" y="12" width="76" height="76" rx="10" transform="rotate(45 50 50)" />
        </g>
        <circle cx="50" cy="50" r="33" fill="currentColor" opacity=".12" />
      </svg>
      <Motief motief={motief} size={size * 0.56} className="relative" />
    </span>
  )
}
