import { describe, expect, it } from 'vitest';
import {
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
} from '@buurklus/shared';
import { COPY } from './content.js';
import {
  esc,
  joinUrl,
  renderHome,
  renderManifest,
  renderNotFound,
  renderJoin,
  renderLegal,
  renderPro,
  renderRootRedirect,
  renderSitemap,
  renderStyles,
} from './render.js';
import { JOIN_COPY } from './join-content.js';

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
  it('names no plan the professional cannot have', () => {
    // The paid tiers still exist in the catalog. A price on the page that
    // nobody can buy is the sort of thing that ends up in a complaint.
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderPro(locale);
      for (const plan of PLANS.filter((row) => !row.available)) {
        expect(html, `${locale} ${plan.slug}`).not.toContain(esc(localize(plan.name, locale)));
        expect(html, `${locale} ${plan.slug} price`).not.toContain(`${plan.monthlyPriceEur}`);
      }
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

  it('carries exactly one badge, on the free plan', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderPro(locale);
      expect(html.split('plan__badge').length - 1, `${locale} badges`).toBe(1);
      expect(html, locale).toContain(esc(COPY[locale].pro.pricing.launch.badge));
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

  it('admits what is still missing rather than printing a blank', () => {
    // There is no registered company yet. A privacy statement with an empty
    // controller reads as answered; this one says out loud that it is not.
    expect(missingOperatorFields().length).toBeGreaterThan(0);
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderLegal('PRIVACY', locale);
      expect(html, locale).toContain('notice--warn');
      for (const field of missingOperatorFields()) {
        expect(html, `${locale} ${field}`).toMatch(/KvK|Chamber of Commerce/);
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

  it('posts to one API host, and never to a third party', () => {
    for (const locale of SUPPORTED_LOCALES) {
      const html = renderJoin(locale);
      const posts = [...html.matchAll(/fetch\(config\.api/g)];
      expect(posts.length, locale).toBe(1);
      expect(html, locale).toContain('/v1/signups');
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
