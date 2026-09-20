import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UNITS } from '../content/curriculum'
import { allWords, word } from '../content/lexicon'
import { LETTERS } from '../content/alphabet'
import { unitSubtitle } from '../content/localise'
import { say, sfx } from '../engine/audio'
import { nextLesson, setSetting, useStore } from '../engine/store'
import { LANGS, useLang, useT, type Lang } from '../i18n'
import { Button, Card } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { useMeaning } from '../ui/WordChip'
import { FeedbackLink } from '../ui/Feedback'
import { Vlag } from '../ui/Khatim'

/**
 * De acht woorden van de proeverij op de voorpagina.
 *
 * Dit is het eerste wat iemand van de app hoort, dus hier telt één ding zwaarder
 * dan elders: dat de opname zegt wat eronder staat. Een woord waarvan dat niet
 * vaststaat hoort hier niet — het staat verderop in de app nog steeds, waar het
 * in een les zit en niet in een etalage. Zo ging bnin (lekker) eruit: zijn
 * opname bleek het woord ervoor te zeggen.
 */
const TASTER = ['salam', 'shukran', 'atay', 'kesksu', 'yallah', 'khobz', 'mzyan', 'bslama']

export function Landing() {
  const t = useT()
  const lang = useLang()
  const meaning = useMeaning()
  const state = useStore((s) => s)
  const started = state.xp > 0
  const [taste, setTaste] = useState(0)
  const w = word(TASTER[taste % TASTER.length]!)

  return (
    <div>
      {/* ------------------------------------------------------------ hero */}
      <header className="zellige relative overflow-hidden border-b border-[var(--line)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[var(--surface)]/70 to-[var(--surface)]" aria-hidden="true" />
        <div className="relative mx-auto max-w-5xl px-4 py-6">
          <nav className="flex flex-wrap items-center gap-3">
            <span className="flex items-center gap-2 font-display text-2xl font-extrabold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-saffron-400 to-terra-500 text-night-950">د</span>
              {t.common.appName}
            </span>

            {/* Picking a language is the first thing a visitor may need. */}
            <div className="flex gap-1 rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] p-1">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { sfx.nav(); setSetting('lang', l.code as Lang) }}
                  title={l.name}
                  aria-label={l.name}
                  aria-pressed={lang === l.code}
                  className={`rounded-xl px-2 py-1 font-display text-lg font-extrabold ${lang === l.code ? 'bg-zellige-500/15' : 'opacity-60 hover:opacity-100'}`}
                >
                  {l.badge}
                </button>
              ))}
            </div>

            <div className="ms-auto flex items-center gap-2">
              <Link to="/ouders" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] sm:block">
                {t.landing.voorOuders}
              </Link>
              <Link to="/woorden" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] sm:block">
                {t.landing.woordenboek}
              </Link>
              <Link to={started ? `/les/${nextLesson(state)}` : '/leren'}>
                <Button>{started ? t.landing.gaVerder : t.landing.beginGratis}</Button>
              </Link>
            </div>
          </nav>

          <div className="grid items-center gap-8 py-14 sm:py-20 md:grid-cols-2">
            <div>
              {/* Which country, before the first word of the sentence. */}
              <span className="flex items-center gap-3">
                <Vlag size={34} className="rounded shadow-sm" />
                <p className="ar inline-block text-2xl font-bold text-zellige-600 dark:text-zellige-300">الدارجة</p>
              </span>
              <h1 className="mt-1 font-display text-4xl leading-tight font-extrabold sm:text-6xl">
                {t.landing.titel1}
                <span className="bg-gradient-to-r from-saffron-500 to-terra-500 bg-clip-text text-transparent">
                  {t.landing.titelAccent}
                </span>
                {t.landing.titel2}
              </h1>
              <p className="mt-4 max-w-lg text-lg text-[var(--ink-soft)]">{t.landing.intro}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={started ? `/les/${nextLesson(state)}` : '/leren'}>
                  <Button className="px-8 py-4 text-lg">{started ? `🔥 ${t.landing.gaVerder}` : t.landing.startLes1}</Button>
                </Link>
                <Link to="/woorden"><Button variant="secondary" className="px-6 py-4 text-lg">{t.landing.bekijkWoorden}</Button></Link>
              </div>
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                {t.landing.cijfers(allWords.length, UNITS.length, LETTERS.length)}
              </p>
            </div>

            <div className="relative">
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                className="mx-auto w-fit"
              >
                <Mascot mood="juich" size={190} />
              </motion.div>

              <Card className="mx-auto mt-4 max-w-sm p-5 text-center shadow-xl">
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">{t.landing.probeer}</p>
                <div className="ar mt-2 text-5xl font-bold">{w.ar}</div>
                <p className="mt-1 font-display text-lg font-extrabold text-zellige-600 dark:text-zellige-300">{w.tr}</p>
                <p className="text-[var(--ink-soft)]">{w.emoji} {meaning(w)}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="secondary" mute onClick={() => say(w.ar, { tr: w.tr })}>{t.landing.hoorHet}</Button>
                  <Button onClick={() => { sfx.tap(); setTaste((n) => n + 1) }}>{t.landing.volgende}</Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------- features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-3xl font-extrabold">{t.landing.waaromTitel}</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {t.landing.waarom.map(([emoji, title, body]) => (
            <Card key={title} className="p-5">
              <span className="text-3xl" aria-hidden="true">{emoji}</span>
              <h3 className="mt-2 font-display text-lg font-extrabold">{title}</h3>
              <p className="text-sm text-[var(--ink-soft)]">{body}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ curriculum */}
      <section className="border-y border-[var(--line)] bg-[var(--surface-sunken)] py-16">
        <div className="mx-auto max-w-5xl px-4">
          <h2 className="font-display text-3xl font-extrabold">{t.landing.padTitel}</h2>
          <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">{t.landing.padUitleg(UNITS.length)}</p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {UNITS.map((u, i) => (
              <li key={u.id}>
                <Card className="flex h-full items-start gap-3 p-4">
                  <span className="text-2xl" aria-hidden="true">{u.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-display font-extrabold">{i + 1}. {u.title}</div>
                    <div className="text-sm text-[var(--ink-soft)]">{unitSubtitle(u, lang)}</div>
                    <div className="mt-1 text-xs font-bold uppercase text-zellige-600 dark:text-zellige-300">
                      {u.level} · {t.landing.lessenAantal(u.lessons.length)}
                    </div>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---------------------------------------------------------- ouders */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <div className="grid items-center gap-8 md:grid-cols-2">
          <div>
            <h2 className="font-display text-3xl font-extrabold">{t.landing.oudersTitel}</h2>
            <ul className="mt-5 space-y-3 text-[var(--ink-soft)]">
              {t.landing.oudersPunten.map(([emoji, lead, rest]) => (
                <li key={lead}>{emoji} <strong className="text-[var(--ink)]">{lead}</strong> {rest}</li>
              ))}
            </ul>
            <Link to="/ouders" className="mt-6 inline-block">
              <Button variant="secondary">{t.landing.oudersKnop}</Button>
            </Link>
          </div>
          <Card className="p-6">
            <p className="font-display text-xl font-extrabold">{t.landing.citaat}</p>
            <p className="mt-2 text-[var(--ink-soft)]">{t.landing.citaatBody}</p>
            <div className="mt-5 flex items-center gap-3">
              <Mascot mood="blij" size={56} />
              <p className="text-sm text-[var(--ink-soft)]">{t.landing.mascotte}</p>
            </div>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section className="border-t border-[var(--line)] py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-3xl font-extrabold">{t.landing.vragenTitel}</h2>
          <div className="mt-6 space-y-3">
            {t.landing.faq.map(([q, a]) => (
              <details key={q} className="group rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] p-5">
                <summary className="cursor-pointer list-none font-display text-lg font-extrabold marker:hidden">
                  <span className="me-2 text-zellige-500 group-open:hidden">+</span>
                  <span className="me-2 hidden text-zellige-500 group-open:inline">−</span>
                  {q}
                </summary>
                <p className="mt-3 text-[var(--ink-soft)]">{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <Card className="zellige overflow-hidden p-10 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">{t.landing.ctaTitel}</h2>
          <p className="mx-auto mt-3 max-w-xl text-[var(--ink-soft)]">{t.landing.ctaBody}</p>
          <Link to="/leren" className="mt-6 inline-block">
            <Button className="px-10 py-4 text-lg">{t.landing.ctaKnop}</Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-[var(--line)] py-10 text-center text-sm text-[var(--ink-soft)]">
        <p className="font-display text-lg font-extrabold text-[var(--ink)]">{t.common.appName} · الدارجة</p>
        <p className="mt-1">{t.landing.voetnoot}</p>
        <nav className="mt-4 flex flex-wrap justify-center gap-4">
          <Link to="/leren" className="hover:underline">{t.nav.leren}</Link>
          <Link to="/woorden" className="hover:underline">{t.nav.woorden}</Link>
          <Link to="/letters" className="hover:underline">{t.nav.letters}</Link>
          <Link to="/verhalen" className="hover:underline">{t.nav.verhalen}</Link>
          <Link to="/ouders" className="hover:underline">{t.nav.ouders}</Link>
          <Link to="/instellingen" className="hover:underline">{t.nav.instellingen}</Link>
          <Link to="/volledig" className="hover:underline">{t.unlock.titel}</Link>
          <Link to="/privacy" className="hover:underline">{t.nav.privacy}</Link>
          <FeedbackLink />
        </nav>
      </footer>
    </div>
  )
}
