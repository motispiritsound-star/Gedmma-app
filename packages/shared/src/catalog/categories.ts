import type { LocalizedText } from '../locales.js';

export interface CategorySeed {
  slug: string;
  name: LocalizedText;
  /** `null` for a top-level trade, otherwise the parent category slug. */
  parentSlug: string | null;
  /** Ionicons name rendered in the app's category grid. */
  icon: string;
  /** Typical job value in euros, shown as guidance in the posting wizard. */
  typicalBudgetEur?: { min: number; max: number };
}

/**
 * The trade taxonomy, covering the work Dutch households actually put out to
 * tender: maintenance, renovation, and the energy work that has dominated home
 * improvement here since the gas price shock.
 *
 * Names are authored in both shipping languages rather than translated at
 * runtime, because a mistranslated trade name sends a job to the wrong people.
 */
export const CATEGORIES: readonly CategorySeed[] = [
  // --- Painting and decorating -----------------------------------------------
  { slug: 'schilderwerk', parentSlug: null, icon: 'color-palette-outline', name: { nl: 'Schilderwerk', en: 'Painting & decorating' }, typicalBudgetEur: { min: 400, max: 8000 } },
  { slug: 'binnenschilderwerk', parentSlug: 'schilderwerk', icon: 'brush-outline', name: { nl: 'Binnen schilderen', en: 'Interior painting' }, typicalBudgetEur: { min: 400, max: 4000 } },
  { slug: 'buitenschilderwerk', parentSlug: 'schilderwerk', icon: 'home-outline', name: { nl: 'Buiten schilderen', en: 'Exterior painting' }, typicalBudgetEur: { min: 1200, max: 9000 } },
  { slug: 'behangen', parentSlug: 'schilderwerk', icon: 'grid-outline', name: { nl: 'Behangen', en: 'Wallpapering' }, typicalBudgetEur: { min: 250, max: 2000 } },

  // --- Plumbing --------------------------------------------------------------
  { slug: 'loodgieter', parentSlug: null, icon: 'water-outline', name: { nl: 'Loodgieter', en: 'Plumbing' }, typicalBudgetEur: { min: 100, max: 5000 } },
  { slug: 'lekkage', parentSlug: 'loodgieter', icon: 'alert-circle-outline', name: { nl: 'Lekkage opsporen en verhelpen', en: 'Leak detection & repair' }, typicalBudgetEur: { min: 100, max: 1200 } },
  { slug: 'cv-ketel', parentSlug: 'loodgieter', icon: 'flame-outline', name: { nl: 'Cv-ketel plaatsen of onderhouden', en: 'Boiler installation & servicing' }, typicalBudgetEur: { min: 150, max: 3500 } },
  { slug: 'badkamer', parentSlug: 'loodgieter', icon: 'water-outline', name: { nl: 'Badkamer verbouwen', en: 'Bathroom renovation' }, typicalBudgetEur: { min: 4000, max: 20000 } },
  { slug: 'riool-ontstoppen', parentSlug: 'loodgieter', icon: 'swap-vertical-outline', name: { nl: 'Riool en afvoer ontstoppen', en: 'Drain unblocking' }, typicalBudgetEur: { min: 90, max: 900 } },

  // --- Electrical ------------------------------------------------------------
  { slug: 'elektricien', parentSlug: null, icon: 'flash-outline', name: { nl: 'Elektricien', en: 'Electrical' }, typicalBudgetEur: { min: 100, max: 6000 } },
  { slug: 'groepenkast', parentSlug: 'elektricien', icon: 'construct-outline', name: { nl: 'Groepenkast vervangen', en: 'Consumer unit replacement' }, typicalBudgetEur: { min: 600, max: 2500 } },
  { slug: 'stopcontacten', parentSlug: 'elektricien', icon: 'flash-outline', name: { nl: 'Stopcontacten en bedrading', en: 'Sockets & wiring' }, typicalBudgetEur: { min: 100, max: 2500 } },
  { slug: 'laadpaal', parentSlug: 'elektricien', icon: 'battery-charging-outline', name: { nl: 'Laadpaal installeren', en: 'EV charger installation' }, typicalBudgetEur: { min: 700, max: 2500 } },
  { slug: 'domotica', parentSlug: 'elektricien', icon: 'phone-portrait-outline', name: { nl: 'Domotica en slimme meter', en: 'Home automation' }, typicalBudgetEur: { min: 300, max: 5000 } },

  // --- Carpentry -------------------------------------------------------------
  { slug: 'timmerwerk', parentSlug: null, icon: 'hammer-outline', name: { nl: 'Timmerwerk', en: 'Carpentry' }, typicalBudgetEur: { min: 200, max: 15000 } },
  { slug: 'kozijnen', parentSlug: 'timmerwerk', icon: 'browsers-outline', name: { nl: 'Kozijnen en deuren', en: 'Window frames & doors' }, typicalBudgetEur: { min: 800, max: 20000 } },
  { slug: 'keuken-plaatsen', parentSlug: 'timmerwerk', icon: 'restaurant-outline', name: { nl: 'Keuken plaatsen', en: 'Kitchen fitting' }, typicalBudgetEur: { min: 1500, max: 12000 } },
  { slug: 'meubelmaker', parentSlug: 'timmerwerk', icon: 'cube-outline', name: { nl: 'Meubels en kasten op maat', en: 'Bespoke furniture & cabinets' }, typicalBudgetEur: { min: 500, max: 10000 } },
  { slug: 'trap-renoveren', parentSlug: 'timmerwerk', icon: 'layers-outline', name: { nl: 'Trap renoveren', en: 'Stair renovation' }, typicalBudgetEur: { min: 800, max: 4000 } },

  // --- Building work ---------------------------------------------------------
  { slug: 'aannemer', parentSlug: null, icon: 'business-outline', name: { nl: 'Aannemer en verbouwing', en: 'Builder & renovation' }, typicalBudgetEur: { min: 2000, max: 150000 } },
  { slug: 'aanbouw', parentSlug: 'aannemer', icon: 'expand-outline', name: { nl: 'Aanbouw of uitbouw', en: 'Extension' }, typicalBudgetEur: { min: 20000, max: 120000 } },
  { slug: 'dakkapel', parentSlug: 'aannemer', icon: 'home-outline', name: { nl: 'Dakkapel plaatsen', en: 'Dormer window' }, typicalBudgetEur: { min: 6000, max: 20000 } },
  { slug: 'metselwerk', parentSlug: 'aannemer', icon: 'grid-outline', name: { nl: 'Metselwerk en voegen', en: 'Bricklaying & repointing' }, typicalBudgetEur: { min: 500, max: 15000 } },
  { slug: 'sloopwerk', parentSlug: 'aannemer', icon: 'trash-outline', name: { nl: 'Sloopwerk en afvoeren', en: 'Demolition & clearance' }, typicalBudgetEur: { min: 400, max: 8000 } },

  // --- Roofing ---------------------------------------------------------------
  { slug: 'dakdekker', parentSlug: null, icon: 'umbrella-outline', name: { nl: 'Dakdekker', en: 'Roofing' }, typicalBudgetEur: { min: 300, max: 25000 } },
  { slug: 'dak-vervangen', parentSlug: 'dakdekker', icon: 'umbrella-outline', name: { nl: 'Dak vervangen of repareren', en: 'Roof replacement & repair' }, typicalBudgetEur: { min: 1000, max: 25000 } },
  { slug: 'dakgoot', parentSlug: 'dakdekker', icon: 'water-outline', name: { nl: 'Dakgoot en regenpijp', en: 'Gutters & downpipes' }, typicalBudgetEur: { min: 150, max: 2500 } },

  // --- Insulation and energy -------------------------------------------------
  { slug: 'isolatie', parentSlug: null, icon: 'thermometer-outline', name: { nl: 'Isolatie', en: 'Insulation' }, typicalBudgetEur: { min: 500, max: 15000 } },
  { slug: 'spouwmuurisolatie', parentSlug: 'isolatie', icon: 'layers-outline', name: { nl: 'Spouwmuurisolatie', en: 'Cavity wall insulation' }, typicalBudgetEur: { min: 800, max: 3500 } },
  { slug: 'vloerisolatie', parentSlug: 'isolatie', icon: 'layers-outline', name: { nl: 'Vloer- en bodemisolatie', en: 'Floor insulation' }, typicalBudgetEur: { min: 700, max: 3500 } },
  { slug: 'dakisolatie', parentSlug: 'isolatie', icon: 'umbrella-outline', name: { nl: 'Dakisolatie', en: 'Roof insulation' }, typicalBudgetEur: { min: 1500, max: 12000 } },
  { slug: 'zonnepanelen', parentSlug: null, icon: 'sunny-outline', name: { nl: 'Zonnepanelen', en: 'Solar panels' }, typicalBudgetEur: { min: 2500, max: 15000 } },
  { slug: 'warmtepomp', parentSlug: null, icon: 'snow-outline', name: { nl: 'Warmtepomp en airco', en: 'Heat pump & air conditioning' }, typicalBudgetEur: { min: 1500, max: 20000 } },

  // --- Floors and walls ------------------------------------------------------
  { slug: 'vloeren', parentSlug: null, icon: 'grid-outline', name: { nl: 'Vloeren leggen', en: 'Flooring' }, typicalBudgetEur: { min: 400, max: 12000 } },
  { slug: 'tegelzetter', parentSlug: 'vloeren', icon: 'grid-outline', name: { nl: 'Tegelwerk', en: 'Tiling' }, typicalBudgetEur: { min: 400, max: 8000 } },
  { slug: 'parket', parentSlug: 'vloeren', icon: 'layers-outline', name: { nl: 'Parket, laminaat en pvc', en: 'Parquet, laminate & vinyl' }, typicalBudgetEur: { min: 400, max: 8000 } },
  { slug: 'gietvloer', parentSlug: 'vloeren', icon: 'water-outline', name: { nl: 'Gietvloer', en: 'Poured resin floor' }, typicalBudgetEur: { min: 1500, max: 8000 } },
  { slug: 'stukadoor', parentSlug: null, icon: 'layers-outline', name: { nl: 'Stukadoor', en: 'Plastering' }, typicalBudgetEur: { min: 400, max: 8000 } },

  // --- Garden ----------------------------------------------------------------
  { slug: 'hovenier', parentSlug: null, icon: 'leaf-outline', name: { nl: 'Hovenier en tuin', en: 'Gardening & landscaping' }, typicalBudgetEur: { min: 200, max: 25000 } },
  { slug: 'tuinaanleg', parentSlug: 'hovenier', icon: 'leaf-outline', name: { nl: 'Tuin aanleggen', en: 'Garden design & construction' }, typicalBudgetEur: { min: 1500, max: 25000 } },
  { slug: 'bestrating', parentSlug: 'hovenier', icon: 'grid-outline', name: { nl: 'Bestrating en oprit', en: 'Paving & driveways' }, typicalBudgetEur: { min: 800, max: 12000 } },
  { slug: 'schutting', parentSlug: 'hovenier', icon: 'browsers-outline', name: { nl: 'Schutting en erfafscheiding', en: 'Fencing' }, typicalBudgetEur: { min: 300, max: 5000 } },
  { slug: 'boom-snoeien', parentSlug: 'hovenier', icon: 'leaf-outline', name: { nl: 'Bomen snoeien of kappen', en: 'Tree pruning & felling' }, typicalBudgetEur: { min: 150, max: 3000 } },

  // --- Cleaning and moving ---------------------------------------------------
  { slug: 'schoonmaak', parentSlug: null, icon: 'sparkles-outline', name: { nl: 'Schoonmaak', en: 'Cleaning' }, typicalBudgetEur: { min: 80, max: 2500 } },
  { slug: 'glazenwasser', parentSlug: 'schoonmaak', icon: 'browsers-outline', name: { nl: 'Glazenwasser', en: 'Window cleaning' }, typicalBudgetEur: { min: 40, max: 600 } },
  { slug: 'opleveringsschoonmaak', parentSlug: 'schoonmaak', icon: 'construct-outline', name: { nl: 'Opleverings- en bouwschoonmaak', en: 'Post-construction cleaning' }, typicalBudgetEur: { min: 200, max: 2500 } },
  { slug: 'verhuizen', parentSlug: null, icon: 'cube-outline', name: { nl: 'Verhuizen', en: 'Removals' }, typicalBudgetEur: { min: 300, max: 4000 } },

  // --- Repairs and other trades ----------------------------------------------
  { slug: 'klusjesman', parentSlug: null, icon: 'construct-outline', name: { nl: 'Klusjesman', en: 'Handyman' }, typicalBudgetEur: { min: 50, max: 1500 } },
  { slug: 'slotenmaker', parentSlug: null, icon: 'key-outline', name: { nl: 'Slotenmaker', en: 'Locksmith' }, typicalBudgetEur: { min: 80, max: 900 } },
  { slug: 'glaszetter', parentSlug: null, icon: 'browsers-outline', name: { nl: 'Glaszetter en beglazing', en: 'Glazing' }, typicalBudgetEur: { min: 150, max: 6000 } },
  { slug: 'ongediertebestrijding', parentSlug: null, icon: 'bug-outline', name: { nl: 'Ongediertebestrijding', en: 'Pest control' }, typicalBudgetEur: { min: 100, max: 1200 } },
  { slug: 'witgoed-reparatie', parentSlug: null, icon: 'cog-outline', name: { nl: 'Witgoed repareren', en: 'Appliance repair' }, typicalBudgetEur: { min: 70, max: 600 } },
  { slug: 'architect', parentSlug: null, icon: 'pencil-outline', name: { nl: 'Architect en bouwtekening', en: 'Architect & drawings' }, typicalBudgetEur: { min: 800, max: 25000 } },
  { slug: 'interieurontwerp', parentSlug: null, icon: 'color-palette-outline', name: { nl: 'Interieurontwerp', en: 'Interior design' }, typicalBudgetEur: { min: 500, max: 10000 } },
  { slug: 'zonwering', parentSlug: null, icon: 'sunny-outline', name: { nl: 'Zonwering en rolluiken', en: 'Awnings & shutters' }, typicalBudgetEur: { min: 400, max: 6000 } },
];

export const ROOT_CATEGORIES: readonly CategorySeed[] = CATEGORIES.filter(
  (category) => category.parentSlug === null,
);

export const CATEGORY_BY_SLUG: ReadonlyMap<string, CategorySeed> = new Map(
  CATEGORIES.map((category) => [category.slug, category]),
);

export function childCategories(parentSlug: string): CategorySeed[] {
  return CATEGORIES.filter((category) => category.parentSlug === parentSlug);
}
