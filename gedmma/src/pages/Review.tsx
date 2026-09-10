import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { buildReviewRound } from '../engine/exercises'
import { addXp, dueWordIds, getState, useStore } from '../engine/store'
import { strengthLabel } from '../engine/srs'
import { word } from '../content/lexicon'
import { Button, Card, SectionTitle, Stat } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { RoundRunner, type RoundResult } from '../ui/Round'
import { sfx } from '../engine/audio'

/**
 * Herhalen: whatever the scheduler says is due, in a round without hearts.
 * Review should never be the thing that stops you from practising.
 */
export function Review() {
  const navigate = useNavigate()
  const state = useStore((s) => s)
  const due = dueWordIds(state)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<RoundResult | null>(null)
  const exercises = useMemo(() => buildReviewRound(due, Date.now()), [running])

  if (running) {
    return (
      <RoundRunner
        exercises={exercises}
        useHearts={false}
        quitLabel="Stoppen met herhalen?"
        onQuit={() => setRunning(false)}
        onFinish={(r) => {
          addXp(Math.round(5 + r.score * 10))
          sfx.finish()
          setRunning(false)
          setResult(r)
        }}
      />
    )
  }

  const weakest = Object.values(state.cards)
    .sort((a, b) => a.strength - b.strength)
    .slice(0, 8)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <SectionTitle sub="Woorden komen terug net voordat je ze vergeet. Dat is het hele idee.">
        Herhalen
      </SectionTitle>

      {result && (
        <Card className="mb-6 flex items-center gap-4 p-5">
          <Mascot mood="juich" size={64} />
          <div>
            <p className="font-display text-lg font-extrabold">Ronde klaar — {Math.round(result.score * 100)}% goed</p>
            <p className="text-sm text-[var(--ink-soft)]">Nog {dueWordIds(getState()).length} woorden in de wachtrij.</p>
          </div>
        </Card>
      )}

      <div className="mb-6 grid grid-cols-3 gap-3">
        <Stat value={due.length} label="nu te herhalen" emoji="⏰" />
        <Stat value={Object.keys(state.cards).length} label="woorden gezien" emoji="📚" />
        <Stat value={Object.values(state.cards).filter((c) => c.strength >= 0.85).length} label="vastgezet" emoji="🔒" />
      </div>

      {due.length === 0 ? (
        <Card className="p-6 text-center">
          <Mascot mood="slaap" size={90} className="mx-auto" />
          <p className="mt-3 font-display text-xl font-extrabold">Niets te herhalen</p>
          <p className="mt-1 text-[var(--ink-soft)]">
            Kom later terug, of leer nieuwe woorden — die komen vanzelf in de wachtrij.
          </p>
          <Link to="/leren" className="mt-4 inline-block"><Button>Naar het leerpad</Button></Link>
        </Card>
      ) : (
        <Card className="p-6 text-center">
          <Mascot mood="denk" size={90} className="mx-auto" />
          <p className="mt-3 font-display text-xl font-extrabold">{Math.min(12, due.length)} woorden, een paar minuten</p>
          <p className="mt-1 text-[var(--ink-soft)]">Zonder hartjes. Fouten kosten hier niets.</p>
          <Button className="mt-4 w-full sm:w-auto" onClick={() => { setResult(null); setRunning(true) }}>
            Start herhaling
          </Button>
        </Card>
      )}

      {weakest.length > 0 && (
        <>
          <h3 className="mt-8 mb-3 font-display text-lg font-extrabold">Deze zitten nog het minst vast</h3>
          <ul className="grid gap-2 sm:grid-cols-2">
            {weakest.map((card) => {
              const w = word(card.id)
              return (
                <li key={card.id}>
                  <Card className="flex items-center gap-3 p-3">
                    <span className="text-2xl" aria-hidden="true">{w.emoji ?? '•'}</span>
                    <div className="min-w-0 flex-1">
                      <div className="ar text-lg font-bold">{w.ar}</div>
                      <div className="text-sm text-[var(--ink-soft)]">{w.tr} — {w.nl}</div>
                    </div>
                    <span className="shrink-0 rounded-full bg-[var(--surface-sunken)] px-2 py-1 text-xs font-bold">
                      {strengthLabel(card.strength)}
                    </span>
                  </Card>
                </li>
              )
            })}
          </ul>
        </>
      )}

      <div className="mt-8 text-center">
        <Button variant="ghost" onClick={() => navigate('/leren')}>Terug naar het pad</Button>
      </div>
    </div>
  )
}
