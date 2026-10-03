import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UNITS } from '../content/curriculum'
import { unitSubtitle } from '../content/localise'
import type { Unit } from '../content/types'
import {
  aantalOndertekend, nieuweHandtekeningen, ondertekenaars, plankGezien, plankVol,
  sterrenVanUnit, wachtOpHandtekening,
} from '../engine/diploma'
import { getState, progressOfUnit, useStore } from '../engine/store'
import { sfx } from '../engine/audio'
import { localeOf, useLang, useT } from '../i18n'
import { Button, Card, Progress, SectionTitle } from '../ui/kit'
import { Khatim, Khatims } from '../ui/Khatim'
import { Oorkonde, Ondertekenen } from '../ui/Diploma'

/**
 * De plank: zeventien vakken, in de volgorde van het leerpad.
 *
 * Dit is de bladzijde waar het hele idee op uitkomt. Een diploma per unit is
 * één keer leuk; zeventien diploma's naast elkaar zijn een jaar, en dat jaar
 * is iets om aan iemand te laten zien. Daarom staan de lege vakken er ook: het
 * is een plank en niet een lijst van wat er binnen is.
 *
 * Hoe een leeg vak eruitziet is de moeilijkste keuze van deze bladzijde.
 * Eerst stond er een slotje in, met het percentage van de unit eronder, en
 * daarmee veranderde de plank in een lijstje met werk. Dat is precies wat hier
 * niet mag: een kind dat drie dagen niets deed hoort hier geen verwijt te
 * vinden. Wat er nu staat is de stippellijn van een lijst, het dier van de
 * unit lichtgrijs, en de naam. Geen slot, geen nul, geen "nog niet" — alleen
 * de vorm van wat er komt. Het percentage komt er pas bij zodra er in die unit
 * werkelijk iets gebeurd is, en dan is het geen achterstand maar voortgang.
 */
export function Diplomas() {
  const t = useT()
  const lang = useLang()
  const state = useStore((s) => s)
  const [uit, setUit] = useState<string | null>(null)
  const [teken, setTeken] = useState<Unit | null>(null)
  /** Wat er naar de printer gaat: alles, of één unit. */
  const [afdruk, setAfdruk] = useState<'alles' | string | null>(null)

  /*
   * Welke handtekeningen nieuw zijn — vastgelegd bij het openen, vóór het
   * effect eronder ze als gezien wegstreept. Anders is de lijst bij de eerste
   * tekening al leeg en zie je nooit welk vak er bij is gekomen.
   */
  const [nieuw] = useState(() => nieuweHandtekeningen(getState()))
  useEffect(plankGezien, [])

  const behaald = UNITS.filter((u) => state.diplomas[u.id])
  const wacht = wachtOpHandtekening(state)
  const getekend = aantalOndertekend(state)
  const vol = plankVol(state)
  const tekenaars = ondertekenaars(state)

  /*
   * Afdrukken met `window.print()` en een afdrukstijl, en zonder één byte
   * nieuwe code van buiten.
   *
   * Het blad staat altijd in de bladzijde — verborgen op het scherm, zichtbaar
   * op papier — zodat Ctrl+P of "Afdrukken" uit het menu van het toestel het
   * hele boekje geeft zonder dat er eerst op een knop van ons getikt is. Wie
   * één diploma kiest, filtert datzelfde blad tot dat ene vel.
   *
   * `typeof window.print`: in een WebView zonder afdruklaag bestaat hij niet,
   * en dan hoort de knop er ook niet te staan in plaats van niets te doen.
   */
  const kanAfdrukken = typeof window !== 'undefined' && typeof window.print === 'function'
  useEffect(() => {
    if (!afdruk || !kanAfdrukken) return
    const klaar = () => setAfdruk(null)
    window.addEventListener('afterprint', klaar)
    // Eén tekening wachten, zodat het gefilterde blad er staat voordat de
    // browser de bladzijde pakt.
    const id = requestAnimationFrame(() => window.print())
    return () => { cancelAnimationFrame(id); window.removeEventListener('afterprint', klaar) }
  }, [afdruk, kanAfdrukken])

  const bladen = afdruk && afdruk !== 'alles' ? behaald.filter((u) => u.id === afdruk) : behaald

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="niet-op-papier">
        <SectionTitle kop="h1" sub={t.diploma.uitleg}>{t.diploma.titel}</SectionTitle>

        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="font-display text-lg font-extrabold">
              {t.diploma.plank(behaald.length, UNITS.length)}
            </p>
            {getekend > 0 && (
              <p className="text-sm font-bold text-[var(--ink-soft)]">
                {t.diploma.ondertekendDoor}{' '}
                {tekenaars.map((o) => `${o.naam} ${t.diploma.keer(o.aantal)}`).join(' · ')}
              </p>
            )}
          </div>
          <Progress value={behaald.length / UNITS.length} tone="accent" className="mt-2 h-3" />
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            {behaald.length === 0 ? t.diploma.plankLeeg : t.diploma.plankBezig}
          </p>
          {behaald.length > 0 && kanAfdrukken && (
            <div className="mt-4">
              <Button variant="secondary" onClick={() => setAfdruk('alles')}>🖨 {t.diploma.afdrukAlles}</Button>
              <p className="mt-2 text-xs text-[var(--ink-soft)]">{t.diploma.afdrukUitleg}</p>
            </div>
          )}
        </Card>

        {/*
          Wat er gebeurt als alle zeventien binnen zijn.

          Geen pop-up en geen confetti: dit is iets van maanden, en dat hoort
          niet als een melding voorbij te komen. Het is een kaart die er
          voortaan gewoon bovenaan staat, met de khatim erin die de app al
          overal gebruikt waar hij Marokko bedoelt.
        */}
        {vol && (
          <Card className="mb-6 border-2 border-[var(--accent-600)] p-5 text-center">
            <Khatim size={56} className="mx-auto text-khatim-500 dark:text-khatim-400" />
            <h2 className="mt-2 font-display text-xl font-extrabold">{t.diploma.volTitel}</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.diploma.volBody(UNITS.length)}</p>
          </Card>
        )}

        {/*
          De diploma's die nog niemand heeft ondertekend, apart bovenaan.

          Dit is de hele ouderkant van het idee in één kaart: een kind met een
          telefoon in zijn hand dat zegt "kijk". Er staat geen "nu doen" bij en
          er komt geen melding bij — hij staat er tot iemand erbij gaat zitten.
        */}
        {wacht.length > 0 && (
          <Card className="mb-6 p-5">
            <h2 className="font-display font-extrabold">{t.diploma.wacht}</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.diploma.wachtAantal(wacht.length)}</p>
            <ul className="mt-3 space-y-2">
              {wacht.map((id) => {
                const unit = UNITS.find((u) => u.id === id)!
                return (
                  <li key={id} className="flex flex-wrap items-center gap-2">
                    <span className="text-xl" aria-hidden="true">{unit.emoji}</span>
                    <span className="min-w-0 grow basis-32 font-display font-extrabold">{unit.title}</span>
                    <Button variant="secondary" onClick={() => setTeken(unit)}>{t.diploma.laatZienKort}</Button>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}

        <h2 className="mb-3 font-display text-xl font-extrabold">{t.diploma.link}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {UNITS.map((unit) => {
            const diploma = state.diplomas[unit.id]
            const open = uit === unit.id
            const pct = progressOfUnit(unit.id, state)
            const { gehaald, max } = sterrenVanUnit(unit.id, state)
            const isNieuw = nieuw.includes(unit.id)

            if (!diploma) {
              /*
                Het lege vak. Een `li` en geen knop: er is niets om aan te
                tikken, en een knop die niets doet is erger dan geen knop.
              */
              return (
                <li key={unit.id} className="min-w-0">
                  <Card className="h-full min-w-0 border-2 border-dashed bg-transparent p-4 shadow-none">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl opacity-35" aria-hidden="true">{unit.emoji}</span>
                      <div className="min-w-0">
                        <p lang={lang} className="hyphens-auto font-display font-extrabold text-[var(--ink-soft)]">
                          {unit.title}
                        </p>
                        <p lang={lang} className="hyphens-auto text-xs text-[var(--ink-soft)]">
                          {unitSubtitle(unit, lang)}
                        </p>
                      </div>
                    </div>
                    {/* Alleen als er in deze unit werkelijk iets gebeurd is.
                        Een balkje op nul naast een leeg vak maakt van de plank
                        een lijstje met werk. */}
                    {pct > 0 && <Progress value={pct} tone="zellige" className="mt-3 h-1.5" />}
                  </Card>
                </li>
              )
            }

            return (
              <li key={unit.id} className="min-w-0">
                <Card
                  className={`h-full min-w-0 overflow-hidden ${isNieuw ? 'border-2 border-[var(--accent-600)]' : ''}`}
                >
                  <button
                    type="button"
                    aria-expanded={open}
                    onClick={() => { sfx[open ? 'back' : 'tap'](); setUit(open ? null : unit.id); setAfdruk(null) }}
                    className="flex w-full items-start gap-3 p-4 text-start"
                  >
                    <span className="shrink-0 text-2xl" aria-hidden="true">{unit.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span lang={lang} className="block hyphens-auto font-display font-extrabold">{unit.title}</span>
                      <span className="mt-0.5 block">
                        <Khatims
                          stars={max ? Math.floor((gehaald / max) * 3) : 0}
                          size={13}
                          label={t.diploma.sterren(gehaald, max)}
                        />
                      </span>
                      {diploma.getekendOp ? (
                        <>
                          {diploma.woord && (
                            <span className="mt-1 block text-sm">“{diploma.woord}”</span>
                          )}
                          <span className="block text-xs font-bold text-[var(--ink-soft)]">
                            {t.diploma.ondertekendDoor} {diploma.door}
                          </span>
                        </>
                      ) : (
                        <span className="mt-1 block text-xs uppercase tracking-wide text-[var(--ink-soft)]">
                          {t.diploma.handtekening}
                        </span>
                      )}
                    </span>
                    {isNieuw && (
                      <span className="shrink-0 rounded-full bg-[var(--accent-500)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--accent-ink)]">
                        {t.diploma.nieuw}
                      </span>
                    )}
                  </button>

                  {open && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-[var(--line)] p-4"
                    >
                      <Oorkonde unit={unit} diploma={diploma} />
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Button variant="secondary" className="min-w-0 grow basis-32" onClick={() => setTeken(unit)}>
                          {diploma.getekendOp ? t.diploma.opnieuwKort : t.diploma.laatZien}
                        </Button>
                        {kanAfdrukken && (
                          <Button variant="secondary" className="min-w-0 grow basis-32" onClick={() => setAfdruk(unit.id)}>
                            🖨 {t.diploma.afdrukken}
                          </Button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </Card>
              </li>
            )
          })}
        </ul>

        <div className="mt-8 text-center">
          <Link to="/leren" className="inline-block"><Button>{t.profile.verderLeren}</Button></Link>
        </div>
      </div>

      <Ondertekenen unit={teken} onKlaar={() => setTeken(null)} />

      {/*
        Wat er op papier komt. Verborgen op het scherm, zichtbaar in de
        afdrukstijl — zie `.op-papier` onderaan index.css.

        De voorbladzijde komt er alleen bij vanaf twee diploma's: bij één vel
        is een titelblad ervoor een lege bladzijde met een naam erop.
      */}
      <div className="op-papier">
        {bladen.length > 1 && (
          <div className="afdrukblad text-center">
            <Khatim size={120} className="mx-auto text-khatim-500" />
            <p className="mt-6 font-display text-3xl font-extrabold">
              {state.name ? t.diploma.boekje(state.name) : t.diploma.boekjeZonderNaam}
            </p>
            <p className="mt-2 text-[var(--ink-soft)]">{t.diploma.boekjeBody(bladen.length)}</p>
            {tekenaars.length > 0 && (
              <p className="mt-6 text-sm font-bold">
                {t.diploma.ondertekendDoor}{' '}
                {tekenaars.map((o) => `${o.naam} ${t.diploma.keer(o.aantal)}`).join(' · ')}
              </p>
            )}
            <p className="mt-10 text-xs uppercase tracking-wide text-[var(--ink-soft)]">
              {new Intl.DateTimeFormat(localeOf(lang), { dateStyle: 'long' }).format(Date.now())}
            </p>
          </div>
        )}
        {bladen.map((unit) => (
          <div key={unit.id} className="afdrukblad">
            <Oorkonde unit={unit} diploma={state.diplomas[unit.id]!} />
          </div>
        ))}
      </div>
    </div>
  )
}
