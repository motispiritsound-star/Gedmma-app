import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  TRIAL_DURATION_DAYS,
  ANNOUNCED_PLAN,
  AVAILABLE_PLANS,
  CITIES,
  DEFAULT_PLAN,
  LEGAL_PAGES,
  MINIMUM_AGE,
  PLANS,
  PLATFORM_IS_FREE,
  PRICING_NOTICE_DAYS,
  RETENTION,
  ROOT_CATEGORIES,
  SUPPORTED_LOCALES,
  applyVat,
  eurosToCents,
  legalPath,
  localize,
  missingOperatorFields,
  monthlyRateOfYearly,
} from '@buurklus/shared';
import { COPY } from './content.js';
import { inlineScriptHashes, renderHeaders } from './edge.js';
import {
  CONTACT_ENDPOINT,
  contactUrl,
  renderContact,
  SIGNUP_ENDPOINT,
  esc,
  joinUrl,
  mailFallback,
  money,
  analyticsToken,
  renderHome,
  SITE_URL,
  renderManifest,
  renderNotFound,
  renderJoin,
  renderLegal,
  renderPro,
  renderRootRedirect,
  renderSitemap,
  renderStyles,
} from './render.js';
import { CONTACT_COPY } from './contact-content.js';
import { JOIN_COPY } from './join-content.js';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

const legalPages = SUPPORTED_LOCALES.flatMap((locale) =>
  LEGAL_PAGES.map((document) => ({
    locale,
    key: document.key,
    name: `${locale} ${document.key}`,
    html: renderLegal(document.key, locale),
  })),
);

const pages = [
  ...SUPPORTED_LOCALES.flatMap((locale) => [
    { locale, name: `${locale} home`, html: renderHome(locale) },
    { locale, name: `${locale} pro`, html: renderPro(locale) },
    { locale, name: `${locale} join`, html: renderJoin(locale) },
  ]),
  ...legalPages.map(({ locale, name, html }) => ({ locale, name, html })),
];

describe('every page', () => {
  it('declares its language', () => {
    for (const page of pages) {
      expect(page.html, page.name).toContain(`<html lang="${page.locale}">`);
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

describe('content coming from @buurklus/shared', () => {
  it('lists trades in the page language, not in Dutch twice', () => {
    const plumbing = ROOT_CATEGORIES.find((category) => category.slug === 'loodgieter')!;
    expect(renderHome('nl')).toContain(esc(localize(plumbing.name, 'nl')));
    expect(renderHome('en')).toContain(esc(localize(plumbing.name, 'en')));
    // The Dutch and English names differ, so this would catch a page rendered
    // in the wrong language.
    expect(localize(plumbing.name, 'nl')).not.toBe(localize(plumbing.name, 'en'));
  });

  it('names real Dutch municipalities', () => {
    const utrecht = CITIES.find((city) => city.slug === 'utrecht')!;
    expect(renderHome('nl')).toContain(esc(localize(utrecht.name, 'nl')));
    expect(renderHome('en')).toContain(esc(localize(utrecht.name, 'en')));
  });

  it('quotes the same prices the app charges, with VAT beneath', () => {
    const html = renderPro('nl');
    for (const plan of AVAILABLE_PLANS) {
      const net = eurosToCents(plan.monthlyPriceEur);
      const gross = applyVat(net).grossCents;
      // Compare on digits: the currency formatter inserts its own separators.
      const digits = (value: number) => String(Math.round(value / 100));
      expect(html.replace(/[^\d<>="/\w]/g, ''), plan.slug).toContain(digits(net));
      expect(html.replace(/[^\d<>="/\w]/g, ''), plan.slug).toContain(digits(gross));
    }
  });
});

describe('the pricing section', () => {
  it('states what the subscription costs, and offers no way to pay yet', () => {
    // The price is on the page on purpose: somebody deciding to join deserves
    // to know what it becomes. What must not be there is a way to buy it, or
    // the price without the promise that goes with it.
    const plan = ANNOUNCED_PLAN;
    expect(plan, 'a plan to announce').not.toBeNull();

    for (const locale of SUPPORTED_LOCALES) {
      const html = renderPro(locale);
      const monthly = money(eurosToCents(plan!.monthlyPriceEur), locale);
      const yearly = money(eurosToCents(monthlyRateOfYearly(plan!)), locale);

      expect(html, `${locale} monthly rate`).toContain(esc(monthly));
      expect(html, `${locale} yearly rate`).toContain(esc(yearly));

      // Both rates are per month. The yearly total belongs at checkout.
      expect(html, `${locale} yearly total`).not.toContain(
        esc(money(eurosToCents(plan!.yearlyPriceEur), locale)),
      );

      // And the price never appears without the notice that protects it.
      expect(html, `${locale} notice`).toContain(String(PRICING_NOTICE_DAYS));
      expect(html, `${locale} trial month`).toContain(esc(COPY[locale].pro.pricing.offer.badge));
    }
  });

  it('offers no way to pay while nothing is on sale', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderPro(locale);
      // No checkout, no card, no plan chooser — the only button is sign-up.
      expect(html, locale).not.toMatch(/href="[^"]*\/(checkout|betalen|abonnement)/);
      expect(html, locale).toContain(`href="${joinUrl(locale)}"`);
    }
  });

  it('states the free quota the API actually grants', () => {
    expect(PLATFORM_IS_FREE).toBe(true);
    expect(renderPro('en')).toContain(`${DEFAULT_PLAN.monthlyCredits} quotes a month`);
    expect(renderPro('nl')).toContain(`${DEFAULT_PLAN.monthlyCredits} offertes per maand`);
  });

  it('promises notice before it starts charging, in both languages', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(renderPro(locale), locale).toContain(String(PRICING_NOTICE_DAYS));
    }
  });

  it('carries exactly one badge, on the plan being pushed', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderPro(locale);
      expect(html.split('plan__badge').length - 1, `${locale} badges`).toBe(1);
      expect(html, locale).toContain(esc(COPY[locale].pro.pricing.offer.badge));
      // And the "most chosen" badge is gone while there is nothing to choose.
      expect(html, locale).not.toContain(esc(COPY[locale].pro.pricing.popular));
    }
  });

  it('explains no way to pay, because there is nothing to pay', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderPro(locale).toLowerCase();
      // Naming a payment method implies a charge is coming. "No credit card"
      // is the opposite claim and stays, so the list is only methods.
      for (const method of ['incasso', 'direct debit', 'bankoverschrijving', 'bank transfer']) {
        expect(html.includes(method), `${locale} mentions ${method}`).toBe(false);
      }
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

  it('never leaves the old brand name on a page', () => {
    for (const page of pages) {
      expect(page.html.toLowerCase(), page.name).not.toContain('khidma');
    }
  });

  it('keeps the language chooser out of the index', () => {
    expect(renderRootRedirect()).toContain('name="robots" content="noindex"');
    // It must still work without JavaScript.
    expect(renderRootRedirect()).toContain('http-equiv="refresh"');
  });
});

describe('privacy of the served pages', () => {
  // Every host a page contacts sees the visitor's IP address before the
  // visitor has agreed to anything. Google Fonts was the first such request
  // this site made; this test is here so it does not come back unnoticed, and
  // so a tag manager, an analytics snippet or an embedded map cannot slip in
  // without someone deciding to weaken this assertion on purpose.
  const ALLOWED_EXTERNAL_HOSTS: string[] = [];

  /**
   * Hosts the browser will contact on its own, before the reader does
   * anything: script and image sources, form targets, and <link> elements.
   * A plain <a href> is not one of these -- the privacy statement links to
   * the supervisory authority on purpose, and following it is the reader's
   * decision, not a request the page makes for them.
   */
  const hostsIn = (html: string) => {
    const fromAttributes = [...html.matchAll(/(?:src|action)="(https?:)?\/\/([^/"]+)/g)];
    const fromLinkTags = [...html.matchAll(/<link[^>]+href="(https?:)?\/\/([^/"]+)/g)];
    return [...fromAttributes, ...fromLinkTags].flatMap((match) => match[2] ?? []);
  };

  it('contacts no third party from any page', () => {
    for (const page of [...pages, { name: 'index', html: renderRootRedirect() }]) {
      const foreign = hostsIn(page.html).filter(
        (host) => !ALLOWED_EXTERNAL_HOSTS.includes(host) && !host.endsWith('buurklus.nl'),
      );
      expect(foreign, page.name).toEqual([]);
    }
  });

  it('serves its own fonts', () => {
    const css = renderStyles();
    expect(css).toContain('@font-face');
    expect(css).toContain('/fonts/inter-latin.woff2');
    expect(css).not.toContain('fonts.googleapis.com');
    expect(css).not.toContain('fonts.gstatic.com');
  });
});

describe('the legal pages', () => {
  it('publishes every document in every language', () => {
    expect(legalPages).toHaveLength(LEGAL_PAGES.length * SUPPORTED_LOCALES.length);
    for (const page of legalPages) {
      expect(page.html, page.name).toContain('<h1>');
      expect(page.html.length, page.name).toBeGreaterThan(3000);
    }
  });

  it('translates section for section, so neither language is missing a clause', () => {
    // A term that exists in Dutch and not in English is not a translation,
    // it is a different contract for English-speaking users.
    for (const document of LEGAL_PAGES) {
      const counts = SUPPORTED_LOCALES.map(
        (locale) => renderLegal(document.key, locale).split('<h2>').length,
      );
      expect(new Set(counts).size, document.key).toBe(1);
    }
  });

  it('says which language version prevails', () => {
    for (const page of legalPages) {
      expect(page.html, page.name).toMatch(/Nederlandse|Dutch text prevails/);
    }
  });

  it('states the version of the document on the page itself', () => {
    for (const document of LEGAL_PAGES) {
      for (const locale of SUPPORTED_LOCALES) {
        expect(renderLegal(document.key, locale), `${document.key} ${locale}`).toContain(
          `datetime="${document.version}"`,
        );
      }
    }
  });

  it('generates the retention table from the code that does the deleting', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderLegal('PRIVACY', locale);
      for (const rule of RETENTION) {
        // The page cannot promise a period the sweep does not enforce,
        // because both read the same list.
        expect(html, `${locale} ${rule.key}`).toContain(esc(rule.reason[locale]));
      }
    }
  });

  it('says who is responsible and how to reach them, in sentences', () => {
    // The company details are not published, so the section carries the answer
    // itself rather than a list with holes in it: who decides what happens to
    // the data, and the way to ask about it.
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderLegal('PRIVACY', locale);
      const responsible = locale === 'nl' ? 'verantwoordelijk' : 'responsible';
      const route = locale === 'nl' ? 'contactformulier' : 'contact form';
      expect(html.toLowerCase(), `${locale} responsible`).toContain(responsible);
      expect(html.toLowerCase(), `${locale} route`).toContain(route);
      // No dangling colon left over from the list that used to follow it.
      expect(html, `${locale} no list intro`).not.toContain('Voor Buurklus is dat:');
      expect(html, `${locale} no warning`).not.toContain('notice--warn');
    }
  });

  it('makes its case in plain language, without citing articles', () => {
    // Article numbers are for lawyers checking the work; the people reading
    // this want to know what happens to their data. The obligation is to be
    // clear, and a table cell reading "art. 6 lid 1 sub f" is not.
    const citation = /\bart(?:icle|\.)\s*\d|\blid \d|\(\d+\)\(\w\)/i;
    for (const key of LEGAL_PAGES.map((page) => page.key)) {
      for (const locale of SUPPORTED_LOCALES) {
        const text = renderLegal(key, locale).replace(/<[^>]+>/g, ' ');
        const hit = citation.exec(text);
        expect(hit?.[0], `${key} ${locale}`).toBe(undefined);
      }
    }
  });

  it('names one minimum age, taken from the constant', () => {
    for (const key of ['TERMS', 'PRIVACY'] as const) {
      for (const locale of SUPPORTED_LOCALES) {
        expect(renderLegal(key, locale), `${key} ${locale}`).toContain(String(MINIMUM_AGE));
      }
    }
  });

  it('points at the supervisory authority people can complain to', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(renderLegal('PRIVACY', locale), locale).toContain('autoriteitpersoonsgegevens.nl');
    }
  });

  it('links every document from every other one, and from the footer', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const home = renderHome(locale);
      for (const document of LEGAL_PAGES) {
        const path = legalPath(document.key, locale);
        expect(home, `footer ${locale} ${document.key}`).toContain(`href="${path}"`);
        for (const other of LEGAL_PAGES.filter((row) => row.key !== document.key)) {
          expect(
            renderLegal(other.key, locale),
            `${other.key} -> ${document.key}`,
          ).toContain(`href="${path}"`);
        }
      }
    }
  });

  it('lists every legal page in the sitemap', () => {
    const sitemap = renderSitemap();
    // The namespace is plural; a crawler reading the singular indexes nothing.
    expect(sitemap).toContain('http://www.sitemaps.org/schemas/sitemap/0.9');
    for (const locale of SUPPORTED_LOCALES) {
      for (const document of LEGAL_PAGES) {
        expect(sitemap, `${locale} ${document.key}`).toContain(legalPath(document.key, locale));
      }
    }
  });

  it('says the platform is free and that notice comes before that changes', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const terms = renderLegal('TERMS', locale);
      expect(terms, locale).toContain(String(PRICING_NOTICE_DAYS));
    }
  });

  it('does not claim a cookie banner it does not show', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const cookies = renderLegal('COOKIES', locale);
      expect(cookies, locale).toMatch(/geen toestemming|no consent/);
      // And the page itself sets nothing that would need one.
      expect(cookies, locale).not.toContain('googletagmanager');
    }
  });
});

describe('the registration page', () => {
  it('gives each language a slug in its own language', () => {
    expect(joinUrl('nl')).toBe('/nl/aanmelden/');
    expect(joinUrl('en')).toBe('/en/join/');
  });

  it('leads every call to action on the site to it', () => {
    // A button marked "sign up" that goes nowhere is the fastest way to lose
    // somebody who had already decided.
    for (const locale of SUPPORTED_LOCALES) {
      const target = `href="${joinUrl(locale)}"`;
      expect(renderHome(locale), `${locale} home`).toContain(target);
      expect(renderPro(locale), `${locale} pro`).toContain(target);
    }
  });

  it('leaves no link pointing at nothing', () => {
    for (const page of pages) {
      expect(page.html, page.name).not.toContain('href="#"');
    }
  });

  it('asks a professional for what a professional needs, and nobody else', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderJoin(locale);
      // The KvK field and the trades ship with the page and are revealed by
      // the choice, rather than living on a second page half the visitors
      // would never reach.
      expect(html, locale).toContain('data-role="PRO"');
      expect(html, locale).toContain('name="kvk"');
      expect(html, locale).toContain('name="categorySlugs"');
    }
  });

  it('offers every municipality and every trade the catalog knows', () => {
    const html = renderJoin('nl');
    for (const city of CITIES) {
      expect(html, city.slug).toContain(`value="${city.slug}"`);
    }
    for (const category of ROOT_CATEGORIES) {
      expect(html, category.slug).toContain(`value="${category.slug}"`);
    }
  });

  it('carries an unticked consent box and links the privacy statement beside it', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderJoin(locale);
      expect(html, locale).toContain('id="consent"');
      // A pre-ticked box is not consent, so the attribute must not be there.
      expect(html, locale).not.toMatch(/id="consent"[^>]*checked/);
      expect(html, locale).toContain(`href="${legalPath('PRIVACY', locale)}"`);
    }
  });

  it('hides a honeypot that a person will never see', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderJoin(locale);
      expect(html, locale).toContain('name="website"');
      expect(html, locale).toContain('class="honeypot"');
      expect(html, locale).toContain('tabindex="-1"');
    }
  });

  it('says what happens when the form cannot run', () => {
    for (const locale of SUPPORTED_LOCALES) {
      // Without JavaScript the button cannot submit; a page that pretends
      // otherwise loses the registration silently.
      expect(renderJoin(locale), locale).toContain('<noscript>');
      expect(renderJoin(locale), locale).toContain(
        esc(JOIN_COPY[locale].states.noScript),
      );
    }
  });

  it('posts to one place, its own origin, and never to a third party', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderJoin(locale);
      const posts = [...html.matchAll(/fetch\(config\.api/g)];
      expect(posts.length, locale).toBe(1);
      expect(html, locale).toContain(SIGNUP_ENDPOINT);
      expect(html, locale).not.toMatch(/fetch\(['"`]https?:/);
    }
  });

  it('promises nothing about the address it does not keep', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const copy = JOIN_COPY[locale];
      expect(copy.promise.items.length, locale).toBeGreaterThanOrEqual(3);
      expect(renderJoin(locale), locale).toContain(esc(copy.promise.items[0]!));
    }
  });

  it('is in the sitemap in both languages', () => {
    const sitemap = renderSitemap();
    for (const locale of SUPPORTED_LOCALES) {
      expect(sitemap, locale).toContain(joinUrl(locale));
    }
  });
});

describe('sharing a link', () => {
  it('gives every page a card, so a share is never a grey rectangle', () => {
    for (const page of pages) {
      expect(page.html, page.name).toMatch(/<meta property="og:image" content="https:[^"]+\.png">/);
      expect(page.html, page.name).toContain('<meta property="og:image:width" content="1200">');
      expect(page.html, page.name).toContain('name="twitter:card" content="summary_large_image"');
    }
  });

  it('points each page at the card that was actually drawn for it', () => {
    // The images are generated by scripts/make-brand-assets.mjs; a page
    // naming one that does not exist shares as a broken image.
    const drawn = new Set([
      'og-nl-home.png',
      'og-nl-pro.png',
      'og-nl-join.png',
      'og-en-home.png',
      'og-en-pro.png',
      'og-en-join.png',
    ]);
    for (const page of pages) {
      const match = /og:image" content="[^"]+\/og\/([^"]+)"/.exec(page.html);
      expect(match, page.name).not.toBeNull();
      expect(drawn.has(match![1]!), `${page.name} -> ${match![1]}`).toBe(true);
    }
  });

  it('uses the right language card on the right language page', () => {
    expect(renderHome('nl')).toContain('/og/og-nl-home.png');
    expect(renderHome('en')).toContain('/og/og-en-home.png');
    expect(renderPro('nl')).toContain('/og/og-nl-pro.png');
    expect(renderJoin('en')).toContain('/og/og-en-join.png');
  });

  it('carries an icon a browser and a home screen can use', () => {
    for (const page of pages) {
      expect(page.html, page.name).toContain('rel="icon" href="/favicon.svg"');
      expect(page.html, page.name).toContain('rel="apple-touch-icon"');
      expect(page.html, page.name).toContain('rel="manifest"');
    }
  });

  it('describes itself to a search engine, truthfully', () => {
    for (const page of pages) {
      expect(page.html, page.name).toContain('application/ld+json');
    }

    const home = renderHome('nl');
    const blocks = [...home.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)].map(
      (match) => JSON.parse(match[1]!.replace(/<\\\//g, '</')),
    );
    const types = blocks.map((block) => block['@type']);
    expect(types).toContain('Organization');
    // The FAQ is marked up only where a visitor can actually read it.
    expect(types).toContain('FAQPage');
    const faq = blocks.find((block) => block['@type'] === 'FAQPage');
    expect(faq.mainEntity).toHaveLength(COPY.nl.faq.items.length);
    for (const item of COPY.nl.faq.items) {
      expect(home, item.q).toContain(esc(item.q));
    }
    expect(renderPro('nl')).not.toContain('FAQPage');
  });

  it('ships a manifest that matches the icons on disk', () => {
    const manifest = JSON.parse(renderManifest());
    expect(manifest.name).toBe('Buurklus');
    expect(manifest.start_url).toBe('/nl/');
    expect(manifest.icons.map((icon: { src: string }) => icon.src)).toEqual([
      '/icons/icon-192.png',
      '/icons/icon-512.png',
      '/favicon.svg',
    ]);
  });

  it('sends a mistyped link somewhere useful instead of nowhere', () => {
    const page = renderNotFound();
    expect(page).toContain('name="robots" content="noindex"');
    expect(page).toContain('href="/nl/"');
    expect(page).toContain(`href="${joinUrl('nl')}"`);
    expect(page).toContain('href="/en/"');
  });
});

describe('the explainer on the home page', () => {
  it('shows the film on the home page and nowhere else', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(renderHome(locale), locale).toContain('<video');
      expect(renderPro(locale), locale).not.toContain('<video');
      expect(renderJoin(locale), locale).not.toContain('<video');
    }
  });

  it('loads three megabytes only when somebody asks for them', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderHome(locale);
      // preload="none" plus a poster: the page costs one 60 kB frame until
      // the play button is pressed.
      expect(html, locale).toContain('preload="none"');
      expect(html, locale).toContain('poster="/video/buurklus-poster.jpg"');
      // The film has sound. A page that starts talking on its own is a page
      // people close. Matched on the opening tag rather than on the word,
      // which also appears in the comment above it explaining the decision.
      const tag = /<video\b[^>]*>/.exec(html)?.[0] ?? '';
      expect(tag, locale).not.toMatch(/\bautoplay\b/);
      expect(tag, locale).toMatch(/\bcontrols\b/);
    }
  });

  it('offers English subtitles as a track, not as a second video', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderHome(locale);
      expect(html, locale).toContain('kind="subtitles"');
      expect(html, locale).toContain('srclang="en"');
      expect(html, locale).toContain('label="English"');
      // `default` on the track would switch them on for everybody, including
      // the Dutch readers the picture is already written for.
      expect(html, locale).not.toMatch(/<track[^>]*\bdefault\b/);
    }
  });

  it('describes the film for somebody who cannot see it', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderHome(locale);
      expect(html, locale).toContain(esc(COPY[locale].video.alt));
      // And says what to do if the browser cannot play it at all.
      expect(html, locale).toContain(esc(COPY[locale].video.unsupported));
    }
  });

  it('tells the reader the subtitles are there', () => {
    for (const locale of SUPPORTED_LOCALES) {
      // A track nobody knows about is a track nobody turns on.
      expect(renderHome(locale), locale).toContain(esc(COPY[locale].video.subtitlesNote));
    }
  });
});

describe('the files Cloudflare Pages reads', () => {
  const html = [
    renderHome('nl'),
    renderJoin('nl'),
    renderLegal('PRIVACY', 'en'),
    renderRootRedirect(),
  ].join('\n');

  it('hashes every inline script the pages carry', () => {
    const hashes = inlineScriptHashes(html);
    // The home page has the JSON-LD blocks, the sign-up page adds the form's
    // behaviour, the root page its language redirect. If this number drops,
    // a script is going out that the policy will refuse to run.
    expect(hashes.length).toBeGreaterThanOrEqual(5);
    for (const hash of hashes) expect(hash).toMatch(/^'sha256-[A-Za-z0-9+/]+=*'$/);
  });

  it('ignores scripts that are loaded from a file', () => {
    // Those are covered by 'self'; hashing them would be meaningless.
    expect(inlineScriptHashes('<script src="/a.js"></script>')).toEqual([]);
    expect(inlineScriptHashes('<script defer src="/a.js"></script>')).toEqual([]);
  });

  it('hashes the script exactly as it is served', () => {
    // Trimming here and not there is the classic way to write a policy that
    // blocks the very script it lists, so the whitespace has to survive.
    const [padded] = inlineScriptHashes('<script>  x  </script>');
    const [bare] = inlineScriptHashes('<script>x</script>');
    expect(padded).not.toEqual(bare);
  });

  it('trusts only its own origin for the forms', () => {
    const headers = renderHeaders(inlineScriptHashes(html));
    // Same origin, so nothing else needs trusting.
    expect(headers).toContain("connect-src 'self';");
    expect(headers).not.toMatch(/connect-src[^;]*https:/);
    expect(headers).toContain("default-src 'self'");
    expect(headers).toContain("object-src 'none'");
    expect(headers).toContain("frame-ancestors 'none'");
    for (const hash of inlineScriptHashes(html)) expect(headers).toContain(hash);
  });

  it('never allows inline script or style wholesale', () => {
    expect(renderHeaders(inlineScriptHashes(html))).not.toContain('unsafe-inline');
    expect(renderHeaders(inlineScriptHashes(html))).not.toContain('unsafe-eval');
  });

  it('keeps the pages revalidating and lets the fonts sit still', () => {
    const headers = renderHeaders([]);
    expect(headers).toContain('/fonts/*\n  Cache-Control: public, max-age=31536000, immutable');
    // The stylesheet has no content hash in its name, so a year would strand
    // readers on an old design.
    expect(headers).toContain('/styles.css\n  Cache-Control: public, max-age=3600');
    expect(headers).toContain('Cache-Control: public, max-age=0, must-revalidate');
  });

  it('writes no _redirects file', () => {
    // Workers rejects a full URL in _redirects, and a relative rule cannot tell
    // www from the bare domain. That redirect belongs in the dashboard, so the
    // build must not write the file at all — a rejected one fails the deploy.
    expect(existsSync(path.join(DIST, '_redirects'))).toBe(false);
  });

  it('carries no inline style attribute for the policy to trip over', () => {
    // style-src is 'self', so a single style="" anywhere breaks a page.
    for (const page of [renderHome('nl'), renderJoin('en'), renderNotFound(), renderPro('nl')]) {
      expect(page).not.toMatch(/\sstyle="/);
    }
  });
});

describe('the way out when the form cannot get through', () => {
  it('stays silent while no address is published', () => {
    // OPERATOR.email is still empty. Inviting people to write to an address
    // that does not exist is worse than not inviting them.
    expect(missingOperatorFields()).toContain('email');
    expect(mailFallback('Mail ons', 'joinFallback')).toBe('');
    expect(renderJoin('nl')).not.toContain('mailto:');
  });

  it('offers the address once there is one', () => {
    const markup = mailFallback('Mail ons', 'joinFallback', 'hallo@buurklus.nl');
    expect(markup).toContain('href="mailto:hallo@buurklus.nl"');
    expect(markup).toContain('id="joinFallback"');
    // Hidden until a request actually fails.
    expect(markup).toContain('hidden');
  });

  it('says plainly that nothing was saved', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const script = renderJoin(locale);
      expect(script, locale).toContain(esc(JOIN_COPY[locale].states.offlineBody));
      expect(JOIN_COPY[locale].states.offlineBody.length).toBeGreaterThan(20);
    }
  });
});

describe('what the sign-up form asks of each side', () => {
  it('makes the hidden attribute win over the layout', () => {
    // Without this the browser's own [hidden] rule loses to any class that
    // sets display, and .field is display:grid — which is exactly how the KvK
    // number and the trade list ended up in front of somebody looking for a
    // tradesperson, and how the thank-you panel sat open before anything had
    // been sent.
    expect(renderStyles()).toContain('[hidden] { display: none !important; }');
  });

  it('marks the business-only fields for professionals alone', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderJoin(locale);
      const kvkField = html.match(/<div class="field"[^>]*data-role="([^"]+)"[^>]*>(?:(?!<\/div>)[\s\S])*?name="kvk"/);
      expect(kvkField?.[1], `${locale} kvk field`).toBe('PRO');
      // And they start hidden, so the page is right before any script runs.
      expect(html, locale).toContain('data-role="PRO" hidden');
      expect(html, locale).not.toContain('data-role="CUSTOMER" ');
    }
  });

  it('names the customer side by what they have, not what they are hunting', () => {
    expect(renderJoin('nl')).toContain('Ik heb een klus');
    expect(renderJoin('en')).toContain('I have a job');
  });

  it('offers the KvK check to customers as a promise, never as a question', () => {
    // The number is something Buurklus verifies on their behalf. A household
    // has no KvK number and must never be asked for one.
    expect(JOIN_COPY.nl.roles.customer.bullets.join(' ')).toContain('Je krijgt alleen reacties');
    for (const locale of SUPPORTED_LOCALES) {
      expect(JOIN_COPY[locale].roles.customer.bullets.join(' '), locale).not.toMatch(
        /vul .*kvk|enter .*chamber/i,
      );
    }
  });
});

describe('the contact page', () => {
  it('exists in both languages and is linked from the footer', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderContact(locale);
      expect(html, locale).toContain(esc(CONTACT_COPY[locale].title));
      expect(html, locale).toContain('id="contactForm"');
      // The footer of every page points at it, or nobody will find it.
      expect(renderHome(locale), locale).toContain(`href="${contactUrl(locale)}"`);
    }
  });

  it('is in the sitemap', () => {
    const sitemap = renderSitemap();
    for (const locale of SUPPORTED_LOCALES) {
      expect(sitemap, locale).toContain(`${contactUrl(locale)}</loc>`);
    }
  });

  it('asks for three things and no more', () => {
    // A contact form is the easiest place on a site to over-collect. Every
    // field here has to be justified in the privacy statement.
    const html = renderContact('nl');
    const names = [...html.matchAll(/<(?:input|textarea|select)[^>]*name="([^"]+)"/g)].map(
      (match) => match[1],
    );
    expect(new Set(names)).toEqual(new Set(['name', 'email', 'message', 'website']));
  });

  it('carries the honeypot a person never sees', () => {
    expect(renderContact('nl')).toContain('class="honeypot"');
    expect(renderContact('nl')).toContain('name="website"');
  });

  it('posts to this site rather than somewhere else', () => {
    expect(renderContact('nl')).toContain(`"api":"${CONTACT_ENDPOINT}"`);
    expect(renderJoin('nl')).toContain(`"api":"${SIGNUP_ENDPOINT}"`);
    for (const html of [renderContact('en'), renderJoin('en')]) {
      expect(html).not.toContain('https://api.buurklus.nl');
    }
  });
});

describe('the scripts that go out with the forms', () => {
  // The email check is written inside a template literal, so a backslash has
  // to survive two rounds of escaping to reach the browser. It did not: the
  // pattern shipped as [^@s], which rejects every address containing the
  // letter s — including test@voorbeeld.nl. This is that bug, held down.
  const EMAIL_PATTERN = String.raw`/^[^@\s]+@[^@\s]+\.[^@\s]+$/`;

  it('ships an email check that has not lost its backslashes', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(renderContact(locale), `contact ${locale}`).toContain(EMAIL_PATTERN);
      expect(renderJoin(locale), `join ${locale}`).toContain(EMAIL_PATTERN);
    }
  });

  it('accepts an ordinary Dutch address with that pattern', () => {
    const source = renderContact('nl').match(/\/\^\[\^@\\s\][^\n]*?\$\//)?.[0];
    expect(source).toBeDefined();
    // eslint-disable-next-line no-eval -- reading back exactly what ships.
    const pattern = new RegExp(source!.slice(1, -1));
    for (const address of ['test@voorbeeld.nl', 'jan.smit@buurklus.nl', 'a@b.co']) {
      expect(pattern.test(address), address).toBe(true);
    }
    for (const address of ['geen-adres', 'twee@@apen.nl', 'spatie in@adres.nl']) {
      expect(pattern.test(address), address).toBe(false);
    }
  });
});

describe('the way an amount is printed', () => {
  it('keeps the cents when there are cents', () => {
    // "€ 35" for a price of € 34,95 is not a rounding, it is a wrong price.
    expect(money(3495, 'nl')).toContain('34,95');
    expect(money(2495, 'nl')).toContain('24,95');
    expect(money(3495, 'en')).toContain('34.95');
  });

  it('drops them when there are none', () => {
    expect(money(0, 'nl')).not.toContain(',00');
    expect(money(9500, 'nl')).not.toContain(',00');
  });

  it('prints every announced price in full', () => {
    const plan = ANNOUNCED_PLAN!;
    for (const amount of [plan.monthlyPriceEur, monthlyRateOfYearly(plan), plan.yearlyPriceEur]) {
      const cents = eurosToCents(amount);
      const printed = money(cents, 'nl').replace(/[^\d,]/g, '');
      const expected = (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2).replace('.', ',');
      expect(printed, `${amount}`).toBe(expected);
    }
  });
});

describe('what the pricing section promises', () => {
  it('mentions the free month on the monthly plan only', () => {
    // The trial belongs to one of the two ways to pay, so it is stated on that
    // card and nowhere else.
    for (const locale of SUPPORTED_LOCALES) {
      const offer = COPY[locale].pro.pricing.offer;
      const free = locale === 'nl' ? 'eerste maand is gratis' : 'first month is free';
      const monthly = `${offer.monthly.lead} ${offer.monthly.note}`.toLowerCase();
      const yearly = `${offer.yearly.lead} ${offer.yearly.note}`.toLowerCase();
      expect(monthly, `${locale} monthly`).toContain(free);
      expect(yearly, `${locale} yearly`).not.toContain(free);
      expect(renderPro(locale).toLowerCase().split(free).length - 1, `${locale} once`).toBe(1);
    }
  });

  it('gives both cards a line between the heading and the price', () => {
    // The two amounts are not comparable on their own: one is billed every
    // month, the other is what a year up front works out to. Each card says
    // which before it shows the figure, and having one on both is also what
    // keeps the two prices on the same line as each other.
    for (const locale of SUPPORTED_LOCALES) {
      const offer = COPY[locale].pro.pricing.offer;
      const html = renderPro(locale);
      expect(html.split('class="plan__lead"').length - 1, `${locale} leads`).toBe(2);
      expect(html, `${locale} monthly lead`).toContain(esc(offer.monthly.lead));
      expect(html, `${locale} yearly lead`).toContain(esc(offer.yearly.lead));
    }
  });

  it('sells the yearly card on what it gives, not on what it lacks', () => {
    // It read "no trial month — you commit to a year straight away", which
    // opens the cheaper option by naming two drawbacks. The card is the better
    // deal of the two; it should say so.
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderPro(locale).toLowerCase();
      for (const phrase of ['geen proefmaand', 'no trial month', 'meteen een jaar toe']) {
        expect(html.includes(phrase), `${locale}: ${phrase}`).toBe(false);
      }
    }
  });

  it('no longer calls the platform free', () => {
    // The offer changed: a trial month, then a price. "Free for now" was a
    // different promise, and leaving the words about would make two.
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderPro(locale).toLowerCase();
      for (const phrase of ['voorlopig niets', 'zolang buurklus gratis', 'free for now']) {
        expect(html.includes(phrase), `${locale}: ${phrase}`).toBe(false);
      }
    }
  });

  it('keeps the notice promise, now about a change in price', () => {
    for (const locale of SUPPORTED_LOCALES) {
      expect(renderPro(locale), locale).toContain(String(PRICING_NOTICE_DAYS));
    }
  });

  it('says the trial is a month, in the same number the API grants', () => {
    expect(TRIAL_DURATION_DAYS).toBe(30);
  });
});

describe('the buttons under the two prices', () => {
  it('never promises the trial on the card that has none', () => {
    // Only the monthly card comes with a free month. A button on the other one
    // reading "start your free month" would promise something it does not give.
    for (const locale of SUPPORTED_LOCALES) {
      const offer = COPY[locale].pro.pricing.offer;
      expect(offer.ctaYearly, locale).not.toBe(offer.cta);
      const html = renderPro(locale);
      expect(html.split(esc(offer.cta)).length - 1, `${locale} trial button`).toBe(1);
      expect(html, `${locale} yearly button`).toContain(esc(offer.ctaYearly));
    }
  });
});

describe('the neighbourhood section', () => {
  it('puts all three neighbours on the home page, each with an icon', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const copy = COPY[locale].neighbours;
      const html = renderHome(locale);
      expect(copy.examples.length, `${locale} examples`).toBe(3);
      expect(html, `${locale} title`).toContain(esc(copy.title));
      expect(html, `${locale} body`).toContain(esc(copy.body));
      for (const example of copy.examples) {
        expect(html, `${locale}: ${example.title}`).toContain(esc(example.title));
        expect(html, `${locale}: ${example.body}`).toContain(esc(example.body));
      }
      // One icon per example. The icons live in the renderer and the examples
      // in the copy, so a fourth example would otherwise silently reuse the
      // first icon.
      expect(html.split('neighbour__icon').length - 1, `${locale} icons`).toBe(
        copy.examples.length,
      );
    }
  });

  it('is on the home page only, and above the video', () => {
    // It is the argument for the name: the job may be done by somebody in the
    // street. Below the film it would be read by whoever had already stayed.
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderHome(locale);
      expect(html.indexOf('id="buurt"'), `${locale} present`).toBeGreaterThan(-1);
      expect(html.indexOf('id="buurt"'), `${locale} order`).toBeLessThan(
        html.indexOf('id="video"'),
      );
      expect(renderPro(locale).includes('id="buurt"'), `${locale} pro`).toBe(false);
    }
  });
});

describe('the share row', () => {
  it('hands each network the home page of the language being read', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderHome(locale);
      const home = encodeURIComponent(`${SITE_URL}/${locale}/`);
      expect(html, `${locale} facebook`).toContain(
        `https://www.facebook.com/sharer/sharer.php?u=${home}`,
      );
      expect(html, `${locale} linkedin`).toContain(
        `https://www.linkedin.com/sharing/share-offsite/?url=${home}`,
      );
    }
  });

  it('sends the sentence along where the network takes one', () => {
    // Facebook and LinkedIn read the page's own tags and ignore anything
    // passed in the URL. WhatsApp and mail carry only what they are given, so
    // an unshared link there would arrive as a bare URL with no case made.
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderHome(locale);
      const text = encodeURIComponent(COPY[locale].share.text);
      expect(html, `${locale} whatsapp`).toContain(`https://wa.me/?text=${text}`);
      expect(html, `${locale} mail`).toContain(
        `mailto:?subject=${encodeURIComponent(COPY[locale].share.subject)}`,
      );
    }
  });

  it('opens every one of them safely in a new tab', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const section = renderHome(locale).split('id="delen"')[1]!.split('</section>')[0]!;
      const links = [...section.matchAll(/<a[^>]*>/g)].map((match) => match[0]!);
      expect(links.length, `${locale} count`).toBe(4);
      for (const link of links) {
        expect(link, `${locale} target`).toContain('target="_blank"');
        expect(link, `${locale} rel`).toContain('rel="noopener noreferrer"');
      }
    }
  });
});

describe('what a shared link says under the title', () => {
  it('makes the neighbourly case, while search keeps the plain one', () => {
    // The two audiences are different: a search result is read by somebody
    // already looking for a tradesperson, a post in a timeline by somebody who
    // was not looking for anything at all.
    for (const locale of SUPPORTED_LOCALES) {
      const copy = COPY[locale].meta;
      const html = renderHome(locale);
      expect(copy.social, `${locale} differs`).not.toBe(copy.description);
      expect(html, `${locale} og`).toContain(
        `<meta property="og:description" content="${esc(copy.social)}">`,
      );
      expect(html, `${locale} twitter`).toContain(
        `<meta name="twitter:description" content="${esc(copy.social)}">`,
      );
      expect(html, `${locale} search`).toContain(
        `<meta name="description" content="${esc(copy.description)}">`,
      );
    }
  });

  it('falls back to the search description on every other page', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const copy = COPY[locale].meta;
      expect(renderPro(locale), `${locale} pro`).toContain(
        `<meta property="og:description" content="${esc(copy.proDescription)}">`,
      );
    }
  });
});

describe('counting visitors', () => {
  // Every test here puts the variable back. Leaving it set would arm the
  // beacon for every other test in this file.
  function withToken<T>(value: string | undefined, run: () => T): T {
    const before = process.env.CF_ANALYTICS_TOKEN;
    if (value === undefined) delete process.env.CF_ANALYTICS_TOKEN;
    else process.env.CF_ANALYTICS_TOKEN = value;
    try {
      return run();
    } finally {
      if (before === undefined) delete process.env.CF_ANALYTICS_TOKEN;
      else process.env.CF_ANALYTICS_TOKEN = before;
    }
  }

  it('measures nothing until a token is configured', () => {
    withToken(undefined, () => {
      expect(analyticsToken()).toBe('');
      expect(renderHome('nl')).not.toContain('cloudflareinsights');
      expect(renderHeaders([])).toContain("connect-src 'self';");
      expect(renderHeaders([])).not.toContain('cloudflareinsights');
    });
  });

  it('loads the beacon and opens the policy for it together', () => {
    // The two have to move as one. A beacon without the policy is a script the
    // browser blocks in silence, and the dashboard then shows nobody visiting
    // a site that has visitors.
    withToken('abc123def4567890abc123def4567890', () => {
      const html = renderHome('nl');
      expect(html).toContain(
        '<script defer src="https://static.cloudflareinsights.com/beacon.min.js"',
      );
      expect(html).toContain('"token":"abc123def4567890abc123def4567890"');
      const headers = renderHeaders([]);
      expect(headers).toContain('https://static.cloudflareinsights.com');
      expect(headers).toContain("connect-src 'self' https://cloudflareinsights.com");
    });
  });

  it('refuses a token that could carry markup into the page', () => {
    withToken(`x" onload="alert(1)`, () => {
      expect(() => analyticsToken()).toThrow(/CF_ANALYTICS_TOKEN/);
    });
  });

  it('sets no cookie and asks for no consent, because it needs none', () => {
    // The cookie statement says the site runs no analytics that recognise
    // you. This one does not: no cookie, no identifier, nothing followed
    // between sites. If that ever stops being true the statement has to change
    // before the measurement does.
    withToken('abc123def4567890abc123def4567890', () => {
      const html = renderHome('nl');
      expect(html).not.toContain('document.cookie');
      expect(html).toContain('defer');
    });
  });
});

describe('what the sign-up form asks a customer', () => {
  it('asks for the trade and the job, not only the municipality', () => {
    // Without these two, a request cannot be matched to anybody: the operator
    // would know that somebody in Utrecht wants something, and nothing more.
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderJoin(locale);
      const form = JOIN_COPY[locale].form;
      expect(html, `${locale} trades`).toContain(esc(form.tradesCustomer));
      expect(html, `${locale} job`).toContain(esc(form.job));
      expect(html, `${locale} field`).toContain('name="jobNote"');
      expect(html, `${locale} placeholder`).toContain(esc(form.jobPlaceholder));
    }
  });

  it('offers the same trades to both sides', () => {
    // One list, compared against itself. A separate set of customer trades
    // would drift from the pro list and match nothing.
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderJoin(locale);
      const boxes = html.split('type="checkbox" name="categorySlugs"').length - 1;
      expect(boxes, `${locale} boxes`).toBe(ROOT_CATEGORIES.length);

      // And they are not inside a block that is hidden from a customer: the
      // field they sit in must open without a data-role of its own.
      const before = html.slice(0, html.indexOf('type="checkbox" name="categorySlugs"'));
      const opening = before.slice(before.lastIndexOf('<div class="field'));
      expect(opening.startsWith('<div class="field">'), `${locale} visible`).toBe(true);
    }
  });

  it('asks each side to agree to what actually happens to them', () => {
    // A customer's job is put to tradespeople nearby. Consent that says only
    // "tell me when you open" does not cover that.
    for (const locale of SUPPORTED_LOCALES) {
      const form = JOIN_COPY[locale].form;
      const html = renderJoin(locale);
      expect(form.consent, `${locale} differ`).not.toBe(form.consentPro);
      expect(html, `${locale} customer`).toContain(esc(form.consent));
      expect(html, `${locale} pro`).toContain(esc(form.consentPro));
    }
  });

  it('promises only what the introduction mail actually does', () => {
    // The mail to the pros carries the job, the trade and the municipality —
    // never the customer's address, name or telephone number.
    const items = JOIN_COPY.nl.promise.items.join(' ').toLowerCase();
    expect(items).toContain('gemeente');
    expect(items).not.toContain('delen ze met niemand');
  });
});
