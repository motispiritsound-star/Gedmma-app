import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_BY_SLUG, ROOT_CATEGORIES, childCategories } from './categories.js';
import { CITIES, REGION_NAMES, REGIONS } from './cities.js';
import { PLANS, planCreditsForPeriod, planPricing, yearlySavingPercent } from './plans.js';
import { SUPPORTED_LOCALES } from '../locales.js';

describe('category catalog', () => {
  it('has unique slugs', () => {
    expect(CATEGORY_BY_SLUG.size).toBe(CATEGORIES.length);
  });

  it('has a name in every shipping language', () => {
    for (const category of CATEGORIES) {
      for (const locale of SUPPORTED_LOCALES) {
        expect(category.name[locale]?.length ?? 0).toBeGreaterThan(0);
      }
    }
  });

  it('points every child at an existing parent', () => {
    for (const category of CATEGORIES) {
      if (category.parentSlug === null) continue;
      expect(CATEGORY_BY_SLUG.has(category.parentSlug)).toBe(true);
    }
  });

  it('gives every root category at least one child or a sensible standalone', () => {
    expect(ROOT_CATEGORIES.length).toBeGreaterThan(10);
    expect(childCategories('plomberie').length).toBeGreaterThan(0);
  });
});

describe('city catalog', () => {
  it('has unique slugs and known regions', () => {
    const slugs = new Set(CITIES.map((city) => city.slug));
    expect(slugs.size).toBe(CITIES.length);
    for (const city of CITIES) {
      expect(REGIONS).toContain(city.region);
      expect(REGION_NAMES[city.region]).toBeDefined();
    }
  });

  it('places every city inside Morocco', () => {
    for (const city of CITIES) {
      expect(city.lat).toBeGreaterThan(20);
      expect(city.lat).toBeLessThan(36.5);
      expect(city.lng).toBeGreaterThan(-17.5);
      expect(city.lng).toBeLessThan(-0.8);
    }
  });
});

describe('subscription plans', () => {
  it('increases credits and price with each tier', () => {
    for (let i = 1; i < PLANS.length; i += 1) {
      const previous = PLANS[i - 1]!;
      const current = PLANS[i]!;
      expect(current.monthlyPriceMad).toBeGreaterThan(previous.monthlyPriceMad);
      expect(current.monthlyCredits).toBeGreaterThan(previous.monthlyCredits);
    }
  });

  it('prices a year at ten months, i.e. two months free', () => {
    for (const plan of PLANS) {
      expect(plan.yearlyPriceMad).toBe(plan.monthlyPriceMad * 10);
      expect(yearlySavingPercent(plan)).toBe(17);
    }
  });

  it('adds 20% VAT to the advertised net price', () => {
    const pro = PLANS.find((plan) => plan.slug === 'pro')!;
    expect(planPricing(pro, 'MONTHLY').grossCentimes).toBe(71_880);
    expect(planCreditsForPeriod(pro, 'YEARLY')).toBe(pro.monthlyCredits * 12);
  });
});
