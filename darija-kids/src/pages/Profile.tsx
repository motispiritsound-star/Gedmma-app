import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { UNITS } from '../content/curriculum'
import { LETTERS } from '../content/alphabet'
import { allWords } from '../content/lexicon'
import {
  BADGES, kanVriesdagKopen, koopVriesdag, levelOf, MAX_VRIESDAGEN, PRIJS_VRIESDAG,
  AVATARS, progressOfUnit, reeksNu, setState, today, useStore,
} from '../engine/store'
import { ebookWachtTot, TRIAL_DAYS } from '../engine/billing'
import { aantalDiplomas, nieuweHandtekeningen } from '../engine/diploma'
import type { Badge } from '../engine/store'
import { sfx } from '../engine/audio'
import { Button, Card, Progress, SectionTitle, Stat } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { Khatim } from '../ui/Khatim'
import { Medaillon, Plaat } from '../ui/Motief'
import { useRustig } from '../ui/rustig'
import { HISTORY } from '../content/history'
import type { Lang } from '../i18n/languages'
import { localeOf, useLang, useT } from '../i18n'
import { unitSubtitle } from '../content/localise'

/**
 * De veer waar de hele app op beweegt. Staat zo in `Progress` in kit.tsx, en
 * één veer voor alles is wat maakt dat losse onderdelen bij elkaar horen.
 */
const VEER = { type: 'spring' as const, stiffness: 180, damping: 24 }


/**
 * Een kaart die boven het papier hangt én indrukt als je hem aanraakt.
 *
 * `.btn3d` in index.css leest `--shadow-press`; wie die variabele op het
 * element zelf zet, bepaalt hoe het ding eruitziet als het níet ingedrukt is.
 * Daarom staat hier een hoogtetoken en geen vaste schaduw: `--schaduw-laag` en
 * `--schaduw-hoog` zijn in de donkere stand iets anders dan in de lichte, en
 * een schaduw die hier ingetypt wordt zou dat verschil verliezen.
 *
 * De richel blijft erbij staan, en dat is de reparatie. Eerst werd
 * `--shadow-press` helemaal vervángen door het hoogtetoken, en dan is de harde
 * lijn van vier pixels weg -- juist de lijn waar `.btn3d:active` zijn
 * `translateY(4px)` op laat landen. Deze kaarten zakten dus in het niets
 * terwijl elke `Button` in de app op zijn eigen rand zakt: twee gedragingen
 * onder dezelfde klasse. Nu komt de hoogte eróverheen in plaats van ervoor.
 */
const drukbaar = (token: '--schaduw-laag' | '--schaduw-hoog'): CSSProperties =>
  ({ '--shadow-press': `0 4px 0 0 var(--richel), var(${token})` }) as CSSProperties

/**
 * Een vlak dat een graad naar je vinger kantelt.
 *
 * Geen decoratie maar antwoord: je raakt de kaart aan en hij reageert alsof
 * hij ergens van gemaakt is. Acht graden is de bovengrens -- daarboven gaat de
 * tekst erop zichtbaar vervormen, en op een telefoon van 320 pixels is dat
 * precies de tekst die toch al krap staat. De veer is dezelfde als overal.
 *
 * `onPointerDown` staat erbij omdat `pointermove` op een aanraakscherm pas
 * vuurt als je sleept: zonder die eerste gebeurtenis kantelt er bij een gewone
 * tik niets, en dat is nu juist wat een kind doet.
 */
function Kantel({ children, className = '', kracht = 6 }: {
  children: ReactNode
  className?: string
  kracht?: number
}) {
  const rustig = useRustig()
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const veerX = useSpring(x, VEER)
  const veerY = useSpring(y, VEER)
  const rotateY = useTransform(veerX, [-0.5, 0.5], [-kracht, kracht])
  const rotateX = useTransform(veerY, [-0.5, 0.5], [kracht, -kracht])

  const volg = (e: React.PointerEvent<HTMLDivElement>) => {
    if (rustig) return
    const vak = e.currentTarget.getBoundingClientRect()
    if (vak.width === 0 || vak.height === 0) return
    x.set((e.clientX - vak.left) / vak.width - 0.5)
    y.set((e.clientY - vak.top) / vak.height - 0.5)
  }
  const los = () => { x.set(0); y.set(0) }

  return (
    <motion.div
      className={className}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={volg}
      onPointerDown={volg}
      onPointerUp={los}
      onPointerLeave={los}
      onPointerCancel={los}
    >
      {children}
    </motion.div>
  )
}


/**
 * Eén insigne.
 *
 * Wat hier veranderde en waarom: een gesloten insigne was een hangslot op een
 * kaart van 55% doorzichtigheid. Dat is twee keer verkeerd. Een hangslot zegt
 * "jij mag hier niet", terwijl dit juist iets is om te willen; en die
 * doorzichtigheid trok de tekst mee -- de hint kwam uit op 3,3 op 1 waar 4,5
 * de norm is, dus precies de regel die vertelt hóé je hem haalt was de
 * slechtst leesbare van de bladzijde.
 *
 * Nu is een gesloten insigne dezelfde rozet met een leeg khatim-zegel erin:
 * een vorm die nog gevuld moet worden. Hij ligt in het papier
 * (`--surface-sunken`, geen schaduw) en een behaalde hangt erboven
 * (`--schaduw-laag`). Diepte zegt dus wat de staat is, en de tekst houdt zijn
 * volle contrast.
 *
 * En hij is een knop. Een insigne waar je niet op kunt drukken is een plaatje;
 * dit speelt zijn eigen fanfare opnieuw af, en dat is de hele reden dat een
 * kind er een wil. De teller in `vier` zorgt dat elke druk opnieuw begint --
 * zonder dat speelt de veer alleen de eerste keer.
 */
function Insigne({ badge, naam, hint, behaald, lang, rustig, nietBehaald }: {
  badge: Badge
  naam: string
  hint: string
  behaald: boolean
  lang: Lang
  rustig: boolean
  nietBehaald: string
}) {
  const [vier, setVier] = useState(0)
  /** Wanneer de fanfare voor het laatst klonk; zie de knop hieronder. */
  const laatsteJuich = useRef(0)
  return (
    <button
      type="button"
      /*
        De fanfare hoogstens één keer per 600 milliseconde.

        Achttien insignes zijn achttien knoppen, en `sfx.badge()` is de fanfare
        plus een zware trilling, zonder rem, met een poel van acht
        geluidselementen. Een kind dat eroverheen roffelt laat dus acht
        fanfares over elkaar heen lopen terwijl het toestel achttien keer
        trilt. Een herhaling binnen die 600 milliseconde krijgt de gewone tik:
        je hoort nog dat je iets raakt, maar het blijft één geluid.
      */
      onClick={() => {
        const nu = performance.now()
        const snel = nu - laatsteJuich.current < 600
        laatsteJuich.current = nu
        if (behaald && !snel) sfx.badge()
        else sfx.tap()
        setVier((n) => n + 1)
      }}
      /*
        De hint staat in allebei de labels.

        Een `aria-label` vervangt de inhoud van een knop, dus met alleen de
        naam erin werd een behaald insigne voorgelezen als "Eerste stap" en was
        "Rond je eerste les af" weg -- terwijl die regel er zichtbaar onder
        staat. Een gesloten insigne kreeg wél naam, hint en staat. Vóór deze
        verbouwing was het geen knop en werden beide regels gewoon gelezen, dus
        dit was een achteruitgang en geen keuze.
      */
      aria-label={behaald ? `${naam} — ${hint}` : `${naam} — ${hint} (${nietBehaald})`}
      className={`btn3d h-full w-full min-w-0 rounded-3xl border p-4 text-center ${
        behaald
          ? 'border-[var(--line)] bg-[var(--surface-raised)]'
          : 'border-dashed border-[var(--line)] bg-[var(--surface-sunken)]'
      }`}
      style={behaald ? drukbaar('--schaduw-laag') : ({ '--shadow-press': 'none' }) as CSSProperties}
    >
      <motion.span
        key={vier}
        className={`relative mx-auto block h-14 w-14 ${behaald ? 'text-[var(--accent-500)]' : 'text-[var(--ink-soft)]'}`}
        initial={rustig || vier === 0 ? false : { scale: 0.76, rotate: behaald ? -14 : 0 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={VEER}
      >
        <Plaat vol={behaald} />
        <span className="absolute inset-0 grid place-items-center">
          {behaald
            ? <span className="text-3xl" aria-hidden="true">{badge.emoji}</span>
            : <Khatim size={26} filled={false} leegDekking={0.85} />}
        </span>
      </motion.span>
      <div
        lang={lang}
        className={`mt-1 hyphens-auto break-words font-display font-extrabold ${behaald ? '' : 'text-[var(--ink-soft)]'}`}
      >
        {naam}
      </div>
      <div lang={lang} className="hyphens-auto text-xs text-[var(--ink-soft)]">
        {hint}
      </div>
    </button>
  )
}

/** Everything the learner has built up, on one page. */
export function Profile() {
  const t = useT()
  const lang = useLang()
  const state = useStore((s) => s)
  const rustig = useRustig()
  const { level, into, span } = levelOf(state.xp)
  const seen = Object.keys(state.cards).length
  const solid = Object.values(state.cards).filter((c) => c.strength >= 0.85).length
  const doneLessons = Object.keys(state.lessons).length
  const diplomas = aantalDiplomas(state)
  const nieuweDiplomas = nieuweHandtekeningen(state)
  const behaald = BADGES.filter((b) => state.badges.includes(b.id)).length

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

  /*
   * Het zellige-raster achter de kaart schuift trager dan de bladzijde.
   *
   * Dertig pixels over de eerste vijfhonderd van het scrollen: genoeg om te
   * merken dat er iets achter ligt, te weinig om op te vallen. Meer dan dat en
   * het patroon loopt onder de rand van de kaart uit -- `overflow-hidden`
   * knipt het af, maar dan zie je het raster ophouden.
   */
  const { scrollY } = useScroll()
  const diepte = useSpring(useTransform(scrollY, [0, 500], [0, 30]), { stiffness: 120, damping: 30 })

  /**
   * Of er volledige toegang is, en sinds wanneer.
   *
   * `unlockedAt` staat er al sinds het begin maar werd nergens gelezen. Het is
   * de dag waarop de winkel voor het eerst zei dat het abonnement loopt — niet
   * de dag van betalen, want de eerste drie dagen zijn gratis. "Lid sinds" is
   * dus eerlijk en "betaald op" zou dat niet zijn.
   */
  /**
   * Of het e-boek van je is, en zo niet: vanaf wanneer.
   *
   * Dit stond alleen op `/volledig`, en daar kwam je na het betalen niet meer.
   * Het slotje in de bovenbalk verdwijnt zodra je toegang hebt, en alle andere
   * wegen ernaartoe zitten achter sloten op lessen, woorden en verhalen — die
   * voor een betalende klant ook weg zijn. Wat overbleef was Jij → Aanpassen →
   * helemaal naar beneden → Beheren: drie stappen diep in een instellingen-
   * scherm, en de bladzijde waar je als eerste kijkt wees er niet naartoe.
   *
   * Gevonden door zelf een jaarabonnement te kopen en het boek niet terug te
   * kunnen vinden. Iemand die zestig euro uitgeeft en daarna moet zoeken naar
   * wat erbij zat, mailt daarover — terecht.
   */
  const magBoek = useStore((s) => s.ebook)
  const boekWacht = useStore((s) => ebookWachtTot(s))

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
  const weekXp = week.reduce((som, d) => som + d.xp, 0)
  const doelDagen = week.filter((d) => d.xp >= state.settings.dailyGoal).length

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
      {/*
        Het welkom, en één keer.

        Wie net betaald heeft kwam hier binnen en zag twee regels: "vul je naam
        in en kies een dier". Dat is een instelling, geen welkom. Wat er niet
        stond was wát je gekocht had en waar het e-boek bleef — en precies dat
        is waar de eerste vraag over ging na een echte aankoop.

        Geen pop-up die je moet wegklikken en geen confetti: een kaart die er
        staat, met vijf regels die alle vijf nagemeten zijn. De getallen komen
        uit de inhoud zelf (`UNITS`, `allWords`, `LETTERS`, `HISTORY`), zodat
        een unit erbij hier vanzelf klopt en niemand een cijfer hoeft bij te
        werken dat dan stilletjes onwaar wordt.

        En de proefperiode staat erbij. Dat is het soort eerlijkheid dat je op
        dit scherm kunt missen zonder dat iemand het merkt, en precies daarom
        hoort het hier: iemand die net geld heeft uitgegeven mag weten dat hij
        nog niets betaald heeft en wanneer dat verandert.

        Hij komt via `?welkom=1`, dus wie de bladzijde later opnieuw opent
        heeft hem niet meer.
      */}
      {welkom && (
        <Card className="mb-6 border-2 border-saffron-400 p-5" style={{ boxShadow: 'var(--schaduw-hoog)' }}>
          <p className="flex items-center gap-2 font-display text-xl font-extrabold">
            <Khatim size={20} />
            {t.profile.welkomKop}
          </p>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.profile.welkomDank}</p>
          <ul className="mt-3 space-y-1.5">
            {t.profile.welkomLijst(UNITS.length, allWords.length, LETTERS.length, HISTORY.length).map((regel) => (
              <li key={regel} className="flex gap-2 text-sm">
                <span aria-hidden="true" className="text-saffron-600">·</span>
                <span>{regel}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-[var(--ink-soft)]">{t.profile.welkomProef(TRIAL_DAYS)}</p>
          <Link to="/leren" onClick={() => sfx.tap()} className="mt-4 inline-block">
            <Button>{t.profile.welkomStart}</Button>
          </Link>
        </Card>
      )}

      <Kantel className="mb-6" kracht={5}>
        <Card
          className={`relative overflow-hidden flex flex-wrap items-center gap-5 p-5 ${lid ? 'border-2 border-saffron-400' : ''}`}
          style={{ boxShadow: 'var(--schaduw-hoog)' }}
        >
          {/* Het raster achter alles, en niets erbovenop: wie hier een tweede
              laag bij zet krijgt moiré met de rozet op de insignes eronder. */}
          <motion.div
            className="zellige pointer-events-none absolute -inset-y-8 inset-x-0 opacity-60 dark:opacity-30"
            style={{ y: rustig ? 0 : diepte }}
            aria-hidden="true"
          />
          <div className="relative shrink-0">
            {/* De ruit achter de pasfoto, in de kleur die het kind koos. Een
                vierkant op 45 graden en niet een cirkel: dezelfde vorm als de
                rozet onder elk insigne, zodat de bladzijde één hand heeft.

                De maat is drie keer nagemeten naast de pasfoto van 80 pixels.
                `h-24` (96) geeft een diagonaal van 136: op een scherm van 320
                ligt er dan een bleke ruit náást de foto in plaats van erachter.
                `h-18` (72, diagonaal 102) steekt er maar elf pixels uit en is
                op de afdruk niet meer te zien. `h-21` zit ertussen: 84 pixels,
                diagonaal 119, twintig pixels punt aan elke kant. */}
            <span
              className="pointer-events-none absolute left-1/2 top-1/2 h-21 w-21 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-2xl bg-[var(--accent-400)] opacity-25"
              aria-hidden="true"
            />
            <motion.div
              key={state.avatar}
              initial={rustig ? false : { scale: 0.72, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={VEER}
              className={`relative grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-[var(--accent-400)] to-[var(--accent-600)] text-4xl ${
                lid ? 'ring-4 ring-saffron-400 ring-offset-2 ring-offset-[var(--surface-raised)]' : ''}`}
              style={{ boxShadow: 'var(--schaduw-laag)' }}
            >
              {state.avatar}
            </motion.div>
            {/* Een ring in de kleur van de kaart eronder, zodat het pilletje
                op de avatar ligt in plaats van ertegenaan geplakt te zijn. */}
            <span className="absolute -bottom-2 -end-2 rounded-full bg-zellige-600 px-2 py-0.5 text-xs font-extrabold text-white ring-2 ring-[var(--surface-raised)]">
              {level}
            </span>
          </div>
          <div className="relative min-w-0 flex-1 basis-40">
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
          <Link to="/instellingen" className="relative w-full sm:w-auto"><Button variant="secondary" className="w-full">{t.profile.aanpassen}</Button></Link>
        </Card>
      </Kantel>

      {/*
        Het e-boek, op de plek waar je het zoekt.

        Alleen als er recht op is: wie een maandabonnement heeft krijgt hier
        niets te zien, want dan is het boek niet van hem en is dit geen plek
        om iets te verkopen.

        Twee standen, dezelfde als op `/volledig` en op `/boek`. Wacht de
        proefperiode nog, dan staat er de datum en géén knop — een knop die
        niet werkt is erger dan geen knop, en zonder de datum leest dat als
        een storing.
      */}
      {(magBoek || boekWacht !== null) && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-4 p-5">
          <div className="min-w-0 flex-1 basis-56">
            <h2 className="font-display text-lg font-extrabold">{t.unlock.boek.titel}</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">
              {boekWacht !== null
                ? t.unlock.boek.wacht(new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long' }).format(boekWacht))
                : t.unlock.boek.vanJou}
            </p>
          </div>
          {magBoek && (
            <Link to="/boek" onClick={() => sfx.tap()} className="w-full sm:w-auto">
              <Button className="w-full">{t.unlock.boek.open}</Button>
            </Link>
          )}
        </Card>
      )}

      {/*
        Wie je bent, op de bladzijde waar het staat.

        De naam stond alleen in Instellingen en de avatar alleen hier, dus wie
        zichzelf wilde invullen moest twee schermen langs en op het ene vinden
        wat op het andere te zien is. Nu staan ze bij elkaar, onder de kaart
        waar ze op terechtkomen.

        Instellingen houdt zijn veld; het is hetzelfde stukje staat en ze
        lopen niet uit elkaar.
      */}
      <Card className="mb-4 p-5" style={{ boxShadow: 'var(--schaduw-laag)' }}>
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
        {/*
          Het gekozen dier zit op dezelfde gekleurde plaat als op de kaart
          hierboven, de rest op papier. Zo zie je waar je keuze terechtkomt
          vóórdat je omhoog scrolt -- en de avatar daarboven springt mee, want
          die staat op `key={state.avatar}`.

          `h-12` en niet `h-11`, maar niet om de reden die hier eerst stond. Er
          stond dat elf precies 44 is en dat een rand van twee daaraan eet;
          Tailwind zet `box-sizing: border-box`, dus `h-11` wás al 44 inclusief
          rand, en nagemeten zat geen enkel raakvlak op deze bladzijde ooit
          onder de norm. Twaalf staat er omdat een rij dieren ruimer mag staan
          dan de ondergrens, en dat is smaak en geen eis. Zie `raakvlak.test.ts`
          voor wat de eis wél is.
        */}
        <div className="mt-4 flex flex-wrap gap-2">
          {AVATARS.map((a) => (
            <button
              key={a}
              onClick={() => { sfx.pick(); setState({ avatar: a }) }}
              aria-pressed={state.avatar === a}
              className={`btn3d grid h-12 w-12 place-items-center rounded-2xl border-2 text-2xl ${
                state.avatar === a
                  ? 'border-[var(--accent-600)] bg-[var(--accent-500)]'
                  : 'border-[var(--line)] bg-[var(--surface)]'
              }`}
              style={drukbaar('--schaduw-laag')}
              aria-label={t.profile.kies(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </Card>

      {/*
        "Je kent 304 woorden" zegt meer dan "je hebt 640 XP".

        De vier tegels stonden hier zonder kop, met XP voorop. XP is een getal
        dat de app zelf verzint en dat alleen iets betekent náást het vorige
        getal; het aantal woorden dat vastzit is wat een kind er bij zijn oma
        mee kan. Dus staat dat nu vooraan, met een zin erboven die de twee
        getallen in gewone taal zet, en komt XP achteraan.
      */}
      <SectionTitle sub={t.profile.kentUitleg(solid, seen)}>
        <span className="mt-8 block">{t.profile.kentTitel}</span>
      </SectionTitle>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat index={0} value={solid} label={t.profile.vastgezet} emoji="🔒" />
        <Stat index={1} value={`${seen}/${allWords.length}`} label={t.profile.woordenGezien} emoji="📚" />
        <Stat index={2} value={`${reeksNu(state)} / ${state.bestStreak}`} label={t.profile.reeksRecord} emoji="🔥" />
        <Stat index={3} value={state.xp} label={t.profile.xpTotaal} emoji="⚡" />
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
      <Card className="mt-3 flex flex-wrap items-center gap-4 p-5" style={{ boxShadow: 'var(--schaduw-laag)' }}>
        <span className="relative block h-12 w-12 shrink-0 text-zellige-500">
          <Plaat vol />
          <span className="absolute inset-0 grid place-items-center text-2xl" aria-hidden="true">🧊</span>
        </span>
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
      <Card className="p-5" style={{ boxShadow: 'var(--schaduw-laag)' }}>
        {/*
          Zeven staafjes zonder getal zijn geen antwoord op "hoe ging mijn
          week". Deze twee regels zeggen het in woorden, en de staafjes laten
          zien hoe het verdeeld was.
        */}
        <p className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <span className="font-display text-xl font-extrabold">{t.profile.weekTotaal(weekXp)}</span>
          <span className="text-sm text-[var(--ink-soft)]">{t.profile.weekDoelDagen(doelDagen, week.length)}</span>
        </p>
        {/*
          Waarom deze rij `items-stretch` is en niet `items-end`.

          Hij stond op `items-end`, en daarmee kreeg elke kolom de hoogte van
          zijn inhoud -- twintig pixels, de dagletter. Een `height` in procenten
          binnen een vak zonder eigen hoogte is onbepaald, en dat betekent
          hoogte nul. Nagemeten in Chromium: alle zeven staafjes stonden op
          `height: 43.75%` enzovoort en waren alle zeven nul pixels hoog. De
          grafiek heeft dus nooit één staafje getekend.

          Met `items-stretch` is de kolom zo hoog als de rij, is het staafvak
          eronder (`flex-1`) bepaald, en rekent het procentje ergens tegen af.
        */}
        <div className="relative flex h-44 items-stretch gap-1.5">
          {/* De doellijn hoort bij het staafvak en niet bij de hele rij:
              onderaan staat nog een regel met de dagletter. `bottom-5` is
              precies die regel (0,75rem letter plus 0,25rem gat), dus de lijn
              blijft kloppen als iemand de letters groter zet.

              En hij staat op volle dekking. `saffron-500/60` haalde op de witte
              kaart 1,59 op 1 -- nagemeten in Chromium, de kleur door een canvas
              gehaald omdat Tailwind 4 hem als `oklab(... / 0.6)` opschrijft en
              een regexp daar 0,76 als rood uit leest. Dat mocht toen de
              staafjes nog nul pixels hoog waren en de lijn niets aanwees; nu de
              grafiek iets laat zien staat er in de ondertitel "de stippellijn
              is je dagdoel", en dan is het een grafisch element dat 3 moet
              halen. `saffron-700` haalt op wit 5,02 en `saffron-500` op de
              donkere kaart 7,96. */}
          <div className="pointer-events-none absolute inset-x-0 bottom-5 top-0" aria-hidden="true">
            <div
              className="absolute inset-x-0 border-t-2 border-dashed border-saffron-700 dark:border-saffron-500"
              style={{ bottom: `${(state.settings.dailyGoal / peak) * 100}%` }}
            />
          </div>
          {/* `min-w-0` op de staafjes: het dagletterje eronder heeft een eigen
              minimumbreedte, en bij grote letters duwde die de zeven staafjes
              samen breder dan het scherm. */}
          {week.map((d, i) => {
            const vandaag = i === week.length - 1
            const gehaald = d.xp >= state.settings.dailyGoal
            const hoog = Math.max(3, (d.xp / peak) * 100)
            return (
              <div key={d.key} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span
                  className="relative w-full flex-1"
                  role="img"
                  aria-label={`${vandaag ? t.profile.vandaag : d.day}: ${d.xp} XP`}
                >
                  {/* Het getal boven de staaf van vandaag, en alleen daar: zeven
                      getallen naast elkaar passen op 320 pixels niet, en van de
                      zes andere dagen wil je de vorm en niet het cijfer. Het
                      hangt aan de hoogte van de staaf en niet aan de bovenkant
                      van het vak -- anders zweeft het bij een korte dag een
                      halve grafiek boven zijn eigen staafje. */}
                  {/*
                    Niet hoger dan 86 procent, en op één regel.

                    `bottom: calc(hoog% + 2px)` zonder bovengrens ging mis
                    zodra vandaag de hoogste dag van de week is -- en dat is de
                    gewone toestand voor een kind dat net gespeeld heeft, want
                    de piek is het hoogste van het dagdoel en de beste dag. Dan
                    is `hoog` honderd en staat het getal volledig boven het
                    staafvak: gemeten op 390 begint het 2,5 pixel binnen de
                    ondertitel, en op 320 in het Duits met vier cijfers breekt
                    het af tot "123" en "4" en overlapt het 19 pixels.

                    `Math.min` in javascript en niet `min()` in CSS: die
                    functie kent een WebView van Android 7 niet, en de bouw
                    mikt op es2015 juist voor dat toestel.
                  */}
                  {vandaag && (
                    <span
                      className="absolute inset-x-0 whitespace-nowrap text-center text-[11px] font-extrabold"
                      style={{ bottom: `calc(${Math.min(hoog, 86)}% + 2px)` }}
                    >
                      {d.xp}
                    </span>
                  )}
                  {/*
                    Een dag waarop je je doel haalde is een dicht blokje; een
                    dag eronder is een open blokje. Dat is niet alleen mooier
                    dan twee tinten van hetzelfde, het is ook het enige wat
                    haalbaar was: `mint-500` haalt op een witte kaart 2,30 op 1
                    en `zellige-500` op halve dekking 1,60, waar de norm voor
                    een grafisch element 3 is. De omtrek van `zellige-600`
                    haalt 5,52 en `mint-600` gevuld 3,31.
                  */}
                  <motion.span
                    className={`absolute inset-x-0 bottom-0 block rounded-t-xl ${
                      gehaald
                        ? 'bg-mint-600 dark:bg-mint-500'
                        : 'border-2 border-b-0 border-zellige-600 bg-zellige-500/15 dark:border-zellige-400'
                    }`}
                    /* De lichte lijn langs de bovenrand is wat een gevuld
                       staafje een blokje maakt in plaats van een vlak: diepte
                       uit licht, niet uit een rand. */
                    style={gehaald ? { boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.3)' } : undefined}
                    initial={rustig ? false : { height: '0%' }}
                    animate={{ height: `${hoog}%` }}
                    transition={{ ...VEER, delay: rustig ? 0 : i * 0.04 }}
                  />
                </span>
                {/* Vandaag draagt de kleur die het kind koos. Dat is waar een
                    eigen kleur iets dóét: hij wijst de dag aan waar je nog iets
                    aan kunt veranderen. `--accent-ink` is de donkere inkt die
                    op alle vier de kleuren 4,5 haalt; zie `kleurkeuze.test.ts`. */}
                {/*
                  `ring-1` erbij. De pil zelf haalde tegen de witte kaart 2,15
                  op 1 bij saffraan -- de kleur die een kind krijgt als het
                  niets kiest -- 2,28 bij mint en 2,49 bij zellige, waar 3 de
                  norm is voor een grafisch element. Alleen terracotta haalde
                  het. In de donkere stand was het wel in orde (4,87 tot 7,97).

                  De app heeft hier al een afspraak voor: `Button` zet
                  accent-500 nooit zonder `border-2 border-[var(--accent-600)]`
                  eromheen. Dit is diezelfde afspraak, een pixel dun, en
                  accent-600 haalt op wit 3,19 tot 5,47 en op de donkere kaart
                  3,13 tot 5,37 -- alle acht combinaties boven de norm.
                */}
                <span
                  className={`rounded-full px-1.5 text-xs font-bold ${
                    vandaag
                      ? 'bg-[var(--accent-500)] text-[var(--accent-ink)] ring-1 ring-[var(--accent-600)] dark:ring-[var(--accent-400)]'
                      : 'text-[var(--ink-soft)]'
                  }`}
                >
                  {d.day}
                </span>
              </div>
            )
          })}
        </div>
      </Card>

      <SectionTitle sub={t.profile.beloningenTeller(behaald, BADGES.length)}>
        <span className="mt-8 block">{t.profile.beloningen}</span>
      </SectionTitle>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {BADGES.map((b) => (
          // A grid cell will not shrink below its content, and German names
          // its badges "Geschichtenerzähler" — one word, wider than half a
          // narrow phone, and the whole page slid sideways because of it.
          <li key={b.id} className="min-w-0">
            <Insigne
              badge={b}
              naam={t.badges[b.id].naam}
              hint={t.badges[b.id].hint}
              behaald={state.badges.includes(b.id)}
              nietBehaald={t.profile.nietBehaald}
              lang={lang}
              rustig={rustig}
            />
          </li>
        ))}
      </ul>

      {/*
        De plank met diploma's, naast de insignes en de geschiedeniskaarten.

        Hij staat hier en niet in de tabbalk, om dezelfde reden als de kaarten
        eronder: het is iets dat je hébt, niet iets waar je naartoe gaat. Vijf
        tabs zijn er al en een zesde haalt de ruimte weg van het pad.

        Het pilletje "nieuw" is het enige wat de app zelf zegt over een
        handtekening. Geen melding en geen pop-up: een ouder die 's avonds
        ondertekent hoort zijn kind niet te laten schrikken, en een kind dat de
        app morgen opent hoort het wel te kunnen vinden.
      */}
      <SectionTitle><span className="mt-8 block">{t.nav.diplomas}</span></SectionTitle>
      <Link to="/diplomas" className="block">
        <Card className="flex items-center gap-4 p-4">
          <Khatim size={40} className="shrink-0 text-khatim-500 dark:text-khatim-400" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-display font-extrabold">{t.diploma.link}</span>
              {nieuweDiplomas.length > 0 && (
                <span className="rounded-full bg-[var(--accent-500)] px-2 py-0.5 text-[11px] font-extrabold text-[var(--accent-ink)]">
                  {t.diploma.nieuw}
                </span>
              )}
            </div>
            <div className="text-sm text-[var(--ink-soft)]">
              {nieuweDiplomas.length > 0
                ? t.diploma.nieuwAantal(nieuweDiplomas.length)
                : t.diploma.plank(diplomas, UNITS.length)}
            </div>
            <Progress value={diplomas / UNITS.length} tone="accent" className="mt-1 h-2" />
          </div>
          <span className="shrink-0 text-[var(--ink-soft)]" aria-hidden="true">›</span>
        </Card>
      </Link>

      {/* The history cards live here rather than on the tab bar: they are
          something you have, like the badges above, not somewhere you go. */}
      <SectionTitle><span className="mt-8 block">{t.nav.geschiedenis}</span></SectionTitle>
      <Link to="/geschiedenis" className="block">
        <Card className="btn3d flex items-center gap-4 p-4" style={drukbaar('--schaduw-laag')}>
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
              <Card className="flex items-center gap-3 p-3" style={{ boxShadow: 'var(--schaduw-laag)' }}>
                <span className={`relative block h-10 w-10 shrink-0 ${pct > 0 ? 'text-zellige-500' : 'text-[var(--ink-soft)]'}`}>
                  <Plaat vol />
                  <span className="absolute inset-0 grid place-items-center text-xl" aria-hidden="true">{u.emoji}</span>
                </span>
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

      <Card className="mt-8 flex flex-wrap items-center gap-4 p-5" style={{ boxShadow: 'var(--schaduw-laag)' }}>
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
