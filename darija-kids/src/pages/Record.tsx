import { useEffect, useRef, useState } from 'react'
import { LETTERS } from '../content/alphabet'
import { letterSpeech } from '../content/pronunciation'
import { hasClip, clipCount } from '../engine/clips'
import { sayLetter, sfx } from '../engine/audio'
import { Button, Card, SectionTitle } from '../ui/kit'

/**
 * The recording booth.
 *
 * A phone voice reading تَاءْ is close; a Moroccan saying it is right. This is
 * how the second kind gets in: hold the button, say the letter, listen back,
 * save. Ten minutes for all thirty-one, and the files drop straight into
 * `src/audio/letters/` where the app picks them up with no list to update.
 *
 * What it deliberately does not do is upload anything. The recording exists
 * in this browser tab and in the file you save; it never leaves the device,
 * which is the same promise the rest of the app makes.
 *
 * Reachable while developing and in the demo build, not in the app a child
 * uses.
 */

type Take = { url: string; blob: Blob }

export function Record() {
  const [takes, setTakes] = useState<Record<string, Take>>({})
  const [busy, setBusy] = useState<string | null>(null)
  const [trouble, setTrouble] = useState('')
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)

  useEffect(() => () => {
    stream.current?.getTracks().forEach((t) => t.stop())
    for (const take of Object.values(takes)) URL.revokeObjectURL(take.url)
  }, [])

  /** One microphone, opened once and kept: asking per letter is thirty-one
   *  permission prompts on some browsers. */
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
        all[id] && URL.revokeObjectURL(all[id]!.url)
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

  const save = (id: string) => {
    const take = takes[id]
    if (!take) return
    const ext = take.blob.type.includes('webm') ? 'webm' : take.blob.type.includes('mp4') ? 'm4a' : 'ogg'
    const link = document.createElement('a')
    link.href = take.url
    link.download = `${id}.${ext}`
    link.click()
  }

  const done = Object.keys(takes).length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle sub="Spreek de eenendertig letters zelf in. Er gaat niets naar een server — de opname blijft in deze browser en in het bestand dat je opslaat.">
        Letters opnemen
      </SectionTitle>

      <Card className="mb-5 p-4 text-sm">
        <p>
          <strong className="font-display">Zo werkt het:</strong> houd <em>Opnemen</em> vast terwijl je
          de naam van de letter zegt, laat los, luister terug. Tevreden? <em>Opslaan</em> zet het
          bestand in je downloads met de juiste naam. Zet die bestanden daarna in{' '}
          <code>src/audio/letters/</code> en de app gebruikt ze overal.
        </p>
        <p className="mt-2 text-[var(--ink-soft)]">
          {clipCount()} van {LETTERS.length} letters hebben al een opname in de app ·{' '}
          {done} opgenomen in deze sessie
        </p>
        {trouble && <p className="mt-2 font-bold text-terra-500">{trouble}</p>}
      </Card>

      <ul className="space-y-2">
        {LETTERS.map((l) => {
          const speech = letterSpeech(l.id, l.ar, l.name)
          const take = takes[l.id]
          const recording = busy === l.id
          return (
            <li key={l.id}>
              <Card className="flex flex-wrap items-center gap-3 p-3">
                <span className="ar w-12 shrink-0 text-center text-3xl font-bold">{l.ar}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-extrabold">
                    {l.name} <span className="font-normal text-[var(--ink-soft)]">· {l.tr}</span>
                  </div>
                  <div className="ar text-lg text-khatim-500 dark:text-khatim-400">{speech.ar}</div>
                  <code className="text-[11px] text-[var(--ink-soft)]">
                    {l.id}{hasClip(l.id) ? ' · al opgenomen' : ''}
                  </code>
                </div>

                <Button variant="secondary" onClick={() => sayLetter(l)}>Voorbeeld</Button>

                <Button
                  variant={recording ? 'danger' : 'primary'}
                  onPointerDown={() => { if (!recording) void start(l.id) }}
                  onPointerUp={stop}
                  onPointerLeave={() => { if (recording) stop() }}
                >
                  {recording ? 'Laat los' : 'Opnemen'}
                </Button>

                {take && (
                  <>
                    <Button variant="secondary" onClick={() => { sfx.tap(); void new Audio(take.url).play() }}>
                      Terugluisteren
                    </Button>
                    <Button variant="secondary" onClick={() => save(l.id)}>Opslaan</Button>
                  </>
                )}
              </Card>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
