import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FILM_SCENES } from '../engine/instruments'
import { say, sfx } from '../engine/audio'
import { useT } from '../i18n'

/**
 * The little film after a finished lesson.
 *
 * Nine seconds of Morocco, drawn rather than filmed: no video file, nothing
 * to download, works on a plane. Five scenes take turns, each with its own
 * tune in hijaz and a Darija word spoken at the end — so the reward for
 * finishing a lesson is one more thing to hear the language in, rather than
 * only a number going up.
 *
 * It is skippable from the first frame, it never plays when a learner has
 * asked for calm, and it can be switched off entirely in the settings.
 */

const LENGTH_MS = 9200

/** What Fnek says at the end of each scene, in the language being learnt. */
const PHRASES: { ar: string; tr: string }[] = [
  { ar: 'بصحة', tr: 'bsseha' },
  { ar: 'مزيان', tr: 'mzyan' },
  { ar: 'مرحبا', tr: 'merhba' },
  { ar: 'يالله', tr: 'yallah' },
  { ar: 'عيد مبارك', tr: '3id mubarak' },
]

/** The sky each scene sits under, from top to horizon. */
const SKIES: [string, string][] = [
  ['#ffd79a', '#f0915c'],
  ['#6b4ea8', '#f4a15d'],
  ['#8fd3f4', '#dff1fb'],
  ['#7fd3e8', '#d6f4ef'],
  ['#1b1f4b', '#4b2f6e'],
]

const repeat = { repeat: Infinity, ease: 'easeInOut' } as const

/* ------------------------------------------------------------------- Fnek */

/** The fennec, full length this time, mid-hop and facing where he is going. */
function Fnek({ carrying }: { carrying?: 'thee' | 'bal' | 'jellaba' }) {
  return (
    <g>
      {/* tail, always a beat behind the body */}
      <motion.path
        d="M-16 6c-14 2-22-6-20-16 1-6 7-8 11-3 4 6 6 12 9 15z"
        fill="#f7c873"
        stroke="#e2984a"
        strokeWidth="1"
        style={{ originX: '0px', originY: '0px' }}
        animate={{ rotate: [-10, 10, -10] }}
        transition={{ ...repeat, duration: 0.7 }}
      />
      {/* legs */}
      <motion.g animate={{ rotate: [12, -12, 12] }} style={{ originX: '-2px', originY: '6px' }} transition={{ ...repeat, duration: 0.42 }}>
        <rect x="-6" y="4" width="5" height="14" rx="2.5" fill="#e2984a" />
      </motion.g>
      <motion.g animate={{ rotate: [-12, 12, -12] }} style={{ originX: '6px', originY: '6px' }} transition={{ ...repeat, duration: 0.42 }}>
        <rect x="4" y="4" width="5" height="14" rx="2.5" fill="#e2984a" />
      </motion.g>
      {/* body */}
      <ellipse cx="0" cy="0" rx="14" ry="12" fill="#f7c873" />
      <ellipse cx="2" cy="3" rx="9" ry="7" fill="#fff3e2" />
      {carrying === 'jellaba' && (
        <path d="M-13 -4c4 10 22 10 26 0 2 12-2 18-13 18S-15 8-13-4z" fill="#3fb8a0" opacity=".92" />
      )}
      {/* head */}
      <g transform="translate(9,-14)">
        <path d="M-9 -5C-13-17-10-25-6-24c4 1 6 10 6 16z" fill="#f7c873" />
        <path d="M-7 -6c-3-9-2-14 0-13 2 1 4 7 4 12z" fill="#ffd8b1" />
        <path d="M7 -5C11-17 8-25 4-24c-4 1-6 10-6 16z" fill="#f7c873" />
        <path d="M5 -6c3-9 2-14 0-13-2 1-4 7-4 12z" fill="#ffd8b1" />
        <ellipse cx="0" cy="2" rx="12" ry="11" fill="#f7c873" />
        <ellipse cx="1" cy="5" rx="8" ry="6.5" fill="#fff3e2" />
        <path d="M-5 0c1-2 3-2 4 0" stroke="#2b1d16" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <path d="M4 0c1-2 3-2 4 0" stroke="#2b1d16" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <ellipse cx="1.5" cy="4" rx="2" ry="1.5" fill="#2b1d16" />
        <path d="M-2 6c2 3 6 3 8 0" stroke="#2b1d16" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      </g>
      {carrying === 'thee' && (
        <motion.g animate={{ rotate: [-4, 4, -4] }} style={{ originX: '-14px', originY: '-6px' }} transition={{ ...repeat, duration: 1.1 }}>
          <rect x="-26" y="-10" width="18" height="2.5" rx="1.2" fill="#c9852f" />
          <path d="M-22 -10v-7h4v7zM-16 -10v-5h4v5z" fill="#8fd3f4" opacity=".9" />
        </motion.g>
      )}
      {carrying === 'bal' && (
        <motion.circle
          cx="-22" cy="12" r="6" fill="#fff" stroke="#2b1d16" strokeWidth="1.2"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.9, ease: 'linear' }}
          style={{ originX: '-22px', originY: '12px' }}
        />
      )}
    </g>
  )
}

/** How much bigger than life Fnek is drawn, and what that costs in height. */
const FNEK_SCALE = 1.5
const FOOT = 18 * (FNEK_SCALE - 1)

/** Fnek crossing the stage, bouncing as he goes. `y` is where his feet land. */
function Walk({ carrying, from = -40, to = 460, y = 210 }: {
  carrying?: 'thee' | 'bal' | 'jellaba'
  from?: number
  to?: number
  y?: number
}) {
  return (
    <motion.g
      initial={{ x: from, y: y - FOOT }}
      animate={{ x: to }}
      transition={{ duration: 9, ease: 'linear' }}
    >
      <motion.g animate={{ y: [0, -7, 0] }} transition={{ ...repeat, duration: 0.42 }}>
        <g transform={`scale(${FNEK_SCALE})`}>
          <Fnek carrying={carrying} />
        </g>
      </motion.g>
    </motion.g>
  )
}

/* ---------------------------------------------------------------- scenery */

function Sky({ scene }: { scene: number }) {
  const [top, bottom] = SKIES[scene]!
  return (
    <>
      <defs>
        <linearGradient id={`sky-${scene}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={top} />
          <stop offset="100%" stopColor={bottom} />
        </linearGradient>
      </defs>
      <rect width="400" height="260" fill={`url(#sky-${scene})`} />
    </>
  )
}

function Stars({ count = 26 }: { count?: number }) {
  const dots = useMemo(
    () => Array.from({ length: count }, (_, i) => ({
      x: (i * 61) % 390 + 5,
      y: (i * 37) % 120 + 8,
      r: (i % 3) * 0.5 + 0.8,
      delay: (i % 7) * 0.3,
    })),
    [count],
  )
  return (
    <g fill="#fff">
      {dots.map((d, i) => (
        <motion.circle
          key={i}
          cx={d.x}
          cy={d.y}
          r={d.r}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.4, 1] }}
          transition={{ duration: 3, delay: d.delay, repeat: Infinity }}
        />
      ))}
    </g>
  )
}

/** A string of lanterns, swinging out of step with each other. */
function Lanterns({ y = 34, colours = ['#f59e0b', '#e2603c', '#3fb8a0', '#f7c873'] }: { y?: number; colours?: string[] }) {
  return (
    <g>
      <path d={`M0 ${y - 10}Q200 ${y + 14} 400 ${y - 10}`} stroke="#2b1d16" strokeWidth="1.5" fill="none" opacity=".5" />
      {colours.flatMap((colour, i) =>
        [0, 1].map((half) => {
          const x = 40 + (i * 2 + half) * 45
          const drop = y + 6 + Math.sin((x / 400) * Math.PI) * 12
          return (
            <motion.g
              key={`${i}-${half}`}
              style={{ originX: `${x}px`, originY: `${drop - 8}px` }}
              animate={{ rotate: [-5, 5, -5] }}
              transition={{ ...repeat, duration: 2.4 + (i % 3) * 0.4, delay: half * 0.3 }}
            >
              <line x1={x} y1={drop - 10} x2={x} y2={drop} stroke="#2b1d16" strokeWidth="1" opacity=".5" />
              <path d={`M${x} ${drop}l7 7-7 9-7-9z`} fill={colour} />
              <circle cx={x} cy={drop + 7} r="2.5" fill="#fff8e6" opacity=".75" />
            </motion.g>
          )
        }),
      )}
    </g>
  )
}

function Ground({ fill, y = 214 }: { fill: string; y?: number }) {
  return <rect x="0" y={y} width="400" height={260 - y} fill={fill} />
}

/** Whatever stands still in the distance, drifting past behind the action. */
function Drift({ children, duration = 26 }: { children: React.ReactNode; duration?: number }) {
  return (
    <motion.g animate={{ x: [0, -60] }} transition={{ duration, repeat: Infinity, ease: 'linear' }}>
      {children}
    </motion.g>
  )
}

/* ----------------------------------------------------------------- scenes */

function Souk() {
  return (
    <>
      <Sky scene={0} />
      <Drift>
        <g fill="#b9683f" opacity=".55">
          <rect x="10" y="120" width="70" height="96" rx="6" />
          <rect x="96" y="140" width="54" height="76" rx="6" />
          <rect x="250" y="128" width="64" height="88" rx="6" />
          <rect x="330" y="96" width="26" height="120" rx="6" />
          <path d="M343 96l10-18 10 18z" />
          <rect x="430" y="132" width="60" height="84" rx="6" />
        </g>
      </Drift>
      <Lanterns />
      <Ground fill="#c98a54" />
      {/* two stalls with striped awnings */}
      {[40, 236].map((x, i) => (
        <g key={x}>
          <rect x={x} y="170" width="110" height="46" fill="#8a5a36" />
          <path d={`M${x - 8} 170h126l-10-26H${x + 2}z`} fill="#e2603c" />
          {[0, 1, 2, 3, 4].map((n) => (
            <path key={n} d={`M${x + 4 + n * 24} 170l8-26h10l-8 26z`} fill="#fff3e2" opacity=".85" />
          ))}
          {i === 0
            ? [0, 1, 2, 3].map((n) => <circle key={n} cx={x + 18 + n * 24} cy="182" r="7" fill={['#e2603c', '#f59e0b', '#3fb8a0', '#c0392b'][n]} />)
            : [0, 1, 2].map((n) => <rect key={n} x={x + 14 + n * 32} y="176" width="22" height="14" rx="3" fill={['#f7c873', '#e8d6a0', '#d9a441'][n]} />)}
        </g>
      ))}
      {/* the pot pouring, and the steam off the glass */}
      <g transform="translate(196,150)">
        <motion.g
          style={{ originX: '0px', originY: '10px' }}
          animate={{ rotate: [0, 34, 34, 0] }}
          transition={{ duration: 4, times: [0, 0.25, 0.75, 1], repeat: Infinity }}
        >
          <path d="M-14 0h24a10 10 0 0 1 0 20h-24z" fill="#cbd5e1" />
          <path d="M10 4c10 0 12 8 12 8" stroke="#cbd5e1" strokeWidth="3" fill="none" />
          <rect x="-6" y="-8" width="10" height="8" rx="3" fill="#94a3b8" />
        </motion.g>
        <motion.path
          d="M24 12v26"
          stroke="#a4762f"
          strokeWidth="2"
          animate={{ opacity: [0, 1, 1, 0] }}
          transition={{ duration: 4, times: [0, 0.28, 0.72, 0.8], repeat: Infinity }}
        />
        <path d="M18 38h14l-2 16H20z" fill="#8fd3f4" opacity=".85" />
        {[0, 1, 2].map((i) => (
          <motion.path
            key={i}
            d={`M${21 + i * 4} 36c-3-6 3-8 0-14`}
            stroke="#fff"
            strokeWidth="1.6"
            fill="none"
            opacity=".7"
            animate={{ y: [0, -14], opacity: [0, 0.7, 0] }}
            transition={{ duration: 2.2, delay: i * 0.5, repeat: Infinity }}
          />
        ))}
      </g>
      <Walk carrying="thee" y={206} />
    </>
  )
}

function Sahara() {
  return (
    <>
      <Sky scene={1} />
      <Stars count={30} />
      <motion.g animate={{ y: [0, 18], opacity: [1, 0.85] }} transition={{ duration: 8, ease: 'easeIn' }}>
        <circle cx="300" cy="150" r="34" fill="#ffd79a" />
      </motion.g>
      <path d="M0 176q80-34 150-6t250-14v104H0z" fill="#e6a860" />
      <path d="M0 200q90-30 180 0t220-16v76H0z" fill="#d4874a" />
      <Ground fill="#c2703a" y={230} />
      {/* the camel, unhurried */}
      <g transform="translate(0,190)">
        <motion.g
          initial={{ x: 430 }}
          animate={{ x: -80 }}
          transition={{ duration: 14, ease: 'linear' }}
        >
          <motion.g animate={{ y: [0, -3, 0] }} transition={{ ...repeat, duration: 1.1 }}>
            <path d="M0 0c4-16 14-22 26-22 6-10 16-10 20 0 12 0 22 8 24 22z" fill="#8a5a36" />
            <path d="M60 0c2-10 8-14 14-14 4-8 12-6 12 2 0 6-4 10-10 12z" fill="#8a5a36" />
            <rect x="6" y="0" width="5" height="20" rx="2" fill="#6f4628" />
            <rect x="24" y="0" width="5" height="20" rx="2" fill="#6f4628" />
            <rect x="46" y="0" width="5" height="20" rx="2" fill="#6f4628" />
            <rect x="62" y="0" width="5" height="20" rx="2" fill="#6f4628" />
          </motion.g>
        </motion.g>
      </g>
      <Walk y={224} />
    </>
  )
}

function Chefchaouen() {
  return (
    <>
      <Sky scene={2} />
      <Drift duration={34}>
        <g fill="#5b8fd6" opacity=".5">
          <rect x="0" y="40" width="120" height="180" rx="6" />
          <rect x="140" y="70" width="96" height="150" rx="6" />
          <rect x="260" y="30" width="130" height="190" rx="6" />
          <rect x="420" y="60" width="110" height="160" rx="6" />
        </g>
      </Drift>
      {/* the blue wall, with doors and pots */}
      <rect x="0" y="86" width="400" height="134" fill="#4f9bd9" />
      <rect x="0" y="86" width="400" height="10" fill="#3d7fbb" />
      {[30, 150, 296].map((x) => (
        <g key={x}>
          <path d={`M${x} 200v-46a22 22 0 0 1 44 0v46z`} fill="#2f6fa8" />
          <path d={`M${x + 4} 200v-44a18 18 0 0 1 36 0v44z`} fill="#1f4f7d" />
          <circle cx={x + 36} cy="176" r="2.5" fill="#f7c873" />
        </g>
      ))}
      {[104, 250, 360].map((x, i) => (
        <motion.g key={x} animate={{ rotate: [-2, 2, -2] }} style={{ originX: `${x + 9}px`, originY: '196px' }} transition={{ ...repeat, duration: 2.6, delay: i * 0.4 }}>
          <path d={`M${x} 200l3-16h12l3 16z`} fill="#e2603c" />
          <circle cx={x + 9} cy="180" r="9" fill="#3fb8a0" />
          <circle cx={x + 4} cy="176" r="4" fill="#f59e0b" />
          <circle cx={x + 14} cy="178" r="3.5" fill="#ffd8e6" />
        </motion.g>
      ))}
      {/* steps up the street */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <rect key={i} x={i * 70} y={214 - i * 4} width="72" height={50 + i * 4} fill={i % 2 ? '#bcd8ef' : '#cfe4f5'} />
      ))}
      {/* the cat that lives here */}
      <g transform="translate(330,196)">
        <ellipse cx="0" cy="6" rx="13" ry="8" fill="#5a5148" />
        <circle cx="-9" cy="-4" r="7" fill="#5a5148" />
        <path d="M-14 -8l-1-6 5 3zM-4 -9l1-6-5 3z" fill="#5a5148" />
        <motion.path
          d="M12 4c8-2 10-10 6-14"
          stroke="#5a5148"
          strokeWidth="3.5"
          fill="none"
          strokeLinecap="round"
          style={{ originX: '12px', originY: '4px' }}
          animate={{ rotate: [0, -22, 0] }}
          transition={{ ...repeat, duration: 1.8 }}
        />
      </g>
      <Walk y={212} />
    </>
  )
}

function Kust() {
  return (
    <>
      <Sky scene={3} />
      <circle cx="320" cy="54" r="26" fill="#ffe9a8" />
      {/* gulls */}
      {[{ x: 70, y: 60, d: 0 }, { x: 150, y: 44, d: 0.6 }, { x: 240, y: 70, d: 1.2 }].map((g, i) => (
        <motion.g key={i} animate={{ x: [0, 40, 0], y: [0, -8, 0] }} transition={{ ...repeat, duration: 7, delay: g.d }}>
          <motion.path
            d={`M${g.x} ${g.y}q7-7 13 0q6-7 13 0`}
            stroke="#fff"
            strokeWidth="2.4"
            fill="none"
            strokeLinecap="round"
            animate={{ scaleY: [1, 0.5, 1] }}
            transition={{ ...repeat, duration: 1.2, delay: g.d }}
            style={{ originX: `${g.x + 13}px`, originY: `${g.y}px` }}
          />
        </motion.g>
      ))}
      {/* sea, in two swells */}
      <rect x="0" y="120" width="400" height="70" fill="#2f8fbf" />
      <motion.path
        d="M-40 132q40-12 80 0t80 0t80 0t80 0t80 0v60h-400z"
        fill="#3ba6d4"
        animate={{ x: [0, 40, 0] }}
        transition={{ ...repeat, duration: 5 }}
      />
      <motion.path
        d="M-40 150q40-10 80 0t80 0t80 0t80 0t80 0v44h-400z"
        fill="#57bde0"
        animate={{ x: [0, -40, 0] }}
        transition={{ ...repeat, duration: 4 }}
      />
      {/* the boat */}
      <g transform="translate(0,126)">
        <motion.g
          initial={{ x: 300 }}
          animate={{ x: 120, y: [0, -4, 0] }}
          transition={{ x: { duration: 12, ease: 'linear' }, y: { ...repeat, duration: 2 } }}
        >
          <path d="M0 0h58l-8 14H8z" fill="#e2603c" />
          <rect x="26" y="-26" width="3" height="26" fill="#8a5a36" />
          <path d="M29 -26l20 20H29z" fill="#fff3e2" />
        </motion.g>
      </g>
      <Ground fill="#f2dcae" y={190} />
      {/* the goal, and the shot */}
      <g transform="translate(296,168)">
        <rect x="0" y="0" width="4" height="40" fill="#fff" />
        <rect x="56" y="0" width="4" height="40" fill="#fff" />
        <rect x="0" y="0" width="60" height="4" fill="#fff" />
      </g>
      <motion.g
        initial={{ x: 0, y: 0 }}
        animate={{ x: [0, 120, 262], y: [0, -80, -14] }}
        transition={{ duration: 3.4, delay: 2.6, times: [0, 0.5, 1], ease: 'easeOut' }}
      >
        <circle cx="60" cy="206" r="7" fill="#fff" stroke="#2b1d16" strokeWidth="1.4" />
      </motion.g>
      <Walk carrying="bal" from={-40} to={150} y={204} />
    </>
  )
}

function Feest() {
  return (
    <>
      <Sky scene={4} />
      <Stars count={34} />
      <Lanterns y={44} colours={['#f59e0b', '#e2603c', '#3fb8a0', '#c084fc']} />
      <Lanterns y={92} colours={['#3fb8a0', '#f7c873', '#c084fc', '#e2603c']} />
      <Ground fill="#3b2a56" y={200} />
      {/* darbukas, struck on the beat */}
      {[60, 316].map((x, i) => (
        <g key={x} transform={`translate(${x},158)`}>
          <motion.g
            animate={{ scaleY: [1, 0.94, 1] }}
            transition={{ ...repeat, duration: 1.2, delay: i * 0.6 }}
            style={{ originY: '42px' }}
          >
            <path d="M0 0h34l-6 22-4 20H10L6 22z" fill="#b9683f" />
            <ellipse cx="17" cy="0" rx="17" ry="5" fill="#fff3e2" />
            <path d="M11 24h12l-2 18h-8z" fill="#8a5a36" />
          </motion.g>
        </g>
      ))}
      {/* Fnek dances on the spot instead of crossing */}
      <g transform="translate(200,190)">
        <motion.g
          animate={{ rotate: [-8, 8, -8], y: [0, -10, 0] }}
          transition={{ ...repeat, duration: 0.6 }}
        >
          <g transform={`scale(${FNEK_SCALE})`}>
            <Fnek carrying="jellaba" />
          </g>
        </motion.g>
      </g>
      {/* paper streamers */}
      {Array.from({ length: 14 }, (_, i) => (
        <motion.rect
          key={i}
          x={(i * 29) % 390}
          width="5"
          height="9"
          rx="1.5"
          fill={['#f59e0b', '#3fb8a0', '#e2603c', '#c084fc', '#fff3e2'][i % 5]}
          initial={{ y: -20, rotate: 0 }}
          animate={{ y: 270, rotate: 360 }}
          transition={{ duration: 4 + (i % 4), delay: (i % 6) * 0.5, repeat: Infinity, ease: 'linear' }}
        />
      ))}
    </>
  )
}

const SCENES = [Souk, Sahara, Chefchaouen, Kust, Feest]

/* ------------------------------------------------------------------- film */

export function Film({ scene, onDone }: { scene: number; onDone: () => void }) {
  const t = useT()
  const index = ((scene % FILM_SCENES) + FILM_SCENES) % FILM_SCENES
  const Scene = SCENES[index]!
  // The skip button sits inside the overlay that is itself a skip target, so
  // one tap arrives twice. A ref closes immediately; state would not.
  const left = useRef(false)

  useEffect(() => {
    sfx.film(index)
    // The word lands after the tune, so the two never talk over each other.
    const spoken = setTimeout(() => {
      const phrase = PHRASES[index]!
      say(phrase.ar, { tr: phrase.tr })
    }, 7200)
    const over = setTimeout(() => {
      if (left.current) return
      left.current = true
      onDone()
    }, LENGTH_MS)
    return () => {
      clearTimeout(spoken)
      clearTimeout(over)
    }
  }, [index])

  const skip = () => {
    if (left.current) return
    left.current = true
    sfx.back()
    onDone()
  }

  const phrase = PHRASES[index]!

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col items-stretch justify-center"
      style={{ background: `linear-gradient(${SKIES[index]![0]}, ${SKIES[index]![1]})` }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={skip}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Escape' && skip()}
      aria-label={t.film.overslaan}
    >
      {/* A stage with the drawing's own shape, rather than a picture stretched
          to the phone: on a tall screen "cover" would crop Fnek right off. */}
      <div className="flex flex-1 items-center justify-center p-3">
        <div className="w-full max-w-3xl">
          <div className="w-full overflow-hidden rounded-3xl shadow-2xl" style={{ aspectRatio: '400 / 260' }}>
            <svg viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
              <Scene />
            </svg>
          </div>

          {/* Under the picture rather than over it — and on its own dark strip,
              because two of the five skies are far too light for white text. */}
          <motion.div
            className="mx-auto mt-5 max-w-md rounded-3xl bg-black/35 px-5 py-4 text-center text-white backdrop-blur"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="font-display text-xl font-extrabold sm:text-2xl">{t.film.scenes[index]}</p>
            <motion.p
              className="mt-1 flex items-center justify-center gap-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 7 }}
            >
              <span className="ar text-2xl font-bold">{phrase.ar}</span>
              <span className="font-display font-bold text-saffron-300">{phrase.tr}</span>
            </motion.p>
          </motion.div>
        </div>
      </div>

      <button
        onClick={skip}
        className="absolute end-4 top-4 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white backdrop-blur"
      >
        {t.film.overslaan} ›
      </button>
    </motion.div>
  )
}

/**
 * One scene on its own, at /film/0 … /film/4 while developing.
 *
 * Every scene is otherwise nine seconds at the end of a lesson, which is a
 * long way to walk to check whether a camel is standing on the dune or on the
 * horizon. This route exists only in a dev build.
 */
export function FilmPreview() {
  const { scene = '0' } = useParams()
  const navigate = useNavigate()
  const [round, setRound] = useState(0)
  return (
    <Film
      key={round}
      scene={Number(scene) || 0}
      onDone={() => (Number(scene) < FILM_SCENES - 1 ? navigate(`/film/${Number(scene) + 1}`) : setRound((r) => r + 1))}
    />
  )
}
