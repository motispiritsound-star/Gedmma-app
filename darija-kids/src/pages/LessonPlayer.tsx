import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import confetti from 'canvas-confetti'
import { lessonById, unitOfLesson } from '../content/curriculum'
import { cardForCheckpoint, type HistoryCard } from '../content/history'
import { buildRound } from '../engine/exercises'
import {
  awardBadges, checkpointsDone, collectHistory, completeLesson, getState, goalMet, heartsNow,
  isMijlpaal, knownIds, gratisDeelOp, lessonBehindPaywall, levelOf, markTipSeen, nextLesson, useStore,
  xpToday, type Badge,
} from '../engine/store'
import { TRIAL_DAYS } from '../engine/billing'
import { sfx } from '../engine/audio'
import { Button, Card, Sheet } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { RoundRunner, type RoundResult } from '../ui/Round'
import { Film } from '../ui/Film'
import { HistoryFilm } from '../ui/HistoryCard'
import { Khatims } from '../ui/Khatim'
import { useLang, useT } from '../i18n'
import { heeftArabisch, lessonTitle, tipOf, unitSubtitle } from '../content/localise'

/**
 * De les zit in een eigen component met de les-id als `key`.
 *
 * Sinds het scorescherm de volgende les meteen kan beginnen, gaat de app van
 * /les/a naar /les/b zonder er iets tussen — en dan blijft deze component
 * gewoon staan. Alles wat erin hangt blijft dus ook staan: `result`, de
 * gewonnen beloningen, de mijlpaal, het aantal pogingen. Zonder die `key`
 * opent de volgende les met het scorescherm van de vorige erover.
 *
 * Een `key` is hier beter dan zes `setX(...)` in een effect: wie er later een
 * zevende stukje staat bij zet, hoeft nergens aan te denken.
 */
export function LessonPlayer() {
  const { lessonId = '' } = useParams()
  return <LesScherm key={lessonId} lessonId={lessonId} />
}

function LesScherm({ lessonId }: { lessonId: string }) {
  const t = useT()
  const lang = useLang()
  const navigate = useNavigate()
  const lesson = lessonById(lessonId)
  const unit = unitOfLesson(lessonId)
  const seenTip = useStore((s) => s.seenTips.includes(lessonId))
  const streak = useStore((s) => s.streak)
  /**
   * Een les achter het slot is op het pad niet aan te tikken, maar een adres
   * wel in te typen — en in de webversie staat er een adresbalk boven. Het slot
   * hoort dus ook hier te staan en niet alleen op de knop ernaartoe.
   */
  const opSlot = useStore((s) => lessonBehindPaywall(lessonId, s))

  const [showTip, setShowTip] = useState(false)
  const [result, setResult] = useState<RoundResult | null>(null)
  const [won, setWon] = useState<Badge[]>([])
  const [attempt, setAttempt] = useState(0)
  // What finishing itself paid, on top of the answers that already paid out.
  const [bonus, setBonus] = useState({ xp: 0, gems: 0, levelled: false })
  /** Wat deze les afsloot: het dagdoel, een mijlpaal, en een gebruikte vriesdag. */
  const [vieren, setVieren] = useState<{ doel: boolean; reeks: number | null; vries: boolean }>(
    { doel: false, reeks: null, vries: false })

  /**
   * De staat van vóór de rónde, niet van vóór het afronden.
   *
   * Een goed antwoord betaalt meteen uit: `scoreCorrect` roept `addXp` aan
   * middenin de les. Op het moment dat `finish` draait is de reeks dus allang
   * opgehoogd en een vriesdag allang afgeschreven, en vergelijk je iets met
   * zichzelf. Gemeten op een echte les: de reeks stond op 3, dat is een
   * mijlpaal, en er kwam niets in beeld.
   */
  const voorRonde = useRef(getState())
  useEffect(() => { voorRonde.current = getState() }, [lessonId, attempt])
  // The little film runs before the score, so the reward arrives before the
  // report card does. After a checkpoint it is a history card instead: a piece
  // of where the language comes from, in place of nine seconds of scenery.
  const [film, setFilm] = useState(false)
  const [card, setCard] = useState<HistoryCard | null>(null)
  const lessonsDone = useStore((s) => Object.keys(s.lessons).length)
  /**
   * Of dit de laatste gratis les was.
   *
   * Uitgelezen op het scorescherm en niet eerder: tijdens de les hoort er
   * niets over geld te staan, en vóór `completeLesson` is deze les nog niet
   * geteld — dan zou hij altijd onwaar zijn.
   */
  const gratisOp = useStore(gratisDeelOp)

  /*
   * Welke les hierna komt, en de knop die hem meteen begint.
   *
   * Dit is het vaakst gelopen stukje van de hele app: elke les eindigt hier.
   * De grote knop zei "Verder op pad" en bracht je naar /leren, waar je de
   * volgende les nog moest zoeken en aantikken. Twee tikken en wat scrollen
   * voor het enige wat iemand die net een les afmaakte bijna altijd wil.
   *
   * Nu begint de knop die les, en zegt hij welke. Het pad blijft eronder
   * staan voor wie wél wil rondkijken.
   *
   * `nextLesson` geeft de laatst afgeronde les terug als er niets meer open
   * staat, dus de vergelijking met `lessonId` is het signaal "dit was hem" —
   * dan blijft het pad de bovenste knop.
   */
  const volgendeId = useStore(nextLesson)
  const volgende = volgendeId === lessonId ? undefined : lessonById(volgendeId)

  // The round is built once per attempt, from what the learner already knows.
  const exercises = useMemo(
    () => (lesson ? buildRound(lesson, { known: knownIds(getState()), toets: lesson.kind === 'toets' }) : []),
    [lessonId, attempt],
  )

  /**
   * Zijn de hartjes op, dan begint de les niet en hoort de tip er niet over
   * heen te komen.
   *
   * Dat deed hij wel: een kind zonder hartjes kreeg een uitklapper over het
   * Arabische schrift precies over de knoppen heen die zeggen hoe het verder
   * kan. Hij komt alsnog zodra er weer een hartje is -- ook meteen na het
   * aanvullen -- want `seenTip` blijft tot hij echt gelezen is.
   */
  const hartjesOp = useStore((s) => s.settings.hearts && heartsNow(s) <= 0)

  useEffect(() => {
    if (lesson?.tip && !seenTip && !hartjesOp) setShowTip(true)
  }, [lessonId, hartjesOp])

  if (!lesson) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Mascot mood="denk" />
        {/* Een `h1` en geen `p`: dit is het enige wat op de bladzijde staat, en
            zonder kop landt een schermlezer hier op niets. */}
        <h1 className="mt-4 font-display text-xl font-extrabold">{t.lesson.bestaatNiet}</h1>
        <Link to="/leren" className="mt-4 inline-block"><Button>{t.lesson.terugNaarPad}</Button></Link>
      </div>
    )
  }

  if (opSlot) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <Mascot mood="denk" />
        <p className="mt-4 font-display text-xl font-extrabold">{t.unlock.slotTitel}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <Link to="/volledig"><Button>{t.unlock.slotKnop}</Button></Link>
          <Link to="/leren"><Button variant="secondary">{t.lesson.terugNaarPad}</Button></Link>
        </div>
      </div>
    )
  }

  const finish = (r: RoundResult) => {
    // The answers have already paid out; this is what finishing adds on top.
    const extra = (r.perfect ? 5 : 0) + (lesson.kind === 'toets' ? 10 : 0) + (r.seconds < 180 ? 2 : 0)
    const bonusXp = Math.round(10 + r.score * 10 + extra)
    const before = getState()
    const levelBefore = levelOf(before.xp).level
    const start = voorRonde.current
    const doelVoor = goalMet(start)
    completeLesson(lesson.id, r.score, bonusXp)
    const now = getState()
    const levelled = levelOf(now.xp).level > levelBefore
    setBonus({ xp: bonusXp, gems: now.gems - before.gems, levelled })
    /*
     * Wat deze les niet alleen opleverde maar ook afsloot.
     *
     * Allebei vóór-en-ná, niet "is het nu zo": het dagdoel was misschien
     * vanmorgen al gehaald, en dan is het geen nieuws meer. Een reeks telt
     * alleen als mijlpaal op de dag dat hij erbij komt.
     */
    const mijlpaal = now.streak > start.streak && isMijlpaal(now.streak)
    setVieren({
      doel: !doelVoor && goalMet(now),
      reeks: mijlpaal ? now.streak : null,
      /* Een vriesdag die je niet ziet werken is een aankoop zonder zichtbaar
         gevolg. `addXp` schrijft hem stil af; hier is de enige plek waar
         iemand het te horen krijgt. */
      vries: now.freezes < start.freezes,
    })
    const badges = awardBadges()
    setWon(badges)
    setResult(r)
    // The film carries its own music, so the flourish waits until after it.
    if (lesson.kind === 'toets') {
      // The card is earned by passing the checkpoint, not by watching it, so
      // it goes into the collection even if the film is switched off.
      const earned = cardForCheckpoint(checkpointsDone(now) - 1)
      collectHistory(earned.id)
      if (now.settings.film) setCard(earned)
      else celebrate(r, levelled, badges.length, mijlpaal)
    } else if (now.settings.film && now.settings.motion === 'full') setFilm(true)
    else celebrate(r, levelled, badges.length, mijlpaal)
  }

  /** The sound and the confetti for a finished lesson, wherever it lands. */
  const celebrate = (r: RoundResult, levelled: boolean, badges: number, mijlpaal = false) => {
    // A checkpoint that went well gets the room clapping; an ordinary lesson
    // gets the ordinary flourish.
    if (lesson.kind === 'toets' && r.score >= 0.8) sfx.cheer()
    else sfx.finish()
    // Stack the rewards in the order they happened, not on top of each other.
    if (levelled) setTimeout(() => sfx.levelUp(), 1400)
    if (badges) setTimeout(() => sfx.badge(), 2400)
    // Een mijlpaal hoort het laatst te komen: hij gaat niet over deze les maar
    // over alle dagen ervoor.
    if (mijlpaal) setTimeout(() => sfx.cheer(), badges ? 3400 : 2400)
    if (getState().settings.motion === 'full') {
      void confetti({
        particleCount: r.perfect ? 160 : 90,
        spread: 75,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#14b8a6', '#e2603c', '#22c55e'],
      })
    }
  }

  if (card && result) {
    return (
      <HistoryFilm
        card={card}
        onDone={() => {
          setCard(null)
          celebrate(result, bonus.levelled, won.length, vieren.reeks !== null)
        }}
      />
    )
  }

  if (film && result) {
    return (
      <Film
        scene={lessonsDone}
        onDone={() => {
          setFilm(false)
          // The level-up and the badges still get their turn, after the film.
          celebrate(result, bonus.levelled, won.length, vieren.reeks !== null)
        }}
      />
    )
  }

  if (result) {
    const stars = result.score >= 0.95 ? 3 : result.score >= 0.8 ? 2 : 1
    return (
      <div className="mx-auto max-w-md px-4 py-10 text-center">
        <Mascot mood="juich" size={130} className="mx-auto" />
        <h1 className="mt-4 font-display text-3xl font-extrabold">{result.perfect ? t.lesson.foutloos : t.lesson.lesKlaar}</h1>
        <p className="mt-1 text-[var(--ink-soft)]">
          <span className={heeftArabisch(lessonTitle(lesson, lang)) ? 'ar' : ''}>{lessonTitle(lesson, lang)}</span>
          {' · '}{unit ? unitSubtitle(unit, lang) : ''}
        </p>
        <Khatims stars={stars} size={40} className="my-4 justify-center" label={t.learn.sterren(stars)} />
        <div className="grid grid-cols-2 min-[360px]:grid-cols-3 gap-3">
          <Card className="p-3"><div className="font-display text-2xl font-extrabold">{Math.round(result.score * 100)}%</div><div className="text-xs text-[var(--ink-soft)]">{t.common.goed}</div></Card>
          <Card className="p-3"><div className="font-display text-2xl font-extrabold">🔥 {result.bestCombo}</div><div className="text-xs text-[var(--ink-soft)]">{t.lesson.besteReeks}</div></Card>
          <Card className="p-3"><div className="font-display text-2xl font-extrabold">🔥 {streak}</div><div className="text-xs text-[var(--ink-soft)]">{t.common.dagen}</div></Card>
        </div>

        {/*
          Het dagdoel en de mijlpaal, bovenaan de beloningen.

          Een dagdoel dat niemand ooit "gehaald" noemt is geen doel maar een
          balkje: `goalMet` stond in de engine en werd door geen enkel scherm
          gelezen. En een reeks die stilletjes doortelt is een getal. Dit is
          het enige moment waarop allebei waar worden, dus hier staat het --
          boven het XP-overzicht, want dit is het grotere nieuws.
        */}
        {(vieren.doel || vieren.reeks !== null || vieren.vries) && (
          <Card className="mt-3 border-2 border-saffron-500 p-4">
            {vieren.vries && (
              <p className="font-display font-extrabold text-sky-600 dark:text-sky-300">
                🧊 {t.lesson.vriesGebruikt}
              </p>
            )}
            {vieren.reeks !== null && (
              <p className="font-display text-lg font-extrabold text-saffron-600 dark:text-saffron-300">
                🔥 {t.lesson.reeksMijlpaal(vieren.reeks)}
              </p>
            )}
            {vieren.doel && (
              <p className="font-display font-extrabold text-mint-600 dark:text-mint-300">
                🎯 {t.lesson.doelGehaald(xpToday())}
              </p>
            )}
          </Card>
        )}

        {/* What this round actually paid, split the way it was earned. */}
        <Card className="mt-3 flex items-center justify-around gap-2 p-4">
          <div>
            <div className="font-display text-2xl font-extrabold text-mint-600 dark:text-mint-300">
              {t.lesson.xpPlus(result.xp + bonus.xp)}
            </div>
            <div className="text-xs text-[var(--ink-soft)]">{t.lesson.xpOpgehaald(result.xp, bonus.xp)}</div>
          </div>
          <div>
            <div className="font-display text-2xl font-extrabold text-saffron-600 dark:text-saffron-300">
              💎 {t.lesson.gemPlus(result.gems + bonus.gems)}
            </div>
            <div className="text-xs text-[var(--ink-soft)]">{t.lesson.edelstenen}</div>
          </div>
        </Card>

        {won.length > 0 && (
          <Card className="mt-4 p-4">
            <p className="font-display font-extrabold">{t.lesson.nieuweBeloning(won.length)}</p>
            <ul className="mt-2 flex flex-wrap justify-center gap-2">
              {won.map((b) => (
                <li key={b.id} className="rounded-full bg-saffron-500/15 px-3 py-1 text-sm font-bold">{b.emoji} {t.badges[b.id].naam}</li>
              ))}
            </ul>
          </Card>
        )}

        {/*
          De enige plek waar het scorescherm over het abonnement begint, en
          alleen als er werkelijk geen volgende les meer is. Hij staat ónder
          de beloningen: eerst krijg je waar je voor gewerkt hebt, dan pas de
          mededeling.
        */}
        {gratisOp && (
          <Card className="mt-4 p-4 text-start">
            <p className="font-display font-extrabold">{t.lesson.gratisOpTitel}</p>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.lesson.gratisOpBody(TRIAL_DAYS)}</p>
          </Card>
        )}

        <div className="mt-6 space-y-3">
          {/*
            Als het pad op is, is "verder op pad" een knop naar een slotje.
            Dan wisselen de twee van plek — niet om te duwen, maar omdat de
            bovenste knop hoort te doen wat de lezer nu wil.
          */}
          {gratisOp ? (
            <Link to="/volledig" className="block"><Button className="w-full">{t.unlock.slotKnop}</Button></Link>
          ) : volgende ? (
            <Button className="w-full" onClick={() => navigate(`/les/${volgende.id}`)}>
              <span className="block">{t.lesson.volgendeLes}</span>
              {/* `leading-6`: een lestitel kan Arabisch schrift zijn, en dat
                  heeft meer hoogte nodig dan de regelafstand van een knop.
                  Zonder dit werd "ا ب ت ث" aan de boven- en onderkant
                  afgesneden. */}
              <span className={`mt-0.5 block text-sm leading-6 font-bold normal-case tracking-normal opacity-90 ${
                heeftArabisch(lessonTitle(volgende, lang)) ? 'ar' : ''
              }`}>
                {lessonTitle(volgende, lang)}
              </span>
            </Button>
          ) : (
            <Button className="w-full" onClick={() => navigate('/leren')}>{t.lesson.verderOpPad}</Button>
          )}
          {!gratisOp && volgende && (
            <Button variant="secondary" className="w-full" onClick={() => navigate('/leren')}>
              {t.lesson.verderOpPad}
            </Button>
          )}
          <Button
            variant="secondary"
            className="w-full"
            onClick={() => { setResult(null); setWon([]); setBonus({ xp: 0, gems: 0, levelled: false }); setVieren({ doel: false, reeks: null, vries: false }); setAttempt((a) => a + 1) }}
          >
            {t.common.nogEenKeer}
          </Button>
          {gratisOp && (
            <Button variant="secondary" className="w-full" onClick={() => navigate('/leren')}>
              {t.lesson.verderOpPad}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <>
      <RoundRunner
        key={attempt}
        exercises={exercises}
        quiz={lesson.kind === 'toets'}
        onFinish={finish}
        onQuit={() => navigate('/leren')}
      />
      <Sheet open={showTip} onClose={() => { markTipSeen(lesson.id); setShowTip(false) }} labelledBy="tip-title">
        <div className="text-center">
          <Mascot mood="denk" size={80} className="mx-auto" />
          <h2 id="tip-title" className="mt-2 font-display text-xl font-extrabold">{tipOf(lesson, lang)?.title}</h2>
          <p className="mt-2 text-[var(--ink-soft)]">{tipOf(lesson, lang)?.body}</p>
          <Button className="mt-5 w-full" onClick={() => { markTipSeen(lesson.id); setShowTip(false) }}>{t.lesson.aanDeSlag}</Button>
        </div>
      </Sheet>
    </>
  )
}
