import { Linking, Platform } from 'react-native';
import { activeer, startProef, zegOp, type Abonnement } from '../core/abonnement/toegang';
import { vindPlan, type PlanId } from '../core/abonnement/plannen';

export interface Aankoopresultaat {
  abonnement: Abonnement;
  /** Wat er aan de ouder getoond wordt na afloop. */
  melding: string;
}

export interface AankoopPoort {
  /** Of er echt geld mee gemoeid is. In deze versie staat dit op false. */
  echt: boolean;
  koop(abo: Abonnement, plan: PlanId, metProef: boolean): Promise<Aankoopresultaat>;
  herstel(abo: Abonnement): Promise<Aankoopresultaat>;
  opzeggen(abo: Abonnement): Promise<Aankoopresultaat>;
}

/**
 * Waar een klant zijn abonnement beheert.
 *
 * Bij een winkelabonnement kún je niet in de app opzeggen: Apple en Google
 * doen dat zelf, en dat is precies de bedoeling. Het scheelt de uitgever alle
 * opzeggingen, incasso's, herinneringen en terugbetalingen met de hand.
 */
export const BEHEER_URL = Platform.select({
  ios: 'https://apps.apple.com/account/subscriptions',
  android: 'https://play.google.com/store/account/subscriptions?package=nl.slimvos.app',
  default: 'https://support.apple.com/nl-nl/HT202039',
}) as string;

export async function openBeheer(): Promise<boolean> {
  try {
    await Linking.openURL(BEHEER_URL);
    return true;
  } catch {
    return false;
  }
}

/**
 * Aankopen zonder winkel.
 *
 * Er wordt hier niets afgeschreven; het abonnement wordt alleen in de app
 * gezet zodat je de hele stroom kunt doorlopen. Voor de winkelversie komt hier
 * RevenueCat of `expo-in-app-purchases` achter, met de product-ids uit
 * `src/core/abonnement/plannen.ts`. De schermen veranderen niet mee.
 *
 * Zie BETALINGEN.md voor wat de stores voor je regelen en wat je zelf moet
 * instellen voordat er geld op je zakelijke rekening komt.
 */
export const demoAankoop: AankoopPoort = {
  echt: false,

  async koop(abo, plan, metProef) {
    const gekozen = vindPlan(plan);
    if (metProef && !abo.proefGebruikt && gekozen.proefDagen > 0) {
      return {
        abonnement: startProef(abo, plan),
        melding:
          `Je week gratis is gestart. Er is niets afgeschreven. ` +
          `Na ${gekozen.proefDagen} dagen gaat ${gekozen.naam.toLowerCase()} vanzelf in, tenzij je opzegt.`,
      };
    }
    return {
      abonnement: activeer(abo, plan),
      melding: `${gekozen.naam} staat aan. In deze versie is er niets afgeschreven.`,
    };
  },

  async herstel(abo) {
    return { abonnement: abo, melding: 'Er zijn geen eerdere aankopen gevonden op dit toestel.' };
  },

  async opzeggen(abo) {
    return {
      abonnement: zegOp(abo),
      melding: 'Je abonnement stopt aan het einde van de lopende periode. Tot die tijd verandert er niets.',
    };
  },
};
