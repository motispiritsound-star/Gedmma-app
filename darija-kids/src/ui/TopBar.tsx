import { useEffect, useRef } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { heartsNow, levelOf, MAX_HEARTS, msUntilNextHeart, reeksNu, useStore, xpToday } from '../engine/store'
import { sfx } from '../engine/audio'
import { Progress } from './kit'
import { useT } from '../i18n'
import { Vlag } from './Khatim'

const LINKS = [
  { to: '/leren', key: 'leren' },
  { to: '/herhalen', key: 'herhalen' },
  { to: '/woorden', key: 'woorden' },
  { to: '/letters', key: 'letters' },
  { to: '/verhalen', key: 'verhalen' },
  { to: '/spelen', key: 'spelen' },
  { to: '/profiel', key: 'jij' },
] as const

/**
 * Een open hangslot, getekend en niet als emoji.
 *
 * Hier stond de emoji van een open hangslot, en die werd op 390 pixels een
 * gouden vlek: elk toestel tekent zijn eigen emoji, en op twaalf pixels is
 * daar niets van te herkennen. Een lijntekening houdt zijn vorm op elke maat
 * en ziet er op elk toestel hetzelfde uit.
 *
 * En hij staat open. Dit is wat je opent, niet wat je niet mag.
 */
const Hangslot = () => (
  <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor"
       strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="11" width="14" height="10" rx="2.2" />
    <path d="M7 11V7a5 5 0 0 1 10 0" />
  </svg>
)

export function TopBar() {
  const t = useT()
  const state = useStore((s) => s)
  const heartHint = (ms: number) =>
    ms <= 0 ? t.topbar.hartjesVol : t.topbar.volgendHartje(Math.ceil(ms / 60_000))
  const hearts = heartsNow(state)
  const { level, into, span } = levelOf(state.xp)
  const goal = state.settings.dailyGoal
  const done = xpToday(state)

  /*
   * De statusbalk hoort hier bovenop te mogen liggen, niet erdoorheen.
   *
   * Met targetSdkVersion 36 tekent Android 15 standaard tot in de hoeken,
   * dus het toestel geeft de app de volle hoogte en verwacht dat de app
   * zelf om de klok en het batterijpictogram heen werkt. Doe je dat niet,
   * dan loopt de د van het logo tegen de tijd aan. Play Console meldt het
   * als "Edge-to-edge may not display for all users".
   *
   * De opvulling zit op de balk zelf en niet op de body, want hij is
   * `sticky top-0`: bij het scrollen plakt hij tegen de bovenkant van het
   * venster, en die bovenkant ligt onder de statusbalk. Zo houdt de
   * achtergrond van de balk dat strookje gevuld en blijft de inhoud eronder.
   *
   * De onderkant werd al zo opgelost, in App.tsx bij de tabbalk.
   */
  /*
   * De hoogte van deze balk, als CSS-variabele, zodat een bladzijde eronder
   * iets kan laten plakken.
   *
   * Hij is `sticky top-0` en zijn hoogte staat niet vast: bij een grote
   * letterinstelling breekt de rij af naar twee regels, en op een toestel met
   * een inkeping komt `--rand-boven` er nog bovenop. Een vast getal in een
   * andere bladzijde klopt dus op precies één toestel. Meten en doorgeven is
   * de enige manier die overal klopt.
   */
  const balk = useRef<HTMLElement>(null)
  useEffect(() => {
    const el = balk.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const zet = () => document.documentElement.style.setProperty('--kop-hoogte', `${Math.round(el.getBoundingClientRect().height)}px`)
    zet()
    const kijker = new ResizeObserver(zet)
    kijker.observe(el)
    return () => kijker.disconnect()
  }, [])

  return (
    <header
      ref={balk}
      /* `niet-op-papier`: een diploma wordt afgedrukt, en dan hoort er geen
         kopbalk met drie tellers en een hangslot boven op het vel te staan.
         Zie de afdrukstijl onderaan index.css. */
      className="niet-op-papier sticky top-0 z-40 border-b border-[var(--line)] bg-[var(--surface)]/90 backdrop-blur"
      style={{ paddingTop: 'var(--rand-boven)' }}
    >
      {/*
        `flex-wrap`, en dat is geen opmaak maar toegankelijkheid.

        Wie in zijn toestel een grote letter instelt, schaalt de wortelmaat mee
        — en dan werd deze rij 62 pixels te breed op élk scherm. De hele app
        schoof dan zijwaarts: WCAG 1.4.10, en in de praktijk een app waarin je
        bij elke tik eerst terug moet vegen.

        Afbreken in plaats van afkappen: bij een gewone lettergrootte verandert
        er niets, bij een grote zakken de tellers naar een tweede regel en
        blijven ze alle drie leesbaar. Nagemeten op 390 pixels bij een
        wortelletter van 16 en van 24.
      */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-3 px-4 py-2.5">
        {/*
          De `py-1.5 -my-1.5` is geen opmaak maar een raakvlak.

          Dit is de weg terug naar het begin, en het was 32 pixels hoog: de
          tegel met de د, en verder niets om aan te tikken. Apple en Google
          houden allebei 44 aan als ondergrens voor een vinger, en dit is een
          app voor kinderen van vier — die mikken slechter dan de volwassene
          die het ontwerpt en op een muis test.

          De opvulling maakt het raakvlak 44 hoog; de negatieve marge trekt die
          er weer af, zodat de balk zelf even hoog blijft. Je ziet dus niets
          veranderen en je raakt hem wel.
        */}
        <Link to="/" onClick={() => sfx.nav()} className="flex shrink-0 items-center gap-2 py-1.5 -my-1.5 font-display text-xl font-extrabold">
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-saffron-400 to-terra-500 text-night-950">د</span>
          <span className="hidden sm:inline">Darijaforkids</span>
          <Vlag size={26} className="rounded shadow-sm" />
        </Link>

        {/* The five labels are short in Dutch and long in Spanish, and at
            tablet width the row used to push the counters off the screen —
            the whole page then scrolled sideways. The nav is the part that
            gives: it shrinks, and slides if it has to. */}
        <nav
          className="ms-2 hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto sm:flex [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label={t.nav.onderdelen}
        >
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              onClick={() => sfx.nav()}
              className={({ isActive }) =>
                `shrink-0 whitespace-nowrap rounded-xl px-3 py-1.5 text-sm font-bold transition ${isActive ? 'bg-[var(--surface-sunken)] text-zellige-600 dark:text-zellige-300' : 'text-[var(--ink-soft)] hover:text-[var(--ink)]'}`
              }
            >
              {t.nav[l.key]}
            </NavLink>
          ))}
        </nav>

        {/*
          `flex-wrap` en geen `shrink-0`: de tellers mogen onder elkaar.

          De rij eromheen wikkelde al, maar dit blok zelf niet, en dan schuift
          het als geheel naar buiten. Gemeten op 320 bij een wortelgrootte van
          24px -- een kleine telefoon met de grootste letters -- liep de balk
          52px buiten beeld, op elk scherm van de app.
        */}
        <div className="ms-auto flex flex-wrap items-center gap-2.5 text-sm font-bold">
          {/*
            De weg naar het abonnement, op elk scherm waar de balk staat.

            Hij stond er niet, en dat was de enige manier erheen: een slotje
            tegenkomen. Wie na vier gratis lessen nog eens wil kijken wat het
            kost, moest daarvoor eerst ergens tegen een gesloten deur lopen —
            en dat is precies de persoon die wél wil betalen.

            Geen teller maar een knop, dus saffraan in plaats van de grijstint
            van de cijfers ernaast. Het hangslot staat er open: dit is wat je
            opent, niet wat je niet mag.

            Weg zodra er betaald is. Een knop die "koop" zegt tegen iemand die
            gekocht heeft, is het eerste wat een beoordelaar aanwijst — en het
            eerste waar een klant over mailt.

            De opvulling zit op de link en de pil zelf blijft klein: zo is het
            raakvlak 44 hoog zonder dat de balk meegroeit, net als bij de
            merklink hierboven. `raakvlak.test.ts` bewaakt dat.
          */}
          {!state.unlocked && (
            <Link
              to="/volledig"
              onClick={() => sfx.nav()}
              aria-label={t.unlock.titel}
              className="-my-2.5 flex shrink-0 items-center py-2.5"
            >
              <span className="flex items-center gap-1 rounded-full bg-saffron-500 px-2.5 py-1 font-display text-xs font-extrabold text-night-950">
                <Hangslot />
                {t.topbar.ontgrendel}
              </span>
            </Link>
          )}
          <span title={`${t.common.niveau} ${level}`} className="hidden items-center gap-1 sm:flex">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-zellige-500/15 text-zellige-600 dark:text-zellige-300">{level}</span>
          </span>
          {/* `reeksNu` en niet `state.streak`: die laatste staat er nog zoals
              je hem achterliet, ook na veertig dagen weg. */}
          <span title={t.topbar.dagenOpRij(reeksNu(state))} className="flex items-center gap-1">
            <span aria-hidden="true">🔥</span>{reeksNu(state)}
          </span>
          <span title={t.topbar.edelstenen} className="flex items-center gap-1">
            <span aria-hidden="true">💎</span>{state.gems}
          </span>
          {state.settings.hearts && (
            <span title={heartHint(msUntilNextHeart(state))} className="flex items-center gap-1">
              <span aria-hidden="true">{hearts > 0 ? '❤️' : '🖤'}</span>{hearts}/{MAX_HEARTS}
            </span>
          )}
        </div>
      </div>

      {/*
        Het balkje wordt groen zodra het dagdoel gehaald is.

        Het liep vol en bleef saffraan, en dan zegt een vol balkje net zoveel
        als een halfvol balkje: je moet het getal ernaast lezen om te weten of
        je er bent. Groen is in deze app al de kleur van "gehaald" -- de
        weekstaafjes op de profielpagina kleuren mee op dezelfde grens.
      */}
      <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 pb-2">
        <Progress value={Math.min(1, done / goal)} tone={done >= goal ? 'mint' : 'saffron'} className="h-2" />
        {/*
          Het vinkje en niet een groen lettertje. `text-mint-600` op de
          crèmeachtergrond haalt 3,10:1, en dit is vet van twaalf pixels -- dat
          telt niet als grote tekst, dus de grens is 4,5:1. Het balkje draagt
          de kleur, het vinkje draagt het voor wie kleur niet ziet, en de tekst
          wordt dónkerder in plaats van lichter: van 6,78:1 naar meer.
        */}
        <span className={`shrink-0 text-xs font-bold ${done >= goal ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}>
          {done >= goal && <span aria-hidden="true">✓ </span>}
          {t.topbar.voortgang(done, goal, level, into, span)}
        </span>
      </div>
    </header>
  )
}
