import { describe, expect, it } from 'vitest';
import {
  CITIES,
  PLANS,
  ROOT_CATEGORIES,
  SUPPORTED_LOCALES,
  applyVat,
  dirhamsToCentimes,
  localize,
} from '@khidma/shared';
import { COPY } from './content.js';
import { esc, renderHome, renderPro, renderRootRedirect, renderSitemap } from './render.js';

const pages = SUPPORTED_LOCALES.flatMap((locale) => [
  { locale, name: `${locale} home`, html: renderHome(locale) },
  { locale, name: `${locale} pro`, html: renderPro(locale) },
]);

describe('every page', () => {
  it('declares its language and reading direction', () => {
    for (const page of pages) {
      const dir = page.locale === 'ar' ? 'rtl' : 'ltr';
      expect(page.html, page.name).toContain(`<html lang="${page.locale}" dir="${dir}">`);
    }
  });

  it('has exactly one h1 and a description', () => {
    for (const page of pages) {
      expect((page.html.match(/<h1>/g) ?? []).length, page.name).toBe(1);
      expect(page.html, page.name).toMatch(/<meta name="description" content="[^"]{60,}">/);
    }
  });

  it('points at every other language and at a default', () => {
    for (const page of pages) {
      for (const other of SUPPORTED_LOCALES) {
        expect(page.html, `${page.name} -> ${other}`).toContain(`hreflang="${other}"`);
      }
      expect(page.html, page.name).toContain('hreflang="x-default"');
    }
  });

  it('leaves no unresolved placeholder', () => {
    for (const page of pages) {
      expect(page.html, page.name).not.toMatch(/\{\{\w+\}\}/);
      expect(page.html, page.name).not.toContain('undefined');
      expect(page.html, page.name).not.toContain('NaN');
    }
  });
});

describe('content coming from @khidma/shared', () => {
  it('lists trades in the page language, not in French three times', () => {
    const plumbing = ROOT_CATEGORIES.find((category) => category.slug === 'plomberie')!;
    expect(renderHome('fr')).toContain(esc(localize(plumbing.name, 'fr')));
    expect(renderHome('ar')).toContain(esc(localize(plumbing.name, 'ar')));
    expect(renderHome('en')).toContain(esc(localize(plumbing.name, 'en')));
  });

  it('names real Moroccan cities', () => {
    const casablanca = CITIES.find((city) => city.slug === 'casablanca')!;
    expect(renderHome('fr')).toContain(esc(localize(casablanca.name, 'fr')));
    expect(renderHome('ar')).toContain(esc(localize(casablanca.name, 'ar')));
  });

  it('quotes the same prices the app charges, with VAT beneath', () => {
    const html = renderPro('fr');
    for (const plan of PLANS) {
      const net = dirhamsToCentimes(plan.monthlyPriceMad);
      const gross = applyVat(net).grossCentimes;
      // Compare on digits: the currency formatter inserts its own separators.
      const digits = (value: number) => String(Math.round(value / 100));
      expect(html.replace(/[^\d<>="/\w]/g, ''), plan.slug).toContain(digits(net));
      expect(html.replace(/[^\d<>="/\w]/g, ''), plan.slug).toContain(digits(gross));
    }
  });

  it('describes the plan limits exactly as the plans define them', () => {
    const html = renderPro('en');
    const pro = PLANS.find((plan) => plan.slug === 'pro')!;
    expect(html).toContain(`${pro.monthlyCredits} quotes per month`);
    expect(html).toContain(`${pro.leadHeadStartMinutes}-minute head start`);
    expect(renderPro('en')).toContain('Unlimited cities');
  });
});

describe('the pricing table', () => {
  it('recommends exactly one plan', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderPro(locale);
      const badge = COPY[locale].pro.pricing.popular;
      const occurrences = html.split(esc(badge)).length - 1;
      expect(occurrences, `${locale} badges`).toBe(1);
    }
  });

  it('offers every plan the professional can actually buy', () => {
    const html = renderPro('fr');
    for (const plan of PLANS) {
      expect(html, plan.slug).toContain(esc(localize(plan.name, 'fr')));
    }
  });
});

describe('copy', () => {
  it('is filled in for all three languages', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const copy = COPY[locale];
      expect(copy.hero.title.length, locale).toBeGreaterThan(10);
      expect(copy.faq.items.length, locale).toBeGreaterThanOrEqual(4);
      expect(copy.pro.faq.items.length, locale).toBeGreaterThanOrEqual(4);
    }
  });

  it('asks and answers the same questions in every language', () => {
    const counts = SUPPORTED_LOCALES.map((locale) => COPY[locale].faq.items.length);
    expect(new Set(counts).size).toBe(1);
    const proCounts = SUPPORTED_LOCALES.map((locale) => COPY[locale].pro.faq.items.length);
    expect(new Set(proCounts).size).toBe(1);
  });

  it('escapes anything that could break the markup', () => {
    expect(esc('<script>alert("x")</script>')).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;',
    );
  });
});

describe('crawlability', () => {
  it('lists every page in the sitemap', () => {
    const sitemap = renderSitemap();
    for (const locale of SUPPORTED_LOCALES) {
      expect(sitemap).toContain(`/${locale}/`);
      expect(sitemap).toContain(`/${locale}/pro/`);
    }
  });

  it('keeps the language chooser out of the index', () => {
    expect(renderRootRedirect()).toContain('name="robots" content="noindex"');
    // It must still work without JavaScript.
    expect(renderRootRedirect()).toContain('http-equiv="refresh"');
  });
});
