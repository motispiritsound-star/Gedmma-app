import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { LANGS, useT, type Lang } from '../i18n'
import { sfx } from '../engine/audio'
import { FREE_LESSONS, planOf, TRIAL_DAYS } from '../engine/billing'
import { ACCENTEN, ACCENTKLEUR, AVATARS, setSetting, setState, useStore } from '../engine/store'
import { Button, Progress, Sheet } from './kit'
import { Khatim } from './Khatim'
import { Mascot } from './Mascot'
import { ZWEEF } from './zweef'
import { useRustig } from './rustig'

/**
 * De eerste minuut, en de enige kans erop.
 *
 * Hier stond één scherm: kies een taal, lees wat het kost, begin. Daarna stond
 * een kind in een app die er voor iedereen hetzelfde uitzag, met een uil als
 * avatar die het niet gekozen had en "Leerling" waar zijn naam hoort. De naam
 * zat in Instellingen en de avatar in Profiel -- twee schermen waar je pas
 * komt als je al weet dat ze bestaan.
 *
 * Nu vier stappen, en ze zijn alle vier over te slaan door door te klikken:
 *
 *   1. Welke taal versta je?
 *   2. Wie ben jij -- een naam en een dier.
 *   3. Hoe lees je mee -- Arabisch schrift, klanken, of allebei.
 *   4. Hoe ziet het eruit -- een kleur en licht of donker.
 *
 * Wat hier gezet wordt zit meteen in de staat, dus wie halverwege afhaakt
 * houdt wat hij al koos. Alleen `langPicked` gaat aan het eind om: dat is de
 * vlag die dit scherm sluit, en hij hoort pas om als iemand echt klaar is.
 *
 * De prijs blijft op de laatste stap staan. Een ouder hoort te weten wat de
 * app kost voordat het eerste lesje begint, niet op het moment dat het pad
 * tegen een slot aan loopt.
 */
export function Welcome() {
  const t = useT()
  const picked = useStore((s) => s.langPicked)
  const lang = useStore((s) => s.settings.lang)
  const naam = useStore((s) => s.name)
  const avatar = useStore((s) => s.avatar)
  const accent = useStore((s) => s.settings.accent)
  const theme = useStore((s) => s.settings.theme)
  const schrift = useStore((s) => s.settings.showScript)
  const schriftTranslit = useStore((s) => s.settings.showTranslit)
  /**
   * De rustige stand, uit de instellingen.
   *
   * `MotionConfig reducedMotion="user"` in App.tsx dekt de voorkeur van het
   * tóéstel, en de regel in index.css dekt css-animaties. Geen van beide dekt
   * dit: wie in de app zelf "rustig" kiest, zet daarmee een getal in de staat,
   * en framer-motion rekent zijn beelden in javascript uit. Zie HistoryScene,
   * die hetzelfde doet.
   */
  /* Allebei de voorkeuren, niet alleen de knop in de app. Zie rustig.ts. */
  const kalm = useRustig()
  const [stap, setStap] = useState(0)
  /** -1 of 1: waar de volgende stap vandaan komt. Zie `komtVan` hieronder. */
  const [heen, setHeen] = useState(1)
  /** Staat de deur open? Dan schuift het paneel weg en komt de app erachter. */
  const [opent, setOpent] = useState(false)
  /*
   * Elke stap begint bovenaan.
   *
   * Het paneel kan sinds kort scrollen -- zonder dat was alles boven de
   * bovenrand onbereikbaar, zie `Sheet` in kit.tsx. Maar een scrollstand blijft
   * staan als de inhoud wisselt, en dan klik je op "verder" en land je midden
   * in de volgende vraag. Nagemeten op 320 bij 568 in het Duits: de kop van
   * stap 1, 2 en 3 stond zes pixels boven de rand, terwijl hij er met
   * `scrollTop` op nul ruim op past.
   *
   * `scrollIntoView` op dit omhulsel en geen `scrollTop` op de ouder: welke
   * ouder er scrolt is iets van `Sheet`, en dat hoort dit scherm niet te weten.
   */
  const bovenaan = useRef<HTMLDivElement>(null)
  useEffect(() => { bovenaan.current?.scrollIntoView({ block: 'start' }) }, [stap])
  if (picked) return null

  /**
   * Eén veer voor alles wat hier beweegt, dezelfde als `Progress` in kit.tsx.
   * Op "rustig" wordt het een sprong van nul milliseconde: dan staat elk beeld
   * meteen op zijn plek in plaats van er traag naartoe te kruipen.
   */
  const veer = kalm
    ? ({ duration: 0 } as const)
    : ({ type: 'spring', stiffness: 180, damping: 24 } as const)

  const verder = () => { sfx.nav(); setHeen(1); setStap((n) => n + 1) }
  const terug = () => { sfx.tap(); setHeen(-1); setStap((n) => n - 1) }

  /**
   * Waar een stap vandaan komt.
   *
   * Druk je op "verder", dan komt het volgende scherm van rechts binnen; druk
   * je op "terug", van links. Zonder dat wisselt de inhoud zonder richting en
   * weet je niet of je vooruit of achteruit ging -- vier schermen die er
   * hetzelfde uitzien hebben dat verschil nodig.
   */
  const komtVan = { opacity: 0, x: kalm ? 0 : heen * 26 }

  /**
   * Wat er straks op je kaart staat, terwijl je hem maakt.
   *
   * Dit is het antwoord op de vraag die stap vier stelde zonder hem te
   * beantwoorden: je zag vier gekleurde bolletjes, maar niet wat de kleur dóét.
   * Nu draagt het vlak achter je dier diezelfde kleur, en je voortgangsbalk
   * ook -- precies waar hij in de app terechtkomt, zie
   * `--accent-*` in index.css.
   *
   * Het verloop van 400 naar 600 is hetzelfde dat `pages/Profile.tsx` om de
   * avatar zet. Dat is geen versiering maar een belofte: dit is letterlijk de
   * kaart die je straks ziet.
   *
   * De voortgang staat op een vaste 0,45. Een verse gebruiker heeft geen
   * voortgang, en een lege balk laat de kleur niet zien.
   */
  const voorbeeld = schrift && schriftTranslit ? 'الدار · ddar' : schrift ? 'الدار' : 'ddar'
  const pas = (
    <div className={`mt-5 flex items-center gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] p-3 text-start ${ZWEEF}`}>
      <motion.span
        key={avatar}
        initial={kalm ? false : { scale: 0.6 }}
        animate={{ scale: 1 }}
        transition={veer}
        className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-[var(--accent-400)] to-[var(--accent-600)] text-2xl"
        aria-hidden="true"
      >
        {avatar}
      </motion.span>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className={`min-w-0 flex-1 truncate font-display font-extrabold ${naam ? '' : 'text-[var(--ink-soft)]'}`}>
            {naam || t.settings.naamPlaceholder}
          </span>
          {/*
            Drie khatims in de gekozen kleur, en wel in de 600-trede.
            `--accent-500` haalt op een witte kaart 2,15 op 1 en de norm voor
            iets wat je moet kunnen zien is 3; de 600-trede haalt 3,03 (saffraan,
            de zwakste van de vier). In de donkere stand is het andersom, dus
            daar de 400.
          */}
          {/*
            Leeg, alle drie. Er stonden er twee vol en de balk eronder stond op
            0,45 -- op het scherm vóór de eerste les. Dat leest als twee van de
            drie sterren bij iemand die nog niets gedaan heeft, en het is
            dezelfde verzonnen prestatie die dit bestand twintig regels hoger
            juist vermijdt bij de voortgangsruiten. Wat de kaart hier hoort te
            laten zien is zijn vorm, niet een stand.
          */}
          <span className="flex shrink-0 gap-0.5 text-[var(--accent-600)] dark:text-[var(--accent-400)]" aria-hidden="true">
            {[0, 1, 2].map((n) => <Khatim key={n} size={13} filled={false} />)}
          </span>
        </div>
        <span className="ar text-sm text-[var(--ink-soft)]" aria-hidden="true">{voorbeeld}</span>
        <Progress value={0} tone="accent" className="mt-1.5" />
      </div>
    </div>
  )

  return (
    <Sheet open labelledBy="welcome-title">
      {/*
        De deur. Op de laatste knop schuift het paneel omhoog weg en blijft de
        app erachter staan -- het scherm gaat niet dicht, het gaat open.
        240 milliseconde, en op "rustig" gebeurt het meteen.
      */}
      <motion.div
        ref={bovenaan}
        className="text-center"
        animate={opent ? { y: -18, opacity: 0, scale: 1.02 } : { y: 0, opacity: 1, scale: 1 }}
        transition={opent ? { duration: 0.24, ease: 'easeIn' } : veer}
        /*
          De vlag gaat om als de beweging klaar is, en niet als een klok
          afloopt. Met een `setTimeout` bestond het geval "animatie klaar, vlag
          niet om": dan staat er een zwart vlak over de app met een paneel op
          dekking 0 erin, en is er geen weg terug -- `Welcome` geeft `Sheet`
          geen `onClose`, dus een tik ernaast en Escape doen niets, en alleen
          de app opnieuw starten helpt. Klein, maar het is het állereerste
          scherm en de uitkomst is totaal.

          Framer roept dit ook onder `reducedMotion` meteen aan, dus de
          snelkoppeling hieronder hoeft alleen nog te bestaan voor de "rustig"
          -knop in de app zelf.
        */
        onAnimationComplete={() => { if (opent) setState({ langPicked: true }) }}
      >
        {/*
          Een strook zellige over de bovenrand, waar de mascotte voor staat.

          Het paneel was een wit vel: niets zei dat dit een Marokkaanse app was
          tot de eerste les. Dit is hetzelfde `.zellige` uit index.css dat achter
          het leerpad ligt, dus geen tweede patroon -- het is een raster waar de
          kop op staat en geen sticker ernaast.

          `-mx-6 -mt-6` haalt hem buiten de opvulling van `Sheet` tot aan de
          rand, en `rounded-t-3xl` volgt diezelfde rand. `h-20` is net hoog
          genoeg om de onderste helft van Fnek vrij te laten, zodat hij er
          vóór staat in plaats van erin.
        */}
        <div className="zellige -mx-6 -mt-6 h-20 rounded-t-3xl opacity-80" aria-hidden="true" />

        {/*
          De mascotte verandert van stemming per stap en wipt op als je
          doorklikt -- hij kijkt mee in plaats van erbij te staan. De `key`
          is de stap, dus React zet hem opnieuw neer en de veer begint opnieuw.
        */}
        <motion.div
          key={stap}
          initial={kalm ? false : { scale: 0.86, y: -6 }}
          animate={{ scale: 1, y: 0 }}
          transition={veer}
          /* Omhoog over de strook heen, zodat hij ervoor staat. */
          className="-mt-16"
        >
          <Mascot
            mood={stap === 2 ? 'denk' : 'juich'}
            size={stap === 0 ? 90 : 64}
            className="mx-auto"
          />
        </motion.div>

        {/*
          Vier ruiten in plaats van vier bolletjes: het vierkant op zijn punt,
          de eenvoudigste vorm uit een zelliges paneel -- dezelfde die achter
          een `Medaillon` ligt. Een volle ruit is een stap die je gehad hebt.

          Het is met opzet geen khatim geworden, hoe verleidelijk ook. Dat zegel
          is in deze app de waardering voor een ronde: vier khatims op een rij
          leest als een cijfer, en dit is een plaats in de rij.
        */}
        <div className="mt-2 flex items-center justify-center gap-2.5" aria-hidden="true">
          {[0, 1, 2, 3].map((n) => (
            <motion.span
              key={n}
              /*
                Drie standen en niet twee, en in de 600-trede.

                Eerst was alles tot en met `stap` gevuld in dezelfde kleur en
                was de huidige stap alleen anderhalf keer zo groot: vier
                gelijke ruiten waarvan de laatste iets groter. Daarvoor stond
                er een pil van 20 naast drie stipjes van 6, en dat was
                onmiskenbaar -- dus "waar ben ik" ging erop achteruit.

                Nu: gevuld is waar je bent, een rand is waar je geweest bent,
                en de lijnkleur is wat nog komt. Drie standen, en de vorm
                verandert niet mee.

                En `--accent-500` haalde op de opgetilde kaart 2,15 op 1 bij
                saffraan, 2,28 bij mint en 2,49 bij zellige, waar 3 de norm is
                voor iets wat geen tekst is. De 600-trede haalt 3,19 tot 5,47,
                en in het donker de 400-trede 4,87 tot 7,97.
              */
              className={`block h-2.5 w-2.5 rounded-[2px] ${
                n === stap
                  ? 'bg-[var(--accent-600)] dark:bg-[var(--accent-400)]'
                  : n < stap
                    ? 'border-2 border-[var(--accent-600)] dark:border-[var(--accent-400)]'
                    : 'border-2 border-[var(--line)]'
              }`}
              /*
                De draaiing komt van framer-motion en niet van `rotate-45`.
                Tailwind 4 schrijft daarvoor de losse `rotate`-eigenschap, en
                die kent een WebView van Android 7 niet -- dan staan er vier
                vierkantjes waar vier ruiten horen te staan, zonder dat er iets
                misgaat waar je het aan ziet. framer zet een `transform`, en die
                bestaat overal.
              */
              initial={{ rotate: 45 }}
              animate={{ rotate: 45, scale: n === stap ? 1.5 : 1 }}
              transition={veer}
            />
          ))}
        </div>

        <motion.div key={`stap-${stap}`} initial={komtVan} animate={{ opacity: 1, x: 0 }} transition={veer}>

        {stap === 0 && (
          <>
            <h2 id="welcome-title" className="mt-3 font-display text-2xl font-extrabold">{t.welcome.titel}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.welcome.body}</p>

            <ul className="mt-5 grid gap-2 sm:grid-cols-2">
              {LANGS.map((l) => (
                <li key={l.code}>
                  {/*
                    `btn3d` erbij: zes rijen die je aantikt hoorden het enige in
                    dit scherm te zijn dat niet terugduwt. Het is dezelfde klasse
                    als op elke knop in de app, dus er komt geen tweede soort
                    indrukken bij -- zie `.btn3d` in index.css.
                  */}
                  <button
                    onClick={() => { sfx.nav(); setSetting('lang', l.code as Lang) }}
                    aria-pressed={lang === l.code}
                    className={`btn3d flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-start ${
                      lang === l.code ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)] bg-[var(--surface-raised)]'
                    }`}
                  >
                    <span className="font-display text-2xl font-extrabold" aria-hidden="true">{l.badge}</span>
                    <span className="min-w-0">
                      <span className="block font-display font-extrabold">{l.name}</span>
                      <span className="block text-xs text-[var(--ink-soft)]">{l.where}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            <Button className="mt-5 w-full" onClick={verder}>{t.common.verder}</Button>
          </>
        )}

        {stap === 1 && (
          <>
            <h2 id="welcome-title" className="mt-3 font-display text-2xl font-extrabold">{t.welcome.wieTitel}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.welcome.wieBody}</p>

            {/* "Dat staat straks op je kaart", zegt de regel hierboven. Hier
                staat die kaart, en hij verandert mee terwijl je kiest. */}
            {pas}

            <input
              value={naam}
              onChange={(e) => setState({ name: e.target.value.slice(0, 24) })}
              placeholder={t.settings.naamPlaceholder}
              aria-label={t.settings.naam}
              autoComplete="given-name"
              enterKeyHint="next"
              className="mx-auto mt-4 block w-full max-w-xs rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-3 text-center text-lg outline-none focus:border-[var(--accent-500)]"
            />

            <div className="mt-4 flex flex-wrap justify-center gap-2">
              {AVATARS.map((a) => (
                <button
                  key={a}
                  onClick={() => { sfx.pick(); setState({ avatar: a }) }}
                  aria-pressed={avatar === a}
                  aria-label={t.profile.kies(a)}
                  className={`btn3d grid h-12 w-12 place-items-center rounded-2xl border-2 text-2xl ${
                    avatar === a ? 'border-[var(--accent-500)] bg-[var(--accent-500)]/10' : 'border-[var(--line)] bg-[var(--surface-raised)]'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="w-28" onClick={terug}>{t.common.terug}</Button>
              <Button className="flex-1" onClick={verder}>{t.common.verder}</Button>
            </div>
          </>
        )}

        {/*
          De enige keuze hier die het leren zelf verandert.

          `showScript` en `showTranslit` bepalen wat er op elk woordkaartje en
          in elke oefening staat -- Arabisch schrift, de klanken in ons
          alfabet, of allebei. Een ouder weet meteen wat zijn kind kan lezen,
          dus deze vraag is op minuut nul te beantwoorden.

          Het dagdoel staat hier met opzet niet bij. Wat "30 XP per dag"
          betekent weet je pas na een week; dat vragen vóór de eerste les is
          een keuze zonder informatie. Die blijft in Instellingen.
        */}
        {stap === 2 && (
          <>
            <h2 id="welcome-title" className="mt-3 font-display text-2xl font-extrabold">{t.welcome.schriftTitel}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.welcome.schriftBody}</p>

            {/* De kaart toont het voorbeeld in de vorm die je net aanwees, dus
                de keuze laat zichzelf zien in plaats van zich te beschrijven. */}
            {pas}

            <div className="mt-4 grid gap-2">
              {([
                ['allebei', true, true, t.welcome.schriftKeuze.allebei, 'الدار · ddar'],
                ['arabisch', true, false, t.welcome.schriftKeuze.arabisch, 'الدار'],
                ['klanken', false, true, t.welcome.schriftKeuze.klanken, 'ddar'],
              ] as const).map(([id, script, translit, label, voorbeeldje]) => {
                const aan = schrift === script && schriftTranslit === translit
                return (
                  <button
                    key={id}
                    onClick={() => { sfx.pick(); setSetting('showScript', script); setSetting('showTranslit', translit) }}
                    aria-pressed={aan}
                    className={`btn3d flex min-h-14 items-center justify-between gap-3 rounded-2xl border-2 px-4 py-3 text-start ${
                      aan ? 'border-[var(--accent-500)] bg-[var(--accent-500)]/10' : 'border-[var(--line)] bg-[var(--surface-raised)]'
                    }`}
                  >
                    <span className="font-display font-extrabold">{label}</span>
                    <span className="ar text-lg text-[var(--ink-soft)]" aria-hidden="true">{voorbeeldje}</span>
                  </button>
                )
              })}
            </div>

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="w-28" onClick={terug}>{t.common.terug}</Button>
              <Button className="flex-1" onClick={verder}>{t.common.verder}</Button>
            </div>
          </>
        )}

        {stap === 3 && (
          <>
            <h2 id="welcome-title" className="mt-3 font-display text-2xl font-extrabold">{t.welcome.kleurTitel}</h2>
            <p className="mt-2 text-[var(--ink-soft)]">{t.welcome.kleurBody}</p>

            {/* Hier is de kaart het hele punt: tik een bolletje aan en de ring
                om je dier en je balk veranderen mee, een regel hoger. Dat is de
                vraag "wat doet die kleur eigenlijk" beantwoord zonder zin. */}
            {pas}

            <div className="mt-4 flex justify-center gap-3">
              {ACCENTEN.map((a) => (
                <button
                  key={a}
                  onClick={() => { sfx.pick(); setSetting('accent', a) }}
                  aria-pressed={accent === a}
                  aria-label={t.settings.accenten[a]}
                  className={`btn3d grid h-12 w-12 place-items-center rounded-full border-4 ${accent === a ? 'border-[var(--ink)]' : 'border-transparent'}`}
                  style={{ backgroundColor: ACCENTKLEUR[a] }}
                >
                  {/*
                    Het zegel in de bol die aanstaat. De inkt is `--accent-ink`,
                    dezelfde die op elke primaire knop staat, en `kleurkeuze.test.ts`
                    rekent voor alle vier de kleuren na dat die 4,5 op 1 haalt.
                  */}
                  {accent === a && <Khatim size={18} className="text-[var(--accent-ink)]" />}
                </button>
              ))}
            </div>

            <div className="mt-5 grid grid-cols-3 gap-2">
              {([['light', t.settings.licht], ['dark', t.settings.donker], ['system', t.settings.systeem]] as const).map(([w, label]) => (
                <button
                  key={w}
                  onClick={() => { sfx.pick(); setSetting('theme', w) }}
                  aria-pressed={theme === w}
                  className={`btn3d grid min-h-16 place-items-center gap-1 rounded-xl border-2 px-2 py-2 text-sm font-bold ${
                    theme === w ? 'border-[var(--accent-500)] bg-[var(--accent-500)]/10' : 'border-[var(--line)] bg-[var(--surface-raised)]'
                  }`}
                >
                  {/*
                    Een scherfje van het scherm dat je kiest, in plaats van
                    alleen het woord ervoor. De kleuren staan hier met de hand
                    en niet als `var(--surface)`: dat zou in beide knopjes de
                    stand laten zien waar je nú in zit, en dan laat de keuze
                    juist niet zien wat hij doet. "Systeem" is daarom de twee
                    helften naast elkaar.
                  */}
                  <span
                    aria-hidden="true"
                    className="flex h-5 w-8 shrink-0 overflow-hidden rounded-[5px] border border-[var(--line)]"
                  >
                    {(w === 'system' ? (['light', 'dark'] as const) : [w]).map((helft) => (
                      <span
                        key={helft}
                        className="flex flex-1 items-end justify-center pb-1"
                        style={{ backgroundColor: helft === 'dark' ? '#0d1220' : '#fffaf3' }}
                      >
                        <span
                          className="block h-1 w-3.5 rounded-full"
                          style={{ backgroundColor: helft === 'dark' ? '#f3f0ea' : '#1a1625' }}
                        />
                      </span>
                    ))}
                  </span>
                  {label}
                </button>
              ))}
            </div>

            {/*
              De prijs blijft staan -- een ouder hoort te weten wat de app kost
              vóór het eerste lesje -- maar hij ligt in het papier in plaats van
              erboven. Met een schaduw eromheen was dit het zwaarste blok op de
              laatste stap, en dan eindigt een welkomstscherm op een rekening.
              Een streep in de gekozen kleur aan de aanloopkant maakt er een
              aantekening van; de knop eronder blijft het zwaarste wat er staat.
            */}
            <div className="mt-5 rounded-2xl border-s-4 border-[var(--accent-500)] bg-[var(--surface-sunken)] p-4 text-start">
              <p className="text-sm font-bold">🎁 {t.welcome.plan(TRIAL_DAYS, planOf('jaar').perMonth)}</p>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">{t.welcome.gratisDeel(FREE_LESSONS)}</p>
            </div>

            <div className="mt-4 flex gap-2">
              <Button variant="secondary" className="w-28" onClick={terug}>{t.common.terug}</Button>
              {/*
                De laatste knop is een deur en geen formulierknop: hij schuift
                het paneel weg en laat de app erachter staan. De vlag gaat pas
                om als die beweging klaar is, dus je ziet waar je terechtkomt.
                Op "rustig" slaan we de wachttijd over -- een deur die je niet
                ziet opengaan is alleen maar een kwart seconde vertraging.
              */}
              <Button
                className="flex-1"
                sound="confirm"
                onClick={() => {
                  if (kalm) { setState({ langPicked: true }); return }
                  setOpent(true)
                }}
              >
                {t.welcome.knop}
              </Button>
            </div>
          </>
        )}

        </motion.div>
      </motion.div>
    </Sheet>
  )
}
