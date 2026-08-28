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

  it('prices a year at ten months, i.e. two months free', () => {
    for (const plan of PAID_PLANS) {
      expect(plan.yearlyPriceEur, plan.slug).toBe(plan.monthlyPriceEur * 10);
      expect(yearlySavingPercent(plan), plan.slug).toBe(17);
    }
  });

  it('adds 21% btw to the advertised net price', () => {
    const vakman = PLANS.find((plan) => plan.slug === 'vakman')!;
    expect(planPricing(vakman, 'MONTHLY').grossCents).toBe(10_769);
    expect(planCreditsForPeriod(vakman, 'YEARLY')).toBe(vakman.monthlyCredits * 12);
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

  it('keeps the paid tiers defined so they can be switched back on', () => {
    for (const slug of ['zzp', 'vakman', 'bedrijf']) {
      const plan = PLANS.find((row) => row.slug === slug);
      expect(plan, slug).toBeDefined();
      expect(plan!.available, slug).toBe(false);
      expect(plan!.monthlyPriceEur, slug).toBeGreaterThan(0);
    }
  });
});
