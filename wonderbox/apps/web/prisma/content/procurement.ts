/**
 * Sourcing data, keyed by SKU.
 *
 * Deliberately separate from the box content: a mailer box is shared between
 * products, a supplier changes without the story changing, and an editor
 * writing a chapter has no business editing purchase prices.
 *
 * Costs are **net of VAT** — input VAT is reclaimed, so counting it here would
 * punish the same money twice.
 *
 * ⚠ The supplier names below are INVENTED. They are placeholders shaped like
 * real Dutch trade names so the data model and the screens have something
 * plausible to work with. None of them has been contacted, quoted or vetted,
 * and the prices are researched estimates for a run in the hundreds, not
 * offers. Replace every one of them with a real quote before you order
 * anything. See COMMERCE_AND_FULFILMENT.md for how to run that sourcing round.
 */
export interface Sourcing {
  readonly supplierName: string;
  readonly supplierSku: string;
  /** Net purchase price per unit, in cents. */
  readonly costCents: number;
  readonly moq: number;
  readonly leadTimeDays: number;
  readonly weightGrams: number;
}

export const SOURCING: Record<string, Sourcing> = {
  // --- Space -------------------------------------------------------------
  'CMP-BALLOON-10': {
    supplierName: 'Feestgroothandel Tilburg',
    supplierSku: 'BAL-LTX-30-100',
    costCents: 45,
    moq: 500,
    leadTimeDays: 10,
    weightGrams: 25,
  },
  'CMP-STRING-8M': {
    supplierName: 'Touwhandel Rotterdam',
    supplierSku: 'VLG-PP-1.5',
    costCents: 35,
    moq: 250,
    leadTimeDays: 14,
    weightGrams: 30,
  },
  'CMP-STRAW-20': {
    supplierName: 'Ecoware BV',
    supplierSku: 'PAP-RIET-6MM',
    costCents: 55,
    moq: 500,
    leadTimeDays: 10,
    weightGrams: 20,
  },
  'CMP-FLOUR-TRAY': {
    supplierName: 'Kunststof Verpakking NL',
    supplierSku: 'TRAY-PP-220-VUL',
    costCents: 240,
    moq: 250,
    leadTimeDays: 21,
    weightGrams: 320,
  },
  'CMP-MARBLES-3': {
    supplierName: 'Glaswerk Import',
    supplierSku: 'KNIK-SET3-16-25-35',
    costCents: 70,
    moq: 500,
    // Made to order in Asia; this is the long pole in a space-box run.
    leadTimeDays: 42,
    weightGrams: 45,
  },
  'PRN-SPACE-CARDS': {
    supplierName: 'Drukkerij De Boer',
    supplierSku: 'KRT-A5-350G-6X',
    costCents: 165,
    moq: 500,
    leadTimeDays: 12,
    weightGrams: 55,
  },

  // --- Electric alarm ----------------------------------------------------
  'CMP-BATT-HOLDER': {
    supplierName: 'Elektronica Import BV',
    supplierSku: 'BH-2AA-SW',
    costCents: 42,
    moq: 1000,
    leadTimeDays: 35,
    weightGrams: 22,
  },
  'CMP-BUZZER-5V': {
    supplierName: 'Elektronica Import BV',
    supplierSku: 'BZ-AC-5V-85DB',
    costCents: 38,
    moq: 1000,
    leadTimeDays: 35,
    weightGrams: 8,
  },
  'CMP-LED-RED': {
    supplierName: 'Elektronica Import BV',
    supplierSku: 'LED-5MM-RED-R220',
    costCents: 9,
    moq: 2000,
    leadTimeDays: 35,
    weightGrams: 2,
  },
  'CMP-WIRE-CROC': {
    supplierName: 'Elektronica Import BV',
    supplierSku: 'CROC-6X-300MM',
    costCents: 125,
    moq: 500,
    leadTimeDays: 35,
    weightGrams: 60,
  },
  'CMP-FOIL-SHEET': {
    supplierName: 'Huishoudfolie Groothandel',
    supplierSku: 'ALU-VEL-150X200',
    costCents: 12,
    moq: 1000,
    leadTimeDays: 10,
    weightGrams: 4,
  },
  'CMP-CARD-STRIP': {
    supplierName: 'Drukkerij De Boer',
    supplierSku: 'STR-GRIJS-400G',
    costCents: 6,
    moq: 2000,
    leadTimeDays: 12,
    weightGrams: 6,
  },
  'PRN-ALARM-CARDS': {
    supplierName: 'Drukkerij De Boer',
    supplierSku: 'KRT-A5-350G-6X',
    costCents: 165,
    moq: 500,
    leadTimeDays: 12,
    weightGrams: 55,
  },

  // --- Nature detective --------------------------------------------------
  'CMP-PLASTER-200': {
    supplierName: 'Bouwstoffen Direct',
    supplierSku: 'GIPS-MOD-200-ZAK',
    costCents: 55,
    moq: 500,
    leadTimeDays: 14,
    weightGrams: 210,
  },
  'CMP-MAGNIFIER': {
    supplierName: 'Optiek Import',
    supplierSku: 'LOEP-KIND-3X-50',
    costCents: 110,
    moq: 500,
    leadTimeDays: 30,
    weightGrams: 35,
  },
  'CMP-COLLECT-POT': {
    supplierName: 'Optiek Import',
    supplierSku: 'POT-KIJK-4X-DEKSEL',
    costCents: 45,
    moq: 1000,
    leadTimeDays: 30,
    weightGrams: 18,
  },
  'CMP-CARD-RING': {
    supplierName: 'Drukkerij De Boer',
    supplierSku: 'RING-A6-350G-12X',
    costCents: 145,
    moq: 500,
    leadTimeDays: 12,
    weightGrams: 40,
  },
  'CMP-SOFT-BRUSH': {
    supplierName: 'Kwastenhandel Amersfoort',
    supplierSku: 'KWA-ZACHT-20MM',
    costCents: 28,
    moq: 1000,
    leadTimeDays: 25,
    weightGrams: 8,
  },
  'PRN-NATURE-MAP': {
    supplierName: 'Drukkerij De Boer',
    supplierSku: 'POS-A3-170G',
    costCents: 65,
    moq: 500,
    leadTimeDays: 12,
    weightGrams: 15,
  },

  // --- Packaging, shared -------------------------------------------------
  'PKG-BOX-M': {
    supplierName: 'Golfkarton Zeeland',
    supplierSku: 'MAIL-M-320X240X80-4C',
    costCents: 135,
    moq: 500,
    leadTimeDays: 15,
    weightGrams: 180,
  },
  'PKG-BOX-S': {
    supplierName: 'Golfkarton Zeeland',
    supplierSku: 'MAIL-S-260X190X70-4C',
    costCents: 110,
    moq: 500,
    leadTimeDays: 15,
    weightGrams: 140,
  },
};

/**
 * One-off costs per box design, and the run they are spread over.
 *
 * These are the numbers a parts-only calculation cannot see, and they are
 * frequently larger than the parts. A kit sold to children in the EU needs
 * EN 71 testing and a technical file before it may carry a CE mark; the
 * electric box additionally falls under EN 62115 and EMC, which is why its
 * certification bill is roughly double the others'.
 */
export interface SetupCosts {
  readonly certificationCostCents: number;
  readonly artworkCostCents: number;
  readonly amortiseOverUnits: number;
  readonly note: string;
}

export const SETUP_COSTS: Record<string, SetupCosts> = {
  'WB-SPACE-01': {
    certificationCostCents: 350_000,
    artworkCostCents: 120_000,
    amortiseOverUnits: 2000,
    note: 'EN 71-1/2/3. The balloon carries the mandatory choking warning.',
  },
  'WB-ALARM-01': {
    certificationCostCents: 620_000,
    artworkCostCents: 140_000,
    amortiseOverUnits: 1500,
    note: 'EN 71 plus EN 62115 for electric toys, EMC, and battery/WEEE registration.',
  },
  'WB-NATURE-01': {
    certificationCostCents: 480_000,
    artworkCostCents: 110_000,
    amortiseOverUnits: 2000,
    note: 'EN 71 with small-parts testing throughout: this box is graded from age five.',
  },
};

/**
 * The supplier records themselves.
 *
 * `autoApproveUnderCents` is the amount below which the replenishment job may
 * send an order without a person looking at it. It is zero for everyone here
 * on purpose: a purchase order commits real money, and the sensible default is
 * that a human sees the first few. Raise it per supplier once the forecast has
 * been right a few months running.
 */
export interface SupplierRecord {
  readonly code: string;
  readonly name: string;
  readonly email: string;
  readonly channel: 'EMAIL' | 'CSV' | 'API' | 'MANUAL';
  readonly leadTimeDays: number;
  readonly minOrderValueCents: number;
  readonly autoApproveUnderCents: number;
  readonly notes: string;
}

export const SUPPLIERS: readonly SupplierRecord[] = [
  {
    code: 'FEEST-TILBURG',
    name: 'Feestgroothandel Tilburg',
    email: 'orders@feestgroothandel.invalid',
    channel: 'EMAIL',
    leadTimeDays: 10,
    minOrderValueCents: 15_000,
    autoApproveUnderCents: 0,
    notes: 'Ballonnen. Vraag om de EN 71-verklaring bij elke partij.',
  },
  {
    code: 'TOUW-ROTTERDAM',
    name: 'Touwhandel Rotterdam',
    email: 'verkoop@touwhandel.invalid',
    channel: 'EMAIL',
    leadTimeDays: 14,
    minOrderValueCents: 10_000,
    autoApproveUnderCents: 0,
    notes: 'Vliegertouw op rol; wij snijden zelf op lengte.',
  },
  {
    code: 'ECOWARE',
    name: 'Ecoware BV',
    email: 'sales@ecoware.invalid',
    channel: 'EMAIL',
    leadTimeDays: 10,
    minOrderValueCents: 12_500,
    autoApproveUnderCents: 0,
    notes: 'Papieren rietjes, voedselveilig gecertificeerd.',
  },
  {
    code: 'KUNSTSTOF-NL',
    name: 'Kunststof Verpakking NL',
    email: 'orders@kunststofverpakking.invalid',
    channel: 'EMAIL',
    leadTimeDays: 21,
    minOrderValueCents: 25_000,
    autoApproveUnderCents: 0,
    notes: 'Inslagbakken. Levert de bloem los; wij vullen bij het inpakken.',
  },
  {
    code: 'GLAS-IMPORT',
    name: 'Glaswerk Import',
    email: 'info@glaswerkimport.invalid',
    channel: 'EMAIL',
    leadTimeDays: 42,
    minOrderValueCents: 30_000,
    autoApproveUnderCents: 0,
    notes: 'Knikkers, made-to-order uit Azië. Langste levertijd in de keten.',
  },
  {
    code: 'DRUK-DEBOER',
    name: 'Drukkerij De Boer',
    email: 'orders@drukkerijdeboer.invalid',
    channel: 'EMAIL',
    leadTimeDays: 12,
    minOrderValueCents: 20_000,
    autoApproveUnderCents: 0,
    notes: 'Alle proefkaarten, ringen en posters. Levert drukproef vooraf.',
  },
  {
    code: 'ELEK-IMPORT',
    name: 'Elektronica Import BV',
    email: 'orders@elektronicaimport.invalid',
    channel: 'API',
    leadTimeDays: 35,
    minOrderValueCents: 25_000,
    autoApproveUnderCents: 0,
    notes: 'Zoemers, LEDs, houders. Vraag naar RoHS- en EN 62115-documentatie.',
  },
  {
    code: 'FOLIE-GROOT',
    name: 'Huishoudfolie Groothandel',
    email: 'verkoop@foliegroothandel.invalid',
    channel: 'EMAIL',
    leadTimeDays: 10,
    minOrderValueCents: 7_500,
    autoApproveUnderCents: 0,
    notes: 'Aluminiumfolie op vel gesneden.',
  },
  {
    code: 'BOUWSTOF-DIRECT',
    name: 'Bouwstoffen Direct',
    email: 'orders@bouwstoffendirect.invalid',
    channel: 'CSV',
    leadTimeDays: 14,
    minOrderValueCents: 15_000,
    autoApproveUnderCents: 0,
    notes: 'Modelgips in zakjes van 200 gram. Let op de stofwaarschuwing.',
  },
  {
    code: 'OPTIEK-IMPORT',
    name: 'Optiek Import',
    email: 'sales@optiekimport.invalid',
    channel: 'EMAIL',
    leadTimeDays: 30,
    minOrderValueCents: 25_000,
    autoApproveUnderCents: 0,
    notes: 'Loepen en kijkpotjes. Kindveilige randen, geen glas.',
  },
  {
    code: 'KWAST-AMERSFOORT',
    name: 'Kwastenhandel Amersfoort',
    email: 'info@kwastenhandel.invalid',
    channel: 'EMAIL',
    leadTimeDays: 25,
    minOrderValueCents: 10_000,
    autoApproveUnderCents: 0,
    notes: 'Zachte kwastjes, 20 mm.',
  },
  {
    code: 'GOLF-ZEELAND',
    name: 'Golfkarton Zeeland',
    email: 'orders@golfkartonzeeland.invalid',
    channel: 'EMAIL',
    leadTimeDays: 15,
    minOrderValueCents: 40_000,
    autoApproveUnderCents: 0,
    notes: 'Bedrukte mailerdozen M en S. Vierkleurendruk, FSC.',
  },
];

/** Which supplier each SKU comes from. */
export const SKU_SUPPLIER: Record<string, string> = {
  'CMP-BALLOON-10': 'FEEST-TILBURG',
  'CMP-STRING-8M': 'TOUW-ROTTERDAM',
  'CMP-STRAW-20': 'ECOWARE',
  'CMP-FLOUR-TRAY': 'KUNSTSTOF-NL',
  'CMP-MARBLES-3': 'GLAS-IMPORT',
  'PRN-SPACE-CARDS': 'DRUK-DEBOER',
  'CMP-BATT-HOLDER': 'ELEK-IMPORT',
  'CMP-BUZZER-5V': 'ELEK-IMPORT',
  'CMP-LED-RED': 'ELEK-IMPORT',
  'CMP-WIRE-CROC': 'ELEK-IMPORT',
  'CMP-FOIL-SHEET': 'FOLIE-GROOT',
  'CMP-CARD-STRIP': 'DRUK-DEBOER',
  'PRN-ALARM-CARDS': 'DRUK-DEBOER',
  'CMP-PLASTER-200': 'BOUWSTOF-DIRECT',
  'CMP-MAGNIFIER': 'OPTIEK-IMPORT',
  'CMP-COLLECT-POT': 'OPTIEK-IMPORT',
  'CMP-CARD-RING': 'DRUK-DEBOER',
  'CMP-SOFT-BRUSH': 'KWAST-AMERSFOORT',
  'PRN-NATURE-MAP': 'DRUK-DEBOER',
  'PKG-BOX-M': 'GOLF-ZEELAND',
  'PKG-BOX-S': 'GOLF-ZEELAND',
};

/**
 * Buffer stock per SKU, in units. Sized against lead time: the marbles carry
 * six weeks of cover because that is how long a replacement takes to arrive.
 */
export const SAFETY_STOCK: Record<string, number> = {
  'CMP-MARBLES-3': 250,
  'CMP-BATT-HOLDER': 200,
  'CMP-BUZZER-5V': 200,
  'CMP-WIRE-CROC': 150,
  'CMP-MAGNIFIER': 150,
  'CMP-COLLECT-POT': 200,
  'CMP-FLOUR-TRAY': 120,
  'PKG-BOX-M': 200,
  'PKG-BOX-S': 150,
};
