import { useEffect, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { UNITS } from '../content/curriculum'
import { allWords } from '../content/lexicon'
import {
  BADGES, kanVriesdagKopen, koopVriesdag, levelOf, MAX_VRIESDAGEN, PRIJS_VRIESDAG,
  AVATARS, progressOfUnit, reeksNu, setState, today, useStore,
} from '../engine/store'
import { sfx } from '../engine/audio'
import { Button, Card, Progress, SectionTitle, Stat } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { Khatim } from '../ui/Khatim'
import { Medaillon } from '../ui/Motief'
import { HISTORY } from '../content/history'
import { localeOf, useLang, useT } from '../i18n'
import { unitSubtitle } from '../content/localise'


/** Everything the learner has built up, on one page. */
export function Profile() {
  const t = useT()
  const lang = useLang()
  const state = useStore((s) => s)
  const { level, into, span } = levelOf(state.xp)
  const seen = Object.keys(state.cards).length
  const solid = Object.values(state.cards).filter((c) => c.strength >= 0.85).length
  const doneLessons = Object.keys(state.lessons).length

  /*
   * Vers betaald? Dan komt deze bladzijde uit `/volledig` en hoort er iets te
   * staan. Een zoekparameter en geen staat in de winkelcode: wie de bladzijde
   * daarna opnieuw opent heeft hem niet meer, en dat is precies goed -- het
   * welkom hoort één keer.
   */
  const [params] = useSearchParams()
  const welkom = params.get('welkom') === '1'
  const naamVeld = useRef<HTMLInputElement>(null)

  // Het toetsenbord niet opengooien; alleen de cursor klaarzetten op het veld
  // waar iemand voor gekomen is. `preventScroll` omdat de bladzijde anders
  // meteen naar beneden springt, langs de kaart die net het nieuws bracht.
  useEffect(() => {
    if (welkom) naamVeld.current?.focus({ preventScroll: true })
  }, [welkom])

  /**
   * Of er volledige toegang is, en sinds wanneer.
   *
   * `unlockedAt` staat er al sinds het begin maar werd nergens gelezen. Het is
   * de dag waarop de winkel voor het eerst zei dat het abonnement loopt — niet
   * de dag van betalen, want de eerste drie dagen zijn gratis. "Lid sinds" is
   * dus eerlijk en "betaald op" zou dat niet zijn.
   */
  const lid = state.unlocked
  const sinds = state.unlockedAt
    ? new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long' }).format(state.unlockedAt)
    : null

  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (6 - i))
    const key = today(d)
    return { key, day: t.profile.dagen[d.getDay()]!, xp: state.daily[key] ?? 0 }
  })
  const peak = Math.max(state.settings.dailyGoal, ...week.map((w) => w.xp))

  return (
    <div className="mx-auto max-w-3xl lg:max-w-5xl px-4 py-6">
      {/*
        Na het betalen veranderde er niets zichtbaars: sloten verdwenen, en
        verder zag de app er hetzelfde uit. Voor iemand die net zestig euro
        heeft uitgegeven is dat de verkeerde eerste indruk — de vraag die dan
        opkomt is "is het wel gelukt?".
        
        Dus krijgt deze kaart een gouden rand, de avatar een ring en de naam
        een regel eronder. Geen pop-up en geen felicitatie die je moet
        wegklikken: iets dat er gewoon staat, elke keer dat je kijkt.
      */}
      <Card className={`mb-6 flex flex-wrap items-center gap-5 p-5 ${lid ? 'border-2 border-saffron-400' : ''}`}>
        <div className="relative">
          <div className={`grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[var(--accent-400)] to-[var(--accent-600)] text-4xl ${
            lid ? 'ring-4 ring-saffron-400 ring-offset-2 ring-offset-[var(--surface-raised)]' : ''}`}
          >
            {state.avatar}
          </div>
          <span className="absolute -bottom-2 -end-2 rounded-full bg-zellige-600 px-2 py-0.5 text-xs font-extrabold text-white">
            {level}
          </span>
        </div>
        <div className="min-w-0 flex-1 basis-40">
          <h1 className="font-display text-2xl font-extrabold">{state.name || t.profile.leerling}</h1>
          {/*
            De pil draagt alleen het woord; de datum staat ernaast in gewoon
            grijs. Samen in één pil brak hij op een telefoon van 390 pixels
            over twee regels, en een insigne van twee regels is geen insigne.
          */}
          {lid && (
            <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-saffron-500/15 px-2.5 py-1 font-display text-xs font-extrabold text-saffron-700 dark:text-saffron-300">
                <Khatim size={13} />
                {t.profile.lidTitel}
              </span>
              {sinds && <span className="text-xs text-[var(--ink-soft)]">{t.profile.lidSinds(sinds)}</span>}
            </p>
          )}
          <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.common.niveau} {level} · {t.profile.naarNiveau(into, span)}</p>
          <Progress value={into / span} tone="accent" className="mt-2" />
        </div>
        <Link to="/instellingen" className="w-full sm:w-auto"><Button variant="secondary" className="w-full">{t.profile.aanpassen}</Button></Link>
      </Card>

      {/*
        Wie je bent, op de bladzijde waar het staat.
        
        De naam stond alleen in Instellingen en de avatar alleen hier, dus wie
        zichzelf wilde invullen moest twee schermen langs en op het ene vinden
        wat op het andere te zien is. Nu staan ze bij elkaar, onder de kaart
        waar ze op terechtkomen.
        
        Instellingen houdt zijn veld; het is hetzelfde stukje staat en ze
        lopen niet uit elkaar.
      */}
      <Card className="mb-4 p-5">
        {welkom && (
          <>
            <p className="font-display text-lg font-extrabold">{t.profile.welkomTitel}</p>
            <p className="mt-1 mb-4 text-sm text-[var(--ink-soft)]">{t.profile.welkomUitleg}</p>
          </>
        )}
        <label htmlFor="profielnaam" className="text-sm font-bold">{t.settings.naam}</label>
        <input
          id="profielnaam"
          ref={naamVeld}
          value={state.name}
          onChange={(e) => setState({ name: e.target.value.slice(0, 24) })}
          placeholder={t.settings.naamPlaceholder}
          autoComplete="given-name"
          enterKeyHint="done"
          className="mt-1 block w-full max-w-xs rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 outline-none focus:border-zellige-500"
        />
        <div className="mt-4 flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => { sfx.tap(); setState({ avatar: a }) }}
              className={`grid h-11 w-11 place-items-center rounded-2xl border-2 text-2xl ${state.avatar === a ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'}`}
              aria-label={t.profile.kies(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat value={state.xp} label={t.profile.xpTotaal} emoji="⚡" />
        <Stat value={`${reeksNu(state)} / ${state.bestStreak}`} label={t.profile.reeksRecord} emoji="🔥" />
        <Stat value={`${seen}/${allWords.length}`} label={t.profile.woordenGezien} emoji="📚" />
        <Stat value={solid} label={t.profile.vastgezet} emoji="🔒" />
      </div>

      {/*
        De vriesdag, naast het getal dat hij beschermt.

        `addXp` kende de regel al — een gemiste dag breekt de reeks niet als er
        een vriesdag op zak zit — maar er was geen enkele plek waar dat aantal
        omhoogging. Die tak kon dus nooit uitgevoerd worden, en edelstenen
        werden wel verdiend en nergens uitgegeven. Dit is waar die twee elkaar
        vinden.

        Niet met geld. Edelstenen komen alleen binnen door te spelen, en dat
        blijft zo: dit is een app voor kinderen.
      */}
      <Card className="mt-3 flex flex-wrap items-center gap-4 p-5">
        <span className="text-3xl" aria-hidden="true">🧊</span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display font-extrabold">{t.profile.vriesTitel}</h2>
          <p className="text-sm text-[var(--ink-soft)]">{t.profile.vriesUitleg(MAX_VRIESDAGEN)}</p>
          <p className="mt-1 text-sm font-bold">{t.profile.vriesHeb(state.freezes, MAX_VRIESDAGEN)}</p>
        </div>
        {/*
          `w-full sm:w-auto`: op een telefoon hoort dit onder de uitleg, niet
          ernaast. Zonder dat perste de prijsregel de uitleg in een kolom van
          zes woorden breed -- `flex-wrap` alleen is niet genoeg, want een
          tekst naast een `flex-1` krimpt gewoon mee tot hij past.
        */}
        {state.freezes >= MAX_VRIESDAGEN ? (
          <p className="w-full text-sm text-[var(--ink-soft)] sm:w-auto">{t.profile.vriesVol(MAX_VRIESDAGEN)}</p>
        ) : kanVriesdagKopen(state) ? (
          <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={() => { if (koopVriesdag()) sfx.confirm() }}
          >
            {t.profile.vriesKoop(PRIJS_VRIESDAG)}
          </Button>
        ) : (
          /* Geen uitgeschakelde knop: die nodigt uit tot drukken en legt niets
             uit. Wat het kost zegt meer dan een knop die niets doet. */
          <p className="w-full text-sm text-[var(--ink-soft)] sm:w-auto">{t.profile.vriesTeWeinig(PRIJS_VRIESDAG)}</p>
        )}
      </Card>

      <SectionTitle sub={t.profile.dezeWeekUitleg}>
        <span className="mt-8 block">{t.profile.dezeWeek}</span>
      </SectionTitle>
      <Card className="p-5">
        <div className="relative flex h-36 items-end gap-2">
          <div
            className="absolute inset-x-0 border-t-2 border-dashed border-saffron-500/60"
            style={{ bottom: `${(state.settings.dailyGoal / peak) * 100}%` }}
            aria-hidden="true"
          />
          {/* `min-w-0` op de staafjes: het dagletterje eronder heeft een eigen
              minimumbreedte, en bij grote letters duwde die de zeven staafjes
              samen breder dan het scherm. */}
          {week.map((d) => (
            <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-t-lg ${d.xp >= state.settings.dailyGoal ? 'bg-mint-500' : 'bg-zellige-500/50'}`}
                style={{ height: `${Math.max(4, (d.xp / peak) * 100)}%` }}
                title={`${d.xp} XP`}
              />
              <span className="text-xs font-bold text-[var(--ink-soft)]">{d.day}</span>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle><span className="mt-8 block">{t.profile.beloningen}</span></SectionTitle>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((b) => {
          const earned = state.badges.includes(b.id)
          return (
            // A grid cell will not shrink below its content, and German names
            // its badges "Geschichtenerzähler" — one word, wider than half a
            // narrow phone, and the whole page slid sideways because of it.
            <li key={b.id} className="min-w-0">
              <Card className={`h-full min-w-0 p-4 text-center ${earned ? '' : 'opacity-55'}`}>
                <div className="text-3xl" aria-hidden="true">{earned ? b.emoji : '🔒'}</div>
                <div lang={lang} className="mt-1 hyphens-auto break-words font-display font-extrabold">
                  {t.badges[b.id].naam}
                </div>
                <div lang={lang} className="hyphens-auto text-xs text-[var(--ink-soft)]">
                  {t.badges[b.id].hint}
                </div>
              </Card>
            </li>
          )
        })}
      </ul>

      {/* The history cards live here rather than on the tab bar: they are
          something you have, like the badges above, not somewhere you go. */}
      <SectionTitle><span className="mt-8 block">{t.nav.geschiedenis}</span></SectionTitle>
      <Link to="/geschiedenis" className="block">
        <Card className="flex items-center gap-4 p-4">
          <Medaillon
            motief={HISTORY[Math.max(0, state.history.length - 1)]!.motief}
            size={62}
            className="shrink-0 text-khatim-500 dark:text-khatim-400"
          />
          <div className="min-w-0 flex-1">
            <div className="font-display font-extrabold">{t.history.link}</div>
            <div className="text-sm text-[var(--ink-soft)]">
              {t.history.verzameld(state.history.length, HISTORY.length)}
            </div>
            <Progress value={state.history.length / HISTORY.length} className="mt-1 h-2" />
          </div>
          <span className="shrink-0 text-[var(--ink-soft)]" aria-hidden="true">›</span>
        </Card>
      </Link>

      <SectionTitle><span className="mt-8 block">{t.profile.units}</span></SectionTitle>
      <ul className="space-y-2">
        {UNITS.map((u) => {
          const pct = progressOfUnit(u.id, state)
          const stars = u.lessons.reduce((sum, l) => sum + (state.lessons[l.id]?.stars ?? 0), 0)
          return (
            <li key={u.id}>
              <Card className="flex items-center gap-3 p-3">
                <span className="text-2xl" aria-hidden="true">{u.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="font-display font-extrabold">{u.title}</div>
                  <div className="text-xs text-[var(--ink-soft)]">{unitSubtitle(u, lang)}</div>
                  <Progress value={pct} className="mt-1 h-2" />
                </div>
                {/* Het getal in inktkleur en de ster in goud, apart. Samen
                    saffraan haalde het getal 2,15 op 1 op wit; de ster mag wel
                    goud blijven, want het getal ernaast zegt hetzelfde. */}
                <span className="flex shrink-0 items-center gap-1 text-sm font-bold text-[var(--ink)]">
                  <Khatim size={14} className="text-saffron-500" /> {stars}
                </span>
              </Card>
            </li>
          )
        })}
      </ul>

      <Card className="mt-8 flex flex-wrap items-center gap-4 p-5">
        <Mascot mood="blij" size={64} />
        {/* `basis-48` en niet `flex-1`: naast de mascotte en de knop hield
            `flex-1` hier 64 pixels over, en stond deze zin van veertien
            woorden over elf regels. Zie `geknepen.test.ts`. */}
        <p className="min-w-0 grow basis-48 text-sm text-[var(--ink-soft)]">
          {doneLessons === 0 ? t.profile.nogGeenLes : t.profile.lessenAf(doneLessons)}
        </p>
        <Link to="/leren"><Button>{t.profile.verderLeren}</Button></Link>
      </Card>
    </div>
  )
}
