/**
 * The palette and the type scale mirror apps/mobile/src/theme, so the site and
 * the app read as one product.
 *
 * Note this file is a template literal: a backtick anywhere below, comments
 * included, ends the string early.
 */
export const STYLES = `
/* Inter is served from our own domain, not from Google Fonts. A stylesheet
   link to Google would make every visitor's browser open a connection to a
   Google server and hand it their IP address before they have agreed to
   anything -- a transfer to a third country that a German court has already
   ruled unlawful (LG Munchen I, 20-01-2022, 3 O 17493/20). Self-hosting
   removes the transfer entirely, so it needs no consent and no mention in the
   privacy statement.

   One file per subset covers every weight: Inter on Google Fonts is a variable
   font, so the 400/500/600/700 the design uses all come out of the same
   download. Regenerate with scripts/fetch-fonts.py. Licensed under the SIL
   Open Font License; the licence ships alongside the files. */
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/inter-latin.woff2") format("woff2");
  unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD;
}
@font-face {
  font-family: "Inter";
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url("/fonts/inter-latin-ext.woff2") format("woff2");
  unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF;
}

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

  /* The stack names real fallbacks, so a font that fails to load degrades to a
     system face rather than to whatever the browser picks. */
  --font: "Inter", "Segoe UI", system-ui, -apple-system, "Helvetica Neue", Arial, sans-serif;

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
/* Balanced so a two-line heading splits somewhere sensible rather than leaving
   one word stranded on the second line. */
h1, h2, .section__head h2, .cta h2 { text-wrap: balance; }

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
/* 44px is the smallest a thumb hits reliably, so even the compact variant
   keeps it. Two pixels of visual difference, a real difference in use. */
.btn--sm { min-height: 44px; padding-inline: 1.1rem; font-size: 0.94rem; }

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
.brand {
  display: inline-flex;
  align-items: center;
  gap: 0.65rem;
  min-block-size: 44px;
  font-weight: 700;
  font-size: 1.2rem;
}
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
.nav__ctaShort { display: none; }

@media (max-width: 560px) {
  .header__inner { flex-wrap: wrap; min-height: 0; padding-block: 0.7rem; gap: 0.7rem; }
  .nav { inline-size: 100%; margin-inline-start: 0; justify-content: space-between; gap: 0.5rem; }
  .nav__cta { margin-inline-start: 0; white-space: nowrap; }
  .nav__ctaLong { display: none; }
  .nav__ctaShort { display: inline; }
}

/* --- Language switcher ---------------------------------------------------- */
.langs { display: inline-flex; gap: 0.25rem; }
.langs a {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-inline-size: 44px;
  min-block-size: 44px;
  padding-inline: 0.7rem;
  border-radius: var(--radius-pill);
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ink-500);
  border: 1px solid var(--ink-100);
}
.langs a:hover { background: var(--ink-50); }
.langs a[aria-current="true"] { background: var(--green-600); color: var(--white); }

/* --- Hero ----------------------------------------------------------------- */
.hero {
  position: relative;
  isolation: isolate;
  background: linear-gradient(172deg, var(--green-50) 0%, var(--white) 58%);
  overflow: hidden;
}
/* A soft light behind the phone so it sits on something rather than hovering
   over white. One shape, off to the side, well under the text. */
.hero::before {
  content: "";
  position: absolute;
  inset-block-start: -18%;
  inset-inline-end: -12%;
  inline-size: min(52rem, 70%);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, rgba(15, 111, 92, 0.13), transparent 62%);
  z-index: -1;
  pointer-events: none;
}
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
  /* Both axes: align-self alone leaves a grid item stretched across the
     column, which turned a badge into a full-width banner. */
  align-self: start;
  justify-self: start;
  padding: 0.35rem 0.85rem;
  border-radius: var(--radius-pill);
  background: var(--terracotta-100);
  color: var(--terracotta-600);
  font-size: 0.85rem;
  font-weight: 600;
}
.lede { font-size: clamp(1.05rem, 2vw, 1.2rem); color: var(--ink-700); }

/* --- Phone mock ----------------------------------------------------------- */
/* Sized to its content rather than to a phone's aspect ratio: pinned to 9:18.5
   it ended in a hand-length of empty white below the last card, which read as
   an unfinished screen rather than a full one. */
.mock {
  justify-self: center;
  inline-size: min(320px, 82vw);
  border-radius: 38px;
  background: var(--white);
  border: 10px solid var(--green-900);
  box-shadow: 0 30px 60px -20px rgba(6, 52, 43, 0.45), var(--shadow-raised);
  padding: 1.1rem 1rem 1.25rem;
  display: grid;
  gap: 0.9rem;
  align-content: start;
  overflow: hidden;
}
.mock__bar { inline-size: 34%; block-size: 5px; border-radius: 3px; background: var(--ink-100); margin-inline: auto; }

.mock__job {
  display: grid;
  gap: 0.2rem;
  padding: 0.75rem 0.85rem;
  border-radius: var(--radius-md);
  background: var(--green-50);
  border: 1px solid var(--green-100);
}
.mock__jobTitle { font-weight: 700; font-size: 0.95rem; line-height: 1.3; color: var(--green-900); }
.mock__jobMeta { font-size: 0.78rem; color: var(--green-700); }

.mock__cards { display: grid; gap: 0.6rem; }
.mock__card {
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-md);
  padding: 0.7rem 0.8rem;
  display: grid;
  gap: 0.3rem;
  box-shadow: var(--shadow-card);
}
.mock__row { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
.mock__name { font-weight: 600; font-size: 0.88rem; line-height: 1.3; }
.mock__price { font-weight: 700; color: var(--green-700); font-size: 0.95rem; white-space: nowrap; }
.mock__meta { font-size: 0.76rem; color: var(--ink-500); margin-inline-start: auto; }
.mock__stars { color: var(--saffron-500); font-size: 0.8rem; letter-spacing: 0.06em; }
/* The unearned stars stay in place and lose their colour, so four out of five
   reads as four out of five rather than as a shorter row. */
.mock__starsOff { color: var(--ink-200); }

.mock__foot {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.78rem;
  color: var(--ink-500);
  padding-block-start: 0.15rem;
}
.mock__dot {
  inline-size: 7px;
  block-size: 7px;
  border-radius: 50%;
  background: var(--green-600);
  flex: none;
}

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
  /* A floor, not a fixed height: "Warmtepomp en airco" wraps to two lines and
     used to stand a card taller than its neighbours, which made every row
     look accidental. */
  min-block-size: 4.25rem;
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-md);
  background: var(--white);
  transition: border-color 0.14s ease, transform 0.14s ease, box-shadow 0.14s ease;
}
.trade:hover {
  border-color: var(--green-600);
  transform: translateY(-2px);
  box-shadow: var(--shadow-card);
}
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

/* While Buurklus is free the section holds two panels rather than a row of
   tiers: the free account, and a plain answer to "what happens when it is not
   free any more". They are given a readable measure instead of being stretched
   across the full page the way three cards were. */
.plans--launch {
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
  max-width: 56rem;
  margin-inline: auto;
}
.plan--launch { border-color: var(--green-600); border-width: 2px; box-shadow: var(--shadow-raised); }
.plan--later { background: var(--green-50); border-color: var(--green-100); }
.plan--later p { margin-block-start: 0.5rem; }

/* --- Registration --------------------------------------------------------- */
/* The pitch and the form sit side by side on a wide screen and stack on a
   phone, with the form first once stacked: someone who arrived from a button
   marked "sign up" came to sign up, not to be sold to again. */
.join__head { max-width: 46rem; display: grid; gap: 0.75rem; margin-block-end: 2rem; }
/* The badge is a label, not a banner: in a grid it would stretch the full
   column width and stop reading as one. */
.join__head .eyebrow { justify-self: start; }
.join__head h1 { margin: 0; }

.seg--role {
  display: inline-flex;
  gap: 4px;
  padding: 4px;
  background: var(--white);
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-pill);
  margin-block-end: 2rem;
  flex-wrap: wrap;
}
.seg--role .seg__btn {
  appearance: none;
  border: 0;
  background: transparent;
  color: var(--ink-500);
  font: inherit;
  font-weight: 600;
  font-size: 0.95rem;
  min-block-size: 44px;
  padding: 0.5rem 1.1rem;
  border-radius: var(--radius-pill);
  cursor: pointer;
}
.seg--role .seg__btn[aria-checked="true"] { background: var(--green-600); color: var(--white); }
.seg--role .seg__btn:focus-visible { outline: 2px solid var(--green-600); outline-offset: 2px; }

.join__grid { display: grid; gap: 2rem; align-items: start; }
@media (min-width: 62rem) {
  .join__grid { grid-template-columns: 1fr 26rem; gap: 3rem; }
}
.join__pitch { display: grid; gap: 1.25rem; order: 2; }
.join__panel { order: 1; }
@media (min-width: 62rem) {
  .join__pitch { order: 1; }
  .join__panel { order: 2; position: sticky; inset-block-start: 1.5rem; }
}

.joinCard {
  background: var(--white);
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-card);
}
.joinCard h2 { font-size: 1.15rem; margin-block: 0 0.5rem; }
.joinCard--promise { background: var(--green-50); border-color: var(--green-100); }

.join__form {
  background: var(--white);
  border: 1px solid var(--ink-100);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-raised);
}
.join__form fieldset { border: 0; margin: 0; padding: 0; display: grid; gap: 1.1rem; }
.join__legend { font-weight: 700; font-size: 1.05rem; padding: 0; margin-block-end: 0.25rem; }

.field { display: grid; gap: 0.35rem; }
.field label, .field__label { font-weight: 600; font-size: 0.92rem; }
.field__optional { font-weight: 400; color: var(--ink-300); font-size: 0.85rem; }
.field__hint { font-size: 0.82rem; color: var(--ink-500); margin: 0; }
.field input, .field select {
  font: inherit;
  color: var(--ink-900);
  background: var(--white);
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-md);
  padding: 0.7rem 0.85rem;
  /* 16px keeps iOS from zooming the page when the field takes focus. */
  font-size: 16px;
  min-block-size: 44px;
  inline-size: 100%;
}
.field input:focus-visible, .field select:focus-visible {
  outline: 2px solid var(--green-600);
  outline-offset: 1px;
  border-color: var(--green-600);
}

.chips--wrap { display: flex; flex-wrap: wrap; gap: 0.45rem; }
.chip--check { position: relative; cursor: pointer; }
.chip--check input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
  margin: 0;
}
.chip--check span {
  display: inline-flex;
  align-items: center;
  min-block-size: 40px;
  padding: 0.4rem 0.8rem;
  border: 1px solid var(--ink-200);
  border-radius: var(--radius-pill);
  font-size: 0.88rem;
  color: var(--ink-700);
}
.chip--check input:checked + span {
  background: var(--green-600);
  border-color: var(--green-600);
  color: var(--white);
}
.chip--check input:focus-visible + span { outline: 2px solid var(--green-600); outline-offset: 2px; }

.check { display: flex; gap: 0.7rem; align-items: start; font-size: 0.92rem; line-height: 1.5; }
.check a { display: block; margin-block-start: 0.2rem; color: var(--green-700); }
.check input {
  inline-size: 20px;
  block-size: 20px;
  margin: 0.15rem 0 0;
  accent-color: var(--green-600);
  flex: none;
}

/* Off-screen rather than display:none: a form filler skips what is hidden, and
   the whole point is that it does not skip this one. */
.honeypot {
  position: absolute;
  inline-size: 1px;
  block-size: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}

.btn--block { inline-size: 100%; justify-content: center; }
.join__error { color: var(--terracotta-600); font-size: 0.9rem; margin: 0; font-weight: 600; }

.join__done {
  background: var(--white);
  border: 2px solid var(--green-600);
  border-radius: var(--radius-lg);
  padding: 2rem 1.5rem;
  text-align: center;
  box-shadow: var(--shadow-raised);
}
.join__doneMark {
  display: inline-grid;
  place-items: center;
  inline-size: 52px;
  block-size: 52px;
  border-radius: 50%;
  background: var(--green-100);
  color: var(--green-700);
  margin-block-end: 0.75rem;
}
.join__done h3 { margin-block: 0 0.5rem; }
.join__done p { margin: 0; color: var(--ink-500); line-height: 1.6; }

/* --- Legal pages ---------------------------------------------------------- */
/* A legal document is read, not scanned, so the measure is narrower than the
   marketing pages and the type is set for continuous reading. */
.wrap--narrow { width: min(46rem, 100% - 2.5rem); }

.legal { padding-block: clamp(2.5rem, 6vw, 4.5rem); }
.legal__head { display: grid; gap: 0.75rem; margin-block-end: 2.5rem; }
.legal__head h1 { margin: 0; }
.legal__meta { font-size: 0.85rem; color: var(--ink-300); margin: 0; }
.legalAge { font-size: 0.9rem; }

.legalSection { margin-block-end: 2.5rem; }
.legalSection h2 {
  font-size: 1.25rem;
  margin-block: 0 0.75rem;
  padding-block-start: 1.5rem;
  border-block-start: 1px solid var(--ink-100);
}
.legalSection p { margin-block: 0 0.9rem; line-height: 1.7; color: var(--ink-700); }
.legalSection a { color: var(--green-700); }

.legalList { margin-block: 0 1rem; padding-inline-start: 1.25rem; display: grid; gap: 0.5rem; }
.legalList li { line-height: 1.6; color: var(--ink-700); }

/* Wide tables scroll inside their own box; the page body never moves sideways. */
.tableWrap { overflow-x: auto; margin-block-end: 1rem; }
.legalTable { border-collapse: collapse; width: 100%; min-width: 30rem; font-size: 0.92rem; }
.legalTable th, .legalTable td {
  text-align: start;
  vertical-align: top;
  padding: 0.65rem 0.75rem;
  border-block-end: 1px solid var(--ink-100);
}
.legalTable th { background: var(--ink-50); font-weight: 600; color: var(--ink-900); }
.legalTable td { color: var(--ink-700); line-height: 1.55; }

.notice {
  border-radius: var(--radius-md);
  padding: 1.1rem 1.25rem;
  margin-block-end: 1rem;
  border: 1px solid var(--ink-100);
  background: var(--ink-50);
}
/* Deliberately loud: it marks a document that is not finished, and quiet
   styling would let it be published as though it were. */
.notice--warn { background: var(--saffron-100); border-color: var(--saffron-500); }
.notice h3 { margin-block: 0 0.4rem; font-size: 1rem; }
.notice p { margin-block: 0 0.6rem; }

.legal__authority { margin-block: 0 1rem; }
.legal__authority a { color: var(--green-700); }
.legal__others { padding-block-start: 1.5rem; border-block-start: 1px solid var(--ink-100); }
.legal__others h2 { font-size: 1rem; margin-block: 0 0.75rem; }

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
  /* The whole row is the control that opens the answer, so it has to be tall
     enough to hit without aiming. */
  min-block-size: 44px;
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
  position: relative;
  isolation: isolate;
  overflow: hidden;
  background: var(--green-900);
  color: var(--white);
  border-radius: var(--radius-xl);
  padding: clamp(2.75rem, 7vw, 4.5rem) clamp(1.5rem, 5vw, 3.5rem);
  display: grid;
  gap: 1.35rem;
  justify-items: center;
  text-align: center;
}
/* The same light as the hero, mirrored, so the page opens and closes on one
   gesture instead of two unrelated blocks of green. */
.cta::before {
  content: "";
  position: absolute;
  inset-block-start: -55%;
  inset-inline-start: -10%;
  inline-size: min(40rem, 80%);
  aspect-ratio: 1;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 50%, rgba(15, 111, 92, 0.55), transparent 65%);
  z-index: -1;
}
.cta h2 { color: var(--white); font-size: clamp(1.7rem, 4vw, 2.4rem); max-width: 20ch; }
.cta p { color: var(--green-100); max-width: 38rem; }
.cta .btn { min-height: 58px; padding-inline: 2.2rem; font-size: 1.05rem; }

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

/* Text links sit at their natural line height, which is fine under a mouse and
   too small under a thumb. Keyed to the input device rather than the screen
   width, because a touch laptop needs this and a narrow desktop window does
   not. */
@media (pointer: coarse) {
  .nav__links a,
  .footer a,
  .footer__bottom a,
  .legalSection a,
  .legal__others a,
  .legal__authority a,
  .check a {
    display: inline-flex;
    align-items: center;
    min-block-size: 44px;
    /* A short word like "Aide" is only 33px wide; the trailing space is
       invisible and makes the link hittable. */
    min-inline-size: 44px;
  }
  .footer ul { gap: 0.15rem; }
}

/* --- Motion --------------------------------------------------------------- */
/* The hero arrives once, on load, and nothing else moves.
   
   A scroll-triggered reveal was tried and taken out again: it starts content at
   opacity 0 and depends on an observer to put it back, so a script that fails
   to run, a full-page render, or a crawler that does not scroll all leave the
   page blank below the fold. An animation is not worth a page that can hide
   itself. This one animates from a visible state to a visible state, so the
   worst case is that it simply does not play. */
@keyframes riseIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
.hero__copy > *, .hero .mock {
  animation: riseIn 0.55s cubic-bezier(0.2, 0.6, 0.2, 1) backwards;
}
.hero__copy > *:nth-child(1) { animation-delay: 0.02s; }
.hero__copy > *:nth-child(2) { animation-delay: 0.08s; }
.hero__copy > *:nth-child(3) { animation-delay: 0.14s; }
.hero__copy > *:nth-child(4) { animation-delay: 0.2s; }
.hero__copy > *:nth-child(5) { animation-delay: 0.26s; }
.hero .mock { animation-delay: 0.16s; animation-duration: 0.7s; }

@media (prefers-reduced-motion: reduce) {
  * { animation: none !important; transition: none !important; scroll-behavior: auto !important; }
  .btn:hover, .trade:hover { transform: none; }
}
`;
