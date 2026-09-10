import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { allWords, word } from '../content/lexicon'
import { mulberry32, shuffle } from '../engine/random'
import { say, sfx } from '../engine/audio'
import { addXp, getState, gradeWord, useStore } from '../engine/store'
import { Button, Card, SectionTitle, Stat } from '../ui/kit'
import { Mascot } from '../ui/Mascot'

type Game = 'menu' | 'race' | 'memory'

/** Two quick games that use whatever the learner has already met. */
export function Games() {
  const [game, setGame] = useState<Game>('menu')
  const seen = useStore((s) => Object.keys(s.cards).length)

  if (game === 'race') return <TimeRace onExit={() => setGame('menu')} />
  if (game === 'memory') return <Memory onExit={() => setGame('menu')} />

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub="Even geen les — gewoon spelen. Alles wat je hier tegenkomt telt mee voor je woorden.">
        Spelen
      </SectionTitle>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col p-5">
          <span className="text-4xl" aria-hidden="true">⏱️</span>
          <h2 className="mt-2 font-display text-xl font-extrabold">Tijdrace</h2>
          <p className="flex-1 text-sm text-[var(--ink-soft)]">
            Zestig seconden. Hoeveel woorden herken je? Elke goede kost minder tijd dan een foute.
          </p>
          <Button className="mt-4" onClick={() => setGame('race')}>Start</Button>
        </Card>

        <Card className="flex flex-col p-5">
          <span className="text-4xl" aria-hidden="true">🃏</span>
          <h2 className="mt-2 font-display text-xl font-extrabold">Geheugenspel</h2>
          <p className="flex-1 text-sm text-[var(--ink-soft)]">
            Zoek de paren: het Darija-woord en de Nederlandse betekenis liggen omgedraaid op tafel.
          </p>
          <Button className="mt-4" onClick={() => setGame('memory')}>Start</Button>
        </Card>

        <Card className="flex flex-col p-5">
          <span className="text-4xl" aria-hidden="true">🔤</span>
          <h2 className="mt-2 font-display text-xl font-extrabold">Letterspel</h2>
          <p className="flex-1 text-sm text-[var(--ink-soft)]">Herken de Arabische letters aan hun naam.</p>
          <Link to="/letters" className="mt-4"><Button variant="secondary" className="w-full">Naar de letters</Button></Link>
        </Card>

        <Card className="flex flex-col p-5">
          <span className="text-4xl" aria-hidden="true">📖</span>
          <h2 className="mt-2 font-display text-xl font-extrabold">Verhalen</h2>
          <p className="flex-1 text-sm text-[var(--ink-soft)]">Lees een gesprek en beantwoord de vragen.</p>
          <Link to="/verhalen" className="mt-4"><Button variant="secondary" className="w-full">Naar de verhalen</Button></Link>
        </Card>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">
        Je hebt {seen} woorden gezien. De spellen kiezen daar zoveel mogelijk uit.
      </p>
    </div>
  )
}

/** Words the learner has met, topped up with the basics if that is too few. */
function poolOfWords(count = 40) {
  const seen = Object.keys(getState().cards)
  const pool = seen.length >= 12 ? seen.map(word) : allWords.slice(0, 60)
  return pool.slice(0, Math.max(count, 12))
}

function TimeRace({ onExit }: { onExit: () => void }) {
  const [left, setLeft] = useState(60)
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [round, setRound] = useState(0)
  const [chosen, setChosen] = useState<string | null>(null)

  const pool = useMemo(() => poolOfWords(), [])
  const rnd = useMemo(() => mulberry32(Date.now() % 100000 + round * 7), [round])
  const target = useMemo(() => shuffle(pool, rnd)[0]!, [round])
  const options = useMemo(
    () => shuffle([target, ...shuffle(pool.filter((w) => w.id !== target.id), rnd).slice(0, 3)], rnd),
    [round],
  )

  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  useEffect(() => {
    if (left === 0) {
      addXp(Math.min(30, Math.round(score * 1.5)))
      sfx.finish()
    }
  }, [left])

  if (left <= 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <Mascot mood="juich" size={120} className="mx-auto" />
        <h1 className="mt-4 font-display text-3xl font-extrabold">Tijd om!</h1>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat value={score} label="goed" emoji="✅" />
          <Stat value={`+${Math.min(30, Math.round(score * 1.5))}`} label="XP" emoji="⚡" />
        </div>
        <div className="mt-6 space-y-3">
          <Button className="w-full" onClick={() => { setLeft(60); setScore(0); setRound((r) => r + 1) }}>Nog een keer</Button>
          <Button variant="secondary" className="w-full" onClick={onExit}>Terug</Button>
        </div>
      </div>
    )
  }

  const answer = (id: string) => {
    if (chosen) return
    setChosen(id)
    const good = id === target.id
    if (good) {
      setScore((s) => s + 1)
      setStreak((s) => {
        const next = s + 1
        if (next % 5 === 0) sfx.streak()
        return next
      })
      sfx.correct()
      gradeWord(target.id, 'goed')
    } else {
      setStreak(0)
      setLeft((l) => Math.max(0, l - 3))
      sfx.wrong()
      gradeWord(target.id, 'fout')
    }
    setTimeout(() => { setChosen(null); setRound((r) => r + 1) }, good ? 260 : 650)
  }

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="flex items-center justify-between font-display text-lg font-extrabold">
        <button onClick={onExit} aria-label="Stoppen" className="text-[var(--ink-soft)]">✕</button>
        <span className={left <= 10 ? 'text-terra-500' : ''}>⏱️ {left}s</span>
        <span>✅ {score}{streak >= 3 ? ` 🔥${streak}` : ''}</span>
      </div>

      <Card className="mt-6 p-6 text-center">
        <div className="text-4xl" aria-hidden="true">{target.emoji}</div>
        <div className="ar mt-2 text-4xl font-bold">{target.ar}</div>
        <button className="mt-1 text-sm font-bold text-zellige-600 underline dark:text-zellige-300" onClick={() => say(target.ar, { tr: target.tr })}>
          {target.tr} · luister
        </button>
      </Card>

      <div className="mt-4 grid gap-2">
        {options.map((o) => (
          <motion.button
            key={o.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => answer(o.id)}
            className={`btn3d rounded-2xl border-2 p-3 text-start font-semibold ${
              chosen && o.id === target.id ? 'border-mint-500 bg-mint-500/15'
              : chosen === o.id ? 'border-terra-500 bg-terra-500/15'
              : 'border-[var(--line)] bg-[var(--surface-raised)]'
            }`}
          >
            {o.emoji} {o.nl}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

interface Tile { key: string; wordId: string; face: 'ar' | 'nl' }

function Memory({ onExit }: { onExit: () => void }) {
  const [deal, setDeal] = useState(0)
  const tiles = useMemo<Tile[]>(() => {
    const rnd = mulberry32(Date.now() % 65536 + deal)
    const chosen = shuffle(poolOfWords(60).filter((w) => !w.phrase), rnd).slice(0, 6)
    return shuffle(
      chosen.flatMap((w) => [
        { key: `${w.id}-ar`, wordId: w.id, face: 'ar' as const },
        { key: `${w.id}-nl`, wordId: w.id, face: 'nl' as const },
      ]),
      rnd,
    )
  }, [deal])

  const [open, setOpen] = useState<string[]>([])
  const [found, setFound] = useState<string[]>([])
  const [tries, setTries] = useState(0)

  const flip = (tile: Tile) => {
    if (found.includes(tile.wordId) || open.includes(tile.key) || open.length === 2) return
    sfx.tap()
    if (tile.face === 'ar') say(word(tile.wordId).ar, { tr: word(tile.wordId).tr })
    const next = [...open, tile.key]
    setOpen(next)
    if (next.length === 2) {
      setTries((t) => t + 1)
      const [a, b] = next
      const same = a!.split('-')[0] === b!.split('-')[0] && a !== b
      const pairId = tiles.find((t) => t.key === a)!.wordId
      const matched = same && tiles.find((t) => t.key === b)!.wordId === pairId
      setTimeout(() => {
        if (matched) {
          setFound((f) => [...f, pairId])
          gradeWord(pairId, 'goed')
          sfx.match()
        } else sfx.wrong()
        setOpen([])
      }, matched ? 300 : 800)
    }
  }

  const complete = found.length === tiles.length / 2

  useEffect(() => {
    if (complete) { addXp(15); sfx.finish() }
  }, [complete])

  return (
    <div className="mx-auto max-w-md px-4 py-6">
      <div className="flex items-center justify-between font-display text-lg font-extrabold">
        <button onClick={onExit} aria-label="Stoppen" className="text-[var(--ink-soft)]">✕</button>
        <span>🃏 {found.length}/{tiles.length / 2}</span>
        <span>{tries} beurten</span>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-2.5">
        {tiles.map((tile) => {
          const w = word(tile.wordId)
          const shown = open.includes(tile.key) || found.includes(tile.wordId)
          return (
            <motion.button
              key={tile.key}
              whileTap={{ scale: 0.95 }}
              onClick={() => flip(tile)}
              className={`aspect-square rounded-2xl border-2 p-2 text-center transition ${
                found.includes(tile.wordId) ? 'border-mint-500 bg-mint-500/15'
                : shown ? 'border-zellige-500 bg-[var(--surface-raised)]'
                : 'border-[var(--line)] bg-gradient-to-br from-zellige-500/20 to-saffron-500/20'
              }`}
            >
              {shown ? (
                tile.face === 'ar'
                  ? <span className="ar text-lg font-bold">{w.ar}</span>
                  : <span className="text-sm font-bold">{w.emoji} {w.nl}</span>
              ) : (
                <span className="text-2xl" aria-hidden="true">🌟</span>
              )}
            </motion.button>
          )
        })}
      </div>

      {complete && (
        <Card className="mt-6 p-5 text-center">
          <Mascot mood="juich" size={80} className="mx-auto" />
          <p className="mt-2 font-display text-xl font-extrabold">Alle paren gevonden!</p>
          <p className="text-sm text-[var(--ink-soft)]">In {tries} beurten · +15 XP</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={() => { setDeal((d) => d + 1); setFound([]); setOpen([]); setTries(0) }}>Nieuw spel</Button>
            <Button variant="secondary" onClick={onExit}>Terug</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
