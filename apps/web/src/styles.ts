/**
 * One stylesheet for both reading directions. Every inline offset uses a CSS
 * logical property (`margin-inline-start`, `border-inline-end`, `inset-inline`)
 * so `dir="rtl"` on the document flips the layout without a second file and
 * without a single `[dir="rtl"]` override.
 *
 * The palette and the type scale mirror apps/mobile/src/theme, so the site and
 * the app read as one product.
 */
export const STYLES = `
:root {
  --green-900: #06342B;
  --green-700: #0B5546;
  --green-600: #0F6F5C;
  --green-100: #DCEFEA;
  --green-50:  #F1F9F6;
  --terracotta-600: #B4552F;
  --terracotta-500: #D2673B;
  --terracotta-100: #FBE7DE;
  --saffron-500: #E2A33C;
  --saffron-100: #FDF2DE;
  --ink-900: #14201D;
  --ink-700: #33433F;
  --ink-500: #5C706B;
  --ink-300: #93A5A0;
  --ink-200: #C7D3CF;
  --ink-100: #E4EBE9;
  --ink-50:  #F5F8F7;
  --white: #FFFFFF;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  --page: min(1160px, 100% - 2.5rem);
  --shadow-card: 0 4px 14px rgba(20, 32, 29, 0.06);
  --shadow-raised: 0 12px 32px rgba(20, 32, 29, 0.12);

  --font: "Inter", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;
  --font-ar: "Noto Naskh Arabic", "Geeza Pro", "Segoe UI", system-ui, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; }

html { -webkit-text-size-adjust: 100%; scroll-behavior: smooth; }

body {
  margin: 0;
  font-family: var(--font);
  font-size: 17px;
  line-height: 1.65;
  color: var(--ink-900);
  background: var(--white);
  -webkit-font-smoothing: antialiased;
}

html[lang="ar"] body { font-family: var(--font-ar); line-height: 1.9; }

h1, h2, h3 { line-height: 1.2; margin: 0; letter-spacing: -0.015em; font-weight: 700; }
h1 { font-size: clamp(2.1rem, 5.2vw, 3.5rem); }
h2 { font-size: clamp(1.6rem, 3.4vw, 2.3rem); }
h3 { font-size: 1.15rem; font-weight: 600; }
p  { margin: 0; }
a  { color: inherit; text-decoration: none; }
ul { margin: 0; padding: 0; list-style: none; }
img, svg { max-width: 100%; display: block; }

.wrap { width: var(--page); margin-inline: auto; }
.muted { color: var(--ink-500); }
.section { padding-block: clamp(3.5rem, 8vw, 6rem); }
.section--tint { background: var(--ink-50); }
.section__head { max-width: 46rem; margin-block-end: 2.5rem; display: grid; gap: 0.75rem; }

/* --- Buttons -------------------------------------------------------------- */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 52px;
  padding-inline: 1.6rem;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 1rem;
  font-family: inherit;
  cursor: pointer;
  transition: transform 0.12s ease, background-color 0.12s ease, box-shadow 0.12s ease;
}
.btn:hover { transform: translateY(-1px); }
.btn:focus-visible { outline: 3px solid var(--green-600); outline-offset: 3px; }
.btn--primary { background: var(--green-600); color: var(--white); box-shadow: var(--shadow-card); }
.btn--primary:hover { background: var(--green-700); }
.btn--ghost { background: transparent; color: var(--green-700); border-color: var(--ink-200); }
.btn--ghost:hover { background: var(--green-50); }
.btn--onDark { background: var(--white); color: var(--green-700); }
.btn--sm { min-height: 42px; padding-inline: 1.1rem; font-size: 0.94rem; }

/* --- Header --------------------------------------------------------------- */
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(10px);
  border-block-end: 1px solid var(--ink-100);
}
.header__inner { display: flex; align-items: center; gap: 1.5rem; min-height: 72px; }
.brand { display: inline-flex; align-items: center; gap: 0.65rem; font-weight: 700; font-size: 1.2rem; }
.brand__mark {
  inline-size: 36px;
  block-size: 36px;
  border-radius: 10px;
  background: var(--green-600);
  display: grid;
  place-items: center;
  color: var(--white);
  flex: none;
}
.nav { display: flex; align-items: center; gap: 1.25rem; margin-inline-start: auto; }
/* Scoped to the link group: a bare ".nav a" rule also caught the call-to-action
   and the language chips, painting dark text onto the green button. The CSS
   lives in a template literal, so backticks cannot appear in these comments. */
.nav__links { display: flex; align-items: center; gap: 1.5rem; }
.nav__links a { color: var(--ink-700); font-size: 0.97rem; font-weight: 500; white-space: nowrap; }
.nav__links a:hover { color: var(--green-700); }
.nav__cta { margin-inline-start: 0.25rem; }
@media (max-width: 860px) {
  .nav__links { display: none; }
}
/* Below this the brand, the language switcher and the call to action no longer
   fit on one row — in French the button alone is 110px — so the header wraps
   onto two rows rather than pushing the page sideways. */
@media (max-width: 560px) {
  .header__inner { flex-wrap: wrap; min-height: 0; padding-block: 0.7rem; gap: 0.7rem; }
  .nav { inline-size: 100%; margin-inline-start: 0; justify-content: space-between; gap: 0.5rem; }
  .nav__cta { margin-inline-start: 0; }
}

/* --- Language switcher ---------------------------------------------------- */
.langs { display: inline-flex; gap: 0.25rem; }
.langs a {
  min-inline-size: 2.4rem;
  padding: 0.3rem 0.7rem;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 600;
  text-align: center;
  color: var(--ink-500);
  border: 1px solid var(--ink-100);
}
.langs a:hover { background: var(--ink-50); }
.langs a[aria-current="true"] { background: var(--green-600); color: var(--white); }

/* --- Hero ----------------------------------------------------------------- */
.hero { background: linear-gradient(170deg, var(--green-50), var(--white) 62%); }
.hero__inner {
  display: grid;
  gap: clamp(2rem, 5vw, 4rem);
  align-items: center;
  padding-block: clamp(3rem, 7vw, 5.5rem);
  grid-template-columns: 1fr;
}
@media (min-width: 940px) { .hero__inner { grid-template-columns: 1.05fr 0.95fr; } }
.hero__copy { display: grid; gap: 1.35rem; max-width: 36rem; }
.hero__actions { display: flex; flex-wrap: wrap; gap: 0.85rem; }
.hero__note { font-size: 0.9rem; color: var(--ink-500); }

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  align-self: start;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-pill);
  background: var(--terracotta-100);
  color: var(--terracotta-600);
  font-size: 0.85rem;
  font-weight: 600;
}
.lede { font-size: clamp(1.05rem, 2vw, 1.2rem); color: var(--ink-700); }

/* --- Phone mock ----------------------------------------------------------- */
.mock {
  justify-self: center;
  inline-size: min(320px, 82vw);
  aspect-ratio: 9 / 18.5;
  border-radius: 38px;
  background: var(--white);
  border: 10px solid var(--green-900);
  box-shadow: var(--shadow-raised);
  padding: 1.25rem 1rem;
  display: grid;
  gap: 0.75rem;
  align-content: start;
  overflow: hidden;
}
.mock__bar { inline-size: 42%; block-size: 6px; border-radius: 3px; background: var(--ink-100); margin-inline: auto; }
.mock__title { font-weight: 700; font-size: 1.05rem; }
.mock__card {
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-md);
  padding: 0.75rem 0.85rem;
  display: grid;
  gap: 0.3rem;
  box-shadow: var(--shadow-card);
}
.mock__row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.mock__name { font-weight: 600; font-size: 0.9rem; line-height: 1.3; }
.mock__price { font-weight: 700; color: var(--green-700); font-size: 0.95rem; white-space: nowrap; }
.mock__meta { font-size: 0.78rem; color: var(--ink-500); }
.mock__stars { color: var(--saffron-500); font-size: 0.8rem; letter-spacing: 0.06em; }

/* --- Proof strip ---------------------------------------------------------- */
.proof {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  padding-block: 2rem;
  border-block: 1px solid var(--ink-100);
}
.proof__item { display: grid; gap: 0.15rem; }
.proof__value { font-size: 1.7rem; font-weight: 700; color: var(--green-700); }
.proof__label { font-size: 0.9rem; color: var(--ink-500); }

/* --- Cards ---------------------------------------------------------------- */
.grid { display: grid; gap: 1.15rem; }
.grid--3 { grid-template-columns: repeat(auto-fit, minmax(270px, 1fr)); }
.grid--4 { grid-template-columns: repeat(auto-fit, minmax(215px, 1fr)); }

.card {
  background: var(--white);
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  display: grid;
  gap: 0.6rem;
  align-content: start;
  box-shadow: var(--shadow-card);
}
.card__icon {
  inline-size: 44px;
  block-size: 44px;
  border-radius: var(--radius-md);
  background: var(--green-50);
  color: var(--green-600);
  display: grid;
  place-items: center;
  margin-block-end: 0.35rem;
}
.card__step {
  inline-size: 34px;
  block-size: 34px;
  border-radius: var(--radius-pill);
  background: var(--green-600);
  color: var(--white);
  display: grid;
  place-items: center;
  font-weight: 700;
  margin-block-end: 0.35rem;
}

/* --- Trades --------------------------------------------------------------- */
.trade {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.9rem 1.05rem;
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-md);
  background: var(--white);
  transition: border-color 0.12s ease, transform 0.12s ease;
}
.trade:hover { border-color: var(--green-600); transform: translateY(-2px); }
.trade__icon { color: var(--green-600); flex: none; }
.trade__name { font-weight: 600; font-size: 0.97rem; }
.trade__budget { font-size: 0.8rem; color: var(--ink-500); }

/* --- Cities --------------------------------------------------------------- */
.cities { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.city {
  padding: 0.45rem 0.95rem;
  border-radius: var(--radius-pill);
  background: var(--white);
  border: 1px solid var(--ink-100);
  font-size: 0.92rem;
}
.city--more { background: transparent; border-style: dashed; color: var(--ink-500); }

/* --- Pro banner ----------------------------------------------------------- */
.banner {
  background: var(--green-700);
  color: var(--white);
  border-radius: var(--radius-xl);
  padding: clamp(2rem, 5vw, 3.25rem);
  display: grid;
  gap: 2rem;
  grid-template-columns: 1fr;
}
@media (min-width: 880px) { .banner { grid-template-columns: 1.1fr 0.9fr; align-items: center; } }
.banner h2 { color: var(--white); }
.banner p { color: var(--green-100); }
.banner__list { display: grid; gap: 0.7rem; }
.banner__list li { display: flex; gap: 0.6rem; align-items: start; color: var(--green-100); font-size: 0.97rem; }
.banner__tick { color: var(--saffron-500); flex: none; }

/* --- Pricing -------------------------------------------------------------- */
.plans { display: grid; gap: 1.25rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); align-items: start; }
.plan { position: relative; }
.plan--featured { border-color: var(--green-600); border-width: 2px; box-shadow: var(--shadow-raised); }
.plan__badge {
  position: absolute;
  inset-block-start: -0.85rem;
  inset-inline-start: 1.5rem;
  background: var(--green-600);
  color: var(--white);
  font-size: 0.78rem;
  font-weight: 700;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-pill);
}
.plan__price { display: flex; align-items: baseline; gap: 0.5rem; flex-wrap: wrap; margin-block-start: 0.5rem; }
.plan__amount { font-size: 2.4rem; font-weight: 700; color: var(--green-700); letter-spacing: -0.02em; }
.plan__period { font-size: 0.9rem; color: var(--ink-500); }
.plan__gross { font-size: 0.85rem; color: var(--ink-300); }
.plan__features { display: grid; gap: 0.6rem; margin-block: 1.1rem; padding-block-start: 1.1rem; border-block-start: 1px solid var(--ink-100); }
.plan__features li { display: flex; gap: 0.55rem; align-items: start; font-size: 0.95rem; }
.plan__tick { color: var(--green-600); flex: none; }

/* --- FAQ ------------------------------------------------------------------ */
.faq { display: grid; gap: 0.75rem; max-width: 52rem; }
.faq details {
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-md);
  background: var(--white);
  padding: 1.05rem 1.25rem;
}
.faq details[open] { border-color: var(--green-600); }
.faq summary {
  cursor: pointer;
  font-weight: 600;
  list-style: none;
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  align-items: center;
}
.faq summary::-webkit-details-marker { display: none; }
.faq summary::after {
  content: "+";
  color: var(--green-600);
  font-size: 1.4rem;
  line-height: 1;
  flex: none;
}
.faq details[open] summary::after { content: "\\2212"; }
.faq p { margin-block-start: 0.7rem; color: var(--ink-700); }

/* --- CTA ------------------------------------------------------------------ */
.cta {
  background: var(--green-900);
  color: var(--white);
  border-radius: var(--radius-xl);
  padding: clamp(2.25rem, 6vw, 3.5rem);
  display: grid;
  gap: 1.25rem;
  justify-items: center;
  text-align: center;
}
.cta h2 { color: var(--white); }
.cta p { color: var(--green-100); max-width: 38rem; }

/* --- Footer --------------------------------------------------------------- */
.footer { background: var(--ink-50); border-block-start: 1px solid var(--ink-100); padding-block: 3rem 2rem; }
.footer__grid { display: grid; gap: 2rem; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); }
.footer__brandCol { display: grid; gap: 0.85rem; align-content: start; max-width: 22rem; }
.footer h3 { font-size: 0.82rem; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ink-500); }
.footer ul { display: grid; gap: 0.5rem; margin-block-start: 0.85rem; }
.footer a { color: var(--ink-700); font-size: 0.94rem; }
.footer a:hover { color: var(--green-700); }
.footer__bottom {
  margin-block-start: 2.5rem;
  padding-block-start: 1.5rem;
  border-block-start: 1px solid var(--ink-100);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  justify-content: space-between;
  align-items: center;
  font-size: 0.88rem;
  color: var(--ink-500);
}

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  .btn:hover, .trade:hover { transform: none; }
}
`;
