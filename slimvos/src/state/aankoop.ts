import { activeer, startProef, zegOp, type Abonnement } from '../core/abonnement/toegang';
import { vindPlan, type PlanId } from '../core/abonnement/plannen';

export interface Aankoopresultaat {
  abonnement: Abonnement;
  /** Wat er aan de ouder getoond wordt na afloop. */
  melding: string;
}

export interface AankoopPoort {
  /** Of er echt geld mee gemoeid is. In de demo staat dit op false. */
  echt: boolean;
  koop(abo: Abonnement, plan: PlanId, metProef: boolean): Promise<Aankoopresultaat>;
  herstel(abo: Abonnement): Promise<Aankoopresultaat>;
  opzeggen(abo: Abonnement): Promise<Aankoopresultaat>;
}

/**
 * Aankopen zonder winkel.
 *
 * Er wordt hier niets afgeschreven; het abonnement wordt alleen in de app
 * gezet zodat je de hele stroom kunt doorlopen. Voor de winkelversie komt hier
 * RevenueCat of `expo-in-app-purchases` achter, met de product-ids die in
 * `src/core/abonnement/plannen.ts` staan. De schermen veranderen niet mee.
 */
export const demoAankoop: AankoopPoort = {
  echt: false,

  async koop(abo, plan, metProef) {
    const gekozen = vindPlan(plan);
    if (metProef && !abo.proefGebruikt) {
      return {
        abonnement: startProef(abo, plan),
        melding: `Je proefperiode van ${gekozen.proefDagen} dagen is gestart. Er is nog niets betaald.`,
      };
    }
    return {
      abonnement: activeer(abo, plan),
      melding: `${gekozen.naam} staat aan. In deze demo is er niets afgeschreven.`,
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
