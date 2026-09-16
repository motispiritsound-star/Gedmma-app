import { useRef, useState } from 'react'
import { knip, type Stuk } from '../engine/knip'
import { sfx } from '../engine/audio'
import { Button, Card } from './kit'

/**
 * Een hele lijst in één keer inlezen.
 *
 * Losse woorden opnemen is eenenveertig keer een knop vasthouden, loslaten,
 * luisteren, opslaan. Niemand die Darija spreekt maar geen belang heeft bij
 * deze app houdt dat vol. Dit is één handeling: druk op opnemen, lees de lijst
 * van het scherm met een adempauze tussen de woorden, druk op stop. De app
 * zoekt daarna de stiltes op en legt elk stuk naast het woord waar het bij
 * hoort.
 *
 * Het blijft te controleren: je ziet per woord wat eruit kwam, je hoort het
 * terug, en klopt er iets niet dan neem je dat ene woord alsnog los op. Het
 * gevaarlijke geval — een woord overgeslagen, waardoor alles erna verschuift —
 * zie je meteen omdat het aantal stukken niet klopt.
 */

export interface Woord { id: string; ar: string; tr: string; naam: string }

/** Een stuk uit de opname, als los bestand klaar om te bewaren. */
interface Stukje { id: string; url: string; blob: Blob; duur: number }

/** Een AudioBuffer terug naar een WAV-bestand, want dat leest alles. */
function naarWav(buffer: AudioBuffer, van: number, tot: number): Blob {
  const rate = buffer.sampleRate
  const bron = buffer.getChannelData(0)
  const begin = Math.max(0, Math.floor(van * rate))
  const eind = Math.min(bron.length, Math.ceil(tot * rate))
  const n = Math.max(0, eind - begin)

  const kop = new DataView(new ArrayBuffer(44))
  const tekst = (at: number, s: string) => { for (let i = 0; i < s.length; i++) kop.setUint8(at + i, s.charCodeAt(i)) }
  tekst(0, 'RIFF'); kop.setUint32(4, 36 + n * 2, true); tekst(8, 'WAVE')
  tekst(12, 'fmt '); kop.setUint32(16, 16, true); kop.setUint16(20, 1, true); kop.setUint16(22, 1, true)
  kop.setUint32(24, rate, true); kop.setUint32(28, rate * 2, true)
  kop.setUint16(32, 2, true); kop.setUint16(34, 16, true)
  tekst(36, 'data'); kop.setUint32(40, n * 2, true)

  const lijf = new DataView(new ArrayBuffer(n * 2))
  // Meteen op één sterkte zetten, zodat twee woorden achter elkaar niet als
  // twee verschillende kamers klinken.
  let piek = 0
  for (let i = begin; i < eind; i++) piek = Math.max(piek, Math.abs(bron[i]!))
  const winst = piek > 0 ? 0.89 / piek : 1
  const fade = Math.min(Math.round(rate * 0.008), Math.floor(n / 2))
  for (let i = 0; i < n; i++) {
    let v = bron[begin + i]! * winst
    if (i < fade) v *= i / fade
    if (i > n - fade) v *= (n - i) / fade
    lijf.setInt16(i * 2, Math.round(Math.max(-1, Math.min(1, v)) * 32767), true)
  }
  return new Blob([kop.buffer, lijf.buffer], { type: 'audio/wav' })
}

export function Reeks({ woorden, klaar }: { woorden: Woord[]; klaar: (n: number) => void }) {
  const [bezig, setBezig] = useState(false)
  const [stukjes, setStukjes] = useState<Stukje[] | null>(null)
  const [praat, setPraat] = useState('')
  const recorder = useRef<MediaRecorder | null>(null)
  const stream = useRef<MediaStream | null>(null)

  const start = async () => {
    setPraat('')
    setStukjes(null)
    try {
      stream.current ??= await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true },
      })
    } catch {
      setPraat('De microfoon ging niet open. Geef deze pagina toestemming en probeer opnieuw.')
      return
    }
    const soort = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : ''
    const rec = new MediaRecorder(stream.current, soort ? { mimeType: soort } : undefined)
    const brokken: BlobPart[] = []
    rec.ondataavailable = (e) => { if (e.data.size) brokken.push(e.data) }
    rec.onstop = () => void verwerk(new Blob(brokken, { type: rec.mimeType || 'audio/webm' }))
    recorder.current = rec
    rec.start()
    setBezig(true)
  }

  const stop = () => {
    recorder.current?.stop()
    recorder.current = null
    setBezig(false)
  }

  const verwerk = async (blob: Blob) => {
    const ac = new AudioContext()
    const buffer = await ac.decodeAudioData(await blob.arrayBuffer())
    const stukken: Stuk[] = knip(buffer.getChannelData(0), buffer.sampleRate)
    setStukjes(stukken.map((s, i) => {
      const deel = naarWav(buffer, s.van, s.tot)
      return {
        id: woorden[i]?.id ?? `extra-${i + 1}`,
        url: URL.createObjectURL(deel),
        blob: deel,
        duur: s.tot - s.van,
      }
    }))
    void ac.close()
  }

  const bewaar = (stuk: Stukje) => {
    const link = document.createElement('a')
    link.href = stuk.url
    link.download = `${stuk.id}.wav`
    link.click()
  }

  const gevonden = stukjes?.length ?? 0
  const klopt = gevonden === woorden.length

  return (
    <Card className="mb-5 p-4">
      <h2 className="font-display text-lg font-extrabold">🎙️ Achter elkaar inlezen</h2>
      <p className="mt-1 text-sm text-[var(--ink-soft)]">
        Druk op opnemen, lees de {woorden.length} woorden hieronder één voor één voor met
        een <strong>adempauze van een halve seconde</strong> ertussen, en druk op stop.
        De app knipt ze daarna zelf uit elkaar.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        {bezig
          ? <Button variant="danger" onClick={() => { stop() }}>Stop — ik ben klaar</Button>
          : <Button onClick={() => { sfx.tap(); void start() }}>Opnemen</Button>}
        {stukjes && klopt && (
          <Button
            variant="secondary"
            onClick={() => { stukjes.forEach((s, i) => setTimeout(() => bewaar(s), i * 220)); klaar(stukjes.length) }}
          >
            Alle {gevonden} opslaan
          </Button>
        )}
      </div>
      {praat && <p className="mt-2 font-bold text-terra-500">{praat}</p>}

      {bezig && (
        <ol className="mt-4 grid gap-1.5 text-sm">
          {woorden.map((w, i) => (
            <li key={w.id} className="flex items-baseline gap-3 rounded-xl bg-[var(--surface-sunken)] px-3 py-2">
              <span className="w-6 shrink-0 text-xs tabular-nums text-[var(--ink-faint)]">{i + 1}</span>
              <span className="ar text-lg font-bold">{w.ar}</span>
              <span className="font-display font-extrabold text-zellige-600 dark:text-zellige-300">{w.tr}</span>
              <span className="min-w-0 truncate text-xs text-[var(--ink-soft)]">{w.naam}</span>
            </li>
          ))}
        </ol>
      )}

      {stukjes && (
        <div className="mt-4">
          <p className={`text-sm font-bold ${klopt ? 'text-mint-600' : 'text-terra-500'}`}>
            {klopt
              ? `${gevonden} stukken gevonden, precies één per woord.`
              : `${gevonden} stukken gevonden en ${woorden.length} woorden gevraagd — de koppeling klopt niet.`}
          </p>
          {!klopt && (
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              Meestal is er een woord overgeslagen of zijn er twee aan elkaar
              geplakt. Neem de reeks liever opnieuw op dan hem zo op te slaan:
              vanaf het verschil staat alles onder de verkeerde naam.
            </p>
          )}
          <ul className="mt-3 grid gap-1.5">
            {stukjes.map((s, i) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--line)] px-3 py-2 text-sm">
                <span className="w-6 shrink-0 text-xs tabular-nums text-[var(--ink-faint)]">{i + 1}</span>
                <code className="min-w-0 flex-1">{s.id}</code>
                <span className="text-xs tabular-nums text-[var(--ink-soft)]">{s.duur.toFixed(2)}s</span>
                <Button variant="secondary" onClick={() => { void new Audio(s.url).play() }}>Hoor</Button>
                <Button variant="secondary" onClick={() => bewaar(s)}>Opslaan</Button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}
