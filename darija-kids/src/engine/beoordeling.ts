/**
 * De vraag om een beoordeling, en waarom hij zo laat en zo zelden komt.
 *
 * Sterren bepalen een groot deel van wie een app installeert, en op dag één
 * zijn het er nul. Dat verandert niet vanzelf: vrijwel niemand beoordeelt een
 * app uit zichzelf, dus wie het niet vraagt houdt nul. `docs/LANCERING.md`
 * §12 zet deze vraag daarom in de lijst van wat er in de app moet.
 *
 * Maar het is ook het makkelijkst te verpesten onderdeel van die lijst. Drie
 * keuzes, en ze staan hier alle drie vast:
 *
 * **Na drie diploma's, niet eerder.** Een beoordeling vragen aan iemand die
 * de app tien minuten heeft, vraagt om een oordeel dat er nog niet is. Drie
 * afgeronde units is het moment waarop een ouder iets te zéggen heeft -- en
 * het is ook de eerste keer dat hij heeft gezien dat zijn kind iets onthoudt.
 *
 * **Eén keer.** Een app die blijft vragen krijgt de beoordeling die daarbij
 * hoort. `beoordelingGevraagd` onthoudt dat de vraag gesteld is, los van wat
 * het antwoord was -- want of iemand werkelijk iets schrijft weten we niet en
 * kunnen we niet weten, en dat is maar goed ook.
 *
 * **Op het ouderscherm, achter de poort.** Dit is een kinderapp in de
 * Kinderen-categorie, en richtlijn 1.3 van Apple zegt dat een kind zich niet
 * met één tik de app uit moet kunnen werken. Een beoordeling schrijven is de
 * app uit gaan. Bovendien is het de ouder die hem schrijft, dus staat de
 * vraag waar de ouder al is.
 *
 * Wat deze module níét doet is een eigen venster tonen met sterren erin. Dat
 * zou een beoordeling in de app suggereren die nergens terechtkomt. De knop
 * brengt je naar de winkel, en daar gebeurt het echte.
 */
import { getState, setState, type State } from './store'
import { aantalDiplomas } from './diploma'
import { platform } from './platform'

/**
 * Hoeveel diploma's er moeten liggen voordat de vraag verschijnt.
 *
 * Drie, en niet vier: bij vier ben je al voorbij de gratis lessen en zit de
 * ouder in een gesprek over geld. Die twee vragen moet je niet stapelen.
 */
export const DIPLOMAS_VOOR_VRAAG = 3

/**
 * De winkeladressen, en waarom ze hier staan in plaats van uit `site/links.ts`
 * te komen.
 *
 * De app leest nergens iets uit `src/site`: dat is de website, een aparte
 * bouw met een eigen leven. Een import daarvandaan zou de hele sitelaag in de
 * app-bundel trekken voor twee tekstregels.
 *
 * Twee plekken met hetzelfde adres is wel precies hoe adressen uit elkaar
 * gaan lopen, dus legt `beoordeling.test.ts` ze naast elkaar. Verandert er
 * één, dan valt die test om.
 */
export const APPLE_ID = '6813964474'
export const PAKKETNAAM = 'app.darijaforkids.learn'

/**
 * Waar de beoordeling geschreven wordt.
 *
 * Apple heeft er een adres voor dat de App Store meteen op het schrijfvenster
 * opent (`?action=write-review`). Google heeft zoiets niet: daar is de
 * winkelpagina zelf de plek waar de sterren staan, en dat is het eerlijkste
 * wat we kunnen openen. Doen alsof dat hetzelfde is, zou betekenen dat de
 * tekst op de knop op één van de twee niet klopt.
 */
export function beoordelingsAdres(waar = platform()): string {
  return waar === 'ios'
    ? `https://apps.apple.com/app/id${APPLE_ID}?action=write-review`
    : `https://play.google.com/store/apps/details?id=${PAKKETNAAM}`
}

/** Of de vraag nu op zijn plaats is. */
export const magOmBeoordelingVragen = (s: State = getState()): boolean =>
  platform() !== 'web' &&
  !s.beoordelingGevraagd &&
  aantalDiplomas(s) >= DIPLOMAS_VOOR_VRAAG

/**
 * De vraag is gesteld; hij komt niet terug.
 *
 * Apart van het openen, want hij hoort ook te gelden als iemand het venster
 * wegklikt zonder iets te schrijven. Wie nee zegt, heeft nee gezegd.
 */
export function onthoudGevraagd(nu = Date.now()): void {
  if (getState().beoordelingGevraagd) return
  setState({ beoordelingGevraagd: nu })
}

/** Naar de winkel, en onthouden dat het gevraagd is. */
export function openBeoordeling(): void {
  onthoudGevraagd()
  window.open(beoordelingsAdres(), '_blank')
}
