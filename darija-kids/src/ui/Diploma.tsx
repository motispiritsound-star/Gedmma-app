import { useEffect, useMemo, useState } from 'react'
import type { Unit } from '../content/types'
import { unitSubtitle } from '../content/localise'
import {
  MAX_NAAM, MAX_WOORD, onderteken, ondertekenaars, sindsLaatsteHandtekening, sterrenVanUnit,
  type Sindsdien,
} from '../engine/diploma'
import { getState, useStore, type Diploma } from '../engine/store'
import { sfx } from '../engine/audio'
import { localeOf, useLang, useT, type Lang } from '../i18n'
import { Button, Card, Sheet } from './kit'
import { Khatim, Khatims } from './Khatim'
import { OuderPoort, poortAl } from './OuderPoort'

/**
 * De oorkonde, en het paneel waarin een volwassene hem ondertekent.
 *
 * Twee onderdelen in één bestand, omdat het hetzelfde ding in een andere maat
 * is: dezelfde unit, dezelfde datum, dezelfde naam onderaan. Stonden ze apart,
 * dan zou het paneel iets anders beloven dan wat er op het vel komt — en daar
 * mag dit nu juist nooit over gaan.
 */

/** Een datum zoals het land van de gebruiker hem schrijft. */
const datum = (ms: number, lang: Lang): string =>
  new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long', year: 'numeric' }).format(ms)

/* ----------------------------------------------------------------- oorkonde */

/**
 * Het diploma zelf, zoals het op het scherm staat en zoals het op papier komt.
 *
 * Eén component voor beide, en niet een scherm- en een afdrukversie. Twee
 * versies lopen uit elkaar bij de eerste wijziging, en dan staat er op het vel
 * iets anders dan wat het kind heeft zien ontstaan. De afdrukstijl onderaan
 * index.css zet de kleuren terug op zwart op wit; de vorm hieronder is op
 * papier dezelfde als op het scherm.
 *
 * De rand is `--accent-600`, de kleur die het kind zelf gekozen heeft. Een
 * trede donkerder dan de knoppen, want een rand is iets grafisch en moet 3 op
 * 1 halen: nagerekend haalt op wit de lichtste van de vier (saffraan) 3,19 en
 * op de donkere kaart de donkerste (terra) 3,66. Alle vier dus, in beide
 * standen. De tekst erin is gewone inkt — `--accent-500` als tekst haalt 2,2.
 */
export function Oorkonde({ unit, diploma, className = '' }: {
  unit: Unit
  diploma: Diploma
  className?: string
}) {
  const t = useT()
  const lang = useLang()
  const naam = useStore((s) => s.name)
  /*
   * Twee losse getallen en geen `sterrenVanUnit(...)` in de selector.
   *
   * Een selector die een nieuw voorwerp teruggeeft maakt van elke tekening een
   * wijziging, en dan draait React rond — dat staat zo in `useStore` en het is
   * hier makkelijk mis te doen, want `{gehaald, max}` leest prettiger.
   */
  const gehaald = useStore((s) => sterrenVanUnit(unit.id, s).gehaald)
  const max = unit.lessons.length * 3
  /*
   * Drie khatims, zoals een les er drie heeft, met het echte aantal eronder.
   *
   * Naar beneden afgerond en niet afgerond: de derde khatim hoort "overal
   * drie" te betekenen. Met `Math.round` kreeg een unit met 83% er al drie, en
   * dan zegt het plaatje iets anders dan de regel eronder.
   */
  const vol = max ? Math.floor((gehaald / max) * 3) : 0

  return (
    <div
      className={`relative overflow-hidden rounded-3xl border-4 border-[var(--accent-600)] bg-[var(--surface-raised)] px-5 py-7 text-center sm:px-8 ${className}`}
    >
      {/* De zellige-tegels als vulling achter de tekst. `aria-hidden` en een
          lage dekking: hij is er om een vel eruit te laten zien als een vel,
          en hij mag de tekst nooit in de weg zitten. */}
      <span className="zellige pointer-events-none absolute inset-0 opacity-40" aria-hidden="true" />

      <div className="relative">
        <p className="font-display text-[11px] font-extrabold uppercase tracking-[0.35em] text-[var(--ink-soft)]">
          {t.diploma.kop}
        </p>
        <Khatim size={52} className="mx-auto mt-3 text-khatim-500 dark:text-khatim-400" />

        {/*
          De naam van het kind is de kop, niet die van de unit.
          Andersom leest het als een inhoudsopgave — "Lalwan, afgerond" — en
          een diploma begint bij wie het gehaald heeft.
        */}
        <p className="mt-4 font-display text-2xl font-extrabold sm:text-3xl">
          {naam || t.profile.leerling}
        </p>
        <p className="mt-1 text-[var(--ink-soft)]">
          {naam ? t.diploma.heeftAf(unit.title) : t.diploma.oorkondeZonderNaam(unit.title)}
        </p>

        <p className="mt-3">
          <span className="ar text-2xl font-bold">{unit.ar}</span>
        </p>
        <p className="text-sm text-[var(--ink-soft)]">{unitSubtitle(unit, lang)}</p>

        <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
          <span className="text-4xl" aria-hidden="true">{unit.emoji}</span>
          <span className="flex flex-col items-center">
            <Khatims stars={vol} size={22} label={t.diploma.sterren(gehaald, max)} />
            <span className="mt-0.5 text-xs font-bold text-[var(--ink-soft)]">
              {t.diploma.sterren(gehaald, max)}
            </span>
          </span>
        </div>

        <p className="mt-4 text-sm font-bold">{datum(diploma.op, lang)}</p>

        {/*
          De streep onderaan — het hele verschil met een insigne.

          Staat er niets onder, dan staat het er niet als een verwijt maar als
          wat het is: een regel waar nog een naam onder hoort, met het woord
          "handtekening" eronder zoals op elk formulier. Geen uitroepteken,
          geen slotje, geen "nog niet".
        */}
        <div className="mx-auto mt-7 max-w-xs border-t-2 border-[var(--line)] pt-2">
          {diploma.getekendOp ? (
            <>
              {diploma.woord && (
                <p className="font-display text-base font-extrabold">“{diploma.woord}”</p>
              )}
              <p className="mt-1 font-display text-lg font-extrabold">{diploma.door}</p>
              <p className="text-xs text-[var(--ink-soft)]">
                {t.diploma.getekendOp(datum(diploma.getekendOp, lang))}
              </p>
            </>
          ) : (
            <p className="text-xs uppercase tracking-wide text-[var(--ink-soft)]">{t.diploma.handtekening}</p>
          )}
        </div>

        <p className="mt-6 text-[10px] uppercase tracking-wide text-[var(--ink-soft)]">
          {t.diploma.uitgereiktDoor}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------- ondertekenen */

/**
 * Het paneel waarin een volwassene zijn naam eronder zet.
 *
 * Met de rekensom ervoor, en dat is hier geen formaliteit die een winkel ons
 * vraagt: zonder die som tikt een kind van acht zelf "mama" in het veld, en
 * dan is de hele plank een stickervel. `poortAl()` slaat hem over als er deze
 * sessie al een volwassene langs is geweest — dezelfde afweging als bij de
 * drie mailknoppen, uitgelegd in OuderPoort.tsx.
 *
 * `unit` is null als er niets te ondertekenen is; die ene waarde stuurt het
 * hele paneel. Eén bron dus, en geen `open` die met `unit` uit de maat kan
 * lopen.
 */
/**
 * Het ijkpunt van deze zitting: wat er gebeurd is sinds de vorige handtekening.
 *
 * Eén keer vastgelegd, en daarna niet meer. Hing dit aan de unit, dan klopte
 * het alleen bij de eerste handtekening: een ouder die zijn plank in één keer
 * ondertekent -- en dat is de gewone gang van zaken, want een bestaande opslag
 * krijgt al zijn diploma's tegelijk -- las bij de eerste "13 lessen afgerond ·
 * 26 dagen geoefend · 780 XP" en bij de tweede en derde drie keer nul. Gemeten
 * op /ouders in drie beurten achter elkaar.
 *
 * Nul is niet eens onwaar: sinds een minuut geleden is er inderdaad niets
 * gebeurd. Maar het is niet de vraag die deze regel beantwoordt. Een ouder
 * leest hier wat hij gemist heeft, en dat is hetzelfde bedrag of hij nu één
 * diploma tekent of vier.
 *
 * Per zitting dus, net zoals `poortAl()` de ouderpoort per zitting onthoudt.
 * Het verschuift zodra de app opnieuw opengaat, en dat is precies wanneer het
 * hoort te verschuiven. `sindsLaatsteHandtekening` zelf blijft een zuivere
 * rekensom over de staat, en blijft dus te testen.
 */
let zitting: Sindsdien | null = null
const zittingSinds = (): Sindsdien => (zitting ??= sindsLaatsteHandtekening(getState()))

export function Ondertekenen({ unit, onKlaar }: { unit: Unit | null; onKlaar: () => void }) {
  const t = useT()
  const lang = useLang()
  const [poort, setPoort] = useState(false)
  const [vraag, setVraag] = useState(false)
  const [naam, setNaam] = useState('')
  const [woord, setWoord] = useState('')
  const [fout, setFout] = useState(false)
  const diplomas = useStore((s) => s.diplomas)
  const bestaand = unit ? diplomas[unit.id] : undefined

  /*
   * Wat er sinds de vorige handtekening gebeurd is, één keer vastgelegd per
   * zitting. Niet live uit de staat: dit getal hoort niet te verschuiven
   * terwijl iemand een compliment typt, en het is bovendien een voorwerp —
   * dat mag niet uit een selector komen.
   */
  const sinds = useMemo(() => zittingSinds(), [unit])

  useEffect(() => {
    if (!unit) { setPoort(false); setVraag(false); return }
    setFout(false)
    /*
     * De naam staat er al ingevuld voor wie eerder ondertekende.
     *
     * Zeventien diploma's zijn zeventien keer "mama" intikken, en dat is
     * zestien keer te veel. Het bestaande diploma gaat voor — dat is degene
     * die dit vak eerder ondertekende — en anders degene die het vaakst
     * ondertekend heeft.
     */
    const vaakst = ondertekenaars(getState())[0]?.naam ?? ''
    setNaam(diplomas[unit.id]?.door || vaakst)
    setWoord(diplomas[unit.id]?.woord ?? '')
    if (poortAl()) setVraag(true)
    else setPoort(true)
    // Alleen `unit` in de afhankelijkheden, met opzet: een handtekening die
    // wordt gezet verandert `diplomas`, en stond die erbij dan vulde dit effect
    // de velden opnieuw terwijl het paneel aan het sluiten is.
  }, [unit])

  const sluit = () => {
    setVraag(false)
    setPoort(false)
    setFout(false)
    onKlaar()
  }

  const teken = () => {
    if (!unit) return
    if (!onderteken(unit.id, naam, woord)) {
      setFout(true)
      return
    }
    sfx.confirm()
    sluit()
  }

  if (!unit) return null

  return (
    <>
      <OuderPoort
        open={poort}
        reden="diploma"
        onClose={sluit}
        onGoed={() => { setPoort(false); setVraag(true) }}
      />
      <Sheet open={vraag} onClose={sluit} labelledBy="teken-titel">
        <h2 id="teken-titel" className="font-display text-xl font-extrabold">{t.diploma.tekenTitel}</h2>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">{t.diploma.tekenUitleg}</p>

        <Card className="mt-4 p-4">
          <p className="font-display font-extrabold">{unit.title}</p>
          <p className="text-sm text-[var(--ink-soft)]">{unitSubtitle(unit, lang)}</p>
          {/*
            Wat er sinds de vorige handtekening gebeurd is.

            Dit is het antwoord op "hoe blijft een ouder op de hoogte", en het
            staat met opzet hier en niet in een melding: een bericht op
            donderdagavond met vier getallen erin wil niemand, en het is precies
            het soort bericht dat een winkel een engagement notification noemt.
            De informatie komt dus op de plek waar het antwoord gegeven wordt.
          */}
          <p className="mt-3 text-xs font-bold uppercase tracking-wide text-[var(--ink-soft)]">
            {sinds.vanaf ? t.diploma.sindsTitel : t.diploma.sindsBegin}
          </p>
          <p className="text-sm font-bold">{t.diploma.sindsRegel(sinds.lessen, sinds.dagen, sinds.xp)}</p>
        </Card>

        <label htmlFor="teken-naam" className="mt-4 block text-sm font-bold">{t.diploma.vanWie}</label>
        <input
          id="teken-naam"
          value={naam}
          onChange={(e) => { setNaam(e.target.value.slice(0, MAX_NAAM)); setFout(false) }}
          placeholder={t.diploma.vanWieTip}
          autoComplete="off"
          enterKeyHint="next"
          aria-invalid={fout}
          aria-describedby={fout ? 'teken-fout' : undefined}
          className="mt-1 block w-full rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2.5 outline-none focus:border-zellige-500"
        />
        {/* `role="alert"`: wie het scherm niet ziet hoort anders niets en tikt
            een tweede keer op dezelfde knop. Zie OuderPoort.tsx. */}
        {fout && (
          <p id="teken-fout" role="alert" className="mt-1 text-sm text-terra-600 dark:text-terra-300">
            {t.diploma.geenNaam}
          </p>
        )}

        <p className="mt-4 text-sm font-bold">{t.diploma.watErbij}</p>
        {/*
          Vier voorstellen boven het tekstveld.

          Zonder die vier blijft het veld bij de meeste mensen leeg: een
          compliment verzinnen terwijl je kind naast je staat is moeilijker dan
          een compliment aantikken, en een aangetikt compliment met je eigen
          naam eronder is nog steeds van jou. Wie zelf wil typen, typt zelf.
        */}
        <ul className="mt-2 flex flex-wrap gap-2">
          {t.diploma.voorstellen.map((v) => (
            <li key={v}>
              {/* `py-2.5` en niet `py-1`: op een telefoon staan deze vier
                  onder elkaar, en een vinger moet er 44 pixels van raken. */}
              <button
                type="button"
                onClick={() => { sfx.tap(); setWoord(v) }}
                aria-pressed={woord === v}
                className={`rounded-full border-2 px-3 py-2.5 text-start text-sm font-bold ${
                  woord === v ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)]'
                }`}
              >
                {v}
              </button>
            </li>
          ))}
        </ul>
        <label htmlFor="teken-woord" className="sr-only">{t.diploma.watErbij}</label>
        <textarea
          id="teken-woord"
          value={woord}
          onChange={(e) => setWoord(e.target.value.slice(0, MAX_WOORD))}
          placeholder={t.diploma.watErbijTip}
          rows={2}
          className="mt-2 block w-full rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 outline-none focus:border-zellige-500"
        />

        {/* `basis-32` op allebei: in het Duits heet de rechterknop "Namen
            darunter setzen", en naast "Abbrechen" paste dat op 320 pixels
            niet op één regel. Nu vallen ze onder elkaar. */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="secondary" className="min-w-0 grow basis-32" onClick={sluit}>{t.common.annuleren}</Button>
          <Button className="min-w-0 grow basis-32" onClick={teken}>
            {bestaand?.getekendOp ? t.diploma.opnieuw : t.diploma.tekenKnop}
          </Button>
        </div>
      </Sheet>
    </>
  )
}
