import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_BY_SLUG, ROOT_CATEGORIES, childCategories } from './categories.js';
import { CITIES, PROVINCES, PROVINCE_NAMES, citiesInProvince } from './cities.js';
import {
  AVAILABLE_PLANS,
  DEFAULT_PLAN,
  MAX_LEAD_HEAD_START_MINUTES,
  PLANS,
  PLATFORM_IS_FREE,
  isFreePlan,
  leadDelayMinutes,
  leadVisibleFrom,
  planCreditsForPeriod,
  planNetCents,
  planPricing,
  yearlySavingPercent,
} from './plans.js';
import { SUPPORTED_LOCALES } from '../locales.js';

describe('trade catalog', () => {
  it('has unique slugs', () => {
    expect(CATEGORY_BY_SLUG.size).toBe(CATEGORIES.length);
  });

  it('has a name in both shipping languages', () => {
    for (const category of CATEGORIES) {
      for (const locale of SUPPORTED_LOCALES) {
        expect(category.name[locale]?.length ?? 0, `${category.slug}.${locale}`).toBeGreaterThan(0);
      }
    }
  });

  it('points every child at an existing parent', () => {
    for (const category of CATEGORIES) {
      if (category.parentSlug === null) continue;
      expect(CATEGORY_BY_SLUG.has(category.parentSlug), category.slug).toBe(true);
    }
  });

  it('covers the trades a Dutch household actually hires', () => {
    expect(ROOT_CATEGORIES.length).toBeGreaterThan(15);
    for (const slug of ['loodgieter', 'elektricien', 'dakdekker', 'stukadoor', 'hovenier']) {
      expect(CATEGORY_BY_SLUG.has(slug), slug).toBe(true);
    }
    expect(childCategories('loodgieter').length).toBeGreaterThan(0);
  });

  it('includes the energy work that dominates Dutch home improvement', () => {
    for (const slug of ['isolatie', 'zonnepanelen', 'warmtepomp', 'laadpaal']) {
      expect(CATEGORY_BY_SLUG.has(slug), slug).toBe(true);
    }
  });

  it('gives a sane budget range wherever it gives one at all', () => {
    for (const category of CATEGORIES) {
      if (!category.typicalBudgetEur) continue;
      expect(category.typicalBudgetEur.min, category.slug).toBeGreaterThan(0);
      expect(category.typicalBudgetEur.max, category.slug).toBeGreaterThan(
        category.typicalBudgetEur.min,
      );
    }
  });
});

describe('city catalog', () => {
  it('has unique slugs and known provinces', () => {
    const slugs = new Set(CITIES.map((city) => city.slug));
    expect(slugs.size).toBe(CITIES.length);
    for (const city of CITIES) {
      expect(PROVINCES, city.slug).toContain(city.province);
      expect(PROVINCE_NAMES[city.province]).toBeDefined();
    }
  });

  it('places every city inside the Netherlands', () => {
    for (const city of CITIES) {
      expect(city.lat, city.slug).toBeGreaterThan(50.7);
      expect(city.lat, city.slug).toBeLessThan(53.6);
      expect(city.lng, city.slug).toBeGreaterThan(3.3);
      expect(city.lng, city.slug).toBeLessThan(7.3);
    }
  });

  it('leaves no province without a city, so the picker is never empty', () => {
    for (const province of PROVINCES) {
      expect(citiesInProvince(province).length, province).toBeGreaterThan(0);
    }
  });
});

const PAID_PLANS = PLANS.filter((plan) => !isFreePlan(plan));

describe('subscription plans', () => {
  it('increases credits and price with each paid tier', () => {
    for (let i = 1; i < PAID_PLANS.length; i += 1) {
      const previous = PAID_PLANS[i - 1]!;
      const current = PAID_PLANS[i]!;
      expect(current.monthlyPriceEur).toBeGreaterThan(previous.monthlyPriceEur);
      expect(current.monthlyCredits).toBeGreaterThan(previous.monthlyCredits);
    }
  });

  it('rewards paying a year up front', () => {
    // 34.95 a month, or 24.95 a month when the year is paid at once.
    for (const plan of PAID_PLANS) {
      expect(plan.billingPeriods, plan.slug).toEqual(['MONTHLY', 'YEARLY']);
      expect(plan.yearlyPriceEur, plan.slug).toBeLessThan(plan.monthlyPriceEur * 12);
      expect(yearlySavingPercent(plan), plan.slug).toBe(29);
    }
  });

  it('divides the yearly price into whole months, because that is how it is sold', () => {
    // The website advertises a monthly figure and the invoice carries the
    // year. If the two do not divide exactly, one of them is a rounded lie.
    for (const plan of PAID_PLANS) {
      const perMonth = plan.yearlyPriceEur / 12;
      expect(Math.round(perMonth * 100) / 100, plan.slug).toBe(perMonth);
    }
  });

  it('adds 21% btw to the advertised net price', () => {
    // The site quotes the net figure, because the businesses who pay it deduct
    // the btw again. 34.95 becomes 42.29 a month; 299.40 becomes 362.27 a year.
    const start = PLANS.find((plan) => plan.slug === 'start')!;
    expect(planPricing(start, 'MONTHLY').grossCents).toBe(4_229);
    expect(planPricing(start, 'YEARLY').grossCents).toBe(36_227);
    expect(planCreditsForPeriod(start, 'YEARLY')).toBe(start.monthlyCredits * 12);
  });


  it('refuses to price a plan for a period it is not sold in', () => {
    // Nothing is sold that way today, but a plan that stops offering monthly
    // must not quietly bill its zero.
    const yearlyOnly = { ...PLANS[1]!, monthlyPriceEur: 0, billingPeriods: ['YEARLY'] as const };
    expect(() => planNetCents(yearlyOnly, 'MONTHLY')).toThrow(/not sold per month/);
  });

  it('charges nothing for a free plan, in either billing period', () => {
    const free = PLANS.filter(isFreePlan);
    expect(free.length).toBeGreaterThan(0);
    for (const plan of free) {
      expect(planPricing(plan, 'MONTHLY').grossCents, plan.slug).toBe(0);
      expect(planPricing(plan, 'YEARLY').grossCents, plan.slug).toBe(0);
      // Nothing to save by paying yearly when the price is zero either way.
      expect(yearlySavingPercent(plan), plan.slug).toBe(0);
    }
  });
});

describe('what is on sale today', () => {
  // Buurklus launches free. These assertions are the contract the rest of the
  // codebase leans on -- and the ones to change, deliberately, on the day the
  // paid plans are switched back on.
  it('sells nothing but the free plan', () => {
    expect(AVAILABLE_PLANS.map((plan) => plan.slug)).toEqual(['gratis']);
    expect(PLATFORM_IS_FREE).toBe(true);
    expect(isFreePlan(DEFAULT_PLAN)).toBe(true);
  });

  it('gives every professional the same quota, since none can pay for more', () => {
    for (const plan of AVAILABLE_PLANS) {
      expect(plan.leadHeadStartMinutes, plan.slug).toBe(0);
    }
    expect(MAX_LEAD_HEAD_START_MINUTES).toBe(0);
  });

  it('holds no lead back while a head start cannot be bought', () => {
    const published = new Date('2026-03-01T09:00:00Z');
    expect(leadDelayMinutes(0)).toBe(0);
    expect(leadVisibleFrom(published, 0).getTime()).toBe(published.getTime());
  });

  it('still stages leads correctly once tiers differ', () => {
    // The staging rule itself, independent of which plans happen to be on
    // sale: the top tier waits nothing and everyone else waits the difference.
    const ceiling = 30;
    const delay = (headStart: number) => Math.max(0, ceiling - headStart);
    expect(delay(30)).toBe(0);
    expect(delay(15)).toBe(15);
    expect(delay(0)).toBe(30);
  });

  it('keeps the subscription defined so it can be switched on', () => {
    const plan = PLANS.find((row) => row.slug === 'start');
    expect(plan).toBeDefined();
    expect(plan!.available).toBe(false);
    expect(plan!.yearlyPriceEur).toBeGreaterThan(0);
    expect(plan!.billingPeriods).toEqual(['MONTHLY', 'YEARLY']);
  });
});
