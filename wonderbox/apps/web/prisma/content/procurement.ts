/**
 * Sourcing data, keyed by SKU.
 *
 * Deliberately separate from the box content: a mailer box is shared between
 * products, a supplier changes without the story changing, and an editor
 * writing a chapter has no business editing purchase prices.
 *
 * Costs are **net of VAT** — input VAT is reclaimed, so counting it here would
 * punish the same money twice. Figures are realistic Dutch wholesale for a run
 * in the hundreds; replace them with your own quotes before ordering anything.
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
