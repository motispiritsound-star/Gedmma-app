import { useState } from 'react'
import { aanmelden, postMogelijk, vergeetAanmelding } from '../engine/post'
import { sfx } from '../engine/audio'
import { useStore } from '../engine/store'
import { useT } from '../i18n'
import { Button, Card } from './kit'
import { OuderPoort, poortAl } from './OuderPoort'

/**
 * Where a parent leaves an address, if they want one thing or the other.
 *
 * Three rules are built into the shape of this, and none of them are ours to
 * bend: it sits behind the parental gate, because in the Netherlands a child
 * cannot give an address away until they are sixteen; there are two empty
 * boxes rather than one ticked one, because news and progress are two
 * different questions and a pre-ticked box is not consent; and nothing is sent
 * until the address has been confirmed from the inbox, because anyone can type
 * anyone's address into a form.
 *
 * In a build with no server behind it (`VITE_POST` empty) none of this is
 * shown at all.
 */
export function PostAanmelding() {
  const t = useT()
  const post = useStore((s) => s.post)
  const [email, setEmail] = useState('')
  const [nieuws, setNieuws] = useState(false)
  const [voortgang, setVoortgang] = useState(false)
  const [poort, setPoort] = useState(false)
  const [bezig, setBezig] = useState(false)
  /** Niet gelukt, en waarom: aan ons of aan de verbinding. */
  const [mis, setMis] = useState<'mis' | 'offline' | null>(null)

  if (!postMogelijk()) return null

  const versturen = async () => {
    setBezig(true)
    setMis(null)
    const uitkomst = await aanmelden(email, { nieuws, voortgang })
    setBezig(false)
    // Het adres en de twee vinkjes blijven staan, wat er ook misging: opnieuw
    // moeten typen na een storing is de storing twee keer.
    if (uitkomst === 'mis' || uitkomst === 'offline') setMis(uitkomst)
    else sfx.confirm()
  }

  if (post) {
    return (
      <Card className="mb-8 p-5">
        <h2 className="font-display text-xl font-extrabold">📬 {t.post.titel}</h2>
        <p className="mt-2 text-sm">
          {post.status === 'bevestigd' ? t.post.bevestigd(post.email) : t.post.wacht(post.email)}
        </p>
        <ul className="mt-3 space-y-1 text-sm text-[var(--ink-soft)]">
          {post.nieuws && <li>✅ {t.post.nieuws}</li>}
          {post.voortgang && <li>✅ {t.post.voortgang}</li>}
        </ul>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => { sfx.tap(); vergeetAanmelding(); setEmail(''); setNieuws(false); setVoortgang(false) }}
        >
          {t.post.wijzig}
        </Button>
        <p className="mt-3 text-xs leading-relaxed text-[var(--ink-soft)]">{t.post.klein}</p>
      </Card>
    )
  }

  const klaar = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/.test(email.trim()) && (nieuws || voortgang)

  return (
    <Card className="mb-8 p-5">
      <h2 className="font-display text-xl font-extrabold">📬 {t.post.titel}</h2>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.post.uitleg}</p>

      <label className="mt-4 block text-sm font-bold" htmlFor="post-email">{t.post.email}</label>
      <input
        id="post-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={email}
        onChange={(e) => { setEmail(e.target.value); setMis(null) }}
        className="mt-1 w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-3 outline-none focus:border-zellige-500"
      />

      <div className="mt-4 space-y-3">
        {([
          ['nieuws', nieuws, setNieuws, t.post.nieuws],
          ['voortgang', voortgang, setVoortgang, t.post.voortgang],
        ] as const).map(([naam, aan, zet, label]) => (
          <label key={naam} className="flex cursor-pointer gap-3 text-sm">
            <input
              type="checkbox"
              checked={aan}
              onChange={(e) => zet(e.target.checked)}
              className="mt-0.5 size-5 shrink-0 accent-zellige-500"
            />
            <span>{label}</span>
          </label>
        ))}
      </div>

      <Button
        className="mt-5 w-full py-3"
        disabled={!klaar || bezig}
        /* Overslaan als er deze keer al een volwassene langs is geweest. */
        onClick={() => { sfx.tap(); if (poortAl()) void versturen(); else setPoort(true) }}
      >
        {bezig ? t.post.bezig : t.post.knop}
      </Button>
      {/*
        `role="status"` en niet zomaar een regel tekst: zonder dat leest een
        schermlezer de melding niet voor, en dan drukt iemand een tweede keer
        op een knop die net heeft gefaald zonder te weten dat hij faalde.
      */}
      {mis && (
        <p role="status" className="mt-3 text-center text-sm text-terra-500">
          {mis === 'offline' ? t.post.offline : t.post.mis}
        </p>
      )}
      <p className="mt-3 text-xs leading-relaxed text-[var(--ink-soft)]">{t.post.klein}</p>

      <OuderPoort
        open={poort}
        reden="post"
        onClose={() => setPoort(false)}
        onGoed={() => { setPoort(false); void versturen() }}
      />
    </Card>
  )
}
