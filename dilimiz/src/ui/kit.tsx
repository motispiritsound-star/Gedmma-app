import type { ReactNode } from 'react'
import { useId, useState } from 'react'

/**
 * De bouwstenen. Geen ontwerpsysteem van een ander project: de klassen staan
 * in src/stijl.css en de kleuren in src/merk/kleuren.ts.
 */

export function Knop({
  children, soort = 'vol', breed, klein, ...rest
}: {
  children: ReactNode
  soort?: 'vol' | 'stil' | 'rand' | 'goed' | 'nogeens'
  breed?: boolean
  klein?: boolean
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const klassen = ['knop']
  if (soort !== 'vol') klassen.push(`knop--${soort === 'rand' ? 'rand' : soort}`)
  if (breed) klassen.push('knop--breed')
  if (klein) klassen.push('knop--klein')
  return <button type="button" className={klassen.join(' ')} {...rest}>{children}</button>
}

export function Kaart({ children, in: inGedrukt, ...rest }: {
  children: ReactNode
  in?: boolean
} & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`kaart${inGedrukt ? ' kaart--in' : ''}`} {...rest}>{children}</div>
}

export function Balk({ deel, label }: { deel: number; label?: string }) {
  const pct = Math.round(Math.max(0, Math.min(1, deel)) * 100)
  return (
    <div
      className="balk"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <i style={{ width: `${pct}%` }} />
    </div>
  )
}

export function Lint({ children, letOp }: { children: ReactNode; letOp?: boolean }) {
  return <span className={`lint${letOp ? ' lint--let-op' : ''}`}>{children}</span>
}

/**
 * Turkse tekst.
 *
 * `lang="tr"` staat erop zodat een schermlezer hem in het Turks voorleest in
 * plaats van in het Nederlands -- dat is het verschil tussen "mer-ha-ba" en
 * "merr-habba". En geen `text-transform` in de CSS die erbij hoort: dat zou
 * van een `i` een `I` maken in plaats van een `İ`.
 */
export function Tr({ children, groot, kop }: { children: ReactNode; groot?: boolean; kop?: boolean }) {
  const klassen = ['tr']
  if (kop) klassen.push('tr--kop')
  else if (groot) klassen.push('tr--groot')
  return <span className={klassen.join(' ')} lang="tr">{children}</span>
}

/**
 * Uitlegtekst waarin Turkse woorden tussen backticks staan.
 *
 * De inhoud schrijft `Zegt iemand \`hoş geldin\`, dan antwoord je ...`. Dit
 * zet die woorden in het Turkse lettertype mét `lang="tr"`, zodat een
 * schermlezer midden in een Nederlandse zin even Turks spreekt. Zonder dit
 * stonden er letterlijk backticks op het scherm.
 */
export function Uitleg({ tekst }: { tekst: string }) {
  const delen = tekst.split('`')
  return (
    <>
      {delen.map((deel, i) =>
        i % 2 === 1
          ? <Tr key={i}>{deel}</Tr>
          : <span key={i}>{deel}</span>,
      )}
    </>
  )
}

export function Kop({ children, onder, niveau = 'h1' }: {
  children: ReactNode
  onder?: ReactNode
  niveau?: 'h1' | 'h2'
}) {
  const H = niveau
  return (
    <header className="kolom" style={{ gap: 'var(--ruimte-1)', marginBottom: 'var(--ruimte-4)' }}>
      <H>{children}</H>
      {onder ? <p className="zacht klein" style={{ margin: 0 }}>{onder}</p> : null}
    </header>
  )
}

export function Cijfer({ waarde, label, emoji }: { waarde: ReactNode; label: string; emoji?: string }) {
  return (
    <div className="kaart kaart--in midden" style={{ padding: 'var(--ruimte-3)', flex: 1 }}>
      {emoji ? <div aria-hidden style={{ fontSize: '1.3rem' }}>{emoji}</div> : null}
      <div style={{ fontFamily: 'var(--font-kop)', fontSize: '1.4rem', fontWeight: 800 }}>{waarde}</div>
      <div className="zacht klein">{label}</div>
    </div>
  )
}

export function Schakelaar({ aan, onAan, label, uitleg }: {
  aan: boolean
  onAan: (nieuw: boolean) => void
  label: string
  uitleg?: string
}) {
  const id = useId()
  return (
    <div className="rij rij--tussen">
      <label htmlFor={id} className="kolom" style={{ gap: 2, flex: 1 }}>
        <span>{label}</span>
        {uitleg ? <span className="zacht klein">{uitleg}</span> : null}
      </label>
      <input
        id={id}
        type="checkbox"
        checked={aan}
        onChange={(e) => onAan(e.target.checked)}
        style={{ width: 44, height: 28, accentColor: 'var(--accent)' }}
      />
    </div>
  )
}

/**
 * Een rij knoppen waarvan er één gekozen is.
 *
 * Als `<button aria-pressed>` en niet als `<select>`: een kind van zeven tikt
 * liever op een plaatje dan dat het een uitklaplijst opent, en een
 * uitklaplijst op iOS neemt het halve scherm.
 */
export function Keuzerij<T extends string>({ waarde, opties, onKies, label }: {
  waarde: T
  opties: { id: T; label: ReactNode }[]
  onKies: (id: T) => void
  label: string
}) {
  return (
    <div role="group" aria-label={label} className="tegels">
      {opties.map((o) => (
        <button
          key={o.id}
          type="button"
          className="tegel"
          aria-pressed={waarde === o.id}
          style={waarde === o.id
            ? { borderColor: 'var(--accent)', background: 'var(--papier-in)' }
            : undefined}
          onClick={() => onKies(o.id)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

/** Een melding die even blijft staan, voor "teruggezet" en "alles gewist". */
export function Melding({ tekst, soort = 'gewoon' }: { tekst: string; soort?: 'gewoon' | 'goed' }) {
  return (
    <div
      role="status"
      className="kaart kaart--in klein"
      style={{ padding: 'var(--ruimte-3)', borderLeft: `4px solid var(--${soort === 'goed' ? 'fistik' : 'cini'}-500)` }}
    >
      {tekst}
    </div>
  )
}

/** Een blok dat open- en dichtklapt, voor de lange teksten op het ouderscherm. */
export function Vouw({ titel, children, open: beginOpen = false }: {
  titel: string
  children: ReactNode
  open?: boolean
}) {
  const [open, zetOpen] = useState(beginOpen)
  return (
    <div className="kaart">
      <button
        type="button"
        onClick={() => zetOpen(!open)}
        aria-expanded={open}
        style={{ all: 'unset', cursor: 'pointer', width: '100%', display: 'flex', justifyContent: 'space-between', gap: 'var(--ruimte-3)' }}
      >
        <strong style={{ fontFamily: 'var(--font-kop)' }}>{titel}</strong>
        <span aria-hidden>{open ? '–' : '+'}</span>
      </button>
      {open ? <div style={{ marginTop: 'var(--ruimte-3)' }}>{children}</div> : null}
    </div>
  )
}
