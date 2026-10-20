import { useNavigate } from 'react-router-dom'
import { useT } from '../i18n'
import { sfx } from '../engine/audio'
import { billingAvailable, FREE_LESSONS, planOf, TRIAL_DAYS, useBilling } from '../engine/billing'
import { setState, useStore } from '../engine/store'
import { Button, Sheet } from './kit'
import { Mascot } from './Mascot'

/**
 * Eén keer na de taalkeuze: wil je meteen de volledige versie?
 *
 * Het pad heeft al een plek waar het abonnement ter sprake komt — les vijf,
 * waar de gratis lessen ophouden. Dat is de goede plek voor wie de app aan
 * het uitproberen is, en de verkeerde voor wie al overtuigd binnenkomt. Dat
 * tweede is hier geen bedenksel: wie de app krijgt van iemand die hij kent,
 * heeft het verhaal al gehoord voordat hij hem opende. Die moest eerst vier
 * lessen doorlopen voordat hij kón betalen.
 *
 * Dus staat de vraag er één keer, en hij blokkeert niets. De tweede knop is
 * even zichtbaar als de eerste, en wie hem kiest krijgt hem nooit meer — zie
 * `aanbodGezien` in `engine/store.ts`.
 *
 * Kopen gebeurt hier niet: de knop gaat naar `/volledig`. Daar staan de
 * ouderpoort, de verplichte voorwaardentekst, de prijs uit de winkel zelf en
 * de knoppen om een aankoop terug te zetten of op te zeggen. Dat alles hier
 * nog eens bouwen zou het twee keer onderhouden zijn, en bij een kinderapp is
 * de ouderpoort nu juist het stuk dat niet mag ontbreken.
 */
export function Aanbod() {
  const t = useT()
  const picked = useStore((s) => s.langPicked)
  const gezien = useStore((s) => s.aanbodGezien)
  const unlocked = useStore((s) => s.unlocked)
  const nav = useNavigate()
  const billing = useBilling()

  /*
   * De prijs van de winkel, en pas als die er niet is het vaste getal.
   *
   * Hier stond `planOf('jaar').perMonth` -- "€ 5,00" -- en dat is met zoveel
   * woorden de terugval voor de wébsite. In de app hoort hij nergens te staan:
   * wie dit scherm in Marokko of in de Verenigde Staten opent, las een bedrag
   * in euro's terwijl de winkel straks dirham of dollar afschrijft. Dit is het
   * eerste bedrag dat een ouder van deze app te zien krijgt.
   */
  const perMaand = billing.yearPerMonth ?? planOf('jaar').perMonth

  /*
   * En of er voor déze koper nog een proefperiode is. Zelfde reden als op het
   * abonnementsscherm: onbekend telt als nee, want beloven wat je niet weet is
   * hetzelfde probleem. Zie `heeftProef` in engine/billing.ts.
   */
  const magProef = billing.proef.jaar === true

  /*
   * Niet op de website. Daar is niets te koop — `billingAvailable()` is dan
   * onwaar — en een knop naar een abonnement dat je er niet kunt afsluiten is
   * erger dan geen knop.
   */
  if (!picked || gezien || unlocked || !billingAvailable()) return null

  /*
   * `onTerug` en niet `onClose` op het paneel hieronder: de terugknop van
   * Android en Escape doen hetzelfde als de knop "later", maar een tik náást
   * het paneel niet.
   *
   * Gemeten zonder dat: met dit scherm open stond er geen luisteraar op de
   * terugknop, dus Android deed zijn standaardding -- en op een verse
   * installatie is er geen bladzijde om naar terug te gaan, dus dat is de app
   * verlaten. Bij het tweede scherm dat een nieuwe gebruiker ooit ziet.
   *
   * De tik ernaast blijft met opzet buiten schot: dit scherm komt één keer
   * voorbij, en een kinderduim die ernaast landt zou het voorgoed wegnemen.
   */
  const sluit = () => setState({ aanbodGezien: true })

  return (
    <Sheet open onTerug={sluit} labelledBy="aanbod-title">
      <div className="text-center">
        <Mascot mood="juich" size={78} className="mx-auto" />
        <h2 id="aanbod-title" className="mt-2 font-display text-2xl font-extrabold">{t.aanbod.titel}</h2>
        <p className="mt-2 text-[var(--ink-soft)]">
          {magProef ? t.aanbod.body(TRIAL_DAYS, perMaand) : t.aanbod.bodyDirect(perMaand)}
        </p>

        <Button className="mt-5 w-full" onClick={() => { sfx.nav(); sluit(); nav('/volledig') }}>
          {t.aanbod.knop}
        </Button>

        {/*
          Geen klein grijs linkje onderaan. Een keuze die je wegmoffelt is geen
          keuze, en Apple leest een weggewerkte afsluitknop bij een abonnement
          als een donkere knop — richtlijn 3.1.2. Dus een echte knop, even
          groot, alleen rustiger van kleur.
        */}
        <button
          onClick={() => { sfx.nav(); sluit() }}
          className="mt-2 w-full rounded-2xl border-2 border-[var(--line)] px-4 py-3 font-display font-extrabold text-[var(--ink)]"
        >
          {t.aanbod.later(FREE_LESSONS)}
        </button>
      </div>
    </Sheet>
  )
}
