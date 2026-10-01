import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  btwInbegrepen, buyEbook, EBOOK, ebookKlaar, ebookWachtTot, FREE_LESSONS,
  manageSubscription, PLANS, planOf,
  restorePurchases, subscribe, TRIAL_DAYS, useBilling, YEAR_FULL_PRICE, YEAR_SAVING, type PlanId,
} from '../engine/billing'
import { gezinsdeling, platform, winkelVan } from '../engine/platform'
import { useStore } from '../engine/store'
import { localeOf, useT } from '../i18n'
import { sfx } from '../engine/audio'
import { Button, Card, SectionTitle } from '../ui/kit'
import { Mascot } from '../ui/Mascot'
import { OuderPoort, poortAl, type PoortReden } from '../ui/OuderPoort'

/**
 * The one thing in this app that costs money.
 *
 * Apple and Google run the trial, the payment and the monthly renewal; this
 * page only asks for it, says plainly what it will cost and when, and puts a
 * question in front of it that a small child cannot answer alone.
 */
export function Unlock() {
  const t = useT()
  const billing = useBilling()
  const subscribed = useStore((s) => s.unlocked)
  /**
   * Recht op het boek en het boek kunnen openen zijn twee dingen.
   *
   * Bij het jaarabonnement zit er een proefperiode tussen, en in die dagen is
   * er nog niets betaald. Zie `ebookKlaar` in `engine/billing.ts`.
   */
  const boek = useStore((s) => ebookKlaar(s))
  const boekWacht = useStore((s) => ebookWachtTot(s))
  const lang = useStore((s) => s.settings.lang)
  /**
   * De ouderpoort, en wat erachter wacht.
   *
   * Het was een ja/nee-vlag voor alleen het abonnement, en daardoor stonden de
   * twee andere deuren van dit scherm open: het e-boek kopen, en het e-boek
   * openen — dat laatste verlaat de app. Nu draagt de poort de handeling zelf,
   * zodat er geen deur meer bij kan komen die hem vergeet.
   */
  const [poort, setPoort] = useState<{ reden: PoortReden; doe: () => void } | null>(null)

  /**
   * De poort vragen, of hem overslaan als er deze keer al een volwassene
   * langs is geweest. Zie `poortAl` in `ui/OuderPoort.tsx` voor waarom dat
   * één keer per keer dat de app open is genoeg is.
   */
  const vraagPoort = (wat: { reden: PoortReden; doe: () => void }) => {
    if (poortAl()) { wat.doe(); return }
    setPoort(wat)
  }
  // A year up front is the offer, so it is what the screen opens on.
  const [plan, setPlan] = useState<PlanId>('jaar')

  /** The price the store quotes, in the buyer's currency; otherwise our own. */
  const priceOf = (id: PlanId) => billing.prices[id] ?? planOf(id).list
  /**
   * Wat het jaar per maand kost. De winkel rekent het uit zodra hij de prijs
   * geeft; buiten de winkel — op het web — valt het terug op ons eigen getal.
   */
  const perMaandJaar = billing.yearPerMonth ?? planOf('jaar').perMonth

  /**
   * De vergelijking naast het jaarplan: het volle bedrag en de korting.
   *
   * Komt de jaarprijs uit de winkel, dan moet de vergelijking daar ook
   * vandaan komen — anders staat er straks "$64.99" naast "in plaats van
   * € 98,87". Kan de winkel die som niet leveren, dan laten we hem weg.
   * Onze eigen europrijzen gebruiken we alleen als het hele scherm daarop
   * terugvalt.
   */
  const uitWinkel = billing.prices.jaar != null
  const vergelijking = uitWinkel
    ? billing.vergelijking
    : { totaal: YEAR_FULL_PRICE, korting: YEAR_SAVING }
  const price = priceOf(plan)
  const jaar = plan === 'jaar'
  /**
   * Of we het gezin mogen beloven. Apple deelt een abonnement met de
   * gezinsgroep, Google Play niet — en dit staat op het scherm waar iemand
   * besluit te betalen, dus het moet kloppen op het toestel in zijn hand.
   */
  const gezin = gezinsdeling()
  /**
   * Hoe de winkel heet waar deze app vandaan komt.
   *
   * Apple wees de App Store-beschrijving af op 2.3.10 omdat er Google Play in
   * stond. Dezelfde zin stond hieronder, in de voorwaarden die vóór de aankoop
   * zichtbaar moeten zijn — en dat is het scherm dat een beoordelaar het beste
   * bekijkt. Op het web staan ze allebei; daar verkoopt de app niets en weet je
   * niet waar de lezer straks koopt.
   */
  const winkel = t.unlock.winkelnaam[winkelVan()]

  useEffect(() => {
    if (subscribed) setPoort(null)
  }, [subscribed])

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <SectionTitle sub={t.unlock.sub(TRIAL_DAYS, price, gezin, jaar)}>{t.unlock.titel}</SectionTitle>

      {subscribed ? (
        <>
          <Card className="p-6 text-center">
            <Mascot mood="juich" size={100} className="mx-auto" />
            <p className="mt-3 font-display text-xl font-extrabold">{t.unlock.alOpen}</p>
            <Link to="/leren" className="mt-4 inline-block"><Button>{t.lesson.verderOpPad}</Button></Link>
          </Card>
          {billing.available && (
            <Card className="mt-4 flex flex-wrap items-center gap-3 p-5">
              <p className="min-w-0 grow basis-64 text-sm text-[var(--ink-soft)]">{t.unlock.beheerHint(winkel)}</p>
              {/* Opzeggen gebeurt in de winkel-app, dus dit is de app uit. */}
              <Button
                variant="secondary"
                onClick={() => vraagPoort({ reden: 'uit', doe: manageSubscription })}
              >
                {t.unlock.beheer}
              </Button>
            </Card>
          )}
        </>
      ) : (
        <>
          {/* What happens and when, in three lines, before anything is asked. */}
          <Card className="mb-4 p-5">
            <ol className="space-y-3">
              {t.unlock.tijdlijn(TRIAL_DAYS, price, jaar).map(([emoji, titel, body]) => (
                <li key={titel} className="flex gap-3">
                  <span className="text-xl" aria-hidden="true">{emoji}</span>
                  <div className="min-w-0">
                    <p className="font-display font-extrabold">{titel}</p>
                    <p className="text-sm text-[var(--ink-soft)]">{body}</p>
                  </div>
                </li>
              ))}
            </ol>
          </Card>

          <Card className="p-6">
            <p className="text-[var(--ink-soft)]">{t.unlock.intro(FREE_LESSONS)}</p>
            <ul className="mt-4 space-y-2">
              {t.unlock.krijgt(gezin).map((line) => (
                <li key={line} className="flex gap-2 text-sm">
                  <span aria-hidden="true">✅</span>
                  <span>{line}</span>
                </li>
              ))}
            </ul>

            {/* Two plans, and the one that is cheaper per month is the one
                the eye lands on. */}
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {PLANS.map((option) => {
                const picked = plan === option.id
                return (
                  <button
                    key={option.id}
                    onClick={() => { sfx.pick(); setPlan(option.id) }}
                    aria-pressed={picked}
                    className={`btn3d relative rounded-2xl border-2 p-4 text-start transition ${
                      picked ? 'border-zellige-500 bg-zellige-500/10' : 'border-[var(--line)] bg-[var(--surface-raised)]'
                    }`}
                  >
                    {option.best && vergelijking && (
                      <span className="absolute -top-3 end-3 rounded-full bg-saffron-500 px-2.5 py-1 text-[11px] font-extrabold text-night-950">
                        {t.unlock.voordeligst(vergelijking.korting)}
                      </span>
                    )}
                    {/* Het bedrag dat wordt afgeschreven is het grootste op de
                        kaart, en de omrekening naar een maand staat eronder —
                        kleiner, en met "dat is" ervoor zodat je ziet dat het een
                        rekensom is en geen tweede prijs.

                        Andersom stond het hier eerst: het jaarplan leidde met
                        € 5,00 per maand, want zo vergelijkt een koper het met
                        het maandplan ernaast. Apple wees versie 1.0 (build 5)
                        daarop af, richtlijn 3.1.2(c):

                          "The auto-renewable subscription displays the monthly
                           calculated pricing for the subscription more clearly
                           and conspicuously than the billed amount."

                        Wat zij eisen is niet dat het jaarbedrag er staat — dat
                        stond er — maar dat het het duidelijkste element is, in
                        positie én grootte. Elke andere prijs, ook een gratis
                        proef of een omrekening, hoort daaronder. */}
                    <div className="font-display text-lg font-extrabold">{t.unlock.plan[option.id]}</div>
                    <div className="mt-1 font-display text-2xl font-extrabold">
                      {priceOf(option.id)}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--ink-soft)]">
                      {option.id === 'jaar' ? t.unlock.jaarVooruit : t.unlock.perMaandLos}
                    </div>
                    {option.id === 'jaar' && (
                      <div className="mt-0.5 text-xs text-[var(--ink-soft)]">
                        {t.unlock.perMaandBerekend(perMaandJaar)}
                      </div>
                    )}
                    {/* Het bedrag waar de koper mee vergelijkt: twaalf maanden
                        plus het e-boek, doorgestreept naast wat hij betaalt. */}
                    {option.id === 'jaar' && vergelijking && (
                      <div className="mt-0.5 text-xs text-[var(--ink-soft)]">
                        {t.unlock.jaarInPlaatsVan}{' '}
                        <s>{vergelijking.totaal}</s>
                      </div>
                    )}
                    {option.id === 'jaar' && (
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full bg-zellige-500/15 px-2 py-0.5 text-[11px] font-extrabold text-zellige-700 dark:text-zellige-200">
                        📖 {t.unlock.boek.inclusief}
                      </div>
                    )}
                  </button>
                )
              })}
            </div>

            <div className="mt-6">
              {billing.available ? (
                <Button className="w-full py-4 text-lg" disabled={billing.busy} onClick={() => vraagPoort({ reden: 'abonnement', doe: () => void subscribe(plan) })}>
                  {billing.busy ? t.unlock.bezig : t.unlock.koop(TRIAL_DAYS)}
                </Button>
              ) : (
                <p className="rounded-2xl bg-saffron-500/10 px-4 py-3 text-sm">
                  {platform() === 'web' ? t.unlock.alleenInApp(price, jaar, winkel) : t.unlock.winkelWeg}
                </p>
              )}
              {/* Both stores require the terms to be visible before buying. */}
              {/* De belastingzin hoort bij de prijs die de winkel gaf, niet bij
                  het land waar de app in staat. In de Europese Unie zit de btw
                  in het bedrag; in de Verenigde Staten komt hij er bij het
                  afrekenen bij. Beweren dat het inclusief is naast een prijs
                  uit een winkel die het exclusief rekent, is een onjuiste
                  mededeling op het scherm waar iemand besluit te betalen. */}
              <p className="mt-3 text-xs leading-relaxed text-[var(--ink-soft)]">
                {jaar
                  ? t.unlock.voorwaardenJaar(TRIAL_DAYS, price, winkel)
                  : t.unlock.voorwaarden(TRIAL_DAYS, price, winkel)}{' '}
                {t.unlock.btwRegel(btwInbegrepen(billing.currency))}
              </p>
              {billing.error && (
                <p className="mt-3 text-center text-sm text-terra-500">{t.unlock.mislukt(billing.error)}</p>
              )}
            </div>
          </Card>

          {billing.available && (
            <Card className="mt-4 flex flex-wrap items-center gap-3 p-5">
              {/* Een basisbreedte, geen `flex-1`. Met `flex-1` is de basis nul:
                  dan breekt de rij nooit af, want voor iets van nul is altijd
                  plek. De tekst werd zo tot een kolom van twee woorden geperst
                  naast een knop die niet krimpt. */}
              <p className="min-w-0 grow basis-64 text-sm text-[var(--ink-soft)]">{t.unlock.herstelHint}</p>
              <Button variant="secondary" disabled={billing.busy} onClick={() => void restorePurchases()}>
                {t.unlock.herstel}
              </Button>
            </Card>
          )}
        </>
      )}

      {/* The book stands on its own: a subscriber can still want it, and
          somebody who has it should always be able to open it again.
          `data-boekkaart` is waar `npm run reviewshot` naartoe scrolt: een
          opname van het boek moet het boek in beeld hebben, en een vast
          aantal pixels verschuift zodra de tekst erboven verandert. */}
      <Card className="mt-4 p-6" data-boekkaart>
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="font-display text-xl font-extrabold">📖 {t.unlock.boek.titel}</h2>
          {!boek && !boekWacht && (
            <span className="font-display text-lg font-extrabold text-zellige-600 dark:text-zellige-300">
              {billing.prices.ebook ?? EBOOK.list}
            </span>
          )}
        </div>
        <p className="mt-2 text-sm text-[var(--ink-soft)]">{t.unlock.boek.sub}</p>
        <ul className="mt-3 space-y-1.5">
          {t.unlock.boek.bevat.map((line) => (
            <li key={line} className="flex gap-2 text-sm">
              <span aria-hidden="true">•</span>
              <span>{line}</span>
            </li>
          ))}
        </ul>

        {/*
          Drie standen in plaats van twee. De middelste is nieuw: er is recht
          op het boek, maar de proefperiode loopt nog. Geen knop dus, en wel
          de datum — anders lijkt het stuk.
        */}
        {boekWacht ? (
          <p className="mt-5 rounded-2xl bg-saffron-500/10 px-4 py-3 text-sm">
            {t.unlock.boek.wacht(new Intl.DateTimeFormat(localeOf(lang), { day: 'numeric', month: 'long' }).format(boekWacht))}
          </p>
        ) : boek ? (
          <>
            {/*
              Naar `/boek`, niet naar het toestel. `window.open(…, '_blank')`
              gaf de link door aan de telefoon, en die kan een bestand uit de
              app-bundel niet bereiken: op een iPhone opende Safari daarop het
              tabblad dat er toevallig al stond. Zie `pages/Boek.tsx`.

              En daarmee vervalt ook de ouderpoort hier: die zit op uitgaan uit
              de app, en er gaat nu niets meer uit.
            */}
            <Link to="/boek" className="mt-5 inline-block" onClick={() => sfx.tap()}>
              <Button>{t.unlock.boek.open}</Button>
            </Link>
            <p className="mt-3 text-xs text-[var(--ink-soft)]">{t.unlock.boek.vanJou}</p>
          </>
        ) : billing.available ? (
          <>
            <Button
              variant="secondary"
              className="mt-5 w-full py-3"
              disabled={billing.busy}
              onClick={() => { sfx.tap(); vraagPoort({ reden: 'abonnement', doe: () => void buyEbook() }) }}
            >
              {billing.busy ? t.unlock.bezig : t.unlock.boek.koop(billing.prices.ebook ?? EBOOK.list)}
            </Button>
            <p className="mt-3 text-xs text-[var(--ink-soft)]">{t.unlock.boek.bijJaar}</p>
          </>
        ) : (
          <p className="mt-5 rounded-2xl bg-saffron-500/10 px-4 py-3 text-sm">
            {platform() === 'web' ? t.unlock.boek.alleenInApp(EBOOK.list, winkel) : t.unlock.winkelWeg}
          </p>
        )}
      </Card>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/leren"><Button variant="ghost">{t.lesson.terugNaarPad}</Button></Link>
        {/* Both stores require these two to be reachable before a purchase. */}
        <Link to="/voorwaarden"><Button variant="ghost">{t.nav.voorwaarden}</Button></Link>
        <Link to="/privacy"><Button variant="ghost">{t.nav.privacy}</Button></Link>
      </div>

      <OuderPoort
        open={poort !== null}
        reden={poort?.reden ?? 'abonnement'}
        onClose={() => setPoort(null)}
        onGoed={() => { const doe = poort?.doe; setPoort(null); doe?.() }}
      />
    </div>
  )
}
