import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UNITS } from '../content/curriculum'
import { allWords, word } from '../content/lexicon'
import { STORIES } from '../content/stories'
import { LETTERS } from '../content/alphabet'
import { say, sfx } from '../engine/audio'
import { nextLesson, useStore } from '../engine/store'
import { Button, Card } from '../ui/kit'
import { Mascot } from '../ui/Mascot'

const TASTER = ['salam', 'shukran', 'atay', 'bnin', 'yallah', 'khobz', 'mzyan', 'bslama']

const FAQ = [
  {
    q: 'Wat is Darija precies?',
    a: 'Darija is het Marokkaans-Arabisch dat mensen thuis en op straat spreken. Het is geen dialect dat je uit een schoolboek Standaardarabisch leert: het heeft eigen woorden uit het Amazigh, Frans en Spaans, kortere klanken en een eigen ritme. Wie Darija spreekt, praat met familie in Marokko — wie alleen Standaardarabisch leert, vaak niet.',
  },
  {
    q: 'Voor welke leeftijd is dit?',
    a: 'Vanaf ongeveer zeven jaar zelfstandig, jonger samen met een ouder. De lessen zijn kort en werken ook zonder lezen: je kunt het Arabische schrift uitzetten en alleen luisteren en kiezen. Voor tieners loopt het pad door tot A2, met langere zinnen en gesprekken.',
  },
  {
    q: 'Moet ik Arabisch kunnen lezen?',
    a: 'Nee. Elk woord staat er ook in Latijnse letters, met de cijfers die Marokkanen zelf in appjes gebruiken (3 = ع, 7 = ح, 9 = ق). Wil je het schrift wél leren, dan staat er een eigen module klaar met alle letters en hun vormen.',
  },
  {
    q: 'Kost het iets?',
    a: 'Nee. Geen abonnement, geen advertenties, geen aankopen in de app. Er is ook geen account: je voortgang staat in je eigen browser.',
  },
  {
    q: 'Werkt het offline?',
    a: 'Ja. Gedmma installeert zich als app op je telefoon, tablet of laptop en werkt daarna zonder internet — handig in de auto, het vliegtuig of in Marokko zelf.',
  },
  {
    q: 'Welk Darija leren jullie?',
    a: 'De vorm die je in Casablanca en Rabat het meest hoort, want die wordt overal begrepen. Zegt jouw familie het anders? Dan heeft je familie gelijk: Darija verschilt per stad en per huis, en dat is geen fout.',
  },
]

export function Landing() {
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
          <nav className="flex items-center gap-3">
            <span className="flex items-center gap-2 font-display text-2xl font-extrabold">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-saffron-400 to-terra-500 text-night-950">ݣ</span>
              Gedmma
            </span>
            <div className="ms-auto flex items-center gap-2">
              <Link to="/ouders" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] sm:block">
                Voor ouders
              </Link>
              <Link to="/woorden" className="hidden rounded-xl px-3 py-2 text-sm font-bold text-[var(--ink-soft)] hover:text-[var(--ink)] sm:block">
                Woordenboek
              </Link>
              <Link to={started ? `/les/${nextLesson(state)}` : '/leren'}>
                <Button>{started ? 'Ga verder' : 'Begin gratis'}</Button>
              </Link>
            </div>
          </nav>

          <div className="grid items-center gap-8 py-14 sm:py-20 md:grid-cols-2">
            <div>
              <p className="ar inline-block text-2xl font-bold text-zellige-600 dark:text-zellige-300">قدّام</p>
              <h1 className="mt-1 font-display text-4xl leading-tight font-extrabold sm:text-6xl">
                Leer <span className="bg-gradient-to-r from-saffron-500 to-terra-500 bg-clip-text text-transparent">Darija</span>,
                de taal van thuis.
              </h1>
              <p className="mt-4 max-w-lg text-lg text-[var(--ink-soft)]">
                Marokkaans-Arabisch voor kinderen en jongeren. Korte lessen, echte woorden, spelletjes en een pad dat
                zich aanpast aan wat jij nog niet kent. Gratis, zonder advertenties, werkt offline.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link to={started ? `/les/${nextLesson(state)}` : '/leren'}>
                  <Button className="px-8 py-4 text-lg">{started ? '🔥 Ga verder' : 'Start met les 1'}</Button>
                </Link>
                <Link to="/woorden"><Button variant="secondary" className="px-6 py-4 text-lg">Bekijk de woorden</Button></Link>
              </div>
              <p className="mt-4 text-sm text-[var(--ink-soft)]">
                {allWords.length} woorden · {UNITS.length} units · {LETTERS.length} letters · geen account nodig
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
                <p className="text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">Probeer meteen</p>
                <div className="ar mt-2 text-5xl font-bold">{w.ar}</div>
                <p className="mt-1 font-display text-lg font-extrabold text-zellige-600 dark:text-zellige-300">{w.tr}</p>
                <p className="text-[var(--ink-soft)]">{w.emoji} {w.nl}</p>
                <div className="mt-4 flex justify-center gap-2">
                  <Button variant="secondary" onClick={() => say(w.ar, { tr: w.tr })}>🔊 Hoor het</Button>
                  <Button onClick={() => { sfx.tap(); setTaste((t) => t + 1) }}>Volgende</Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </header>

      {/* -------------------------------------------------------- features */}
      <section className="mx-auto max-w-5xl px-4 py-16">
        <h2 className="font-display text-3xl font-extrabold">Waarom het blijft hangen</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            ['🎧', 'Alles klinkt', 'Elk woord en elke zin kun je horen — één tik voor normaal, twee voor langzaam.'],
            ['🔁', 'Slim herhalen', 'Woorden komen terug precies voordat je ze vergeet, en lastige woorden vaker.'],
            ['🎤', 'Zelf praten', 'Spreekoefeningen luisteren mee, zodat je durft te zeggen wat je leert.'],
            ['🔤', 'Arabisch schrift', 'Alle letters met hun vormen aan het begin, het midden en het eind — of laat het weg.'],
            ['🎮', 'Spelen telt mee', 'Tijdrace, geheugenspel en letterspel gebruiken dezelfde woorden als je lessen.'],
            ['📖', 'Echte gesprekken', `${STORIES.length} verhalen waarin je op elke zin kunt tikken voor de vertaling.`],
          ].map(([emoji, title, body]) => (
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
          <h2 className="font-display text-3xl font-extrabold">Van salam tot de souq</h2>
          <p className="mt-2 max-w-2xl text-[var(--ink-soft)]">
            {UNITS.length} units die oplopen van je eerste hallo tot afdingen op de markt en de weg vragen in de medina.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {UNITS.map((u, i) => (
              <li key={u.id}>
                <Card className="flex h-full items-start gap-3 p-4">
                  <span className="text-2xl" aria-hidden="true">{u.emoji}</span>
                  <div className="min-w-0">
                    <div className="font-display font-extrabold">{i + 1}. {u.title}</div>
                    <div className="text-sm text-[var(--ink-soft)]">{u.subtitle}</div>
                    <div className="mt-1 text-xs font-bold uppercase text-zellige-600 dark:text-zellige-300">
                      {u.level} · {u.lessons.length} lessen
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
            <h2 className="font-display text-3xl font-extrabold">Gemaakt om aan een kind te geven</h2>
            <ul className="mt-5 space-y-3 text-[var(--ink-soft)]">
              <li>🔒 <strong className="text-[var(--ink)]">Geen account.</strong> Geen e-mail, geen wachtwoord, geen profiel.</li>
              <li>📵 <strong className="text-[var(--ink)]">Geen advertenties</strong> en niets te kopen.</li>
              <li>💾 <strong className="text-[var(--ink)]">Alles blijft op het apparaat.</strong> Voortgang staat in de browser, niet op een server.</li>
              <li>❤️ <strong className="text-[var(--ink)]">Hartjes uit kan.</strong> Fouten maken mag zonder straf.</li>
              <li>🏫 <strong className="text-[var(--ink)]">Klaar voor de klas.</strong> Draait op elke chromebook, zonder installatie.</li>
            </ul>
            <Link to="/ouders" className="mt-6 inline-block"><Button variant="secondary">Lees de uitleg voor ouders</Button></Link>
          </div>
          <Card className="p-6">
            <p className="font-display text-xl font-extrabold">“Kifash kanqolo…?”</p>
            <p className="mt-2 text-[var(--ink-soft)]">
              De mooiste les komt niet uit een app. Laat je kind je elke dag één woord leren — uitleggen is de beste
              manier om iets vast te zetten. Gedmma geeft de woorden, jullie geven het gesprek.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <Mascot mood="blij" size={56} />
              <p className="text-sm text-[var(--ink-soft)]">Fnek, de fennek, wijst de weg. Hij heeft geduld.</p>
            </div>
          </Card>
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section className="border-t border-[var(--line)] py-16">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="font-display text-3xl font-extrabold">Vragen</h2>
          <div className="mt-6 space-y-3">
            {FAQ.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] p-5">
                <summary className="cursor-pointer list-none font-display text-lg font-extrabold marker:hidden">
                  <span className="me-2 text-zellige-500 group-open:hidden">+</span>
                  <span className="me-2 hidden text-zellige-500 group-open:inline">−</span>
                  {item.q}
                </summary>
                <p className="mt-3 text-[var(--ink-soft)]">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------- cta */}
      <section className="mx-auto max-w-5xl px-4 pb-20">
        <Card className="zellige overflow-hidden p-10 text-center">
          <h2 className="font-display text-3xl font-extrabold sm:text-4xl">Yallah — beginnen?</h2>
          <p className="mx-auto mt-3 max-w-xl text-[var(--ink-soft)]">
            De eerste les duurt twee minuten en je kunt daarna hallo zeggen, bedanken en afscheid nemen in het Darija.
          </p>
          <Link to="/leren" className="mt-6 inline-block"><Button className="px-10 py-4 text-lg">Start nu</Button></Link>
        </Card>
      </section>

      <footer className="border-t border-[var(--line)] py-10 text-center text-sm text-[var(--ink-soft)]">
        <p className="font-display text-lg font-extrabold text-[var(--ink)]">Gedmma · قدّام</p>
        <p className="mt-1">“Gedmma” betekent vooruit. Precies wat je hier doet.</p>
        <nav className="mt-4 flex flex-wrap justify-center gap-4">
          <Link to="/leren" className="hover:underline">Leerpad</Link>
          <Link to="/woorden" className="hover:underline">Woordenboek</Link>
          <Link to="/letters" className="hover:underline">Letters</Link>
          <Link to="/verhalen" className="hover:underline">Verhalen</Link>
          <Link to="/ouders" className="hover:underline">Voor ouders</Link>
          <Link to="/instellingen" className="hover:underline">Instellingen</Link>
        </nav>
      </footer>
    </div>
  )
}
