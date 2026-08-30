import type { RekeningSoort } from './journaalpost.ts';

/**
 * Systeemrollen: rekeningen die de software zelf moet kunnen vinden. De
 * gebruiker mag ze hernoemen of hernummeren, maar niet weghalen zolang de rol
 * in gebruik is.
 */
export type Systeemrol =
  | 'debiteuren'
  | 'crediteuren'
  | 'bank'
  | 'kas'
  | 'btw_af_te_dragen_hoog'
  | 'btw_af_te_dragen_laag'
  | 'btw_af_te_dragen_overig'
  | 'btw_verlegd_af_te_dragen'
  | 'btw_te_vorderen'
  | 'btw_afrekening'
  | 'betalingsverschillen'
  | 'koersverschillen'
  | 'onverdeeld_resultaat'
  | 'tussenrekening_bank'
  | 'nog_te_ontvangen_facturen'
  | 'prive_opnamen'
  | 'kapitaal';

export type RekeningSjabloon = {
  code: string;
  naam: string;
  soort: RekeningSoort;
  /** Rubriek voor de balans of de winst-en-verliesrekening. */
  rubriek: string;
  rol?: Systeemrol;
  /** Standaard btw-code (de `code`, niet het id) bij het boeken op deze rekening. */
  btwStandaard?: string;
  /** Referentie naar het Referentie Grootboekschema, waar bekend. */
  rgs?: string;
  /** Uitleg in gewone taal, getoond in de interface. */
  uitleg?: string;
};

export type SchemaSjabloon = {
  sleutel: 'zzp' | 'bv' | 'stichting' | 'vereniging';
  naam: string;
  omschrijving: string;
  rekeningen: RekeningSjabloon[];
};

/** Rekeningen die elke rechtsvorm nodig heeft. */
const GEMEENSCHAPPELIJK: RekeningSjabloon[] = [
  // --- Vaste activa ---
  { code: '0200', naam: 'Inventaris', soort: 'asset', rubriek: 'Vaste activa', rgs: 'BIvaBei', uitleg: 'Spullen die je langer dan een jaar gebruikt, zoals meubels en apparatuur.' },
  { code: '0210', naam: 'Afschrijving inventaris', soort: 'asset', rubriek: 'Vaste activa', uitleg: 'Wat er in de loop der jaren van de waarde van je inventaris is afgeschreven.' },
  { code: '0300', naam: 'Vervoermiddelen', soort: 'asset', rubriek: 'Vaste activa' },
  { code: '0310', naam: 'Afschrijving vervoermiddelen', soort: 'asset', rubriek: 'Vaste activa' },

  // --- Vlottende activa ---
  { code: '1000', naam: 'Kas', soort: 'asset', rubriek: 'Liquide middelen', rol: 'kas', uitleg: 'Contant geld.' },
  { code: '1100', naam: 'Bank', soort: 'asset', rubriek: 'Liquide middelen', rol: 'bank', rgs: 'BLimBanRba', uitleg: 'Het saldo op je zakelijke rekening.' },
  { code: '1190', naam: 'Kruisposten', soort: 'asset', rubriek: 'Liquide middelen', rol: 'tussenrekening_bank', uitleg: 'Tijdelijke rekening voor geld dat onderweg is tussen je eigen rekeningen.' },
  { code: '1300', naam: 'Debiteuren', soort: 'asset', rubriek: 'Vorderingen', rol: 'debiteuren', rgs: 'BVorDeb', uitleg: 'Geld dat klanten je nog moeten betalen.' },
  { code: '1400', naam: 'Vooruitbetaalde kosten', soort: 'asset', rubriek: 'Vorderingen', uitleg: 'Kosten die je al hebt betaald maar die over een latere periode gaan.' },

  // --- Btw ---
  { code: '1500', naam: 'Af te dragen btw hoog tarief', soort: 'liability', rubriek: 'Belastingen', rol: 'btw_af_te_dragen_hoog', uitleg: 'Btw die je van klanten hebt ontvangen en aan de Belastingdienst moet betalen.' },
  { code: '1505', naam: 'Af te dragen btw laag tarief', soort: 'liability', rubriek: 'Belastingen', rol: 'btw_af_te_dragen_laag' },
  { code: '1508', naam: 'Af te dragen btw overige tarieven', soort: 'liability', rubriek: 'Belastingen', rol: 'btw_af_te_dragen_overig' },
  { code: '1510', naam: 'Af te dragen btw verlegd', soort: 'liability', rubriek: 'Belastingen', rol: 'btw_verlegd_af_te_dragen', uitleg: 'Btw die naar jou is verlegd: je draagt hem af en trekt hem in dezelfde aangifte weer af.' },
  { code: '1520', naam: 'Te vorderen btw (voorbelasting)', soort: 'asset', rubriek: 'Belastingen', rol: 'btw_te_vorderen', uitleg: 'Btw die je zelf hebt betaald en terugkrijgt.' },
  { code: '1590', naam: 'Btw-afrekening', soort: 'liability', rubriek: 'Belastingen', rol: 'btw_afrekening', uitleg: 'Het saldo van je aangifte: wat je per saldo moet betalen of terugkrijgt.' },

  // --- Kortlopende schulden ---
  { code: '1600', naam: 'Crediteuren', soort: 'liability', rubriek: 'Schulden', rol: 'crediteuren', rgs: 'BSchCre', uitleg: 'Geld dat jij nog aan leveranciers moet betalen.' },
  { code: '1620', naam: 'Nog te ontvangen facturen', soort: 'liability', rubriek: 'Schulden', rol: 'nog_te_ontvangen_facturen' },
  { code: '1700', naam: 'Overige schulden', soort: 'liability', rubriek: 'Schulden' },

  // --- Kosten ---
  { code: '4000', naam: 'Huisvestingskosten', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-21' },
  { code: '4100', naam: 'Kantoorkosten', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-21' },
  { code: '4110', naam: 'Telefoon en internet', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-21' },
  { code: '4120', naam: 'Software en abonnementen', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-21' },
  { code: '4200', naam: 'Verkoopkosten', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-21' },
  { code: '4210', naam: 'Reis- en verblijfkosten', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-9' },
  { code: '4220', naam: 'Autokosten', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-21' },
  { code: '4300', naam: 'Algemene kosten', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-21' },
  { code: '4310', naam: 'Accountants- en advieskosten', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-21' },
  { code: '4320', naam: 'Verzekeringen', soort: 'expense', rubriek: 'Bedrijfskosten', btwStandaard: 'IN-GEEN' },
  { code: '4400', naam: 'Afschrijvingskosten', soort: 'expense', rubriek: 'Afschrijvingen' },
  { code: '4500', naam: 'Inkoopwaarde van de omzet', soort: 'expense', rubriek: 'Inkoopwaarde', btwStandaard: 'IN-21' },

  // --- Omzet ---
  { code: '8000', naam: 'Omzet hoog tarief', soort: 'revenue', rubriek: 'Netto-omzet', btwStandaard: 'VK-21', rgs: 'WOmzNoo', uitleg: 'Wat je hebt verdiend met werk of producten met 21% btw.' },
  { code: '8010', naam: 'Omzet laag tarief', soort: 'revenue', rubriek: 'Netto-omzet', btwStandaard: 'VK-9' },
  { code: '8020', naam: 'Omzet 0% en vrijgesteld', soort: 'revenue', rubriek: 'Netto-omzet', btwStandaard: 'VK-0' },
  { code: '8030', naam: 'Omzet btw verlegd', soort: 'revenue', rubriek: 'Netto-omzet', btwStandaard: 'VK-VERLEGD' },
  { code: '8040', naam: 'Omzet leveringen binnen de EU', soort: 'revenue', rubriek: 'Netto-omzet', btwStandaard: 'VK-ICL' },
  { code: '8050', naam: 'Omzet uitvoer buiten de EU', soort: 'revenue', rubriek: 'Netto-omzet', btwStandaard: 'VK-EXPORT' },

  // --- Financieel ---
  { code: '4980', naam: 'Koersverschillen', soort: 'expense', rubriek: 'Financiele baten en lasten', rol: 'koersverschillen', uitleg: 'Verschil dat ontstaat doordat een vreemde valuta in waarde verandert.' },
  { code: '4990', naam: 'Betalingsverschillen', soort: 'expense', rubriek: 'Financiele baten en lasten', rol: 'betalingsverschillen', uitleg: 'Kleine verschillen tussen wat er is gefactureerd en wat er is betaald.' },
  { code: '4995', naam: 'Bankkosten', soort: 'expense', rubriek: 'Financiele baten en lasten', btwStandaard: 'IN-GEEN' },
  { code: '9000', naam: 'Rentebaten', soort: 'revenue', rubriek: 'Financiele baten en lasten', btwStandaard: 'VK-GEEN' },
  { code: '9100', naam: 'Rentelasten', soort: 'expense', rubriek: 'Financiele baten en lasten', btwStandaard: 'IN-GEEN' },
];

const EIGEN_VERMOGEN_ZZP: RekeningSjabloon[] = [
  { code: '0500', naam: 'Kapitaal', soort: 'equity', rubriek: 'Eigen vermogen', rol: 'kapitaal', uitleg: 'Wat het bedrijf waard is voor jou als eigenaar.' },
  { code: '0510', naam: 'Prive-opnamen', soort: 'equity', rubriek: 'Eigen vermogen', rol: 'prive_opnamen', uitleg: 'Geld dat je uit de zaak hebt gehaald voor jezelf.' },
  { code: '0520', naam: 'Prive-stortingen', soort: 'equity', rubriek: 'Eigen vermogen' },
  { code: '0590', naam: 'Onverdeeld resultaat', soort: 'equity', rubriek: 'Eigen vermogen', rol: 'onverdeeld_resultaat' },
];

const EIGEN_VERMOGEN_BV: RekeningSjabloon[] = [
  { code: '0500', naam: 'Gestort aandelenkapitaal', soort: 'equity', rubriek: 'Eigen vermogen', rol: 'kapitaal' },
  { code: '0530', naam: 'Agioreserve', soort: 'equity', rubriek: 'Eigen vermogen' },
  { code: '0550', naam: 'Overige reserves', soort: 'equity', rubriek: 'Eigen vermogen' },
  { code: '0590', naam: 'Onverdeeld resultaat', soort: 'equity', rubriek: 'Eigen vermogen', rol: 'onverdeeld_resultaat' },
  { code: '1710', naam: 'Rekening-courant directie', soort: 'liability', rubriek: 'Schulden' },
  { code: '1750', naam: 'Te betalen vennootschapsbelasting', soort: 'liability', rubriek: 'Belastingen' },
  { code: '4600', naam: 'Lonen en salarissen', soort: 'expense', rubriek: 'Personeelskosten', btwStandaard: 'IN-GEEN' },
  { code: '4610', naam: 'Sociale lasten', soort: 'expense', rubriek: 'Personeelskosten', btwStandaard: 'IN-GEEN' },
  { code: '4620', naam: 'Pensioenlasten', soort: 'expense', rubriek: 'Personeelskosten', btwStandaard: 'IN-GEEN' },
  { code: '1650', naam: 'Te betalen loonheffing', soort: 'liability', rubriek: 'Belastingen' },
];

const EIGEN_VERMOGEN_STICHTING: RekeningSjabloon[] = [
  { code: '0500', naam: 'Stichtingsvermogen', soort: 'equity', rubriek: 'Eigen vermogen', rol: 'kapitaal' },
  { code: '0560', naam: 'Bestemmingsreserves', soort: 'equity', rubriek: 'Eigen vermogen' },
  { code: '0570', naam: 'Bestemmingsfondsen', soort: 'equity', rubriek: 'Eigen vermogen' },
  { code: '0590', naam: 'Exploitatiesaldo', soort: 'equity', rubriek: 'Eigen vermogen', rol: 'onverdeeld_resultaat' },
  { code: '8100', naam: 'Subsidiebaten', soort: 'revenue', rubriek: 'Baten', btwStandaard: 'VK-GEEN' },
  { code: '8110', naam: 'Donaties en giften', soort: 'revenue', rubriek: 'Baten', btwStandaard: 'VK-GEEN' },
  { code: '8120', naam: 'Baten uit fondsenwerving', soort: 'revenue', rubriek: 'Baten', btwStandaard: 'VK-GEEN' },
  { code: '4700', naam: 'Besteed aan doelstelling', soort: 'expense', rubriek: 'Lasten' },
];

const EIGEN_VERMOGEN_VERENIGING: RekeningSjabloon[] = [
  { code: '0500', naam: 'Verenigingsvermogen', soort: 'equity', rubriek: 'Eigen vermogen', rol: 'kapitaal' },
  { code: '0560', naam: 'Bestemmingsreserves', soort: 'equity', rubriek: 'Eigen vermogen' },
  { code: '0590', naam: 'Exploitatiesaldo', soort: 'equity', rubriek: 'Eigen vermogen', rol: 'onverdeeld_resultaat' },
  { code: '8100', naam: 'Contributies', soort: 'revenue', rubriek: 'Baten', btwStandaard: 'VK-GEEN' },
  { code: '8110', naam: 'Donaties en sponsoring', soort: 'revenue', rubriek: 'Baten', btwStandaard: 'VK-GEEN' },
  { code: '8130', naam: 'Baten uit activiteiten', soort: 'revenue', rubriek: 'Baten', btwStandaard: 'VK-21' },
  { code: '4700', naam: 'Activiteitenkosten', soort: 'expense', rubriek: 'Lasten', btwStandaard: 'IN-21' },
];

export const SCHEMA_SJABLONEN: readonly SchemaSjabloon[] = [
  {
    sleutel: 'zzp',
    naam: 'Zzp en eenmanszaak',
    omschrijving: 'Compact schema met kapitaal- en priverekeningen. Ook geschikt voor een vof.',
    rekeningen: [...GEMEENSCHAPPELIJK, ...EIGEN_VERMOGEN_ZZP],
  },
  {
    sleutel: 'bv',
    naam: 'Besloten vennootschap',
    omschrijving: 'Met aandelenkapitaal, reserves, loonadministratie en vennootschapsbelasting.',
    rekeningen: [...GEMEENSCHAPPELIJK, ...EIGEN_VERMOGEN_BV],
  },
  {
    sleutel: 'stichting',
    naam: 'Stichting',
    omschrijving: 'Met bestemmingsreserves, subsidies, donaties en besteding aan de doelstelling.',
    rekeningen: [...GEMEENSCHAPPELIJK, ...EIGEN_VERMOGEN_STICHTING],
  },
  {
    sleutel: 'vereniging',
    naam: 'Vereniging',
    omschrijving: 'Met contributies, sponsoring en activiteitenkosten.',
    rekeningen: [...GEMEENSCHAPPELIJK, ...EIGEN_VERMOGEN_VERENIGING],
  },
];

/** Zoekt een sjabloon op sleutel. */
export function sjabloonVoor(sleutel: string): SchemaSjabloon {
  const gevonden = SCHEMA_SJABLONEN.find((s) => s.sleutel === sleutel);
  if (!gevonden) {
    throw new RangeError(
      `Onbekend rekeningschema ${JSON.stringify(sleutel)}. Beschikbaar: ${SCHEMA_SJABLONEN.map((s) => s.sleutel).join(', ')}.`,
    );
  }
  return gevonden;
}
