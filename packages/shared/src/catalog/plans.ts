import type { LocalizedText } from '../locales.js';
import { applyVat, eurosToCents, type VatBreakdown } from '../money.js';
import type { BillingPeriod } from '../enums.js';

/**
 * Buurklus monetises the professional side only: households post jobs and
 * receive quotes for free, for good. Professionals pay one subscription, by
 * the year, that includes a quota of lead credits. One credit is spent when a
 * pro sends a quote, and is refunded if the customer cancels before awarding
 * the job. There is no commission on the work itself -- the professional
 * invoices the customer directly and Buurklus never sees that money.
 *
 * There is one paid plan rather than a ladder of them. A ladder needs a reason
 * to exist on each rung, and dressing the same product up three times to
 * manufacture one is how pricing pages become lies.
 *
 * Prices are stored excluding VAT, the way Dutch businesses quote to each
 * other; 21% btw is added at invoicing.
 *
 * There are two ways to pay for it and one price behind them: cancel-any-month
 * at the full rate, or a year up front at a lower one. A discount for
 * committing is honest; a lock-in that makes leaving hard is not, so there
 * isn't one.
 *
 * It is not on sale yet: `available` is false, every professional is on the
 * free plan, and the website says what the subscription will cost rather than
 * charging for it. It stays in this file because the billing code, the seed
 * and the tests all need something real to work against, and because switching
 * it on later must be a deliberate change to a flag rather than a rewrite.
 * Nothing outside this file may assume a paid plan exists -- read
 * AVAILABLE_PLANS, not PLANS.
 */
export interface PlanSeed {
  slug: string;
  name: LocalizedText;
  tagline: LocalizedText;
  /** Monthly price in euros, excluding VAT. Zero on a plan sold by the year. */
  monthlyPriceEur: number;
  /** Yearly price in euros, excluding VAT. What a renewal costs. */
  yearlyPriceEur: number;
  /** Which billing periods this plan can actually be bought for. */
  billingPeriods: readonly BillingPeriod[];
  /** Lead credits granted at the start of each billing month. */
  monthlyCredits: number;
  /** How many trades the pro may be listed under. */
  maxCategories: number;
  /** How many cities the pro may cover. `null` means nationwide. */
  maxCities: number | null;
  /** Ranked above cheaper plans in the customer-facing directory. */
  featured: boolean;
  /** On sale. False keeps a plan defined but hidden and unbuyable. */
  available: boolean;
  /** Leads are released to this plan before lower tiers, in minutes. */
  leadHeadStartMinutes: number;
  /** Extra logins for a company's staff, beyond the owner account. */
  teamSeats: number;
  perks: LocalizedText[];
}

/**
 * One free month, not two weeks. A tradesperson needs to see a job come in,
 * quote it, and hear back before they can judge whether Buurklus is worth
 * anything — and in a trade that runs on appointments a fortnight is often not
 * long enough for that to have happened once.
 */
export const TRIAL_DURATION_DAYS = 30;
export const TRIAL_CREDITS = 5;

/**
 * How much warning a professional gets before a plan they are on starts
 * costing money. Promising this in the terms and then honouring it is what
 * makes "free for now" a fair offer rather than a bait-and-switch.
 */
export const PRICING_NOTICE_DAYS = 30;

/** A pro whose subscription lapses keeps read access for this long. */
export const GRACE_PERIOD_DAYS = 7;

export const PLANS: readonly PlanSeed[] = [
  {
    slug: 'gratis',
    name: { nl: 'Gratis', en: 'Free' },
    tagline: {
      nl: 'Buurklus is in de opbouwfase gratis voor vakmensen',
      en: 'Buurklus is free for tradespeople while we are getting started',
    },
    monthlyPriceEur: 0,
    yearlyPriceEur: 0,
      billingPeriods: ['MONTHLY', 'YEARLY'],
    // Not a paywall but a brake: a quota this size is invisible to a working
    // professional and stops one account from carpet-bombing every job.
    monthlyCredits: 20,
    maxCategories: 5,
    maxCities: 3,
    featured: false,
    available: true,
    leadHeadStartMinutes: 0,
    teamSeats: 1,
    perks: [
      { nl: '20 offertes per maand', en: '20 quotes per month' },
      { nl: '5 vakgebieden, 3 gemeenten', en: '5 trades, 3 municipalities' },
      { nl: 'KvK-gecontroleerd profiel', en: 'Chamber of Commerce verified profile' },
      { nl: 'Geen creditcard, geen opzegtermijn', en: 'No card, no notice period' },
    ],
  },
  {
    slug: 'start',
    name: { nl: 'Start', en: 'Start' },
    tagline: {
      nl: 'Eén abonnement, maandelijks opzegbaar of een jaar vooruit',
      en: 'One subscription, cancel monthly or pay a year up front',
    },
    // Cancellable every month, or a year up front at a lower rate: 34.95 a
    // month, or 24.95 a month when the year is paid at once. The discount is
    // the reason to commit; there is no lock-in to make it stick.
    monthlyPriceEur: 34.95,
    yearlyPriceEur: 299.4,
    billingPeriods: ['MONTHLY', 'YEARLY'],
    monthlyCredits: 20,
    maxCategories: 5,
    maxCities: 3,
    featured: true,
    available: false,
    leadHeadStartMinutes: 0,
    teamSeats: 1,
    perks: [
      { nl: '20 offertes per maand', en: '20 quotes per month' },
      { nl: '5 vakgebieden, 3 gemeenten', en: '5 trades, 3 municipalities' },
      { nl: 'KvK-gecontroleerd profiel', en: 'Chamber of Commerce verified profile' },
      { nl: 'Geen commissie over je omzet', en: 'No commission on your turnover' },
      { nl: 'Je factureert de klant zelf', en: 'You invoice the customer yourself' },
    ],
  },
];

export const PLAN_BY_SLUG: ReadonlyMap<string, PlanSeed> = new Map(
  PLANS.map((plan) => [plan.slug, plan]),
);

/** A plan nobody pays for. Derived from the price, so it cannot drift. */
export function isFreePlan(plan: PlanSeed): boolean {
  return plan.monthlyPriceEur === 0 && plan.yearlyPriceEur === 0;
}

/** The plans a professional can actually be on today. */
export const AVAILABLE_PLANS: readonly PlanSeed[] = PLANS.filter((plan) => plan.available);

/** The plan a new professional lands on. */
export const DEFAULT_PLAN: PlanSeed = (() => {
  const plan = AVAILABLE_PLANS[0];
  // A build with nothing on sale is a mistake worth catching at import time
  // rather than at the first professional sign-up.
  if (!plan) throw new Error('No plan is available: at least one PlanSeed must set available: true');
  return plan;
})();

/**
 * True while nothing on sale costs money. The website, the app and the terms
 * all read this rather than each deciding for themselves whether to talk about
 * prices -- switching the paid plans back on changes every surface at once.
 */
export const PLATFORM_IS_FREE: boolean = AVAILABLE_PLANS.every(isFreePlan);

/**
 * The subscription the site announces while nothing is on sale: defined,
 * priced, and deliberately not buyable yet. Null once everything defined is
 * available, because then there is nothing left to announce — so a caller has
 * to handle its absence rather than assume a price exists to print.
 */
export const ANNOUNCED_PLAN: PlanSeed | null =
  PLANS.find((plan) => !plan.available && !isFreePlan(plan)) ?? null;

/**
 * What a year up front works out to per month. The site quotes this rather
 * than the yearly total: a professional compares it against the monthly rate,
 * and meets the total at checkout where they are deciding to pay it.
 */
export function monthlyRateOfYearly(plan: PlanSeed): number {
  return plan.yearlyPriceEur / 12;
}

/** Price of one billing period in cents, excluding VAT. */
export function planNetCents(plan: PlanSeed, period: BillingPeriod): number {
  // A plan sold by the year has no monthly price, and returning its zero would
  // quietly bill somebody nothing.
  if (!plan.billingPeriods.includes(period)) {
    throw new Error(`Plan ${plan.slug} is not sold per ${period.toLowerCase()}`);
  }
  return eurosToCents(period === 'YEARLY' ? plan.yearlyPriceEur : plan.monthlyPriceEur);
}


export function planPricing(plan: PlanSeed, period: BillingPeriod): VatBreakdown {
  return applyVat(planNetCents(plan, period));
}

/** Credits granted per invoice: a yearly subscription is billed for 12 months. */
export function planCreditsForPeriod(plan: PlanSeed, period: BillingPeriod): number {
  return period === 'YEARLY' ? plan.monthlyCredits * 12 : plan.monthlyCredits;
}

/** How much a year of monthly billing costs versus paying yearly, in percent. */
export function yearlySavingPercent(plan: PlanSeed): number {
  const monthlyTotal = plan.monthlyPriceEur * 12;
  if (monthlyTotal === 0) return 0;
  return Math.round(((monthlyTotal - plan.yearlyPriceEur) / monthlyTotal) * 100);
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
 * paying for, short enough that a zzp'er still reaches a job before the
 * household has picked someone.
 *
 * The ceiling comes from the plans on sale, not from every plan defined. While
 * the free plan is the only one available its head start is zero, so this is
 * zero and no job is held back from anybody; the delay only appears once there
 * is something to buy that removes it.
 */
export const MAX_LEAD_HEAD_START_MINUTES = AVAILABLE_PLANS.reduce(
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
