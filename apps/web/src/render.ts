import {
  isFreePlan,
  AVAILABLE_PLANS,
  yearlySavingPercent,
  monthlyRateOfYearly,
  ANNOUNCED_PLAN,
  CONTACT_MESSAGE_MAX,
  CITIES,
  DEFAULT_PLAN,
  LEGAL_PAGES,
  MINIMUM_AGE,
  OPERATOR,
  RETENTION,
  SUPERVISORY_AUTHORITY,
  legalPage,
  legalPath,
  missingOperatorFields,
  type LegalPageKey,
  PLANS,
  PLATFORM_IS_FREE,
  PRICING_NOTICE_DAYS,
  ROOT_CATEGORIES,
  SUPPORTED_LOCALES,
  TRIAL_DURATION_DAYS,
  applyVat,
  centsToEuros,
  eurosToCents,
  localize,
  type Locale,
  type PlanSeed,
} from '@buurklus/shared';
import { COPY, type SiteCopy } from './content.js';
import { CONTACT_COPY } from './contact-content.js';
import { JOIN_COPY } from './join-content.js';
import { CHROME_NL, LEGAL_NL } from './legal/nl.js';
import { CHROME_EN, LEGAL_EN } from './legal/en.js';
import type { LegalChrome, LegalCopy, LegalDocument, LegalSection } from './legal/types.js';
import { icon, solidIcon } from './icons.js';
import { STYLES } from './styles.js';

/**
 * The domain the finished site is served from. Every canonical URL, hreflang
 * link, sitemap entry and social card is built from this, so a preview build
 * that keeps the production value would tell Google that the preview *is*
 * buurklus.nl — two copies of the same site competing with each other. The
 * build therefore reads the value from the environment and, when it is not the
 * production domain, tells crawlers to stay away (see renderRobots).
 */
export const CANONICAL_SITE_URL = 'https://buurklus.nl';

export const SITE_URL = (process.env.PUBLIC_SITE_URL ?? CANONICAL_SITE_URL).replace(/\/+$/, '');

/** True when this build is the one that belongs on the public domain. */
export const IS_PRODUCTION_BUILD = SITE_URL === CANONICAL_SITE_URL;

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

/**
 * Cents are shown when there are cents and hidden when there are none, so
 * "€ 0" stays clean and € 34,95 stays € 34,95. Rounding a price to the euro
 * is fine for an estimate and not fine for something somebody is asked to pay:
 * this printed "€ 35" for a moment, and a price that is not the price is the
 * kind of mistake that ends up in a complaint.
 */
export function money(cents: number, locale: Locale): string {
  const digits = cents % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(NUMBER_TAGS[locale], {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(centsToEuros(cents));
}

function count(value: number, locale: Locale): string {
  return new Intl.NumberFormat(NUMBER_TAGS[locale]).format(value);
}

/** Every page the site publishes, marketing and legal alike. */
type PageKind = 'home' | 'pro' | 'join' | 'contact' | LegalPageKey;

/**
 * Where someone lands from every call to action on the site. Dutch and English
 * get their own slug because a Dutch visitor should not have to read "join" to
 * find the sign-up page.
 */
const JOIN_PATHS: Record<Locale, string> = { nl: '/nl/aanmelden/', en: '/en/join/' };
const CONTACT_PATHS: Record<Locale, string> = { nl: '/nl/contact/', en: '/en/contact/' };

/** Exported so the build writes the file where the site's own links point. */
export function joinUrl(locale: Locale): string {
  return JOIN_PATHS[locale];
}

export function contactUrl(locale: Locale): string {
  return CONTACT_PATHS[locale];
}

/**
 * Where the browser posts the registration form. Overridable at build time so
 * a staging build talks to a staging API; the default is the production host,
 * because a site built without the variable set should still work.
 */
/**
 * The forms post to this site's own origin now: the Worker that serves these
 * pages also answers /api/signup and /api/contact. Same origin means no CORS
 * to configure, no second hostname in the Content-Security-Policy, and no way
 * for the form to keep working while the site itself is down.
 *
 * apps/api — the full marketplace — will live at its own hostname when it is
 * deployed. This is not that.
 */
export const SIGNUP_ENDPOINT = '/api/signup';
export const CONTACT_ENDPOINT = '/api/contact';

interface PageOptions {
  locale: Locale;
  page: PageKind;
  title: string;
  description: string;
  body: string;
}

const LEGAL_KEYS = new Set<string>(LEGAL_PAGES.map((page) => page.key));
const isLegal = (page: PageKind): page is LegalPageKey => LEGAL_KEYS.has(page);

/** Where a given locale's version of the current page lives. */
function pathFor(locale: Locale, page: PageKind): string {
  if (isLegal(page)) return legalPath(page, locale);
  if (page === 'join') return JOIN_PATHS[locale];
  if (page === 'contact') return CONTACT_PATHS[locale];
  return page === 'pro' ? `/${locale}/pro/` : `/${locale}/`;
}

/**
 * What a search engine is told about the page, in the vocabulary it reads.
 *
 * Only what is actually on the page and actually true: an Organization with a
 * name and a site, and — on the home page — the questions and answers a
 * visitor can read for themselves. Marking up an FAQ that is not visible is
 * the sort of thing that earns a manual penalty, and deservedly.
 */
function structuredData(locale: Locale, page: PageKind): string {
  const copy = COPY[locale];

  const organisation = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Buurklus',
    url: `${SITE_URL}${pathFor(locale, 'home')}`,
    logo: `${SITE_URL}/icons/icon-512.png`,
    description: copy.meta.description,
    areaServed: { '@type': 'Country', name: 'Netherlands' },
  };

  const blocks: object[] = [organisation];

  if (page === 'home') {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: copy.faq.items.map((item) => ({
        '@type': 'Question',
        name: item.q,
        acceptedAnswer: { '@type': 'Answer', text: item.a },
      })),
    });
  }

  // The closing tag is broken up so a string inside the JSON can never end the
  // script element early.
  return blocks
    .map(
      (block) =>
        `<script type="application/ld+json">${JSON.stringify(block).replace(
          /<\//g,
          '<\\/',
        )}</script>`,
    )
    .join('\n    ');
}

/**
 * The card a link turns into when somebody shares it. Legal pages fall back to
 * the home card: nobody posts a cookie statement to LinkedIn, and a page
 * without an og:image at all shows up as a bare grey rectangle.
 */
function socialCard(locale: Locale, page: PageKind): string {
  const kind = page === 'pro' || page === 'join' ? page : 'home';
  return `${SITE_URL}/og/og-${locale}-${kind}.png`;
}

/**
 * robots.txt keeps a crawler from *fetching* a preview page, but a URL that is
 * linked from elsewhere can still be listed without ever being fetched. The
 * meta tag is what actually keeps it out of the index, so preview builds carry
 * both. It renders to nothing for the real site.
 */
function robotsMeta(): string {
  return IS_PRODUCTION_BUILD ? '' : '<meta name="robots" content="noindex, nofollow">\n    ';
}

function head({ locale, page, title, description }: Omit<PageOptions, 'body'>): string {
  const canonical = `${SITE_URL}${pathFor(locale, page)}`;
  const card = socialCard(locale, page);
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
    ${robotsMeta()}${alternates}
    <link rel="alternate" hreflang="x-default" href="${SITE_URL}/nl/">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="Buurklus">
    <meta property="og:title" content="${esc(title)}">
    <meta property="og:description" content="${esc(description)}">
    <meta property="og:url" content="${canonical}">
    <meta property="og:locale" content="${COPY[locale].meta.ogLocale}">
    <meta property="og:image" content="${card}">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:image:alt" content="${esc(title)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${esc(title)}">
    <meta name="twitter:description" content="${esc(description)}">
    <meta name="twitter:image" content="${card}">
    <meta name="theme-color" content="#0F6F5C">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="apple-touch-icon" href="/icons/icon-180.png">
    <link rel="manifest" href="/site.webmanifest">
    <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/styles.css">
    ${structuredData(locale, page)}
  </head>
  <body>`;
}

function brand(locale: Locale): string {
  const mark = `<span class="brand__mark">${icon('construct-outline', 20)}</span>`;
  return `<a class="brand" href="${pathFor(locale, 'home')}">${mark}<span>Buurklus</span></a>`;
}

function langSwitcher(locale: Locale, page: PageKind): string {
  const labels: Record<Locale, string> = { nl: 'NL', en: 'EN' };
  const links = SUPPORTED_LOCALES.map(
    (other) =>
      `<a href="${pathFor(other, page)}" hreflang="${other}" aria-current="${other === locale}">${labels[other]}</a>`,
  ).join('');
  return `<nav class="langs" aria-label="${esc(COPY[locale].footer.languageLabel)}">${links}</nav>`;
}

function header(locale: Locale, page: PageKind): string {
  const copy = COPY[locale];
  // A legal page has no sections of its own worth jumping to, so it borrows
  // the home navigation and lets the reader get back out.
  const links =
    page !== 'pro'
      ? `<a href="${pathFor(locale, 'home')}#trades">${esc(copy.nav.trades)}</a>
         <a href="${pathFor(locale, 'home')}#how">${esc(copy.nav.how)}</a>
         <a href="${pathFor(locale, 'pro')}">${esc(copy.nav.pros)}</a>
         <a href="${pathFor(locale, 'contact')}">${esc(copy.footer.links.contact)}</a>`
      : `<a href="#pricing">${esc(copy.nav.pricing)}</a>
         <a href="#pro-how">${esc(copy.pro.how.title)}</a>
         <a href="${pathFor(locale, 'home')}">${esc(copy.nav.forCustomers)}</a>
         <a href="${pathFor(locale, 'contact')}">${esc(copy.footer.links.contact)}</a>`;

  // Both labels ship; the stylesheet picks the short one on narrow screens,
  // where the full French label wraps onto three lines and eats the header.
  const ctaLabels = (long: string, short: string) =>
    `<span class="nav__ctaLong">${esc(long)}</span><span class="nav__ctaShort">${esc(short)}</span>`;

  // The call to action goes to the sign-up page from everywhere. It used to
  // point at "#pricing" on every page that was not the home page, which is a
  // section that exists only on two of them — so on the other twelve the
  // button did nothing at all except put a # in the address bar.
  const cta = `<a class="btn btn--primary btn--sm nav__cta" href="${pathFor(locale, 'join')}">${
    page === 'pro'
      ? ctaLabels(copy.pro.hero.cta, copy.pro.hero.ctaShort)
      : ctaLabels(copy.nav.cta, copy.nav.ctaShort)
  }</a>`;

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

function footer(locale: Locale, page: PageKind): string {
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
            <li><a href="${pathFor(locale, 'join')}">${esc(copy.nav.cta)}</a></li>
            <li><a href="${pathFor(locale, 'pro')}">${esc(copy.nav.pros)}</a></li>
            <li><a href="${pathFor(locale, 'home')}#faq">${esc(l.help)}</a></li>
            <li><a href="${pathFor(locale, 'contact')}">${esc(l.contact)}</a></li>
          </ul>
        </div>
        <div>
          <h3>${esc(copy.footer.legal)}</h3>
          <ul>
            ${LEGAL_PAGES.map(
              (document) =>
                `<li><a href="${legalPath(document.key, locale)}">${esc(
                  CHROME[locale].pageNames[document.key],
                )}</a></li>`,
            ).join('\n            ')}
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
// Registration
// ---------------------------------------------------------------------------

/**
 * The one page on the site that asks for something. Two sides of the
 * marketplace share one form: the fields a professional needs appear when the
 * professional side is chosen, rather than living on a second page that would
 * halve the number of people who reach either.
 *
 * The form posts with fetch to the API. Without JavaScript it cannot submit,
 * and the page says so plainly instead of presenting a button that does
 * nothing.
 */
function joinForm(locale: Locale): string {
  const copy = JOIN_COPY[locale];
  const f = copy.form;

  const cities = [...CITIES]
    .sort((a, b) => localize(a.name, locale).localeCompare(localize(b.name, locale), locale))
    .map((city) => `<option value="${esc(city.slug)}">${esc(localize(city.name, locale))}</option>`)
    .join('');

  const trades = ROOT_CATEGORIES.map(
    (category) => `<label class="chip chip--check">
      <input type="checkbox" name="categorySlugs" value="${esc(category.slug)}">
      <span>${esc(localize(category.name, locale))}</span>
    </label>`,
  ).join('');

  const privacyHref = legalPath('PRIVACY', locale);

  return `<form class="join__form" id="joinForm" novalidate>
    <fieldset>
      <legend class="join__legend">${esc(f.legend)}</legend>

      <div class="field">
        <label for="email">${esc(f.email)}</label>
        <input type="email" id="email" name="email" autocomplete="email" required
               inputmode="email" spellcheck="false">
        <p class="field__hint">${esc(f.emailHint)}</p>
      </div>

      <div class="field">
        <label for="name">
          <span data-role-label="CUSTOMER">${esc(f.nameCustomer)}</span><span data-role-label="PRO" hidden>${esc(f.namePro)}</span>
          <span class="field__optional">${esc(f.optional)}</span>
        </label>
        <input type="text" id="name" name="name" autocomplete="name" maxlength="120">
      </div>

      <div class="field" data-role="PRO" hidden>
        <label for="kvk">${esc(f.kvk)}</label>
        <input type="text" id="kvk" name="kvk" inputmode="numeric" maxlength="12" autocomplete="off">
        <p class="field__hint">${esc(f.kvkHint)}</p>
      </div>

      <div class="field">
        <label for="citySlug">${esc(f.city)}</label>
        <select id="citySlug" name="citySlug">
          <option value="">${esc(f.cityPlaceholder)}</option>
          ${cities}
        </select>
      </div>

      <div class="field" data-role="PRO" hidden>
        <span class="field__label">${esc(f.trades)}</span>
        <div class="chips chips--wrap">${trades}</div>
        <p class="field__hint">${esc(f.tradesHint)}</p>
      </div>

      <div class="field">
        <label for="phone">
          ${esc(f.phone)} <span class="field__optional">${esc(f.optional)}</span>
        </label>
        <input type="tel" id="phone" name="phone" autocomplete="tel" maxlength="20">
        <p class="field__hint">${esc(f.phoneHint)}</p>
      </div>

      <!-- Invisible to a person, irresistible to a form filler. The API drops
           any request that fills it in, and says nothing about why. -->
      <div class="honeypot" aria-hidden="true">
        <label for="website">Website</label>
        <input type="text" id="website" name="website" tabindex="-1" autocomplete="off">
      </div>

      <label class="check">
        <input type="checkbox" id="consent" name="consent" required>
        <span>${esc(f.consent)}
          <a href="${privacyHref}">${esc(
            locale === 'en' ? 'Read the privacy statement' : 'Lees het privacybeleid',
          )}</a></span>
      </label>

      <p class="join__error" id="joinError" role="alert" hidden></p>
      ${mailFallback(copy.states.mailFallback, 'joinFallback')}

      <button class="btn btn--primary btn--block" type="submit" id="joinSubmit">${esc(f.submit)}</button>
      <noscript><p class="join__error">${esc(copy.states.noScript)}</p>${mailFallback(
        copy.states.mailFallback,
      )}</noscript>
    </fieldset>
  </form>

  <div class="join__done" id="joinDone" role="status" hidden>
    <span class="join__doneMark">${solidIcon('check', 26)}</span>
    <h3 id="joinDoneTitle"></h3>
    <p id="joinDoneBody"></p>
  </div>`;
}

function joinBody(locale: Locale): string {
  const copy = JOIN_COPY[locale];
  const site = COPY[locale];

  const roleCard = (role: 'customer' | 'pro') => {
    const card = copy.roles[role];
    const bullets = card.bullets
      .map(
        (item) =>
          `<li><span class="plan__tick">${solidIcon('check', 16)}</span><span>${esc(item)}</span></li>`,
      )
      .join('');
    return `<article class="joinCard" data-role-card="${role === 'pro' ? 'PRO' : 'CUSTOMER'}">
      <h2>${esc(card.title)}</h2>
      <p class="muted">${esc(card.body)}</p>
      <ul class="plan__features">${bullets}</ul>
    </article>`;
  };

  const steps = copy.next.steps
    .map(
      (step, index) => `<article class="card">
        <span class="card__step">${index + 1}</span>
        <h3>${esc(step.title)}</h3>
        <p class="muted">${esc(step.body)}</p>
      </article>`,
    )
    .join('');

  const promise = copy.promise.items
    .map(
      (item) =>
        `<li><span class="plan__tick">${solidIcon('shield-check', 16)}</span><span>${esc(item)}</span></li>`,
    )
    .join('');

  return `
  <section class="section join">
    <div class="wrap">
      <div class="join__head">
        <span class="eyebrow">${solidIcon('check', 14)} ${esc(copy.hero.eyebrow)}</span>
        <h1>${esc(copy.hero.title)}</h1>
        <p class="lede muted">${esc(copy.hero.subtitle)}</p>
      </div>

      <!-- The choice comes before the form, because which side you are on
           changes what is asked and what is promised. -->
      <div class="seg seg--role" role="radiogroup" aria-label="${esc(site.nav.pros)}" id="roleGroup">
        <button type="button" class="seg__btn" role="radio" data-choose-role="CUSTOMER" aria-checked="true">${esc(
          copy.roles.customer.label,
        )}</button>
        <button type="button" class="seg__btn" role="radio" data-choose-role="PRO" aria-checked="false">${esc(
          copy.roles.pro.label,
        )}</button>
      </div>

      <div class="join__grid">
        <div class="join__pitch">
          ${roleCard('customer')}
          ${roleCard('pro')}
          <div class="joinCard joinCard--promise">
            <h2>${esc(copy.promise.title)}</h2>
            <ul class="plan__features">${promise}</ul>
          </div>
        </div>
        <div class="join__panel">${joinForm(locale)}</div>
      </div>
    </div>
  </section>

  <section class="section section--tint">
    <div class="wrap">
      <div class="section__head"><h2>${esc(copy.next.title)}</h2></div>
      <div class="grid grid--3">${steps}</div>
    </div>
  </section>`;
}

/**
 * A way through when the form cannot deliver: the operator's own address. It
 * renders to nothing while OPERATOR.email is still empty, so the site never
 * points at an inbox nobody reads. Give it an id and it starts out hidden, for
 * the script to reveal when a request fails.
 */
export function mailFallback(lead: string, id?: string, email = OPERATOR.email): string {
  if (!email) return '';
  const address = esc(email);
  return `<p class="join__fallback muted"${id ? ` id="${id}" hidden` : ''}>${esc(
    lead,
  )} <a href="mailto:${address}">${address}</a></p>`;
}

/**
 * The form's behaviour. Inline rather than a separate file so the page works
 * from any host with no build step and no second request, and written in plain
 * ES5-ish JavaScript so an older phone browser does not silently drop it.
 */
function joinScript(locale: Locale): string {
  const copy = JOIN_COPY[locale];
  const state = {
    api: SIGNUP_ENDPOINT,
    locale,
    strings: copy.states,
    submit: copy.form.submit,
    submitting: copy.form.submitting,
  };

  return `<script>
(function () {
  var config = ${JSON.stringify(state).replace(/<\//g, '<\\/')};
  var form = document.getElementById('joinForm');
  var done = document.getElementById('joinDone');
  var error = document.getElementById('joinError');
  var button = document.getElementById('joinSubmit');
  if (!form) return;

  var role = 'CUSTOMER';

  function applyRole(next) {
    role = next;
    form.querySelectorAll('[data-role]').forEach(function (el) {
      el.hidden = el.getAttribute('data-role') !== role;
    });
    document.querySelectorAll('[data-role-label]').forEach(function (el) {
      el.hidden = el.getAttribute('data-role-label') !== role;
    });
    document.querySelectorAll('[data-role-card]').forEach(function (el) {
      el.hidden = el.getAttribute('data-role-card') !== role;
    });
    document.querySelectorAll('#roleGroup .seg__btn').forEach(function (button) {
      button.setAttribute('aria-checked', String(button.getAttribute('data-choose-role') === role));
    });
  }

  document.getElementById('roleGroup').addEventListener('click', function (event) {
    var button = event.target.closest('.seg__btn');
    if (button) applyRole(button.getAttribute('data-choose-role'));
  });

  function show(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    show('');

    var email = form.email.value.trim();
    // Checked here only to save a round trip and give a useful message; the
    // API validates everything again, because a browser is not a boundary.
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) {
      show(config.strings.validationEmail);
      form.email.focus();
      return;
    }
    if (!form.consent.checked) {
      show(config.strings.validationConsent);
      form.consent.focus();
      return;
    }
    var kvk = form.kvk.value.replace(/\\D/g, '');
    if (role === 'PRO' && kvk.length !== 8) {
      show(config.strings.validationKvk);
      form.kvk.focus();
      return;
    }

    var trades = [];
    form.querySelectorAll('input[name="categorySlugs"]:checked').forEach(function (box) {
      trades.push(box.value);
    });

    var payload = {
      role: role,
      email: email,
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      citySlug: form.citySlug.value,
      locale: config.locale,
      consent: true,
      website: form.website.value,
    };
    if (role === 'PRO') {
      payload.kvk = kvk;
      payload.categorySlugs = trades.slice(0, 5);
    }

    button.disabled = true;
    button.textContent = config.submitting;

    fetch(config.api, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-buurklus-locale': config.locale },
      body: JSON.stringify(payload),
    })
      .then(function (response) {
        return response.json().then(function (body) {
          return { ok: response.ok, body: body };
        });
      })
      .then(function (result) {
        if (!result.ok) {
          show((result.body && result.body.error && result.body.error.message) || config.strings.errorBody);
          return;
        }
        var repeat = result.body && result.body.alreadyRegistered;
        document.getElementById('joinDoneTitle').textContent =
          repeat ? config.strings.againTitle : config.strings.successTitle;
        document.getElementById('joinDoneBody').textContent =
          repeat ? config.strings.againBody : config.strings.successBody;
        form.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ block: 'center', behavior: 'smooth' });
      })
      .catch(function () {
        // A failed request means nothing reached us, and saying so stops
        // somebody assuming they are on a list they are not on. The address
        // below it is the way through while that lasts.
        show(config.strings.offlineBody);
        var fallback = document.getElementById('joinFallback');
        if (fallback) fallback.hidden = false;
      })
      .then(function () {
        button.disabled = false;
        button.textContent = config.submit;
      });
  });

  applyRole('CUSTOMER');
})();
</script>`;
}

export function renderJoin(locale: Locale): string {
  const copy = JOIN_COPY[locale];
  return page({
    locale,
    page: 'join',
    title: copy.meta.title,
    description: copy.meta.description,
    body: joinBody(locale) + joinScript(locale),
  });
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

function contactBody(locale: Locale): string {
  const copy = CONTACT_COPY[locale];
  const f = copy.form;
  const privacyHref = legalPath('PRIVACY', locale);

  const promises = copy.privacy.items
    .map((item) => `<li><span class="check">${solidIcon('check', 15)}</span>${esc(item)}</li>`)
    .join('');

  return `
  <section class="section">
    <div class="wrap">
      <div class="join__grid">
        <div class="join__pitch">
          <div class="joinCard">
            <h1>${esc(copy.title)}</h1>
            <p class="lede muted">${esc(copy.lede)}</p>
          </div>
          <div class="joinCard joinCard--promise">
            <h2>${esc(copy.privacy.title)}</h2>
            <ul class="plan__features">${promises}</ul>
            <p class="field__hint"><a href="${privacyHref}">${esc(copy.privacy.link)}</a></p>
          </div>
          <div class="joinCard">
            <h2>${esc(copy.alternatives.title)}</h2>
            <p class="muted">${esc(copy.alternatives.body)}</p>
          </div>
        </div>

        <div class="join__panel">
          <form class="join__form" id="contactForm" novalidate>
            <fieldset>
              <legend>${esc(f.legend)}</legend>

              <div class="field">
                <label for="contactName">${esc(f.name)}</label>
                <input id="contactName" name="name" type="text" autocomplete="name" required>
              </div>

              <div class="field">
                <label for="contactEmail">${esc(f.email)}</label>
                <input id="contactEmail" name="email" type="email" autocomplete="email" required>
                <p class="field__hint">${esc(f.emailHint)}</p>
              </div>

              <div class="field">
                <label for="contactMessage">${esc(f.message)}</label>
                <textarea id="contactMessage" name="message" rows="7" maxlength="${CONTACT_MESSAGE_MAX}" required></textarea>
                <p class="field__hint">${esc(f.messageHint)}</p>
              </div>

              <div class="honeypot" aria-hidden="true">
                <label for="contactWebsite">Website</label>
                <input id="contactWebsite" name="website" type="text" tabindex="-1" autocomplete="off">
              </div>

              <p class="join__error" id="contactError" role="alert" hidden></p>
              ${mailFallback(JOIN_COPY[locale].states.mailFallback, 'contactFallback')}

              <button class="btn btn--primary btn--block" type="submit" id="contactSubmit">${esc(f.submit)}</button>
              <noscript><p class="join__error">${esc(copy.states.noScript)}</p>${mailFallback(
                JOIN_COPY[locale].states.mailFallback,
              )}</noscript>
            </fieldset>
          </form>

          <div class="join__done" id="contactDone" role="status" hidden>
            <span class="join__doneMark">${solidIcon('check', 26)}</span>
            <h3>${esc(copy.states.successTitle)}</h3>
            <p>${esc(copy.states.successBody)}</p>
          </div>
        </div>
      </div>
    </div>
  </section>`;
}

/** Inline for the same reasons as the sign-up form: no build step, one request. */
function contactScript(locale: Locale): string {
  const copy = CONTACT_COPY[locale];
  const state = {
    api: CONTACT_ENDPOINT,
    locale,
    strings: copy.states,
    submit: copy.form.submit,
    submitting: copy.form.submitting,
  };

  return `<script>
(function () {
  var config = ${JSON.stringify(state).replace(/<\//g, '<\\/')};
  var form = document.getElementById('contactForm');
  var done = document.getElementById('contactDone');
  var error = document.getElementById('contactError');
  var button = document.getElementById('contactSubmit');
  if (!form) return;

  function show(message) {
    error.textContent = message;
    error.hidden = !message;
  }

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    show('');

    var name = form.name.value.trim();
    var email = form.email.value.trim();
    var message = form.message.value.trim();

    // Checked here to save a round trip and give a useful message; the server
    // checks all of it again, because a browser is not a boundary.
    if (name.length < 2) { show(config.strings.errorName); form.name.focus(); return; }
    if (!/^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(email)) { show(config.strings.errorEmail); form.email.focus(); return; }
    if (message.length < 10) { show(config.strings.errorMessage); form.message.focus(); return; }

    button.disabled = true;
    button.textContent = config.submitting;

    fetch(config.api, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: name,
        email: email,
        message: message,
        locale: config.locale,
        website: form.website.value,
      }),
    })
      .then(function (response) {
        return response.json().catch(function () { return {}; }).then(function (body) {
          return { status: response.status, ok: response.ok, body: body };
        });
      })
      .then(function (result) {
        if (result.status === 429) { show(config.strings.tooMany); return; }
        if (!result.ok) { show(config.strings.errorBody); return; }
        form.hidden = true;
        done.hidden = false;
        done.scrollIntoView({ block: 'center', behavior: 'smooth' });
      })
      .catch(function () {
        show(config.strings.offlineBody);
        var fallback = document.getElementById('contactFallback');
        if (fallback) fallback.hidden = false;
      })
      .then(function () {
        button.disabled = false;
        button.textContent = config.submit;
      });
  });
})();
</script>`;
}

export function renderContact(locale: Locale): string {
  const copy = CONTACT_COPY[locale];
  return page({
    locale,
    page: 'contact',
    title: copy.meta.title,
    description: copy.meta.description,
    body: contactBody(locale) + contactScript(locale),
  });
}

// ---------------------------------------------------------------------------
// Legal pages
// ---------------------------------------------------------------------------

const LEGAL: Record<Locale, LegalCopy> = { nl: LEGAL_NL, en: LEGAL_EN };
const CHROME: Record<Locale, LegalChrome> = { nl: CHROME_NL, en: CHROME_EN };

function table(headings: string[], rows: string[][]): string {
  const head = headings.map((cell) => `<th scope="col">${esc(cell)}</th>`).join('');
  const body = rows
    .map((row) => `<tr>${row.map((cell) => `<td>${esc(cell)}</td>`).join('')}</tr>`)
    .join('');
  // Wrapped so a wide table scrolls inside itself rather than pushing the
  // whole page sideways on a phone.
  return `<div class="tableWrap"><table class="legalTable"><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

/**
 * Who is responsible for the processing. There is no registered company yet,
 * so rather than printing a plausible-looking blank this states plainly what
 * is missing. The box disappears by itself once OPERATOR is filled in.
 */
function operatorBlock(locale: Locale): string {
  const chrome = CHROME[locale];
  const missing = missingOperatorFields();

  const fields: [string, string | null][] = [
    ['legalName', OPERATOR.legalName],
    ['kvk', OPERATOR.kvk],
    ['vatId', OPERATOR.vatId],
    ['address', OPERATOR.address],
    ['email', OPERATOR.email],
  ];
  const known = fields.filter((entry): entry is [string, string] => entry[1] !== null);

  const knownList = known.length
    ? `<ul class="legalList">${known
        .map(([field, value]) => `<li>${esc(chrome.incompleteFields[field] ?? field)}: ${esc(value)}</li>`)
        .join('')}</ul>`
    : '';

  if (missing.length === 0) return knownList;

  return `${knownList}<aside class="notice notice--warn">
    <h3>${esc(chrome.incompleteTitle)}</h3>
    <p>${esc(chrome.incompleteBody)}</p>
    <ul class="legalList">${missing
      .map((field) => `<li>${esc(chrome.incompleteFields[field] ?? field)}</li>`)
      .join('')}</ul>
  </aside>`;
}

/** Days as something a person reads: "1 dag", "7 jaar". */
function humanDays(days: number, locale: Locale): string {
  const words =
    locale === 'en'
      ? { day: 'day', days: 'days', month: 'months', year: 'year', years: 'years' }
      : { day: 'dag', days: 'dagen', month: 'maanden', year: 'jaar', years: 'jaar' };

  if (days % 365 === 0) {
    const years = days / 365;
    return `${count(years, locale)} ${years === 1 ? words.year : words.years}`;
  }
  if (days % 30 === 0 && days >= 60) return `${count(days / 30, locale)} ${words.month}`;
  return `${count(days, locale)} ${days === 1 ? words.day : words.days}`;
}

function generatedBlock(section: LegalSection, locale: Locale): string {
  const chrome = CHROME[locale];
  const labels = chrome.tables;

  switch (section.generated) {
    case 'operator':
      return operatorBlock(locale);
    case 'dataCategories':
      return table(
        [labels.data, labels.purpose, labels.basis],
        chrome.dataCategories.map((row) => [row.data, row.purpose, row.basis]),
      );
    case 'processors':
      return table(
        [labels.processor, labels.role, labels.location],
        chrome.processors.map((row) => [row.processor, row.role, row.location]),
      );
    case 'rights':
      return table(
        [labels.right, labels.how],
        chrome.rights.map((row) => [row.right, row.how]),
      );
    case 'retention':
      // Straight out of @buurklus/shared, which is what the nightly sweep
      // reads too. The page and the deletion cannot disagree.
      return table(
        [labels.period, labels.reason],
        RETENTION.map((rule) => [humanDays(rule.days, locale), rule.reason[locale]]),
      );
    default:
      return '';
  }
}

function legalSection(section: LegalSection, locale: Locale): string {
  const paragraphs = (section.paragraphs ?? []).map((text) => `<p>${esc(text)}</p>`).join('');
  const list = section.list
    ? `<ul class="legalList">${section.list.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
    : '';

  return `<section class="legalSection">
    <h2>${esc(section.heading)}</h2>
    ${paragraphs}
    ${list}
    ${generatedBlock(section, locale)}
  </section>`;
}

function legalBody(key: LegalPageKey, locale: Locale): string {
  const document: LegalDocument = LEGAL[locale][key];
  const chrome = CHROME[locale];
  const meta = legalPage(key);

  const others = LEGAL_PAGES.filter((page) => page.key !== key)
    .map(
      (page) =>
        `<li><a href="${legalPath(page.key, locale)}">${esc(chrome.pageNames[page.key])}</a></li>`,
    )
    .join('');

  const authority =
    key === 'PRIVACY'
      ? `<p class="legal__authority"><a href="${SUPERVISORY_AUTHORITY.url}" rel="noopener">${esc(
          SUPERVISORY_AUTHORITY.name,
        )}</a></p>`
      : '';

  // The minimum age appears in two documents and comes from one constant, so
  // raising it cannot leave one page saying something else.
  const ageNote =
    key === 'TERMS' || key === 'PRIVACY'
      ? `<p class="muted legalAge">${esc(
          locale === 'en'
            ? `Minimum age for an account: ${MINIMUM_AGE}.`
            : `Minimumleeftijd voor een account: ${MINIMUM_AGE} jaar.`,
        )}</p>`
      : '';

  return `
  <article class="legal">
    <div class="wrap wrap--narrow">
      <header class="legal__head">
        <h1>${esc(document.title)}</h1>
        <p class="lede muted">${esc(document.intro)}</p>
        <p class="legal__meta">${esc(chrome.lastUpdated)}: <time datetime="${meta.version}">${esc(
          meta.version,
        )}</time></p>
        <p class="legal__meta">${esc(chrome.languageNote)}</p>
      </header>

      ${document.sections.map((section) => legalSection(section, locale)).join('')}
      ${authority}
      ${ageNote}

      <nav class="legal__others" aria-label="${esc(chrome.otherDocuments)}">
        <h2>${esc(chrome.otherDocuments)}</h2>
        <ul class="legalList">${others}</ul>
      </nav>
    </div>
  </article>`;
}

export function renderLegal(key: LegalPageKey, locale: Locale): string {
  const document = LEGAL[locale][key];
  return page({
    locale,
    page: key,
    title: `${document.title} — Buurklus`,
    description: document.metaDescription,
    body: legalBody(key, locale),
  });
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
  const en = locale === 'en';

  const quotes = [
    { name: 'Schildersbedrijf Bakker', price: 1250, stars: 5, meta: en ? '18 years’ experience' : '18 jaar ervaring' },
    { name: 'Van Dijk Afbouw', price: 1480, stars: 4, meta: en ? '34 reviews' : '34 beoordelingen' },
    { name: 'Klusbedrijf Yilmaz', price: 990, stars: 5, meta: en ? 'Replies in 40 min' : 'Reageert binnen 40 min' },
  ];

  const leads = [
    { name: en ? 'Paint a 25 m² living room' : 'Woonkamer van 25 m² schilderen', price: 1600, stars: 0, meta: 'Utrecht · Wittevrouwen' },
    { name: en ? 'Leak under the sink' : 'Lekkage onder de gootsteen', price: 400, stars: 0, meta: 'Amersfoort · Soesterkwartier' },
    { name: en ? 'Replace the consumer unit' : 'Groepenkast vervangen', price: 1200, stars: 0, meta: 'Amsterdam · De Pijp' },
  ];

  const rows = variant === 'pro' ? leads : quotes;

  /** Filled and empty stars as separate spans, so the rating reads at a glance. */
  const rating = (filled: number) =>
    filled === 0
      ? ''
      : `<span class="mock__stars" aria-hidden="true">${'★'.repeat(filled)}<span class="mock__starsOff">${'★'.repeat(5 - filled)}</span></span>`;

  const cards = rows
    .map(
      (row) => `<div class="mock__card">
        <div class="mock__row">
          <span class="mock__name">${esc(row.name)}</span>
          <span class="mock__price">${esc(money(eurosToCents(row.price), locale))}</span>
        </div>
        <div class="mock__row">
          ${rating(row.stars)}
          <span class="mock__meta">${esc(row.meta)}</span>
        </div>
      </div>`,
    )
    .join('');

  // The customer's own job at the top, so the quotes below have something to
  // be quotes *for*. Without it the screen was a price list from nowhere.
  const context =
    variant === 'pro'
      ? {
          title: en ? 'Jobs near you' : 'Klussen bij jou in de buurt',
          line: en ? 'Painting · Utrecht and 2 more' : 'Schilderwerk · Utrecht en 2 andere',
          footer: en ? '3 new since this morning' : '3 nieuw sinds vanochtend',
        }
      : {
          title: en ? 'Paint a 25 m² living room' : 'Woonkamer van 25 m² schilderen',
          line: en ? 'Utrecht · Within a week' : 'Utrecht · Binnen een week',
          footer: en ? '3 of 6 quotes received' : '3 van 6 offertes ontvangen',
        };

  const label = variant === 'pro' ? copy.pro.hero.subtitle : copy.hero.subtitle;

  return `<div class="mock" role="img" aria-label="${esc(label)}">
    <span class="mock__bar"></span>
    <div class="mock__job">
      <span class="mock__jobTitle">${esc(context.title)}</span>
      <span class="mock__jobMeta">${esc(context.line)}</span>
    </div>
    <div class="mock__cards">${cards}</div>
    <div class="mock__foot">
      <span class="mock__dot"></span>
      <span>${esc(context.footer)}</span>
    </div>
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
          <a class="btn btn--primary" href="${pathFor(locale, 'join')}">${esc(copy.hero.primaryCta)}</a>
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
        <span class="proof__value">KvK</span>
        <span class="proof__label">${esc(copy.proof.verified)}</span>
      </div>
    </div>
  </div>

  <section class="section" id="video">
    <div class="wrap">
      <div class="section__head">
        <h2>${esc(copy.video.title)}</h2>
        <p class="lede muted">${esc(copy.video.subtitle)}</p>
      </div>
      <!-- preload="none" so the three megabytes are fetched when somebody
           presses play and not before. The poster is what loads on arrival:
           one frame, 60 kB. No autoplay -- the film has sound, and a page
           that starts talking on its own is a page people close. -->
      <div class="videoFrame">
        <video
          class="video"
          controls
          preload="none"
          playsinline
          poster="/video/buurklus-poster.jpg"
          width="1080"
          height="1080"
          aria-label="${esc(copy.video.alt)}"
        >
          <source src="/video/buurklus.mp4" type="video/mp4">
          <track kind="subtitles" src="/video/buurklus-en.vtt" srclang="en" label="English">
          ${esc(copy.video.unsupported)}
        </video>
      </div>
      <p class="muted video__note">${solidIcon('check', 15)} ${esc(copy.video.subtitlesNote)}</p>
    </div>
  </section>

  <section class="section section--tint" id="how">
    <div class="wrap">
      <div class="section__head">
        <h2>${esc(copy.how.title)}</h2>
        <p class="lede muted">${esc(copy.how.subtitle)}</p>
      </div>
      <div class="grid grid--3">${steps}</div>
    </div>
  </section>

  <section class="section earlyDays">
    <div class="wrap wrap--narrow">
      <p class="earlyDays__title">${esc(copy.earlyDays.title)}</p>
      <p class="muted">${esc(copy.earlyDays.body)}</p>
    </div>
  </section>

  <section class="section" id="trades">
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
        <div class="banner__copy">
          <h2>${esc(copy.proTeaser.title)}</h2>
          <p>${esc(copy.proTeaser.body)}</p>
          <a class="btn btn--onDark banner__cta" href="${pathFor(locale, 'pro')}">${esc(copy.proTeaser.cta)}</a>
        </div>
        <ul class="banner__list">
          ${copy.proTeaser.bullets
            .map((b) => `<li><span class="banner__tick">${solidIcon('check', 18)}</span><span>${esc(b)}</span></li>`)
            .join('')}
        </ul>
      </div>
    </div>
  </section>

  <section class="section section--tint" id="faq">
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
        <a class="btn btn--onDark" href="${pathFor(locale, 'join')}">${esc(copy.hero.primaryCta)}</a>
      </div>
    </div>
  </section>`;
}

// ---------------------------------------------------------------------------
// Professionals page
// ---------------------------------------------------------------------------


/**
 * What the pricing section shows while nothing is on sale. The paid cards say
 * "choose this plan" next to a price, which would be a lie today, so they are
 * replaced rather than dressed up: one panel that says the platform is free,
 * what the free account actually gives you, and -- the part that matters --
 * that it will not start charging you without asking.
 */
/**
 * What Buurklus costs, as two cards side by side.
 *
 * There is no "free for now" card any more. A trial month is an invitation to
 * find out whether the thing is worth paying for; a permanently free tier is a
 * different promise, and mixing the two leaves somebody unsure which one they
 * are being made. The price is stated whether or not it can be paid yet.
 */
function offerCards(locale: Locale, copy: SiteCopy): string {
  const o = copy.pro.pricing.offer;
  const plan = ANNOUNCED_PLAN ?? AVAILABLE_PLANS.find((row) => !isFreePlan(row)) ?? null;
  if (!plan) return '';

  const values = {
    credits: count(plan.monthlyCredits, locale),
    trades: count(plan.maxCategories, locale),
    cities:
      plan.maxCities === null ? copy.pro.pricing.citiesAll : count(plan.maxCities, locale),
    saving: count(yearlySavingPercent(plan), locale),
    notice: count(PRICING_NOTICE_DAYS, locale),
    days: count(TRIAL_DURATION_DAYS, locale),
  };

  const points = o.points
    .map(
      (point) =>
        `<li><span class="plan__tick">${solidIcon('check', 17)}</span><span>${esc(fill(point, values))}</span></li>`,
    )
    .join('');

  const price = (amount: number) => `
    <div class="plan__price">
      <span class="plan__amount">${esc(money(eurosToCents(amount), locale))}</span>
      <span class="plan__period">${esc(o.perMonth)}</span>
    </div>`;

  return `<article class="card plan plan--featured">
    <span class="plan__badge">${esc(o.badge)}</span>
    <h3>${esc(o.monthly.label)}</h3>
    ${price(plan.monthlyPriceEur)}
    <p class="planned__note">${esc(fill(o.monthly.note, values))}</p>
    <ul class="plan__features">${points}</ul>
    <a class="btn btn--primary" href="${pathFor(locale, 'join')}">${esc(o.cta)}</a>
  </article>
  <article class="card plan">
    <h3>${esc(o.yearly.label)}</h3>
    ${price(monthlyRateOfYearly(plan))}
    <p class="planned__note">${esc(fill(o.yearly.note, values))}</p>
    <ul class="plan__features">${points}</ul>
    <a class="btn btn--ghost" href="${pathFor(locale, 'join')}">${esc(o.ctaYearly)}</a>
  </article>`;
}

/**
 * The work that is quoted rather than subscribed to. No figure appears here
 * on purpose: these are priced per job, and a number on this page would be
 * one somebody holds you to.
 */
function proServices(locale: Locale, copy: SiteCopy): string {
  const s = copy.pro.pricing.services;
  const items = s.items
    .map(
      (item) =>
        `<li><span class="plan__tick">${solidIcon('check', 17)}</span><span>${esc(item)}</span></li>`,
    )
    .join('');

  return `<section class="section">
    <div class="wrap wrap--narrow">
      <div class="card joinCard--promise">
        <h2>${esc(s.title)}</h2>
        <p class="muted">${esc(s.intro)}</p>
        <ul class="plan__features">${items}</ul>
        <a class="btn btn--ghost" href="${pathFor(locale, 'contact')}">${esc(s.cta)}</a>
      </div>
    </div>
  </section>`;
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
          <a class="btn btn--primary" href="${pathFor(locale, 'join')}">${esc(p.hero.cta)}</a>
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
        <h2>${esc(p.pricing.offer.title)}</h2>
        <p class="lede muted">${esc(p.pricing.offer.intro)}</p>
      </div>
      <div class="plans">${offerCards(locale, copy)}</div>
      <p class="muted planNote">
        ${esc(p.pricing.offer.vat)}<br>
        ${esc(fill(p.pricing.offer.notice, { notice: PRICING_NOTICE_DAYS }))}
      </p>
    </div>
  </section>

  ${proServices(locale, copy)}

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
        <a class="btn btn--onDark" href="${pathFor(locale, 'join')}">${esc(p.hero.cta)}</a>
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
  const kinds: PageKind[] = ['home', 'pro', 'join', 'contact', ...LEGAL_PAGES.map((page) => page.key)];
  const urls = SUPPORTED_LOCALES.flatMap((locale) =>
    kinds.map((kind) => `${SITE_URL}${pathFor(locale, kind)}`),
  );
  const today = new Date().toISOString().slice(0, 10);
  // The namespace is sitemaps.org, plural. A crawler that gets the singular
  // treats the document as unrecognised XML and indexes none of it.
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url><loc>${url}</loc><lastmod>${today}</lastmod></url>`).join('\n')}
</urlset>
`;
}

/**
 * The manifest a phone reads when someone adds the site to their home screen.
 * Modest on purpose: this is a website, not an installable app, and claiming
 * "standalone" would give a shortcut that opens without a back button.
 */
export function renderManifest(): string {
  return `${JSON.stringify(
    {
      name: 'Buurklus',
      short_name: 'Buurklus',
      description: COPY.nl.meta.description,
      start_url: '/nl/',
      display: 'browser',
      background_color: '#F1F9F6',
      theme_color: '#0F6F5C',
      lang: 'nl',
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml' },
      ],
    },
    null,
    2,
  )}\n`;
}

/**
 * The page a mistyped URL lands on. Dutch, because a link that got mangled
 * carries no language, and it offers the way back rather than an apology.
 */
export function renderNotFound(): string {
  const copy = COPY.nl;
  return `<!doctype html>
<html lang="nl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Pagina niet gevonden — Buurklus</title>
    <meta name="robots" content="noindex">
    <meta name="theme-color" content="#0F6F5C">
    <link rel="icon" href="/favicon.svg" type="image/svg+xml">
    <link rel="preload" href="/fonts/inter-latin.woff2" as="font" type="font/woff2" crossorigin>
    <link rel="stylesheet" href="/styles.css">
  </head>
  <body>
    <main class="section">
      <div class="wrap wrap--narrow notFound">
        <h1>Deze pagina bestaat niet</h1>
        <p class="lede muted">
          De link klopt niet meer, of hij is verkeerd overgenomen. Hieronder kom je weer verder.
        </p>
        <p class="notFound__actions">
          <a class="btn btn--primary" href="/nl/">${esc(copy.nav.trades)}</a>
          <a class="btn btn--ghost" href="${pathFor('nl', 'join')}">${esc(copy.nav.cta)}</a>
          <a class="btn btn--ghost" href="/en/">English</a>
        </p>
      </div>
    </main>
  </body>
</html>
`;
}

export function renderRobots(): string {
  // A preview deployment is the same site on a different hostname. Left
  // crawlable it splits the ranking with the real domain and can outrank it,
  // so anything that is not the production build is closed off completely.
  if (!IS_PRODUCTION_BUILD) {
    return `User-agent: *\nDisallow: /\n`;
  }
  return `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}/sitemap.xml\n`;
}
