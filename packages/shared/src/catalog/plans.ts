import type { LocalizedText } from '../locales.js';
import { applyVat, dirhamsToCentimes, type VatBreakdown } from '../money.js';
import type { BillingPeriod } from '../enums.js';

/**
 * Khidma monetises the professional side only: customers post jobs and receive
 * quotes for free, professionals pay a monthly subscription that includes a
 * quota of lead credits. One credit is spent when a pro sends a quote on a job,
 * and is refunded if the job is cancelled by the customer before any award.
 *
 * Prices are stored excluding VAT ("HT"), the way Moroccan businesses quote
 * B2B pricing; 20% TVA is added at invoicing time.
 */
export interface PlanSeed {
  slug: string;
  name: LocalizedText;
  tagline: LocalizedText;
  /** Monthly price in dirhams, excluding VAT. */
  monthlyPriceMad: number;
  /** Yearly price in dirhams, excluding VAT — two months free. */
  yearlyPriceMad: number;
  /** Lead credits granted at the start of each billing month. */
  monthlyCredits: number;
  /** How many trade categories the pro may be listed under. */
  maxCategories: number;
  /** How many cities the pro may cover. `null` means nationwide. */
  maxCities: number | null;
  /** Ranked above cheaper plans in the customer-facing pro list. */
  featured: boolean;
  /** Leads are released to this plan before lower tiers, in minutes of head start. */
  leadHeadStartMinutes: number;
  /** Extra logins for a company's staff, beyond the owner account. */
  teamSeats: number;
  perks: LocalizedText[];
}

export const TRIAL_DURATION_DAYS = 14;
export const TRIAL_CREDITS = 5;

/** A pro whose subscription lapses keeps read access for this long. */
export const GRACE_PERIOD_DAYS = 7;

export const PLANS: readonly PlanSeed[] = [
  {
    slug: 'artisan',
    name: { fr: 'Artisan', ar: 'حرفي', en: 'Artisan' },
    tagline: {
      fr: "Pour l'artisan indépendant qui démarre",
      ar: 'للحرفي المستقل في بداية الطريق',
      en: 'For the independent tradesperson starting out',
    },
    monthlyPriceMad: 249,
    yearlyPriceMad: 2490,
    monthlyCredits: 15,
    maxCategories: 2,
    maxCities: 1,
    featured: false,
    leadHeadStartMinutes: 0,
    teamSeats: 0,
    perks: [
      { fr: '15 devis par mois', ar: '15 عرض سعر شهريًا', en: '15 quotes per month' },
      { fr: '2 métiers, 1 ville', ar: 'مهنتان، مدينة واحدة', en: '2 trades, 1 city' },
      { fr: 'Profil vérifié', ar: 'ملف موثق', en: 'Verified profile' },
    ],
  },
  {
    slug: 'pro',
    name: { fr: 'Pro', ar: 'محترف', en: 'Pro' },
    tagline: {
      fr: 'Pour les équipes qui veulent remplir leur agenda',
      ar: 'للفرق التي تريد ملء جدولها',
      en: 'For teams that want a full diary',
    },
    monthlyPriceMad: 599,
    yearlyPriceMad: 5990,
    monthlyCredits: 50,
    maxCategories: 5,
    maxCities: 3,
    featured: true,
    leadHeadStartMinutes: 15,
    teamSeats: 2,
    perks: [
      { fr: '50 devis par mois', ar: '50 عرض سعر شهريًا', en: '50 quotes per month' },
      { fr: '5 métiers, 3 villes', ar: '5 مهن، 3 مدن', en: '5 trades, 3 cities' },
      {
        fr: 'Accès aux demandes 15 min avant',
        ar: 'الوصول للطلبات قبل 15 دقيقة',
        en: '15-minute head start on new jobs',
      },
      { fr: 'Badge « Pro » sur votre profil', ar: 'شارة «محترف»', en: '“Pro” badge on your profile' },
      { fr: '2 comptes collaborateurs', ar: 'حسابان للموظفين', en: '2 staff accounts' },
    ],
  },
  {
    slug: 'entreprise',
    name: { fr: 'Entreprise', ar: 'شركة', en: 'Business' },
    tagline: {
      fr: 'Pour les sociétés multi-villes et multi-métiers',
      ar: 'للشركات متعددة المدن والمهن',
      en: 'For multi-city, multi-trade companies',
    },
    monthlyPriceMad: 1290,
    yearlyPriceMad: 12900,
    monthlyCredits: 150,
    maxCategories: 15,
    maxCities: null,
    featured: true,
    leadHeadStartMinutes: 30,
    teamSeats: 10,
    perks: [
      { fr: '150 devis par mois', ar: '150 عرض سعر شهريًا', en: '150 quotes per month' },
      { fr: 'Villes illimitées', ar: 'مدن غير محدودة', en: 'Unlimited cities' },
      {
        fr: 'Accès aux demandes 30 min avant',
        ar: 'الوصول للطلبات قبل 30 دقيقة',
        en: '30-minute head start on new jobs',
      },
      { fr: 'Mise en avant dans les résultats', ar: 'الظهور في مقدمة النتائج', en: 'Featured placement' },
      { fr: '10 comptes collaborateurs', ar: '10 حسابات للموظفين', en: '10 staff accounts' },
      {
        fr: 'Facturation et conseiller dédié',
        ar: 'فوترة ومستشار مخصص',
        en: 'Invoicing and a dedicated account manager',
      },
    ],
  },
];

export const PLAN_BY_SLUG: ReadonlyMap<string, PlanSeed> = new Map(
  PLANS.map((plan) => [plan.slug, plan]),
);

/** Price of one billing period in centimes, excluding VAT. */
export function planNetCentimes(plan: PlanSeed, period: BillingPeriod): number {
  return dirhamsToCentimes(period === 'YEARLY' ? plan.yearlyPriceMad : plan.monthlyPriceMad);
}

export function planPricing(plan: PlanSeed, period: BillingPeriod): VatBreakdown {
  return applyVat(planNetCentimes(plan, period));
}

/** Credits granted per invoice: a yearly subscription is billed for 12 months. */
export function planCreditsForPeriod(plan: PlanSeed, period: BillingPeriod): number {
  return period === 'YEARLY' ? plan.monthlyCredits * 12 : plan.monthlyCredits;
}

/** How much a year of monthly billing costs versus paying yearly, in percent. */
export function yearlySavingPercent(plan: PlanSeed): number {
  const monthlyTotal = plan.monthlyPriceMad * 12;
  if (monthlyTotal === 0) return 0;
  return Math.round(((monthlyTotal - plan.yearlyPriceMad) / monthlyTotal) * 100);
}

export function addBillingPeriod(from: Date, period: BillingPeriod): Date {
  const next = new Date(from.getTime());
  if (period === 'YEARLY') next.setUTCFullYear(next.getUTCFullYear() + 1);
  else next.setUTCMonth(next.getUTCMonth() + 1);
  return next;
}

/**
 * Leads are staged rather than broadcast: the highest tier sees a new job the
 * moment it is published, and every other tier after its head start has been
 * used up. The ceiling is deliberately half an hour — long enough to be worth
 * paying for, short enough that an entry-tier artisan still reaches a job
 * before the customer has picked someone. Expressed relative to the best plan, a pro whose plan grants `H`
 * minutes of head start sees the job `MAX_LEAD_HEAD_START_MINUTES - H` minutes
 * after publication.
 */
export const MAX_LEAD_HEAD_START_MINUTES = PLANS.reduce(
  (max, plan) => Math.max(max, plan.leadHeadStartMinutes),
  0,
);

export function leadDelayMinutes(planHeadStartMinutes: number): number {
  return Math.max(0, MAX_LEAD_HEAD_START_MINUTES - planHeadStartMinutes);
}

/** The moment a job becomes visible to a pro on a plan with this head start. */
export function leadVisibleFrom(publishedAt: Date, planHeadStartMinutes: number): Date {
  return new Date(publishedAt.getTime() + leadDelayMinutes(planHeadStartMinutes) * 60_000);
}
