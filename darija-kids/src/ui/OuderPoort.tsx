import { useMemo, useState } from 'react'
import { useT } from '../i18n'
import { Button, Sheet } from './kit'

/**
 * The question a small child cannot answer alone.
 *
 * Both stores require one in front of anything that spends money or leaves the
 * app, and the GDPR requires one in front of anything that asks for an e-mail
 * address, because in the Netherlands a child cannot give that away until they
 * are sixteen. A multiplication is the usual shape: quick for an adult,
 * out of reach for the six-year-old this app is built for.
 *
 * The sum changes every time it opens, so it cannot be learned by heart, and
 * nothing happens until it is right.
 */
export function OuderPoort({ open, onClose, onGoed }: {
  open: boolean
  onClose: () => void
  onGoed: () => void
}) {
  const t = useT()
  const [antwoord, setAntwoord] = useState('')
  const [fout, setFout] = useState(false)

  const som = useMemo(() => {
    const a = 3 + Math.floor(Math.random() * 6)
    const b = 4 + Math.floor(Math.random() * 6)
    return { tekst: `${a} × ${b}`, waarde: a * b }
  }, [open])

  const bevestig = () => {
    if (Number(antwoord.trim()) !== som.waarde) {
      setFout(true)
      return
    }
    setAntwoord('')
    setFout(false)
    onGoed()
  }

  return (
    <Sheet open={open} onClose={onClose} labelledBy="poort-titel">
      <h2 id="poort-titel" className="font-display text-xl font-extrabold">{t.unlock.poortTitel}</h2>
      <p className="mt-2 text-[var(--ink-soft)]">{t.unlock.poortBody(som.tekst)}</p>
      <label className="sr-only" htmlFor="poort-antwoord">{t.unlock.poortBody(som.tekst)}</label>
      <input
        id="poort-antwoord"
        inputMode="numeric"
        value={antwoord}
        onChange={(e) => { setAntwoord(e.target.value); setFout(false) }}
        onKeyDown={(e) => e.key === 'Enter' && bevestig()}
        className="mt-4 w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-center font-display text-2xl font-bold outline-none focus:border-zellige-500"
      />
      {fout && <p className="mt-2 text-center text-sm text-terra-500">{t.unlock.poortFout}</p>}
      <div className="mt-5 flex gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>{t.common.annuleren}</Button>
        <Button className="flex-1" onClick={bevestig}>{t.unlock.poortKnop}</Button>
      </div>
    </Sheet>
  )
}
