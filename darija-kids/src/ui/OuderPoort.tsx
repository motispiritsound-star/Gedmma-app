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
 * `reden` only changes the sentence above the sum. It matters more than it
 * looks: a gate that says "subscribing" in front of a mail field teaches a
 * parent to click past the words, and then the gate guards nothing.
 *
 * The sum changes every time it opens, so it cannot be learned by heart, and
 * nothing happens until it is right.
 */
export type PoortReden = 'abonnement' | 'post' | 'uit'

/**
 * Of er deze keer al een volwassene is langsgekomen.
 *
 * Stond er eerst niet, en dan kwam de som bij élke tik terug: bij de drie
 * mailknoppen, bij het aanmeldformulier, bij het beheren van het abonnement.
 * Wie de app aan het inrichten is doet die som tien keer op een avond, en een
 * poort die zo vaak komt wordt een poort waar men blind langs klikt. Dan
 * bewaakt hij niets meer.
 *
 * Eén keer per keer dat de app open is, dus. Bewust **niet** opgeslagen: dit
 * staat in het geheugen en nergens anders, zodat het bij elke nieuwe start
 * weer op nul staat. Een kind dat de app morgen opent, komt de som gewoon
 * weer tegen.
 *
 * Dat is een afweging en geen vanzelfsprekendheid. Richtlijn 1.3 van de
 * Kinderen-categorie vraagt een poort vóór een aankoop en vóór een link naar
 * buiten; hij vraagt niet dat die poort bij elke tik opnieuw komt. Geeft een
 * ouder zijn telefoon ná de som aan zijn kind, dan is de poort die sessie
 * open — daar staat tegenover dat een poort die men wegklikt zonder te lezen
 * altijd open is.
 */
let gehaald = false

/** Waar: deze keer is de som al goed beantwoord. */
export const poortAl = (): boolean => gehaald

/** Alleen voor de tests: terug naar de stand bij het opstarten. */
export const poortVergeet = (): void => { gehaald = false }

export function OuderPoort({ open, onClose, onGoed, reden = 'abonnement' }: {
  open: boolean
  onClose: () => void
  onGoed: () => void
  /** Waarvoor er gevraagd wordt: betalen, een e-mailadres, of de app uit. */
  reden?: PoortReden
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
    gehaald = true
    onGoed()
  }

  const vraag = reden === 'post'
    ? t.unlock.poortBodyPost(som.tekst)
    : reden === 'uit'
      ? t.unlock.poortBodyUit(som.tekst)
      : t.unlock.poortBody(som.tekst)

  return (
    <Sheet open={open} onClose={onClose} labelledBy="poort-titel">
      <h2 id="poort-titel" className="font-display text-xl font-extrabold">{t.unlock.poortTitel}</h2>
      <p className="mt-2 text-[var(--ink-soft)]">{vraag}</p>
      <label className="sr-only" htmlFor="poort-antwoord">{vraag}</label>
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
