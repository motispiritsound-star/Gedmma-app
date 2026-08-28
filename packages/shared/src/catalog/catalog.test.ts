import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_BY_SLUG, ROOT_CATEGORIES, childCategories } from './categories.js';
import { CITIES, PROVINCES, PROVINCE_NAMES, citiesInProvince } from './cities.js';
import { PLANS, planCreditsForPeriod, planPricing, yearlySavingPercent } from './plans.js';
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

describe('subscription plans', () => {
  it('increases credits and price with each tier', () => {
    for (let i = 1; i < PLANS.length; i += 1) {
      const previous = PLANS[i - 1]!;
      const current = PLANS[i]!;
      expect(current.monthlyPriceEur).toBeGreaterThan(previous.monthlyPriceEur);
      expect(current.monthlyCredits).toBeGreaterThan(previous.monthlyCredits);
    }
  });

  it('prices a year at ten months, i.e. two months free', () => {
    for (const plan of PLANS) {
      expect(plan.yearlyPriceEur, plan.slug).toBe(plan.monthlyPriceEur * 10);
      expect(yearlySavingPercent(plan), plan.slug).toBe(17);
    }
  });

  it('adds 21% btw to the advertised net price', () => {
    const vakman = PLANS.find((plan) => plan.slug === 'vakman')!;
    expect(planPricing(vakman, 'MONTHLY').grossCents).toBe(10_769);
    expect(planCreditsForPeriod(vakman, 'YEARLY')).toBe(vakman.monthlyCredits * 12);
  });
});
