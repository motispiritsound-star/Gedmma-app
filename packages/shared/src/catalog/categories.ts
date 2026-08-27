import type { LocalizedText } from '../locales.js';

export interface CategorySeed {
  slug: string;
  name: LocalizedText;
  /** `null` for a top-level trade, otherwise the parent category slug. */
  parentSlug: string | null;
  /** Ionicons name rendered in the app's category grid. */
  icon: string;
  /** Typical job value in dirhams, shown as guidance in the posting wizard. */
  typicalBudgetMad?: { min: number; max: number };
}

/**
 * The trade taxonomy. Names are authored in the three shipping languages rather
 * than translated at runtime, because a mistranslated trade name sends a job to
 * the wrong professionals.
 */
export const CATEGORIES: readonly CategorySeed[] = [
  // --- Painting & decorating -------------------------------------------------
  { slug: 'peinture', parentSlug: null, icon: 'color-palette-outline', name: { fr: 'Peinture & Décoration', ar: 'الصباغة والديكور', en: 'Painting & Decorating' }, typicalBudgetMad: { min: 1500, max: 25000 } },
  { slug: 'peinture-interieure', parentSlug: 'peinture', icon: 'brush-outline', name: { fr: 'Peinture intérieure', ar: 'صباغة داخلية', en: 'Interior painting' }, typicalBudgetMad: { min: 1500, max: 15000 } },
  { slug: 'peinture-exterieure', parentSlug: 'peinture', icon: 'home-outline', name: { fr: 'Peinture extérieure & façade', ar: 'صباغة خارجية والواجهات', en: 'Exterior & facade painting' }, typicalBudgetMad: { min: 3000, max: 40000 } },
  { slug: 'papier-peint', parentSlug: 'peinture', icon: 'grid-outline', name: { fr: 'Papier peint & enduits décoratifs', ar: 'ورق الجدران والديكور', en: 'Wallpaper & decorative finishes' } },

  // --- Plumbing --------------------------------------------------------------
  { slug: 'plomberie', parentSlug: null, icon: 'water-outline', name: { fr: 'Plomberie', ar: 'السباكة', en: 'Plumbing' }, typicalBudgetMad: { min: 300, max: 12000 } },
  { slug: 'fuite-eau', parentSlug: 'plomberie', icon: 'alert-circle-outline', name: { fr: "Recherche & réparation de fuite", ar: 'كشف وإصلاح التسربات', en: 'Leak detection & repair' }, typicalBudgetMad: { min: 300, max: 3000 } },
  { slug: 'chauffe-eau', parentSlug: 'plomberie', icon: 'flame-outline', name: { fr: 'Chauffe-eau & chaudière', ar: 'سخان الماء والمرجل', en: 'Water heater & boiler' } },
  { slug: 'salle-de-bain', parentSlug: 'plomberie', icon: 'water-outline', name: { fr: 'Installation salle de bain', ar: 'تركيب الحمام', en: 'Bathroom installation' }, typicalBudgetMad: { min: 4000, max: 45000 } },
  { slug: 'debouchage', parentSlug: 'plomberie', icon: 'swap-vertical-outline', name: { fr: 'Débouchage canalisation', ar: 'تسليك القنوات', en: 'Drain unblocking' } },

  // --- Electrical ------------------------------------------------------------
  { slug: 'electricite', parentSlug: null, icon: 'flash-outline', name: { fr: 'Électricité', ar: 'الكهرباء', en: 'Electrical' }, typicalBudgetMad: { min: 400, max: 20000 } },
  { slug: 'installation-electrique', parentSlug: 'electricite', icon: 'construct-outline', name: { fr: 'Installation & mise aux normes', ar: 'التركيب والمطابقة للمعايير', en: 'Wiring & compliance' } },
  { slug: 'depannage-electrique', parentSlug: 'electricite', icon: 'alert-circle-outline', name: { fr: 'Dépannage électrique', ar: 'إصلاح الأعطال الكهربائية', en: 'Electrical troubleshooting' } },
  { slug: 'domotique', parentSlug: 'electricite', icon: 'phone-portrait-outline', name: { fr: 'Domotique & maison connectée', ar: 'المنزل الذكي', en: 'Home automation' } },
  { slug: 'videosurveillance', parentSlug: 'electricite', icon: 'videocam-outline', name: { fr: 'Vidéosurveillance & alarme', ar: 'المراقبة والإنذار', en: 'CCTV & alarms' } },

  // --- Carpentry & aluminium -------------------------------------------------
  { slug: 'menuiserie', parentSlug: null, icon: 'hammer-outline', name: { fr: 'Menuiserie & Aluminium', ar: 'النجارة والألمنيوم', en: 'Carpentry & Aluminium' }, typicalBudgetMad: { min: 800, max: 60000 } },
  { slug: 'menuiserie-bois', parentSlug: 'menuiserie', icon: 'hammer-outline', name: { fr: 'Menuiserie bois', ar: 'النجارة الخشبية', en: 'Wood carpentry' } },
  { slug: 'menuiserie-aluminium', parentSlug: 'menuiserie', icon: 'browsers-outline', name: { fr: 'Aluminium & PVC', ar: 'الألمنيوم والبلاستيك', en: 'Aluminium & PVC' } },
  { slug: 'cuisine-equipee', parentSlug: 'menuiserie', icon: 'restaurant-outline', name: { fr: 'Cuisine équipée & placards', ar: 'المطبخ والخزائن', en: 'Fitted kitchens & wardrobes' }, typicalBudgetMad: { min: 10000, max: 120000 } },

  // --- Masonry ---------------------------------------------------------------
  { slug: 'maconnerie', parentSlug: null, icon: 'business-outline', name: { fr: 'Maçonnerie & Gros œuvre', ar: 'البناء والأشغال الكبرى', en: 'Masonry & Structural work' }, typicalBudgetMad: { min: 3000, max: 200000 } },
  { slug: 'renovation-complete', parentSlug: 'maconnerie', icon: 'home-outline', name: { fr: 'Rénovation complète', ar: 'ترميم شامل', en: 'Full renovation' }, typicalBudgetMad: { min: 50000, max: 500000 } },
  { slug: 'extension', parentSlug: 'maconnerie', icon: 'expand-outline', name: { fr: 'Extension & surélévation', ar: 'التوسعة والتعلية', en: 'Extension & storey addition' } },
  { slug: 'demolition', parentSlug: 'maconnerie', icon: 'trash-outline', name: { fr: 'Démolition & évacuation', ar: 'الهدم وإخلاء الأنقاض', en: 'Demolition & clearance' } },

  // --- HVAC ------------------------------------------------------------------
  { slug: 'climatisation', parentSlug: null, icon: 'snow-outline', name: { fr: 'Climatisation & Chauffage', ar: 'التكييف والتدفئة', en: 'Air conditioning & Heating' }, typicalBudgetMad: { min: 600, max: 30000 } },
  { slug: 'pose-climatiseur', parentSlug: 'climatisation', icon: 'snow-outline', name: { fr: 'Installation de climatiseur', ar: 'تركيب المكيف', en: 'Air conditioner installation' }, typicalBudgetMad: { min: 800, max: 6000 } },
  { slug: 'entretien-clim', parentSlug: 'climatisation', icon: 'refresh-outline', name: { fr: 'Entretien & recharge de gaz', ar: 'الصيانة وتعبئة الغاز', en: 'Servicing & gas recharge' } },

  // --- Tiling & flooring -----------------------------------------------------
  { slug: 'carrelage', parentSlug: null, icon: 'grid-outline', name: { fr: 'Carrelage & Revêtements', ar: 'التبليط والأرضيات', en: 'Tiling & Flooring' }, typicalBudgetMad: { min: 2000, max: 60000 } },
  { slug: 'pose-carrelage', parentSlug: 'carrelage', icon: 'grid-outline', name: { fr: 'Pose de carrelage', ar: 'وضع البلاط', en: 'Tile laying' } },
  { slug: 'zellige-tadelakt', parentSlug: 'carrelage', icon: 'diamond-outline', name: { fr: 'Zellige & Tadelakt', ar: 'الزليج والتادلاكت', en: 'Zellige & Tadelakt' }, typicalBudgetMad: { min: 5000, max: 150000 } },
  { slug: 'parquet', parentSlug: 'carrelage', icon: 'layers-outline', name: { fr: 'Parquet & moquette', ar: 'الباركي والموكيت', en: 'Parquet & carpet' } },

  // --- Plaster & ceilings ----------------------------------------------------
  { slug: 'platre', parentSlug: null, icon: 'layers-outline', name: { fr: 'Plâtre & Faux plafond', ar: 'الجبس والأسقف المستعارة', en: 'Plastering & False ceilings' }, typicalBudgetMad: { min: 2000, max: 40000 } },
  { slug: 'placoplatre', parentSlug: 'platre', icon: 'square-outline', name: { fr: 'Placoplâtre & cloisons', ar: 'الجبس المقوى والفواصل', en: 'Plasterboard & partitions' } },
  { slug: 'gebs-traditionnel', parentSlug: 'platre', icon: 'sparkles-outline', name: { fr: 'Gebs sculpté traditionnel', ar: 'الجبس المنقوش التقليدي', en: 'Traditional carved gebs' } },

  // --- Waterproofing & roofing ----------------------------------------------
  { slug: 'etancheite', parentSlug: null, icon: 'umbrella-outline', name: { fr: 'Étanchéité & Toiture', ar: 'العزل والسطوح', en: 'Waterproofing & Roofing' }, typicalBudgetMad: { min: 3000, max: 80000 } },
  { slug: 'etancheite-terrasse', parentSlug: 'etancheite', icon: 'umbrella-outline', name: { fr: 'Étanchéité de terrasse', ar: 'عزل السطح', en: 'Terrace waterproofing' } },
  { slug: 'isolation', parentSlug: 'etancheite', icon: 'thermometer-outline', name: { fr: 'Isolation thermique & phonique', ar: 'العزل الحراري والصوتي', en: 'Thermal & acoustic insulation' } },

  // --- Cleaning --------------------------------------------------------------
  { slug: 'nettoyage', parentSlug: null, icon: 'sparkles-outline', name: { fr: 'Nettoyage', ar: 'التنظيف', en: 'Cleaning' }, typicalBudgetMad: { min: 200, max: 8000 } },
  { slug: 'menage-domicile', parentSlug: 'nettoyage', icon: 'home-outline', name: { fr: 'Ménage à domicile', ar: 'تنظيف المنازل', en: 'Home cleaning' }, typicalBudgetMad: { min: 200, max: 1500 } },
  { slug: 'nettoyage-fin-chantier', parentSlug: 'nettoyage', icon: 'construct-outline', name: { fr: 'Nettoyage fin de chantier', ar: 'تنظيف ما بعد الأشغال', en: 'Post-construction cleaning' } },
  { slug: 'nettoyage-bureaux', parentSlug: 'nettoyage', icon: 'briefcase-outline', name: { fr: 'Nettoyage de bureaux', ar: 'تنظيف المكاتب', en: 'Office cleaning' } },

  // --- Moving ----------------------------------------------------------------
  { slug: 'demenagement', parentSlug: null, icon: 'cube-outline', name: { fr: 'Déménagement & Transport', ar: 'النقل والترحيل', en: 'Moving & Transport' }, typicalBudgetMad: { min: 500, max: 15000 } },
  { slug: 'demenagement-domicile', parentSlug: 'demenagement', icon: 'home-outline', name: { fr: 'Déménagement de logement', ar: 'ترحيل المنزل', en: 'Home removals' } },
  { slug: 'transport-marchandises', parentSlug: 'demenagement', icon: 'car-outline', name: { fr: 'Transport de marchandises', ar: 'نقل البضائع', en: 'Goods transport' } },

  // --- Gardening -------------------------------------------------------------
  { slug: 'jardinage', parentSlug: null, icon: 'leaf-outline', name: { fr: 'Jardinage & Espaces verts', ar: 'البستنة والمساحات الخضراء', en: 'Gardening & Landscaping' }, typicalBudgetMad: { min: 400, max: 50000 } },
  { slug: 'entretien-jardin', parentSlug: 'jardinage', icon: 'leaf-outline', name: { fr: 'Entretien de jardin', ar: 'صيانة الحديقة', en: 'Garden maintenance' } },
  { slug: 'arrosage-automatique', parentSlug: 'jardinage', icon: 'water-outline', name: { fr: 'Arrosage automatique', ar: 'السقي الآلي', en: 'Irrigation systems' } },

  // --- Appliance repair ------------------------------------------------------
  { slug: 'electromenager', parentSlug: null, icon: 'cog-outline', name: { fr: 'Électroménager & Réparation', ar: 'الأجهزة المنزلية والإصلاح', en: 'Appliance Repair' }, typicalBudgetMad: { min: 150, max: 3000 } },
  { slug: 'reparation-frigo', parentSlug: 'electromenager', icon: 'snow-outline', name: { fr: 'Réfrigérateur & congélateur', ar: 'الثلاجة والمجمد', en: 'Fridge & freezer' } },
  { slug: 'reparation-lave-linge', parentSlug: 'electromenager', icon: 'sync-outline', name: { fr: 'Lave-linge & lave-vaisselle', ar: 'الغسالة وغسالة الصحون', en: 'Washing machine & dishwasher' } },

  // --- Locksmith & metal -----------------------------------------------------
  { slug: 'serrurerie', parentSlug: null, icon: 'key-outline', name: { fr: 'Serrurerie & Ferronnerie', ar: 'الحدادة والأقفال', en: 'Locksmith & Metalwork' }, typicalBudgetMad: { min: 200, max: 25000 } },
  { slug: 'ouverture-porte', parentSlug: 'serrurerie', icon: 'lock-open-outline', name: { fr: 'Ouverture de porte & serrures', ar: 'فتح الأبواب والأقفال', en: 'Door opening & locks' } },
  { slug: 'ferronnerie', parentSlug: 'serrurerie', icon: 'hammer-outline', name: { fr: 'Portails, grilles & garde-corps', ar: 'البوابات والحواجز', en: 'Gates, grilles & railings' } },

  // --- Other trades ----------------------------------------------------------
  { slug: 'piscine', parentSlug: null, icon: 'water-outline', name: { fr: 'Piscine & Spa', ar: 'المسابح', en: 'Pools & Spa' }, typicalBudgetMad: { min: 5000, max: 400000 } },
  { slug: 'energie-solaire', parentSlug: null, icon: 'sunny-outline', name: { fr: 'Panneaux solaires & Énergie', ar: 'الألواح الشمسية والطاقة', en: 'Solar panels & Energy' }, typicalBudgetMad: { min: 8000, max: 150000 } },
  { slug: 'architecture', parentSlug: null, icon: 'pencil-outline', name: { fr: "Architecture & Bureau d'études", ar: 'الهندسة المعمارية والدراسات', en: 'Architecture & Engineering' }, typicalBudgetMad: { min: 5000, max: 200000 } },
  { slug: 'informatique', parentSlug: null, icon: 'laptop-outline', name: { fr: 'Informatique & Réseaux', ar: 'المعلوميات والشبكات', en: 'IT & Networks' }, typicalBudgetMad: { min: 200, max: 20000 } },
  { slug: 'evenementiel', parentSlug: null, icon: 'balloon-outline', name: { fr: 'Événementiel & Traiteur', ar: 'تنظيم الحفلات والتموين', en: 'Events & Catering' }, typicalBudgetMad: { min: 2000, max: 150000 } },
  { slug: 'cours-formation', parentSlug: null, icon: 'school-outline', name: { fr: 'Cours & Formation', ar: 'الدروس والتكوين', en: 'Tutoring & Training' }, typicalBudgetMad: { min: 100, max: 5000 } },
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
