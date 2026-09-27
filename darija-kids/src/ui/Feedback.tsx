import { useState } from 'react'
import { version } from '../../package.json'
import { OPERATOR, operatorKnown } from '../content/operator'
import { useStore } from '../engine/store'
import { sfx } from '../engine/audio'
import { Button, Sheet } from './kit'
import { OuderPoort } from './OuderPoort'
import { useT } from '../i18n'

/**
 * The way back to a human.
 *
 * There is no server to post a form to, and building one would break the only
 * promise this app makes — so this opens the parent's own mail app with a
 * subject and a first line already written. Nothing is sent until they press
 * send, and they can see exactly what goes.
 *
 * The four reasons are not decoration: they become the subject line, so a
 * mailbox sorts itself. And the first of them is the one that actually makes
 * the app better — somebody whose family says a word differently.
 */

export type Reason = 'woord' | 'probleem' | 'idee' | 'vraag'

const REASONS: Reason[] = ['woord', 'probleem', 'idee', 'vraag']

const EMOJI: Record<Reason, string> = { woord: '🗣️', probleem: '🐞', idee: '💡', vraag: '❓' }

/** What the app knows about itself, so a parent does not have to describe it. */
function footer(lang: string, reason: Reason): string {
  const lines = [`Darijaforkids ${version} · ${lang}`]
  if (reason === 'probleem' && typeof navigator !== 'undefined') {
    const installed = typeof matchMedia !== 'undefined' && matchMedia('(display-mode: standalone)').matches
    lines.push(`${installed ? 'app' : 'browser'} · ${navigator.userAgent}`)
  }
  return lines.join('\n')
}

function mailto(reason: Reason, subject: string, intro: string, lang: string, context?: string): string {
  const body = [
    '',
    '',
    intro,
    context ? `\n${context}` : '',
    '\n—',
    footer(lang, reason),
  ].join('\n')
  return `mailto:${OPERATOR.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
}

/**
 * The sheet itself.
 *
 * `word` turns it into a correction for one word: the reason is chosen, and
 * the word travels along in the mail so nobody has to describe which one.
 */
export function FeedbackSheet({ open, onClose, word }: { open: boolean; onClose: () => void; word?: string }) {
  const t = useT()
  const lang = useStore((s) => s.settings.lang)
  if (!operatorKnown()) return null

  const reasons = word ? (['woord'] as Reason[]) : REASONS

  return (
    <Sheet open={open} onClose={onClose} labelledBy="feedback-title">
      <h2 id="feedback-title" className="font-display text-xl font-extrabold">{t.feedback.titel}</h2>
      <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.feedback.uitleg}</p>

      <ul className="mt-5 space-y-2">
        {reasons.map((reason) => (
          <li key={reason}>
            <a
              href={mailto(
                reason,
                `${t.common.appName} · ${t.feedback.onderwerp[reason]}`,
                t.feedback.beginRegel,
                lang,
                word ? t.feedback.overWoord(word) : undefined,
              )}
              onClick={() => { sfx.confirm(); onClose() }}
              className="btn3d flex items-start gap-3 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 text-start hover:border-zellige-500"
            >
              <span className="text-xl" aria-hidden="true">{EMOJI[reason]}</span>
              <span className="min-w-0">
                <span className="block font-display font-extrabold">{t.feedback.soort[reason].naam}</span>
                <span className="block text-sm text-[var(--ink-soft)]">{t.feedback.soort[reason].hint}</span>
              </span>
            </a>
          </li>
        ))}
      </ul>

      {/* A mail app that does not open — an embedded frame, a school
          chromebook — must not be a dead end. */}
      <p className="mt-5 text-sm text-[var(--ink-soft)]">
        {t.feedback.ofMail}{' '}
        <a className="font-bold underline" href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>
      </p>

      <Button variant="secondary" className="mt-5 w-full" onClick={onClose}>{t.common.sluiten}</Button>
    </Sheet>
  )
}

/**
 * De som vóór het venster.
 *
 * Elk van de drie ingangen hieronder eindigt in de mail-app van het toestel,
 * en dat is de app uit. De Kinderen-categorie staat dat alleen toe met een
 * ouder erbij, dus staat de poort voor alle drie — een kind dat de ene ingang
 * niet vindt, vindt de andere wel.
 *
 * Hij onthoudt niets. Een poort die je één keer per sessie opent, staat de
 * rest van die sessie open, en dat is precies de middag waarop de telefoon
 * op de bank ligt.
 */
function useMailPoort() {
  const [poort, setPoort] = useState(false)
  const [open, setOpen] = useState(false)
  return {
    poort,
    open,
    vraag: () => setPoort(true),
    sluitPoort: () => setPoort(false),
    door: () => { setPoort(false); setOpen(true) },
    sluit: () => setOpen(false),
  }
}

function MailPoort({ p, word }: { p: ReturnType<typeof useMailPoort>; word?: string }) {
  return (
    <>
      <OuderPoort open={p.poort} reden="uit" onClose={p.sluitPoort} onGoed={p.door} />
      <FeedbackSheet open={p.open} onClose={p.sluit} word={word} />
    </>
  )
}

/** The button, wherever a parent might be standing when they want one. */
export function FeedbackButton({
  variant = 'secondary', className = '', label,
}: {
  variant?: 'primary' | 'secondary' | 'ghost'
  className?: string
  label?: string
}) {
  const t = useT()
  const p = useMailPoort()
  if (!operatorKnown()) return null
  return (
    <>
      <Button variant={variant} className={className} onClick={() => { sfx.tap(); p.vraag() }}>
        {label ?? t.feedback.knop}
      </Button>
      <MailPoort p={p} />
    </>
  )
}

/** Footer-sized: a link among links, not a button among buttons. */
export function FeedbackLink({ className = '' }: { className?: string }) {
  const t = useT()
  const p = useMailPoort()
  if (!operatorKnown()) return null
  return (
    <>
      <button onClick={() => { sfx.tap(); p.vraag() }} className={`hover:underline ${className}`}>
        {t.feedback.voet}
      </button>
      <MailPoort p={p} />
    </>
  )
}

/** The quiet one, under a word in the dictionary. */
export function WordFeedback({ word }: { word: string }) {
  const t = useT()
  const p = useMailPoort()
  if (!operatorKnown()) return null
  return (
    <>
      <button
        onClick={() => { sfx.tap(); p.vraag() }}
        className="mt-3 text-sm font-bold text-zellige-600 underline hover:text-zellige-500 dark:text-zellige-300"
      >
        {t.feedback.anders}
      </button>
      <MailPoort p={p} word={word} />
    </>
  )
}
