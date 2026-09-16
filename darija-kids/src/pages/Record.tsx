import { useEffect, useMemo, useRef, useState } from 'react'
import { LETTERS } from '../content/alphabet'
import { allWords } from '../content/lexicon'
import { ALL_SENTENCES } from '../content/sentences'
import { letterSpeech } from '../content/pronunciation'
import { clipCounts, hasClip } from '../engine/clips'
import { OPNAME_NODIG } from '../content/eigen'
import { say, sayLetter, sfx } from '../engine/audio'
import { Button, Card, Progress, SectionTitle } from '../ui/kit'
import { Reeks } from '../ui/Reeks'

/**
 * The recording booth.
 *
 * There is no Darija voice on any phone — every engine is trained on Modern
 * Standard Arabic, which is a different language with the same letters. So
 * the app cannot synthesise its way to a right answer; somebody has to say
 * the words. This is where that happens: hold the button, say it, listen
 * back, save. The file lands with the right name and the app picks it up.
 *
 * Nothing is uploaded. The recording lives in this tab and in the file you
 * keep, which is the promise the rest of the app makes.
 *
 * Reachable while developing and in the demo build, not in the app a child
 * uses.
 */

type Row = { id: string; ar: string; tr: string; naam: string; folder: string }

/** Woorden waarvan is vastgesteld dat geen enkele stem ze goed zegt. */
const EERST = new Set(OPNAME_NODIG)
type Take = { url: string; blob: Blob }

const ROWS: Record<'letters' | 'woorden' | 'zinnen', () => Row[]> = {
  letters: () => LETTERS.map((l) => ({
    id: l.id, ar: l.ar, tr: l.tr, naam: letterSpeech(l.id, l.ar, l.name).ar, folder: 'letters',
  })),
  woorden: () => allWords.filter((w) => !w.phrase).map((w) => ({
    id: w.id, ar: w.ar, tr: w.tr, naam: w.nl, folder: 'woorden',
  })),
  zinnen: () => [
    ...allWords.filter((w) => w.phrase).map((w) => ({
      id: w.id, ar: w.ar, tr: w.tr, naam: w.nl, folder: 'woorden',
    })),
    ...ALL_SENTENCES.map((z) => ({ id: z.id, ar: z.ar, tr: z.tr, naam: z.nl, folder: 'zinnen' })),
  ],
}

export function Record() {
  const [tab, setTab] = useState<'letters' | 'woorden' | 'zinnen'>('letters')
  const [zoek, setZoek] = useState('')
  const [nogNiet, setNogNiet] = useState(true)
  const [takes, setTakes] = useState<Record<string, Take>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [trouble, setTrouble] = useState('')
  const [reeks, setReeks] = useState(false)
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)

  useEffect(() => () => {
    stream.current?.getTracks().forEach((t) => t.stop())
  }, [])

  const telling = clipCounts()
  const rijen = useMemo(() => {
    const naald = zoek.trim().toLowerCase()
    const gevonden = ROWS[tab]().filter((r) => {
      if (nogNiet && hasClip(r.id) && !takes[r.id]) return false
      if (!naald) return true
      return `${r.id} ${r.tr} ${r.naam} ${r.ar}`.toLowerCase().includes(naald)
    })
    // Van deze is gehoord dat geen stem ze goed zegt, dus hier is de winst het
    // grootst. Met honderd woorden te gaan is de volgorde het halve werk.
    return [...gevonden].sort((a, b) => Number(EERST.has(b.id)) - Number(EERST.has(a.id)))
  }, [tab, zoek, nogNiet, takes])

  const teDoen = OPNAME_NODIG.filter((id) => !hasClip(id)).length

  /** One microphone, opened once: asking per item is hundreds of prompts. */
  const microphone = async (): Promise<MediaStream | null> => {
    if (stream.current) return stream.current
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
      })
      return stream.current
    } catch {
      setTrouble('De microfoon ging niet open. Geef deze pagina toestemming en probeer opnieuw.')
      return null
    }
  }

  const start = async (id: string) => {
    if (busy) return
    const source = await microphone()
    if (!source) return
    const kind = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
    const rec = new MediaRecorder(source, kind ? { mimeType: kind } : undefined)
    const chunks: BlobPart[] = []
    rec.ondataavailable = (e) => { if (e.data.size) chunks.push(e.data) }
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' })
      setTakes((all) => {
        if (all[id]) URL.revokeObjectURL(all[id].url)
        return { ...all, [id]: { blob, url: URL.createObjectURL(blob) } }
      })
    }
    recorder.current = rec
    rec.start()
    setBusy(id)
  }

  const stop = () => {
    recorder.current?.stop()
    recorder.current = null
    setBusy(null)
  }

  const save = (row: Row) => {
    const take = takes[row.id]
    if (!take) return
    const ext = take.blob.type.includes('webm') ? 'webm' : take.blob.type.includes('mp4') ? 'm4a' : 'ogg'
    const link = document.createElement('a')
    link.href = take.url
    link.download = `${row.id}.${ext}`
    link.click()
  }

  const speel = (row: Row) => {
    sfx.tap()
    const letter = LETTERS.find((l) => l.id === row.id)
    if (tab === 'letters' && letter) sayLetter(letter)
    else say(row.ar, { tr: row.tr })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle sub="Geen enkele telefoonstem spreekt Darija — ze zijn allemaal op Standaardarabisch getraind. Dit is de enige weg naar een echte uitspraak: iemand die het zegt.">
        Opnemen
      </SectionTitle>

      <Card className="mb-5 p-4 text-sm">
        <p>
          <strong className="font-display">Zo werkt het:</strong> houd <em>Opnemen</em> vast terwijl je
          het zegt, laat los, luister terug. <em>Opslaan</em> zet het bestand met de juiste naam
          in je downloads. Die bestanden horen in <code>src/audio/{tab}/</code>.
        </p>
        <div className="mt-3 grid gap-2">
          {([
            ['Letters', telling.letters, telling.lettersTotal],
            ['Woorden', telling.woorden, telling.woordenTotal],
            ['Zinnen', telling.zinnen, telling.zinnenTotal],
          ] as const).map(([naam, done, all]) => (
            <div key={naam} className="flex items-center gap-3">
              <span className="w-20 shrink-0 text-xs font-bold">{naam}</span>
              <Progress value={done / all} className="h-2 flex-1" />
              <span className="w-16 shrink-0 text-end text-xs tabular-nums text-[var(--ink-soft)]">
                {done}/{all}
              </span>
            </div>
          ))}
        </div>
        {teDoen > 0 && (
          <p className="mt-3 rounded-2xl bg-terra-500/10 px-3 py-2 text-sm">
            <strong className="font-display">{teDoen} met voorrang.</strong> Van deze woorden is
            vastgesteld dat geen enkele stem ze goed zegt. Ze staan bovenaan, met
            een rood streepje.
          </p>
        )}
        {trouble && <p className="mt-2 font-bold text-terra-500">{trouble}</p>}
      </Card>

      {/* De hele lijst in één keer, voor wie er niet eenenveertig keer voor
          gaat zitten. Alleen waar er ook echt een lijst met voorrang is. */}
      {teDoen > 0 && tab === 'woorden' && (
        reeks
          ? (
            <Reeks
              woorden={ROWS.woorden().filter((r) => EERST.has(r.id) && !hasClip(r.id)).slice(0, 20)}
              klaar={() => setReeks(false)}
            />
          )
          : (
            <Button variant="secondary" className="mb-4 w-full" onClick={() => { sfx.tap(); setReeks(true) }}>
              🎙️ Liever alles achter elkaar inlezen?
            </Button>
          )
      )}

      <div className="mb-4 flex flex-wrap gap-2">
        {(['letters', 'woorden', 'zinnen'] as const).map((key) => (
          <Button
            key={key}
            variant={tab === key ? 'primary' : 'secondary'}
            onClick={() => { sfx.tap(); setTab(key) }}
          >
            {key}
          </Button>
        ))}
        <Button variant={nogNiet ? 'primary' : 'secondary'} onClick={() => setNogNiet((v) => !v)}>
          Alleen wat mist
        </Button>
        <input
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder="zoek…"
          aria-label="zoek"
          className="min-w-0 flex-1 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-sm"
        />
      </div>

      <p className="mb-3 text-sm text-[var(--ink-soft)]">{rijen.length} te doen</p>

      <ul className="space-y-2">
        {rijen.slice(0, 120).map((row) => {
          const take = takes[row.id]
          const recording = busy === row.id
          return (
            <li key={row.id}>
              <Card className={`flex flex-wrap items-center gap-3 p-3 ${
                EERST.has(row.id) && !hasClip(row.id) ? 'border-s-4 border-s-terra-500' : ''
              }`}>
                <div className="min-w-0 flex-1">
                  <div className="ar text-xl font-bold">{row.ar}</div>
                  <div className="font-display font-extrabold text-zellige-600 dark:text-zellige-300">
                    {row.tr}
                  </div>
                  <div className="text-xs text-[var(--ink-soft)]">
                    {row.naam} · <code>{row.id}</code>
                    {hasClip(row.id) && ' · al opgenomen'}
                    {EERST.has(row.id) && !hasClip(row.id) && (
                      <span className="font-bold text-terra-500"> · geen stem zegt dit goed</span>
                    )}
                  </div>
                </div>

                <Button variant="secondary" onClick={() => speel(row)}>Hoor</Button>
                <Button
                  variant={recording ? 'danger' : 'primary'}
                  onPointerDown={() => { if (!recording) void start(row.id) }}
                  onPointerUp={stop}
                  onPointerLeave={() => { if (recording) stop() }}
                >
                  {recording ? 'Laat los' : 'Opnemen'}
                </Button>

                {take && (
                  <>
                    <Button variant="secondary" onClick={() => { sfx.tap(); void new Audio(take.url).play() }}>
                      Terug
                    </Button>
                    <Button variant="secondary" onClick={() => save(row)}>Opslaan</Button>
                  </>
                )}
              </Card>
            </li>
          )
        })}
      </ul>

      {rijen.length > 120 && (
        <p className="mt-4 text-center text-sm text-[var(--ink-soft)]">
          De eerste 120 staan hier. Zoek of vink <em>Alleen wat mist</em> aan om verder te komen.
        </p>
      )}
    </div>
  )
}
