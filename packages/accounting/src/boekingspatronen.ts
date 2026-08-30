import { Money, type Rate, type ValutaCode } from '@gedmma/money';
import { bouwPost, credit, debet, type ConceptRegel, type GeldigePost } from './journaalpost.ts';
import { BoekhoudFout } from './fouten.ts';
import type { BtwCode } from './btw.ts';
import type { BerekendeRegel } from './btw.ts';
import type { Systeemrol } from './rekeningschema.ts';

/**
 * De rekeningen die de patronen nodig hebben. De implementatie zit in
 * `apps/api`; hier alleen de vorm, zodat de patronen puur blijven en dus
 * zonder database te testen zijn.
 */
export type Rekeningregister = {
  /** Zoekt de rekening bij een systeemrol; gooit als hij ontbreekt. */
  vindRol(rol: Systeemrol): { id: string; code: string };
};

/** Kiest de af-te-dragen-btw-rekening die bij een btw-code hoort. */
function btwRekeningVoorVerkoop(register: Rekeningregister, code: BtwCode): string {
  if (code.btwRekeningId) return code.btwRekeningId;
  const tarief = code.tarief.toString();
  if (tarief.startsWith('0.21')) return register.vindRol('btw_af_te_dragen_hoog').id;
  if (tarief.startsWith('0.09')) return register.vindRol('btw_af_te_dragen_laag').id;
  return register.vindRol('btw_af_te_dragen_overig').id;
}

export type VerkoopfactuurBoeking = {
  dagboekCode: string;
  boekdatum: string;
  omschrijving: string;
  valuta: ValutaCode;
  relatieId: string;
  /** Doorgerekende regels uit `berekenFactuur`. */
  regels: readonly BerekendeRegel[];
  totaalInclusief: Money;
  factuurId: string;
  /** Is dit een creditnota? Dan draaien alle kanten om. */
  creditnota?: boolean;
};

/**
 * Verkoopfactuur boeken:
 *   debiteuren   debet   totaal inclusief
 *   omzet        credit  per regel exclusief
 *   af te dragen btw credit per btw-code
 *
 * Bij een creditnota staan alle bedragen aan de andere kant.
 */
export function boekVerkoopfactuur(
  invoer: VerkoopfactuurBoeking,
  register: Rekeningregister,
): GeldigePost {
  const omkeren = invoer.creditnota === true;
  const regels: ConceptRegel[] = [];

  const debiteuren = register.vindRol('debiteuren');
  regels.push(
    (omkeren ? credit : debet)(debiteuren.id, invoer.totaalInclusief, {
      rekeningCode: debiteuren.code,
      relatieId: invoer.relatieId,
      omschrijving: invoer.omschrijving,
    }),
  );

  const btwPerRekening = new Map<string, { bedrag: Money; grondslag: Money; btwCodeId: string }>();

  for (const regel of invoer.regels) {
    if (!regel.exclusief.isNul()) {
      regels.push(
        (omkeren ? debet : credit)(regel.rekeningId, regel.exclusief, {
          omschrijving: regel.omschrijving,
          btwCodeId: regel.btwCode.id,
          btwGrondslag: regel.exclusief,
          relatieId: invoer.relatieId,
        }),
      );
    }
    if (!regel.btw.isNul()) {
      const rekeningId = btwRekeningVoorVerkoop(register, regel.btwCode);
      const bestaand = btwPerRekening.get(rekeningId);
      if (bestaand) {
        bestaand.bedrag = bestaand.bedrag.plus(regel.btw);
        bestaand.grondslag = bestaand.grondslag.plus(regel.exclusief);
      } else {
        btwPerRekening.set(rekeningId, {
          bedrag: regel.btw,
          grondslag: regel.exclusief,
          btwCodeId: regel.btwCode.id,
        });
      }
    }
  }

  for (const [rekeningId, btw] of btwPerRekening) {
    regels.push(
      (omkeren ? debet : credit)(rekeningId, btw.bedrag, {
        omschrijving: 'Btw',
        btwCodeId: btw.btwCodeId,
        btwGrondslag: btw.grondslag,
      }),
    );
  }

  return bouwPost({
    dagboekCode: invoer.dagboekCode,
    boekdatum: invoer.boekdatum,
    omschrijving: invoer.omschrijving,
    valuta: invoer.valuta,
    bronSoort: 'sales_invoice',
    bronId: invoer.factuurId,
    regels,
  });
}

export type InkoopfactuurBoeking = {
  dagboekCode: string;
  boekdatum: string;
  omschrijving: string;
  valuta: ValutaCode;
  relatieId: string;
  regels: readonly BerekendeRegel[];
  totaalInclusief: Money;
  factuurId: string;
  creditnota?: boolean;
};

/**
 * Inkoopfactuur boeken:
 *   kosten            debet   per regel exclusief
 *   te vorderen btw   debet   per btw-code
 *   crediteuren       credit  totaal inclusief
 *
 * Bij verlegde btw wordt de btw zowel gevorderd als afgedragen; het netto
 * effect is nul, maar beide vakken van de aangifte worden gevuld.
 */
export function boekInkoopfactuur(
  invoer: InkoopfactuurBoeking,
  register: Rekeningregister,
): GeldigePost {
  const omkeren = invoer.creditnota === true;
  const regels: ConceptRegel[] = [];
  const teVorderen = register.vindRol('btw_te_vorderen');
  const verlegdAfTeDragen = register.vindRol('btw_verlegd_af_te_dragen');

  let voorbelasting = Money.nul(invoer.valuta);
  let voorbelastingGrondslag = Money.nul(invoer.valuta);
  let voorbelastingCode: string | null = null;
  let verlegd = Money.nul(invoer.valuta);
  let verlegdGrondslag = Money.nul(invoer.valuta);
  let verlegdCode: string | null = null;

  for (const regel of invoer.regels) {
    if (!regel.exclusief.isNul()) {
      regels.push(
        (omkeren ? credit : debet)(regel.rekeningId, regel.exclusief, {
          omschrijving: regel.omschrijving,
          btwCodeId: regel.btwCode.id,
          btwGrondslag: regel.exclusief,
          relatieId: invoer.relatieId,
        }),
      );
    }

    if (regel.btwCode.verlegd) {
      // Verlegde btw: de leverancier brengt niets in rekening, maar jij draagt
      // het tarief af en trekt hetzelfde bedrag als voorbelasting weer af.
      const bedrag = regel.btwCode.tarief.toepassenOp(regel.exclusief);
      if (!bedrag.isNul()) {
        verlegd = verlegd.plus(bedrag);
        verlegdGrondslag = verlegdGrondslag.plus(regel.exclusief);
        verlegdCode = regel.btwCode.id;
        voorbelasting = voorbelasting.plus(bedrag);
        voorbelastingGrondslag = voorbelastingGrondslag.plus(regel.exclusief);
        voorbelastingCode ??= regel.btwCode.id;
      }
    } else if (!regel.btw.isNul()) {
      voorbelasting = voorbelasting.plus(regel.btw);
      voorbelastingGrondslag = voorbelastingGrondslag.plus(regel.exclusief);
      voorbelastingCode ??= regel.btwCode.id;
    }
  }

  if (!voorbelasting.isNul()) {
    regels.push(
      (omkeren ? credit : debet)(teVorderen.id, voorbelasting, {
        rekeningCode: teVorderen.code,
        omschrijving: 'Voorbelasting',
        btwCodeId: voorbelastingCode,
        btwGrondslag: voorbelastingGrondslag,
      }),
    );
  }
  if (!verlegd.isNul()) {
    regels.push(
      (omkeren ? debet : credit)(verlegdAfTeDragen.id, verlegd, {
        rekeningCode: verlegdAfTeDragen.code,
        omschrijving: 'Btw verlegd, af te dragen',
        btwCodeId: verlegdCode,
        btwGrondslag: verlegdGrondslag,
      }),
    );
  }

  const crediteuren = register.vindRol('crediteuren');
  regels.push(
    (omkeren ? debet : credit)(crediteuren.id, invoer.totaalInclusief, {
      rekeningCode: crediteuren.code,
      relatieId: invoer.relatieId,
      omschrijving: invoer.omschrijving,
    }),
  );

  return bouwPost({
    dagboekCode: invoer.dagboekCode,
    boekdatum: invoer.boekdatum,
    omschrijving: invoer.omschrijving,
    valuta: invoer.valuta,
    bronSoort: 'purchase_invoice',
    bronId: invoer.factuurId,
    regels,
  });
}

/** Eén toewijzing van een banktransactie aan een openstaande post. */
export type Aflettering = {
  /** `debiteuren` bij een ontvangst, `crediteuren` bij een betaling. */
  rol: Extract<Systeemrol, 'debiteuren' | 'crediteuren'>;
  bedrag: Money;
  relatieId: string;
  omschrijving: string;
};

/** Een deel van een banktransactie dat rechtstreeks op een grootboekrekening gaat. */
export type DirecteBoeking = {
  rekeningId: string;
  bedrag: Money;
  omschrijving: string;
  btwCode?: BtwCode | null;
};

export type BanktransactieBoeking = {
  dagboekCode: string;
  boekdatum: string;
  omschrijving: string;
  valuta: ValutaCode;
  bankRekeningId: string;
  /** Positief bij ontvangst, negatief bij betaling. */
  bedrag: Money;
  transactieId: string;
  afletteringen?: readonly Aflettering[];
  directeBoekingen?: readonly DirecteBoeking[];
  /** Tolerantie waarbinnen een klein verschil op betalingsverschillen mag. */
  verschilTolerantie?: Money;
};

/**
 * Boekt een banktransactie. De bank staat altijd aan één kant voor het volledige
 * bedrag; de andere kant bestaat uit afletteringen van openstaande posten en/of
 * rechtstreekse boekingen. Een klein restant binnen de tolerantie gaat naar
 * betalingsverschillen — nooit stilzwijgend, altijd als eigen regel.
 */
export function boekBanktransactie(
  invoer: BanktransactieBoeking,
  register: Rekeningregister,
): GeldigePost {
  const valuta = invoer.valuta;
  const nul = Money.nul(valuta);
  const ontvangst = invoer.bedrag.isPositief();
  const bedragAbs = invoer.bedrag.absoluut();
  const regels: ConceptRegel[] = [];

  regels.push(
    (ontvangst ? debet : credit)(invoer.bankRekeningId, bedragAbs, {
      omschrijving: invoer.omschrijving,
    }),
  );

  let tegenkant = nul;

  for (const aflettering of invoer.afletteringen ?? []) {
    const rekening = register.vindRol(aflettering.rol);
    // Een ontvangst haalt de debiteur van de balans (credit), een betaling
    // haalt de crediteur van de balans (debet).
    regels.push(
      (ontvangst ? credit : debet)(rekening.id, aflettering.bedrag, {
        rekeningCode: rekening.code,
        relatieId: aflettering.relatieId,
        omschrijving: aflettering.omschrijving,
      }),
    );
    tegenkant = tegenkant.plus(aflettering.bedrag);
  }

  for (const direct of invoer.directeBoekingen ?? []) {
    const btw = direct.btwCode && !direct.btwCode.verlegd
      ? direct.btwCode.tarief.toepassenOp(
          direct.btwCode.tarief.exclusiefUitInclusief(direct.bedrag),
        )
      : nul;
    const exclusief = direct.bedrag.min(btw);

    regels.push(
      (ontvangst ? credit : debet)(direct.rekeningId, exclusief, {
        omschrijving: direct.omschrijving,
        btwCodeId: direct.btwCode?.id ?? null,
        btwGrondslag: direct.btwCode ? exclusief : null,
      }),
    );
    if (!btw.isNul() && direct.btwCode) {
      const btwRekening = ontvangst
        ? btwRekeningVoorVerkoop(register, direct.btwCode)
        : register.vindRol('btw_te_vorderen').id;
      regels.push(
        (ontvangst ? credit : debet)(btwRekening, btw, {
          omschrijving: 'Btw',
          btwCodeId: direct.btwCode.id,
          btwGrondslag: exclusief,
        }),
      );
    }
    tegenkant = tegenkant.plus(direct.bedrag);
  }

  const verschil = bedragAbs.min(tegenkant);
  if (!verschil.isNul()) {
    const tolerantie = invoer.verschilTolerantie ?? Money.vanTekst('0.02', valuta);
    if (verschil.absoluut().groterDan(tolerantie)) {
      throw new BoekhoudFout(
        'entry_not_balanced',
        `Het bedrag van de banktransactie (${bedragAbs}) komt niet overeen met wat eraan is gekoppeld (${tegenkant}).`,
        `Er blijft ${verschil.absoluut()} over. Koppel het restant aan een factuur of boek het op een grootboekrekening.`,
        { verschil: verschil.toString(), tolerantie: tolerantie.toString() },
      );
    }
    const verschilRekening = register.vindRol('betalingsverschillen');
    const positiefVerschil = verschil.isPositief();
    regels.push(
      (ontvangst === positiefVerschil ? credit : debet)(verschilRekening.id, verschil.absoluut(), {
        rekeningCode: verschilRekening.code,
        omschrijving: 'Betalingsverschil',
      }),
    );
  }

  return bouwPost({
    dagboekCode: invoer.dagboekCode,
    boekdatum: invoer.boekdatum,
    omschrijving: invoer.omschrijving,
    valuta,
    bronSoort: 'bank_transaction',
    bronId: invoer.transactieId,
    regels,
  });
}

/**
 * Boekt het koersverschil dat ontstaat als een factuur in vreemde valuta tegen
 * een andere koers wordt betaald dan waartegen hij is geboekt.
 */
export function boekKoersverschil(invoer: {
  dagboekCode: string;
  boekdatum: string;
  omschrijving: string;
  valuta: ValutaCode;
  /** Positief: koerswinst. Negatief: koersverlies. */
  verschil: Money;
  tegenrekeningRol: Extract<Systeemrol, 'debiteuren' | 'crediteuren'>;
  relatieId: string;
  bronId: string;
}, register: Rekeningregister): GeldigePost {
  const koersrekening = register.vindRol('koersverschillen');
  const tegenrekening = register.vindRol(invoer.tegenrekeningRol);
  const winst = invoer.verschil.isPositief();
  const bedrag = invoer.verschil.absoluut();

  return bouwPost({
    dagboekCode: invoer.dagboekCode,
    boekdatum: invoer.boekdatum,
    omschrijving: invoer.omschrijving,
    valuta: invoer.valuta,
    bronSoort: 'manual',
    bronId: invoer.bronId,
    regels: [
      (winst ? debet : credit)(tegenrekening.id, bedrag, {
        rekeningCode: tegenrekening.code,
        relatieId: invoer.relatieId,
        omschrijving: invoer.omschrijving,
      }),
      (winst ? credit : debet)(koersrekening.id, bedrag, {
        rekeningCode: koersrekening.code,
        omschrijving: 'Koersverschil',
      }),
    ],
  });
}

/** Rekent een bedrag in vreemde valuta om naar de administratievaluta. */
export function naarAdministratievaluta(
  bedrag: Money,
  koers: Rate,
  administratievaluta: ValutaCode,
): Money {
  if (bedrag.valuta === administratievaluta) return bedrag;
  return koers.reken(bedrag, administratievaluta);
}
