import {
  CITIES,
  DEFAULT_PLAN,
  PLANS,
  PLATFORM_IS_FREE,
  PRICING_NOTICE_DAYS,
  ROOT_CATEGORIES,
  SUPPORTED_LOCALES,
  TRIAL_CREDITS,
  TRIAL_DURATION_DAYS,
  applyVat,
  centsToEuros,
  eurosToCents,
  localize,
  type Locale,
  type PlanSeed,
} from '@buurklus/shared';
import { COPY, type SiteCopy } from './content.js';
import { icon, solidIcon } from './icons.js';
import { STYLES } from './styles.js';

export const SITE_URL = 'https://buurklus.nl';

/** Escapes text destined for HTML. All copy goes through here. */
export function esc(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function fill(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''));
}

const NUMBER_TAGS: Record<Locale, string> = { nl: 'nl-NL', en: 'en-NL' };

function money(cents: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_TAGS[locale], {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(centsToEuros(cents));
}

function count(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_TAGS[locale]).format(value);
}

interface PageOptions {
  locale: Locale;
  page: 'home' | 'pro';
  title: string;
  description: string;
  body: string;
}

/** Where a given locale's version of the current page lives. */
function pathFor(locale: Locale, page: 'home' | 'pro'): string {
  return page === 'pro' ? `/${locale}/pro/` : `/${locale}/`;
}

function head({ locale, page, title, description }: Omit<PageOptions, 'body'>): string {
  const canonical = `${SITE_URL}${pathFor(locale, page)}`;
  // Every language of this page is declared, plus x-default pointing at Dutch.
  const alternates = SUPPORTED_LOCALES.map(
    (other) =>
      `<link rel="alternate" hreflang="${other}" href="${SITE_URL}${pathFor(other, page)}">`,
  ).join('\n    ');

  return `<!doctype html>
<html lang="${locale}">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}">
    <link rel="canonical" href="${canonical}">
    ${alternates}
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/nl/">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Buurklus">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:locale" content="${COPY[locale].meta.ogLocale}">
    <meta name="theme-color" content="#0F6F5C">
    <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>`;
}

function brand(locale: Locale): string {
  const mark = `<span class="brand__mark">${icon('construct-outline', 20)}</span>`;
  return `<a class="brand" href="${pathFor(locale, 'home')}">${mark}<span>Buurklus</span></a>`;
}

function langSwitcher(locale: Locale, page: 'home' | 'pro'): string {
  const labels: Record<Locale, string> = { nl: 'NL', en: 'EN' };
  const links = SUPPORTED_LOCALES.map(
    (other) =>
      `<a href="${pathFor(other, page)}" hreflang="${other}" aria-current="${other === locale}">${labels[other]}</a>`,
  ).join('');
  return `<nav class="langs" aria-label="${esc(COPY[locale].footer.languageLabel)}">${links}</nav>`;
}

function header(locale: Locale, page: 'home' | 'pro'): string {
  const copy = COPY[locale];
  const links =
    page === 'home'
      ? `<a href="#trades">${esc(copy.nav.trades)}</a>
         <a href="#how">${esc(copy.nav.how)}</a>
         <a href="${pathFor(locale, 'pro')}">${esc(copy.nav.pros)}</a>`
      : `<a href="#pricing">${esc(copy.nav.pricing)}</a>
         <a href="#pro-how">${esc(copy.pro.how.title)}</a>
         <a href="${pathFor(locale, 'home')}">${esc(copy.nav.forCustomers)}</a>`;

  // Both labels ship; the stylesheet picks the short one on narrow screens,
  // where the full French label wraps onto three lines and eats the header.
  const ctaLabels = (long: string, short: string) =>
    `<span class="nav__ctaLong">${esc(long)}</span><span class="nav__ctaShort">${esc(short)}</span>`;

  const cta =
    page === 'home'
      ? `<a class="btn btn--primary btn--sm nav__cta" href="#cta">${ctaLabels(copy.nav.cta, copy.nav.ctaShort)}</a>`
      : `<a class="btn btn--primary btn--sm nav__cta" href="#pricing">${ctaLabels(copy.pro.hero.cta, copy.pro.hero.ctaShort)}</a>`;

  return `<header class="header">
    <div class="wrap header__inner">
      ${brand(locale)}
      <nav class="nav" aria-label="${esc(copy.nav.how)}">
        <span class="nav__links">${links}</span>
        ${langSwitcher(locale, page)}
        ${cta}
      </nav>
    </div>
  </header>`;
}

function footer(locale: Locale, page: 'home' | 'pro'): string {
  const copy = COPY[locale];
  const year = new Date().getUTCFullYear();
  const l = copy.footer.links;

  return `<footer class="footer">
    <div class="wrap">
      <div class="footer__grid">
        <div class="footer__brandCol">
          ${brand(locale)}
          <p class="muted">${esc(copy.footer.tagline)}</p>
        </div>
        <div>
          <h3>${esc(copy.footer.product)}</h3>
          <ul>
            <li><a href="${pathFor(locale, 'home')}#trades">${esc(copy.nav.trades)}</a></li>
            <li><a href="${pathFor(locale, 'home')}#how">${esc(copy.nav.how)}</a></li>
            <li><a href="${pathFor(locale, 'pro')}">${esc(copy.nav.pros)}</a></li>
          </ul>
        </div>
        <div>
          <h3>${esc(copy.footer.company)}</h3>
          <ul>
            <li><a href="#">${esc(l.about)}</a></li>
            <li><a href="#">${esc(l.contact)}</a></li>
            <li><a href="#">${esc(l.help)}</a></li>
          </ul>
        </div>
        <div>
          <h3>${esc(copy.footer.legal)}</h3>
          <ul>
            <li><a href="#">${esc(l.terms)}</a></li>
            <li><a href="#">${esc(l.privacy)}</a></li>
          </ul>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© ${year} Buurklus. ${esc(copy.footer.rights)}</span>
        ${langSwitcher(locale, page)}
      </div>
    </div>
  </footer>`;
}

function page(options: PageOptions): string {
  return `${head(options)}
    ${header(options.locale, options.page)}
    <main>${options.body}</main>
    ${footer(options.locale, options.page)}
  </body>
</html>
`;
}

// ---------------------------------------------------------------------------
// Home page
// ---------------------------------------------------------------------------

/**
 * A miniature of the app. The customer page shows the quotes arriving; the
 * professional page shows the lead feed, because showing a pro the customer's
 * screen argues the wrong case. Names and figures are illustrative.
 */
function heroMock(locale: Locale, copy: SiteCopy, variant: 'home' | 'pro' = 'home'): string {
  const quotes = [
    { name: 'Schildersbedrijf Bakker', price: 1250, stars: '★★★★★', meta: locale === 'en' ? '18 years’ experience' : '18 jaar ervaring' },
    { name: 'Van Dijk Afbouw', price: 1480, stars: '★★★★☆', meta: locale === 'en' ? '34 reviews' : '34 beoordelingen' },
    { name: 'Klusbedrijf Yilmaz', price: 990, stars: '★★★★★', meta: locale === 'en' ? 'Replies in 40 min' : 'Reageert binnen 40 min' },
  ];

  const leads = [
    {
      name: locale === 'en' ? 'Paint a 25 m² living room' : 'Woonkamer van 25 m² schilderen',
      price: 1600,
      stars: '',
      meta: 'Utrecht · Wittevrouwen',
    },
    {
      name: locale === 'en' ? 'Leak under the sink' : 'Lekkage onder de gootsteen',
      price: 400,
      stars: '',
      meta: 'Amersfoort · Soesterkwartier',
    },
    {
      name: locale === 'en' ? 'Replace the consumer unit' : 'Groepenkast vervangen',
      price: 1200,
      stars: '',
      meta: 'Amsterdam · De Pijp',
    },
  ];

  const rows = variant === 'pro' ? leads : quotes;

  const cards = rows
    .map(
      (row) => `<div class="mock__card">
        <div class="mock__row">
          <span class="mock__name">${esc(row.name)}</span>
          <span class="mock__price">${esc(money(eurosToCents(row.price), locale))}</span>
        </div>
        <div class="mock__row">
          ${row.stars ? `<span class="mock__stars">${row.stars}</span>` : ''}
          <span class="mock__meta">${esc(row.meta)}</span>
        </div>
      </div>`,
    )
    .join('');

  const heading = variant === 'pro' ? copy.pro.hero.eyebrow : copy.nav.cta;
  const label = variant === 'pro' ? copy.pro.hero.subtitle : copy.hero.subtitle;

  return `<div class="mock" role="img" aria-label="${esc(label)}">
    <span class="mock__bar"></span>
    <span class="mock__title">${esc(heading)}</span>
    ${cards}
  </div>`;
}

function homeBody(locale: Locale): string {
  const copy = COPY[locale];
  const shownCities = CITIES.slice(0, 18);
  const remainingCities = CITIES.length - shownCities.length;

  const trades = ROOT_CATEGORIES.slice(0, 12)
    .map((category) => {
      const budget = category.typicalBudgetEur
        ? `<span class="trade__budget">${esc(copy.trades.budgetFrom)} ${esc(
            money(eurosToCents(category.typicalBudgetEur.min), locale),
          )}</span>`
        : '';
      return `<a class="trade" href="#cta">
        <span class="trade__icon">${icon(category.icon, 22)}</span>
        <span>
          <span class="trade__name">${esc(localize(category.name, locale))}</span><br>
          ${budget}
        </span>
      </a>`;
    })
    .join('');

  const steps = copy.how.steps
    .map(
      (step, index) => `<article class="card">
        <span class="card__step">${index + 1}</span>
        <h3>${esc(step.title)}</h3>
        <p class="muted">${esc(step.body)}</p>
      </article>`,
    )
    .join('');

  const trust = copy.trust.items
    .map(
      (item) => `<article class="card">
        <span class="card__icon">${solidIcon('shield-check', 22)}</span>
        <h3>${esc(item.title)}</h3>
        <p class="muted">${esc(item.body)}</p>
      </article>`,
    )
    .join('');

  const faq = copy.faq.items
    .map(
      (item) => `<details>
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
      </details>`,
    )
    .join('');

  return `
  <section class="hero">
    <div class="wrap hero__inner">
      <div class="hero__copy">
        <span class="eyebrow">${solidIcon('check', 14)} ${esc(copy.hero.eyebrow)}</span>
        <h1>${esc(copy.hero.title)}</h1>
        <p class="lede">${esc(copy.hero.subtitle)}</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="#cta">${esc(copy.hero.primaryCta)}</a>
          <a class="btn btn--ghost" href="#trades">${esc(copy.hero.secondaryCta)}</a>
        </div>
        <p class="hero__note">${esc(copy.hero.note)}</p>
      </div>
      ${heroMock(locale, copy)}
    </div>
  </section>

  <div class="wrap">
    <div class="proof">
      <div class="proof__item">
        <span class="proof__value">${esc(count(ROOT_CATEGORIES.length, locale))}+</span>
        <span class="proof__label">${esc(copy.proof.trades)}</span>
      </div>
      <div class="proof__item">
        <span class="proof__value">${esc(count(CITIES.length, locale))}</span>
        <span class="proof__label">${esc(copy.proof.cities)}</span>
      </div>
      <div class="proof__item">
        <span class="proof__value">100%</span>
        <span class="proof__label">${esc(copy.proof.free)}</span>
      </div>
      <div class="proof__item">
        <span class="proof__value">ICE</span>
        <span class="proof__label">${esc(copy.proof.verified)}</span>
      </div>
    </div>
  </div>

  <section class="section" id="how">
    <div class="wrap">
      <div class="section__head">
        <h2>${esc(copy.how.title)}</h2>
        <p class="lede muted">${esc(copy.how.subtitle)}</p>
      </div>
      <div class="grid grid--3">${steps}</div>
    </div>
  </section>

  <section class="section section--tint" id="trades">
    <div class="wrap">
      <div class="section__head">
        <h2>${esc(copy.trades.title)}</h2>
        <p class="lede muted">${esc(copy.trades.subtitle)}</p>
      </div>
      <div class="grid grid--4">${trades}</div>
    </div>
  </section>

  <section class="section" id="cities">
    <div class="wrap">
      <div class="section__head">
        <h2>${esc(copy.cities.title)}</h2>
        <p class="lede muted">${esc(copy.cities.subtitle)}</p>
      </div>
      <div class="cities">
        ${shownCities.map((city) => `<span class="city">${esc(localize(city.name, locale))}</span>`).join('')}
        <span class="city city--more">${esc(fill(copy.cities.andMore, { count: count(remainingCities, locale) }))}</span>
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap">
      <div class="section__head"><h2>${esc(copy.trust.title)}</h2></div>
      <div class="grid grid--4">${trust}</div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="banner">
        <div style="display:grid;gap:1rem;align-content:start">
          <h2>${esc(copy.proTeaser.title)}</h2>
          <p>${esc(copy.proTeaser.body)}</p>
          <a class="btn btn--onDark" href="${pathFor(locale, 'pro')}" style="justify-self:start">${esc(copy.proTeaser.cta)}</a>
        </div>
        <ul class="banner__list">
          ${copy.proTeaser.bullets
            .map((b) => `<li><span class="banner__tick">${solidIcon('check', 18)}</span><span>${esc(b)}</span></li>`)
            .join('')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap">
      <div class="section__head"><h2>${esc(copy.faq.title)}</h2></div>
      <div class="faq">${faq}</div>
    </div>
  </section>

  <section class="section" id="cta">
    <div class="wrap">
      <div class="cta">
        <h2>${esc(copy.hero.title)}</h2>
        <p>${esc(copy.hero.note)}</p>
        <a class="btn btn--onDark" href="#">${esc(copy.hero.primaryCta)}</a>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------
// Professionals page
// ---------------------------------------------------------------------------

/**
 * Exactly one plan carries the badge. `featured` on a plan means it ranks above
 * cheaper tiers in the customer-facing directory — not "most popular" — and two
 * tiers carry it, so badging on `featured` claimed two plans were the most
 * chosen. The recommendation is the cheapest featured tier.
 */
const RECOMMENDED_PLAN = PLANS.find((plan) => plan.featured)?.slug ?? PLANS[1]?.slug;

function planCard(plan: PlanSeed, locale: Locale, copy: SiteCopy): string {
  const isRecommended = plan.slug === RECOMMENDED_PLAN;
  const net = eurosToCents(plan.monthlyPriceEur);
  const gross = applyVat(net).grossCents;
  const p = copy.pro.pricing;

  const features = [
    `${count(plan.monthlyCredits, locale)} ${p.quotes}`,
    `${count(plan.maxCategories, locale)} ${p.trades}`,
    plan.maxCities === null ? p.citiesAll : `${count(plan.maxCities, locale)} ${p.cities}`,
    plan.leadHeadStartMinutes > 0
      ? fill(p.headStart, { minutes: count(plan.leadHeadStartMinutes, locale) })
      : p.noHeadStart,
    ...(plan.teamSeats > 0 ? [`${count(plan.teamSeats, locale)} ${p.seats}`] : []),
  ];

  return `<article class="card plan${isRecommended ? ' plan--featured' : ''}">
    ${isRecommended ? `<span class="plan__badge">${esc(p.popular)}</span>` : ''}
    <h3>${esc(localize(plan.name, locale))}</h3>
    <p class="muted">${esc(localize(plan.tagline, locale))}</p>
    <div class="plan__price">
      <span class="plan__amount">${esc(money(net, locale))}</span>
      <span class="plan__period">${esc(p.perMonth)} ${esc(p.excludingVat)}</span>
    </div>
    <span class="plan__gross">${esc(money(gross, locale))} ${esc(p.includingVat)}</span>
    <ul class="plan__features">
      ${features
        .map((f) => `<li><span class="plan__tick">${solidIcon('check', 17)}</span><span>${esc(f)}</span></li>`)
        .join('')}
    </ul>
    <a class="btn ${isRecommended ? 'btn--primary' : 'btn--ghost'}" href="#">${esc(p.choose)}</a>
  </article>`;
}

/**
 * What the pricing section shows while nothing is on sale. The paid cards say
 * "choose this plan" next to a price, which would be a lie today, so they are
 * replaced rather than dressed up: one panel that says the platform is free,
 * what the free account actually gives you, and -- the part that matters --
 * that it will not start charging you without asking.
 */
function launchPanel(locale: Locale, copy: SiteCopy): string {
  const l = copy.pro.pricing.launch;
  const values = {
    credits: count(DEFAULT_PLAN.monthlyCredits, locale),
    trades: count(DEFAULT_PLAN.maxCategories, locale),
    cities:
      DEFAULT_PLAN.maxCities === null
        ? copy.pro.pricing.citiesAll
        : count(DEFAULT_PLAN.maxCities, locale),
    notice: count(PRICING_NOTICE_DAYS, locale),
  };

  const points = l.points
    .map(
      (point) =>
        `<li><span class="plan__tick">${solidIcon('check', 17)}</span><span>${esc(fill(point, values))}</span></li>`,
    )
    .join('');

  return `<article class="card plan plan--launch">
    <span class="plan__badge">${esc(l.badge)}</span>
    <h3>${esc(l.cardTitle)}</h3>
    <div class="plan__price">
      <span class="plan__amount">${esc(money(0, locale))}</span>
      <span class="plan__period">${esc(copy.pro.pricing.perMonth)}</span>
    </div>
    <ul class="plan__features">${points}</ul>
    <a class="btn btn--primary" href="#">${esc(l.cta)}</a>
  </article>
  <aside class="card plan plan--later">
    <h3>${esc(l.laterTitle)}</h3>
    <p class="muted">${esc(fill(l.later, values))}</p>
  </aside>`;
}

function proBody(locale: Locale): string {
  const copy = COPY[locale];
  const p = copy.pro;

  const value = p.value.items
    .map(
      (item) => `<article class="card">
        <span class="card__icon">${solidIcon('check', 22)}</span>
        <h3>${esc(item.title)}</h3>
        <p class="muted">${esc(item.body)}</p>
      </article>`,
    )
    .join('');

  const steps = p.how.steps
    .map(
      (step, index) => `<article class="card">
        <span class="card__step">${index + 1}</span>
        <h3>${esc(step.title)}</h3>
        <p class="muted">${esc(step.body)}</p>
      </article>`,
    )
    .join('');

  const faq = p.faq.items
    .map((item) => `<details><summary>${esc(item.q)}</summary><p>${esc(item.a)}</p></details>`)
    .join('');

  return `
  <section class="hero">
    <div class="wrap hero__inner">
      <div class="hero__copy">
        <span class="eyebrow">${solidIcon('check', 14)} ${esc(p.hero.eyebrow)}</span>
        <h1>${esc(p.hero.title)}</h1>
        <p class="lede">${esc(p.hero.subtitle)}</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="#pricing">${esc(p.hero.cta)}</a>
        </div>
        <p class="hero__note">${esc(p.hero.note)}</p>
      </div>
      ${heroMock(locale, copy, 'pro')}
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="section__head"><h2>${esc(p.value.title)}</h2></div>
      <div class="grid grid--4">${value}</div>
    </div>
  </section>

  <section class="section section--tint" id="pricing">
    <div class="wrap">
      <div class="section__head">
        <h2>${esc(PLATFORM_IS_FREE ? p.pricing.launch.title : p.pricing.title)}</h2>
        <p class="lede muted">${esc(
          PLATFORM_IS_FREE ? p.pricing.launch.subtitle : p.pricing.subtitle,
        )}</p>
      </div>
      <div class="plans${PLATFORM_IS_FREE ? ' plans--launch' : ''}">${
        PLATFORM_IS_FREE
          ? launchPanel(locale, copy)
          : PLANS.filter((plan) => plan.available)
              .map((plan) => planCard(plan, locale, copy))
              .join('')
      }</div>
      ${
        PLATFORM_IS_FREE
          ? ''
          : `<p class="muted" style="margin-block-start:1.5rem;font-size:0.9rem">
        ${esc(p.pricing.vatNote)}<br>
        ${esc(fill(p.pricing.trialNote, { days: TRIAL_DURATION_DAYS, credits: TRIAL_CREDITS }))}
      </p>`
      }
    </div>
  </section>

  <section class="section" id="pro-how">
    <div class="wrap">
      <div class="section__head"><h2>${esc(p.how.title)}</h2></div>
      <div class="grid grid--3">${steps}</div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap">
      <div class="section__head"><h2>${esc(p.faq.title)}</h2></div>
      <div class="faq">${faq}</div>
    </div>
  </section>

  <section class="section">
    <div class="wrap">
      <div class="cta">
        <h2>${esc(p.hero.title)}</h2>
        <p>${esc(p.hero.note)}</p>
        <a class="btn btn--onDark" href="#">${esc(p.hero.cta)}</a>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------

export function renderHome(locale: Locale): string {
  const copy = COPY[locale];
  return page({
    locale,
    page: 'home',
    title: copy.meta.title,
    description: copy.meta.description,
    body: homeBody(locale),
  });
}

export function renderPro(locale: Locale): string {
  const copy = COPY[locale];
  return page({
    locale,
    page: 'pro',
    title: copy.meta.proTitle,
    description: copy.meta.proDescription,
    body: proBody(locale),
  });
}

export function renderStyles(): string {
  return STYLES.trim() + '\n';
}

/** Sends a visitor to their language, defaulting to French. */
export function renderRootRedirect(): string {
  const map = JSON.stringify(Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, `/${l}/`])));
  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8">
    <title>Buurklus</title>
    <meta name="robots" content="noindex">
    <link rel="canonical" href="${SITE_URL}/nl/">
    <meta http-equiv="refresh" content="0; url=/nl/">
    <script>
      // Prefer the browser's language when Buurklus speaks it; Dutch otherwise.
      var paths = ${map};
      var picked = (navigator.languages || [navigator.language || 'fr'])
        .map(function (tag) { return String(tag).slice(0, 2).toLowerCase(); })
        .find(function (code) { return paths[code]; });
      location.replace(paths[picked] || '/nl/');
    </script>
  </head>
  <body><a href="/nl/">Buurklus</a></body>
</html>
`;
}

export function renderSitemap(): string {
  const urls = SUPPORTED_LOCALES.flatMap((locale) =>
    (['home', 'pro'] as const).map((p) => `${SITE_URL}${pathFor(locale, p)}`),
  );
  const today = new Date().toISOString().slice(0, 10);
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemap.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
}

export function renderRobots(): string {
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}
