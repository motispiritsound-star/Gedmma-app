import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { allWords, word } from '../content/lexicon'
import { mulberry32, shuffle } from '../engine/random'
import { say, sfx } from '../engine/audio'
import { addXp, getState, gradeWord, useStore } from '../engine/store'
import { Button, Card, SectionTitle, Stat } from '../ui/kit'
import { BonusCard } from './Bonus'
import { Mascot } from '../ui/Mascot'
import { Khatim } from '../ui/Khatim'
import { useLang, useT } from '../i18n'
import { meaningOf } from '../content/localise'

type Game = 'menu' | 'race' | 'memory'

/** Two quick games that use whatever the learner has already met. */
export function Games() {
  const t = useT()
  const [game, setGame] = useState<Game>('menu')
  const seen = useStore((s) => Object.keys(s.cards).length)
  // De spelletjes putten uit de hele woordenschat. Zonder slot zou iemand
  // daarmee alle 304 woorden kunnen oefenen zonder één betaalde les te doen.
  const gekocht = useStore((s) => s.unlocked)

  if (game === 'race') return <TimeRace onExit={() => setGame('menu')} />
  if (game === 'memory') return <Memory onExit={() => setGame('menu')} />

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub={t.games.uitleg}>{t.games.titel}</SectionTitle>

      {/* Not a game, but the same promise: something to do that is not a lesson. */}
      <div className="mb-4"><BonusCard /></div>

      {!gekocht && (
        <Card className="mb-4 flex flex-wrap items-center gap-3 p-4">
          <span className="text-xl" aria-hidden="true">🔒</span>
          <p className="min-w-0 flex-1 text-sm">{t.games.slotUitleg}</p>
          <Link to="/volledig"><Button variant="secondary">{t.unlock.slotKnop}</Button></Link>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex flex-col p-5">
          <span className="text-4xl" aria-hidden="true">⏱️</span>
          <h2 className="mt-2 font-display text-xl font-extrabold">{t.games.race}</h2>
          <p className="flex-1 text-sm text-[var(--ink-soft)]">{t.games.raceUitleg}</p>
          {gekocht
            ? <Button className="mt-4" onClick={() => setGame('race')}>{t.common.start}</Button>
            : <Link to="/volledig" className="mt-4"><Button variant="secondary" className="w-full">🔒 {t.unlock.slotKnop}</Button></Link>}
        </Card>

        <Card className="flex flex-col p-5">
          <span className="text-4xl" aria-hidden="true">🃏</span>
          <h2 className="mt-2 font-display text-xl font-extrabold">{t.games.memory}</h2>
          <p className="flex-1 text-sm text-[var(--ink-soft)]">{t.games.memoryUitleg}</p>
          {gekocht
            ? <Button className="mt-4" onClick={() => setGame('memory')}>{t.common.start}</Button>
            : <Link to="/volledig" className="mt-4"><Button variant="secondary" className="w-full">🔒 {t.unlock.slotKnop}</Button></Link>}
        </Card>

        <Card className="flex flex-col p-5">
          <span className="text-4xl" aria-hidden="true">🔤</span>
          <h2 className="mt-2 font-display text-xl font-extrabold">{t.games.letters}</h2>
          <p className="flex-1 text-sm text-[var(--ink-soft)]">{t.games.lettersUitleg}</p>
          <Link to="/letters" className="mt-4"><Button variant="secondary" className="w-full">{t.games.naarLetters}</Button></Link>
        </Card>

        <Card className="flex flex-col p-5">
          <span className="text-4xl" aria-hidden="true">📖</span>
          <h2 className="mt-2 font-display text-xl font-extrabold">{t.games.verhalen}</h2>
          <p className="flex-1 text-sm text-[var(--ink-soft)]">{t.games.verhalenUitleg}</p>
          <Link to="/verhalen" className="mt-4"><Button variant="secondary" className="w-full">{t.games.naarVerhalen}</Button></Link>
        </Card>
      </div>

      <p className="mt-6 text-center text-sm text-[var(--ink-soft)]">{t.games.gezien(seen)}</p>
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
  const t = useT()
  const lang = useLang()
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

  // Sixty seconds against the clock — announce it like the quiz it is.
  useEffect(() => { sfx.quizStart() }, [round])

  useEffect(() => {
    if (left <= 0) return
    const t = setTimeout(() => setLeft((l) => l - 1), 1000)
    return () => clearTimeout(t)
  }, [left])

  useEffect(() => {
    if (left === 0) {
      addXp(Math.min(30, Math.round(score * 1.5)))
      if (score >= 10) sfx.cheer()
      else sfx.finish()
    }
  }, [left])

  if (left <= 0) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center">
        <Mascot mood="juich" size={120} className="mx-auto" />
        <h1 className="mt-4 font-display text-3xl font-extrabold">{t.games.tijdOm}</h1>
        <div className="mt-4 grid grid-cols-2 gap-3">
          <Stat value={score} label={t.common.goed} emoji="✅" />
          <Stat value={`+${Math.min(30, Math.round(score * 1.5))}`} label={t.common.xp} emoji="⚡" />
        </div>
        <div className="mt-6 space-y-3">
          <Button className="w-full" onClick={() => { setLeft(60); setScore(0); setRound((r) => r + 1) }}>{t.common.nogEenKeer}</Button>
          <Button variant="secondary" className="w-full" onClick={onExit}>{t.common.terug}</Button>
        </div>
      </div>
    )
  }

  const answer = (id: string) => {
    if (chosen) return
    sfx.pick()
    setChosen(id)
    const good = id === target.id
    if (good) {
      setScore((s) => s + 1)
      setStreak((s) => {
        const next = s + 1
        if (next % 5 === 0) sfx.streak()
        return next
      })
      sfx.correct(streak)
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
        <button onClick={() => { sfx.back(); onExit() }} aria-label={t.common.stoppen} className="text-[var(--ink-soft)]">✕</button>
        <span className={left <= 10 ? 'text-terra-500' : ''}>⏱️ {left}s</span>
        <span>✅ {score}{streak >= 3 ? ` 🔥${streak}` : ''}</span>
      </div>

      <Card className="mt-6 p-6 text-center">
        <div className="text-4xl" aria-hidden="true">{target.emoji}</div>
        <div className="ar mt-2 text-4xl font-bold">{target.ar}</div>
        <button className="mt-1 text-sm font-bold text-zellige-600 underline dark:text-zellige-300" onClick={() => say(target.ar, { tr: target.tr })}>
          {target.tr} · {t.games.luisterLink}
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
            {o.emoji} {meaningOf(o, lang)}
          </motion.button>
        ))}
      </div>
    </div>
  )
}

interface Tile { key: string; wordId: string; face: 'ar' | 'nl' }

function Memory({ onExit }: { onExit: () => void }) {
  const t = useT()
  const lang = useLang()
  const [deal, setDeal] = useState(0)
  const tiles = useMemo<Tile[]>(() => {
    const rnd = mulberry32(Date.now() % 65536 + deal)
    // A tile is a small square. "Zorg goed voor jezelf (doei)" does not fit in
    // one and turns the board into a wall of text, so the long ones sit this
    // game out — there are plenty of short words and they make better pairs.
    const past = (w: { phrase?: boolean; id: string }) =>
      !w.phrase && meaningOf(word(w.id), lang).length <= 18
    const bruikbaar = poolOfWords(60).filter(past)
    const chosen = shuffle(bruikbaar.length >= 6 ? bruikbaar : poolOfWords(60).filter((w) => !w.phrase), rnd)
      .slice(0, 6)
    return shuffle(
      chosen.flatMap((w) => [
        { key: `${w.id}-ar`, wordId: w.id, face: 'ar' as const },
        { key: `${w.id}-nl`, wordId: w.id, face: 'nl' as const },
      ]),
      rnd,
    )
  }, [deal, lang])

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
          // Say it once more on the way out: the moment the pair clicks is
          // when the word and its meaning are both in mind.
          setTimeout(() => say(word(pairId).ar, { tr: word(pairId).tr }), 260)
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
        <button onClick={() => { sfx.back(); onExit() }} aria-label={t.common.stoppen} className="text-[var(--ink-soft)]">✕</button>
        <span className="flex items-center gap-2">
          <Khatim size={20} className="text-saffron-500" />
          {found.length}/{tiles.length / 2}
        </span>
        <span>{tries} {t.common.beurten}</span>
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
                tile.face === 'ar' ? (
                  <span className="flex h-full flex-col items-center justify-center gap-0.5">
                    <span className="ar text-lg leading-tight font-bold">{w.ar}</span>
                    {/* Without this the Arabic side is unreadable to a child
                        who is still learning the script, and the pair becomes
                        a coin toss instead of a word. */}
                    <span className="text-[11px] font-extrabold text-zellige-600 dark:text-zellige-300">
                      {w.tr}
                    </span>
                  </span>
                ) : (
                  <span className="flex h-full flex-col items-center justify-center gap-0.5">
                    <span className="text-xl" aria-hidden="true">{w.emoji}</span>
                    <span className="text-[11px] leading-tight font-bold">{meaningOf(w, lang)}</span>
                  </span>
                )
              ) : (
                <Khatim
                  size={34}
                  filled={false}
                  className="mx-auto text-khatim-500/45 dark:text-khatim-300/40"
                />
              )}
            </motion.button>
          )
        })}
      </div>

      {complete && (
        <Card className="mt-6 p-5 text-center">
          <Mascot mood="juich" size={80} className="mx-auto" />
          <p className="mt-2 font-display text-xl font-extrabold">{t.games.allePairs}</p>
          <p className="text-sm text-[var(--ink-soft)]">{t.games.inBeurten(tries, 15)}</p>
          <div className="mt-4 flex justify-center gap-3">
            <Button onClick={() => { setDeal((d) => d + 1); setFound([]); setOpen([]); setTries(0) }}>{t.games.nieuwSpel}</Button>
            <Button variant="secondary" onClick={onExit}>{t.common.terug}</Button>
          </div>
        </Card>
      )}
    </div>
  )
}
