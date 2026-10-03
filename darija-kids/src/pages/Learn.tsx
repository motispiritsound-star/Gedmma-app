import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { UNITS } from '../content/curriculum'
import { ACCENTS, Button, Card, Progress } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { Quests } from '../ui/Quests'
import { BonusCard } from './Bonus'
import { Begin, Einde, GAT, KNOOP, Overgang, Rozet, Weg, verspring } from '../ui/Pad'
import { ZWEEF } from '../ui/zweef'
import {
  dueWordIds, isDone, lessonBehindPaywall, lessonUnlocked, markTipSeen, nextLesson, reeksNu,
  progressOfUnit, unitBehindPaywall, unitUnlocked, useStore,
} from '../engine/store'
import { missingArabicVoice, sfx } from '../engine/audio'
import { useVoices } from '../ui/useVoices'
import { Khatim, Khatims } from '../ui/Khatim'
import type { Lesson } from '../content/types'
import { useLang, useT } from '../i18n'
import { heeftArabisch, lessonTitle, unitSubtitle } from '../content/localise'

const KIND_ICON: Record<Lesson['kind'], string> = {
  woorden: '📗', zinnen: '💬', letters: '🔤', verhaal: '📖', toets: '🏅',
}

/**
 * Eén halte op de weg.
 *
 * De knoop staat op de weg en de titel ernaast. Dat tweede is de hele reden
 * dat de weg aansluit: een titel onder de knoop maakt de hoogte van de rij
 * afhankelijk van hoe lang hij in het Duits is, en dan valt er geen stuk weg
 * te tekenen dat precies van de ene knoop naar de andere loopt. Naast de knoop
 * staat hij absoluut en telt hij niet mee voor de hoogte -- zie `Pad.tsx`.
 *
 * `btn3d` op het schijfje zelf, en geen framer-motion erbij: die klasse zet
 * zijn eigen `transform` bij `:active`, en framer-motion schrijft `transform`
 * als inline stijl. Inline wint, dus de twee samen betekent dat het indrukken
 * niet gebeurt. De klasse die er al is doet het werk, op elk toestel, zonder
 * javascript per knoop -- en met vierenzeventig knopen op een vrijgespeeld pad
 * telt dat.
 */
function Node({ lesson, index, accent, hier, avatar, kwamVan, rustig }: {
  lesson: Lesson
  index: number
  accent: string
  /** Hier sta je: dit is de les waar "Ga verder" naartoe gaat. */
  hier: boolean
  avatar: string
  /** Of het stuk weg hiernaartoe al gelopen is. */
  kwamVan: boolean
  rustig: boolean
}) {
  const t = useT()
  const lang = useLang()
  const state = useStore((s) => s)
  const title = lessonTitle(lesson, lang)
  const done = isDone(lesson.id, state)
  const open = lessonUnlocked(lesson.id, state)
  const record = state.lessons[lesson.id]
  const x = verspring(index)
  const vorige = index === 0 ? 0 : verspring(index - 1)

  /*
   * De titel staat aan de kant waar de ruimte is: knoop rechts van het midden,
   * titel erlinks. Wat er overblijft is de helft van de breedte, min
   * vierenveertig (de straal van de knoop plus tien tussenruimte), plus de
   * verspringing -- en dat is voor allebei de kanten hetzelfde getal, want de
   * verspringing geeft de ene kant precies wat hij de andere afneemt.
   *
   * Nagemeten op 320 pixels (288 binnenwerk): 122 pixels bij een verspringing
   * van 22 en 140 bij 40. De langste Duitse lestitel is "Marokkanische
   * Gerichte" en vraagt er 128 op één regel; die valt dus naar twee, en dat kan
   * hier omdat deze tekst absoluut staat en de rijhoogte niet meebepaalt.
   */
  const kant = x >= 0
    ? { right: `calc(50% - ${x}px + 44px)`, textAlign: 'end' as const }
    : { left: `calc(50% + ${x}px + 44px)`, textAlign: 'start' as const }
  const ruimte = `calc(50% - ${44 - Math.abs(x)}px)`

  /*
   * `btn3d` alleen op wat je kunt indrukken.
   *
   * Die klasse geeft de rand van vier pixels eronder én het indrukken erbij.
   * Op een knoop die op slot zit beloofde dat iets wat er niet is: je drukt,
   * er gebeurt niets. Zonder de rand ligt hij plat in de weg in plaats van
   * erop, en dat is precies wat "nog niet" hier betekent.
   */
  const schijf = done
    ? `btn3d border-white/60 bg-gradient-to-br ${accent} text-night-950`
    : open
      ? 'btn3d border-[var(--line)] bg-[var(--surface-raised)]'
      : 'border-[var(--line)] bg-[var(--surface-sunken)] opacity-55'

  const body = (
    <>
      <span className="relative mx-auto block" style={{ left: x, height: KNOOP, width: KNOOP }}>
        {/*
          De ring om de plek waar je staat, in de kleur die het kind zelf koos.

          Twee ringen en niet één, en dat is geen opmaak. De vaste ring draagt
          de betekenis, de hartslag eroverheen is versiering. Eerst stond het
          omgekeerd: in de gewone stand was er alléén de kloppende ring, en die
          loopt van opacity 0,75 naar 0 in een lus. Zijn piek is dus 0,75, en
          zijn gemiddelde veel lager -- live uitgelezen op 0,336. Het enige
          element dat "waar ben ik" zonder lezen beantwoordt, was een bleke vlek
          die je alleen zag als je wist dat hij er was.

          En de tint is nu 600 in het licht en 400 in het donker, niet 500.
          Gemeten op het papier (#fffaf3): 500 haalt 2,07 bij saffraan -- de
          kleur waar iedereen mee begint -- 2,19 bij mint en 2,40 bij zellige,
          waar 3 de norm is voor iets wat geen tekst is. Met 600 wordt dat 3,07
          / 3,17 / 5,27 / 4,66, en in het donker haalt 400 overal boven de 9.

          De hartslag is 1,8 seconde en geen knippering, en in de rustige stand
          blijft alleen de vaste ring over -- dat is precies de ring die het
          werk deed.
        */}
        {hier && (
          <>
            <span
              aria-hidden="true"
              className="absolute -inset-2 rounded-full border-4 border-[var(--accent-600)] dark:border-[var(--accent-400)]"
            />
            {!rustig && (
              <motion.span
                aria-hidden="true"
                className="absolute -inset-2 rounded-full border-4 border-[var(--accent-600)] dark:border-[var(--accent-400)]"
                initial={{ scale: 0.94, opacity: 0.75 }}
                animate={{ scale: 1.12, opacity: 0 }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeOut' }}
              />
            )}
          </>
        )}
        <span className={`grid h-full w-full place-items-center rounded-full border-4 text-2xl ${schijf}`}>
          <span aria-hidden="true">{open ? KIND_ICON[lesson.kind] : '🔒'}</span>
        </span>
        {/*
          Je eigen dier staat op de knoop waar je bent. Dat is het enige stukje
          van de keuze bij de start dat op dit scherm terugkomt, en het is het
          enige dat een kind van zes zonder lezen kan vinden: zoek de vos.
        */}
        {hier && (
          <span
            aria-hidden="true"
            className="absolute -right-2 -top-2 grid h-7 w-7 place-items-center rounded-full border-2 border-[var(--surface)] bg-[var(--accent-500)] text-sm"
          >
            {avatar}
          </span>
        )}
      </span>
      <span className="absolute top-1/2 block -translate-y-1/2" style={{ ...kant, maxWidth: ruimte }}>
        <span className="block">
          <span className={`text-sm font-bold ${heeftArabisch(title) ? 'ar' : ''}`}>{title}</span>
        </span>
        {record && (
          <span className="mt-0.5 block">
            <Khatims stars={record.stars} size={14} label={t.learn.sterren(record.stars)} />
          </span>
        )}
        {/* Dezelfde woorden als op de knop bovenaan, dus er komt geen tekst bij
            die in zes talen vertaald moet worden -- en het is dezelfde zin, dus
            de knop en de plek op het pad horen zichtbaar bij elkaar. */}
        {hier && (
          <span className="mt-1 inline-block rounded-full bg-[var(--accent-500)] px-2 py-0.5 text-[10px] font-extrabold uppercase text-[var(--accent-ink)]">
            {t.learn.gaVerder}
          </span>
        )}
      </span>
    </>
  )

  if (!open) {
    return (
      /*
       * `kwamVan` ook hier, en niet vast op onwaar: de weg zegt hoe ver je
       * gekomen bent, niet of deze knoop opengaat. Een afgeronde les met een
       * slot erachter -- dat is wat er gebeurt zodra de gratis lessen op zijn --
       * hoort een gelopen weg naar zich toe te hebben.
       */
      <li className="relative" style={{ paddingTop: GAT }} aria-disabled="true" title={t.learn.eersteVorige}>
        <Weg van={vorige} naar={x} gelopen={kwamVan} />
        <div className="relative" style={{ height: KNOOP }}>{body}</div>
      </li>
    )
  }
  return (
    <li className="relative" style={{ paddingTop: GAT }}>
      <Weg van={vorige} naar={x} gelopen={kwamVan} />
      {/*
        Het pilletje "Ga verder" staat in de link, en een `aria-label` vervangt
        de inhoud van een link in plaats van er iets aan toe te voegen. Zonder
        deze regel is dit voor een schermlezer dus gewoon de zevende les van de
        unit, en is de enige aanwijzing waar je gebleven was alleen te zien.
        Twee teksten die er al zijn, aan elkaar -- er komt niets bij dat in zes
        talen vertaald moet worden.
      */}
      <Link
        to={`/les/${lesson.id}`}
        aria-label={hier ? `${t.learn.lesOpenen(title)} — ${t.learn.gaVerder}` : t.learn.lesOpenen(title)}
        className="relative block"
        style={{ height: KNOOP }}
      >
        {body}
      </Link>
    </li>
  )
}

export function Learn() {
  const t = useT()
  const lang = useLang()
  const state = useStore((s) => s)
  const due = dueWordIds(state).length
  const next = nextLesson(state)
  /** Niemand heeft nog iets afgerond: dit is de allereerste keer openen. */
  const eersteKeer = Object.keys(state.lessons).length === 0
  /** De eerste unit waarin een les dichtzit: daar hoort het aanbod te staan. */
  const slotBij = UNITS.findIndex((u) => u.lessons.some((l) => lessonBehindPaywall(l.id, state)))
  // Only worth saying once, and only on a device that actually lacks the voice.
  const installed = useVoices()
  const noArabicVoice = installed.length > 0 && missingArabicVoice() && !state.seenTips.includes('stem')
  /*
   * De rustige stand én de voorkeur van het toestel, in één waarde.
   *
   * `data-motion="calm"` in index.css zet CSS-overgangen uit, maar niet wat
   * framer-motion doet: dat is javascript dat elke tel een inline stijl
   * schrijft, en daar komt geen stylesheet tussen. Elke beweging die hier
   * bijkomt moet er dus zelf naar kijken, zoals `HistoryScene` al doet.
   */
  const minderBeweging = useReducedMotion()
  const rustig = state.settings.motion !== 'full' || minderBeweging === true

  /*
   * Een unit die af is, staat dicht.
   *
   * Het pad liet elke vrijgespeelde unit al zijn lessen zien. Voor wie het
   * abonnement heeft zijn dat vierenzeventig knopen onder elkaar, en gemeten
   * bij een leerling die tweederde ver is werd de bladzijde 10 560 pixels
   * lang: zijn volgende les stond op 8 285, dus tien schermen scrollen om te
   * zien waar hij was. Elke sessie opnieuw.
   *
   * Er gaat niets weg -- één tik op de kop zet een unit weer open, en de
   * voortgangsbalk en het percentage staan er nog gewoon. Wat weggaat is het
   * scrollen langs wat je al kent.
   *
   * Een unit die nog loopt of nog moet beginnen blijft open: zien wat eraan
   * komt is de reden om verder te willen, en dat geldt hier net zo goed als in
   * het woordenboek.
   *
   * De keuze blijft binnen deze sessie en wordt niet bewaard. Dat is met opzet:
   * wie morgen terugkomt hoort de app in zijn gewone stand te vinden, en niet
   * in de stand waarin hij hem gisteren even had gezet.
   */
  /*
   * Welke les dat eigenlijk is, waar "Ga verder" naartoe gaat.
   *
   * De knop zei alleen "Ga verder". Wat je verderging stond ergens beneden op
   * het pad, en voor wie een eind op weg is kostte dat drie schermen scrollen
   * om te zien waar hij was. Eén regel hier beantwoordt dat zonder scrollen.
   */
  const volgendeUnit = UNITS.find((u) => u.lessons.some((l) => l.id === next))
  const volgendeLes = volgendeUnit?.lessons.find((l) => l.id === next)

  /*
   * Welke units openstaan.
   *
   * De regel staat helemaal in `toont`: een unit is open tenzij hij af is, en
   * wat je zelf aantikt wint daarvan. Meer niet — en vooral: niets wordt
   * bewaard. `geopend` begint leeg bij elke keer dat je het pad opent, dus een
   * unit die je openklapte om nog eens naar je sterren te kijken staat de
   * volgende keer weer dicht.
   *
   * Dat betekent ook dat de unit die je net hebt afgemaakt dicht staat als je
   * daarna op het pad komt. Dat is de bedoeling: 100% en het aantal lessen
   * blijven staan, de sterren per les heb je een scherm eerder gezien, en
   * eronder staat meteen waar je verder gaat.
   */
  const [geopend, setGeopend] = useState<Record<string, boolean>>({})
  const toont = (id: string, af: boolean): boolean => geopend[id] ?? !af
  const wissel = (id: string, af: boolean): void => {
    sfx.nav()
    setGeopend((g) => ({ ...g, [id]: !toont(id, af) }))
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-6">
      {/*
        De grond waar het pad overheen loopt.

        Het is de `.zellige`-regel die al in index.css stond: twee rasters van
        34 pixels, een halve tegel uit elkaar. Het motief doet hier dus wat een
        zellige-vloer doet, en niet wat een sticker doet.

        `absolute` en niet `fixed`, en daar zit een meting achter. Als vaste
        laag in het venster zou hij blijven staan terwijl het pad eroverheen
        schuift -- parallax voor niets. Maar `App.tsx` wikkelt elke bladzijde in
        een `motion.main` die van `y: 8` naar `0` gaat, en een transform maakt
        van dat element het nieuwe anker voor alles wat `fixed` staat. Dezelfde
        laag twee keer gemeten: zonder transform 800 pixels hoog op top 0, met
        transform 4 337 pixels hoog op top 85. De tegel is 34 pixels en 85 mod
        34 is 17 -- precies een halve tegel. Het raster verspringt dus bij elke
        keer dat je het tabblad Leren opent, in Chromium en niet alleen in een
        oude WebView.

        Zo schuift de vloer mee met het pad. Dat is minder dan het was bedoeld,
        maar het is wel waar, en een vloer die bij elke bladzijdewissel een
        halve tegel verspringt is erger dan een vloer die niet beweegt.

        `color-mix` in die regel kent een oude WebView niet. Dan vervalt de
        hele achtergrondregel en blijft er een lege laag staan: geen tegels,
        geen kapot scherm. Precies de terugval die zo'n laag hoort te hebben.
      */}
      <div aria-hidden="true" className="zellige pointer-events-none absolute inset-0 -z-10 opacity-60" />
      {/*
        De schaduw op een omhulsel en niet op de kaart zelf.

        `Card` draagt `shadow-sm`, en Tailwind zet zijn eigen maten ná de
        willekeurige waarden in het stijlblad -- gemeten in de gebouwde CSS:
        `.shadow-[...]` staat op 74 526 en `.shadow-sm` op 75 144. Twee regels
        met dezelfde specificiteit, dus de laatste wint, en de warme schaduw
        deed niets. Het omhulsel heeft geen eigen schaduw om tegen te vechten.

        En niet alles hangt even hoog: deze kaart en de koppen van de units
        zweven, de kleinere kaarten eronder liggen gewoon op het papier. Dat
        verschil is de rangorde van het scherm.
      */}
      <div className={`mb-6 rounded-3xl ${ZWEEF}`}>
        <Card className="relative flex flex-col items-center gap-4 overflow-hidden p-5 sm:flex-row">
          {/* Het zellige-raster als watermerk, niet als behang: één rozet in de
              hoek, op tien procent, achter alles wat gelezen moet worden. */}
          <Rozet size={190} className="pointer-events-none absolute -right-14 -top-16 text-zellige-600/10" />
          <Mascot mood={reeksNu(state) > 0 ? 'juich' : 'blij'} size={72} />
          <div className="relative min-w-0 flex-1 text-center sm:text-start">
            <h1 className="font-display text-xl font-extrabold sm:text-2xl">
              {state.name ? t.learn.welkomNaam(state.name) : t.learn.welkom}
            </h1>
            <p className="text-sm text-[var(--ink-soft)]">
              {/* Op dag één is er niets herhaald en niets om mee verder te gaan.
                  "Alles herhaald. Op naar de volgende les." was het eerste wat
                  een nieuwe gebruiker las, boven een knop die "Ga verder" zei. */}
              {eersteKeer ? t.learn.eersteKeer : due > 0 ? t.learn.wachten(due) : t.learn.allesHerhaald}
            </p>
            {volgendeUnit && volgendeLes && (
              <p className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 text-sm font-bold sm:justify-start">
                <span aria-hidden="true">{KIND_ICON[volgendeLes.kind]}</span>
                <span className={`text-[var(--ink)] ${heeftArabisch(lessonTitle(volgendeLes, lang)) ? 'ar' : ''}`}>{lessonTitle(volgendeLes, lang)}</span>
                <span className="font-semibold text-[var(--ink-soft)]">· {volgendeUnit.title}</span>
              </p>
            )}
          </div>
          <div className="relative flex w-full shrink-0 flex-col gap-2 sm:w-auto">
            <Link to={`/les/${next}`}>
              <Button className="w-full">{eersteKeer ? t.learn.beginnen : t.learn.gaVerder}</Button>
            </Link>
            {due > 0 && <Link to="/herhalen"><Button variant="secondary" className="w-full">{t.learn.herhalen}</Button></Link>}
          </div>
        </Card>
      </div>

      <Quests />

      {/* Right under the missions, because the fifth one is a bonus round and
          this is where a child who has finished today's lesson ends up. */}
      <div className="mb-6"><BonusCard /></div>


      {noArabicVoice && (
        <Card className="mb-6 p-5">
          <div className="flex flex-wrap items-start gap-3">
            <span className="text-2xl" aria-hidden="true">🔈</span>
            <div className="min-w-0 grow basis-64">
              <p className="font-display font-extrabold">{t.learn.geenStem}</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.learn.geenStemUitleg}</p>
            </div>
            <Button variant="ghost" onClick={() => markTipSeen('stem')}>{t.learn.begrepen}</Button>
          </div>
        </Card>
      )}

      {/*
        Het aanbod hoort op de plek waar iemand tegen het slot loopt, en één
        keer. Dat is nu de eerste unit waarin een les dichtzit — meestal het
        alfabet zelf — en niet meer de eerste unit die helemaal dicht is.
      */}
      {/*
        Groen zodra er één les af is. Zie `Begin` in Pad.tsx: dit stuk stond
        hard op groen, en dan belooft het pad op dag één dat je er al geweest
        bent.
      */}
      <Begin gelopen={Object.keys(state.lessons).length > 0} />

      <ol>
        {UNITS.map((unit, ui) => {
          const open = unitUnlocked(unit.id, state)
          const paid = unitBehindPaywall(unit.id, state)
          const pct = progressOfUnit(unit.id, state)
          const af = pct >= 1
          const uit = toont(unit.id, af)
          const kop = (
            <>
              {/* Het motief als ritme: dezelfde rozet op elke kop, in de inkt
                  van de kop zelf. Het raster van de app, niet een plaatje. */}
              <Rozet size={168} className="pointer-events-none absolute -right-10 -top-12 text-night-950/15" />
              <div className="relative flex items-center gap-3">
                <span className="text-3xl" aria-hidden="true">{unit.emoji}</span>
                <div className="min-w-0 text-start">
                  {/* `flex-wrap`: bij grote letters past het pilletje niet
                      meer naast de titel en schoof het buiten beeld. */}
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-display text-xl font-extrabold">
                      <span className="opacity-70">{ui + 1}.</span> {unit.title}
                    </h2>
                    <span className="rounded-full bg-night-950/15 px-2 py-0.5 text-[11px] font-bold">{unit.level}</span>
                  </div>
                  <p className="text-sm font-semibold opacity-80">{unitSubtitle(unit, lang)}</p>
                </div>
                {/* De Arabische naam blijft staan, ook bij een unit die je
                    kunt in- en uitklappen — het pijltje komt erachter, niet
                    in de plaats ervan. */}
                {/* `hidden sm:block` op een omhulsel en niet op de `.ar` zelf.
                    `.ar` staat buiten alle lagen in index.css en wint daarmee
                    van elke Tailwind-klasse, `hidden` incluis -- die stond hier
                    en deed niets. Nagemeten op 320px: de Arabische naam nam 70
                    van de 248 pixels in, en de ondertitel van de unit hield er
                    88 over: zes Duitse woorden over zes regels. */}
                <span className="ms-auto hidden shrink-0 sm:block">
                  <span className="ar text-2xl font-bold opacity-70">{unit.ar}</span>
                </span>
                <span className="shrink-0 text-xl font-bold opacity-70 sm:ms-0 ms-auto" aria-hidden="true">{uit ? '⌃' : '⌄'}</span>
              </div>
              <div className="relative mt-3 flex items-center gap-3">
                <Progress value={pct} tone="zellige" className="h-2.5 bg-night-950/20" />
                {/*
                  Een unit die af is krijgt een stempel.
                  "100%" is een getal dat je moet lezen; de khatim uit de vlag
                  is een vorm die je herkent, en het is dezelfde vorm die een
                  kind per les verzamelt. Af voelt daardoor als af in plaats van
                  als een balk die toevallig helemaal vol staat.
                */}
                {af ? (
                  /*
                    `bg-white/30` en niet `bg-night-950/15`. De pil staat op het
                    donkere eind van het verloop van de unit, en een donkere
                    waas daarop haalde de tekst eronderuit: gemeten per
                    unitkleur zakte saffraan van 5,55 naar 4,24 en hruf -- de
                    eerste unit die een kind afrondt -- van 3,78 naar 3,03, waar
                    4,5 de norm is. Met wit wordt het 8,17 tot 5,26: alle zes de
                    kleuren erboven, en daarmee repareert deze pil een getal dat
                    er al te vaag stond in plaats van het vager te maken.
                  */
                  <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/30 px-2 py-0.5 text-xs font-bold">
                    <Khatim size={13} /> 100%
                  </span>
                ) : (
                  <span className="shrink-0 text-xs font-bold">{Math.round(pct * 100)}%</span>
                )}
                {!uit && (
                  <span className="shrink-0 text-xs font-bold opacity-80">· {t.landing.lessenAantal(unit.lessons.length)}</span>
                )}
              </div>
            </>
          )
          /*
           * De kop hangt boven het papier en is in te drukken.
           *
           * Twee schaduwen en geen één, en op twee verschillende dingen. De
           * warme halo zit op het omhulsel: daar hoort hij, want `btn3d` zet
           * zijn eigen `box-shadow` buiten elke laag in index.css en wint
           * daarmee van elke `shadow-`-klasse die je ernaast zet. De knop zelf
           * houdt `btn3d` en dus de harde rand van vier pixels die wegvalt als
           * je hem indrukt -- dezelfde beweging als elke andere knop in de app.
           *
           * En hij plakt bovenaan zolang je in zijn lessen scrolt. Dat is het
           * antwoord op "waar ben ik" zonder dat er iets bij hoeft te komen te
           * staan: de kop van de unit waarin je bezig bent staat er gewoon nog.
           * `--kop-hoogte` wordt door TopBar gemeten en bevat de inkeping al.
           * Een WebView die `sticky` niet kent laat hem meescrollen -- dat is
           * precies hoe het hiervoor was.
           */
          const kopKlasse = `btn3d relative block w-full overflow-hidden rounded-3xl bg-gradient-to-r p-5 text-start text-night-950 ${ACCENTS[unit.accent]}`
          return (
            <li key={unit.id}>
              {open ? (
                <div
                  className={`${uit ? 'sticky z-10' : 'relative'} rounded-3xl ${ZWEEF}`}
                  style={uit ? { top: 'var(--kop-hoogte)' } : undefined}
                >
                  <button type="button" aria-expanded={uit} onClick={() => wissel(unit.id, af)} className={kopKlasse}>
                    {kop}
                  </button>
                </div>
              ) : (
                /*
                 * Een unit die nog niet open is, als strook.
                 *
                 * Dit was dezelfde volle kaart als hierboven, met
                 * `opacity-60 grayscale` eroverheen. Voor wie niet betaald heeft
                 * zijn dat vijftien van de zeventien units, en dan is grijs het
                 * enige wat de bladzijde nog laat zien.
                 *
                 * Nagemeten op 390 pixels met vijftien units op slot: zo'n
                 * kaart was 116 pixels hoog met veertig pixels wit eronder, dus
                 * 2 340 van de 4 859 pixels van de bladzijde -- de helft van wat
                 * je wegscrolt is grijs waar niets in staat. De strook is 70
                 * pixels en de weg ertussen 56: samen 1 834, en de bladzijde
                 * ging van 4 859 naar 4 369.
                 *
                 * De kleur van de unit blijft als streep aan de zijkant staan.
                 * Weghalen zou het pad vooruit kleurloos maken, en juist dat is
                 * de reden om door te willen.
                 */
                <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--surface-raised)] py-3 pl-5 pr-4">
                  <span aria-hidden="true" className={`absolute inset-y-0 left-0 w-1.5 bg-gradient-to-b ${ACCENTS[unit.accent]}`} />
                  <span className="text-2xl opacity-70" aria-hidden="true">{unit.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-display font-extrabold text-[var(--ink)]">
                        <span className="opacity-70">{ui + 1}.</span> {unit.title}
                      </h2>
                      <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[11px] font-bold text-[var(--ink-soft)]">{unit.level}</span>
                    </div>
                    <p className="text-sm text-[var(--ink-soft)]">{unitSubtitle(unit, lang)}</p>
                  </div>
                  <span className="shrink-0 text-lg opacity-60" aria-hidden="true">🔒</span>
                </div>
              )}

              {open && uit ? (
                <motion.ul
                  className="relative"
                  initial={rustig ? false : { opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: 'spring', stiffness: 180, damping: 24 }}
                >
                  {unit.lessons.map((lesson, i) => (
                    <Node
                      key={lesson.id}
                      lesson={lesson}
                      index={i}
                      accent={ACCENTS[unit.accent]!}
                      hier={lesson.id === next}
                      avatar={state.avatar}
                      /*
                        Het stuk weg boven een les is groen als je er langs
                        gekomen bent. Voor de eerste les van een unit stond daar
                        `i === 0 ||`, dus altijd waar — en dan belooft het
                        eerste stuk weg van élke unit dat je er geweest bent,
                        ook de allereerste op dag één. Nu is het de laatste les
                        van de unit ervoor, en voor de allereerste unit hetzelfde
                        antwoord als `Begin`: is er al iets gelopen.
                      */
                      kwamVan={i === 0
                        ? (ui === 0
                          ? Object.keys(state.lessons).length > 0
                          : isDone(UNITS[ui - 1]!.lessons.at(-1)!.id, state))
                        : isDone(unit.lessons[i - 1]!.id, state)}
                      rustig={rustig}
                    />
                  ))}
                </motion.ul>
              ) : !open && !paid ? (
                <p className="mt-3 text-center text-sm text-[var(--ink-soft)]">{t.learn.unitSlot(ui)}</p>
              ) : null}

              {ui === slotBij && (
                <Card className="mt-6 flex flex-wrap items-center gap-3 p-5">
                  <span className="text-2xl" aria-hidden="true">🔑</span>
                  <p className="min-w-0 grow basis-48 font-display font-extrabold">{t.unlock.slotTitel}</p>
                  <Link to="/volledig"><Button>{t.unlock.slotKnop}</Button></Link>
                </Card>
              )}

              {/* De weg loopt door tot de volgende unit, met een zellige-tegel
                  op de grens. Dat is wat een hoofdstuk hier is: niet een witte
                  ruimte van veertig pixels, maar een stuk weg met een merkteken
                  erop. */}
              {ui < UNITS.length - 1 && <Overgang gelopen={unitUnlocked(UNITS[ui + 1]!.id, state)} />}
            </li>
          )
        })}
      </ol>

      <Einde gelopen={UNITS.every((u) => progressOfUnit(u.id, state) >= 1)} />

      <Card className="p-5 text-center">
        <p className="font-display text-lg font-extrabold">{t.learn.klaarMetPad}</p>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.learn.klaarMetPadUitleg}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          <Link to="/verhalen"><Button variant="secondary">📖 {t.nav.verhalen}</Button></Link>
          <Link to="/letters"><Button variant="secondary">🔤 {t.nav.letters}</Button></Link>
          <Link to="/spelen"><Button variant="secondary">🎮 {t.nav.spelen}</Button></Link>
        </div>
      </Card>
    </div>
  )
}
