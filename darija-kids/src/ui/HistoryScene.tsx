import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import type { Motief as MotiefKey, Tafereel } from '../content/history'
import { useStore } from '../engine/store'
import { Motief } from './Motief'

/**
 * The moving picture behind a history card.
 *
 * Six backdrops carry fourteen cards, which is on purpose: a drawing made for
 * one card and never seen again is a lot of work for nine seconds, while a
 * coast that comes back for Tariq, al-Idrisi, al-Wazzan and the American
 * ships starts to feel like a place. Everything is SVG, so the fragment
 * weighs nothing, works on a plane and scales to any screen.
 *
 * Nothing here loops forever without reason: a learner who asked for calm
 * (`settings.motion`) gets the same picture standing still.
 */

const repeat = { repeat: Infinity, ease: 'easeInOut' } as const
const drift = (duration: number) => ({ repeat: Infinity, ease: 'linear' as const, duration })

const SKIES: Record<Tafereel, [string, string]> = {
  heuvels: ['#ffd79a', '#f6e2b8'],
  zee: ['#8fd3f4', '#dff1fb'],
  stad: ['#ffc98a', '#f6d9b0'],
  binnenhof: ['#a8dff0', '#e8f6fb'],
  bergen: ['#7fbce8', '#dfeef8'],
  woestijn: ['#f7c873', '#f0a35c'],
}

function Sky({ tafereel, still }: { tafereel: Tafereel; still: boolean }) {
  const [top, bottom] = SKIES[tafereel]
  return (
    <>
      <defs>
        <linearGradient id={`hsky-${tafereel}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#hsky-${tafereel})`} />
      {!still && (
        <motion.circle
          cx="330" cy="54" r="26" fill="#fff6dd" opacity=".75"
          animate={{ opacity: [0.55, 0.85, 0.55] }}
          transition={{ ...repeat, duration: 6 }}
        />
      )}
      {still && <circle cx="330" cy="54" r="26" fill="#fff6dd" opacity=".7" />}
    </>
  )
}

/**
 * A band that slides left and wraps, so the scene never runs out of scenery.
 *
 * Three copies of a 200-wide tile, not two: the group travels 200 to the left,
 * so two copies cover 0…200 at the end of the run and the right-hand third of
 * a 400-wide stage goes bare. The seam was visible in the sea.
 */
function Band({ children, duration, still }: { children: React.ReactNode; duration: number; still: boolean }) {
  if (still) return <g>{children}<g transform="translate(200 0)">{children}</g></g>
  return (
    <motion.g animate={{ x: [0, -200] }} transition={drift(duration)}>
      {children}
      <g transform="translate(200 0)">{children}</g>
      <g transform="translate(400 0)">{children}</g>
    </motion.g>
  )
}

function Birds({ still }: { still: boolean }) {
  if (still) return null
  return (
    <>
      {[0, 1, 2].map((i) => (
        <motion.path
          key={i}
          d="M0 0q4-4 8 0q4-4 8 0"
          stroke="#5b5468"
          strokeWidth="1.6"
          fill="none"
          opacity=".55"
          initial={{ x: -30, y: 40 + i * 14 }}
          animate={{ x: 430 }}
          transition={{ ...drift(16 + i * 4), delay: i * 2.5 }}
        />
      ))}
    </>
  )
}

/* ------------------------------------------------------------- backdrops */

function Heuvels({ still }: { still: boolean }) {
  return (
    <>
      <Sky tafereel="heuvels" still={still} />
      <Birds still={still} />
      <Band duration={44} still={still}>
        <path d="M0 176q50-30 100-4t100-6v94H0z" fill="#a8bd7c" opacity=".7" />
      </Band>
      <path d="M0 196q60-26 120-2t140-10 140 8v68H0z" fill="#8fae62" />
      {/* olive trees, a row of them going past */}
      <Band duration={26} still={still}>
        {[16, 68, 126, 172].map((x) => (
          <g key={x} transform={`translate(${x},206)`}>
            <rect x="-2" y="0" width="4" height="16" fill="#6b5436" />
            <ellipse cx="0" cy="-4" rx="13" ry="10" fill="#6f8f4c" />
          </g>
        ))}
      </Band>
      <rect x="0" y="222" width="400" height="38" fill="#7d9a55" />
    </>
  )
}

function Zee({ still }: { still: boolean }) {
  const waves = [
    { y: 196, fill: '#4a9ccb', duration: 13 },
    { y: 212, fill: '#2f7fb5', duration: 9 },
    { y: 230, fill: '#256a99', duration: 6 },
  ]
  return (
    <>
      <Sky tafereel="zee" still={still} />
      <Birds still={still} />
      {/* the far shore */}
      <path d="M0 182h150l24-26 26 26h200v14H0z" fill="#8aa0ae" opacity=".5" />
      {waves.map((w) => (
        <Band key={w.y} duration={w.duration} still={still}>
          <path d={`M0 ${w.y}q25-9 50 0t50 0 50 0 50 0v50H0z`} fill={w.fill} />
        </Band>
      ))}
      {!still && (
        <motion.g
          initial={{ x: -60 }}
          animate={{ x: 440 }}
          transition={drift(22)}
        >
          <motion.g animate={{ y: [0, -4, 0] }} transition={{ ...repeat, duration: 2.6 }}>
            <path d="M0 190h34l-6 10H6z" fill="#6b4628" />
            <path d="M17 188v-30l18 30z" fill="#fff3e2" />
          </motion.g>
        </motion.g>
      )}
    </>
  )
}

function Stad({ still }: { still: boolean }) {
  return (
    <>
      <Sky tafereel="stad" still={still} />
      <Birds still={still} />
      <Band duration={52} still={still}>
        <g fill="#b9683f" opacity=".45">
          <rect x="6" y="128" width="46" height="92" rx="4" />
          <rect x="60" y="150" width="34" height="70" rx="4" />
          <rect x="104" y="112" width="18" height="108" rx="4" />
          <path d="M107 112l6-12 6 12z" />
          <rect x="134" y="140" width="52" height="80" rx="4" />
        </g>
      </Band>
      <Band duration={30} still={still}>
        <g fill="#c98a54">
          <rect x="0" y="168" width="58" height="54" rx="5" />
          <rect x="66" y="180" width="44" height="42" rx="5" />
          <rect x="120" y="160" width="62" height="62" rx="5" />
          <g fill="#8a5a36">
            <rect x="14" y="192" width="14" height="30" rx="6" />
            <rect x="140" y="188" width="16" height="34" rx="7" />
          </g>
        </g>
      </Band>
      <rect x="0" y="220" width="400" height="40" fill="#a9703f" />
    </>
  )
}

function Binnenhof({ still }: { still: boolean }) {
  return (
    <>
      <Sky tafereel="binnenhof" still={still} />
      {/* an arcade along the back wall */}
      <rect x="0" y="92" width="400" height="118" fill="#e8d6a0" />
      {[10, 90, 170, 250, 330].map((x) => (
        <path key={x} d={`M${x} 210v-58a30 30 0 0 1 60 0v58z`} fill="#c0a06a" />
      ))}
      <rect x="0" y="86" width="400" height="10" fill="#c9a86d" />
      {/* lanterns, each on its own swing */}
      {[60, 200, 340].map((x, i) => (
        <motion.g
          key={x}
          style={{ originX: `${x}px`, originY: '86px' }}
          animate={still ? {} : { rotate: [-5, 5, -5] }}
          transition={{ ...repeat, duration: 2.6 + i * 0.5 }}
        >
          <line x1={x} y1="96" x2={x} y2="112" stroke="#8a5a36" strokeWidth="1.4" />
          <path d={`M${x} 112l7 7-7 10-7-10z`} fill="#f59e0b" />
        </motion.g>
      ))}
      {/* the pool, with a jet that keeps going */}
      <rect x="0" y="210" width="400" height="50" fill="#b99a63" />
      <ellipse cx="200" cy="234" rx="88" ry="20" fill="#7fc9e0" />
      <ellipse cx="200" cy="234" rx="88" ry="20" fill="none" stroke="#c9a86d" strokeWidth="4" />
      {!still && [0, 1, 2].map((i) => (
        <motion.circle
          key={i}
          cx="200" cy="226" r="2.4" fill="#e8f6fb"
          animate={{ y: [-16, 8], opacity: [0, 0.9, 0] }}
          transition={{ duration: 1.6, delay: i * 0.5, repeat: Infinity }}
        />
      ))}
    </>
  )
}

function Bergen({ still }: { still: boolean }) {
  return (
    <>
      <Sky tafereel="bergen" still={still} />
      <Birds still={still} />
      <Band duration={60} still={still}>
        <path d="M0 200l48-72 34 44 30-30 46 58z" fill="#8fa5b6" opacity=".6" />
      </Band>
      <path d="M0 214l70-96 40 50 28-26 54 72 64-52 74 52v46H0z" fill="#6d7f8f" />
      <path d="M70 118l16 22H54zM212 136l14 18h-28z" fill="#f4f8fb" />
      <rect x="0" y="212" width="400" height="48" fill="#5c6c79" />
      {/* a bird of prey, circling rather than crossing */}
      {!still && (
        <motion.path
          d="M0 0q7-7 14 0q7-7 14 0"
          stroke="#2b1d16" strokeWidth="2" fill="none" opacity=".7"
          initial={{ x: 80, y: 60 }}
          animate={{ x: [80, 300, 80], y: [60, 40, 60] }}
          transition={{ ...repeat, duration: 18 }}
        />
      )}
    </>
  )
}

function Woestijn({ still }: { still: boolean }) {
  return (
    <>
      <Sky tafereel="woestijn" still={still} />
      <path d="M0 178q80-32 150-4t250-12v98H0z" fill="#e6a860" />
      <Band duration={38} still={still}>
        <path d="M0 202q50-22 100 0t100 0v58H0z" fill="#d4874a" />
      </Band>
      <rect x="0" y="230" width="400" height="30" fill="#c2703a" />
      {/* a caravan, small and unhurried, the way a caravan is */}
      {!still && (
        <motion.g initial={{ x: 300 }} animate={{ x: -110 }} transition={drift(22)}>
          {[0, 80, 160].map((dx, i) => (
            // The bob lives on an inner group: framer writes its own
            // `transform`, so a `transform` prop next to an animated `y` is
            // thrown away — which parked the whole caravan above the sky.
            <g key={dx} transform={`translate(${dx},198) scale(0.82)`}>
            <motion.g
              animate={{ y: [0, -2, 0] }}
              transition={{ ...repeat, duration: 1.2, delay: i * 0.25 }}
            >
              <path d="M0 0c3-11 10-15 18-15 4-7 11-7 14 0 8 0 15 6 17 15z" fill="#8a5a36" />
              <path d="M42 0c1-7 5-10 10-10 3-5 8-4 8 2 0 4-3 7-7 8z" fill="#8a5a36" />
              <rect x="5" y="0" width="3" height="14" fill="#6f4628" />
              <rect x="17" y="0" width="3" height="14" fill="#6f4628" />
              <rect x="33" y="0" width="3" height="14" fill="#6f4628" />
              <rect x="44" y="0" width="3" height="14" fill="#6f4628" />
            </motion.g>
            </g>
          ))}
        </motion.g>
      )}
    </>
  )
}

const BACKDROPS: Record<Tafereel, (p: { still: boolean }) => React.JSX.Element> = {
  heuvels: Heuvels, zee: Zee, stad: Stad, binnenhof: Binnenhof, bergen: Bergen, woestijn: Woestijn,
}

/* ------------------------------------------------------- the drawn motif */

/**
 * The motif, drawing itself.
 *
 * Every `<path>` is measured with `getTotalLength` — the one method every
 * engine has agreed on for years — and then dashed out and pulled back in.
 * Shapes that are not paths simply fade, and a browser that refuses to
 * measure anything shows the finished drawing, which is the point anyway.
 */
function Tekening({ motief, size, still }: { motief: MotiefKey; size: number; still: boolean }) {
  const host = useRef<SVGGElement>(null)

  useEffect(() => {
    if (still) return
    const root = host.current
    if (!root) return
    const paths = [...root.querySelectorAll('path')]
    const others = [...root.querySelectorAll<SVGElement>('circle, ellipse, rect')]
    const running: Animation[] = []
    try {
      paths.forEach((path, i) => {
        const length = path.getTotalLength()
        if (!length) return
        path.style.strokeDasharray = `${length}`
        path.style.strokeDashoffset = `${length}`
        running.push(path.animate(
          [{ strokeDashoffset: length }, { strokeDashoffset: 0 }],
          { duration: 780, delay: 260 + i * 130, easing: 'ease-out', fill: 'forwards' },
        ))
      })
      others.forEach((shape, i) => {
        shape.setAttribute('opacity', '0')
        running.push(shape.animate(
          [{ opacity: 0 }, { opacity: 1 }],
          { duration: 320, delay: 620 + i * 110, easing: 'ease-out', fill: 'forwards' },
        ))
      })
    } catch {
      // A browser that cannot measure a path shows the drawing whole.
      for (const el of [...paths, ...others]) {
        el.style.strokeDasharray = ''
        el.removeAttribute('opacity')
      }
    }
    return () => { for (const a of running) a.cancel() }
  }, [motief, still])

  return (
    <g ref={host}>
      <Motief motief={motief} size={size} />
    </g>
  )
}

/* ------------------------------------------------------------- the scene */

/**
 * One fragment: a moving backdrop with the card's drawing growing on top.
 *
 * `beat` lets the card lift the medallion aside once the story starts, so the
 * words have room without a cut.
 */
export function HistoryScene({
  tafereel, motief, beat,
}: {
  tafereel: Tafereel
  motief: MotiefKey
  /** 0 while the drawing is being made, 1 once the telling has begun. */
  beat: 0 | 1
}) {
  const calm = useStore((s) => s.settings.motion) !== 'full'
  const Backdrop = BACKDROPS[tafereel]
  const medallion = 132

  return (
    <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid slice" className="h-full w-full" aria-hidden="true">
      <Backdrop still={calm} />
      {/* `fill-box` is what keeps an SVG group growing around its own centre;
          without it the scale hangs off the viewBox origin and the medallion
          wanders off to the right as the story starts. */}
      <motion.g
        initial={{ scale: 0.86, opacity: 0 }}
        animate={{ scale: beat === 0 ? 1 : 0.74, opacity: 1, y: beat === 0 ? 0 : -18 }}
        transition={{ type: 'spring', stiffness: 90, damping: 18 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
      >
        <g transform={`translate(${200 - medallion / 2} ${130 - medallion / 2})`}>
          <g transform={`scale(${medallion / 100})`}>
            <circle cx="50" cy="50" r="46" fill="#fffaf0" opacity=".9" />
            <circle cx="50" cy="50" r="46" fill="none" stroke="#006233" strokeWidth="3" opacity=".8" />
          </g>
          <g transform={`translate(${medallion * 0.22} ${medallion * 0.22})`} className="text-khatim-500">
            <Tekening motief={motief} size={medallion * 0.56} still={calm} />
          </g>
        </g>
      </motion.g>
    </svg>
  )
}
